import Anthropic from "@anthropic-ai/sdk";
import { getVehicleData } from "@/lib/data";

const anthropic = new Anthropic();

async function buildSystemPrompt(): Promise<{ prompt: string; model: string; maxTokens: number }> {
  const vehicleData = await getVehicleData();

  const config = vehicleData.chatbot_config || {};
  const template = config.prompt_template || "You are a helpful assistant for a campervan listing.";
  const model = config.model || "claude-haiku-4-5-20251001";
  const maxTokens = config.max_tokens || 512;

  // Strip chatbot_config from the data injected into the prompt
  const dataForPrompt = Object.fromEntries(
    Object.entries(vehicleData).filter(([k]) => k !== "chatbot_config")
  );
  const prompt = template.replace("{{VEHICLE_DATA}}", JSON.stringify(dataForPrompt, null, 2));

  return { prompt, model, maxTokens };
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const { prompt, model, maxTokens } = await buildSystemPrompt();

    const mapped = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // Retry on transient 529/overload from Anthropic (up to 3 tries, exponential backoff)
    let response;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          // Prompt caching: the system prompt contains the full vehicle JSON (~15-20k tokens)
          // and rarely changes, so mark it cacheable. After the first request, subsequent calls
          // reuse the cache (5 min TTL) — significantly faster and ~90% cheaper on those tokens.
          system: [
            {
              type: "text",
              text: prompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: mapped,
        });
        break;
      } catch (err: unknown) {
        lastErr = err;
        const status = (err as { status?: number })?.status;
        const isOverload = status === 529 || status === 429 || status === 503;
        if (!isOverload || attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt)));
      }
    }
    if (!response) throw lastErr ?? new Error("No response from model");

    const textContent = response.content.find((c) => c.type === "text");
    const text = textContent ? textContent.text : "Sorry, I could not generate a response.";

    return Response.json({ message: text });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

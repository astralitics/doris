"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HeroChat() {
  const t = useTranslations("chat");
  const suggestedQuestions = [t("q1"), t("q2"), t("q3"), t("q4")];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  // Scroll only the messages container, never the page
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }
  }, [input]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t("error");
      setMessages([...newMessages, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-10 text-left">
      {/* Solid container box */}
      <div className="bg-ocean-950 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-sm font-semibold">{t("title")}</span>
        </div>

        {/* Messages area */}
        <div
          ref={messagesRef}
          className={`px-4 space-y-4 overflow-y-auto max-h-72 ${hasMessages ? "py-4 min-h-[7rem]" : "py-0"}`}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <p className="bg-amber-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="text-white/80 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:text-white prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-strong:text-white">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-1.5 py-1">
              <span className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-white/30 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-white/30 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Suggested questions */}
        {!hasMessages && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/50 hover:border-white/30 hover:text-white/70 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-white/10">
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-xl bg-ocean-900">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                rows={1}
                disabled={loading}
                className="block w-full resize-none bg-transparent text-white text-sm placeholder:text-white/30 pl-4 pr-12 py-3 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500 text-white disabled:bg-white/10 disabled:text-white/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

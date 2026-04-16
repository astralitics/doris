export interface Seller {
  name?: string;
  whatsapp_e164?: string; // digits only, e.g. "12069298000"
  whatsapp_display?: string; // optional pretty format for display
  email?: string;
  prefilled_message?: string; // WhatsApp prefilled text
}

export const DEFAULT_SELLER: Seller = {
  name: "",
  whatsapp_e164: "",
  whatsapp_display: "",
  email: "",
  prefilled_message: "",
};

/**
 * Build a `wa.me` click-to-chat URL from the seller record.
 * Returns null if no whatsapp number is configured so callers can hide the button.
 */
export function waUrl(seller: Seller | undefined | null): string | null {
  const digits = (seller?.whatsapp_e164 ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const msg = seller?.prefilled_message?.trim();
  const suffix = msg ? `?text=${encodeURIComponent(msg)}` : "";
  return `https://wa.me/${digits}${suffix}`;
}

export function mailtoUrl(seller: Seller | undefined | null): string | null {
  const email = seller?.email?.trim();
  return email ? `mailto:${email}` : null;
}

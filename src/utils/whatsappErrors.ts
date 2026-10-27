// The WhatsApp backend explains setup problems in long, developer-style paragraphs (endpoints, field names). People need one short sentence:
// what is wrong and where to fix it. Known errors get their own sentence; any other long message is cut to its first sentence.
import { appLanguage } from "@/utils/appLocale";

const KNOWN: Array<{ match: RegExp; en: string; sw: string }> = [
  {
    match: /could not determine whatsapp business account id|waba/i,
    en: "WhatsApp is not fully set up yet. Add your WhatsApp Business Account ID in Settings > WhatsApp.",
    sw: "WhatsApp haijakamilika bado. Weka WhatsApp Business Account ID kwenye Mipangilio > WhatsApp.",
  },
  {
    match: /not configured|phone number id.*(missing|required)|access token.*(missing|required)/i,
    en: "WhatsApp is not connected yet. Save your WhatsApp details in Settings > WhatsApp.",
    sw: "WhatsApp haijaunganishwa bado. Hifadhi taarifa zako za WhatsApp kwenye Mipangilio > WhatsApp.",
  },
  {
    match: /invalid oauth|access token.*(expired|invalid)|session has expired/i,
    en: "Your WhatsApp access token is no longer valid. Save a new one in Settings > WhatsApp.",
    sw: "Tokeni yako ya WhatsApp haifanyi kazi tena. Hifadhi mpya kwenye Mipangilio > WhatsApp.",
  },
];

const SHORT_ENOUGH = 140;

/** A short, plain version of a WhatsApp error message, in the language the person uses SENDA in. */
export function friendlyWhatsAppError(message: string | undefined | null, fallback = "Something went wrong. Please try again."): string {
  const text = String(message || "").trim();
  if (!text) return fallback;
  const sw = appLanguage() === "sw";
  const known = KNOWN.find((k) => k.match.test(text));
  if (known) return sw ? known.sw : known.en;
  if (text.length <= SHORT_ENOUGH) return text;
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] || text;
  return firstSentence.length <= SHORT_ENOUGH ? firstSentence : `${firstSentence.slice(0, SHORT_ENOUGH - 1).trimEnd()}…`;
}

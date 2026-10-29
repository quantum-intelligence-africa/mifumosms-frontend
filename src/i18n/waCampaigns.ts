// Swahili for the WhatsApp campaign screens. Every visible string is written in English at the place it is used, as tr("..."); in Swahili mode tr() looks it up
// here and falls back to the English text if a string has no translation yet, so a missing entry is never blank. Numbers, names and codes are never passed
// through tr(). Text the server writes (for example the reason a row was rejected) arrives in English.
import { appLanguage } from "@/utils/appLocale";
import { WA_SW } from "@/i18n/waCampaignsSw";

export function tr(english: string): string {
  return appLanguage() === "sw" ? WA_SW[english] ?? english : english;
}

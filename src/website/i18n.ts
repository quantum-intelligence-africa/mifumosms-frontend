import { useContext } from "react";
import { LanguageContext } from "@/contexts/LanguageContext";

/* Website language. Shares the app-wide preference (LanguageContext), so a visitor who picks
 * Kiswahili on the website also gets it on sign-up and log-in.
 *
 * Usage inside a component:
 *   const { tr, lang } = useSiteLang();
 *   <h2>{tr("Pay only for what you send", "Lipia tu unachotuma")}</h2>
 */

export type SiteLang = "en" | "sw";

export function useSiteLang() {
  const ctx = useContext(LanguageContext);
  const lang: SiteLang = ctx?.language === "sw" ? "sw" : "en";
  const tr = (en: string, sw: string) => (lang === "sw" ? sw : en);
  const setLang = (next: SiteLang) => ctx?.setLanguage(next);
  return { lang, tr, setLang };
}

/** A string available in both languages. */
export type Bi = { en: string; sw: string };
export const pick = (b: Bi, lang: SiteLang) => (lang === "sw" ? b.sw : b.en);

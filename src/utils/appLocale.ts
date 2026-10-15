// The language the person picked in SENDA ("sw" or "en"), read straight from where the language switch saves it, so plain functions
// (formatters, the API client) can follow it without being React components.
export function appLanguage(): "sw" | "en" {
  try {
    const stored = localStorage.getItem("language-preference") || localStorage.getItem("language");
    return stored === "sw" ? "sw" : "en";
  } catch {
    return "en";
  }
}

/** The browser locale to format dates and numbers with: Swahili (Tanzania) in Swahili mode, so months and days are not English. */
export function appLocale(): string | undefined {
  return appLanguage() === "sw" ? "sw-TZ" : undefined;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | undefined;

export async function getRecaptchaToken(action: "login" | "signup"): Promise<string> {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  if (!siteKey || siteKey === "your-recaptcha-site-key") {
    return "";
  }
  try {
    if (!window.grecaptcha) {
      scriptPromise ||= new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(siteKey);
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
      await scriptPromise;
    }
    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        resolve("");
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha?.execute(siteKey, { action })
          .then((token) => resolve(token || ""))
          .catch(() => resolve(""));
      });
    });
  } catch {
    return "";
  }
}

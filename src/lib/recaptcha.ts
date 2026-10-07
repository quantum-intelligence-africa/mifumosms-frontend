import { API_CONFIG } from "@/config/api";

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
  if (!siteKey) return "";
  if (!window.grecaptcha) {
    scriptPromise ||= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(siteKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load reCAPTCHA"));
      document.head.appendChild(script);
    });
    await scriptPromise;
  }
  return new Promise((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha?.execute(siteKey, { action }).then(resolve).catch(reject);
    });
  });
}

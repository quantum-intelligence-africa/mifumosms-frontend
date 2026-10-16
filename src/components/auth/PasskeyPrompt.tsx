import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Fingerprint, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { listPasskeys, passkeysAvailable, platformAuthenticatorAvailable, registerPasskey } from "@/services/passkeys";

const SNOOZE_MS = 7 * 24 * 3600 * 1000;

function who(): string {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").email || "user";
  } catch {
    return "user";
  }
}
const key = () => `senda_passkey_prompt:${who()}`;
const read = (): { never?: boolean; until?: number } => {
  try {
    return JSON.parse(localStorage.getItem(key()) || "{}");
  } catch {
    return {};
  }
};
const write = (v: { never?: boolean; until?: number }) => {
  try {
    localStorage.setItem(key(), JSON.stringify(v));
  } catch {
    /* storage can be blocked: the prompt then simply shows again next time */
  }
};

/**
 * After signing in with a password, offer once to set up fingerprint / face / Windows Hello sign-in on THIS device, but only when the
 * device can do it, passkeys are allowed on this address, and the account has no passkey yet. Dismissible for a week or for good.
 * Registering is a real WebAuthn ceremony started by the click, so the operating system shows its own fingerprint/face prompt.
 */
export function PasskeyPrompt() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inSettings = location.pathname.startsWith("/settings");

  useEffect(() => {
    const saved = read();
    if (saved.never || (saved.until && saved.until > Date.now())) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      if (!(await passkeysAvailable()) || !(await platformAuthenticatorAvailable())) return;
      const list = await listPasskeys();
      if (alive && list.ok && list.data?.enabled && list.data.passkeys.length === 0) setShow(true);
    }, 4000);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (!show || inSettings) return null;

  const setup = async () => {
    setBusy(true);
    setError("");
    const res = await registerPasskey(t("pk.default_name"), "platform");
    setBusy(false);
    if (res.ok) {
      write({ never: true });
      setShow(false);
      toast({ title: t("pk.added") });
    } else if (res.failure === "cancelled") {
      setError(t("pk.cancelled"));
    } else {
      setError(res.message || t("pk.failed"));
    }
  };

  return (
    <div role="dialog" aria-label={t("pk.prompt_title")} className="fixed bottom-4 right-4 z-50 w-[min(92vw,380px)] rounded-xl border bg-background p-4 shadow-xl">
      <button type="button" aria-label={t("pk.cancel")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground" onClick={() => { write({ until: Date.now() + SNOOZE_MS }); setShow(false); }}>
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Fingerprint className="h-5 w-5" /></span>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">{t("pk.prompt_title")}</p>
          <p className="text-xs text-muted-foreground">{t("pk.prompt_body")}</p>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={() => void setup()} disabled={busy}>
              {busy ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("pk.setting_up")}</> : t("pk.prompt_setup")}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => { write({ until: Date.now() + SNOOZE_MS }); setShow(false); }}>{t("pk.prompt_later")}</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => { write({ never: true }); setShow(false); }}>{t("pk.prompt_never")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

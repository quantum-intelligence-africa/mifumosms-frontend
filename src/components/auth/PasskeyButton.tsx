import { useEffect, useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { passkeysAvailable, signInWithPasskey, type PasskeyFailure } from "@/services/passkeys";
import type { AccountVerificationState } from "@/components/auth/AccountVerification";

interface Props {
  /** Called only after the server verified the signed passkey assertion and issued tokens. */
  onSignedIn: (tokens: { access: string; refresh: string }, user: unknown) => void;
  /** The account still has to finish first-time verification; no tokens exist yet. */
  onNeedsVerification: (state: AccountVerificationState) => void;
  onError: (message: string) => void;
  roundedClassName?: string;
  invitationToken?: string;
}

/**
 * "Sign in with a passkey". It starts a real WebAuthn ceremony (the OS shows fingerprint, face, Windows Hello or PIN) and is
 * hidden when the browser or this address can't do passkeys, so it never appears as a button that cannot work.
 */
export function PasskeyButton({ onSignedIn, onNeedsVerification, onError, roundedClassName = "rounded-lg" }: Props) {
  const { t } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void passkeysAvailable().then((ok) => alive && setAvailable(ok));
    return () => { alive = false; };
  }, []);

  if (!available) return null;

  const wording = (f?: PasskeyFailure, server?: string) => {
    switch (f) {
      case "cancelled": return t("pk.cancelled");
      case "network": return t("pk.network");
      case "rate_limited": return t("pk.rate_limited");
      case "disabled": return t("pk.disabled");
      case "unsupported": return t("pk.unsupported");
      default: return server || t("pk.failed");
    }
  };

  const start = async () => {
    setBusy(true);
    const res = await signInWithPasskey();
    setBusy(false);
    if (!res.ok || !res.data) {
      // A 403 carries the organization's own wording (e.g. "only for members of …"); other failures use ours.
      onError(res.status === 403 ? res.message || t("pk.failed") : wording(res.failure, undefined));
      return;
    }
    const data = res.data;
    if (res.status === 202 && data.requires_verification) {
      onNeedsVerification({
        pendingToken: data.pending_token,
        phoneOnFile: !!data.phone_on_file,
        maskedPhone: data.masked_phone || "",
        maskedEmail: data.masked_email || "",
      });
      return;
    }
    if (data.tokens?.access && data.tokens?.refresh) {
      onSignedIn({ access: data.tokens.access, refresh: data.tokens.refresh }, data.user);
    } else {
      onError(t("pk.failed"));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{t("pk.or")}</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void start()}
        className={`h-10 w-full gap-2 border-gray-300 text-sm font-semibold text-gray-800 sm:h-11 ${roundedClassName}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-5 w-5 text-blue-600" />}
        {busy ? t("pk.signing_in") : t("pk.signin")}
      </Button>
      <p className="text-center text-[11px] text-gray-500">{t("pk.hint")}</p>
    </div>
  );
}

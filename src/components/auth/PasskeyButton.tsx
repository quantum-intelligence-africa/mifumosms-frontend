import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { passkeysAvailable, platformAuthenticatorAvailable, signInWithPasskey, type PasskeyFailure } from "@/services/passkeys";
import type { AccountVerificationState } from "@/components/auth/AccountVerification";

interface Props {
  /** "device": this device's own fingerprint, face, Windows Hello or screen-lock. "passkey": any passkey, including a phone or security key. */
  mode: "device" | "passkey";
  /** Called only after the server verified the signed passkey assertion and issued tokens. */
  onSignedIn: (tokens: { access: string; refresh: string }, user: unknown) => void;
  /** The account still has to finish first-time verification; no tokens exist yet. */
  onNeedsVerification: (state: AccountVerificationState) => void;
  /** ``info`` = not an error (the person simply has no passkey here yet): show it as guidance. */
  onError: (message: string, kind?: "error" | "info") => void;
  roundedClassName?: string;
  invitationToken?: string;
}

/**
 * One "Continue with ..." button, styled like "Continue with Google". Both start a real WebAuthn ceremony: the "device" one asks the
 * browser to use this device's own fingerprint / face / Windows Hello / PIN straight away; the "passkey" one lets the person pick any
 * saved passkey (this device, a phone through a QR code, or a security key). A button is hidden when it cannot work here: a browser or
 * address without passkeys shows neither, and a device with no fingerprint/face/Hello shows only the passkey one.
 */
export function PasskeyButton({ mode, onSignedIn, onNeedsVerification, onError, roundedClassName = "rounded-lg" }: Props) {
  const { t } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ok = (await passkeysAvailable()) && (mode === "passkey" || (await platformAuthenticatorAvailable()));
      if (alive) setAvailable(ok);
    })();
    return () => {
      alive = false;
    };
  }, [mode]);

  if (!available) return null;

  const wording = (f?: PasskeyFailure, server?: string) => {
    switch (f) {
      case "cancelled": return t("pk.cancelled_login");
      case "network": return t("pk.network");
      case "rate_limited": return t("pk.rate_limited");
      case "disabled": return t("pk.disabled");
      case "unsupported": return t("pk.unsupported");
      default: return server || t("pk.failed");
    }
  };

  const start = async () => {
    setBusy(true);
    const res = await signInWithPasskey(undefined, mode === "device" ? "device" : "any");
    setBusy(false);
    if (!res.ok || !res.data) {
      // A 403 carries the organization's own wording (e.g. "only for members of …"); other failures use ours.
      onError(res.status === 403 ? res.message || t("pk.failed") : wording(res.failure, undefined), res.failure === "cancelled" ? "info" : "error");
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

  const Icon = mode === "device" ? Fingerprint : KeyRound;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void start()}
      title={t(mode === "device" ? "pk.hint_device" : "pk.hint_passkey")}
      className={`flex w-full items-center justify-center gap-3 border border-[#dadce0] bg-white py-3 text-center text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2 disabled:opacity-60 ${roundedClassName}`}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Icon className="h-5 w-5 text-blue-600" />}
      <span>{busy ? t("pk.signing_in") : t(mode === "device" ? "pk.btn_device" : "pk.btn_passkey")}</span>
    </button>
  );
}

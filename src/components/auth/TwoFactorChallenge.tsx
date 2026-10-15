import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";

export interface TwoFactorChallengeState {
  challengeId: string;
  maskedEmail: string;
  /** "sent" or "failed": whether the first email went out. */
  delivery: string;
  expiresIn: number;
  resendAfter: number;
}

interface Props {
  challenge: TwoFactorChallengeState;
  invitationToken?: string;
  /** Called with the tokens only after the server accepted the code. */
  onVerified: (tokens: { access: string; refresh: string }, user: unknown) => void;
  onBack: () => void;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** The one-time-code step of sign-in. It holds no session: tokens exist only after `onVerified`. */
export function TwoFactorChallenge({ challenge, invitationToken, onVerified, onBack }: Props) {
  const { t } = useLanguage();
  const [id, setId] = useState(challenge.challengeId);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"" | "verify" | "resend">("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    challenge.delivery === "failed" ? { kind: "error", text: t("tf.sent_failed") } : null,
  );
  const [cooldown, setCooldown] = useState(challenge.delivery === "failed" ? 0 : challenge.resendAfter);
  const [expires, setExpires] = useState(challenge.delivery === "failed" ? 0 : challenge.expiresIn);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCooldown((v) => Math.max(v - 1, 0));
      setExpires((v) => Math.max(v - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const verify = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy("verify");
    setMessage(null);
    const { status, data } = await apiClient.twoFactorRequest("verify-otp", { challenge_id: id, code, ...(invitationToken ? { invitation_token: invitationToken } : {}) });
    setBusy("");
    if (status === 200 && data.tokens?.access) {
      setDone(true);
      setMessage({ kind: "info", text: t("tf.success") });
      onVerified({ access: data.tokens.access, refresh: data.tokens.refresh }, data.user);
      return;
    }
    setCode("");
    const text =
      status === 429 ? t("tf.too_many")
      : data.reason === "expired" ? t("tf.expired")
      : data.reason === "locked" ? t("tf.locked")
      : status === 400 ? t("tf.invalid")
      : t("tf.generic_error");
    setMessage({ kind: "error", text });
  }, [busy, code, id, invitationToken, onVerified, t]);

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy("resend");
    setMessage(null);
    const { status, data } = await apiClient.twoFactorRequest("resend-otp", { challenge_id: id });
    setBusy("");
    if (status === 200 && data.challenge_id) {
      setId(data.challenge_id);
      setCode("");
      setCooldown(data.resend_after ?? 60);
      setExpires(data.expires_in ?? 300);
      setMessage(data.delivery === "failed" ? { kind: "error", text: t("tf.sent_failed") } : { kind: "info", text: t("tf.resent") });
      if (data.delivery === "failed") setCooldown(0);
    } else if (status === 429) {
      setCooldown(Number(data.retry_after) > 0 && Number(data.retry_after) <= 3600 ? Number(data.retry_after) : 60);
      setMessage({ kind: "error", text: t("tf.too_many") });
    } else {
      setMessage({ kind: "error", text: data.reason === "expired" ? t("tf.expired") : t("tf.generic_error") });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <form onSubmit={verify} className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow sm:p-8" noValidate>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><MailCheck className="h-6 w-6" /></span>
          <h1 className="text-2xl font-bold text-gray-900">{t("tf.title")}</h1>
          <p className="text-sm text-gray-600">{t("tf.sent", { email: challenge.maskedEmail })}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tf-code" className="text-sm font-medium text-gray-700">{t("tf.code_label")}</label>
          <Input
            id="tf-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="••••••"
            className="h-12 text-center text-2xl tracking-[0.5em]"
            disabled={done}
            aria-invalid={message?.kind === "error"}
          />
          {expires > 0 && !done && <p className="text-xs text-gray-500">{t("tf.expires_in", { time: clock(expires) })}</p>}
          {expires === 0 && !done && challenge.delivery !== "failed" && <p className="text-xs text-red-600">{t("tf.expired")}</p>}
        </div>

        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-md p-3 text-sm ${message.kind === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
            {message.text}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={code.length !== 6 || !!busy || done || expires === 0}>
          {busy === "verify" || done ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{done ? t("tf.success") : t("tf.verifying")}</> : t("tf.verify")}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" onClick={onBack} className="text-gray-600 underline-offset-2 hover:underline" disabled={done}>{t("tf.back")}</button>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={cooldown > 0 || !!busy || done}
            className="font-medium text-blue-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {busy === "resend" ? t("tf.resending") : cooldown > 0 ? t("tf.resend_in", { seconds: cooldown }) : t("tf.resend")}
          </button>
        </div>
      </form>
    </div>
  );
}

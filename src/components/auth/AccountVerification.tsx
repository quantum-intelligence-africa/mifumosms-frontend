import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";

export interface AccountVerificationState {
  pendingToken: string;
  phoneOnFile: boolean;
  maskedPhone: string;
  maskedEmail: string;
}

interface Props {
  state: AccountVerificationState;
  /** Called with tokens only after the server accepted the code. */
  onVerified: (tokens: { access: string; refresh: string }, user: unknown) => void;
  onBack: () => void;
}

/** First-time verification: add (or confirm) a phone number, then enter the code sent by SMS and email. */
export function AccountVerification({ state, onVerified, onBack }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState(state.maskedPhone);
  const [maskedEmail, setMaskedEmail] = useState(state.maskedEmail);
  const [havePhone, setHavePhone] = useState(state.phoneOnFile);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"" | "send" | "verify">("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setCooldown((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy("send");
    setError("");
    const body: Record<string, unknown> = { pending_token: state.pendingToken };
    if (!havePhone || phone.trim()) body.phone_number = phone.trim();
    const { status, data } = await apiClient.verificationRequest("start", body);
    setBusy("");
    if (status === 200) {
      setMaskedPhone(data.masked_phone || maskedPhone);
      setMaskedEmail(data.masked_email || maskedEmail);
      setHavePhone(true);
      setStep("code");
      setCooldown(data.resend_after ?? 60);
    } else if (status === 429) {
      setStep("code");
      setCooldown(Number(data.retry_after) || 60);
    } else if (data.reason === "expired") {
      setError(t("tf.av_session_expired"));
    } else {
      setError(data.error || (status === 503 ? t("tf.av_delivery_failed") : t("tf.generic_error")));
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy("verify");
    setError("");
    const { status, data } = await apiClient.verificationRequest("verify", { pending_token: state.pendingToken, code });
    setBusy("");
    if (status === 200 && data.tokens?.access) {
      setDone(true);
      onVerified({ access: data.tokens.access, refresh: data.tokens.refresh }, data.user);
      return;
    }
    setCode("");
    setError(data.reason === "expired" ? t("tf.av_session_expired") : status === 400 ? t("tf.invalid") : t("tf.generic_error"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><ShieldCheck className="h-6 w-6" /></span>
          <h1 className="text-2xl font-bold text-gray-900">{t("tf.av_title")}</h1>
          <p className="text-sm text-gray-600">
            {step === "code"
              ? t("tf.av_code_intro", { phone: maskedPhone || phone, email: maskedEmail })
              : havePhone
                ? t("tf.av_phone_confirm", { phone: maskedPhone, email: maskedEmail })
                : t("tf.av_phone_intro", { email: maskedEmail })}
          </p>
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        {step === "phone" ? (
          <form onSubmit={send} className="space-y-4" noValidate>
            {!havePhone || phone ? (
              <div className="space-y-1.5">
                <label htmlFor="av-phone" className="text-sm font-medium text-gray-700">{t("tf.av_phone_label")}</label>
                <Input id="av-phone" type="tel" inputMode="tel" autoComplete="tel" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
            ) : (
              <button type="button" className="text-sm text-blue-600 underline-offset-2 hover:underline" onClick={() => setHavePhone(false)}>{t("tf.av_change_phone")}</button>
            )}
            <Button type="submit" className="w-full" disabled={!!busy || (!havePhone && phone.trim().length < 9)}>
              {busy === "send" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("tf.av_sending")}</> : t("tf.av_send")}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="av-code" className="text-sm font-medium text-gray-700">{t("tf.code_label")}</label>
              <Input
                id="av-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code"
                autoFocus maxLength={6} placeholder="••••••" className="h-12 text-center text-2xl tracking-[0.5em]" disabled={done}
              />
            </div>
            <Button type="submit" className="w-full" disabled={code.length !== 6 || !!busy || done}>
              {busy === "verify" || done ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{done ? t("tf.success") : t("tf.verifying")}</> : t("tf.verify")}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button type="button" className="text-gray-600 underline-offset-2 hover:underline" onClick={() => { setStep("phone"); setHavePhone(false); setPhone(""); setCode(""); setError(""); }} disabled={done}>
                {t("tf.av_change_phone")}
              </button>
              <button type="button" onClick={() => void send()} disabled={cooldown > 0 || !!busy || done}
                className="font-medium text-blue-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline">
                {busy === "send" ? t("tf.resending") : cooldown > 0 ? t("tf.resend_in", { seconds: cooldown }) : t("tf.resend")}
              </button>
            </div>
          </form>
        )}

        <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-600 underline-offset-2 hover:underline" disabled={done}>{t("tf.back")}</button>
      </div>
    </div>
  );
}

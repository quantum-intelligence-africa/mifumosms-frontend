import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";

/** Shows whether the account's email is verified and lets the person verify it with a code sent to that address. */
export function EmailVerificationCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [info, setInfo] = useState<{ email: string; email_verified: boolean } | null>(null);
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiClient.emailTwoFactor().then(({ status, data }) => status === 200 && setInfo({ email: data.email, email_verified: !!data.email_verified }));
  }, []);

  if (!info) return null;

  const send = async () => {
    setBusy(true);
    setError("");
    const { status, data } = await apiClient.emailTwoFactor({ action: "send_code" });
    setBusy(false);
    if (status === 200 && data.challenge_id) setChallenge(data.challenge_id);
    else setError(data.error || t("tf.generic_error"));
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    const { status } = await apiClient.emailTwoFactor({ action: "confirm_code", challenge_id: challenge, code });
    setBusy(false);
    if (status === 200) {
      setInfo({ ...info, email_verified: true });
      setChallenge("");
      setCode("");
      toast({ title: t("tf.set_verify_ok") });
      window.dispatchEvent(new Event("senda:email-verified"));
    } else {
      setCode("");
      setError(t("tf.invalid"));
    }
  };

  return (
    <Card className="glass border-0">
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{t("tf.ev_title")}</span>
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.email_verified ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
            {info.email_verified && <BadgeCheck className="h-3.5 w-3.5" />}
            {info.email_verified ? t("tf.ev_verified") : t("tf.ev_unverified")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <p className="text-sm text-text-subtle">{t(info.email_verified ? "tf.ev_desc_verified" : "tf.ev_desc_unverified", { email: info.email })}</p>
        {!info.email_verified && !challenge && (
          <Button size="sm" onClick={() => void send()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("tf.set_verify")}
          </Button>
        )}
        {!info.email_verified && challenge && (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void confirm(); }}>
            <p className="text-sm">{t("tf.set_verify_sent", { email: info.email })}</p>
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="••••••" className="max-w-48 text-center tracking-[0.4em]" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy || code.length !== 6}>{t("tf.verify")}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void send()} disabled={busy}>{t("tf.resend")}</Button>
            </div>
          </form>
        )}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </CardContent>
    </Card>
  );
}

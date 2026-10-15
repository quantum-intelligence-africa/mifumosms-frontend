import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";

interface State {
  enabled: boolean;
  destination: string;
  can_enable: boolean;
  has_password: boolean;
}

/** A person's own switch for the email-code second step at sign-in. Changing it needs the current password. */
export function EmailTwoFactorCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () => void apiClient.emailTwoFactor().then(({ status, data }) => status === 200 && setState(data as State));
    load();
    window.addEventListener("senda:email-verified", load);
    return () => window.removeEventListener("senda:email-verified", load);
  }, []);

  if (!state) return null;

  const change = async () => {
    setBusy(true);
    setError("");
    const { status, data } = await apiClient.emailTwoFactor({ enabled: !state.enabled, password });
    setBusy(false);
    if (status === 200) {
      setState(data as State);
      setAsking(false);
      setPassword("");
      toast({ title: data.enabled ? t("tf.set_saved_on") : t("tf.set_saved_off") });
    } else if (data.reason === "password") {
      setError(t("tf.set_wrong_password"));
    } else if (data.reason === "admin") {
      setError(t("tf.set_admin_only"));
    } else {
      setError(data.error || t("tf.generic_error"));
    }
  };

  const blocked = !state.enabled && !state.can_enable;
  return (
    <Card className="glass border-0">
      <CardHeader className="p-3">
        <CardTitle className="flex items-center gap-2 text-sm"><MailCheck className="h-4 w-4" />{t("tf.set_title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-text-subtle">{t("tf.set_desc", { email: state.destination })}</p>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.enabled ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
              {state.enabled ? t("tf.set_on") : t("tf.set_off")}
            </span>
            {!asking && (
              <Button size="sm" variant={state.enabled ? "outline" : "default"} disabled={blocked} onClick={() => { setAsking(true); setError(""); }}>
                {state.enabled ? t("tf.set_turn_off") : t("tf.set_turn_on")}
              </Button>
            )}
          </div>
        </div>
        {blocked && <p className="text-xs text-amber-700">{t("tf.set_cant")}</p>}
        {asking && (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void change(); }}>
            {state.has_password && (
              <Input type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("tf.set_password")} />
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy || (state.has_password && !password)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("tf.set_confirm")}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => { setAsking(false); setPassword(""); setError(""); }}>{t("tf.set_cancel")}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

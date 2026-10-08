import { useState } from "react";
import { AlertCircle, KeyRound, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { describeError } from "@/services/callCenterApi";

/**
 * Shown instead of the app while the account still has the temporary password
 * an administrator issued. Nothing else is reachable until it is replaced; the
 * only other option is signing out.
 */
export function ForcePasswordChange() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && next !== current;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const res = await apiClient.changePasswordConfirmed({ old_password: current, new_password: next, new_password_confirm: confirm });
    setSaving(false);
    if (!res.success) {
      setError(describeError(res));
      return;
    }
    // Reload so the app re-reads the profile, where the "must change" flag is now cleared.
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>{t("cc.password.title")}</CardTitle>
          <CardDescription>{t("cc.password.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="fp-current">{t("cc.password.current")}</Label>
              <Input id="fp-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fp-new">{t("cc.password.new")}</Label>
              <Input id="fp-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">{t("cc.password.rules")}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fp-confirm">{t("cc.password.confirm")}</Label>
              <Input id="fp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              {mismatch && <p className="text-xs text-destructive">{t("cc.password.mismatch")}</p>}
            </div>
            {next && next === current && <p className="text-xs text-destructive">{t("cc.password.same_as_temp")}</p>}
            {error && (
              <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => void logout()} className="gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" />{t("cc.password.sign_out")}
              </Button>
              <Button type="submit" disabled={!canSubmit || saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.password.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

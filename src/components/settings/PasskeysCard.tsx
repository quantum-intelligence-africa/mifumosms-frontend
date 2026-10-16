import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, Laptop, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import {
  isPasskeySupported,
  listPasskeys,
  passkeyEvents,
  registerPasskey,
  removePasskey,
  renamePasskey,
  type PasskeyEvent,
  type PasskeyFailure,
  type PasskeyInfo,
} from "@/services/passkeys";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

/**
 * Account Settings → Security: register, rename and remove passkeys, and see recent passkey activity.
 * Fingerprint, face, Windows Hello or device-PIN prompts come from the operating system; this card only starts the real
 * WebAuthn ceremony and shows what the server has stored (a public key and a name — never biometric data).
 */
export function PasskeysCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const supported = isPasskeySupported();
  const [items, setItems] = useState<PasskeyInfo[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [events, setEvents] = useState<PasskeyEvent[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; password: string } | null>(null);
  const [error, setError] = useState("");

  const reason = useCallback(
    (f?: PasskeyFailure, fallback?: string) => {
      switch (f) {
        case "cancelled": return t("pk.cancelled");
        case "already_registered": return t("pk.already");
        case "network": return t("pk.network");
        case "rate_limited": return t("pk.rate_limited");
        case "disabled": return t("pk.disabled");
        case "unsupported": return t("pk.unsupported");
        case "reauth_required": return t("pk.wrong_password");
        case "last_method": return t("pk.last_method");
        default: return fallback || t("pk.failed");
      }
    },
    [t],
  );

  const load = useCallback(async () => {
    const [list, ev] = await Promise.all([listPasskeys(), passkeyEvents()]);
    if (list.ok && list.data) {
      setItems(list.data.passkeys);
      setEnabled(list.data.enabled);
    } else {
      setItems([]);
    }
    if (ev.ok && ev.data) setEvents(ev.data.events);
  }, []);

  useEffect(() => {
    void load();
    void apiClient.emailTwoFactor().then(({ status, data }) => status === 200 && setHasPassword(data.has_password !== false));
  }, [load]);

  const add = async () => {
    setBusy(true);
    setError("");
    const res = await registerPasskey(name.trim() || t("pk.default_name"));
    setBusy(false);
    if (res.ok) {
      setAdding(false);
      setName("");
      toast({ title: t("pk.added") });
      void load();
    } else if (res.failure !== "cancelled") {
      setError(reason(res.failure, res.message));
    } else {
      setError(t("pk.cancelled"));
    }
  };

  const saveName = async () => {
    if (!renaming || !renaming.name.trim()) return;
    setBusy(true);
    const res = await renamePasskey(renaming.id, renaming.name.trim());
    setBusy(false);
    if (res.ok) {
      setRenaming(null);
      toast({ title: t("pk.renamed") });
      void load();
    } else {
      setError(reason(res.failure, res.message));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    setError("");
    const res = await removePasskey(removing.id, removing.password);
    setBusy(false);
    if (res.ok) {
      setRemoving(null);
      toast({ title: t("pk.removed") });
      void load();
    } else {
      setError(reason(res.failure, res.message));
    }
  };

  if (items === null) return null;

  return (
    <Card className="glass border-0">
      <CardHeader className="p-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Fingerprint className="h-4 w-4" />{t("pk.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-text-subtle">{t("pk.desc")}</p>
          {supported && enabled && !adding && (
            <Button size="sm" onClick={() => { setAdding(true); setError(""); }}>{t("pk.add")}</Button>
          )}
        </div>
        {(!supported || !enabled) && <p className="text-xs text-amber-700">{t("pk.not_here")}</p>}

        {adding && (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
            <label className="text-xs font-medium" htmlFor="pk-name">{t("pk.name_label")}</label>
            <Input id="pk-name" autoFocus maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("pk.name_placeholder")} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("pk.adding")}</> : t("pk.add")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setAdding(false); setError(""); }}>{t("pk.cancel")}</Button>
            </div>
            <p className="text-xs text-text-subtle">{t("pk.note_address")}</p>
          </form>
        )}

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-text-subtle">{t("pk.empty")}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((p) => (
              <li key={p.id} className="space-y-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {p.transports.includes("internal") ? <Laptop className="h-4 w-4 shrink-0" /> : <Smartphone className="h-4 w-4 shrink-0" />}
                    {renaming?.id === p.id ? (
                      <Input className="h-8" autoFocus maxLength={80} value={renaming.name} onChange={(e) => setRenaming({ id: p.id, name: e.target.value })} />
                    ) : (
                      <span className="truncate text-sm font-medium">{p.name}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {renaming?.id === p.id ? (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => void saveName()}>{t("pk.save")}</Button>
                        <Button size="sm" variant="outline" onClick={() => setRenaming(null)}>{t("pk.cancel")}</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setRenaming({ id: p.id, name: p.name }); setRemoving(null); }}>{t("pk.rename")}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setRemoving({ id: p.id, password: "" }); setRenaming(null); setError(""); }}>{t("pk.remove")}</Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-subtle">
                  {t("pk.created", { date: fmt(p.created_at) })} · {p.last_used_at ? t("pk.last_used", { date: fmt(p.last_used_at) }) : t("pk.never_used")} ·{" "}
                  {p.backed_up ? t("pk.synced") : t("pk.this_device")} · {t("pk.address", { host: p.rp_id })}
                </p>
                {removing?.id === p.id && (
                  <form className="space-y-2 rounded-md bg-muted/50 p-2" onSubmit={(e) => { e.preventDefault(); void confirmRemove(); }}>
                    <p className="text-sm font-medium">{t("pk.remove_title")}</p>
                    {hasPassword && (
                      <>
                        <p className="text-xs text-text-subtle">{t("pk.remove_password")}</p>
                        <Input type="password" autoComplete="current-password" autoFocus value={removing.password} onChange={(e) => setRemoving({ id: p.id, password: e.target.value })} />
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="destructive" disabled={busy || (hasPassword && !removing.password)}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pk.remove")}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setRemoving(null)}>{t("pk.cancel")}</Button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">{t("pk.events")}</p>
          {events.length === 0 ? (
            <p className="text-xs text-text-subtle">{t("pk.no_events")}</p>
          ) : (
            <ul className="space-y-1">
              {events.slice(0, 6).map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex justify-between gap-3 text-xs">
                  <span className={e.outcome === "failure" ? "text-red-700" : ""}>{e.label}{e.detail ? ` · ${e.detail}` : ""}</span>
                  <span className="whitespace-nowrap text-text-subtle">{new Date(e.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// White-label customization for the organization's owner/admin. Everything here is
// permission-gated twice: the backend rejects writes when SENDA staff haven't enabled the
// feature, and this card shows a locked state instead of the controls.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, Globe, Loader2, Lock, Palette, RefreshCw, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandingControls } from "@/contexts/BrandingContext";
import { apiClient, type ApiResponse, type BrandingConfig, type BrandingState } from "@/lib/api";

import { useLanguage } from "@/hooks/useLanguage";
const WIDGETS: { key: string; label: string }[] = [
  { key: "metrics", label: "Metric cards" },
  { key: "quick_actions", label: "Quick actions" },
  { key: "performance", label: "Performance chart" },
  { key: "activity_feed", label: "Activity feed" },
  { key: "recent_campaigns", label: "Recent campaigns" },
];

const COLOR_FIELDS: { key: "primary" | "sidebar"; label: string; fallback: string }[] = [
  { key: "primary", label: "Primary color", fallback: "#2563eb" },
  { key: "sidebar", label: "Sidebar color", fallback: "#ffffff" },
];

const errorText = (res: Partial<ApiResponse<unknown>>): string => {
  const e = res.errors as Record<string, string[] | string> | undefined;
  const first = e && Object.values(e)[0];
  return (Array.isArray(first) ? first[0] : first) || (e as { detail?: string } | undefined)?.detail || res.error || "Something went wrong. Please try again.";
};

export function BrandingDomainsCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { refresh, setPreview, previewing } = useBrandingControls();
  const [checks, setChecks] = useState<Record<string, { ok: boolean; message: string }>>({});
  const membership = useMemo(
    () => (user?.memberships ?? []).find((m) => m.status === "active" && (m.role === "owner" || m.role === "admin")),
    [user?.memberships],
  );
  const tenantId = membership ? String(membership.tenant_id ?? membership.tenant) : null;

  const [state, setState] = useState<BrandingState | null>(null);
  const [draft, setDraft] = useState<BrandingConfig | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const res = await apiClient.getBrandingState(tenantId);
    if (res.success && res.data) {
      setState(res.data);
      setDraft(res.data.draft);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (!tenantId || !state || !draft) return null;

  const { features } = state;
  if (!features.white_label && !features.custom_subdomain && !features.custom_domain) {
    return (
      <Card className="glass border-0">
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Palette className="w-4 h-4" />{t("pg.BrandingDomainsCard.0209")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          {t("pg.BrandingDomainsCard.0210")}
        </CardContent>
      </Card>
    );
  }

  const run = async (label: string, fn: () => Promise<ApiResponse<BrandingState>>, ok?: string) => {
    setBusy(label);
    const res = await fn();
    setBusy(null);
    if (res.success && res.data) {
      setState(res.data);
      setDraft(res.data.draft);
      if (ok) toast({ title: ok });
    } else {
      toast({ title: t("pg.BrandingDomainsCard.0211"), description: errorText(res), variant: "destructive" });
    }
    return res;
  };

  const set = <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) => setDraft({ ...draft, [key]: value });
  const saveDraft = async () => {
    const res = await run("save", () => apiClient.updateBranding(tenantId, {
      display_name: draft.display_name, workspace_name: draft.workspace_name, colors: draft.colors,
      theme: draft.theme, sidebar_style: draft.sidebar_style, widgets: draft.widgets,
    }), "Draft saved");
    if (res.success && res.data && previewing) setPreview(res.data.draft);
    return res;
  };
  // After a publish/reset the whole app must pick the new branding up straight away.
  const applyPublished = async () => { setPreview(null); await refresh(); };
  const copy = (text: string) => { void navigator.clipboard?.writeText(text); toast({ title: t("pg.BrandingDomainsCard.0212") }); };
  const upload = (kind: "logo" | "favicon", file?: File) => file && run(kind, () => apiClient.uploadBrandingAsset(tenantId, kind, file), `${kind === "logo" ? "Logo" : "Favicon"} uploaded`);

  const base = state.base_domain;
  const unpublishedChanges = JSON.stringify(state.draft) !== JSON.stringify(state.published);

  return (
    <div className="space-y-4">
      {features.white_label && (
        <Card className="glass border-0">
          <CardHeader className="p-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4" />{t("pg.BrandingDomainsCard.0213")}
              {state.is_published ? <Badge variant="secondary">{t("pg.BrandingDomainsCard.0214")}</Badge> : <Badge variant="outline">{t("pg.BrandingDomainsCard.0215")}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("pg.BrandingDomainsCard.0216")}</Label>
                <Input value={draft.display_name} maxLength={60} onChange={(e) => set("display_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("pg.BrandingDomainsCard.0217")}</Label>
                <Input value={draft.workspace_name} maxLength={60} onChange={(e) => set("workspace_name", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(["logo", "favicon"] as const).map((kind) => {
                const url = draft[`${kind}_url` as "logo_url" | "favicon_url"];
                const ref = kind === "logo" ? logoRef : faviconRef;
                return (
                  <div key={kind} className="space-y-1">
                    <Label className="text-xs capitalize">{kind} {kind === "logo" ? t("pg.BrandingDomainsCard.0494") : t("pg.BrandingDomainsCard.0495")}</Label>
                    <div className="flex items-center gap-2">
                      {url ? <img src={url} alt={kind} className="h-10 w-10 object-contain rounded border" /> : <div className="h-10 w-10 rounded border bg-muted" />}
                      <input ref={ref} type="file" hidden accept={kind === "logo" ? "image/png,image/jpeg,image/webp" : "image/png,image/x-icon,.ico"}
                        onChange={(e) => { upload(kind, e.target.files?.[0]); e.target.value = ""; }} />
                      <Button type="button" size="sm" variant="outline" disabled={busy === kind} onClick={() => ref.current?.click()}>
                        {busy === kind ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}{t("pg.BrandingDomainsCard.0218")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {COLOR_FIELDS.map((c) => (
                <div key={c.key} className="space-y-1">
                  <Label className="text-xs">{c.label}</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" aria-label={c.label} value={draft.colors[c.key] ?? c.fallback}
                      onChange={(e) => set("colors", { ...draft.colors, [c.key]: e.target.value })} className="h-9 w-12 rounded border bg-transparent" />
                    {draft.colors[c.key] && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => { const next = { ...draft.colors }; delete next[c.key]; set("colors", next); }}>{t("pg.BrandingDomainsCard.0219")}</Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">{t("pg.BrandingDomainsCard.0220")}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={draft.theme}
                  onChange={(e) => set("theme", e.target.value as BrandingConfig["theme"])}>
                  <option value="system">{t("pg.BrandingDomainsCard.0221")}</option>
                  <option value="light">{t("pg.BrandingDomainsCard.0222")}</option>
                  <option value="dark">{t("pg.BrandingDomainsCard.0223")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("pg.BrandingDomainsCard.0224")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {WIDGETS.map((w) => (
                  <div key={w.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{w.label}</span>
                    <Switch checked={draft.widgets[w.key] !== false} onCheckedChange={(on) => set("widgets", { ...draft.widgets, [w.key]: on })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border p-3" style={{ background: draft.colors.sidebar }} aria-label={t("pg.BrandingDomainsCard.0225")}>
              <div className="flex items-center gap-2">
                {draft.logo_url && <img src={draft.logo_url} alt="" className="h-8 w-auto object-contain" />}
                <span className="text-sm font-semibold">{draft.display_name || t("pg.BrandingDomainsCard.0496")}</span>
                <span className="ml-auto rounded px-2 py-1 text-xs text-white" style={{ background: draft.colors.primary ?? "#2563eb" }}>{t("pg.BrandingDomainsCard.0226")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!!busy} onClick={saveDraft}>
                {busy === "save" && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}{t("pg.BrandingDomainsCard.0227")}
              </Button>
              <Button size="sm" disabled={!!busy} onClick={async () => { const r = await saveDraft(); if (r.success) { const p = await run("publish", () => apiClient.publishBranding(tenantId), "Branding published - the app now uses it"); if (p.success) await applyPublished(); } }}>
                {busy === "publish" && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}{t("pg.BrandingDomainsCard.0228")}
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => { setPreview(draft); toast({ title: t("pg.BrandingDomainsCard.0229"), description: t("pg.BrandingDomainsCard.0230") }); }}>
                <Eye className="w-3.5 h-3.5 mr-1" />{t("pg.BrandingDomainsCard.0231")}
              </Button>
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={async () => { const r = await run("reset", () => apiClient.resetBranding(tenantId), "Back to SENDA Copilot branding"); if (r.success) await applyPublished(); }}>
                {t("pg.BrandingDomainsCard.0232")}
              </Button>
              {unpublishedChanges && <span className="text-xs text-muted-foreground self-center">{t("pg.BrandingDomainsCard.0233")}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {(features.custom_subdomain || features.custom_domain) && (
        <Card className="glass border-0">
          <CardHeader className="p-3">
            <CardTitle className="flex items-center gap-2 text-sm"><Globe className="w-4 h-4" />{t("pg.BrandingDomainsCard.0234")}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-4">
            {features.custom_subdomain && (
              <div className="space-y-1">
                <Label className="text-xs">{t("pg.BrandingDomainsCard.0235")}</Label>
                <div className="flex gap-2 items-center">
                  <Input value={subdomain} placeholder={t("pg.BrandingDomainsCard.0236")} onChange={(e) => setSubdomain(e.target.value.toLowerCase())} className="max-w-[200px]" />
                  <span className="text-sm text-muted-foreground">.{base}</span>
                  <Button size="sm" disabled={!subdomain || !!busy} onClick={async () => { const r = await run("sub", () => apiClient.setSubdomain(tenantId, subdomain), "Subdomain saved"); if (r.success) setSubdomain(""); }}>{t("pg.Settings.0142")}</Button>
                </div>
              </div>
            )}
            {features.custom_domain && (
              <div className="space-y-1">
                <Label className="text-xs">{t("pg.BrandingDomainsCard.0237")}</Label>
                <div className="flex gap-2">
                  <Input value={customDomain} placeholder="calls.yourcompany.com" onChange={(e) => setCustomDomain(e.target.value.toLowerCase())} className="max-w-[320px]" />
                  <Button size="sm" disabled={!customDomain || !!busy} onClick={async () => { const r = await run("dom", () => apiClient.addCustomDomain(tenantId, customDomain), "Domain added — verify it below"); if (r.success) setCustomDomain(""); }}>{t("pg.BrandingDomainsCard.0238")}</Button>
                </div>
              </div>
            )}

            {state.domains.map((d) => (
              <div key={d.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium break-all">{d.domain}</span>
                  <Badge variant={d.verified ? "secondary" : "outline"}>{d.kind === "subdomain" ? t("pg.BrandingDomainsCard.0497") : d.verified ? t("pg.BrandingDomainsCard.0498") : t("pg.Settings.0434")}</Badge>
                  <Badge variant="outline">{d.kind === "subdomain" ? t("pg.BrandingDomainsCard.0499") : t("pg.BrandingDomainsCard.0500")}</Badge>
                  <div className="ml-auto flex gap-1">
                    {d.kind === "custom" && !d.verified && (
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={async () => {
                        const r = await run("verify" + d.id, () => apiClient.verifyCustomDomain(tenantId, d.id));
                        const v = (r as { data?: { verification?: { verified: boolean; message: string; routing_ok?: boolean; routing_message?: string } } }).data?.verification;
                        if (v) {
                          toast({ title: v.verified ? "Ownership verified" : "Not verified yet", description: v.verified ? (v.routing_ok ? undefined : "Now add the CNAME record so visitors reach SENDA.") : v.message });
                          setChecks((c) => ({ ...c, [d.id]: { ok: !!v.routing_ok, message: v.routing_message || "" } }));
                        }
                      }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />{t("pg.BrandingDomainsCard.0239")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" aria-label={t("pg.BrandingDomainsCard.0501", { domain: d.domain })} disabled={!!busy} onClick={() => run("rm" + d.id, () => apiClient.removeDomain(tenantId, d.id), "Domain removed")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {d.dns && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      {d.verified
                        ? t("pg.BrandingDomainsCard.0502")
                        : t("pg.BrandingDomainsCard.0503")}
                    </p>
                    <div className="overflow-x-auto rounded border">
                      <table className="w-full min-w-[420px] text-left">
                        <thead className="bg-muted/50"><tr><th className="p-2">{t("pg.BrandingDomainsCard.0240")}</th><th className="p-2">{t("pg.BrandingDomainsCard.0241")}</th><th className="p-2">{t("pg.BrandingDomainsCard.0242")}</th><th className="p-2" /></tr></thead>
                        <tbody className="font-mono">
                          {!d.verified && (
                            <tr className="border-t">
                              <td className="p-2">{t("pg.BrandingDomainsCard.0243")}</td><td className="p-2 break-all">{d.dns.txt_host}</td><td className="p-2 break-all">{d.dns.txt_value}</td>
                              <td className="p-2"><button type="button" aria-label={t("pg.BrandingDomainsCard.0244")} onClick={() => copy(d.dns!.txt_value)}><Copy className="h-3.5 w-3.5" /></button></td>
                            </tr>
                          )}
                          <tr className="border-t">
                            <td className="p-2">{t("pg.BrandingDomainsCard.0245")}</td><td className="p-2 break-all">{d.dns.cname_host}</td><td className="p-2 break-all">{d.dns.cname_value}</td>
                            <td className="p-2"><button type="button" aria-label={t("pg.BrandingDomainsCard.0246")} onClick={() => copy(d.dns!.cname_value)}><Copy className="h-3.5 w-3.5" /></button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p>{t("pg.BrandingDomainsCard.0247")} <span className="font-mono">{t("pg.BrandingDomainsCard.0248")}</span>).</p>
                    {d.verified && (
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={async () => {
                        const r = await run("check" + d.id, () => apiClient.verifyCustomDomain(tenantId, d.id));
                        const v = (r as { data?: { verification?: { routing_ok?: boolean; routing_message?: string } } }).data?.verification;
                        if (v) setChecks((c) => ({ ...c, [d.id]: { ok: !!v.routing_ok, message: v.routing_message || "" } }));
                      }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />{t("pg.BrandingDomainsCard.0249")}
                      </Button>
                    )}
                    {checks[d.id] && (
                      <p className={checks[d.id].ok ? "text-emerald-600" : "text-amber-600"}>
                        {checks[d.id].ok ? t("pg.BrandingDomainsCard.0504") : t("pg.BrandingDomainsCard.0505")}{checks[d.id].message}
                      </p>
                    )}
                  </div>
                )}
                {d.last_check_error && !d.verified && <p className="text-xs text-destructive">{d.last_check_error}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

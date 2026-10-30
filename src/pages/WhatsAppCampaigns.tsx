// WhatsApp campaigns: overview, campaign list, a step-by-step wizard, a live detail view, and the opt-out list. Every number shown here comes from the
// server's real recipient rows; anything WhatsApp has not reported is shown as "waiting for report" or "unavailable", never guessed.
import { PageFrame } from "@/components/callcenter/PageFrame";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/i18n/waCampaigns";
import { AnalyticsPanel, AutomationsPanel, ContactsPanel, SchedulesPanel, SettingsPanel } from "@/pages/WhatsAppCampaignsMore";
import { AlertTriangle, Ban, CheckCheck, Download, Loader2, Megaphone, Pause, Play, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  waCampaignsApi, type Campaign, type CampaignDraft, type CampaignStatus, type ParamMapEntry, type Preview, type Recipient, type WaTemplate,
} from "@/services/waCampaignsApi";

const PURPOSES: Array<[string, string, boolean]> = [
  ["marketing", "Marketing campaign", true], ["promotion", "Promotional announcement", true], ["reactivation", "Customer reactivation", true],
  ["product_update", "Product update", true], ["event", "Event announcement", true], ["account", "Account notification", false],
  ["transactional", "Transactional message", false], ["payment_reminder", "Payment reminder", false], ["subscription_reminder", "Subscription reminder", false],
  ["support_followup", "Customer support follow-up", false], ["outage", "Service outage notification", false], ["other", "Other business communication", false],
];
const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground", scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", queued: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  sending: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", paused: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200", failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200", cancelled: "bg-muted text-muted-foreground",
};
const SOURCES: Array<[string, string]> = [["name", "Contact name"], ["phone", "Phone number"], ["email", "Email"], ["attr", "Custom field…"], ["static", "Same text for everyone…"]];
const ACTIVE: CampaignStatus[] = ["queued", "sending", "scheduled", "paused"];

const errorOf = (res: { message?: string; errors?: unknown }) => {
  const body = (res.errors ?? {}) as { message?: string };
  return body.message || res.message || "Something went wrong. Try again.";
};
const codeOf = (res: { errors?: unknown }) => ((res.errors ?? {}) as { code?: string }).code;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize", STATUS_STYLE[status])}>{tr(status)}</span>;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card><CardContent className="p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------- wizard
interface WizardState {
  id?: string; name: string; description: string; purpose: string; phone_number_id: string; audienceKind: "all" | "tags" | "phones" | "senda"; tags: string; phones: string;
  consent: boolean; template: WaTemplate | null; map: ParamMapEntry[]; mediaUrl: string; scheduleAt: string;
  sendaKind: string; sendaDays: string; sendaThreshold: string; repeat: string; until: string;
}
const EMPTY: WizardState = { name: "", description: "", purpose: "marketing", phone_number_id: "", audienceKind: "all", tags: "", phones: "", consent: false, template: null, map: [], mediaUrl: "", scheduleAt: "", sendaKind: "inactive", sendaDays: "30", sendaThreshold: "10", repeat: "", until: "" };

function sourceKind(source: string) { return source.startsWith("attr:") ? "attr" : source.startsWith("static:") ? "static" : source; }

function toDraft(w: WizardState): CampaignDraft {
  const list = (s: string) => s.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  return {
    name: w.name, description: w.description, purpose: w.purpose, phone_number_id: w.phone_number_id, template_name: w.template?.name ?? "", language_code: w.template?.language ?? "en",
    param_map: w.map, consent_attested: w.consent, media_url: w.mediaUrl,
    audience: w.audienceKind === "all" ? { all: true } : w.audienceKind === "tags" ? { tags: list(w.tags) } : w.audienceKind === "senda" ? { senda_users: { kind: w.sendaKind, days: Number(w.sendaDays) || 0, threshold: Number(w.sendaThreshold) || 0 } } : { phones: list(w.phones) },
  };
}

function Wizard({ open, onClose, onDone, resume }: { open: boolean; onClose: () => void; onDone: (c: Campaign) => void; resume?: Campaign | null }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [w, setW] = useState<WizardState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dup, setDup] = useState(false);
  const token = useRef("");
  const { user } = useAuth();
  const isStaff = !!user?.is_superuser;
  const fieldList = useQuery({ queryKey: ["wa-campaigns", "fields"], queryFn: async () => (await waCampaignsApi.fields()).data, enabled: open });
  const sendaKinds = useQuery({ queryKey: ["wa-campaigns", "senda-kinds"], queryFn: async () => (await waCampaignsApi.sendaKinds()).data?.kinds ?? [], enabled: open && isStaff });
  const [sendaCount, setSendaCount] = useState<number | null>(null);
  const numbers = useQuery({ queryKey: ["wa-campaigns", "numbers"], queryFn: async () => (await waCampaignsApi.numbers()).data?.results ?? [], enabled: open });
  const templates = useQuery({
    queryKey: ["wa-campaigns", "templates", w.phone_number_id], enabled: open && !!w.phone_number_id,
    queryFn: async () => { const r = await waCampaignsApi.templates(w.phone_number_id); if (!r.success) throw new Error(errorOf(r)); return r.data?.results ?? []; }, retry: false,
  });

  useEffect(() => {
    if (!open) return;
    token.current = crypto.randomUUID();
    setStep(0); setPreview(null); setConfirmOpen(false); setDup(false);
    if (resume) {
      const a = resume.audience ?? {};
      setW({ ...EMPTY, id: resume.id, name: resume.name, description: resume.description, purpose: resume.purpose, phone_number_id: resume.phone_number_id, consent: !!resume.consent_attested,
        audienceKind: a.senda_users ? "senda" : a.all ? "all" : a.tags?.length ? "tags" : a.phones?.length ? "phones" : "all", tags: (a.tags ?? []).join(", "), phones: (a.phones ?? []).join("\n"),
        sendaKind: a.senda_users?.kind ?? "inactive", sendaDays: String(a.senda_users?.days ?? 30), sendaThreshold: String(a.senda_users?.threshold ?? 10),
        map: resume.param_map ?? [], mediaUrl: resume.media_url ?? "", template: null });
    } else setW(EMPTY);
  }, [open, resume]);
  useEffect(() => { if (open && !w.phone_number_id && numbers.data?.length === 1) setW((s) => ({ ...s, phone_number_id: numbers.data![0].phone_number_id })); }, [open, numbers.data, w.phone_number_id]);
  useEffect(() => {  // re-attach the saved template when resuming a draft
    if (resume && !w.template && templates.data) { const t = templates.data.find((x) => x.name === resume.template_name && x.language === resume.language_code); if (t) setW((s) => ({ ...s, template: t })); }
  }, [resume, templates.data, w.template]);

  useEffect(() => {
    if (!open || !isStaff || w.audienceKind !== "senda") return;
    const t = setTimeout(async () => { const r = await waCampaignsApi.sendaCount({ kind: w.sendaKind, days: Number(w.sendaDays) || 0, threshold: Number(w.sendaThreshold) || 0 }); setSendaCount(r.success && r.data ? r.data.matching : null); }, 400);
    return () => clearTimeout(t);
  }, [open, isStaff, w.audienceKind, w.sendaKind, w.sendaDays, w.sendaThreshold]);

  const isMarketing = PURPOSES.find((p) => p[0] === w.purpose)?.[2] ?? true;
  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) => setW((s) => ({ ...s, [k]: v }));
  const pickTemplate = (t: WaTemplate) => setW((s) => ({ ...s, template: t, map: t.tokens.map((tok, i) => s.map.find((m) => m.token === tok) ?? { token: tok, source: i === 0 ? "name" : "", default: "" }) }));
  const setMap = (token_: string, patch: Partial<ParamMapEntry>) => setW((s) => ({ ...s, map: s.map.map((m) => (m.token === token_ ? { ...m, ...patch } : m)) }));

  const stepOk = [
    w.name.trim().length > 0 && !!w.phone_number_id,
    w.audienceKind === "all" || w.audienceKind === "senda" || (w.audienceKind === "tags" ? w.tags.trim().length > 0 : w.phones.trim().length > 0),
    !!w.template?.supported && w.map.every((m) => !!m.source && m.source !== "attr:" && m.source !== "static:") && (!["IMAGE", "VIDEO", "DOCUMENT"].includes(w.template?.header_format ?? "") || w.mediaUrl.startsWith("https://")),
    true,
  ];

  const save = async (): Promise<string | null> => {
    const res = w.id ? await waCampaignsApi.update(w.id, toDraft(w)) : await waCampaignsApi.create(toDraft(w));
    if (!res.success || !res.data) { toast({ title: errorOf(res), variant: "destructive" }); return null; }
    setW((s) => ({ ...s, id: res.data!.campaign.id }));
    return res.data.campaign.id;
  };
  const goPreview = async () => {
    setBusy(true);
    const id = await save();
    if (id) {
      const res = await waCampaignsApi.preview({ campaign_id: id });
      if (res.success && res.data) { setPreview(res.data); setStep(3); } else toast({ title: errorOf(res), variant: "destructive" });
    }
    setBusy(false);
  };
  const next = () => (step === 2 ? void goPreview() : setStep((s) => s + 1));
  const saveDraft = async () => { setBusy(true); const id = await save(); setBusy(false); if (id) { toast({ title: tr("Draft saved") }); onClose(); onDone({ id } as Campaign); } };

  const launch = async (allowDuplicate = false) => {
    if (!w.id || !preview) return;
    setBusy(true);
    if (w.repeat) {
      const rec = await waCampaignsApi.addRecurring({ campaign_id: w.id, frequency: w.repeat, interval: 1, first_run_at: new Date(w.scheduleAt).toISOString(), until: w.until ? new Date(w.until).toISOString() : undefined });
      setBusy(false);
      if (rec.success) { setConfirmOpen(false); onClose(); toast({ title: tr("Repeating campaign saved") }); onDone({ id: w.id } as Campaign); } else toast({ title: errorOf(rec), variant: "destructive" });
      return;
    }
    const scheduled = w.scheduleAt ? new Date(w.scheduleAt).toISOString() : undefined;
    const res = await waCampaignsApi.launch(w.id, { launch_token: token.current, confirm_recipients: preview.eligible, scheduled_at: scheduled, allow_duplicate: allowDuplicate });
    setBusy(false);
    if (res.success && res.data) { setConfirmOpen(false); onClose(); toast({ title: scheduled ? tr("Campaign scheduled") : tr("Campaign started") }); onDone(res.data.campaign); return; }
    const code = codeOf(res);
    if (code === "audience_changed") { toast({ title: errorOf(res), variant: "destructive" }); setConfirmOpen(false); void goPreview(); return; }
    if (code === "duplicate_campaign") { setDup(true); return; }
    setConfirmOpen(false);
    toast({ title: errorOf(res), variant: "destructive" });
  };

  const titles = ["Basics", "Audience", "Template & values", "Review & launch"];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b p-4 text-left">
          <DialogTitle>{resume ? tr("Edit draft campaign") : tr("New WhatsApp campaign")}</DialogTitle>
          <DialogDescription>{tr("Step")} {step + 1} {tr("of")} 4 · {tr(titles[step])}</DialogDescription>
          <Progress value={((step + 1) / 4) * 100} className="mt-2 h-1" />
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {step === 0 && (
            <>
              <div className="space-y-1.5"><Label htmlFor="cw-name">{tr("Campaign name")}</Label><Input id="cw-name" value={w.name} maxLength={160} onChange={(e) => set("name", e.target.value)} placeholder={tr("Eid offer")} /></div>
              <div className="space-y-1.5"><Label htmlFor="cw-desc">{tr("Description (optional)")}</Label><Textarea id="cw-desc" rows={2} value={w.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>{tr("Purpose")}</Label>
                <Select value={w.purpose} onValueChange={(v) => set("purpose", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PURPOSES.map(([v, l]) => <SelectItem key={v} value={v}>{tr(l)}</SelectItem>)}</SelectContent></Select>
                <p className="text-xs text-muted-foreground">{isMarketing ? "Marketing messages need the person's permission and respect opt-outs." : tr("Service messages still never go to someone who opted out.")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{tr("Send from")}</Label>
                {numbers.isLoading ? <p className="text-sm text-muted-foreground">{tr("Loading numbers…")}</p> : !numbers.data?.length ? (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{tr("No WhatsApp number is connected yet. Connect one in Settings › WhatsApp, then come back.")}</p>
                ) : (
                  <Select value={w.phone_number_id} onValueChange={(v) => { set("phone_number_id", v); set("template", null); }}><SelectTrigger><SelectValue placeholder={tr("Choose a number")} /></SelectTrigger>
                    <SelectContent>{numbers.data.map((n) => <SelectItem key={n.phone_number_id} value={n.phone_number_id}>{n.label} · {n.phone_number_id}</SelectItem>)}</SelectContent></Select>
                )}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>{tr("Who receives it")}</Label>
                <Select value={w.audienceKind} onValueChange={(v) => set("audienceKind", v as WizardState["audienceKind"])}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{tr("All my contacts")}</SelectItem><SelectItem value="tags">{tr("Contacts with a tag")}</SelectItem><SelectItem value="phones">{tr("Numbers I paste")}</SelectItem>{isStaff && <SelectItem value="senda">{tr("SENDA users (by activity)")}</SelectItem>}</SelectContent></Select>
              </div>
              {w.audienceKind === "senda" && (
                <div className="space-y-2 rounded-md border p-3">
                  <Select value={w.sendaKind} onValueChange={(v) => set("sendaKind", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(sendaKinds.data ?? []).map((k) => <SelectItem key={k.kind} value={k.kind}>{tr(k.label)}</SelectItem>)}</SelectContent></Select>
                  <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor="cw-days">N ({tr("days")})</Label><Input id="cw-days" type="number" min={0} value={w.sendaDays} onChange={(e) => set("sendaDays", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="cw-thr">N ({tr("credits")})</Label><Input id="cw-thr" type="number" min={0} value={w.sendaThreshold} onChange={(e) => set("sendaThreshold", e.target.value)} /></div></div>
                  <p className="text-sm">{sendaCount === null ? "…" : <><b>{sendaCount}</b> {tr("SENDA users match this rule right now.")}</>}</p>
                  <p className="text-xs text-muted-foreground">{tr("Only SENDA staff can see this option. People who opted out and accounts without a phone number are left out.")}</p>
                </div>
              )}
              {w.audienceKind === "tags" && <div className="space-y-1.5"><Label htmlFor="cw-tags">{tr("Tags (comma separated)")}</Label><Input id="cw-tags" value={w.tags} onChange={(e) => set("tags", e.target.value)} placeholder={tr("vip, dar-es-salaam")} /></div>}
              {w.audienceKind === "phones" && <div className="space-y-1.5"><Label htmlFor="cw-phones">{tr("Phone numbers (one per line)")}</Label><Textarea id="cw-phones" rows={5} value={w.phones} onChange={(e) => set("phones", e.target.value)} placeholder={"+255712345678\n0754 000 111"} /></div>}
              <p className="text-xs text-muted-foreground">{tr("People who opted out, are on the suppression list, or have an invalid number are left out automatically. You will see exactly how many and why before anything is sent.")}</p>
              {isMarketing && (
                <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                  <Checkbox checked={w.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5" />
                  <span>{tr("I confirm these people agreed to receive marketing messages from my business on WhatsApp.")}<span className="text-muted-foreground">{tr("Without this, only contacts with a recorded opt-in are included.")}</span></span>
                </label>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><Label>{tr("Approved template")}</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void templates.refetch()}><RefreshCw className={cn("mr-1 h-3.5 w-3.5", templates.isFetching && "animate-spin")} />{tr("Refresh")}</Button></div>
                {templates.isLoading ? <p className="text-sm text-muted-foreground">{tr("Loading your templates from WhatsApp…")}</p>
                  : templates.isError ? <p className="text-sm text-destructive">{(templates.error as Error).message}</p>
                  : !templates.data?.length ? <p className="text-sm text-muted-foreground">{tr("No approved templates yet. Create one and wait for WhatsApp to approve it.")}</p> : (
                    <div className="max-h-48 space-y-1.5 overflow-y-auto">
                      {templates.data.map((t) => (
                        <button type="button" key={`${t.name}-${t.language}`} disabled={!t.supported} onClick={() => pickTemplate(t)}
                          className={cn("w-full rounded-md border p-2.5 text-left text-sm transition-colors", w.template?.name === t.name && w.template.language === t.language ? "border-primary bg-primary/5" : "hover:bg-accent/40", !t.supported && "opacity-50")}>
                          <span className="flex items-center justify-between gap-2"><span className="font-medium">{t.name}</span><span className="text-[11px] text-muted-foreground">{t.language} · {t.category.toLowerCase()}</span></span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{t.body}</span>
                          {!t.supported && <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-300">{t.reason}</span>}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              {w.template && (
                <>
                  <div className="rounded-lg bg-[#d9fdd3] p-3 text-sm text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]">
                    {w.template.header && <p className="mb-1 font-semibold">{w.template.header}</p>}
                    <p className="whitespace-pre-wrap">{w.template.body}</p>
                    {w.template.footer && <p className="mt-1 text-xs opacity-70">{w.template.footer}</p>}
                    {w.template.buttons.length > 0 && <p className="mt-2 text-xs opacity-80">{w.template.buttons.map((b) => `[${b}]`).join("  ")}</p>}
                  </div>
                  {["IMAGE", "VIDEO", "DOCUMENT"].includes(w.template.header_format) && (
                    <div className="space-y-1.5"><Label htmlFor="cw-media">{tr("Header file link (https)")}</Label><Input id="cw-media" value={w.mediaUrl} onChange={(e) => set("mediaUrl", e.target.value)} placeholder="https://…" /></div>
                  )}
                  {w.map.length > 0 && <p className="text-sm font-medium">{tr("Fill each placeholder")}</p>}
                  {w.map.map((m) => {
                    const kind = sourceKind(m.source);
                    return (
                      <div key={m.token} className="space-y-1.5 rounded-md border p-3">
                        <p className="text-sm font-medium">{`{{${m.token}}}`}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Select value={kind || undefined} onValueChange={(v) => setMap(m.token, { source: v === "attr" ? "attr:" : v === "static" ? "static:" : v })}>
                            <SelectTrigger><SelectValue placeholder={tr("Take it from…")} /></SelectTrigger><SelectContent>{SOURCES.map(([v, l]) => <SelectItem key={v} value={v}>{tr(l)}</SelectItem>)}</SelectContent></Select>
                          {kind === "attr" && <><Input list="cw-fields" value={m.source.slice(5)} onChange={(e) => setMap(m.token, { source: `attr:${e.target.value}` })} placeholder={tr("field name, e.g. business_name")} />
                            <datalist id="cw-fields">{[...(fieldList.data?.results ?? []).map((f) => f.key), ...(fieldList.data?.discovered ?? []).map((d) => d.key)].map((k) => <option key={k} value={k} />)}</datalist></>}
                          {kind === "static" && <Input value={m.source.slice(7)} onChange={(e) => setMap(m.token, { source: `static:${e.target.value}` })} placeholder={tr("text")} />}
                          {kind !== "static" && kind !== "attr" && <Input value={m.default ?? ""} onChange={(e) => setMap(m.token, { default: e.target.value })} placeholder={tr("If empty, use… (optional)")} />}
                        </div>
                        {(kind === "attr") && <Input value={m.default ?? ""} onChange={(e) => setMap(m.token, { default: e.target.value })} placeholder={tr("If empty, use… (optional)")} />}
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
          {step === 3 && preview && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label={tr("In the audience")} value={preview.audience} /><Stat label={tr("Will receive")} value={preview.eligible} /><Stat label={tr("Left out")} value={preview.skipped} />
              </div>
              {preview.problems.length > 0 && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                  <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="h-4 w-4" />{tr("Fix this before launching")}</p>
                  <ul className="mt-1 list-disc pl-5">{preview.problems.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
              {preview.skipped_by_reason.length > 0 && (
                <div className="rounded-md border p-3 text-sm"><p className="mb-1 font-medium">{tr("Why people are left out")}</p>
                  {preview.skipped_by_reason.map((r) => <p key={r.reason} className="flex justify-between"><span>{tr(r.label)}</span><span className="tabular-nums">{r.count}</span></p>)}</div>
              )}
              {preview.samples.length > 0 && (
                <div className="space-y-2"><p className="text-sm font-medium">{tr("What people will see")}</p>
                  {preview.samples.map((s) => (
                    <div key={s.phone} className="rounded-lg bg-[#d9fdd3] p-3 text-sm text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]">
                      <p className="mb-1 text-[11px] opacity-70">{tr("To")} {s.name || s.phone}{s.used_default.length > 0 && ` · ${tr("used the fallback for")} {{${s.used_default.join("}}, {{")}}}`}</p>
                      <p className="whitespace-pre-wrap">{s.text}</p>
                    </div>
                  ))}</div>
              )}
              <div className="space-y-1.5 rounded-md border p-3 text-sm">
                <p>{tr("WhatsApp credits: needs")} <b>{preview.credits.required}</b>{preview.credits.available !== null && <>{tr(", you have")} <b className={preview.credits.enough ? "" : "text-destructive"}>{preview.credits.available}</b></>}.</p>
                <p className="text-xs text-muted-foreground">{preview.credits.cost_note}</p>
              </div>
              {preview.limits?.estimate && <div className="rounded-md border p-3 text-sm"><p>{tr("Estimated cost")}: <b>{preview.limits.estimate.amount} {preview.limits.estimate.currency}</b></p><p className="text-xs text-muted-foreground">{preview.limits.estimate.note}</p></div>}
              {(preview.limits?.warnings ?? []).map((x) => <p key={x} className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{x}</p>)}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cw-when">{w.repeat ? tr("First send") : tr("Send")}</Label>
                  <Input id="cw-when" type="datetime-local" value={w.scheduleAt} onChange={(e) => set("scheduleAt", e.target.value)} />
                  <p className="text-xs text-muted-foreground">{w.repeat ? tr("Choose when it should first go out.") : tr("Leave empty to start right away.")}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{tr("Repeat")}</Label>
                  <Select value={w.repeat || "none"} onValueChange={(v) => set("repeat", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">{tr("Do not repeat")}</SelectItem><SelectItem value="daily">{tr("Every day")}</SelectItem><SelectItem value="weekly">{tr("Every week")}</SelectItem><SelectItem value="monthly">{tr("Every month")}</SelectItem></SelectContent></Select>
                  {w.repeat && <Input type="datetime-local" aria-label={tr("Stop repeating after")} value={w.until} onChange={(e) => set("until", e.target.value)} />}
                  {w.repeat && <p className="text-xs text-muted-foreground">{tr("Optional: stop repeating after this date.")}</p>}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 border-t p-3 sm:justify-between">
          <Button variant="ghost" disabled={busy} onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>{step === 0 ? tr("Cancel") : tr("Back")}</Button>
          <div className="flex gap-2">
            {step > 0 && step < 3 && <Button variant="outline" disabled={busy || !w.name.trim()} onClick={() => void saveDraft()}>{tr("Save draft")}</Button>}
            {step < 3 ? <Button disabled={busy || !stepOk[step]} onClick={next}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{step === 2 ? tr("Preview") : tr("Next")}</Button>
              : <Button disabled={busy || !preview || !preview.can_launch || preview.eligible === 0 || (!!w.repeat && !w.scheduleAt)} onClick={() => setConfirmOpen(true)}>{w.repeat ? "Repeat…" : w.scheduleAt ? tr("Schedule…") : tr("Launch…")}</Button>}
          </div>
        </DialogFooter>
      </DialogContent>

      <Dialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader><DialogTitle>{dup ? tr("Send an identical campaign again?") : tr("Confirm campaign")}</DialogTitle>
            <DialogDescription>{dup ? "An identical campaign was launched a few minutes ago. Only continue if you mean to send it twice." : tr("Check these details. Messages already sent cannot be recalled.")}</DialogDescription></DialogHeader>
          {preview && w.template && (
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{tr("Campaign")}</dt><dd className="font-medium">{w.name}</dd>
              <dt className="text-muted-foreground">{tr("Recipients")}</dt><dd className="font-medium">{preview.eligible} {preview.skipped > 0 && <span className="font-normal text-muted-foreground">({preview.skipped} left out)</span>}</dd>
              <dt className="text-muted-foreground">{tr("Template")}</dt><dd>{w.template.name} · {w.template.language} · {preview.template_category.toLowerCase()}</dd>
              <dt className="text-muted-foreground">{tr("When")}</dt><dd>{w.scheduleAt ? when(new Date(w.scheduleAt).toISOString()) : tr("Right away")}{w.repeat && ` · ${tr(w.repeat === "daily" ? "Every day" : w.repeat === "weekly" ? "Every week" : "Every month")}`}</dd>
              <dt className="text-muted-foreground">{tr("Credits")}</dt><dd>{preview.credits.required}{preview.credits.available !== null && ` of ${preview.credits.available}`}</dd>
              <dt className="text-muted-foreground">{tr("Cost")}</dt><dd className={preview.limits?.estimate ? "" : "text-muted-foreground"}>{preview.limits?.estimate ? `${preview.limits.estimate.amount} ${preview.limits.estimate.currency} (your rate)` : tr("Not estimated")}</dd>
            </dl>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" disabled={busy} onClick={() => { setConfirmOpen(false); setDup(false); }}>{tr("Go back")}</Button>
            <Button disabled={busy} onClick={() => void launch(dup)}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{dup ? "Send again" : w.repeat ? "Save repeating campaign" : w.scheduleAt ? tr("Schedule campaign") : tr("Send campaign")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// -------------------------------------------------------------------------------------------------------------------------------- detail
const RECIPIENT_FILTERS: Array<[string, string]> = [["", "All"], ["failed", "Failed"], ["skipped", "Left out"], ["delivered", "Delivered"], ["read", "Read"], ["submitted", "Awaiting report"], ["pending", "Waiting"]];

function Detail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (c: Campaign) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const campaign = useQuery({ queryKey: ["wa-campaigns", "one", id], queryFn: async () => (await waCampaignsApi.get(id)).data?.campaign, refetchInterval: (q) => (q.state.data && ACTIVE.includes(q.state.data.status) ? 4000 : 20000) });
  const recipients = useQuery({ queryKey: ["wa-campaigns", "recipients", id, filter, page], queryFn: async () => (await waCampaignsApi.recipients(id, { status: filter, page })).data, refetchInterval: 8000 });
  const c = campaign.data;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); };
  const act = async (name: string, fn: () => Promise<{ success?: boolean; message?: string; errors?: unknown; data?: unknown }>, ok: string) => {
    setBusy(name); const res = await fn(); setBusy("");
    if (res.success) { toast({ title: ok }); refresh(); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  if (!c) return <Dialog open onOpenChange={onClose}><DialogContent><DialogTitle className="sr-only">{tr("Campaign")}</DialogTitle><p className="p-4 text-sm text-muted-foreground">{tr("Loading…")}</p></DialogContent></Dialog>;
  const s = c.stats;
  const total = s.recipients || 1;
  const rows: Recipient[] = recipients.data?.results ?? [];
  const pages = Math.max(1, Math.ceil((recipients.data?.count ?? 0) / (recipients.data?.page_size || 50)));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="space-y-1 border-b p-4 text-left">
          <div className="flex flex-wrap items-center gap-2"><DialogTitle className="break-words">{c.name}</DialogTitle><StatusBadge status={c.status} /></div>
          <DialogDescription>{tr(c.purpose_label)} · {c.template_name || tr("no template")} {c.template_category && `(${c.template_category.toLowerCase()})`} · {tr("by")} {c.created_by || "—"}</DialogDescription>
          <p className="text-xs text-muted-foreground">{tr("Created")} {when(c.created_at)}{c.scheduled_at && ` · ${tr("planned for")} ${when(c.scheduled_at)}`}{c.started_at && ` · ${tr("started")} ${when(c.started_at)}`}{c.completed_at && ` · ${tr("finished")} ${when(c.completed_at)}`}</p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {c.estimated_cost && <p className="text-sm text-muted-foreground">{tr("Estimated cost at your rate")}: {c.estimated_cost}</p>}
          {c.returned && <div className="rounded-md border p-3 text-sm"><p><b>{c.returned.count}</b> {tr("of")} {c.returned.of} {tr("signed in after the message")}</p><p className="text-xs text-muted-foreground">{c.returned.note}</p></div>}
          {c.failure_reason && <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{c.failure_reason}</p>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label={tr("Recipients")} value={s.recipients} /><Stat label={tr("Submitted")} value={s.submitted} /><Stat label={tr("Delivered")} value={s.delivered} />
            <Stat label={tr("Read")} value={s.read} /><Stat label={tr("Failed")} value={s.failed} /><Stat label={tr("Left out")} value={s.skipped} />
          </div>
          {s.recipients > 0 && (
            <div className="space-y-1"><Progress value={pct(s.submitted + s.failed, total)} className="h-2" />
              <p className="text-xs text-muted-foreground">{s.submitted + s.failed} {tr("of")} {s.recipients} {tr("handled")}{s.waiting > 0 && ` · ${s.waiting} ${tr("waiting")}`}{s.awaiting_report > 0 && ` · ${s.awaiting_report} ${tr("waiting for WhatsApp's delivery report")}`}</p></div>
          )}
          <div className="flex flex-wrap gap-2">
            {c.status === "draft" && <Button size="sm" onClick={() => onEdit(c)}>{tr("Continue editing")}</Button>}
            {["queued", "sending", "scheduled"].includes(c.status) && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void act("pause", () => waCampaignsApi.pause(id), "Paused")}><Pause className="mr-1 h-4 w-4" />{tr("Pause")}</Button>}
            {c.status === "paused" && <Button size="sm" disabled={!!busy} onClick={() => void act("resume", () => waCampaignsApi.resume(id), "Resumed")}><Play className="mr-1 h-4 w-4" />{tr("Resume")}</Button>}
            {["queued", "sending", "scheduled", "paused"].includes(c.status) && <Button size="sm" variant="outline" className="text-destructive" disabled={!!busy} onClick={() => setConfirmCancel(true)}><XCircle className="mr-1 h-4 w-4" />{tr("Cancel")}</Button>}
            {["completed", "failed"].includes(c.status) && s.failed > 0 && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void act("retry", async () => { const r = await waCampaignsApi.retryFailed(id); if (r.success && r.data) toast({ title: `${r.data.retried} retried · ${r.data.not_retryable} cannot be retried · ${r.data.opted_out} opted out` }); return r; }, "Retry started")}><RefreshCw className="mr-1 h-4 w-4" />{tr("Retry failed")}</Button>}
            {c.status !== "draft" && <Button size="sm" variant="outline" onClick={() => void waCampaignsApi.exportCsv(id, c.name).then((ok) => !ok && toast({ title: tr("Could not export"), variant: "destructive" }))}><Download className="mr-1 h-4 w-4" />{tr("Export CSV")}</Button>}
          </div>
          {(c.skipped_by_reason?.length ?? 0) > 0 && <div className="rounded-md border p-3 text-sm"><p className="mb-1 font-medium">{tr("Left out")}</p>{c.skipped_by_reason!.map((r) => <p key={r.reason} className="flex justify-between"><span>{tr(r.label)}</span><span className="tabular-nums">{r.count}</span></p>)}</div>}
          {(c.failures_by_error?.length ?? 0) > 0 && <div className="rounded-md border p-3 text-sm"><p className="mb-1 font-medium">{tr("Why messages failed")}</p>{c.failures_by_error!.map((e, i) => <p key={i} className="flex justify-between gap-3"><span className="min-w-0 break-words">{e.code && <b>{e.code} · </b>}{e.message}</span><span className="tabular-nums">{e.count}</span></p>)}</div>}
          {c.status !== "draft" && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">{RECIPIENT_FILTERS.map(([v, l]) => <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => { setFilter(v); setPage(1); }}>{tr(l)}</Button>)}</div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2">{tr("Number")}</th><th className="p-2">{tr("Name")}</th><th className="p-2">{tr("Status")}</th><th className="p-2">{tr("Detail")}</th></tr></thead>
                  <tbody>{rows.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">{recipients.isLoading ? tr("Loading…") : tr("Nothing here.")}</td></tr> : rows.map((r) => (
                    <tr key={r.id} className="border-t"><td className="whitespace-nowrap p-2 tabular-nums">+{r.phone}</td><td className="p-2">{r.name || "—"}</td>
                      <td className="p-2 capitalize">{r.status === "submitted" ? tr("awaiting report") : tr(r.status)}</td>
                      <td className="p-2 text-xs text-muted-foreground">{r.status === "skipped" ? (r.skip_detail || r.skip_reason.replace(/_/g, " ")) : r.status === "failed" ? `${r.error_code ? `${r.error_code}: ` : ""}${r.error_message}` : r.read_at ? `${tr("read")} ${when(r.read_at)}` : r.delivered_at ? `${tr("delivered")} ${when(r.delivered_at)}` : ""}</td></tr>))}</tbody></table>
              </div>
              {pages > 1 && <div className="flex items-center justify-between text-sm"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{tr("Previous")}</Button><span className="text-muted-foreground">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{tr("Next")}</Button></div>}
            </div>
          )}
        </div>
        <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-sm"><DialogHeader><DialogTitle>{tr("Cancel this campaign?")}</DialogTitle>
            <DialogDescription>{tr("Messages not yet sent will never go out. Messages already handed to WhatsApp cannot be recalled.")}</DialogDescription></DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0"><Button variant="ghost" onClick={() => setConfirmCancel(false)}>{tr("Keep running")}</Button>
              <Button variant="destructive" onClick={() => { setConfirmCancel(false); void act("cancel", () => waCampaignsApi.cancel(id), "Campaign cancelled"); }}>{tr("Cancel campaign")}</Button></DialogFooter></DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------------------------------------------------------- campaigns tab
function CampaignsTab({ onNew, onOpen }: { onNew: () => void; onOpen: (c: Campaign) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["wa-campaigns", "list", q, status, page], refetchInterval: 8000,
    queryFn: async () => { const r = await waCampaignsApi.list({ q, status: status === "all" ? undefined : status, page }); if (!r.success) throw new Error(errorOf(r)); return r.data; },
  });
  const pages = Math.max(1, Math.ceil((list.data?.count ?? 0) / (list.data?.page_size || 50)));
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder={tr("Search campaigns")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{tr("All statuses")}</SelectItem>{(["draft", "scheduled", "queued", "sending", "paused", "completed", "failed", "cancelled"] as const).map((s) => <SelectItem key={s} value={s} className="capitalize">{tr(s)}</SelectItem>)}</SelectContent></Select>
        <Button onClick={onNew}><Plus className="mr-1 h-4 w-4" />{tr("New campaign")}</Button>
      </div>
      {list.isError ? <p className="rounded-md border p-4 text-sm text-destructive">{(list.error as Error).message}</p> : list.isLoading ? <p className="p-6 text-sm text-muted-foreground">{tr("Loading…")}</p> : !list.data?.results.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center"><Megaphone className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 font-medium">{tr("No campaigns yet")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{tr("Send an approved WhatsApp template to your contacts, with each person's own details filled in.")}</p><Button className="mt-4" onClick={onNew}><Plus className="mr-1 h-4 w-4" />{tr("Create your first campaign")}</Button></div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2.5">{tr("Campaign")}</th><th className="p-2.5">{tr("Status")}</th><th className="p-2.5 text-right">{tr("To")}</th><th className="p-2.5 text-right">{tr("Delivered")}</th><th className="p-2.5 text-right">{tr("Read")}</th><th className="p-2.5 text-right">{tr("Failed")}</th><th className="whitespace-nowrap p-2.5">{tr("Created")}</th></tr></thead>
            <tbody>{list.data.results.map((c) => (
              <tr key={c.id} className="cursor-pointer border-t hover:bg-accent/40" onClick={() => onOpen(c)}>
                <td className="p-2.5"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{tr(c.purpose_label)}{c.template_name && ` · ${c.template_name}`}</p></td>
                <td className="p-2.5"><StatusBadge status={c.status} /></td>
                <td className="p-2.5 text-right tabular-nums">{c.stats.recipients}</td><td className="p-2.5 text-right tabular-nums">{c.stats.delivered}</td>
                <td className="p-2.5 text-right tabular-nums">{c.stats.read}</td><td className="p-2.5 text-right tabular-nums">{c.stats.failed}</td>
                <td className="whitespace-nowrap p-2.5 text-xs text-muted-foreground">{when(c.created_at)}</td></tr>))}</tbody></table>
        </div>
      )}
      {pages > 1 && <div className="flex items-center justify-between text-sm"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{tr("Previous")}</Button><span className="text-muted-foreground">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{tr("Next")}</Button></div>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------- opt-out list
function OptOutTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const list = useQuery({ queryKey: ["wa-campaigns", "suppressions"], queryFn: async () => (await waCampaignsApi.suppressions()).data });
  const add = async () => {
    const res = await waCampaignsApi.addSuppression(phone, note);
    if (res.success) { setPhone(""); setNote(""); void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); toast({ title: tr("Number added") }); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  const remove = async (id: string) => { const res = await waCampaignsApi.removeSuppression(id); if (res.success) void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); else toast({ title: errorOf(res), variant: "destructive" }); };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{tr("Numbers here never receive campaigns. Customers who reply STOP (or SIMAMISHA) to a campaign are added automatically, and so are numbers WhatsApp reports as blocked or undeliverable.")}</p>
      <div className="flex flex-col gap-2 sm:flex-row"><Input placeholder="+255712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="sm:w-56" /><Input placeholder={tr("Note (optional)")} value={note} onChange={(e) => setNote(e.target.value)} /><Button disabled={!phone.trim()} onClick={() => void add()}><Ban className="mr-1 h-4 w-4" />{tr("Add")}</Button></div>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2.5">{tr("Number")}</th><th className="p-2.5">{tr("Reason")}</th><th className="p-2.5">{tr("Source")}</th><th className="whitespace-nowrap p-2.5">{tr("Added")}</th><th className="p-2.5" /></tr></thead>
        <tbody>{!list.data?.results.length ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{list.isLoading ? tr("Loading…") : tr("No numbers on the list.")}</td></tr> : list.data.results.map((r) => (
          <tr key={r.id} className="border-t"><td className="whitespace-nowrap p-2.5 tabular-nums">+{r.phone}</td><td className="p-2.5">{tr(r.reason_label)}</td><td className="p-2.5 text-xs text-muted-foreground">{r.source === "customer_reply" ? "Customer replied STOP" : r.source.startsWith("campaign:") ? "From a campaign" : r.source || "—"}{r.note && ` · ${r.note}`}</td>
            <td className="whitespace-nowrap p-2.5 text-xs text-muted-foreground">{when(r.created_at)}</td><td className="p-2.5 text-right"><Button size="icon" variant="ghost" aria-label={tr("Remove")} onClick={() => void remove(r.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>))}</tbody></table></div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------------------------------------------ page
export default function WhatsAppCampaigns() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [wizard, setWizard] = useState<{ open: boolean; resume: Campaign | null }>({ open: false, resume: null });
  const [tab, setTab] = useState("campaigns");
  const { user: me } = useAuth();
  const openId = params.get("c");
  const probe = useQuery({ queryKey: ["wa-campaigns", "access"], retry: false, queryFn: async () => { const r = await waCampaignsApi.overview(); return { ok: !!r.success, status: r.status, msg: errorOf(r) }; } });
  const { toast } = useToast();
  const editDraft = async (id: string) => { const r = await waCampaignsApi.get(id); if (r.success && r.data) setWizard({ open: true, resume: r.data.campaign }); else toast({ title: errorOf(r), variant: "destructive" }); };
  const open = (id: string | null) => setParams(id ? { c: id } : {}, { replace: true });
  const noAccess = useMemo(() => probe.data && !probe.data.ok && probe.data.status === 403, [probe.data]);

  if (noAccess) return <PageFrame title={tr("WhatsApp campaigns")} width="max-w-lg"><div className="p-8 text-center"><Megaphone className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">{tr("WhatsApp campaigns are not available to your role")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("Ask an owner or admin of your organization.")}</p></div></PageFrame>;
  return (
    <PageFrame title={tr("WhatsApp campaigns")} subtitle={tr("Send approved templates to your contacts and follow every message.")}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="campaigns">{tr("Campaigns")}</TabsTrigger><TabsTrigger value="overview">{tr("Overview")}</TabsTrigger><TabsTrigger value="contacts">{tr("Contacts")}</TabsTrigger><TabsTrigger value="schedules">{tr("Schedules")}</TabsTrigger><TabsTrigger value="optouts">{tr("Opt-outs")}</TabsTrigger><TabsTrigger value="settings">{tr("Limits & cost")}</TabsTrigger>{me?.is_superuser && <TabsTrigger value="automations">{tr("Automations")}</TabsTrigger>}</TabsList>
        <TabsContent value="campaigns" className="mt-3"><CampaignsTab onNew={() => setWizard({ open: true, resume: null })} onOpen={(c) => (c.status === "draft" ? void editDraft(c.id) : open(c.id))} /></TabsContent>
        <TabsContent value="overview" className="mt-3"><AnalyticsPanel /></TabsContent>
        <TabsContent value="contacts" className="mt-3"><ContactsPanel /></TabsContent>
        <TabsContent value="schedules" className="mt-3"><SchedulesPanel /></TabsContent>
        <TabsContent value="settings" className="mt-3"><SettingsPanel /></TabsContent>
        {me?.is_superuser && <TabsContent value="automations" className="mt-3"><AutomationsPanel /></TabsContent>}
        <TabsContent value="optouts" className="mt-3"><OptOutTab /></TabsContent>
      </Tabs>
      <Wizard open={wizard.open} resume={wizard.resume} onClose={() => setWizard({ open: false, resume: null })}
        onDone={(c) => { void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); if (c.status && c.status !== "draft") open(c.id); }} />
      {openId && <Detail id={openId} onClose={() => open(null)} onEdit={(c) => { open(null); setWizard({ open: true, resume: c }); }} />}
    </PageFrame>
  );
}

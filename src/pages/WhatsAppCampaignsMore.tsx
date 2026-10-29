// The rest of the WhatsApp campaign screens: analytics, custom fields, guided contact import, limits and cost, schedules, and (SENDA staff) automations.
// Same rule as the main page: every figure is read from the server's real records; what WhatsApp has not reported is shown as missing, never guessed.
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tr } from "@/i18n/waCampaigns";
import { cn } from "@/lib/utils";
import { appLocale } from "@/utils/appLocale";
import { waCampaignsApi, type Analytics, type ImportCheck, type ImportInfo, type ParamMapEntry, type WaTemplate } from "@/services/waCampaignsApi";

const errorOf = (res: { message?: string; errors?: unknown }) => ((res.errors ?? {}) as { message?: string }).message || res.message || tr("Something went wrong. Try again.");
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" }) : "—");
const rate = (v: number | null) => (v === null ? "—" : `${v}%`);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card><CardContent className="p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------- analytics
export function AnalyticsPanel() {
  const [days, setDays] = useState("30");
  const overview = useQuery({ queryKey: ["wa-campaigns", "overview"], queryFn: async () => (await waCampaignsApi.overview()).data, refetchInterval: 15000 });
  const data = useQuery({ queryKey: ["wa-campaigns", "analytics", days], queryFn: async () => (await waCampaignsApi.analytics(Number(days))).data, refetchInterval: 30000 });
  const o = overview.data, a = data.data;
  if (!o || !a) return <p className="p-6 text-sm text-muted-foreground">{tr("Loading…")}</p>;
  const table = (title: string, rows: Analytics["by_template"]) => rows.length > 0 && (
    <div className="space-y-1.5"><p className="text-sm font-medium">{title}</p>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2">{tr("Name")}</th><th className="p-2 text-right">{tr("Submitted")}</th><th className="p-2 text-right">{tr("Delivered")}</th><th className="p-2 text-right">{tr("Delivery rate")}</th><th className="p-2 text-right">{tr("Read rate")}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.key} className="border-t"><td className="p-2">{r.key}</td><td className="p-2 text-right tabular-nums">{r.submitted}</td><td className="p-2 text-right tabular-nums">{r.delivered}</td><td className="p-2 text-right tabular-nums">{rate(r.delivery_rate)}</td><td className="p-2 text-right tabular-nums">{rate(r.read_rate)}</td></tr>)}</tbody></table></div></div>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{tr("Figures come from WhatsApp's own delivery reports.")}</p>
        <Select value={days} onValueChange={setDays}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["7", "30", "90", "365"].map((d) => <SelectItem key={d} value={d}>{tr("Last {n} days").replace("{n}", d)}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={tr("Messages submitted")} value={a.totals.submitted} />
        <Stat label={tr("Delivery rate")} value={rate(a.totals.delivery_rate)} hint={`${a.totals.delivered} ${tr("delivered")}`} />
        <Stat label={tr("Read rate")} value={rate(a.totals.read_rate)} hint={tr("Only when the person has read receipts on")} />
        <Stat label={tr("Failed")} value={a.totals.failed} hint={a.totals.failure_rate !== null ? `${a.totals.failure_rate}%` : undefined} />
        <Stat label={tr("Waiting to send")} value={o.messages.waiting} />
        <Stat label={tr("Running campaigns")} value={o.campaigns.running} />
        <Stat label={tr("Eligible contacts")} value={o.contacts.eligible} hint={`${tr("of")} ${o.contacts.total} ${tr("contacts")}`} />
        <Stat label={tr("Opted out")} value={o.contacts.opted_out} hint={`${o.suppressed} ${tr("on the suppression list")}`} />
      </div>
      <Card><CardContent className="p-3 sm:p-4">
        <p className="mb-2 text-sm font-medium">{tr("Messages per day")}</p>
        <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={a.daily} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="submitted" name={tr("Submitted")} stroke="#2563eb" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="delivered" name={tr("Delivered")} stroke="#16a34a" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="read" name={tr("Read")} stroke="#9333ea" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="failed" name={tr("Failed")} stroke="#dc2626" dot={false} strokeWidth={2} />
        </LineChart></ResponsiveContainer></div>
      </CardContent></Card>
      {table(tr("By template"), a.by_template)}
      {table(tr("By purpose"), a.by_purpose)}
      {a.top_errors.length > 0 && <div className="rounded-md border p-3 text-sm"><p className="mb-1 font-medium">{tr("Why messages failed")}</p>{a.top_errors.map((e, i) => <p key={i} className="flex justify-between gap-3"><span className="min-w-0 break-words">{e.code && <b>{e.code} · </b>}{e.message}</span><span className="tabular-nums">{e.count}</span></p>)}</div>}
      <p className="text-xs text-muted-foreground">{a.note}</p>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------------------------------------- fields
const FIELD_TYPES: Array<[string, string]> = [["text", "Text"], ["number", "Number"], ["date", "Date"], ["boolean", "Yes / No"]];

export function FieldsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ key: "", label: "", field_type: "text", default_value: "", required: false });
  const list = useQuery({ queryKey: ["wa-campaigns", "fields"], queryFn: async () => (await waCampaignsApi.fields()).data });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["wa-campaigns", "fields"] });
  const add = async (d = draft) => {
    const res = await waCampaignsApi.addField(d as never);
    if (res.success) { setDraft({ key: "", label: "", field_type: "text", default_value: "", required: false }); refresh(); toast({ title: tr("Field added") }); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{tr("Define the extra details you keep about contacts (business name, plan, renewal date…). Use them in campaign messages and when importing contacts.")}</p>
      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-6">
        <Input className="sm:col-span-2" placeholder={tr("Name, e.g. renewal_date")} value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} />
        <Input className="sm:col-span-2" placeholder={tr("Label, e.g. Renewal date")} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Select value={draft.field_type} onValueChange={(v) => setDraft({ ...draft, field_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIELD_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{tr(l)}</SelectItem>)}</SelectContent></Select>
        <Button disabled={!draft.key.trim() || !draft.label.trim()} onClick={() => void add()}><Plus className="mr-1 h-4 w-4" />{tr("Add")}</Button>
        <Input className="sm:col-span-3" placeholder={tr("Use this when a contact has no value (optional)")} value={draft.default_value} onChange={(e) => setDraft({ ...draft, default_value: e.target.value })} />
        <label className="flex items-center gap-2 text-sm sm:col-span-3"><Checkbox checked={draft.required} onCheckedChange={(v) => setDraft({ ...draft, required: v === true })} />{tr("Required: leave out contacts without it")}</label>
      </div>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2.5">{tr("Label")}</th><th className="p-2.5">{tr("Name")}</th><th className="p-2.5">{tr("Type")}</th><th className="p-2.5">{tr("Fallback")}</th><th className="p-2.5">{tr("Required")}</th><th className="p-2.5" /></tr></thead>
        <tbody>{!list.data?.results.length ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{list.isLoading ? tr("Loading…") : tr("No custom fields yet.")}</td></tr> : list.data.results.map((f) => (
          <tr key={f.id} className="border-t"><td className="p-2.5 font-medium">{f.label}</td><td className="p-2.5 text-xs text-muted-foreground">{f.key}</td><td className="p-2.5">{tr(FIELD_TYPES.find(([v]) => v === f.field_type)?.[1] ?? f.field_type)}</td>
            <td className="p-2.5 text-xs">{f.default_value || "—"}</td><td className="p-2.5">{f.required ? tr("Yes") : "—"}</td>
            <td className="p-2.5 text-right"><Button size="icon" variant="ghost" aria-label={tr("Remove")} onClick={async () => { const r = await waCampaignsApi.removeField(f.id); if (r.success) refresh(); else toast({ title: errorOf(r), variant: "destructive" }); }}><Trash2 className="h-4 w-4" /></Button></td></tr>))}</tbody></table></div>
      {(list.data?.discovered.length ?? 0) > 0 && (
        <div className="rounded-md border p-3"><p className="mb-2 text-sm font-medium">{tr("Details your contacts already have")}</p>
          <div className="flex flex-wrap gap-2">{list.data!.discovered.map((d) => (
            <Button key={d.key} size="sm" variant="outline" onClick={() => void add({ key: d.key, label: d.key.replace(/_/g, " "), field_type: "text", default_value: "", required: false })}><Plus className="mr-1 h-3.5 w-3.5" />{d.key} <span className="ml-1 text-muted-foreground">({d.contacts})</span></Button>))}</div></div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------------------------------------------------------- import
type Step = "upload" | "map" | "check" | "done";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<ImportInfo | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sample, setSample] = useState<string[][]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState("skip");
  const [tag, setTag] = useState("");
  const [consent, setConsent] = useState(false);
  const [check, setCheck] = useState<ImportCheck | null>(null);

  useEffect(() => { if (open) { setStep("upload"); setInfo(null); setCheck(null); setMapping({}); setTag(""); setConsent(false); setDuplicates("skip"); } }, [open]);
  useEffect(() => {  // follow a big import running in the background
    if (step !== "done" || !info || info.status !== "running") return;
    const timer = setInterval(async () => { const r = await waCampaignsApi.importInfo(info.id); if (r.success && r.data) setInfo(r.data.import); }, 2500);
    return () => clearInterval(timer);
  }, [step, info]);

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const res = await waCampaignsApi.uploadImport(file);
    setBusy(false);
    if (!res.ok) { toast({ title: res.body.message || tr("This file could not be used."), variant: "destructive" }); return; }
    setInfo(res.body.import); setColumns(res.body.columns); setSample(res.body.sample); setTargets(res.body.targets); setMapping(res.body.mapping); setStep("map");
  };
  const options = () => ({ duplicates, tag: tag.trim(), consent_confirmed: consent });
  const runCheck = async () => {
    if (!info) return;
    setBusy(true);
    const res = await waCampaignsApi.validateImport(info.id, mapping, options());
    setBusy(false);
    if (res.success && res.data) { setCheck(res.data); setStep("check"); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  const confirm = async () => {
    if (!info) return;
    setBusy(true);
    const res = await waCampaignsApi.commitImport(info.id);
    setBusy(false);
    if (res.success && res.data) { setInfo(res.data.import); setStep("done"); void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  const hasPhone = Object.values(mapping).includes("phone");
  const titles: Record<Step, string> = { upload: tr("Upload a file"), map: tr("Match the columns"), check: tr("Check and confirm"), done: tr("Result") };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b p-4 text-left"><DialogTitle>{tr("Import contacts")}</DialogTitle><DialogDescription>{titles[step]}</DialogDescription></DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {step === "upload" && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-accent/40">
                {busy ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <FileUp className="h-8 w-8 text-muted-foreground" />}
                <span className="font-medium">{tr("Choose a CSV or Excel file")}</span><span className="text-xs text-muted-foreground">{tr("Up to 10 MB and 100,000 contacts. The first row must be the column names.")}</span>
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={(e) => { void chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
              <p className="text-xs text-muted-foreground">{tr("Numbers are converted to international format (+255…). Nothing is saved until you confirm.")}</p>
            </>
          )}
          {step === "map" && info && (
            <>
              <p className="text-sm">{info.filename} · {info.total_rows} {tr("rows")}</p>
              <div className="space-y-2">{columns.map((col, i) => (
                <div key={col + i} className="grid items-center gap-2 rounded-md border p-2 sm:grid-cols-2">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{col}</p><p className="truncate text-xs text-muted-foreground">{sample.slice(0, 3).map((r) => r[i]).filter(Boolean).join(" · ") || "—"}</p></div>
                  <Select value={mapping[col] ?? "__none__"} onValueChange={(v) => setMapping((m) => { const next = { ...m }; if (v === "__none__") delete next[col]; else { for (const k of Object.keys(next)) if (next[k] === v) delete next[k]; next[col] = v; } return next; })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">{tr("Do not import")}</SelectItem>{Object.entries(targets).map(([v, l]) => <SelectItem key={v} value={v}>{v.startsWith("attr:") || !(l in BUILTIN_SW) ? l : tr(l)}</SelectItem>)}</SelectContent></Select>
                </div>))}</div>
              {!hasPhone && <p className="text-sm text-destructive">{tr("Choose which column holds the phone number.")}</p>}
              <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>{tr("If a number is already in your contacts")}</Label>
                  <Select value={duplicates} onValueChange={setDuplicates}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="skip">{tr("Keep the existing contact")}</SelectItem><SelectItem value="update">{tr("Update it with this file")}</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="imp-tag">{tr("Add everyone to a list (tag)")}</Label><Input id="imp-tag" value={tag} maxLength={64} onChange={(e) => setTag(e.target.value)} placeholder={tr("e.g. Eid 2026")} /></div>
                <label className="flex items-start gap-2 text-sm sm:col-span-2"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" /><span>{tr("I confirm these people agreed to receive messages from my business.")} <span className="text-muted-foreground">{tr("This records their permission for marketing campaigns. Leave it off if you are not sure.")}</span></span></label>
              </div>
            </>
          )}
          {step === "check" && check && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label={tr("Rows in file")} value={check.total} /><Stat label={tr("New contacts")} value={check.created} /><Stat label={tr("Updated")} value={check.updated} /><Stat label={tr("Not imported")} value={check.invalid + check.skipped} /></div>
              {check.errors.length > 0 && (
                <div className="space-y-1.5"><p className="text-sm font-medium">{tr("Rows that will not be imported")}</p>
                  <div className="max-h-56 overflow-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2">{tr("Row")}</th><th className="p-2">{tr("Number")}</th><th className="p-2">{tr("Reason")}</th></tr></thead>
                    <tbody>{check.errors.map((e, i) => <tr key={i} className="border-t"><td className="p-2 tabular-nums">{e.row}</td><td className="p-2">{e.phone || "—"}</td><td className="p-2 text-xs">{e.reason}</td></tr>)}</tbody></table></div>
                  {check.invalid + check.skipped > check.errors.length && <p className="text-xs text-muted-foreground">{tr("Showing the first rows. The full list is in the report after you confirm.")}</p>}</div>
              )}
              {check.created + check.updated === 0 && <p className="flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{tr("Nothing would be imported. Go back and check the column choices.")}</p>}
            </>
          )}
          {step === "done" && info && (
            <div className="space-y-3 text-center">
              {info.status === "running" ? <><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /><p className="font-medium">{tr("Importing in the background…")}</p><Progress value={info.total_rows ? (info.processed_rows / info.total_rows) * 100 : 5} className="h-2" /></>
                : info.status === "failed" ? <><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="font-medium">{tr("The import failed")}</p><p className="text-sm text-muted-foreground">{info.failure}</p></>
                : <><CheckCircle2 className="mx-auto h-8 w-8 text-green-600" /><p className="font-medium">{tr("Import finished")}</p>
                  <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-4"><Stat label={tr("New contacts")} value={info.created} /><Stat label={tr("Updated")} value={info.updated} /><Stat label={tr("Kept as they were")} value={info.skipped} /><Stat label={tr("Invalid")} value={info.invalid} /></div>
                  {info.has_errors && <Button variant="outline" onClick={() => void waCampaignsApi.downloadImportErrors(info.id)}><Download className="mr-1 h-4 w-4" />{tr("Download the rows that were not imported")}</Button>}</>}
            </div>
          )}
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 border-t p-3 sm:justify-between">
          <Button variant="ghost" disabled={busy} onClick={step === "check" ? () => setStep("map") : step === "map" ? () => setStep("upload") : onClose}>{step === "upload" || step === "done" ? tr("Close") : tr("Back")}</Button>
          {step === "map" && <Button disabled={busy || !hasPhone} onClick={() => void runCheck()}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{tr("Check the file")}</Button>}
          {step === "check" && <Button disabled={busy || !check || check.created + check.updated === 0} onClick={() => void confirm()}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{tr("Confirm import")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// Built-in column targets as the server names them, so the English label can be translated (custom fields keep the label their owner gave them).
const BUILTIN_SW: Record<string, true> = {
  "Phone number": true, "Full name": true, "First name": true, "Last name": true, "Email": true, "Tags (comma separated)": true, "Company name": true, "Business name": true, "Country": true, "Preferred language": true,
};

export function ContactsPanel() {
  const [importing, setImporting] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"><div><p className="font-medium">{tr("Import contacts")}</p><p className="text-sm text-muted-foreground">{tr("Upload a CSV or Excel file, match its columns, check it, then confirm.")}</p></div>
        <Button onClick={() => setImporting(true)}><FileUp className="mr-1 h-4 w-4" />{tr("Import a file")}</Button></div>
      <FieldsPanel />
      <ImportDialog open={importing} onClose={() => setImporting(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------- settings
export function SettingsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["wa-campaigns", "settings"], queryFn: async () => (await waCampaignsApi.settings()).data?.settings });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    const s = q.data;
    if (s) setForm({ monthly_message_limit: s.monthly_message_limit?.toString() ?? "", per_campaign_limit: s.per_campaign_limit?.toString() ?? "", unit_cost: s.unit_cost ? String(Number(s.unit_cost)) : "", currency: s.currency, monthly_budget: s.monthly_budget ? String(Number(s.monthly_budget)) : "", alert_percent: String(s.alert_percent) });
  }, [q.data]);
  if (!q.data) return <p className="p-6 text-sm text-muted-foreground">{tr("Loading…")}</p>;
  const s = q.data;
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    const res = await waCampaignsApi.saveSettings({ ...form });
    if (res.success) { toast({ title: tr("Saved") }); void qc.invalidateQueries({ queryKey: ["wa-campaigns", "settings"] }); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  const used = s.monthly_message_limit ? Math.min(100, Math.round((s.used_this_month / s.monthly_message_limit) * 100)) : 0;
  const field = (k: string, label: string, hint?: string, type = "number") => (
    <div className="space-y-1.5"><Label htmlFor={`st-${k}`}>{label}</Label><Input id={`st-${k}`} type={type} inputMode={type === "number" ? "decimal" : undefined} min={0} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} />{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
  );
  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-3"><Stat label={tr("Messages this month")} value={s.used_this_month} hint={s.monthly_message_limit ? `${tr("of")} ${s.monthly_message_limit}` : tr("No limit set")} />
        <Stat label={tr("Spent this month (at your rate)")} value={s.spent_this_month ? `${s.spent_this_month} ${s.currency}` : "—"} hint={s.unit_cost ? undefined : tr("Enter your cost per message to see this")} /></div>
      {s.monthly_message_limit ? <Progress value={used} className="h-2" /> : null}
      <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
        {field("monthly_message_limit", tr("Most messages per month"), tr("Leave empty for no limit."))}
        {field("per_campaign_limit", tr("Most recipients in one campaign"), tr("Leave empty for no limit."))}
        {field("unit_cost", tr("Your cost per message"), tr("WhatsApp does not tell us its price, so enter the rate you pay. It is only used for estimates."))}
        {field("currency", tr("Currency"), undefined, "text")}
        {field("monthly_budget", tr("Most to spend per month"), tr("Needs your cost per message."))}
        {field("alert_percent", tr("Email the owners at (%)"), tr("When a limit is this far used."))}
      </div>
      <Button onClick={() => void save()}>{tr("Save")}</Button>
      <p className="text-xs text-muted-foreground">{tr("A campaign that would go over a limit is stopped before it starts, and you are told why.")}</p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------------------------------------ schedules
const FREQ: Record<string, string> = { daily: "Every day", weekly: "Every week", monthly: "Every month" };

export function SchedulesPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["wa-campaigns", "recurring"], queryFn: async () => (await waCampaignsApi.recurring()).data?.results ?? [] });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["wa-campaigns", "recurring"] });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{tr("Repeating campaigns send again on a schedule. Each time it checks opt-outs, limits and credits afresh. Make one from a draft campaign: choose “Repeat” in the last step.")}</p>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2.5">{tr("Campaign")}</th><th className="p-2.5">{tr("Repeats")}</th><th className="p-2.5">{tr("Next")}</th><th className="p-2.5">{tr("Sent")}</th><th className="p-2.5" /></tr></thead>
        <tbody>{!q.data?.length ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{q.isLoading ? tr("Loading…") : tr("No repeating campaigns.")}</td></tr> : q.data.map((r) => (
          <tr key={r.id} className="border-t"><td className="p-2.5"><p className="font-medium">{r.name}</p>{r.last_error && <p className="text-xs text-destructive">{r.last_error}</p>}</td>
            <td className="p-2.5">{r.interval > 1 ? `${tr("Every")} ${r.interval} ` : ""}{tr(FREQ[r.frequency] ?? r.frequency)}</td><td className="whitespace-nowrap p-2.5 text-xs">{r.active ? when(r.next_run_at) : tr("Paused")}</td><td className="p-2.5 tabular-nums">{r.run_count}</td>
            <td className="whitespace-nowrap p-2.5 text-right">
              <Button size="icon" variant="ghost" aria-label={r.active ? tr("Pause") : tr("Resume")} onClick={async () => { const x = await waCampaignsApi.setRecurring(r.id, !r.active); if (x.success) refresh(); else toast({ title: errorOf(x), variant: "destructive" }); }}>{r.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
              <Button size="icon" variant="ghost" aria-label={tr("Remove")} onClick={async () => { const x = await waCampaignsApi.removeRecurring(r.id); if (x.success) refresh(); else toast({ title: errorOf(x), variant: "destructive" }); }}><Trash2 className="h-4 w-4" /></Button></td></tr>))}</tbody></table></div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------- automations
const AUTOMATION_RUN_LABELS: Array<[string, string]> = [["submitted", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["failed", "Failed"], ["skipped", "Skipped"], ["pending", "Waiting"]];

export function AutomationsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const list = useQuery({ queryKey: ["wa-campaigns", "automations"], queryFn: async () => { const r = await waCampaignsApi.automations(); if (!r.success) throw new Error(errorOf(r)); return r.data; } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["wa-campaigns", "automations"] });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="max-w-xl text-sm text-muted-foreground">{tr("Automatic WhatsApp messages to SENDA users when something happens: they register, stop using SENDA, run low on credits or buy credits. Each person gets a rule's message at most once per cooldown, and never if they opted out.")}</p>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" />{tr("New automation")}</Button></div>
      {list.isError ? <p className="rounded-md border p-4 text-sm text-destructive">{(list.error as Error).message}</p> : (
        <div className="space-y-2">{!list.data?.results.length ? <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{list.isLoading ? tr("Loading…") : tr("No automations yet.")}</p> : list.data.results.map((a) => (
          <div key={a.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{tr(a.trigger_label)}{a.threshold ? ` (${a.threshold})` : ""} · {a.template_name}{a.delay_minutes ? ` · ${tr("after")} ${a.delay_minutes} ${tr("min")}` : ""}</p></div>
              <div className="flex items-center gap-1"><Button size="sm" variant={a.active ? "default" : "outline"} onClick={async () => { const r = await waCampaignsApi.setAutomation(a.id, !a.active); if (r.success) refresh(); else toast({ title: errorOf(r), variant: "destructive" }); }}>{a.active ? tr("On") : tr("Off")}</Button>
                <Button size="icon" variant="ghost" aria-label={tr("Remove")} onClick={async () => { const r = await waCampaignsApi.removeAutomation(a.id); if (r.success) refresh(); }}><Trash2 className="h-4 w-4" /></Button></div></div>
            <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">{AUTOMATION_RUN_LABELS.filter(([k]) => a.runs[k]).map(([k, l]) => <span key={k}>{tr(l)}: {a.runs[k]}</span>)}</p>
          </div>))}</div>)}
      <AutomationDialog open={creating} onClose={() => setCreating(false)} triggers={list.data?.triggers ?? []} onDone={() => { setCreating(false); refresh(); }} />
    </div>
  );
}

function AutomationDialog({ open, onClose, triggers, onDone }: { open: boolean; onClose: () => void; triggers: Array<{ trigger: string; label: string; scanned: boolean }>; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", trigger: "user_registered", threshold: "0", delay_minutes: "0", cooldown_hours: "168", phone_number_id: "" });
  const [template, setTemplate] = useState<WaTemplate | null>(null);
  const [map, setMap] = useState<ParamMapEntry[]>([]);
  const numbers = useQuery({ queryKey: ["wa-campaigns", "numbers"], queryFn: async () => (await waCampaignsApi.numbers()).data?.results ?? [], enabled: open });
  const templates = useQuery({ queryKey: ["wa-campaigns", "templates", f.phone_number_id], enabled: open && !!f.phone_number_id, retry: false, queryFn: async () => (await waCampaignsApi.templates(f.phone_number_id)).data?.results ?? [] });
  useEffect(() => { if (open) { setTemplate(null); setMap([]); } }, [open]);
  useEffect(() => { if (open && !f.phone_number_id && numbers.data?.length) setF((s) => ({ ...s, phone_number_id: numbers.data![0].phone_number_id })); }, [open, numbers.data, f.phone_number_id]);
  const needsN = triggers.find((t) => t.trigger === f.trigger)?.scanned;
  const sources = [["attr:first_name", "First name"], ["attr:last_name", "Last name"], ["attr:business_name", "Business name"], ["attr:credits_balance", "Credits balance"], ["attr:registration_date", "Registration date"], ["attr:last_login_date", "Last sign-in date"], ["name", "Full name"]];
  const save = async () => {
    const res = await waCampaignsApi.addAutomation({ ...f, threshold: Number(f.threshold), delay_minutes: Number(f.delay_minutes), cooldown_hours: Number(f.cooldown_hours), template_name: template?.name, language_code: template?.language, param_map: map });
    if (res.success) { toast({ title: tr("Automation created. Switch it on when you are ready.") }); onDone(); } else toast({ title: errorOf(res), variant: "destructive" });
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b p-4 text-left"><DialogTitle>{tr("New automation")}</DialogTitle><DialogDescription>{tr("It is created switched off.")}</DialogDescription></DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="space-y-1.5"><Label htmlFor="au-name">{tr("Name")}</Label><Input id="au-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={tr("Welcome message")} /></div>
          <div className="space-y-1.5"><Label>{tr("Send when")}</Label><Select value={f.trigger} onValueChange={(v) => setF({ ...f, trigger: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{triggers.map((t) => <SelectItem key={t.trigger} value={t.trigger}>{tr(t.label)}</SelectItem>)}</SelectContent></Select></div>
          {needsN && <div className="space-y-1.5"><Label htmlFor="au-n">{tr("N (hours, days or credits, as the rule says)")}</Label><Input id="au-n" type="number" min={0} value={f.threshold} onChange={(e) => setF({ ...f, threshold: e.target.value })} /></div>}
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="au-d">{tr("Wait (minutes)")}</Label><Input id="au-d" type="number" min={0} value={f.delay_minutes} onChange={(e) => setF({ ...f, delay_minutes: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="au-c">{tr("Same person at most once per (hours)")}</Label><Input id="au-c" type="number" min={0} value={f.cooldown_hours} onChange={(e) => setF({ ...f, cooldown_hours: e.target.value })} /></div></div>
          <div className="space-y-1.5"><Label>{tr("Send from")}</Label><Select value={f.phone_number_id || undefined} onValueChange={(v) => { setF({ ...f, phone_number_id: v }); setTemplate(null); }}><SelectTrigger><SelectValue placeholder={tr("Choose a number")} /></SelectTrigger><SelectContent>{(numbers.data ?? []).map((n) => <SelectItem key={n.phone_number_id} value={n.phone_number_id}>{n.label} · {n.phone_number_id}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>{tr("Approved template")}</Label><div className="max-h-40 space-y-1.5 overflow-y-auto">{(templates.data ?? []).map((t) => (
            <button type="button" key={`${t.name}-${t.language}`} disabled={!t.supported} onClick={() => { setTemplate(t); setMap(t.tokens.map((tok) => ({ token: tok, source: "attr:first_name", default: "" }))); }}
              className={cn("w-full rounded-md border p-2 text-left text-sm", template?.name === t.name && template.language === t.language ? "border-primary bg-primary/5" : "hover:bg-accent/40", !t.supported && "opacity-50")}><span className="font-medium">{t.name}</span> <span className="text-xs text-muted-foreground">{t.language}</span><span className="line-clamp-2 block text-xs text-muted-foreground">{t.body}</span></button>))}</div></div>
          {template && map.map((m) => (
            <div key={m.token} className="grid items-center gap-2 sm:grid-cols-[4rem,1fr]"><span className="text-sm font-medium">{`{{${m.token}}}`}</span>
              <Select value={m.source} onValueChange={(v) => setMap((cur) => cur.map((x) => (x.token === m.token ? { ...x, source: v } : x)))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sources.map(([v, l]) => <SelectItem key={v} value={v}>{tr(l)}</SelectItem>)}</SelectContent></Select></div>))}
        </div>
        <DialogFooter className="flex-row justify-between gap-2 border-t p-3 sm:justify-between"><Button variant="ghost" onClick={onClose}>{tr("Cancel")}</Button><Button disabled={!f.name.trim() || !template} onClick={() => void save()}>{tr("Create")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

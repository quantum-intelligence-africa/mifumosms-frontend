// The Send section of Team Inbox: start a conversation from an approved WhatsApp template, to one person or to many, with a clear preview of exactly
// what they will receive. One person is sent straight away (and opens as a chat). Many people go through WhatsApp campaigns, so consent, opt-outs,
// limits, credits and a delivery report all apply; each message also appears in that person's chat, where replies will arrive.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCheck, CheckCircle2, ExternalLink, Loader2, MessageSquarePlus, Search, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { tr } from "@/i18n/waCampaigns";
import { cn } from "@/lib/utils";
import { getHighestRole } from "@/utils/roleUtils";
import { errorCode, teamInboxApi, type InboxTemplate, type OutboundCheck } from "@/services/teamInboxApi";
import { waCampaignsApi, type Campaign, type ParamMapEntry, type Preview } from "@/services/waCampaignsApi";

const token = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(16).slice(2)}`);
const SOURCES: Array<[string, string]> = [["name", "Contact name"], ["phone", "Phone number"], ["email", "Email"], ["attr", "Custom field…"], ["static", "Same text for everyone…"]];
const kindOf = (source: string) => (source.startsWith("attr:") ? "attr" : source.startsWith("static:") ? "static" : source);
const messageOf = (res: { message?: string; errors?: unknown }) => ((res.errors ?? {}) as { message?: string }).message || res.message || tr("Something went wrong. Try again.");

/** The template text with each {{n}} replaced by what has been typed: filled values are highlighted, empty ones stay visible so nothing is missed. */
function Filled({ text, values }: { text: string; values: string[] }) {
  const parts = text.split(/(\{\{\s*\d+\s*\}\})/g);
  return (
    <>{parts.map((part, i) => {
      const m = part.match(/^\{\{\s*(\d+)\s*\}\}$/);
      if (!m) return <span key={i}>{part}</span>;
      const value = values[Number(m[1]) - 1];
      return value ? <mark key={i} className="rounded bg-emerald-200/70 px-0.5 text-inherit dark:bg-emerald-700/50">{value}</mark> : <span key={i} className="rounded bg-amber-200 px-0.5 text-amber-900">{part}</span>;
    })}</>
  );
}

/** What the person will see on their phone. */
function Bubble({ template, values, headerValue, to, text }: { template: InboxTemplate | null; values: string[]; headerValue: string; to: string; text?: string }) {
  if (!template) return <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{tr("Choose a template to see the message.")}</div>;
  return (
    <div className="rounded-xl bg-[#e5ddd5] p-3 dark:bg-[#0b141a]">
      <p className="mb-2 text-center text-[11px] text-[#54656f] dark:text-[#8696a0]">{to}</p>
      <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-2 text-sm text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
        {template.header && <p className="mb-1 font-semibold"><Filled text={template.header} values={[headerValue]} /></p>}
        <p className="whitespace-pre-wrap break-words">{text !== undefined ? text : <Filled text={template.body} values={values} />}</p>
        {template.footer && <p className="mt-1 text-xs opacity-60">{template.footer}</p>}
        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#667781] dark:text-[#8696a0]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<CheckCheck className="h-3.5 w-3.5" /></p>
        {template.buttons.length > 0 && (
          <div className="-mx-2.5 -mb-2 mt-1.5 divide-y divide-black/10 border-t border-black/10 dark:divide-white/15 dark:border-white/15">
            {template.buttons.map((b, i) => <span key={i} className="block px-3 py-2 text-center text-sm font-medium text-[#027eb5] dark:text-[#53bdeb]">{b}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props { onOpenThread: (threadId: string) => void }

export function SendPanel({ onOpenThread }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = getHighestRole(user);
  const canBulk = role === "owner" || role === "admin";
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [numberId, setNumberId] = useState("");
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState<InboxTemplate | null>(null);
  // single
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [values, setValues] = useState<string[]>([]);
  const [headerValue, setHeaderValue] = useState("");
  const [check, setCheck] = useState<OutboundCheck | null>(null);
  const [checking, setChecking] = useState(false);
  // bulk
  const [audience, setAudience] = useState<"all" | "tags" | "phones">("phones");
  const [tags, setTags] = useState("");
  const [pasted, setPasted] = useState("");
  const [consent, setConsent] = useState(false);
  const [map, setMap] = useState<ParamMapEntry[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [sample, setSample] = useState(0);
  const draftId = useRef<string | null>(null);
  const launched = useRef(false);
  // sending
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState<{ threadId: string } | null>(null);
  const [running, setRunning] = useState<Campaign | null>(null);
  const clientToken = useRef(token());
  const launchToken = useRef(token());

  const numbers = useQuery_({ key: "numbers", load: async () => (await teamInboxApi.outboundNumbers()).data?.results ?? [] });
  const templates = useQuery_({ key: `templates:${numberId}`, enabled: !!numberId, load: async () => { const r = await teamInboxApi.outboundTemplates(numberId); if (!r.success) throw new Error(messageOf(r)); return r.data?.results ?? []; } });
  useEffect(() => { if (!numberId && numbers.data?.length === 1) setNumberId(numbers.data[0].phone_number_id); }, [numbers.data, numberId]);

  const isMarketing = (template?.category ?? "").toLowerCase() === "marketing";
  const bulkBlocked = mode === "bulk" && !!template && template.header_variables > 0;
  const filtered = useMemo(() => (templates.data ?? []).filter((t) => `${t.name} ${t.body}`.toLowerCase().includes(query.trim().toLowerCase())), [templates.data, query]);

  const choose = (t: InboxTemplate) => {
    setTemplate(t); setValues(Array(t.body_variables).fill("")); setHeaderValue(""); setPreview(null); setSample(0);
    setMap(Array.from({ length: t.body_variables }, (_, i) => ({ token: String(i + 1), source: i === 0 ? "name" : "", default: "" })));
  };
  useEffect(() => { setTemplate(null); setPreview(null); }, [numberId]);

  // single: look the number up as it is typed
  useEffect(() => {
    setCheck(null);
    if (mode !== "single" || !numberId || phone.replace(/\D/g, "").length < 8) return;
    setChecking(true);
    const timer = setTimeout(async () => {
      const res = await teamInboxApi.outboundCheck(numberId, phone);
      setChecking(false);
      if (res.success && res.data) { setCheck(res.data); if (res.data.name && !name) setName(res.data.name); }
    }, 500);
    return () => { clearTimeout(timer); setChecking(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, numberId, mode]);

  const list = (s: string) => s.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const bulkDraft = () => ({
    name: `Quick send · ${template?.name ?? ""} · ${new Date().toLocaleDateString()}`, purpose: isMarketing ? "marketing" : "account", phone_number_id: numberId, template_name: template?.name ?? "",
    language_code: template?.language ?? "en", param_map: map, consent_attested: consent, min_hours_between_marketing: 24,
    audience: audience === "all" ? { all: true } : audience === "tags" ? { tags: list(tags) } : { phones: list(pasted) },
  });
  const bulkReady = mode === "bulk" && !!template && !bulkBlocked && map.every((m) => !!m.source && m.source !== "attr:" && m.source !== "static:")
    && (audience === "all" || (audience === "tags" ? tags.trim() !== "" : pasted.trim() !== ""));

  // bulk: keep one draft and refresh the server's preview (who gets it, who is left out and why, real rendered examples) as things change
  useEffect(() => {
    if (!bulkReady) { setPreview(null); return; }
    setPreviewing(true);
    const timer = setTimeout(async () => {
      const body = bulkDraft();
      let id = draftId.current;
      const saved = id ? await waCampaignsApi.update(id, body) : await waCampaignsApi.create(body);
      if (!saved.success || !saved.data) { setPreviewing(false); setPreview(null); setPreviewError(messageOf(saved)); return; }
      id = saved.data.campaign.id; draftId.current = id;
      const res = await waCampaignsApi.preview({ campaign_id: id });
      setPreviewing(false);
      if (res.success && res.data) { setPreview(res.data); setPreviewError(""); setSample(0); } else { setPreview(null); setPreviewError(messageOf(res)); }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkReady, mode, numberId, template?.name, JSON.stringify(map), audience, tags, pasted, consent]);
  useEffect(() => () => { if (draftId.current && !launched.current) void waCampaignsApi.remove(draftId.current); }, []);

  // follow a bulk send
  useEffect(() => {
    if (!running || !["queued", "sending", "scheduled"].includes(running.status)) return;
    const timer = setInterval(async () => { const r = await waCampaignsApi.get(running.id); if (r.success && r.data) setRunning(r.data.campaign); }, 3000);
    return () => clearInterval(timer);
  }, [running]);

  const singleReady = mode === "single" && !!template && template.supported && check?.valid === true && !check.blocked
    && values.length === template.body_variables && values.every((v) => v.trim()) && (template.header_variables === 0 || headerValue.trim() !== "");

  const sendOne = async () => {
    if (!template) return;
    setSending(true);
    const res = await teamInboxApi.outboundSend({ phone_number_id: numberId, phone, name, template_name: template.name, language: template.language, variables: values, header_variables: template.header_variables ? [headerValue] : [], client_token: clientToken.current });
    setSending(false);
    const body = (res.data ?? res.errors) as { thread_id?: string; message?: { status?: string; error?: string } } | null;
    if (res.success && body?.thread_id) { setDone({ threadId: body.thread_id }); toast({ title: tr("Message sent") }); return; }
    if (body?.thread_id) { setDone({ threadId: body.thread_id }); toast({ title: messageOf(res), variant: "destructive" }); return; }
    toast({ title: errorCode(res) === "opted_out" ? tr("This person opted out of messages from your business.") : messageOf(res), variant: "destructive" });
  };

  const sendMany = async () => {
    if (!draftId.current || !preview) return;
    setSending(true);
    const res = await waCampaignsApi.launch(draftId.current, { launch_token: launchToken.current, confirm_recipients: preview.eligible });
    setSending(false);
    if (res.success && res.data) { launched.current = true; setConfirmOpen(false); setRunning(res.data.campaign); toast({ title: tr("Sending started") }); return; }
    toast({ title: messageOf(res), variant: "destructive" }); setConfirmOpen(false);
  };

  const reset = () => {
    setDone(null); setRunning(null); setPhone(""); setName(""); setCheck(null); setValues(template ? Array(template.body_variables).fill("") : []); setHeaderValue(""); setPreview(null);
    clientToken.current = token(); launchToken.current = token(); draftId.current = null; launched.current = false;
  };

  const toLabel = mode === "single" ? (check?.valid ? `${tr("To")} +${check.phone}${name ? ` · ${name}` : ""}` : tr("To the person you choose")) : preview ? `${tr("To")} ${preview.samples[sample]?.name || preview.samples[sample]?.phone || tr("each person")}` : tr("To each person");
  const bubbleText = mode === "bulk" && preview?.samples[sample] ? preview.samples[sample].text : undefined;

  if (done || running) {
    const s = running?.stats;
    return (
      <div className="mx-auto w-full max-w-xl space-y-4 p-4 sm:p-8">
        <div className="space-y-3 rounded-xl border p-5 text-center">
          {done ? <><CheckCircle2 className="mx-auto h-10 w-10 text-green-600" /><p className="text-lg font-semibold">{tr("Message sent")}</p><p className="text-sm text-muted-foreground">{tr("It is in the chat now. When the person replies, the reply arrives there.")}</p>
              <div className="flex flex-wrap justify-center gap-2"><Button onClick={() => onOpenThread(done.threadId)}><MessageSquarePlus className="mr-1 h-4 w-4" />{tr("Open the chat")}</Button><Button variant="outline" onClick={reset}>{tr("Send another")}</Button></div></>
            : running && s && <>
              <Users className="mx-auto h-9 w-9 text-primary" /><p className="text-lg font-semibold">{running.status === "completed" ? tr("Sending finished") : running.status === "failed" ? tr("Sending failed") : tr("Sending…")}</p>
              <Progress value={s.recipients ? ((s.submitted + s.failed) / s.recipients) * 100 : 0} className="h-2" />
              <div className="grid grid-cols-4 gap-2 text-left text-sm"><div><p className="text-xs text-muted-foreground">{tr("People")}</p><b>{s.recipients}</b></div><div><p className="text-xs text-muted-foreground">{tr("Sent")}</p><b>{s.submitted}</b></div><div><p className="text-xs text-muted-foreground">{tr("Delivered")}</p><b>{s.delivered}</b></div><div><p className="text-xs text-muted-foreground">{tr("Failed")}</p><b>{s.failed}</b></div></div>
              {running.failure_reason && <p className="text-sm text-destructive">{running.failure_reason}</p>}
              <p className="text-xs text-muted-foreground">{tr("Each message also appears in that person's chat. Replies arrive there.")}</p>
              <div className="flex flex-wrap justify-center gap-2"><Button asChild variant="outline"><Link to={`/whatsapp/campaigns?c=${running.id}`}><ExternalLink className="mr-1 h-4 w-4" />{tr("Open the full report")}</Link></Button><Button variant="outline" onClick={reset}>{tr("Send another")}</Button></div></>}
        </div>
      </div>
    );
  }

  const step = (n: number, title: string, children: React.ReactNode) => (
    <section className="space-y-2 rounded-xl border p-3 sm:p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{n}</span>{title}</h3>{children}</section>
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid w-full max-w-6xl gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr),22rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-lg font-semibold">{tr("Send a message")}</h2><p className="text-sm text-muted-foreground">{tr("Start a chat with an approved WhatsApp template. Replies arrive in your chats.")}</p></div>
            <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label={tr("How many people")}>
              {(["single", "bulk"] as const).map((m) => (
                <button key={m} type="button" disabled={m === "bulk" && !canBulk} title={m === "bulk" && !canBulk ? tr("Only an owner or an admin can send to many people.") : undefined}
                  onClick={() => { setMode(m); setPreview(null); }} className={cn("rounded-md px-3 py-1.5 text-sm disabled:opacity-40", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {m === "single" ? tr("One person") : tr("Many people")}
                </button>))}
            </div>
          </div>

          {step(1, tr("Send from"), numbers.loading ? <p className="text-sm text-muted-foreground">{tr("Loading…")}</p> : !numbers.data?.length ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{tr("No WhatsApp number can send templates yet. Connect one in Settings › WhatsApp.")}</p>
          ) : (
            <Select value={numberId || undefined} onValueChange={setNumberId}><SelectTrigger><SelectValue placeholder={tr("Choose a number")} /></SelectTrigger>
              <SelectContent>{numbers.data.map((n) => <SelectItem key={n.phone_number_id} value={n.phone_number_id}>{n.label} · {n.phone_number_id}</SelectItem>)}</SelectContent></Select>
          ))}

          {step(2, tr("Choose the template"), !numberId ? <p className="text-sm text-muted-foreground">{tr("Choose a number first.")}</p> : templates.loading ? <p className="text-sm text-muted-foreground">{tr("Loading your templates from WhatsApp…")}</p>
            : templates.error ? <p className="text-sm text-destructive">{templates.error}</p> : !templates.data?.length ? <p className="text-sm text-muted-foreground">{tr("No approved templates yet. Create one and wait for WhatsApp to approve it.")}</p> : (
              <>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder={tr("Search templates")} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {filtered.map((t) => {
                    const off = !t.supported || (mode === "bulk" && t.header_variables > 0);
                    return (
                      <button type="button" key={`${t.name}-${t.language}`} disabled={off} onClick={() => choose(t)}
                        className={cn("w-full rounded-lg border p-2.5 text-left transition-colors", template?.name === t.name && template.language === t.language ? "border-primary bg-primary/5" : "hover:bg-accent/40", off && "opacity-50")}>
                        <span className="flex items-center justify-between gap-2"><span className="font-medium">{t.name}</span><span className="text-[11px] text-muted-foreground">{t.language} · {t.category.toLowerCase()}</span></span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{t.body}</span>
                        {off && <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-300">{!t.supported ? t.reason : tr("Its header has a variable. Sending to many people supports variables in the body only.")}</span>}
                      </button>);
                  })}
                  {filtered.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">{tr("Nothing matches your search.")}</p>}
                </div>
              </>))}

          {step(3, mode === "single" ? tr("Who is it for?") : tr("Who is it for?"), mode === "single" ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="sp-phone">{tr("Phone number")}</Label><Input id="sp-phone" inputMode="tel" placeholder="+255712345678" value={phone} onChange={(e) => { setPhone(e.target.value); setDone(null); }} /></div>
                <div className="space-y-1"><Label htmlFor="sp-name">{tr("Name (optional)")}</Label><Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} /></div></div>
              {checking && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{tr("Checking the number…")}</p>}
              {check && !check.valid && <p className="text-sm text-destructive">{tr(check.message ?? "")}</p>}
              {check?.valid && check.blocked && <p className="flex items-start gap-1.5 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{tr(check.message ?? "")}</p>}
              {check?.valid && !check.blocked && <p className="text-xs text-muted-foreground">{check.thread_id ? (check.window_open ? tr("There is an open chat with this person.") : tr("There is an earlier chat with this person. It will continue there.")) : tr("A new chat will be started.")}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="phones">{tr("Numbers I paste")}</SelectItem><SelectItem value="tags">{tr("Contacts with a tag")}</SelectItem><SelectItem value="all">{tr("All my contacts")}</SelectItem></SelectContent></Select>
              {audience === "phones" && <Textarea rows={5} placeholder={"+255712345678\n0754 000 111"} value={pasted} onChange={(e) => setPasted(e.target.value)} aria-label={tr("Phone numbers (one per line)")} />}
              {audience === "tags" && <Input placeholder={tr("vip, dar-es-salaam")} value={tags} onChange={(e) => setTags(e.target.value)} aria-label={tr("Tags (comma separated)")} />}
              <p className="text-xs text-muted-foreground">{tr("People who opted out, are on the suppression list or have an invalid number are left out. You will see how many and why.")}</p>
              {isMarketing && <label className="flex items-start gap-2 rounded-md border p-2.5 text-sm"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" /><span>{tr("I confirm these people agreed to receive marketing messages from my business on WhatsApp.")}</span></label>}
            </div>
          ))}

          {template && (template.body_variables > 0 || template.header_variables > 0) && step(4, tr("Fill in the details"), mode === "single" ? (
            <div className="space-y-2">
              {template.header_variables > 0 && <div className="space-y-1"><Label htmlFor="sp-h">{tr("Header value")} {"{{1}}"}</Label><Input id="sp-h" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} /></div>}
              {values.map((v, i) => (
                <div key={i} className="space-y-1"><Label htmlFor={`sp-v${i}`}>{tr("Value for")} {`{{${i + 1}}}`}</Label>
                  <div className="flex gap-2"><Input id={`sp-v${i}`} value={v} onChange={(e) => setValues((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))} />
                    {name.trim() && <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setValues((cur) => cur.map((x, j) => (j === i ? name.trim() : x)))}>{tr("Use name")}</Button>}</div></div>))}
            </div>
          ) : (
            <div className="space-y-2">
              {map.map((m) => {
                const k = kindOf(m.source);
                return (
                  <div key={m.token} className="space-y-1.5 rounded-lg border p-2.5"><p className="text-sm font-medium">{`{{${m.token}}}`}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={k || undefined} onValueChange={(v) => setMap((cur) => cur.map((x) => (x.token === m.token ? { ...x, source: v === "attr" ? "attr:" : v === "static" ? "static:" : v } : x)))}>
                        <SelectTrigger><SelectValue placeholder={tr("Take it from…")} /></SelectTrigger><SelectContent>{SOURCES.map(([v, l]) => <SelectItem key={v} value={v}>{tr(l)}</SelectItem>)}</SelectContent></Select>
                      {k === "attr" && <Input value={m.source.slice(5)} placeholder={tr("field name, e.g. business_name")} onChange={(e) => setMap((cur) => cur.map((x) => (x.token === m.token ? { ...x, source: `attr:${e.target.value}` } : x)))} />}
                      {k === "static" && <Input value={m.source.slice(7)} placeholder={tr("text")} onChange={(e) => setMap((cur) => cur.map((x) => (x.token === m.token ? { ...x, source: `static:${e.target.value}` } : x)))} />}
                      {k !== "static" && <Input value={m.default ?? ""} placeholder={tr("If empty, use… (optional)")} onChange={(e) => setMap((cur) => cur.map((x) => (x.token === m.token ? { ...x, default: e.target.value } : x)))} />}
                    </div></div>);
              })}
            </div>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-3 lg:self-start">
          <h3 className="text-sm font-semibold">{tr("Preview")}</h3>
          <Bubble template={template} values={values} headerValue={headerValue} to={toLabel} text={bubbleText} />
          {mode === "bulk" && preview && preview.samples.length > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground"><Button size="sm" variant="ghost" disabled={sample === 0} onClick={() => setSample(sample - 1)}>‹</Button><span>{tr("Example")} {sample + 1} {tr("of")} {preview.samples.length}</span><Button size="sm" variant="ghost" disabled={sample >= preview.samples.length - 1} onClick={() => setSample(sample + 1)}>›</Button></div>
          )}
          {mode === "bulk" && (
            <div className="space-y-2 text-sm">
              {previewing && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{tr("Checking who can receive it…")}</p>}
              {previewError && <p className="rounded-md border border-red-300 bg-red-50 p-2 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{previewError}</p>}
              {preview && (
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-semibold tabular-nums">{preview.audience}</p><p className="text-[11px] text-muted-foreground">{tr("In the audience")}</p></div><div><p className="text-xl font-semibold tabular-nums">{preview.eligible}</p><p className="text-[11px] text-muted-foreground">{tr("Will receive")}</p></div><div><p className="text-xl font-semibold tabular-nums">{preview.skipped}</p><p className="text-[11px] text-muted-foreground">{tr("Left out")}</p></div></div>
                  {preview.skipped_by_reason.map((r) => <p key={r.reason} className="flex justify-between text-xs"><span>{tr(r.label)}</span><span className="tabular-nums">{r.count}</span></p>)}
                  {preview.problems.map((p) => <p key={p} className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p}</p>)}
                  {(preview.limits?.warnings ?? []).map((w) => <p key={w} className="text-xs text-amber-700 dark:text-amber-300">{w}</p>)}
                  <p className="text-xs text-muted-foreground">{tr("WhatsApp credits: needs")} {preview.credits.required}{preview.credits.available !== null && `, ${tr("you have")} ${preview.credits.available}`}{preview.limits?.estimate && ` · ${tr("Estimated cost")} ${preview.limits.estimate.amount} ${preview.limits.estimate.currency}`}</p>
                </div>
              )}
            </div>
          )}
          {mode === "single" ? (
            <Button className="w-full" disabled={!singleReady || sending} onClick={() => void sendOne()}>{sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}{tr("Send message")}</Button>
          ) : (
            <Button className="w-full" disabled={!preview || !preview.can_launch || preview.eligible === 0 || sending} onClick={() => setConfirmOpen(true)}><Send className="mr-1 h-4 w-4" />{preview ? `${tr("Send to")} ${preview.eligible} ${tr("people")}…` : tr("Send…")}</Button>
          )}
          {template && <p className="text-xs text-muted-foreground">{tr("WhatsApp may charge for template messages.")}</p>}
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !sending && setConfirmOpen(o)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader><DialogTitle>{tr("Send to many people?")}</DialogTitle><DialogDescription>{tr("Check these details. Messages already sent cannot be recalled.")}</DialogDescription></DialogHeader>
          {preview && template && (
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{tr("Recipients")}</dt><dd className="font-medium">{preview.eligible} {preview.skipped > 0 && <span className="font-normal text-muted-foreground">({preview.skipped} {tr("left out")})</span>}</dd>
              <dt className="text-muted-foreground">{tr("Template")}</dt><dd>{template.name} · {template.language}</dd>
              <dt className="text-muted-foreground">{tr("Credits")}</dt><dd>{preview.credits.required}{preview.credits.available !== null && ` / ${preview.credits.available}`}</dd>
            </dl>)}
          {preview?.samples[0] && <Bubble template={template} values={[]} headerValue="" to={tr("Example")} text={preview.samples[0].text} />}
          <DialogFooter className="gap-2 sm:gap-0"><Button variant="ghost" disabled={sending} onClick={() => setConfirmOpen(false)}>{tr("Go back")}</Button><Button disabled={sending} onClick={() => void sendMany()}>{sending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{tr("Send now")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A tiny loader hook: runs ``load`` when it first needs to (and again when ``key`` changes) and reports loading, data and the error text. */
function useQuery_<T>({ key, load, enabled = true }: { key: string; load: () => Promise<T>; enabled?: boolean }) {
  const [state, setState] = useState<{ loading: boolean; data?: T; error?: string }>({ loading: enabled });
  useEffect(() => {
    if (!enabled) { setState({ loading: false }); return; }
    let live = true;
    setState({ loading: true });
    load().then((data) => live && setState({ loading: false, data })).catch((e: Error) => live && setState({ loading: false, error: e.message }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return state;
}

// "Knowledge": what the assistant has learned from. Typed text, question-and-answer lists, files and web pages are read by the server,
// cut into passages and searched during calls. Every figure and status below comes from the server; nothing says "trained" until a source
// has really been read and indexed, and an upload type is only offered when the server reports it can read it.
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Globe, HelpCircle, Loader2, Plus, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import { aiAgentApi, type AgentConfig, type KnowledgeOverview, type KnowledgeSourceInfo } from "@/services/aiAgentApi";
import { describeError } from "@/services/callCenterApi";

type AddMode = "text" | "faq" | "file" | "url";

const statusTone: Record<string, string> = {
  ready: "bg-green-100 text-green-800",
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

interface Props {
  config: AgentConfig;
  /** Owners and admins may change what the assistant knows; supervisors only look. */
  canEdit: boolean;
}

export function AIKnowledgePanel({ config, canEdit }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [data, setData] = useState<KnowledgeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AddMode>("text");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [pairs, setPairs] = useState<Array<{ q: string; a: string }>>([{ q: "", a: "" }]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<KnowledgeSourceInfo | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Array<{ source_id: string; source_title: string; text: string; score: number }> | null>(null);
  const archived = config.status === "archived";

  const load = useCallback(async () => {
    const res = await aiAgentApi.knowledge.list(config.id);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [config.id]);

  useEffect(() => { void load(); }, [load]);

  // keep looking while something is still being read
  const waiting = !!data && data.summary.processing > 0;
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [waiting, load]);

  const reset = () => { setTitle(""); setText(""); setUrl(""); setPairs([{ q: "", a: "" }]); if (fileRef.current) fileRef.current.value = ""; };

  const add = async () => {
    setBusy(true);
    let res;
    if (mode === "file") {
      const file = fileRef.current?.files?.[0];
      if (!file) { setBusy(false); toast({ title: t(aiKey("ai.kn.choose_file")), variant: "destructive" }); return; }
      res = await aiAgentApi.knowledge.upload(config.id, file, title.trim() || undefined);
    } else if (mode === "faq") {
      res = await aiAgentApi.knowledge.add(config.id, { kind: "faq", title: title.trim() || undefined, items: pairs.filter((p) => p.q.trim() && p.a.trim()) });
    } else if (mode === "url") {
      res = await aiAgentApi.knowledge.add(config.id, { kind: "url", title: title.trim() || undefined, url: url.trim() });
    } else {
      res = await aiAgentApi.knowledge.add(config.id, { kind: "text", title: title.trim() || undefined, text });
    }
    setBusy(false);
    if (!res.success) { toast({ title: describeError(res), variant: "destructive" }); return; }
    toast({ title: t(aiKey("ai.kn.added")) });
    reset();
    await load();
  };

  const toggle = async (row: KnowledgeSourceInfo) => {
    const res = await aiAgentApi.knowledge.update(row.id, { enabled: !row.enabled });
    if (!res.success) toast({ title: describeError(res), variant: "destructive" });
    await load();
  };
  const reprocess = async (row: KnowledgeSourceInfo) => {
    const res = await aiAgentApi.knowledge.reprocess(row.id);
    if (!res.success) toast({ title: describeError(res), variant: "destructive" });
    await load();
  };
  const remove = async (row: KnowledgeSourceInfo) => {
    if (!window.confirm(t(aiKey("ai.kn.confirm_remove"), { name: row.title }))) return;
    const res = await aiAgentApi.knowledge.remove(row.id);
    if (!res.success) toast({ title: describeError(res), variant: "destructive" });
    await load();
  };
  const openEdit = async (row: KnowledgeSourceInfo) => {
    const res = await aiAgentApi.knowledge.get(row.id);
    if (res.success && res.data) setEditing(res.data);
  };
  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    const res = await aiAgentApi.knowledge.update(editing.id, { title: editing.title, ...(editing.editable ? { text: editing.text ?? "" } : {}) });
    setBusy(false);
    if (!res.success) { toast({ title: describeError(res), variant: "destructive" }); return; }
    setEditing(null);
    await load();
  };
  const search = async () => {
    if (!query.trim()) return;
    const res = await aiAgentApi.knowledge.search(config.id, query.trim());
    if (res.success && res.data) setFound(res.data.passages);
    else toast({ title: describeError(res), variant: "destructive" });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const caps = data?.capabilities;
  const s = data?.summary;
  const formats = ["TXT", "MD", "CSV", "DOCX", ...(caps?.pdf ? ["PDF"] : [])].join(", ");
  const modes: Array<{ id: AddMode; icon: typeof FileText; label: string }> = [
    { id: "text", icon: FileText, label: t(aiKey("ai.kn.add_text")) },
    { id: "faq", icon: HelpCircle, label: t(aiKey("ai.kn.add_faq")) },
    { id: "file", icon: Upload, label: t(aiKey("ai.kn.add_file")) },
    { id: "url", icon: Globe, label: t(aiKey("ai.kn.add_url")) },
  ];

  return (
    <div className="space-y-4">
      <Card><CardContent className="space-y-3 p-4">
        <h3 className="font-semibold">{t(aiKey("ai.kn.title"))}</h3>
        <p className="text-sm text-muted-foreground">{t(aiKey("ai.kn.intro"))}</p>
        {s && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t(aiKey("ai.kn.s_total"))} value={s.total} />
            <Stat label={t(aiKey("ai.kn.s_ready"))} value={s.ready} />
            <Stat label={t(aiKey("ai.kn.s_processing"))} value={s.processing} />
            <Stat label={t(aiKey("ai.kn.s_failed"))} value={s.failed} />
            <Stat label={t(aiKey("ai.kn.s_version"))} value={s.knowledge_version} />
            <Stat label={t(aiKey("ai.kn.s_last"))} value={s.last_indexed_at ? new Date(s.last_indexed_at).toLocaleString() : "—"} />
            <Stat label={t(aiKey("ai.kn.s_testing"))} value={s.ready_for_testing ? t(aiKey("ai.kn.yes")) : t(aiKey("ai.kn.no"))} />
            <Stat label={t(aiKey("ai.kn.s_active"))} value={s.active ? t(aiKey("ai.kn.yes")) : t(aiKey("ai.kn.no"))} />
          </div>
        )}
      </CardContent></Card>

      {canEdit && !archived && (
        <Card><CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <Button key={m.id} size="sm" variant={mode === m.id ? "default" : "outline"} onClick={() => setMode(m.id)}>
                <m.icon className="mr-1.5 h-4 w-4" />{m.label}
              </Button>
            ))}
          </div>
          <div>
            <Label>{t(aiKey("ai.kn.name_label"))}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          {mode === "text" && (
            <div>
              <Label>{t(aiKey("ai.kn.text_label"))}</Label>
              <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          )}
          {mode === "faq" && (
            <div className="space-y-3">
              {pairs.map((p, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <div><Label>{t(aiKey("ai.kn.question"))}</Label><Input value={p.q} onChange={(e) => setPairs(pairs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} /></div>
                  <div><Label>{t(aiKey("ai.kn.answer"))}</Label><Input value={p.a} onChange={(e) => setPairs(pairs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} /></div>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setPairs([...pairs, { q: "", a: "" }])}><Plus className="mr-1.5 h-4 w-4" />{t(aiKey("ai.kn.add_pair"))}</Button>
            </div>
          )}
          {mode === "url" && (
            <div><Label>{t(aiKey("ai.kn.url_label"))}</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></div>
          )}
          {mode === "file" && (
            <div className="space-y-1">
              <Label>{t(aiKey("ai.kn.choose_file"))}</Label>
              <input ref={fileRef} type="file" accept={[".txt", ".md", ".csv", ".docx", ...(caps?.pdf ? [".pdf"] : [])].join(",")} className="block text-sm" />
              <p className="text-xs text-muted-foreground">{t(aiKey("ai.kn.formats"), { formats, mb: caps?.max_file_mb ?? 5 })}</p>
              {caps && !caps.pdf && <p className="text-xs text-amber-700">{t(aiKey("ai.kn.pdf_off"))}</p>}
            </div>
          )}
          <Button onClick={() => void add()} disabled={busy}>{busy ? t(aiKey("ai.kn.adding")) : t(aiKey("ai.kn.add"))}</Button>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {data && data.sources.length === 0 && <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{t(aiKey("ai.kn.empty"))}</p>}
        {data?.sources.map((row) => (
          <Card key={row.id}><CardContent className="space-y-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{row.title}</span>
              <Badge className={statusTone[row.status]}>{t(aiKey(`ai.kn.status_${row.status}`))}</Badge>
              {row.in_use && <Badge variant="outline">{t(aiKey("ai.kn.in_use"))}</Badge>}
              {!row.enabled && <Badge variant="outline">{t(aiKey("ai.kn.switched_off"))}</Badge>}
              <span className="text-xs text-muted-foreground">{row.kind === "file" ? row.filename : row.kind === "url" ? row.source_url : ""}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {t(aiKey("ai.kn.passages"), { count: row.chunks })} · {t(aiKey("ai.kn.version_n"), { n: row.version })}
              </span>
            </div>
            {row.status === "failed" && row.error && <p className="rounded bg-red-50 p-2 text-sm text-red-800">{row.error}</p>}
            {row.notes && <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">{row.notes}</p>}
            {row.preview && <p className="line-clamp-2 text-sm text-muted-foreground">{row.preview}</p>}
            {canEdit && !archived && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void openEdit(row)}>{t(aiKey("ai.kn.edit"))}</Button>
                <Button size="sm" variant="outline" onClick={() => void toggle(row)}>{row.enabled ? t(aiKey("ai.kn.disable")) : t(aiKey("ai.kn.enable"))}</Button>
                {(row.status === "failed" || row.kind === "url") && (
                  <Button size="sm" variant="outline" onClick={() => void reprocess(row)}><RefreshCw className="mr-1.5 h-4 w-4" />{t(aiKey("ai.kn.reprocess"))}</Button>
                )}
                <Button size="sm" variant="ghost" className="text-red-700" onClick={() => void remove(row)}><Trash2 className="mr-1.5 h-4 w-4" />{t(aiKey("ai.kn.remove"))}</Button>
              </div>
            )}
          </CardContent></Card>
        ))}
      </div>

      {editing && (
        <Card><CardContent className="space-y-3 p-4">
          <div><Label>{t(aiKey("ai.kn.name_label"))}</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div>
            <Label>{t(aiKey("ai.kn.text_label"))}</Label>
            <Textarea rows={10} value={editing.text ?? ""} disabled={!editing.editable} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void saveEdit()} disabled={busy}>{t(aiKey("ai.kn.save_changes"))}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>{t(aiKey("ai.kn.cancel"))}</Button>
          </div>
        </CardContent></Card>
      )}

      {canEdit && (
        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-semibold">{t(aiKey("ai.kn.test_title"))}</h3>
          <p className="text-sm text-muted-foreground">{t(aiKey("ai.kn.test_help"))}</p>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(aiKey("ai.kn.test_placeholder"))} onKeyDown={(e) => { if (e.key === "Enter") void search(); }} />
            <Button onClick={() => void search()}><Search className="mr-1.5 h-4 w-4" />{t(aiKey("ai.kn.test_button"))}</Button>
          </div>
          {found && found.length === 0 && <p className="text-sm text-muted-foreground">{t(aiKey("ai.kn.no_match"))}</p>}
          {found?.map((p, i) => (
            <div key={i} className="rounded-md border p-2 text-sm">
              <div className="mb-1 text-xs font-medium text-muted-foreground">{p.source_title}</div>
              <p className="whitespace-pre-wrap">{p.text}</p>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}

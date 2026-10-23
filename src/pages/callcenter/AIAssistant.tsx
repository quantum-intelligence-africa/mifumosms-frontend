import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Loader2, Pause, Play, Plus, Send, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { appLocale } from "@/utils/appLocale";
import { aiEn, aiKey } from "@/i18n/aiAgent";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { AITeachPanel } from "@/components/callcenter/AITeachPanel";
import { AIKnowledgePanel } from "@/components/callcenter/AIKnowledgePanel";
import { useAuth } from "@/contexts/AuthContext";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { OpeningPreview } from "@/components/callcenter/OpeningPreview";
import { VoicePicker } from "@/components/voice/VoicePicker";
import {
  aiAgentApi, DEPARTMENTS, type AgentConfig, type AgentConfigSummary, type AgentSettings, type AgentStatus, type AuditRow, type Department,
  type Policy, type ProviderCheck, type ProviderInfo, type SimulationResult, type Usage,
} from "@/services/aiAgentApi";
import { callCenterApi, describeError, type Team } from "@/services/callCenterApi";

const STATUS_STYLE: Record<AgentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  test: "bg-amber-100 text-amber-900",
  published: "bg-green-100 text-green-900",
  paused: "bg-orange-100 text-orange-900",
  archived: "bg-muted text-muted-foreground",
};
const NONE = "__none__";
const DEFAULT_PROVIDER = "__default__";

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function ToggleRow({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

const emailsText = (list: string[]) => list.join(", ");
const parseEmails = (text: string) => text.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

export default function AIAssistant() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const canEditKnowledge = isCallCenterAdmin(user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<AgentConfigSummary[]>([]);
  const [current, setCurrent] = useState<AgentConfig | null>(null);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [meta, setMeta] = useState({ name: "", purpose: "", personality: "" });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [acting, setActing] = useState(false);

  const pick = useCallback(async (id: string) => {
    const res = await aiAgentApi.agents.get(id);
    if (res.success && res.data) {
      setCurrent(res.data);
      setSettings(res.data.settings);
      setMeta({ name: res.data.name, purpose: res.data.purpose, personality: res.data.personality });
      setDirty(false);
      setFieldErrors({});
      const h = await aiAgentApi.agents.history(id);
      if (h.success && h.data) setAudit(h.data.results);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [agents, prov, tm, pol, use] = await Promise.all([
      aiAgentApi.agents.list(), aiAgentApi.providers(), callCenterApi.teams.list(), aiAgentApi.policy.get(), aiAgentApi.usage(30),
    ]);
    if (!agents.success || !agents.data) {
      setError(describeError(agents) || t("ai.load_failed"));
      setLoading(false);
      return;
    }
    setList(agents.data.results);
    if (prov.success && prov.data) setProviders(prov.data.providers);
    if (tm.success && tm.data) setTeams(tm.data);
    if (pol.success && pol.data) setPolicy(pol.data);
    if (use.success && use.data) setUsage(use.data);
    const first = agents.data.results.find((a) => a.status !== "archived") ?? agents.data.results[0];
    if (first) await pick(first.id);
    setLoading(false);
  }, [pick, t]);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edit = (mutate: (draft: AgentSettings) => void) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
    setDirty(true);
  };

  const create = async () => {
    setActing(true);
    const res = await aiAgentApi.agents.create({ name: newName.trim() });
    setActing(false);
    if (res.success && res.data) {
      setCreating(false);
      setNewName("");
      const refreshed = await aiAgentApi.agents.list();
      if (refreshed.success && refreshed.data) setList(refreshed.data.results);
      await pick(res.data.id);
    } else {
      toast({ title: t("ai.save_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const save = async () => {
    if (!current || !settings) return;
    setSaving(true);
    setFieldErrors({});
    const res = await aiAgentApi.agents.update(current.id, { ...meta, settings });
    setSaving(false);
    if (res.success && res.data) {
      setCurrent(res.data);
      setSettings(res.data.settings);
      setDirty(false);
      toast({ title: t("ai.saved") });
      void pick(current.id);
    } else {
      const errors = res.errors as Record<string, string | string[]> | undefined;
      if (errors) setFieldErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)])));
      toast({ title: t("ai.save_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const act = async (action: "publish" | "pause" | "resume" | "archive" | "restore" | "test") => {
    if (!current) return;
    if (dirty && action === "publish") await save();
    setActing(true);
    const res = await aiAgentApi.agents.action(current.id, action);
    setActing(false);
    if (res.success && res.data) {
      const okKey = { publish: "ai.published_ok", pause: "ai.paused_ok", resume: "ai.resumed_ok", archive: "ai.archived_ok", restore: "ai.restored_ok", test: "ai.testing_ok" }[action];
      toast({ title: t(aiKey(okKey)), description: res.data.warnings?.[0] ? t("ai.publish_warning", { warning: res.data.warnings[0] }) : undefined });
      const refreshed = await aiAgentApi.agents.list();
      if (refreshed.success && refreshed.data) setList(refreshed.data.results);
      await pick(current.id);
    } else {
      toast({ title: t("ai.action_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!current || !window.confirm(t("ai.delete_confirm"))) return;
    const res = await aiAgentApi.agents.remove(current.id);
    if (res.success) {
      toast({ title: t("ai.deleted") });
      setCurrent(null);
      setSettings(null);
      void loadAll();
    } else {
      toast({ title: t("ai.action_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const reasoningProviders = providers.filter((p) => p.roles.includes("reasoning"));
  const hasEleven = providers.some((p) => p.type === "elevenlabs");

  const liveNote = useMemo(() => {
    if (!current) return "";
    if (current.status === "published") return current.has_unpublished_changes || dirty ? t("ai.live.unpublished") : t("ai.live.published");
    if (current.status === "paused") return t("ai.live.paused");
    return t("ai.live.draft");
  }, [current, dirty, t]);

  if (loading) {
    return <PageFrame title={t("ai.title")} subtitle={t("ai.subtitle")}><Skeleton className="h-64" /></PageFrame>;
  }

  return (
    <PageFrame
      title={t("ai.title")}
      subtitle={t("ai.subtitle")}
      actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />{t("ai.new")}</Button>}
    >
      {error && <p className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</p>}

      {!current || !settings ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Bot className="h-10 w-10 text-primary" />
            <p className="font-medium">{t("ai.none_yet")}</p>
            <p className="max-w-md text-sm text-muted-foreground">{t("ai.none_help")}</p>
            <Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />{t("ai.new")}</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                {list.length > 1 ? (
                  <Select value={current.id} onValueChange={(id) => void pick(id)}>
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>{list.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <h2 className="text-lg font-semibold">{current.name}</h2>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[current.status]}`}>{t(aiKey(`ai.status.${current.status}`))}</span>
                {current.version > 1 && <span className="text-xs text-muted-foreground">{t("ai.version", { version: current.version - 1 })}</span>}
                {current.published_at && <span className="text-xs text-muted-foreground">{t("ai.published_at", { when: new Date(current.published_at).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" }) })}</span>}
              </div>
              <p className="text-sm text-muted-foreground">{liveNote}</p>
              <div className="flex flex-wrap gap-2">
                {current.status !== "archived" && (
                  <Button size="sm" onClick={() => void act("publish")} disabled={acting || saving}>
                    {acting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}{t("ai.publish")}
                  </Button>
                )}
                {current.status === "published" && <Button size="sm" variant="outline" onClick={() => void act("pause")} disabled={acting}><Pause className="mr-1.5 h-4 w-4" />{t("ai.pause")}</Button>}
                {current.status === "paused" && <Button size="sm" variant="outline" onClick={() => void act("resume")} disabled={acting}><Play className="mr-1.5 h-4 w-4" />{t("ai.resume")}</Button>}
                {current.status === "draft" && <Button size="sm" variant="outline" onClick={() => void act("test")} disabled={acting}>{t("ai.put_in_test")}</Button>}
                {current.status === "archived" ? (
                  <Button size="sm" variant="outline" onClick={() => void act("restore")} disabled={acting}>{t("ai.restore")}</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => void act("archive")} disabled={acting}>{t("ai.archive")}</Button>
                )}
                {(current.status === "draft" || current.status === "test" || current.status === "archived") && (
                  <Button size="sm" variant="ghost" className="text-red-700" onClick={() => void remove()}><Trash2 className="mr-1.5 h-4 w-4" />{t("ai.delete")}</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={settings.knowledge.trim() ? "general" : "teach"}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              {(["teach", "knowledge", "general", "providers", "handoff", "email", "limits", "privacy", "test", "activity"] as const).map((tab) => (
                <TabsTrigger key={tab} value={tab}>{t(aiKey(`ai.tab.${tab}`))}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="teach" className="mt-3">
              <AITeachPanel config={current} settings={settings} meta={meta} providers={providers} onChanged={() => void pick(current.id)} />
            </TabsContent>

            <TabsContent value="knowledge" className="mt-3">
              <AIKnowledgePanel config={current} canEdit={canEditKnowledge} />
            </TabsContent>

            <TabsContent value="general" className="mt-3 space-y-3">
              <OpeningPreview agentId={current.id} refreshKey={`${current.version}-${current.updated_at}`} />
              <Card><CardContent className="space-y-4 p-4">
                <Field label={t("ai.name")}><Input value={meta.name} onChange={(e) => { setMeta({ ...meta, name: e.target.value }); setDirty(true); }} placeholder={t("ai.name_placeholder")} /></Field>
                <Field label={t("ai.purpose")}><Input value={meta.purpose} onChange={(e) => { setMeta({ ...meta, purpose: e.target.value }); setDirty(true); }} placeholder={t("ai.purpose_placeholder")} /></Field>
                <Field label={t("ai.personality")}><Input value={meta.personality} onChange={(e) => { setMeta({ ...meta, personality: e.target.value }); setDirty(true); }} placeholder={t("ai.personality_placeholder")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("ai.f.languages")}>
                    <div className="flex gap-4">
                      {(["sw", "en"] as const).map((lang) => (
                        <label key={lang} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={settings.languages.includes(lang)}
                            onChange={(e) => edit((d) => {
                              d.languages = e.target.checked ? Array.from(new Set([...d.languages, lang])) : d.languages.filter((l) => l !== lang);
                              if (!d.languages.includes(d.default_language) && d.languages[0]) d.default_language = d.languages[0];
                            })}
                          />
                          {t(aiKey(`ai.lang.${lang}`))}
                        </label>
                      ))}
                    </div>
                    {fieldErrors.languages && <p className="text-xs text-red-700">{fieldErrors.languages}</p>}
                  </Field>
                  <Field label={t("ai.f.default_language")}>
                    <Select value={settings.default_language} onValueChange={(v) => edit((d) => { d.default_language = v as "sw" | "en"; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{settings.languages.map((l) => <SelectItem key={l} value={l}>{t(aiKey(`ai.lang.${l}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={t("ai.f.greeting")} help={t("ai.f.greeting_help")}>
                  <Textarea rows={2} value={settings.greeting} onChange={(e) => edit((d) => { d.greeting = e.target.value; })} />
                  <div className="mt-2">
                    <ToggleRow label={t(aiKey("ai.f.announce_ai"))} help={t(aiKey("ai.f.announce_ai_help"))} checked={settings.announce_ai !== false} onChange={(v) => edit((d) => { d.announce_ai = v; })} />
                  </div>
                  {fieldErrors.greeting && <p className="text-xs text-red-700">{fieldErrors.greeting}</p>}
                </Field>
                <Field label={t("ai.f.closing")}><Textarea rows={2} value={settings.closing} onChange={(e) => edit((d) => { d.closing = e.target.value; })} /></Field>
                <Field label={t("ai.f.knowledge")} help={t("ai.f.knowledge_help")}>
                  <Textarea rows={10} value={settings.knowledge} onChange={(e) => edit((d) => { d.knowledge = e.target.value; })} />
                  {fieldErrors.knowledge && <p className="text-xs text-red-700">{fieldErrors.knowledge}</p>}
                </Field>
                <ToggleRow label={t("ai.f.inbound")} checked={settings.inbound_enabled} onChange={(v) => edit((d) => { d.inbound_enabled = v; })} />
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="providers" className="mt-3">
              <Card><CardContent className="space-y-5 p-4">
                {reasoningProviders.length === 0 && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t("ai.provider.none")}</p>}
                <ProviderList providers={providers} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("ai.f.reasoning_provider")}>
                    <Select value={settings.reasoning.credential_id || DEFAULT_PROVIDER} onValueChange={(v) => edit((d) => { d.reasoning.credential_id = v === DEFAULT_PROVIDER ? "" : v; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_PROVIDER}>{t("ai.f.reasoning_default")}</SelectItem>
                        {reasoningProviders.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t("ai.f.model")} help={t("ai.f.model_help")}><Input value={settings.reasoning.model} onChange={(e) => edit((d) => { d.reasoning.model = e.target.value; })} /></Field>
                  <Field label={t("ai.f.temperature")}>
                    <Input type="number" min={0} max={1} step={0.1} value={settings.reasoning.temperature} onChange={(e) => edit((d) => { d.reasoning.temperature = Number(e.target.value); })} />
                  </Field>
                  <Field label={t("ai.f.timeout")}>
                    <Input type="number" min={2} max={20} value={settings.reasoning.timeout_seconds} onChange={(e) => edit((d) => { d.reasoning.timeout_seconds = Number(e.target.value); })} />
                    {fieldErrors["reasoning.timeout_seconds"] && <p className="text-xs text-red-700">{fieldErrors["reasoning.timeout_seconds"]}</p>}
                  </Field>
                </div>
                <ToggleRow label={t("ai.f.fallback")} help={t("ai.f.fallback_help")} checked={settings.reasoning.allow_fallback} onChange={(v) => edit((d) => { d.reasoning.allow_fallback = v; })} />
                {settings.reasoning.allow_fallback && (
                  <Field label={t("ai.f.fallback_provider")}>
                    <Select value={settings.reasoning.fallback_credential_id || NONE} onValueChange={(v) => edit((d) => { d.reasoning.fallback_credential_id = v === NONE ? "" : v; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {reasoningProviders.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {fieldErrors["reasoning.fallback_credential_id"] && <p className="text-xs text-red-700">{fieldErrors["reasoning.fallback_credential_id"]}</p>}
                  </Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("ai.f.listening")}>
                    <Select value={settings.listening.provider} onValueChange={(v) => edit((d) => { d.listening.provider = v as "default" | "elevenlabs"; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t("ai.listening.default")}</SelectItem>
                        {hasEleven && <SelectItem value="elevenlabs">{t("ai.listening.elevenlabs")}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t("ai.f.voice_provider")}>
                    <Select value={settings.voice.provider} onValueChange={(v) => edit((d) => { d.voice.provider = v as "africas_talking" | "elevenlabs"; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africas_talking">{t("ai.voice.at")}</SelectItem>
                        {hasEleven && <SelectItem value="elevenlabs">{t("ai.voice.eleven")}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={t("ai.f.at_voice")}>
                  <VoicePicker value={settings.voice.voice} onChange={(v) => edit((d) => { d.voice.voice = v; })} sampleText={settings.greeting} allowDefault={false} />
                </Field>
                {settings.voice.provider === "elevenlabs" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("ai.f.eleven_voice_id")}>
                      <Input value={settings.voice.eleven_voice_id} onChange={(e) => edit((d) => { d.voice.eleven_voice_id = e.target.value; })} />
                      {fieldErrors["voice.eleven_voice_id"] && <p className="text-xs text-red-700">{fieldErrors["voice.eleven_voice_id"]}</p>}
                    </Field>
                    <Field label={t("ai.f.eleven_model")}><Input value={settings.voice.eleven_model} onChange={(e) => edit((d) => { d.voice.eleven_model = e.target.value; })} /></Field>
                    <Field label={t("ai.f.tts_timeout")}><Input type="number" min={1} max={8} value={settings.voice.tts_timeout_seconds} onChange={(e) => edit((d) => { d.voice.tts_timeout_seconds = Number(e.target.value); })} /></Field>
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="handoff" className="mt-3">
              <Card><CardContent className="space-y-5 p-4">
                <div className="space-y-2">
                  <p className="font-medium">{t(aiKey("ai.perm.title"))}</p>
                  <p className="text-xs text-muted-foreground">{t(aiKey("ai.perm.help"))}</p>
                  <ToggleRow label={t(aiKey("ai.perm.transfers"))} checked={settings.permissions?.transfers !== false} onChange={(v) => edit((d) => { d.permissions = { transfers: v, create_requests: d.permissions?.create_requests !== false }; })} />
                  <ToggleRow label={t(aiKey("ai.perm.requests"))} checked={settings.permissions?.create_requests !== false} onChange={(v) => edit((d) => { d.permissions = { transfers: d.permissions?.transfers !== false, create_requests: v }; })} />
                  {fieldErrors.permissions && <p className="text-xs text-red-700">{fieldErrors.permissions}</p>}
                </div>
                <div>
                  <p className="font-medium">{t("ai.f.dept_heading")}</p>
                  <p className="text-xs text-muted-foreground">{t("ai.f.dept_help")}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {DEPARTMENTS.map((dept) => (
                    <Field key={dept} label={t(aiKey(`ai.dept.${dept}`))}>
                      <Select value={settings.handoff.departments[dept] || NONE} onValueChange={(v) => edit((d) => { d.handoff.departments[dept] = v === NONE ? "" : v; })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>{t("ai.f.no_team")}</SelectItem>
                          {teams.filter((tm) => tm.is_active).map((tm) => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`handoff.departments.${dept}`] && <p className="text-xs text-red-700">{fieldErrors[`handoff.departments.${dept}`]}</p>}
                    </Field>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("ai.f.default_dept")}>
                    <Select value={settings.handoff.default_department} onValueChange={(v) => edit((d) => { d.handoff.default_department = v as Department; })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{t(aiKey(`ai.dept.${dept}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t("ai.f.max_attempts")}>
                    <Input type="number" min={1} max={10} value={settings.handoff.max_unresolved_attempts} onChange={(e) => edit((d) => { d.handoff.max_unresolved_attempts = Number(e.target.value); })} />
                  </Field>
                </div>
                <ToggleRow label={t("ai.f.escalate_complaints")} checked={settings.handoff.escalate_complaints} onChange={(v) => edit((d) => { d.handoff.escalate_complaints = v; })} />
                <Field label={t("ai.f.keywords")} help={t("ai.f.keywords_help")}>
                  <Textarea rows={3} value={settings.handoff.keywords.join("\n")} onChange={(e) => edit((d) => { d.handoff.keywords = e.target.value.split("\n"); })} />
                </Field>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="email" className="mt-3">
              <Card><CardContent className="space-y-4 p-4">
                <Field label={t("ai.f.internal_default")} help={t("ai.f.internal_help")}>
                  <Input value={emailsText(settings.notifications.default_internal)} onChange={(e) => edit((d) => { d.notifications.default_internal = parseEmails(e.target.value); })} placeholder="support@example.com" />
                  {fieldErrors["notifications.default_internal"] && <p className="text-xs text-red-700">{fieldErrors["notifications.default_internal"]}</p>}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  {DEPARTMENTS.map((dept) => (
                    <Field key={dept} label={t("ai.f.internal_dept", { dept: t(aiKey(`ai.dept.${dept}`)) })}>
                      <Input value={emailsText(settings.notifications.internal_emails[dept])} onChange={(e) => edit((d) => { d.notifications.internal_emails[dept] = parseEmails(e.target.value); })} />
                      {fieldErrors[`notifications.internal_emails.${dept}`] && <p className="text-xs text-red-700">{fieldErrors[`notifications.internal_emails.${dept}`]}</p>}
                    </Field>
                  ))}
                </div>
                <ToggleRow label={t("ai.f.customer_confirm")} help={t("ai.f.customer_confirm_help")} checked={settings.notifications.customer_confirmation} onChange={(v) => edit((d) => { d.notifications.customer_confirmation = v; })} />
                {settings.notifications.customer_confirmation && (
                  <>
                    <Field label={t("ai.f.customer_subject")}><Input value={settings.notifications.customer_subject} onChange={(e) => edit((d) => { d.notifications.customer_subject = e.target.value; })} /></Field>
                    <Field label={t("ai.f.customer_body")} help={t("ai.f.customer_body_help")}><Textarea rows={5} value={settings.notifications.customer_body} onChange={(e) => edit((d) => { d.notifications.customer_body = e.target.value; })} /></Field>
                  </>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="limits" className="mt-3">
              <Card><CardContent className="space-y-4 p-4">
                <p className="text-xs text-muted-foreground">{t("ai.f.limits_help")}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("ai.f.max_turns")}><Input type="number" min={2} max={40} value={settings.limits.max_turns} onChange={(e) => edit((d) => { d.limits.max_turns = Number(e.target.value); })} /></Field>
                  <Field label={t("ai.f.max_seconds")}><Input type="number" min={60} max={3600} value={settings.limits.max_call_seconds} onChange={(e) => edit((d) => { d.limits.max_call_seconds = Number(e.target.value); })} /></Field>
                  <Field label={t("ai.f.max_tools")}><Input type="number" min={1} max={20} value={settings.limits.max_tool_calls} onChange={(e) => edit((d) => { d.limits.max_tool_calls = Number(e.target.value); })} /></Field>
                  <Field label={t("ai.f.daily_cap")}><Input type="number" min={0} value={settings.limits.daily_call_cap} onChange={(e) => edit((d) => { d.limits.daily_call_cap = Number(e.target.value); })} /></Field>
                </div>
                {Object.entries(fieldErrors).filter(([k]) => k.startsWith("limits.")).map(([k, v]) => <p key={k} className="text-xs text-red-700">{v}</p>)}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="privacy" className="mt-3 space-y-3">
              <OpeningPreview agentId={current.id} refreshKey={`${current.version}-${current.updated_at}-${policy?.recording_notice_enabled}-${policy?.recording_notice_text}`} />
              {policy && <PolicyCard policy={policy} onChange={setPolicy} />}
            </TabsContent>

            <TabsContent value="test" className="mt-3">
              <Simulator agentId={current.id} settings={settings} dirty={dirty} />
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              <ActivityCard usage={usage} audit={audit} />
            </TabsContent>
          </Tabs>

          {dirty && (
            <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 shadow-lg">
              <span className="text-sm text-muted-foreground">{t("ai.live.unpublished")}</span>
              <Button onClick={() => void save()} disabled={saving}>{saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{t("ai.saving")}</> : t("ai.save")}</Button>
            </div>
          )}
        </>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ai.new")}</DialogTitle>
            <DialogDescription>{t("ai.none_help")}</DialogDescription>
          </DialogHeader>
          <Field label={t("ai.name")}><Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("ai.name_placeholder")} /></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>{t("cc.common.cancel")}</Button>
            <Button onClick={() => void create()} disabled={!newName.trim() || acting}>{t("ai.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

function ProviderList({ providers }: { providers: ProviderInfo[] }) {
  const { t } = useLanguage();
  const [results, setResults] = useState<Record<string, ProviderCheck | "loading">>({});
  const test = async (id: string) => {
    setResults((r) => ({ ...r, [id]: "loading" }));
    const res = await aiAgentApi.testProvider(id);
    setResults((r) => ({ ...r, [id]: res.success && res.data ? res.data : { ok: false, checks: [{ name: "", ok: false, detail: describeError(res), ms: 0 }] } }));
  };
  if (providers.length === 0) return null;
  return (
    <ul className="space-y-2">
      {providers.map((p) => {
        const r = results[p.id];
        return (
          <li key={p.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{p.name} {p.is_default && <Badge variant="secondary" className="ml-1">{t("ai.provider.default_tag")}</Badge>}</p>
                <p className="text-xs text-muted-foreground">{t("ai.provider.roles", { roles: p.roles.map((role) => t(aiKey(`ai.role.${role}`))).join(", ") })}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void test(p.id)} disabled={r === "loading"}>
                {r === "loading" ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("ai.provider.testing")}</> : t("ai.provider.test")}
              </Button>
            </div>
            {r && r !== "loading" && (
              <ul className="mt-2 space-y-1 text-xs">
                {r.checks.map((c, i) => (
                  <li key={i} className={`flex items-start gap-1.5 ${c.ok ? "text-green-700" : "text-red-700"}`}>
                    {c.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>{c.name ? `${c.name}: ` : ""}{c.detail}{c.ms ? ` (${c.ms} ms)` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PolicyCard({ policy, onChange }: { policy: Policy; onChange: (p: Policy) => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [draft, setDraft] = useState(policy);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const res = await aiAgentApi.policy.save(draft);
    setSaving(false);
    if (res.success && res.data) {
      onChange(res.data);
      setDraft(res.data);
      toast({ title: t("ai.policy.saved") });
    } else {
      toast({ title: t("ai.save_failed"), description: describeError(res), variant: "destructive" });
    }
  };
  return (
    <Card><CardContent className="space-y-4 p-4">
      <ToggleRow label={t("ai.f.notice_enabled")} checked={draft.recording_notice_enabled} onChange={(v) => setDraft({ ...draft, recording_notice_enabled: v })} />
      {draft.recording_notice_enabled && (
        <Field label={t("ai.f.notice_text")} help={t("ai.f.notice_help")}>
          <Textarea rows={2} value={draft.recording_notice_text} onChange={(e) => setDraft({ ...draft, recording_notice_text: e.target.value })} />
        </Field>
      )}
      <Field label={t("ai.f.retention")} help={t("ai.f.retention_help")}>
        <Input className="max-w-40" type="number" min={0} max={3650} value={draft.retention_days} onChange={(e) => setDraft({ ...draft, retention_days: Number(e.target.value) })} />
      </Field>
      <Button onClick={() => void save()} disabled={saving}>{saving ? t("ai.saving") : t("ai.policy.save")}</Button>
    </CardContent></Card>
  );
}

type Line = { role: "user" | "assistant"; content: string; meta?: SimulationResult };

function Simulator({ agentId, settings, dirty }: { agentId: string; settings: AgentSettings; dirty: boolean }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const said = text.trim();
    if (!said) return;
    setBusy(true);
    setText("");
    const history = lines.map((l) => ({ role: l.role, content: l.content }));
    setLines((prev) => [...prev, { role: "user", content: said }]);
    const res = await aiAgentApi.agents.simulate(agentId, { text: said, history, language: settings.default_language, settings });
    setBusy(false);
    if (res.success && res.data) {
      setLines((prev) => [...prev, { role: "assistant", content: res.data!.reply, meta: res.data }]);
    } else {
      toast({ title: t("ai.test.failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const outcome = (m: SimulationResult) => {
    if (m.action === "transfer") {
      const a = m.availability;
      return (
        <>
          <p>{t("ai.test.would_transfer", { dept: m.department ? t(aiKey(`ai.dept.${m.department}`)) : "—" })}</p>
          <p>{a && a.configured ? (a.can_take ? t("ai.test.can_take") : t("ai.test.cannot_take")) : t("ai.test.no_team")}</p>
        </>
      );
    }
    if (m.action === "create_request") return <p>{t("ai.test.would_request", { type: t(aiKey(`ai.tk.type.${m.request?.type || "ticket"}`)) })}</p>;
    if (m.action === "end") return <p>{t("ai.test.would_end")}</p>;
    return null;
  };

  return (
    <Card><CardContent className="space-y-3 p-4">
      <p className="text-sm text-muted-foreground">{t("ai.test.intro")}</p>
      <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
        {lines.map((l, i) => (
          <div key={i} className={l.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-left text-sm ${l.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
              <p className="mb-0.5 text-[11px] font-medium opacity-70">{l.role === "user" ? t("ai.test.you") : t("ai.test.assistant")}</p>
              {l.content}
            </div>
            {l.meta && (
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {outcome(l.meta)}
                {l.meta.guarded && <p className="text-amber-700">{t("ai.test.guarded")}</p>}
                {l.meta.used_fallback && <p className="text-amber-700">{t("ai.test.fallback_used")}</p>}
                <p>
                  {l.meta.sources && l.meta.sources.length > 0
                    ? `${t(aiKey("ai.kn.sources_used"))}: ${Array.from(new Set(l.meta.sources.map((x) => x.source_title))).join(", ")}`
                    : t(aiKey("ai.kn.no_sources"))}
                </p>
                <p>{t("ai.test.meta", { ms: l.meta.latency_ms, model: l.meta.model })}</p>
              </div>
            )}
          </div>
        ))}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("ai.test.placeholder")} disabled={busy} />
        <Button type="submit" disabled={busy || !text.trim()}><Send className="mr-1.5 h-4 w-4" />{t("ai.test.send")}</Button>
        <Button type="button" variant="outline" onClick={() => setLines([])} disabled={busy || lines.length === 0}>{t("ai.test.reset")}</Button>
      </form>
      {dirty && <p className="text-xs text-muted-foreground">{t("ai.live.unpublished")}</p>}
    </CardContent></Card>
  );
}

function ActivityCard({ usage, audit }: { usage: Usage | null; audit: AuditRow[] }) {
  const { t } = useLanguage();
  const stats: Array<[string, string | number]> = usage
    ? [
        [t("ai.act.calls"), usage.calls], [t("ai.act.by_ai"), usage.handled_by_ai], [t("ai.act.transferred"), usage.transferred],
        [t("ai.act.abandoned"), usage.abandoned], [t("ai.act.latency"), `${usage.avg_reasoning_ms} ms`], [t("ai.act.errors"), usage.provider_errors],
        [t("ai.act.tickets_open"), usage.tickets_open], [t("ai.act.emails_failed"), usage.emails_failed],
      ]
    : [];
  return (
    <div className="space-y-3">
      <Card><CardContent className="space-y-3 p-4">
        <p className="font-medium">{t("ai.act.usage_title")}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </CardContent></Card>
      <Card><CardContent className="space-y-2 p-4">
        <p className="font-medium">{t("ai.act.history_title")}</p>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("ai.act.history_empty")}</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {audit.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><span className="font-medium">{row.actor || "—"}</span> · {t(aiKey(`ai.audit.${row.action}` in aiEn ? `ai.audit.${row.action}` : "ai.audit.unknown"))}</span>
                <span className="text-muted-foreground">{new Date(row.at).toLocaleString(appLocale(), { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}

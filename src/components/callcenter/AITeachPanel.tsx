// "Teach it": paste text (or give a web address) and SENDA drafts the assistant's purpose, tone, greeting, goodbye and facts, for review.
// Below it, "Learn from your calls": questions callers asked that the assistant could not answer; the owner writes the true answer.
// Nothing here changes what callers hear: it all goes to the DRAFT, which is published separately.
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import { aiAgentApi, type AgentConfig, type AgentSettings, type LearnResult, type TeachJob, type TeachProposal } from "@/services/aiAgentApi";
import { describeError } from "@/services/callCenterApi";

interface Props {
  config: AgentConfig;
  settings: AgentSettings;
  meta: { name: string; purpose: string; personality: string };
  /** Called after the draft changed on the server, so the page reloads it. */
  onChanged: () => void;
}

const MAX_KNOWLEDGE = 12000;

/** Wait for a background job: asks every 2 seconds, up to about three minutes. */
async function waitFor<T>(jobId: string): Promise<TeachJob<T>> {
  for (let i = 0; i < 90; i++) {
    const res = await aiAgentApi.teach.job<T>(jobId);
    if (res.success && res.data && (res.data.status === "done" || res.data.status === "failed")) return res.data;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { id: jobId, kind: "teach", status: "failed", error: "It is taking too long. Try again in a moment.", result: null };
}

export function AITeachPanel({ config, settings, meta, onChanged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const archived = config.status === "archived";

  // teach
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"replace" | "merge">(settings.knowledge.trim() ? "merge" : "replace");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<TeachProposal | null>(null);
  const [saving, setSaving] = useState(false);

  // learn
  const [days, setDays] = useState(30);
  const [looking, setLooking] = useState(false);
  const [learned, setLearned] = useState<LearnResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [learnError, setLearnError] = useState("");

  const teach = async () => {
    setWorking(true);
    setError("");
    setDraft(null);
    const start = await aiAgentApi.teach.start(config.id, { text, url: url.trim() || undefined, mode });
    if (!start.success || !start.data) {
      setWorking(false);
      setError(describeError(start) || t(aiKey("ai.teach.failed")));
      return;
    }
    const job = await waitFor<TeachProposal>(start.data.id);
    setWorking(false);
    if (job.status === "done" && job.result) setDraft(job.result);
    else setError(job.error || t(aiKey("ai.teach.failed")));
  };

  const useDraft = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await aiAgentApi.agents.update(config.id, {
      name: meta.name,
      purpose: draft.purpose,
      personality: draft.personality,
      settings: {
        ...settings,
        greeting: draft.greeting,
        closing: draft.closing,
        knowledge: draft.knowledge,
        default_language: settings.languages.includes(draft.language) ? draft.language : settings.default_language,
      },
    });
    setSaving(false);
    if (res.success) {
      toast({ title: t(aiKey("ai.teach.saved")) });
      setDraft(null);
      setText("");
      setUrl("");
      onChanged();
    } else {
      setError(describeError(res) || t(aiKey("ai.teach.failed")));
    }
  };

  const look = async () => {
    setLooking(true);
    setLearnError("");
    setLearned(null);
    setAnswers({});
    const start = await aiAgentApi.teach.learn(config.id, days);
    if (!start.success || !start.data) {
      setLooking(false);
      setLearnError(describeError(start) || t(aiKey("ai.learn.failed")));
      return;
    }
    const job = await waitFor<LearnResult>(start.data.id);
    setLooking(false);
    if (job.status === "done" && job.result) setLearned(job.result);
    else setLearnError(job.error || t(aiKey("ai.learn.failed")));
  };

  const submitAnswers = async (dismiss: string[] = []) => {
    const items = Object.entries(answers).filter(([, a]) => a.trim()).map(([question, answer]) => ({ question, answer: answer.trim() }));
    if (!items.length && !dismiss.length) return;
    const res = await aiAgentApi.teach.apply(config.id, { items, dismiss });
    if (res.success && res.data) {
      if (items.length) toast({ title: t(aiKey("ai.learn.added"), { n: res.data.added }) });
      const done = new Set([...items.map((i) => i.question), ...dismiss]);
      setLearned((prev) => (prev ? { ...prev, questions: prev.questions.filter((q) => !done.has(q.question)) } : prev));
      setAnswers((prev) => Object.fromEntries(Object.entries(prev).filter(([q]) => !done.has(q))));
      if (items.length) onChanged();
    } else {
      setLearnError(describeError(res) || t(aiKey("ai.learn.failed")));
    }
  };

  const edit = (key: keyof Pick<TeachProposal, "purpose" | "personality" | "greeting" | "closing" | "knowledge">, value: string) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold"><Sparkles className="h-4 w-4 text-primary" />{t(aiKey("ai.teach.title"))}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(aiKey("ai.teach.help"))}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teach-text">{t(aiKey("ai.teach.paste"))}</Label>
            <Textarea id="teach-text" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={t(aiKey("ai.teach.paste_ph"))} disabled={archived || working} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teach-url">{t(aiKey("ai.teach.url"))}</Label>
            <Input id="teach-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t(aiKey("ai.teach.url_ph"))} disabled={archived || working} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {(["replace", "merge"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" name="teach-mode" checked={mode === m} onChange={() => setMode(m)} disabled={working} />
                {t(aiKey(`ai.teach.mode_${m}`))}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void teach()} disabled={archived || working || (text.trim().length < 40 && !url.trim())}>
              {working ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t(aiKey("ai.teach.working"))}</> : t(aiKey("ai.teach.start"))}
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </CardContent>
      </Card>

      {draft && (
        <Card className="border-primary/40">
          <CardContent className="space-y-4 p-4">
            <div>
              <h3 className="text-base font-semibold">{t(aiKey("ai.teach.review"))}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(aiKey("ai.teach.review_help"))}</p>
            </div>
            {draft.warnings.length > 0 && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">{t(aiKey("ai.teach.warnings"))}</p>
                <ul className="ml-5 list-disc">{draft.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            )}
            {draft.gaps.length > 0 && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">{t(aiKey("ai.teach.gaps"))}</p>
                <ul className="ml-5 list-disc">{draft.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
              </div>
            )}
            <div className="space-y-1.5"><Label>{t(aiKey("ai.purpose"))}</Label><Input value={draft.purpose} onChange={(e) => edit("purpose", e.target.value)} maxLength={300} /></div>
            <div className="space-y-1.5"><Label>{t(aiKey("ai.personality"))}</Label><Input value={draft.personality} onChange={(e) => edit("personality", e.target.value)} maxLength={300} /></div>
            <div className="space-y-1.5"><Label>{t(aiKey("ai.f.greeting"))}</Label><Textarea rows={2} value={draft.greeting} onChange={(e) => edit("greeting", e.target.value)} maxLength={600} /></div>
            <div className="space-y-1.5"><Label>{t(aiKey("ai.f.closing"))}</Label><Textarea rows={2} value={draft.closing} onChange={(e) => edit("closing", e.target.value)} maxLength={400} /></div>
            <div className="space-y-1.5">
              <Label>{t(aiKey("ai.f.knowledge"))}</Label>
              <Textarea rows={14} value={draft.knowledge} onChange={(e) => edit("knowledge", e.target.value)} />
              <p className={`text-xs ${draft.knowledge.length > MAX_KNOWLEDGE ? "text-red-700" : "text-muted-foreground"}`}>{t(aiKey("ai.teach.chars"), { n: draft.knowledge.length, max: MAX_KNOWLEDGE })}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void useDraft()} disabled={saving || draft.knowledge.length > MAX_KNOWLEDGE || !draft.knowledge.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(aiKey("ai.teach.use"))}
              </Button>
              <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>{t(aiKey("ai.teach.discard"))}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <h3 className="text-base font-semibold">{t(aiKey("ai.learn.title"))}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(aiKey("ai.learn.help"))}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="learn-days">{t(aiKey("ai.learn.days"))}</Label>
              <select id="learn-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {[7, 30, 90].map((d) => <option key={d} value={d}>{t(aiKey(`ai.learn.d${d}`))}</option>)}
              </select>
            </div>
            <Button variant="outline" onClick={() => void look()} disabled={archived || looking}>
              {looking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t(aiKey("ai.learn.working"))}</> : t(aiKey("ai.learn.find"))}
            </Button>
          </div>
          {learnError && <p role="alert" className="text-sm text-red-700">{learnError}</p>}
          {learned && (
            <div className="space-y-3">
              {learned.note && <p className="text-xs text-muted-foreground">{learned.note}</p>}
              {learned.questions.length === 0 && <p className="text-sm text-muted-foreground">{t(aiKey("ai.learn.none"))}</p>}
              {learned.questions.map((q) => (
                <div key={q.question} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{q.question}</p>
                    <span className="text-xs text-muted-foreground">{t(aiKey("ai.learn.asked"), { n: q.count })} · {t(aiKey(q.why === "handed_over" ? "ai.learn.handed" : "ai.learn.not_sure"))}</span>
                  </div>
                  {q.examples.slice(0, 2).map((e) => <p key={e.call_id + e.text} className="text-xs italic text-muted-foreground">“{e.text}”</p>)}
                  <Textarea rows={2} value={answers[q.question] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.question]: e.target.value }))} placeholder={t(aiKey("ai.learn.answer_ph"))} maxLength={500} />
                  <Button size="sm" variant="ghost" onClick={() => void submitAnswers([q.question])}>{t(aiKey("ai.learn.ignore"))}</Button>
                </div>
              ))}
              {learned.questions.length > 0 && (
                <Button onClick={() => void submitAnswers()} disabled={!Object.values(answers).some((a) => a.trim())}>{t(aiKey("ai.learn.add"))}</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

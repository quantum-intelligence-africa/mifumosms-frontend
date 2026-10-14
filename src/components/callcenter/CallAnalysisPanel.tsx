// The AI reading of a call: a summary people can act on first, the evidence behind it, and the full
// transcript underneath. Everything here is labelled AI-generated; the facts the phone system recorded
// (answered, duration, who) are shown by the call row itself and are never derived from this text.
//
// Supervisors/admins can correct the transcript and the analysis. A correction is a new, attributed
// review: the machine output is kept untouched and can always be shown again.
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";
import type { AnalysisBody, AnalysisJobFull, AnalysisSegment } from "@/services/callCenterApi";

const RESOLUTIONS = ["resolved", "partially_resolved", "unresolved", "unclear"] as const;
const INSUFFICIENT = "Insufficient evidence";

function clock(seconds: number | undefined): string {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function Evidence({ refs, segments, onPick }: { refs: number[]; segments: AnalysisSegment[]; onPick: (i: number) => void }) {
  if (!refs?.length) return null;
  return (
    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
      {refs.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
          aria-label={`${clock(segments[i]?.start)}`}
        >
          {clock(segments[i]?.start)}
        </button>
      ))}
    </span>
  );
}

const tone = (status: string) => (status === "resolved" ? "default" : status === "unresolved" ? "destructive" : "secondary");

export function CallAnalysisPanel({ job, canReview, onChanged, onSeek, onRerun }: { job: AnalysisJobFull; canReview: boolean; onChanged?: () => void; onSeek?: (seconds: number) => void; onRerun?: () => void }) {
  const { t } = useLanguage();
  const result = job.result;
  const [showOriginal, setShowOriginal] = useState(false);
  const [openTranscript, setOpenTranscript] = useState(true); // what was said is the thing people come here for: show it open
  const [highlight, setHighlight] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");

  useEffect(() => {
    if (!canReview) return;
    voiceApi.get<{ models: string[] }>("/audio/asr-models/").then((r) => r.success && r.data && setModels(r.data.models));
  }, [canReview]);

  const reviewed = !!result?.effective?.reviewed && !showOriginal;
  const segments: AnalysisSegment[] = useMemo(
    () => (reviewed ? result?.effective?.segments : result?.segments) ?? [],
    [reviewed, result],
  );
  const analysis: AnalysisBody | null = (reviewed ? result?.effective?.analysis : result?.analysis) ?? null;

  if (job.status === "pending" || job.status === "processing") {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("cc.analysis.working")}</p>;
  }
  if (job.status === "failed" || !result) {
    return (
      <div className="space-y-2 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{t("cc.analysis.failed")}</p>
        {job.error_message && <p className="text-xs text-muted-foreground">{job.error_message}</p>}
      </div>
    );
  }

  const quality = result.transcription_quality;
  const poor = quality && quality.status && quality.status !== "ok";
  const show = (v?: string | null) => (v && v !== INSUFFICIENT ? v : null);
  const pick = (i: number) => {
    setOpenTranscript(true);
    setHighlight(i);
    // Jump the recording to this moment, when the page has a player for it.
    if (onSeek && segments[i]?.start !== undefined) onSeek(segments[i].start as number);
    setTimeout(() => document.getElementById(`seg-${job.id}-${i}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
  };

  const startEdit = () => {
    setDraft((result.effective?.segments ?? result.segments).map((s) => s.text));
    setSummaryDraft(analysis?.summary && analysis.summary !== INSUFFICIENT ? analysis.summary : "");
    setResolutionDraft(analysis?.resolution_status ?? "");
    setEditing(true);
    setOpenTranscript(true);
  };

  const save = async () => {
    setBusy(true);
    const current = result.effective?.segments ?? result.segments;
    const changed = draft.some((text, i) => text !== current[i]?.text);
    const overrides: Record<string, unknown> = {};
    if (summaryDraft.trim() && summaryDraft.trim() !== (analysis?.summary ?? "")) overrides.summary = summaryDraft.trim();
    if (resolutionDraft && resolutionDraft !== analysis?.resolution_status) overrides.resolution_status = resolutionDraft;
    const res = await voiceApi.post(`/audio/${job.id}/review/`, {
      segments: changed ? draft.map((text) => ({ text })) : [],
      analysis_overrides: overrides,
      note: note.trim(),
    });
    setBusy(false);
    if (res.success) {
      setEditing(false);
      setNote("");
      toast({ title: t("cc.analysis.review_saved") });
      onChanged?.();
    } else {
      toast({ title: t("cc.analysis.review_failed"), description: res.error, variant: "destructive" });
    }
  };

  const retry = async () => {
    if (!model) return;
    setBusy(true);
    const res = await voiceApi.post(`/audio/${job.id}/retry/`, { asr_model: model });
    setBusy(false);
    if (res.success) {
      toast({ title: t("cc.analysis.retry_started") });
      onChanged?.();
    } else {
      toast({ title: t("cc.analysis.retry_failed"), description: res.error, variant: "destructive" });
    }
  };

  const statusNote =
    result.analysis_status === "skipped_low_quality" ? t("cc.analysis.skipped_quality")
    : result.analysis_status === "invalid" ? t("cc.analysis.invalid")
    : result.analysis_status === "unavailable" ? t("cc.analysis.unavailable")
    : null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />{t("cc.analysis.title")}</span>
        <Badge variant="outline" className="text-[10px]">{t("cc.analysis.ai_generated")}</Badge>
        {result.effective?.reviewed && (
          <Badge variant="secondary" className="gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" />{t("cc.analysis.reviewed_by", { name: result.review?.reviewer_name || "—" })}</Badge>
        )}
      </div>

      {poor && (
        <div className={`flex gap-2 rounded-md border p-3 text-xs ${quality.status === "failed" ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">{quality.status === "failed" ? t("cc.analysis.quality_failed") : t("cc.analysis.quality_review")}</p>
            <ul className="list-disc pl-4">{quality.reasons.map((r) => <li key={r.code}>{r.message}</li>)}</ul>
          </div>
        </div>
      )}

      {statusNote && <p className="flex gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{statusNote}</p>}

      {analysis ? (
        <div className="space-y-3">
          <Section title={t("cc.analysis.summary")}><p className="text-foreground">{show(analysis.summary) ?? t("cc.analysis.insufficient")}</p></Section>
          {show(analysis.customer_issue) && <Section title={t("cc.analysis.issue")}><p>{analysis.customer_issue}</p></Section>}
          {show(analysis.call_purpose) && <Section title={t("cc.analysis.purpose")}><p>{analysis.call_purpose}</p></Section>}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={tone(analysis.resolution_status)} className="capitalize">{t("cc.analysis.resolution")}: {analysis.resolution_status.replace(/_/g, " ")}</Badge>
            {analysis.sentiment !== "unknown" && <Badge variant="outline" className="capitalize">{t("cc.analysis.sentiment")}: {analysis.sentiment}</Badge>}
            {analysis.follow_up_required?.required != null && (
              <Badge variant={analysis.follow_up_required.required ? "destructive" : "outline"}>
                {analysis.follow_up_required.required ? t("cc.analysis.follow_up_yes") : t("cc.analysis.follow_up_no")}
              </Badge>
            )}
          </div>
          {analysis.follow_up_required?.reason && <p className="text-xs text-muted-foreground">{analysis.follow_up_required.reason}</p>}

          {analysis.key_findings?.length > 0 && (
            <Section title={t("cc.analysis.findings")}>
              <ul className="list-disc space-y-1 pl-4">{analysis.key_findings.map((f, i) => <li key={i}>{f.text}<Evidence refs={f.evidence} segments={segments} onPick={pick} /></li>)}</ul>
            </Section>
          )}
          {(analysis.actions_taken?.length > 0 || analysis.decisions?.length > 0) && (
            <Section title={t("cc.analysis.actions")}>
              <ul className="list-disc space-y-1 pl-4">
                {analysis.actions_taken?.map((a, i) => <li key={`a${i}`}>{a.text}<Evidence refs={a.evidence} segments={segments} onPick={pick} /></li>)}
                {analysis.decisions?.map((d, i) => <li key={`d${i}`}><b>{t("cc.analysis.decision")}:</b> {d.text}<Evidence refs={d.evidence} segments={segments} onPick={pick} /></li>)}
              </ul>
            </Section>
          )}
          {analysis.action_items?.length > 0 && (
            <Section title={t("cc.analysis.tasks")}>
              <ul className="space-y-1.5">
                {analysis.action_items.map((a, i) => (
                  <li key={i} className="rounded border border-border bg-background px-2.5 py-1.5">
                    {a.task}<Evidence refs={a.evidence} segments={segments} onPick={pick} />
                    {(a.owner || a.deadline) && <p className="text-xs text-muted-foreground">{[a.owner, a.deadline].filter(Boolean).join(" · ")}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {analysis.uncertainties?.length > 0 && (
            <Section title={t("cc.analysis.uncertain")}><ul className="list-disc pl-4 text-xs text-muted-foreground">{analysis.uncertainties.map((u, i) => <li key={i}>{u}</li>)}</ul></Section>
          )}
        </div>
      ) : result.analysis_status === "legacy" && (result.summary || result.detected_intent) ? (
        <div className="space-y-2">
          {result.summary && <Section title={t("cc.analysis.summary")}><p>{result.summary}</p></Section>}
          {result.detected_intent && <Section title={t("cc.analysis.purpose")}><p>{result.detected_intent}</p></Section>}
          <p className="text-xs text-muted-foreground">{t("cc.analysis.legacy")}</p>
        </div>
      ) : null}

      <details open={openTranscript} onToggle={(e) => setOpenTranscript((e.target as HTMLDetailsElement).open)} className="rounded-md border border-border">
        <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-semibold text-foreground">
          {t("cc.analysis.transcript")}<ChevronDown className="h-3.5 w-3.5" />
        </summary>
        <div className="max-h-96 space-y-2 overflow-y-auto border-t border-border bg-muted/30 p-3">
          {segments.length === 0 ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result.transcript || t("cc.analysis.no_words")}</p>
          ) : segments.map((s, i) => (
            <div key={i} id={`seg-${job.id}-${i}`} className={`flex gap-3 rounded px-1.5 py-1.5 text-sm leading-relaxed ${highlight === i ? "bg-primary/10" : ""}`}>
              {onSeek && s.start !== undefined ? (
                <button type="button" onClick={() => { setHighlight(i); onSeek(s.start as number); }} className="w-12 shrink-0 text-left font-mono text-primary hover:underline" title={t("cc.analysis.play_from")}>
                  {clock(s.start)}
                </button>
              ) : (
                <span className="w-12 shrink-0 font-mono text-muted-foreground">{clock(s.start)}</span>
              )}
              <div className="min-w-0 flex-1">
                {s.speaker && <span className="mr-1.5 font-medium text-foreground/70">{s.speaker.replace("_", " ")}:</span>}
                {editing ? (
                  <Textarea value={draft[i] ?? ""} onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))} rows={3} className="mt-1 text-xs" />
                ) : (
                  <span className={`text-foreground ${s.uncertain ? "underline decoration-amber-500 decoration-dotted underline-offset-2" : ""}`} title={s.uncertain ? t("cc.analysis.uncertain_segment") : undefined}>{s.text}</span>
                )}
                {s.edited && <span className="ml-1 text-[10px] text-primary">{t("cc.analysis.edited")}</span>}
              </div>
            </div>
          ))}
          {result.effective?.reviewed && (
            <button type="button" className="text-[11px] font-medium text-primary underline" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? t("cc.analysis.show_reviewed") : t("cc.analysis.show_original")}
            </button>
          )}
        </div>
      </details>

      {canReview && (
        <div className="space-y-3 rounded-md border border-dashed border-border p-3">
          {editing ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("cc.analysis.review_hint")}</p>
              <Textarea value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)} rows={3} placeholder={t("cc.analysis.summary")} className="text-xs" />
              <Select value={resolutionDraft} onValueChange={setResolutionDraft}>
                <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder={t("cc.analysis.resolution")} /></SelectTrigger>
                <SelectContent>{RESOLUTIONS.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={1} maxLength={500} placeholder={t("cc.analysis.note")} className="text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("cc.analysis.save_review")}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={busy}>{t("cc.analysis.cancel")}</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={startEdit}><Pencil className="h-3.5 w-3.5" />{t("cc.analysis.correct")}</Button>
              {onRerun && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onRerun}><RefreshCw className="h-3.5 w-3.5" />{t("cc.analysis.rerun")}</Button>
              )}
            </div>
          )}
          {models.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-8 w-64 text-xs"><SelectValue placeholder={t("cc.analysis.retry_model")} /></SelectTrigger>
                <SelectContent>{models.filter((m) => m !== result.asr_model).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={retry} disabled={!model || busy}><RefreshCw className="h-3.5 w-3.5" />{t("cc.analysis.retry")}</Button>
            </div>
          )}
        </div>
      )}

      {(result.asr_model || result.llm_model) && (
        <p className="text-[10px] text-muted-foreground">{t("cc.analysis.models", { asr: result.asr_model || "—", llm: result.llm_model || "—" })}</p>
      )}
    </div>
  );
}

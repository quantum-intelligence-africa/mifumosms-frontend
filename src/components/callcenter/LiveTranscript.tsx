import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { formatDuration } from "./callUtils";
import { mergeLine, type TranscriptLine } from "./liveTranscriptLogic";

// Live transcript for the call in progress. The server sends `live_transcript` events through the existing call-center socket:
//   partial  - the utterance so far; it can still change, so it is shown faded and in italics
//   final    - the utterance as it was finally heard; it is never replaced by a later partial
// Nothing appears (and the panel stays hidden) until the first event arrives, so a call whose audio is not being transcribed looks exactly as before.

type Status = "loading" | "ready" | "unavailable" | "overloaded" | "error";

export function LiveTranscript({ callId }: { callId: string | null }) {
  const { subscribe } = useCallCenter();
  const { t } = useLanguage();
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLines([]);
    setStatus(null);
    setMessage("");
  }, [callId]);

  useEffect(() => {
    if (!callId) return;
    return subscribe((evt) => {
      const d = evt.data as Record<string, unknown>;
      if (String(d.call_id ?? "") !== callId) return;
      if (evt.event === "live_transcript_status") {
        setStatus(String(d.state) as Status);
        setMessage(typeof d.message === "string" ? d.message : "");
        return;
      }
      if (evt.event !== "live_transcript") return;
      const incoming: TranscriptLine = {
        id: String(d.segment_id ?? ""),
        speaker: String(d.speaker ?? "customer"),
        text: String(d.text ?? ""),
        final: d.is_final === true,
        start: Number(d.start ?? 0),
        sequence: Number(d.sequence ?? 0),
        unclear: d.low_confidence === true,
      };
      if (!incoming.id || !incoming.text) return;
      setStatus((s) => (s === "loading" || s === null ? "ready" : s));
      setLines((prev) => mergeLine(prev, incoming));
    });
  }, [callId, subscribe]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  if (!lines.length && !status) return null;

  const speakerLabel = (speaker: string) => (speaker === "agent" ? t("cc.live.agent") : t("cc.live.customer"));
  const note =
    status === "loading" ? t("cc.live.loading")
    : status === "unavailable" ? t("cc.live.unavailable")
    : status === "overloaded" ? t("cc.live.overloaded")
    : status === "error" ? t("cc.live.error")
    : "";

  return (
    <section className="mt-3 rounded-lg border border-border bg-background" aria-label={t("cc.live.title")}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.live.title")}</p>
        {note && (
          <p className={cn("text-[11px]", status === "unavailable" || status === "error" ? "text-red-600" : "text-amber-600")} title={message || undefined}>
            {note}
          </p>
        )}
      </div>
      <div className="max-h-40 space-y-1.5 overflow-y-auto px-3 py-2 text-sm" aria-live="polite">
        {lines.map((l) => (
          <p key={l.id} className={cn("leading-snug", l.final ? "text-foreground" : "italic text-muted-foreground")}>
            <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">{formatDuration(Math.floor(l.start))}</span>
            <span className="mr-1 text-[11px] font-semibold text-primary">{speakerLabel(l.speaker)}:</span>
            {l.text}
            {!l.final && <span aria-hidden> …</span>}
            {l.unclear && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">{t("cc.live.unclear")}</span>}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}

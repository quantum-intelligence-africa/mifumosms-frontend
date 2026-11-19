// One player for a whole page. Rows show a single play button; whatever is
// playing shows up in this bar at the bottom of the screen with the caller,
// a scrubber and the time — the way a call-centre console does it, rather
// than a browser <audio> widget squeezed into every row.
import { useEffect, useRef, useState } from "react";
import { Pause, Play, X, Download, Loader2, PhoneIncoming, PhoneOutgoing, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { enhancementApi, type RecordingEnhancement } from "@/services/enhancementApi";

export interface PlayerTrack {
  id: string;
  url: string;
  /** Who the recording is with (the caller for inbound, the customer for outbound). */
  title: string;
  /** Second line: number called, agent, date. */
  subtitle?: string;
  direction?: "inbound" | "outbound";
  durationSeconds?: number | null;
  /** Begin playback here (seconds) instead of at the top — used when a transcript timestamp is clicked. */
  startAtSeconds?: number;
  /** The call recording's id. When set, the bar offers the noise-reduced copy (listen, compare, download, make it again). */
  recordingId?: string;
}

export const SEEK_EVENT = "recording-seek";

interface RecordingPlayerBarProps {
  track: PlayerTrack | null;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onClose: () => void;
}

export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatLength(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingPlayerBar({ track, playing, onPlayingChange, onClose }: RecordingPlayerBarProps) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  // The noise-reduced copy of this recording, when the organization uses that feature.
  const [enh, setEnh] = useState<RecordingEnhancement | null>(null);
  const [source, setSource] = useState<"original" | "enhanced">("original");
  const [working, setWorking] = useState(false);

  // A plain <a href> to a cross-origin URL (the recording lives on the
  // voice backend's own domain, not this app's) opens a new tab in most
  // browsers instead of downloading, since the `download` attribute is
  // unreliable across origins. Fetching the bytes ourselves and saving from
  // a same-origin blob: URL keeps the user on this page and always saves.
  const saveFrom = async (url: string, label = "") => {
    if (!track || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const type = blob.type || "";
      const ext = type.includes("wav") ? "wav" : type.includes("mpeg") || type.includes("mp3") ? "mp3" : url.split("?")[0].split(".").pop() || "mp3";
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${track.title.replace(/[^\w+-]+/g, "_")}_${track.id.slice(0, 8)}${label ? `_${label}` : ""}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Last resort: let the browser handle it its own way rather than
      // silently doing nothing on a failed fetch (e.g. blocked by CORS).
      window.open(url, "_blank", "noreferrer");
    } finally {
      setDownloading(false);
    }
  };
  const downloadTrack = () => saveFrom(source === "enhanced" && enh?.enhanced_download_url ? enh.enhanced_download_url : track?.url ?? "", source === "enhanced" ? "enhanced" : "");

  // Load the enhancement status for a recording, and keep watching it while it is being made.
  useEffect(() => {
    setEnh(null);
    setSource("original");
    const id = track?.recordingId;
    if (!id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      const res = await enhancementApi.forRecording(id);
      if (stopped) return;
      if (res.success && res.data) {
        setEnh(res.data);
        if (res.data.status === "pending" || res.data.status === "processing") timer = setTimeout(poll, 4000);
      }
    };
    void poll();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.recordingId]);

  // Original <-> enhanced while listening: the position and play state are kept so the two can be compared at the same moment.
  const switchTo = (next: "original" | "enhanced") => {
    const audio = audioRef.current;
    if (!audio || !track || next === source) return;
    const url = next === "enhanced" ? enh?.enhanced_url : track.url;
    if (!url) return;
    const at = audio.currentTime;
    const wasPlaying = !audio.paused;
    setSource(next);
    audio.src = url;
    audio.load();
    audio.addEventListener("loadedmetadata", () => {
      audio.currentTime = at;
      if (wasPlaying) audio.play().then(() => onPlayingChange(true)).catch(() => onPlayingChange(false));
    }, { once: true });
  };

  const makeCopy = async (force: boolean) => {
    if (!track?.recordingId || working) return;
    setWorking(true);
    const res = await enhancementApi.make(track.recordingId, force);
    setWorking(false);
    if (res.success && res.data) {
      setEnh(res.data);
      // the status watcher above only starts with a new track: wake it for this one
      const id = track.recordingId;
      const again = async () => {
        const next = await enhancementApi.forRecording(id);
        if (next.success && next.data) {
          setEnh(next.data);
          if (next.data.status === "pending" || next.data.status === "processing") setTimeout(again, 4000);
        }
      };
      setTimeout(again, 4000);
    } else {
      toast({ title: t("enh.request_failed"), description: res.error || res.message, variant: "destructive" });
    }
  };

  // Stop dead: pause and unload, so nothing keeps playing once the bar is
  // closed, another track replaces this one, or the page is left.
  const silence = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setCurrent(0);
  };

  // New track: load it and start from the top. No track: silence.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!track) {
      silence();
      return;
    }
    audio.src = track.url;
    audio.load();
    setCurrent(track.startAtSeconds ?? 0);
    if (track.startAtSeconds) {
      // The position can only be set once the file's length is known.
      audio.addEventListener("loadedmetadata", () => { audio.currentTime = track.startAtSeconds ?? 0; }, { once: true });
    }
    setDuration(track.durationSeconds ?? 0);
    audio.play().then(() => onPlayingChange(true)).catch(() => onPlayingChange(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // A click on a transcript timestamp while this recording is already loaded: jump there and play.
  useEffect(() => {
    const onSeek = (event: Event) => {
      const { id, seconds } = (event as CustomEvent<{ id: string; seconds: number }>).detail;
      const audio = audioRef.current;
      if (!audio || !track || track.id !== id) return;
      audio.currentTime = seconds;
      setCurrent(seconds);
      audio.play().then(() => onPlayingChange(true)).catch(() => onPlayingChange(false));
    };
    window.addEventListener(SEEK_EVENT, onSeek);
    return () => window.removeEventListener(SEEK_EVENT, onSeek);
  }, [track, onPlayingChange]);

  // Leaving the page (route change) must not leave audio running.
  useEffect(() => () => silence(), []);

  // Play/pause driven from the rows' buttons.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing && audio.paused) audio.play().catch(() => onPlayingChange(false));
    if (!playing && !audio.paused) audio.pause();
  }, [playing, track, onPlayingChange]);

  const showEnh = Boolean(track?.recordingId && enh && (enh.enabled || enh.status !== "none"));
  const Icon = track?.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
  const total = duration || track?.durationSeconds || 0;

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        hidden
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onEnded={() => onPlayingChange(false)}
        onPause={() => onPlayingChange(false)}
        onPlay={() => onPlayingChange(true)}
      />
      {track && (
      <div
        role="region"
        aria-label={t("voice.recording_player.region_aria")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-card/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur",
          "md:left-[240px]",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-6">
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={() => onPlayingChange(!playing)}
            aria-label={playing ? t("voice.recording_player.pause_aria") : t("voice.recording_player.play_aria")}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", track.direction === "outbound" ? "text-blue-600" : "text-emerald-600")} />
              <span className="truncate">{track.title}</span>
              {showEnh && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    source === "enhanced" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground",
                  )}
                >
                  {source === "enhanced" ? t("enh.enhanced") : t("enh.original")}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{formatClock(current)}</span>
              <input
                type="range"
                min={0}
                max={total || 0}
                step={0.5}
                value={Math.min(current, total || 0)}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = t;
                  setCurrent(t);
                }}
                className="h-1.5 flex-1 cursor-pointer accent-primary"
                aria-label={t("voice.recording_player.seek_aria")}
              />
              <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{formatClock(total)}</span>
            </div>
            {track.subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{track.subtitle}</p>}
            {showEnh && enh && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div role="group" aria-label={t("enh.compare_hint")} title={t("enh.compare_hint")} className="inline-flex overflow-hidden rounded-md border border-border text-[11px] font-semibold">
                  <button type="button" onClick={() => switchTo("original")} aria-pressed={source === "original"}
                    className={cn("px-2 py-0.5", source === "original" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent")}>
                    {t("enh.original")}
                  </button>
                  <button type="button" onClick={() => switchTo("enhanced")} disabled={!enh.enhanced_url} aria-pressed={source === "enhanced"}
                    title={enh.metrics?.after ? `${enh.engine} · ${enh.intensity}${enh.metrics.before?.mean_db != null && enh.metrics.after.mean_db != null ? ` · ${enh.metrics.before.mean_db} → ${enh.metrics.after.mean_db} dB` : ""}` : undefined}
                    className={cn("flex items-center gap-1 px-2 py-0.5", source === "enhanced" ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-accent", !enh.enhanced_url && "cursor-not-allowed opacity-40")}>
                    <Sparkles className="h-3 w-3" />
                    {t("enh.enhanced")}
                  </button>
                </div>
                <span className={cn("flex items-center gap-1 text-[11px]", enh.status === "failed" ? "text-destructive" : "text-muted-foreground")} title={enh.status === "failed" ? enh.error : undefined}>
                  {(enh.status === "pending" || enh.status === "processing") && <Loader2 className="h-3 w-3 animate-spin" />}
                  {enh.status === "none" && !enh.enabled ? t("enh.off_hint") : t(`enh.status.${enh.status}`)}
                </span>
                {enh.enabled && (enh.status === "none" || enh.status === "failed" || enh.status === "ready" || enh.status === "skipped") && (
                  <button type="button" onClick={() => makeCopy(enh.status === "ready" || enh.status === "skipped")} disabled={working}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-60">
                    {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    {enh.status === "none" ? t("enh.make") : enh.status === "failed" ? t("enh.retry") : t("enh.regenerate")}
                  </button>
                )}
                <button type="button" onClick={() => saveFrom(enh.original_download_url, "original")} disabled={downloading}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-60">
                  <Download className="h-3 w-3" />{t("enh.download_original")}
                </button>
                {enh.enhanced_download_url && (
                  <button type="button" onClick={() => saveFrom(enh.enhanced_download_url, "enhanced")} disabled={downloading}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-60">
                    <Download className="h-3 w-3" />{t("enh.download_enhanced")}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={downloadTrack}
            disabled={downloading}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60 sm:flex"
            aria-label={t("voice.recording_player.download_aria")}
            title={t("voice.recording_player.download_title")}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              silence();
              onClose();
            }}
            aria-label={t("voice.recording_player.close_aria")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}
    </>
  );
}

/** Small state helper shared by the pages: which track, and is it playing. */
export function useRecordingPlayer() {
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = (next: PlayerTrack) => {
    if (track?.id === next.id) {
      setPlaying((p) => !p);
    } else {
      setTrack(next);
      setPlaying(true);
    }
  };
  /** Play ``next`` from ``seconds``: jump if it is already loaded, otherwise start it there. */
  const seek = (next: PlayerTrack, seconds: number) => {
    if (track?.id === next.id) {
      window.dispatchEvent(new CustomEvent(SEEK_EVENT, { detail: { id: next.id, seconds } }));
      setPlaying(true);
    } else {
      setTrack({ ...next, startAtSeconds: seconds });
      setPlaying(true);
    }
  };
  const close = () => {
    setTrack(null);
    setPlaying(false);
  };
  const isPlaying = (id: string) => track?.id === id && playing;
  const isCurrent = (id: string) => track?.id === id;

  return { track, playing, setPlaying, toggle, seek, close, isPlaying, isCurrent };
}

/** The per-row button: play, or pause when this row is the one playing. */
export function PlayButton({
  active,
  playing,
  onClick,
  label,
}: {
  active: boolean;
  playing: boolean;
  onClick: () => void;
  label?: string;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={playing ? t("voice.recording_player.pause_aria") : label ?? t("voice.recording_player.play_recording_aria")}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-primary hover:bg-primary/10",
      )}
    >
      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
    </button>
  );
}

/** Two-letter avatar for an agent name, like a console's agent chip. */
export function AgentChip({ name, department }: { name?: string | null; department?: string | null }) {
  if (!name) return <span className="text-sm text-muted-foreground">—</span>;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-2" title={department && department !== name ? department : undefined}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground/70">
        {initials}
      </span>
      <span className="truncate text-sm text-foreground">{name}</span>
    </span>
  );
}

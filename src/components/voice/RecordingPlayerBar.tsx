// One player for a whole page. Rows show a single play button; whatever is
// playing shows up in this bar at the bottom of the screen with the caller,
// a scrubber and the time — the way a call-centre console does it, rather
// than a browser <audio> widget squeezed into every row.
import { useEffect, useRef, useState } from "react";
import { Pause, Play, X, Download, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlayerTrack {
  id: string;
  url: string;
  /** Who the recording is with (the caller for inbound, the customer for outbound). */
  title: string;
  /** Second line: number called, agent, date. */
  subtitle?: string;
  direction?: "inbound" | "outbound";
  durationSeconds?: number | null;
}

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

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
    setCurrent(0);
    setDuration(track.durationSeconds ?? 0);
    audio.play().then(() => onPlayingChange(true)).catch(() => onPlayingChange(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // Leaving the page (route change) must not leave audio running.
  useEffect(() => () => silence(), []);

  // Play/pause driven from the rows' buttons.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing && audio.paused) audio.play().catch(() => onPlayingChange(false));
    if (!playing && !audio.paused) audio.pause();
  }, [playing, track, onPlayingChange]);

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
        aria-label="Kicheza rekodi"
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
            aria-label={playing ? "Simamisha" : "Cheza"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", track.direction === "outbound" ? "text-blue-600" : "text-emerald-600")} />
              <span className="truncate">{track.title}</span>
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
                aria-label="Sogeza"
              />
              <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{formatClock(total)}</span>
            </div>
            {track.subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{track.subtitle}</p>}
          </div>

          <a
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
            aria-label="Pakua rekodi"
            title="Pakua"
          >
            <Download className="h-4 w-4" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              silence();
              onClose();
            }}
            aria-label="Funga kicheza"
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
  const close = () => {
    setTrack(null);
    setPlaying(false);
  };
  const isPlaying = (id: string) => track?.id === id && playing;
  const isCurrent = (id: string) => track?.id === id;

  return { track, playing, setPlaying, toggle, close, isPlaying, isCurrent };
}

/** The per-row button: play, or pause when this row is the one playing. */
export function PlayButton({
  active,
  playing,
  onClick,
  label = "Cheza rekodi",
}: {
  active: boolean;
  playing: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={playing ? "Simamisha" : label}
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

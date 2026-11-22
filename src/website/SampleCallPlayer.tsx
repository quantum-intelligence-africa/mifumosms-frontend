import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, CheckCircle2, Languages, Pause, Play, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_CALL, SAMPLE_LINES, fmtTime, useContent } from "./content";
import { useSiteLang } from "./i18n";
import { Tag, focusRing } from "./Layout";

/**
 * Playback for the staged sample call. Uses the recorded file when it exists; until the
 * recording is approved it runs a silent, timed walk through the transcript so reviewers can
 * judge layout and pacing. The fallback is announced on screen, never hidden.
 */
export function useSamplePlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const duration = SAMPLE_CALL.durationSec;

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    const ok = () => setHasAudio(true);
    const bad = () => setHasAudio(false);
    a.addEventListener("loadedmetadata", ok);
    a.addEventListener("error", bad);
    a.addEventListener("timeupdate", () => setT(a.currentTime));
    a.addEventListener("ended", () => setPlaying(false));
    a.src = SAMPLE_CALL.audioSrc;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
    };
  }, []);

  // Silent timed preview when there is no recording.
  useEffect(() => {
    if (!playing || hasAudio) return;
    const started = performance.now() - t * 1000;
    const id = window.setInterval(() => {
      const next = (performance.now() - started) / 1000;
      if (next >= duration) {
        setT(duration);
        setPlaying(false);
      } else setT(next);
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, hasAudio]);

  const play = useCallback(() => {
    if (t >= duration) setT(0);
    if (hasAudio && audioRef.current) {
      if (audioRef.current.currentTime >= duration) audioRef.current.currentTime = 0;
      void audioRef.current.play();
    }
    setPlaying(true);
  }, [hasAudio, t, duration]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const seek = useCallback(
    (sec: number) => {
      const v = Math.min(Math.max(sec, 0), duration);
      setT(v);
      if (hasAudio && audioRef.current) audioRef.current.currentTime = v;
    },
    [hasAudio, duration],
  );

  return { playing, t, duration, hasAudio, play, pause, seek, toggle: playing ? pause : play };
}

type Playback = ReturnType<typeof useSamplePlayback>;

function Waveform({ progress }: { progress: number }) {
  // Deterministic bar heights so the waveform is identical on every render.
  const bars = Array.from({ length: 44 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  return (
    <div className="flex h-12 min-w-0 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className={cn("w-[3px] flex-shrink-0 rounded-full", i / bars.length <= progress ? "bg-[#2563EB]" : "bg-[#C9D3E3]")}
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );
}

function PlayButton({ p, size = "lg" }: { p: Playback; size?: "lg" | "md" }) {
  const { tr } = useSiteLang();
  return (
    <button
      type="button"
      onClick={p.toggle}
      aria-label={p.playing ? tr("Pause sample call", "Simamisha simu ya mfano") : tr("Play sample call", "Cheza simu ya mfano")}
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/25 hover:bg-[#1D4ED8]",
        focusRing,
        size === "lg" ? "h-14 w-14" : "h-11 w-11",
      )}
    >
      {p.playing ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-0.5 h-6 w-6" fill="currentColor" />}
    </button>
  );
}

function Scrubber({ p }: { p: Playback }) {
  const { tr } = useSiteLang();
  return (
    <div className="flex flex-1 items-center gap-3">
      <span className="w-10 text-right text-sm tabular-nums text-[#4B5565]">{fmtTime(p.t)}</span>
      <input
        type="range"
        min={0}
        max={p.duration}
        step={0.5}
        value={p.t}
        onChange={(e) => p.seek(Number(e.target.value))}
        aria-label={tr("Seek within the sample call", "Sogeza ndani ya simu ya mfano")}
        aria-valuetext={tr(`${fmtTime(p.t)} of ${fmtTime(p.duration)}`, `${fmtTime(p.t)} kati ya ${fmtTime(p.duration)}`)}
        className={cn("h-2 flex-1 cursor-pointer accent-[#2563EB]", focusRing)}
      />
      <span className="w-10 text-sm tabular-nums text-[#4B5565]">{fmtTime(p.duration)}</span>
    </div>
  );
}

function Transcript({ p }: { p: Playback }) {
  const { tr } = useSiteLang();
  const [tab, setTab] = useState<"sw" | "en">("sw");
  const [sideBySide, setSideBySide] = useState(false);
  const activeIdx = SAMPLE_LINES.reduce((acc, l, i) => (p.t >= l.at ? i : acc), -1);
  const speaker = (who: string, lang: "sw" | "en") =>
    who === "customer" ? (lang === "sw" ? "Mteja" : "Customer") : lang === "sw" ? "Mhudumu" : "Agent";

  const renderLines = (lang: "sw" | "en") => (
    <ol className="space-y-1">
      {SAMPLE_LINES.map((l, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => p.seek(l.at)}
            className={cn(
              "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
              focusRing,
              i === activeIdx ? "bg-[#EAF1FF]" : "hover:bg-[#F5F6F8]",
            )}
          >
            <span className="w-9 flex-shrink-0 pt-0.5 text-xs tabular-nums text-[#5B6575]">{fmtTime(l.at)}</span>
            <span
              className={cn(
                "h-fit flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                l.who === "customer" ? "bg-[#EEF0F4] text-[#3F4A5A]" : "bg-[#EAF1FF] text-[#1D4ED8]",
              )}
            >
              {speaker(l.who, lang)}
            </span>
            <span className="text-[15px] leading-relaxed text-[#0B1B3F]">{lang === "sw" ? l.sw : l.en}</span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="rounded-2xl border border-[#E3E7EE] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E7EE] px-3 sm:px-4">
        <div role="tablist" aria-label={tr("Transcript language", "Lugha ya maandishi")} className="flex">
          {(["sw", "en"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={tab === k}
              disabled={sideBySide}
              onClick={() => setTab(k)}
              className={cn(
                "-mb-px border-b-2 px-3 py-3 text-sm font-semibold",
                focusRing,
                sideBySide || tab === k ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#4B5565] hover:text-[#0B1B3F]",
              )}
            >
              {k === "sw" ? tr("Transcript (Kiswahili)", "Maandishi (Kiswahili)") : tr("Translation (English)", "Tafsiri (Kiingereza)")}
            </button>
          ))}
        </div>
        <label className="hidden items-center gap-2 py-2 text-sm text-[#3F4A5A] lg:flex">
          <Languages className="h-4 w-4" aria-hidden />
          {tr("Side by side", "Bega kwa bega")}
          <input
            type="checkbox"
            checked={sideBySide}
            onChange={(e) => setSideBySide(e.target.checked)}
            className={cn("h-4 w-4 accent-[#2563EB]", focusRing)}
          />
        </label>
      </div>
      <div className={cn("p-2 sm:p-3", sideBySide && "lg:grid lg:grid-cols-2 lg:gap-3")}>
        {sideBySide ? (
          <>
            {renderLines("sw")}
            <div className="border-t border-[#E3E7EE] pt-2 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">{renderLines("en")}</div>
          </>
        ) : (
          <div role="tabpanel">{renderLines(tab)}</div>
        )}
      </div>
    </div>
  );
}

/** Hero call card that expands in place into the full player. */
export function SampleCallCard({
  expanded,
  onExpand,
  onCollapse,
  playback,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  playback: Playback;
}) {
  const p = playback;
  const { tr } = useSiteLang();
  const { SAMPLE_CALL } = useContent();
  return (
    <div
      id="sample-call"
      className="scroll-mt-24 rounded-3xl border border-[#E3E7EE] bg-white p-5 shadow-xl shadow-[#0B1B3F]/[0.06] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
            <AudioLines className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold text-[#0B1B3F]">{SAMPLE_CALL.title}</p>
            <p className="text-sm text-[#4B5565]">
              {SAMPLE_CALL.route} · Kiswahili · {fmtTime(SAMPLE_CALL.durationSec)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag>{tr("Staged sample", "Mfano ulioigizwa")}</Tag>
          {expanded && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label={tr("Close the expanded player", "Funga kicheza kilichopanuliwa")}
              className={cn("rounded-lg p-1.5 text-[#4B5565] hover:bg-[#F5F6F8]", focusRing)}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#F5F6F8] p-4">
        <PlayButton
          p={p}
          size={expanded ? "md" : "lg"}
        />
        {expanded ? (
          <Scrubber p={p} />
        ) : (
          <>
            <Waveform progress={p.t / p.duration} />
            <span className="text-sm tabular-nums text-[#4B5565]">{fmtTime(p.playing || p.t ? p.t : p.duration)}</span>
          </>
        )}
      </div>

      {p.hasAudio === false && (p.playing || expanded) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8A5300]" role="status">
          {tr(
            "Preview: the audio recording is being finalised, so playback follows the transcript silently.",
            "Onyesho la awali: rekodi ya sauti inakamilishwa, hivyo uchezaji unafuata maandishi bila sauti.",
          )}
        </p>
      )}

      {expanded ? (
        <div className="mt-4 space-y-4">
          <Transcript p={p} />
          <div className="flex items-start gap-3 rounded-2xl border border-[#D6E2FB] bg-[#F4F8FF] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563EB]" aria-hidden />
            <div>
              <p className="font-semibold text-[#0B1B3F]">{tr("Recommended next step", "Hatua inayopendekezwa")}</p>
              <p className="text-sm text-[#3F4A5A]">{SAMPLE_CALL.nextStep}</p>
            </div>
          </div>
          {p.t >= p.duration && (
            <button type="button" onClick={() => p.seek(0)} className={cn("inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]", focusRing)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> {tr("Play again", "Cheza tena")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-start gap-3 border-t border-[#E3E7EE] pt-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563EB]" aria-hidden />
            <div>
              <p className="font-semibold text-[#0B1B3F]">{tr("Recommended next step", "Hatua inayopendekezwa")}</p>
              <p className="text-sm text-[#3F4A5A]">{SAMPLE_CALL.nextStep}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExpand}
            className={cn("mt-4 text-sm font-semibold text-[#2563EB] hover:underline", focusRing)}
          >
            {tr("Open transcript and translation", "Fungua maandishi na tafsiri")}
          </button>
        </>
      )}
    </div>
  );
}

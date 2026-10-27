// Record a voice note with the microphone and hand it back as a file. Nothing is uploaded here; the inbox sends it like any other audio file.
// The browser decides the format: OGG/Opus (Firefox) and MP4/AAC (Safari) go to WhatsApp as they are; WebM (Chrome) is converted by the server.
import { useEffect, useRef, useState } from "react";
import { Mic, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: { record: "Rekodi ujumbe wa sauti", cancel: "Ghairi rekodi", send: "Tuma ujumbe wa sauti", recording: "Inarekodi", denied: "Ruhusa ya kipaza sauti imekataliwa. Iruhusu kwenye mipangilio ya kivinjari.", unsupported: "Kivinjari hiki hakiwezi kurekodi sauti.", short: "Rekodi ni fupi mno." },
  en: { record: "Record a voice note", cancel: "Cancel recording", send: "Send voice note", recording: "Recording", denied: "Microphone permission was denied. Allow it in your browser settings.", unsupported: "This browser cannot record audio.", short: "The recording is too short." },
};

/** Longest voice note, in seconds (a WhatsApp audio message is limited to 16 MB; this stays far below that). */
const MAX_SECONDS = 300;
const MIN_SECONDS = 1;
const FORMATS: Array<{ mime: string; ext: string }> = [
  { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  { mime: "audio/mp4", ext: "m4a" },
  { mime: "audio/webm;codecs=opus", ext: "webm" },
  { mime: "audio/webm", ext: "webm" },
];

const canRecord = () => typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

interface Props {
  disabled?: boolean;
  onRecorded: (file: File) => void;
  onNotice: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function VoiceRecorder({ disabled, onRecorded, onNotice, onBusyChange }: Props) {
  const T = TEXT[appLanguage()];
  const [seconds, setSeconds] = useState<number | null>(null);  // null = not recording
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const keep = useRef(false);
  const timer = useRef<number | null>(null);
  const format = useRef<{ mime: string; ext: string } | null>(null);

  const release = () => {
    if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
    setSeconds(null);
    onBusyChange?.(false);
  };
  useEffect(() => () => { keep.current = false; if (recorder.current?.state === "recording") recorder.current.stop(); release(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    if (!canRecord()) { onNotice(T.unsupported); return; }
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onNotice(T.denied);
      return;
    }
    stream.current = media;
    const chosen = FORMATS.find((f) => MediaRecorder.isTypeSupported(f.mime)) ?? null;
    format.current = chosen;
    const rec = chosen ? new MediaRecorder(media, { mimeType: chosen.mime }) : new MediaRecorder(media);
    chunks.current = [];
    keep.current = false;
    let length = 0;
    rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    rec.onstop = () => {
      const wanted = keep.current;
      const blob = new Blob(chunks.current, { type: rec.mimeType || chosen?.mime || "audio/webm" });
      const ext = chosen?.ext ?? (blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm");
      const took = length;
      release();
      if (!wanted) return;
      if (took < MIN_SECONDS || blob.size === 0) { onNotice(T.short); return; }
      onRecorded(new File([blob], `voice-note.${ext}`, { type: blob.type }));
    };
    recorder.current = rec;
    rec.start(250);
    setSeconds(0);
    onBusyChange?.(true);
    timer.current = window.setInterval(() => {
      length += 1;
      setSeconds(length);
      if (length >= MAX_SECONDS) { keep.current = true; rec.stop(); }
    }, 1000);
  };

  const stop = (send: boolean) => {
    keep.current = send;
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    else release();
  };

  if (seconds === null) {
    return (
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" disabled={disabled || !canRecord()}
        aria-label={T.record} title={T.record} onClick={() => void start()}><Mic className="h-5 w-5" /></Button>
    );
  }
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/40 px-2 py-1" role="status" aria-live="polite">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={T.cancel} title={T.cancel} onClick={() => stop(false)}><Trash2 className="h-4 w-4" /></Button>
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
      <span className="text-sm tabular-nums">{T.recording} {clock}</span>
      <span className="flex-1" />
      <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]" aria-label={T.send} title={T.send} onClick={() => stop(true)}><Send className="h-4 w-4" /></Button>
    </div>
  );
}

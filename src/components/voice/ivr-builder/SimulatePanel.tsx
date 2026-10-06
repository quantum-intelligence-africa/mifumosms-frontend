// Chat-transcript "test without a real phone number" panel. Opens the
// simulate session on mount, renders each turn as a message bubble, and
// exposes a DTMF keypad / free-text speech input / force-timeout button
// depending on what the current node is waiting for. Every response's
// `path` is bubbled up via `onPathChange` so the parent can highlight the
// traversed nodes/edges on the canvas.
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PhoneOff, Send, TimerOff, Volume2, VolumeX, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useIvrSimulate } from "./useIvrSimulate";

interface SimulatePanelProps {
  flowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPathChange: (path: string[] | null) => void;
}

const DTMF_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export function SimulatePanel({ flowId, open, onOpenChange, onPathChange }: SimulatePanelProps) {
  const { t } = useLanguage();
  const sim = useIvrSimulate(flowId);
  const [speechValue, setSpeechValue] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const spokenEntryIdsRef = useRef(new Set<string>());
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true;
      sim.start();
    }
    if (!open) {
      startedRef.current = false;
      sim.reset();
      onPathChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (sim.path.length > 0) onPathChange(sim.path);
  }, [sim.path, onPathChange]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sim.transcript]);

  useEffect(() => {
    if (!audioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const newAssistantEntries = sim.transcript.filter(
      (entry) => entry.role === "assistant" && !spokenEntryIdsRef.current.has(entry.id),
    );
    if (newAssistantEntries.length === 0) return;

    newAssistantEntries.forEach((entry) => spokenEntryIdsRef.current.add(entry.id));
    window.speechSynthesis.cancel();
    const text = newAssistantEntries.map((entry) => entry.text).join(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sw-TZ";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const swahiliVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("sw"));
    if (swahiliVoice) utterance.voice = swahiliVoice;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled, sim.transcript]);

  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
      setIsSpeaking(false);
      setIsListening(false);
      spokenEntryIdsRef.current.clear();
    }
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, [open]);

  const toggleListening = () => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechValue("");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "sw-TZ";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      setSpeechValue(event.results[0][0].transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const disabled = sim.isLoading || sim.isTerminal;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("voice.ivr_builder.simulate.title")}</SheetTitle>
          <SheetDescription>{t("voice.ivr_builder.simulate.desc")}</SheetDescription>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setAudioEnabled((enabled) => !enabled);
                if (audioEnabled) window.speechSynthesis?.cancel();
              }}
            >
              {audioEnabled ? <Volume2 className="mr-1.5 h-3.5 w-3.5" /> : <VolumeX className="mr-1.5 h-3.5 w-3.5" />}
              {audioEnabled ? "Sikiliza sauti" : "Sauti imezimwa"}
            </Button>
            {isSpeaking && <span className="text-xs text-muted-foreground">Inazungumza...</span>}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-border-subtle bg-muted/30 p-3">
          {sim.transcript.length === 0 && sim.isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("voice.ivr_builder.simulate.starting")}
            </div>
          )}
          {sim.transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex",
                entry.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  entry.role === "assistant" && "rounded-tl-sm bg-card text-foreground shadow-sm",
                  entry.role === "user" && "rounded-tr-sm bg-primary text-primary-foreground",
                  entry.role === "system" && "mx-auto bg-transparent text-center text-[11px] italic text-muted-foreground",
                  entry.role === "error" && "mx-auto bg-destructive/10 text-center text-destructive",
                )}
              >
                {entry.text}
              </div>
            </div>
          ))}
          {sim.isTerminal && (
            <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground">
              <PhoneOff className="h-3.5 w-3.5" />
              {t("voice.ivr_builder.simulate.call_ended")}
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="space-y-2 pt-2">
          {sim.awaitingInputType === "dtmf" && (
            <div className="grid grid-cols-3 gap-1.5">
              {DTMF_KEYS.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-9"
                  disabled={disabled}
                  onClick={() => sim.sendInput("dtmf", key)}
                >
                  {key}
                </Button>
              ))}
            </div>
          )}

          {(sim.awaitingInputType === "speech" || sim.awaitingInputType === "recording") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!speechValue.trim()) return;
                sim.sendInput("speech", speechValue.trim());
                setSpeechValue("");
              }}
              className="flex gap-1.5"
            >
              <Input
                value={speechValue}
                onChange={(e) => setSpeechValue(e.target.value)}
                placeholder={
                  sim.awaitingInputType === "recording"
                    ? t("voice.ivr_builder.simulate.recording_placeholder")
                    : t("voice.ivr_builder.simulate.speech_placeholder")
                }
                disabled={disabled}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={disabled}
                onClick={toggleListening}
                title="Ongea badala ya kuandika"
              >
                {isListening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={disabled || !speechValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={() => sim.sendInput("timeout")}
          >
            <TimerOff className="mr-1.5 h-3.5 w-3.5" />
            {t("voice.ivr_builder.simulate.force_timeout")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

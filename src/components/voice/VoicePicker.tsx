// Choose one of the Google Chirp 3: HD Swahili voices and hear it first. The audio is made by the server (the Google key never
// reaches the browser) and cached, so playing the same words again costs nothing.
import { useEffect, useRef, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { voiceApi } from "@/services/voiceApi";
import { useLanguage } from "@/hooks/useLanguage";

export interface TtsVoice {
  id: string;
  label: string;
  gender: "female" | "male";
  /** "sw" or "en"; older servers send none (all Swahili). */
  language?: "sw" | "en";
}

let cachedVoices: TtsVoice[] | null = null;

export function useTtsVoices(): TtsVoice[] {
  const [voices, setVoices] = useState<TtsVoice[]>(cachedVoices ?? []);
  useEffect(() => {
    if (cachedVoices) return;
    voiceApi.get<TtsVoice[]>("/voice/ivr/voices/").then((res) => {
      if (res.success && res.data) {
        cachedVoices = res.data;
        setVoices(res.data);
      }
    });
  }, []);
  return voices;
}

interface VoicePickerProps {
  value: string;
  onChange: (voice: string) => void;
  /** What to speak when Play is pressed (the message being edited). Falls back to a short greeting. */
  sampleText?: string;
  /** Offer "Default voice" as the empty choice (flow nodes). Off where a voice is required. */
  allowDefault?: boolean;
}

const DEFAULT_VALUE = "__default__";

export function VoicePicker({ value, onChange, sampleText, allowDefault = true }: VoicePickerProps) {
  const { t } = useLanguage();
  const voices = useTtsVoices();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
  };
  useEffect(() => stop, []);

  const play = async () => {
    if (state === "playing") return stop();
    const voice = value || voices[0]?.id;
    if (!voice) return;
    setError("");
    setState("loading");
    const res = await voiceApi.postAudio("/voice/ivr/voices/preview/", { voice, text: sampleText?.trim() || t("voice.picker.sample") });
    if (!res.blob) {
      setError(res.error || "");
      setState("idle");
      return;
    }
    const url = URL.createObjectURL(res.blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    const done = () => {
      URL.revokeObjectURL(url);
      setState("idle");
    };
    audio.onended = done;
    audio.onerror = done;
    setState("playing");
    audio.play().catch(done);
  };

  const groups = (["sw", "en"] as const).flatMap((lang) =>
    (["female", "male"] as const).map((gender) => ({
      key: `${lang}-${gender}`,
      heading: `${lang === "sw" ? "Kiswahili" : "English"} · ${gender === "female" ? t("voice.picker.female") : t("voice.picker.male")}`,
      list: voices.filter((v) => (v.language ?? "sw") === lang && v.gender === gender),
    })),
  ).filter((g) => g.list.length > 0);
  const name = (v: TtsVoice) => v.label.split(" — ")[0];
  const englishChosen = voices.some((v) => v.id === value && v.language === "en");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Select
          value={value || (allowDefault ? DEFAULT_VALUE : voices[0]?.id ?? "")}
          onValueChange={(v) => {
            stop();
            onChange(v === DEFAULT_VALUE ? "" : v);
          }}
        >
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowDefault && <SelectItem value={DEFAULT_VALUE}>{t("voice.picker.default")}</SelectItem>}
            {groups.map(({ key, heading, list }) => (
              <div key={key}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{heading}</div>
                {list.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {name(v)}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={play}
          disabled={state === "loading" || voices.length === 0}
          aria-label={state === "playing" ? t("voice.picker.stop") : t("voice.picker.listen")}
          title={state === "playing" ? t("voice.picker.stop") : t("voice.picker.listen")}
        >
          {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "playing" ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {englishChosen && <p className="text-[10px] text-muted-foreground">{t("voice.picker.english_note")}</p>}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

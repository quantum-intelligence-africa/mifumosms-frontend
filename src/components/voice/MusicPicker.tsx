// Choose the music callers hear instead of the plain ring tone: SENDA's own, a file already in the message library, or a
// new upload. Whatever is chosen can be played here first. The value is the audio link the phone provider fetches.
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";

interface LibraryAudio {
  id: string;
  name: string;
  kind: "text" | "audio";
  audio_url: string;
}

const BUILT_IN = "__builtin__";
const CUSTOM = "__custom__";

export function MusicPicker({ value, onChange, builtInUrl }: { value: string; onChange: (url: string) => void; builtInUrl?: string }) {
  const { t } = useLanguage();
  const [library, setLibrary] = useState<LibraryAudio[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    voiceApi.get<LibraryAudio[]>("/voice/ivr/prompts/?kind=audio").then((res) => {
      if (res.success && res.data) setLibrary(res.data.filter((p) => p.kind === "audio" && p.audio_url));
    });
  }, []);

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("name", file.name.replace(/\.[^.]+$/, "") || "Music");
    form.set("audio_file", file);
    const res = await voiceApi.postForm<LibraryAudio>("/voice/ivr/prompts/upload/", form);
    setBusy(false);
    if (res.success && res.data) {
      setLibrary((cur) => [...cur, res.data!]);
      onChange(res.data.audio_url);
    } else {
      setError(res.error || t("cc.music.upload_failed"));
    }
  };

  const inLibrary = library.some((p) => p.audio_url === value);
  const selected = !value ? BUILT_IN : inLibrary ? value : CUSTOM;
  const playable = value || builtInUrl || "";

  return (
    <div className="space-y-2">
      <Select value={selected} onValueChange={(v) => onChange(v === BUILT_IN ? "" : v === CUSTOM ? value : v)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={BUILT_IN}>{t("cc.music.built_in")}</SelectItem>
          {library.map((p) => (
            <SelectItem key={p.id} value={p.audio_url}>{p.name}</SelectItem>
          ))}
          {selected === CUSTOM && <SelectItem value={CUSTOM}>{t("cc.music.own_link")}</SelectItem>}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,.mp3,.wav,.ogg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} />
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{t("cc.music.upload")}
        </Button>
        <span className="text-[11px] text-muted-foreground">{t("cc.music.formats")}</span>
      </div>
      {playable && <audio controls preload="none" src={playable} className="h-9 w-full" />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

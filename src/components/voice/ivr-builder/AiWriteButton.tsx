// "Write with AI" for one message box: say briefly what it should do, get spoken-style text back. The text
// replaces the box's content, and "Undo" brings the previous text back. Nothing is saved until the flow is.
import { useState } from "react";
import { Loader2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";

interface Props {
  field: string;
  nodeType: string;
  current: string;
  onText: (text: string) => void;
}

export function AiWriteButton({ field, nodeType, current, onText }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const write = async () => {
    setBusy(true);
    setError(null);
    const res = await voiceApi.post<{ text: string }>("/voice/ivr/generate-prompt/", { instruction, field, node_type: nodeType, current });
    setBusy(false);
    if (res.success && res.data) {
      setPrevious(current);
      onText(res.data.text);
      setInstruction("");
    } else {
      setError(res.error || t("cc.aiflow.write_failed"));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          <Sparkles className="h-3 w-3" />{t("cc.aiflow.write")}
        </button>
        {previous !== null && (
          <button type="button" onClick={() => { onText(previous); setPrevious(null); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:underline">
            <Undo2 className="h-3 w-3" />{t("cc.aiflow.undo")}
          </button>
        )}
      </div>
      {open && (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-2">
          <div className="flex gap-1.5">
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && instruction.trim().length >= 3 && !busy) void write(); }}
              maxLength={400}
              disabled={busy}
              placeholder={t("cc.aiflow.write_placeholder")}
              className="h-8 text-xs"
            />
            <Button type="button" size="sm" className="h-8 shrink-0 px-2" disabled={busy || instruction.trim().length < 3} onClick={write}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("cc.aiflow.write_go")}
            </Button>
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

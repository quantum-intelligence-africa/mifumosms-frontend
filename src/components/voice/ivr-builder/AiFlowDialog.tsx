// "Describe it, then adjust it": the person writes what the phone line should do (English or Swahili), the
// server asks the AI model for a flow and checks it with the builder's own rules, and the result is loaded
// onto the canvas as ordinary editable steps. Nothing is saved or published until they do it themselves.
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";
import type { FlowDefinition } from "./types";

interface Generated {
  name: string;
  summary: string;
  definition: FlowDefinition;
  warnings: string[];
  valid: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The canvas already has steps beyond the start: loading a flow replaces them. */
  hasContent: boolean;
  onApply: (definition: FlowDefinition, name: string) => void;
}

const EXAMPLE_KEYS = ["cc.aiflow.example_1", "cc.aiflow.example_2", "cc.aiflow.example_3"] as const;

export function AiFlowDialog({ open, onOpenChange, hasContent, onApply }: Props) {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generated | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await voiceApi.post<Generated>("/voice/ivr/generate/", { prompt, language });
    setBusy(false);
    if (res.success && res.data) setResult(res.data);
    else setError(res.error || t("cc.aiflow.failed"));
  };

  const apply = () => {
    if (!result) return;
    if (hasContent && !window.confirm(t("cc.aiflow.replace_confirm"))) return;
    onApply(result.definition, result.name);
    onOpenChange(false);
    setPrompt("");
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{t("cc.aiflow.title")}</DialogTitle>
          <DialogDescription>{t("cc.aiflow.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={600}
            rows={5}
            disabled={busy}
            placeholder={t("cc.aiflow.placeholder")}
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => setPrompt(t(key))}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted"
              >
                {t(key)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Select value={language} onValueChange={setLanguage} disabled={busy}>
              <SelectTrigger className="h-8 w-52 text-xs" aria-label={t("cc.aiflow.language")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t("cc.aiflow.lang_auto")}</SelectItem>
                <SelectItem value="sw">{t("cc.aiflow.lang_sw")}</SelectItem>
                <SelectItem value="en">{t("cc.aiflow.lang_en")}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">{prompt.length}/600</span>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
            </p>
          )}

          {result && (
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />{result.name}
                <span className="text-xs font-normal text-muted-foreground">· {t("cc.aiflow.steps", { count: result.definition.nodes.length })}</span>
              </p>
              {result.summary && <p className="text-xs text-foreground/80">{result.summary}</p>}
              {result.warnings.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="mb-1 font-medium">{t("cc.aiflow.to_finish")}</p>
                  <ul className="list-disc space-y-0.5 pl-4">{result.warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{t("cc.aiflow.review_hint")}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t("cc.analysis.cancel")}</Button>
          {result ? (
            <>
              <Button variant="outline" onClick={generate} disabled={busy}>{t("cc.aiflow.again")}</Button>
              <Button onClick={apply}>{t("cc.aiflow.use")}</Button>
            </>
          ) : (
            <Button onClick={generate} disabled={busy || prompt.trim().length < 8} className="gap-1.5">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("cc.aiflow.working")}</> : <><Sparkles className="h-4 w-4" />{t("cc.aiflow.generate")}</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

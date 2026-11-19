// What the enhanced audio did to the WORDS: the original and the enhanced recording are both transcribed (on request) and compared, with a
// plain verdict and what it means. Shown in a dialog from the recording player.
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import type { RecordingEnhancement } from "@/services/enhancementApi";

const QUALITY_TONE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};
const VERDICT_TONE: Record<string, string> = {
  better: "text-emerald-700 dark:text-emerald-400",
  same: "text-foreground",
  worse: "text-red-700 dark:text-red-400",
  different: "text-amber-700 dark:text-amber-400",
};

export function EnhancementImpactDialog({
  open, onOpenChange, enh, onRun, starting,
}: { open: boolean; onOpenChange: (open: boolean) => void; enh: RecordingEnhancement | null; onRun: () => void; starting: boolean }) {
  const { t } = useLanguage();
  const cmp = enh?.compare;
  const running = starting || cmp?.status === "running";
  const ready = cmp?.status === "ready" && cmp.original && cmp.enhanced;
  const before = enh?.metrics?.before?.mean_db;
  const after = enh?.metrics?.after?.mean_db;
  const q = (v: "ok" | "review" | "failed") => <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", QUALITY_TONE[v] ?? QUALITY_TONE.ok)}>{t(`enh.impact.quality.${v}`)}</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("enh.impact.title")}</DialogTitle>
          <DialogDescription>{t("enh.impact.intro")}</DialogDescription>
        </DialogHeader>

        {running && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("enh.impact.running")}</p>
        )}
        {!running && cmp?.status === "failed" && (
          <p className="flex items-start gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{t("enh.impact.failed")}{cmp.error ? `: ${cmp.error}` : ""}</p>
        )}

        {!running && ready && cmp && cmp.original && cmp.enhanced && (
          <div className="space-y-4">
            <div>
              <p className={cn("text-base font-semibold", VERDICT_TONE[cmp.verdict ?? "same"])}>{t(`enh.impact.verdict.${cmp.verdict ?? "same"}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`enh.impact.meaning.${cmp.verdict ?? "same"}`)}</p>
            </div>

            <div className="overflow-hidden rounded-md border border-border text-sm">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span />
                <span>{t("enh.impact.original")}</span>
                <span>{t("enh.impact.enhanced")}</span>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-t border-border px-3 py-2">
                <span>{t("enh.impact.quality")}</span>{q(cmp.original.quality)}{q(cmp.enhanced.quality)}
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-t border-border px-3 py-2">
                <span>{t("enh.impact.words")}</span><span>{cmp.original.words}</span><span>{cmp.enhanced.words}</span>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-t border-border px-3 py-2">
                <span>{t("enh.impact.repeated")}</span><span>{cmp.original.repeated_words}</span><span>{cmp.enhanced.repeated_words}</span>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-t border-border px-3 py-2">
                <span>{t("enh.impact.changed")}</span><span className="col-span-2">{cmp.changed_pct}%</span>
              </div>
              {before != null && after != null && (
                <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-t border-border px-3 py-2">
                  <span>{t("enh.level_change")} (dB)</span>
                  <span className="col-span-2 flex items-center gap-1">{before}<ArrowRight className="h-3 w-3" />{after}</span>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("enh.impact.original")}</p>
                <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-2.5 text-xs leading-relaxed">{cmp.original.text || "—"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t("enh.impact.enhanced")}</p>
                <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-2.5 text-xs leading-relaxed">{cmp.enhanced.text || "—"}</p>
              </div>
            </div>
            {cmp.model && <p className="text-[11px] text-muted-foreground">{t("enh.impact.model", { model: cmp.model, language: cmp.language ?? "auto" })}</p>}
          </div>
        )}

        {!running && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onRun} disabled={!enh?.enhanced_url}>
              {ready ? t("enh.impact.rerun") : t("enh.impact.run")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

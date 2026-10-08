import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { CALL_OUTCOMES, callCenterApi, describeError, type CallOutcome } from "@/services/callCenterApi";

/**
 * After-call work. Saving the note is what returns the agent to Available (the
 * backend does that on save); "Skip" returns them explicitly. Either way they
 * are never left stuck in after-call work with no way out.
 */
export function WrapUpDialog() {
  const { wrapUp, dismissWrapUp, setStatus } = useCallCenter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (wrapUp) {
      setCategory("");
      setOutcome("");
      setNotes("");
      setFollowUp("");
    }
  }, [wrapUp?.callId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!wrapUp) return null;

  const save = async () => {
    setSaving(true);
    const res = await callCenterApi.notes.create(wrapUp.callId, {
      category: category.trim(),
      outcome,
      notes: notes.trim(),
      follow_up: followUp.trim(),
    });
    setSaving(false);
    if (!res.success) {
      toast({ title: t("cc.call.note_failed"), description: describeError(res), variant: "destructive" });
      return;
    }
    toast({ title: t("cc.wrapup.saved") });
    dismissWrapUp();
  };

  const skip = async () => {
    await setStatus("available");
    dismissWrapUp();
  };

  const nothingEntered = !category.trim() && !outcome && !notes.trim() && !followUp.trim();

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader>
          <DialogTitle>{t("cc.wrapup.title")}</DialogTitle>
          <DialogDescription>
            {wrapUp.name ? `${wrapUp.name} · ` : ""}
            <span className="font-mono">{wrapUp.number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="wrap-category">{t("cc.wrapup.category")}</Label>
            <Input id="wrap-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("cc.wrapup.category_placeholder")} maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label>{t("cc.wrapup.outcome")}</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as CallOutcome)}>
              <SelectTrigger><SelectValue placeholder={t("cc.wrapup.outcome_placeholder")} /></SelectTrigger>
              <SelectContent>
                {CALL_OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>{t(`cc.outcome.${o}` as const)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wrap-notes">{t("cc.wrapup.notes")}</Label>
            <Textarea id="wrap-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wrap-follow">{t("cc.wrapup.follow_up")}</Label>
            <Textarea id="wrap-follow" value={followUp} onChange={(e) => setFollowUp(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={skip} disabled={saving}>{t("cc.wrapup.skip")}</Button>
          <Button onClick={save} disabled={saving || nothingEntered}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {t("cc.wrapup.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

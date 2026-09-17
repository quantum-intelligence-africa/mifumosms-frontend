import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Copy, Check } from "lucide-react";
import { useWhatsAppCloud, type WAPoll } from "@/hooks/useWhatsAppCloud";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the poll is successfully created. The new poll is passed in. */
  onCreated?: (poll: WAPoll) => void;
}

const MAX_QUESTION = 1024;
const MAX_OPTION = 20;
const MIN_OPTIONS = 1;
const MAX_OPTIONS = 3;

export function CreatePollDialog({ open, onOpenChange, onCreated }: CreatePollDialogProps) {
  const { createPoll, isLoading } = useWhatsAppCloud();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [active, setActive] = useState(true);
  const [createdPoll, setCreatedPoll] = useState<WAPoll | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setTitle("");
    setQuestion("");
    setOptions(["Yes", "No"]);
    setActive(true);
    setCreatedPoll(null);
    setCopied(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const updateOption = (idx: number, value: string) => {
    setOptions((opts) => opts.map((o, i) => (i === idx ? value : o)));
  };
  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions([...options, ""]);
  };
  const removeOption = (idx: number) => {
    if (options.length > MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit =
    !!title.trim() &&
    !!question.trim() &&
    trimmedOptions.length >= MIN_OPTIONS &&
    trimmedOptions.length <= MAX_OPTIONS &&
    trimmedOptions.every((o) => o.length <= MAX_OPTION) &&
    question.length <= MAX_QUESTION;

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const res = await createPoll({
        title: title.trim(),
        question: question.trim(),
        options: trimmedOptions,
        is_active: active,
      });
      if (res?.success && res.poll) {
        setCreatedPoll(res.poll);
        onCreated?.(res.poll);
        toast({
          title: t("whatsapp.poll_dialog.toast_created_title"),
          description: t("whatsapp.poll_dialog.toast_created_desc", { title: res.poll.title }),
        });
      }
    } catch {
      // Toast handled inside the hook.
    }
  };

  const copyId = async () => {
    if (!createdPoll) return;
    try {
      await navigator.clipboard.writeText(createdPoll.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">{t("whatsapp.poll_dialog.title")}</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            {createdPoll
              ? t("whatsapp.poll_dialog.created_desc")
              : t("whatsapp.poll_dialog.setup_desc")}
          </DialogDescription>
        </DialogHeader>

        {createdPoll ? (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/40 px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                {t("whatsapp.poll_dialog.poll_id_label")}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-[12.5px] text-foreground break-all">
                  {createdPoll.id}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyId}
                  className="h-8 px-3 text-[11px] font-semibold rounded-lg flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" strokeWidth={2.8} />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" strokeWidth={2.2} />
                      {t("whatsapp.poll_dialog.copy")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 dark:border-border/40 bg-muted/30 dark:bg-muted/15 p-3 space-y-1.5">
              <p className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">{t("whatsapp.common.preview")}</p>
              <p className="text-[13px] font-semibold text-foreground leading-tight">{createdPoll.question}</p>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {createdPoll.options.map((o) => (
                  <span
                    key={o}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border/60 text-foreground/80"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                {t("whatsapp.poll_dialog.internal_title_label")}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("whatsapp.poll_dialog.internal_title_placeholder")}
                className="mt-1 h-10 rounded-xl text-[13px]"
              />
              <p className="text-[11px] text-foreground/55 mt-1 leading-tight">
                {t("whatsapp.poll_dialog.internal_title_hint")}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                  {t("whatsapp.poll_dialog.question_label")}
                </Label>
                <span
                  className={`text-[10.5px] tabular-nums ${
                    question.length > MAX_QUESTION
                      ? "text-destructive font-semibold"
                      : "text-foreground/55"
                  }`}
                >
                  {question.length}/{MAX_QUESTION}
                </span>
              </div>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("whatsapp.poll_dialog.question_placeholder")}
                rows={2}
                className="mt-1 min-h-[68px] rounded-xl text-[13px] leading-relaxed"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                {t("whatsapp.poll_dialog.options_label")}
              </Label>
              <p className="text-[11px] text-foreground/55 mt-1 leading-tight">
                {t("whatsapp.poll_dialog.options_hint", { count: options.length, max: MAX_OPTIONS })}
              </p>
              <div className="mt-2 space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={t("whatsapp.poll_dialog.option_placeholder", { n: idx + 1 })}
                      maxLength={MAX_OPTION}
                      className="h-10 rounded-xl text-[13px]"
                    />
                    {options.length > MIN_OPTIONS && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx)}
                        aria-label={`Remove option ${idx + 1}`}
                        className="h-10 w-10 flex-shrink-0 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < MAX_OPTIONS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2 h-9 px-3 text-[12px] font-semibold rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.4} />
                  {t("whatsapp.poll_dialog.add_option")}
                </Button>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[12.5px] text-foreground">{t("whatsapp.poll_dialog.active_label")}</span>
            </label>
          </div>
        )}

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          {createdPoll ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                }}
                className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
              >
                {t("whatsapp.poll_dialog.create_another")}
              </Button>
              <Button
                onClick={() => handleClose(false)}
                className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
              >
                {t("whatsapp.common.done")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isLoading}
                className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!canSubmit || isLoading}
                className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t("whatsapp.poll_dialog.creating")}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.4} />
                    {t("whatsapp.poll_dialog.create_poll")}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

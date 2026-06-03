import { useEffect, useMemo, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, Send, Trash2 } from "lucide-react";
import {
  useWhatsAppCloud,
  type WATemplateVariable,
} from "@/hooks/useWhatsAppCloud";
import { apiClient, type Template } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Local templates use named placeholders like {{name}}, {{date}}. Pull the
// distinct keys out of the body so the Send dialog can collect values for each.
const extractPlaceholderKeys = (text: string): string[] => {
  const found = new Set<string>();
  const re = /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  return Array.from(found);
};

// Keys the backend auto-fills from messaging.Contact at send time.
const CONTACT_AUTOFILL_KEYS = new Set(["name", "phone", "email"]);

const TEMPLATE_NAME_RE = /^[A-Za-z0-9_\- ]+$/;

// ─── Create template ─────────────────────────────────────────────────────────

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tpl: Template) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTemplateDialogProps) {
  const { toast } = useToast();
  const { getAvailableVariables } = useWhatsAppCloud();

  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [category, setCategory] = useState("reminders");
  const [bodyText, setBodyText] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [variables, setVariables] = useState<WATemplateVariable[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // Load the variable picker once each time the dialog opens. `getAvailableVariables`
  // is recreated on every render of useWhatsAppCloud(), so we deliberately keep it
  // out of the dependency array — otherwise this effect re-fires forever and hammers
  // the /available-variables/ endpoint.
  useEffect(() => {
    if (!open) return;
    void getAvailableVariables().then(setVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setName("");
    setLanguage("en");
    setCategory("reminders");
    setBodyText("");
    setDescription("");
    setError(null);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Insert `{{key}}` at the textarea's current caret position.
  const insertVariable = (key: string) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) {
      setBodyText((s) => s + token);
      return;
    }
    const start = el.selectionStart ?? bodyText.length;
    const end = el.selectionEnd ?? bodyText.length;
    const next = bodyText.slice(0, start) + token + bodyText.slice(end);
    setBodyText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const nameOk = TEMPLATE_NAME_RE.test(name);
  const canSubmit = nameOk && bodyText.trim().length > 0 && !isSaving;

  const submit = async () => {
    setError(null);
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const res = await apiClient.createTemplate({
        name: name.trim(),
        channel: "whatsapp",
        language,
        category: category.trim() || "general",
        body_text: bodyText.trim(),
        description: description.trim() || undefined,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || res.message || "Failed to create template");
      }
      toast({ title: "Template created", description: res.data.name });
      onCreated?.(res.data);
      close(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">New WhatsApp template</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            Authored locally — sent as a plain WhatsApp text. Use{" "}
            <code className="text-[11px] bg-muted px-1 rounded">{"{{name}}"}</code> or any{" "}
            <code className="text-[11px] bg-muted px-1 rounded">{"{{key}}"}</code> placeholders; the
            server fills them from Contact at send time.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Appointment reminder"
                className="h-10 rounded-xl text-[13px]"
              />
              {name && !nameOk && (
                <p className="text-[11px] text-destructive">letters, digits, spaces, _ or - only</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "sw")}>
                <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="sw">Kiswahili (sw)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="reminders, marketing, otp …"
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Body</Label>
            <Textarea
              ref={bodyRef}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Habari {{name}}, miadi yako ipo tarehe {{date}} saa {{time}}."
              rows={4}
              className="rounded-xl text-[13px] leading-relaxed"
            />
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55 mr-1 mt-0.5">
                  Insert
                </span>
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    title={v.description ?? v.source}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-[11px] font-mono"
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
              Description <span className="opacity-60 font-normal">(optional)</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reminder ya miadi"
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={isSaving}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.4} />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit template ───────────────────────────────────────────────────────────

interface EditTemplateDialogProps {
  template: Template | null;
  onOpenChange: (open: boolean) => void;
  onEdited?: (tpl: Template) => void;
}

export function EditTemplateDialog({ template, onOpenChange, onEdited }: EditTemplateDialogProps) {
  const { toast } = useToast();
  const { getAvailableVariables } = useWhatsAppCloud();

  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [category, setCategory] = useState("reminders");
  const [bodyText, setBodyText] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [variables, setVariables] = useState<WATemplateVariable[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setLanguage((template.language as "en" | "sw") || "en");
    setCategory(template.category || "");
    setBodyText(template.body_text || "");
    setDescription(template.description || "");
    setError(null);
  }, [template]);

  // Refetch variables only when the active template changes — see note in
  // CreateTemplateDialog for why `getAvailableVariables` is excluded.
  useEffect(() => {
    if (!template) return;
    void getAvailableVariables().then(setVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const insertVariable = (key: string) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) {
      setBodyText((s) => s + token);
      return;
    }
    const start = el.selectionStart ?? bodyText.length;
    const end = el.selectionEnd ?? bodyText.length;
    setBodyText(bodyText.slice(0, start) + token + bodyText.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const canSubmit =
    !!template && TEMPLATE_NAME_RE.test(name) && bodyText.trim().length > 0 && !isSaving;

  const submit = async () => {
    setError(null);
    if (!template || !canSubmit) return;
    setIsSaving(true);
    try {
      const res = await apiClient.updateTemplate(template.id, {
        name: name.trim(),
        channel: "whatsapp",
        language,
        category: category.trim() || "general",
        body_text: bodyText.trim(),
        description: description.trim() || undefined,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || res.message || "Failed to update template");
      }
      toast({ title: "Template updated", description: res.data.name });
      onEdited?.(res.data);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">Edit template</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            Placeholders are re-extracted from the body when you save.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "sw")}>
                <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="sw">Kiswahili (sw)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Body</Label>
            <Textarea
              ref={bodyRef}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              className="rounded-xl text-[13px] leading-relaxed"
            />
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55 mr-1 mt-0.5">
                  Insert
                </span>
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    title={v.description ?? v.source}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-[11px] font-mono"
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
              Description <span className="opacity-60 font-normal">(optional)</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete template ─────────────────────────────────────────────────────────

interface DeleteTemplateDialogProps {
  template: Template | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteTemplateDialog({
  template,
  onOpenChange,
  onDeleted,
}: DeleteTemplateDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [template]);

  const submit = async () => {
    if (!template) return;
    setError(null);
    setIsDeleting(true);
    try {
      const res = await apiClient.deleteTemplate(template.id);
      if (!res.success) {
        throw new Error(res.error || res.message || "Failed to delete template");
      }
      toast({ title: "Template deleted", description: template.name });
      onDeleted?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">Delete template</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-3">
          {template && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[12px] flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{template.name}</Badge>
              <Badge variant="secondary" className="text-[11px] uppercase">{template.language || "—"}</Badge>
              <Badge variant="secondary" className="text-[11px]">{template.category || "—"}</Badge>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Send from local template ────────────────────────────────────────────────

interface SendFromTemplateDialogProps {
  template: Template | null;
  onOpenChange: (open: boolean) => void;
  waAccountId?: string;
}

const splitRecipients = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((r) => r.trim())
    .filter(Boolean);

export function SendFromTemplateDialog({
  template,
  onOpenChange,
  waAccountId,
}: SendFromTemplateDialogProps) {
  const { sendFromTemplate, isLoading } = useWhatsAppCloud();
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [delayMs, setDelayMs] = useState<string>("80");
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [missingFromAutofill, setMissingFromAutofill] = useState<string[]>([]);

  // All placeholder keys the template body references, separated by whether
  // the server will auto-fill them from Contact or whether the user must supply.
  const placeholderKeys = useMemo(
    () => extractPlaceholderKeys(template?.body_text ?? ""),
    [template],
  );
  const requiredKeys = placeholderKeys.filter((k) => !CONTACT_AUTOFILL_KEYS.has(k));
  const autofillKeys = placeholderKeys.filter((k) => CONTACT_AUTOFILL_KEYS.has(k));

  useEffect(() => {
    setRecipientsRaw("");
    setVariables({});
    setDelayMs("80");
    setError(null);
    setResultSummary(null);
    setMissingFromAutofill([]);
  }, [template]);

  const recipients = splitRecipients(recipientsRaw);
  const recipientsOk = recipients.length > 0 && recipients.length <= 500;
  const requiredOk = requiredKeys.every((k) => (variables[k] ?? "").trim().length > 0);
  const canSubmit = !!template && recipientsOk && requiredOk && !isLoading;

  const submit = async () => {
    if (!template || !canSubmit) return;
    setError(null);
    setResultSummary(null);
    setMissingFromAutofill([]);
    // Drop empty overrides for auto-fill keys so the backend can substitute Contact data.
    const cleanedVariables: Record<string, string> = {};
    for (const [k, v] of Object.entries(variables)) {
      if (v.trim().length > 0) cleanedVariables[k] = v.trim();
    }
    try {
      const data = await sendFromTemplate(
        {
          template_id: template.id,
          recipients,
          ...(Object.keys(cleanedVariables).length > 0 ? { variables: cleanedVariables } : {}),
          ...(delayMs ? { delay_ms: Math.max(0, Math.min(2000, Number(delayMs) || 80)) } : {}),
        },
        waAccountId,
      );
      setResultSummary(`${data.sent} sent, ${data.failed} failed of ${data.total}`);

      // Surface recipients whose Contact lookup didn't fill a placeholder.
      const missing = new Set<string>();
      for (const r of data.results) {
        for (const k of r.missing_variables ?? []) missing.add(k);
      }
      setMissingFromAutofill(Array.from(missing));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    }
  };

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">Send template</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            Each recipient gets a plain WhatsApp text rendered from this template. Contact data
            auto-fills <code className="text-[11px] bg-muted px-1 rounded">{"{{name}}"}</code>,{" "}
            <code className="text-[11px] bg-muted px-1 rounded">{"{{phone}}"}</code>, and{" "}
            <code className="text-[11px] bg-muted px-1 rounded">{"{{email}}"}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-3">
          {template && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{template.name}</Badge>
                <Badge variant="secondary" className="text-[11px] uppercase">{template.language || "—"}</Badge>
                <Badge variant="secondary" className="text-[11px]">{template.category || "—"}</Badge>
              </div>
              {template.body_text && (
                <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {template.body_text}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
              Recipients <span className="opacity-60 font-normal">(max 500, comma or newline separated)</span>
            </Label>
            <Textarea
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              placeholder="+255712345678, +255756543210"
              rows={3}
              className="rounded-xl text-[13px] font-mono leading-relaxed"
            />
            <p className="text-[11px] text-foreground/55 tabular-nums">
              {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
              {recipients.length > 500 && <span className="text-destructive ml-2">— over 500 limit</span>}
            </p>
          </div>

          {requiredKeys.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                Variables
              </Label>
              <p className="text-[11px] text-foreground/55">
                Shared values for placeholders not auto-filled from Contact.
              </p>
              <div className="space-y-1.5">
                {requiredKeys.map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-foreground/55 w-24 shrink-0">{`{{${k}}}`}</span>
                    <Input
                      value={variables[k] ?? ""}
                      onChange={(e) =>
                        setVariables((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                      placeholder={`Value for ${k}`}
                      className="h-9 rounded-lg text-[13px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {autofillKeys.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                Auto-filled overrides <span className="opacity-60 font-normal">(optional)</span>
              </Label>
              <p className="text-[11px] text-foreground/55">
                Leave blank to use each recipient's Contact record.
              </p>
              <div className="space-y-1.5">
                {autofillKeys.map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-foreground/55 w-24 shrink-0">{`{{${k}}}`}</span>
                    <Input
                      value={variables[k] ?? ""}
                      onChange={(e) =>
                        setVariables((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                      placeholder={`Override for ${k}`}
                      className="h-9 rounded-lg text-[13px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
              Delay <span className="opacity-60 font-normal">(ms, max 2000)</span>
            </Label>
            <Input
              value={delayMs}
              onChange={(e) => setDelayMs(e.target.value.replace(/\D/g, ""))}
              placeholder="80"
              className="h-10 rounded-xl text-[13px] font-mono w-32"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          {resultSummary && (
            <Alert className="py-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <AlertDescription className="text-xs text-emerald-800 dark:text-emerald-300">
                {resultSummary}
                {missingFromAutofill.length > 0 && (
                  <>
                    {" — "}
                    <span className="font-semibold">
                      missing for some recipients:
                    </span>{" "}
                    <span className="font-mono">{missingFromAutofill.join(", ")}</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            Close
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

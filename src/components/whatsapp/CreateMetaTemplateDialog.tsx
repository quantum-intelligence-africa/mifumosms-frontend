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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import {
  useWhatsAppCloud,
  type WASimpleButton,
  type WASimpleHeaderType,
  type WASimplePreviewRendered,
  type WASimpleTemplatePayload,
  type WATemplateCategory,
} from "@/hooks/useWhatsAppCloud";
import { useToast } from "@/hooks/use-toast";

// Common Meta BCP-47 codes — Meta accepts many more, but these cover the
// languages this product targets.
const META_LANGUAGES: Array<{ value: string; label: string }> = [
  { value: "en", label: "English (en)" },
  { value: "en_US", label: "English — US (en_US)" },
  { value: "en_GB", label: "English — UK (en_GB)" },
  { value: "sw", label: "Kiswahili (sw)" },
  { value: "fr", label: "French (fr)" },
  { value: "es", label: "Spanish (es)" },
  { value: "pt_BR", label: "Portuguese — Brazil (pt_BR)" },
  { value: "ar", label: "Arabic (ar)" },
];

const TEMPLATE_NAME_RE = /^[a-z0-9_]+$/;

const SIZE_CAPS: Record<"image" | "video" | "document", number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

// Pull distinct {{N}} placeholders from a body so we can render the right
// number of example fields. We support positional only in the builder.
const countBodyPlaceholders = (text: string): number => {
  const set = new Set<number>();
  const re = /{{\s*(\d+)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) set.add(Number(m[1]));
  return set.size;
};

interface CreateMetaTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waAccountId?: string;
  onCreated?: () => void;
}

export function CreateMetaTemplateDialog({
  open,
  onOpenChange,
  waAccountId,
  onCreated,
}: CreateMetaTemplateDialogProps) {
  const { simplePreviewMetaTemplate, simpleCreateMetaTemplate, isLoading } = useWhatsAppCloud();
  const { toast } = useToast();

  // Form state mirrors the §2.2 body fields.
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WATemplateCategory>("UTILITY");
  const [language, setLanguage] = useState("en");
  const [headerType, setHeaderType] = useState<WASimpleHeaderType>("none");
  const [headerText, setHeaderText] = useState("");
  const [headerTextExample, setHeaderTextExample] = useState("");
  const [headerUrl, setHeaderUrl] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [body, setBody] = useState("");
  const [bodyExamples, setBodyExamples] = useState<string[]>([]);
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<WASimpleButton[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [rendered, setRendered] = useState<WASimplePreviewRendered | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setCategory("UTILITY");
    setLanguage("en");
    setHeaderType("none");
    setHeaderText("");
    setHeaderTextExample("");
    setHeaderUrl("");
    setHeaderFile(null);
    setFilename("");
    setBody("");
    setBodyExamples([]);
    setFooter("");
    setButtons([]);
    setSubmitError(null);
    setPreviewError(null);
    setRendered(null);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Resize body_examples whenever the placeholder count changes.
  const placeholderCount = useMemo(() => countBodyPlaceholders(body), [body]);
  useEffect(() => {
    setBodyExamples((cur) => {
      if (placeholderCount === cur.length) return cur;
      if (placeholderCount > cur.length)
        return [...cur, ...Array(placeholderCount - cur.length).fill("")];
      return cur.slice(0, placeholderCount);
    });
  }, [placeholderCount]);

  // Build the payload the hook expects.
  const buildPayload = (): WASimpleTemplatePayload => ({
    name: name.trim(),
    category,
    language,
    ...(headerType !== "none" ? { header_type: headerType } : {}),
    ...(headerType === "text" && headerText ? { header_text: headerText } : {}),
    ...(headerType === "text" && /\{\{1\}\}/.test(headerText) && headerTextExample
      ? { header_text_example: headerTextExample }
      : {}),
    ...(headerType !== "none" && headerType !== "text" && headerFile ? { header_file: headerFile } : {}),
    ...(headerType !== "none" && headerType !== "text" && !headerFile && headerUrl
      ? { header_url: headerUrl }
      : {}),
    ...(headerType === "document" && filename ? { filename } : {}),
    body,
    ...(placeholderCount > 0 ? { body_examples: bodyExamples } : {}),
    ...(footer ? { footer } : {}),
    ...(buttons.length > 0 ? { buttons } : {}),
  });

  // §2.3 — debounced preview as the user types. Builds the WhatsApp-bubble
  // preview on the right without submitting anything to Meta.
  useEffect(() => {
    if (!open) return;
    if (!body.trim()) {
      setRendered(null);
      setPreviewError(null);
      return;
    }
    const id = setTimeout(() => {
      const payload = buildPayload();
      // Don't preview when required fields are obviously missing.
      if (!payload.name || !payload.language || !payload.body) return;
      setPreviewLoading(true);
      setPreviewError(null);
      simplePreviewMetaTemplate(payload, waAccountId)
        .then((d) => setRendered(d.rendered))
        .catch((e) => {
          setRendered(null);
          setPreviewError(e instanceof Error ? e.message : "Preview failed");
        })
        .finally(() => setPreviewLoading(false));
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    name,
    category,
    language,
    headerType,
    headerText,
    headerTextExample,
    headerUrl,
    headerFile,
    filename,
    body,
    JSON.stringify(bodyExamples),
    footer,
    JSON.stringify(buttons),
  ]);

  // Per-format upload cap mirrors §2.2's server-side check so users see the
  // problem before the round-trip fails.
  const handleHeaderFile = (file: File | null) => {
    if (!file) {
      setHeaderFile(null);
      return;
    }
    if (headerType === "image" || headerType === "video" || headerType === "document") {
      const cap = SIZE_CAPS[headerType];
      if (file.size > cap) {
        toast({
          title: "File too large",
          description: `${headerType} header is capped at ${Math.round(cap / (1024 * 1024))} MB.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }
    setHeaderFile(file);
    if (headerType === "document" && !filename) setFilename(file.name);
  };

  const addButton = () => {
    if (buttons.length >= 3) return;
    setButtons((b) => [...b, { type: "QUICK_REPLY", text: "" }]);
  };
  const updateButton = (idx: number, patch: Partial<WASimpleButton>) =>
    setButtons((b) => b.map((btn, i) => (i === idx ? { ...btn, ...patch } : btn)));
  const removeButton = (idx: number) => setButtons((b) => b.filter((_, i) => i !== idx));

  const nameOk = TEMPLATE_NAME_RE.test(name);
  const bodyOk = body.trim().length > 0;
  const examplesOk = placeholderCount === 0 || bodyExamples.every((v) => v.trim().length > 0);
  const headerOk =
    headerType === "none" ||
    (headerType === "text" && headerText.trim().length > 0) ||
    (headerType !== "text" && (headerFile || headerUrl.trim().startsWith("https://")));
  const buttonsOk = buttons.every((btn) => {
    if (!btn.text.trim()) return false;
    if (btn.type === "URL" && !btn.url) return false;
    if (btn.type === "PHONE_NUMBER" && !btn.phone_number) return false;
    return true;
  });
  const canSubmit = nameOk && bodyOk && examplesOk && headerOk && buttonsOk && !isLoading;

  const submit = async () => {
    setSubmitError(null);
    if (!canSubmit) return;
    try {
      await simpleCreateMetaTemplate(buildPayload(), waAccountId);
      onCreated?.();
      close(false);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-hidden p-0 rounded-2xl">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-[15px] font-bold">New Meta-approved template</DialogTitle>
          <DialogDescription className="text-[12px] text-foreground/65 leading-snug">
            Submit to Meta for review. Use positional <code className="text-[11px] bg-muted px-1 rounded">{"{{1}}"}</code>{" "}
            placeholders. The preview on the right updates as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0 overflow-hidden h-[calc(92vh-140px)]">
          {/* LEFT — form */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  placeholder="order_confirmation_en"
                  className="h-10 rounded-xl text-[13px] font-mono"
                />
                {name && !nameOk && (
                  <p className="text-[11px] text-destructive">lowercase letters, digits, underscores only</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {META_LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WATemplateCategory)}>
                <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utility — order updates, alerts</SelectItem>
                  <SelectItem value="MARKETING">Marketing — promotions</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication — OTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HEADER */}
            <div className="space-y-1.5 rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Header (optional)</Label>
                <Select value={headerType} onValueChange={(v) => setHeaderType(v as WASimpleHeaderType)}>
                  <SelectTrigger className="h-8 w-32 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {headerType === "text" && (
                <>
                  <Input
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value.slice(0, 60))}
                    placeholder="Order #{{1}}"
                    className="h-9 rounded-lg text-[13px]"
                  />
                  <p className="text-[10.5px] text-muted-foreground tabular-nums">{headerText.length}/60</p>
                  {/\{\{1\}\}/.test(headerText) && (
                    <Input
                      value={headerTextExample}
                      onChange={(e) => setHeaderTextExample(e.target.value)}
                      placeholder="Sample for {{1}}"
                      className="h-9 rounded-lg text-[13px]"
                    />
                  )}
                </>
              )}
              {(headerType === "image" || headerType === "video" || headerType === "document") && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={headerType === "image" ? "image/*" : headerType === "video" ? "video/*" : undefined}
                      onChange={(e) => handleHeaderFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-[12px] gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> {headerFile ? "Replace file" : "Choose file"}
                    </Button>
                    {headerFile && (
                      <>
                        <span className="text-[11px] text-foreground truncate max-w-[180px]">{headerFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setHeaderFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-center text-[10.5px] text-muted-foreground">or</div>
                  <Input
                    value={headerUrl}
                    onChange={(e) => setHeaderUrl(e.target.value)}
                    placeholder="https:// public URL"
                    className="h-9 rounded-lg text-[13px]"
                  />
                  {headerType === "document" && (
                    <Input
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="filename.pdf"
                      className="h-9 rounded-lg text-[13px]"
                    />
                  )}
                  <p className="text-[10.5px] text-muted-foreground">
                    Caps: image ≤ 5 MB · video ≤ 16 MB · document ≤ 100 MB.
                  </p>
                </div>
              )}
            </div>

            {/* BODY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Body</Label>
                <span className="text-[10.5px] text-muted-foreground tabular-nums">
                  {body.length}/1024 · {placeholderCount} placeholder{placeholderCount === 1 ? "" : "s"}
                </span>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 1024))}
                placeholder="Hi {{1}}, your order #{{2}} has been confirmed and will ship {{3}}."
                rows={4}
                className="rounded-xl text-[13px] leading-relaxed"
              />
              {placeholderCount > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10.5px] text-muted-foreground">Sample values (one per placeholder):</p>
                  {bodyExamples.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground w-10">{`{{${idx + 1}}}`}</span>
                      <Input
                        value={val}
                        onChange={(e) =>
                          setBodyExamples((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                        }
                        placeholder={`Example for {{${idx + 1}}}`}
                        className="h-9 rounded-lg text-[13px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">Footer (optional)</Label>
                <span className="text-[10.5px] text-muted-foreground tabular-nums">{footer.length}/60</span>
              </div>
              <Input
                value={footer}
                onChange={(e) => setFooter(e.target.value.slice(0, 60))}
                placeholder="Reply STOP to unsubscribe"
                className="h-9 rounded-lg text-[13px]"
              />
            </div>

            {/* BUTTONS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                  Buttons (optional, max 3)
                </Label>
                {buttons.length < 3 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addButton} className="h-7 text-[12px] gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                )}
              </div>
              {buttons.map((btn, idx) => (
                <div key={idx} className="rounded-lg border border-border/60 p-2 space-y-1.5 bg-card">
                  <div className="flex items-center gap-2">
                    <Select
                      value={btn.type}
                      onValueChange={(v) =>
                        updateButton(idx, { type: v as WASimpleButton["type"], url: undefined, phone_number: undefined, example: undefined })
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                        <SelectItem value="URL">URL</SelectItem>
                        <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={btn.text}
                      onChange={(e) => updateButton(idx, { text: e.target.value.slice(0, 25) })}
                      placeholder="Button label"
                      className="h-8 text-[12px] flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeButton(idx)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {btn.type === "URL" && (
                    <>
                      <Input
                        value={btn.url ?? ""}
                        onChange={(e) => updateButton(idx, { url: e.target.value })}
                        placeholder="https://example.com/orders/{{1}}"
                        className="h-8 text-[12px]"
                      />
                      {/\{\{1\}\}/.test(btn.url ?? "") && (
                        <Input
                          value={btn.example?.[0] ?? ""}
                          onChange={(e) => updateButton(idx, { example: [e.target.value] })}
                          placeholder="Full sample URL (e.g. https://example.com/orders/A123)"
                          className="h-8 text-[12px]"
                        />
                      )}
                    </>
                  )}
                  {btn.type === "PHONE_NUMBER" && (
                    <Input
                      value={btn.phone_number ?? ""}
                      onChange={(e) => updateButton(idx, { phone_number: e.target.value })}
                      placeholder="+255712345678"
                      className="h-8 text-[12px] font-mono"
                    />
                  )}
                </div>
              ))}
            </div>

            {(submitError || previewError) && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{submitError ?? previewError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* RIGHT — WhatsApp-style bubble preview */}
          <div className="hidden md:flex md:flex-col border-l border-border/60 bg-muted/30 dark:bg-muted/15">
            <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
              <span className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55">Preview</span>
              {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mx-auto max-w-[260px] rounded-2xl bg-[#dcf8c6] dark:bg-[#005c4b] text-[13px] text-foreground dark:text-white shadow-sm overflow-hidden">
                {rendered?.header && (
                  <div className="px-3 pt-2 pb-1">
                    {rendered.header.format === "TEXT" && rendered.header.text && (
                      <div className="font-bold text-[13px]">{rendered.header.text}</div>
                    )}
                    {rendered.header.format === "IMAGE" && rendered.header.url && (
                      <img src={rendered.header.url} alt="" className="w-full rounded-lg max-h-40 object-cover" />
                    )}
                    {rendered.header.format === "DOCUMENT" && rendered.header.url && (
                      <div className="text-[11px] opacity-70 truncate">{filename || "document.pdf"}</div>
                    )}
                  </div>
                )}
                <div className="px-3 py-2 whitespace-pre-wrap break-words leading-relaxed">
                  {rendered?.body || body || "Body preview…"}
                </div>
                {rendered?.footer && (
                  <div className="px-3 pb-2 text-[11px] opacity-60">{rendered.footer}</div>
                )}
                {Array.isArray(rendered?.buttons) && rendered.buttons.length > 0 && (
                  <div className="border-t border-black/10 dark:border-white/10">
                    {rendered.buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 text-center text-[12.5px] font-medium text-[#075e54] dark:text-[#a4f0e4] border-b border-black/5 dark:border-white/5 last:border-b-0"
                      >
                        {String((btn as { text?: string }).text ?? "")}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
                {rendered ? "Live preview via /simple/preview/" : "Type a body to start preview"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 sm:px-5 py-3 border-t border-border/60 flex gap-2">
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 h-10 rounded-xl text-[12.5px] font-semibold shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.4} />
                Submit to Meta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

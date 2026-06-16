import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Phone as PhoneIcon,
  Plus,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
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
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useToast } from "@/hooks/use-toast";
import {
  useWhatsAppCloud,
  type WASimpleButton,
  type WASimpleHeaderType,
  type WASimplePreviewRendered,
  type WASimpleTemplatePayload,
  type WATemplateCategory,
} from "@/hooks/useWhatsAppCloud";
import { buildApiUrl, API_CONFIG } from "@/config/api";

// Product spec: only English and Kiswahili are supported for WhatsApp templates.
const META_LANGUAGES: Array<{ value: string; label: string }> = [
  { value: "en", label: "English (en)" },
  { value: "sw", label: "Kiswahili (sw)" },
];

const TEMPLATE_NAME_RE = /^[a-z0-9_]+$/;

const SIZE_CAPS: Record<"image" | "video" | "document", number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

const HEADER_TYPES: Array<{ key: WASimpleHeaderType; label: string; Icon: typeof Type }> = [
  { key: "text", label: "Text", Icon: Type },
  { key: "image", label: "Image", Icon: ImageIcon },
  { key: "video", label: "Video", Icon: Video },
  { key: "document", label: "Document", Icon: FileText },
];

const countBodyPlaceholders = (text: string): number => {
  const set = new Set<number>();
  const re = /{{\s*(\d+)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) set.add(Number(m[1]));
  return set.size;
};

export default function CreateWhatsAppTemplate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { simplePreviewMetaTemplate, simpleCreateMetaTemplate, isLoading } = useWhatsAppCloud();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── WhatsApp account loader ───────────────────────────────────────────────
  // Mirrors WhatsAppCloud.loadAccount() so the page works standalone.
  const [waAccountId, setWaAccountId] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  // When the auto-detected account isn't the one the user wants, they switch
  // into manual mode and type the account ID themselves.
  const [accountMode, setAccountMode] = useState<"detected" | "manual">("detected");
  const [manualAccountId, setManualAccountId] = useState("");

  // Effective account passed to all template endpoints — pick the manual one
  // when the user opted out of the detected default.
  const effectiveAccountId = accountMode === "manual" ? manualAccountId.trim() : waAccountId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = buildApiUrl(API_CONFIG.ENDPOINTS.EARLY_ACCESS.AI_AGENTS.WHATSAPP_CREDENTIALS_AUTO);
        const t = localStorage.getItem("access_token");
        const res = await fetch(url, {
          headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        });
        const json = await res.json().catch(() => null);
        const data = json?.data;
        const id: string = data?.chatbot_id ?? data?.whatsapp_account_id ?? "";
        const channel = data?.whatsapp_channel;
        if (cancelled) return;
        if (!id) {
          setAccountError("No WhatsApp account linked. Connect credentials in Settings → WhatsApp.");
        } else {
          setWaAccountId(id);
          setWaPhoneNumberId(channel?.phone_number_id ?? "");
        }
      } catch {
        if (!cancelled) setAccountError("Could not load WhatsApp account.");
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Form state (mirrors §2.2 builder fields) ──────────────────────────────
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

  const placeholderCount = useMemo(() => countBodyPlaceholders(body), [body]);
  useEffect(() => {
    setBodyExamples((cur) => {
      if (placeholderCount === cur.length) return cur;
      if (placeholderCount > cur.length)
        return [...cur, ...Array(placeholderCount - cur.length).fill("")];
      return cur.slice(0, placeholderCount);
    });
  }, [placeholderCount]);

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

  // §2.3 — debounced live preview as the user types.
  useEffect(() => {
    if (!body.trim() || !name.trim()) {
      setRendered(null);
      setPreviewError(null);
      return;
    }
    const id = setTimeout(() => {
      const payload = buildPayload();
      if (!payload.name || !payload.language || !payload.body) return;
      setPreviewLoading(true);
      setPreviewError(null);
      simplePreviewMetaTemplate(payload, effectiveAccountId || undefined)
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
    waAccountId,
  ]);

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

  // Button management — Add Button (defaults Quick Reply) + URL/Phone shortcuts.
  const addButton = (type: WASimpleButton["type"] = "QUICK_REPLY") => {
    if (buttons.length >= 3) {
      toast({
        title: "Max 3 buttons",
        description: "WhatsApp templates allow up to 3 interactive buttons.",
        variant: "destructive",
      });
      return;
    }
    setButtons((b) => [...b, { type, text: "" }]);
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
  const canSubmit = nameOk && bodyOk && examplesOk && headerOk && buttonsOk && !isLoading && !!effectiveAccountId;

  // Wipe the form back to its empty state without leaving the page.
  const resetForm = () => {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    setSubmitError(null);
    if (!canSubmit) return;
    try {
      await simpleCreateMetaTemplate(buildPayload(), effectiveAccountId || undefined);
      // Land on the approval-tracking view so the user can watch this template
      // go from PENDING → APPROVED / REJECTED.
      navigate("/whatsapp?tab=templates&tmode=submitted");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit template");
    }
  };

  // The preview pane shows the empty-state until the user has enough content
  // to render meaningfully (matches the screenshot).
  const hasPreviewableContent = !!body.trim() || !!headerText.trim() || buttons.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-emerald-500/5 via-background to-emerald-500/5 dark:from-emerald-500/10 dark:via-background dark:to-emerald-500/10">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
            {/* Page header — close (×) lives inside the form card now, not here */}
            <header className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">Create Template</h1>
                <p className="text-[12px] sm:text-sm text-foreground/60 leading-snug">
                  Build a Meta-approved WhatsApp message template.
                </p>
              </div>
            </header>

            {accountError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{accountError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 sm:gap-6">
              {/* ── Form column ───────────────────────────────────────────── */}
              <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm p-4 sm:p-6 space-y-5">
                {/* Close × — pinned to the form card's top-right corner so it's
                    always visible inside the card chrome (was getting clipped
                    when it lived in the page header). */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  onClick={() => navigate("/whatsapp")}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
                {/* WhatsApp Account — auto-detected by default, with a "Use a
                    different account" option that switches to a free-text input */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold">
                    WhatsApp Account <span className="text-destructive">*</span>
                  </Label>
                  {accountLoading ? (
                    <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading account…
                    </div>
                  ) : accountMode === "manual" ? (
                    <>
                      <Input
                        value={manualAccountId}
                        onChange={(e) => setManualAccountId(e.target.value)}
                        placeholder="cb_XXXXXXXXXXXX or phone number ID"
                        className="h-11 rounded-xl text-sm font-mono"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">
                          Enter the chatbot ID (cb_…) or phone number ID for the WhatsApp account to use.
                        </p>
                        {waAccountId && (
                          <button
                            type="button"
                            onClick={() => { setAccountMode("detected"); setManualAccountId(""); }}
                            className="text-[11px] text-[#1ebe5d] font-semibold hover:underline whitespace-nowrap"
                          >
                            Use detected
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Select
                        value={waAccountId ? "__detected__" : "__manual__"}
                        onValueChange={(v) => {
                          if (v === "__manual__") setAccountMode("manual");
                        }}
                      >
                        <SelectTrigger className="h-11 rounded-xl text-sm">
                          <SelectValue placeholder="No account detected">
                            {waAccountId ? (waPhoneNumberId || waAccountId) : "No account detected"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {waAccountId && (
                            <SelectItem value="__detected__">
                              <div className="flex flex-col">
                                <span className="font-mono text-[13px]">{waPhoneNumberId || waAccountId}</span>
                                <span className="text-[10.5px] text-muted-foreground">Auto-detected</span>
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="__manual__">
                            Use a different account…
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!waAccountId && (
                        <p className="text-[11px] text-muted-foreground">
                          No account auto-detected. Pick <strong>Use a different account…</strong> to enter one.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Template Name */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold">
                    Template Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    placeholder="order_confirmation_en"
                    className="h-11 rounded-xl text-sm font-mono"
                  />
                  <p className={`text-[11px] ${name && !nameOk ? "text-destructive" : "text-muted-foreground"}`}>
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>

                {/* Category + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as WATemplateCategory)}>
                      <SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold">
                      Language <span className="text-destructive">*</span>
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {META_LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Header */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                    <Label className="text-[13px] font-bold">Header (optional)</Label>
                    <div className="grid grid-cols-5 gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/60 w-full sm:w-auto sm:inline-flex sm:gap-1">
                      <button
                        type="button"
                        onClick={() => setHeaderType("none")}
                        className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors sm:flex-row sm:gap-1 sm:px-2.5 sm:py-1 ${
                          headerType === "none"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="leading-none truncate">None</span>
                      </button>
                      {HEADER_TYPES.map(({ key, label, Icon }) => {
                        const active = headerType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setHeaderType(key)}
                            className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors sm:flex-row sm:gap-1 sm:px-2.5 sm:py-1 ${
                              active
                                ? "bg-[#25D366] text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" />
                            <span className="leading-none truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {headerType === "text" && (
                    <>
                      <Input
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value.slice(0, 60))}
                        placeholder="Order Update"
                        className="h-11 rounded-xl text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        Max 60 characters · {headerText.length}/60
                      </p>
                      {/\{\{1\}\}/.test(headerText) && (
                        <Input
                          value={headerTextExample}
                          onChange={(e) => setHeaderTextExample(e.target.value)}
                          placeholder="Sample for {{1}}"
                          className="h-10 rounded-xl text-sm"
                        />
                      )}
                    </>
                  )}

                  {(headerType === "image" || headerType === "video" || headerType === "document") && (
                    <div className="space-y-2">
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
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 w-full rounded-xl gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {headerFile ? "Replace file" : "Click to upload"}
                      </Button>
                      {headerFile && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[12px]">
                          <span className="truncate">{headerFile.name}</span>
                          <button
                            type="button"
                            onClick={() => { setHeaderFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-center text-[11px] text-muted-foreground">or</div>
                      <Input
                        value={headerUrl}
                        onChange={(e) => setHeaderUrl(e.target.value)}
                        placeholder="https:// public URL"
                        className="h-11 rounded-xl text-sm"
                      />
                      {headerType === "document" && (
                        <Input
                          value={filename}
                          onChange={(e) => setFilename(e.target.value)}
                          placeholder="filename.pdf"
                          className="h-10 rounded-xl text-sm"
                        />
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Caps: image ≤ 5 MB · video ≤ 16 MB · document ≤ 100 MB · HTTPS only.
                      </p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold">
                    Body <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 1024))}
                    placeholder="Hi {{1}}, your order #{{2}} has been confirmed..."
                    rows={4}
                    className="rounded-xl text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Use placeholders like {"{{1}}, {{2}}"} for dynamic values. Max 1024 characters.
                    <span className="ml-2 opacity-60">{body.length}/1024 · {placeholderCount} placeholder{placeholderCount === 1 ? "" : "s"}</span>
                  </p>

                  {placeholderCount > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sample values</p>
                      {bodyExamples.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[12px] font-mono text-muted-foreground w-12">{`{{${idx + 1}}}`}</span>
                          <Input
                            value={val}
                            onChange={(e) =>
                              setBodyExamples((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                            }
                            placeholder={`Example for {{${idx + 1}}}`}
                            className="h-10 rounded-lg text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold">Footer (optional)</Label>
                  <Input
                    value={footer}
                    onChange={(e) => setFooter(e.target.value.slice(0, 60))}
                    placeholder="Reply STOP to unsubscribe"
                    className="h-11 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Max 60 characters. No variables allowed.
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                    <Label className="text-[13px] font-bold">Buttons (optional)</Label>
                  </div>

                  {buttons.length === 0 ? (
                    <p className="text-[12px] italic text-muted-foreground">No buttons added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={btn.type}
                              onValueChange={(v) =>
                                updateButton(idx, {
                                  type: v as WASimpleButton["type"],
                                  url: undefined,
                                  phone_number: undefined,
                                  example: undefined,
                                })
                              }
                            >
                              <SelectTrigger className="h-9 w-40 text-[12px]"><SelectValue /></SelectTrigger>
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
                              className="h-9 text-[13px] flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeButton(idx)}
                              aria-label="Remove button"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {btn.type === "URL" && (
                            <>
                              <Input
                                value={btn.url ?? ""}
                                onChange={(e) => updateButton(idx, { url: e.target.value })}
                                placeholder="https://example.com/orders/{{1}}"
                                className="h-9 text-[13px]"
                              />
                              {/\{\{1\}\}/.test(btn.url ?? "") && (
                                <Input
                                  value={btn.example?.[0] ?? ""}
                                  onChange={(e) => updateButton(idx, { example: [e.target.value] })}
                                  placeholder="Full sample URL"
                                  className="h-9 text-[13px]"
                                />
                              )}
                            </>
                          )}
                          {btn.type === "PHONE_NUMBER" && (
                            <Input
                              value={btn.phone_number ?? ""}
                              onChange={(e) => updateButton(idx, { phone_number: e.target.value })}
                              placeholder="+255712345678"
                              className="h-9 text-[13px] font-mono"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/40 space-y-2">
                    {/* Primary "Add Button" CTA + URL / Phone shortcuts */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addButton("QUICK_REPLY")}
                      disabled={buttons.length >= 3}
                      className="w-full h-11 rounded-xl border-[#25D366]/40 text-[#1ebe5d] hover:bg-[#25D366]/10 hover:text-[#1ebe5d] gap-2 font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Add Button
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addButton("URL")}
                        disabled={buttons.length >= 3}
                        className="h-10 rounded-xl gap-2"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addButton("PHONE_NUMBER")}
                        disabled={buttons.length >= 3}
                        className="h-10 rounded-xl gap-2"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Phone
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Max 3 buttons. Quick Reply, URL, and Phone Number buttons supported.
                    </p>
                  </div>
                </div>

                {(submitError || previewError) && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">{submitError ?? previewError}</AlertDescription>
                  </Alert>
                )}

                {/* Sticky action bar at bottom of card */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/whatsapp")}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submit}
                    disabled={!canSubmit}
                    className="flex-1 h-11 rounded-xl font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" strokeWidth={2.4} />
                        Submit to Meta
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Preview column — WhatsApp chat-style preview ──────────── */}
              <WhatsAppChatPreview
                rendered={rendered}
                body={body}
                headerType={headerType}
                headerText={headerText}
                headerFile={headerFile}
                headerUrl={headerUrl}
                filename={filename}
                footer={footer}
                buttons={buttons}
                category={category}
                language={language}
                previewLoading={previewLoading}
                hasPreviewableContent={hasPreviewableContent}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── WhatsApp chat-style preview ────────────────────────────────────────────
// Renders the template inside a faux WhatsApp chat. The body bubble shows the
// raw template with each `{{N}}` rendered as an inline pill chip — same style
// Meta uses in their WhatsApp Manager preview, so what reviewers see during
// approval matches what the user sees while building.

const formatNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

// Splits text on `{{N}}` tokens into a stream of {text, placeholder?} pieces
// so we can render placeholders as styled chips inline with the surrounding
// copy without losing whitespace.
type Piece = { kind: "text"; value: string } | { kind: "ph"; index: string };

const splitPlaceholders = (text: string): Piece[] => {
  const re = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const out: Piece[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push({ kind: "text", value: text.slice(cursor, m.index) });
    out.push({ kind: "ph", index: m[1] });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) out.push({ kind: "text", value: text.slice(cursor) });
  return out;
};

const PlaceholderChip = ({ index }: { index: string }) => (
  <span className="inline-flex items-center align-baseline px-1.5 py-[1px] mx-0.5 rounded-md bg-white/80 dark:bg-white/15 text-[#075e54] dark:text-[#a4f0e4] text-[11px] font-mono font-semibold shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
    {`{{${index}}}`}
  </span>
);

const renderWithChips = (text: string) =>
  splitPlaceholders(text).map((p, i) =>
    p.kind === "text" ? (
      <span key={i}>{p.value}</span>
    ) : (
      <PlaceholderChip key={i} index={p.index} />
    ),
  );

interface WhatsAppChatPreviewProps {
  rendered: WASimplePreviewRendered | null;
  body: string;
  headerType: WASimpleHeaderType;
  headerText: string;
  headerFile: File | null;
  headerUrl: string;
  filename: string;
  footer: string;
  buttons: WASimpleButton[];
  category: WATemplateCategory;
  language: string;
  previewLoading: boolean;
  hasPreviewableContent: boolean;
}

function WhatsAppChatPreview({
  rendered,
  body,
  headerType,
  headerText,
  headerFile,
  headerUrl,
  filename,
  footer,
  buttons,
  category,
  language,
  previewLoading,
  hasPreviewableContent,
}: WhatsAppChatPreviewProps) {
  // The bubble shows the RAW template with `{{N}}` as inline chips — Meta's
  // own preview style. Sample values you type live in `bodyExamples` and ship
  // to Meta for approval, but the preview deliberately keeps the placeholders
  // visible so it's clear what's dynamic.
  const bodySource = body;
  const headerSource = headerType === "text" ? headerText : "";

  // Header image preview: prefer the server-resolved URL; fall back to a local
  // blob URL when the user just picked a file and the server hasn't echoed yet.
  const headerImageUrl =
    rendered?.header?.url ??
    (headerFile && (headerType === "image" || headerType === "video")
      ? URL.createObjectURL(headerFile)
      : headerUrl && (headerType === "image" || headerType === "video")
        ? headerUrl
        : "");

  const showDocument =
    rendered?.header?.format === "DOCUMENT" ||
    (headerType === "document" && (headerFile || headerUrl));
  const showImage = headerType === "image" && !!headerImageUrl;
  const showVideo = headerType === "video" && !!headerImageUrl;
  const showHeaderText = !!headerSource;

  const renderedButtons = rendered?.buttons ?? buttons;
  const renderedFooter = rendered?.footer ?? footer;

  return (
    <aside className="lg:sticky lg:top-4 h-fit rounded-2xl border border-border/60 bg-card shadow-sm p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
          <h2 className="text-[15px] font-bold">Live Preview</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {previewLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          Updates as you type
        </div>
      </div>

      {!hasPreviewableContent ? (
        <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
          <p className="text-[13px] italic text-muted-foreground">
            No template data to preview
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 bg-[#e5ddd5] dark:bg-[#0b141a]">
            {/* Chat header — business name + online */}
            <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] dark:from-[#005c4b] dark:to-[#003e35] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] opacity-90 tabular-nums">{formatNow()}</span>
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold leading-tight truncate">Your Business</div>
                  <div className="text-[10.5px] opacity-80 leading-tight">online</div>
                </div>
              </div>
              <div className="w-6 h-4 rounded-sm border border-white/40 flex-shrink-0" />
            </div>

            {/* Chat body — patterned background, single incoming bubble */}
            <div
              className="px-3 py-4 min-h-[300px]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            >
              <div className="max-w-[88%] bg-[#dcf8c6] dark:bg-[#005c4b] dark:text-white text-foreground rounded-2xl rounded-tl-sm shadow-sm overflow-hidden relative">
                {showImage && (
                  <img src={headerImageUrl} alt="" className="w-full max-h-44 object-cover" />
                )}
                {showVideo && (
                  <div className="w-full max-h-44 aspect-video bg-black/60 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/80" />
                  </div>
                )}
                {showDocument && (
                  <div className="px-3 pt-2 pb-1 flex items-center gap-2 bg-black/5 dark:bg-white/5">
                    <FileText className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="text-[11.5px] truncate font-medium">
                      {filename || headerFile?.name || "document.pdf"}
                    </span>
                  </div>
                )}
                {showHeaderText && (
                  <div className="px-3 pt-2 font-bold text-[13px]">
                    {renderWithChips(headerSource)}
                  </div>
                )}

                <div className="px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                  {bodySource ? renderWithChips(bodySource) : "Body preview…"}
                </div>

                {renderedFooter && (
                  <div className="px-3 pb-1 text-[11px] opacity-60">{renderedFooter}</div>
                )}

                <div className="px-3 pb-1.5 flex items-center justify-end gap-1 text-[10.5px] opacity-60">
                  <span className="tabular-nums">{formatNow()}</span>
                  <span aria-hidden>✓✓</span>
                </div>

                {renderedButtons.length > 0 && (
                  <div className="border-t border-black/10 dark:border-white/10">
                    {renderedButtons.map((btn, i) => (
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
            </div>

            {/* Chat footer — cosmetic "Type a message" bar */}
            <div className="bg-[#f0f0f0] dark:bg-[#1f2c33] px-3 py-2 flex items-center gap-2">
              <div className="flex-1 h-9 rounded-full bg-white dark:bg-[#2a3942] px-3 flex items-center text-[12.5px] text-muted-foreground">
                Type a message
              </div>
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Language + Category chips under the bubble */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {language}
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#25D366]/15 text-[#1ebe5d]">
              {category}
            </span>
          </div>
        </>
      )}
    </aside>
  );
}

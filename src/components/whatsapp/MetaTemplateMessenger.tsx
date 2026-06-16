import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileIcon,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  User as UserIcon,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useWhatsAppCloud,
  type WAMessageTemplate,
  type WATemplateComponent,
  type WATemplateButton,
  type WATemplateSendComponent,
  type WATemplateSendParameter,
  type WASendSingleResult,
} from "@/hooks/useWhatsAppCloud";
import { apiClient, type Contact } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Meta template helpers ───────────────────────────────────────────────────

// Meta templates use either positional placeholders ({{1}}, {{2}}) or named
// ones ({{customer_name}}). Pull the distinct tokens out of a string in
// first-seen order — that order is the order Meta expects the parameters in.
const PLACEHOLDER_RE = /{{\s*([^}]+?)\s*}}/g;

const extractPlaceholders = (text?: string): string[] => {
  if (!text) return [];
  const seen = new Set<string>();
  const order: string[] = [];
  let m: RegExpExecArray | null;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(text)) !== null) {
    const tok = m[1].trim();
    if (tok && !seen.has(tok)) {
      seen.add(tok);
      order.push(tok);
    }
  }
  return order;
};

const isNumericToken = (t: string): boolean => /^\d+$/.test(t);

const componentOf = (
  tpl: WAMessageTemplate | null,
  type: WATemplateComponent["type"],
): WATemplateComponent | undefined => tpl?.components?.find((c) => c.type === type);

const headerFormatOf = (tpl: WAMessageTemplate | null): string | undefined =>
  componentOf(tpl, "HEADER")?.format;

const isMediaHeader = (tpl: WAMessageTemplate | null): boolean => {
  const f = headerFormatOf(tpl);
  return f === "IMAGE" || f === "VIDEO" || f === "DOCUMENT";
};

// Approved templates ship a sample media handle in the header's `example` block
// (Meta calls it `header_handle`). Use it to auto-load a preview when present.
const exampleHeaderMedia = (tpl: WAMessageTemplate | null): string | undefined => {
  const ex = componentOf(tpl, "HEADER")?.example as
    | { header_handle?: unknown }
    | undefined;
  const handle = ex?.header_handle;
  if (Array.isArray(handle) && typeof handle[0] === "string") return handle[0];
  return undefined;
};

// A single resolvable placeholder somewhere in the template.
interface ParamField {
  key: string; // unique id, e.g. "body-1", "header-customer_name"
  scope: "header" | "body" | "button";
  token: string; // the raw placeholder text: "1" or "customer_name"
  buttonIndex?: number; // for URL buttons
  label: string; // human label, e.g. "Body · {{1}}"
}

// How a parameter's value is sourced. "manual" means the user typed it; the
// others pull from the selected Contact and stay editable.
type ParamSource = "manual" | "name" | "phone" | "email" | "company" | string;

interface ParamState {
  source: ParamSource;
  manual: string; // value used when source === "manual"
}

const DEFAULT_SOURCE_ORDER: ParamSource[] = ["name", "company", "phone", "email"];

const contactCompany = (c: Contact | null): string => {
  const a = (c?.attributes ?? {}) as Record<string, unknown>;
  const v = a.company ?? a.company_name ?? a.organization ?? a.business ?? "";
  return typeof v === "string" ? v : String(v ?? "");
};

const resolveFromContact = (c: Contact | null, source: ParamSource): string => {
  if (!c) return "";
  switch (source) {
    case "name":
      return c.name ?? "";
    case "phone":
      return c.phone_e164 ?? "";
    case "email":
      return c.email ?? "";
    case "company":
      return contactCompany(c);
    default:
      if (typeof source === "string" && source.startsWith("attr:")) {
        const k = source.slice(5);
        const v = (c.attributes ?? {})[k];
        return v == null ? "" : String(v);
      }
      return "";
  }
};

// Basic E.164-ish sanity check. The backend does authoritative validation; this
// just gates the Send button so we don't fire obviously-bad numbers.
const isValidPhone = (raw: string): boolean => {
  const t = raw.trim();
  return /^\+?\d{8,15}$/.test(t.replace(/[\s()-]/g, ""));
};

// ─── Component ───────────────────────────────────────────────────────────────

interface MetaTemplateMessengerProps {
  waAccountId: string;
}

export function MetaTemplateMessenger({ waAccountId }: MetaTemplateMessengerProps) {
  const { getMessageTemplates, sendTemplateMessage, isLoading } = useWhatsAppCloud();
  const { toast } = useToast();

  // ── Templates synced from Meta (APPROVED only) ────────────────────────────
  const [templates, setTemplates] = useState<WAMessageTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // ── Composition state ─────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState("");
  const [params, setParams] = useState<Record<string, ParamState>>({});
  const [mediaUrl, setMediaUrl] = useState("");
  // Header media can be supplied two ways: paste a public URL, or upload a file
  // (uploaded to Meta → media_id, which is the reliable option for delivery).
  const [mediaMode, setMediaMode] = useState<"url" | "upload">("url");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [sendResult, setSendResult] = useState<WASendSingleResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── Contact picker ────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ── Sync templates from Meta ──────────────────────────────────────────────
  // Meta is the source of truth; we always fetch fresh and keep only APPROVED.
  const sync = useCallback(async () => {
    setSyncing(true);
    setLoadError(null);
    try {
      const res = await getMessageTemplates(waAccountId || undefined, {
        status: "APPROVED",
        limit: 200,
      });
      const all = res.data?.graph?.data ?? [];
      // Defend against backends that ignore the status filter — only APPROVED
      // templates may ever be selectable or sent.
      const approved = all.filter((t) => t.status === "APPROVED");
      setTemplates(approved);
      setSyncedAt(new Date().toLocaleTimeString());
      // Drop the selection if the synced set no longer contains it (e.g. the
      // template was paused/disabled on Meta's side since last sync).
      setSelectedId((prev) =>
        prev && approved.some((t) => t.id === prev) ? prev : null,
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  }, [getMessageTemplates, waAccountId]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void sync();
  }, [sync]);

  // ── Debounced contact search ──────────────────────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    setContactsLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await apiClient.getContacts({
          search: contactSearch.trim() || undefined,
          page: 1,
          page_size: 20,
        });
        if (cancelled) return;
        setContactResults(res.success && res.data ? res.data.results ?? [] : []);
      } catch {
        if (!cancelled) setContactResults([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [contactSearch, pickerOpen]);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId],
  );

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q) ||
        (t.language ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  // ── Detect every placeholder in the selected template ─────────────────────
  const headerText = componentOf(selected, "HEADER")?.format === "TEXT"
    ? componentOf(selected, "HEADER")?.text
    : undefined;
  const bodyText = componentOf(selected, "BODY")?.text ?? "";
  const footerText = componentOf(selected, "FOOTER")?.text;
  // Memoised so the `paramFields` useMemo below isn't invalidated every render.
  const buttons = useMemo<WATemplateButton[]>(
    () => (componentOf(selected, "BUTTONS")?.buttons ?? []) as WATemplateButton[],
    [selected],
  );
  const mediaHeader = isMediaHeader(selected);
  const mediaFormat = headerFormatOf(selected); // IMAGE | VIDEO | DOCUMENT | TEXT

  // Local object-URL preview for an uploaded header file (revoked on change).
  const [mediaFilePreview, setMediaFilePreview] = useState("");
  useEffect(() => {
    if (!mediaFile) {
      setMediaFilePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(mediaFile);
    setMediaFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [mediaFile]);
  // What the preview pane renders: the uploaded file (upload mode) or the URL.
  const mediaPreviewSrc = mediaMode === "upload" ? mediaFilePreview : mediaUrl;

  const paramFields = useMemo<ParamField[]>(() => {
    if (!selected) return [];
    const fields: ParamField[] = [];
    for (const tok of extractPlaceholders(headerText)) {
      fields.push({ key: `header-${tok}`, scope: "header", token: tok, label: `Header · {{${tok}}}` });
    }
    for (const tok of extractPlaceholders(bodyText)) {
      fields.push({ key: `body-${tok}`, scope: "body", token: tok, label: `Body · {{${tok}}}` });
    }
    buttons.forEach((b, bi) => {
      if (b.type === "URL") {
        for (const tok of extractPlaceholders(b.url)) {
          fields.push({
            key: `btn-${bi}-${tok}`,
            scope: "button",
            token: tok,
            buttonIndex: bi,
            label: `Button "${b.text}" · {{${tok}}}`,
          });
        }
      }
    });
    return fields;
  }, [selected, headerText, bodyText, buttons]);

  // ── Reset composition whenever a different template is chosen ──────────────
  useEffect(() => {
    if (!selected) {
      setParams({});
      setMediaUrl("");
      setMediaFile(null);
      setMediaMode("url");
      setSendResult(null);
      setSendError(null);
      return;
    }
    // Seed each body param with a smart default contact source so picking a
    // contact auto-fills {{1}}→Name, {{2}}→Company, {{3}}→Phone … (all editable).
    const seeded: Record<string, ParamState> = {};
    let bodyPos = 0;
    for (const f of paramFields) {
      let source: ParamSource = "manual";
      if (f.scope === "body") {
        source = DEFAULT_SOURCE_ORDER[bodyPos] ?? "manual";
        bodyPos += 1;
      }
      seeded[f.key] = { source, manual: "" };
    }
    setParams(seeded);
    setMediaUrl(exampleHeaderMedia(selected) ?? "");
    setMediaFile(null);
    setMediaMode("url");
    setSendResult(null);
    setSendError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Resolve a parameter's effective value ─────────────────────────────────
  const resolveValue = useCallback(
    (key: string): string => {
      const st = params[key];
      if (!st) return "";
      if (st.source === "manual") return st.manual;
      return resolveFromContact(contact, st.source);
    },
    [params, contact],
  );

  const setParamSource = (key: string, source: ParamSource) =>
    setParams((p) => ({ ...p, [key]: { ...(p[key] ?? { manual: "" }), source } }));

  const setParamManual = (key: string, manual: string) =>
    setParams((p) => ({ ...p, [key]: { source: "manual", manual } }));

  // ── Live substitution for the preview ─────────────────────────────────────
  const substitute = useCallback(
    (text: string | undefined, scope: ParamField["scope"], buttonIndex?: number): string => {
      if (!text) return "";
      return text.replace(/{{\s*([^}]+?)\s*}}/g, (_full, raw) => {
        const tok = String(raw).trim();
        const field = paramFields.find(
          (f) => f.scope === scope && f.token === tok && f.buttonIndex === buttonIndex,
        );
        const v = field ? resolveValue(field.key) : "";
        return v || `{{${tok}}}`;
      });
    },
    [paramFields, resolveValue],
  );

  const previewHeader = substitute(headerText, "header");
  const previewBody = substitute(bodyText, "body");

  // ── Contact field source options for the per-param dropdown ────────────────
  const contactSourceOptions = useMemo(() => {
    const base: { value: ParamSource; label: string }[] = [
      { value: "manual", label: "Custom value" },
      { value: "name", label: "Contact name" },
      { value: "phone", label: "Phone number" },
      { value: "email", label: "Email" },
      { value: "company", label: "Company" },
    ];
    const attrs = contact?.attributes ?? {};
    for (const k of Object.keys(attrs)) {
      if (["company", "company_name", "organization", "business"].includes(k)) continue;
      base.push({ value: `attr:${k}`, label: `Attribute · ${k}` });
    }
    return base;
  }, [contact]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    const issues: string[] = [];
    if (!selected) issues.push("Select an approved template");
    else if (selected.status !== "APPROVED") issues.push("Template is no longer APPROVED — re-sync");
    if (!isValidPhone(recipient)) issues.push("Enter a valid recipient phone number");
    const missing = paramFields.filter((f) => !resolveValue(f.key).trim());
    if (missing.length > 0) issues.push(`Fill all parameters (${missing.length} empty)`);
    if (mediaHeader) {
      if (mediaMode === "url" && !mediaUrl.trim())
        issues.push("Provide the required header media URL");
      if (mediaMode === "upload" && !mediaFile)
        issues.push("Choose a file for the header media");
    }
    // Belt-and-braces: no {{…}} may survive into the resolved header/body.
    if (/{{\s*[^}]+?\s*}}/.test(previewBody) || /{{\s*[^}]+?\s*}}/.test(previewHeader))
      issues.push("Unresolved placeholders remain");
    return { ok: issues.length === 0, issues };
  }, [
    selected,
    recipient,
    paramFields,
    resolveValue,
    mediaHeader,
    mediaMode,
    mediaUrl,
    mediaFile,
    previewBody,
    previewHeader,
  ]);

  // ── Build the Meta Cloud API components array ─────────────────────────────
  // Build a Meta text parameter, tagging it with `parameter_name` when the
  // placeholder is named ({{customer_name}}) rather than positional ({{1}}).
  const textParam = useCallback(
    (f: ParamField): WATemplateSendParameter => {
      const p: WATemplateSendParameter = { type: "text", text: resolveValue(f.key) };
      if (!isNumericToken(f.token)) (p as { parameter_name?: string }).parameter_name = f.token;
      return p;
    },
    [resolveValue],
  );

  const buildComponents = useCallback((): WATemplateSendComponent[] => {
    if (!selected) return [];
    const out: WATemplateSendComponent[] = [];

    // Header — media OR text params (kept in first-seen order). In "upload" mode
    // we omit the media param here; the server binds the uploaded media_id into
    // the header after uploading the file to Meta.
    if (mediaHeader && mediaMode === "url" && mediaUrl.trim()) {
      const link = mediaUrl.trim();
      let param: WATemplateSendParameter;
      if (mediaFormat === "IMAGE") param = { type: "image", image: { link } };
      else if (mediaFormat === "VIDEO") param = { type: "video", video: { link } };
      else param = { type: "document", document: { link } };
      out.push({ type: "header", parameters: [param] });
    } else {
      const headerParams = paramFields.filter((f) => f.scope === "header").map(textParam);
      if (headerParams.length > 0) out.push({ type: "header", parameters: headerParams });
    }

    // Body — text params in first-seen order.
    const bodyParams = paramFields.filter((f) => f.scope === "body").map(textParam);
    if (bodyParams.length > 0) out.push({ type: "body", parameters: bodyParams });

    // URL buttons with dynamic suffixes.
    const buttonFields = paramFields.filter((f) => f.scope === "button");
    const byButton = new Map<number, ParamField[]>();
    for (const f of buttonFields) {
      const list = byButton.get(f.buttonIndex!) ?? [];
      list.push(f);
      byButton.set(f.buttonIndex!, list);
    }
    for (const [bi, fields] of byButton) {
      out.push({
        type: "button",
        sub_type: "url",
        index: String(bi),
        parameters: fields.map(textParam),
      });
    }

    return out;
  }, [selected, mediaHeader, mediaMode, mediaUrl, mediaFormat, paramFields, textParam]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const onSend = async () => {
    if (!selected || !validation.ok) return;
    setSendError(null);
    setSendResult(null);
    try {
      const useUpload = mediaHeader && mediaMode === "upload" && !!mediaFile;
      const data = await sendTemplateMessage(
        {
          to: recipient.trim(),
          template_name: selected.name,
          language_code: selected.language || "en",
          components: buildComponents(),
          ...(useUpload
            ? {
                media_file: mediaFile!,
                media_type: mediaFormat.toLowerCase() as "image" | "video" | "document",
              }
            : {}),
        },
        waAccountId || undefined,
      );
      setSendResult(data);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed");
    }
  };

  const pickContact = (c: Contact) => {
    setContact(c);
    setRecipient(c.phone_e164 || recipient);
    setPickerOpen(false);
    setContactSearch("");
    toast({ title: "Contact applied", description: `${c.name} — parameters auto-filled` });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-1">
      {/* Header row + sync */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Approved templates
          </Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Synced live from Meta. Only <strong>APPROVED</strong> templates can be sent — content is
            locked; you supply the parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncedAt && (
            <span className="text-[10.5px] text-muted-foreground hidden sm:inline">
              Synced {syncedAt}
            </span>
          )}
          <Button
            onClick={() => void sync()}
            disabled={syncing}
            variant="outline"
            className="h-9 gap-1.5"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync templates
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Empty / loading states */}
      {syncing && templates.length === 0 ? (
        <div className="flex items-center justify-center py-12 gap-2 text-foreground/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[13px]">Syncing approved templates from Meta…</span>
        </div>
      ) : !syncing && templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground max-w-xs">
            No <strong>APPROVED</strong> templates found on your WhatsApp Business account. Create one
            and wait for Meta approval, then sync again.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Left: selector + form ───────────────────────────────────── */}
          <div className="space-y-4">
            {/* Template selector */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                Template
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, category, language…"
                  className="h-9 pl-8 text-[13px]"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/50">
                {filteredTemplates.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-6">
                    No templates match “{search}”.
                  </p>
                ) : (
                  filteredTemplates.map((t) => {
                    const active = t.id === selectedId;
                    return (
                      <button
                        key={`${t.id}-${t.language}`}
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={[
                          "w-full text-left px-3 py-2.5 transition-colors",
                          active
                            ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                            : "hover:bg-muted/50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-[12.5px] truncate">
                            {t.name}
                          </span>
                          <Badge className="text-[9.5px] h-4 px-1.5 bg-emerald-600 hover:bg-emerald-600 text-white gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            APPROVED
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <Badge variant="secondary" className="text-[9.5px] h-4 px-1.5 uppercase">
                            {t.language || "—"}
                          </Badge>
                          <Badge variant="secondary" className="text-[9.5px] h-4 px-1.5">
                            {t.category || "—"}
                          </Badge>
                          {isMediaHeader(t) && (
                            <Badge variant="secondary" className="text-[9.5px] h-4 px-1.5">
                              {headerFormatOf(t)} HEADER
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {selected && (
              <>
                {/* Template content breakdown — what the approved template
                    contains and exactly which variables it needs. */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                      Template content
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {paramFields.length} variable{paramFields.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {(headerText || mediaHeader) && (
                    <div className="text-[11.5px]">
                      <span className="font-semibold text-foreground/50 mr-1.5">HEADER</span>
                      <span className="font-mono text-foreground/80 break-words">
                        {mediaHeader ? `${mediaFormat} media` : headerText}
                      </span>
                    </div>
                  )}
                  <div className="text-[11.5px]">
                    <span className="font-semibold text-foreground/50 mr-1.5">BODY</span>
                    <span className="font-mono text-foreground/80 whitespace-pre-wrap break-words">
                      {bodyText || "—"}
                    </span>
                  </div>
                  {footerText && (
                    <div className="text-[11.5px]">
                      <span className="font-semibold text-foreground/50 mr-1.5">FOOTER</span>
                      <span className="font-mono text-foreground/80 break-words">{footerText}</span>
                    </div>
                  )}
                  {buttons.length > 0 && (
                    <div className="text-[11.5px] flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-foreground/50">BUTTONS</span>
                      {buttons.map((b, bi) => (
                        <Badge key={bi} variant="secondary" className="text-[10px] h-4 px-1.5">
                          {b.type === "URL" ? "🔗" : b.type === "PHONE_NUMBER" ? "📞" : "💬"} {b.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {paramFields.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                      <span className="text-[10.5px] font-semibold text-foreground/50">NEEDS</span>
                      {paramFields.map((f) => (
                        <Badge key={f.key} variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                          {`{{${f.token}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipient + contact auto-fill */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                    Recipient
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="+255712345678"
                      className="h-10 rounded-xl text-[13px] font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPickerOpen((v) => !v)}
                      className="h-10 rounded-xl gap-1.5 px-3 text-[12px]"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      Contact
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {contact && (
                    <div className="flex items-center gap-2 text-[11px] text-foreground/70 bg-muted/40 rounded-lg px-2.5 py-1.5">
                      <UserIcon className="w-3 h-3 text-emerald-600" />
                      <span className="font-medium">{contact.name}</span>
                      <span className="font-mono text-foreground/55">{contact.phone_e164}</span>
                      <button
                        type="button"
                        onClick={() => setContact(null)}
                        className="ml-auto text-foreground/40 hover:text-foreground"
                        title="Clear contact"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {pickerOpen && (
                    <div className="rounded-xl border border-border/60 bg-card p-2 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          placeholder="Search contacts…"
                          className="h-8 pl-8 text-[12px]"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-border/50">
                        {contactsLoading ? (
                          <div className="flex items-center justify-center py-4 text-foreground/50">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </div>
                        ) : contactResults.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground text-center py-4">
                            No contacts found.
                          </p>
                        ) : (
                          contactResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => pickContact(c)}
                              className="w-full text-left px-2 py-1.5 hover:bg-muted/50 rounded-md flex items-center justify-between gap-2"
                            >
                              <span className="text-[12px] font-medium truncate">{c.name}</span>
                              <span className="text-[11px] font-mono text-foreground/55 shrink-0">
                                {c.phone_e164}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media header */}
                {mediaHeader && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                      {mediaFormat} header media{" "}
                      <span className="text-destructive font-normal">(required)</span>
                    </Label>

                    {/* Two ways to supply the header media: upload a file or paste a URL. */}
                    <div className="inline-flex rounded-xl border bg-muted/40 p-0.5 text-[12px]">
                      <button
                        type="button"
                        onClick={() => setMediaMode("upload")}
                        className={`px-3 py-1 rounded-lg transition ${
                          mediaMode === "upload"
                            ? "bg-background shadow-sm font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaMode("url")}
                        className={`px-3 py-1 rounded-lg transition ${
                          mediaMode === "url"
                            ? "bg-background shadow-sm font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        Paste URL
                      </button>
                    </div>

                    {mediaMode === "upload" ? (
                      <>
                        <Input
                          type="file"
                          accept={
                            mediaFormat === "IMAGE"
                              ? "image/*"
                              : mediaFormat === "VIDEO"
                                ? "video/*"
                                : undefined
                          }
                          onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                          className="h-10 rounded-xl text-[13px] file:mr-2 file:text-[12px]"
                        />
                        <p className="text-[10.5px] text-muted-foreground">
                          {mediaFile
                            ? `Selected: ${mediaFile.name} — uploaded to Meta on send (most reliable).`
                            : "Upload your own file — it is hosted by Meta and delivers reliably."}
                        </p>
                      </>
                    ) : (
                      <>
                        <Input
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/media.jpg"
                          className="h-10 rounded-xl text-[13px]"
                        />
                        <p className="text-[10.5px] text-muted-foreground">
                          {exampleHeaderMedia(selected) && mediaUrl === exampleHeaderMedia(selected)
                            ? "This is the template's sample image (a temporary Meta preview link that may not deliver). Upload your own file or paste a stable public URL."
                            : "Provide a public, non-expiring HTTPS URL for the header media."}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Parameter inputs */}
                {paramFields.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                      Parameters ({paramFields.length})
                    </Label>
                    {paramFields.map((f) => {
                      const st = params[f.key] ?? { source: "manual", manual: "" };
                      const resolved = resolveValue(f.key);
                      return (
                        <div key={f.key} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-foreground/60">{f.label}</span>
                            {f.scope === "body" && (
                              <Select
                                value={st.source}
                                onValueChange={(v) => setParamSource(f.key, v as ParamSource)}
                              >
                                <SelectTrigger className="h-6 text-[10.5px] w-36 border-border/60">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {contactSourceOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value} className="text-[12px]">
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Input
                            value={resolved}
                            onChange={(e) => setParamManual(f.key, e.target.value)}
                            placeholder={`Value for {{${f.token}}}`}
                            className={[
                              "h-9 rounded-lg text-[13px]",
                              !resolved.trim() ? "border-amber-400/70" : "",
                            ].join(" ")}
                          />
                          {st.source !== "manual" && resolved.trim() && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Auto-filled from contact · edit to override
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    This template has no parameters — it sends exactly as approved.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Right: WhatsApp preview + validation + send ──────────────── */}
          <div className="space-y-4">
            <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
              Preview
            </Label>

            {/* WhatsApp-style chat bubble */}
            <div className="rounded-2xl p-4 bg-[#e5ddd5] dark:bg-[#0b141a] min-h-[180px] flex items-start">
              {selected ? (
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white dark:bg-[#202c33] shadow-sm overflow-hidden">
                  {/* Media header preview */}
                  {mediaHeader && (
                    <div className="bg-black/5 dark:bg-white/5">
                      {mediaFormat === "IMAGE" && mediaPreviewSrc ? (
                        <img
                          src={mediaPreviewSrc}
                          alt="header"
                          className="w-full max-h-44 object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ) : mediaFormat === "VIDEO" && mediaPreviewSrc ? (
                        <video src={mediaPreviewSrc} className="w-full max-h-44" controls />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-4 text-foreground/60">
                          {mediaFormat === "VIDEO" ? (
                            <VideoIcon className="w-5 h-5" />
                          ) : mediaFormat === "DOCUMENT" ? (
                            <FileIcon className="w-5 h-5" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                          <span className="text-[11px]">
                            {mediaPreviewSrc || mediaFile
                              ? "Document attached"
                              : `${mediaFormat} header — add media`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="px-3 py-2 space-y-1.5">
                    {/* Text header */}
                    {headerText && (
                      <p className="text-[13px] font-bold text-foreground leading-snug whitespace-pre-wrap break-words">
                        {previewHeader}
                      </p>
                    )}
                    {/* Body */}
                    <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                      {previewBody}
                    </p>
                    {/* Footer */}
                    {footerText && (
                      <p className="text-[11px] text-foreground/45 leading-snug whitespace-pre-wrap break-words pt-0.5">
                        {footerText}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  {buttons.length > 0 && (
                    <div className="border-t border-border/40 divide-y divide-border/40">
                      {buttons.map((b, bi) => (
                        <div
                          key={bi}
                          className="px-3 py-2 text-center text-[12.5px] font-medium text-[#00a5f4] dark:text-[#53bdeb]"
                        >
                          {b.type === "URL"
                            ? substitute(b.url, "button", bi) || b.text
                            : b.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full text-center text-[12px] text-foreground/40 self-center py-10">
                  Select a template to preview the message.
                </div>
              )}
            </div>

            {/* Validation checklist */}
            {selected && (
              <div className="rounded-xl border border-border/60 p-3 space-y-1.5">
                <p className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                  Validation
                </p>
                {validation.ok ? (
                  <div className="flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All checks passed — ready to send.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {validation.issues.map((iss) => (
                      <li
                        key={iss}
                        className="flex items-center gap-1.5 text-[12px] text-foreground/60"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {iss}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {sendError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{sendError}</AlertDescription>
              </Alert>
            )}
            {sendResult && (
              <Alert className="py-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
                <AlertDescription className="text-xs text-emerald-800 dark:text-emerald-300">
                  {sendResult.ok
                    ? `Sent to ${sendResult.to}${sendResult.message_id ? ` · ${sendResult.message_id}` : ""}`
                    : `Delivery reported a problem: ${sendResult.error || "unknown error"}`}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={onSend}
              disabled={!validation.ok || isLoading}
              className="w-full h-11 rounded-xl text-[13px] font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Send template
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetaTemplateMessenger;

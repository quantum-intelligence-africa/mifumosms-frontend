import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Send,
  Users,
  Tag,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Plus,
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useWhatsAppCloud,
  WAInsufficientCreditsError,
  type WAUser,
  type WASendBulkResult,
  type WASendSingleResult,
  type WAMessageTemplate,
  type WAPollResultsResponse,
  type WAPollListItem,
} from "@/hooks/useWhatsAppCloud";
import { BarChart3 } from "lucide-react";
import { buildApiUrl, API_CONFIG } from "@/config/api";
import { apiClient, type Contact, type Template as LocalTemplate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSubTabSwipe } from "@/hooks/useSubTabSwipe";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CreatePollDialog } from "@/components/whatsapp/CreatePollDialog";
import { MetaTemplateMessenger } from "@/components/whatsapp/MetaTemplateMessenger";
import {
  CreateTemplateDialog,
  DeleteTemplateDialog,
  EditTemplateDialog,
  SendFromTemplateDialog,
} from "@/components/whatsapp/TemplateDialogs";
import {
  useWhatsAppBulkImageSend,
  type WABulkContact,
  type WABulkImageJob,
  type WABulkImageJobDetail,
  type WABulkJobStatus,
} from "@/hooks/useWhatsAppBulkImageSend";
import { useContacts } from "@/hooks/useContacts";

// ─── Phone number normalization ───────────────────────────────────────────────

const normalizeToApi = (input: string): string | null => {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.startsWith("255") && digitsOnly.length === 12) return `+${digitsOnly}`;
  if (digitsOnly.startsWith("0") && digitsOnly.length === 10) return `+255${digitsOnly.slice(1)}`;
  if (!digitsOnly.startsWith("0") && digitsOnly.length === 9) return `+255${digitsOnly}`;
  if (input.startsWith("+") && digitsOnly.startsWith("255") && digitsOnly.length === 12) return `+${digitsOnly}`;
  return null;
};

// ─── Result Banner ────────────────────────────────────────────────────────────

function BulkResultBanner({ result }: { result: WASendBulkResult | null }) {
  if (!result) return null;
  const success = result.failed === 0;
  return (
    <Alert className={`py-2.5 ${success ? "border-green-200 bg-green-50 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:bg-amber-950/30"}`}>
      {success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
      <AlertDescription className={`text-xs ${success ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
        <span className="font-semibold">{result.sent}</span> sent,{" "}
        <span className="font-semibold">{result.failed}</span> failed of{" "}
        <span className="font-semibold">{result.total}</span>.
        {result.failed > 0 && <FailedList results={result.results} />}
      </AlertDescription>
    </Alert>
  );
}

function FailedList({ results }: { results: WASendBulkResult["results"] }) {
  const [open, setOpen] = useState(false);
  const failed = results.filter((r) => !r.ok);
  if (!failed.length) return null;
  return (
    <div className="mt-1.5">
      <button className="text-[11px] underline underline-offset-2 flex items-center gap-1 opacity-80 hover:opacity-100" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? "Hide" : "Show"} failed ({failed.length})
      </button>
      {open && (
        <ul className="mt-1 text-[11px] space-y-0.5">
          {failed.map((r, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-red-500 shrink-0" />
              <span className="font-mono">{r.to}</span>
              {r.error && <span className="opacity-60">— {r.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Shared table wrapper ─────────────────────────────────────────────────────

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
      <tr>{children}</tr>
    </thead>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2 text-xs text-foreground overflow-hidden ${className}`}>
      {children}
    </td>
  );
}

// ─── Shared pagination ────────────────────────────────────────────────────────

function Pagination({
  page, total, pageSize, hasNext, hasPrevious, loading, count,
  onPrev, onNext,
}: {
  page: number; total: number | null; pageSize: number; hasNext: boolean;
  hasPrevious: boolean; loading: boolean; count: number | null;
  onPrev: () => void; onNext: () => void;
}) {
  if (!total) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={onPrev} disabled={loading || !hasPrevious} className="h-7 px-2.5 text-xs">← Prev</Button>
        <span className="text-[11px] text-muted-foreground px-1">
          Page {page}{total ? ` / ${Math.ceil(total / pageSize)}` : ""}
        </span>
        <Button size="sm" variant="outline" onClick={onNext} disabled={loading || !hasNext} className="h-7 px-2.5 text-xs">Next →</Button>
      </div>
      {total !== null && count !== null && (
        <span className="text-[11px] text-muted-foreground">{Math.min(count, pageSize)} of {total}</span>
      )}
    </div>
  );
}

// ─── Media + Poll Fields (shared by Single and Bulk send) ─────────────────────

type MediaMode = "none" | "url" | "file";
type WAMediaType = "image" | "document" | "video";

interface MediaPollState {
  mediaMode: MediaMode;
  mediaUrl: string;
  mediaType: WAMediaType;
  filename: string;
  mediaFile: File | null;
  pollId: string;
}

const initialMediaPoll: MediaPollState = {
  mediaMode: "none",
  mediaUrl: "",
  mediaType: "image",
  filename: "",
  mediaFile: null,
  pollId: "",
};

function useMediaPoll() {
  const [state, setState] = useState<MediaPollState>(initialMediaPoll);
  const update = <K extends keyof MediaPollState>(key: K, value: MediaPollState[K]) =>
    setState(s => ({ ...s, [key]: value }));
  const reset = () => setState(initialMediaPoll);

  // Build the fields the API expects from this state
  const toApiFields = () => {
    const fields: Record<string, unknown> = {};
    if (state.pollId.trim()) fields.poll_id = state.pollId.trim();
    if (state.mediaMode === "url" && state.mediaUrl.trim()) {
      fields.media_url = state.mediaUrl.trim();
      fields.media_type = state.mediaType;
      if (state.mediaType === "document" && state.filename.trim()) fields.filename = state.filename.trim();
    } else if (state.mediaMode === "file" && state.mediaFile) {
      fields.media_file = state.mediaFile;
      if (state.filename.trim()) fields.filename = state.filename.trim();
    }
    return fields;
  };

  return { state, update, reset, toApiFields };
}

function MediaPollFields({
  state, update,
}: {
  state: MediaPollState;
  update: <K extends keyof MediaPollState>(key: K, value: MediaPollState[K]) => void;
}) {
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  // Pulling polls inline so the user picks from a list instead of having to
  // remember/paste a name. The selected value is the poll title; the send
  // hooks resolve title → UUID transparently before posting.
  const { listPolls } = useWhatsAppCloud();
  const [polls, setPolls] = useState<WAPollListItem[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);

  const refreshPolls = async () => {
    setPollsLoading(true);
    setPollsError(null);
    try {
      const res = await listPolls({ page_size: 50 });
      setPolls(res.results ?? []);
    } catch (e) {
      setPollsError(e instanceof Error ? e.message : "Failed to load polls");
      setPolls([]);
    } finally {
      setPollsLoading(false);
    }
  };

  useEffect(() => {
    void refreshPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Card className="bg-gray-50/60 dark:bg-gray-900/40 border-dashed">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Media & Poll (optional)
          </Label>
        </div>

        {/* Media mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-white dark:bg-gray-800 border border-border w-fit">
          {(["none", "url", "file"] as MediaMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => update("mediaMode", m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                state.mediaMode === m
                  ? "bg-[#25D366] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "none" ? "No media" : m === "url" ? "Public URL" : "Upload file"}
            </button>
          ))}
        </div>

        {state.mediaMode !== "none" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Media type select (URL mode) */}
            {state.mediaMode === "url" && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Media type</Label>
                <Select value={state.mediaType} onValueChange={v => update("mediaType", v as WAMediaType)}>
                  <SelectTrigger className="h-8 text-xs border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="document">Document / PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* URL input */}
            {state.mediaMode === "url" && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Public HTTPS URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/file.pdf"
                  value={state.mediaUrl}
                  onChange={e => update("mediaUrl", e.target.value)}
                  className="h-8 text-xs border-border"
                />
              </div>
            )}

            {/* File picker */}
            {state.mediaMode === "file" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Pick a file (image / PDF / video)
                </Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf,video/*"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    update("mediaFile", f);
                    if (f && !state.filename) update("filename", f.name);
                  }}
                  className="h-8 text-xs border-border file:text-[11px] file:font-medium file:mr-2 file:border-0 file:rounded file:px-2 file:py-1 file:bg-gray-100 file:text-gray-900 dark:file:bg-gray-700 dark:file:text-gray-100"
                />
                {state.mediaFile && (
                  <p className="text-[10px] text-muted-foreground">
                    {state.mediaFile.name} · {(state.mediaFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
            )}

            {/* Filename — only meaningful for documents */}
            {(state.mediaMode === "file" || state.mediaType === "document") && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Filename (shown to recipients on document tile)
                </Label>
                <Input
                  placeholder="e.g. Invitation.pdf"
                  value={state.filename}
                  onChange={e => update("filename", e.target.value)}
                  className="h-8 text-xs border-border"
                  maxLength={240}
                />
              </div>
            )}
          </div>
        )}

        {/* Poll picker */}
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Poll (optional)
            </Label>
            <div className="flex items-center gap-2">
              {polls.length > 0 && (
                <button
                  type="button"
                  onClick={refreshPolls}
                  disabled={pollsLoading}
                  aria-label="Refresh polls"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {pollsLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPollDialogOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" strokeWidth={2.6} />
                Create new
              </button>
            </div>
          </div>

          {pollsError ? (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-[11px]">{pollsError}</AlertDescription>
            </Alert>
          ) : pollsLoading && polls.length === 0 ? (
            <div className="h-8 inline-flex items-center gap-2 text-[11px] text-muted-foreground px-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading polls…
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">
                No polls yet — tap <span className="font-semibold text-primary">Create new</span> to make one.
              </p>
            </div>
          ) : (
            <>
              <Select
                value={state.pollId}
                onValueChange={(v) => update("pollId", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-xs border-border">
                  <SelectValue placeholder="Choose a poll…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No poll</SelectItem>
                  {polls.map((p) => (
                    <SelectItem key={p.id} value={p.title} className="text-xs">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium">{p.title}</span>
                        {!p.is_active && (
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            closed
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Recipients receive reply buttons matching the poll's options.
              </p>
            </>
          )}
        </div>
      </CardContent>
      <CreatePollDialog
        open={pollDialogOpen}
        onOpenChange={setPollDialogOpen}
        onCreated={(poll) => {
          update("pollId", poll.title);
          void refreshPolls();
        }}
      />
    </Card>
  );
}

// Resolve the variable keys a local template needs. Prefers the backend's
// authoritative `variables` list (covers positional {{1}} AND named {{name}}),
// falling back to extracting any {{…}} token from the body when absent.
const getTemplateVariableKeys = (tpl?: LocalTemplate | null): string[] => {
  if (!tpl) return [];
  if (Array.isArray(tpl.variables) && tpl.variables.length > 0) {
    return tpl.variables.map((v) => String(v).trim()).filter(Boolean);
  }
  const found = new Set<string>();
  const re = /{{\s*([^}]+?)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl.body_text ?? "")) !== null) {
    const tok = m[1].trim();
    if (tok) found.add(tok);
  }
  return Array.from(found);
};

// ─── Single Send Tab ──────────────────────────────────────────────────────────

function SingleSendTab({ waAccountId, prefillSearch = "" }: { waAccountId: string; prefillSearch?: string }) {
  const { sendSingle, sendApprovedTemplateBulk, getMessageTemplates, getUsers, isLoading } = useWhatsAppCloud();
  // Policy: WhatsApp proactive sends are template-only (WHATSAPP_REQUIRE_TEMPLATE).
  const [msgType] = useState<"text" | "template">("template");
  const [text, setText] = useState("");
  const mediaPoll = useMediaPoll();
  // Approved Meta templates (real type=template send, by name). Loaded live from
  // Meta so only genuinely-approved templates appear — never local custom drafts.
  const [metaTpls, setMetaTpls] = useState<WAMessageTemplate[]>([]);
  const [metaTplLoading, setMetaTplLoading] = useState(false);
  const [metaTplError, setMetaTplError] = useState<string | null>(null);
  const [metaTplName, setMetaTplName] = useState("");
  // token -> source ("name" | "phone" | "email" | "attr:<key>" | "static:<value>")
  const [paramSources, setParamSources] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WASendSingleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Carries credit + attachment metadata from the most recent template send
  // so the success banner can display "1 credit used", "image attached", etc.
  const [lastSendMeta, setLastSendMeta] = useState<{
    credits_used?: number;
    credits_after?: number;
    poll_id?: string;
    media_id?: string;
    media_type?: string;
  } | null>(null);

  const [audience, setAudience] = useState<WAUser[]>([]);
  const [audiencePage, setAudiencePage] = useState(1);
  const [audiencePageSize, setAudiencePageSize] = useState(25);
  const [audienceTotal, setAudienceTotal] = useState<number | null>(null);
  const [audienceHasNext, setAudienceHasNext] = useState(false);
  const [audienceHasPrevious, setAudienceHasPrevious] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  // Search box for the contact picker. Backend forwards this to the contacts
  // ?search=… filter so people with thousands of contacts can find someone fast.
  // Seeded from the URL when arriving via the /contacts → Send WhatsApp action.
  const [audienceSearch, setAudienceSearch] = useState(prefillSearch);
  const [audienceSearchDebounced, setAudienceSearchDebounced] = useState(prefillSearch);

  // Debounce typing so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setAudienceSearchDebounced(audienceSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [audienceSearch]);

  const loadAudience = async (page = 1, search = audienceSearchDebounced) => {
    setAudienceLoading(true);
    setAudienceError(null);
    try {
      const res = await getUsers(
        { page, page_size: audiencePageSize, search: search || undefined },
        waAccountId || undefined,
      );
      setAudience(Array.isArray(res?.users) ? res.users : []);
      setAudiencePage(page);
      setAudienceTotal(res?.total ?? null);
      setAudienceHasNext(res?.has_next ?? false);
      setAudienceHasPrevious(res?.has_previous ?? false);
    } catch (e) {
      setAudienceError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setAudienceLoading(false);
    }
  };

  // Reload on account change, page-size change, or search term change. Always
  // jumps back to page 1 when the search term shifts so results aren't empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAudience(1); }, [waAccountId, audiencePageSize, audienceSearchDebounced]);

  // Load APPROVED Meta templates the first time the user enters template mode.
  // These come straight from Meta (WABA message_templates) so the picker only
  // ever shows real, approved templates — exactly the ones whose buttons render.
  useEffect(() => {
    if (msgType !== "template" || metaTpls.length > 0 || metaTplLoading) return;
    let cancelled = false;
    void (async () => {
      setMetaTplLoading(true);
      setMetaTplError(null);
      try {
        const res = await getMessageTemplates(waAccountId || undefined, {
          status: "APPROVED",
          limit: 100,
        });
        if (cancelled) return;
        const list = (res?.data?.graph?.data ?? []).filter((t) => t.status === "APPROVED");
        setMetaTpls(list);
      } catch (e) {
        if (!cancelled) setMetaTplError(e instanceof Error ? e.message : "Failed to load templates");
      } finally {
        if (!cancelled) setMetaTplLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgType, waAccountId]);

  const selectedMetaTpl = metaTpls.find((t) => t.name === metaTplName) || null;
  const metaHeaderFormat = (selectedMetaTpl?.components ?? []).find((c) => c.type === "HEADER")?.format;
  const metaNeedsImage = metaHeaderFormat === "IMAGE" || metaHeaderFormat === "VIDEO" || metaHeaderFormat === "DOCUMENT";
  // Body placeholder tokens ({{1}}, {{name}}…) in order of first appearance.
  const metaBodyTokens: string[] = (() => {
    const body = (selectedMetaTpl?.components ?? []).find((c) => c.type === "BODY");
    const bodyText = body?.text ?? "";
    const re = /{{\s*([^}]+?)\s*}}/g;
    const seen = new Set<string>();
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(bodyText)) !== null) {
      const tok = m[1].trim();
      if (tok && !seen.has(tok)) { seen.add(tok); out.push(tok); }
    }
    return out;
  })();
  // Each {{token}} -> contact-field source for the real Meta send.
  const buildParamMap = () =>
    metaBodyTokens.map((tok) => ({ token: tok, source: paramSources[tok] || "name" }));

  // Reset the field mapping when the selected approved template changes.
  useEffect(() => { setParamSources({}); }, [metaTplName]);

  const sendTo = async (to: string) => {
    setError(null);
    setResult(null);
    try {
      if (msgType === "template") {
        if (!selectedMetaTpl) {
          setError("Pick an approved template first.");
          return;
        }

        // Real Meta type=template send (by name) so the template's own buttons
        // render and inbound taps are captured. An optional shared header image
        // comes from the Media section (for IMAGE/VIDEO/DOCUMENT-header templates).
        const extras = mediaPoll.toApiFields() as Record<string, unknown>;

        const data = await sendApprovedTemplateBulk(
          {
            template_name: selectedMetaTpl.name,
            language_code: (selectedMetaTpl.language as string) || "en",
            recipients: [to],
            param_map: buildParamMap(),
            ...(extras.media_url ? { media_url: String(extras.media_url) } : {}),
            ...(extras.media_file instanceof File ? { media_file: extras.media_file } : {}),
            ...(extras.media_type ? { media_type: extras.media_type as "image" | "document" | "video" } : {}),
          },
          waAccountId || undefined,
        );

        const first = data.results?.[0];
        setResult({
          whatsapp_account_id: data.whatsapp_account_id,
          to: first?.to ?? to,
          ok: !!first?.ok,
          http_status: first?.http_status ?? 0,
          message_id: first?.message_id,
          error: first?.error,
        });
        // Stash credit + media metadata so the success banner can show it.
        setLastSendMeta({
          credits_used: data.credits_used,
          credits_after: data.credits_after,
          poll_id: data.poll_id,
          media_id: data.media_id,
          media_type: data.media_type,
        });
      } else {
        const payload = { to, text, ...mediaPoll.toApiFields() };
        const data = await sendSingle(payload, waAccountId || undefined);
        setResult(data);
      }
    } catch (e) {
      if (e instanceof WAInsufficientCreditsError) {
        setError(
          `Out of WhatsApp credits — need ${e.credits_required}, have ${e.credits_available}. Top up to continue.`,
        );
        return;
      }
      setError(e instanceof Error ? e.message : "Send failed");
    }
  };

  // In text mode, sending is allowed if there's text OR media OR a poll
  const canSendText = !!(text.trim() || mediaPoll.state.pollId.trim() ||
    (mediaPoll.state.mediaMode === "url" && mediaPoll.state.mediaUrl.trim()) ||
    (mediaPoll.state.mediaMode === "file" && mediaPoll.state.mediaFile));

  // Approved template chosen, every body param mapped, and — if the template has
  // a media header — a shared image/document attached from the Media section.
  const metaMediaProvided =
    (mediaPoll.state.mediaMode === "url" && !!mediaPoll.state.mediaUrl.trim()) ||
    (mediaPoll.state.mediaMode === "file" && !!mediaPoll.state.mediaFile);
  const canSendTemplate =
    !!selectedMetaTpl &&
    metaBodyTokens.every((t) => (paramSources[t] || "name").length > 0) &&
    (!metaNeedsImage || metaMediaProvided);

  return (
    <div className="space-y-4 p-1">
      {/* Message type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message Type</Label>
        <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/40 text-sm text-foreground">
          Approved template
        </div>
        <p className="text-[11px] text-muted-foreground">
          WhatsApp messages are sent using approved templates only.
        </p>
      </div>

      {/* Message content */}
      {msgType === "text" ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Message {mediaPoll.state.mediaMode !== "none" && <span className="text-[10px] font-normal text-muted-foreground">(caption)</span>}
            </Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
          </div>
          <Textarea
            placeholder={mediaPoll.state.pollId ? "Optional poll question override…" : "Type your message here…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="text-sm resize-none border-border"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Approved template</Label>
              <button
                type="button"
                onClick={() => { setMetaTpls([]); setMetaTplName(""); }}
                disabled={metaTplLoading}
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                {metaTplLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Reload
              </button>
            </div>
            {metaTplLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading approved templates…</div>
            ) : metaTplError ? (
              <Alert variant="destructive" className="py-1.5"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{metaTplError}</AlertDescription></Alert>
            ) : metaTpls.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
                No approved Meta templates found. Create and get one approved in the Templates tab.
              </div>
            ) : (
              <Select value={metaTplName} onValueChange={setMetaTplName}>
                <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Select an approved template" /></SelectTrigger>
                <SelectContent>
                  {metaTpls.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.name}>
                      {tpl.name} <span className="opacity-60 text-[11px] uppercase ml-1">({(tpl.language as string) || "—"})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedMetaTpl && (
              <p className="text-[10.5px] text-muted-foreground/80 pt-0.5">
                Live from Meta · only APPROVED templates shown · delivers outside the 24-hour window.
              </p>
            )}
          </div>

          {/* Per-recipient parameter mapping — each {{n}} resolves from a contact field. */}
          {selectedMetaTpl && metaBodyTokens.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Parameters</Label>
              <p className="text-[11px] text-muted-foreground">
                Map each placeholder to a contact field, or set fixed text. Fills in from the recipient's contact when sent.
              </p>
              <div className="space-y-1.5">
                {metaBodyTokens.map((tok) => {
                  const src = paramSources[tok] || "name";
                  const isAttr = src.startsWith("attr:");
                  const isStatic = src.startsWith("static:");
                  const preset = isAttr ? "attr" : isStatic ? "static" : src;
                  return (
                    <div key={tok} className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground w-12 shrink-0">{`{{${tok}}}`}</span>
                      <Select
                        value={preset}
                        onValueChange={(v) =>
                          setParamSources((prev) => ({
                            ...prev,
                            [tok]: v === "attr" ? "attr:" : v === "static" ? "static:" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-sm border-border w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Contact name</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="attr">Custom attribute…</SelectItem>
                          <SelectItem value="static">Fixed text…</SelectItem>
                        </SelectContent>
                      </Select>
                      {isAttr && (
                        <Input
                          value={src.slice("attr:".length)}
                          onChange={(e) => setParamSources((prev) => ({ ...prev, [tok]: `attr:${e.target.value}` }))}
                          placeholder="attribute key (e.g. company)"
                          className="h-9 text-sm border-border flex-1 min-w-[140px]"
                        />
                      )}
                      {isStatic && (
                        <Input
                          value={src.slice("static:".length)}
                          onChange={(e) => setParamSources((prev) => ({ ...prev, [tok]: `static:${e.target.value}` }))}
                          placeholder="same text for everyone"
                          className="h-9 text-sm border-border flex-1 min-w-[140px]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedMetaTpl && metaNeedsImage && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              This template has a {String(metaHeaderFormat).toLowerCase()} header — attach a shared {String(metaHeaderFormat).toLowerCase()} below (Media).
            </p>
          )}
        </div>
      )}

      {/* Media & Poll — shown in both modes so users can attach optional media/poll context */}
      <MediaPollFields state={mediaPoll.state} update={mediaPoll.update} />

      {/* Status */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert className="py-2 border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          <AlertDescription className="text-xs text-green-800 dark:text-green-300">
            Delivered to <span className="font-mono font-semibold">{result.to}</span>
            {result.message_id && <span className="ml-2 opacity-60">ID: {result.message_id}</span>}
            {lastSendMeta && (lastSendMeta.credits_used !== undefined || lastSendMeta.media_type || lastSendMeta.poll_id) && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] opacity-80">
                {lastSendMeta.credits_used !== undefined && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200/40 dark:bg-emerald-900/40">
                    {lastSendMeta.credits_used} credit{lastSendMeta.credits_used === 1 ? "" : "s"} used
                    {lastSendMeta.credits_after !== undefined && ` · ${lastSendMeta.credits_after} left`}
                  </span>
                )}
                {lastSendMeta.media_type && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200/40 dark:bg-emerald-900/40">
                    {lastSendMeta.media_type} attached
                  </span>
                )}
                {lastSendMeta.poll_id && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200/40 dark:bg-emerald-900/40">poll attached</span>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Contact table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Contacts</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <Select value={String(audiencePageSize)} onValueChange={v => { setAudiencePageSize(Number(v)); setAudiencePage(1); }}>
              <SelectTrigger className="h-6 w-14 text-[11px] border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            {audienceTotal !== null && <span className="text-[11px] text-muted-foreground ml-1">{audienceTotal} total</span>}
          </div>
        </div>

        {/* Search — forwarded to /messaging/contacts/?search=… so large books stay
            workable. Debounced 300ms to avoid hammering the API while typing. */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={audienceSearch}
            onChange={(e) => setAudienceSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="h-9 pl-8 pr-8 text-sm border-border"
          />
          {audienceSearch && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setAudienceSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {audienceLoading && audienceSearch && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        {audienceError && (
          <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{audienceError}</AlertDescription></Alert>
        )}

        <TableWrap>
          <table className="w-full table-fixed">
            <TableHead>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th className="hidden md:table-cell">Email</Th>
              <Th>Action</Th>
            </TableHead>
            <tbody className="divide-y divide-border">
              {audienceLoading ? (
                <tr><td colSpan={4} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : audience.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-xs text-muted-foreground">No contacts found.</td></tr>
              ) : (
                audience.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Td>{user.name || "—"}</Td>
                    <Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{user.phone_number}</Td>
                    <Td className="hidden md:table-cell text-muted-foreground">{user.email || "—"}</Td>
                    <Td>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-[11px] bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg"
                        onClick={() => sendTo(user.phone_number)}
                        disabled={isLoading || (msgType === "text" ? !canSendText : !canSendTemplate)}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                      </Button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>

        <Pagination
          page={audiencePage} total={audienceTotal} pageSize={audiencePageSize}
          hasNext={audienceHasNext} hasPrevious={audienceHasPrevious}
          loading={audienceLoading} count={audience.length}
          onPrev={() => loadAudience(audiencePage - 1)} onNext={() => loadAudience(audiencePage + 1)}
        />
      </div>
    </div>
  );
}

// ─── Bulk Send Tab ────────────────────────────────────────────────────────────

function BulkSendTab({
  waAccountId,
  prefillRecipients = [],
  onUseImageBulkForTemplate,
}: {
  waAccountId: string;
  prefillRecipients?: string[];
  onUseImageBulkForTemplate?: (templateName: string) => void;
}) {
  const { sendBulk, sendFromTemplate, sendTemplateRich, getMessageTemplates, sendApprovedTemplateBulk, getUsers, isLoading } = useWhatsAppCloud();
  // Policy: WhatsApp proactive sends are template-only (WHATSAPP_REQUIRE_TEMPLATE).
  const [msgType] = useState<"text" | "template">("template");
  const [text, setText] = useState("");
  const [delayMs, setDelayMs] = useState(80);
  const [result, setResult] = useState<WASendBulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Carries credit + attachment metadata from the most recent bulk template
  // send so the result banner can show "N credits used", "image attached", etc.
  const [lastBulkMeta, setLastBulkMeta] = useState<{
    credits_used?: number;
    credits_after?: number;
    poll_id?: string;
    media_id?: string;
    media_type?: string;
  } | null>(null);
  const [sendMode, setSendMode] = useState<"selected" | "page" | "all" | "group">(
    prefillRecipients.length > 0 ? "selected" : "page",
  );
  const mediaPoll = useMediaPoll();

  // ── Group / tag-based send (mirrors Send SMS) ─────────────────────────────
  // Cache all contacts once, derive group tags from `Contact.tags`. User picks
  // either "All Contacts" or a specific tag and we use that list as recipients.
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [allContactsLoaded, setAllContactsLoaded] = useState(false);
  const [isLoadingAllContacts, setIsLoadingAllContacts] = useState(false);
  const [groupChoice, setGroupChoice] = useState<"" | "all" | "choose-group">("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  // One-shot loader — fetch every contact page so we can build the tag list.
  const loadAllContacts = async (): Promise<Contact[]> => {
    if (allContactsLoaded && allContacts.length > 0) return allContacts;
    if (isLoadingAllContacts) return allContacts;
    setIsLoadingAllContacts(true);
    let all: Contact[] = [];
    try {
      let page = 1;
      let hasNext = true;
      while (hasNext) {
        const res = await apiClient.getContacts({ page, page_size: 100 });
        if (!res.success || !res.data) break;
        all = all.concat(res.data.results || []);
        hasNext = Boolean(res.data.next);
        page += 1;
      }
      setAllContacts(all);
      setAllContactsLoaded(true);
      return all;
    } catch {
      return all;
    } finally {
      setIsLoadingAllContacts(false);
    }
  };

  // First time the user switches into group mode, kick off the contacts load.
  useEffect(() => {
    if (sendMode !== "group" || allContactsLoaded || isLoadingAllContacts) return;
    void loadAllContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMode]);

  // Unique tags + counts derived from the cached contact list.
  const groupTags = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>();
    for (const c of allContacts) {
      for (const raw of c.tags || []) {
        const t = raw.trim();
        if (!t) continue;
        const key = t.toLowerCase();
        const existing = m.get(key);
        if (existing) existing.count += 1;
        else m.set(key, { label: t, count: 1 });
      }
    }
    return Array.from(m.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allContacts]);

  // Contacts that match the current group selection.
  const groupContacts = useMemo<Contact[]>(() => {
    if (sendMode !== "group") return [];
    if (groupChoice === "all") return allContacts;
    if (groupChoice === "choose-group" && selectedTag) {
      const needle = selectedTag.trim().toLowerCase();
      return allContacts.filter((c) =>
        (c.tags || []).some((t) => t.trim().toLowerCase() === needle),
      );
    }
    return [];
  }, [sendMode, groupChoice, selectedTag, allContacts]);

  // Phone numbers ready for sendBulk / sendFromTemplate.
  const groupPhones = useMemo(
    () => groupContacts.map((c) => c.phone_e164).filter(Boolean),
    [groupContacts],
  );

  // Template-mode state — uses local templates (messaging.Template, channel=whatsapp).
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const templatesLoadedForRef = useRef(false);
  const templatesRequestInFlightRef = useRef(false);

  // Reusable loader so a newly-created or imported template appears immediately.
  // Pass selectId to auto-select after reload.
  const refreshTemplates = async (selectId?: string) => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const res = await apiClient.getTemplates({
        channel: "whatsapp",
        page_size: 100,
      });
      if (!res.success || !res.data) {
        setTemplatesError(res.error || res.message || "Failed to load templates");
        return;
      }
      const list = res.data.results?.templates ?? [];
      setTemplates(list);
      if (selectId && list.some((t) => t.id === selectId)) setTemplateId(selectId);
    } catch (e) {
      setTemplatesError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setTemplatesLoading(false);
      templatesLoadedForRef.current = true;
    }
  };

  useEffect(() => {
    if (msgType !== "template") return;
    if (templatesLoadedForRef.current || templatesRequestInFlightRef.current) return;
    templatesRequestInFlightRef.current = true;
    void refreshTemplates().finally(() => {
      templatesRequestInFlightRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgType]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const templateKeys = getTemplateVariableKeys(selectedTemplate);
  const AUTOFILL = new Set(["name", "phone", "email"]);
  const requiredKeys = templateKeys.filter((k) => !AUTOFILL.has(k));

  // Reset variable values when the selected template changes.
  useEffect(() => { setVariables({}); }, [templateId]);

  // ── Approved Meta templates (real type=template) + per-param field mapping ──
  const [metaTpls, setMetaTpls] = useState<WAMessageTemplate[]>([]);
  const [metaTplLoading, setMetaTplLoading] = useState(false);
  const [metaTplError, setMetaTplError] = useState<string | null>(null);
  const [metaTplName, setMetaTplName] = useState("");
  // token -> source ("name" | "phone" | "email" | "attr:<key>" | "static:<value>")
  const [paramSources, setParamSources] = useState<Record<string, string>>({});

  // Load APPROVED Meta templates the first time the user enters template mode.
  useEffect(() => {
    if (msgType !== "template" || metaTpls.length > 0 || metaTplLoading) return;
    let cancelled = false;
    void (async () => {
      setMetaTplLoading(true);
      setMetaTplError(null);
      try {
        const res = await getMessageTemplates(waAccountId || undefined, {
          status: "APPROVED",
          limit: 100,
        });
        if (cancelled) return;
        const list = (res?.data?.graph?.data ?? []).filter((t) => t.status === "APPROVED");
        setMetaTpls(list);
      } catch (e) {
        if (!cancelled) setMetaTplError(e instanceof Error ? e.message : "Failed to load templates");
      } finally {
        if (!cancelled) setMetaTplLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgType]);

  const selectedMetaTpl = metaTpls.find((t) => t.name === metaTplName) || null;
  // Header format (IMAGE/VIDEO/DOCUMENT/TEXT) and body placeholder tokens, in order.
  const metaHeaderFormat = (selectedMetaTpl?.components ?? []).find((c) => c.type === "HEADER")?.format;
  const metaNeedsImage = metaHeaderFormat === "IMAGE" || metaHeaderFormat === "VIDEO" || metaHeaderFormat === "DOCUMENT";
  const metaBodyTokens: string[] = (() => {
    const body = (selectedMetaTpl?.components ?? []).find((c) => c.type === "BODY");
    const text = body?.text ?? "";
    const re = /{{\s*([^}]+?)\s*}}/g;
    const seen = new Set<string>();
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[1].trim();
      if (tok && !seen.has(tok)) { seen.add(tok); out.push(tok); }
    }
    return out;
  })();
  // Reset the field mapping when the selected approved template changes.
  useEffect(() => { setParamSources({}); }, [metaTplName]);

  // Build the param_map sent to the backend (each token -> contact-field source).
  const buildParamMap = () =>
    metaBodyTokens.map((tok, i) => ({
      token: tok,
      source: paramSources[tok] || (i === 0 ? "name" : "name"),
    }));

  // Local create-template dialog — author a new one without leaving Send.
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);

  // Checkbox selection — seeded from `prefillRecipients` so /contacts → Send
  // WhatsApp lands here with those numbers already ticked.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(prefillRecipients));

  const [audience, setAudience] = useState<WAUser[]>([]);
  const [audiencePage, setAudiencePage] = useState(1);
  const [audiencePageSize, setAudiencePageSize] = useState(25);
  const [audienceTotal, setAudienceTotal] = useState<number | null>(null);
  const [audienceHasNext, setAudienceHasNext] = useState(false);
  const [audienceHasPrevious, setAudienceHasPrevious] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  // Server-side contact search — backend-filtered so large books stay workable.
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audienceSearchDebounced, setAudienceSearchDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setAudienceSearchDebounced(audienceSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [audienceSearch]);

  const loadAudience = async (page = 1, search = audienceSearchDebounced) => {
    setAudienceLoading(true);
    setAudienceError(null);
    try {
      const res = await getUsers(
        { page, page_size: audiencePageSize, search: search || undefined },
        waAccountId || undefined,
      );
      setAudience(Array.isArray(res?.users) ? res.users : []);
      setAudiencePage(page);
      setAudienceTotal(res?.total ?? null);
      setAudienceHasNext(res?.has_next ?? false);
      setAudienceHasPrevious(res?.has_previous ?? false);
    } catch (e) {
      setAudienceError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setAudienceLoading(false);
    }
  };

  // Reload on account / page-size / search change. Always jumps back to page 1
  // when the search term shifts so results aren't empty on stale pages.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAudience(1); }, [waAccountId, audiencePageSize, audienceSearchDebounced]);

  // Auto-switch to "selected" mode when user starts checking boxes
  const toggleOne = (phone: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
    if (sendMode !== "selected") setSendMode("selected");
  };

  const pagePhones = audience.map(u => u.phone_number);
  const allPageChecked = pagePhones.length > 0 && pagePhones.every(p => checked.has(p));
  const somePageChecked = pagePhones.some(p => checked.has(p));

  const togglePage = () => {
    setChecked(prev => {
      const next = new Set(prev);
      if (allPageChecked) { pagePhones.forEach(p => next.delete(p)); }
      else { pagePhones.forEach(p => next.add(p)); }
      return next;
    });
    if (sendMode !== "selected") setSendMode("selected");
  };

  const clearChecked = () => { setChecked(new Set()); setSendMode("page"); };

  const handle = async (list: string[]) => {
    setError(null);
    setResult(null);
    if (list.length === 0) { setError("No recipients selected."); return; }
    if (list.length > 500) { setError("Maximum 500 recipients per request."); return; }
    try {
      if (msgType === "template") {
        if (!selectedMetaTpl) { setError("Pick an approved template first."); return; }

        // Real Meta type=template send. Each {{n}} resolves per recipient from
        // the mapped contact field. An optional shared header image comes from
        // the Media section (for IMAGE-header templates).
        const extras = mediaPoll.toApiFields() as Record<string, unknown>;

        const data = await sendApprovedTemplateBulk(
          {
            template_name: selectedMetaTpl.name,
            language_code: (selectedMetaTpl.language as string) || "en",
            recipients: list,
            param_map: buildParamMap(),
            ...(extras.media_url ? { media_url: String(extras.media_url) } : {}),
            ...(extras.media_file instanceof File ? { media_file: extras.media_file } : {}),
            ...(extras.media_type ? { media_type: extras.media_type as "image" | "document" | "video" } : {}),
          },
          waAccountId || undefined,
        );

        // sendApprovedTemplateBulk returns the same shape as sendFromTemplate.
        setResult({
          whatsapp_account_id: data.whatsapp_account_id,
          total: data.total,
          sent: data.sent,
          failed: data.failed,
          results: data.results,
        });
        setLastBulkMeta({
          credits_used: data.credits_used,
          credits_after: data.credits_after,
          poll_id: data.poll_id,
          media_id: data.media_id,
          media_type: data.media_type,
        });
      } else {
        const data = await sendBulk(
          { recipients: list, text, delay_ms: delayMs, ...mediaPoll.toApiFields() },
          waAccountId || undefined,
        );
        setResult(data);
      }
    } catch (e) {
      if (e instanceof WAInsufficientCreditsError) {
        setError(
          `Out of WhatsApp credits — need ${e.credits_required}, have ${e.credits_available}. Top up to continue.`,
        );
        return;
      }
      setError(e instanceof Error ? e.message : "Bulk send failed");
    }
  };

  const handleSend = async () => {
    setError(null); setResult(null);
    if (sendMode === "selected") {
      await handle([...checked]);
    } else if (sendMode === "page") {
      await handle(pagePhones);
    } else if (sendMode === "group") {
      if (groupPhones.length > 500) { setError("Maximum 500 recipients per request."); return; }
      await handle(groupPhones);
    } else {
      try {
        setAudienceLoading(true);
        let allContacts: string[] = [];
        let page = 1;
        let hasNext = true;
        while (hasNext) {
          const res = await getUsers({ page, page_size: 100 }, waAccountId || undefined);
          allContacts = allContacts.concat(res.users.map(u => u.phone_number));
          hasNext = res.has_next;
          page++;
        }
        setAudienceLoading(false);
        if (allContacts.length > 500) { setError("Maximum 500 recipients per request."); return; }
        await handle(allContacts);
      } catch (e) {
        setAudienceLoading(false);
        setError(e instanceof Error ? e.message : "Failed to load contacts");
      }
    }
  };

  const sendCount =
    sendMode === "selected" ? checked.size :
    sendMode === "page" ? audience.length :
    sendMode === "group" ? groupPhones.length :
    (audienceTotal ?? 0);
  const hasTextContent = !!(text.trim() || mediaPoll.state.pollId.trim() ||
    (mediaPoll.state.mediaMode === "url" && mediaPoll.state.mediaUrl.trim()) ||
    (mediaPoll.state.mediaMode === "file" && mediaPoll.state.mediaFile));
  // Approved template chosen, and every body param has a source. If the template
  // needs media (image header), require a shared image from the Media section.
  const metaMediaProvided =
    (mediaPoll.state.mediaMode === "url" && !!mediaPoll.state.mediaUrl.trim()) ||
    (mediaPoll.state.mediaMode === "file" && !!mediaPoll.state.mediaFile);
  const hasTemplateContent =
    !!selectedMetaTpl &&
    metaBodyTokens.every((t) => (paramSources[t] || "name").length > 0) &&
    (!metaNeedsImage || metaMediaProvided);
  const hasContent = msgType === "text" ? hasTextContent : hasTemplateContent;
  const sendDisabled =
    isLoading ||
    !hasContent ||
    sendCount === 0 ||
    (sendMode === "all" && (audienceTotal ?? 0) > 500) ||
    (sendMode === "group" && groupPhones.length > 500);

  return (
    <div className="space-y-4 p-1">
      {/* Message type — Text vs Approved template */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message Type</Label>
        <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/40 text-sm text-foreground">
          Approved template
        </div>
        <p className="text-[11px] text-muted-foreground">
          WhatsApp messages are sent using approved templates only.
        </p>
      </div>

      {msgType === "text" ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Message {mediaPoll.state.mediaMode !== "none" && <span className="text-[10px] font-normal text-muted-foreground">(caption)</span>}
            </Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
          </div>
          <Textarea placeholder={mediaPoll.state.pollId ? "Optional poll question override…" : "Your message here…"} value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm resize-none border-border" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Approved template</Label>
              <button
                type="button"
                onClick={() => { setMetaTpls([]); setMetaTplName(""); }}
                disabled={metaTplLoading}
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                {metaTplLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Reload
              </button>
            </div>
            {metaTplLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading approved templates…</div>
            ) : metaTplError ? (
              <Alert variant="destructive" className="py-1.5"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{metaTplError}</AlertDescription></Alert>
            ) : metaTpls.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
                No approved Meta templates found. Create and get one approved in the Templates tab.
              </div>
            ) : (
              <Select value={metaTplName} onValueChange={setMetaTplName}>
                <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Select an approved template" /></SelectTrigger>
                <SelectContent>
                  {metaTpls.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.name}>
                      {tpl.name} <span className="opacity-60 text-[11px] uppercase ml-1">({(tpl.language as string) || "—"})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedMetaTpl && (
              <p className="text-[10.5px] text-muted-foreground/80 pt-0.5">
                Live from Meta · only APPROVED templates shown · delivers outside the 24-hour window.
              </p>
            )}
          </div>

          {/* Per-receiver parameter mapping — each {{n}} resolves from a contact field. */}
          {selectedMetaTpl && metaBodyTokens.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Parameters per receiver</Label>
              <p className="text-[11px] text-muted-foreground">
                Map each placeholder to a contact field — it fills in from each receiver's own contact when sent.
              </p>
              <div className="space-y-1.5">
                {metaBodyTokens.map((tok) => {
                  const src = paramSources[tok] || "name";
                  const isAttr = src.startsWith("attr:");
                  const isStatic = src.startsWith("static:");
                  const preset = isAttr ? "attr" : isStatic ? "static" : src;
                  return (
                    <div key={tok} className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground w-12 shrink-0">{`{{${tok}}}`}</span>
                      <Select
                        value={preset}
                        onValueChange={(v) =>
                          setParamSources((prev) => ({
                            ...prev,
                            [tok]: v === "attr" ? "attr:" : v === "static" ? "static:" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-sm border-border w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Contact name</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="attr">Custom attribute…</SelectItem>
                          <SelectItem value="static">Fixed text…</SelectItem>
                        </SelectContent>
                      </Select>
                      {isAttr && (
                        <Input
                          value={src.slice("attr:".length)}
                          onChange={(e) => setParamSources((prev) => ({ ...prev, [tok]: `attr:${e.target.value}` }))}
                          placeholder="attribute key (e.g. company)"
                          className="h-9 text-sm border-border flex-1 min-w-[140px]"
                        />
                      )}
                      {isStatic && (
                        <Input
                          value={src.slice("static:".length)}
                          onChange={(e) => setParamSources((prev) => ({ ...prev, [tok]: `static:${e.target.value}` }))}
                          placeholder="same text for everyone"
                          className="h-9 text-sm border-border flex-1 min-w-[140px]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedMetaTpl && metaNeedsImage && (
            metaHeaderFormat === "IMAGE" && onUseImageBulkForTemplate ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 space-y-2">
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                  This template has an image header. Attach <span className="font-semibold">one shared image</span> below (Media), or send a
                  {" "}<span className="font-semibold">different image to each receiver</span> — matched automatically by filename
                  {" "}(e.g. <code className="font-mono">255712345678.jpg</code> or <code className="font-mono">Mary_Smith.png</code>).
                </p>
                <button
                  type="button"
                  onClick={() => onUseImageBulkForTemplate(selectedMetaTpl.name)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition active:scale-[0.98]"
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Upload one image per receiver →
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                This template has a {String(metaHeaderFormat).toLowerCase()} header — attach a shared {String(metaHeaderFormat).toLowerCase()} below (Media).
              </p>
            )
          )}
        </div>
      )}

      <MediaPollFields state={mediaPoll.state} update={mediaPoll.update} />

      {/* Delay + Send mode (Selected/Page/All) + Group pill in one row.
          Group is split out as a separately-styled pill on the right so it
          reads as a distinct mode rather than just another radio option. */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Delay (ms)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={2000} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="w-20 h-9 text-sm border-border" />
            <span className="text-[11px] text-muted-foreground">Default 80</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Send To</Label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="bulkSendMode" value="selected" checked={sendMode === "selected"} onChange={() => setSendMode("selected")} className="w-3.5 h-3.5 accent-[#25D366]" />
              <span>Selected</span>
              {checked.size > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#25D366] text-white text-[10px] font-bold leading-none">
                  {checked.size}
                </span>
              )}
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="bulkSendMode" value="page" checked={sendMode === "page"} onChange={() => setSendMode("page")} className="w-3.5 h-3.5 accent-[#25D366]" />
              Page ({audience.length})
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="bulkSendMode" value="all" checked={sendMode === "all"} onChange={() => setSendMode("all")} className="w-3.5 h-3.5 accent-[#25D366]" />
              All ({audienceTotal ?? 0})
            </label>
          </div>
        </div>

        {/* Group pill — separate from the radio group, pushed to the right */}
        <div className="ml-auto">
          <button
            type="button"
            role="radio"
            aria-checked={sendMode === "group"}
            onClick={() => setSendMode(sendMode === "group" ? "page" : "group")}
            className={[
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] font-semibold",
              "transition-all active:scale-[0.98] border",
              sendMode === "group"
                ? "bg-[#25D366] text-white border-transparent shadow-[0_2px_8px_rgba(37,211,102,0.35)]"
                : "bg-card text-foreground border-border hover:border-[#25D366]/50 hover:bg-[#25D366]/5",
            ].join(" ")}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={2.4} />
            <span>Group</span>
            {sendMode === "group" && groupPhones.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-white/25 text-white text-[10px] font-bold leading-none">
                {groupPhones.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Group / tag picker — visible only when Send To = Group */}
      {sendMode === "group" && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/60 bg-muted/30 dark:bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#25D366]" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold text-foreground leading-tight">Contact Group</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Pick All Contacts or a tag-based group to send to.
                </p>
              </div>
            </div>
            {groupContacts.length > 0 && (
              <Badge
                variant="secondary"
                className={`text-[11px] font-semibold ${groupPhones.length > 500 ? "bg-destructive/15 text-destructive" : "bg-[#25D366]/15 text-[#1ebe5d]"}`}
              >
                {groupContacts.length} {groupContacts.length === 1 ? "recipient" : "recipients"}
              </Badge>
            )}
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <Select
              value={groupChoice}
              onValueChange={(v) => {
                setGroupChoice(v as "all" | "choose-group");
                setSelectedTag("");
              }}
            >
              <SelectTrigger className="h-10 text-sm border-border">
                <SelectValue placeholder={isLoadingAllContacts ? "Loading contacts…" : "Choose a contact group"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">All Contacts</span>
                  <span className="ml-1.5 text-[11px] text-muted-foreground">({allContacts.length})</span>
                </SelectItem>
                <SelectItem value="choose-group">
                  <span className="font-medium">Choose Group Name</span>
                  <span className="ml-1.5 text-[11px] text-muted-foreground">({groupTags.length} tag{groupTags.length === 1 ? "" : "s"})</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {groupChoice === "choose-group" && (
              <div>
                {isLoadingAllContacts && groupTags.length === 0 ? (
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3 justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading groups…
                  </div>
                ) : groupTags.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
                    <p className="text-[12px] text-muted-foreground">
                      No tags found on your contacts.
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      Add tags to contacts to enable group sending.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {groupTags.map(({ label, count }) => {
                      const isSelected = selectedTag === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setSelectedTag(label)}
                          className={[
                            "px-3 py-2.5 rounded-xl text-left text-[12.5px] font-medium transition-all active:scale-[0.98]",
                            isSelected
                              ? "bg-[#25D366] text-white shadow-[0_2px_8px_rgba(37,211,102,0.25)]"
                              : "bg-muted/40 border border-border/60 text-foreground hover:border-[#25D366]/40 hover:bg-[#25D366]/5",
                          ].join(" ")}
                        >
                          <span className="block truncate">{label.replace(/_/g, " ")}</span>
                          <span className={`block text-[10.5px] mt-0.5 ${isSelected ? "text-white/85" : "text-muted-foreground"}`}>
                            {count} {count === 1 ? "contact" : "contacts"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {groupContacts.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                    Preview
                  </Label>
                  {groupPhones.length > 500 && (
                    <span className="text-[11px] text-destructive font-semibold">Over 500 limit — narrow the group</span>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto rounded-lg bg-muted/30 p-2 flex flex-wrap gap-1.5">
                  {groupContacts.slice(0, 20).map((c) => (
                    <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#1ebe5d] font-medium">
                      {c.name || c.phone_e164}
                    </span>
                  ))}
                  {groupContacts.length > 20 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      +{groupContacts.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleSend} disabled={sendDisabled} className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send to {sendCount} {sendCount === 1 ? "contact" : "contacts"}
      </Button>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}
      <BulkResultBanner result={result} />
      {result && lastBulkMeta && (lastBulkMeta.credits_used !== undefined || lastBulkMeta.media_type || lastBulkMeta.poll_id) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground -mt-1">
          {lastBulkMeta.credits_used !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
              {lastBulkMeta.credits_used} credit{lastBulkMeta.credits_used === 1 ? "" : "s"} used
              {lastBulkMeta.credits_after !== undefined && ` · ${lastBulkMeta.credits_after} left`}
            </span>
          )}
          {lastBulkMeta.media_type && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
              {lastBulkMeta.media_type} attached
            </span>
          )}
          {lastBulkMeta.poll_id && (
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold">
              poll attached
            </span>
          )}
        </div>
      )}

      {/* Contact table with checkboxes — hidden in Group mode (group preview already shows recipients) */}
      <div className={`space-y-2 ${sendMode === "group" ? "hidden" : ""}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Contacts</Label>
            {checked.size > 0 && (
              <div className="flex items-center gap-1.5">
                <button onClick={clearChecked} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <Select value={String(audiencePageSize)} onValueChange={v => { setAudiencePageSize(Number(v)); setAudiencePage(1); }}>
              <SelectTrigger className="h-6 w-14 text-[11px] border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            {audienceTotal !== null && <span className="text-[11px] text-muted-foreground">{audienceTotal} total</span>}
          </div>
        </div>

        {/* Search — forwarded to /messaging/contacts/?search=… so large books stay
            workable. Debounced 300ms to avoid hammering the API while typing. */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={audienceSearch}
            onChange={(e) => setAudienceSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="h-9 pl-8 pr-8 text-sm border-border"
          />
          {audienceSearch && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setAudienceSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {audienceLoading && audienceSearch && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        {audienceError && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{audienceError}</AlertDescription></Alert>}

        <TableWrap>
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
              <tr>
                {/* Select-all checkbox */}
                <th className="w-9 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allPageChecked}
                    ref={el => { if (el) el.indeterminate = somePageChecked && !allPageChecked; }}
                    onChange={togglePage}
                    disabled={audienceLoading || audience.length === 0}
                    className="w-3.5 h-3.5 rounded accent-[#25D366] cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th className="hidden md:table-cell">Email</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {audienceLoading ? (
                <tr><td colSpan={4} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : audience.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-xs text-muted-foreground">No contacts found.</td></tr>
              ) : (
                audience.map((user) => {
                  const isChecked = checked.has(user.phone_number);
                  return (
                    <tr
                      key={user.user_id}
                      onClick={() => toggleOne(user.phone_number)}
                      className={`cursor-pointer transition-colors ${isChecked ? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                    >
                      <td className="w-9 px-3 py-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(user.phone_number)}
                          onClick={e => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded accent-[#25D366] cursor-pointer"
                        />
                      </td>
                      <Td className={isChecked ? "font-medium" : ""}>{user.name || "—"}</Td>
                      <Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{user.phone_number}</Td>
                      <Td className="hidden md:table-cell text-muted-foreground">{user.email || "—"}</Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableWrap>

        <Pagination
          page={audiencePage} total={audienceTotal} pageSize={audiencePageSize}
          hasNext={audienceHasNext} hasPrevious={audienceHasPrevious}
          loading={audienceLoading} count={audience.length}
          onPrev={() => loadAudience(audiencePage - 1)} onNext={() => loadAudience(audiencePage + 1)}
        />
      </div>
    </div>
  );
}

// ─── By Category Tab ──────────────────────────────────────────────────────────

type Category = "active subscribers" | "expiring soon" | "inactive paid users";

function ByCategoryTab({ waAccountId }: { waAccountId: string }) {
  const { getUsers, sendByCategory, isLoading } = useWhatsAppCloud();
  const [category, setCategory] = useState<Category>("active subscribers");
  const [days, setDays] = useState(15);
  const [tenantId, setTenantId] = useState("");
  const [text, setText] = useState("");
  const [delayMs, setDelayMs] = useState(80);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [users, setUsers] = useState<WAUser[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WASendBulkResult | null>(null);

  const load = async (pageNum: number = 1) => {
    setError(null);
    try {
      const params = { type: "by_category" as const, category, days: category === "inactive paid users" ? days : undefined, page: pageNum, page_size: pageSize, tenant_id: tenantId || undefined };
      const res = await getUsers(params as Parameters<typeof getUsers>[0], waAccountId || undefined);
      setUsers(res.users); setCount(res.count); setPage(pageNum);
      if (res.total !== undefined) { setTotalCount(res.total); setHasNext(res.has_next || false); setHasPrevious(res.has_previous || false); }
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
  };

  const send = async () => {
    setError(null); setResult(null);
    try { const data = await sendByCategory({ category, text, days, delay_ms: delayMs }, waAccountId || undefined); setResult(data); }
    catch (e) { setError(e instanceof Error ? e.message : "Send failed"); }
  };

  useEffect(() => { setPage(1); setTotalCount(null); setUsers([]); }, [category, days, tenantId]);

  return (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Segment</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active subscribers">Active subscribers</SelectItem>
              <SelectItem value="expiring soon">Expiring soon</SelectItem>
              <SelectItem value="inactive paid users">Inactive paid users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {category === "inactive paid users" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Inactivity (days)</Label>
            <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-24 h-9 text-sm border-border" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Tenant ID</Label>
          <Input type="text" placeholder="UUID (optional)" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="h-9 text-sm border-border" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Per Page</Label>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => load(1)} disabled={isLoading} variant="outline" className="gap-2 h-9">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Load Segment
        </Button>
        {totalCount !== null && <span className="text-xs text-muted-foreground">{totalCount} contact{totalCount !== 1 ? "s" : ""}</span>}
      </div>

      {users.length > 0 && (
        <>
          <TableWrap>
            <table className="w-full table-fixed">
              <TableHead>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th className="hidden lg:table-cell">Tags</Th>
              </TableHead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Td className="max-w-[120px] truncate">{u.name || "—"}</Td>
                    <Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{u.phone_number}</Td>
                    <Td>
                      <Badge variant="secondary" className={`text-[11px] px-1.5 py-0 ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">{u.tags?.map((t, i) => <Badge key={i} variant="outline" className="text-[11px] px-1.5 py-0">{t}</Badge>)}</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={page} total={totalCount} pageSize={pageSize} hasNext={hasNext} hasPrevious={hasPrevious} loading={isLoading} count={count} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
        </>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
          </div>
          <Textarea placeholder="Your message to this segment…" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm resize-none border-border" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Delay (ms)</Label>
          <Input type="number" min={0} max={2000} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="w-20 h-9 text-sm border-border" />
          <span className="text-[11px] text-muted-foreground">Default 80 · max 2000</span>
        </div>
        <BulkResultBanner result={result} />
        <Button onClick={send} disabled={isLoading || users.length === 0 || !text.trim()} className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
          Send to {users.length} Recipients
        </Button>
      </div>
    </div>
  );
}

// ─── By User IDs Tab ──────────────────────────────────────────────────────────

function ByUserIdsTab({ waAccountId }: { waAccountId: string }) {
  const { getUsers, sendByUserIds, isLoading } = useWhatsAppCloud();
  const [mode, setMode] = useState<"user_ids" | "phone_numbers">("phone_numbers");
  const [ids, setIds] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [users, setUsers] = useState<WAUser[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WASendBulkResult | null>(null);

  const load = async (pageNum: number = 1) => {
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = { type: "by_user_ids" as const, page: pageNum, page_size: pageSize };
      if (ids.trim()) params.user_ids = ids;
      if (tenantId.trim()) params.tenant_id = tenantId;
      const res = await getUsers(params as Parameters<typeof getUsers>[0], waAccountId || undefined);
      setUsers(res.users); setCount(res.count); setPage(pageNum);
      if (res.total !== undefined) { setTotalCount(res.total); setHasNext(res.has_next || false); setHasPrevious(res.has_previous || false); }
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
  };

  const send = async () => {
    setError(null); setResult(null);
    try {
      const list = ids.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const payload = mode === "user_ids" ? { text, user_ids: list } : { text, phone_numbers: list };
      const data = await sendByUserIds(payload, waAccountId || undefined);
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Send failed"); }
  };

  useEffect(() => { setPage(1); setTotalCount(null); setUsers([]); }, [ids, mode, tenantId]);

  return (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Input Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "user_ids" | "phone_numbers")}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="phone_numbers">Phone numbers</SelectItem>
              <SelectItem value="user_ids">Contact UUIDs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Tenant ID</Label>
          <Input type="text" placeholder="UUID (optional)" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="h-9 text-sm border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Per Page</Label>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {mode === "phone_numbers" ? "Phone Numbers" : "Contact UUIDs"}
          </Label>
          {ids.split(/[\n,]+/).filter(s => s.trim()).length > 0 && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300">
              {ids.split(/[\n,]+/).filter(s => s.trim()).length} items
            </Badge>
          )}
        </div>
        <Textarea
          placeholder={mode === "phone_numbers" ? "+255712345678\n+255799000111" : "uuid-1\nuuid-2"}
          value={ids} onChange={(e) => setIds(e.target.value)} rows={4}
          className="font-mono text-xs resize-none border-border bg-gray-50 dark:bg-gray-900"
        />
        <p className="text-[11px] text-muted-foreground">One per line or comma-separated</p>
      </div>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => load(1)} disabled={isLoading} variant="outline" className="gap-2 h-9">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Load Contacts
        </Button>
        {totalCount !== null && <span className="text-xs text-muted-foreground">{totalCount} contact{totalCount !== 1 ? "s" : ""} found</span>}
      </div>

      {users.length > 0 && (
        <>
          <TableWrap>
            <table className="w-full table-fixed">
              <TableHead>
                {mode === "phone_numbers" ? <><Th>Phone</Th><Th className="hidden sm:table-cell">Name</Th></> : <><Th>Name</Th><Th className="hidden sm:table-cell">Phone</Th></>}
                <Th>Status</Th>
                <Th className="hidden lg:table-cell">Tags</Th>
              </TableHead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {mode === "phone_numbers" ? (
                      <><Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{u.phone_number}</Td><Td className="hidden sm:table-cell truncate max-w-[120px]">{u.name || "—"}</Td></>
                    ) : (
                      <><Td className="truncate max-w-[120px]">{u.name || "—"}</Td><Td className="font-mono text-[11px] hidden sm:table-cell">{u.phone_number}</Td></>
                    )}
                    <Td>
                      <Badge variant="secondary" className={`text-[11px] px-1.5 py-0 ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">{u.tags?.map((t, i) => <Badge key={i} variant="outline" className="text-[11px] px-1.5 py-0">{t}</Badge>)}</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={page} total={totalCount} pageSize={pageSize} hasNext={hasNext} hasPrevious={hasPrevious} loading={isLoading} count={count} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
        </>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
          </div>
          <Textarea placeholder="Your message…" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm resize-none border-border" />
        </div>
        <BulkResultBanner result={result} />
        <Button onClick={send} disabled={isLoading || !ids.trim() || !text.trim()} className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
          Send to {ids.split(/[\n,]+/).filter(s => s.trim()).length || 0} Recipients
        </Button>
      </div>
    </div>
  );
}

// ─── By Date Range Tab ────────────────────────────────────────────────────────

function ByDateRangeTab({ waAccountId }: { waAccountId: string }) {
  const { getUsers, sendByDateRange, isLoading } = useWhatsAppCloud();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [text, setText] = useState("");
  const [delayMs, setDelayMs] = useState(80);
  const [sendMode, setSendMode] = useState<"selected" | "page" | "all">("page");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [users, setUsers] = useState<WAUser[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WASendBulkResult | null>(null);

  const load = async (pageNum: number = 1) => {
    setError(null);
    if (!startDate && !endDate) { setError("Provide at least one date."); return; }
    try {
      const params: Record<string, string | number | undefined> = { type: "by_date_range", page: pageNum, page_size: pageSize };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (tenantId) params.tenant_id = tenantId;
      const res = await getUsers(params as Parameters<typeof getUsers>[0], waAccountId || undefined);
      setUsers(res.users); setCount(res.count); setPage(pageNum);
      if (res.total !== undefined) { setTotalCount(res.total); setHasNext(res.has_next || false); setHasPrevious(res.has_previous || false); }
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
  };

  useEffect(() => { setPage(1); setTotalCount(null); setUsers([]); setChecked(new Set()); }, [startDate, endDate, tenantId]);

  const pagePhones = users.map(u => u.phone_number);
  const allPageChecked = pagePhones.length > 0 && pagePhones.every(p => checked.has(p));
  const somePageChecked = pagePhones.some(p => checked.has(p));

  const toggleOne = (phone: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
    if (sendMode !== "selected") setSendMode("selected");
  };

  const togglePage = () => {
    setChecked(prev => {
      const next = new Set(prev);
      if (allPageChecked) { pagePhones.forEach(p => next.delete(p)); }
      else { pagePhones.forEach(p => next.add(p)); }
      return next;
    });
    if (sendMode !== "selected") setSendMode("selected");
  };

  const clearChecked = () => { setChecked(new Set()); setSendMode("page"); };

  const sendCount = sendMode === "selected" ? checked.size : sendMode === "page" ? users.length : (totalCount ?? 0);

  return (
    <div className="space-y-4 p-1">
      <div>
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Registration Date Range</Label>
        <p className="text-[11px] text-muted-foreground mt-0.5">Filter contacts by when they were added (created_at).</p>
      </div>

      {/* Filters + Load Contacts in one row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide opacity-0 select-none">Action</Label>
          <div className="flex items-center gap-2">
            <Button onClick={() => load(1)} disabled={isLoading || (!startDate && !endDate)} variant="outline" className="gap-2 h-9 w-full sm:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Load
            </Button>
            {totalCount !== null && <span className="text-[11px] text-muted-foreground whitespace-nowrap">{totalCount} found</span>}
          </div>
        </div>
        <div className="space-y-1.5 hidden lg:block">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Per Page</Label>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      {/* Contact table with checkboxes */}
      {users.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Contacts</Label>
              {checked.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25D366] bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-full px-2 py-0.5">
                    {checked.size} selected
                  </span>
                  <button onClick={clearChecked} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 lg:hidden">
              <span className="text-[11px] text-muted-foreground">Per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-6 w-14 text-[11px] border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TableWrap>
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
                <tr>
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allPageChecked}
                      ref={el => { if (el) el.indeterminate = somePageChecked && !allPageChecked; }}
                      onChange={togglePage}
                      className="w-3.5 h-3.5 rounded accent-[#25D366] cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isChecked = checked.has(u.phone_number);
                  return (
                    <tr
                      key={u.user_id}
                      onClick={() => toggleOne(u.phone_number)}
                      className={`cursor-pointer transition-colors ${isChecked ? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                    >
                      <td className="w-9 px-3 py-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(u.phone_number)}
                          onClick={e => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded accent-[#25D366] cursor-pointer"
                        />
                      </td>
                      <Td className={`truncate max-w-[90px] sm:max-w-[150px] ${isChecked ? "font-medium" : ""}`}>{u.name || "—"}</Td>
                      <Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{u.phone_number}</Td>
                      <Td>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>

          <Pagination page={page} total={totalCount} pageSize={pageSize} hasNext={hasNext} hasPrevious={hasPrevious} loading={isLoading} count={count} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
        </div>
      )}

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message</Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
        </div>
        <Textarea placeholder="Your message to contacts in this date range…" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm resize-none border-border" />
      </div>

      {/* Delay + Send mode */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Delay (ms)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={2000} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="w-20 h-9 text-sm border-border" />
            <span className="text-[11px] text-muted-foreground">Default 80</span>
          </div>
        </div>
        {users.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Send To</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="sendModeDate" value="selected" checked={sendMode === "selected"} onChange={() => setSendMode("selected")} className="w-3.5 h-3.5 accent-[#25D366]" />
                <span>Selected</span>
                {checked.size > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#25D366] text-white text-[10px] font-bold leading-none">
                    {checked.size}
                  </span>
                )}
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="sendModeDate" value="page" checked={sendMode === "page"} onChange={() => setSendMode("page")} className="w-3.5 h-3.5 accent-[#25D366]" />
                Page ({users.length})
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="sendModeDate" value="all" checked={sendMode === "all"} onChange={() => setSendMode("all")} className="w-3.5 h-3.5 accent-[#25D366]" />
                All ({totalCount ?? 0})
              </label>
            </div>
          </div>
        )}
      </div>

      <BulkResultBanner result={result} />

      <Button
        onClick={async () => {
          setError(null); setResult(null);
          if (!startDate && !endDate) { setError("Provide at least one date."); return; }
          if (sendMode === "selected" && checked.size === 0) { setError("No contacts selected."); return; }
          try {
            const data = await sendByDateRange({
              start_date: startDate || undefined,
              end_date: endDate || undefined,
              text,
              delay_ms: delayMs,
              ...(sendMode === "selected" ? { phone_numbers: [...checked] } : {}),
            }, waAccountId || undefined);
            setResult(data);
          } catch (e) { setError(e instanceof Error ? e.message : "Send failed"); }
        }}
        disabled={isLoading || sendCount === 0 || !text.trim() || (!startDate && !endDate)}
        className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send to {sendCount} {sendCount === 1 ? "contact" : "contacts"}
      </Button>
    </div>
  );
}

// ─── Audience Inspector ───────────────────────────────────────────────────────

function AudienceTab({ waAccountId }: { waAccountId: string }) {
  const { getUsers, isLoading } = useWhatsAppCloud();
  const [queryType, setQueryType] = useState<"all" | "by_category" | "by_user_ids" | "by_date_range">("all");
  const [category, setCategory] = useState("active subscribers");
  const [userIds, setUserIds] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(15);
  const [tenantId, setTenantId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [users, setUsers] = useState<WAUser[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (pageNum: number = 1) => {
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = { type: queryType, page: pageNum, page_size: pageSize };
      if (queryType === "by_category") { params.category = category; if (category === "inactive paid users") params.days = days; }
      if (queryType === "by_user_ids") params.user_ids = userIds;
      if (queryType === "by_date_range") { params.start_date = startDate; params.end_date = endDate; }
      if (tenantId.trim()) params.tenant_id = tenantId;
      const res = await getUsers(params as Parameters<typeof getUsers>[0], waAccountId || undefined);
      setUsers(res.users); setCount(res.count); setPage(pageNum);
      if (res.total !== undefined) { setTotalCount(res.total); setHasNext(res.has_next || false); setHasPrevious(res.has_previous || false); }
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
  };

  useEffect(() => { setPage(1); setTotalCount(null); setUsers([]); }, [queryType, category, userIds, startDate, endDate, days, tenantId]);

  return (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Filter</Label>
          <Select value={queryType} onValueChange={(v) => setQueryType(v as typeof queryType)}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contacts</SelectItem>
              <SelectItem value="by_category">By segment</SelectItem>
              <SelectItem value="by_user_ids">By contact UUIDs</SelectItem>
              <SelectItem value="by_date_range">By date range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {queryType === "by_category" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Segment</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active subscribers">Active subscribers</SelectItem>
                <SelectItem value="expiring soon">Expiring soon</SelectItem>
                <SelectItem value="inactive paid users">Inactive paid users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Per Page</Label>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {queryType === "by_category" && category === "inactive paid users" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Inactivity (days)</Label>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-20 h-9 text-sm border-border" />
        </div>
      )}

      {queryType === "by_user_ids" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Contact UUIDs</Label>
          <Input placeholder="uuid-1, uuid-2, uuid-3" value={userIds} onChange={(e) => setUserIds(e.target.value)} className="h-9 text-sm border-border" />
          <p className="text-[11px] text-muted-foreground">Comma-separated</p>
        </div>
      )}

      {queryType === "by_date_range" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">From</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">To</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm border-border" />
          </div>
        </div>
      )}

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => load(1)} disabled={isLoading} variant="outline" className="gap-2 h-9">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Load Audience
        </Button>
        {totalCount !== null && <span className="text-xs text-muted-foreground">{totalCount} contact{totalCount !== 1 ? "s" : ""}</span>}
      </div>

      {users.length > 0 && (
        <>
          <TableWrap>
            <table className="w-full table-fixed">
              <TableHead>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th className="hidden lg:table-cell">Tags</Th>
              </TableHead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Td className="truncate max-w-[120px]">{u.name || "—"}</Td>
                    <Td className="font-mono text-[10px] sm:text-[11px] max-w-[110px] truncate">{u.phone_number}</Td>
                    <Td>
                      <Badge variant="secondary" className={`text-[11px] px-1.5 py-0 ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">{u.tags.map((t, i) => <Badge key={i} variant="outline" className="text-[11px] px-1.5 py-0">{t}</Badge>)}</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={page} total={totalCount} pageSize={pageSize} hasNext={hasNext} hasPrevious={hasPrevious} loading={isLoading} count={count} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab({ waAccountId }: { waAccountId: string }) {
  // Two distinct template worlds live under this tab:
  //   • "approved" — Meta-APPROVED templates synced live from the WhatsApp
  //     Business API, sent via the Cloud API with resolved {{1}},{{2}} params.
  //   • "local" — messaging.Template rows authored here, rendered to plain text.
  const [templateMode, setTemplateMode] = useState<"approved" | "local">("approved");

  // Local WhatsApp templates (messaging.Template, channel=whatsapp).
  // The send pipeline renders these into plain WhatsApp text under the hood.
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTpl, setEditTpl] = useState<LocalTemplate | null>(null);
  const [sendTpl, setSendTpl] = useState<LocalTemplate | null>(null);
  const [deleteTpl, setDeleteTpl] = useState<LocalTemplate | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTemplates({
        channel: "whatsapp",
        language: languageFilter !== "all" ? languageFilter : undefined,
        search: search.trim() || undefined,
        page_size: 100,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || res.message || "Failed to load templates");
      }
      setTemplates(res.data.results?.templates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [languageFilter]);

  return (
    <div className="space-y-4 p-1">
      {/* Sub-mode toggle: Meta-approved sender vs local template manager */}
      <div
        role="tablist"
        aria-label="Template mode"
        className="grid grid-cols-2 gap-1 p-1 bg-foreground/[0.06] dark:bg-foreground/[0.08] rounded-xl"
      >
        {[
          { key: "approved" as const, label: "Approved (Meta)" },
          { key: "local" as const, label: "Local" },
        ].map(({ key, label }) => {
          const active = templateMode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTemplateMode(key)}
              className={[
                "h-9 rounded-lg text-[12.5px] font-bold tracking-tight transition-all duration-200",
                active
                  ? "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                  : "text-foreground/70 active:bg-foreground/[0.04]",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {templateMode === "approved" ? (
        <MetaTemplateMessenger waAccountId={waAccountId} />
      ) : (
        <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">WhatsApp Templates</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Author locally with <code className="text-[10px] bg-muted px-1 rounded">{"{{name}}"}</code>-style placeholders.
            Sent as a plain WhatsApp text — no Meta approval needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/whatsapp/templates/new")}
            variant="outline"
            className="h-9 gap-1.5"
            title="Author and submit a Meta-approved template"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            Submit to Meta
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            New template
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Search</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="name, body text, category…"
            className="h-9 text-sm w-56 border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Language</Label>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="h-9 text-sm w-28 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="sw">Kiswahili</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="gap-2 h-9">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reload
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {templates.length > 0 && (
        <TableWrap>
          <table className="w-full table-fixed">
            <TableHead>
              <Th>Name</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th className="hidden sm:table-cell">Language</Th>
              <Th className="hidden lg:table-cell">Used</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <tbody className="divide-y divide-border">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Td className="font-medium">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      {t.preview_text && (
                        <span className="text-[11px] text-muted-foreground truncate">{t.preview_text}</span>
                      )}
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell text-muted-foreground">{t.category || "—"}</Td>
                  <Td className="hidden sm:table-cell text-muted-foreground uppercase">{t.language || "—"}</Td>
                  <Td className="hidden lg:table-cell text-muted-foreground tabular-nums">{t.usage_count ?? 0}</Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setSendTpl(t)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setEditTpl(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                        onClick={() => setDeleteTpl(t)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {!loading && templates.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No templates yet.</p>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[12px]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create your first template
          </Button>
        </div>
      )}

      {/* Browse Meta-approved templates — each one can be imported as a local template */}
      <MetaTemplateBrowser
        waAccountId={waAccountId}
        onUse={() => {
          // Reload the local templates table once the import succeeds.
          void load();
        }}
      />

      <CreateTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
      <EditTemplateDialog
        template={editTpl}
        onOpenChange={(o) => !o && setEditTpl(null)}
        onEdited={load}
      />
      <DeleteTemplateDialog
        template={deleteTpl}
        onOpenChange={(o) => !o && setDeleteTpl(null)}
        onDeleted={load}
      />
      <SendFromTemplateDialog
        template={sendTpl}
        onOpenChange={(o) => !o && setSendTpl(null)}
        waAccountId={waAccountId || undefined}
      />
        </div>
      )}
    </div>
  );
}

// ─── Meta-side template browser (collapsed by default) ────────────────────────
// Lets advanced users see what's pre-approved on their WABA so they can copy
// body text into a local template.

// Meta uses positional {{1}}, {{2}} placeholders; the local template API only
// accepts named ones. Convert positional → {{var1}}, {{var2}} so an imported
// body validates server-side.
const convertMetaBodyToLocal = (body: string): string =>
  body.replace(/{{\s*(\d+)\s*}}/g, "{{var$1}}");

interface MetaTemplateBrowserProps {
  waAccountId: string;
  /** Custom header label — defaults to the advanced collapsed view */
  headerLabel?: string;
  /** Open by default (e.g. when used in send mode) */
  defaultOpen?: boolean;
  /** If provided, each row shows a "Use" button that calls this after import. */
  onUse?: (localTemplate: LocalTemplate) => void;
}

function MetaTemplateBrowser({
  waAccountId,
  headerLabel = "Browse Meta-approved templates (advanced)",
  defaultOpen = false,
  onUse,
}: MetaTemplateBrowserProps) {
  const { getMessageTemplates, isLoading } = useWhatsAppCloud();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [items, setItems] = useState<WAMessageTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("APPROVED");
  const [error, setError] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const load = async () => {
    setError(null);
    try {
      const res = await getMessageTemplates(waAccountId || undefined, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 25,
      });
      setItems(res.data?.graph?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Meta templates");
    }
  };

  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const importAndUse = async (t: WAMessageTemplate) => {
    if (!onUse) return;
    const body =
      (t.components?.find((c) => c.type === "BODY") as { text?: string } | undefined)?.text ?? "";
    if (!body) {
      toast({ title: "No body text", description: "This Meta template has no BODY block to import.", variant: "destructive" });
      return;
    }
    setUsingId(t.id);
    try {
      const res = await apiClient.createTemplate({
        name: t.name,
        channel: "whatsapp",
        language: (t.language as "en" | "sw") || "en",
        category: (t.category as string)?.toLowerCase() || "general",
        body_text: convertMetaBodyToLocal(body),
        description: `Imported from Meta template "${t.name}" (${t.language || "—"})`,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || res.message || "Failed to import template");
      }
      toast({ title: "Template imported", description: res.data.name });
      onUse(res.data);
    } catch (e) {
      // Server may reject duplicate names — surface the message so the user can rename
      toast({
        title: "Couldn't import",
        description: e instanceof Error ? e.message : "Import failed",
        variant: "destructive",
      });
    } finally {
      setUsingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 dark:bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold"
      >
        <span className="flex items-center gap-1.5 text-foreground/80">
          <FileText className="w-3.5 h-3.5" />
          {headerLabel}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/40">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-[12px] w-36 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={load} disabled={isLoading} variant="outline" size="sm" className="h-8 text-[12px]">
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Reload
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {items.length > 0 ? (
            <div className="space-y-1.5">
              {items.map((t) => (
                <div
                  key={`${t.id}-${t.language}`}
                  className="rounded-lg border border-border/60 bg-card p-2.5 text-[12px] flex items-center justify-between gap-2 flex-wrap"
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="font-mono font-semibold truncate">{t.name}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">{t.language || "—"}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{t.category || "—"}</Badge>
                  </div>
                  {onUse && t.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={usingId === t.id}
                      onClick={() => importAndUse(t)}
                    >
                      {usingId === t.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Importing…
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1" />
                          Use template
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                No Meta-side templates returned for the selected status.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Poll Results Tab ────────────────────────────────────────────────────────

function PollResultsTab() {
  const { getPollResults, getPollResultsByName, listPolls, deletePoll, isLoading } =
    useWhatsAppCloud();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Show-all mode by default — most RSVP lists fit in one page (cap 50k).
  // Toggle off to fall back to paginated mode with `pageSize` rows per page.
  const [showAll, setShowAll] = useState(true);
  const [pageSize] = useState(10000);
  const [optionFilter, setOptionFilter] = useState("");
  const [data, setData] = useState<WAPollResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ── Your polls list ────────────────────────────────────────────────────────
  const [polls, setPolls] = useState<WAPollListItem[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);
  // The poll the user has selected (drives the row-level highlight + spinner).
  const [activePollId, setActivePollId] = useState<string | null>(null);
  // True only while the *currently selected* poll's results are in flight — keeps
  // the row spinner independent of the shared `isLoading` (which also reacts to
  // list refresh, deletes, etc.).
  const [selectedLoading, setSelectedLoading] = useState(false);
  // Race guard: a fast double-click can fire two requests; only the most recent
  // one wins, so stale responses (older `reqId`) are dropped.
  const reqIdRef = useRef(0);

  const refreshPolls = async () => {
    setPollsLoading(true);
    setPollsError(null);
    try {
      const res = await listPolls({ page_size: 50 });
      setPolls(res.results ?? []);
    } catch (e) {
      setPollsError(e instanceof Error ? e.message : "Failed to load polls");
      setPolls([]);
    } finally {
      setPollsLoading(false);
    }
  };

  useEffect(() => {
    void refreshPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUuid = (s: string) => UUID_RE.test(s.trim());

  const load = async (
    targetPage = 1,
    opts?: { forcePaged?: boolean; queryOverride?: string },
  ) => {
    // queryOverride lets selectPoll skip the React state-commit lag so we don't
    // need a setTimeout(0) trick to read the new title back from state.
    const q = (opts?.queryOverride ?? query).trim();
    if (!q) {
      setError("Enter a poll name or ID first.");
      return;
    }
    setError(null);
    const reqId = ++reqIdRef.current;
    setSelectedLoading(true);
    try {
      // forcePaged is set by the truncation banner's "Load page N" action so
      // we don't ask for ?all=1 again when we already know it would truncate.
      const useAll = showAll && !opts?.forcePaged;
      const params = useAll
        ? { all: true, option: optionFilter || undefined }
        : { page: targetPage, page_size: pageSize, option: optionFilter || undefined };
      const res = isUuid(q)
        ? await getPollResults(q, params)
        : await getPollResultsByName(q, params);
      // Drop stale responses — a newer poll click already superseded this one.
      if (reqId !== reqIdRef.current) return;
      setData(res);
      setPage(useAll ? 1 : targetPage);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load results");
      setData(null);
    } finally {
      if (reqId === reqIdRef.current) setSelectedLoading(false);
    }
  };

  // Click handler used by the "Your polls" rows. Renders the selected poll's
  // metadata instantly from the list item (so the user sees the title/question
  // flip with no perceived lag) while the results request runs in the background.
  const selectPoll = (p: WAPollListItem) => {
    setActivePollId(p.id);
    setQuery(p.title);
    setError(null);
    setPage(1);
    setData({
      success: true,
      poll: {
        id: p.id,
        title: p.title,
        question: p.question,
        options: p.options,
        is_active: p.is_active,
        created_at: p.created_at,
      },
      summary: { total: 0, counts: {} },
      responses: { page: 1, page_size: 0, total: 0, has_next: false, items: [] },
    });
    void load(1, { queryOverride: p.title });
  };

  const responses = data?.responses;
  const isAllMode = responses?.all_mode ?? false;
  const isTruncated = responses?.truncated ?? false;
  const hasNext = responses?.has_next ?? false;
  const hasPrev = !isAllMode && page > 1;

  return (
    <div className="space-y-4 p-1">
      {/* Create poll banner */}
      <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/[0.04] dark:bg-primary/10 px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-foreground leading-tight">Need a new RSVP poll?</p>
          <p className="text-[11px] text-foreground/60 leading-snug mt-0.5">Create one with up to 3 reply buttons in seconds.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="h-9 px-3 rounded-lg text-[12px] font-semibold gap-1.5 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          Create poll
        </Button>
      </div>

      <CreatePollDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(poll) => {
          setQuery(poll.title);
          void refreshPolls();
        }}
      />

      {/* Your polls — click to load results without typing the name. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Your polls
          </Label>
          <button
            type="button"
            onClick={refreshPolls}
            disabled={pollsLoading}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
          >
            {pollsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Refresh
          </button>
        </div>

        {pollsError ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">{pollsError}</AlertDescription>
          </Alert>
        ) : pollsLoading && polls.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 px-3 py-4 text-center text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 mx-auto animate-spin mb-1" />
            Loading your polls…
          </div>
        ) : polls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
            No polls yet — tap <span className="font-semibold text-primary">Create poll</span> above to make one.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-72 overflow-y-auto">
            {polls.map((p) => {
              const selected = activePollId === p.id;
              const loadingHere = selected && selectedLoading;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                    selected ? "bg-primary/[0.06] dark:bg-primary/15" : "hover:bg-muted/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectPoll(p)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {p.title}
                      </span>
                      <Badge
                        variant={p.is_active ? "default" : "secondary"}
                        className="text-[9.5px] py-0 flex-shrink-0"
                      >
                        {p.is_active ? "Active" : "Closed"}
                      </Badge>
                      {loadingHere && (
                        <Loader2
                          className="w-3 h-3 animate-spin text-primary flex-shrink-0 ml-auto"
                          aria-label="Loading results"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {p.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.options.slice(0, 3).map((o) => (
                        <span
                          key={o}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground/70"
                        >
                          {o}
                        </span>
                      ))}
                      {typeof p.response_count === "number" && (
                        <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                          {p.response_count} responses
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Archive "${p.title}"?`)) return;
                      try {
                        await deletePoll(p.id);
                        await refreshPolls();
                      } catch {
                        // toast handled in hook
                      }
                    }}
                    aria-label={`Archive ${p.title}`}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lookup row */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Poll name or ID</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder='e.g. "Mwaliko wa Harusi" or paste UUID'
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              // Typing diverges from the selected poll row — drop the highlight.
              if (activePollId) setActivePollId(null);
            }}
            onKeyDown={e => e.key === "Enter" && load(1)}
            className="flex-1 min-w-[260px] h-9 text-sm border-border"
          />
          <Input
            placeholder="Filter by option (optional)"
            value={optionFilter}
            onChange={e => setOptionFilter(e.target.value)}
            className="w-52 h-9 text-sm border-border"
          />
          <Button onClick={() => load(1)} disabled={isLoading || !query.trim()} className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Load results
          </Button>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-foreground/80 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Show all responses in one page (up to 50,000)
        </label>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* Poll metadata + counts */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{data.poll.title}</h3>
                  <Badge variant={data.poll.is_active ? "default" : "secondary"} className="text-[10px]">
                    {data.poll.is_active ? "Active" : "Closed"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{data.poll.question}</p>
              </div>

              {/* Vote bars */}
              <div className="space-y-2 pt-1">
                {data.poll.options.map(option => {
                  const count = data.summary.counts[option] ?? 0;
                  const pct = data.summary.total > 0 ? Math.round((count / data.summary.total) * 100) : 0;
                  return (
                    <div key={option} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{option}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#25D366] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                Total responses: <span className="font-semibold text-foreground">{data.summary.total}</span>
              </p>
            </CardContent>
          </Card>

          {/* Truncation banner — surfaces when ?all=1 hit the server cap. */}
          {isTruncated && (
            <Alert className="py-2 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs flex flex-wrap items-center gap-2">
                <span>
                  Showing the first{" "}
                  <span className="font-semibold tabular-nums">
                    {(responses?.max_items ?? responses?.items.length ?? 0).toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold tabular-nums">
                    {responses?.total.toLocaleString()}
                  </span>{" "}
                  responses. Switch to paged mode to view the rest.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAll(false);
                    void load(2, { forcePaged: true });
                  }}
                  className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                >
                  Load page 2 →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Response list */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Individual responses</Label>
            <TableWrap>
              <table className="w-full table-fixed">
                <TableHead>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th className="hidden sm:table-cell">Tags</Th>
                  <Th>Option</Th>
                  <Th className="hidden md:table-cell">When</Th>
                </TableHead>
                <tbody className="divide-y divide-border">
                  {data.responses.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                        No responses yet.
                      </td>
                    </tr>
                  ) : (
                    data.responses.items.map((r, i) => (
                      <tr key={`${r.phone}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Td className="text-[11px]">
                          {r.name ? (
                            <span className="font-medium text-foreground">{r.name}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic">—</span>
                          )}
                        </Td>
                        <Td className="font-mono text-[11px]">{r.phone}</Td>
                        <Td className="hidden sm:table-cell">
                          {r.tags && r.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">{tag}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px]">—</span>
                          )}
                        </Td>
                        <Td><Badge variant="outline" className="text-[10px]">{r.option}</Badge></Td>
                        <Td className="hidden md:table-cell text-muted-foreground text-[11px]">
                          {new Date(r.at).toLocaleString()}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>

            {/* In all-mode the table already shows every row (or up to the cap, in which
                case the truncation banner above handles the "load page 2" hand-off), so
                the pager only renders when the request was paginated. */}
            {!isAllMode && (
              <Pagination
                page={page}
                total={data.responses.total}
                pageSize={pageSize}
                hasNext={hasNext}
                hasPrevious={hasPrev}
                loading={isLoading}
                count={data.responses.items.length}
                onPrev={() => load(page - 1, { forcePaged: true })}
                onNext={() => load(page + 1, { forcePaged: true })}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Bulk Image Send Tab ──────────────────────────────────────────────────────
// Upload N invitation images, match each by phone (preferred) or normalized name,
// then send via WhatsApp Cloud API.

interface BulkImageRow {
  id: string;
  phone: string;
  name: string;
}

function BulkImageSendTab({
  waAccountId,
  prefill = null,
  onPrefillConsumed,
}: {
  waAccountId: string;
  prefill?: { templateName: string } | null;
  onPrefillConsumed?: () => void;
}) {
  const { createJob, getJob, listJobs, isLoading } = useWhatsAppBulkImageSend();
  // Load the user's address book on mount so we can auto-resolve each uploaded
  // image's filename to a contact (phone first, normalized name fallback —
  // mirroring the backend's matching rules).
  const { contacts: addressBook, isLoading: contactsLoading, fetchContacts } = useContacts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  // Contacts the user explicitly unchecked from the auto-match set — we keep
  // them suppressed so a stray double-tick doesn't override the user's intent
  // when files re-render. (User can re-add manually via the row inputs.)
  const [suppressedIds, setSuppressedIds] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<BulkImageRow[]>([
    { id: crypto.randomUUID(), phone: "", name: "" },
  ]);
  const [bulkText, setBulkText] = useState("");
  const [caption, setCaption] = useState("Karibu {name}!");
  const [wait, setWait] = useState(true);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [job, setJob] = useState<WABulkImageJobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // ── Send mode: plain image + caption, or an approved template (image header) ──
  const { getMessageTemplates } = useWhatsAppCloud();
  // Policy: WhatsApp proactive sends are template-only — plain image+caption is
  // disabled (WHATSAPP_REQUIRE_TEMPLATE), so default to (and stay on) template.
  const [sendMode, setSendMode] = useState<"image" | "template">("template");
  const [tplList, setTplList] = useState<WAMessageTemplate[]>([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const [tplName, setTplName] = useState<string>("");
  // Body-variable values for the chosen template, keyed by placeholder token.
  // Defaults to the {name} token so each recipient is personalized server-side.
  const [tplVars, setTplVars] = useState<Record<string, string>>({});

  // Arriving from the Text tab's "Upload one image per receiver" → start in
  // template mode with that template pre-selected, then clear the hand-off so a
  // later manual visit isn't forced back into template mode.
  useEffect(() => {
    if (!prefill?.templateName) return;
    setSendMode("template");
    setTplName(prefill.templateName);
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // Lazy-load approved templates the first time the user switches to template mode.
  useEffect(() => {
    if (sendMode !== "template" || tplList.length > 0 || tplLoading) return;
    let cancelled = false;
    void (async () => {
      setTplLoading(true);
      setTplError(null);
      try {
        const res = await getMessageTemplates(waAccountId || undefined, { limit: 100 });
        if (cancelled) return;
        // Only APPROVED templates with an IMAGE header work for personalized
        // image bulk send — the matched image is injected as that header.
        const imgTpls = (res?.data?.graph?.data ?? []).filter(
          (t) =>
            t.status === "APPROVED" &&
            (t.components ?? []).some((c) => c.type === "HEADER" && c.format === "IMAGE"),
        );
        setTplList(imgTpls);
      } catch (e) {
        if (!cancelled) setTplError(e instanceof Error ? e.message : "Failed to load templates");
      } finally {
        if (!cancelled) setTplLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMode]);

  // Placeholder tokens ({{1}}, {{name}}, …) of the selected template's BODY, in order.
  const selectedTpl = tplList.find((t) => t.name === tplName) || null;
  const bodyTokens: string[] = (() => {
    const body = (selectedTpl?.components ?? []).find((c) => c.type === "BODY");
    const text = body?.text ?? "";
    const re = /{{\s*([^}]+?)\s*}}/g;
    const seen = new Set<string>();
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[1].trim();
      if (tok && !seen.has(tok)) {
        seen.add(tok);
        out.push(tok);
      }
    }
    return out;
  })();

  // Build the base `components` (BODY only — the image header is injected by the
  // server per contact). Empty when the template has no body variables.
  const buildTemplateComponents = (): unknown[] => {
    if (bodyTokens.length === 0) return [];
    const parameters = bodyTokens.map((tok, i) => {
      const val = tplVars[tok] ?? (i === 0 ? "{name}" : "");
      const p: Record<string, string> = { type: "text", text: val };
      if (!/^\d+$/.test(tok)) p.parameter_name = tok;
      return p;
    });
    return [{ type: "body", parameters }];
  };

  useEffect(() => {
    // Big page so 5 000-name matching is fully client-side.
    void fetchContacts({ page: 1, page_size: 5000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Your jobs history ──────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<WABulkImageJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WABulkJobStatus | "all">("all");
  // Job currently open in the detail card (drives row highlight + spinner).
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobLoading, setActiveJobLoading] = useState(false);
  // Race guard for fast row clicks.
  const jobReqRef = useRef(0);

  const refreshJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const res = await listJobs({
        page_size: 50,
        job_status: statusFilter === "all" ? undefined : statusFilter,
      });
      setJobs(res.items ?? []);
    } catch (e) {
      setJobsError(e instanceof Error ? e.message : "Failed to load jobs");
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // Reload the history whenever the filter changes (or on mount).
  useEffect(() => {
    void refreshJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const selectJob = async (j: WABulkImageJob) => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setActiveJobId(j.job_id);
    setError(null);
    // Optimistic stub so the detail card flips instantly.
    setJob(j as WABulkImageJobDetail);
    setActiveJobLoading(true);
    const reqId = ++jobReqRef.current;
    try {
      const detail = await getJob(j.job_id, { include_errors: true });
      if (reqId !== jobReqRef.current) return;
      setJob(detail);
      // Re-arm polling if the historical job is still in flight.
      if (detail.job_status !== "completed" && detail.job_status !== "failed") {
        pollJob(detail.job_id);
      }
    } catch {
      // toast handled
    } finally {
      if (reqId === jobReqRef.current) setActiveJobLoading(false);
    }
  };

  // ── Filename → contact auto-matching ───────────────────────────────────────
  // Mirrors the backend's matching rules so the user can see WHO will receive
  // each uploaded image before sending. Normalization rules:
  //   - lowercase, whitespace → underscores, strip non `[a-z0-9_]`
  //   - collapse and trim underscores
  const normalizeName = (s: string): string =>
    s
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  const baseName = (filename: string): string => filename.replace(/\.[^.]+$/, "");

  // O(1) lookups: phone digits → contact id; normalized name → contact id.
  const contactIndex = (() => {
    const byPhone = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const c of addressBook) {
      const digits = c.phone_e164.replace(/\D/g, "");
      if (digits) byPhone.set(digits, c.id);
      const norm = normalizeName(c.name);
      if (norm && !byName.has(norm)) byName.set(norm, c.id);
    }
    return { byPhone, byName };
  })();

  const resolveFile = (
    f: File,
  ): { contactId: string | null; via: "phone" | "name" | null } => {
    const key = baseName(f.name);
    const digits = key.replace(/\D/g, "");
    const looksLikePhone =
      digits.length >= 9 && /^[+\d\s-]+$/.test(key);
    if (looksLikePhone) {
      const id = contactIndex.byPhone.get(digits);
      if (id) return { contactId: id, via: "phone" };
    }
    const id = contactIndex.byName.get(normalizeName(key));
    if (id) return { contactId: id, via: "name" };
    return { contactId: null, via: null };
  };

  // Walk the upload list once: collect matched contact ids (deduped, suppressed
  // ones dropped) plus the list of filenames that couldn't be paired.
  const fileMatches = (() => {
    const matchedIds = new Set<string>();
    const unmatched: string[] = [];
    const byContactFile = new Map<string, File>();
    let viaPhoneCount = 0;
    let viaNameCount = 0;
    for (const f of files) {
      const { contactId, via } = resolveFile(f);
      if (contactId && !suppressedIds.has(contactId)) {
        matchedIds.add(contactId);
        byContactFile.set(contactId, f);
        if (via === "phone") viaPhoneCount += 1;
        else if (via === "name") viaNameCount += 1;
      } else if (!contactId) {
        unmatched.push(f.name);
      }
    }
    return { matchedIds, unmatched, byContactFile, viaPhoneCount, viaNameCount };
  })();

  // Final recipient list = auto-matched contacts (uses backend `name+phone`)
  // ∪ manual rows ∪ paste-bulk lines. Deduped by digits-only phone.
  const contacts: WABulkContact[] = (() => {
    const digits = (p: string) => p.replace(/\D/g, "");
    const seen = new Set<string>();
    const out: WABulkContact[] = [];
    const push = (c: WABulkContact) => {
      const key = digits(c.phone);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(c);
    };
    for (const c of addressBook) {
      if (fileMatches.matchedIds.has(c.id) && c.phone_e164) {
        push({ phone: c.phone_e164, name: c.name });
      }
    }
    for (const r of rows) {
      const phone = r.phone.trim();
      if (phone) push({ phone, name: r.name.trim() });
    }
    for (const line of bulkText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/^([+\d][\d\s-]+)\s*[,;\t]?\s*(.*)$/);
      if (!m) continue;
      push({ phone: m[1].replace(/[\s-]/g, ""), name: (m[2] || "").trim() });
    }
    return out;
  })();

  const toggleSuppressContact = (id: string) =>
    setSuppressedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onPickFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((f) =>
      /\.(png|jpe?g)$/i.test(f.name),
    );
    setFiles((prev) => [...prev, ...accepted]);
  };

  const updateRow = (id: string, patch: Partial<BulkImageRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), phone: "", name: "" },
    ]);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit =
    files.length > 0 &&
    contacts.length > 0 &&
    !!waAccountId &&
    !isLoading &&
    (sendMode === "image" || !!selectedTpl);

  const reset = () => {
    setFiles([]);
    setRows([{ id: crypto.randomUUID(), phone: "", name: "" }]);
    setBulkText("");
    setJob(null);
    setError(null);
  };

  // Poll job status until terminal.
  const pollJob = (jobId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const detail = await getJob(jobId, { include_errors: true });
        setJob(detail);
        if (
          detail.job_status === "completed" ||
          detail.job_status === "failed"
        ) {
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // toast already shown
      }
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const submit = async () => {
    setError(null);
    setJob(null);
    setActiveJobId(null);
    try {
      const isTemplate = sendMode === "template";
      const res = await createJob({
        images: files,
        contacts,
        // Caption only applies to plain-image mode.
        caption: isTemplate ? undefined : caption.trim() || undefined,
        whatsapp_account_id: waAccountId || undefined,
        wait,
        idempotency_key: idempotencyKey.trim() || undefined,
        ...(isTemplate && selectedTpl
          ? {
              send_mode: "template" as const,
              template_name: selectedTpl.name,
              language_code: (selectedTpl.language as string) || "en",
              components: buildTemplateComponents(),
            }
          : {}),
      });
      setJob(res);
      setActiveJobId(res.job_id);
      // Surface the new job at the top of the history list.
      void refreshJobs();
      if (res.job_status !== "completed" && res.job_status !== "failed") {
        pollJob(res.job_id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start bulk send");
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    running: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-4 p-1">
      {/* Intro */}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-3.5 py-2.5">
        <p className="text-[12.5px] font-semibold text-foreground leading-tight">
          Personalized image send
        </p>
        <p className="text-[11px] text-foreground/65 leading-snug mt-0.5">
          Upload one image per contact. Files match by phone digits (e.g. <code className="font-mono">255712345678.png</code>) or normalized name (<code className="font-mono">john_magesa.jpg</code>). Caption supports{" "}
          <span className="font-mono">{"{name}"}</span>.
        </p>
      </div>

      {/* Your jobs — past bulk-image sends, click any row to load its detail. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Your jobs
          </Label>
          <button
            type="button"
            onClick={refreshJobs}
            disabled={jobsLoading}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
          >
            {jobsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "running", "completed", "failed"] as const).map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wide border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground/70 border-border hover:bg-muted/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {jobsError ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">{jobsError}</AlertDescription>
          </Alert>
        ) : jobsLoading && jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 px-3 py-4 text-center text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 mx-auto animate-spin mb-1" />
            Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
            No jobs in this filter yet. Run your first send below.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-72 overflow-y-auto">
            {jobs.map((j) => {
              const selected = activeJobId === j.job_id;
              const loadingHere = selected && activeJobLoading;
              return (
                <button
                  key={j.job_id}
                  type="button"
                  onClick={() => void selectJob(j)}
                  className={`w-full text-left flex flex-col gap-1 px-3 py-2 transition-colors ${
                    selected ? "bg-primary/[0.06] dark:bg-primary/15" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] uppercase font-semibold py-0 ${statusColor[j.job_status] ?? ""}`}
                    >
                      {j.job_status}
                    </Badge>
                    <span className="text-[11px] text-foreground/80 tabular-nums">
                      {j.sent}/{j.total_contacts} sent
                    </span>
                    {j.failed > 0 && (
                      <span className="text-[11px] text-destructive tabular-nums">
                        · {j.failed} failed
                      </span>
                    )}
                    {(j.error_row_count ?? 0) > 0 && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 tabular-nums">
                        · {j.error_row_count} issues
                      </span>
                    )}
                    {loadingHere && (
                      <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />
                    )}
                  </div>
                  {j.caption_preview && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {j.caption_preview}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                    <span>{new Date(j.created_at).toLocaleString()}</span>
                    {typeof j.image_count === "number" && (
                      <span>· {j.image_count} img</span>
                    )}
                    {j.idempotency_key && (
                      <span className="font-mono truncate" title={j.idempotency_key}>
                        · key: {j.idempotency_key.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Images
        </Label>
        <div
          className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPickFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="w-6 h-6 mx-auto text-muted-foreground" strokeWidth={1.8} />
          <p className="text-xs text-foreground mt-1.5 font-medium">
            Drop PNG / JPG files or click to choose
          </p>
          <p className="text-[10.5px] text-muted-foreground mt-0.5">
            Max 500 files · 8 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-2 space-y-1 max-h-40 overflow-y-auto">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate font-mono">{f.name}</span>
                <span className="text-muted-foreground tabular-nums flex-shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <p className="text-[10.5px] text-muted-foreground pt-1 border-t border-border/60 flex flex-wrap gap-x-2">
              <span>
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </span>
              <span className="tabular-nums">
                · total {(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB
              </span>
            </p>
          </div>
        )}

        {/* Pre-flight 413 warning — nginx defaults are typically 1 MB or 10 MB.
            Surface at 50 MB so the user can split the batch before they hit it. */}
        {files.length > 0 &&
          files.reduce((s, f) => s + f.size, 0) > 50 * 1024 * 1024 && (
            <Alert className="py-2 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs leading-snug">
                Heads-up: total upload is{" "}
                <span className="font-semibold tabular-nums">
                  {(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(0)} MB
                </span>
                . Some servers cap request bodies at 10–50 MB and will reject the
                batch with a 413 error. If that happens, split into smaller groups
                or compress the images first.
              </AlertDescription>
            </Alert>
          )}
      </div>

      {/* Auto-match summary — only rendered once at least one image is selected. */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Matched contacts
          </Label>
          {contactsLoading && addressBook.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/50 px-3 py-3 text-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 mx-auto animate-spin mb-1" />
              Loading your contacts so we can match them to your images…
            </div>
          ) : addressBook.length === 0 ? (
            <Alert className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                No saved contacts yet — files will be matched server-side by phone
                digits in the filename. Add contacts on the{" "}
                <Link to="/messaging/contacts" className="font-semibold text-primary hover:underline">
                  Contacts
                </Link>{" "}
                page so the caption's <span className="font-mono">{"{name}"}</span> can fill in.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Match counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Stat label="Images" value={files.length} />
                <Stat
                  label="Matched"
                  value={fileMatches.matchedIds.size}
                  tone={fileMatches.matchedIds.size > 0 ? "success" : undefined}
                />
                <Stat
                  label="Unmatched"
                  value={fileMatches.unmatched.length}
                  tone={fileMatches.unmatched.length > 0 ? "danger" : undefined}
                />
                <Stat label="By phone" value={fileMatches.viaPhoneCount} />
              </div>

              {/* Matched contacts list — shows the file that maps to each. */}
              {fileMatches.matchedIds.size > 0 && (
                <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-72 overflow-y-auto">
                  {Array.from(fileMatches.matchedIds).map((id) => {
                    const c = addressBook.find((x) => x.id === id);
                    if (!c) return null;
                    const f = fileMatches.byContactFile.get(id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {c.name}
                            <span className="font-mono text-muted-foreground ml-1.5">
                              ({c.phone_e164})
                            </span>
                          </p>
                          {f && (
                            <p className="font-mono text-[10.5px] text-muted-foreground truncate">
                              {f.name}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSuppressContact(id)}
                          aria-label={`Remove ${c.name} from recipients`}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Restore any suppressed-by-the-user contacts so they're not lost. */}
              {suppressedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSuppressedIds(new Set())}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Restore {suppressedIds.size} removed match{suppressedIds.size === 1 ? "" : "es"}
                </button>
              )}

              {/* Unmatched filenames — collapsible so 5 000 misses don't bury the rest. */}
              {fileMatches.unmatched.length > 0 && (
                <details className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                  <summary className="cursor-pointer text-[11.5px] font-semibold text-amber-900 dark:text-amber-200">
                    {fileMatches.unmatched.length} file
                    {fileMatches.unmatched.length === 1 ? "" : "s"} didn't match any contact
                  </summary>
                  <p className="text-[10.5px] text-foreground/70 mt-1 leading-snug">
                    Rename to digits-only phone (e.g. <span className="font-mono">255712345678.png</span>)
                    or normalized name (<span className="font-mono">john_magesa.jpg</span>), or add the
                    person to your{" "}
                    <Link to="/messaging/contacts" className="font-semibold text-primary hover:underline">
                      Contacts
                    </Link>{" "}
                    list.
                  </p>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
                    {fileMatches.unmatched.slice(0, 100).map((n, i) => (
                      <p key={`${n}-${i}`} className="text-[10.5px] font-mono text-foreground/70 truncate">
                        {n}
                      </p>
                    ))}
                    {fileMatches.unmatched.length > 100 && (
                      <p className="text-[10.5px] text-muted-foreground italic">
                        … and {fileMatches.unmatched.length - 100} more
                      </p>
                    )}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* Contact rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Contacts ({contacts.length})
          </Label>
          <button
            type="button"
            onClick={addRow}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.6} /> Add row
          </button>
        </div>

        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                placeholder="+255712345678"
                value={r.phone}
                onChange={(e) => updateRow(r.id, { phone: e.target.value })}
                className="h-8 text-xs font-mono flex-1 min-w-0 border-border"
              />
              <Input
                placeholder="Name (optional)"
                value={r.name}
                onChange={(e) => updateRow(r.id, { name: e.target.value })}
                className="h-8 text-xs flex-1 min-w-0 border-border"
              />
              <button
                type="button"
                onClick={() => removeRow(r.id)}
                aria-label="Remove row"
                disabled={rows.length <= 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
          <summary className="cursor-pointer text-foreground/80 font-medium">
            Paste many at once
          </summary>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            One per line — <span className="font-mono">+255712345678, John Magesa</span>
          </p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={3}
            className="mt-2 text-xs font-mono resize-none border-border"
            placeholder={"+255712345678, John Magesa\n+255754111222, Mary Joseph"}
          />
        </details>
      </div>

      {/* Send mode — template only (plain image + caption is disabled by policy). */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Send as
        </Label>
        <div className="inline-flex rounded-xl border bg-muted/40 p-0.5 text-[12px]">
          <span className="px-3 py-1 rounded-lg bg-background shadow-sm font-semibold">
            Approved template
          </span>
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-snug">
          Approved template with each contact's image as the header — delivers anytime.
          WhatsApp messages are sent using approved templates only.
        </p>
      </div>

      {sendMode === "image" ? (
        /* Caption (image mode only) */
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Caption (optional)
          </Label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            maxLength={1024}
            className="text-xs resize-none border-border"
            placeholder="Karibu {name}!"
          />
          <p className="text-[10.5px] text-muted-foreground">
            Supports <span className="font-mono">{"{name}"}</span> · {caption.length}/1024
          </p>
        </div>
      ) : (
        /* Template picker (template mode) */
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Template (image header)
          </Label>
          {tplLoading ? (
            <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading approved templates…
            </p>
          ) : tplError ? (
            <p className="text-[11px] text-destructive">{tplError}</p>
          ) : tplList.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No approved templates with an image header. Create one in the Templates tab.
            </p>
          ) : (
            <>
              <select
                value={tplName}
                onChange={(e) => {
                  setTplName(e.target.value);
                  setTplVars({});
                }}
                className="w-full h-9 rounded-lg border border-border bg-background text-xs px-2"
              >
                <option value="">Select a template…</option>
                {tplList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({(t.language as string) || "en"})
                  </option>
                ))}
              </select>

              {/* Body-variable inputs — tokens {name}/{phone} personalize per contact. */}
              {selectedTpl && bodyTokens.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10.5px] text-muted-foreground">
                    Body variables — use <span className="font-mono">{"{name}"}</span> or{" "}
                    <span className="font-mono">{"{phone}"}</span> to personalize each recipient.
                  </p>
                  {bodyTokens.map((tok, i) => (
                    <div key={tok} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground w-16 flex-shrink-0">
                        {`{{${tok}}}`}
                      </span>
                      <Input
                        value={tplVars[tok] ?? (i === 0 ? "{name}" : "")}
                        onChange={(e) =>
                          setTplVars((prev) => ({ ...prev, [tok]: e.target.value }))
                        }
                        placeholder={i === 0 ? "{name}" : "value or {name}/{phone}"}
                        className="h-8 text-xs border-border"
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10.5px] text-muted-foreground leading-snug">
                Each matched image becomes the template's header. Unmatched contacts are skipped.
              </p>
            </>
          )}
        </div>
      )}

      {/* Advanced — idempotency key (collapsed by default). */}
      <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
        <summary className="cursor-pointer text-foreground/80 font-medium">
          Advanced
        </summary>
        <div className="mt-2 space-y-1.5">
          <Label className="text-[11px] text-foreground/70">Idempotency key (optional)</Label>
          <Input
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            placeholder="e.g. wedding-rsvp-2026-05-14"
            className="h-8 text-xs font-mono border-border"
            maxLength={120}
          />
          <p className="text-[10.5px] text-muted-foreground leading-snug">
            Repeat the same key within 24 h to replay a completed job instead of
            creating a duplicate.
          </p>
        </div>
      </details>

      {/* Wait toggle + submit */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={wait}
            onChange={(e) => setWait(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Wait for completion (up to 3 min)
        </label>
        <Button
          onClick={submit}
          disabled={!canSubmit}
          className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send {contacts.length > 0 ? `(${contacts.length})` : ""}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Job status */}
      {job && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Job</p>
                <p className="text-xs font-mono text-foreground truncate">{job.job_id}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10.5px] uppercase font-semibold ${statusColor[job.job_status] ?? ""}`}
              >
                {job.job_status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <Stat label="Contacts" value={job.total_contacts} />
              <Stat label="Matched" value={job.matched} />
              <Stat label="Missing img" value={job.missing_images} />
              <Stat label="Sent" value={job.sent} tone="success" />
              <Stat label="Failed" value={job.failed} tone={job.failed > 0 ? "danger" : undefined} />
            </div>

            {/* Extended metadata — only render fields the backend actually returned. */}
            {(job.caption_preview ||
              typeof job.image_count === "number" ||
              job.completed_at ||
              job.idempotency_key ||
              job.whatsapp_account_id) && (
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 space-y-1 text-[11px]">
                {job.caption_preview && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Caption:</span>
                    <span className="text-foreground truncate">{job.caption_preview}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground tabular-nums">
                  {typeof job.image_count === "number" && (
                    <span>
                      <span className="text-foreground/70">{job.image_count}</span> images
                    </span>
                  )}
                  <span>
                    Created <span className="text-foreground/70">{new Date(job.created_at).toLocaleString()}</span>
                  </span>
                  {job.completed_at && (
                    <span>
                      Finished <span className="text-foreground/70">{new Date(job.completed_at).toLocaleString()}</span>
                    </span>
                  )}
                  {job.whatsapp_account_id && (
                    <span className="font-mono truncate" title={job.whatsapp_account_id}>
                      acct: {job.whatsapp_account_id}
                    </span>
                  )}
                  {job.idempotency_key && (
                    <span className="font-mono truncate" title={job.idempotency_key}>
                      key: {job.idempotency_key}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const detail = await getJob(job.job_id, { include_errors: true });
                    setJob(detail);
                  } catch {
                    // toast handled
                  }
                }}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={reset}
                className="h-8 text-xs text-muted-foreground"
              >
                New job
              </Button>
            </div>

            {job.fatal_error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{job.fatal_error}</AlertDescription>
              </Alert>
            )}

            {job.errors && job.errors.length > 0 && (
              <details className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <summary className="cursor-pointer text-xs font-semibold text-foreground">
                  Row errors ({job.errors.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {job.errors.map((e, i) => (
                    <div key={i} className="text-[11px] flex flex-wrap gap-1.5">
                      <span className="font-mono text-foreground/70">{e.phone || "—"}</span>
                      {e.name && <span className="text-muted-foreground">({e.name})</span>}
                      <Badge variant="outline" className="text-[10px] py-0">
                        {e.stage}
                      </Badge>
                      {e.detail && <span className="text-muted-foreground">{e.detail}</span>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card/50 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

// ─── Bulk Send Combined (Text / Image toggle) ────────────────────────────────
// Hosts both bulk modes under the single "Bulk Send" segmented tab. The two
// underlying tab components are unchanged; this wrapper just picks which one to
// render based on the local Text/Image toggle.

type BulkMode = "text" | "image";

function BulkSendCombined({
  waAccountId,
  prefillRecipients = [],
}: {
  waAccountId: string;
  prefillRecipients?: string[];
}) {
  const [mode, setMode] = useState<BulkMode>("text");
  // When the user picks an image-header template in the Text tab and chooses
  // "one image per receiver", carry that template into the Image tab so the
  // matched-image send continues with it already selected.
  const [imageBulkPrefill, setImageBulkPrefill] = useState<{ templateName: string } | null>(null);

  const tabs: Array<{ key: BulkMode; label: string; icon: typeof Send; activeClass: string }> = [
    {
      key: "text",
      label: "Text",
      icon: Send,
      activeClass: "bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]",
    },
    {
      key: "image",
      label: "Image",
      icon: ImageIcon,
      activeClass: "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
    },
  ];

  return (
    <div className="space-y-3 p-1">
      {/* Sub-mode toggle — sits inline so it doesn't look like a top-level nav. */}
      <div
        role="tablist"
        aria-label="Bulk send mode"
        className="inline-grid grid-cols-2 gap-1 p-1 bg-foreground/[0.06] dark:bg-foreground/[0.08] rounded-xl"
      >
        {tabs.map(({ key, label, icon: Icon, activeClass }) => {
          const isActive = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(key)}
              className={[
                "px-3.5 h-8 rounded-lg inline-flex items-center justify-center gap-1.5",
                "text-[12px] font-semibold tracking-tight transition-all duration-200",
                isActive
                  ? activeClass
                  : "text-foreground/70 dark:text-foreground/65 hover:bg-foreground/[0.04]",
              ].join(" ")}
            >
              <Icon className="w-[13px] h-[13px]" strokeWidth={isActive ? 2.6 : 2} />
              {label}
            </button>
          );
        })}
      </div>

      {mode === "text" ? (
        <BulkSendTab
          waAccountId={waAccountId}
          prefillRecipients={prefillRecipients}
          onUseImageBulkForTemplate={(templateName) => {
            setImageBulkPrefill({ templateName });
            setMode("image");
          }}
        />
      ) : (
        <BulkImageSendTab
          waAccountId={waAccountId}
          prefill={imageBulkPrefill}
          onPrefillConsumed={() => setImageBulkPrefill(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = "single" | "bulk" | "category" | "userids" | "daterange" | "audience" | "templates" | "pollresults";

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: typeof Send;
  color: string;
}

const TABS: Tab[] = [
  { id: "single",      label: "Single Send",    description: "Send a message to one recipient",        icon: Send,       color: "bg-[#25D366]" },
  { id: "bulk",        label: "Bulk Send",       description: "Broadcast text or personalized image",   icon: Users,      color: "bg-blue-500" },
  { id: "pollresults", label: "Poll Results",    description: "View RSVP & poll responses by name",     icon: BarChart3,  color: "bg-purple-500" },
];

// Order of sub-tabs surfaced in the segmented control. Drives swipe navigation
// (swipe left = next tab, swipe right = previous; edges spill into the adjacent
// page in the sidebar).
const VISIBLE_TABS = ["single", "bulk", "templates", "pollresults"] as const satisfies readonly TabId[];

export default function WhatsAppCloud() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [waAccountId, setWaAccountId] = useState("");
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const tabBodyRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Hand-off from /contacts: `?contact=<phone>` → land on Single Send, prefilled
  // search filters down to that contact. `?contacts=<p1>,<p2>,…` → land on Bulk
  // Send with those phones pre-selected.
  const prefillSingleContact = searchParams.get("contact") || "";
  const prefillBulkContactsRaw = searchParams.get("contacts") || "";
  const prefillBulkContacts = prefillBulkContactsRaw
    ? prefillBulkContactsRaw.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  // Default tab: Bulk if a contacts list came in from /contacts, otherwise Single.
  useEffect(() => {
    if (activeTab !== null) return;
    if (prefillBulkContacts.length > 0) setActiveTab("bulk");
    else setActiveTab("single");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swipe sub-tabs (Single ↔ Bulk ↔ Templates ↔ Polls). At the edges, spill
  // over to the previous/next page in the sidebar nav order:
  //   /messaging/send  ←  /whatsapp  →  /messaging/campaigns
  useSubTabSwipe({
    containerRef: tabBodyRef,
    tabs: VISIBLE_TABS,
    currentTab: (activeTab ?? "single") as (typeof VISIBLE_TABS)[number],
    setTab: (next) => setActiveTab(next),
    edgePrevHref: "/messaging/send",
    edgeNextHref: "/messaging/campaigns",
  });

  const loadAccount = async () => {
    setLoadingAccount(true);
    setAccountError(null);
    setWaAccountId("");
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.EARLY_ACCESS.AI_AGENTS.WHATSAPP_CREDENTIALS_AUTO);
      const t = localStorage.getItem("access_token");
      const res = await fetch(url, { headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
      const json = await res.json().catch(() => null);
      const data = json?.data;
      const id: string = data?.chatbot_id ?? data?.whatsapp_account_id ?? "";
      const channel = data?.whatsapp_channel;
      if (!id) {
        setAccountError("No WhatsApp account linked. Please connect your Meta credentials in Settings → WhatsApp.");
      } else if (!channel || !channel.access_token_configured || !channel.phone_number_id) {
        setAccountError(`WhatsApp account found (${id}) but credentials are incomplete — Phone Number ID or Access Token missing.`);
      } else {
        setWaAccountId(id);
      }
    } catch {
      setAccountError("Could not load WhatsApp account. Check your connection and try again.");
    } finally {
      setLoadingAccount(false);
    }
  };

  useEffect(() => { void loadAccount(); }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "single":    return <SingleSendTab waAccountId={waAccountId} prefillSearch={prefillSingleContact} />;
      case "bulk":      return <BulkSendCombined waAccountId={waAccountId} prefillRecipients={prefillBulkContacts} />;
      case "category":  return <ByCategoryTab waAccountId={waAccountId} />;
      case "userids":   return <ByUserIdsTab waAccountId={waAccountId} />;
      case "daterange": return <ByDateRangeTab waAccountId={waAccountId} />;
      case "templates": return <TemplatesTab waAccountId={waAccountId} />;
      case "audience":  return <AudienceTab waAccountId={waAccountId} />;
      case "pollresults": return <PollResultsTab />;
      default:          return null;
    }
  };

  // Resolve current mode (default to "single" until activeTab is set by the effect).
  const mode: TabId = activeTab ?? "single";

  // Page background tints to match the active mode (matches Send SMS pattern).
  const modeBgClass = {
    single: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
    bulk: "bg-gradient-to-b from-blue-500/10 via-background to-blue-500/10 dark:from-blue-500/15 dark:via-background dark:to-blue-500/15",
    pollresults: "bg-gradient-to-b from-purple-500/10 via-background to-purple-500/10 dark:from-purple-500/15 dark:via-background dark:to-purple-500/15",
    templates: "bg-gradient-to-b from-amber-500/10 via-background to-amber-500/10 dark:from-amber-500/15 dark:via-background dark:to-amber-500/15",
    // Fallbacks for inactive TABS (audience/category/etc.) — keep emerald.
    category: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
    userids: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
    daterange: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
    audience: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
  }[mode];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${modeBgClass}`}>
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${modeBgClass}`}>
          <div className="max-w-3xl mx-auto w-full max-w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-8 space-y-5">

            {/* iOS large-title header */}
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(37,211,102,0.35)]">
                  <WhatsAppIcon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[20px] sm:text-2xl font-bold text-foreground leading-tight tracking-tight">WhatsApp Cloud</h1>
                  <p className="text-[12px] sm:text-sm text-foreground/60 mt-0.5">Meta Cloud API messaging</p>
                </div>
              </div>

              {/* Account chip */}
              {loadingAccount ? (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/60 dark:bg-muted/30 border border-border/60 px-2.5 py-1.5 flex-shrink-0 mr-11 md:mr-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/60" />
                  <span className="text-[11px] font-semibold text-foreground/65 hidden sm:inline">Connecting…</span>
                </div>
              ) : waAccountId ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/40 px-2.5 py-1.5 flex-shrink-0 mr-11 md:mr-0">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" strokeWidth={2.4} />
                  <span className="hidden sm:inline font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 max-w-[140px] truncate">{waAccountId}</span>
                  <button
                    type="button"
                    className="text-emerald-600 dark:text-emerald-400 hover:opacity-70 transition-opacity flex-shrink-0"
                    title="Re-check"
                    onClick={() => void loadAccount()}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
            </header>

            {/* ── Error banner ── */}
            {!loadingAccount && accountError && (
              <Alert variant="destructive" className="py-2.5 border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                  {accountError}{" "}
                  <Link to="/settings?tab=whatsapp" className="underline underline-offset-2 font-semibold text-red-700 dark:text-red-300">Configure</Link>
                  <button className="ml-3 underline underline-offset-2 font-semibold text-red-700 dark:text-red-300" onClick={() => void loadAccount()}>Retry</button>
                </AlertDescription>
              </Alert>
            )}

            {/* ── Manual ID input ── */}
            {!loadingAccount && !waAccountId && (
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">WhatsApp Account ID</Label>
                  <p className="text-[11px] text-muted-foreground">Paste your copilot ID (cb_…) or configure credentials in Settings</p>
                  <Input
                    placeholder="cb_XXXXXXXXXXXX"
                    value={waAccountId}
                    onChange={(e) => setWaAccountId(e.target.value)}
                    className="font-mono text-sm h-9 border-border"
                  />
                </CardContent>
              </Card>
            )}

            {/* Segmented control — filled colored pill for active */}
            <div
              role="tablist"
              aria-label="WhatsApp send mode"
              className="grid grid-cols-4 gap-1 p-1 bg-foreground/[0.06] dark:bg-foreground/[0.08] rounded-2xl"
            >
              {[
                {
                  key: "single" as const,
                  icon: Send,
                  label: "Single",
                  activeClass: "bg-[#25D366] text-white shadow-[0_2px_8px_rgba(37,211,102,0.35)]",
                },
                {
                  key: "bulk" as const,
                  icon: Users,
                  label: "Bulk",
                  activeClass: "bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]",
                },
                {
                  key: "templates" as const,
                  icon: FileText,
                  label: "Templates",
                  activeClass: "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
                },
                {
                  key: "pollresults" as const,
                  icon: BarChart3,
                  label: "Polls",
                  activeClass: "bg-purple-500 text-white shadow-[0_2px_8px_rgba(168,85,247,0.35)]",
                },
              ].map(({ key, icon: Icon, label, activeClass }) => {
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(key)}
                    className={[
                      "h-11 rounded-xl inline-flex items-center justify-center gap-1.5",
                      "text-[13px] font-bold tracking-tight transition-all duration-200",
                      isActive
                        ? activeClass
                        : "text-foreground/70 dark:text-foreground/65 active:bg-foreground/[0.04] dark:active:bg-foreground/[0.06]",
                    ].join(" ")}
                  >
                    <Icon className="w-[15px] h-[15px]" strokeWidth={isActive ? 2.6 : 2} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Active tab body — always visible (defaults to Single). Touch swipes
                cycle through tabs; at the edges they spill into the adjacent
                sidebar page (Send SMS ↔ Campaigns). */}
            <div
              ref={tabBodyRef}
              className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] p-4 sm:p-5"
            >
              {loadingAccount ? (
                <div className="flex items-center justify-center py-12 gap-2 text-foreground/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">Loading account…</span>
                </div>
              ) : !waAccountId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[14px] font-semibold text-foreground">No account connected</p>
                    <p className="text-[12px] text-foreground/60 max-w-xs">
                      Enter your WhatsApp Account ID above or configure credentials in Settings.
                    </p>
                  </div>
                </div>
              ) : (
                renderTab()
              )}
            </div>

            {/* ── Footer ── */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed pb-2">
              <strong>Meta policy:</strong> Free-form text outside the 24-hr window requires an approved template. Max 500 recipients per bulk request.
            </p>

          </div>
        </main>
      </div>
    </div>
  );
}

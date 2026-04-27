import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  type WAUser,
  type WASendBulkResult,
  type WASendSingleResult,
  type WAMessageTemplate,
} from "@/hooks/useWhatsAppCloud";
import { buildApiUrl, API_CONFIG } from "@/config/api";

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

// ─── Single Send Tab ──────────────────────────────────────────────────────────

function SingleSendTab({ waAccountId }: { waAccountId: string }) {
  const { sendSingle, getUsers, getMessageTemplates, isLoading } = useWhatsAppCloud();
  const [msgType, setMsgType] = useState<"text" | "template">("text");
  const [text, setText] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [langCode, setLangCode] = useState("ENGLISH");
  const [templates, setTemplates] = useState<WAMessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [result, setResult] = useState<WASendSingleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [audience, setAudience] = useState<WAUser[]>([]);
  const [audiencePage, setAudiencePage] = useState(1);
  const [audiencePageSize, setAudiencePageSize] = useState(25);
  const [audienceTotal, setAudienceTotal] = useState<number | null>(null);
  const [audienceHasNext, setAudienceHasNext] = useState(false);
  const [audienceHasPrevious, setAudienceHasPrevious] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const templatesLoadedForRef = useRef<string | null>(null);
  const templatesRequestInFlightRef = useRef(false);

  const loadAudience = async (page = 1) => {
    setAudienceLoading(true);
    setAudienceError(null);
    try {
      const res = await getUsers({ page, page_size: audiencePageSize }, waAccountId || undefined);
      setAudience(res.users);
      setAudiencePage(page);
      setAudienceTotal(res.total ?? null);
      setAudienceHasNext(res.has_next ?? false);
      setAudienceHasPrevious(res.has_previous ?? false);
    } catch (e) {
      setAudienceError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setAudienceLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAudience(1); }, [waAccountId, audiencePageSize]);

  useEffect(() => {
    if (msgType !== "template") return;

    const accountKey = waAccountId || "auto";
    if (templatesLoadedForRef.current === accountKey || templatesRequestInFlightRef.current) return;

    templatesRequestInFlightRef.current = true;
    setTemplatesLoading(true);
    setTemplatesError(null);

    getMessageTemplates(waAccountId || undefined, { status: "APPROVED", limit: 50 })
      .then((res) => {
        setTemplates(res.data?.graph?.data || []);
      })
      .catch((e) => {
        setTemplatesError(e instanceof Error ? e.message : "Failed to load templates");
      })
      .finally(() => {
        templatesLoadedForRef.current = accountKey;
        templatesRequestInFlightRef.current = false;
        setTemplatesLoading(false);
      });
  }, [msgType, waAccountId]);

  const sendTo = async (to: string) => {
    setError(null);
    setResult(null);
    try {
      const payload = msgType === "text"
        ? { to, text }
        : { to, type: "template" as const, template_name: templateName, language_code: langCode, components: [] };
      const data = await sendSingle(payload, waAccountId || undefined);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* Message type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message Type</Label>
        <Select value={msgType} onValueChange={(v) => setMsgType(v as "text" | "template")}>
          <SelectTrigger className="h-9 text-sm border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text message</SelectItem>
            <SelectItem value="template">Approved template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message content */}
      {msgType === "text" ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
          </div>
          <Textarea
            placeholder="Type your message here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="text-sm resize-none border-border"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Template</Label>
            {templatesLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
            ) : templatesError ? (
              <Alert variant="destructive" className="py-1.5"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{templatesError}</AlertDescription></Alert>
            ) : (
              <Select value={templateName} onValueChange={setTemplateName}>
                <SelectTrigger className="h-9 text-sm border-border"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>{templates.map((tpl) => <SelectItem key={tpl.id} value={tpl.name}>{tpl.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Language</Label>
            <Select value={langCode} onValueChange={setLangCode}>
              <SelectTrigger className="h-9 text-sm border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ENGLISH">English</SelectItem>
                <SelectItem value="SWAHILI">Swahili</SelectItem>
                <SelectItem value="MIXED">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
          </AlertDescription>
        </Alert>
      )}

      {/* Contact table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
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
                        disabled={isLoading || (msgType === "text" ? !text.trim() : !templateName.trim())}
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

function BulkSendTab({ waAccountId }: { waAccountId: string }) {
  const { sendBulk, getUsers, isLoading } = useWhatsAppCloud();
  const [text, setText] = useState("");
  const [delayMs, setDelayMs] = useState(80);
  const [result, setResult] = useState<WASendBulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendMode, setSendMode] = useState<"selected" | "page" | "all">("page");

  // Checkbox selection
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const [audience, setAudience] = useState<WAUser[]>([]);
  const [audiencePage, setAudiencePage] = useState(1);
  const [audiencePageSize, setAudiencePageSize] = useState(25);
  const [audienceTotal, setAudienceTotal] = useState<number | null>(null);
  const [audienceHasNext, setAudienceHasNext] = useState(false);
  const [audienceHasPrevious, setAudienceHasPrevious] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);

  const loadAudience = async (page = 1) => {
    setAudienceLoading(true);
    setAudienceError(null);
    try {
      const res = await getUsers({ page, page_size: audiencePageSize }, waAccountId || undefined);
      setAudience(res.users);
      setAudiencePage(page);
      setAudienceTotal(res.total ?? null);
      setAudienceHasNext(res.has_next ?? false);
      setAudienceHasPrevious(res.has_previous ?? false);
    } catch (e) {
      setAudienceError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setAudienceLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAudience(1); }, [waAccountId, audiencePageSize]);

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
      const data = await sendBulk({ recipients: list, text, delay_ms: delayMs }, waAccountId || undefined);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk send failed");
    }
  };

  const handleSend = async () => {
    setError(null); setResult(null);
    if (sendMode === "selected") {
      await handle([...checked]);
    } else if (sendMode === "page") {
      await handle(pagePhones);
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

  const sendCount = sendMode === "selected" ? checked.size : sendMode === "page" ? audience.length : (audienceTotal ?? 0);
  const sendDisabled = isLoading || !text.trim() || sendCount === 0 || (sendMode === "all" && (audienceTotal ?? 0) > 500);

  return (
    <div className="space-y-4 p-1">
      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message</Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">{text.length} chars</span>
        </div>
        <Textarea placeholder="Your message here…" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm resize-none border-border" />
      </div>

      {/* Delay + Send mode + Send button in one row */}
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
      </div>

      <Button onClick={handleSend} disabled={sendDisabled} className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send to {sendCount} {sendCount === 1 ? "contact" : "contacts"}
      </Button>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}
      <BulkResultBanner result={result} />

      {/* Contact table with checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
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
  const { getMessageTemplates, isLoading } = useWhatsAppCloud();
  const [templates, setTemplates] = useState<WAMessageTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await getMessageTemplates(waAccountId || undefined, { status: statusFilter !== "all" ? statusFilter : undefined, limit: 25 });
      if (res.data?.graph?.data) setTemplates(res.data.graph.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load templates"); }
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Message Templates</Label>
        <p className="text-[11px] text-muted-foreground mt-0.5">Browse approved templates from Meta WhatsApp Manager</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm w-40 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} disabled={isLoading} variant="outline" className="gap-2 h-9">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Load Templates
        </Button>
      </div>

      {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-3.5 w-3.5" /><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      {templates.length > 0 && (
        <TableWrap>
          <table className="w-full table-fixed">
            <TableHead>
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Status</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th className="hidden lg:table-cell">Language</Th>
            </TableHead>
            <tbody className="divide-y divide-border">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Td className="font-medium">{t.name}</Td>
                  <Td className="hidden sm:table-cell">
                    <Badge variant="secondary" className={`text-[11px] px-1.5 py-0 ${t.status === "APPROVED" ? "bg-green-100 text-green-700" : t.status === "PENDING_REVIEW" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {t.status}
                    </Badge>
                  </Td>
                  <Td className="hidden md:table-cell text-muted-foreground">{t.category || "—"}</Td>
                  <Td className="hidden lg:table-cell text-muted-foreground">{t.language || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {!isLoading && templates.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No templates yet. Click "Load Templates" to browse.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = "single" | "bulk" | "category" | "userids" | "daterange" | "audience" | "templates";

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: typeof Send;
  color: string;
}

const TABS: Tab[] = [
  { id: "single",    label: "Single Send",   description: "Send a message to one recipient",             icon: Send,     color: "bg-[#25D366]" },
  { id: "bulk",      label: "Bulk Send",      description: "Broadcast to a list of phone numbers",        icon: Users,    color: "bg-blue-500" },
  { id: "daterange", label: "By Date Range",  description: "Filter contacts by registration date range",  icon: Calendar, color: "bg-teal-600" },
  { id: "audience",  label: "Audience",       description: "Preview and filter your contact list",        icon: Users,    color: "bg-indigo-500" },
];

export default function WhatsAppCloud() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [waAccountId, setWaAccountId] = useState("");
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

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
      case "single":    return <SingleSendTab waAccountId={waAccountId} />;
      case "bulk":      return <BulkSendTab waAccountId={waAccountId} />;
      case "category":  return <ByCategoryTab waAccountId={waAccountId} />;
      case "userids":   return <ByUserIdsTab waAccountId={waAccountId} />;
      case "daterange": return <ByDateRangeTab waAccountId={waAccountId} />;
      case "templates": return <TemplatesTab waAccountId={waAccountId} />;
      case "audience":  return <AudienceTab waAccountId={waAccountId} />;
      default:          return null;
    }
  };

  const activeTabData = activeTab ? TABS.find(t => t.id === activeTab) ?? null : null;
  const ActiveTabIcon = activeTabData?.icon ?? MessageSquare;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-4">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md shadow-green-200 dark:shadow-green-900">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">WhatsApp Cloud</h1>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Meta Cloud API messaging</p>
                </div>
              </div>

              {/* Account chip */}
              {loadingAccount ? (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/60 border border-border px-3 py-1.5 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">Connecting…</span>
                </div>
              ) : waAccountId ? (
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-2.5 py-1.5 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="hidden sm:inline font-mono text-[11px] font-semibold text-green-800 dark:text-green-300 max-w-[160px] truncate">{waAccountId}</span>
                  <button className="text-green-500 hover:text-green-700 transition-colors shrink-0" title="Re-check" onClick={() => void loadAccount()}>
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
            </div>

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

            {/* ── Tab selection cards ── */}
            {!activeTab && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-border bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl ${tab.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                        <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">{tab.label}</h3>
                      <p className="text-[11px] text-muted-foreground leading-snug">{tab.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Active tab ── */}
            {activeTab && activeTabData && (
              <Card className="border border-border shadow-sm overflow-hidden">
                {/* Tab header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-gray-50/70 dark:bg-gray-900/70">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${activeTabData.color} flex items-center justify-center shrink-0`}>
                      <ActiveTabIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground leading-tight">{activeTabData.label}</h2>
                      <p className="text-[11px] text-muted-foreground">{activeTabData.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)} className="h-7 w-7 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Back">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Tab body */}
                <CardContent className="p-4 sm:p-5">
                  {loadingAccount ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Loading account…</span>
                    </div>
                  ) : !waAccountId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3 px-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">No account connected</p>
                        <p className="text-xs text-muted-foreground">Enter your WhatsApp Account ID above or configure credentials in Settings.</p>
                      </div>
                    </div>
                  ) : (
                    renderTab()
                  )}
                </CardContent>
              </Card>
            )}

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

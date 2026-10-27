// Send an approved WhatsApp template from the inbox. It is the only kind of message WhatsApp allows once 24 hours have passed since the
// customer last wrote, and it can also be used inside the window. The list comes from the business's own WhatsApp account.
import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { appLanguage } from "@/utils/appLocale";
import { teamInboxApi, type InboxMessage, type InboxTemplate } from "@/services/teamInboxApi";

const TEXT = {
  sw: {
    button: "Tuma kiolezo", title: "Tuma kiolezo cha WhatsApp", help: "Violezo vilivyoidhinishwa na WhatsApp. Ndivyo pekee vinavyoruhusiwa baada ya saa 24 tangu mteja aandike.",
    search: "Tafuta kiolezo", loading: "Inapakia violezo...", none: "Hakuna kiolezo kilichoidhinishwa kinachoweza kutumwa hapa.", failed: "Imeshindikana kupakia violezo.", retry: "Jaribu tena",
    header: "Kichwa", body: "Ujumbe", footer: "Mwisho", variable: (n: number) => `Thamani ya {{${n}}}`, headerVariable: "Thamani ya kichwa {{1}}",
    send: "Tuma kiolezo", sending: "Inatuma...", back: "Rudi kwenye orodha", unsupported: "Hakiwezi kutumwa hapa", cost: "Ujumbe wa kiolezo unaweza kutozwa na WhatsApp.",
    fill: "Jaza thamani zote.", preview: "Mwonekano",
  },
  en: {
    button: "Send a template", title: "Send a WhatsApp template", help: "Templates approved by WhatsApp. They are the only messages allowed once 24 hours have passed since the customer wrote.",
    search: "Search templates", loading: "Loading templates...", none: "There is no approved template that can be sent from here.", failed: "Could not load the templates.", retry: "Try again",
    header: "Header", body: "Message", footer: "Footer", variable: (n: number) => `Value for {{${n}}}`, headerVariable: "Header value {{1}}",
    send: "Send template", sending: "Sending...", back: "Back to the list", unsupported: "Cannot be sent from here", cost: "WhatsApp may charge for template messages.",
    fill: "Fill in every value.", preview: "Preview",
  },
};

const token = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(16).slice(2)}`);
const fill = (text: string, values: string[]) => text.replace(/\{\{\s*(\d+)\s*\}\}/g, (all, n) => values[Number(n) - 1] || all);

interface Props {
  threadId: string;
  open: boolean;
  onClose: () => void;
  /** The server's record of the sent message (also when WhatsApp refused it, so it can show as "not sent"). */
  onSent: (message: InboxMessage, warning: { name: string; at: string } | null, error?: string) => void;
}

export function TemplatePicker({ threadId, open, onClose, onSent }: Props) {
  const T = TEXT[appLanguage()];
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<InboxTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<InboxTemplate | null>(null);
  const [values, setValues] = useState<string[]>([]);
  const [headerValue, setHeaderValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [clientToken, setClientToken] = useState(token);

  const load = async () => {
    setState("loading");
    const res = await teamInboxApi.templates(threadId);
    if (res.success && res.data) { setTemplates(res.data.results); setState("ok"); return; }
    setError(String((res.errors as unknown as { message?: string } | null)?.message || res.message || T.failed));
    setState("error");
  };

  useEffect(() => {
    if (!open) return;
    setChosen(null); setQuery(""); setSendError("");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, threadId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  }, [templates, query]);

  const choose = (t: InboxTemplate) => {
    if (!t.supported) return;
    setChosen(t); setValues(Array(t.body_variables).fill("")); setHeaderValue(""); setSendError(""); setClientToken(token());
  };

  const complete = !!chosen && values.every((v) => v.trim()) && (chosen.header_variables === 0 || !!headerValue.trim());

  const send = async () => {
    if (!chosen || !complete || sending) return;
    setSending(true); setSendError("");
    const res = await teamInboxApi.sendTemplate(threadId, {
      name: chosen.name, language: chosen.language, variables: values, header_variables: chosen.header_variables ? [headerValue] : [], client_token: clientToken,
    });
    setSending(false);
    const body = (res.data ?? res.errors) as unknown as { message?: InboxMessage | string; warning?: { name: string; at: string } | null; error?: string } | null;
    if (body && typeof body.message === "object" && body.message) {  // the server recorded it (sent, or failed and can be retried from the chat)
      onSent(body.message, body.warning ?? null, res.success ? undefined : body.error);
      onClose();
      return;
    }
    setSendError(String((res.errors as unknown as { message?: string } | null)?.message || res.message || T.failed));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{T.title}</DialogTitle>
          <DialogDescription>{T.help}</DialogDescription>
        </DialogHeader>

        {!chosen && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={T.search} aria-label={T.search} className="pl-8" />
            </div>
            {state === "loading" && <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{T.loading}</p>}
            {state === "error" && (
              <div className="space-y-2 py-2 text-sm"><p className="text-destructive">{error}</p><Button size="sm" variant="outline" onClick={() => void load()}>{T.retry}</Button></div>
            )}
            {state === "ok" && shown.length === 0 && <p className="py-4 text-sm text-muted-foreground">{T.none}</p>}
            <ul className="space-y-1.5">
              {shown.map((t) => (
                <li key={`${t.name}-${t.language}`}>
                  <button type="button" disabled={!t.supported} onClick={() => choose(t)}
                    className="w-full rounded-md border p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
                    <span className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4 shrink-0 text-[#00a884]" /><span className="min-w-0 flex-1 truncate">{t.name}</span><span className="text-xs text-muted-foreground">{t.language} · {t.category}</span></span>
                    <span className="mt-1 line-clamp-2 block whitespace-pre-wrap break-words text-xs text-muted-foreground">{t.body}</span>
                    {!t.supported && <span className="mt-1 block text-xs text-amber-700">{T.unsupported}: {t.reason}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {chosen && (
          <div className="space-y-3">
            <button type="button" className="text-xs font-medium text-[#1f7a5a] underline" onClick={() => setChosen(null)}>{T.back}</button>
            <p className="text-sm font-semibold">{chosen.name} <span className="text-xs font-normal text-muted-foreground">{chosen.language} · {chosen.category}</span></p>
            {chosen.header_variables > 0 && (
              <Input value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} placeholder={T.headerVariable} aria-label={T.headerVariable} maxLength={60} />
            )}
            {values.map((v, i) => (
              <Input key={i} value={v} onChange={(e) => setValues((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={T.variable(i + 1)} aria-label={T.variable(i + 1)} maxLength={1000} />
            ))}
            <div className="rounded-lg bg-[#d9fdd3] p-3 text-sm text-[#111b21] shadow-sm" aria-label={T.preview}>
              {chosen.header && <p className="mb-1 font-semibold">{fill(chosen.header, [headerValue])}</p>}
              <p className="whitespace-pre-wrap break-words">{fill(chosen.body, values)}</p>
              {chosen.footer && <p className="mt-1 text-xs text-[#667781]">{chosen.footer}</p>}
              {chosen.buttons.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5">{chosen.buttons.map((b) => <span key={b} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-[#027eb5]">{b}</span>)}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{T.cost}</p>
            {sendError && <p className="text-sm text-destructive" role="alert">{sendError}</p>}
            {!complete && (values.length > 0 || chosen.header_variables > 0) && <p className="text-xs text-muted-foreground">{T.fill}</p>}
            <Button onClick={() => void send()} disabled={!complete || sending} className="w-full bg-[#00a884] text-white hover:bg-[#008f72]">
              {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{T.sending}</> : T.send}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


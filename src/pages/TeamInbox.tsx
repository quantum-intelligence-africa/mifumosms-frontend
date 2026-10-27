// SENDA Team Inbox: one connected WhatsApp number, one shared inbox, many employees. Everything shown comes from the server (no sample data);
// the server decides what each signed-in employee may see and do, the buttons here only reflect that.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, CheckCheck, Inbox, Loader2, MessageSquare, RefreshCw, Search, Send, StickyNote, UserCheck } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { appLanguage } from "@/utils/appLocale";
import { API_CONFIG } from "@/config/api";
import {
  errorCode, teamInboxApi, type Counts, type InboxMessage, type InboxNote, type InboxThread, type InboxView, type Person, type ThreadDetail, type ThreadStatus,
} from "@/services/teamInboxApi";

const TEXT = {
  sw: {
    title: "Sanduku la Timu", all: "Mazungumzo yote", mine: "Yangu", unassigned: "Hayajapewa mtu", open: "Wazi", pending: "Yanasubiri", resolved: "Yamekamilika", archived: "Yaliyohifadhiwa",
    search: "Tafuta jina, namba au ujumbe", empty: "Hakuna mazungumzo hapa bado.", noResults: "Hakuna matokeo ya utafutaji huu.", pick: "Chagua mazungumzo kuanza.",
    loading: "Inapakia...", failed: "Imeshindikana kupakia. Jaribu tena.", retryLoad: "Jaribu tena", loadMore: "Pakia zaidi", older: "Ujumbe wa zamani",
    reply: "Jibu", note: "Dokezo la ndani", replyPlaceholder: "Andika jibu kwa mteja (Enter kutuma, Shift+Enter mstari mpya)", notePlaceholder: "Dokezo hili linaonekana na timu pekee, halitumwi kwa mteja",
    send: "Tuma", addNote: "Hifadhi dokezo", sending: "Inatuma...", failedSend: "Haikutumwa", retry: "Jaribu tena", unassignedLabel: "Hajapewa mtu", assignedTo: "Amepewa", claim: "Chukua",
    assign: "Mpe mtu", status: "Hali", typing: (n: string) => `${n} anaandika...`, recent: (n: string) => `${n} amejibu sasa hivi. Hakikisha hamjibu kitu kimoja.`,
    window: "Zaidi ya saa 24 zimepita tangu mteja aandike mara ya mwisho. WhatsApp inaruhusu ujumbe wa kiolezo kilichoidhinishwa pekee sasa.",
    noReply: "Huna ruhusa ya kujibu mazungumzo haya.", contact: "Taarifa za mteja", noContact: "Hakuna taarifa zaidi za mteja zilizohifadhiwa.", notes: "Madokezo ya ndani", noNotes: "Hakuna madokezo.",
    reconnecting: "Inaunganisha upya...", you: "Wewe", unread: "Hayajasomwa", forbidden: "Huna ruhusa.", claimed: "Mazungumzo yamechukuliwa.", assignedOk: "Mazungumzo yamepewa.", statusOk: "Hali imebadilishwa.",
    noAccess: "Akaunti yako haina ufikiaji wa sanduku hili.", back: "Rudi", mediaLoading: "Inapakia faili...", mediaFailed: "Faili hii haiwezi kupakiwa sasa.",
  },
  en: {
    title: "Team Inbox", all: "All conversations", mine: "My conversations", unassigned: "Unassigned", open: "Open", pending: "Pending", resolved: "Resolved", archived: "Archived",
    search: "Search name, number or message", empty: "No conversations here yet.", noResults: "No results for this search.", pick: "Select a conversation to start.",
    loading: "Loading...", failed: "Could not load. Try again.", retryLoad: "Try again", loadMore: "Load more", older: "Older messages",
    reply: "Reply", note: "Internal note", replyPlaceholder: "Write a reply to the customer (Enter to send, Shift+Enter for a new line)", notePlaceholder: "Only your team sees this note. It is never sent to the customer",
    send: "Send", addNote: "Save note", sending: "Sending...", failedSend: "Not sent", retry: "Retry", unassignedLabel: "Unassigned", assignedTo: "Assigned to", claim: "Claim",
    assign: "Assign to", status: "Status", typing: (n: string) => `${n} is typing...`, recent: (n: string) => `${n} just replied. Make sure you are not answering the same thing.`,
    window: "More than 24 hours have passed since the customer last wrote. WhatsApp only allows an approved template message now.",
    noReply: "You do not have permission to reply to this conversation.", contact: "Customer", noContact: "No further customer details are saved.", notes: "Internal notes", noNotes: "No notes yet.",
    reconnecting: "Reconnecting...", you: "You", unread: "Unread", forbidden: "You do not have permission.", claimed: "Conversation claimed.", assignedOk: "Conversation assigned.", statusOk: "Status changed.",
    noAccess: "Your account does not have access to this inbox.", back: "Back", mediaLoading: "Loading file...", mediaFailed: "This file cannot be loaded right now.",
  },
} as const;

const POLL_MS = 3000;
const STATUS_TONE: Record<ThreadStatus, string> = {
  open: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800", resolved: "bg-slate-100 text-slate-700", archived: "bg-slate-100 text-slate-500",
};
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const clock = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { day: "numeric", month: "short" });
};
const label = (t: InboxThread) => t.customer_name || `+${t.customer_phone}`;
const token = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(16).slice(2)}`);

function Ticks({ status }: { status: InboxMessage["status"] }) {
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === "sent") return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === "pending") return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  return null;
}

/** A picture / video / voice note / document the customer sent. WhatsApp keeps it, so it is fetched through our server (which checks the
 *  agent may see this conversation) when the message scrolls into view of the page, and shown in the bubble. */
function MessageMedia({ threadId, message, failed, loading }: { threadId: string; message: InboxMessage; failed: string; loading: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    void (async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/team-inbox/threads/${threadId}/messages/${message.id}/media/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || failed);
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (alive) setSrc(objectUrl);
      } catch (e) {
        if (alive) setError(e instanceof Error && e.message ? e.message : failed);
      }
    })();
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [threadId, message.id, failed]);

  if (error) return <p className="mb-1 rounded-md bg-background/60 px-2 py-1 text-xs text-muted-foreground">{error}</p>;
  if (!src) return <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{loading}</p>;
  if (message.kind === "image" || message.kind === "sticker") return <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={message.text} className="mb-1 max-h-72 max-w-full rounded-md" /></a>;
  if (message.kind === "video") return <video src={src} controls className="mb-1 max-h-72 max-w-full rounded-md" />;
  if (message.kind === "audio") return <audio src={src} controls className="mb-1 max-w-full" />;
  return <a href={src} download className="mb-1 inline-block text-xs font-medium underline">{message.text || "Download"}</a>;
}

const TeamInbox = () => {
  const T = TEXT[appLanguage()];
  // The layout follows the width of the workspace itself (the app sidebar takes a share of the window), not the window: single pane when narrow,
  // list + conversation when there is room, the status rail beside them when there is more, and the customer panel only on wide screens.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const split = width >= 680;
  const rail = width >= 1080;
  const panel = width >= 1380;
  const isMobile = !split;
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [view, setView] = useState<InboxView | ThreadStatus>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [listState, setListState] = useState<"loading" | "ok" | "error" | "denied">("loading");
  const [reconnecting, setReconnecting] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [members, setMembers] = useState<Array<Person & { role: string }>>([]);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const lastEvent = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  const viewRef = useRef(view);
  const searchRef = useRef(debounced);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingSent = useRef(0);
  activeRef.current = activeId;
  viewRef.current = view;
  searchRef.current = debounced;

  useEffect(() => { const h = window.setTimeout(() => setDebounced(search.trim()), 300); return () => window.clearTimeout(h); }, [search]);

  const filters = useMemo(() => {
    const isView = view === "all" || view === "mine" || view === "unassigned";
    return { view: isView ? (view as InboxView) : ("all" as InboxView), status: isView ? undefined : view };
  }, [view]);

  const loadList = useCallback(async (nextPage = 1, append = false) => {
    const res = await teamInboxApi.threads({ ...filters, q: searchRef.current || undefined, page: nextPage });
    if (res.status === 403) { setListState("denied"); return; }
    if (!res.success || !res.data) { setListState((s) => (s === "ok" ? s : "error")); return false; }
    const rows = res.data.results;
    setThreads((prev) => (append ? [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))] : rows));
    setTotal(res.data.count);
    setPage(nextPage);
    setListState("ok");
    return true;
  }, [filters]);

  const loadCounts = useCallback(async () => {
    const res = await teamInboxApi.counts();
    if (res.success && res.data) setCounts(res.data);
  }, []);

  useEffect(() => { setListState("loading"); void loadList(1); void loadCounts(); }, [loadList, loadCounts, debounced]);
  useEffect(() => { void teamInboxApi.members().then((r) => { if (r.success && r.data) setMembers(r.data.results); }); }, []);

  /** Merge fresh messages into what is on screen by id: a re-read never duplicates a message. */
  const mergeMessages = useCallback((incoming: InboxMessage[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      incoming.forEach((m) => byId.set(m.id, m));
      const pendingTokens = new Set(incoming.map((m) => m.client_token).filter(Boolean));
      return [...byId.values()].filter((m) => !(m.id.startsWith("local-") && pendingTokens.has(m.client_token))).sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const refreshActive = useCallback(async (id: string) => {
    const [d, m] = await Promise.all([teamInboxApi.detail(id), teamInboxApi.messages(id)]);
    if (activeRef.current !== id) return;
    if (d.success && d.data) setDetail(d.data);
    if (m.success && m.data) { mergeMessages(m.data.results); setHasMore((h) => h || m.data!.has_more); }
  }, [mergeMessages]);

  const open = useCallback(async (id: string) => {
    setActiveId(id);
    activeRef.current = id;
    setDetail(null); setMessages([]); setNotes([]); setHasMore(false); setDraft(""); setMode("reply");
    const [d, m, n] = await Promise.all([teamInboxApi.detail(id), teamInboxApi.messages(id), teamInboxApi.notes(id)]);
    if (activeRef.current !== id) return;
    if (d.success && d.data) setDetail(d.data); else toast({ title: d.message || T.failed, variant: "destructive" });
    if (m.success && m.data) { setMessages(m.data.results); setHasMore(m.data.has_more); }
    if (n.success && n.data) setNotes(n.data.results);
    void teamInboxApi.markRead(id).then(() => { void loadList(1); });
  }, [T.failed, loadList, toast]);

  // Keep the newest message in view.
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, activeId]);

  // The change feed: ask what happened since the last event we saw, and refresh only what it names. After a lost connection the next ask
  // simply catches up, so nothing is missed and nothing is shown twice.
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (stopped || document.hidden) return;
      try {
        if (lastEvent.current === null) {
          const first = await teamInboxApi.events();
          if (first.success && first.data) { lastEvent.current = first.data.last_id; setReconnecting(false); } else setReconnecting(true);
          return;
        }
        const res = await teamInboxApi.events(lastEvent.current);
        if (!res.success || !res.data) { setReconnecting(true); return; }
        setReconnecting(false);
        const { events, last_id } = res.data;
        lastEvent.current = last_id;
        if (events.length) {
          void loadCounts();
          void loadList(1);
          const id = activeRef.current;
          if (id && events.some((e) => e.thread_id === id)) { void refreshActive(id); void teamInboxApi.notes(id).then((n) => { if (n.success && n.data) setNotes(n.data.results); }); }
        } else if (activeRef.current) {
          const d = await teamInboxApi.detail(activeRef.current); // typing indicators are not events
          if (d.success && d.data && activeRef.current === d.data.thread.id) setDetail(d.data);
        }
      } catch { setReconnecting(true); }
    };
    const handle = window.setInterval(() => void tick(), POLL_MS);
    const onVisible = () => { if (!document.hidden) void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    void tick();
    return () => { stopped = true; window.clearInterval(handle); document.removeEventListener("visibilitychange", onVisible); };
  }, [loadCounts, loadList, refreshActive]);

  const loadOlder = async () => {
    if (!activeId || !messages.length) return;
    const res = await teamInboxApi.messages(activeId, messages[0].created_at);
    if (res.success && res.data) { mergeMessages(res.data.results); setHasMore(res.data.has_more); }
  };

  const fail = (res: { message?: string; errors?: unknown } & Parameters<typeof errorCode>[0]) => {
    toast({ title: res.status === 403 ? T.forbidden : res.message || T.failed, variant: "destructive" });
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    if (mode === "note") {
      const res = await teamInboxApi.addNote(activeId, text);
      setSending(false);
      if (res.success && res.data) { setNotes((p) => [...p, res.data!.note]); setDraft(""); } else fail(res);
      return;
    }
    const clientToken = token();
    const local: InboxMessage = { id: `local-${clientToken}`, direction: "out", kind: "text", text, status: "pending", error: "", sent_by: null, created_at: new Date().toISOString(), client_token: clientToken };
    setMessages((p) => [...p, local]);
    setDraft("");
    const res = await teamInboxApi.send(activeId, text, clientToken);
    setSending(false);
    const sent = (res.data as { message?: InboxMessage } | undefined)?.message ?? (res.errors as unknown as { message?: InboxMessage } | null)?.message;
    if (sent) {
      mergeMessages([sent]);
      if (res.data?.warning) toast({ title: T.recent(res.data.warning.name) });
      if (!res.success) toast({ title: (res.errors as unknown as { error?: string })?.error || res.message || T.failed, variant: "destructive" });
    } else {
      // The server never answered with a record: show the attempt as not sent, with the reason, so it is never mistaken for delivered.
      setMessages((p) => p.map((m) => (m.id === local.id ? { ...m, status: "failed", error: errorCode(res) === "window_closed" ? T.window : res.message || T.failed } : m)));
      if (errorCode(res) === "window_closed") void refreshActive(activeId);
    }
    void loadList(1);
  };

  const retry = async (m: InboxMessage) => {
    if (!activeId) return;
    if (m.id.startsWith("local-")) { setMessages((p) => p.filter((x) => x.id !== m.id)); setDraft(m.text); return; }
    const res = await teamInboxApi.retry(activeId, m.id);
    const sent = (res.data as { message?: InboxMessage } | undefined)?.message ?? (res.errors as unknown as { message?: InboxMessage } | null)?.message;
    if (sent) mergeMessages([sent]);
    if (!res.success) fail(res);
  };

  const change = async (run: Promise<{ success?: boolean; data?: { thread: InboxThread }; message?: string; status: number }>, ok: string) => {
    const res = await run;
    if (res.success && res.data) { toast({ title: ok }); if (activeId) await refreshActive(activeId); void loadList(1); void loadCounts(); } else fail(res as Parameters<typeof fail>[0]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };
  const onDraft = (value: string) => {
    setDraft(value);
    if (mode === "reply" && activeId && value && Date.now() - typingSent.current > 4000) { typingSent.current = Date.now(); void teamInboxApi.typing(activeId); }
  };

  const active = detail?.thread;
  const perms = detail?.permissions;
  const canWrite = mode === "note" ? !!perms?.can_note : !!perms?.can_reply && !!active?.window_open;
  const navItems: Array<{ key: InboxView | ThreadStatus; text: string; n?: number }> = [
    { key: "all", text: T.all, n: counts?.all }, { key: "mine", text: T.mine, n: counts?.mine }, { key: "unassigned", text: T.unassigned, n: counts?.unassigned },
    { key: "open", text: T.open, n: counts?.open }, { key: "pending", text: T.pending, n: counts?.pending }, { key: "resolved", text: T.resolved, n: counts?.resolved },
    { key: "archived", text: T.archived, n: counts?.archived },
  ];

  const renderNav = (horizontal: boolean) => (
    <nav className={horizontal ? "flex shrink-0 gap-1.5 overflow-x-auto border-b px-2 py-2" : "flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-2"} aria-label={T.title}>
      {navItems.map((i) => (
        <button key={i.key} type="button" onClick={() => setView(i.key)}
          className={`flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${view === i.key ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>
          <span className="whitespace-nowrap">{i.text}</span>
          {typeof i.n === "number" && i.n > 0 && <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{i.n}</span>}
        </button>
      ))}
    </nav>
  );

  const list = (
    <section className={`flex min-h-0 flex-col border-r ${!split ? "w-full flex-1" : width < 900 ? "w-64 shrink-0" : "w-80 shrink-0"}`}>
      <div className="relative border-b p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T.search} className="h-9 pl-8" aria-label={T.search} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {listState === "loading" && <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{T.loading}</p>}
        {listState === "denied" && <p className="p-4 text-sm text-muted-foreground">{T.noAccess}</p>}
        {listState === "error" && (
          <div className="space-y-2 p-4 text-sm"><p className="text-destructive">{T.failed}</p><Button size="sm" variant="outline" onClick={() => { setListState("loading"); void loadList(1); }}><RefreshCw className="mr-1 h-3.5 w-3.5" />{T.retryLoad}</Button></div>
        )}
        {listState === "ok" && threads.length === 0 && <p className="p-4 text-sm text-muted-foreground">{debounced ? T.noResults : T.empty}</p>}
        {threads.map((t) => (
          <button key={t.id} type="button" onClick={() => void open(t.id)}
            className={`flex w-full gap-3 border-b px-3 py-3 text-left hover:bg-muted/60 ${activeId === t.id ? "bg-muted" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(label(t))}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${t.unread ? "font-semibold" : "font-medium"}`}>{label(t)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{clock(t.last_message_at)}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">{t.last_direction === "out" ? `${T.you}: ` : ""}{t.last_preview}</span>
                {t.unread > 0 && <span className="shrink-0 rounded-full bg-primary px-1.5 text-xs text-primary-foreground" aria-label={T.unread}>{t.unread}</span>}
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] ${STATUS_TONE[t.status]}`}>{T[t.status]}</Badge>
                <span className="truncate text-[11px] text-muted-foreground">{t.assigned_to ? t.assigned_to.name : T.unassignedLabel}</span>
              </span>
            </span>
          </button>
        ))}
        {listState === "ok" && threads.length < total && <div className="p-3"><Button size="sm" variant="outline" className="w-full" onClick={() => void loadList(page + 1, true)}>{T.loadMore}</Button></div>}
      </div>
    </section>
  );

  const bubble = (m: InboxMessage) => {
    const mine = m.direction === "out";
    return (
      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"} ${m.status === "failed" ? "ring-2 ring-destructive" : ""}`}>
          {mine && m.sent_by && <p className="mb-0.5 text-[11px] opacity-80">{m.sent_by.name}</p>}
          {m.has_media && activeId && <MessageMedia threadId={activeId} message={m} failed={T.mediaFailed} loading={T.mediaLoading} />}
          {!(m.has_media && /^\[[A-Za-z ]+\]$/.test(m.text)) && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
          <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
            {clock(m.created_at)} {mine && <Ticks status={m.status} />}
          </p>
          {m.status === "failed" && (
            <p className="mt-1 flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 break-words">{T.failedSend}{m.error ? `: ${m.error}` : ""}</span>
              <button type="button" className="font-semibold underline" onClick={() => void retry(m)}>{T.retry}</button>
            </p>
          )}
        </div>
      </div>
    );
  };

  const conversation = (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!active ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          {activeId ? <Loader2 className="h-5 w-5 animate-spin" /> : <><MessageSquare className="h-8 w-8" /><p>{T.pick}</p></>}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
            {isMobile && <Button variant="ghost" size="icon" onClick={() => { setActiveId(null); setDetail(null); }} aria-label={T.back}><ArrowLeft className="h-4 w-4" /></Button>}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(label(active))}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{label(active)}</p><p className="truncate text-xs text-muted-foreground">+{active.customer_phone}</p></div>
            {perms?.can_claim && !active.assigned_to && (
              <Button size="sm" variant="outline" onClick={() => void change(teamInboxApi.claim(active.id), T.claimed)}><UserCheck className="mr-1 h-3.5 w-3.5" />{T.claim}</Button>
            )}
            {perms?.can_assign && (
              <Select value={active.assigned_to?.id ?? "none"} onValueChange={(v) => void change(teamInboxApi.assign(active.id, v === "none" ? null : v), T.assignedOk)}>
                <SelectTrigger className="h-8 w-40 text-xs" aria-label={T.assign}><SelectValue placeholder={T.assign} /></SelectTrigger>
                <SelectContent><SelectItem value="none">{T.unassignedLabel}</SelectItem>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {!perms?.can_assign && active.assigned_to && <span className="text-xs text-muted-foreground">{T.assignedTo}: {active.assigned_to.name}</span>}
            <Select value={active.status} disabled={!perms?.can_change_status} onValueChange={(v) => void change(teamInboxApi.setStatus(active.id, v as ThreadStatus), T.statusOk)}>
              <SelectTrigger className="h-8 w-32 text-xs" aria-label={T.status}><SelectValue /></SelectTrigger>
              <SelectContent>{(["open", "pending", "resolved", "archived"] as ThreadStatus[]).map((s) => <SelectItem key={s} value={s}>{T[s]}</SelectItem>)}</SelectContent>
            </Select>
          </header>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {hasMore && <div className="text-center"><Button size="sm" variant="ghost" onClick={() => void loadOlder()}>{T.older}</Button></div>}
            {messages.map(bubble)}
            {notes.length > 0 && (
              <div className="space-y-1.5 border-t pt-2">
                <p className="text-xs font-medium text-amber-800">{T.notes}</p>
                {notes.map((n) => (
                  <div key={n.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    <p className="whitespace-pre-wrap break-words">{n.body}</p>
                    <p className="mt-1 text-[11px] text-amber-800">{n.author?.name} · {clock(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <footer className="space-y-1.5 border-t p-2">
            {detail?.typing && detail.typing.length > 0 && <p className="px-1 text-xs italic text-muted-foreground">{T.typing(detail.typing.join(", "))}</p>}
            {detail?.recent_reply && mode === "reply" && <p className="flex items-center gap-1 px-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{T.recent(detail.recent_reply.name)}</p>}
            {mode === "reply" && !active.window_open && <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">{T.window}</p>}
            {mode === "reply" && perms && !perms.can_reply && <p className="rounded-md bg-muted p-2 text-xs">{T.noReply}</p>}
            <div className="flex gap-1">
              <Button size="sm" variant={mode === "reply" ? "default" : "ghost"} onClick={() => setMode("reply")}><MessageSquare className="mr-1 h-3.5 w-3.5" />{T.reply}</Button>
              {perms?.can_note && <Button size="sm" variant={mode === "note" ? "secondary" : "ghost"} onClick={() => setMode("note")}><StickyNote className="mr-1 h-3.5 w-3.5" />{T.note}</Button>}
            </div>
            <div className="flex items-end gap-2">
              <Textarea value={draft} onChange={(e) => onDraft(e.target.value)} onKeyDown={onKey} rows={2} disabled={!canWrite}
                placeholder={mode === "note" ? T.notePlaceholder : T.replyPlaceholder} maxLength={4096}
                className={`min-h-[44px] flex-1 resize-none ${mode === "note" ? "border-amber-300 bg-amber-50" : ""}`} aria-label={mode === "note" ? T.note : T.reply} />
              <Button onClick={() => void send()} disabled={!canWrite || sending || !draft.trim()} aria-label={mode === "note" ? T.addNote : T.send}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "note" ? <StickyNote className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </footer>
        </>
      )}
    </section>
  );

  const contactPanel = active && panel && (
    <aside className="w-64 shrink-0 space-y-3 overflow-y-auto border-l p-3 text-sm">
      <p className="font-semibold">{T.contact}</p>
      <div className="space-y-1">
        <p className="font-medium">{label(active)}</p>
        <p className="text-muted-foreground">+{active.customer_phone}</p>
        {detail?.contact?.email && <p className="break-all text-muted-foreground">{detail.contact.email}</p>}
        {detail?.contact?.tags?.length ? <p className="flex flex-wrap gap-1">{detail.contact.tags.map((g) => <Badge key={g} variant="outline">{g}</Badge>)}</p> : null}
        {!detail?.contact && <p className="text-xs text-muted-foreground">{T.noContact}</p>}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{T.assignedTo}</p>
        <p>{active.assigned_to?.name ?? T.unassignedLabel}</p>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        {reconnecting && <p className="flex items-center justify-center gap-2 bg-amber-100 py-1 text-xs text-amber-900"><Loader2 className="h-3 w-3 animate-spin" />{T.reconnecting}</p>}
        <div ref={wrapRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!rail && (split || !activeId) && renderNav(true)}
          <div className="flex min-h-0 min-w-0 flex-1">
            {rail && renderNav(false)}
            {(split || !activeId) && list}
            {(split || activeId) && conversation}
            {contactPanel}
          </div>
        </div>
        <h1 className="sr-only"><Inbox />{T.title}</h1>
      </div>
    </div>
  );
};

export default TeamInbox;

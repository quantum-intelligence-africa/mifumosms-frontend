// SENDA Team Inbox: one connected WhatsApp number, one shared inbox, many employees. Everything shown comes from the server (no sample data);
// the server decides what each signed-in employee may see and do, the buttons here only reflect that.
import { SendPanel } from "@/components/team-inbox/SendPanel";
import { tr } from "@/i18n/waCampaigns";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, CheckCheck, FileText, Inbox, LayoutTemplate, Plus, Loader2, MessageSquare, Paperclip, Phone, RefreshCw, Reply, Search, Send, StickyNote, UserCheck, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { CallButton } from "@/components/whatsapp-calls/CallButton";
import { CallsPanel } from "@/components/whatsapp-calls/CallsPanel";
import { useWhatsAppCalling } from "@/contexts/WhatsAppCallingContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { appLanguage } from "@/utils/appLocale";
import { EmojiPicker } from "@/components/team-inbox/EmojiPicker";
import { MessageMedia } from "@/components/team-inbox/MessageMedia";
import { ReactionChips, ReactionPicker } from "@/components/team-inbox/Reactions";
import { TemplatePicker } from "@/components/team-inbox/TemplatePicker";
import { VoiceRecorder } from "@/components/team-inbox/VoiceRecorder";
import { ACCEPT, CAPTION_KINDS, LIMIT_MB, MAX_FILES, checkFile, type FileKind } from "@/components/team-inbox/attachments";
import { dayLabel, fileSize, isEmojiOnly, linkify, sameDay } from "@/components/team-inbox/format";
import {
  errorCode, teamInboxApi, type Counts, type InboxMessage, type InboxNote, type InboxThread, type InboxView, type Person, type ThreadDetail, type ThreadStatus,
} from "@/services/teamInboxApi";

const TEXT = {
  sw: {
    title: "Sanduku la Timu", chats: "Mazungumzo", calls: "Simu", replyTo: "Jibu ujumbe huu", replyingTo: "Unajibu", cancelReply: "Ghairi jibu", original: "Ujumbe wa awali", all: "Mazungumzo yote", mine: "Yangu", unassigned: "Hayajapewa mtu", open: "Wazi", pending: "Yanasubiri", resolved: "Yamekamilika", archived: "Yaliyohifadhiwa",
    search: "Tafuta jina, namba au ujumbe", empty: "Hakuna mazungumzo hapa bado.", noResults: "Hakuna matokeo ya utafutaji huu.", pick: "Chagua mazungumzo kuanza.",
    loading: "Inapakia...", failed: "Imeshindikana kupakia. Jaribu tena.", retryLoad: "Jaribu tena", loadMore: "Pakia zaidi", older: "Ujumbe wa zamani",
    reply: "Jibu", note: "Dokezo la ndani", replyPlaceholder: "Andika jibu kwa mteja (Enter kutuma, Shift+Enter mstari mpya)", notePlaceholder: "Dokezo hili linaonekana na timu pekee, halitumwi kwa mteja",
    send: "Tuma", addNote: "Hifadhi dokezo", sending: "Inatuma...", failedSend: "Haikutumwa", retry: "Jaribu tena", unassignedLabel: "Hajapewa mtu", assignedTo: "Amepewa", claim: "Chukua",
    assign: "Mpe mtu", status: "Hali", typing: (n: string) => `${n} anaandika...`, recent: (n: string) => `${n} amejibu sasa hivi. Hakikisha hamjibu kitu kimoja.`,
    window: "Zaidi ya saa 24 zimepita tangu mteja aandike mara ya mwisho. WhatsApp inaruhusu ujumbe wa kiolezo kilichoidhinishwa pekee sasa.",
    noReply: "Huna ruhusa ya kujibu mazungumzo haya.", contact: "Taarifa za mteja", noContact: "Hakuna taarifa zaidi za mteja zilizohifadhiwa.", notes: "Madokezo ya ndani", noNotes: "Hakuna madokezo.",
    reconnecting: "Inaunganisha upya...", live: "Moja kwa moja", you: "Wewe", unread: "Hayajasomwa", forbidden: "Huna ruhusa.", claimed: "Mazungumzo yamechukuliwa.", assignedOk: "Mazungumzo yamepewa.", statusOk: "Hali imebadilishwa.",
    noAccess: "Akaunti yako haina ufikiaji wa sanduku hili.", back: "Rudi", fromPhone: "Imetumwa kwa simu", chatbot: "Roboti ya mazungumzo", mediaLoading: "Inapakia faili...", mediaFailed: "Faili hii haiwezi kupakiwa sasa.",
    today: "Leo", yesterday: "Jana", attach: "Ambatisha faili", emoji: "Emoji", photo: "Picha", video: "Video", audio: "Sauti", document: "Hati", tapToLoad: "Bonyeza kufungua",
    dropHere: "Dondosha faili hapa kuzituma", fileType: "WhatsApp inapokea picha (JPG, PNG), video (MP4), sauti (MP3, M4A, AAC, AMR, OGG) na hati (PDF, Word, Excel, PowerPoint, TXT).",
    fileSize: (mb: number) => `Faili hii ni kubwa mno. Kikomo ni ${mb} MB.`, fileEmpty: "Faili hii ni tupu.", tooManyFiles: `Unaweza kutuma hadi faili ${MAX_FILES} kwa mara moja.`,
    removeFile: "Ondoa faili", captionPlaceholder: "Ongeza maelezo (si lazima) kisha tuma", sendFiles: "Tuma faili", notSentFile: "Haikutumwa. Ambatisha tena.",
    template: "Tuma kiolezo", replyShort: "Andika ujumbe", react: "Weka hisia", removeReaction: "Ondoa", templateTag: "Kiolezo", reactFailed: "Hisia haikutumwa.",
  },
  en: {
    title: "Team Inbox", chats: "Chats", calls: "Calls", replyTo: "Reply to this message", replyingTo: "Replying to", cancelReply: "Cancel reply", original: "Original message", all: "All conversations", mine: "My conversations", unassigned: "Unassigned", open: "Open", pending: "Pending", resolved: "Resolved", archived: "Archived",
    search: "Search name, number or message", empty: "No conversations here yet.", noResults: "No results for this search.", pick: "Select a conversation to start.",
    loading: "Loading...", failed: "Could not load. Try again.", retryLoad: "Try again", loadMore: "Load more", older: "Older messages",
    reply: "Reply", note: "Internal note", replyPlaceholder: "Write a reply to the customer (Enter to send, Shift+Enter for a new line)", notePlaceholder: "Only your team sees this note. It is never sent to the customer",
    send: "Send", addNote: "Save note", sending: "Sending...", failedSend: "Not sent", retry: "Retry", unassignedLabel: "Unassigned", assignedTo: "Assigned to", claim: "Claim",
    assign: "Assign to", status: "Status", typing: (n: string) => `${n} is typing...`, recent: (n: string) => `${n} just replied. Make sure you are not answering the same thing.`,
    window: "More than 24 hours have passed since the customer last wrote. WhatsApp only allows an approved template message now.",
    noReply: "You do not have permission to reply to this conversation.", contact: "Customer", noContact: "No further customer details are saved.", notes: "Internal notes", noNotes: "No notes yet.",
    reconnecting: "Reconnecting...", live: "Live", you: "You", unread: "Unread", forbidden: "You do not have permission.", claimed: "Conversation claimed.", assignedOk: "Conversation assigned.", statusOk: "Status changed.",
    noAccess: "Your account does not have access to this inbox.", back: "Back", fromPhone: "Sent from the phone", chatbot: "Chatbot", mediaLoading: "Loading file...", mediaFailed: "This file cannot be loaded right now.",
    today: "Today", yesterday: "Yesterday", attach: "Attach a file", emoji: "Emoji", photo: "Photo", video: "Video", audio: "Audio", document: "Document", tapToLoad: "Tap to open",
    dropHere: "Drop files here to send them", fileType: "WhatsApp accepts photos (JPG, PNG), video (MP4), audio (MP3, M4A, AAC, AMR, OGG) and documents (PDF, Word, Excel, PowerPoint, TXT).",
    fileSize: (mb: number) => `This file is too large. The limit is ${mb} MB.`, fileEmpty: "This file is empty.", tooManyFiles: `You can send up to ${MAX_FILES} files at once.`,
    removeFile: "Remove file", captionPlaceholder: "Add a caption (optional), then send", sendFiles: "Send files", notSentFile: "Not sent. Attach it again.",
    template: "Send a template", replyShort: "Type a message", react: "React", removeReaction: "Remove", templateTag: "Template", reactFailed: "The reaction was not sent.",
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
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-[#667781] dark:text-[#8696a0]" />;
  if (status === "sent") return <Check className="h-3.5 w-3.5 text-[#667781] dark:text-[#8696a0]" />;
  if (status === "pending") return <Loader2 className="h-3.5 w-3.5 animate-spin text-[#667781] dark:text-[#8696a0]" />;
  return null;
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

  const calling = useWhatsAppCalling();
  const location = useLocation();
  const navigate = useNavigate();
  const [section, setSection] = useState<"chats" | "calls" | "send">("chats");
  const [view, setView] = useState<InboxView | ThreadStatus>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [listState, setListState] = useState<"loading" | "ok" | "error" | "denied">("loading");
  const [reconnecting, setReconnecting] = useState(false);
  const [lastOk, setLastOk] = useState<Date | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [members, setMembers] = useState<Array<Person & { role: string }>>([]);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [replyingTo, setReplyingTo] = useState<InboxMessage | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Files chosen but not sent yet, previews of files being (or just) sent, and the drag-and-drop highlight.
  type PendingFile = { id: string; file: File; kind: FileKind; previewUrl: string };
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);
  const localFiles = useRef<Map<string, PendingFile>>(new Map());
  const releaseUrls = () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); urlsRef.current = []; localFiles.current.clear(); };
  useEffect(() => releaseUrls, []);

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
    releaseUrls(); setFiles([]); setDetail(null); setMessages([]); setNotes([]); setHasMore(false); setDraft(""); setMode("reply"); setReplyingTo(null);
    const [d, m, n] = await Promise.all([teamInboxApi.detail(id), teamInboxApi.messages(id), teamInboxApi.notes(id)]);
    if (activeRef.current !== id) return;
    if (d.success && d.data) setDetail(d.data); else toast({ title: d.message || T.failed, variant: "destructive" });
    if (m.success && m.data) { setMessages(m.data.results); setHasMore(m.data.has_more); }
    if (n.success && n.data) setNotes(n.data.results);
    void teamInboxApi.markRead(id).then(() => { void loadList(1); });
  }, [T.failed, loadList, toast]);

  // A link such as /conversations?thread=<id> (from a call card or the Calls tab) opens that conversation.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("thread");
    if (!id) return;
    setSection("chats");
    void open(id);
    navigate(location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Keep the newest message in view.
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, activeId]);

  // The change feed: ask what happened since the last event we saw, and refresh only what it names. After a lost connection the next ask
  // simply catches up, so nothing is missed and nothing is shown twice.
  useEffect(() => {
    let stopped = false;
    let failures = 0;
    let wait = 0;
    const healAfterOutage = () => {
      // Events may have come and gone while the connection was down: re-read everything on screen instead of waiting for the next event.
      void loadCounts();
      void loadList(1);
      if (activeRef.current) void refreshActive(activeRef.current);
    };
    const failed = () => { failures += 1; wait = Math.min(failures, 4); setReconnecting(true); };  // ask less often while the server is struggling
    const ok = () => {
      setReconnecting(false);
      setLastOk(new Date());
      if (failures > 0) { failures = 0; wait = 0; healAfterOutage(); }
    };
    const tick = async () => {
      if (stopped || document.hidden) return;
      if (wait > 0) { wait -= 1; return; }
      try {
        if (lastEvent.current === null) {
          const first = await teamInboxApi.events();
          if (first.success && first.data) { lastEvent.current = first.data.last_id; ok(); } else failed();
          return;
        }
        const res = await teamInboxApi.events(lastEvent.current);
        if (!res.success || !res.data) { failed(); return; }
        ok();
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
      } catch { failed(); }
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

  /** Send the typed text as a normal message (optionally quoting one). Shown at once as "sending", then settled by the server's answer. */
  const sendText = async (text: string, quoted: InboxMessage | null) => {
    if (!activeId) return;
    const clientToken = token();
    const local: InboxMessage = {
      id: `local-${clientToken}`, direction: "out", kind: "text", text, status: "pending", error: "", sent_by: null, created_at: new Date().toISOString(), client_token: clientToken,
      reply_to: quoted ? { id: quoted.id, direction: quoted.direction, kind: quoted.kind, text: quoted.text.slice(0, 140), author: quoted.sent_by?.name ?? "" } : null,
    };
    setMessages((p) => [...p, local]);
    const res = await teamInboxApi.send(activeId, text, clientToken, quoted?.id);
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
  };

  /** Send the chosen files one after another (WhatsApp takes one file per message). The caption rides on the first photo or video; when
   *  none of the files can carry one (audio, documents) it goes as its own message after them. */
  const sendFiles = async (caption: string, queue: PendingFile[] = files) => {
    if (!activeId) return;
    const threadId = activeId;
    const quoted = replyingTo;
    if (queue === files) { setFiles([]); setDraft(""); }  // a recorded voice note leaves the typed text and the chosen files alone
    setReplyingTo(null);
    const captionIndex = caption ? queue.findIndex((f) => CAPTION_KINDS.includes(f.kind)) : -1;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const clientToken = token();
      const localId = `local-${clientToken}`;
      const text = i === captionIndex ? caption : "";
      localFiles.current.set(localId, item);
      setMessages((p) => [...p, {
        id: localId, direction: "out", kind: item.kind, has_media: true, local_url: item.previewUrl, progress: 0, status: "pending", error: "", sent_by: null,
        text: item.kind === "document" ? item.file.name : text || `[${item.kind[0].toUpperCase()}${item.kind.slice(1)}]`, created_at: new Date().toISOString(), client_token: clientToken,
        reply_to: i === 0 && quoted ? { id: quoted.id, direction: quoted.direction, kind: quoted.kind, text: quoted.text.slice(0, 140), author: quoted.sent_by?.name ?? "" } : null,
      }]);
      const res = await teamInboxApi.sendAttachment(threadId, item.file, {
        caption: text || undefined, clientToken, replyTo: i === 0 ? quoted?.id : undefined,
        onProgress: (percent) => setMessages((p) => p.map((m) => (m.id === localId ? { ...m, progress: percent } : m))),
      });
      const sent = (res.data as { message?: InboxMessage } | undefined)?.message ?? (res.errors as unknown as { message?: InboxMessage } | null)?.message;
      if (sent) {
        localFiles.current.delete(localId);
        mergeMessages([{ ...sent, local_url: item.previewUrl }]);
        if (res.data?.warning) toast({ title: T.recent(res.data.warning.name) });
        if (!res.success) toast({ title: (res.errors as unknown as { error?: string })?.error || res.message || T.failed, variant: "destructive" });
      } else {
        const code = errorCode(res);
        setMessages((p) => p.map((m) => (m.id === localId ? { ...m, status: "failed", progress: undefined, error: code === "window_closed" ? T.window : res.message || T.failed } : m)));
        if (code === "window_closed") void refreshActive(threadId);
      }
    }
    if (caption && captionIndex < 0) await sendText(caption, null);
    void loadList(1);
  };

  const send = async () => {
    const text = draft.trim();
    if (!activeId || sending) return;
    if (mode === "reply" && files.length) {
      setSending(true);
      await sendFiles(text);
      setSending(false);
      return;
    }
    if (!text) return;
    setSending(true);
    if (mode === "note") {
      const res = await teamInboxApi.addNote(activeId, text);
      setSending(false);
      if (res.success && res.data) { setNotes((p) => [...p, res.data!.note]); setDraft(""); } else fail(res);
      return;
    }
    const quoted = replyingTo;
    setDraft("");
    setReplyingTo(null);
    await sendText(text, quoted);
    setSending(false);
    void loadList(1);
  };

  /** A finished voice note goes out at once, as an audio message (the server converts the browser's format when WhatsApp needs another). */
  const sendVoice = async (file: File) => {
    if (!activeId || sending) return;
    const previewUrl = URL.createObjectURL(file);
    urlsRef.current.push(previewUrl);
    setSending(true);
    await sendFiles("", [{ id: token(), file, kind: "audio", previewUrl }]);
    setSending(false);
  };

  const react = async (m: InboxMessage, emoji: string) => {
    if (!activeId) return;
    const res = await teamInboxApi.react(activeId, m.id, emoji);
    const updated = (res.data as { message?: InboxMessage } | undefined)?.message;
    if (res.success && updated) { mergeMessages([updated]); return; }
    const code = errorCode(res);
    toast({ title: code === "window_closed" ? T.window : res.message || T.reactFailed, variant: "destructive" });
    if (code === "window_closed") void refreshActive(activeId);
  };

  const templateSent = (message: InboxMessage, warning: { name: string; at: string } | null, error?: string) => {
    mergeMessages([message]);
    if (warning) toast({ title: T.recent(warning.name) });
    if (error) toast({ title: error, variant: "destructive" });
    if (activeId) void refreshActive(activeId);
    void loadList(1);
  };

  const retry = async (m: InboxMessage) => {
    if (!activeId) return;
    if (m.id.startsWith("local-")) {
      setMessages((p) => p.filter((x) => x.id !== m.id));
      const file = localFiles.current.get(m.id);
      if (file) { localFiles.current.delete(m.id); setFiles((p) => [...p, file]); return; }  // a file that never reached WhatsApp goes back to be sent again
      setDraft(m.text);
      return;
    }
    const res = await teamInboxApi.retry(activeId, m.id);
    const sent = (res.data as { message?: InboxMessage } | undefined)?.message ?? (res.errors as unknown as { message?: InboxMessage } | null)?.message;
    if (sent) mergeMessages([sent]);
    if (!res.success) fail(res);
  };

  /** Queue files from the file picker, a paste, or a drop. Wrong types and sizes are refused here with the reason, before any upload. */
  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length || mode !== "reply") return;
    const room = Math.max(MAX_FILES - files.length, 0);
    const accepted: PendingFile[] = [];
    for (const file of incoming.slice(0, room)) {
      const check = checkFile(file);
      if (check.error || !check.kind) {
        toast({ title: file.name, description: check.error === "size" ? T.fileSize(LIMIT_MB[check.kind as FileKind]) : check.error === "empty" ? T.fileEmpty : T.fileType, variant: "destructive" });
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.push(previewUrl);
      accepted.push({ id: token(), file, kind: check.kind, previewUrl });
    }
    if (incoming.length > room) toast({ title: T.tooManyFiles });
    if (accepted.length) setFiles((p) => [...p, ...accepted]);
  };

  // The message field grows with what is typed (up to a few lines), like WhatsApp.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [draft]);

  const insertEmoji = (emoji: string) => {
    const el = composerRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    window.requestAnimationFrame(() => { el?.focus(); const pos = start + emoji.length; el?.setSelectionRange(pos, pos); });
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(e.clipboardData?.files ?? []);
    if (pasted.length && mode === "reply" && canWrite) { e.preventDefault(); addFiles(pasted); }
  };

  const change = async (run: Promise<{ success?: boolean; data?: { thread: InboxThread }; message?: string; status: number }>, ok: string) => {
    const res = await run;
    if (res.success && res.data) { toast({ title: ok }); if (activeId) await refreshActive(activeId); void loadList(1); void loadCounts(); } else fail(res as Parameters<typeof fail>[0]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && replyingTo) { setReplyingTo(null); e.stopPropagation(); return; }  // the first Esc only cancels the reply
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };
  // Esc leaves the open conversation and returns to the list, as in WhatsApp Web. It does nothing while a menu or dialog is open (those use Esc
  // to close themselves) or while a voice note is being recorded.
  useEffect(() => {
    if (!activeId) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || recording) return;
      if (document.querySelector('[role="dialog"], [role="menu"], [data-radix-popper-content-wrapper]')) return;
      activeRef.current = null;
      setActiveId(null);
      setDetail(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [activeId, recording]);

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
    <nav className={horizontal ? "flex shrink-0 gap-1.5 overflow-x-auto border-b py-2 pl-2 pr-14 md:pr-2" : "flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-2"} aria-label={T.title}>
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
      <p className="flex items-center gap-1.5 border-b px-3 py-1 text-[11px] text-muted-foreground" aria-live="polite">
        <span className={`h-2 w-2 rounded-full ${reconnecting ? "bg-amber-500" : "bg-emerald-500"}`} />
        {reconnecting ? T.reconnecting : T.live}{lastOk ? ` · ${lastOk.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
      </p>
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
                {t.unread > 0 && <span className="shrink-0 rounded-full bg-[#00a884] px-1.5 text-xs font-medium text-white" aria-label={T.unread}>{t.unread}</span>}
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

  /** Scroll to the original message a reply quotes and flash it, as the normal WhatsApp app does. */
  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) { if (activeId) void refreshActive(activeId); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("bg-emerald-500/25");
    window.setTimeout(() => el.classList.remove("bg-emerald-500/25"), 1400);
  };

  const mediaText = { loading: T.mediaLoading, failed: T.mediaFailed, retry: T.retry, tapToLoad: T.tapToLoad, photo: T.photo, video: T.video, audio: T.audio, document: T.document };

  const bubble = (m: InboxMessage) => {
    const mine = m.direction === "out";
    if (m.kind === "call" || m.kind === "call_permission" || m.kind === "call_permission_request") {
      return (
        <div key={m.id} className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs text-[#54656f] shadow-sm dark:bg-[#202c33] dark:text-[#8696a0]"><Phone className="h-3 w-3" />{m.text} · {clock(m.created_at)}</span>
        </div>
      );
    }
    const canQuote = mode === "reply" && !!perms?.can_reply && !m.id.startsWith("local-") && m.status !== "failed";
    const who = (q: NonNullable<InboxMessage["reply_to"]>) => (q.direction === "in" ? label(active!) : q.author || T.fromPhone);
    const placeholder = /^\[[A-Za-z ]+\]$/.test(m.text);
    const showText = !!m.text && !(m.has_media && placeholder) && !(m.has_media && m.kind === "document");
    const big = !m.has_media && !m.reply_to && isEmojiOnly(m.text);
    const meta = "text-[#667781] dark:text-[#8696a0]";
    const myReaction = m.reactions?.find((r) => r.side === "business")?.emoji;
    const canReact = canQuote && !!active?.window_open && !m.id.startsWith("call:");
    return (
      <div key={m.id} id={`msg-${m.id}`} className={`group flex items-center gap-1 rounded-lg transition-colors ${mine ? "flex-row-reverse" : ""}`}>
        <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm ${mine ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]" : "rounded-tl-none bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]"} ${m.status === "failed" ? "ring-2 ring-red-500" : ""}`}>
          {mine && <p className="mb-0.5 text-[11px] font-semibold text-[#1f7a5a] dark:text-[#7fd8b8]">{m.sent_by ? m.sent_by.name : m.source === "chatbot" ? T.chatbot : T.fromPhone}</p>}
          {m.reply_to && (
            <button type="button" title={T.original} onClick={() => jumpTo(m.reply_to!.id)}
              className={`mb-1.5 block w-full rounded-md border-l-4 bg-black/5 px-2 py-1 text-left text-xs dark:bg-white/10 ${mine ? "border-[#1f7a5a] dark:border-[#7fd8b8]" : "border-[#027eb5] dark:border-[#53bdeb]"}`}>
              <span className={`block truncate font-semibold ${mine ? "text-[#1f7a5a] dark:text-[#7fd8b8]" : "text-[#027eb5] dark:text-[#53bdeb]"}`}>{who(m.reply_to)}</span>
              <span className="line-clamp-2 break-words opacity-80">{m.reply_to.text}</span>
            </button>
          )}
          {m.has_media && activeId && <MessageMedia threadId={activeId} message={m} text={mediaText} />}
          {m.progress !== undefined && m.status === "pending" && (
            <div className="mb-1 h-1 w-full overflow-hidden rounded bg-black/10 dark:bg-white/20" role="progressbar" aria-valuenow={m.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-1 rounded bg-[#00a884] transition-all" style={{ width: `${m.progress}%` }} />
            </div>
          )}
          {m.kind === "template" && <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[#667781] dark:text-[#8696a0]">{T.templateTag}{m.template ? ` · ${m.template}` : ""}</p>}
          {showText && <p className={`whitespace-pre-wrap break-words ${big ? "text-4xl leading-tight" : ""}`}>{big ? m.text : linkify(m.text)}</p>}
          <p className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${meta}`}>
            {clock(m.created_at)} {mine && <Ticks status={m.status} />}
          </p>
          {!!m.buttons?.length && (
            <div className="-mx-2.5 -mb-1.5 mt-1.5 divide-y divide-black/10 border-t border-black/10 dark:divide-white/15 dark:border-white/15">
              {m.buttons.map((b, i) => {
                const cls = "flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-center text-sm font-medium text-[#027eb5] dark:text-[#53bdeb]";
                return b.url ? (
                  <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-black/5 dark:hover:bg-white/10`}>{b.title}</a>
                ) : (
                  <span key={i} className={cls}><Reply className="h-3.5 w-3.5" />{b.title}</span>
                );
              })}
            </div>
          )}
          {m.status === "failed" && (
            <p className="mt-1 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 flex-1 break-words">{T.failedSend}{m.error ? `: ${m.error}` : ""}</span>
              <button type="button" className="font-semibold underline" onClick={() => void retry(m)}>{T.retry}</button>
            </p>
          )}
          <ReactionChips reactions={m.reactions} mine={mine} />
        </div>
        {canReact && <ReactionPicker current={myReaction} label={T.react} removeLabel={T.removeReaction} onPick={(emoji) => void react(m, emoji)} />}
        {canQuote && (
          <button type="button" aria-label={T.replyTo} title={T.replyTo} onClick={() => { setReplyingTo(m); composerRef.current?.focus(); }}
            className="shrink-0 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-black/5 focus:opacity-100 group-hover:opacity-100 sm:p-1.5 [@media(hover:none)]:opacity-100">
            <Reply className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const conversation = (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col"
      onDragOver={(e) => { if (mode === "reply" && canWrite && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setDragging(false); if (mode === "reply" && canWrite) addFiles(e.dataTransfer.files); } }}>
      {active && <TemplatePicker threadId={active.id} open={templatesOpen} onClose={() => setTemplatesOpen(false)} onSent={templateSent} />}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-[#00a884] bg-[#00a884]/10 text-sm font-medium text-[#1f7a5a]">
          <Paperclip className="mr-2 h-5 w-5" />{T.dropHere}
        </div>
      )}
      {!active ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          {activeId ? <Loader2 className="h-5 w-5 animate-spin" /> : <><MessageSquare className="h-8 w-8" /><p>{T.pick}</p></>}
        </div>
      ) : (
        <>
          <header className={`flex flex-wrap items-center gap-2 border-b py-2 pl-3 ${isMobile ? "pr-14" : "pr-3"}`}>
            {isMobile && <Button variant="ghost" size="icon" onClick={() => { setActiveId(null); setDetail(null); }} aria-label={T.back}><ArrowLeft className="h-4 w-4" /></Button>}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00a884]/15 text-xs font-semibold text-[#1f7a5a]">{initials(label(active))}</span>
            <div className="min-w-[8rem] flex-1"><p className="truncate text-sm font-semibold">{label(active)}</p><p className="truncate text-xs text-muted-foreground">+{active.customer_phone}</p></div>
            {calling.enabled && <CallButton threadId={active.id} name={label(active)} phone={active.customer_phone} windowOpen={active.window_open} />}
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

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#efeae2] px-3 py-3 dark:bg-[#0b141a]">
            {hasMore && <div className="text-center"><Button size="sm" variant="ghost" onClick={() => void loadOlder()}>{T.older}</Button></div>}
            {messages.map((m, i) => (
              <Fragment key={m.id}>
                {(i === 0 || !sameDay(messages[i - 1].created_at, m.created_at)) && (
                  <div className="flex justify-center py-1">
                    <span className="rounded-lg bg-white/90 px-3 py-0.5 text-xs font-medium text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#8696a0]">{dayLabel(m.created_at, T.today, T.yesterday)}</span>
                  </div>
                )}
                {bubble(m)}
              </Fragment>
            ))}
            {notes.length > 0 && (
              <div className="space-y-1.5 border-t border-black/10 pt-2">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{T.notes}</p>
                {notes.map((n) => (
                  <div key={n.id} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    <p className="whitespace-pre-wrap break-words">{n.body}</p>
                    <p className="mt-1 text-[11px] text-amber-800">{n.author?.name} · {clock(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <footer className="space-y-1.5 border-t bg-[#f0f2f5] p-2 dark:bg-[#202c33]" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            {detail?.typing && detail.typing.length > 0 && <p className="px-1 text-xs italic text-muted-foreground">{T.typing(detail.typing.join(", "))}</p>}
            {detail?.recent_reply && mode === "reply" && <p className="flex items-center gap-1 px-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{T.recent(detail.recent_reply.name)}</p>}
            {mode === "reply" && !active.window_open && (
              <p className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                <span className="min-w-0 flex-1">{T.window}</span>
                {perms?.can_reply && <Button size="sm" className="bg-[#00a884] text-white hover:bg-[#008f72]" onClick={() => setTemplatesOpen(true)}><LayoutTemplate className="mr-1 h-3.5 w-3.5" />{T.template}</Button>}
              </p>
            )}
            {mode === "reply" && perms && !perms.can_reply && <p className="rounded-md bg-muted p-2 text-xs">{T.noReply}</p>}
            <div className="flex gap-1">
              <Button size="sm" variant={mode === "reply" ? "default" : "ghost"} className={`h-7 rounded-full px-3 text-xs ${mode === "reply" ? "bg-[#00a884] text-white hover:bg-[#008f72]" : ""}`} onClick={() => setMode("reply")}><MessageSquare className="mr-1 h-3.5 w-3.5" />{T.reply}</Button>
              {perms?.can_note && <Button size="sm" variant={mode === "note" ? "secondary" : "ghost"} className="h-7 rounded-full px-3 text-xs" onClick={() => setMode("note")}><StickyNote className="mr-1 h-3.5 w-3.5" />{T.note}</Button>}
            </div>
            {replyingTo && mode === "reply" && (
              <div className="flex items-start gap-2 rounded-md border-l-4 border-[#00a884] bg-muted px-2 py-1.5 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1f7a5a]">{T.replyingTo} {replyingTo.direction === "in" ? label(active) : replyingTo.sent_by?.name || T.fromPhone}</p>
                  <p className="line-clamp-2 break-words text-muted-foreground">{replyingTo.text}</p>
                </div>
                <button type="button" aria-label={T.cancelReply} title={T.cancelReply} onClick={() => setReplyingTo(null)} className="rounded p-0.5 hover:bg-background"><X className="h-4 w-4" /></button>
              </div>
            )}
            {files.length > 0 && mode === "reply" && (
              <div className="flex gap-2 overflow-x-auto rounded-md border bg-muted/40 p-2" aria-label={T.attach}>
                {files.map((f) => (
                  <div key={f.id} className="relative flex w-28 shrink-0 flex-col items-center gap-1 rounded-md bg-background p-1.5 text-center text-[11px]">
                    {f.kind === "image" ? <img src={f.previewUrl} alt={f.file.name} className="h-16 w-full rounded object-cover" />
                      : <span className="flex h-16 w-full items-center justify-center rounded bg-muted"><FileText className="h-6 w-6 text-muted-foreground" /></span>}
                    <span className="w-full truncate font-medium" title={f.file.name}>{f.file.name}</span>
                    <span className="text-muted-foreground">{fileSize(f.file.size)}</span>
                    <button type="button" aria-label={`${T.removeFile}: ${f.file.name}`} title={T.removeFile}
                      onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))} className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background shadow"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
              {/* One rounded bar, as in WhatsApp: attach menu and emoji on the left, a text field that grows with what is typed, and on the right a
                  microphone that turns into the send button as soon as there is something to send. */}
              <div className={`flex min-w-0 flex-1 items-end gap-0.5 rounded-3xl px-1.5 py-1 ${recording ? "hidden" : ""} ${mode === "note" ? "bg-amber-50 ring-1 ring-amber-300" : "bg-white shadow-sm dark:bg-[#2a3942]"}`}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-[#54656f] hover:bg-black/5 dark:text-[#8696a0]" disabled={mode !== "reply" || sending || (!canWrite && !perms?.can_reply)} aria-label={T.attach} title={T.attach}><Plus className="h-6 w-6" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem disabled={!canWrite} onSelect={() => fileInputRef.current?.click()}><Paperclip className="mr-2 h-4 w-4" />{T.attach}</DropdownMenuItem>
                    {perms?.can_reply && <DropdownMenuItem onSelect={() => setTemplatesOpen(true)}><LayoutTemplate className="mr-2 h-4 w-4" />{T.template}</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
                <EmojiPicker onPick={insertEmoji} disabled={!canWrite} label={T.emoji} />
                <Textarea ref={composerRef} value={draft} onChange={(e) => onDraft(e.target.value)} onKeyDown={onKey} onPaste={onPaste} rows={1} disabled={!canWrite}
                  placeholder={mode === "note" ? T.notePlaceholder : files.length ? T.captionPlaceholder : T.replyShort} maxLength={4096}
                  className="max-h-36 min-h-[36px] min-w-0 flex-1 resize-none !border-0 bg-transparent px-2 py-2 !shadow-none placeholder:text-[#667781] focus-visible:!ring-0 focus-visible:!ring-offset-0"
                  aria-label={mode === "note" ? T.note : T.reply} />
              </div>
              {mode === "reply" && canWrite && files.length === 0 && (!draft.trim() || recording) ? (
                <VoiceRecorder disabled={sending} onBusyChange={setRecording} onRecorded={(f) => void sendVoice(f)} onNotice={(title) => toast({ title, variant: "destructive" })} />
              ) : (
                <Button onClick={() => void send()} disabled={!canWrite || sending || recording || (!draft.trim() && !(mode === "reply" && files.length > 0))} aria-label={mode === "note" ? T.addNote : files.length ? T.sendFiles : T.send}
                  className="h-11 w-11 shrink-0 rounded-full bg-[#00a884] p-0 text-white hover:bg-[#008f72] disabled:bg-[#00a884]/40">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "note" ? <StickyNote className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </Button>
              )}
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
          <div className="flex shrink-0 gap-1 border-b px-2" role="tablist" aria-label={T.title}>
            {((calling.enabled ? ["chats", "calls", "send"] : ["chats", "send"]) as Array<"chats" | "calls" | "send">).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={section === k} onClick={() => setSection(k)}
                className={`px-3 py-2 text-sm ${section === k ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}>
                {k === "chats" ? T.chats : k === "calls" ? T.calls : tr("Send a message")}
              </button>
            ))}
          </div>
          {section === "send" ? (
            <SendPanel onOpenThread={(id) => { setSection("chats"); void open(id); }} />
          ) : section === "calls" && calling.enabled ? (
            <CallsPanel canSeeTeam={!!calling.live?.me.is_manager}
              onOpenThread={(id) => { setSection("chats"); void open(id); }} />
          ) : (
            <>
              {!rail && (split || !activeId) && renderNav(true)}
              <div className="flex min-h-0 min-w-0 flex-1">
                {rail && renderNav(false)}
                {(split || !activeId) && list}
                {(split || activeId) && conversation}
                {contactPanel}
              </div>
            </>
          )}
        </div>
        <h1 className="sr-only"><Inbox />{T.title}</h1>
      </div>
    </div>
  );
};

export default TeamInbox;

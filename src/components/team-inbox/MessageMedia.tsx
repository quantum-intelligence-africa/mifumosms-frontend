// The picture / video / voice note / document in a message. WhatsApp keeps the file, so it is fetched through our server (which checks the agent
// may see this conversation). Pictures load as the message appears; video, audio and documents load only when tapped, so opening a busy
// conversation on a slow connection does not download everything.
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, ImageOff, Loader2, Music, Play, RefreshCw } from "lucide-react";
import { API_CONFIG } from "@/config/api";
import type { InboxMessage } from "@/services/teamInboxApi";

export interface MediaText { loading: string; failed: string; retry: string; tapToLoad: string; photo: string; video: string; audio: string; document: string }

const API = API_CONFIG.BASE_URL;
const AUTO = new Set(["image", "sticker"]);

async function fetchBlob(threadId: string, messageId: string, fallback: string): Promise<Blob> {
  const res = await fetch(`${API}/team-inbox/threads/${threadId}/messages/${messageId}/media/`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || fallback);
  }
  return res.blob();
}

export function MessageMedia({ threadId, message, text }: { threadId: string; message: InboxMessage; text: MediaText }) {
  const local = message.id.startsWith("local-");
  const [src, setSrc] = useState<string | null>(message.local_url ?? null);
  const [state, setState] = useState<"idle" | "loading" | "error">(AUTO.has(message.kind) && !local ? "loading" : "idle");
  const [error, setError] = useState("");
  const urlRef = useRef<string>("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const blob = await fetchBlob(threadId, message.id, text.failed);
      urlRef.current = URL.createObjectURL(blob);
      setSrc(urlRef.current);
      setState("idle");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : text.failed);
      setState("error");
    }
  }, [threadId, message.id, text.failed]);

  useEffect(() => {
    if (!local && !message.local_url && AUTO.has(message.kind)) void load();
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, message.id]);

  const label = message.kind === "image" || message.kind === "sticker" ? text.photo : message.kind === "video" ? text.video : message.kind === "audio" ? text.audio : text.document;
  const Icon = message.kind === "audio" ? Music : message.kind === "video" ? Play : message.kind === "document" ? FileText : ImageOff;

  if (state === "error") {
    return (
      <div className="mb-1 flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs dark:bg-white/10" role="alert">
        <Icon className="h-4 w-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1"><span className="block font-medium">{label}</span><span className="block opacity-75">{error}</span></span>
        <button type="button" onClick={() => void load()} className="shrink-0 rounded p-1 hover:bg-black/10" aria-label={text.retry} title={text.retry}><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>
    );
  }
  if (!src) {
    if (state === "loading") {
      return <div className="mb-1 flex h-28 w-48 items-center justify-center rounded-lg bg-black/5 text-xs opacity-80 dark:bg-white/10"><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{text.loading}</div>;
    }
    return (
      <button type="button" onClick={() => void load()} className="mb-1 flex w-full min-w-[12rem] items-center gap-3 rounded-lg bg-black/5 px-3 py-2.5 text-left text-sm hover:bg-black/10 dark:bg-white/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/15"><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{message.kind === "document" ? message.text : label}</span>
          <span className="block text-xs opacity-70">{text.tapToLoad}</span>
        </span>
        <Download className="h-4 w-4 shrink-0 opacity-70" />
      </button>
    );
  }
  if (message.kind === "image" || message.kind === "sticker") {
    return <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={message.text} className={`mb-1 max-h-72 max-w-full rounded-lg ${message.kind === "sticker" ? "h-32" : ""}`} /></a>;
  }
  if (message.kind === "video") return <video src={src} controls className="mb-1 max-h-72 max-w-full rounded-lg" preload="metadata" />;
  if (message.kind === "audio") return <audio src={src} controls className="mb-1 w-64 max-w-full" preload="metadata" />;
  return (
    <a href={src} download={message.text || "file"} className="mb-1 flex min-w-[12rem] items-center gap-3 rounded-lg bg-black/5 px-3 py-2.5 text-sm hover:bg-black/10 dark:bg-white/10">
      <FileText className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1 truncate font-medium">{message.text || text.document}</span><Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}

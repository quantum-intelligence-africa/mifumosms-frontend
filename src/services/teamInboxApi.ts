// Client for the shared WhatsApp inbox (main backend, `/api/team-inbox/`). Every call is authenticated as the signed-in employee; the server decides
// which business and which conversations they may see, so nothing here sends a business id.
import { apiClient, type ApiResponse } from "@/lib/api";
import { API_CONFIG } from "@/config/api";

const BASE = "/team-inbox";

export type ThreadStatus = "open" | "pending" | "resolved" | "archived";
export type InboxView = "all" | "mine" | "unassigned";

export interface Person { id: string; name: string; email: string }
export interface InboxThread {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: ThreadStatus;
  assigned_to: Person | null;
  assigned_at: string | null;
  last_message_at: string | null;
  last_preview: string;
  last_direction: "in" | "out" | "";
  waiting_count: number;
  unread: number;
  window_open: boolean;
}
export interface InboxMessage {
  id: string;
  direction: "in" | "out";
  kind: string;
  text: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed" | "received";
  error: string;
  sent_by: Person | null;
  created_at: string;
  client_token: string;
  /** The customer sent a picture / video / audio / document that can be loaded from the server. */
  has_media?: boolean;
  /** The earlier message this one answers (a quoted reply). */
  reply_to?: { id: string; direction: "in" | "out"; kind: string; text: string; author: string } | null;
  /** "chatbot" for an automatic reply from the SENDA chatbot (no agent behind it). */
  source?: string;
  /** The buttons or list choices the chatbot offered; url is set on a link button. */
  buttons?: Array<{ title: string; url?: string }>;
  /** Set on an approved-template message: the template's name. */
  template?: string | null;
  /** Emoji reactions: at most one from the customer and one from the business. */
  reactions?: Array<{ side: "customer" | "business"; emoji: string }>;
  /** Browser only: a preview of a file this person is sending (or just sent), shown without downloading it again. */
  local_url?: string;
  /** Browser only: how much of a file being sent has reached the server, 0-100. */
  progress?: number;
}
export interface InboxNote { id: string; body: string; author: Person | null; created_at: string }
export interface Permissions { role: string; can_reply: boolean; can_claim: boolean; can_assign: boolean; can_change_status: boolean; can_note: boolean; can_manage_settings: boolean }
export interface ThreadDetail {
  thread: InboxThread;
  contact: { name: string; phone: string; email: string; tags: string[] } | null;
  permissions: Permissions;
  typing: string[];
  recent_reply: { name: string; at: string } | null;
}
export interface Counts { all: number; mine: number; unassigned: number; open: number; pending: number; resolved: number; archived: number }
export interface InboxEventRow { id: number; type: string; thread_id: string | null; actor_id: string | null; status?: string }
export interface InboxSettings {
  agents_see_all: boolean; agents_reply_any: boolean; agents_can_claim: boolean; agents_can_change_status: boolean;
  agents_can_note: boolean; agents_can_assign: boolean; auto_assign: "manual" | "round_robin" | "least_busy"; reopen_on_inbound: boolean;
}

export interface InboxTemplate {
  name: string; language: string; category: string; header: string; body: string; footer: string; buttons: string[];
  body_variables: number; header_variables: number; supported: boolean; reason: string;
}

export interface OutboundCheck { success: boolean; valid: boolean; phone?: string; name?: string; blocked?: "" | "opted_out" | "suppressed"; thread_id?: string | null; window_open?: boolean; message?: string }

/** The stable error code the server sent (`window_closed`, `already_assigned`, ...), when there is one. */
export function errorCode(res: ApiResponse<unknown>): string {
  return String((res.errors as unknown as { code?: string } | null)?.code || "");
}

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  const text = q.toString();
  return text ? `?${text}` : "";
};
const post = <T>(path: string, body?: unknown) => apiClient.call<T>(`${BASE}${path}`, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

/** Send one file (photo, video, audio, document) with an optional caption. Uses its own request, not the shared client, so a big file on a slow
 *  connection is not cut off after 30 seconds, and it can report progress. Resolves like the other calls: `data` on success, `errors` = the body on failure. */
function sendAttachment(
  id: string, file: File, opts: { caption?: string; clientToken: string; replyTo?: string; onProgress?: (percent: number) => void },
): Promise<ApiResponse<{ message: InboxMessage; warning: { name: string; at: string } | null }>> {
  return new Promise((resolve) => {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("client_token", opts.clientToken);
    if (opts.caption) form.append("caption", opts.caption);
    if (opts.replyTo) form.append("reply_to", opts.replyTo);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_CONFIG.BASE_URL}${BASE}/threads/${id}/attachments/`);
    xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("access_token") || ""}`);
    xhr.timeout = 5 * 60 * 1000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && opts.onProgress) opts.onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = xhr.ontimeout = () => resolve({ success: false, status: 0, message: "Could not reach the server. Check your connection and try again." } as ApiResponse<never>);
    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(xhr.responseText || "{}"); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, status: xhr.status, data: body } as ApiResponse<never>);
      } else {
        resolve({ success: false, status: xhr.status, message: String(body.message || body.error || ""), errors: body } as unknown as ApiResponse<never>);
      }
    };
    xhr.send(form);
  });
}

export const teamInboxApi = {
  sendAttachment,
  threads: (p: { view?: InboxView; status?: string; q?: string; page?: number; assignee?: string }) =>
    apiClient.call<{ count: number; page: number; page_size: number; results: InboxThread[] }>(`${BASE}/threads/${qs(p)}`),
  counts: () => apiClient.call<Counts>(`${BASE}/threads/counts/`),
  detail: (id: string) => apiClient.call<ThreadDetail>(`${BASE}/threads/${id}/`),
  messages: (id: string, before?: string) =>
    apiClient.call<{ has_more: boolean; results: InboxMessage[] }>(`${BASE}/threads/${id}/messages/${qs({ before })}`),
  send: (id: string, text: string, clientToken: string, replyTo?: string) =>
    post<{ message: InboxMessage; warning: { name: string; at: string } | null }>(`/threads/${id}/messages/`, { text, client_token: clientToken, ...(replyTo ? { reply_to: replyTo } : {}) }),
  templates: (id: string) => apiClient.call<{ results: InboxTemplate[] }>(`${BASE}/threads/${id}/templates/`),
  sendTemplate: (id: string, t: { name: string; language: string; variables: string[]; header_variables: string[]; client_token: string }) =>
    post<{ message: InboxMessage; warning: { name: string; at: string } | null }>(`/threads/${id}/templates/`, t),
  // The Send section: start a conversation from an approved template.
  outboundNumbers: () => apiClient.call<{ results: Array<{ phone_number_id: string; label: string }> }>(`${BASE}/outbound/numbers/`),
  outboundTemplates: (phoneNumberId: string) => apiClient.call<{ results: InboxTemplate[] }>(`${BASE}/outbound/templates/${qs({ phone_number_id: phoneNumberId })}`),
  outboundCheck: (phoneNumberId: string, phone: string) => post<OutboundCheck>("/outbound/check/", { phone_number_id: phoneNumberId, phone }),
  outboundSend: (b: { phone_number_id: string; phone: string; name: string; template_name: string; language: string; variables: string[]; header_variables: string[]; client_token: string }) =>
    post<{ message: InboxMessage; thread_id: string; warning: { name: string; at: string } | null }>("/outbound/send/", b),
  react: (id: string, messageId: string, emoji: string) => post<{ message: InboxMessage }>(`/threads/${id}/messages/${messageId}/react/`, { emoji }),
  retry: (id: string, messageId: string) => post<{ message: InboxMessage }>(`/threads/${id}/messages/${messageId}/retry/`),
  assign: (id: string, userId: string | null) => post<{ thread: InboxThread }>(`/threads/${id}/assign/`, { user_id: userId }),
  claim: (id: string) => post<{ thread: InboxThread }>(`/threads/${id}/claim/`),
  setStatus: (id: string, status: ThreadStatus) => post<{ thread: InboxThread }>(`/threads/${id}/status/`, { status }),
  notes: (id: string) => apiClient.call<{ results: InboxNote[] }>(`${BASE}/threads/${id}/notes/`),
  addNote: (id: string, body: string) => post<{ note: InboxNote }>(`/threads/${id}/notes/`, { body }),
  markRead: (id: string) => post<unknown>(`/threads/${id}/read/`),
  typing: (id: string) => post<unknown>(`/threads/${id}/typing/`),
  // The change feed. Without `after` it only reports where the feed is now; with it, everything newer.
  events: (after?: number) => apiClient.call<{ last_id: number; events: InboxEventRow[] }>(`${BASE}/events/${after === undefined ? "" : `?after=${after}`}`),
  members: () => apiClient.call<{ results: Array<Person & { role: string }> }>(`${BASE}/members/`),
  settings: () => apiClient.call<InboxSettings>(`${BASE}/settings/`),
  saveSettings: (patch: Partial<InboxSettings>) => apiClient.call<InboxSettings>(`${BASE}/settings/`, { method: "PATCH", body: JSON.stringify(patch) }),
};

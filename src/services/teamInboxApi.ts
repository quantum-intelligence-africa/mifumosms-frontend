// Client for the shared WhatsApp inbox (main backend, `/api/team-inbox/`). Every call is authenticated as the signed-in employee; the server decides
// which business and which conversations they may see, so nothing here sends a business id.
import { apiClient, type ApiResponse } from "@/lib/api";

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

export const teamInboxApi = {
  threads: (p: { view?: InboxView; status?: string; q?: string; page?: number; assignee?: string }) =>
    apiClient.call<{ count: number; page: number; page_size: number; results: InboxThread[] }>(`${BASE}/threads/${qs(p)}`),
  counts: () => apiClient.call<Counts>(`${BASE}/threads/counts/`),
  detail: (id: string) => apiClient.call<ThreadDetail>(`${BASE}/threads/${id}/`),
  messages: (id: string, before?: string) =>
    apiClient.call<{ has_more: boolean; results: InboxMessage[] }>(`${BASE}/threads/${id}/messages/${qs({ before })}`),
  send: (id: string, text: string, clientToken: string) =>
    post<{ message: InboxMessage; warning: { name: string; at: string } | null }>(`/threads/${id}/messages/`, { text, client_token: clientToken }),
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

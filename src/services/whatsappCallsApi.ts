// Client for WhatsApp voice calls in the Team Inbox (main backend, `/api/team-inbox/calls/...`). The server owns every call's state and who handles it;
// the browser only shows it and carries the audio (WebRTC, straight to WhatsApp). Nothing here is sample data.
import { apiClient } from "@/lib/api";
import type { Person } from "@/services/teamInboxApi";

const BASE = "/team-inbox";

export type CallStatus = "ringing" | "accepting" | "active" | "completed" | "missed" | "rejected" | "failed" | "cancelled";
export type Availability = "available" | "away" | "offline";
export type EffectiveState = Availability | "busy";

export interface WaCall {
  id: string;
  thread_id: string | null;
  direction: "in" | "out";
  status: CallStatus;
  customer_name: string;
  customer_phone: string;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  handled_by: Person | null;
  initiated_by: Person | null;
  error: string;
  /** I am the agent handling this call. */
  mine: boolean;
  followed_up: boolean;
  /** Only ever present for the agent handling the call. */
  sdp_offer?: string;
  sdp_answer?: string;
}
export interface IceServer { urls: string[] | string; username?: string; credential?: string }
export interface LiveSnapshot {
  me: { state: Availability; effective: EffectiveState; can_call: boolean; role: string; is_manager: boolean };
  ringing: WaCall[];
  active: WaCall[];
  ice_servers: IceServer[];
  server_time: string;
}
export interface CallPermission { status: "none" | "requested" | "granted" | "denied"; permanent: boolean; expires_at: string | null; requested_at: string | null; can_ask: boolean }
export interface Readiness {
  phone_number_id: string; display_phone_number: string; calling_status: string; platform_type: string; is_on_biz_app: boolean; messaging_limit_tier: string;
  ready: boolean; blockers: Array<{ code: string; message: string }>; warnings: string[]; checked_at: string;
}
export interface TeamAgent extends Person { role: string; state: EffectiveState; on_call: WaCall | null }
export interface TeamSummary {
  ringing: WaCall[]; active: WaCall[]; agents: TeamAgent[];
  today: { total: number; completed: number; missed: number; rejected: number; failed: number; cancelled: number };
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "" && v !== false) q.set(k, String(v)); });
  const text = q.toString();
  return text ? `?${text}` : "";
};
const post = <T>(path: string, body?: unknown) => apiClient.call<T>(`${BASE}${path}`, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const whatsappCallsApi = {
  /** The heartbeat and live state in one: ringing and active calls, my availability. Optional `state` also sets availability. */
  live: (state?: Availability) => post<LiveSnapshot>("/calls/live/", state ? { state } : {}),
  list: (p: { status?: string; direction?: string; mine?: boolean; q?: string; page?: number }) =>
    apiClient.call<{ count: number; page: number; results: WaCall[] }>(`${BASE}/calls/${qs(p)}`),
  detail: (id: string) => apiClient.call<{ call: WaCall }>(`${BASE}/calls/${id}/`),
  claim: (id: string) => post<{ call: WaCall; ice_servers: IceServer[] }>(`/calls/${id}/claim/`),
  accept: (id: string, sdp: string) => post<{ call: WaCall }>(`/calls/${id}/accept/`, { sdp }),
  reject: (id: string) => post<{ call: WaCall }>(`/calls/${id}/reject/`),
  end: (id: string) => post<{ call: WaCall }>(`/calls/${id}/end/`),
  followedUp: (id: string) => post<{ call: WaCall }>(`/calls/${id}/followed-up/`),
  place: (threadId: string, sdp: string) => post<{ call: WaCall; ice_servers: IceServer[] }>("/calls/place/", { thread_id: threadId, sdp }),
  threadState: (threadId: string) => apiClient.call<{ permission: CallPermission; window_open: boolean; can_call: boolean }>(`${BASE}/threads/${threadId}/call-state/`),
  askPermission: (threadId: string) => post<{ permission: CallPermission }>(`/threads/${threadId}/call-state/`),
  threadCalls: (threadId: string) => apiClient.call<{ count: number; results: WaCall[] }>(`${BASE}/threads/${threadId}/calls/`),
  summary: () => apiClient.call<TeamSummary>(`${BASE}/calls/summary/`),
  readiness: (refresh = false) => apiClient.call<Readiness>(`${BASE}/calls/readiness/${refresh ? "?refresh=1" : ""}`),
  enableCalling: () => post<Readiness>("/calls/readiness/", {}),
};

// Client for WhatsApp campaigns (main backend, `/api/wa-campaigns/`). The server resolves the organization from the signed-in user's own membership;
// nothing here sends a tenant id. A failed call resolves with `errors` = the response body, so `errors.code` says why (e.g. audience_changed).
import { apiClient } from "@/lib/api";

const BASE = "/wa-campaigns";

export type CampaignStatus = "draft" | "scheduled" | "queued" | "sending" | "paused" | "completed" | "failed" | "cancelled";
export type RecipientStatus = "pending" | "submitting" | "submitted" | "sent" | "delivered" | "read" | "failed" | "skipped";

export interface CampaignStats {
  recipients: number; waiting: number; submitted: number; sent: number; delivered: number; read: number; failed: number; skipped: number; awaiting_report: number;
}
export interface ParamMapEntry { token: string; source: string; default?: string }
export interface Audience { all?: boolean; contact_ids?: string[]; tags?: string[]; phones?: string[] }
export interface Campaign {
  id: string; name: string; description: string; purpose: string; purpose_label: string; status: CampaignStatus; phone_number_id: string;
  template_name: string; language_code: string; template_category: string; created_at: string; scheduled_at: string | null; started_at: string | null;
  completed_at: string | null; created_by: string; estimated_cost: string | null; failure_reason: string; stats: CampaignStats;
  // detail only
  param_map?: ParamMapEntry[]; audience?: Audience; consent_attested?: boolean; min_hours_between_marketing?: number; media_url?: string; media_type?: string;
  template_body?: string; skipped_by_reason?: Array<{ reason: string; label: string; count: number }>;
  failures_by_error?: Array<{ code: string; message: string; count: number }>;
}
export interface CampaignDraft {
  name?: string; description?: string; purpose?: string; phone_number_id?: string; template_name?: string; language_code?: string; param_map?: ParamMapEntry[];
  audience?: Audience; consent_attested?: boolean; min_hours_between_marketing?: number; media_url?: string;
}
export interface WaTemplate {
  name: string; language: string; status: string; category: string; header: string; header_format: string; body: string; footer: string; buttons: string[];
  tokens: string[]; supported: boolean; reason: string;
}
export interface Preview {
  success: boolean; audience: number; eligible: number; skipped: number; skipped_by_reason: Array<{ reason: string; label: string; count: number }>;
  samples: Array<{ phone: string; name: string; text: string; used_default: string[] }>;
  skipped_examples: Array<{ phone: string; name: string; reason: string; label: string; detail: string }>;
  problems: string[]; template_category: string; is_marketing: boolean; can_launch: boolean;
  credits: { required: number; available: number | null; enough: boolean; cost_estimate: number | null; cost_note: string };
}
export interface Recipient {
  id: string; phone: string; name: string; status: RecipientStatus; skip_reason: string; skip_detail: string; error_code: string; error_message: string;
  attempts: number; submitted_at: string | null; delivered_at: string | null; read_at: string | null;
}
export interface Overview {
  messages: { submitted: number; delivered: number; read: number; failed: number; waiting: number };
  campaigns: { running: number; scheduled: number; paused: number; total: number };
  contacts: { total: number; eligible: number; opted_out: number };
  suppressed: number; cost: { available: boolean; note: string };
}
export interface Suppression { id: string; phone: string; reason: string; reason_label: string; source: string; note: string; created_at: string }

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  const text = q.toString();
  return text ? `?${text}` : "";
};
const send = <T>(method: string, path: string, body?: unknown) => apiClient.call<T>(`${BASE}${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export const waCampaignsApi = {
  overview: () => apiClient.call<Overview>(`${BASE}/overview/`),
  numbers: () => apiClient.call<{ results: Array<{ phone_number_id: string; label: string }> }>(`${BASE}/numbers/`),
  templates: (phoneNumberId: string, refresh = false) => apiClient.call<{ results: WaTemplate[] }>(`${BASE}/templates/${qs({ phone_number_id: phoneNumberId, refresh: refresh ? 1 : undefined })}`),
  list: (p: { status?: string; q?: string; page?: number }) => apiClient.call<{ count: number; page: number; page_size: number; results: Campaign[] }>(`${BASE}/${qs(p)}`),
  get: (id: string) => apiClient.call<{ campaign: Campaign }>(`${BASE}/${id}/`),
  create: (d: CampaignDraft) => send<{ campaign: Campaign }>("POST", "/", d),
  update: (id: string, d: CampaignDraft) => send<{ campaign: Campaign }>("PATCH", `/${id}/`, d),
  remove: (id: string) => send<unknown>("DELETE", `/${id}/`),
  preview: (d: CampaignDraft & { campaign_id?: string }) => send<Preview>("POST", "/preview/", d),
  launch: (id: string, b: { launch_token: string; confirm_recipients: number; scheduled_at?: string; allow_duplicate?: boolean }) => send<{ campaign: Campaign }>("POST", `/${id}/launch/`, b),
  pause: (id: string) => send<{ campaign: Campaign }>("POST", `/${id}/pause/`),
  resume: (id: string) => send<{ campaign: Campaign }>("POST", `/${id}/resume/`),
  cancel: (id: string) => send<{ campaign: Campaign }>("POST", `/${id}/cancel/`),
  retryFailed: (id: string) => send<{ retried: number; not_retryable: number; opted_out: number }>("POST", `/${id}/retry-failed/`),
  recipients: (id: string, p: { status?: string; q?: string; page?: number }) => apiClient.call<{ count: number; page: number; page_size: number; results: Recipient[] }>(`${BASE}/${id}/recipients/${qs(p)}`),
  suppressions: (q?: string) => apiClient.call<{ count: number; results: Suppression[] }>(`${BASE}/suppressions/${qs({ q })}`),
  addSuppression: (phone: string, note?: string) => send<{ id: string; phone: string }>("POST", "/suppressions/", { phone, note }),
  removeSuppression: (id: string) => send<unknown>("DELETE", `/suppressions/${id}/`),
  /** The CSV export needs the sign-in header, so it is fetched and saved as a file instead of being opened as a link. */
  async exportCsv(id: string, name: string) {
    const { API_CONFIG } = await import("@/config/api");
    const res = await fetch(`${API_CONFIG.BASE_URL}${BASE}/${id}/export/`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
    if (!res.ok) return false;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w-]+/g, "_") || "campaign"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },
};

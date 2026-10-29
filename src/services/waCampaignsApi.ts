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
export interface SendaUsers { kind: string; days?: number; threshold?: number }
export interface Audience { all?: boolean; contact_ids?: string[]; tags?: string[]; phones?: string[]; senda_users?: SendaUsers }
export interface Campaign {
  id: string; name: string; description: string; purpose: string; purpose_label: string; status: CampaignStatus; phone_number_id: string;
  template_name: string; language_code: string; template_category: string; created_at: string; scheduled_at: string | null; started_at: string | null;
  completed_at: string | null; created_by: string; estimated_cost: string | null; failure_reason: string; stats: CampaignStats;
  // detail only
  param_map?: ParamMapEntry[]; audience?: Audience; consent_attested?: boolean; min_hours_between_marketing?: number; media_url?: string; media_type?: string;
  template_body?: string; skipped_by_reason?: Array<{ reason: string; label: string; count: number }>;
  failures_by_error?: Array<{ code: string; message: string; count: number }>;
  returned?: { count: number; of: number; note: string };
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
  limits?: { warnings: string[]; estimate: { amount: string; currency: string; per_message: string; note: string } | null; used_this_month: number; after: number; monthly_message_limit: number | null; per_campaign_limit: number | null };
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
export interface ContactField { id: string; key: string; label: string; field_type: "text" | "number" | "date" | "boolean"; default_value: string; required: boolean }
export interface LimitSettings {
  monthly_message_limit: number | null; per_campaign_limit: number | null; unit_cost: string | null; currency: string; monthly_budget: string | null; alert_percent: number;
  used_this_month: number; spent_this_month: string | null;
}
export interface Recurrence { id: string; campaign_id: string; name: string; frequency: "daily" | "weekly" | "monthly"; interval: number; next_run_at: string; until: string | null; active: boolean; run_count: number; last_run_at: string | null; last_error: string }
export interface AnalyticsRow { key: string; submitted: number; delivered: number; read: number; delivery_rate: number | null; read_rate: number | null }
export interface Analytics {
  days: number; note: string; campaigns_in_period: number;
  totals: { submitted: number; delivered: number; read: number; failed: number; delivery_rate: number | null; read_rate: number | null; failure_rate: number | null };
  daily: Array<{ date: string; submitted: number; delivered: number; read: number; failed: number }>;
  by_template: AnalyticsRow[]; by_purpose: AnalyticsRow[]; top_errors: Array<{ code: string; message: string; count: number }>; skipped: Array<{ reason: string; count: number }>;
}
export interface ImportInfo { id: string; filename: string; status: "uploaded" | "validated" | "running" | "done" | "failed"; total_rows: number; processed_rows: number; created: number; updated: number; skipped: number; invalid: number; failure: string; has_errors: boolean }
export interface ImportCheck { total: number; created: number; updated: number; skipped: number; invalid: number; errors: Array<{ row: number; phone: string; name: string; reason: string }>; errors_truncated: boolean }
export interface Automation {
  id: string; name: string; trigger: string; trigger_label: string; threshold: number; delay_minutes: number; cooldown_hours: number; phone_number_id: string; template_name: string;
  language_code: string; param_map: ParamMapEntry[]; active: boolean; runs: Record<string, number>; created_at: string;
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
  fields: () => apiClient.call<{ results: ContactField[]; discovered: Array<{ key: string; contacts: number }> }>(`${BASE}/fields/`),
  addField: (d: Partial<ContactField>) => send<{ field: ContactField }>("POST", "/fields/", d),
  updateField: (id: string, d: Partial<ContactField>) => send<{ field: ContactField }>("PATCH", `/fields/${id}/`, d),
  removeField: (id: string) => send<unknown>("DELETE", `/fields/${id}/`),
  settings: () => apiClient.call<{ settings: LimitSettings }>(`${BASE}/settings/`),
  saveSettings: (d: Record<string, unknown>) => send<{ settings: LimitSettings }>("PATCH", "/settings/", d),
  recurring: () => apiClient.call<{ results: Recurrence[] }>(`${BASE}/recurring/`),
  addRecurring: (d: { campaign_id: string; frequency: string; interval: number; first_run_at: string; until?: string }) => send<{ recurrence: Recurrence }>("POST", "/recurring/", d),
  setRecurring: (id: string, active: boolean) => send<{ recurrence: Recurrence }>("POST", `/recurring/${id}/`, { active }),
  removeRecurring: (id: string) => send<unknown>("DELETE", `/recurring/${id}/`),
  analytics: (days: number) => apiClient.call<Analytics>(`${BASE}/analytics/?days=${days}`),
  // Guided contact import. The file goes up as form data (not through the JSON client).
  async uploadImport(file: File) {
    const { API_CONFIG } = await import("@/config/api");
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await fetch(`${API_CONFIG.BASE_URL}${BASE}/imports/`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` }, body: form });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, body } as { ok: boolean; body: { message?: string; import: ImportInfo; columns: string[]; sample: string[][]; mapping: Record<string, string>; targets: Record<string, string> } };
  },
  validateImport: (id: string, mapping: Record<string, string>, options: Record<string, unknown>) => send<ImportCheck>("POST", `/imports/${id}/validate/`, { mapping, options }),
  commitImport: (id: string) => send<{ import: ImportInfo }>("POST", `/imports/${id}/commit/`),
  importInfo: (id: string) => apiClient.call<{ import: ImportInfo }>(`${BASE}/imports/${id}/`),
  async downloadImportErrors(id: string) {
    const { API_CONFIG } = await import("@/config/api");
    const res = await fetch(`${API_CONFIG.BASE_URL}${BASE}/imports/${id}/errors.csv`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
    if (!res.ok) return false;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url; a.download = "not-imported.csv"; a.click(); URL.revokeObjectURL(url);
    return true;
  },
  sendaKinds: () => apiClient.call<{ kinds: Array<{ kind: string; label: string }> }>(`${BASE}/senda-users/kinds/`),
  sendaCount: (spec: { kind: string; days?: number; threshold?: number }) => send<{ matching: number }>("POST", "/senda-users/count/", spec),
  automations: () => apiClient.call<{ results: Automation[]; triggers: Array<{ trigger: string; label: string; scanned: boolean }> }>(`${BASE}/automations/`),
  addAutomation: (d: Record<string, unknown>) => send<{ automation: Automation }>("POST", "/automations/", d),
  setAutomation: (id: string, active: boolean) => send<{ automation: Automation }>("PATCH", `/automations/${id}/`, { active }),
  removeAutomation: (id: string) => send<unknown>("DELETE", `/automations/${id}/`),
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

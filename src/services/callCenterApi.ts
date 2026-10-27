// Typed client for the call-center endpoints (senda_voice_backend `voice/cc_views.py`)
// plus the agent-account endpoints that live on the main backend.
//
// The two backends can't share a transaction, so creating an agent is two
// steps: (1) the login on the main backend, (2) the agent profile on the voice
// service. `provisionAgent` reports which step failed, so an admin is never
// shown "failed" for a login that was in fact created — and never loses the
// one-time temporary password.
import { apiClient, type ApiResponse } from "@/lib/api";
import { voiceApi } from "@/services/voiceApi";

export type AgentStatus = "available" | "busy" | "away" | "offline" | "dnd" | "acw";
export type RoutingStrategy = "ring_one" | "round_robin" | "simultaneous";
export type AudioMode = "browser" | "handset" | "both";
export type LiveState = AgentStatus | "ringing" | "on_call" | "disabled";
export type CallEndpoint = "browser" | "phone";
export type CallResult = "answered" | "missed" | "voicemail" | "abandoned" | "rejected" | "failed";
export type AfterHoursAction = "voicemail" | "message";
export type MissedCallStatus = "new" | "assigned" | "called_back" | "scheduled" | "contacted" | "unreachable" | "resolved" | "unresolved";

/** The counts behind the "needs attention" badge, from the same records the list shows. */
export interface MissedSummary { needs_attention: number; needs_attention_numbers?: number; new: number; overdue: number; scheduled: number; abandoned: number; today: number }
export type CallOutcome =
  | "resolved"
  | "follow_up_required"
  | "escalated"
  | "wrong_number"
  | "information_provided"
  | "callback_requested";

export const AGENT_STATUSES: AgentStatus[] = ["available", "busy", "away", "dnd", "acw", "offline"];
/** What an agent may pick for themselves — "busy" is set only by an actual call. */
export const SELF_STATUSES: AgentStatus[] = ["available", "away", "dnd", "acw", "offline"];
export const CALL_OUTCOMES: CallOutcome[] = [
  "resolved",
  "information_provided",
  "follow_up_required",
  "callback_requested",
  "escalated",
  "wrong_number",
];

export interface WorkingHours {
  days: number[]; // 0 = Monday … 6 = Sunday
  start: string; // HH:MM
  end: string;
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  status: AgentStatus;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  extension: string;
  routing_strategy: RoutingStrategy;
  ring_timeout_seconds: number;
  working_hours: WorkingHours | Record<string, never>;
  timezone: string;
  after_hours_action: AfterHoursAction;
  after_hours_message: string;
  overflow_team: string | null;
  queue_enabled: boolean;
  queue_max_callers: number;
  queue_max_wait_seconds: number;
  hold_music_url: string;
  waiting_message: string;
  callback_offer: boolean;
  queue_operator_option?: boolean;
  queue_ai_option?: boolean;
  ai_answers_first?: boolean;
  ai_assistant_id?: string | null;
  queue_language?: "sw" | "en";
  callback_max_attempts?: number;
  callback_retry_minutes?: number;
  waiting_now: number;
  is_active: boolean;
  members: TeamMemberSummary[];
  member_count: number;
  available_count: number;
  is_open: boolean;
}

export interface TeamInput {
  name: string;
  description?: string;
  extension?: string;
  routing_strategy?: RoutingStrategy;
  working_hours?: WorkingHours | Record<string, never>;
  timezone?: string;
  after_hours_action?: AfterHoursAction;
  after_hours_message?: string;
  overflow_team?: string | null;
  queue_enabled?: boolean;
  queue_max_callers?: number;
  queue_max_wait_seconds?: number;
  hold_music_url?: string;
  waiting_message?: string;
  callback_offer?: boolean;
  queue_operator_option?: boolean;
  queue_ai_option?: boolean;
  ai_answers_first?: boolean;
  ai_assistant_id?: string | null;
  queue_language?: "sw" | "en";
  callback_max_attempts?: number;
  callback_retry_minutes?: number;
  is_active?: boolean;
  agent_ids?: string[];
}

export interface CCAgent {
  id: string;
  /** Set when an administrator removed this agent (kept for history). */
  removed_at?: string | null;
  name: string;
  user: number | null;
  email: string;
  role: string;
  phone_number: string;
  extension: string;
  department: string;
  audio_mode: AudioMode;
  /** An administrator keeps this agent Available even with no tab open (needs a phone number). */
  always_available?: boolean;
  /** The AI assistant may transfer callers to this agent (default on). */
  takes_ai_transfers?: boolean;
  is_active: boolean;
  status: AgentStatus;
  /** Status plus what the call layer knows: ringing, on a call, or switched off. */
  live_state?: LiveState;
  status_changed_at: string | null;
  teams: Array<{ id: string; name: string }>;
}

export interface AgentProfileInput {
  user_id?: number;
  name?: string;
  phone_number?: string;
  extension?: string;
  department?: string;
  audio_mode?: AudioMode;
  always_available?: boolean;
  takes_ai_transfers?: boolean;
  is_active?: boolean;
  team_ids?: string[];
}

export interface TeamCounts {
  team_id: string;
  online: number;
  available: number;
  total: number;
}

export interface Workspace {
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
    audio_mode: AudioMode;
    extension: string;
    status_changed_at: string | null;
  };
  stats_today: { total: number; answered: number; missed: number };
  /** Null means "no data yet", never zero. */
  performance: { avg_talk_seconds: number | null; answer_rate: number | null; outbound: number; follow_ups_open: number };
  trend: AgentTrendDay[];
  recent_calls: AgentRecentCall[];
  teams: Array<TeamCounts & { name: string }>;
  current_call: { id: string; from_number: string; direction: string; started_at: string } | null;
}

export interface AgentTrendDay {
  date: string;
  total: number;
  answered: number;
}

export interface AgentRecentCall {
  id: string;
  direction: "inbound" | "outbound";
  number: string;
  started_at: string;
  duration_seconds: number | null;
  outcome: string;
  recording: { id: string; storage_path: string; duration_seconds: number | null } | null;
  analysis: { status: string; summary: string; sentiment: string } | null;
}

export interface CallerContext {
  known: boolean;
  name: string;
  number: string;
  email: string;
  tags: string[];
  last_contacted_at: string | null;
  previous_calls: number;
  last_call_at: string | null;
  last_note: string;
  last_outcome: string;
}

export interface RecentCall {
  id: string;
  from_number: string;
  to_number: string;
  direction: string;
  started_at: string;
  duration_seconds: number;
  outcome: "live" | "missed" | "answered";
  team: string;
  agent: string;
  voicemail: boolean;
}

export interface LiveSnapshot {
  today: { inbound: number; answered: number; missed: number; outbound: number; avg_talk_seconds: number };
  open_missed: number;
  /** The longest any caller has been waiting right now, over all queues. */
  longest_wait_seconds?: number;
  avg_wait_seconds?: number | null;
  ai_calls?: number;
  outgoing_active?: number;
  overdue_callbacks?: number;
  new_voicemails?: number;
  recent_calls: RecentCall[];
  agents_online: number;
  by_status: Record<AgentStatus, number>;
  calls_waiting: number;
  /** Each caller waiting right now, longest wait first. */
  waiting_callers?: Array<{ call_id: string; team: string; from_number: string; position: number; waited_seconds: number }>;
  teams: Array<TeamCounts & { id: string; name: string; waiting: number; longest_wait_seconds: number; queue_enabled: boolean; queue_max_callers?: number; queue_near_full?: boolean }>;
  agents: Array<{
    id: string;
    name: string;
    status: AgentStatus;
    status_changed_at: string | null;
    audio_mode: AudioMode;
    extension: string;
    on_call: boolean;
  }>;
  live_calls: Array<{
    id: string;
    from_number: string;
    to_number: string;
    direction: string;
    status: string;
    started_at: string;
    team: string;
    agent: string;
  }>;
}

export interface MissedCall {
  id: string;
  call: string;
  caller_number: string;
  team: string | null;
  team_name: string;
  status: MissedCallStatus;
  assigned_to: string | null;
  assigned_to_name: string;
  callback_attempts: number;
  last_attempt_at: string | null;
  resolved_at: string | null;
  notes: string;
  call_started_at: string;
  created_at: string;
  /** The message the caller left, with its AI analysis once it exists. Null when they left none. */
  voicemail: Voicemail | null;
  /** When a scheduled callback is due. */
  callback_at: string | null;
  /** Untouched for too long, or a scheduled callback whose time has passed (decided by the server). */
  is_overdue: boolean;
  /** How the call ended: missed, abandoned (left the queue), voicemail, rejected, failed. */
  call_outcome: string;
  /** How many missed calls this number has in total, this one included. */
  repeat_count: number;
  waited_seconds: number;
  last_followup_at: string | null;
  /** Set when this number has more than one missed call in the current filter: this row is its latest open call and `records` are all of them. */
  group?: MissedGroup | null;
}

export interface MissedGroup {
  /** Missed calls from this number matching the filter. */
  count: number;
  /** How many of them still need follow-up (not resolved / given up). */
  open: number;
  overdue: number;
  first_at: string;
  last_at: string;
  /** Every open call with its status, so an action touches only the calls it applies to. */
  open_items: Array<{ id: string; status: MissedCallStatus }>;
  /** Newest first, at most 50 (`count` is the true total). */
  records: MissedCall[];
}

/** One piece of the machine transcript. Never edited in place: corrections are separate reviews. */
export interface AnalysisSegment {
  text: string;
  start?: number;
  end?: number;
  speaker?: string | null;
  uncertain?: boolean;
  edited?: boolean;
}

interface Evidenced { evidence: number[]; quote: string }

/** The validated structured analysis. Every claim cites transcript segments (``evidence``). */
export interface AnalysisBody {
  language: string;
  call_purpose: string;
  customer_issue: string;
  summary: string;
  key_findings: Array<Evidenced & { text: string }>;
  actions_taken: Array<Evidenced & { text: string; actor: string }>;
  decisions: Array<Evidenced & { text: string }>;
  action_items: Array<Evidenced & { task: string; owner: string | null; deadline: string | null }>;
  resolution_status: "resolved" | "partially_resolved" | "unresolved" | "unclear";
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  follow_up_required: { required: boolean | null; reason: string | null };
  uncertainties: string[];
  transcript_quality: string;
}

export interface AnalysisResultFull {
  transcript: string;
  sentiment: string;
  detected_intent: string;
  summary: string;
  segments: AnalysisSegment[];
  transcription_quality: { status: "ok" | "review" | "failed"; reasons: Array<{ code: string; message: string; severity: string }> } | Record<string, never>;
  analysis: AnalysisBody | null;
  /** The same analysis in English (the main one is Swahili). Null when it could not be made. */
  analysis_en?: AnalysisBody | null;
  analysis_status: "legacy" | "ok" | "invalid" | "skipped_low_quality" | "unavailable" | "not_run";
  analysis_problems: string[];
  asr_model: string;
  llm_model: string;
  pipeline_version: string;
  review: { id: string; reviewer_name: string; created_at: string; note: string } | null;
  effective: { segments: AnalysisSegment[]; analysis: AnalysisBody | null; reviewed: boolean };
}

export interface AnalysisJobFull {
  /** When the analysis was queued. */
  created_at?: string;
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string;
  result: AnalysisResultFull | null;
}

export interface VoicemailAnalysis {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string;
  result: { transcript: string; sentiment: string; detected_intent: string; summary: string } | null;
}

export interface Voicemail {
  id: string;
  /** Always an absolute, playable URL. */
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
  analysis: AnalysisJobFull | null;
}

export interface CallNote {
  id: string;
  call: string;
  agent_name: string;
  category: string;
  outcome: CallOutcome | "";
  notes: string;
  follow_up: string;
  created_at: string;
}

export interface CallRow {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  agent: { id: string; name: string; phone_number: string; department: string } | null;
  team: { id: string; name: string } | null;
  status: string;
  provider_status: string;
  started_at: string;
  answered_at: string | null;
  duration_seconds: number | null;
  notes_count: number;
  /** The agent's own note outcome (resolved, follow-up...). Not the call result. */
  outcome: string;
  /** How the call ended: answered, missed, voicemail, abandoned, rejected, failed ("" while live). */
  call_outcome?: CallResult | "";
  agent_name?: string;
  answered_by?: { id: string | null; name: string; endpoint: string } | null;
  answered_endpoint?: CallEndpoint | "";
  ring_seconds?: number | null;
  connected_seconds?: number | null;
  attempts_count?: number;
  recording: { id: string; storage_path: string; duration_seconds: number | null } | null;
}

export interface CallTimeline {
  call: Record<string, unknown>;
  events: Array<{ id: string; type: string; label: string; at: string; agent: string; endpoint: string; detail: Record<string, unknown> }>;
  attempts: Array<{
    id: string; agent: string; agent_id: string | null; endpoint: CallEndpoint; round: number; strategy: string;
    outcome: string; offered_at: string; answered_at: string | null; ended_at: string | null; target?: string;
  }>;
  [key: string]: unknown;
}

export interface ReportSummary {
  period: { start: string; end: string | null };
  totals: {
    total_calls: number; inbound: number; outbound: number; answered: number; answered_by_agent: number;
    missed: number; voicemail: number; rejected: number; failed: number; in_progress: number;
  };
  timings: Record<string, number | null>;
  by_endpoint?: Record<string, number>;
  by_team?: Array<{ team_id: string; team__name?: string; name?: string; calls: number; answered: number; missed: number }>;
  definitions: Record<string, string>;
  [key: string]: unknown;
}

export type TransferMode = "blind" | "warm" | "confirm";
export type TransferStatus = "requested" | "ringing_target" | "transferring" | "connected" | "completed" | "declined" | "failed";

export interface CallTransferRow {
  id: string;
  call: string;
  kind: TransferMode;
  status: TransferStatus;
  note: string;
  /** What the agent's softphone should press once the target answers. */
  auto_action: "complete" | "conference";
  from_agent: string;
  from_agent_id: string;
  to_agent: string;
  to_agent_id: string;
  to_team: string;
  error: string;
  created_at: string;
}

export interface TransferTargets {
  agents: Array<{
    id: string;
    name: string;
    status: AgentStatus;
    extension: string;
    available: boolean;
    audio_mode: AudioMode;
    teams: string[];
  }>;
  teams: Array<{
    id: string;
    name: string;
    extension: string;
    is_open: boolean;
    available: number;
    online: number;
    total: number;
  }>;
}

export interface Readiness {
  number: boolean;
  team: boolean;
  agents: boolean;
  staffed: boolean;
  flow: boolean;
  routing: boolean;
  missing: string[];
  ready: boolean;
}

export interface CallCenterSettings {
  is_live: boolean;
  wizard_step: number;
  /** After-call wrap-up time in seconds (0 = none). */
  acw_seconds?: number;
  voicemail_alert_enabled?: boolean;
  voicemail_alert_emails?: string[];
  went_live_at: string | null;
  readiness: Readiness;
}

export interface GeneratedIvr {
  flow_id: string;
  account_id: string;
  phone_number: string;
  menu: Array<{ digit: string; team: string }>;
}

export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  actor: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Packages: limits, usage, and the people who could become agents ──────────

export interface PlanFlags {
  smart_routing?: boolean;
  working_hours?: boolean;
  ai_summaries?: boolean;
  call_forwarding?: boolean;
}

export interface PlanInfo {
  key: string;
  name: string;
  tagline: string;
  price: string | null;
  currency: string;
  billing_cycle: string;
  is_custom: boolean;
  is_popular: boolean;
  max_agents: number | null;
  max_numbers: number | null;
  max_ivr_menus: number | null;
  included_minutes: number | null;
  included_outbound_minutes: number | null;
  features: string[];
  feature_flags: PlanFlags;
}

export interface Meter {
  used: number;
  limit: number | null;
  exceeded: boolean;
}

export interface PlanStatus {
  /** subscription | default (entry-plan limits, nothing chosen yet) | off | none */
  source: "subscription" | "default" | "off" | "none";
  enforcing: boolean;
  plan: PlanInfo | null;
  current_period: { start: string; end: string };
  subscription: { status: string; period_start: string | null; period_end: string | null } | null;
  usage: { agents: Meter; numbers: Meter; menus: Meter; inbound_minutes: Meter; outbound_minutes: Meter };
  flags: PlanFlags;
  warnings: string[];
  plans: PlanInfo[];
}

export interface MemberCandidate {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
}

export interface PlanRequest {
  id: string;
  status: string;
  plan: PlanInfo;
  requested_at: string;
  period_start: string | null;
  period_end: string | null;
  payment_reference: string;
  source: "request" | "purchase" | "admin" | "trial";
  is_trial: boolean;
  days_left: number | null;
  amount: string | null;
  currency: string;
  invoice_number: string;
  feature_flags: PlanFlags;
  feature_overrides: PlanFlags | null;
}

export interface SubscriptionState {
  current: PlanRequest | null;
  pending: PlanRequest | null;
  awaiting_payment: PlanRequest | null;
}

export interface PlanQuote {
  plan: string;
  action: "new" | "renew" | "upgrade" | "downgrade";
  price: string;
  credit: string;
  total: string;
  currency: string;
  period_days: number;
  blocked: string;
  current_period_end: string | null;
  starts: string;
}

export interface CheckoutStarted {
  subscription_id: string;
  transaction_id: string;
  order_id: string;
  invoice_number: string;
  amount: string;
  currency: string;
}

export interface CheckoutStatus {
  outcome: "waiting" | "paid" | "failed";
  subscription: PlanRequest;
}

export interface InvoiceRow {
  id: string;
  number: string;
  plan: string;
  total: string;
  currency: string;
  issued_at: string;
  status: string;
}

export interface InvoiceDetail extends InvoiceRow {
  brand: string;
  organization: string;
  bill_to: { name: string; email: string };
  items: Array<{ description: string; quantity: number; unit_price: string; amount: string }>;
  payment_method: string;
  payment_reference: string;
  period_start: string | null;
  period_end: string | null;
}

export const PAYMENT_PROVIDERS = ["vodacom", "tigo", "airtel", "halotel"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** A 402 from the voice service means a package limit — the UI offers an upgrade. */
export function isPlanLimit(res: ApiResponse<unknown>): boolean {
  const body = res as unknown as { status?: number; errors?: { code?: string } };
  return body.status === 402 || body.errors?.code === "plan_limit";
}

const BASE = "/voice/call-center";

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const callCenterApi = {
  teams: {
    list: () => voiceApi.get<Team[]>(`${BASE}/teams/`),
    create: (body: TeamInput) => voiceApi.post<Team>(`${BASE}/teams/`, body),
    update: (id: string, body: Partial<TeamInput>) => voiceApi.patch<Team>(`${BASE}/teams/${id}/`, body),
    remove: (id: string) => voiceApi.delete(`${BASE}/teams/${id}/`),
  },
  agents: {
    list: (params: { team?: string; active?: boolean; removed?: boolean } = {}) =>
      voiceApi.get<CCAgent[]>(`${BASE}/agents/${qs({ team: params.team, active: params.active ? "true" : undefined, removed: params.removed ? "true" : undefined })}`),
    remove: (id: string) => voiceApi.post<CCAgent>(`${BASE}/agents/${id}/remove/`),
    createProfile: (body: AgentProfileInput) => voiceApi.post<CCAgent>(`${BASE}/agents/`, body),
    update: (id: string, body: AgentProfileInput) => voiceApi.patch<CCAgent>(`${BASE}/agents/${id}/`, body),
    disableProfile: (id: string) => voiceApi.delete(`${BASE}/agents/${id}/`),
  },
  me: {
    workspace: () => voiceApi.get<Workspace>(`${BASE}/me/`),
    setStatus: (status: AgentStatus) => voiceApi.post<{ status: AgentStatus }>(`${BASE}/me/status/`, { status }),
    heartbeat: () => voiceApi.post<{ ok: boolean }>(`${BASE}/me/heartbeat/`),
  },
  plan: () => voiceApi.get<PlanStatus>(`${BASE}/plan/`),
  members: () => voiceApi.get<{ available: MemberCandidate[]; pending: PendingInvite[] }>(`${BASE}/members/`),
  live: () => voiceApi.get<LiveSnapshot>(`${BASE}/live/`),
  notes: {
    list: (callId: string) => voiceApi.get<CallNote[]>(`${BASE}/calls/${callId}/notes/`),
    create: (
      callId: string,
      body: { category?: string; outcome?: CallOutcome | ""; notes?: string; follow_up?: string },
    ) => voiceApi.post<CallNote>(`${BASE}/calls/${callId}/notes/`, body),
  },
  missed: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      voiceApi.get<Paged<MissedCall>>(`${BASE}/missed-calls/${qs(params)}`),
    summary: () => voiceApi.get<MissedSummary>(`${BASE}/missed-calls/summary/`),
    /** Owners/admins: close the old, never-followed-up ones. Without `confirm` it only counts them. */
    closeOld: (body: { older_than_days: number; status: "resolved" | "unresolved"; confirm?: boolean }) =>
      voiceApi.post<{ calls: number; customers: number; closed: number; oldest: string | null }>(`${BASE}/missed-calls/close-old/`, body),
    update: (id: string, body: { status?: MissedCallStatus; assigned_to?: string | null; notes?: string; callback_at?: string | null }) =>
      voiceApi.patch<MissedCall>(`${BASE}/missed-calls/${id}/`, body),
    /** The same change for several missed calls at once (all of a number's open calls); all change or none do. */
    bulk: (ids: string[], body: { status?: MissedCallStatus; assigned_to?: string | null; notes?: string; callback_at?: string | null }) =>
      voiceApi.post<{ updated: number; skipped: number }>(`${BASE}/missed-calls/bulk/`, { ids, ...body }),
  },
  audit: (action?: string) => voiceApi.get<AuditEntry[]>(`${BASE}/audit-log/${qs({ action })}`),
  transferTargets: () => voiceApi.get<TransferTargets>(`${BASE}/transfer-targets/`),
  transferCall: (
    callId: string,
    body: { target_type: "agent" | "team"; target_id: string; mode: TransferMode; note?: string },
  ) => voiceApi.post<CallTransferRow>(`${BASE}/calls/${callId}/transfer/`, body),
  settings: {
    get: () => voiceApi.get<CallCenterSettings>(`${BASE}/settings/`),
    patch: (body: { is_live?: boolean; wizard_step?: number; acw_seconds?: number; voicemail_alert_enabled?: boolean; voicemail_alert_emails?: string[] | string }) =>
      voiceApi.patch<CallCenterSettings>(`${BASE}/settings/`, body),
  },
  generateIvr: (body: { greeting?: string; company_name?: string; replace_active?: boolean; team_ids?: string[] }) =>
    voiceApi.post<GeneratedIvr & { code?: string }>(`${BASE}/setup/generate-ivr/`, body),
  call: {
    answer: (callId: string, endpoint: CallEndpoint = "browser") =>
      voiceApi.post<{ call_id: string; endpoint: string }>(`${BASE}/calls/${callId}/answer/`, { endpoint }),
    reject: (callId: string, endpoint: CallEndpoint = "browser", reason = "") =>
      voiceApi.post(`${BASE}/calls/${callId}/reject/`, { endpoint, reason }),
    action: (callId: string, action: "hold" | "resume" | "mute" | "unmute", endpoint: CallEndpoint = "browser") =>
      voiceApi.post(`${BASE}/calls/${callId}/action/`, { action, endpoint }),
    timeline: (callId: string) => voiceApi.get<CallTimeline>(`${BASE}/calls/${callId}/timeline/`),
  },
  reports: {
    summary: (params: Record<string, string | number | undefined> = {}) =>
      voiceApi.get<ReportSummary>(`${BASE}/reports/summary/${qs(params)}`),
    agents: (params: Record<string, string | number | undefined> = {}) =>
      voiceApi.get<{ agents: Array<Record<string, unknown>>; definitions: Record<string, string> }>(`${BASE}/reports/agents/${qs(params)}`),
  },
  calls: (params: {
    direction?: string;
    team?: string;
    agent?: string;
    q?: string;
    days?: number;
    missed?: boolean;
    page?: number;
    page_size?: number;
    outcome?: string;
    endpoint?: string;
    date_from?: string;
    date_to?: string;
  }) =>
    voiceApi.get<Paged<CallRow>>(
      `/voice/calls/${qs({ ...params, missed: params.missed ? "true" : undefined })}`,
    ),
};

// ── Provisioning an agent: login (main backend) then profile (voice service) ──

export interface ProvisionAgentInput {
  tenantId: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "agent" | "supervisor";
  phone_number?: string;
  temporary_password?: string;
  extension?: string;
  audio_mode: AudioMode;
  team_ids: string[];
}

export type ProvisionAgentResult =
  | { ok: true; agent: CCAgent; temporaryPassword: string; invited?: false }
  /** The email already had an account: they were invited and can be made an agent once they accept. */
  | { ok: true; invited: true; agent: null; temporaryPassword: ""; message: string }
  | {
      ok: false;
      /** "account" — nothing was created. "profile" — the login exists but has no agent profile yet. */
      failedAt: "account" | "profile";
      error: string;
      userId?: number;
      temporaryPassword?: string;
    };

export async function provisionAgent(input: ProvisionAgentInput): Promise<ProvisionAgentResult> {
  const account: ApiResponse<{ user_id: number; temporary_password: string; existing_user?: boolean; detail?: string }> = await apiClient.createAgentAccount(
    input.tenantId,
    {
      email: input.email.trim(),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role: input.role,
      phone_number: input.phone_number?.trim() || undefined,
      temporary_password: input.temporary_password?.trim() || undefined,
    },
  );
  if (!account.success || !account.data) {
    return { ok: false, failedAt: "account", error: describeError(account) };
  }
  if (account.data.existing_user) {
    return { ok: true, invited: true, agent: null, temporaryPassword: "", message: account.data.detail || "" };
  }
  const { user_id, temporary_password } = account.data;
  const profile = await attachAgentProfile(user_id, input);
  if (!profile.success || !profile.data) {
    return {
      ok: false,
      failedAt: "profile",
      error: describeError(profile),
      userId: user_id,
      temporaryPassword: temporary_password,
    };
  }
  return { ok: true, agent: profile.data, temporaryPassword: temporary_password };
}

/** Step 2 on its own, so a half-finished provisioning can be completed. */
export function attachAgentProfile(
  userId: number,
  input: Pick<ProvisionAgentInput, "phone_number" | "extension" | "audio_mode" | "team_ids">,
) {
  return callCenterApi.agents.createProfile({
    user_id: userId,
    phone_number: input.phone_number?.trim() || "",
    extension: input.extension?.trim() || "",
    audio_mode: input.audio_mode,
    team_ids: input.team_ids,
  });
}

/** First readable message from an API failure, including DRF field errors. */
export function describeError(res: ApiResponse<unknown>): string {
  const errors = (res as { errors?: unknown }).errors;
  if (errors && typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      if (typeof value === "string") return value;
    }
  }
  return res.error || "Something went wrong. Please try again.";
}

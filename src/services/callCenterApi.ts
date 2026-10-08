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
export type AudioMode = "browser" | "handset";
export type AfterHoursAction = "voicemail" | "message";
export type MissedCallStatus = "new" | "assigned" | "called_back" | "resolved" | "unresolved";
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
  is_active?: boolean;
  agent_ids?: string[];
}

export interface CCAgent {
  id: string;
  name: string;
  user: number | null;
  email: string;
  role: string;
  phone_number: string;
  extension: string;
  department: string;
  audio_mode: AudioMode;
  is_active: boolean;
  status: AgentStatus;
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
  teams: Array<TeamCounts & { name: string }>;
  current_call: { id: string; from_number: string; direction: string; started_at: string } | null;
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

export interface LiveSnapshot {
  agents_online: number;
  by_status: Record<AgentStatus, number>;
  calls_waiting: number;
  teams: Array<TeamCounts & { id: string; name: string; waiting: number; longest_wait_seconds: number; queue_enabled: boolean }>;
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
  analysis: VoicemailAnalysis | null;
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
  outcome: string;
  recording: { id: string; storage_path: string; duration_seconds: number | null } | null;
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
    list: (params: { team?: string; active?: boolean } = {}) =>
      voiceApi.get<CCAgent[]>(`${BASE}/agents/${qs({ team: params.team, active: params.active ? "true" : undefined })}`),
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
    list: (params: { status?: string; team?: string } = {}) =>
      voiceApi.get<Paged<MissedCall>>(`${BASE}/missed-calls/${qs(params)}`),
    update: (id: string, body: { status?: MissedCallStatus; assigned_to?: string | null; notes?: string }) =>
      voiceApi.patch<MissedCall>(`${BASE}/missed-calls/${id}/`, body),
  },
  audit: (action?: string) => voiceApi.get<AuditEntry[]>(`${BASE}/audit-log/${qs({ action })}`),
  transferTargets: () => voiceApi.get<TransferTargets>(`${BASE}/transfer-targets/`),
  transferCall: (
    callId: string,
    body: { target_type: "agent" | "team"; target_id: string; mode: TransferMode; note?: string },
  ) => voiceApi.post<CallTransferRow>(`${BASE}/calls/${callId}/transfer/`, body),
  settings: {
    get: () => voiceApi.get<CallCenterSettings>(`${BASE}/settings/`),
    patch: (body: { is_live?: boolean; wizard_step?: number }) => voiceApi.patch<CallCenterSettings>(`${BASE}/settings/`, body),
  },
  generateIvr: (body: { greeting?: string; company_name?: string; replace_active?: boolean; team_ids?: string[] }) =>
    voiceApi.post<GeneratedIvr & { code?: string }>(`${BASE}/setup/generate-ivr/`, body),
  calls: (params: {
    direction?: string;
    team?: string;
    agent?: string;
    q?: string;
    days?: number;
    missed?: boolean;
    page?: number;
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
  | { ok: true; agent: CCAgent; temporaryPassword: string }
  | {
      ok: false;
      /** "account" — nothing was created. "profile" — the login exists but has no agent profile yet. */
      failedAt: "account" | "profile";
      error: string;
      userId?: number;
      temporaryPassword?: string;
    };

export async function provisionAgent(input: ProvisionAgentInput): Promise<ProvisionAgentResult> {
  const account: ApiResponse<{ user_id: number; temporary_password: string }> = await apiClient.createAgentAccount(
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

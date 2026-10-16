// Client for the AI voice assistant endpoints of the SENDA Voice backend (`/api/ai-agent/`).
import { voiceApi } from "@/services/voiceApi";

const BASE = "/ai-agent";

export type Department = "sales" | "technical_support" | "billing" | "complaints" | "general";
export const DEPARTMENTS: Department[] = ["sales", "technical_support", "billing", "complaints", "general"];
export type AgentStatus = "draft" | "test" | "published" | "paused" | "archived";

export interface AgentSettings {
  languages: Array<"sw" | "en">;
  default_language: "sw" | "en";
  greeting: string;
  closing: string;
  knowledge: string;
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  reasoning: { credential_id: string; model: string; temperature: number; timeout_seconds: number; fallback_credential_id: string; allow_fallback: boolean };
  voice: { provider: "africas_talking" | "elevenlabs"; voice: string; eleven_voice_id: string; eleven_model: string; tts_timeout_seconds: number };
  listening: { provider: "default" | "elevenlabs" };
  handoff: {
    departments: Record<Department, string>;
    default_department: Department;
    max_unresolved_attempts: number;
    escalate_complaints: boolean;
    escalate_sensitive: boolean;
    keywords: string[];
  };
  hours: { after_hours: "take_message" | "voicemail" };
  limits: { max_turns: number; max_call_seconds: number; max_tool_calls: number; daily_call_cap: number };
  notifications: {
    internal_emails: Record<Department, string[]>;
    default_internal: string[];
    customer_confirmation: boolean;
    customer_subject: string;
    customer_body: string;
  };
}

export interface AgentConfigSummary {
  id: string;
  name: string;
  purpose: string;
  personality: string;
  status: AgentStatus;
  version: number;
  published_at: string | null;
  updated_at: string;
  has_unpublished_changes: boolean;
}

export interface AgentConfig extends AgentConfigSummary {
  settings: AgentSettings;
  live_settings: AgentSettings | null;
}

export interface ProviderInfo {
  id: string;
  name: string;
  type: "openai" | "huggingface" | "elevenlabs";
  is_default: boolean;
  roles: Array<"reasoning" | "listening" | "voice">;
  /** Only sent as false to SENDA staff, so a switched-off provider can be explained instead of silently missing. */
  is_active?: boolean;
}

export interface ProviderCheck {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string; ms: number }>;
}

export interface Policy {
  recording_notice_enabled: boolean;
  recording_notice_text: string;
  retention_days: number;
}

export interface SimulationResult {
  reply: string;
  action: "continue" | "transfer" | "create_request" | "end";
  language: string;
  department: string;
  category: string;
  intent: string;
  sentiment: string;
  understood: boolean;
  reason: string;
  request: Record<string, string>;
  case_summary: string;
  availability: { configured: boolean; open: boolean; free_agents: number; queue: boolean; can_take: boolean } | null;
  guarded: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  used_fallback: boolean;
}

export interface HandoffSummary {
  why_called?: string;
  needs?: string;
  explained?: string;
  unresolved?: string;
  next_steps?: string;
  case?: string;
}

/** What rides along with a ringing call that the AI assistant handled first. */
export interface AiHandoffPacket {
  session_id: string;
  department: string;
  reason: string;
  language: string;
  category: string;
  sentiment: string;
  summary: HandoffSummary;
  last_turns: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface AiSession {
  id: string;
  call_id: string;
  handled_by: "ai" | "human" | "transferred" | "abandoned";
  language: string;
  turns: number;
  category: string;
  intent: string;
  sentiment: string;
  escalation_reason: string;
  escalation_department: string;
  transfer_outcome: string;
  summary: HandoffSummary;
  summary_status: string;
  consent_status: string;
  provider: string;
  model: string;
  latency_ms_total: number;
  provider_errors: number;
  config_version: number;
  created_at: string;
  tickets: Array<{ id: string; reference: string; status: string }>;
  transcript?: Array<{ role: "user" | "assistant"; text: string; at: string }>;
  from_number?: string;
}

export type TicketStatus = "open" | "assigned" | "pending_customer" | "resolved" | "closed";
export interface Ticket {
  id: string;
  reference: string;
  request_type: "callback" | "email" | "human_review" | "ticket";
  department: string;
  category: string;
  title: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  assigned_to: string | null;
  assigned_name: string;
  call_id: string | null;
  created_at: string;
  updated_at: string;
  created_by_ai: boolean;
  description?: string;
  preferred_callback_note?: string;
  resolved_at?: string | null;
  summary?: HandoffSummary;
  notifications?: Array<{ id: string; kind: "internal" | "customer"; to: string; status: "pending" | "sent" | "failed" | "skipped"; attempts: number; last_error: string; sent_at: string | null }>;
}

export interface Usage {
  days: number;
  calls: number;
  handled_by_ai: number;
  transferred: number;
  abandoned: number;
  turns: number;
  avg_reasoning_ms: number;
  provider_errors: number;
  tickets_open: number;
  emails_failed: number;
  emails_pending: number;
}

export interface AuditRow {
  id: number;
  action: string;
  actor: string;
  at: string;
  metadata: Record<string, unknown>;
}

export interface TeachProposal {
  language: "sw" | "en";
  purpose: string;
  personality: string;
  greeting: string;
  closing: string;
  knowledge: string;
  gaps: string[];
  warnings: string[];
  current: { purpose: string; personality: string; greeting: string; closing: string; knowledge: string };
}

export interface LearnQuestion {
  question: string;
  count: number;
  why: "not_sure" | "handed_over";
  examples: Array<{ text: string; at: string; call_id: string }>;
}

export interface LearnResult {
  analyzed_calls: number;
  days: number;
  mode: "ai" | "plain";
  note: string;
  questions: LearnQuestion[];
}

export interface TeachJob<T = TeachProposal | LearnResult> {
  id: string;
  kind: "teach" | "learn";
  status: "pending" | "running" | "done" | "failed";
  error: string;
  result: T | null;
  /** While it reads a long text: how many pieces are done of how many. */
  progress?: { done: number; total: number } | null;
}

export const aiAgentApi = {
  teach: {
    models: (id: string, providerId?: string) =>
      voiceApi.get<{ provider: string; type: string; models: string[]; current: string }>(`${BASE}/agents/${id}/models/${providerId ? `?provider_id=${encodeURIComponent(providerId)}` : ""}`),
    start: (id: string, body: { text?: string; url?: string; mode: "replace" | "merge"; provider_id?: string; model?: string }) => voiceApi.post<TeachJob<TeachProposal>>(`${BASE}/agents/${id}/teach/`, body),
    learn: (id: string, days: number, ai: { provider_id?: string; model?: string } = {}) => voiceApi.post<TeachJob<LearnResult>>(`${BASE}/agents/${id}/learn/`, { days, ...ai }),
    job: <T,>(jobId: string) => voiceApi.get<TeachJob<T>>(`${BASE}/teach-jobs/${jobId}/`),
    apply: (id: string, body: { items: Array<{ question: string; answer: string }>; dismiss: string[] }) =>
      voiceApi.post<{ added: number }>(`${BASE}/agents/${id}/learn/apply/`, body),
  },
  providers: () => voiceApi.get<{ providers: ProviderInfo[] }>(`${BASE}/providers/`),
  testProvider: (id: string) => voiceApi.post<ProviderCheck>(`${BASE}/providers/${id}/test/`),
  agents: {
    list: () => voiceApi.get<{ results: AgentConfigSummary[] }>(`${BASE}/agents/`),
    get: (id: string) => voiceApi.get<AgentConfig>(`${BASE}/agents/${id}/`),
    create: (body: { name: string; purpose?: string; personality?: string; settings?: Partial<AgentSettings> }) => voiceApi.post<AgentConfig>(`${BASE}/agents/`, body),
    update: (id: string, body: Partial<Pick<AgentConfig, "name" | "purpose" | "personality">> & { settings?: AgentSettings }) => voiceApi.patch<AgentConfig>(`${BASE}/agents/${id}/`, body),
    remove: (id: string) => voiceApi.delete(`${BASE}/agents/${id}/`),
    action: (id: string, action: "publish" | "pause" | "resume" | "archive" | "restore" | "test") => voiceApi.post<AgentConfig & { warnings?: string[] }>(`${BASE}/agents/${id}/${action}/`),
    simulate: (id: string, body: { text: string; history: Array<{ role: "user" | "assistant"; content: string }>; language?: string; settings?: AgentSettings }) =>
      voiceApi.post<SimulationResult>(`${BASE}/agents/${id}/simulate/`, body),
    history: (id: string) => voiceApi.get<{ results: AuditRow[] }>(`${BASE}/agents/${id}/history/`),
  },
  policy: {
    get: () => voiceApi.get<Policy>(`${BASE}/policy/`),
    save: (body: Policy) => voiceApi.put<Policy>(`${BASE}/policy/`, body),
  },
  usage: (days = 30) => voiceApi.get<Usage>(`${BASE}/usage/?days=${days}`),
  sessions: (handledBy?: string) => voiceApi.get<{ results: AiSession[] }>(`${BASE}/sessions/${handledBy ? `?handled_by=${handledBy}` : ""}`),
  sessionForCall: (callId: string) => voiceApi.get<{ session: AiSession | null }>(`${BASE}/sessions/by-call/${callId}/`),
  deleteCallData: (callId: string) => voiceApi.delete<{ recordings: number; transcripts: number }>(`${BASE}/calls/${callId}/data/`),
  tickets: {
    list: (params: { status?: string; q?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.q) q.set("q", params.q);
      const s = q.toString();
      return voiceApi.get<{ results: Ticket[] }>(`${BASE}/tickets/${s ? `?${s}` : ""}`);
    },
    get: (id: string) => voiceApi.get<Ticket>(`${BASE}/tickets/${id}/`),
    update: (id: string, body: { status?: TicketStatus; priority?: string; assigned_to?: string | null }) => voiceApi.patch<Ticket>(`${BASE}/tickets/${id}/`, body),
  },
  retryEmail: (id: string) => voiceApi.post<{ status: string }>(`${BASE}/notifications/${id}/retry/`),
};

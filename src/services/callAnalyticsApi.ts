// Typed client for the IVR / call-center analytics endpoints (senda_voice_backend `voice/analytics_views.py`).
// Every figure comes from the server; the browser never aggregates call lists itself.
import type { ApiResponse } from "@/lib/api";
import { voiceApi } from "@/services/voiceApi";

const BASE = "/voice/call-center/analytics";

export type RangePreset = "today" | "yesterday" | "last_7" | "last_30" | "this_month" | "last_month" | "custom";

export interface AnalyticsFilters {
  range: RangePreset;
  date_from?: string;
  date_to?: string;
  agent?: string;
  team?: string;
  number?: string;
  direction?: "inbound" | "outbound" | "";
  outcome?: string;
  flow?: string;
}

/** Filters that apply to the calls list only (set by clicking a chart, a topic, a problem...). */
export interface CallListFilters {
  filter?: string;
  topic?: string;
  intent?: string;
  sentiment?: string;
  resolution?: string;
  problem?: string;
  page?: number;
}

export interface Access {
  voice: boolean;
  reporting: boolean;
  ai_analysis: boolean;
  role: string;
  timezone: string;
  presets: RangePreset[];
  outcomes: string[];
}

export interface FilterOptions {
  agents: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  numbers: Array<{ id: string; label: string; phone_number: string }>;
  flows: Array<{ id: string; name: string }>;
  outcomes: string[];
}

export interface Kpi<T = number | null> {
  value: T;
  previous: T;
  change: number | null;
  unit: "count" | "ratio" | "seconds";
  definition: string;
}

export interface Summary {
  period: { start: string; end: string; preset: string; timezone: string };
  previous_period: { start: string; end: string };
  kpis: {
    total_calls: Kpi; answered: Kpi; missed: Kpi; failed: Kpi; answer_rate: Kpi; missed_rate: Kpi;
    avg_wait_seconds: Kpi; avg_talk_seconds: Kpi; total_talk_seconds: Kpi;
    unresolved: Kpi & { ai_estimated: number };
  };
  live: { waiting_now: number; definition: string };
  pending_followups: { total: number; tasks: number; missed_callbacks: number; overdue: number; definition: string };
  breakdown: {
    inbound: number; outbound: number; eligible_inbound: number; answered_by_agent: number;
    answered_without_agent: number; voicemail: number; in_progress: number;
  };
  generated_at: string;
}

export interface Activity {
  granularity: "hour" | "day" | "week";
  timezone: string;
  points: Array<{ bucket: string; incoming: number; outgoing: number; answered: number; missed: number; failed: number }>;
}

export interface Outcomes {
  total: number;
  segments: Array<{ label: string; count: number; share: number | null; filter: { outcome: string } }>;
  definitions: Record<string, string>;
}

export interface DirectionStats {
  calls: number;
  answered: number;
  answer_rate: number | null;
  failure_rate: number | null;
  connected_talk_seconds: number;
  avg_duration_seconds: number | null;
}
export interface Directions {
  inbound: DirectionStats;
  outbound: DirectionStats;
  definitions: Record<string, string>;
}

export interface Heatmap {
  timezone: string;
  days: string[];
  total: number[][];
  missed: number[][];
  inbound_calls: number;
  busiest: Array<{ day: number; hour: number; total: number; missed: number }>;
  high_missed: Array<{ day: number; hour: number; total: number; missed: number }>;
  definition: string;
}

export interface AgentRow {
  id: string;
  name: string;
  teams: string[];
  status: string;
  last_seen_at: string | null;
  offered: number;
  answered: number;
  declined: number;
  unanswered: number;
  cancelled: number;
  answer_rate: number | null;
  avg_wait_seconds: number | null;
  avg_handle_seconds: number | null;
  talk_seconds: number;
  transfers_made: number;
  transfers_received: number;
  unresolved: number;
  pending_followups: number;
  last_activity: string | null;
}
export interface Agents {
  agents: AgentRow[];
  definitions: Record<string, string>;
}
export interface AgentDetail extends AgentRow {
  trend: Array<{ day: string; answered: number; talk_seconds: number }>;
  definitions: Record<string, string>;
  preserved_for_transfers: string;
}

export interface IvrFlowRow {
  id: string;
  name: string;
  status: string;
  entered: number;
  tracked_calls: number;
  transferred_to_agents: number;
  answered_after_transfer: number;
  failed_to_reach_agent: number;
  abandoned_in_ivr: number;
  avg_ivr_seconds: number | null;
  completion_rate: number | null;
  abandon_rate: number | null;
}
export interface IvrFlows {
  flows: IvrFlowRow[];
  definitions: Record<string, string>;
  tracking_note: string;
}
export interface IvrFlowDetail extends IvrFlowRow {
  steps: Array<{
    node_id: string; type: string; label: string; calls: number;
    choices: Array<{ branch: string; input: string | null; calls: number }>;
  }>;
  exit_points: Array<{ node_id: string; type: string; label: string; calls: number }>;
}

export interface ShareRow {
  key: string;
  label: string;
  calls: number;
  share: number | null;
  previous_calls: number;
  previous_share: number | null;
  change_points: number | null;
  filter: Record<string, string>;
}
export interface QualityOverview {
  recorded: number; not_analysed: number; awaiting: number; failed: number; transcribed: number;
  poor: number; needs_review: number; analysis_unusable: number; definitions: Record<string, string>;
}
export interface Intelligence {
  entitled: boolean;
  reason?: string;
  coverage?: { analysed_calls: number; categorized_calls: number; note: string };
  topics?: ShareRow[];
  intents?: ShareRow[];
  sentiment?: { disclaimer: string; counts: Record<string, number>; analysed: number };
  problems?: {
    rows: Array<{ problem: string; calls: number; previous_calls: number; unresolved: number; trend: "up" | "down" | "flat"; filter: { problem: string } }>;
    truncated: boolean;
    note: string;
  };
  quality?: QualityOverview;
}

export interface CallRow {
  id: string;
  started_at: string;
  direction: "inbound" | "outbound";
  caller: string;
  destination: string;
  outcome: string;
  answered_by: string;
  answered_endpoint: string;
  connected_seconds: number | null;
  ivr_flow: { id: string; name: string } | null;
  summary: string | null;
  ai_generated_summary: boolean;
  topic: string | null;
  resolution: string | null;
  disposition: string | null;
  followups_open: number;
  callback_open: boolean;
  has_recording: boolean;
  has_transcript: boolean;
  analysis_status: string | null;
  transcript_quality: string | null;
  transfers: number;
}
export interface CallsPage {
  count: number;
  page: number;
  page_size: number;
  results: CallRow[];
}

export interface FollowUpItem {
  kind: "task" | "missed_callback";
  id: string;
  call_id: string;
  title: string;
  assigned_to: string;
  due_date: string | null;
  overdue: boolean;
  created_at: string;
  caller: string;
}
export interface FollowUps {
  count: number;
  page: number;
  page_size: number;
  results: FollowUpItem[];
  total: number;
  tasks: number;
  missed_callbacks: number;
  overdue: number;
}

export interface Insight {
  id: string;
  severity: "alert" | "warning" | "info";
  fact: string;
  period: string;
  metric: Record<string, number | null>;
  why_it_matters: string;
  suggestion: string;
  drilldown: Record<string, string>;
}
export interface Insights {
  insights: Insight[];
  minimum_calls: number;
  note: string;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function base(f: AnalyticsFilters) {
  return {
    range: f.range, date_from: f.range === "custom" ? f.date_from : undefined, date_to: f.range === "custom" ? f.date_to : undefined,
    agent: f.agent, team: f.team, number: f.number, direction: f.direction, outcome: f.outcome, flow: f.flow,
  };
}

/** Unwraps an ApiResponse into data, throwing a message the screen can show. */
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  if (!res.success || res.data === undefined) {
    const error = new Error(res.error || "Could not load this section.") as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.data;
}

export const callAnalyticsApi = {
  access: () => unwrap(voiceApi.get<Access>(`${BASE}/access/`)),
  filters: () => unwrap(voiceApi.get<FilterOptions>(`${BASE}/filters/`)),
  summary: (f: AnalyticsFilters) => unwrap(voiceApi.get<Summary>(`${BASE}/summary/${qs(base(f))}`)),
  activity: (f: AnalyticsFilters) => unwrap(voiceApi.get<Activity>(`${BASE}/activity/${qs(base(f))}`)),
  outcomes: (f: AnalyticsFilters) => unwrap(voiceApi.get<Outcomes>(`${BASE}/outcomes/${qs(base(f))}`)),
  directions: (f: AnalyticsFilters) => unwrap(voiceApi.get<Directions>(`${BASE}/directions/${qs(base(f))}`)),
  heatmap: (f: AnalyticsFilters) => unwrap(voiceApi.get<Heatmap>(`${BASE}/heatmap/${qs(base(f))}`)),
  agents: (f: AnalyticsFilters) => unwrap(voiceApi.get<Agents>(`${BASE}/agents/${qs(base(f))}`)),
  agent: (id: string, f: AnalyticsFilters) => unwrap(voiceApi.get<AgentDetail>(`${BASE}/agents/${id}/${qs(base(f))}`)),
  ivr: (f: AnalyticsFilters) => unwrap(voiceApi.get<IvrFlows>(`${BASE}/ivr/${qs(base(f))}`)),
  ivrFlow: (id: string, f: AnalyticsFilters) => unwrap(voiceApi.get<IvrFlowDetail>(`${BASE}/ivr/${id}/${qs(base(f))}`)),
  intelligence: (f: AnalyticsFilters) => unwrap(voiceApi.get<Intelligence>(`${BASE}/intelligence/${qs(base(f))}`)),
  insights: (f: AnalyticsFilters) => unwrap(voiceApi.get<Insights>(`${BASE}/insights/${qs(base(f))}`)),
  calls: (f: AnalyticsFilters, c: CallListFilters) =>
    unwrap(voiceApi.get<CallsPage>(`${BASE}/calls/${qs({ ...base(f), ...c, page_size: 25 })}`)),
  followups: (page = 1) => unwrap(voiceApi.get<FollowUps>(`${BASE}/followups/${qs({ page })}`)),
  createFollowUp: (callId: string, body: { title: string; assigned_to?: string; due_date?: string }) =>
    voiceApi.post(`${BASE}/calls/${callId}/followups/`, body),
  finishFollowUp: (id: string, status: "done" | "cancelled") => voiceApi.post(`${BASE}/followups/${id}/finish/`, { status }),
};

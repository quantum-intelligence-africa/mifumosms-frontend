// Real figures for the Analytics page. Nothing here is estimated: every number comes from one of
//   GET /messaging/analytics/sms/summary/   (SMS usage log: messages, segments, cost, sent / failed)
//   GET /messaging/analytics/sms/by-path/   (the same, grouped by how the SMS was sent)
//   GET /messaging/analytics/sms/daily/     (the same, one row per day)
//   GET /messaging/analytics/overview/      (conversation messages, contacts; all time, not date-bound)
//   GET /messaging/campaigns/               (per-campaign sent / delivered / read / failed / cost)
//   GET /messaging/campaigns/{id}/analytics/ (one campaign)
import { apiClient } from "@/lib/api";

export type RangeKey = "7d" | "30d" | "90d" | "1y";
export const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

export interface SmsSummary {
  start_date: string;
  end_date: string;
  total_messages: number;
  total_segments: number;
  total_cost: number;
  successful_count: number;
  failed_count: number;
  success_rate: number;
}

export interface PathUsage {
  count: number;
  segments: number;
  cost: number;
  successful: number;
}
export type ByPath = Record<string, PathUsage>;

export interface DailyRow {
  date: string;
  messages: number;
  segments: number;
  cost: number;
  successful: number;
  failed: number;
}

export interface AnalyticsOverview {
  messages: { total: number; sent: number; delivered: number; read: number; delivery_rate: number; read_rate: number };
  conversations: { total: number; open: number };
  contacts: { total: number; opted_in: number; opt_in_rate: number };
  cost: { total_dollars: number; total_micro: number };
}

export interface CampaignRow {
  id: string;
  name: string;
  campaign_type_display?: string;
  status: string;
  status_display?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  actual_cost: number;
  created_at: string;
  started_at?: string | null;
}

export interface CampaignDetail {
  campaign_id: string;
  campaign_name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  progress_percentage: number;
  delivery_rate: number;
  read_rate: number;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AnalyticsData {
  range: RangeKey;
  startDate: string;
  endDate: string;
  summary: SmsSummary | null;
  previous: SmsSummary | null;
  byPath: ByPath | null;
  daily: DailyRow[] | null;
  overview: AnalyticsOverview | null;
  campaigns: CampaignRow[] | null;
  campaignDetail: CampaignDetail | null;
  /** Names of the requests that failed, so the page can say which part is missing. */
  failed: string[];
}

const ymd = (d: Date) => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export function rangeDates(range: RangeKey, now = new Date()) {
  const days = RANGE_DAYS[range];
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return { start: ymd(start), end: ymd(end), prevStart: ymd(prevStart), prevEnd: ymd(prevEnd) };
}

async function get<T>(path: string): Promise<T> {
  const res = await apiClient.call<T>(path);
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.error || res.message || "Request failed");
  }
  return res.data;
}

const unwrap = <T,>(body: { data?: T } | T): T => ((body as { data?: T }).data !== undefined ? (body as { data: T }).data : (body as T));

export async function loadAnalytics(range: RangeKey, campaignId?: string | null): Promise<AnalyticsData> {
  const { start, end, prevStart, prevEnd } = rangeDates(range);
  const q = (s: string, e: string) => `?start_date=${s}&end_date=${e}`;
  const failed: string[] = [];

  const settle = async <T,>(name: string, job: Promise<T>): Promise<T | null> => {
    try {
      return await job;
    } catch {
      failed.push(name);
      return null;
    }
  };

  const [summary, previous, byPath, daily, overview, campaignList, campaignDetail] = await Promise.all([
    settle("summary", get<{ data: SmsSummary }>(`/messaging/analytics/sms/summary/${q(start, end)}`).then(unwrap)),
    settle("previous", get<{ data: SmsSummary }>(`/messaging/analytics/sms/summary/${q(prevStart, prevEnd)}`).then(unwrap)),
    settle("by-path", get<{ data: ByPath }>(`/messaging/analytics/sms/by-path/${q(start, end)}`).then(unwrap)),
    settle("daily", get<{ data: DailyRow[] }>(`/messaging/analytics/sms/daily/${q(start, end)}`).then(unwrap)),
    settle("overview", get<AnalyticsOverview>("/messaging/analytics/overview/")),
    settle("campaigns", get<{ results?: CampaignRow[] } | CampaignRow[]>("/messaging/campaigns/?page_size=200&ordering=-created_at")),
    campaignId
      ? settle("campaign", get<{ analytics: CampaignDetail }>(`/messaging/campaigns/${campaignId}/analytics/`).then((b) => b.analytics))
      : Promise.resolve(null),
  ]);

  const all = Array.isArray(campaignList) ? campaignList : campaignList?.results ?? null;
  // Campaigns that started (or, if never started, were created) inside the chosen range.
  const campaigns = all
    ? all.filter((c) => {
        const when = (c.started_at || c.created_at || "").slice(0, 10);
        return when >= start && when <= end;
      })
    : null;

  return { range, startDate: start, endDate: end, summary, previous, byPath, daily, overview, campaigns, campaignDetail, failed };
}

/** Percent change from `before` to `now`, or null when there is nothing to compare against. */
export function percentChange(now: number, before: number | undefined | null): number | null {
  if (before === undefined || before === null || before <= 0) return null;
  return ((now - before) / before) * 100;
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** One CSV with every section of the report (summary, by sending path, per day, campaigns). */
export function buildAnalyticsCsv(data: AnalyticsData): string {
  const rows: unknown[][] = [];
  rows.push(["Report", `${data.startDate} to ${data.endDate}`]);
  rows.push([]);
  if (data.summary) {
    const s = data.summary;
    rows.push(["SMS summary"]);
    rows.push(["messages", "segments", "cost", "sent", "failed", "success_rate_percent"]);
    rows.push([s.total_messages, s.total_segments, s.total_cost, s.successful_count, s.failed_count, s.success_rate.toFixed(1)]);
    rows.push([]);
  }
  if (data.byPath) {
    rows.push(["SMS by sending path"]);
    rows.push(["path", "messages", "segments", "cost", "sent"]);
    Object.entries(data.byPath).forEach(([path, v]) => rows.push([path, v.count, v.segments, v.cost, v.successful]));
    rows.push([]);
  }
  if (data.daily) {
    rows.push(["SMS per day"]);
    rows.push(["date", "messages", "segments", "cost", "sent", "failed"]);
    data.daily.forEach((d) => rows.push([d.date, d.messages, d.segments, d.cost, d.successful, d.failed]));
    rows.push([]);
  }
  if (data.campaigns) {
    rows.push(["Campaigns"]);
    rows.push(["name", "status", "recipients", "sent", "delivered", "read", "failed", "cost"]);
    data.campaigns.forEach((c) => rows.push([c.name, c.status, c.total_recipients, c.sent_count, c.delivered_count, c.read_count, c.failed_count, c.actual_cost]));
    rows.push([]);
  }
  if (data.overview) {
    const o = data.overview;
    rows.push(["Conversations and contacts (all time)"]);
    rows.push(["conversation_messages", "delivered", "read", "conversations", "open_conversations", "contacts", "opted_in_contacts"]);
    rows.push([o.messages.total, o.messages.delivered, o.messages.read, o.conversations.total, o.conversations.open, o.contacts.total, o.contacts.opted_in]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

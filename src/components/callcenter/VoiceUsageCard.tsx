// The organization's own voice usage: allowance, confirmed minutes vs minutes held for calls in progress, notices, recent calls.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { ccKey } from "@/i18n/callCenter";
import { appLocale } from "@/utils/appLocale";
import { voiceApi } from "@/services/voiceApi";

interface MeterUsage {
  meter: "inbound" | "outbound" | "shared";
  limit: number | null;
  configured: boolean;
  used: number;
  reserved: number;
  remaining: number | null;
  percent: number | null;
  exhausted: boolean;
}
interface CallRow { call_id: string; direction: string; started_at: string; call_seconds: number; billable_minutes: number; from_number?: string; to_number?: string }
interface MinuteRequestRow { id: string; meter: string; minutes: number; note: string; status: "pending" | "approved" | "declined"; response: string; granted_minutes: number | null; created_at: string }
interface UsagePayload {
  meters: MeterUsage[];
  active_calls: number;
  notices: Array<{ id: string; meter: string; threshold: number; at: string; message_en: string; message_sw: string; unread: boolean }>;
  recent_calls: Array<{ call_id: string; direction: string; started_at: string; call_seconds: number; billable_minutes: number }>;
}

export function VoiceUsageCard() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<UsagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [callCount, setCallCount] = useState(0);
  const [callPage, setCallPage] = useState(1);
  const [requests, setRequests] = useState<MinuteRequestRow[]>([]);
  const [reqMeter, setReqMeter] = useState("");
  const [reqMinutes, setReqMinutes] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [sending, setSending] = useState(false);

  const loadCalls = useCallback(async (page: number) => {
    const res = await voiceApi.get<{ count: number; results: CallRow[] }>(`/voice/usage/calls/?page=${page}`);
    if (res.success && res.data) {
      setCalls((prev) => (page === 1 ? res.data!.results : [...prev, ...res.data!.results]));
      setCallCount(res.data.count);
      setCallPage(page);
    }
  }, []);
  const loadRequests = useCallback(async () => {
    const res = await voiceApi.get<MinuteRequestRow[]>("/voice/usage/requests/");
    if (res.success && res.data) setRequests(res.data);
  }, []);
  const sendRequest = async () => {
    setSending(true);
    const res = await voiceApi.post("/voice/usage/requests/", { meter: reqMeter, minutes: Number(reqMinutes), note: reqNote });
    setSending(false);
    if (res.success) {
      toast({ title: t(ccKey("cc.usage.request_sent")) });
      setReqMinutes("");
      setReqNote("");
      void loadRequests();
    } else {
      toast({ title: t(ccKey("cc.usage.request_failed")), description: res.error || undefined, variant: "destructive" });
    }
  };

  const load = useCallback(async () => {
    const res = await voiceApi.get<UsagePayload>("/voice/usage/");
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else if (res.status !== 403) {
      setError(res.error || t("cc.usage.load_failed"));
    }
  }, [t]);

  useEffect(() => {
    void load();
    void loadCalls(1);
    void loadRequests();
  }, [load, loadCalls, loadRequests]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;
  const unread = data.notices.filter((n) => n.unread);
  const markRead = async () => {
    await voiceApi.post("/voice/usage/notices/read/", {});
    void load();
  };
  const when = (iso: string) => new Date(iso).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" });
  const length = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {t(ccKey("cc.usage.title"))}
          {data.active_calls > 0 && <span className="text-xs font-normal text-muted-foreground">{t(ccKey("cc.usage.active_calls"), { n: data.active_calls })}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unread.map((n) => (
          <p key={n.id} className="flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{language === "sw" ? n.message_sw : n.message_en}</span>
          </p>
        ))}
        {unread.length > 0 && (
          <Button size="sm" variant="outline" onClick={markRead}>{t(ccKey("cc.usage.mark_read"))}</Button>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {data.meters.map((m) => {
            const pct = Math.min(100, Math.round(m.percent ?? 0));
            return (
              <div key={m.meter} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{t(ccKey(`cc.usage.meter_${m.meter}`))}</span>
                  <span className={m.exhausted ? "font-semibold text-destructive" : "font-medium"}>
                    {m.configured ? t(ccKey("cc.usage.used_of"), { used: Math.round(m.used), limit: m.limit ?? 0 }) : t(ccKey("cc.usage.no_allowance"))}
                  </span>
                </div>
                {m.configured && <Progress value={pct} className={pct >= 100 ? "[&>div]:bg-destructive" : pct >= 80 ? "[&>div]:bg-amber-500" : ""} />}
                {m.configured && (
                  <p className="text-xs text-muted-foreground">
                    {t(ccKey("cc.usage.remaining"), { n: Math.floor(m.remaining ?? 0) })}
                    {m.reserved > 0 ? ` · ${t(ccKey("cc.usage.held"), { n: m.reserved })}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {calls.length > 0 && (
          <div className="overflow-x-auto">
            <p className="mb-1 text-sm font-medium">{t(ccKey("cc.usage.recent"))}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-1 pr-3">{t(ccKey("cc.usage.col_time"))}</th>
                  <th className="py-1 pr-3">{t(ccKey("cc.usage.col_dir"))}</th>
                  <th className="py-1 pr-3">{t(ccKey("cc.usage.col_length"))}</th>
                  <th className="py-1">{t(ccKey("cc.usage.col_billed"))}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.call_id} className="border-t">
                    <td className="py-1 pr-3">{when(c.started_at)}</td>
                    <td className="py-1 pr-3">{t(ccKey(c.direction === "outbound" ? "cc.usage.out" : "cc.usage.in"))}</td>
                    <td className="py-1 pr-3">{length(c.call_seconds)}</td>
                    <td className="py-1">{c.billable_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {calls.length < callCount && (
          <Button size="sm" variant="outline" onClick={() => loadCalls(callPage + 1)}>{t(ccKey("cc.usage.show_more"))}</Button>
        )}
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">{t(ccKey("cc.usage.request_title"))}</p>
          <p className="text-xs text-muted-foreground">{t(ccKey("cc.usage.request_help"))}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-muted-foreground">
              {t(ccKey("cc.usage.request_meter"))}
              <select value={reqMeter || data.meters[0]?.meter} onChange={(e) => setReqMeter(e.target.value)} className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                {data.meters.map((m) => <option key={m.meter} value={m.meter}>{t(ccKey(`cc.usage.meter_${m.meter}`))}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              {t(ccKey("cc.usage.request_minutes"))}
              <input value={reqMinutes} onChange={(e) => setReqMinutes(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 block h-9 w-28 rounded-md border border-input bg-background px-2 text-sm text-foreground" />
            </label>
            <label className="min-w-[180px] flex-1 text-xs text-muted-foreground">
              {t(ccKey("cc.usage.request_note"))}
              <input value={reqNote} onChange={(e) => setReqNote(e.target.value)} maxLength={300} className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground" />
            </label>
            <Button size="sm" onClick={sendRequest} disabled={sending || !reqMinutes}>{t(ccKey("cc.usage.request_send"))}</Button>
          </div>
          {requests.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-medium">{t(ccKey("cc.usage.your_requests"))}</p>
              {requests.map((r) => (
                <p key={r.id} className="text-xs text-muted-foreground">
                  {t(ccKey(`cc.usage.meter_${r.meter}`))} · {r.minutes} min · {when(r.created_at)} ·{" "}
                  <span className="font-medium text-foreground">
                    {r.status === "pending" ? t(ccKey("cc.usage.request_pending")) : r.status === "approved" ? t(ccKey("cc.usage.request_approved"), { n: r.granted_minutes ?? 0 }) : t(ccKey("cc.usage.request_declined"))}
                  </span>
                  {r.response ? ` — ${r.response}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t(ccKey("cc.usage.note"))}</p>
      </CardContent>
    </Card>
  );
}

// The organization's own voice usage: allowance, confirmed minutes vs minutes held for calls in progress, notices, recent calls.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  }, [load]);

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
        {data.recent_calls.length > 0 && (
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
                {data.recent_calls.map((c) => (
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
        <p className="text-xs text-muted-foreground">{t(ccKey("cc.usage.note"))}</p>
      </CardContent>
    </Card>
  );
}

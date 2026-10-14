// Call results for the last 30 days, computed on the server (see `cc_reports.py`). Supervisors and
// admins only; hidden quietly when the plan has no reporting, so an existing page never shows an error
// for something the organization simply does not have.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDuration } from "@/components/callcenter/callUtils";
import { callCenterApi, type ReportSummary } from "@/services/callCenterApi";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div title={hint}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ResultsCard() {
  const { t } = useLanguage();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "hidden">("loading");

  useEffect(() => {
    let cancelled = false;
    callCenterApi.reports.summary({ days: 30 }).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
        setState("ready");
      } else {
        setState("hidden"); // 402 (not in the plan) or any failure: this card is optional
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "hidden") return null;
  if (state === "loading" || !data) return <Skeleton className="h-28" />;

  const { totals, timings, by_endpoint: byEndpoint, definitions } = data;
  const secs = (v: number | null | undefined) => (v == null ? "—" : formatDuration(v));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("cc.reports.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label={t("cc.reports.total")} value={totals.total_calls} />
        <Stat label={t("cc.reports.answered")} value={totals.answered} hint={definitions?.answered} />
        <Stat label={t("cc.reports.missed")} value={totals.missed} hint={definitions?.missed} />
        <Stat label={t("cc.reports.voicemail")} value={totals.voicemail} />
        <Stat label={t("cc.reports.avg_ring")} value={secs(timings.avg_ring_seconds)} />
        <Stat label={t("cc.reports.avg_talk")} value={secs(timings.avg_connected_seconds)} />
        <Stat label={t("cc.reports.via_browser")} value={byEndpoint?.browser ?? 0} />
        <Stat label={t("cc.reports.via_phone")} value={byEndpoint?.phone ?? 0} />
      </CardContent>
    </Card>
  );
}

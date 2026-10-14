// IVR / call-center analytics dashboard: what happened to the calls, how agents and IVR flows performed, what customers
// talked about, and what needs attention. Figures come from the server; sections the account is not entitled to are hidden
// (and the server refuses them anyway).
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { TABS, useAccess, useAnalyticsState, useSummary, type AnalyticsTab } from "@/hooks/useCallAnalytics";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { AgentsSection, IvrSection } from "@/components/callcenter/analytics/AgentsAndIvr";
import { CallsSection } from "@/components/callcenter/analytics/CallsSection";
import { InsightsPanel, IntelligenceSection } from "@/components/callcenter/analytics/IntelligenceAndInsights";
import { ActivityChart, DirectionCompare, FilterBar, Kpis, OutcomeDonut, PeakHours } from "@/components/callcenter/analytics/Overview";
import { fmtDateTime } from "@/components/callcenter/analytics/shared";

export default function CallAnalytics() {
  const { t } = useLanguage();
  const access = useAccess();
  const { filters, callFilters, tab, update, drillDown, clear } = useAnalyticsState();
  const queryClient = useQueryClient();
  const summary = useSummary(filters);
  const activeTab: AnalyticsTab = TABS.includes(tab) ? tab : "overview";

  if (access.isLoading) {
    return <PageFrame title={t("an.title")}><Skeleton className="h-64" /></PageFrame>;
  }
  // Refused (no voice access, not a supervisor, or the plan has no reporting): say so plainly, show nothing else.
  if (access.error || !access.data || !access.data.voice) {
    return (
      <PageFrame title={t("an.title")}>
        <Card><CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{(access.error as Error | null)?.message || t("an.no_access")}</p>
        </CardContent></Card>
      </PageFrame>
    );
  }
  if (!access.data.reporting) {
    return (
      <PageFrame title={t("an.title")}>
        <Card><CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-amber-600" />
          <p className="text-sm text-muted-foreground">{t("an.not_in_plan")}</p>
        </CardContent></Card>
      </PageFrame>
    );
  }

  const ai = access.data.ai_analysis;
  const common = { filters, drillDown };
  return (
    <PageFrame
      title={t("an.title")}
      width="max-w-7xl"
      subtitle={t("an.subtitle", { tz: access.data.timezone })}
      actions={
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["call-analytics"] })}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {t("common.refresh")}
        </Button>
      }
    >
      <FilterBar filters={filters} update={update} clear={clear} />
      {summary.data && (
        <p className="text-xs text-muted-foreground">
          {t("an.period", { from: fmtDateTime(summary.data.period.start), to: fmtDateTime(summary.data.period.end) })}
        </p>
      )}

      <Tabs value={activeTab} onValueChange={(v) => update({ tab: v }, { keepPage: true })} className="space-y-3">
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.filter((id) => id !== "conversations" || ai).map((id) => (
            <TabsTrigger key={id} value={id}>{t(`an.tab.${id}` as "an.tab.overview")}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <Kpis {...common} />
          <InsightsPanel {...common} />
          <ActivityChart {...common} />
          <div className="grid gap-3 lg:grid-cols-2">
            <OutcomeDonut {...common} />
            <DirectionCompare {...common} />
          </div>
          <PeakHours {...common} />
        </TabsContent>

        <TabsContent value="agents"><AgentsSection {...common} /></TabsContent>
        <TabsContent value="ivr"><IvrSection {...common} /></TabsContent>
        {ai && <TabsContent value="conversations"><IntelligenceSection {...common} enabled={ai} /></TabsContent>}
        <TabsContent value="calls">
          <CallsSection filters={filters} callFilters={callFilters} update={update} aiEnabled={ai} />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}

// Analytics state lives in the URL (?range=last_7&agent=…&tab=calls&filter=missed) so every drill-down from a chart is a
// link that can be bookmarked or shared, and the browser's back button undoes it.
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  callAnalyticsApi, type AnalyticsFilters, type CallListFilters, type RangePreset,
} from "@/services/callAnalyticsApi";

export type AnalyticsTab = "overview" | "agents" | "ivr" | "conversations" | "calls";
export const TABS: AnalyticsTab[] = ["overview", "agents", "ivr", "conversations", "calls"];

const FILTER_KEYS = ["agent", "team", "number", "direction", "outcome", "flow"] as const;
const CALL_KEYS = ["filter", "topic", "intent", "sentiment", "resolution", "problem"] as const;

export function useAnalyticsState() {
  const [params, setParams] = useSearchParams();

  const filters: AnalyticsFilters = useMemo(() => {
    const f: AnalyticsFilters = { range: (params.get("range") as RangePreset) || "last_30" };
    if (f.range === "custom") {
      f.date_from = params.get("date_from") ?? undefined;
      f.date_to = params.get("date_to") ?? undefined;
    }
    FILTER_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) (f as unknown as Record<string, string>)[k] = v;
    });
    return f;
  }, [params]);

  const callFilters: CallListFilters = useMemo(() => {
    const c: CallListFilters = { page: Number(params.get("page")) || 1 };
    CALL_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) (c as Record<string, string | number>)[k] = v;
    });
    return c;
  }, [params]);

  const tab = ((params.get("tab") as AnalyticsTab) || "overview") as AnalyticsTab;

  /** Change some params at once; ``null`` removes one. Any change to a filter goes back to page 1. */
  const update = useCallback(
    (changes: Record<string, string | number | null | undefined>, options: { keepPage?: boolean } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([k, v]) => {
            if (v === null || v === undefined || v === "") next.delete(k);
            else next.set(k, String(v));
          });
          if (!options.keepPage && !("page" in changes)) next.delete("page");
          return next;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  /** Open the calls behind a chart point: switch to the calls tab with exactly that filter. */
  const drillDown = useCallback(
    (changes: Record<string, string | null>) => {
      update({ tab: "calls", filter: null, topic: null, intent: null, sentiment: null, resolution: null, problem: null, ...changes });
    },
    [update],
  );

  const clear = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams();
      ["range", "date_from", "date_to", "tab"].forEach((k) => prev.get(k) && next.set(k, prev.get(k) as string));
      return next;
    });
  }, [setParams]);

  return { filters, callFilters, tab, update, drillDown, clear, params };
}

const STALE = 60_000; // figures are aggregates over finished calls: a minute of caching is plenty, and no refetch on tab focus

export const useAccess = () => useQuery({ queryKey: ["call-analytics", "access"], queryFn: callAnalyticsApi.access, staleTime: 5 * 60_000, retry: false });
export const useFilterOptions = () => useQuery({ queryKey: ["call-analytics", "filters"], queryFn: callAnalyticsApi.filters, staleTime: 5 * 60_000 });

export const useSummary = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "summary", f], queryFn: () => callAnalyticsApi.summary(f), staleTime: STALE });
export const useActivity = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "activity", f], queryFn: () => callAnalyticsApi.activity(f), staleTime: STALE });
export const useOutcomes = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "outcomes", f], queryFn: () => callAnalyticsApi.outcomes(f), staleTime: STALE });
export const useDirections = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "directions", f], queryFn: () => callAnalyticsApi.directions(f), staleTime: STALE });
export const useHeatmap = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "heatmap", f], queryFn: () => callAnalyticsApi.heatmap(f), staleTime: STALE });
export const useAgents = (f: AnalyticsFilters, enabled = true) => useQuery({ queryKey: ["call-analytics", "agents", f], queryFn: () => callAnalyticsApi.agents(f), staleTime: STALE, enabled });
export const useAgentDetail = (id: string | null, f: AnalyticsFilters) =>
  useQuery({ queryKey: ["call-analytics", "agent", id, f], queryFn: () => callAnalyticsApi.agent(id as string, f), staleTime: STALE, enabled: !!id });
export const useIvr = (f: AnalyticsFilters, enabled = true) => useQuery({ queryKey: ["call-analytics", "ivr", f], queryFn: () => callAnalyticsApi.ivr(f), staleTime: STALE, enabled });
export const useIvrFlow = (id: string | null, f: AnalyticsFilters) =>
  useQuery({ queryKey: ["call-analytics", "ivr-flow", id, f], queryFn: () => callAnalyticsApi.ivrFlow(id as string, f), staleTime: STALE, enabled: !!id });
export const useIntelligence = (f: AnalyticsFilters, enabled = true) => useQuery({ queryKey: ["call-analytics", "intelligence", f], queryFn: () => callAnalyticsApi.intelligence(f), staleTime: STALE, enabled });
export const useInsights = (f: AnalyticsFilters) => useQuery({ queryKey: ["call-analytics", "insights", f], queryFn: () => callAnalyticsApi.insights(f), staleTime: STALE });
export const useCalls = (f: AnalyticsFilters, c: CallListFilters, enabled = true) =>
  useQuery({ queryKey: ["call-analytics", "calls", f, c], queryFn: () => callAnalyticsApi.calls(f, c), staleTime: 30_000, enabled, placeholderData: (previous) => previous });
export const useFollowUps = (page = 1, enabled = true) => useQuery({ queryKey: ["call-analytics", "followups", page], queryFn: () => callAnalyticsApi.followups(page), staleTime: 30_000, enabled });

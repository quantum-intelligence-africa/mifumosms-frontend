import { useEffect, useState } from "react";
import { voiceApi } from "@/services/voiceApi";

interface CountOnly {
  count: number;
}

interface VoiceAccount {
  is_active: boolean;
}

export interface VoiceDashboardStats {
  totalCalls: number;
  missedCalls: number;
  activeNumbers: number;
  isLoading: boolean;
}

/** Lightweight call/number counters for the main dashboard's IVR metric
 * cards — reuses the same list endpoints CallHistory/VoiceNumbers already
 * call, just reading their `count`/length rather than the full payload. */
export function useVoiceDashboardStats(enabled: boolean): VoiceDashboardStats {
  const [stats, setStats] = useState<VoiceDashboardStats>({
    totalCalls: 0,
    missedCalls: 0,
    activeNumbers: 0,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      const [callsRes, missedRes, accountsRes] = await Promise.all([
        voiceApi.get<CountOnly>("/voice/calls/?days=30"),
        voiceApi.get<CountOnly>("/voice/calls/?days=30&missed=true"),
        voiceApi.get<VoiceAccount[]>("/voice/accounts/"),
      ]);
      if (cancelled) return;
      setStats({
        totalCalls: callsRes.success ? callsRes.data?.count ?? 0 : 0,
        missedCalls: missedRes.success ? missedRes.data?.count ?? 0 : 0,
        activeNumbers: accountsRes.success
          ? (accountsRes.data ?? []).filter((a) => a.is_active).length
          : 0,
        isLoading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return stats;
}

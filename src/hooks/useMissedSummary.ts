import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { callCenterApi } from "@/services/callCenterApi";
import { canUseCallCenter } from "@/utils/roleUtils";

/** How many missed calls still need attention, for the badge on Calls > Missed calls. One cached query shared by every page. */
export function useMissedSummary() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["cc", "missed-summary"],
    queryFn: async () => {
      const res = await callCenterApi.missed.summary();
      return res.success && res.data ? res.data : null;
    },
    enabled: canUseCallCenter(user),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  return data ?? null;
}

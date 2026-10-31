import { useEffect, useState } from "react";
import { callCenterApi, type Meter, type PlanStatus } from "@/services/callCenterApi";

export interface PlanMinutes {
  planName: string | null;
  inbound: Meter | null;
  outbound: Meter | null;
  isLoading: boolean;
}

/**
 * The organization's call minutes against its plan (the same figures as Plan & usage), for the dashboard cards of voice customers.
 * Owners and admins only: the plan endpoint refuses everyone else, in which case nothing is returned and no card is shown.
 * Also nothing is shown until the organization has actually subscribed to a plan.
 */
export function usePlanMinutes(enabled: boolean): PlanMinutes {
  const [state, setState] = useState<PlanMinutes>({ planName: null, inbound: null, outbound: null, isLoading: enabled });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void callCenterApi.plan().then((res) => {
      if (cancelled) return;
      const raw: PlanStatus | undefined = res.success ? res.data : undefined;
      // "default" means nothing was subscribed to: the server only applies entry-plan limits. A new account must not see a plan's minutes as if it had bought them.
      const status = raw?.source === "subscription" ? raw : undefined;
      setState({
        planName: status?.plan?.name ?? null,
        inbound: status?.usage.inbound_minutes ?? null,
        outbound: status?.usage.outbound_minutes ?? null,
        isLoading: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

// Which call-center features the organization's package includes. Admins only can read
// the plan; for anyone else (or while loading) nothing is locked and the server — which
// enforces the plan regardless — has the last word.
import { useEffect, useState } from "react";
import { callCenterApi } from "@/services/callCenterApi";

export interface PlanFlagState {
  smart_routing: boolean;
  working_hours: boolean;
}

export function usePlanFlags(): PlanFlagState {
  const [flags, setFlags] = useState<PlanFlagState>({ smart_routing: true, working_hours: true });
  useEffect(() => {
    let alive = true;
    void callCenterApi.plan().then((res) => {
      if (alive && res.success && res.data?.enforcing) {
        setFlags({ smart_routing: !!res.data.flags.smart_routing, working_hours: !!res.data.flags.working_hours });
      }
    });
    return () => {
      alive = false;
    };
  }, []);
  return flags;
}

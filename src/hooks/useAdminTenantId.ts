import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * The organization an owner/admin acts for when creating agent logins.
 *
 * It is the first active owner/admin membership — the same one the voice service
 * resolves for that person — so the login (main backend) and the agent profile
 * (voice service) land in the same organization. If they ever disagree, the
 * voice service refuses the profile ("not a member of this organization")
 * rather than quietly attaching an agent to the wrong place.
 */
export function useAdminTenantId(): string | null {
  const { user } = useAuth();
  return useMemo(() => {
    const m = (user?.memberships ?? []).find((x) => x.status === "active" && (x.role === "owner" || x.role === "admin"));
    return m ? (m.tenant_id ?? m.tenant) : null;
  }, [user]);
}

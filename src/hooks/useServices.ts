// Which SENDA services the signed-in person has in the organization they are working in, so every menu shows the same thing.
//   inbox       the shared WhatsApp Team Inbox (switched on for the organization by SENDA)
//   callCenter  the call center / IVR
//   sms         SMS, campaigns, sender names and the rest of messaging (always shown)
// A person with only the inbox gets a small, focused app: the inbox, the settings that belong to it, and team invitations.
import { useAuth } from "@/contexts/AuthContext";
import { useFeatures } from "@/hooks/useFeatures";
import type { Membership } from "@/lib/api";
import { canUseCallCenter } from "@/utils/roleUtils";

export interface Services {
  inbox: boolean;
  callCenter: boolean;
  sms: boolean;
  /** The inbox is their only service. */
  inboxOnly: boolean;
  /** The organization they are working in, and every organization they belong to. */
  currentOrganization: Membership | null;
  organizations: Membership[];
}

export function useServices(): Services {
  const { user } = useAuth();
  const { hasFeature } = useFeatures();
  const active = (user?.memberships ?? []).filter((m) => m.status === "active");
  const inbox = hasFeature("team_inbox");
  const callCenter = canUseCallCenter(user);
  // Messaging is never hidden from the menu: every account sees its SMS entries, whatever else it uses.
  const sms = true;
  return {
    inbox, callCenter, sms, inboxOnly: inbox && !callCenter && !sms,
    currentOrganization: active.find((m) => m.is_current) ?? active[0] ?? null,
    organizations: active,
  };
}

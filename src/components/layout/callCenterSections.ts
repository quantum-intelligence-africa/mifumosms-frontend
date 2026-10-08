// The Call Center & IVR area is one product. To keep the sidebar short, related pages live
// behind a single entry and are reached through a row of tabs at the top of each page:
//
//   Calls    — Call history · Call log · Recordings
//   Manage   — Live board · Teams · Agents · Plans & usage
//   Set up   — Phone numbers · IVR flows · Audio prompts · Transfer numbers · AI insights
//
// Both the sidebar and the tab strip read this one list, so they can never disagree.
import { PhoneCall, SlidersHorizontal, Users2, type LucideIcon } from "lucide-react";
import type { User } from "@/lib/api";
import { canUseCallCenter, hasIvrAccess, isCallCenterAdmin, isCallCenterSupervisor } from "@/utils/roleUtils";

export interface SectionTab {
  /** i18n key of the label. */
  labelKey: string;
  href: string;
}

export interface CallCenterSection {
  id: "calls" | "manage" | "setup";
  labelKey: string;
  icon: LucideIcon;
  tabs: SectionTab[];
}

/** The sections this person may see, each with only the tabs their role allows. Empty ones are dropped. */
export function getCallCenterSections(user: User | null | undefined): CallCenterSection[] {
  const cc = canUseCallCenter(user);
  const ivr = hasIvrAccess(user);

  const sections: CallCenterSection[] = [
    {
      id: "calls",
      labelKey: "nav.calls",
      icon: PhoneCall,
      tabs: [
        ...(cc ? [{ labelKey: "cc.nav.history", href: "/call-center/history" }] : []),
        ...(ivr ? [{ labelKey: "cc.nav.call_log", href: "/voice/calls" }] : []),
        ...(ivr ? [{ labelKey: "nav.recordings", href: "/voice/recordings" }] : []),
      ],
    },
    {
      id: "manage",
      labelKey: "cc.nav.h_manage",
      icon: Users2,
      tabs: [
        ...(cc && isCallCenterSupervisor(user) ? [{ labelKey: "cc.nav.live", href: "/call-center/live" }] : []),
        ...(cc && isCallCenterSupervisor(user) ? [{ labelKey: "cc.nav.teams", href: "/call-center/teams" }] : []),
        ...(cc && isCallCenterAdmin(user) ? [{ labelKey: "cc.nav.agents", href: "/call-center/agents" }] : []),
        ...(cc && isCallCenterAdmin(user) ? [{ labelKey: "cc.nav.plans", href: "/call-center/plans" }] : []),
      ],
    },
    {
      id: "setup",
      labelKey: "cc.nav.h_setup",
      icon: SlidersHorizontal,
      tabs: ivr
        ? [
            { labelKey: "nav.phone_numbers", href: "/voice/numbers" },
            { labelKey: "nav.ivr_flows", href: "/voice/ivr" },
            { labelKey: "nav.audio_prompts", href: "/voice/prompts" },
            // Numbers a flow's "transfer" box can ring — not logins (those are Manage → Agents).
            { labelKey: "cc.nav.transfer_numbers", href: "/voice/agents" },
            { labelKey: "nav.ai_call_intelligence", href: "/voice/ai-settings" },
          ]
        : [],
    },
  ];
  return sections.filter((s) => s.tabs.length > 0);
}

export const pathMatches = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

/** The section a page belongs to, if any. */
export function sectionForPath(sections: CallCenterSection[], pathname: string): CallCenterSection | undefined {
  return sections.find((s) => s.tabs.some((tab) => pathMatches(pathname, tab.href)));
}

import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export type TabKey = "home" | "send" | "sender" | "contacts" | "settings";

interface PageMeta {
  title: string;
  subtitle?: string;
  /** Show personalised greeting on Home only. */
  isHome: boolean;
  /** Should the back button be shown? */
  showBack: boolean;
  /** Should the bottom tab bar be visible on this route? */
  showTabBar: boolean;
  /** Which tab is "active" for this route. */
  tab: TabKey | null;
}

const ROUTE_META: Array<{ match: RegExp; meta: PageMeta }> = [
  { match: /^\/dashboard$/, meta: { title: "Home", isHome: true, showBack: false, showTabBar: true, tab: "home" } },
  { match: /^\/send$/, meta: { title: "Compose", isHome: false, showBack: false, showTabBar: true, tab: "send" } },
  { match: /^\/messaging\/send(\/|$|\?)/, meta: { title: "Send SMS", isHome: false, showBack: true, showTabBar: true, tab: "send" } },
  { match: /^\/sms\/send(\/|$|\?)/, meta: { title: "Send SMS", isHome: false, showBack: true, showTabBar: true, tab: "send" } },
  { match: /^\/messaging\/sender-names/, meta: { title: "Sender Names", isHome: false, showBack: false, showTabBar: true, tab: "sender" } },
  { match: /^\/sms\/sender-names/, meta: { title: "Sender Names", isHome: false, showBack: false, showTabBar: true, tab: "sender" } },
  { match: /^\/messaging\/contacts/, meta: { title: "Contacts", isHome: false, showBack: false, showTabBar: true, tab: "contacts" } },
  { match: /^\/contacts/, meta: { title: "Contacts", isHome: false, showBack: false, showTabBar: true, tab: "contacts" } },
  { match: /^\/settings/, meta: { title: "Settings", isHome: false, showBack: false, showTabBar: true, tab: "settings" } },
  { match: /^\/messaging\/campaigns/, meta: { title: "Campaigns", isHome: false, showBack: true, showTabBar: true, tab: "send" } },
  { match: /^\/campaigns/, meta: { title: "Campaigns", isHome: false, showBack: true, showTabBar: true, tab: "send" } },
  { match: /^\/messaging\/purchase/, meta: { title: "Buy SMS Credits", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/sms\/purchase(\/|$|\?)/, meta: { title: "Buy SMS Credits", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/messaging\/history/, meta: { title: "Purchase History", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/sms\/purchase-history/, meta: { title: "Purchase History", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/whatsapp/, meta: { title: "WhatsApp", isHome: false, showBack: true, showTabBar: true, tab: "send" } },
  { match: /^\/ai-copilots/, meta: { title: "AI Copilots", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/voice-copilots/, meta: { title: "Voice Copilots", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/conversations/, meta: { title: "Conversations", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/templates/, meta: { title: "Templates", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/analytics/, meta: { title: "Analytics", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/notifications/, meta: { title: "Notifications", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/integration-guide/, meta: { title: "Integration Guide", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/partner-integration/, meta: { title: "Partner Integration", isHome: false, showBack: true, showTabBar: true, tab: null } },
  { match: /^\/partner-insights/, meta: { title: "Partner Insights", isHome: false, showBack: true, showTabBar: true, tab: null } },
];

const PUBLIC_ROUTES = [
  /^\/$/, /^\/login$/, /^\/signup$/, /^\/forgot-password$/, /^\/reset-password$/,
  /^\/smsactivation$/, /^\/terms$/, /^\/privacy$/, /^\/developer$/,
  /^\/pricing$/, /^\/features$/, /^\/tutorial$/, /^\/watch-tutorial$/,
  /^\/whatsapp-broadcast$/, /^\/admin/,
];

export function usePageMeta(): PageMeta & { isPublicRoute: boolean } {
  const { pathname } = useLocation();
  return useMemo(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((r) => r.test(pathname));
    const found = ROUTE_META.find((r) => r.match.test(pathname));
    if (found) return { ...found.meta, isPublicRoute };
    return {
      title: "SENDA",
      isHome: false,
      showBack: false,
      showTabBar: !isPublicRoute,
      tab: null,
      isPublicRoute,
    };
  }, [pathname]);
}

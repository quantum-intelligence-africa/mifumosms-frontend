import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { DialerProvider } from "@/contexts/DialerContext";
import { CallCenterProvider } from "@/contexts/CallCenterContext";
import { CallCenterOverlay } from "@/components/callcenter/CallCenterOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { getCallCenterRole, hasSmsAccess } from "@/utils/roleUtils";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useGlobalAuthErrorHandler } from "@/hooks/useGlobalAuthErrorHandler";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/layout/PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAManager } from "@/components/pwa/PWAManager";
import { PendingPaymentReminder } from "@/components/sms/PendingPaymentReminder";

// Pages are lazily loaded so each route ships as its own chunk. This keeps the
// initial bundle small — heavy deps (charts, xlsx, pdf) only download when a
// route that uses them is visited.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Smsactivation = lazy(() => import("./pages/Smsactivation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Templates = lazy(() => import("./pages/Templates"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
// const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const SendSMS = lazy(() => import("./pages/sms/SendSMS"));
const SendHub = lazy(() => import("./pages/SendHub"));
const PurchaseSMS = lazy(() => import("./pages/sms/PurchaseSMS"));
const SenderNames = lazy(() => import("./pages/sms/SenderNames"));
const PurchaseHistory = lazy(() => import("./pages/sms/PurchaseHistory"));
const Outbox = lazy(() => import("./pages/sms/Outbox"));
const Sent = lazy(() => import("./pages/sms/Sent"));
const Scheduled = lazy(() => import("./pages/sms/Scheduled"));
const IntegrationGuide = lazy(() => import("./pages/IntegrationGuide"));
const PertinaIntegration = lazy(() => import("./pages/PertinaIntegration"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const PertinaInsights = lazy(() => import("./pages/PertinaInsights"));
const Developer = lazy(() => import("./pages/Developer"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const VoiceAgents = lazy(() => import("./pages/VoiceAgents"));
const IvrFlowList = lazy(() => import("./pages/voice/IvrFlowList"));
const VoiceNumbers = lazy(() => import("./pages/voice/VoiceNumbers"));
const CallHistory = lazy(() => import("./pages/voice/CallHistory"));
const Recordings = lazy(() => import("./pages/voice/Recordings"));
const VoiceAgentDirectory = lazy(() => import("./pages/voice/Agents"));
const AudioPrompts = lazy(() => import("./pages/voice/AudioPrompts"));
const AISettings = lazy(() => import("./pages/voice/AISettings"));
const VoiceOverview = lazy(() => import("./pages/voice/VoiceOverview"));
const IvrFlowBuilder = lazy(() => import("./pages/voice/IvrFlowBuilder"));
const CallCenterHome = lazy(() => import("./pages/callcenter/Home"));
const CallCenterOverview = lazy(() => import("./pages/callcenter/Overview"));
const CallCenterTeams = lazy(() => import("./pages/callcenter/Teams"));
const CallCenterAgents = lazy(() => import("./pages/callcenter/CallCenterAgents"));
const CallCenterMissed = lazy(() => import("./pages/callcenter/MissedCalls"));
const CallCenterHistory = lazy(() => import("./pages/callcenter/History"));
const CallCenterPlans = lazy(() => import("./pages/callcenter/Plans"));
const WhatsAppCloud = lazy(() => import("./pages/WhatsAppCloud"));
const CreateWhatsAppTemplate = lazy(() => import("./pages/CreateWhatsAppTemplate"));
const WhatsAppBroadcast = lazy(() => import("./pages/WhatsAppBroadcast"));
// @ts-ignore — standalone JSX admin dashboard
const SendaAdmin = lazy(() => import("../senda-dashboard.jsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const CANONICAL_BASE_URL = "https://sms.mifumolabs.com";
const CHUNK_RELOAD_KEY = "senda_chunk_reload_attempted";

// Shown while a lazily-loaded route chunk is being fetched.
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

// Component to handle route-based key for forcing remounts and SEO canonicals
const RouteAnimator = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    // Clear any stuck states when route changes
    window.scrollTo(0, 0);
    // Reset document scrollbar
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Update canonical URL per route for better SEO
    const path = location.pathname || "/";

    // Explicit canonicals for key marketing routes
    const canonicalPath =
      path === "/"
        ? "/"
        : path === "/pricing"
        ? "/pricing"
        : path === "/features"
        ? "/features"
        : path === "/watch-tutorial"
        ? "/watch-tutorial"
        : path === "/tutorial"
        ? "/tutorial"
        : path === "/developer"
        ? "/developer"
        : path;

    const canonicalUrl = `${CANONICAL_BASE_URL}${canonicalPath}`;

    let link: HTMLLinkElement | null = document.querySelector(
      "link[rel='canonical']"
    );
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    if (link.href !== canonicalUrl) {
      link.href = canonicalUrl;
    }
  }, [location.pathname]);

  // No key prop — letting React Router reconcile naturally is significantly
  // faster than force-remounting the whole tree on every route change.
  return <>{children}</>;
};

// export default function sitemap(): MetadataRoute.Sitemap {
//   return [
//     {
//       url: "https://sms.mifumolabs.com/",
//       lastModified: new Date(),
//     },
//     {
//       url: "https://sms.mifumolabs.com/developer",
//       lastModified: new Date(),
//     },
//   ];
// }

// Main app content component that initializes global auth error handling
/** Agents are provisioned for calls only (no SMS access), so their home is the call
 *  center — not an SMS dashboard full of things they can't use. */
const DashboardGate = () => {
  const { user } = useAuth();
  if (getCallCenterRole(user) === "agent" && !hasSmsAccess(user)) {
    return <Navigate to="/call-center" replace />;
  }
  return <Dashboard />;
};

const AppContent = () => {
  useEffect(() => {
    const reloadOnStaleChunk = (event: PromiseRejectionEvent) => {
      const message = String(event.reason?.message || event.reason || "");
      if (
        !/dynamically imported module|Failed to fetch dynamically imported module/i.test(
          message
        ) ||
        sessionStorage.getItem(CHUNK_RELOAD_KEY)
      ) {
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    };

    window.addEventListener("unhandledrejection", reloadOnStaleChunk);
    const clearReloadGuard = window.setTimeout(
      () => sessionStorage.removeItem(CHUNK_RELOAD_KEY),
      10000
    );
    return () => {
      window.removeEventListener("unhandledrejection", reloadOnStaleChunk);
      window.clearTimeout(clearReloadGuard);
    };
  }, []);

  // Initialize global authentication error handler
  // This listens for auth errors across ALL endpoints and redirects to login
  useGlobalAuthErrorHandler();

  // Pull-to-refresh on every route, mobile only. The installed PWA strips the
  // browser's native gesture, so users have no built-in way to reload — this
  // restores it uniformly across Dashboard, marketing, auth, etc.
  const isMobile = useIsMobile();
  const pull = usePullToRefresh({ enabled: isMobile });

  return (
    <>
      <PullToRefreshIndicator
        pulled={pull.pulled}
        refreshing={pull.refreshing}
        threshold={pull.threshold}
      />
      <PWAManager />
      <PendingPaymentReminder />
      <RouteAnimator>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/whatsapp-broadcast" element={<WhatsAppBroadcast />} />
        {/* SEO-friendly landing aliases */}
        <Route path="/pricing" element={<Landing />} />
        <Route path="/features" element={<Landing />} />
        <Route path="/watch-tutorial" element={<Landing />} />
        <Route path="/tutorial" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/smsactivation" element={<Smsactivation />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/download" element={<DownloadApp />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardGate />
                </ProtectedRoute>
              } />
              <Route path="/call-center" element={
                <ProtectedRoute requireCallCenter="member" comingSoonKey="voice_ivr">
                  <CallCenterHome />
                </ProtectedRoute>
              } />
              <Route path="/call-center/live" element={
                <ProtectedRoute requireCallCenter="supervisor" comingSoonKey="voice_ivr">
                  <CallCenterOverview />
                </ProtectedRoute>
              } />
              <Route path="/call-center/teams" element={
                <ProtectedRoute requireCallCenter="supervisor" comingSoonKey="voice_ivr">
                  <CallCenterTeams />
                </ProtectedRoute>
              } />
              <Route path="/call-center/agents" element={
                <ProtectedRoute requireCallCenter="admin" comingSoonKey="voice_ivr">
                  <CallCenterAgents />
                </ProtectedRoute>
              } />
              <Route path="/call-center/plans" element={
                <ProtectedRoute requireCallCenter="admin" comingSoonKey="voice_ivr">
                  <CallCenterPlans />
                </ProtectedRoute>
              } />
              <Route path="/call-center/missed" element={
                <ProtectedRoute requireCallCenter="member" comingSoonKey="voice_ivr">
                  <CallCenterMissed />
                </ProtectedRoute>
              } />
              <Route path="/call-center/history" element={
                <ProtectedRoute requireCallCenter="member" comingSoonKey="voice_ivr">
                  <CallCenterHistory />
                </ProtectedRoute>
              } />
              <Route path="/conversations" element={
                <ProtectedRoute>
                  <Conversations />
                </ProtectedRoute>
              } />
              <Route path="/contacts" element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/integration-guide" element={
                <ProtectedRoute>
                  <IntegrationGuide />
                </ProtectedRoute>
              } />
              <Route path="/partner-integration" element={
                <ProtectedRoute requirePartner>
                  <PertinaIntegration />
                </ProtectedRoute>
              } />
              <Route path="/partner-insights" element={
                <ProtectedRoute requirePartner>
                  <PertinaInsights />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              {/* <Route path="/notification-settings" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } /> */}
              <Route path="/send" element={
                <ProtectedRoute>
                  <SendHub />
                </ProtectedRoute>
              } />
              <Route path="/sms/send" element={
                <ProtectedRoute requireSmsAccess>
                  <SendSMS />
                </ProtectedRoute>
              } />
              <Route path="/sms/purchase" element={
                <ProtectedRoute requireSmsAccess>
                  <PurchaseSMS />
                </ProtectedRoute>
              } />
              <Route path="/sms/sender-names" element={
                <ProtectedRoute requireSmsAccess>
                  <SenderNames />
                </ProtectedRoute>
              } />
              <Route path="/sms/purchase-history" element={
                <ProtectedRoute requireSmsAccess>
                  <PurchaseHistory />
                </ProtectedRoute>
              } />
              {/* ── Messaging module routes (map to existing SMS components) ── */}
              <Route path="/messaging/send" element={
                <ProtectedRoute requireSmsAccess>
                  <SendSMS />
                </ProtectedRoute>
              } />
              <Route path="/messaging/outbox" element={
                <ProtectedRoute requireSmsAccess>
                  <Outbox />
                </ProtectedRoute>
              } />
              <Route path="/messaging/sent" element={
                <ProtectedRoute requireSmsAccess>
                  <Sent />
                </ProtectedRoute>
              } />
              <Route path="/messaging/scheduled" element={
                <ProtectedRoute requireSmsAccess>
                  <Scheduled />
                </ProtectedRoute>
              } />
              <Route path="/messaging/campaigns" element={
                <ProtectedRoute requireSmsAccess>
                  <Campaigns />
                </ProtectedRoute>
              } />
              <Route path="/messaging/contacts" element={
                <ProtectedRoute requireSmsAccess>
                  <Contacts />
                </ProtectedRoute>
              } />
              <Route path="/messaging/sender-names" element={
                <ProtectedRoute requireSmsAccess>
                  <SenderNames />
                </ProtectedRoute>
              } />
              <Route path="/messaging/purchase" element={
                <ProtectedRoute requireSmsAccess>
                  <PurchaseSMS />
                </ProtectedRoute>
              } />
              <Route path="/messaging/history" element={
                <ProtectedRoute requireSmsAccess>
                  <PurchaseHistory />
                </ProtectedRoute>
              } />
              {/* ── New channel modules ── */}
              <Route path="/whatsapp" element={
                <ProtectedRoute comingSoonKey="whatsapp">
                  <WhatsAppCloud />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp/templates/new" element={
                <ProtectedRoute comingSoonKey="whatsapp">
                  <CreateWhatsAppTemplate />
                </ProtectedRoute>
              } />
              <Route path="/ai-copilots" element={
                <ProtectedRoute>
                  <AIAgents />
                </ProtectedRoute>
              } />
              <Route path="/voice-copilots" element={
                <ProtectedRoute requireIvrAccess>
                  <VoiceAgents />
                </ProtectedRoute>
              } />
              <Route path="/voice" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <VoiceOverview />
                </ProtectedRoute>
              } />
              <Route path="/voice/ivr" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <IvrFlowList />
                </ProtectedRoute>
              } />
              <Route path="/voice/numbers" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <VoiceNumbers />
                </ProtectedRoute>
              } />
              <Route path="/voice/calls" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <CallHistory />
                </ProtectedRoute>
              } />
              <Route path="/voice/agents" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <VoiceAgentDirectory />
                </ProtectedRoute>
              } />
              <Route path="/voice/prompts" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <AudioPrompts />
                </ProtectedRoute>
              } />
              <Route path="/voice/recordings" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <Recordings />
                </ProtectedRoute>
              } />
              <Route path="/voice/ai-settings" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <AISettings />
                </ProtectedRoute>
              } />
              <Route path="/voice/ivr/:flowId" element={
                <ProtectedRoute requireIvrAccess comingSoonKey="voice_ivr">
                  <IvrFlowBuilder />
                </ProtectedRoute>
              } />
        {/* ── SENDA Admin Dashboard (standalone, no auth guard) ── */}
        {/* Wildcard so /admin/<tab> (e.g. /admin/netprofit) resolves to the
            same component — SendaAdmin reads the tab from the URL itself. */}
        <Route path="/admin/*" element={<SendaAdmin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </RouteAnimator>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="theme-preference"
      enableColorScheme
    >
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DialerProvider>
              <CallCenterProvider>
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AppContent />
                </BrowserRouter>
                {/* Ringing / active-call / wrap-up UI: above every page, so a call interrupts whatever the agent is doing. */}
                <CallCenterOverlay />
              </CallCenterProvider>
            </DialerProvider>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

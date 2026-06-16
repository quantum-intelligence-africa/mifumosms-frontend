import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useGlobalAuthErrorHandler } from "@/hooks/useGlobalAuthErrorHandler";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/layout/PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAManager } from "@/components/pwa/PWAManager";

// Pages are lazily loaded so each route ships as its own chunk. This keeps the
// initial bundle small — heavy deps (charts, xlsx, pdf) only download when a
// route that uses them is visited.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
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
const IntegrationGuide = lazy(() => import("./pages/IntegrationGuide"));
const PertinaIntegration = lazy(() => import("./pages/PertinaIntegration"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PertinaInsights = lazy(() => import("./pages/PertinaInsights"));
const Developer = lazy(() => import("./pages/Developer"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const VoiceAgents = lazy(() => import("./pages/VoiceAgents"));
const WhatsAppCloud = lazy(() => import("./pages/WhatsAppCloud"));
const CreateWhatsAppTemplate = lazy(() => import("./pages/CreateWhatsAppTemplate"));
const WhatsAppBroadcast = lazy(() => import("./pages/WhatsAppBroadcast"));
// @ts-ignore — standalone JSX admin dashboard
const SendaAdmin = lazy(() => import("../senda-dashboard.jsx"));

const queryClient = new QueryClient();

const CANONICAL_BASE_URL = "https://sms.mifumolabs.com";

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
const AppContent = () => {
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
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/smsactivation" element={<Smsactivation />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
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
                <ProtectedRoute>
                  <SendSMS />
                </ProtectedRoute>
              } />
              <Route path="/sms/purchase" element={
                <ProtectedRoute>
                  <PurchaseSMS />
                </ProtectedRoute>
              } />
              <Route path="/sms/sender-names" element={
                <ProtectedRoute>
                  <SenderNames />
                </ProtectedRoute>
              } />
              <Route path="/sms/purchase-history" element={
                <ProtectedRoute>
                  <PurchaseHistory />
                </ProtectedRoute>
              } />
              {/* ── Messaging module routes (map to existing SMS components) ── */}
              <Route path="/messaging/send" element={
                <ProtectedRoute>
                  <SendSMS />
                </ProtectedRoute>
              } />
              <Route path="/messaging/campaigns" element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              } />
              <Route path="/messaging/contacts" element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              } />
              <Route path="/messaging/sender-names" element={
                <ProtectedRoute>
                  <SenderNames />
                </ProtectedRoute>
              } />
              <Route path="/messaging/purchase" element={
                <ProtectedRoute>
                  <PurchaseSMS />
                </ProtectedRoute>
              } />
              <Route path="/messaging/history" element={
                <ProtectedRoute>
                  <PurchaseHistory />
                </ProtectedRoute>
              } />
              {/* ── New channel modules ── */}
              <Route path="/whatsapp" element={
                <ProtectedRoute>
                  <WhatsAppCloud />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp/templates/new" element={
                <ProtectedRoute>
                  <CreateWhatsAppTemplate />
                </ProtectedRoute>
              } />
              <Route path="/ai-copilots" element={
                <ProtectedRoute>
                  <AIAgents />
                </ProtectedRoute>
              } />
              <Route path="/voice-copilots" element={
                <ProtectedRoute>
                  <VoiceAgents />
                </ProtectedRoute>
              } />
        {/* ── SENDA Admin Dashboard (standalone, no auth guard) ── */}
        <Route path="/admin" element={<SendaAdmin />} />
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
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

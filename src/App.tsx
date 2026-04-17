import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useGlobalAuthErrorHandler } from "@/hooks/useGlobalAuthErrorHandler";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Smsactivation from "./pages/Smsactivation";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
// import NotificationSettings from "./pages/NotificationSettings";
import SendSMS from "./pages/sms/SendSMS";
import PurchaseSMS from "./pages/sms/PurchaseSMS";
import SenderNames from "./pages/sms/SenderNames";
import PurchaseHistory from "./pages/sms/PurchaseHistory";
import IntegrationGuide from "./pages/IntegrationGuide";
import PertinaIntegration from "./pages/PertinaIntegration";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PertinaInsights from "./pages/PertinaInsights";
import Developer from "./pages/Developer";
import AIAgents from "./pages/AIAgents";
import VoiceAgents from "./pages/VoiceAgents";
// @ts-ignore — standalone JSX admin dashboard
import SendaAdmin from "../senda-dashboard.jsx";

const queryClient = new QueryClient();

const CANONICAL_BASE_URL = "https://sms.mifumolabs.com";

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

  return <div key={location.pathname}>{children}</div>;
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

  return (
    <RouteAnimator>
      <Routes>
        <Route path="/" element={<Landing />} />
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
    </RouteAnimator>
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

const queryClient = new QueryClient();

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
            <Routes>
              <Route path="/" element={<Landing />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

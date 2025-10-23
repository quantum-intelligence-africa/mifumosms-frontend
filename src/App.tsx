import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VerificationGuard } from "@/components/VerificationGuard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import SendSMS from "./pages/sms/SendSMS";
import PurchaseSMS from "./pages/sms/PurchaseSMS";
import SenderNames from "./pages/sms/SenderNames";
import PurchaseHistory from "./pages/sms/PurchaseHistory";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Dashboard />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/conversations" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Conversations />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Contacts />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Campaigns />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Templates />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Analytics />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Settings />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <Notifications />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/notification-settings" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <NotificationSettings />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/sms/send" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <SendSMS />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/sms/purchase" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <PurchaseSMS />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/sms/sender-names" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <SenderNames />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            <Route path="/sms/purchase-history" element={
              <ProtectedRoute>
                <VerificationGuard>
                  <PurchaseHistory />
                </VerificationGuard>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

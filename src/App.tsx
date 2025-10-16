import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResponsiveProvider } from "@/components/ResponsiveProvider";
import "@/styles/responsive.css";
import "@/utils/responsiveManager"; // Initialize responsive manager
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
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
      <ResponsiveProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true
          }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
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
            <Route path="/sms/send" element={<ProtectedRoute><SendSMS /></ProtectedRoute>} />
            <Route path="/sms/purchase" element={<ProtectedRoute><PurchaseSMS /></ProtectedRoute>} />
            <Route path="/sms/sender-names" element={<ProtectedRoute><SenderNames /></ProtectedRoute>} />
            <Route path="/sms/purchase-history" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ResponsiveProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

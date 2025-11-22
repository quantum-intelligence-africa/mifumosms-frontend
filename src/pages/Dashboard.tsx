import {
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Zap,
  Building2,
  Plus,
  Hash,
  Activity
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { SenderIds } from "@/components/dashboard/SenderIds";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTenants } from "@/hooks/useTenants";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountVerification } from "@/components/auth/AccountVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, verifyEmail, resendActivationEmail } = useAuth();
  const { metrics, overview, recentCampaigns, recentActivity, performanceOverview, senderIds, isLoading } = useDashboard();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Check if user needs email activation
  useEffect(() => {
    // Check if user is not verified (needs email activation)
    if (user && !user.is_verified && !showOTPModal) {
      // Check if there's a pending activation email in localStorage
      const pendingEmail = localStorage.getItem('pending_email_activation');
      if (pendingEmail) {
        setUserEmail(pendingEmail);
        setShowOTPModal(true);
        // Clear the flag
        localStorage.removeItem('pending_email_activation');
      } else if (user.email) {
        // If no pending email but user is not verified, show modal with user's email
        setUserEmail(user.email);
        setShowOTPModal(true);
      }
    }
  }, [user, showOTPModal]);

  const handleVerificationComplete = () => {
    setShowVerification(false);
  };

  const handleSkipVerification = () => {
    setShowVerification(false);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code from your email.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyEmail(otpCode.trim());

      if (result.success && result.tokens) {
        toast({
          title: "Email verified successfully!",
          description: "Your account has been activated.",
        });
        setShowOTPModal(false);
        setOtpCode("");
        // Refresh the page to update user state
        window.location.reload();
      } else {
        toast({
          title: "Verification failed",
          description: result.error || "Invalid or expired OTP code. Please request a new one.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userEmail.trim()) {
      toast({
        title: "Email required",
        description: "Email address is required to resend OTP code.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      const result = await resendActivationEmail(userEmail.trim());

      if (result.success) {
        toast({
          title: "OTP code sent",
          description: `A new OTP code has been sent to ${userEmail}. Please check your email inbox.`,
          duration: 10000
        });
      } else {
        toast({
          title: "Failed to resend",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
              {/* Loading skeletons */}
              <div className="mb-6 lg:mb-8">
                <Skeleton className="h-6 lg:h-8 w-48 lg:w-64 mb-2" />
                <Skeleton className="h-3 lg:h-4 w-72 lg:w-96" />
              </div>

              <div className="grid grid-cols-4 gap-2 lg:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 lg:h-32" />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64 lg:col-span-2" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show verification overlay if needed - TEMPORARILY DISABLED FOR DEBUGGING
  // if (showVerification && user?.phone_number) {
  //   console.log('Showing verification overlay for phone:', user.phone_number);
  //   return (
  //     <div className="flex h-screen bg-background">
  //       <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  //       <div className="flex-1 flex flex-col overflow-hidden">
  //         <AppHeader onMenuClick={() => setSidebarOpen(true)} />
  //         <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
  //           <div className="max-w-7xl mx-auto flex items-center justify-center min-h-full">
  //             <AccountVerification
  //               phoneNumber={user.phone_number}
  //               onVerified={handleVerificationComplete}
  //               onSkip={handleSkipVerification}
  //             />
  //           </div>
  //         </main>
  //       </div>
  //     </div>
  //   );
  // }

  // Add error boundary
  try {
    return (
      <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 lg:p-6 relative z-0">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Welcome Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Welcome to Mifumo SMS! 👋
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                Monitor your communication platform performance in real-time.
              </p>
            </div>

            {/* Metrics Grid - 4 Main Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
              <MetricCard
                title="Total Messages"
                value={metrics?.total_messages?.value?.toLocaleString() || "0"}
                icon={MessageSquare}
                description={metrics?.total_messages?.description || "Last 30 days"}
              />
              <MetricCard
                title="Active Contacts"
                value={metrics?.active_contacts?.value?.toLocaleString() || "0"}
                icon={Users}
                description={metrics?.active_contacts?.description || "Engaged this month"}
              />
              <MetricCard
                title="Campaign Success"
                value={`${metrics?.campaign_success?.value || 0}${metrics?.campaign_success?.unit || ""}`}
                icon={Target}
                description={metrics?.campaign_success?.description || "Delivery rate"}
              />
              <MetricCard
                title="Sender ID"
                value={senderIds?.length?.toLocaleString() || metrics?.senderId?.value?.toLocaleString() || "0"}
                icon={Hash}
                description="Approved sender names"
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <QuickActions />
              </div>

              {/* Recent Campaigns */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <RecentCampaigns campaigns={recentCampaigns || []} />
              </div>
            </div>

            {/* Activity Feed and Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <ActivityFeed />
              <PerformanceOverview performance={performanceOverview} />
            </div>

            {/* Sender IDs */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
              <SenderIds senderIds={senderIds} />
            </div>
          </div>
        </main>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={showOTPModal} onOpenChange={(open) => {
        if (!isVerifying) {
          setShowOTPModal(open);
          if (!open) {
            setOtpCode("");
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              We've sent a 6-digit verification code to <strong>{userEmail}</strong>.
              Please check your email and enter the code below to activate your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code" className="text-sm font-semibold">
                OTP Code
              </Label>
              <Input
                id="otp-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => {
                  // Only allow digits, max 6 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(value);
                }}
                className="h-12 text-center text-lg tracking-widest font-mono"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isVerifying}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otpCode.length === 6 && !isVerifying) {
                    handleVerifyOTP();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Check your email inbox (and spam folder) for the 6-digit verification code
              </p>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={isVerifying || otpCode.length !== 6}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="pt-4 border-t">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend OTP Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    );
  } catch (error) {
    console.error('Dashboard rendering error:', error);
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-center min-h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h2>
                <p className="text-gray-600 mb-4">There was an error loading the dashboard.</p>
                <p className="text-sm text-gray-500">Check the console for more details.</p>
                <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </pre>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, XCircle, ArrowLeft, RefreshCw, Smartphone, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getToastVariant, getToastTitle } from "@/utils/toastUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiClient } from "@/lib/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MobileMenu from "@/components/layout/MobileMenu";

const Smsactivation = () => {
  const isMobile = useIsMobile();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activationStatus, setActivationStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSwitchToEmail, setShowSwitchToEmail] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { toast } = useToast();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);
  // Force light theme on auth page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const { verifyEmail, verifySMS, resendActivationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get token from URL or email/phone from location state or localStorage
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Auto-activate if token is in URL - will be called after state is set
    }

    // Get email, phone, and verification method from location state
    const stateEmail = location.state?.email;
    const statePhone = location.state?.phoneNumber;
    const stateMethod = location.state?.verificationMethod as 'sms' | 'email' | undefined;

    const storedEmail = localStorage.getItem('pending_email_activation');
    const storedPhone = localStorage.getItem('pending_phone_activation');
    const storedMethod = localStorage.getItem('pending_verification_method') as 'sms' | 'email' | null;

    if (stateEmail) {
      setEmail(stateEmail);
      localStorage.setItem('pending_email_activation', stateEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }

    if (statePhone) {
      setPhoneNumber(statePhone);
      localStorage.setItem('pending_phone_activation', statePhone);
    } else if (storedPhone) {
      setPhoneNumber(storedPhone);
    }

    // Determine verification method: prioritize state method, then phone number, then stored method, default to SMS
    const finalPhone = statePhone || storedPhone;
    if (stateMethod) {
      // If verification method is explicitly passed in state, use it
      setVerificationMethod(stateMethod);
      localStorage.setItem('pending_verification_method', stateMethod);
    } else if (finalPhone) {
      // If phone exists, default to SMS
      setVerificationMethod('sms');
      localStorage.setItem('pending_verification_method', 'sms');
    } else if (storedMethod) {
      // Use stored method if available
      setVerificationMethod(storedMethod);
    } else {
      // Default to SMS verification
      setVerificationMethod('sms');
      localStorage.setItem('pending_verification_method', 'sms');
    }
  }, [searchParams, location]);

  const handleActivate = async (tokenToUse?: string) => {
    const tokenValue = tokenToUse || token.trim();
    const cleanedToken = tokenValue.replace(/\D/g, '').slice(0, 6);
    const storedPhone = localStorage.getItem('pending_phone_activation') || '';
    const phoneForVerify = phoneNumber.trim() || storedPhone;
    const hasAccessToken = !!localStorage.getItem('access_token');

    if (!cleanedToken) {
      const codeSource = verificationMethod === 'sms' ? 'your phone' : 'your email';
      toast({
        title: "Code required",
        description: `Please enter the 6-digit verification code from ${codeSource}.`,
        variant: "destructive"
      });
      return;
    }

    if (cleanedToken.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    if (!hasAccessToken && !phoneForVerify) {
      toast({
        title: "Phone number required",
        description: "Please log in again to continue verification or provide the phone number used during signup.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setActivationStatus("idle");
    setErrorMessage("");

    try {
      // Verify via SMS using the new endpoint
      const result = await verifySMS(phoneForVerify, cleanedToken);

      if (result.success) {
        // ✅ Code is correct - NOW redirect to dashboard
        setActivationStatus("success");

        // Clear pending activation flags
        localStorage.removeItem('pending_email_activation');
        localStorage.removeItem('pending_phone_activation');
        localStorage.removeItem('pending_verification_method');

        // Store tokens and user data
        if (result.tokens) {
          apiClient.setToken(result.tokens.access);
          localStorage.setItem('refresh_token', result.tokens.refresh);
          if (result.user) {
            localStorage.setItem('user_profile', JSON.stringify(result.user));
          }
        }

        toast({
          title: "Account activated successfully!",
          description: "Welcome! Redirecting to your dashboard...",
        });

        // Redirect to dashboard only when code is correct
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        // ❌ Code is wrong - STAY on verification form, show error
        setActivationStatus("error");
        const errorMsg = result.error || "Invalid verification code. Please check your SMS and try again.";
        setErrorMessage(errorMsg);

        toast({
          title: "Verification failed",
          description: errorMsg,
          variant: "destructive"
        });
        // DO NOT redirect - keep user on verification form
        setIsLoading(false);
      }
    } catch (error) {
      // ❌ Error occurred - STAY on verification form
      setActivationStatus("error");
      const errorMsg = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setErrorMessage(errorMsg);

      toast({
        title: "Verification failed",
        description: errorMsg,
        variant: "destructive"
      });
      // DO NOT redirect - keep user on verification form
      setIsLoading(false);
    }
  };

  const handleSwitchToEmail = async () => {
    setVerificationMethod('email');
    setShowSwitchToEmail(false);
    setActivationStatus("idle");
    setErrorMessage("");
    setToken(""); // Clear the code

    // Try to resend via email
    if (email.trim()) {
      setIsResending(true);
      try {
        const result = await resendActivationEmail(email.trim(), phoneNumber.trim() || undefined);
        if (result.success) {
          toast({
            title: "Switched to email verification",
            description: `Please check your inbox at ${email} for the 6-digit verification code.`,
            duration: 10000
          });
        } else {
          toast({
            title: "Failed to send email",
            description: result.error || "Please try again later.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Failed to send email",
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsResending(false);
      }
    }
  };

  const handleSwitchToSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to switch to SMS verification.",
        variant: "destructive"
      });
      return;
    }

    setVerificationMethod('sms');
    setShowSwitchToEmail(false);
    setActivationStatus("idle");
    setErrorMessage("");
    setToken(""); // Clear the code

    // Try to resend via SMS
    setIsResending(true);
    try {
      const result = await resendActivationEmail(email.trim(), phoneNumber.trim());
      if (result.success) {
        const method = result.method || 'sms';
        if (method === 'sms') {
          toast({
            title: "Switched to SMS verification",
            description: `Please check your phone (${phoneNumber}) for the 6-digit verification code.`,
            duration: 10000
          });
        } else {
          // Backend fell back to email
          toast({
            title: "SMS failed, using email",
            description: `SMS could not be sent. Please check your inbox at ${email} for the activation code.`,
            duration: 10000
          });
          setVerificationMethod('email');
        }
      } else {
        toast({
          title: "Failed to send SMS",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send SMS",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResendSMS = async () => {
    if (!phoneNumber.trim() && !email.trim()) {
      toast({
        title: "Email or phone required",
        description: "Please provide either your email address or phone number to resend the SMS verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      // Use resend-activation endpoint - accepts email OR phone_number, sends SMS only
      const result = await resendActivationEmail(email.trim() || undefined, phoneNumber.trim() || undefined);

      // Update phone number if returned from response
      if (result.phoneNumber && !phoneNumber) {
        setPhoneNumber(result.phoneNumber);
        localStorage.setItem('pending_phone_activation', result.phoneNumber);
      }

      if (result.success) {
        // SMS only - no email codes
        const displayPhone = result.phoneNumber || phoneNumber;
        toast({
          title: "SMS verification code sent",
          description: `A new 6-digit verification code has been sent to your phone${displayPhone ? ` (${displayPhone})` : ''}. Please check your SMS messages.`,
          duration: 10000
        });
        setVerificationMethod('sms');
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        const errorMessage = result.error || "Please try again later.";
        const throttled = errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many') || errorMessage.toLowerCase().includes('rate');
        const displayError = throttled
          ? "Too many requests. Please wait a moment before requesting another code."
          : errorMessage;
        const variant = getToastVariant(errorMessage);
        const title = getToastTitle("Failed to send code", displayError, variant);
        toast({
          title,
          description: displayError,
          variant
        });
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again.";
      const variant = getToastVariant(errorMessage);
      const title = getToastTitle("Failed to send code", errorMessage, variant);
      toast({
        title,
        description: errorMessage,
        variant
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResendEmail = async () => {
    // Resend-activation accepts email OR phone_number, sends SMS only
    if (!email.trim() && !phoneNumber.trim()) {
      toast({
        title: "Email or phone required",
        description: "Please provide either your email address or phone number to resend the SMS verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      // Use resend-activation with email - backend will send SMS only
      const result = await resendActivationEmail(email.trim() || undefined, phoneNumber.trim() || undefined);

      // Update phone number if returned from response
      if (result.phoneNumber && !phoneNumber) {
        setPhoneNumber(result.phoneNumber);
        localStorage.setItem('pending_phone_activation', result.phoneNumber);
      }

      if (result.success) {
        // SMS only - no email codes
        const displayPhone = result.phoneNumber || phoneNumber;
        toast({
          title: "SMS verification code sent",
          description: `A new 6-digit verification code has been sent to your phone${displayPhone ? ` (${displayPhone})` : ''}. Please check your SMS messages.`,
          duration: 10000
        });
        setVerificationMethod('sms');
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        const errorMessage = result.error || "Please try again later.";
        const variant = getToastVariant(errorMessage);
        const title = getToastTitle("Failed to send code", errorMessage, variant);
        toast({
          title,
          description: errorMessage,
          variant
        });
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again.";
      const variant = getToastVariant(errorMessage);
      const title = getToastTitle("Failed to send code", errorMessage, variant);
      toast({
        title,
        description: errorMessage,
        variant
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleActivate();
  };

  // Mobile Background Component - Blue gradient with abstract shapes
  const MobileBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home background12.jpg"
            className="w-full h-full object-cover"
            alt="Mobile background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
        </div>
      </div>
    );
  };

  // Sliding Background Component - Light blue gradient like Landing page
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        {/* Light blue gradient background - almost white at top, slightly darker blue towards bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
          {/* Subtle abstract patterns overlay - positioned on right side like Textmagic */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="patternGradientSmsactivation" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {/* Wavy/fluid patterns - more subtle */}
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradientSmsactivation)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradientSmsactivation)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradientSmsactivation)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile View */}
      {isMobile ? (
        <>
          <MobileBackground />

          {/* Fixed Header with Menu Button */}
          <header className="fixed top-0 left-0 right-0 z-[50] px-4 py-3 bg-gradient-to-b from-black/20 to-transparent">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading text-lg font-bold text-white">
                  SENDA
                </span>
              </Link>

              {/* Hamburger Menu Button */}
              <button
                className="p-2 text-white hover:text-gray-200 transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Mobile Menu */}
          <MobileMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />

          {/* White Curved Container */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 flex-1 bg-white rounded-t-[40px] px-6 pt-40 pb-8 shadow-2xl mt-16"
          >
            {/* Form Header */}
            <div className="text-center mb-6">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                Verify Your Account
              </motion.h2>
              <p className="text-sm text-gray-600">
                {verificationMethod === 'sms'
                  ? `Enter the 6-digit code sent to your phone`
                  : "Enter the 6-digit code from the email we sent you"}
              </p>
            </div>

            {activationStatus === "success" ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  Account Activated!
                </p>
                <p className="text-sm text-gray-600">
                  You will be redirected to your dashboard shortly.
                </p>
                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full h-10 text-sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                    Verification Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={token}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setToken(value);
                      }}
                      required
                      disabled={isLoading}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg flex-1"
                    />
                    {verificationMethod === 'sms' && (
                      <Button
                        type="button"
                        onClick={handleResendSMS}
                        disabled={isResending || isLoading}
                        variant="outline"
                        className="h-12 px-3"
                        title="Resend verification code"
                      >
                        {isResending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {verificationMethod === 'sms'
                      ? `Check your phone for the 6-digit code`
                      : "Check your email inbox for the 6-digit code"}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading || token.length !== 6}
                >
                  {isLoading ? "Activating..." : "Activate Account"}
                </Button>
              </form>
            )}

            {/* Footer Links */}
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to login</span>
              </Link>
            </div>
          </motion.div>
        </>
      ) : (
        /* Desktop View - Original Layout */
        <>
          {/* Sliding Background */}
          <SlidingBackground />

      <div className="flex flex-col md:flex-row w-full min-h-screen md:min-h-0">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-6 lg:p-8 relative overflow-hidden min-h-screen">
          {/* Image Section with Header Overlay */}
          <div className="relative z-10 w-full max-w-lg flex-1 flex items-center">
            {/* Header positioned at the top of the image */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-white/90 to-transparent rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-heading text-2xl font-bold text-gray-900">
                    SENDA
                  </span>
                  <p className="text-base text-black mt-1">
                    Reliable SMS solutions for businesses
                  </p>
                </div>
              </div>
            </div>

            {/* SENDA Information - positioned at bottom of image area */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-gradient-to-t from-white/90 to-transparent rounded-b-lg p-4">
                <h3 className="text-base font-semibold text-black mb-2">Why Choose SENDA?</h3>
                <ul className="space-y-1 text-sm text-black">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Reliable delivery across all networks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Competitive pricing with bulk discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
            </div>

            <img
              src="/sign in image.png"
              className="w-full h-auto object-contain"
              alt="SMS activation illustration"
            />
          </div>

          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/home background12.jpg"
              alt="SMS activation background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 bg-white/20 backdrop-blur-sm relative z-10 min-h-screen">
          <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
            {/* Form Header */}
            <div className="text-center mb-4 sm:mb-6">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-base sm:text-lg font-bold text-gray-900">
                  SENDA
                </span>
              </div>

              <div className="flex justify-center mb-2 sm:mb-3">
                {activationStatus === "success" ? (
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
                ) : activationStatus === "error" ? (
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                ) : (
                  verificationMethod === 'sms' ? (
                    <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
                  ) : (
                    <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
                  )
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                {activationStatus === "success"
                  ? "Account Activated!"
                  : activationStatus === "error"
                  ? "Activation Failed"
                  : "Verify Your Account"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {activationStatus === "success"
                  ? "Your account has been successfully activated. Redirecting to login..."
                  : activationStatus === "error"
                  ? errorMessage
                  : verificationMethod === 'sms'
                  ? `Enter the 6-digit verification code sent to your phone (${phoneNumber || 'your number'})`
                  : "Enter the 6-digit verification code from the email we sent you"}
              </p>

              {/* Back to login link */}
              <div className="mt-4">
                <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back to login</span>
                </Link>
              </div>
            </div>
            {activationStatus === "success" ? (
              <div className="text-center space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  You will be redirected to your dashboard shortly.
                </p>
                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="token" className="text-xs sm:text-sm font-medium text-gray-700">
                    Verification Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={token}
                      onChange={(e) => {
                        // Only allow digits, max 6 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setToken(value);
                      }}
                      required
                      disabled={isLoading}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg flex-1"
                    />
                    {verificationMethod === 'sms' && (
                      <Button
                        type="button"
                        onClick={handleResendSMS}
                        disabled={isResending || isLoading}
                        variant="outline"
                        className="h-12 px-3 sm:px-4"
                        title="Resend verification code"
                      >
                        {isResending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {verificationMethod === 'sms'
                        ? `Check your phone (${phoneNumber || 'your number'}) for the 6-digit verification code`
                        : "Check your email inbox (and spam folder) for the 6-digit verification code"}
                    </p>
                  </div>

                  {/* Show switch to email option if SMS failed */}
                  {showSwitchToEmail && verificationMethod === 'sms' && email.trim() && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 mb-2">
                        SMS verification failed. Would you like to use email verification instead?
                      </p>
                      <Button
                        type="button"
                        onClick={handleSwitchToEmail}
                        disabled={isResending}
                        variant="outline"
                        className="w-full h-8 text-xs bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800"
                      >
                        {isResending ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Switching...
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Switch to Email Verification
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading || token.length !== 6}
                >
                  {isLoading ? "Activating..." : "Activate Account"}
                </Button>
                </form>

              </>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-1 pt-4">
              <div className="flex items-center justify-center gap-3">
                <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs">
                  Home
                </Link>
                <span className="text-gray-400 text-xs">|</span>
                <p className="text-xs text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Smsactivation;

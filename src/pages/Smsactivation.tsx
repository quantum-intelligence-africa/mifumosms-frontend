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
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useLanguage } from "@/hooks/useLanguage";

const Smsactivation = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
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
      const codeSource = verificationMethod === 'sms' ? t("auth.sms_activation.code_source_phone_email") : t("auth.sms_activation.code_source_email");
      toast({
        title: t("auth.sms_activation.toast_code_required_title"),
        description: t("auth.sms_activation.toast_code_required_desc", { source: codeSource }),
        variant: "destructive"
      });
      return;
    }

    if (cleanedToken.length !== 6) {
      toast({
        title: t("auth.common.invalid_code_title"),
        description: t("auth.common.invalid_code_desc"),
        variant: "destructive"
      });
      return;
    }

    if (!hasAccessToken && !phoneForVerify) {
      toast({
        title: t("auth.common.phone_required_title"),
        description: t("auth.sms_activation.phone_required_desc"),
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
          title: t("auth.common.account_activated_title"),
          description: t("auth.sms_activation.activated_desc"),
        });

        // Redirect to dashboard only when code is correct
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        // ❌ Code is wrong - STAY on verification form, show error
        setActivationStatus("error");
        const errorMsg = result.error || t("auth.sms_activation.verification_failed_default_sms");
        setErrorMessage(errorMsg);

        toast({
          title: t("auth.common.verification_failed_title"),
          description: errorMsg,
          variant: "destructive"
        });
        // DO NOT redirect - keep user on verification form
        setIsLoading(false);
      }
    } catch (error) {
      // ❌ Error occurred - STAY on verification form
      setActivationStatus("error");
      const errorMsg = error instanceof Error ? error.message : t("auth.common.generic_error");
      setErrorMessage(errorMsg);

      toast({
        title: t("auth.common.verification_failed_title"),
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
            title: t("auth.sms_activation.toast_switched_email_title"),
            description: t("auth.sms_activation.toast_switched_email_desc", { email }),
            duration: 10000
          });
        } else {
          toast({
            title: t("auth.sms_activation.toast_failed_send_email_title"),
            description: result.error || t("auth.sms_activation.try_again_later"),
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: t("auth.sms_activation.toast_failed_send_email_title"),
          description: t("auth.common.generic_error"),
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
        title: t("auth.common.phone_required_title"),
        description: t("auth.sms_activation.toast_phone_required_switch_desc"),
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
            title: t("auth.sms_activation.toast_switched_sms_title"),
            description: t("auth.sms_activation.toast_switched_sms_desc", { phone: phoneNumber }),
            duration: 10000
          });
        } else {
          // Backend fell back to email
          toast({
            title: t("auth.sms_activation.toast_sms_failed_using_email_title"),
            description: t("auth.sms_activation.toast_sms_failed_using_email_desc", { email }),
            duration: 10000
          });
          setVerificationMethod('email');
        }
      } else {
        toast({
          title: t("auth.sms_activation.toast_failed_send_sms_title"),
          description: result.error || t("auth.sms_activation.try_again_later"),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("auth.sms_activation.toast_failed_send_sms_title"),
        description: t("auth.common.generic_error"),
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResendSMS = async () => {
    if (!phoneNumber.trim() && !email.trim()) {
      toast({
        title: t("auth.sms_activation.toast_email_or_phone_required_title"),
        description: t("auth.sms_activation.toast_email_or_phone_required_desc"),
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
        // Backend also emails the same code as a backup channel — mention both.
        const displayPhone = result.phoneNumber || phoneNumber;
        toast({
          title: t("auth.sms_activation.toast_verification_code_sent_title"),
          description: displayPhone
            ? t("auth.sms_activation.code_sent_with_phone", { phone: displayPhone })
            : t("auth.sms_activation.code_sent_no_phone"),
          duration: 10000
        });
        setVerificationMethod('sms');
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        const errorMessage = result.error || t("auth.sms_activation.try_again_later");
        const throttled = errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many') || errorMessage.toLowerCase().includes('rate');
        const displayError = throttled
          ? t("auth.sms_activation.throttled_message")
          : errorMessage;
        const variant = getToastVariant(errorMessage);
        const title = getToastTitle(t("auth.sms_activation.toast_failed_send_code_title"), displayError, variant);
        toast({
          title,
          description: displayError,
          variant
        });
      }
    } catch (error) {
      const errorMessage = t("auth.common.generic_error");
      const variant = getToastVariant(errorMessage);
      const title = getToastTitle(t("auth.sms_activation.toast_failed_send_code_title"), errorMessage, variant);
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
        title: t("auth.sms_activation.toast_email_or_phone_required_title"),
        description: t("auth.sms_activation.toast_email_or_phone_required_desc"),
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
        // Backend also emails the same code as a backup channel — mention both.
        const displayPhone = result.phoneNumber || phoneNumber;
        toast({
          title: t("auth.sms_activation.toast_verification_code_sent_title"),
          description: displayPhone
            ? t("auth.sms_activation.code_sent_with_phone", { phone: displayPhone })
            : t("auth.sms_activation.code_sent_no_phone"),
          duration: 10000
        });
        setVerificationMethod('sms');
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        const errorMessage = result.error || t("auth.sms_activation.try_again_later");
        const variant = getToastVariant(errorMessage);
        const title = getToastTitle(t("auth.sms_activation.toast_failed_send_code_title"), errorMessage, variant);
        toast({
          title,
          description: errorMessage,
          variant
        });
      }
    } catch (error) {
      const errorMessage = t("auth.common.generic_error");
      const variant = getToastVariant(errorMessage);
      const title = getToastTitle(t("auth.sms_activation.toast_failed_send_code_title"), errorMessage, variant);
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
                <BrandLogo className="h-16 w-auto -my-3 -mr-8" />
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
                {t("auth.common.verify_your_account_title")}
              </motion.h2>
              <p className="text-sm text-gray-600">
                {verificationMethod === 'sms'
                  ? t("auth.sms_activation.subtitle_sms")
                  : t("auth.sms_activation.subtitle_email")}
              </p>
            </div>

            {activationStatus === "success" ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  {t("auth.sms_activation.activated_heading")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("auth.sms_activation.redirecting_desc")}
                </p>
                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full h-10 text-sm"
                >
                  {t("auth.sms_activation.go_to_dashboard")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                    {t("auth.common.verification_code_label")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="token"
                      type="text"
                      placeholder={t("auth.common.enter_6digit_code")}
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
                      ? t("auth.sms_activation.hint_sms_mobile")
                      : t("auth.sms_activation.hint_email_mobile")}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading || token.length !== 6}
                >
                  {isLoading ? t("auth.sms_activation.activating") : t("auth.sms_activation.activate_account")}
                </Button>
              </form>
            )}

            {/* Footer Links */}
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t("auth.common.back_to_login")}</span>
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
                <BrandLogo className="h-24 w-auto -my-3 -mr-11" />
                <div>
                  <span className="font-heading text-2xl font-bold text-gray-900">
                    SENDA
                  </span>
                  <p className="text-base text-black mt-1">
                    {t("auth.common.tagline")}
                  </p>
                </div>
              </div>
            </div>

            {/* SENDA Information - positioned at bottom of image area */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-gradient-to-t from-white/90 to-transparent rounded-b-lg p-4">
                <h3 className="text-base font-semibold text-black mb-2">{t("auth.common.why_choose_senda")}</h3>
                <ul className="space-y-1 text-sm text-black">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t("auth.common.benefit_reliable_delivery")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t("auth.common.benefit_competitive_pricing")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t("auth.common.benefit_advanced_analytics")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t("auth.common.benefit_support")}</span>
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
                <BrandLogo className="h-16 sm:h-20 w-auto -my-3 sm:-my-3 -mr-8 sm:-mr-10" />
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
                  ? t("auth.sms_activation.activated_heading")
                  : activationStatus === "error"
                  ? t("auth.sms_activation.activation_failed_heading")
                  : t("auth.common.verify_your_account_title")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {activationStatus === "success"
                  ? t("auth.sms_activation.activated_redirect_desc")
                  : activationStatus === "error"
                  ? errorMessage
                  : verificationMethod === 'sms'
                  ? t("auth.sms_activation.idle_sms_desc", { phone: phoneNumber || t("auth.sms_activation.your_number") })
                  : t("auth.sms_activation.idle_email_desc")}
              </p>

              {/* Back to login link */}
              <div className="mt-4">
                <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">{t("auth.common.back_to_login")}</span>
                </Link>
              </div>
            </div>
            {activationStatus === "success" ? (
              <div className="text-center space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  {t("auth.sms_activation.redirecting_desc")}
                </p>
                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                >
                  {t("auth.sms_activation.go_to_dashboard")}
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="token" className="text-xs sm:text-sm font-medium text-gray-700">
                    {t("auth.common.verification_code_label")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="token"
                      type="text"
                      placeholder={t("auth.common.enter_6digit_code")}
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
                        ? t("auth.sms_activation.hint_sms_desktop", { phone: phoneNumber || t("auth.sms_activation.your_number") })
                        : t("auth.sms_activation.hint_email_desktop")}
                    </p>
                  </div>

                  {/* Show switch to email option if SMS failed */}
                  {showSwitchToEmail && verificationMethod === 'sms' && email.trim() && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 mb-2">
                        {t("auth.sms_activation.sms_failed_switch_prompt")}
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
                            {t("auth.sms_activation.switching")}
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            {t("auth.sms_activation.switch_to_email")}
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
                  {isLoading ? t("auth.sms_activation.activating") : t("auth.sms_activation.activate_account")}
                </Button>
                </form>

              </>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-1 pt-4">
              <div className="flex items-center justify-center gap-3">
                <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs">
                  {t("auth.common.home")}
                </Link>
                <span className="text-gray-400 text-xs">|</span>
                <p className="text-xs text-gray-600">
                  {t("auth.common.already_have_account")}{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                    {t("auth.common.sign_in")}
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

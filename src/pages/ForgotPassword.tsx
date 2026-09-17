import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Menu, Mail, CheckCircle, Phone, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSMSVerification } from "@/hooks/useSMSVerification";
import { SMSVerificationCode } from "@/components/auth/SMSVerificationCode";
import { normalizePhoneNumber, getPhonePlaceholder, toBackendPhoneFormat } from "@/utils/phoneUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import MobileMenu from "@/components/layout/MobileMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";

const ForgotPassword = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backendPhoneNumber, setBackendPhoneNumber] = useState(""); // Store the phone number format returned by backend
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'verification' | 'reset'>('phone');
  const [verificationError, setVerificationError] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { requestPasswordReset, resetPassword, sendVerificationCode, verifyCode, isSendingCode, isVerifying } = useSMSVerification();
  const navigate = useNavigate();

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate and normalize phone number
      const phoneInfo = normalizePhoneNumber(phoneNumber);
      if (!phoneInfo.isValid) {
        setVerificationError(phoneInfo.error || t("auth.forgot_password.invalid_phone_default"));
        toast({
          title: t("auth.forgot_password.toast_invalid_phone_title"),
          description: phoneInfo.error || t("auth.forgot_password.invalid_phone_default"),
          variant: "destructive"
        });
        return;
      }

      // Use E.164 format (e.g., +255700000001) for SMS endpoints
      const backendFormat = phoneInfo.normalized;
      console.log('Requesting password reset for phone:', backendFormat);

      const result = await requestPasswordReset({ phone_number: backendFormat });

      if (result.success) {
        // Store the phone number format returned by the backend for verification
        // This ensures we use the EXACT phone number that received the SMS
        setBackendPhoneNumber(result.phone_number || backendFormat);
        console.log('Backend returned phone:', result.phone_number || backendFormat);
        setStep('verification');
        toast({
          title: t("auth.forgot_password.toast_reset_code_sent_title"),
          description: t("auth.forgot_password.toast_reset_code_sent_desc", { phone: phoneInfo.formatted }),
        });
      } else {
        // Check for insufficient balance error
        if (result.error_code === 102) {
          toast({
            title: t("auth.forgot_password.toast_service_unavailable_title"),
            description: t("auth.forgot_password.toast_service_unavailable_desc"),
            variant: "destructive",
            duration: 10000,
          });
        } else {
          setVerificationError(result.error || t("auth.forgot_password.failed_send_reset_code_default"));
          setAttemptsRemaining(result.attempts_remaining);
          setLockedUntil(result.locked_until);
        }
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setVerificationError(t("auth.forgot_password.reset_code_error_generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setVerificationError('');
    setIsLoading(true);

    try {
      // Use the phone number format returned by the backend (the one that received the SMS)
      const phoneToUse = backendPhoneNumber || phoneNumber;

      // First verify the code to ensure it's valid
      const verifyResult = await verifyCode({
        phone_number: phoneToUse,
        code
      });

      if (verifyResult.success) {
        // Store the verified code for password reset
        setVerificationCode(code);
        setStep('reset');
        toast({
          title: t("auth.forgot_password.toast_code_verified_title"),
          description: t("auth.forgot_password.toast_code_verified_desc")
        });
      } else {
        setVerificationError(verifyResult.error || t("auth.forgot_password.invalid_verification_code_default"));
        setAttemptsRemaining(verifyResult.attempts_remaining);
        setLockedUntil(verifyResult.locked_until);
      }
    } catch (error) {
      setVerificationError(t("auth.forgot_password.verification_failed_generic"));
      toast({
        title: t("auth.common.verification_failed_title"),
        description: t("auth.common.generic_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationError('');
    try {
      // Use the phone number format returned by the backend
      const phoneToUse = backendPhoneNumber || phoneNumber;

      const result = await sendVerificationCode({
        phone_number: phoneToUse,
        message_type: 'password_reset'
      });

      if (!result.success) {
        setVerificationError(result.error || t("auth.forgot_password.resend_failed_default"));
        setAttemptsRemaining(result.attempts_remaining);
        setLockedUntil(result.locked_until);
      }
    } catch (error) {
      setVerificationError(t("auth.forgot_password.resend_failed_generic"));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: t("auth.common.passwords_mismatch_title"),
        description: t("auth.common.passwords_mismatch_desc"),
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: t("auth.common.password_too_short_title"),
        description: t("auth.common.password_too_short_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the phone number format returned by the backend (must be the same one used for verification)
      const phoneToUse = backendPhoneNumber || phoneNumber;

      console.log('Resetting password for phone:', phoneToUse);
      console.log('Using verification code:', verificationCode);

      const result = await resetPassword({
        phone_number: phoneToUse,
        verification_code: verificationCode,
        new_password: newPassword,
        new_password_confirm: confirmPassword
      });

      if (result.success) {
        toast({
          title: t("auth.forgot_password.toast_reset_success_title"),
          description: t("auth.forgot_password.toast_reset_success_desc")
        });
        navigate("/login");
      } else {
        toast({
          title: t("auth.forgot_password.toast_reset_failed_title"),
          description: result.error || t("auth.forgot_password.reset_failed_default"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t("auth.forgot_password.toast_reset_failed_title"),
        description: t("auth.common.unexpected_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationError('');
    setAttemptsRemaining(undefined);
    setLockedUntil(undefined);
  };

  const renderStep = () => {
    switch (step) {
      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">{t("phone_number")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t("auth.forgot_password.phone_placeholder")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-11 sm:h-12 text-sm sm:text-base border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all"
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p>{t("auth.forgot_password.phone_hint")}</p>
                <p className="text-blue-600 font-medium">📱 {t("auth.forgot_password.phone_formats_hint")}</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? t("auth.common.sending") : t("auth.forgot_password.send_reset_code_button")}
            </Button>

            {verificationError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {verificationError}
              </div>
            )}
          </form>
        );

      case 'verification':
        return (
          <div>
            <SMSVerificationCode
              phoneNumber={backendPhoneNumber || phoneNumber}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              isLoading={isVerifying}
              isResending={isSendingCode}
              error={verificationError}
              attemptsRemaining={attemptsRemaining}
              lockedUntil={lockedUntil}
              messageType="password_reset"
              onBack={handleBackToPhone}
            />
          </div>
        );

      case 'reset':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">{t("auth.forgot_password.new_password_label")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder={t("auth.forgot_password.new_password_placeholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">{t("auth.forgot_password.password_min_length_hint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">{t("auth.forgot_password.confirm_password_label")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.forgot_password.confirm_password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? t("auth.common.resetting") : t("auth.forgot_password.reset_password_button")}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone':
        return t("auth.forgot_password.step_title_phone");
      case 'verification':
        return t("auth.forgot_password.step_title_verification");
      case 'reset':
        return t("auth.forgot_password.step_title_reset");
      default:
        return t("auth.forgot_password.step_title_phone");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'phone':
        return t("auth.forgot_password.step_desc_phone");
      case 'verification':
        return t("auth.sms_verification.message_default");
      case 'reset':
        return t("auth.forgot_password.step_desc_reset");
      default:
        return t("auth.forgot_password.step_desc_phone");
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'phone':
        return <Phone className="w-8 h-8 text-blue-600" />;
      case 'verification':
        return <MessageSquare className="w-8 h-8 text-blue-600" />;
      case 'reset':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      default:
        return <Phone className="w-8 h-8 text-blue-600" />;
    }
  };

  // Desktop Sliding Background Component - Same as Login
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="patternGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Background Component - Same as Login (uses background image)
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

  // Mobile Forgot Password UI
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <MobileBackground />

        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
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
          className="relative z-10 flex-1 bg-white rounded-t-[40px] px-8 pt-12 pb-8 shadow-2xl mt-24"
        >
          {/* Form Title */}
          <div className="text-center mb-6">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              {getStepTitle()}
            </motion.h2>
            <p className="text-sm text-gray-600">
              {getStepDescription()}
            </p>
          </div>

          <div className="space-y-6">
            {renderStep()}

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                {t("auth.common.remember_your_password")}{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  {t("auth.common.sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Forgot Password UI
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <SlidingBackground />

      <div className="flex flex-col md:flex-row w-full min-h-screen md:min-h-0">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-6 lg:p-8 relative overflow-hidden min-h-screen">
          <div className="relative z-10 w-full max-w-lg flex-1 flex items-center">
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

            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-gradient-to-t from-white/90 to-transparent rounded-b-lg p-4">
                <h3 className="text-base font-semibold text-black mb-2">
                  {step === 'phone' && t("auth.forgot_password.side_panel_phone_title")}
                  {step === 'verification' && t("auth.forgot_password.side_panel_verification_title")}
                  {step === 'reset' && t("auth.forgot_password.side_panel_reset_title")}
                </h3>
                <ul className="space-y-1 text-sm text-black">
                  {step === 'phone' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_phone_1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_phone_2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_phone_3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_phone_4")}</span>
                      </li>
                    </>
                  )}
                  {step === 'verification' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_verification_1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_verification_2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_verification_3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_verification_4")}</span>
                      </li>
                    </>
                  )}
                  {step === 'reset' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_reset_1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_reset_2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_reset_3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{t("auth.forgot_password.bullet_reset_4")}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <img
              src="/sign in image.png"
              className="w-full h-auto object-contain"
              alt="Password reset illustration"
            />
          </div>

          <div className="absolute inset-0">
            <img
              src="/home background12.jpg"
              alt="Login background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-white/20 backdrop-blur-sm relative z-10 min-h-screen">
          <div className="w-full max-w-sm sm:max-w-md space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BrandLogo className="h-20 w-auto -my-3 -mr-10" />
                <span className="font-heading text-lg font-bold text-gray-900">
                  SENDA
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {getStepTitle()}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {getStepDescription()}
              </p>
            </div>

            <div>
              {renderStep()}
            </div>

            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                {t("auth.common.remember_your_password")}{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  {t("auth.common.sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Mail, Lock, User, Phone, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import MobileMenu from "@/components/layout/MobileMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";

const Signup = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [smsFailed, setSmsFailed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Handle phone verification
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: t("auth.common.invalid_code_title"),
        description: t("auth.common.invalid_code_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.verifyPhoneCode(registeredPhone, verificationCode);

      if (result.success && result.data) {
        const { access, refresh, user: userData, message } = result.data;

        if (access && refresh && userData) {
          const updatedUser = {
            ...userData,
            is_verified: true,
            is_active: true,
            phone_verified: true
          };

          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          toast({
            title: t("auth.common.account_activated_title"),
            description: message || t("auth.signup.toast_account_activated_desc"),
            duration: 5000
          });

          navigate('/dashboard', { replace: true });
        } else {
          toast({
            title: t("auth.signup.toast_phone_verified_title"),
            description: message || t("auth.signup.toast_phone_verified_desc"),
            duration: 5000
          });
          navigate('/login');
        }
      } else {
        toast({
          title: t("auth.common.verification_failed_title"),
          description: result.error || result.message || t("auth.signup.toast_verification_failed_desc_default"),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("auth.common.verification_failed_title"),
        description: t("auth.common.generic_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force light theme on auth page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const countries = [
    { value: "ke", label: "Kenya" },
    { value: "tz", label: "Tanzania" }
  ];

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 8) {
      toast({
        title: t("auth.common.password_too_short_title"),
        description: t("auth.common.password_too_short_desc"),
        variant: "destructive"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: t("auth.common.passwords_mismatch_title"),
        description: t("auth.common.passwords_mismatch_desc"),
        variant: "destructive"
      });
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      toast({
        title: t("auth.common.phone_required_title"),
        description: t("auth.signup.toast_phone_required_desc"),
        variant: "destructive"
      });
      return;
    }

    const trimmedPhone = formData.phone.trim();
    const phoneDigitsOnly = trimmedPhone.replace(/\D/g, '');

    if (phoneDigitsOnly.length < 8) {
      toast({
        title: t("auth.signup.toast_phone_short_title"),
        description: t("auth.signup.toast_phone_short_desc"),
        variant: "destructive"
      });
      return;
    }

    let processedPhone = formData.phone.trim();
    const digitsOnly = processedPhone.replace(/\D/g, '');

    if (digitsOnly.length < 9) {
      toast({
        title: t("auth.signup.toast_phone_invalid_title"),
        description: t("auth.signup.toast_phone_invalid_desc"),
        variant: "destructive"
      });
      return;
    }

    if (digitsOnly.startsWith('255')) {
      processedPhone = '+' + digitsOnly;
    } else if (digitsOnly.startsWith('0')) {
      processedPhone = '+255' + digitsOnly.substring(1);
    } else {
      processedPhone = '+255' + digitsOnly;
    }

    if (!processedPhone || processedPhone.trim() === '') {
      toast({
        title: t("auth.signup.toast_phone_process_error_title"),
        description: t("auth.signup.toast_phone_process_error_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const registerData: {
        email: string;
        password: string;
        password_confirm: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        company_name: string;
        country?: string;
      } = {
        email: formData.email.trim(),
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: processedPhone,
        company_name: formData.company.trim()
      };

      if (formData.country) {
        registerData.country = formData.country;
      }

      const result = await register(registerData);

      if (result.stayOnPage || (!result.success && (result.errors || result.error))) {
        if (result.error) {
          const safeErrorMessage = typeof result.error === 'string' ? result.error : t("auth.signup.toast_validation_failed_default");
          toast({
            title: t("auth.signup.toast_validation_failed_title"),
            description: safeErrorMessage,
            variant: "destructive",
            duration: 10000
          });
        }

        if (result.errors && Object.keys(result.errors).length > 0) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            const errorMessage = Array.isArray(errors) ? errors[0] : errors;
            const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : t("auth.signup.toast_validation_error_default");
            if (safeErrorMessage !== result.error) {
              toast({
                title: t("auth.signup.toast_field_error_title", { field: field.charAt(0).toUpperCase() + field.slice(1) }),
                description: safeErrorMessage,
                variant: "destructive",
                duration: 8000
              });
            }
          });
        }
        return;
      }

      if (result.success) {
        if (result.requiresActivation) {
          const phoneNumber = result.phoneNumber || processedPhone;
          setRegisteredPhone(phoneNumber);
          setSmsFailed(result.smsFailed || false);
          setShowVerification(true);

          if (result.smsFailed) {
            toast({
              title: t("auth.common.account_created_title"),
              description: t("auth.signup.toast_account_created_sms_issue"),
              duration: 10000
            });
          } else {
            toast({
              title: t("auth.common.account_created_title"),
              description: result.message || t("auth.signup.toast_account_created_check_phone", { phone: phoneNumber }),
              duration: 10000
            });
          }
        } else {
          toast({
            title: t("auth.common.account_created_title"),
            description: result.message || t("auth.signup.toast_account_created_dashboard")
          });
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        toast({
          title: t("auth.signup.toast_registration_failed_title"),
          description: result.error || t("auth.signup.toast_registration_failed_desc"),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("auth.signup.toast_registration_failed_title"),
        description: t("auth.common.unexpected_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mobile Background Component
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

  // Desktop Sliding Background Component
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="patternGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Signup UI
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
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
          className="relative z-10 flex-1 bg-white rounded-t-[40px] px-6 pt-20 pb-4 shadow-2xl overflow-y-auto mt-14"
        >
          {!showVerification ? (
            <>
              {/* Form Title */}
              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl font-bold text-gray-800 mb-1"
                >
                  {t("auth.signup.create_account_title")}
                </motion.h2>
                <p className="text-xs text-gray-600">
                  {t("auth.signup.join_senda_subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    placeholder={t("auth.signup.first_name")}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
                <div className="relative">
                  <Input
                    placeholder={t("auth.signup.last_name")}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="h-10 px-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder={t("auth.signup.email_placeholder_mobile")}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
              </div>

              {/* Phone Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  type="tel"
                  placeholder={t("auth.signup.phone_placeholder_mobile")}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
              </div>

              {/* Country and Company Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Select onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="h-10 pl-3 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm">
                      <SelectValue placeholder={t("auth.signup.country_label")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Input
                    name="company"
                    placeholder={t("auth.signup.company_placeholder_mobile")}
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                    className="h-10 px-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.common.password_label")}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className="h-10 pl-10 pr-10 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.signup.confirm_password_label")}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className="h-10 pl-10 pr-10 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox id="terms" required className="mt-0.5" />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                  {t("auth.signup.agree_prefix")}{" "}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">{t("auth.signup.terms_short")}</Link>
                  {" "}{t("auth.signup.and")}{" "}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">{t("auth.signup.privacy_policy")}</Link>
                </label>
              </div>

              {/* Sign Up Button */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="pt-1"
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? t("auth.common.creating_account") : t("auth.signup.sign_up_button_mobile")}
                </Button>
              </motion.div>
            </form>
            </>
          ) : (
            <>
              {/* Verification Title */}
              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl font-bold text-gray-800 mb-1"
                >
                  {t("auth.signup.verify_phone_title")}
                </motion.h2>
                <p className="text-xs text-gray-600">
                  {t("auth.signup.enter_code_subtitle")}
                </p>
              </div>

              <form onSubmit={handleVerifyPhone} className="space-y-4">
                <p className="text-center text-gray-600 text-xs">
                {smsFailed
                  ? t("auth.signup.sms_failed_message")
                  : t("auth.signup.code_sent_message", { phone: registeredPhone })
                }
              </p>

              {!smsFailed && (
                <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder={t("auth.common.enter_6digit_code")}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl"
                    />
                </div>
              )}

              {!smsFailed ? (
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? t("auth.common.verifying") : t("auth.signup.verify_phone_button")}
                  </Button>
                </motion.div>
              ) : (
                <Button
                  type="button"
                  onClick={() => window.open('mailto:support@mifumosms.com?subject=SMS Verification Issue', '_blank')}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg"
                >
                  {t("auth.signup.contact_support_button")}
                </Button>
              )}

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t("auth.signup.back_to_registration")}
                </button>
              </div>
            </form>
            </>
          )}

          {/* Links */}
          <div className="mt-3 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/"
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                {t("auth.common.home")}
              </Link>
              <span className="text-gray-400">|</span>
              <p className="text-gray-500 text-xs">
                {t("auth.common.already_have_account")}{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  {t("auth.common.sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Signup UI (unchanged from original)
  return (
    <div className="min-h-screen flex">
      <SlidingBackground />

      <div className="flex w-full">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-8 relative overflow-hidden min-h-screen">
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
              alt="Sign up illustration"
            />
          </div>

          <div className="absolute inset-0">
            <img
              src="/home background12.jpg"
              alt="Signup background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-8 bg-white/20 backdrop-blur-sm relative z-10 min-h-screen md:min-h-screen">
          <div className="w-full max-w-md space-y-4 sm:space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BrandLogo className="h-20 w-auto -my-3 -mr-10" />
                <span className="font-heading text-lg font-bold text-gray-900">
                  SENDA
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {showVerification ? t("auth.signup.verify_phone_title") : t("auth.signup.create_account_title")}
              </h2>
              {showVerification && (
                <p className="text-xs text-gray-600">
                  {smsFailed
                    ? t("auth.signup.sms_failed_message_support")
                    : t("auth.signup.code_sent_message_redirect", { phone: registeredPhone })
                  }
                </p>
              )}
            </div>

            {!showVerification ? (
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">{t("auth.signup.first_name")}</Label>
                    <Input
                      id="firstName"
                      placeholder={t("auth.signup.first_name")}
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">{t("auth.signup.last_name")}</Label>
                    <Input
                      id="lastName"
                      placeholder={t("auth.signup.last_name")}
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">{t("email_address")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.signup.email_placeholder_desktop")}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                      {t("phone_number")} {formData.phone && formData.phone.trim() && formData.phone.trim().length >= 8 ? '✓' : ''}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("auth.signup.phone_placeholder_desktop")}
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className={`h-9 border rounded-lg text-sm ${
                        formData.phone && formData.phone.trim() && formData.phone.trim().length >= 8
                          ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-xs font-medium text-gray-700">{t("auth.signup.country_label")}</Label>
                    <Select onValueChange={(value) => handleInputChange("country", value)}>
                      <SelectTrigger className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm">
                        <SelectValue placeholder={t("auth.signup.select_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="company" className="text-xs font-medium text-gray-700">{t("auth.signup.company_label")}</Label>
                  <Input
                    id="company"
                    placeholder={t("auth.signup.company_placeholder_desktop")}
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                    className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-700">{t("auth.common.password_label")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.signup.password_placeholder_desktop")}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 rounded-lg text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">{t("auth.signup.confirm_password_label")}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.signup.confirm_password_label")}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 rounded-lg text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" required className="mt-0.5" />
                  <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                    {t("auth.signup.agree_prefix")}{" "}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
                      {t("auth.signup.terms_full")}
                    </Link>{" "}
                    {t("auth.signup.and")}{" "}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
                      {t("auth.signup.privacy_policy")}
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? t("auth.common.creating_account") : t("auth.common.sign_up")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhone} className="space-y-4">
                {!smsFailed && (
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode" className="text-xs font-medium text-gray-700">
                      {t("auth.common.verification_code_label")}
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder={t("auth.common.enter_6digit_code")}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                  </div>
                )}

                {!smsFailed ? (
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? t("auth.common.verifying") : t("auth.signup.verify_phone_button")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => window.open('mailto:support@mifumosms.com?subject=SMS Verification Issue', '_blank')}
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  >
                    {t("auth.signup.contact_support_button")}
                  </Button>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowVerification(false)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {t("auth.signup.back_to_registration")}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center space-y-1">
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
    </div>
  );
};

export default Signup;

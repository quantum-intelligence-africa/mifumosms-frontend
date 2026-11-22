import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSiteLang } from "@/website/i18n";
import { focusRing } from "@/website/Layout";
import {
  AuthShell,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryBtnClass,
} from "@/website/AuthShell";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { API_CONFIG } from "@/config/api";
import GoogleButton from "@/components/auth/GoogleButton";

const GOOGLE_SIGNUP_URL = `${API_CONFIG.BASE_URL.replace(/\/api\/?$/, "")}/accounts/google/login/`;

const Signup = () => {
  const { t } = useLanguage();
  const { tr } = useSiteLang();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [smsFailed, setSmsFailed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referralSource: "",
    // Country field is hidden from the form — every signup defaults to Tanzania.
    country: "tz",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Came from the call center sign-up link (/call-center/signup): the server grants call center access; the dashboard then shows the call center view.
  const fromCallCenterLink = new URLSearchParams(location.search).get("service") === "call-center";
  // "Continue with Google" carries the same request, so a new Google account gets call center access too.
  const googleUrl = fromCallCenterLink ? `${GOOGLE_SIGNUP_URL}?service=call-center` : GOOGLE_SIGNUP_URL;

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
  }, [isAuthenticated, navigate, location, fromCallCenterLink]);

  const referralSources = [
    { value: "tiktok", label: t("auth.signup.referral_source_tiktok") },
    { value: "instagram", label: t("auth.signup.referral_source_instagram") },
    { value: "friends_referral", label: t("auth.signup.referral_source_friends_referral") },
    { value: "other", label: t("auth.signup.referral_source_other") },
  ];

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      toast({
        title: tr("Enter your full name", "Weka jina lako kamili"),
        description: tr("Please enter your first and last name, for example Amina Mwakyusa.", "Tafadhali weka jina la kwanza na la mwisho, kwa mfano Amina Mwakyusa."),
        variant: "destructive",
      });
      return;
    }

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
        referral_source?: string;
        country?: string;
        recaptcha_token?: string;
        service?: "call_center";
      } = {
        email: formData.email.trim(),
        password: formData.password,
        password_confirm: formData.confirmPassword,
        // One "Full name" field on screen; the API still takes first and last name separately.
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" "),
        phone_number: processedPhone,
        recaptcha_token: await getRecaptchaToken("signup"),
      };

      if (formData.referralSource) {
        registerData.referral_source = formData.referralSource;
      }

      // The call center sign-up link (/call-center/signup): the server grants call center access to these accounts.
      if (new URLSearchParams(location.search).get("service") === "call-center") {
        registerData.service = "call_center";
      }

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

  const phoneLooksValid = !!(formData.phone && formData.phone.trim() && formData.phone.trim().length >= 8);

  return (
    <AuthShell
      wide={!showVerification}
      title={showVerification ? t("auth.signup.verify_phone_title") : t("auth.signup.create_account_title")}
      subtitle={
        showVerification
          ? smsFailed
            ? t("auth.signup.sms_failed_message_support")
            : t("auth.signup.code_sent_message_redirect", { phone: registeredPhone })
          : t("auth.signup.join_senda_subtitle")
      }
    >
      {!showVerification ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <GoogleButton href={googleUrl} roundedClassName="rounded-xl !border-[#D5DCE8] !text-[15px] !font-semibold !text-[#0B1B3F] !shadow-none">
            {t("pg.InviteAccept.0945")}
          </GoogleButton>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className={authLabelClass}>{tr("Full name", "Jina kamili")}</Label>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder={tr("e.g. Amina Mwakyusa", "mf. Amina Mwakyusa")}
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                className={authInputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className={authLabelClass}>{t("email_address")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("auth.signup.email_placeholder_desktop")}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className={authInputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className={authLabelClass}>
                {t("phone_number")} {phoneLooksValid ? <span className="text-[#027A48]">✓</span> : ''}
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t("auth.signup.phone_placeholder_desktop")}
                value={formData.phone || ''}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                className={cn(authInputClass, phoneLooksValid && "border-[#12B76A]")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referralSource" className={authLabelClass}>{t("auth.signup.referral_source_label")}</Label>
              <Select onValueChange={(value) => handleInputChange("referralSource", value)}>
                <SelectTrigger
                  id="referralSource"
                  className="h-auto w-full rounded-xl border border-[#D5DCE8] bg-white px-3.5 py-3 text-[15px] text-[#0B1B3F] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                >
                  <SelectValue placeholder={t("auth.signup.select_placeholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#E3E7EE] bg-white shadow-lg">
                  {referralSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password" className={authLabelClass}>{t("auth.common.password_label")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.signup.password_placeholder_desktop")}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className={cn(authInputClass, "pr-12")}
                />
                <button
                  type="button"
                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] hover:text-[#0B1B3F]", focusRing)}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className={authLabelClass}>{t("auth.signup.confirm_password_label")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.signup.confirm_password_label")}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className={cn(authInputClass, "pr-12")}
                />
                <button
                  type="button"
                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] hover:text-[#0B1B3F]", focusRing)}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="terms"
              required
              className="mt-0.5 rounded-md border-[#D5DCE8] data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#2563EB]"
            />
            <label htmlFor="terms" className="text-sm leading-snug text-[#4B5565]">
              {t("auth.signup.agree_prefix")}{" "}
              <Link to="/terms" className={authLinkClass}>
                {t("auth.signup.terms_full")}
              </Link>{" "}
              {t("auth.signup.and")}{" "}
              <Link to="/privacy" className={authLinkClass}>
                {t("auth.signup.privacy_policy")}
              </Link>
            </label>
          </div>

          <Button type="submit" className={authPrimaryBtnClass} disabled={isLoading}>
            {isLoading ? t("auth.common.creating_account") : t("auth.common.sign_up")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyPhone} className="space-y-4">
          {!smsFailed && (
            <div className="space-y-1.5">
              <Label htmlFor="verificationCode" className={authLabelClass}>
                {t("auth.common.verification_code_label")}
              </Label>
              <Input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("auth.common.enter_6digit_code")}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className={cn(authInputClass, "text-center font-mono text-xl tracking-widest")}
              />
            </div>
          )}

          {!smsFailed ? (
            <Button
              type="submit"
              className={authPrimaryBtnClass}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? t("auth.common.verifying") : t("auth.signup.verify_phone_button")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => window.open('mailto:support@mifumosms.com?subject=SMS Verification Issue', '_blank')}
              className={authPrimaryBtnClass}
            >
              {t("auth.signup.contact_support_button")}
            </Button>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              className={cn("text-sm", authLinkClass)}
            >
              {t("auth.signup.back_to_registration")}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#E3E7EE] pt-5 text-sm">
        <Link to="/" className={authLinkClass}>
          {t("auth.common.home")}
        </Link>
        <span className="text-[#D5DCE8]" aria-hidden="true">|</span>
        <p className="text-[#4B5565]">
          {t("auth.common.already_have_account")}{" "}
          <Link to="/login" className={authLinkClass}>
            {t("auth.common.sign_in")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Signup;

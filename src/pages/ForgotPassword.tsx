import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, CheckCircle, Phone, Eye, EyeOff, Lock, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSMSVerification } from "@/hooks/useSMSVerification";
import { SMSVerificationCode } from "@/components/auth/SMSVerificationCode";
import { normalizePhoneNumber, getPhonePlaceholder, toBackendPhoneFormat } from "@/utils/phoneUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { AuthShell, authInputClass, authLabelClass, authLinkClass, authPrimaryBtnClass } from "@/website/AuthShell";
import { focusRing } from "@/website/Layout";

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backendPhoneNumber, setBackendPhoneNumber] = useState(""); // Store the phone number format returned by backend
  const [isLoading, setIsLoading] = useState(false);
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
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className={authLabelClass}>{t("phone_number")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t("auth.forgot_password.phone_placeholder")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className={authInputClass}
              />
              <div className="space-y-1 text-xs text-[#4B5565]">
                <p>{t("auth.forgot_password.phone_hint")}</p>
                <p className="font-medium text-[#2563EB]">📱 {t("auth.forgot_password.phone_formats_hint")}</p>
              </div>
            </div>

            <Button
              type="submit"
              className={authPrimaryBtnClass}
              disabled={isLoading}
            >
              {isLoading ? t("auth.common.sending") : t("auth.forgot_password.send_reset_code_button")}
            </Button>

            {verificationError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
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
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className={authLabelClass}>{t("auth.forgot_password.new_password_label")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder={t("auth.forgot_password.new_password_placeholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] transition-colors hover:text-[#4B5565] ${focusRing}`}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-[#4B5565]">{t("auth.forgot_password.password_min_length_hint")}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className={authLabelClass}>{t("auth.forgot_password.confirm_password_label")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.forgot_password.confirm_password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] transition-colors hover:text-[#4B5565] ${focusRing}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={authPrimaryBtnClass}
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

  const asideBullets: Record<typeof step, string[]> = {
    phone: [
      t("auth.forgot_password.bullet_phone_1"),
      t("auth.forgot_password.bullet_phone_2"),
      t("auth.forgot_password.bullet_phone_3"),
      t("auth.forgot_password.bullet_phone_4"),
    ],
    verification: [
      t("auth.forgot_password.bullet_verification_1"),
      t("auth.forgot_password.bullet_verification_2"),
      t("auth.forgot_password.bullet_verification_3"),
      t("auth.forgot_password.bullet_verification_4"),
    ],
    reset: [
      t("auth.forgot_password.bullet_reset_1"),
      t("auth.forgot_password.bullet_reset_2"),
      t("auth.forgot_password.bullet_reset_3"),
      t("auth.forgot_password.bullet_reset_4"),
    ],
  };

  const aside = (
    <div>
      <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-[#0B1B3F] xl:text-4xl">
        {step === 'phone' && t("auth.forgot_password.side_panel_phone_title")}
        {step === 'verification' && t("auth.forgot_password.side_panel_verification_title")}
        {step === 'reset' && t("auth.forgot_password.side_panel_reset_title")}
      </h2>
      <ul className="mt-8 space-y-4">
        {asideBullets[step].map((item) => (
          <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#4B5565]">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AuthShell title={getStepTitle()} subtitle={getStepDescription()} aside={aside}>
      {renderStep()}

      <p className="mt-6 border-t border-[#E3E7EE] pt-5 text-center text-sm text-[#4B5565]">
        {t("auth.common.remember_your_password")}{" "}
        <Link to="/login" className={authLinkClass}>
          {t("auth.common.sign_in")}
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;

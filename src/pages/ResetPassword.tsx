import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useHostBranding } from "@/contexts/BrandingContext";
import { AuthShell, authInputClass, authLabelClass, authLinkClass, authPrimaryBtnClass } from "@/website/AuthShell";
import { focusRing } from "@/website/Layout";
import { useLanguage } from "@/hooks/useLanguage";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { branded: whiteLabelHost } = useHostBranding();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: t("auth.reset_password.toast_invalid_link_title"),
        description: t("auth.reset_password.toast_invalid_link_desc"),
        variant: "destructive"
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.common.passwords_mismatch_title"),
        description: t("auth.common.passwords_mismatch_desc"),
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t("auth.common.password_too_short_title"),
        description: t("auth.common.password_too_short_desc"),
        variant: "destructive"
      });
      return;
    }

    if (!token) {
      toast({
        title: t("auth.reset_password.toast_invalid_link_title"),
        description: t("auth.reset_password.toast_invalid_link_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPassword(token, password);

      if (response.success) {
        setIsSuccess(true);
        toast({
          title: t("auth.reset_password.toast_reset_success_title"),
          description: t("auth.reset_password.toast_reset_success_desc"),
        });
      } else {
        toast({
          title: t("auth.reset_password.toast_reset_failed_title"),
          description: response.error || t("auth.reset_password.reset_failed_default"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t("auth.reset_password.toast_reset_failed_title"),
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

  // Back-to-homepage and support/terms links point at SENDA's site: not shown on a white-label host.
  const homeLink = !whiteLabelHost && (
    <Link to="/" className={`mb-5 inline-flex items-center gap-2 rounded text-sm text-[#4B5565] transition-colors hover:text-[#0B1B3F] ${focusRing}`}>
      <ArrowLeft className="h-4 w-4" />
      <span>{t("auth.reset_password.back_to_homepage")}</span>
    </Link>
  );

  if (isSuccess) {
    return (
      <AuthShell title={t("auth.reset_password.success_title")} subtitle={t("auth.reset_password.success_desc")}>
        {homeLink}
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl bg-[#ECFDF3] p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <p className="text-sm leading-relaxed text-[#4B5565]">
              {t("auth.reset_password.success_message")}
            </p>
          </div>

          <Button onClick={handleBackToLogin} className={authPrimaryBtnClass}>
            {t("auth.reset_password.sign_in_to_account_button")}
          </Button>
        </div>

        {!whiteLabelHost && (
          <p className="mt-6 border-t border-[#E3E7EE] pt-5 text-center text-xs text-[#4B5565]">
            {t("auth.reset_password.need_help")}{" "}
            <Link to="/support" className={authLinkClass}>
              {t("auth.reset_password.support_team")}
            </Link>
          </p>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.forgot_password.step_title_reset")} subtitle={t("auth.forgot_password.step_desc_reset")}>
      {homeLink}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className={authLabelClass}>{t("auth.reset_password.new_password_label")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.forgot_password.new_password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] transition-colors hover:text-[#4B5565] ${focusRing}`}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-[#4B5565]">{t("auth.reset_password.password_hint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className={authLabelClass}>{t("auth.reset_password.confirm_password_label")}</Label>
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

        <Button type="submit" className={authPrimaryBtnClass} disabled={isLoading}>
          {isLoading ? t("auth.common.resetting") : t("auth.reset_password.reset_password_button")}
        </Button>
      </form>

      <p className="mt-6 border-t border-[#E3E7EE] pt-5 text-center text-sm text-[#4B5565]">
        {t("auth.common.remember_your_password")}{" "}
        <Link to="/login" className={authLinkClass}>
          {t("auth.common.sign_in")}
        </Link>
      </p>

      {!whiteLabelHost && (
        <p className="mt-4 text-center text-xs text-[#4B5565]">
          {t("auth.reset_password.terms_notice_prefix")}{" "}
          <Link to="/terms" className={authLinkClass}>
            {t("auth.signup.terms_full")}
          </Link>{" "}
          {t("auth.signup.and")}{" "}
          <Link to="/privacy" className={authLinkClass}>
            {t("auth.signup.privacy_policy")}
          </Link>
        </p>
      )}
    </AuthShell>
  );
};

export default ResetPassword;

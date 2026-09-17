import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, ArrowLeft, Key, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useLanguage } from "@/hooks/useLanguage";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t("auth.reset_password.back_to_homepage")}</span>
            </Link>
            <div className="flex items-center justify-center gap-3 mb-4">
              <BrandLogo className="h-24 w-auto -my-3 -mr-11" />
              <span className="font-heading text-2xl font-bold text-gray-900">
                SENDA
              </span>
            </div>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">{t("auth.reset_password.success_title")}</CardTitle>
              <CardDescription className="text-gray-600">
                {t("auth.reset_password.success_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {t("auth.reset_password.success_message")}
                  </p>
                </div>

                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("auth.reset_password.sign_in_to_account_button")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              {t("auth.reset_password.need_help")}{" "}
              <Link to="/support" className="text-blue-600 hover:underline">
                {t("auth.reset_password.support_team")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t("auth.reset_password.back_to_homepage")}</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrandLogo className="h-24 w-auto -my-3 -mr-11" />
            <span className="font-heading text-2xl font-bold text-gray-900">
              SENDA
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{t("auth.forgot_password.step_title_reset")}</CardTitle>
            <CardDescription className="text-gray-600">
              {t("auth.forgot_password.step_desc_reset")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">{t("auth.reset_password.new_password_label")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.forgot_password.new_password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{t("auth.reset_password.password_hint")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">{t("auth.reset_password.confirm_password_label")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.forgot_password.confirm_password_placeholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? t("auth.common.resetting") : t("auth.reset_password.reset_password_button")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t("auth.common.remember_your_password")}{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  {t("auth.common.sign_in")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            {t("auth.reset_password.terms_notice_prefix")}{" "}
            <Link to="/terms" className="text-blue-600 hover:underline">
              {t("auth.signup.terms_full")}
            </Link>{" "}
            {t("auth.signup.and")}{" "}
            <Link to="/privacy" className="text-blue-600 hover:underline">
              {t("auth.signup.privacy_policy")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

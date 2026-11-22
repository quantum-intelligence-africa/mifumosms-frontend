import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TwoFactorChallenge, type TwoFactorChallengeState } from "@/components/auth/TwoFactorChallenge";
import { AccountVerification, type AccountVerificationState } from "@/components/auth/AccountVerification";
import { useLanguage } from "@/hooks/useLanguage";
import { useHostBranding } from "@/contexts/BrandingContext";
import { googleLoginUrl, inviteTokenFromNext, safeInviteNext } from "@/lib/googleLogin";
import { API_CONFIG } from "@/config/api";
import { getRecaptchaToken } from "@/lib/recaptcha";
import GoogleButton from "@/components/auth/GoogleButton";
import { PasskeyButton } from "@/components/auth/PasskeyButton";
import { isPasskeySupported } from "@/services/passkeys";
import { SHOW_PASSKEY_SIGNIN } from "@/config/authUi";
import { AuthShell, authInputClass, authLabelClass, authLinkClass, authPrimaryBtnClass } from "@/website/AuthShell";
import { focusRing } from "@/website/Layout";

// Hidden admin gate: an email suffixed with ".admin" (e.g. "admin@example.com.admin")
// routes the login attempt to the admin endpoint and drops the user on /admin
// without ever exposing the /admin URL in the UI. The suffix is stripped before
// the request is sent.
const ADMIN_SUFFIX = ".admin";
const ADMIN_SESSION_KEY = "senda_admin_auth";
// /auth/admin/login lives at the root of mifumosms.mifumolabs.com, not under /api.
const ADMIN_BASE_URL = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");

const Login = () => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<TwoFactorChallengeState | null>(null);
  const [verification, setVerification] = useState<AccountVerificationState | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // A customer's white-label domain shows only the sign-in screen: no marketing links, no sign-up.
  const { branded: whiteLabelHost } = useHostBranding();
  // An invitation page sends people here with ?next=/invite/<token>: sign in, then go straight back.
  const nextPath = safeInviteNext(new URLSearchParams(location.search).get("next"));
  const invitationToken = inviteTokenFromNext(nextPath);

  // Google sends refused people back here with ?error=not_member.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("error") === "not_member") {
      toast({
        title: t("pg.Login.0881"),
        description: t("pg.Login.0882"),
        variant: "destructive",
        duration: 10000,
      });
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Force light theme on auth page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = nextPath || location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // ── Hidden admin gate ────────────────────────────────────────────────
    // If the email ends with ".admin", strip the suffix, call the admin
    // endpoint, and redirect to the admin dashboard. Regular users go
    // through the normal login flow. The user never sees an "Admin login"
    // link or visits /admin directly.
    const trimmedEmail = formData.email.trim();
    // Not offered on an organization's own address: staff sign in at the main SENDA site.
    if (!whiteLabelHost && trimmedEmail.toLowerCase().endsWith(ADMIN_SUFFIX)) {
      const realEmail = trimmedEmail.slice(0, -ADMIN_SUFFIX.length);
      try {
        const res = await fetch(`${ADMIN_BASE_URL}/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: realEmail, password: formData.password }),
        });
        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        if (data && (data as { success?: boolean }).success) {
          const payload = (data as { data: { access_token: string; expires_in: number; admin: unknown } }).data;
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
            token: payload.access_token,
            expires_at: Date.now() + payload.expires_in * 1000,
            admin: payload.admin,
            loginAt: Date.now(),
          }));
          toast({ title: t("auth.common.welcome_back"), description: t("auth.login.toast_admin_opening") });
          navigate("/admin", { replace: true });
          return;
        }
        // Fall through to a "wrong credentials" toast — generic, doesn't
        // reveal that admin-mode was attempted.
        const errObj = (data as { error?: { message?: string } }).error;
        toast({
          title: t("auth.login.toast_login_failed_title"),
          description: errObj?.message || t("auth.login.toast_credentials_error"),
          variant: "destructive",
        });
      } catch {
        toast({
          title: t("auth.login.toast_login_failed_title"),
          description: t("auth.login.toast_network_error"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const result = await login({
        email: formData.email,
        password: formData.password,
        recaptchaToken,
        rememberMe: formData.rememberMe,
        invitationToken: invitationToken || undefined,
      });

      if (result.success) {
        toast({
          title: t("auth.login.toast_login_success_title"),
          description: t("auth.login.toast_login_success_desc")
        });

        const from = nextPath || location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else if (result.requiresVerification && result.pendingToken) {
        setVerification({
          pendingToken: result.pendingToken,
          phoneOnFile: !!result.phoneOnFile,
          maskedPhone: result.maskedPhone || "",
          maskedEmail: result.maskedEmail || "",
        });
      } else if (result.requires2FA && result.challengeId) {
        setOtpChallenge({
          challengeId: result.challengeId,
          maskedEmail: result.maskedEmail || "",
          delivery: result.delivery || "sent",
          expiresIn: result.expiresIn ?? 300,
          resendAfter: result.resendAfter ?? 60,
        });
      } else {
        const errorMessage = result.error || t("auth.login.toast_credentials_error");

        if (result.requiresActivation) {
          const resultData = result as Record<string, unknown>;
          const resultPhone = resultData.phoneNumber as string | undefined;
          const storedPhone = localStorage.getItem('pending_phone_activation');
          const storedMethod = localStorage.getItem('pending_verification_method') as 'sms' | 'email' | null;

          let verificationMethod: 'sms' | 'email' = 'sms';
          const phoneNumber = resultPhone || storedPhone || undefined;

          if (storedMethod) {
            verificationMethod = storedMethod;
          } else if (phoneNumber) {
            verificationMethod = 'sms';
            localStorage.setItem('pending_phone_activation', phoneNumber);
            localStorage.setItem('pending_verification_method', 'sms');
          } else {
            verificationMethod = 'sms';
            localStorage.setItem('pending_verification_method', 'sms');
          }

          const toastMessage = phoneNumber
            ? t("auth.login.toast_code_sent_with_phone", { phone: phoneNumber })
            : t("auth.login.toast_code_sent_no_phone");

          toast({
            title: t("auth.login.toast_not_activated_title"),
            description: toastMessage,
            variant: "default",
            duration: 10000
          });

          navigate('/smsactivation', {
            state: {
              email: formData.email,
              phoneNumber: phoneNumber,
              verificationMethod: verificationMethod
            }
          });
        } else {
          toast({
            title: t("auth.login.toast_login_failed_title"),
            description: errorMessage,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: t("auth.login.toast_login_failed_title"),
        description: t("auth.common.unexpected_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerified = (tokens: { access: string; refresh: string }, user: unknown) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(user));
    window.location.assign(nextPath || "/dashboard");
  };

  const passkeyError = (description: string, kind: "error" | "info" = "error") =>
    kind === "info"
      ? toast({ title: t("pk.none_title"), description })
      : toast({ title: t("auth.login.toast_login_failed_title"), description, variant: "destructive" });

  // Two separate ways, shown right under "Continue with Google": this device's fingerprint/face, and a passkey of any kind.
  const passkeyButtons = (rounded: string) => !SHOW_PASSKEY_SIGNIN ? null : (
    <>
      {(["device", "passkey"] as const).map((mode) => (
        <PasskeyButton
          key={mode}
          mode={mode}
          roundedClassName={rounded}
          onSignedIn={handleTwoFactorVerified}
          onNeedsVerification={setVerification}
          onError={passkeyError}
        />
      ))}
      {isPasskeySupported() && <p className="text-center text-xs leading-snug text-[#4B5565]">{t("pk.first_time")}</p>}
    </>
  );

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (verification) {
    return <AccountVerification state={verification} onVerified={handleTwoFactorVerified} onBack={() => setVerification(null)} />;
  }

  if (otpChallenge) {
    return (
      <TwoFactorChallenge
        challenge={otpChallenge}
        invitationToken={invitationToken || undefined}
        onVerified={handleTwoFactorVerified}
        onBack={() => setOtpChallenge(null)}
      />
    );
  }

  return (
    <AuthShell title={t("auth.common.welcome_back")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <GoogleButton href={googleLoginUrl(whiteLabelHost, nextPath)} roundedClassName="rounded-xl">
            {t("pg.InviteAccept.0945")}
          </GoogleButton>
          {passkeyButtons("rounded-xl")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className={authLabelClass}>{t("email_address")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("auth.common.email_placeholder")}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
            className={authInputClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className={authLabelClass}>{t("auth.common.password_label")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.common.password_placeholder")}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              autoComplete="current-password"
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A94A6] transition-colors hover:text-[#4B5565] ${focusRing}`}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
              className="h-4 w-4 rounded border-[#D5DCE8] data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#2563EB]"
            />
            <Label htmlFor="remember" className="text-sm text-[#4B5565]">
              {t("auth.common.remember_me")}
            </Label>
          </div>
          <Link to="/forgot-password" className={`text-sm ${authLinkClass}`}>
            {t("auth.common.forgot_password_link")}
          </Link>
        </div>

        <Button type="submit" className={authPrimaryBtnClass} disabled={isLoading}>
          {isLoading ? t("auth.common.signing_in") : t("auth.common.sign_in")}
        </Button>
      </form>

      {/* Links (hidden on a white-label host) */}
      {!whiteLabelHost && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-[#E3E7EE] pt-5 text-sm text-[#4B5565]">
          <Link to="/" className={authLinkClass}>
            {t("auth.common.home")}
          </Link>
          <span className="text-[#D5DCE8]" aria-hidden="true">|</span>
          <p>
            {t("auth.common.dont_have_account")}{" "}
            <Link to="/signup" className={authLinkClass}>
              {t("auth.common.sign_up")}
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;

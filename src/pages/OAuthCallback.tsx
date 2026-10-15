import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BrandName } from "@/components/layout/BrandLogo";
import { safeInviteNext } from "@/lib/googleLogin";

import { useLanguage } from "@/hooks/useLanguage";
import { TwoFactorChallenge, type TwoFactorChallengeState } from "@/components/auth/TwoFactorChallenge";
export default function OAuthCallback() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  // Where to go after sign-in: back to the invitation being accepted, otherwise the dashboard.
  const [destination, setDestination] = useState("/dashboard");
  // Set when this account also requires the emailed code: no tokens exist until it is verified.
  const [challenge, setChallenge] = useState<TwoFactorChallengeState | null>(null);

  useEffect(() => {
    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access = params.get("access");
      const refresh = params.get("refresh");
      // Only an invitation path is honoured (exact shape); anything else falls back to the dashboard.
      const next = safeInviteNext(params.get("next")) || "/dashboard";
      setDestination(next);

      if (params.get("requires_2fa") === "1" && params.get("challenge_id")) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setChallenge({
          challengeId: params.get("challenge_id") || "",
          maskedEmail: params.get("masked_email") || "",
          delivery: params.get("delivery") || "sent",
          expiresIn: 300,
          resendAfter: 60,
        });
        return;
      }

      if (!access || !refresh) {
        setError(t("pg.OAuthCallback.0939"));
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      apiClient.setToken(access);
      localStorage.setItem("refresh_token", refresh);

      const profile = await apiClient.getProfile();
      if (!profile.data) {
        setError(t("pg.OAuthCallback.0940"));
        return;
      }

      localStorage.setItem("user", JSON.stringify(profile.data));
      localStorage.setItem("user_profile", JSON.stringify(profile.data));
      completeOAuthLogin(profile.data);
      if (!profile.data.phone_number) {
        setNeedsPhone(true);
        return;
      }
      navigate(next, { replace: true });
    };

    completeLogin().catch(() => {
      setError(t("pg.OAuthCallback.0941"));
    });
  }, [navigate]);

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSavingPhone(true);
    try {
      const response = await apiClient.setOAuthPhone(phone);
      if (!response.data?.phone_number) {
        setError(response.error || "Please enter a valid phone number.");
        return;
      }
      const profile = await apiClient.getProfile();
      if (profile.data) {
        localStorage.setItem("user", JSON.stringify(profile.data));
        localStorage.setItem("user_profile", JSON.stringify(profile.data));
        completeOAuthLogin(profile.data);
      }
      navigate(destination, { replace: true });
    } catch {
      setError(t("pg.OAuthCallback.0942"));
    } finally {
      setSavingPhone(false);
    }
  };

  if (challenge) {
    return (
      <TwoFactorChallenge
        challenge={challenge}
        onVerified={(tokens, user) => {
          localStorage.setItem("access_token", tokens.access);
          localStorage.setItem("refresh_token", tokens.refresh);
          localStorage.setItem("user", JSON.stringify(user));
          window.location.assign(destination);
        }}
        onBack={() => navigate("/login", { replace: true })}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        {needsPhone ? (
          <>
            <h1 className="text-xl font-semibold">{t("pg.OAuthCallback.0943")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("pg.OAuthCallback.0944")} <BrandName /> {t("pg.OAuthCallback.0945")}
            </p>
            <form className="mt-6 space-y-4 text-left" onSubmit={submitPhone}>
              <label className="block text-sm font-medium" htmlFor="oauth-phone">
                {t("pg.OAuthCallback.0946")}
              </label>
              <input
                id="oauth-phone"
                className="w-full rounded-lg border bg-background px-4 py-3"
                placeholder="+255 700 000 000"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button className="w-full rounded-lg bg-primary px-5 py-3 text-primary-foreground" disabled={savingPhone}>
                {savingPhone ? t("pg.Settings.0429") : t("pg.OAuthCallback.0947")}
              </button>
            </form>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-semibold">{t("pg.OAuthCallback.0948")}</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button
              className="mt-6 rounded-lg bg-primary px-5 py-3 text-primary-foreground"
              onClick={() => navigate("/login", { replace: true })}
            >
              {t("pg.OAuthCallback.0949")}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-4 text-muted-foreground">{t("pg.OAuthCallback.0950")}</p>
          </>
        )}
      </section>
    </main>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access = params.get("access");
      const refresh = params.get("refresh");

      if (!access || !refresh) {
        setError("Google sign-in did not return valid credentials.");
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      apiClient.setToken(access);
      localStorage.setItem("refresh_token", refresh);

      const profile = await apiClient.getProfile();
      if (!profile.data) {
        setError("Your Google account was authenticated, but your profile could not be loaded.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(profile.data));
      localStorage.setItem("user_profile", JSON.stringify(profile.data));
      completeOAuthLogin(profile.data);
      if (!profile.data.phone_number) {
        setNeedsPhone(true);
        return;
      }
      navigate("/dashboard", { replace: true });
    };

    completeLogin().catch(() => {
      setError("Unable to complete Google sign-in. Please try again.");
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
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Unable to save your phone number. Please try again.");
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        {needsPhone ? (
          <>
            <h1 className="text-xl font-semibold">Add your phone number</h1>
            <p className="mt-2 text-muted-foreground">
              One phone number is required to finish setting up your SENDA account.
            </p>
            <form className="mt-6 space-y-4 text-left" onSubmit={submitPhone}>
              <label className="block text-sm font-medium" htmlFor="oauth-phone">
                Phone number
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
                {savingPhone ? "Saving..." : "Continue"}
              </button>
            </form>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-semibold">Google sign-in failed</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button
              className="mt-6 rounded-lg bg-primary px-5 py-3 text-primary-foreground"
              onClick={() => navigate("/login", { replace: true })}
            >
              Return to sign in
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-4 text-muted-foreground">Signing you in securely...</p>
          </>
        )}
      </section>
    </main>
  );
}

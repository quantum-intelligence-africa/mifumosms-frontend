import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

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
      navigate("/dashboard", { replace: true });
    };

    completeLogin().catch(() => {
      setError("Unable to complete Google sign-in. Please try again.");
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="text-center">
        {error ? (
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

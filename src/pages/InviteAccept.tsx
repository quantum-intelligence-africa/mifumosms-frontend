import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appLanguage } from "@/utils/appLocale";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHostBranding } from "@/contexts/BrandingContext";
import { apiClient, type InvitationInfo } from "@/lib/api";
import { googleLoginUrl } from "@/lib/googleLogin";
import { BrandLogo, BrandName } from "@/components/layout/BrandLogo";
import GoogleButton from "@/components/auth/GoogleButton";

import { useLanguage } from "@/hooks/useLanguage";
type Problem = { title: string; message: string } | null;

const TEXT = {
  en: {
    newTitle: "Create your account to join", newIntro: "You were invited by email and do not have an account yet. Tell us who you are and choose a password, then you will be signed in and join the team.",
    first: "First name", last: "Last name", password: "Password", confirm: "Confirm password", create: "Create account and join", creating: "Creating your account...",
    haveAccount: "I already have an account", orGoogle: "Or continue with Google",
    existingTitle: "Sign in to join", existingIntro: (email: string) => `This invitation is for ${email}. That email already has an account: sign in and you will join the team and see this organization.`,
    signIn: "Sign in to join", signInFailed: "Your account was created, but we could not sign you in automatically. Sign in with your new password to finish joining.",
    short: "Fill in every field.", mismatch: "The two passwords do not match.",
  },
  sw: {
    newTitle: "Fungua akaunti yako ili ujiunge", newIntro: "Ulialikwa kwa barua pepe na bado huna akaunti. Tuambie wewe ni nani na uchague nenosiri, kisha utaingia na kujiunga na timu.",
    first: "Jina la kwanza", last: "Jina la mwisho", password: "Nenosiri", confirm: "Thibitisha nenosiri", create: "Fungua akaunti na ujiunge", creating: "Inafungua akaunti yako...",
    haveAccount: "Tayari nina akaunti", orGoogle: "Au endelea na Google",
    existingTitle: "Ingia ili ujiunge", existingIntro: (email: string) => `Mwaliko huu ni wa ${email}. Barua pepe hiyo tayari ina akaunti: ingia na utajiunga na timu na kuliona shirika hili.`,
    signIn: "Ingia ili ujiunge", signInFailed: "Akaunti yako imefunguliwa, lakini hatukuweza kukuingiza moja kwa moja. Ingia kwa nenosiri lako jipya ili kukamilisha.",
    short: "Jaza sehemu zote.", mismatch: "Manenosiri mawili hayalingani.",
  },
};

/**
 * Team invitation landing page: /invite/:token (also /invitations/accept/:token).
 *
 * The organization, role and portal come from the backend for this exact token; nothing in the URL
 * besides the token decides who joins what. Signed-out invitees sign in (email or Google) and come
 * straight back here; the backend only accepts the invitation for the account it was issued to.
 */
export default function InviteAccept() {
  const { t } = useLanguage();
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user, logout, login } = useAuth();
  const T = TEXT[appLanguage()];
  const { branded: whiteLabelHost } = useHostBranding();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [wrongAccount, setWrongAccount] = useState<string | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", password: "", confirm_password: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const invitePath = `/invite/${token}`;

  useEffect(() => {
    let live = true;
    apiClient.getInvitationInfo(token).then((result) => {
      if (!live) return;
      // The invitation belongs on the organization's own portal. The host comes from the server, never
      // from the URL, so this can't be used to bounce someone to an arbitrary site.
      if (result.valid && result.portal_host && result.portal_host !== window.location.hostname) {
        window.location.replace(`https://${result.portal_host}${invitePath}`);
        return;
      }
      setInfo(result);
    });
    return () => {
      live = false;
    };
  }, [token, invitePath]);

  const accept = async () => {
    setAccepting(true);
    setProblem(null);
    const res = await apiClient.acceptInvitation(token);
    setAccepting(false);
    if (res.success) {
      toast({ title: `Welcome to ${res.data?.tenant.name ?? info?.organization ?? "the team"}`, description: t("pg.InviteAccept.0937") });
      // A full load so the app picks up the new membership everywhere.
      window.location.assign("/dashboard");
      return;
    }
    if (res.code === "wrong_account") {
      setWrongAccount(res.email_hint || "another email address");
      return;
    }
    setProblem({
      title: res.code === "expired" ? "This invitation has expired" : "We couldn't accept this invitation",
      message: res.error || "Please ask the organization's administrator to send you a new invitation.",
    });
  };

  /** A brand-new invitee: save their name and password, sign them in with it, and join the team straight away. */
  const createAccount = async () => {
    setFormError("");
    if (!form.first_name.trim() || !form.last_name.trim() || !form.password) { setFormError(T.short); return; }
    if (form.password !== form.confirm_password) { setFormError(T.mismatch); return; }
    setCreating(true);
    const made = await apiClient.setupInvitedAccount(token, { ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim() });
    if (!made.success || !made.email) {
      setCreating(false);
      if (made.code === "account_exists") { setInfo((i) => (i ? { ...i, account: "existing" } : i)); return; }
      setFormError(made.error || "We couldn't create the account. Try again.");
      return;
    }
    const signedIn = await login({ email: made.email, password: form.password });
    setCreating(false);
    if (signedIn.success) { await accept(); return; }
    // Two-step sign-in (email code) or anything else that needs the sign-in page: send them there, and back here afterwards.
    toast({ title: T.signInFailed });
    navigate(`/login?next=${encodeURIComponent(invitePath)}`, { replace: true });
  };

  const switchAccount = async () => {
    await logout();
    navigate(`/login?next=${encodeURIComponent(invitePath)}`, { replace: true });
  };

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-3">
          <BrandLogo className="h-12 w-auto" />
          <span className="font-heading text-lg font-bold">
            <BrandName />
          </span>
        </div>
        {children}
      </div>
    </main>
  );

  if (info === null || authLoading) {
    return shell(
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>,
    );
  }

  if (!info.valid) {
    const expired = info.reason === "expired";
    return shell(
      <>
        <h1 className="text-xl font-semibold">{expired ? t("pg.InviteAccept.0938") : t("pg.InviteAccept.0939")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {expired
            ? `Ask ${info.organization ?? "the organization"}'s administrator to send you a new invitation.`
            : t("pg.InviteAccept.0940")}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">{t("pg.InviteAccept.0941")}</Link>
        </Button>
      </>,
    );
  }

  const summary = (
    <>
      <h1 className="text-xl font-semibold">{t("pg.InviteAccept.0942")} {info.organization}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("pg.InviteAccept.0943")} <span className="font-medium text-foreground">{info.role_display || info.role}</span>
        {info.email_hint ? <> {t("pg.InviteAccept.0944")} {info.email_hint}</> : null}
      </p>
    </>
  );

  if (!isAuthenticated && info.account === "new") {
    const field = (key: keyof typeof form, label: string, type = "text", autoComplete = "off") => (
      <div className="space-y-1.5 text-left">
        <Label htmlFor={`inv-${key}`}>{label}</Label>
        <Input id={`inv-${key}`} type={type} autoComplete={autoComplete} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
      </div>
    );
    return shell(
      <>
        <h1 className="text-xl font-semibold">{T.newTitle} {info.organization}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pg.InviteAccept.0943")} <span className="font-medium text-foreground">{info.role_display || info.role}</span>
          {info.email_hint ? <> {t("pg.InviteAccept.0944")} {info.email_hint}</> : null}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{T.newIntro}</p>
        <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); void createAccount(); }}>
          <div className="grid grid-cols-2 gap-3">{field("first_name", T.first, "text", "given-name")}{field("last_name", T.last, "text", "family-name")}</div>
          {field("password", T.password, "password", "new-password")}
          {field("confirm_password", T.confirm, "password", "new-password")}
          {formError && <p className="text-left text-sm text-destructive" role="alert">{formError}</p>}
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{T.creating}</> : T.create}
          </Button>
        </form>
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{T.orGoogle}</p>
          <GoogleButton href={googleLoginUrl(whiteLabelHost, invitePath)} roundedClassName="rounded-lg">{t("pg.InviteAccept.0945")}</GoogleButton>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setInfo((i) => (i ? { ...i, account: "existing" } : i))}>{T.haveAccount}</button>
        </div>
      </>,
    );
  }

  if (!isAuthenticated) {
    return shell(
      <>
        <h1 className="text-xl font-semibold">{T.existingTitle} {info.organization}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pg.InviteAccept.0943")} <span className="font-medium text-foreground">{info.role_display || info.role}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{T.existingIntro(info.email_hint || "")}</p>
        <div className="mt-6 space-y-3">
          <GoogleButton href={googleLoginUrl(whiteLabelHost, invitePath)} roundedClassName="rounded-lg">
            {t("pg.InviteAccept.0945")}
          </GoogleButton>
          <Button asChild className="w-full">
            <Link to={`/login?next=${encodeURIComponent(invitePath)}`}>{T.signIn}</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("pg.InviteAccept.0947")}</p>
      </>,
    );
  }

  if (wrongAccount) {
    return shell(
      <>
        <h1 className="text-xl font-semibold">{t("pg.InviteAccept.0948")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pg.InviteAccept.0949")} {wrongAccount}{t("pg.InviteAccept.0950")} {user?.email}{t("pg.InviteAccept.0951")}
        </p>
        <Button className="mt-6 w-full" onClick={switchAccount}>
          {t("pg.InviteAccept.0952")}
        </Button>
      </>,
    );
  }

  return shell(
    <>
      {summary}
      {problem && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-sm">
          <p className="font-medium text-destructive">{problem.title}</p>
          <p className="mt-1 text-muted-foreground">{problem.message}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">{t("pg.InviteAccept.0953")} {user?.email}</p>
      <Button className="mt-4 w-full" onClick={accept} disabled={accepting}>
        {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("pg.InviteAccept.0954")}
      </Button>
      <button type="button" className="mt-3 text-xs text-muted-foreground underline" onClick={switchAccount}>
        {t("pg.InviteAccept.0955")}
      </button>
    </>,
  );
}

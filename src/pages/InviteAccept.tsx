import { useEffect, useState } from "react";
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

type Problem = { title: string; message: string } | null;

/**
 * Team invitation landing page: /invite/:token (also /invitations/accept/:token).
 *
 * The organization, role and portal come from the backend for this exact token; nothing in the URL
 * besides the token decides who joins what. Signed-out invitees sign in (email or Google) and come
 * straight back here; the backend only accepts the invitation for the account it was issued to.
 */
export default function InviteAccept() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const { branded: whiteLabelHost } = useHostBranding();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [wrongAccount, setWrongAccount] = useState<string | null>(null);

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
      toast({ title: `Welcome to ${res.data?.tenant.name ?? info?.organization ?? "the team"}`, description: "Your invitation was accepted." });
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
        <h1 className="text-xl font-semibold">{expired ? "This invitation has expired" : "This invitation isn't valid"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {expired
            ? `Ask ${info.organization ?? "the organization"}'s administrator to send you a new invitation.`
            : "It may have already been used or withdrawn. Ask the organization's administrator for a new invitation."}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </>,
    );
  }

  const summary = (
    <>
      <h1 className="text-xl font-semibold">You're invited to join {info.organization}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Role: <span className="font-medium text-foreground">{info.role_display || info.role}</span>
        {info.email_hint ? <> · sent to {info.email_hint}</> : null}
      </p>
    </>
  );

  if (!isAuthenticated) {
    return shell(
      <>
        {summary}
        <div className="mt-6 space-y-3">
          <GoogleButton href={googleLoginUrl(whiteLabelHost, invitePath)} roundedClassName="rounded-lg">
            Continue with Google
          </GoogleButton>
          <Button asChild className="w-full">
            <Link to={`/login?next=${encodeURIComponent(invitePath)}`}>Sign in with email</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Use the email address this invitation was sent to.</p>
      </>,
    );
  }

  if (wrongAccount) {
    return shell(
      <>
        <h1 className="text-xl font-semibold">This invitation is for a different account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It was sent to {wrongAccount}, but you're signed in as {user?.email}. Sign in with the invited account to accept it.
        </p>
        <Button className="mt-6 w-full" onClick={switchAccount}>
          Sign out and switch account
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
      <p className="mt-4 text-xs text-muted-foreground">Signed in as {user?.email}</p>
      <Button className="mt-4 w-full" onClick={accept} disabled={accepting}>
        {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Accept invitation
      </Button>
      <button type="button" className="mt-3 text-xs text-muted-foreground underline" onClick={switchAccount}>
        Not you? Switch account
      </button>
    </>,
  );
}

import { API_CONFIG } from "@/config/api";

// /accounts/google/login/ lives at the root of the API host, not under /api.
const API_ROOT = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");

/** Only an invitation page may be carried through sign-in as the post-login destination. */
export const INVITE_PATH = /^\/(?:invite|invitations\/accept)\/([A-Za-z0-9]{32})\/?$/;

/** The invitation path in a `?next=` value, or null. Anything else is ignored (no open redirects). */
export function safeInviteNext(value: string | null | undefined): string | null {
  const match = INVITE_PATH.exec(value || "");
  return match ? `/invite/${match[1]}` : null;
}

/**
 * Where "Continue with Google" starts. On an organization's own address the backend must know which
 * one, so it can admit only that organization's members and bring the person back here afterwards;
 * an invitation page also asks to return to itself.
 */
export function googleLoginUrl(whiteLabelHost: boolean, next?: string | null): string {
  const params = new URLSearchParams();
  if (whiteLabelHost) params.set("wl_host", window.location.hostname);
  const invite = safeInviteNext(next);
  if (invite) params.set("next", invite);
  const query = params.toString();
  return `${API_ROOT}/accounts/google/login/${query ? `?${query}` : ""}`;
}

/** The invitation token in a safe `next` path, or "". */
export function inviteTokenFromNext(next: string | null | undefined): string {
  const match = INVITE_PATH.exec(next || "");
  return match ? match[1] : "";
}

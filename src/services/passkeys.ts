// WebAuthn client for passkey registration and sign-in (backend: mifumosms_backend `accounts/passkeys.py`).
//
// The browser/OS decides how the user proves presence (fingerprint, face, Windows Hello, device PIN, security key);
// this code only asks for it, with userVerification "required". Nothing is trusted client-side: sign-in succeeds only
// when the server verifies the signed assertion and returns tokens.
import { API_CONFIG } from "@/config/api";

const BASE = API_CONFIG.BASE_URL;

export interface PasskeyInfo {
  id: string;
  name: string;
  rp_id: string;
  transports: string[];
  device_type: string;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface PasskeyEvent {
  event: string;
  label: string;
  outcome: string;
  detail: string;
  ip_address: string | null;
  at: string;
}

export type PasskeyFailure =
  | "unsupported" | "cancelled" | "already_registered" | "network" | "disabled"
  | "rate_limited" | "reauth_required" | "last_method" | "failed";

export interface PasskeyResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  failure?: PasskeyFailure;
  message?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

const toBuffer = (b64url: string): ArrayBuffer => {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const bin = atob((b64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

const toB64url = (buf: ArrayBuffer | null | undefined): string | undefined => {
  if (!buf) return undefined;
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function call(path: string, method: string, body?: Json, auth = false): Promise<{ status: number; data: Json }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${localStorage.getItem("access_token") || ""}`;
  try {
    const res = await fetch(`${BASE}/auth/passkeys/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    return { status: 0, data: {} };
  }
}

function fail<T>(status: number, data: Json, fallback: PasskeyFailure = "failed"): PasskeyResult<T> {
  let failure: PasskeyFailure = fallback;
  if (status === 0) failure = "network";
  else if (status === 429) failure = "rate_limited";
  else if (data.code === "disabled") failure = "disabled";
  else if (data.code === "reauth_required") failure = "reauth_required";
  else if (data.code === "last_method") failure = "last_method";
  else if (data.code === "duplicate") failure = "already_registered";
  return { ok: false, status, failure, message: typeof data.error === "string" ? data.error : undefined };
}

export type PasskeyAttachment = "platform" | "cross-platform";

/** True when this device has its own fingerprint, face, Windows Hello or screen-lock unlock that a passkey can use. */
export async function platformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  try {
    return !!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.());
  } catch {
    return false;
  }
}

function creationOptions(o: Json, attachment?: PasskeyAttachment): PublicKeyCredentialCreationOptions {
  return {
    ...o,
    // The server asks for a verified (fingerprint/face/PIN) discoverable credential; the person can steer WHERE it lives.
    authenticatorSelection: { ...(o.authenticatorSelection || {}), ...(attachment ? { authenticatorAttachment: attachment } : {}) },
    challenge: toBuffer(o.challenge),
    user: { ...o.user, id: toBuffer(o.user.id) },
    excludeCredentials: (o.excludeCredentials || []).map((c: Json) => ({ ...c, id: toBuffer(c.id) })),
  } as PublicKeyCredentialCreationOptions;
}

function requestOptions(o: Json, mode: "device" | "any" = "any"): PublicKeyCredentialRequestOptions {
  return {
    ...o,
    // "device": ask the browser to go straight to this device's own fingerprint / face / Windows Hello / PIN. Browsers that do not know
    // the hint ignore it and show their usual chooser, so the worst case is the same as the plain passkey button.
    ...(mode === "device" ? { hints: ["client-device"] } : {}),
    challenge: toBuffer(o.challenge),
    allowCredentials: (o.allowCredentials || []).map((c: Json) => ({ ...c, id: toBuffer(c.id) })),
  } as PublicKeyCredentialRequestOptions;
}

/** The authenticator's DOMException name, mapped to something the UI can word. */
function ceremonyFailure(err: unknown): PasskeyFailure {
  const name = (err as DOMException)?.name;
  if (name === "NotAllowedError" || name === "AbortError") return "cancelled";
  if (name === "InvalidStateError") return "already_registered";
  if (name === "NotSupportedError" || name === "SecurityError") return "unsupported";
  return "failed";
}

export async function listPasskeys(): Promise<PasskeyResult<{ passkeys: PasskeyInfo[]; enabled: boolean; max: number }>> {
  const { status, data } = await call("", "GET", undefined, true);
  return status === 200 ? { ok: true, status, data: data as never } : fail(status, data);
}

export async function passkeyEvents(): Promise<PasskeyResult<{ events: PasskeyEvent[] }>> {
  const { status, data } = await call("events/", "GET", undefined, true);
  return status === 200 ? { ok: true, status, data: data as never } : fail(status, data);
}

/** True when this browser supports WebAuthn *and* the server accepts passkeys for the address the user is on. */
export async function passkeysAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  const { status, data } = await call("config/", "GET");
  return status === 200 && !!data.enabled;
}

/** Add a passkey to the signed-in account. */
export async function registerPasskey(name: string, attachment?: PasskeyAttachment): Promise<PasskeyResult<PasskeyInfo>> {
  if (!isPasskeySupported()) return { ok: false, status: 0, failure: "unsupported" };
  const opts = await call("register/options/", "POST", {}, true);
  if (opts.status !== 200) return fail(opts.status, opts.data);
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.create({ publicKey: creationOptions(opts.data.options, attachment) })) as PublicKeyCredential | null;
  } catch (err) {
    return { ok: false, status: 0, failure: ceremonyFailure(err) };
  }
  if (!credential) return { ok: false, status: 0, failure: "cancelled" };
  const att = credential.response as AuthenticatorAttestationResponse;
  const done = await call(
    "register/verify/",
    "POST",
    {
      challenge_id: opts.data.challenge_id,
      name,
      credential: {
        id: credential.id,
        rawId: toB64url(credential.rawId),
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults(),
        response: {
          clientDataJSON: toB64url(att.clientDataJSON),
          attestationObject: toB64url(att.attestationObject),
          transports: typeof att.getTransports === "function" ? att.getTransports() : [],
        },
      },
    },
    true,
  );
  return done.status === 201 ? { ok: true, status: 201, data: done.data.passkey } : fail(done.status, done.data);
}

/**
 * Sign in with a passkey (discoverable: no email needed; the browser lists the user's passkeys for this site).
 * On success `data` is the server's login response: `{ tokens, user }`, or an account-verification payload (status 202).
 */
export async function signInWithPasskey(signal?: AbortSignal, mode: "device" | "any" = "any"): Promise<PasskeyResult<Json>> {
  if (!isPasskeySupported()) return { ok: false, status: 0, failure: "unsupported" };
  const opts = await call("login/options/", "POST", {});
  if (opts.status !== 200) return fail(opts.status, opts.data);
  let assertion: PublicKeyCredential | null;
  try {
    assertion = (await navigator.credentials.get({ publicKey: requestOptions(opts.data.options, mode), signal })) as PublicKeyCredential | null;
  } catch (err) {
    return { ok: false, status: 0, failure: ceremonyFailure(err) };
  }
  if (!assertion) return { ok: false, status: 0, failure: "cancelled" };
  const res = assertion.response as AuthenticatorAssertionResponse;
  const done = await call("login/verify/", "POST", {
    challenge_id: opts.data.challenge_id,
    credential: {
      id: assertion.id,
      rawId: toB64url(assertion.rawId),
      type: assertion.type,
      clientExtensionResults: assertion.getClientExtensionResults(),
      response: {
        clientDataJSON: toB64url(res.clientDataJSON),
        authenticatorData: toB64url(res.authenticatorData),
        signature: toB64url(res.signature),
        userHandle: toB64url(res.userHandle),
      },
    },
  });
  if (done.status === 200 || done.status === 202) return { ok: true, status: done.status, data: done.data };
  // A 403 can be the white-label membership refusal: the server's wording is passed through in `message`.
  return fail(done.status, done.data);
}

export async function renamePasskey(id: string, name: string): Promise<PasskeyResult<PasskeyInfo>> {
  const { status, data } = await call(`${id}/`, "PATCH", { name }, true);
  return status === 200 ? { ok: true, status, data: data.passkey } : fail(status, data);
}

export async function removePasskey(id: string, password: string): Promise<PasskeyResult> {
  const { status, data } = await call(`${id}/`, "DELETE", { password }, true);
  return status === 204 ? { ok: true, status } : fail(status, data);
}

// WhatsApp voice calls for the Team Inbox. This is the only place that touches the microphone and the WebRTC connection.
//
// The server is the source of truth: every ~2 seconds the browser asks "what is ringing, what is active, what am I?" (that request is also the
// heartbeat that makes an agent reachable). A call only shows as "Connected" when the server says it is active AND the browser's media connection
// really is connected, so the screen never claims two-way audio that is not there.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatures } from "@/hooks/useFeatures";
import { useToast } from "@/hooks/use-toast";
import { errorCode } from "@/services/teamInboxApi";
import { whatsappCallsApi, type Availability, type IceServer, type LiveSnapshot, type Readiness, type WaCall } from "@/services/whatsappCallsApi";

export type MediaState = "new" | "connecting" | "connected" | "disconnected" | "failed";
export interface CallSession {
  callId: string;
  direction: "in" | "out";
  name: string;
  phone: string;
  threadId: string | null;
  /** What we are doing right now (before the server confirms the call is live). */
  phase: "mic" | "claiming" | "connecting" | "ringing" | "active" | "ended";
  media: MediaState;
  muted: boolean;
  answeredAt: string | null;
  /** Plain-language result once the call is over. */
  outcome?: string;
  error?: string;
}

interface Ctx {
  /** WhatsApp Calling is switched on for this organization and the user is signed in. */
  enabled: boolean;
  live: LiveSnapshot | null;
  readiness: Readiness | null;
  readinessError: string;
  refreshReadiness: (force?: boolean) => Promise<void>;
  session: CallSession | null;
  micDevices: MediaDeviceInfo[];
  setAvailability: (state: Availability) => Promise<void>;
  answer: (call: WaCall) => Promise<void>;
  decline: (call: WaCall) => Promise<void>;
  callThread: (threadId: string, name: string, phone: string) => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => void;
  switchMic: (deviceId: string) => Promise<void>;
  dismiss: () => void;
}

const CallingContext = createContext<Ctx | null>(null);
export const useWhatsAppCalling = (): Ctx => {
  const ctx = useContext(CallingContext);
  if (!ctx) throw new Error("useWhatsAppCalling must be used inside WhatsAppCallingProvider");
  return ctx;
};

const POLL_VISIBLE = 2000;
const POLL_HIDDEN = 4000;
const ICE_WAIT_MS = 3000;

const waitForIce = (pc: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => {
      if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); resolve(); }
    };
    pc.addEventListener("icegatheringstatechange", done);
    window.setTimeout(resolve, ICE_WAIT_MS);
  });

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const outcomeText = (c: WaCall): string => {
  if (c.status === "completed") return `Call ended · ${clock(c.duration_seconds)}`;
  const map: Record<string, string> = {
    missed: c.direction === "in" ? "Missed call" : "No answer", rejected: c.direction === "in" ? "Call declined" : "The customer declined", failed: "Call failed", cancelled: "Call cancelled",
  };
  return `${map[c.status] || "Call ended"}${c.error && c.status === "failed" ? `: ${c.error}` : ""}`;
};

const micMessage = (e: unknown): string => {
  const name = (e as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "Microphone access is blocked. Allow the microphone for this site in your browser, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No microphone was found. Connect one and try again.";
  return "The microphone could not be started.";
};

export function WhatsAppCallingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { hasFeature, isLoading: featuresLoading } = useFeatures();
  const { toast } = useToast();
  const enabled = isAuthenticated && !featuresLoading && hasFeature("team_inbox") && hasFeature("whatsapp_calling");

  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessError, setReadinessError] = useState("");
  const [session, setSession] = useState<CallSession | null>(null);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  const sessionRef = useRef<CallSession | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iceRef = useRef<IceServer[]>([]);
  const clearTimer = useRef<number | null>(null);
  const seenRinging = useRef<Set<string>>(new Set());
  sessionRef.current = session;

  const patch = useCallback((p: Partial<CallSession>) => {
    setSession((s) => (s ? { ...s, ...p } : s));
    if (sessionRef.current) sessionRef.current = { ...sessionRef.current, ...p };
  }, []);

  /** Stop the microphone and the media connection. Safe to call twice. */
  const teardown = useCallback(() => {
    try { pcRef.current?.close(); } catch { /* already closed */ }
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) { audioRef.current.srcObject = null; }
  }, []);

  const finish = useCallback((outcome: string, error?: string) => {
    teardown();
    patch({ phase: "ended", media: "new", outcome, error });
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => { setSession(null); sessionRef.current = null; }, 6000);
  }, [patch, teardown]);

  const dismiss = useCallback(() => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    if (sessionRef.current?.phase === "ended") { setSession(null); sessionRef.current = null; }
  }, []);

  // ------------------------------------------------------------------------------------------------------------------ the media connection
  const newConnection = useCallback((iceServers: IceServer[]) => {
    const pc = new RTCPeerConnection({ iceServers: iceServers.length ? iceServers : [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    iceRef.current = iceServers;
    if (!audioRef.current) { const a = new Audio(); a.autoplay = true; audioRef.current = a; }
    pc.ontrack = (e) => {
      if (audioRef.current) { audioRef.current.srcObject = e.streams[0] ?? new MediaStream([e.track]); void audioRef.current.play().catch(() => { /* needs a click: the Answer click already counts */ }); }
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as MediaState;
      if (pcRef.current !== pc) return;
      patch({ media: state === "closed" ? "new" : state });
    };
    return pc;
  }, [patch]);

  const startMic = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("no-media"), { name: "NotFoundError" });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true });
    streamRef.current = stream;
    try { setMicDevices((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput")); } catch { /* the list is optional */ }
    return stream;
  }, []);

  // ----------------------------------------------------------------------------------------------------------------------------- polling
  const apply = useCallback(async (snap: LiveSnapshot) => {
    setLive(snap);
    const s = sessionRef.current;
    if (!s || !s.callId || s.phase === "ended" || s.phase === "mic" || s.phase === "claiming") return;
    const mine = snap.active.find((c) => c.id === s.callId);
    if (!mine) {
      // The server says the call is over (the customer hung up, or it ended another way): show the real outcome.
      const res = await whatsappCallsApi.detail(s.callId);
      finish(res.success && res.data ? outcomeText(res.data.call) : "Call ended");
      return;
    }
    if (mine.status === "active" && s.phase !== "active") patch({ phase: "active", answeredAt: mine.answered_at });
    if (s.direction === "out" && mine.sdp_answer && pcRef.current && !pcRef.current.remoteDescription) {
      try { await pcRef.current.setRemoteDescription({ type: "answer", sdp: mine.sdp_answer }); patch({ phase: s.phase === "connecting" ? "ringing" : s.phase }); } catch { finish("Call failed", "The connection details from WhatsApp could not be used."); }
    }
  }, [finish, patch]);

  useEffect(() => {
    if (!enabled) { setLive(null); return; }
    let stopped = false;
    let timer: number | undefined;
    let failures = 0;
    const tick = async () => {
      const res = await whatsappCallsApi.live();
      if (stopped) return;
      if (res.success && res.data) { failures = 0; await apply(res.data); } else { failures = Math.min(failures + 1, 5); }
      timer = window.setTimeout(tick, failures ? Math.min(15000, 2000 * 2 ** failures) : document.hidden ? POLL_HIDDEN : POLL_VISIBLE);
    };
    void tick();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, [enabled, apply]);

  const refreshReadiness = useCallback(async (force = false) => {
    const res = await whatsappCallsApi.readiness(force);
    if (res.success && res.data) { setReadiness(res.data); setReadinessError(""); } else setReadinessError(res.message || "Could not check this number.");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refreshReadiness(false);
    const h = window.setInterval(() => void refreshReadiness(false), 5 * 60 * 1000);
    return () => window.clearInterval(h);
  }, [enabled, refreshReadiness]);

  // ------------------------------------------------------------------------------------------------------------------------------ ringtone
  const ringing = live?.ringing ?? [];
  const shouldRing = enabled && ringing.length > 0 && live?.me.effective === "available" && !session;
  useEffect(() => {
    if (!shouldRing) return;
    let ctx: AudioContext | null = null;
    let timer: number | undefined;
    const beep = () => {
      try {
        ctx = ctx ?? new AudioContext();
        void ctx.resume();
        const gain = ctx.createGain();
        gain.gain.value = 0.12;
        gain.connect(ctx.destination);
        [440, 480].forEach((f) => { const o = ctx!.createOscillator(); o.frequency.value = f; o.connect(gain); o.start(); o.stop(ctx!.currentTime + 0.9); });
      } catch { /* the browser blocks sound until the page has been clicked: the visual alert still shows */ }
    };
    beep();
    timer = window.setInterval(beep, 2000);
    return () => { if (timer) window.clearInterval(timer); void ctx?.close().catch(() => undefined); };
  }, [shouldRing]);

  // a desktop notification when a call rings while this tab is in the background
  useEffect(() => {
    ringing.forEach((c) => {
      if (seenRinging.current.has(c.id)) return;
      seenRinging.current.add(c.id);
      if (document.hidden && live?.me.effective === "available" && "Notification" in window && Notification.permission === "granted") {
        try { new Notification("Incoming WhatsApp call", { body: c.customer_name || `+${c.customer_phone}`, tag: c.id, requireInteraction: true }); } catch { /* optional */ }
      }
    });
  }, [ringing, live?.me.effective]);

  // ------------------------------------------------------------------------------------------------------------------------------ actions
  const setAvailability = useCallback(async (state: Availability) => {
    if (state === "available" && "Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    const res = await whatsappCallsApi.live(state);
    if (res.success && res.data) setLive(res.data); else toast({ title: "Could not change availability", description: res.message, variant: "destructive" });
  }, [toast]);

  const answer = useCallback(async (call: WaCall) => {
    if (sessionRef.current && sessionRef.current.phase !== "ended") return;
    const base: CallSession = { callId: call.id, direction: "in", name: call.customer_name, phone: call.customer_phone, threadId: call.thread_id, phase: "mic", media: "new", muted: false, answeredAt: null };
    setSession(base); sessionRef.current = base;
    try {
      await startMic(); // ask for the microphone BEFORE taking the call, so a blocked microphone never leaves a call held
    } catch (e) { finish("Call not answered", micMessage(e)); return; }
    patch({ phase: "claiming" });
    const claimed = await whatsappCallsApi.claim(call.id);
    if (!claimed.success || !claimed.data) {
      const code = errorCode(claimed);
      finish(code === "already_taken" ? "A teammate already took this call" : code === "call_over" ? "This call has already ended" : "Could not take the call", claimed.message);
      return;
    }
    try {
      patch({ phase: "connecting" });
      const pc = newConnection(claimed.data.ice_servers);
      streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
      await pc.setRemoteDescription({ type: "offer", sdp: claimed.data.call.sdp_offer || "" });
      await pc.setLocalDescription(await pc.createAnswer());
      await waitForIce(pc);
      const accepted = await whatsappCallsApi.accept(call.id, pc.localDescription?.sdp || "");
      if (!accepted.success) { finish("Call could not connect", accepted.message); return; }
      patch({ phase: "active", answeredAt: accepted.data?.call.answered_at ?? new Date().toISOString() });
    } catch (e) {
      // we took the call but could not connect it: hang up so it is not left half-open
      void whatsappCallsApi.end(call.id);
      finish("Call could not connect", e instanceof Error ? e.message : undefined);
    }
  }, [finish, newConnection, patch, startMic]);

  const decline = useCallback(async (call: WaCall) => {
    const res = await whatsappCallsApi.reject(call.id);
    if (!res.success) toast({ title: "Could not decline the call", description: res.message, variant: "destructive" });
  }, [toast]);

  const callThread = useCallback(async (threadId: string, name: string, phone: string) => {
    if (sessionRef.current && sessionRef.current.phase !== "ended") { toast({ title: "You are already on a call." }); return; }
    const base: CallSession = { callId: "", direction: "out", name, phone, threadId, phase: "mic", media: "new", muted: false, answeredAt: null };
    setSession(base); sessionRef.current = base;
    try { await startMic(); } catch (e) { finish("Call not started", micMessage(e)); return; }
    try {
      patch({ phase: "connecting" });
      const pc = newConnection(live?.ice_servers ?? []);
      streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
      await pc.setLocalDescription(await pc.createOffer());
      await waitForIce(pc);
      const res = await whatsappCallsApi.place(threadId, pc.localDescription?.sdp || "");
      if (!res.success || !res.data) {
        finish(errorCode(res) === "permission_required" ? "This customer has not allowed calls yet" : "Call could not start", res.message);
        return;
      }
      patch({ callId: res.data.call.id, phase: "ringing" });
      if (res.data.call.sdp_answer && !pc.remoteDescription) await pc.setRemoteDescription({ type: "answer", sdp: res.data.call.sdp_answer });
    } catch (e) {
      finish("Call could not start", e instanceof Error ? e.message : undefined);
    }
  }, [finish, live?.ice_servers, newConnection, patch, startMic, toast]);

  const hangUp = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    if (s.phase === "ended") { dismiss(); return; }
    if (s.callId) {
      const res = await whatsappCallsApi.end(s.callId);
      finish(res.success && res.data ? outcomeText(res.data.call) : "Call ended");
    } else { finish("Call cancelled"); }
  }, [dismiss, finish]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !sessionRef.current?.muted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    patch({ muted: next });
  }, [patch]);

  const switchMic = useCallback(async (deviceId: string) => {
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      const track = fresh.getAudioTracks()[0];
      const sender = pcRef.current?.getSenders().find((x) => x.track?.kind === "audio");
      await sender?.replaceTrack(track);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      track.enabled = !sessionRef.current?.muted;
      streamRef.current = fresh;
    } catch (e) { toast({ title: "Could not switch microphone", description: micMessage(e), variant: "destructive" }); }
  }, [toast]);

  // leaving the page or signing out must never leave the microphone open
  useEffect(() => () => { teardown(); if (clearTimer.current) window.clearTimeout(clearTimer.current); }, [teardown]);
  useEffect(() => { if (!enabled && sessionRef.current) { teardown(); setSession(null); } }, [enabled, teardown]);

  const value = useMemo<Ctx>(() => ({
    enabled, live, readiness, readinessError, refreshReadiness, session, micDevices, setAvailability, answer, decline, callThread, hangUp, toggleMute, switchMic, dismiss,
  }), [enabled, live, readiness, readinessError, refreshReadiness, session, micDevices, setAvailability, answer, decline, callThread, hangUp, toggleMute, switchMic, dismiss]);

  return <CallingContext.Provider value={value}>{children}</CallingContext.Provider>;
}

/** Seconds since the call was answered, ticking once a second. */
export function useCallClock(answeredAt: string | null, running: boolean): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running || !answeredAt) return;
    const h = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, [answeredAt, running]);
  return answeredAt ? Math.max(0, Math.floor((now - new Date(answeredAt).getTime()) / 1000)) : 0;
}
export { clock as formatClock };

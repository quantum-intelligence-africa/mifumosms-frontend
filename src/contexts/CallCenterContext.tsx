// The call center, as seen by one logged-in person.
//
// Mounted once above the router so a ringing call interrupts whatever page the
// agent is on, and an active call survives navigation (same reasoning as
// DialerContext). It owns:
//   * the real-time socket (presence heartbeat, incoming-call events);
//   * the agent's own profile/status — only if they have an agent profile;
//   * the browser softphone — only for agents who answer in the browser;
//   * the incoming / active / wrap-up call state.
//
// Two signals describe an incoming call and they arrive independently:
//   - the softphone SDK's "incomingcall" (the audio is ringing in this tab);
//   - the socket's "incoming_call" (who is calling, with customer context).
// Either can arrive first, so both merge into one `incoming` object. A handset
// agent only ever gets the socket one — their phone does the ringing.
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import Africastalking, { type Client as AtClient } from "africastalking-client";
import { useAuth } from "@/contexts/AuthContext";
import { canUseCallCenter } from "@/utils/roleUtils";
import { CallCenterSocket, type CallCenterEvent, type SocketState } from "@/services/callCenterSocket";
import {
  callCenterApi, type AgentStatus, type CallerContext, type TeamCounts, type Workspace,
} from "@/services/callCenterApi";
import { voiceApi } from "@/services/voiceApi";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

// Same window event the dialer fires, so call lists refresh on either.
import { CALL_ENDED_EVENT } from "@/contexts/DialerContext";

export interface IncomingCall {
  callId: string | null;
  fromNumber: string;
  teamName: string;
  caller: CallerContext | null;
  /** The browser audio is ringing (the agent can answer here). */
  ringing: boolean;
  audioMode: "browser" | "handset";
  /** Set when this call was handed over by another agent. */
  transferredFrom?: string;
  transferNote?: string;
}

export interface ActiveCall {
  callId: string | null;
  number: string;
  name: string;
  startedAt: number;
  direction: "inbound" | "outbound";
  muted: boolean;
  held: boolean;
}

export interface WrapUp {
  callId: string;
  number: string;
  name: string;
}

export type SoftphoneState = "off" | "connecting" | "ready" | "error";

/** A transfer this agent has started on the call they are on. */
export interface ActiveTransfer {
  id: string;
  callId: string;
  kind: "blind" | "warm" | "confirm";
  /** asking: waiting for the target to say yes · transferring: target is ringing ·
   *  connected: target answered · */
  stage: "asking" | "transferring" | "connected";
  targetName: string;
  /** In a three-way call: the agent, the caller and the target are all on the line. */
  conference: boolean;
}

interface CallCenterContextValue {
  /** The user may use the call center at all. */
  enabled: boolean;
  /** Has an agent profile in their organization (can take calls). */
  isAgent: boolean;
  /** The first agent-profile lookup has finished (so pages can pick the right home screen). */
  workspaceReady: boolean;
  workspace: Workspace | null;
  refreshWorkspace: () => Promise<void>;
  socketState: SocketState;
  softphone: SoftphoneState;
  softphoneNote: string;
  status: AgentStatus;
  setStatus: (status: AgentStatus) => Promise<string | null>;
  incoming: IncomingCall | null;
  active: ActiveCall | null;
  transfer: ActiveTransfer | null;
  wrapUp: WrapUp | null;
  /** Leave the call for good, handing the caller over (or, in a three-way call, leaving the other two talking). */
  transferComplete: () => void;
  /** Drop the target and go back to the caller. */
  transferCancel: () => void;
  answer: () => void;
  decline: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDtmf: (digit: string) => void;
  placeCall: (number: string) => string | null;
  dismissWrapUp: () => void;
  /** Subscribe to every socket event (the supervisor board uses this). Returns an unsubscribe. */
  subscribe: (listener: (e: CallCenterEvent) => void) => () => void;
}

const CallCenterContext = createContext<CallCenterContextValue | undefined>(undefined);

// ── ringtone ────────────────────────────────────────────────────────────────
// Generated, so there is no audio asset to ship. Browsers may refuse to start
// audio before the page has had a user gesture; an agent who has logged in and
// clicked "Available" has had one, and a refusal is silently fine — the modal
// and the SDK's own ringing still work.
function startRingtone(): () => void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return () => undefined;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 440;
    osc.connect(gain);
    osc.start();
    // 0.4 s on / 0.2 s off / 0.4 s on / 2 s off, repeating.
    const pattern = () => {
      const t = ctx.currentTime;
      [0, 0.6].forEach((offset) => {
        gain.gain.setValueAtTime(0.15, t + offset);
        gain.gain.setValueAtTime(0, t + offset + 0.4);
      });
    };
    pattern();
    const timer = setInterval(pattern, 3000);
    return () => {
      clearInterval(timer);
      try {
        osc.stop();
        void ctx.close();
      } catch {
        /* already closed */
      }
    };
  } catch {
    return () => undefined;
  }
}

const INCOMING_SAFETY_MS = 90_000; // never leave a stale "ringing" card on screen

interface VoiceAccountOption {
  id: string;
  phone_number: string;
  is_active: boolean;
  provider_credential: string | null;
}

export function CallCenterProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const enabled = isAuthenticated && canUseCallCenter(user) && !user?.must_change_password;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isAgent, setIsAgent] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [softphone, setSoftphone] = useState<SoftphoneState>("off");
  const [softphoneNote, setSoftphoneNote] = useState("");
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [transfer, setTransfer] = useState<ActiveTransfer | null>(null);
  const [wrapUp, setWrapUp] = useState<WrapUp | null>(null);

  const socketRef = useRef<CallCenterSocket | null>(null);
  const clientRef = useRef<AtClient | null>(null);
  const listenersRef = useRef(new Set<(e: CallCenterEvent) => void>());
  // The call we are, or were last, talking on — needed to open the wrap-up form
  // when the SDK reports the hangup (which carries no call id of its own).
  const lastCallRef = useRef<{ callId: string | null; number: string; name: string } | null>(null);
  const activeRef = useRef<ActiveCall | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);
  const transferRef = useRef<ActiveTransfer | null>(null);
  // A transfer event can arrive twice (agent channel + board channel); act once.
  const handledTransfers = useRef(new Set<string>());
  // The number typed into the workspace dial pad, until the SDK confirms the call.
  const pendingDialRef = useRef("");
  activeRef.current = active;
  incomingRef.current = incoming;
  workspaceRef.current = workspace;
  transferRef.current = transfer;

  // ── workspace ───────────────────────────────────────────────────────────
  const refreshWorkspace = useCallback(async () => {
    const res = await callCenterApi.me.workspace();
    if (res.success && res.data) {
      setWorkspace(res.data);
      setIsAgent(true);
    } else if (res.status === 404) {
      setWorkspace(null);
      setIsAgent(false); // a supervisor/admin with no agent profile of their own
    }
    // Any other failure (voice service unreachable, offline) leaves state as
    // it was: the call center is an add-on and must never break the app.
    setWorkspaceReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setWorkspace(null);
      setIsAgent(false);
      setWorkspaceReady(false);
      return;
    }
    void refreshWorkspace();
  }, [enabled, refreshWorkspace]);

  // ── socket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const socket = new CallCenterSocket();
    socketRef.current = socket;
    const offState = socket.onState(setSocketState);
    const offEvent = socket.onEvent((evt) => {
      handleEventRef.current(evt);
      listenersRef.current.forEach((l) => l(evt));
    });
    socket.start();
    return () => {
      offState();
      offEvent();
      socket.stop();
      socketRef.current = null;
    };
  }, [enabled]);

  // The socket outlives renders, so it calls the *latest* handler (which uses the
  // current language for its messages) through a ref instead of capturing one.
  const handleEventRef = useRef<(evt: CallCenterEvent) => void>(() => undefined);

  const handleEvent = (evt: CallCenterEvent) => {
    const d = evt.data as Record<string, unknown>;
    switch (evt.event) {
      case "incoming_call": {
        const team = d.team as { name?: string } | undefined;
        setIncoming((prev) => ({
          callId: String(d.call_id ?? ""),
          fromNumber: String(d.from_number ?? ""),
          teamName: team?.name ?? "",
          caller: (d.caller as CallerContext) ?? null,
          ringing: prev?.ringing ?? false,
          audioMode: (d.audio_mode as "browser" | "handset") ?? "handset",
          transferredFrom: d.transferred_from ? String(d.transferred_from) : undefined,
          transferNote: d.transfer_note ? String(d.transfer_note) : undefined,
        }));
        lastCallRef.current = {
          callId: String(d.call_id ?? ""),
          number: String(d.from_number ?? ""),
          name: ((d.caller as CallerContext | undefined)?.name) || "",
        };
        break;
      }
      case "call_ended": {
        const id = String(d.call_id ?? "");
        // The caller hung up, or somebody else took it, before we answered.
        if (incomingRef.current && incomingRef.current.callId === id && !activeRef.current) setIncoming(null);
        window.dispatchEvent(new CustomEvent(CALL_ENDED_EVENT));
        break;
      }
      case "my_status": {
        const status = String(d.status ?? "") as AgentStatus;
        setWorkspace((w) => (w ? { ...w, agent: { ...w.agent, status } } : w));
        // A handset agent answers on their phone, so their only signal that the
        // call is over is moving to after-call work: open the notes form then.
        if (status === "acw" && !activeRef.current && lastCallRef.current?.callId) {
          const last = lastCallRef.current;
          setIncoming(null);
          setWrapUp({ callId: last.callId as string, number: last.number, name: last.name });
        }
        break;
      }
      case "transfer_ringing":
      case "transfer_started":
      case "transfer_connected": {
        const mine = workspaceRef.current?.agent.id;
        const key = `${d.id}:${evt.event}`;
        if (!mine || d.from_agent_id !== mine || handledTransfers.current.has(key)) break;
        handledTransfers.current.add(key);
        const stage = evt.event === "transfer_ringing" ? "asking" : evt.event === "transfer_started" ? "transferring" : "connected";
        const kind = d.kind as ActiveTransfer["kind"];
        setTransfer((prev) => ({
          id: String(d.id), callId: String(d.call), kind, stage,
          targetName: String(d.to_agent || d.to_team || ""), conference: prev?.id === d.id ? prev.conference : false,
        }));
        // The target answered. The agent's softphone does the keypad part so they don't have to:
        // `*` hands the caller over, `0` makes it a three-way call so they can talk first.
        // (An agent on a handset is told to press the same keys on their phone.)
        if (stage === "connected" && clientRef.current) {
          if (d.auto_action === "conference") {
            clientRef.current.dtmf("0");
            setTransfer((prev) => (prev ? { ...prev, conference: true } : prev));
          } else {
            clientRef.current.dtmf("*");
          }
        }
        break;
      }
      case "transfer_completed":
      case "transfer_declined":
      case "transfer_failed": {
        const mine = workspaceRef.current?.agent.id;
        const key = `${d.id}:${evt.event}`;
        // Only the agent who handed the call over cares; supervisors see it on the board.
        if (!mine || d.from_agent_id !== mine || handledTransfers.current.has(key)) break;
        handledTransfers.current.add(key);
        setTransfer(null);
        const target = String(d.to_agent || d.to_team || "");
        if (evt.event === "transfer_completed") {
          toast({ title: t("cc.transfer.completed_toast", { name: target }) });
          // The provider ends this agent's leg; if the SDK never reports it, release the call ourselves.
          setTimeout(() => {
            if (activeRef.current?.callId === d.call) clientRef.current?.hangup();
          }, 4000);
        } else if (evt.event === "transfer_declined") {
          toast({ title: t("cc.transfer.declined_toast", { name: target }), description: t("cc.transfer.declined_desc"), variant: "destructive" });
        } else {
          toast({ title: t("cc.transfer.failed_toast"), description: String(d.error || ""), variant: "destructive" });
        }
        break;
      }
      case "team_counts": {
        const counts = d as unknown as TeamCounts;
        setWorkspace((w) =>
          w ? { ...w, teams: w.teams.map((t) => (t.team_id === counts.team_id ? { ...t, ...counts } : t)) } : w,
        );
        break;
      }
      default:
        break;
    }
  };

  handleEventRef.current = handleEvent;

  // ── ringtone while an incoming call is unanswered ───────────────────────
  useEffect(() => {
    if (!incoming) return;
    const stopTone = incoming.ringing || incoming.audioMode === "handset" ? startRingtone() : () => undefined;
    const safety = setTimeout(() => setIncoming(null), INCOMING_SAFETY_MS);
    return () => {
      stopTone();
      clearTimeout(safety);
    };
  }, [incoming?.callId, incoming?.ringing, incoming?.audioMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── browser softphone ───────────────────────────────────────────────────
  const browserMode = isAgent && workspace?.agent.audio_mode === "browser";
  useEffect(() => {
    if (!enabled || !browserMode) {
      setSoftphone("off");
      return;
    }
    let cancelled = false;
    setSoftphone("connecting");
    setSoftphoneNote("");
    (async () => {
      const accounts = await voiceApi.get<VoiceAccountOption[]>("/voice/accounts/");
      const account = accounts.data?.find((a) => a.is_active && a.provider_credential && a.phone_number);
      if (cancelled) return;
      if (!account) {
        setSoftphone("error");
        setSoftphoneNote("no_number");
        return;
      }
      const token = await voiceApi.post<{ token: string }>(`/voice/accounts/${account.id}/webrtc-token/`);
      if (cancelled) return;
      if (!token.success || !token.data) {
        setSoftphone("error");
        setSoftphoneNote(token.error || "token_failed");
        return;
      }
      const client = new Africastalking.Client(token.data.token);
      clientRef.current = client;
      client.on("ready", () => !cancelled && setSoftphone("ready"));
      client.on("notready", () => {
        if (cancelled) return;
        setSoftphone("error");
        setSoftphoneNote("not_ready");
      });
      client.on("offline", () => {
        if (cancelled) return;
        setSoftphone("error");
        setSoftphoneNote("offline");
      });
      client.on("closed", () => {
        if (cancelled) return;
        setSoftphone((s) => (s === "ready" ? "error" : s));
        setSoftphoneNote("closed");
      });
      client.on("incomingcall", () => {
        if (cancelled) return;
        setIncoming((prev) =>
          prev
            ? { ...prev, ringing: true }
            : { callId: null, fromNumber: "", teamName: "", caller: null, ringing: true, audioMode: "browser" },
        );
      });
      client.on("callaccepted", () => {
        if (cancelled) return;
        const inc = incomingRef.current;
        const last = lastCallRef.current;
        setActive({
          callId: inc?.callId || last?.callId || null,
          number: inc?.fromNumber || last?.number || pendingDialRef.current || "",
          name: inc?.caller?.name || last?.name || "",
          startedAt: Date.now(),
          direction: inc ? "inbound" : "outbound",
          muted: false,
          held: false,
        });
        setIncoming(null);
      });
      client.on("hangup", () => {
        if (cancelled) return;
        const was = activeRef.current;
        setActive(null);
        setTransfer(null);
        setIncoming(null);
        pendingDialRef.current = "";
        window.dispatchEvent(new CustomEvent(CALL_ENDED_EVENT));
        const last = lastCallRef.current;
        const callId = was?.callId || last?.callId;
        if (was && callId) setWrapUp({ callId, number: was.number, name: was.name });
        void refreshWorkspace();
      });
    })();
    return () => {
      cancelled = true;
      try {
        clientRef.current?.hangup();
      } catch {
        /* nothing to hang up */
      }
      clientRef.current = null;
      setSoftphone("off");
    };
  }, [enabled, browserMode, refreshWorkspace]);

  const sendDtmfKey = (digit: string) => {
    try {
      clientRef.current?.dtmf(digit);
    } catch {
      /* not in a call */
    }
  };

  // ── actions ─────────────────────────────────────────────────────────────
  const answer = useCallback(() => {
    try {
      clientRef.current?.answer();
    } catch (e) {
      console.error("answer() failed", e);
    }
  }, []);

  const decline = useCallback(() => {
    try {
      clientRef.current?.hangup(); // on an unanswered incoming call this rejects it
    } catch {
      /* already gone */
    }
    setIncoming(null);
  }, []);

  const hangup = useCallback(() => {
    try {
      clientRef.current?.hangup();
    } catch (e) {
      console.error("hangup() failed", e);
    }
    // The SDK sometimes never confirms a hangup (seen in production, see
    // PlaceCallDialog) — release our side ourselves if its event doesn't come.
    setTimeout(() => {
      if (activeRef.current) {
        const was = activeRef.current;
        setActive(null);
        const callId = was.callId || lastCallRef.current?.callId;
        if (callId) setWrapUp({ callId, number: was.number, name: was.name });
      }
    }, 4000);
  }, []);

  const transferComplete = useCallback(() => {
    const current = transferRef.current;
    if (!current) return;
    if (current.conference) hangup();
    else sendDtmfKey("*");
  }, [hangup]);

  const transferCancel = useCallback(() => sendDtmfKey("#"), []);

  const toggleMute = useCallback(() => {
    const client = clientRef.current;
    const current = activeRef.current;
    if (!client || !current) return;
    if (current.muted) client.unmuteAudio();
    else client.muteAudio();
    setActive({ ...current, muted: !current.muted });
  }, []);

  const toggleHold = useCallback(() => {
    const client = clientRef.current;
    const current = activeRef.current;
    if (!client || !current) return;
    if (current.held) client.unhold();
    else client.hold();
    setActive({ ...current, held: !current.held });
  }, []);

  const sendDtmf = useCallback((digit: string) => sendDtmfKey(digit), []);

  const placeCall = useCallback((number: string): string | null => {
    const client = clientRef.current;
    if (!client) return "softphone_unavailable";
    if (activeRef.current) return "already_in_call";
    try {
      pendingDialRef.current = number;
      client.call(number);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, []);

  const setStatus = useCallback(
    async (status: AgentStatus): Promise<string | null> => {
      const res = await callCenterApi.me.setStatus(status);
      if (!res.success) return res.error || "Could not change status";
      setWorkspace((w) => (w ? { ...w, agent: { ...w.agent, status } } : w));
      return null;
    },
    [],
  );

  const dismissWrapUp = useCallback(() => {
    setWrapUp(null);
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const subscribe = useCallback((listener: (e: CallCenterEvent) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo<CallCenterContextValue>(
    () => ({
      enabled,
      isAgent,
      workspaceReady,
      workspace,
      refreshWorkspace,
      socketState,
      softphone,
      softphoneNote,
      status: workspace?.agent.status ?? "offline",
      setStatus,
      incoming,
      active,
      transfer,
      transferComplete,
      transferCancel,
      wrapUp,
      answer,
      decline,
      hangup,
      toggleMute,
      toggleHold,
      sendDtmf,
      placeCall,
      dismissWrapUp,
      subscribe,
    }),
    [
      enabled, isAgent, workspaceReady, workspace, refreshWorkspace, socketState, softphone, softphoneNote, setStatus,
      incoming, active, transfer, transferComplete, transferCancel, wrapUp, answer, decline, hangup, toggleMute, toggleHold,
      sendDtmf, placeCall,
      dismissWrapUp, subscribe,
    ],
  );

  return <CallCenterContext.Provider value={value}>{children}</CallCenterContext.Provider>;
}

export function useCallCenter(): CallCenterContextValue {
  const ctx = useContext(CallCenterContext);
  if (!ctx) throw new Error("useCallCenter must be used within CallCenterProvider");
  return ctx;
}

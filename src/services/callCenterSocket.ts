// WebSocket client for the call center (senda_voice_backend `voice/cc_consumers.py`).
//
// Protocol: the first frame must be {type:"auth", token}; the token never goes
// in the URL (URLs end up in logs). The server answers {type:"ready"}, then
// pushes {type:"event", event, data}. We ping every 20 s, which is also the
// agent's presence heartbeat — stop pinging and the server marks them offline.
//
// Close codes from the server:
//   4401  token invalid/expired  -> refresh the token and reconnect
//   4403  not allowed / revoked  -> stop for good (account disabled, no access)
// Anything else is a network blip: reconnect with exponential backoff.
import { apiClient } from "@/lib/api";

export type SocketState = "idle" | "connecting" | "ready" | "reconnecting" | "revoked";

export interface CallCenterEvent {
  event: string;
  // The payload is validated by whoever handles the event; the socket is transport only.
  data: Record<string, unknown>;
}

type EventListener = (e: CallCenterEvent) => void;
type StateListener = (state: SocketState) => void;

const PING_MS = 20_000;
const BACKOFF_START_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

export function callCenterSocketUrl(): string {
  if (import.meta.env.DEV) {
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${window.location.host}/voice-ws/call-center/`;
  }
  return "wss://voice-app.duckdns.org/ws/call-center/";
}

export class CallCenterSocket {
  private ws: WebSocket | null = null;
  private state: SocketState = "idle";
  private stopped = true;
  private backoff = BACKOFF_START_MS;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private eventListeners = new Set<EventListener>();
  private stateListeners = new Set<StateListener>();

  constructor(private readonly url: string = callCenterSocketUrl()) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.backoff = BACKOFF_START_MS;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    this.setState("idle");
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  getState(): SocketState {
    return this.state;
  }

  private setState(next: SocketState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach((l) => l(next));
  }

  private clearTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.pingTimer = null;
    this.reconnectTimer = null;
  }

  private open(): void {
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Logged out: nothing to connect with, and nothing to retry until login.
      this.stopped = true;
      this.setState("idle");
      return;
    }
    this.setState(this.state === "idle" ? "connecting" : "reconnecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));

    ws.onmessage = (msg) => {
      let frame: { type?: string; event?: string; data?: Record<string, unknown> };
      try {
        frame = JSON.parse(String(msg.data));
      } catch {
        return; // not ours; ignore rather than crash the connection
      }
      if (frame.type === "ready") {
        this.backoff = BACKOFF_START_MS;
        this.setState("ready");
        this.startPing();
      } else if (frame.type === "event" && frame.event) {
        const evt: CallCenterEvent = { event: frame.event, data: frame.data ?? {} };
        this.eventListeners.forEach((l) => l(evt));
      }
    };

    ws.onclose = (closeEvent) => {
      this.clearTimers();
      if (this.ws === ws) this.ws = null;
      if (this.stopped) return;
      if (closeEvent.code === 4403) {
        // Disabled / no longer allowed. Reconnecting would just be refused.
        this.stopped = true;
        this.setState("revoked");
        return;
      }
      if (closeEvent.code === 4401) {
        void this.refreshThenReconnect();
        return;
      }
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      // The browser follows an error with a close event; reconnect logic lives there.
    };
  }

  private startPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "ping" }));
    }, PING_MS);
  }

  private async refreshThenReconnect(): Promise<void> {
    this.setState("reconnecting");
    const refreshed = await apiClient.refreshTokenFromStorage();
    if (this.stopped) return;
    if (refreshed.success) {
      this.backoff = BACKOFF_START_MS;
      this.open();
    } else {
      // Session is really over (the API client will have signalled logout).
      this.stop();
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.setState("reconnecting");
    const delay = this.backoff;
    this.backoff = Math.min(this.backoff * 2, BACKOFF_MAX_MS);
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }
}

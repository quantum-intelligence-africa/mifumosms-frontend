// "Piga simu" — call a customer from inside the app, on the business's own
// number, and talk through the browser.
//
// Two ways to carry the agent's voice, chosen with the toggle at the top:
//
//  - Kivinjari (default): the browser becomes a softphone. We fetch a
//    short-lived capability token from the backend, hand it to Africa's
//    Talking's client SDK, and `client.call(number)` rings the customer from
//    the business number. AT then asks our webhook what to do and is told to
//    bridge and record. Needs a microphone.
//  - Simu yangu: no microphone — the backend rings a handset the agent names
//    (their profile phone by default) and, once they answer, bridges the
//    customer in. Same recording, same caller ID.
//
// Either way the customer sees the business number, and the conversation is
// recorded unless the box is unticked.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Africastalking, { type Client as AtClient, type HangupCause } from "africastalking-client";
import {
  Delete, Loader2, Phone, PhoneCall, PhoneIncoming, PhoneOff, CheckCircle2, AlertCircle, Mic, MicOff, Monitor, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { voiceApi } from "@/services/voiceApi";

interface VoiceAccountOption {
  id: string;
  display_name: string;
  phone_number: string;
  provider: string;
  is_active: boolean;
  provider_credential: string | null;
}

interface PlacedCall {
  id: string;
  status: string;
  provider_status: string;
  to_number: string;
  agent_number: string;
  duration_seconds: number | null;
}

interface WebRtcToken {
  token: string;
  identity: string;
  phone_number: string;
  lifetime_seconds: number;
}

interface PlaceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The logged-in user's own phone — the handset used in "Simu yangu" mode. */
  defaultAgentNumber?: string;
  /** A number to start with (e.g. opened from a contact or a call row). */
  initialNumber?: string;
  /** Called whenever a call ends, so the page behind can refresh its list. */
  onCallEnded?: () => void;
}

type Mode = "browser" | "phone";
type BrowserState = "idle" | "connecting" | "ready" | "calling" | "in_call" | "ended" | "error";

const KEYS: Array<[string, string]> = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", ""], ["#", ""],
];

const POLL_MS = 3000;

function normalise(raw: string, reference = "+255"): string {
  // "0712…" and "712…" both mean +255712… on a Tanzanian line; anything already
  // international is kept. The account's own number supplies the country code.
  const country = reference.startsWith("+") ? reference.slice(1, 4) : "255";
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) return "+" + country + digits.slice(1);
  if (digits.startsWith(country)) return "+" + digits;
  return "+" + country + digits;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function phoneStatusLine(call: PlacedCall | null): { icon: typeof Phone; text: string; tone: string } | null {
  if (!call) return null;
  if (call.status === "ringing") return { icon: PhoneIncoming, text: "Simu yako inaita — pokea, kisha tutamuunganisha mteja.", tone: "text-amber-600" };
  if (call.status === "in_progress") return { icon: PhoneCall, text: `Umepokea. Tunampigia mteja ${call.to_number}… mazungumzo yanarekodiwa.`, tone: "text-green-600" };
  if (call.status === "completed") {
    const mins = call.duration_seconds != null ? ` (${formatDuration(call.duration_seconds)})` : "";
    return { icon: CheckCircle2, text: `Simu imemalizika${mins}. Rekodi itaonekana kwenye Recordings.`, tone: "text-muted-foreground" };
  }
  return { icon: AlertCircle, text: `Simu haikufanikiwa${call.provider_status ? ` (${call.provider_status})` : ""}.`, tone: "text-destructive" };
}

export function PlaceCallDialog({ open, onOpenChange, defaultAgentNumber = "", initialNumber = "", onCallEnded }: PlaceCallDialogProps) {
  const [accounts, setAccounts] = useState<VoiceAccountOption[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("browser");
  const [number, setNumber] = useState("");
  const [agentNumber, setAgentNumber] = useState(defaultAgentNumber);
  const [record, setRecord] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- phone-bridge mode
  const [isPlacing, setIsPlacing] = useState(false);
  const [call, setCall] = useState<PlacedCall | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- browser mode
  const clientRef = useRef<AtClient | null>(null);
  const [browserState, setBrowserState] = useState<BrowserState>("idle");
  const [browserNote, setBrowserNote] = useState<string>("");
  const [muted, setMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Africa's Talking's SDK sometimes never fires its own "hangup" event back
  // (seen in production: the button click does nothing, forever, with no
  // error) — this force-releases our side of the UI if that ack doesn't show
  // up, so an agent is never stuck starting back at a live-looking timer.
  const hangupAckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const account = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);
  const dialable = normalise(number, account?.phone_number);
  const enoughDigits = number.replace(/\D/g, "").length >= 9;

  const stopTimer = useCallback((t: React.MutableRefObject<ReturnType<typeof setInterval> | null>) => {
    if (t.current) clearInterval(t.current);
    t.current = null;
  }, []);

  const teardownBrowser = useCallback(() => {
    try {
      clientRef.current?.hangup();
    } catch {
      /* already down */
    }
    clientRef.current = null;
    stopTimer(tickTimer);
    if (hangupAckTimer.current) clearTimeout(hangupAckTimer.current);
    hangupAckTimer.current = null;
    setCallSeconds(0);
    setMuted(false);
    setBrowserState("idle");
    setBrowserNote("");
  }, [stopTimer]);

  // Load the numbers we can call from whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setCall(null);
    if (initialNumber) setNumber(initialNumber);
    setAgentNumber((current) => current || defaultAgentNumber);
    voiceApi.get<VoiceAccountOption[]>("/voice/accounts/").then((res) => {
      if (!res.success || !res.data) return;
      const usable = res.data.filter((a) => a.is_active && a.provider_credential && a.phone_number);
      setAccounts(usable);
      setAccountId((current) => current || usable[0]?.id || "");
    });
  }, [open, defaultAgentNumber, initialNumber]);

  // Bring the browser softphone up (token -> SDK -> "ready") when in browser
  // mode with an account selected; tear it down on close or mode switch.
  useEffect(() => {
    if (!open || mode !== "browser" || !account) return;
    let cancelled = false;
    setBrowserState("connecting");
    setBrowserNote("Tunaandaa simu ya kivinjari…");
    voiceApi.post<WebRtcToken>(`/voice/accounts/${account.id}/webrtc-token/`).then((res) => {
      if (cancelled) return;
      if (!res.success || !res.data) {
        setBrowserState("error");
        setBrowserNote(res.error || "Kivinjari hakikuweza kuandaliwa kupiga simu.");
        return;
      }
      const client = new Africastalking.Client(res.data.token);
      clientRef.current = client;
      client.on("ready", () => {
        if (cancelled) return;
        setBrowserState("ready");
        setBrowserNote(`Tayari kupiga kutoka ${res.data!.phone_number}.`);
      });
      client.on("notready", () => {
        if (cancelled) return;
        setBrowserState("error");
        setBrowserNote("Kivinjari hakiko tayari — ruhusu kipaza sauti (microphone) kisha jaribu tena.");
      });
      client.on("calling", () => {
        if (cancelled) return;
        setBrowserState("calling");
        setBrowserNote(`Tunampigia ${dialable}…`);
      });
      client.on("callaccepted", () => {
        if (cancelled) return;
        setBrowserState("in_call");
        setBrowserNote(record ? "Mmeunganishwa. Mazungumzo yanarekodiwa." : "Mmeunganishwa.");
        setCallSeconds(0);
        stopTimer(tickTimer);
        tickTimer.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      });
      client.on("hangup", (cause) => {
        if (cancelled) return;
        stopTimer(tickTimer);
        if (hangupAckTimer.current) clearTimeout(hangupAckTimer.current);
        hangupAckTimer.current = null;
        const c = (cause || {}) as HangupCause;
        setBrowserState("ended");
        setBrowserNote(
          c.reason && String(c.reason).toLowerCase() !== "normal_clearing"
            ? `Simu imeisha (${c.reason}).`
            : "Simu imemalizika. Rekodi itaonekana kwenye Recordings baada ya muda mfupi.",
        );
        onCallEnded?.();
      });
      client.on("offline", () => {
        if (cancelled) return;
        setBrowserState("error");
        setBrowserNote("Muda wa kuunganishwa umeisha — funga na ufungue tena dirisha hili.");
      });
      client.on("closed", () => {
        if (cancelled) return;
        setBrowserState((s) => (s === "in_call" || s === "calling" ? "error" : s));
        setBrowserNote((n) => n || "Muunganisho na mtandao umekatika.");
      });
    });
    return () => {
      cancelled = true;
      teardownBrowser();
    };
    // `dialable`/`record` are read inside handlers at event time via closure
    // of the latest render is not guaranteed; they only affect status text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, account?.id]);

  useEffect(() => {
    if (!open) {
      stopTimer(pollTimer);
      teardownBrowser();
    }
    return () => stopTimer(pollTimer);
  }, [open, stopTimer, teardownBrowser]);

  const press = (key: string) => setNumber((n) => n + key);
  const backspace = () => setNumber((n) => n.slice(0, -1));

  // ---- browser mode actions
  const browserCall = () => {
    if (!clientRef.current || browserState !== "ready") return;
    setError(null);
    try {
      clientRef.current.call(dialable);
      setBrowserState("calling");
      setBrowserNote(`Tunampigia ${dialable}…`);
    } catch (e) {
      setBrowserState("error");
      setBrowserNote(`Simu haikuweza kuanzishwa: ${(e as Error).message}`);
    }
  };
  const browserHangup = () => {
    try {
      clientRef.current?.hangup();
    } catch (e) {
      console.error("africastalking-client hangup() threw", e);
    }
    // Give the SDK's own "hangup" event a few seconds to arrive (it clears
    // this timer when it does); if it never does, release the UI ourselves
    // rather than leave the agent staring at a call that looks stuck live.
    if (hangupAckTimer.current) clearTimeout(hangupAckTimer.current);
    hangupAckTimer.current = setTimeout(() => {
      hangupAckTimer.current = null;
      stopTimer(tickTimer);
      setBrowserState("ended");
      setBrowserNote("Tumefunga upande wetu. Ikiwa mteja bado yuko mstarini, itakatika yenyewe hivi karibuni.");
    }, 4000);
  };
  const toggleMute = () => {
    if (!clientRef.current) return;
    if (muted) clientRef.current.unmuteAudio();
    else clientRef.current.muteAudio();
    setMuted(!muted);
  };
  const browserReset = () => {
    // After a call: same token, same client — just allow another dial.
    setBrowserState("ready");
    setBrowserNote(`Tayari kupiga kutoka ${account?.phone_number ?? ""}.`);
    setCallSeconds(0);
    setMuted(false);
  };

  // ---- phone-bridge mode actions
  const placeViaPhone = async () => {
    if (!account) return;
    setIsPlacing(true);
    setError(null);
    setCall(null);
    const res = await voiceApi.post<PlacedCall>(`/voice/accounts/${account.id}/calls/outbound/`, {
      to_number: dialable,
      agent_number: agentNumber.trim() || undefined,
      record,
    });
    setIsPlacing(false);
    if (!res.success || !res.data) {
      setError(res.error || "Simu haikuweza kuanzishwa.");
      return;
    }
    setCall(res.data);
    stopTimer(pollTimer);
    pollTimer.current = setInterval(async () => {
      const latest = await voiceApi.get<PlacedCall>(`/voice/calls/${res.data!.id}/`);
      if (!latest.success || !latest.data) return;
      setCall(latest.data);
      if (latest.data.status === "completed" || latest.data.status === "failed") {
        stopTimer(pollTimer);
        onCallEnded?.();
      }
    }, POLL_MS);
  };

  const phoneStatus = phoneStatusLine(call);
  const inBrowserCall = browserState === "calling" || browserState === "in_call";
  const canDial =
    !!account && enoughDigits && (mode === "browser" ? browserState === "ready" : !isPlacing && (!call || call.status === "completed" || call.status === "failed"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Piga simu</DialogTitle>
          <DialogDescription>
            {mode === "browser"
              ? "Utazungumza moja kwa moja kupitia kivinjari; mteja ataona namba ya biashara na mazungumzo yatarekodiwa."
              : "Simu yako itaita kwanza; ukipokea, mteja ataunganishwa nawe na mazungumzo yatarekodiwa."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ["browser", Monitor, "Kivinjari"],
              ["phone", Smartphone, "Simu yangu"],
            ] as Array<[Mode, typeof Monitor, string]>
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              disabled={inBrowserCall}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {accounts.length > 1 && (
          <div className="space-y-1">
            <Label className="text-xs">Piga kutoka namba</Label>
            <Select value={accountId} onValueChange={setAccountId} disabled={inBrowserCall}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Chagua namba" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-sm">
                    {a.phone_number}{a.display_name ? ` · ${a.display_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {accounts.length === 0 && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Hakuna namba ya biashara iliyo tayari kupiga simu. Ongeza namba yenye mtoa huduma kwenye Phone Numbers kwanza.
          </p>
        )}

        {inBrowserCall ? (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card py-5">
            <p className="font-mono text-2xl tracking-wider text-foreground">{dialable}</p>
            <p className={cn("text-xs", browserState === "in_call" ? "text-green-600" : "text-amber-600")}>
              {browserState === "in_call" ? `Mazungumzo · ${formatDuration(callSeconds)}` : "Inaita…"}
            </p>
          </div>
        ) : (
          <>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/[^\d+*#]/g, ""))}
              placeholder="+255 …"
              inputMode="tel"
              autoFocus
              className="h-14 text-center font-mono text-2xl tracking-wider"
              aria-label="Namba ya mteja"
            />
            {enoughDigits && dialable !== number && (
              <p className="-mt-2 text-center text-xs text-muted-foreground">
                Itapigwa kama <span className="font-mono text-foreground">{dialable}</span>
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map(([key, letters]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  className="flex h-14 flex-col items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent active:bg-accent/80"
                >
                  <span className="font-mono text-2xl leading-none">{key}</span>
                  {letters && <span className="mt-1 text-[10px] tracking-widest text-muted-foreground">{letters}</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "phone" && (
          <div className="space-y-1">
            <Label htmlFor="agent-number" className="text-xs">Simu yako (itaita kwanza)</Label>
            <Input
              id="agent-number"
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              placeholder="+2557…"
              inputMode="tel"
              className="h-9 font-mono text-sm"
            />
          </div>
        )}
        {mode === "phone" && (
          <div className="flex items-center gap-2">
            <Checkbox id="record-call" checked={record} onCheckedChange={(v) => setRecord(!!v)} />
            <Label htmlFor="record-call" className="text-xs font-normal">Rekodi mazungumzo</Label>
          </div>
        )}

        {error && (
          <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
          </p>
        )}
        {mode === "browser" && browserNote && (
          <p
            className={cn(
              "flex items-start gap-1.5 text-xs",
              browserState === "error" ? "text-destructive" : browserState === "in_call" ? "text-green-600" : "text-muted-foreground",
            )}
          >
            {browserState === "connecting" ? <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" /> : browserState === "error" ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            {browserNote}
          </p>
        )}
        {mode === "phone" && phoneStatus && (
          <p className={cn("flex items-start gap-1.5 text-xs", phoneStatus.tone)}>
            <phoneStatus.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />{phoneStatus.text}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          {inBrowserCall ? (
            <Button variant="outline" size="icon" onClick={toggleMute} aria-label={muted ? "Washa kipaza sauti" : "Zima kipaza sauti"}>
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={backspace} disabled={!number} aria-label="Futa tarakimu">
              <Delete className="h-5 w-5" />
            </Button>
          )}

          {mode === "browser" && inBrowserCall ? (
            <Button size="icon" onClick={browserHangup} className="h-16 w-16 rounded-full bg-red-600 text-white hover:bg-red-700" aria-label="Kata simu">
              <PhoneOff className="h-6 w-6" />
            </Button>
          ) : mode === "browser" && browserState === "ended" ? (
            <Button size="icon" onClick={browserReset} className="h-16 w-16 rounded-full" aria-label="Piga tena">
              <Phone className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={mode === "browser" ? browserCall : placeViaPhone}
              disabled={!canDial}
              className="h-16 w-16 rounded-full bg-green-600 text-white hover:bg-green-700"
              aria-label={`Mpigie ${dialable}`}
            >
              {isPlacing || browserState === "connecting" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Phone className="h-6 w-6" />}
            </Button>
          )}

          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={inBrowserCall}>
            Funga
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

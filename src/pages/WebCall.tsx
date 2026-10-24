// "Call us" page: a customer opens the link an organization shares, presses Call, and talks to that organization's phone number from the
// browser's microphone. Public (no sign-in): the server only lets this link call this one number, and the call is answered like any phone call.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import type { Client as AtClient } from "africastalking-client";
import { Button } from "@/components/ui/button";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    loading: "Inapakia…",
    unavailable: "Kiungo hiki hakipatikani. Tafadhali omba kiungo kipya kutoka kwa biashara.",
    intro: "Piga simu moja kwa moja kutoka kwenye kivinjari chako. Hakuna haja ya kulipia simu.",
    call: "Piga simu",
    connecting: "Inaunganisha…",
    ringing: "Inapiga…",
    inCall: "Uko kwenye simu",
    ended: "Simu imeisha. Asante.",
    again: "Piga tena",
    end: "Maliza simu",
    mute: "Zima sauti yangu",
    unmute: "Washa sauti yangu",
    keypad: "Namba za kubonyeza",
    recorded: "Simu inaweza kurekodiwa kwa ajili ya ubora wa huduma.",
    mic: "Tafadhali ruhusu kivinjari kutumia kipaza sauti ili tuweze kukusikia.",
    failed: "Hatukuweza kuunganisha simu. Tafadhali jaribu tena baadaye.",
    busy: "Majaribio ni mengi sana. Tafadhali jaribu tena baadaye.",
    help: "Unaweza kubonyeza namba kwenye kibodi kwa ajili ya menyu, kama kwenye simu ya kawaida.",
  },
  en: {
    loading: "Loading…",
    unavailable: "This link is not available. Please ask the business for a new one.",
    intro: "Call straight from your browser, using your device's microphone.",
    call: "Call now",
    connecting: "Connecting…",
    ringing: "Calling…",
    inCall: "You are on the call",
    ended: "The call has ended. Thank you.",
    again: "Call again",
    end: "End call",
    mute: "Mute my microphone",
    unmute: "Unmute my microphone",
    keypad: "Keypad",
    recorded: "Calls may be recorded for quality purposes.",
    mic: "Please allow the browser to use your microphone so we can hear you.",
    failed: "We could not connect the call. Please try again later.",
    busy: "Too many attempts. Please try again later.",
    help: "You can press keys on the keypad for menus, as on a normal phone.",
  },
} as const;

type Phase = "loading" | "unavailable" | "idle" | "connecting" | "ringing" | "incall" | "ended" | "error";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export default function WebCall() {
  const { key = "" } = useParams();
  const T = TEXT[appLanguage()];
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [note, setNote] = useState("");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const clientRef = useRef<AtClient | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    let alive = true;
    void voiceApi.get<{ name: string }>(`/voice/public/web-call/${encodeURIComponent(key)}/`).then((res) => {
      if (!alive) return;
      if (res.success && res.data) { setName(res.data.name); setPhase("idle"); } else setPhase("unavailable");
    });
    return () => { alive = false; };
  }, [key]);

  useEffect(() => {
    if (phase !== "incall") return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const leave = useCallback(() => {
    try { clientRef.current?.hangup(); } catch { /* not in a call */ }
    clientRef.current = null;
  }, []);
  useEffect(() => leave, [leave]);

  const fail = (message: string) => { setNote(message); setPhase("error"); leave(); };

  const start = async () => {
    setNote("");
    setMuted(false);
    setPhase("connecting");
    try {
      // the microphone first, so a refusal is explained instead of a silent call
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      fail(T.mic);
      return;
    }
    const res = await voiceApi.post<{ token: string; phone_number: string }>(`/voice/public/web-call/${encodeURIComponent(key)}/token/`);
    if (!res.success || !res.data) { fail(res.status === 429 ? T.busy : T.failed); return; }
    const { phone_number: number, token } = res.data;
    try {
      const { default: Africastalking } = await import("africastalking-client");
      const client = new Africastalking.Client(token);
      clientRef.current = client;
      client.on("ready", () => { setPhase("ringing"); try { client.call(number); } catch { fail(T.failed); } });
      client.on("callaccepted", () => setPhase("incall"));
      client.on("hangup", () => { clientRef.current = null; setPhase((p) => (p === "error" ? p : "ended")); });
      client.on("notready", () => fail(T.failed));
      client.on("offline", () => fail(T.failed));
      client.on("closed", () => setPhase((p) => (p === "incall" || p === "ringing" ? "ended" : p)));
    } catch {
      fail(T.failed);
    }
  };

  const toggleMute = () => {
    const client = clientRef.current;
    if (!client) return;
    if (muted) client.unmuteAudio(); else client.muteAudio();
    setMuted(!muted);
  };
  const press = (digit: string) => { try { clientRef.current?.dtmf(digit); } catch { /* not in a call */ } };
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const live = phase === "connecting" || phase === "ringing" || phase === "incall";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-6 text-center shadow-sm">
        {phase === "loading" && <p className="text-sm text-muted-foreground">{T.loading}</p>}
        {phase === "unavailable" && <p className="text-sm text-slate-700">{T.unavailable}</p>}
        {phase !== "loading" && phase !== "unavailable" && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
            {phase === "idle" && <p className="text-sm text-slate-600">{T.intro}</p>}
            {phase === "connecting" && <p className="text-sm text-slate-600">{T.connecting}</p>}
            {phase === "ringing" && <p className="text-sm text-slate-600">{T.ringing}</p>}
            {phase === "incall" && <p className="text-sm font-medium text-green-700">{T.inCall} · {clock}</p>}
            {phase === "ended" && <p className="text-sm text-slate-600">{T.ended}</p>}
            {phase === "error" && <p className="rounded-md bg-red-50 p-2 text-sm text-red-800">{note}</p>}

            {(phase === "idle" || phase === "ended" || phase === "error") && (
              <Button size="lg" className="w-full" onClick={() => void start()}>
                <Phone className="mr-2 h-5 w-5" />{phase === "idle" ? T.call : T.again}
              </Button>
            )}

            {live && (
              <div className="space-y-3">
                {phase === "incall" && (
                  <>
                    <div className="grid grid-cols-3 gap-2" aria-label={T.keypad}>
                      {KEYS.map((k) => (
                        <Button key={k} type="button" variant="outline" className="h-12 text-lg" onClick={() => press(k)}>{k}</Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{T.help}</p>
                    <Button type="button" variant="outline" className="w-full" onClick={toggleMute}>
                      {muted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{muted ? T.unmute : T.mute}
                    </Button>
                  </>
                )}
                <Button type="button" variant="destructive" className="w-full" onClick={leave}>
                  <PhoneOff className="mr-2 h-4 w-4" />{T.end}
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-500">{T.recorded}</p>
          </>
        )}
      </div>
    </main>
  );
}

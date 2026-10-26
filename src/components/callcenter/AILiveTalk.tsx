// Talk to the assistant out loud, from the browser, through LiveKit: it hears you while it speaks and stops when you talk over it.
// This is the test bench for the live voice assistant; no phone number uses it yet. The browser gets a short-lived token for one private
// room from our server, and the live agent (its own service) joins that room. The LiveKit code is loaded only when the button is pressed.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";
import { Loader2, Mic, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    title: "Ongea na msaidizi moja kwa moja",
    intro: "Ongea kwa sauti kupitia kivinjari. Msaidizi anakusikia hata wakati anaongea, na anaacha ukimkatiza. Hii ni ya majaribio: hakuna namba ya simu inayoitumia bado.",
    saved: "Inatumia toleo lililohifadhiwa la msaidizi. Hifadhi mabadiliko kwanza.",
    start: "Ongea moja kwa moja",
    connecting: "Inaunganisha…",
    listening: "Anakusikiliza. Ongea sasa.",
    speaking: "Msaidizi anaongea… (unaweza kumkatiza)",
    you: "Wewe",
    assistant: "Msaidizi",
    end: "Maliza",
    ended: "Mazungumzo yameisha.",
    notReady: "Sauti ya moja kwa moja haijawekwa kwenye seva bado.",
    mic: "Ruhusu kivinjari kutumia kipaza sauti ili msaidizi akusikie.",
    failed: "Imeshindikana kuunganisha. Jaribu tena.",
    busy: "Majaribio mengi sana. Jaribu tena baadaye.",
    noAgent: "Msaidizi bado hajajiunga. Ikiendelea hivi, huduma ya sauti ya moja kwa moja haijawashwa kwenye seva.",
  },
  en: {
    title: "Talk to the assistant live",
    intro: "Speak out loud through the browser. The assistant hears you even while it is speaking, and stops when you talk over it. This is a test: no phone number uses it yet.",
    saved: "This uses the saved version of the assistant. Save your changes first.",
    start: "Talk live",
    connecting: "Connecting…",
    listening: "Listening. Speak now.",
    speaking: "The assistant is speaking… (you can interrupt)",
    you: "You",
    assistant: "Assistant",
    end: "End",
    ended: "The conversation has ended.",
    notReady: "Live voice is not set up on the server yet.",
    mic: "Allow the browser to use your microphone so the assistant can hear you.",
    failed: "Could not connect. Please try again.",
    busy: "Too many tests. Try again later.",
    noAgent: "The assistant has not joined. If this keeps happening, the live voice service is not switched on on the server.",
  },
} as const;

type Phase = "idle" | "connecting" | "live" | "ended" | "error";
type Line = { id: string; who: "you" | "assistant"; text: string };

/** How long we wait for the assistant to join the room before saying something is wrong on the server. */
const AGENT_JOIN_TIMEOUT_MS = 15000;

export function AILiveTalk({ agentId, dirty }: { agentId: string; dirty: boolean }) {
  const T = TEXT[appLanguage()];
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const roomRef = useRef<Room | null>(null);
  const audioRefs = useRef<HTMLElement[]>([]);
  const joinTimer = useRef<number | undefined>(undefined);
  // Shown only when the server has live voice switched on, so nobody is offered a button that cannot work.
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    void voiceApi.get<{ available: boolean }>(`/ai-agent/agents/${agentId}/live-test/`).then((res) => {
      if (alive) setAvailable(!!(res.success && res.data?.available));
    });
    return () => { alive = false; };
  }, [agentId]);

  const cleanup = useCallback(() => {
    window.clearTimeout(joinTimer.current);
    audioRefs.current.forEach((el) => el.remove());
    audioRefs.current = [];
    const room = roomRef.current;
    roomRef.current = null;
    if (room) void room.disconnect();
  }, []);
  useEffect(() => cleanup, [cleanup]);

  const fail = (message: string) => { setNote(message); setPhase("error"); cleanup(); };

  const start = async () => {
    setNote("");
    setLines([]);
    setPhase("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      fail(T.mic);
      return;
    }
    const res = await voiceApi.post<{ url: string; token: string }>(`/ai-agent/agents/${agentId}/live-test/`);
    if (!res.success || !res.data) {
      fail(res.status === 503 ? T.notReady : res.status === 429 ? T.busy : T.failed);
      return;
    }
    try {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const room = new Room({ adaptiveStream: true, dynacast: true, audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      roomRef.current = room;
      let agentHere = false;
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) return;
        agentHere = true;
        window.clearTimeout(joinTimer.current);
        const el = track.attach();
        el.style.display = "none";
        document.body.appendChild(el);
        audioRefs.current.push(el);
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (active) => setSpeaking(active.some((p) => !p.isLocal)));
      room.on(RoomEvent.Disconnected, () => { roomRef.current = null; setSpeaking(false); setPhase((p) => (p === "error" ? p : "ended")); });
      // What each side said, as LiveKit's agent publishes it. Shown so you can judge whether it understood you.
      room.registerTextStreamHandler("lk.transcription", async (reader, participant) => {
        try {
          const text = (await reader.readAll()).trim();
          if (!text) return;
          const mine = participant.identity === room.localParticipant.identity;
          setLines((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, who: mine ? "you" : "assistant", text }]);
        } catch { /* a transcript line that did not arrive is not worth stopping the conversation for */ }
      });
      await room.connect(res.data.url, res.data.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setPhase("live");
      joinTimer.current = window.setTimeout(() => { if (!agentHere) fail(T.noAgent); }, AGENT_JOIN_TIMEOUT_MS);
    } catch {
      fail(T.failed);
    }
  };

  const live = phase === "connecting" || phase === "live";
  if (!available) return null;
  return (
    <Card><CardContent className="space-y-3 p-4">
      <p className="font-medium">{T.title}</p>
      <p className="text-sm text-muted-foreground">{T.intro}</p>
      {dirty && <p className="text-xs text-amber-700">{T.saved}</p>}
      {phase === "error" && <p className="rounded-md bg-red-50 p-2 text-sm text-red-800">{note}</p>}
      {phase === "ended" && <p className="text-sm text-muted-foreground">{T.ended}</p>}
      {phase === "live" && <p className="text-sm font-medium text-green-700">{speaking ? T.speaking : T.listening}</p>}
      {lines.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-sm">
          {lines.map((l) => (
            <p key={l.id} className={l.who === "you" ? "text-right" : ""}>
              <span className="mr-1.5 text-[11px] font-medium opacity-70">{l.who === "you" ? T.you : T.assistant}</span>{l.text}
            </p>
          ))}
        </div>
      )}
      {!live ? (
        <Button onClick={() => void start()}><Mic className="mr-1.5 h-4 w-4" />{T.start}</Button>
      ) : (
        <Button variant="destructive" onClick={cleanup}>
          {phase === "connecting" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PhoneOff className="mr-1.5 h-4 w-4" />}
          {phase === "connecting" ? T.connecting : T.end}
        </Button>
      )}
    </CardContent></Card>
  );
}

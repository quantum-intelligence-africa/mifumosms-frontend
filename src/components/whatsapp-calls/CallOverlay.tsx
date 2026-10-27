// What an agent sees when a WhatsApp call rings or is in progress. It sits above every page (mounted once, inside the router), so a call is
// visible while the agent is reading another conversation or another part of SENDA. It shows a call only when the server reported one.
import { Loader2, Mic, MicOff, MessageSquare, Phone, PhoneOff, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatClock, useCallClock, useWhatsAppCalling, type CallSession } from "@/contexts/WhatsAppCallingContext";
import { callText } from "./callText";

const label = (name: string, phone: string) => name || `+${phone}`;

function statusLine(s: CallSession, T: ReturnType<typeof callText>): { text: string; tone: "info" | "ok" | "warn" | "bad" } {
  if (s.phase === "ended") return { text: s.outcome || "", tone: s.error ? "bad" : "info" };
  if (s.phase === "mic") return { text: T.allowMic, tone: "info" };
  if (s.phase === "claiming") return { text: T.taking, tone: "info" };
  if (s.phase === "connecting") return { text: T.connecting, tone: "info" };
  if (s.phase === "ringing") return { text: T.ringing, tone: "info" };
  if (s.media === "connected") return { text: T.connected, tone: "ok" };
  if (s.media === "disconnected") return { text: T.audioLost, tone: "warn" };
  if (s.media === "failed") return { text: T.audioFailed, tone: "bad" };
  return { text: T.audioConnecting, tone: "info" };
}

function SessionCard({ session }: { session: CallSession }) {
  const { hangUp, toggleMute, switchMic, micDevices, dismiss } = useWhatsAppCalling();
  const navigate = useNavigate();
  const T = callText();
  const line = statusLine(session, T);
  const seconds = useCallClock(session.answeredAt, session.phase === "active" && session.media === "connected");
  const ended = session.phase === "ended";
  const tone = { info: "text-muted-foreground", ok: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" }[line.tone];
  return (
    <div role="dialog" aria-label={T.whatsappCall} className="w-full rounded-xl border bg-card p-4 shadow-xl sm:w-80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><User className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{label(session.name, session.phone)}</p>
          <p className="truncate text-xs text-muted-foreground">+{session.phone} · {session.direction === "in" ? T.incoming : T.outgoing}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm ${tone}`} aria-live="polite">
        {!ended && line.tone === "info" && <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
        {line.text}{session.phase === "active" && session.media === "connected" ? ` · ${formatClock(seconds)}` : ""}
      </p>
      {session.error && <p className="mt-1 text-xs text-red-600">{session.error}</p>}
      {!ended && session.phase !== "mic" && micDevices.length > 1 && (
        <label className="mt-3 block text-xs text-muted-foreground">
          {T.mic}
          <select className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs" onChange={(e) => void switchMic(e.target.value)}>
            {micDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || T.mic}</option>)}
          </select>
        </label>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!ended && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={toggleMute} disabled={session.phase === "mic" || session.phase === "claiming"} aria-pressed={session.muted}>
              {session.muted ? <MicOff className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}{session.muted ? T.unmute : T.mute}
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => void hangUp()}><PhoneOff className="mr-1.5 h-4 w-4" />{T.end}</Button>
          </>
        )}
        {session.threadId && (
          <Button type="button" size="sm" variant="ghost" onClick={() => navigate(`/conversations?thread=${session.threadId}`)}><MessageSquare className="mr-1.5 h-4 w-4" />{T.openChat}</Button>
        )}
        {ended && <Button type="button" size="sm" variant="ghost" onClick={dismiss}>OK</Button>}
      </div>
    </div>
  );
}

export function CallOverlay() {
  const { enabled, live, session, answer, decline, setAvailability } = useWhatsAppCalling();
  const T = callText();
  if (!enabled || !live) return null;
  const effective = live.me.effective;
  const others = live.active.filter((c) => !c.mine && c.status !== "ringing");
  const showRinging = !session || session.phase === "ended";
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-16 sm:bottom-auto">
      {showRinging && live.ringing.map((c) => (
        <div key={c.id} role="alertdialog" aria-label={T.incoming} className="pointer-events-auto w-full animate-in fade-in slide-in-from-top-2 rounded-xl border-2 border-emerald-500 bg-card p-4 shadow-2xl sm:w-80">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/60" /><Phone className="relative h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{label(c.customer_name, c.customer_phone)}</p>
              <p className="truncate text-xs text-muted-foreground">+{c.customer_phone} · {T.incoming}</p>
            </div>
          </div>
          {effective === "available" ? (
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void answer(c)}><Phone className="mr-1.5 h-4 w-4" />{T.answer}</Button>
              <Button type="button" size="sm" variant="destructive" className="flex-1" onClick={() => void decline(c)}><PhoneOff className="mr-1.5 h-4 w-4" />{T.decline}</Button>
            </div>
          ) : effective === "busy" ? (
            <p className="mt-3 text-xs text-muted-foreground">{T.onAnother}</p>
          ) : (
            <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={() => void setAvailability("available")}>{T.setAvailable}</Button>
          )}
        </div>
      ))}
      {session && <div className="pointer-events-auto w-full sm:w-auto"><SessionCard session={session} /></div>}
      {others.length > 0 && (
        <div className="pointer-events-auto w-full space-y-1 sm:w-80">
          {others.map((c) => (
            <p key={c.id} className="truncate rounded-md border bg-card/95 px-3 py-1.5 text-xs shadow">
              <span className="font-medium">{label(c.customer_name, c.customer_phone)}</span> · {c.handled_by?.name || "—"} {T.handling}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// The voice-call control in a conversation header. It is a real WhatsApp call, never a phone call: it is only offered when the number can take
// calls and the customer has allowed them; otherwise it says why, and offers to ask the customer for permission.
import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWhatsAppCalling } from "@/contexts/WhatsAppCallingContext";
import { errorCode } from "@/services/teamInboxApi";
import { whatsappCallsApi, type CallPermission } from "@/services/whatsappCallsApi";
import { appLanguage } from "@/utils/appLocale";

const SW = {
  call: "Piga simu", ask: "Omba ruhusa ya kupiga", asked: "Inasubiri jibu la mteja", declined: "Mteja amekataa simu", notReady: "Simu za WhatsApp hazijawashwa kwenye namba hii",
  busy: "Uko kwenye simu", asking: "Inatuma ombi...", sent: "Ombi la ruhusa limetumwa kwa mteja.", noRight: "Huna ruhusa ya kupiga simu", windowClosed: "Mteja hajaandika kwa saa 24",
};
const EN = {
  call: "Call", ask: "Ask to call", asked: "Waiting for the customer to answer", declined: "The customer declined calls", notReady: "WhatsApp calling is not switched on for this number",
  busy: "You are on a call", asking: "Sending request...", sent: "Permission request sent to the customer.", noRight: "You are not allowed to place calls", windowClosed: "The customer has not written in 24 hours",
};

export function CallButton({ threadId, name, phone, windowOpen }: { threadId: string; name: string; phone: string; windowOpen: boolean }) {
  const { enabled, readiness, session, live, callThread } = useWhatsAppCalling();
  const { toast } = useToast();
  const T = appLanguage() === "sw" ? SW : EN;
  const [perm, setPerm] = useState<CallPermission | null>(null);
  const [canCall, setCanCall] = useState(true);
  const [asking, setAsking] = useState(false);

  const load = useCallback(async () => {
    const res = await whatsappCallsApi.threadState(threadId);
    if (res.success && res.data) { setPerm(res.data.permission); setCanCall(res.data.can_call); }
  }, [threadId]);

  useEffect(() => {
    if (!enabled) return;
    setPerm(null);
    void load();
    const h = window.setInterval(() => void load(), 8000); // the customer's answer arrives by webhook: pick it up quietly
    return () => window.clearInterval(h);
  }, [enabled, load]);

  if (!enabled) return null;
  const onCall = !!session && session.phase !== "ended";
  const blocked = !readiness?.ready;

  const ask = async () => {
    setAsking(true);
    const res = await whatsappCallsApi.askPermission(threadId);
    setAsking(false);
    if (res.success && res.data) { setPerm(res.data.permission); toast({ title: T.sent }); } else if (errorCode(res) === "window_closed") toast({ title: T.windowClosed, description: res.message, variant: "destructive" });
    else toast({ title: res.message || T.notReady, variant: "destructive" });
  };

  if (!canCall) return <Button type="button" size="sm" variant="outline" disabled title={T.noRight}><Phone className="mr-1.5 h-4 w-4" />{T.call}</Button>;
  if (blocked) return <Button type="button" size="sm" variant="outline" disabled title={readiness?.blockers[0]?.message || T.notReady}><Phone className="mr-1.5 h-4 w-4" />{T.call}</Button>;
  if (perm?.status === "granted") {
    return (
      <Button type="button" size="sm" variant="outline" disabled={onCall || live?.me.effective === "busy"} title={onCall ? T.busy : undefined} onClick={() => void callThread(threadId, name, phone)}>
        <PhoneCall className="mr-1.5 h-4 w-4 text-emerald-600" />{T.call}
      </Button>
    );
  }
  if (perm?.status === "requested" && !perm.can_ask) return <Button type="button" size="sm" variant="outline" disabled title={T.asked}><Phone className="mr-1.5 h-4 w-4" />{T.asked}</Button>;
  if (perm?.status === "denied") return <Button type="button" size="sm" variant="outline" disabled title={T.declined}><Phone className="mr-1.5 h-4 w-4" />{T.declined}</Button>;
  return (
    <Button type="button" size="sm" variant="outline" disabled={asking || !windowOpen} title={!windowOpen ? T.windowClosed : undefined} onClick={() => void ask()}>
      {asking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Phone className="mr-1.5 h-4 w-4" />}{asking ? T.asking : T.ask}
    </Button>
  );
}

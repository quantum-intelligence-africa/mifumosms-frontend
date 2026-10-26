// Per number: answer REAL phone calls with the live AI assistant (LiveKit SIP). Two things must agree: the owner switches it on here (this card),
// and the number's callback in Africa's Talking is set to "trunk:<SIP address>". Nothing on this card changes where Africa's Talking sends calls.
import { useCallback, useEffect, useState } from "react";
import { Copy, PhoneIncoming } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    title: "Jibu simu za kawaida kwa msaidizi wa AI wa moja kwa moja",
    desc: "Watu wanaopiga namba hii kwa simu zao wanapokelewa na msaidizi wako wa AI aliyechapishwa. Anawasikia hata wakati anaongea, anaacha wakimkatiza, na anajibu kutokana na maarifa uliyomfundisha. Kila simu inaonekana kwenye historia ya simu pamoja na maandishi ya mazungumzo.",
    step1: "Hatua 1: washa swichi hii.",
    step2: "Hatua 2: kwenye Africa's Talking, weka callback ya namba hii kuwa:",
    copy: "Nakili",
    copied: "Imenakiliwa",
    warn: "Muhimu: callback ikibadilishwa, menyu na timu ya namba hii havitaita tena: simu zote zinaenda kwa msaidizi. Kabla ya kubadilisha, nakili Webhook URL iliyo juu. Ukitaka kurudi, weka callback kuwa Webhook URL hiyo.",
    needs: "Bado haijawa tayari:",
    cost: "Kila dakika ya simu ina gharama.",
    failed: "Imeshindikana kubadilisha.",
    on: "Imewashwa. Sasa weka callback kwenye Africa's Talking (hatua 2).",
    off: "Imezimwa.",
  },
  en: {
    title: "Answer phone calls with the live AI assistant",
    desc: "People who ring this number from their phones are answered by your published AI assistant. It hears them even while it is speaking, stops when they talk over it, and answers from the knowledge you taught it. Every call appears in your call history with a transcript.",
    step1: "Step 1: switch this on.",
    step2: "Step 2: in Africa's Talking, set this number's callback to:",
    copy: "Copy",
    copied: "Copied",
    warn: "Important: once the callback is changed, this number's menu and team no longer ring: every call goes to the assistant. Before you change it, copy the Webhook URL shown above. To go back, set the callback to that Webhook URL.",
    needs: "Not ready yet:",
    cost: "Every minute of a call has a cost.",
    failed: "Could not change that.",
    on: "Switched on. Now set the callback in Africa's Talking (step 2).",
    off: "Switched off.",
  },
} as const;

interface State { enabled: boolean; available: boolean; sip_host: string; callback: string; needs: string[]; warning?: string }

export function PhoneAiCard({ accountId }: { accountId: string }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await voiceApi.get<State>(`/voice/accounts/${accountId}/phone-ai/`);
    if (res.success && res.data) setState(res.data);
  }, [accountId]);
  useEffect(() => { void load(); }, [load]);

  const change = async (enabled: boolean) => {
    setBusy(true);
    const res = await voiceApi.post<State>(`/voice/accounts/${accountId}/phone-ai/`, { enabled });
    setBusy(false);
    if (res.success && res.data) {
      setState(res.data);
      toast({ title: enabled ? T.on : T.off, description: res.data.warning || undefined });
    } else {
      toast({ title: res.error || T.failed, variant: "destructive" });
    }
  };

  if (!state) return null;
  return (
    <div className="space-y-2 rounded-md border border-border px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 text-xs">
          <PhoneIncoming className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-medium">{T.title}</span>
            <br />
            <span className="text-muted-foreground">{T.desc}</span>
          </span>
        </div>
        <Switch checked={state.enabled} disabled={busy || (!state.available && !state.enabled)} onCheckedChange={(v) => void change(v)} aria-label={T.title} />
      </div>
      {!state.available && !state.enabled && state.needs.length > 0 && (
        <p className="text-xs text-amber-700">{T.needs} {state.needs.join("; ")}.</p>
      )}
      {state.available && (
        <div className="space-y-1.5 border-t border-border pt-2 text-xs">
          <p className="text-muted-foreground">{T.step1}</p>
          <p className="text-muted-foreground">{T.step2}</p>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 font-mono text-xs">{state.callback}</code>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={T.copy}
              onClick={() => { void navigator.clipboard.writeText(state.callback); toast({ title: T.copied }); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="rounded-md bg-amber-50 p-2 text-amber-900">{T.warn}</p>
          <p className="text-muted-foreground">{T.cost}</p>
        </div>
      )}
    </div>
  );
}

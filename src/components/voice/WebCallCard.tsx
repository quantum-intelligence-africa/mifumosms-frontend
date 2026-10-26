// Per number: let customers call it from a web page. Off until the owner switches it on; the link can be copied or replaced.
import { useCallback, useEffect, useState } from "react";
import { Copy, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    title: "Simu kutoka kwenye wavuti",
    desc: "Wateja wanaweza kupiga namba hii moja kwa moja kutoka kwenye kivinjari kwa kutumia kiungo hiki. Wanapokelewa na menyu, msaidizi au timu ileile ya namba hii. Imezimwa mpaka uiwashe.",
    link: "Kiungo cha kushiriki",
    copy: "Nakili",
    copied: "Kiungo kimenakiliwa",
    replace: "Badilisha kiungo",
    confirmReplace: "Kiungo cha zamani kitaacha kufanya kazi. Endelea?",
    notConnected: "Namba hii bado haijaunganishwa na huduma ya simu, kwa hiyo haiwezi kupokea simu za wavuti.",
    cost: "Simu za wavuti zinatumia dakika za huduma ya simu kama simu za kawaida.",
    failed: "Imeshindikana kubadilisha.",
    aiTitle: "Jibu na msaidizi wa AI wa moja kwa moja",
    aiDesc: "Wageni wanaongea moja kwa moja na msaidizi wako wa AI aliyechapishwa. Anakusikia hata wakati anaongea, anaacha ukimkatiza, na anajibu kutokana na maarifa uliyomfundisha. Kila mazungumzo yanaonekana kwenye historia ya simu kama maandishi. Hayahusishi mtandao wa simu.",
    aiNeeds: "Inahitaji msaidizi wa AI aliyechapishwa na sauti ya moja kwa moja iliyowekwa na SENDA.",
    aiCost: "Kila dakika ya mazungumzo ina gharama. Idadi ya mazungumzo kwa siku imewekewa kikomo.",
  },
  en: {
    title: "Calls from the web",
    desc: "Customers can call this number straight from their browser using this link. They are answered by the same menu, assistant or team as this number. Off until you switch it on.",
    link: "Link to share",
    copy: "Copy",
    copied: "Link copied",
    replace: "Replace link",
    confirmReplace: "The old link will stop working. Continue?",
    notConnected: "This number is not connected to the calling service yet, so it cannot take web calls.",
    cost: "Web calls use voice minutes from your calling service like normal calls.",
    failed: "Could not change that.",
    aiTitle: "Answer with the live AI assistant",
    aiDesc: "Visitors talk live with your published AI assistant. It hears them even while it is speaking, stops when they talk over it, and answers from the knowledge you taught it. Every conversation appears in your call history as text. It does not use the phone network.",
    aiNeeds: "Needs a published AI assistant, and live voice set up by SENDA.",
    aiCost: "Every minute of conversation has a cost, so the number of conversations a day is limited.",
  },
} as const;

interface State { enabled: boolean; path: string; connected: boolean; ai_live: boolean; ai_available: boolean }

export function WebCallCard({ accountId }: { accountId: string }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await voiceApi.get<State>(`/voice/accounts/${accountId}/web-call/`);
    if (res.success && res.data) setState(res.data);
  }, [accountId]);
  useEffect(() => { void load(); }, [load]);

  const change = async (body: { enabled?: boolean; rotate?: boolean; ai_live?: boolean }) => {
    setBusy(true);
    const res = await voiceApi.post<State>(`/voice/accounts/${accountId}/web-call/`, body);
    setBusy(false);
    if (res.success && res.data) setState(res.data);
    else toast({ title: res.error || T.failed, variant: "destructive" });
  };

  if (!state) return null;
  const url = state.path ? `${window.location.origin}${state.path}` : "";
  return (
    <div className="space-y-2 rounded-md border border-border px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 text-xs">
          <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-medium">{T.title}</span>
            <br />
            <span className="text-muted-foreground">{T.desc}</span>
          </span>
        </div>
        <Switch checked={state.enabled} disabled={busy || (!state.connected && !state.enabled)} onCheckedChange={(v) => void change({ enabled: v })} aria-label={T.title} />
      </div>
      {!state.connected && <p className="text-xs text-amber-700">{T.notConnected}</p>}
      {state.enabled && url && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{T.link}</label>
          <div className="flex items-center gap-1.5">
            <Input readOnly value={url} className="h-8 text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={T.copy}
              onClick={() => { void navigator.clipboard.writeText(url); toast({ title: T.copied }); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={T.replace} title={T.replace} disabled={busy}
              onClick={() => { if (window.confirm(T.confirmReplace)) void change({ rotate: true }); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          {!state.ai_live && <p className="text-xs text-muted-foreground">{T.cost}</p>}
        </div>
      )}
      {state.enabled && (
        <div className="flex items-start justify-between gap-3 border-t border-border pt-2">
          <div className="text-xs">
            <span className="font-medium">{T.aiTitle}</span>
            <br />
            <span className="text-muted-foreground">{T.aiDesc}</span>
            {state.ai_available ? <p className="mt-1 text-muted-foreground">{T.aiCost}</p> : <p className="mt-1 text-amber-700">{T.aiNeeds}</p>}
          </div>
          <Switch checked={state.ai_live} disabled={busy || (!state.ai_available && !state.ai_live)} onCheckedChange={(v) => void change({ ai_live: v })} aria-label={T.aiTitle} />
        </div>
      )}
    </div>
  );
}

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
  },
} as const;

interface State { enabled: boolean; path: string; connected: boolean }

export function WebCallCard({ accountId }: { accountId: string }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await voiceApi.get<State>(`/accounts/${accountId}/web-call/`);
    if (res.success && res.data) setState(res.data);
  }, [accountId]);
  useEffect(() => { void load(); }, [load]);

  const change = async (body: { enabled?: boolean; rotate?: boolean }) => {
    setBusy(true);
    const res = await voiceApi.post<State>(`/accounts/${accountId}/web-call/`, body);
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
          <p className="text-xs text-muted-foreground">{T.cost}</p>
        </div>
      )}
    </div>
  );
}

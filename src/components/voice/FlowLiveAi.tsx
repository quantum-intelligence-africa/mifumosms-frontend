// A flow's own switch for the live AI assistant (real-time voice). Each flow has one: switching it on here never changes another flow.
// Numbers that run this flow are answered by the live assistant through the doors their owner opened (web calls, phone calls).
import { useCallback, useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    title: "AI ya moja kwa moja",
    on: "Namba za mtiririko huu zinajibiwa na msaidizi wa AI wa moja kwa moja.",
    off: "Imezimwa. Mtiririko huu unaendelea kama ulivyojengwa.",
    assistant: "Msaidizi",
    defaultAssistant: "Msaidizi aliyechapishwa wa shirika",
    doors: "Namba",
    web: "wavuti",
    phone: "simu",
    needsLiveKit: "SENDA bado haijaweka sauti ya moja kwa moja, kwa hiyo haijibu bado.",
    failed: "Imeshindikana kubadilisha.",
    savedOn: "AI ya moja kwa moja imewashwa kwa mtiririko huu.",
    savedOff: "AI ya moja kwa moja imezimwa kwa mtiririko huu.",
  },
  en: {
    title: "Live AI voice",
    on: "Numbers that run this flow are answered by the live AI assistant.",
    off: "Off. This flow keeps running as built.",
    assistant: "Assistant",
    defaultAssistant: "The organization's published assistant",
    doors: "Numbers",
    web: "web",
    phone: "phone",
    needsLiveKit: "SENDA has not set up live voice yet, so it does not answer yet.",
    failed: "Could not change that.",
    savedOn: "Live AI is on for this flow.",
    savedOff: "Live AI is off for this flow.",
  },
} as const;

interface State {
  enabled: boolean;
  assistant: string;
  assistants: Array<{ id: string; name: string }>;
  flow_published: boolean;
  livekit_ready: boolean;
  numbers: Array<{ id: string; phone_number: string; web: boolean; phone: boolean }>;
  warning?: string;
}

export function FlowLiveAi({ flowId }: { flowId: string }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await voiceApi.get<State>(`/voice/ivr/${flowId}/live-ai/`);
    if (res.success && res.data) setState(res.data);
  }, [flowId]);
  useEffect(() => { void load(); }, [load]);

  const change = async (body: { enabled?: boolean; assistant?: string }) => {
    setBusy(true);
    const res = await voiceApi.post<State>(`/voice/ivr/${flowId}/live-ai/`, body);
    setBusy(false);
    if (res.success && res.data) {
      setState(res.data);
      if (body.enabled !== undefined) toast({ title: body.enabled ? T.savedOn : T.savedOff, description: res.data.warning || undefined });
    } else {
      const errors = (res as { errors?: { errors?: Record<string, string> } }).errors?.errors;
      toast({ title: (errors && Object.values(errors).join(" ")) || (typeof res.error === "string" && !res.error.includes("[object") ? res.error : "") || T.failed, variant: "destructive" });
    }
  };

  // The card is clickable (it opens the flow); nothing here may open it.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  if (!state) return null;
  return (
    <div className="space-y-1.5 rounded-md border border-border px-2 py-1.5 text-xs" onClick={stop} onKeyDown={stop} role="group" aria-label={T.title}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium"><Bot className="h-3.5 w-3.5 text-muted-foreground" />{T.title}</span>
        <Switch checked={state.enabled} disabled={busy} onCheckedChange={(v) => void change({ enabled: v })} aria-label={T.title} />
      </div>
      <p className="text-muted-foreground">{state.enabled ? T.on : T.off}</p>
      {state.enabled && !state.livekit_ready && <p className="text-amber-700">{T.needsLiveKit}</p>}
      {state.enabled && state.assistants.length > 1 && (
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-muted-foreground">{T.assistant}</span>
          <select
            className="h-7 min-w-0 flex-1 rounded border bg-background px-1.5"
            value={state.assistant}
            disabled={busy}
            onChange={(e) => void change({ assistant: e.target.value })}
          >
            <option value="">{T.defaultAssistant}</option>
            {state.assistants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      )}
      {state.enabled && state.numbers.length > 0 && (
        <p className="text-muted-foreground">
          {T.doors}: {state.numbers.map((n) => `${n.phone_number} (${[n.web ? T.web : "", n.phone ? T.phone : ""].filter(Boolean).join(", ") || "-"})`).join(" · ")}
        </p>
      )}
    </div>
  );
}

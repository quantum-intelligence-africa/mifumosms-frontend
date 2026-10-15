import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ChevronDown, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { aiAgentApi, type AiSession } from "@/services/aiAgentApi";
import { SummaryLines } from "@/components/callcenter/AiHandoffCard";
import { describeError } from "@/services/callCenterApi";

/**
 * What the AI assistant did on one call: who handled it, why it was handed over, the summary, the tickets it created and (on request)
 * what was said. Renders nothing for a call the assistant never touched, so it can sit in any call-detail view.
 */
export function AiSessionPanel({ callId }: { callId: string }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<AiSession | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const load = useCallback(async () => {
    const res = await aiAgentApi.sessionForCall(callId);
    setSession(res.success && res.data ? res.data.session : null);
  }, [callId]);

  useEffect(() => {
    setSession(null);
    void load();
  }, [load]);

  if (!session) return null;

  const removeData = async () => {
    if (!window.confirm(t("ai.session.delete_confirm"))) return;
    const res = await aiAgentApi.deleteCallData(callId);
    if (res.success) {
      toast({ title: t("ai.session.deleted") });
      void load();
    } else {
      toast({ title: describeError(res), variant: "destructive" });
    }
  };

  const outcomeKey = session.transfer_outcome ? aiKey(`ai.out.${session.transfer_outcome}`) : null;
  const hasText = (session.transcript?.length ?? 0) > 0;
  return (
    <div className="space-y-3 rounded-lg border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Bot className="h-4 w-4" /> {t("ai.session.title")}
        </span>
        <Badge variant="secondary">{t(aiKey(`ai.by.${session.handled_by}`))}</Badge>
        {session.escalation_department && <Badge variant="outline">{t(aiKey(`ai.dept.${session.escalation_department}`))}</Badge>}
        <span className="text-xs text-muted-foreground">{t("ai.session.turns", { count: session.turns })}</span>
        {session.provider_errors > 0 && <span className="text-xs text-amber-700">{t("ai.session.errors", { count: session.provider_errors })}</span>}
      </div>
      {outcomeKey && <p className="text-sm">{t(outcomeKey)}</p>}
      {session.escalation_reason && (
        <p className="text-sm">
          <span className="font-medium">{t("ai.hc.reason")}: </span>
          {session.escalation_reason}
        </p>
      )}
      <SummaryLines summary={session.summary} />
      {session.tickets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{t("ai.session.tickets")}:</span>
          {session.tickets.map((tk) => (
            <Link key={tk.id} to="/call-center/tickets" className="font-mono text-primary underline-offset-2 hover:underline">{tk.reference}</Link>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{session.consent_status ? t(aiKey(`ai.consent.${session.consent_status}`)) : ""}</p>
      {hasText && (
        <div>
          <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary" onClick={() => setShowTranscript((v) => !v)}>
            <ChevronDown className={`h-4 w-4 transition-transform ${showTranscript ? "rotate-180" : ""}`} /> {t("ai.session.transcript")}
          </button>
          {showTranscript && (
            <ol className="mt-2 space-y-1.5 text-sm">
              {session.transcript!.map((turn, i) => (
                <li key={i}>
                  <span className="font-medium">{turn.role === "user" ? t("ai.hc.caller") : t("ai.hc.assistant")}: </span>
                  {turn.text}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {isCallCenterAdmin(user) && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-red-700" onClick={() => void removeData()}>
          <Trash2 className="h-3.5 w-3.5" /> {t("ai.session.delete")}
        </Button>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import { aiAgentApi, type OpeningPreview as Opening } from "@/services/aiAgentApi";

/** What a caller hears first, in order. Two of the three parts are added by the system, so they are shown here instead of being a surprise. */
export function OpeningPreview({ agentId, refreshKey }: { agentId: string; refreshKey?: string | number }) {
  const { t } = useLanguage();
  const [opening, setOpening] = useState<Opening | null>(null);

  useEffect(() => {
    let alive = true;
    aiAgentApi.agents.opening(agentId).then((r) => alive && setOpening(r.success && r.data ? r.data : null)).catch(() => alive && setOpening(null));
    return () => { alive = false; };
  }, [agentId, refreshKey]);

  if (!opening) return null;
  const rows: Array<{ label: string; text: string; hint: string }> = [
    { label: t(aiKey("ai.opening.notice")), text: opening.notice, hint: t(aiKey("ai.opening.notice_hint")) },
    { label: t(aiKey("ai.opening.disclosure")), text: opening.disclosure, hint: t(aiKey("ai.opening.disclosure_hint")) },
    { label: t(aiKey("ai.opening.greeting")), text: opening.greeting, hint: t(aiKey("ai.opening.greeting_hint")) },
  ].filter((r) => r.text);
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium">{t(aiKey("ai.opening.title"))}</p>
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.label} className="rounded-md border border-border bg-muted/40 p-2 text-sm">
              <p className="text-xs font-medium text-muted-foreground">{i + 1}. {r.label} <span className="font-normal">— {r.hint}</span></p>
              <p>“{r.text}”</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">{t(aiKey("ai.opening.saved_note"))}</p>
      </CardContent>
    </Card>
  );
}

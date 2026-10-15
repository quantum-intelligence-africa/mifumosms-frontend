import { Bot } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import type { AiHandoffPacket, HandoffSummary } from "@/services/aiAgentApi";

const FIELDS: Array<[keyof HandoffSummary, string]> = [
  ["why_called", "ai.hc.why_called"],
  ["needs", "ai.hc.needs"],
  ["explained", "ai.hc.explained"],
  ["unresolved", "ai.hc.unresolved"],
  ["next_steps", "ai.hc.next_steps"],
];

/** The summary lines a person needs before picking the call up. Renders only the lines that have content. */
export function SummaryLines({ summary }: { summary: HandoffSummary }) {
  const { t } = useLanguage();
  const shown = FIELDS.filter(([key]) => summary[key]);
  if (shown.length === 0) return null;
  return (
    <dl className="space-y-1.5 text-sm">
      {shown.map(([key, label]) => (
        <div key={key}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(aiKey(label))}</dt>
          <dd className="text-foreground">{summary[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Shown over a ringing call that the AI assistant handled first: why, a summary, and the last few exchanges. */
export function AiHandoffCard({ packet }: { packet: AiHandoffPacket }) {
  const { t } = useLanguage();
  const dept = packet.department ? t(aiKey(`ai.dept.${packet.department}`)) : "";
  const hasSummary = FIELDS.some(([key]) => packet.summary?.[key]);
  return (
    <div className="space-y-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-50">
      <p className="flex items-center gap-1.5 font-medium">
        <Bot className="h-4 w-4 shrink-0" /> {t("ai.hc.title")}
      </p>
      {dept && <p className="text-xs text-sky-800 dark:text-sky-200">{t("ai.hc.department", { dept })}</p>}
      {packet.reason && (
        <p>
          <span className="font-medium">{t("ai.hc.reason")}: </span>
          {packet.reason}
        </p>
      )}
      {hasSummary ? <SummaryLines summary={packet.summary} /> : <p className="text-xs text-sky-800 dark:text-sky-200">{t("ai.hc.pending")}</p>}
      {packet.last_turns.length > 0 && (
        <div className="space-y-1 border-t border-sky-200 pt-2 dark:border-sky-900">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-800 dark:text-sky-200">{t("ai.hc.recent")}</p>
          {packet.last_turns.slice(-3).map((turn, i) => (
            <p key={i} className="line-clamp-2 text-xs">
              <span className="font-medium">{turn.role === "user" ? t("ai.hc.caller") : t("ai.hc.assistant")}: </span>
              {turn.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

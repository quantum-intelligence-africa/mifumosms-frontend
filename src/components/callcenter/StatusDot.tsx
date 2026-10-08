import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { AgentStatus } from "@/services/callCenterApi";

/** One colour per availability state, used everywhere an agent's status shows. */
const STATUS_STYLES: Record<AgentStatus, { dot: string; text: string }> = {
  available: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  busy: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  away: { dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
  offline: { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-400" },
  dnd: { dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  acw: { dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-400" },
};

export function StatusDot({ status, className }: { status: AgentStatus; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", STATUS_STYLES[status].dot, className)} />;
}

export function StatusLabel({ status, className }: { status: AgentStatus; className?: string }) {
  const { t } = useLanguage();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", STATUS_STYLES[status].text, className)}>
      <StatusDot status={status} />
      {t(`cc.status.${status}` as const)}
    </span>
  );
}

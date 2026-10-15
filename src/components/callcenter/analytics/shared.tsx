// Small pieces every analytics section uses: the colour for each outcome (the same everywhere), number formatting, and a
// card that knows how to show loading, error and empty states so no section can silently render nothing.
import type { ReactNode } from "react";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { appLocale } from "@/utils/appLocale";

/** One colour per outcome, used by every chart, badge and legend so "missed" is always the same red. */
export const OUTCOME_COLORS: Record<string, string> = {
  answered: "#16a34a",
  missed: "#dc2626",
  abandoned: "#f43f5e",
  voicemail: "#8b5cf6",
  rejected: "#ec4899",
  busy: "#eab308",
  cancelled: "#94a3b8",
  failed: "#f97316",
  in_progress: "#0ea5e9",
  unresolved: "#d97706",
  incoming: "#2563eb",
  outgoing: "#7c3aed",
};

export const colorFor = (key: string) => OUTCOME_COLORS[key] ?? "#64748b";

export function fmtSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const s = Math.round(value);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export const fmtPct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

export const fmtNum = (value: number | null | undefined) => (value === null || value === undefined ? "—" : value.toLocaleString(appLocale()));

export function fmtDateTime(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" }) : "—";
}

/** "+12%" / "-3.5 pts" with an arrow. ``goodWhenUp`` flips the colour for metrics where lower is better (missed calls). */
export function Change({ value, points = false, goodWhenUp = true }: { value: number | null | undefined; points?: boolean; goodWhenUp?: boolean }) {
  const { t } = useLanguage();
  if (value === null || value === undefined) {
    return <span className="text-[11px] text-muted-foreground">{t("an.no_comparison")}</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const good = flat ? null : value > 0 === goodWhenUp;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = flat ? "text-muted-foreground" : good ? "text-green-600" : "text-red-600";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}
      {value}
      {points ? ` ${t("an.pts")}` : "%"} <span className="font-normal text-muted-foreground">{t("an.vs_previous")}</span>
    </span>
  );
}

interface PanelProps {
  title: string;
  hint?: string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyText?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A card that always shows something honest: skeletons while loading, the error with a retry, or an empty message. */
export function Panel({ title, hint, loading, error, onRetry, empty, emptyText, actions, className, children }: PanelProps) {
  const { t } = useLanguage();
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-sm">{title}</CardTitle>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error.message || t("an.load_failed")}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {t("common.try_again")}
              </Button>
            )}
          </div>
        ) : empty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyText ?? t("an.no_data")}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export const OUTCOME_KEYS = ["answered", "missed", "voicemail", "abandoned", "rejected", "busy", "cancelled", "failed", "in_progress"] as const;

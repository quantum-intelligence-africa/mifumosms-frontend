import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useWhatsAppCloud,
  type WAMessageTemplate,
  type WATemplateComponent,
  type WATemplateStatus,
} from "@/hooks/useWhatsAppCloud";

// ─── Status presentation ──────────────────────────────────────────────────────
// Meta returns PENDING / APPROVED / REJECTED / DISABLED (older wrappers used
// PENDING_REVIEW). We normalise PENDING_REVIEW → PENDING for display.

type DisplayStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";

const normalizeStatus = (s: WATemplateStatus): DisplayStatus =>
  s === "PENDING_REVIEW" ? "PENDING" : (s as DisplayStatus);

const STATUS_META: Record<
  DisplayStatus,
  { label: string; badge: string; Icon: typeof Clock }
> = {
  PENDING: {
    label: "Pending review",
    badge: "bg-amber-500 hover:bg-amber-500 text-white",
    Icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-emerald-600 hover:bg-emerald-600 text-white",
    Icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-red-600 hover:bg-red-600 text-white",
    Icon: XCircle,
  },
  DISABLED: {
    label: "Disabled",
    badge: "bg-foreground/50 hover:bg-foreground/50 text-white",
    Icon: AlertCircle,
  },
};

const componentOf = (
  tpl: WAMessageTemplate,
  type: WATemplateComponent["type"],
): WATemplateComponent | undefined => tpl.components?.find((c) => c.type === type);

const bodyTextOf = (tpl: WAMessageTemplate): string =>
  componentOf(tpl, "BODY")?.text ?? "";

const headerSummaryOf = (tpl: WAMessageTemplate): string | undefined => {
  const h = componentOf(tpl, "HEADER");
  if (!h) return undefined;
  if (h.format === "TEXT") return h.text;
  return h.format ? `${h.format} media` : undefined;
};

// Humanise Meta's SCREAMING_SNAKE rejection reasons ("INVALID_FORMAT" → "Invalid format").
const prettyReason = (reason?: string): string | undefined => {
  if (!reason || reason.toUpperCase() === "NONE") return undefined;
  return reason
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

// ─── Component ────────────────────────────────────────────────────────────────

interface MetaTemplateStatusProps {
  waAccountId: string;
}

type StatusFilter = "ALL" | DisplayStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export function MetaTemplateStatus({ waAccountId }: MetaTemplateStatusProps) {
  const { getMessageTemplates } = useWhatsAppCloud();

  const [templates, setTemplates] = useState<WAMessageTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const loadedRef = useRef(false);

  // ── Fetch ALL templates (every status) so submissions can be tracked from
  //    PENDING through APPROVED / REJECTED. Meta is the source of truth. ──────
  const sync = useCallback(async () => {
    setSyncing(true);
    setLoadError(null);
    try {
      const res = await getMessageTemplates(waAccountId || undefined, { limit: 200 });
      const all = res.data?.graph?.data ?? [];
      // Newest first isn't guaranteed by Meta; keep insertion order but float
      // pending to the top so freshly-submitted templates are easy to watch.
      const order: Record<DisplayStatus, number> = {
        PENDING: 0,
        REJECTED: 1,
        APPROVED: 2,
        DISABLED: 3,
      };
      const sorted = [...all].sort(
        (a, b) => order[normalizeStatus(a.status)] - order[normalizeStatus(b.status)],
      );
      setTemplates(sorted);
      setSyncedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setSyncing(false);
    }
  }, [getMessageTemplates, waAccountId]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void sync();
  }, [sync]);

  // ── Auto-refresh while anything is still pending, so "waiting for approval"
  //    resolves on its own without the user clicking Refresh. ────────────────
  const hasPending = useMemo(
    () => templates.some((t) => normalizeStatus(t.status) === "PENDING"),
    [templates],
  );
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => void sync(), 30_000);
    return () => clearInterval(id);
  }, [hasPending, sync]);

  // ── Counts for the filter chips ───────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<DisplayStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      DISABLED: 0,
    };
    for (const t of templates) c[normalizeStatus(t.status)] += 1;
    return c;
  }, [templates]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (filter !== "ALL" && normalizeStatus(t.status) !== filter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toString().toLowerCase().includes(q) ||
        bodyTextOf(t).toLowerCase().includes(q)
      );
    });
  }, [templates, filter, search]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-1">
      {/* Header row + sync */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Submitted to Meta
          </Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Track approval of templates you submitted. Pending entries refresh automatically every
            30s until Meta decides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncedAt && (
            <span className="text-[10.5px] text-muted-foreground hidden sm:inline">
              Synced {syncedAt}
            </span>
          )}
          <Button
            onClick={() => void sync()}
            disabled={syncing}
            variant="outline"
            className="h-9 gap-1.5"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          const count =
            key === "ALL" ? templates.length : counts[key as DisplayStatus];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={[
                "h-8 px-3 rounded-full text-[12px] font-semibold transition-colors flex items-center gap-1.5",
                active
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-foreground/[0.06] text-foreground/70 hover:bg-foreground/[0.1]",
              ].join(" ")}
            >
              {label}
              <span
                className={[
                  "text-[10.5px] tabular-nums px-1.5 rounded-full",
                  active ? "bg-white/25" : "bg-foreground/10",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, body…"
            className="h-8 pl-8 text-[12.5px] w-52"
          />
        </div>
      </div>

      {/* List */}
      {syncing && templates.length === 0 ? (
        <div className="flex items-center justify-center py-12 gap-2 text-foreground/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[13px]">Loading your submitted templates…</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground max-w-xs">
            {templates.length === 0
              ? "You haven't submitted any templates yet. Use “Submit to Meta” to create one."
              : "No templates match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((t) => {
            const ds = normalizeStatus(t.status);
            const meta = STATUS_META[ds];
            const { Icon } = meta;
            const reason = prettyReason(t.rejected_reason);
            const header = headerSummaryOf(t);
            const body = bodyTextOf(t);
            return (
              <div
                key={`${t.id}-${t.language}`}
                className="rounded-xl border border-border/60 bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-semibold text-[12.5px] truncate">
                      {t.name}
                    </span>
                    <Badge variant="secondary" className="text-[9.5px] h-4 px-1.5 uppercase">
                      {t.language || "—"}
                    </Badge>
                    <Badge variant="secondary" className="text-[9.5px] h-4 px-1.5">
                      {t.category || "—"}
                    </Badge>
                  </div>
                  <Badge className={`text-[9.5px] h-5 px-2 gap-1 shrink-0 ${meta.badge}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </Badge>
                </div>

                {header && (
                  <div className="text-[11.5px]">
                    <span className="font-semibold text-foreground/45 mr-1.5">HEADER</span>
                    <span className="font-mono text-foreground/75 break-words">{header}</span>
                  </div>
                )}
                {body && (
                  <p className="text-[11.5px] text-foreground/75 font-mono whitespace-pre-wrap break-words line-clamp-3">
                    {body}
                  </p>
                )}

                {ds === "REJECTED" && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-red-700 dark:text-red-300">
                      Rejected by Meta{reason ? `: ${reason}` : ""}. Edit the template and resubmit.
                    </span>
                  </div>
                )}
                {ds === "PENDING" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Awaiting Meta review — usually within minutes, up to 24h.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MetaTemplateStatus;

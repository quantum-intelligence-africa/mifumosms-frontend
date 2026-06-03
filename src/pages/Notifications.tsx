import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CheckCircle,
  MessageSquare,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { PushSettingsCard } from "@/components/pwa/PushSettingsCard";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  time_ago: string;
  is_live: boolean;
  metadata?: Record<string, unknown>;
};

type FilterKey = "all" | "messages" | "campaigns" | "contacts";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "messages", label: "Messages" },
  { key: "campaigns", label: "Campaigns" },
  { key: "contacts", label: "Contacts" },
];

interface TypeStyle {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

function getTypeStyle(type: string): TypeStyle {
  if (type.includes("message") || type.includes("reply")) {
    return {
      Icon: MessageSquare,
      iconBg: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-600 dark:text-blue-400",
    };
  }
  if (type.includes("campaign")) {
    return {
      Icon: Send,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (type.includes("contact")) {
    return {
      Icon: Users,
      iconBg: "bg-amber-100 dark:bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
    };
  }
  if (type.includes("template") || type.includes("approval")) {
    return {
      Icon: CheckCircle,
      iconBg: "bg-violet-100 dark:bg-violet-500/15",
      iconColor: "text-violet-600 dark:text-violet-400",
    };
  }
  return {
    Icon: Activity,
    iconBg: "bg-muted",
    iconColor: "text-foreground/60 dark:text-foreground/55",
  };
}

function getStatusTone(type: string): string {
  if (type.includes("failed") || type.includes("error")) {
    return "text-destructive bg-destructive/10";
  }
  if (type.includes("sent") || type.includes("completed") || type.includes("delivered")) {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15";
  }
  if (type.includes("pending")) {
    return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15";
  }
  return "text-foreground/60 bg-muted";
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

type DateBucket = "Today" | "Yesterday" | "Earlier";

function bucketFor(timestamp: string): DateBucket {
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return "Earlier";
  const today = startOfDay(new Date());
  const dayMs = 24 * 60 * 60 * 1000;
  if (ts >= today) return "Today";
  if (ts >= today - dayMs) return "Yesterday";
  return "Earlier";
}

function matchesFilter(item: ActivityItem, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const t = (item.type || "").toLowerCase();
  if (filter === "messages") return t.includes("message") || t.includes("reply") || t.includes("sms");
  if (filter === "campaigns") return t.includes("campaign");
  if (filter === "contacts") return t.includes("contact");
  return true;
}

const NotificationsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { recentActivity, isLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const activities: ActivityItem[] = useMemo(() => {
    if (!recentActivity) return [];
    return [...(recentActivity as ActivityItem[])]
      .filter((a) => !hiddenIds.has(a.id))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [recentActivity, hiddenIds]);

  const filtered: ActivityItem[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return activities.filter(
      (a) =>
        matchesFilter(a, activeFilter) &&
        (term === "" ||
          a.title.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term)),
    );
  }, [activities, searchTerm, activeFilter]);

  const grouped = useMemo(() => {
    const buckets: Record<DateBucket, ActivityItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    for (const item of filtered) {
      buckets[bucketFor(item.timestamp)].push(item);
    }
    return buckets;
  }, [filtered]);

  const removeActivity = (id: string) => {
    setHiddenIds((s) => new Set(s).add(id));
    setSelectedActivity((prev) => (prev?.id === id ? null : prev));
  };

  const orderedBuckets: DateBucket[] = ["Today", "Yesterday", "Earlier"];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto w-full">
            {/* Desktop header (mobile header lives in the top bar context) */}
            <div className="hidden md:block mb-4">
              <h1 className="font-heading text-xl lg:text-2xl font-bold text-foreground leading-tight">
                Notifications
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                Activity across messages, campaigns and contacts.
              </p>
            </div>

            {/* Mobile: simple count line */}
            <div className="md:hidden mb-3">
              <p className="text-[13px] text-foreground/60">
                {filtered.length === 0 ? "Nothing to show" : `${filtered.length} notification${filtered.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {/* Push notification settings */}
            <div className="mb-4">
              <PushSettingsCard />
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications"
                className="h-10 pl-9 pr-9 text-sm rounded-xl bg-card dark:bg-card/95 border-border/70 dark:border-border/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-full text-foreground/50 active:bg-accent/60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div
              className="flex gap-1.5 overflow-x-auto pb-1.5 mb-3 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTERS.map((f) => {
                const active = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    className={[
                      "flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold tracking-tight",
                      "transition-colors duration-150",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-card dark:bg-card/95 border border-border/70 dark:border-border/50 text-foreground/70 dark:text-foreground/65 active:bg-accent/60",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            {isLoading ? (
              <SkeletonList />
            ) : filtered.length === 0 ? (
              <EmptyState
                hasFilter={activeFilter !== "all" || searchTerm.length > 0}
                onClear={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
              />
            ) : (
              <div className="space-y-4">
                {orderedBuckets.map((bucket) => {
                  const items = grouped[bucket];
                  if (items.length === 0) return null;
                  return (
                    <section key={bucket}>
                      <p className="px-2.5 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-foreground/45 dark:text-foreground/40">
                        {bucket}
                      </p>
                      <div className="rounded-2xl bg-card dark:bg-card/95 border border-border/70 dark:border-border/40 overflow-hidden">
                        {items.map((item, idx) => (
                          <NotificationRow
                            key={item.id}
                            item={item}
                            isLast={idx === items.length - 1}
                            onOpen={() => setSelectedActivity(item)}
                            onDelete={() => removeActivity(item.id)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail sheet (mobile-friendly modal) */}
      {selectedActivity && (
        <DetailSheet
          item={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onDelete={() => removeActivity(selectedActivity.id)}
        />
      )}
    </div>
  );
};

interface RowProps {
  item: ActivityItem;
  isLast: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function NotificationRow({ item, isLast, onOpen, onDelete }: RowProps) {
  const style = getTypeStyle(item.type);
  const Icon = style.Icon;
  const date = new Date(item.timestamp);
  const timeLabel =
    item.time_ago ||
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div
      className={[
        "flex items-start gap-3 px-3.5 py-3 active:bg-accent/60 dark:active:bg-accent/40 transition-colors",
        !isLast ? "border-b border-border/40 dark:border-border/25" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-start gap-3 min-w-0 text-left"
      >
        <div
          className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-[18px] h-[18px] ${style.iconColor}`} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="flex-1 min-w-0 text-[14px] font-semibold text-foreground dark:text-foreground leading-tight truncate">
              {item.title}
            </p>
            <span className="flex-shrink-0 text-[11px] text-foreground/50 dark:text-foreground/45 tabular-nums">
              {timeLabel}
            </span>
          </div>
          <p className="text-[12.5px] text-foreground/60 dark:text-foreground/55 leading-snug mt-0.5 line-clamp-2">
            {item.description}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Dismiss"
        className="flex-shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/40 dark:text-foreground/35 active:bg-destructive/10 active:text-destructive transition-colors -mr-1"
      >
        <X className="w-4 h-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2].map((g) => (
        <section key={g}>
          <Skeleton className="h-3 w-16 mb-2 ml-2.5" />
          <div className="rounded-2xl bg-card dark:bg-card/95 border border-border/70 dark:border-border/40 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3.5 py-3 border-b last:border-b-0 border-border/40 dark:border-border/25"
              >
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  hasFilter: boolean;
  onClear: () => void;
}

function EmptyState({ hasFilter, onClear }: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-card dark:bg-card/95 border border-border/70 dark:border-border/40 p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Bell className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground dark:text-foreground">
        {hasFilter ? "No matches" : "You're all caught up"}
      </h3>
      <p className="text-[12.5px] text-foreground/60 dark:text-foreground/55 leading-snug mt-1 max-w-xs mx-auto">
        {hasFilter
          ? "Try a different filter or clear your search to see everything."
          : "New activity from messages, campaigns and contacts will show up here."}
      </p>
      {hasFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="mt-4 h-9 px-4 text-xs font-semibold"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

interface DetailSheetProps {
  item: ActivityItem;
  onClose: () => void;
  onDelete: () => void;
}

function DetailSheet({ item, onClose, onDelete }: DetailSheetProps) {
  const style = getTypeStyle(item.type);
  const Icon = style.Icon;
  const statusTone = getStatusTone(item.type);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      <div
        className="relative w-full sm:max-w-md bg-card dark:bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/70 dark:border-border/40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle on mobile */}
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-foreground/15 dark:bg-foreground/20" />
        </div>
        <div className="flex items-start gap-3 px-4 pt-3 pb-1">
          <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${style.iconColor}`} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-foreground dark:text-foreground leading-tight">
              {item.title}
            </h3>
            <span
              className={`inline-block mt-1 text-[10.5px] font-bold tracking-wide px-2 py-0.5 rounded-full ${statusTone}`}
            >
              {item.type.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full text-foreground/70 active:bg-accent/60 transition-colors -mr-1"
          >
            <X className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="px-4 pt-2 pb-4 space-y-3">
          <p className="text-[13.5px] text-foreground/80 dark:text-foreground/75 leading-relaxed">
            {item.description}
          </p>

          <div className="rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/60 dark:border-border/30 divide-y divide-border/40 dark:divide-border/25 text-[12.5px]">
            <Field label="Type" value={item.type.replace(/_/g, " ").toUpperCase()} />
            <Field
              label="Time"
              value={new Date(item.timestamp).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <Field label="Time ago" value={item.time_ago || "—"} />
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2 border-t border-border/60 dark:border-border/30 pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 text-sm font-semibold"
          >
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex-1 h-10 text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-foreground/55 dark:text-foreground/50">{label}</span>
      <span className="text-foreground dark:text-foreground font-medium text-right truncate">
        {value}
      </span>
    </div>
  );
}

export default NotificationsPage;

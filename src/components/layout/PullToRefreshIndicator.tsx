import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  /** Current pull distance (px). */
  pulled: number;
  /** True while the refresh is running. */
  refreshing: boolean;
  /** Pull distance needed to trigger the refresh. */
  threshold: number;
}

/**
 * Visual indicator for the pull-to-refresh gesture. A floating pill at the top
 * of the viewport that follows the user's finger, then locks while refreshing.
 * Mobile-only (the gesture itself is touch-only) and safe-area-aware.
 */
export function PullToRefreshIndicator({
  pulled,
  refreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  if (!refreshing && pulled === 0) return null;
  const progress = Math.min(pulled / threshold, 1);
  // Slide the indicator down with the finger, clamped a bit past the threshold.
  const travel = Math.min(pulled, threshold + 30);
  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-[150] pointer-events-none flex justify-center"
      style={{
        transform: `translateY(${Math.max(0, travel - 24)}px)`,
        paddingTop: "env(safe-area-inset-top)",
        opacity: refreshing ? 1 : Math.min(progress * 1.25, 1),
        transition: refreshing
          ? "transform 200ms ease-out"
          : "opacity 80ms ease-out",
      }}
      aria-hidden={!refreshing}
    >
      <div className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
        <RefreshCw
          className={`w-4 h-4 ${
            refreshing ? "animate-spin text-primary" : "text-foreground/70"
          }`}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            transition: refreshing ? undefined : "transform 60ms linear",
          }}
          strokeWidth={2.4}
        />
      </div>
    </div>
  );
}

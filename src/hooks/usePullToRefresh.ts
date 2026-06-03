import { useEffect, useRef, useState } from "react";

export interface PullToRefreshState {
  /** Current pull distance in pixels (already damped). */
  pulled: number;
  /** True while the refresh callback is in flight. */
  refreshing: boolean;
  /** Pull distance required to trigger the refresh. */
  threshold: number;
}

interface Options {
  /**
   * Called when the user lifts their finger past the threshold.
   * Default: `window.location.reload()` — the PWA equivalent of the browser's
   * native pull-to-refresh, which is disabled in standalone mode.
   */
  onRefresh?: () => void | Promise<void>;
  /** Pull distance needed to trigger (default 70 px). */
  threshold?: number;
  /** Master switch — caller usually passes `isMobile` here. */
  enabled?: boolean;
}

/**
 * Pull-to-refresh gesture for mobile devices, especially needed in installed
 * PWAs where the browser's native pull-to-refresh is gone.
 *
 * Listens to touch events at the document level and finds the nearest scrollable
 * ancestor (so it works whether the scroll is on `<main>` or on the document).
 * Only engages when the user starts a downward drag while the scroll container
 * is already at the top — otherwise normal scrolling is untouched.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  enabled = true,
}: Options = {}): PullToRefreshState {
  const [pulled, setPulled] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const pulledRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Walk up from the touch target to find the closest scrollable element.
    // Pages here typically scroll inside <main>, but fall back to the document
    // scrolling element so non-shell pages (login, marketing) still work.
    const findScrollEl = (target: EventTarget | null): HTMLElement | null => {
      let el = (target as HTMLElement) ?? null;
      while (el) {
        if (el.tagName === "MAIN") return el;
        const overflowY = getComputedStyle(el).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
          return el;
        }
        el = el.parentElement as HTMLElement;
      }
      return (document.scrollingElement ?? document.documentElement) as HTMLElement | null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      const el = findScrollEl(e.target);
      if (!el || el.scrollTop > 0) {
        startYRef.current = null;
        return;
      }
      scrollElRef.current = el;
      startYRef.current = e.touches[0].clientY;
      pulledRef.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshing) return;
      const el = scrollElRef.current;
      if (!el || el.scrollTop > 0) {
        // User reversed direction and scrolled — abort the gesture cleanly.
        startYRef.current = null;
        if (pulledRef.current !== 0) {
          pulledRef.current = 0;
          setPulled(0);
        }
        return;
      }
      const distance = e.touches[0].clientY - startYRef.current;
      if (distance <= 0) {
        if (pulledRef.current !== 0) {
          pulledRef.current = 0;
          setPulled(0);
        }
        return;
      }
      // Rubber-band: linear up to the threshold, then heavily damped so it
      // feels resistant past the trigger point (native iOS behavior).
      const cap = threshold * 1.5;
      const damped = distance > cap ? cap + (distance - cap) * 0.25 : distance * 0.55;
      pulledRef.current = damped;
      setPulled(damped);
      // Stop the browser from selecting text / triggering its own scroll cues.
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      const finalPull = pulledRef.current;
      startYRef.current = null;
      pulledRef.current = 0;
      if (finalPull >= threshold) {
        setRefreshing(true);
        setPulled(threshold);
        try {
          if (onRefresh) {
            await onRefresh();
            setRefreshing(false);
            setPulled(0);
          } else {
            // Default: reload. The page unmounts before we'd run cleanup.
            window.location.reload();
          }
        } catch {
          setRefreshing(false);
          setPulled(0);
        }
      } else {
        setPulled(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, onRefresh, refreshing, threshold]);

  return { pulled, refreshing, threshold };
}

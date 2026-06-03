import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageMeta, type TabKey } from "@/hooks/usePageMeta";

const TAB_ORDER: { key: TabKey; href: string }[] = [
  { key: "home", href: "/dashboard" },
  { key: "sender", href: "/messaging/sender-names" },
  { key: "send", href: "/send" },
  { key: "contacts", href: "/messaging/contacts" },
  { key: "settings", href: "/settings" },
];

/**
 * Distance (px) the finger must travel horizontally before a swipe counts.
 * Set high enough that incidental drags during vertical scrolling don't trigger nav.
 */
const SWIPE_THRESHOLD = 70;

/** Reject the swipe if vertical travel was larger than this (it's a scroll). */
const VERTICAL_CANCEL = 60;

/** CSS selector for elements whose touches should never trigger tab navigation. */
const IGNORE_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  "[data-no-swipe]",
  // Common 3rd-party swipeable containers.
  ".embla",
  ".embla__viewport",
  ".swiper",
  ".swiper-container",
  ".swiper-wrapper",
  // Mobile sheets/menus.
  '[role="dialog"]',
  "[data-radix-portal]",
].join(", ");

/**
 * Listens for left/right swipes on mobile and navigates between the 5 primary
 * tabs (home → sender → send → contacts → settings). No-op on:
 *  - desktop viewports
 *  - public routes (login etc.)
 *  - routes that aren't one of the 5 tabs (e.g. Campaigns, WhatsApp detail).
 */
export function useTabSwipeNavigation() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { tab, isPublicRoute } = usePageMeta();

  useEffect(() => {
    if (!isMobile || isPublicRoute || tab === null) return;

    const currentIdx = TAB_ORDER.findIndex((t) => t.key === tab);
    if (currentIdx === -1) return;

    let startX = 0;
    let startY = 0;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      // Cancel on multi-touch (pinch zoom, etc.)
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.closest && target.closest(IGNORE_SELECTOR)) {
        active = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      active = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dy) > VERTICAL_CANCEL) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0) {
        const next = TAB_ORDER[currentIdx + 1];
        if (next) navigate(next.href);
      } else {
        const prev = TAB_ORDER[currentIdx - 1];
        if (prev) navigate(prev.href);
      }
    };

    const onTouchCancel = () => {
      active = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isMobile, isPublicRoute, tab, navigate]);
}

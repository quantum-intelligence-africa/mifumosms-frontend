import { useEffect, type RefObject } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Cycles through sub-tabs when the user swipes horizontally on `containerRef`.
 * At the edges (first / last tab), an extra swipe in the outward direction
 * navigates to `edgePrevHref` / `edgeNextHref` so the gesture spills over to
 * the previous / next page in the app's nav.
 *
 * Listens to touch events so it works on phones, tablets, and any touch-enabled
 * laptop without interfering with mouse interaction on desktops.
 */

const SWIPE_THRESHOLD = 60;
const VERTICAL_CANCEL = 60;

const IGNORE_SELECTOR = [
	"input",
	"textarea",
	"select",
	'[contenteditable="true"]',
	"[data-no-swipe]",
	// Don't hijack swipes inside dialogs or carousels.
	'[role="dialog"]',
	"[data-radix-portal]",
	".embla",
	".embla__viewport",
	".swiper",
	".swiper-container",
	".swiper-wrapper",
].join(", ");

interface UseSubTabSwipeOptions<T extends string> {
	containerRef: RefObject<HTMLElement | null>;
	tabs: readonly T[];
	currentTab: T;
	setTab: (next: T) => void;
	/** App route to navigate to when swiping right while on the first tab. */
	edgePrevHref?: string;
	/** App route to navigate to when swiping left while on the last tab. */
	edgeNextHref?: string;
	/** Disable the listener entirely. Useful for guarding by feature flag. */
	disabled?: boolean;
}

export function useSubTabSwipe<T extends string>({
	containerRef,
	tabs,
	currentTab,
	setTab,
	edgePrevHref,
	edgeNextHref,
	disabled = false,
}: UseSubTabSwipeOptions<T>) {
	const navigate = useNavigate();

	useEffect(() => {
		if (disabled) return;
		const el = containerRef.current;
		if (!el) return;

		const idx = tabs.indexOf(currentTab);
		if (idx === -1) return;

		let startX = 0;
		let startY = 0;
		let active = false;

		const onTouchStart = (e: TouchEvent) => {
			if (e.touches.length !== 1) {
				active = false;
				return;
			}
			const target = e.target as HTMLElement | null;
			if (target?.closest?.(IGNORE_SELECTOR)) {
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
				// Swiped left → advance.
				if (idx < tabs.length - 1) {
					setTab(tabs[idx + 1]);
				} else if (edgeNextHref) {
					navigate(edgeNextHref);
				}
			} else {
				// Swiped right → go back.
				if (idx > 0) {
					setTab(tabs[idx - 1]);
				} else if (edgePrevHref) {
					navigate(edgePrevHref);
				}
			}
		};

		const onTouchCancel = () => {
			active = false;
		};

		el.addEventListener("touchstart", onTouchStart, { passive: true });
		el.addEventListener("touchend", onTouchEnd, { passive: true });
		el.addEventListener("touchcancel", onTouchCancel, { passive: true });
		return () => {
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchend", onTouchEnd);
			el.removeEventListener("touchcancel", onTouchCancel);
		};
	}, [containerRef, tabs, currentTab, setTab, edgePrevHref, edgeNextHref, disabled, navigate]);
}

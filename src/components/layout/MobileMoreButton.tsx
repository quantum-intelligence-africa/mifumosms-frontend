import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MobileOverflowMenu } from "@/components/layout/MobileOverflowMenu";

/**
 * Floating 3-dot menu trigger for non-home, non-settings pages.
 * Pinned to the top-right corner with safe-area awareness.
 */
export function MobileMoreButton() {
  const [open, setOpen] = useState(false);
  const { tab, isHome, isPublicRoute } = usePageMeta();

  // Home: the colored hero already has its own 3-dot trigger.
  // Settings: explicitly excluded per spec.
  // Public routes (login etc.): no app shell.
  if (isHome || tab === "settings" || isPublicRoute) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More options"
        className={[
          "md:hidden fixed z-[55]",
          "w-10 h-10 inline-flex items-center justify-center",
          "text-foreground/70 dark:text-foreground/65",
          "active:opacity-60 transition-opacity",
        ].join(" ")}
        style={{
          top: "calc(env(safe-area-inset-top) + 10px)",
          right: "calc(env(safe-area-inset-right) + 8px)",
        }}
      >
        <MoreVertical className="w-[22px] h-[22px]" strokeWidth={2.2} />
      </button>

      <MobileOverflowMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

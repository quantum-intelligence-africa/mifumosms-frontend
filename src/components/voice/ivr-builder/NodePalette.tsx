// Right-hand draggable node palette. Every node type except `start` (there's
// ever only one Start node, auto-created per flow) is listed here. Dragging
// an item sets `dataTransfer` with the node type; FlowCanvas's onDrop reads
// it back and creates the node at the drop position.
import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NODE_META, PALETTE_NODE_TYPES } from "./nodeMeta";
import type { IvrNodeType } from "./types";

export const IVR_DRAG_DATA_FORMAT = "application/ivr-node-type";

// Lazy-init from the real window width at first paint (not useIsMobile's
// async first render, which starts undefined) so a phone never flashes the
// expanded 240px panel before collapsing.
function isNarrowViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

export function NodePalette() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() => isNarrowViewport());

  // If the viewport crosses the mobile breakpoint (e.g. rotation, resize),
  // snap back to the closed default rather than leaving it awkwardly open.
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const onDragStart = (event: React.DragEvent, nodeType: IvrNodeType) => {
    event.dataTransfer.setData(IVR_DRAG_DATA_FORMAT, nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const list = (
    <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
      {PALETTE_NODE_TYPES.map((type) => {
        const meta = NODE_META[type];
        const Icon = meta.icon;
        return (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={cn(
              "flex cursor-grab items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-xs",
              "transition-colors hover:border-primary/50 hover:bg-accent active:cursor-grabbing",
            )}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} strokeWidth={2.2} />
            </div>
            <span className="truncate font-medium text-foreground">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );

  if (collapsed) {
    return (
      <div className="flex w-9 shrink-0 flex-col items-center border-l border-border bg-card py-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(false)} aria-label="Fungua orodha ya visanduku">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // On mobile, expanding renders as a floating overlay (with a dismiss
  // backdrop) instead of a flex sibling — a fixed 240px column would leave
  // almost no room for the canvas on a phone-width screen.
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          aria-label="Funga orodha ya visanduku"
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-40 bg-black/30"
        />
        <div className="fixed inset-y-0 right-0 z-50 flex w-[min(72vw,260px)] flex-col border-l border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
            <h3 className="text-xs font-semibold text-foreground">Visanduku</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed(true)} aria-label="Funga orodha ya visanduku">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {list}
        </div>
      </>
    );
  }

  return (
    <div className="flex w-60 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-xs font-semibold text-foreground">Visanduku</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed(true)} aria-label="Funga orodha ya visanduku">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {list}
    </div>
  );
}

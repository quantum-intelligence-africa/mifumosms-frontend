// Shared visual shell for every IVR node card. Each file in this folder is a
// thin per-type wrapper around this component (icon + title + subtitle +
// output ports differ per type; the card chrome, selection ring, error ring,
// and simulate-highlight ring are identical everywhere).
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNodeData } from "../types";
import type { NodeOutput } from "../nodeMeta";

interface BaseNodeProps {
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  subtitle?: string;
  outputs: NodeOutput[];
  showTarget?: boolean;
  data: AppNodeData;
  selected?: boolean;
}

function BaseNodeImpl({ icon: Icon, iconClass, title, subtitle, outputs, showTarget = true, data, selected }: BaseNodeProps) {
  const hasError = !!data.errorMessages && data.errorMessages.length > 0;
  const isHighlighted = !!data.highlighted;
  const multiPort = outputs.length > 1;

  return (
    <div
      className={cn(
        "relative min-w-[180px] max-w-[220px] rounded-xl border-2 bg-card shadow-sm transition-shadow",
        selected ? "border-primary shadow-md" : "border-border",
        hasError && !selected && "border-destructive/60 bg-destructive/[0.03]",
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary",
      )}
      title={hasError ? data.errorMessages!.join("\n") : undefined}
    >
      {hasError && (
        <span className="absolute -right-2 -top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow">
          {data.errorMessages!.length}
        </span>
      )}

      {showTarget && (
        <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-muted-foreground !border-background" />
      )}

      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted", iconClass)}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {outputs.length === 0 ? (
        <div className="h-2" />
      ) : !multiPort ? (
        <div className="relative h-3">
          <Handle
            type="source"
            position={Position.Bottom}
            id={outputs[0].id}
            className="!w-2.5 !h-2.5 !bg-primary !border-background"
          />
        </div>
      ) : (
        <div className="flex items-center justify-around gap-1 border-t border-border-subtle px-2 pb-2.5 pt-2">
          {outputs.map((out) => (
            <div key={out.id} className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5",
                  out.dotClass?.match(/border-\S+/)?.[0] ?? "border-border",
                )}
              >
                {out.icon && <out.icon className={cn("h-2.5 w-2.5", out.textClass)} strokeWidth={2.4} />}
                <span className={cn("text-[9px] font-medium leading-none", out.textClass)}>{out.label}</span>
              </div>
              <Handle
                type="source"
                position={Position.Bottom}
                id={out.id}
                className={cn("!static !mt-1.5 !h-2.5 !w-2.5 !translate-x-0 !translate-y-0 !border-2", out.dotClass)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const BaseNode = memo(BaseNodeImpl);

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Critical toasts have no auto-dismiss — the user has to acknowledge them by
// clicking the close button. Radix Toast uses a finite duration internally,
// so we pass a very large number that effectively never fires.
const CRITICAL_DURATION = 1000 * 60 * 60 * 24; // 24h — practically forever

function VariantIcon({ variant }: { variant?: string | null }) {
  if (variant === "destructive") return <AlertCircle className="h-5 w-5 shrink-0" />;
  if (variant === "warning") return <AlertTriangle className="h-5 w-5 shrink-0" />;
  if (variant === "success") return <CheckCircle2 className="h-5 w-5 shrink-0" />;
  return null;
}

export function Toaster() {
  const { toasts } = useToast();

  // Any open, critical toast triggers the blocking backdrop. Dismissed/closing
  // ones are excluded so the backdrop drops the moment the user acknowledges.
  const hasOpenCritical = toasts.some((t) => t.critical && t.open !== false);

  return (
    <ToastProvider swipeDirection="right">
      {/* Blocking backdrop for critical toasts.
          z-[139] sits just under the viewport (z-[140]) so the toast itself is
          clickable but the rest of the UI is dimmed and pointer-event blocked. */}
      {hasOpenCritical && (
        <div
          aria-hidden
          className="fixed inset-0 z-[139] bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        />
      )}

      {toasts.map(function ({ id, title, description, action, critical, variant, duration, ...props }) {
        return (
          <Toast
            key={id}
            variant={variant}
            duration={critical ? CRITICAL_DURATION : duration}
            className={cn(
              critical &&
                "border-2 shadow-2xl ring-2 ring-offset-2 ring-offset-background ring-current/20 sm:max-w-[480px]",
            )}
            {...props}
          >
            <div className="flex flex-1 items-start gap-3 min-w-0">
              <VariantIcon variant={variant} />
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose
              className={cn(
                // For critical toasts make the close affordance obvious — it's
                // the only way to dismiss them, so don't hide it on hover.
                critical && "opacity-100 static ml-2 rounded-md border bg-background/10 px-2 py-1 text-xs font-semibold",
              )}
            >
              {critical ? "OK" : undefined}
            </ToastClose>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

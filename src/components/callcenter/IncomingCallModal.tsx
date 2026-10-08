import { Loader2, Phone, PhoneIncoming, PhoneOff, Smartphone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useCallCenter } from "@/contexts/CallCenterContext";

function ago(iso: string | null, t: ReturnType<typeof useLanguage>["t"]): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t("cc.incoming.today");
  if (days === 1) return t("cc.incoming.yesterday");
  return t("cc.incoming.days_ago", { days });
}

/**
 * Pops over whatever page the agent is on. It cannot be dismissed by clicking
 * outside or pressing Escape — a ringing call needs an explicit answer/decline
 * — and it never shows more about the caller than the organization's own
 * contacts and call history (the backend only ever looks those up per tenant).
 */
export function IncomingCallModal() {
  const { incoming, answer, decline } = useCallCenter();
  const { t } = useLanguage();
  if (!incoming) return null;

  const { caller } = incoming;
  const known = !!caller?.known;
  const isHandset = incoming.audioMode === "handset";
  const number = incoming.fromNumber || caller?.number || "";

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // The dialog's own close button would hide a ringing call without declining it.
        hideCloseButton
      >
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950">
            <PhoneIncoming className="h-8 w-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("cc.incoming.title")}</p>
          <DialogTitle className="text-2xl">{known ? caller!.name : t("cc.incoming.unknown_caller")}</DialogTitle>
          <DialogDescription className="font-mono text-base text-foreground">{number}</DialogDescription>
          {incoming.teamName && (
            <span className="mt-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">{incoming.teamName}</span>
          )}
        </DialogHeader>

        {incoming.transferredFrom && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-100">
            <p className="font-medium">{t("cc.incoming.transferred_from", { name: incoming.transferredFrom })}</p>
            {incoming.transferNote && <p className="mt-0.5 text-violet-800/90 dark:text-violet-200/90">“{incoming.transferNote}”</p>}
          </div>
        )}

        {caller && (
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            {known ? (
              <>
                {caller.email && <p className="truncate text-muted-foreground">{caller.email}</p>}
                {caller.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {caller.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <UserRound className="h-4 w-4" /> {t("cc.incoming.not_in_contacts")}
              </p>
            )}
            <p className="text-muted-foreground">
              {caller.previous_calls > 0
                ? t("cc.incoming.previous_calls", { count: caller.previous_calls, when: ago(caller.last_call_at, t) })
                : t("cc.incoming.first_call")}
            </p>
            {caller.last_note && <p className="line-clamp-3 text-foreground/80">“{caller.last_note}”</p>}
          </div>
        )}

        {isHandset ? (
          <div className="space-y-2">
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" /> {t("cc.incoming.answer_on_phone")}
            </p>
            <Button variant="outline" className="w-full" onClick={decline}>{t("cc.incoming.dismiss")}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" size="lg" onClick={decline} className="h-14 gap-2 border-red-200 text-red-700 hover:bg-red-50">
              <PhoneOff className="h-5 w-5" /> {t("cc.incoming.decline")}
            </Button>
            <Button size="lg" onClick={answer} disabled={!incoming.ringing} className="h-14 gap-2 bg-green-600 text-white hover:bg-green-700">
              {incoming.ringing ? <Phone className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />} {t("cc.incoming.answer")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

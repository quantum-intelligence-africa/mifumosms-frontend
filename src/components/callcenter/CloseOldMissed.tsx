// Close the backlog of old missed calls nobody followed up, so the counts (and the daily report) mean something again.
// Always previews first: it shows how many calls and customers would be closed, and nothing changes until the admin confirms.
import { useCallback, useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { callCenterApi, describeError } from "@/services/callCenterApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    open: "Funga simu za zamani",
    title: "Funga simu za zamani ambazo hazikufuatiliwa",
    desc: "Simu zilizokosekana ambazo hazijafungwa hurundikana na kufanya takwimu zionekane kubwa kuliko ukweli. Hapa unazifunga kwa pamoja. Hakuna kinachofutwa, na kila moja inapata maelezo kwamba ilifungwa kwa pamoja.",
    older: "Zilizo za zaidi ya siku",
    days: "siku",
    how: "Zifunge kama",
    unresolved: "Hazijatatuliwa (hakuna aliyezifuatilia)",
    resolved: "Zimetatuliwa (zilishughulikiwa nje ya mfumo)",
    preview: (calls: number, customers: number) => `Zitafungwa simu ${calls} za wateja ${customers}.`,
    none: "Hakuna simu zinazostahili kufungwa kwa vigezo hivi.",
    keep: "Simu mpya zaidi, na simu zilizopangiwa kupigiwa baadaye, hazibadilishwi.",
    cancel: "Ghairi",
    confirm: (calls: number) => `Funga simu ${calls}`,
    done: (n: number) => `Simu ${n} zimefungwa.`,
    failed: "Imeshindikana kufunga.",
  },
  en: {
    open: "Close old missed calls",
    title: "Close old missed calls nobody followed up",
    desc: "Missed calls that are never closed pile up and make the numbers look bigger than the truth. Close them together here. Nothing is deleted, and each one gets a note saying it was closed in bulk.",
    older: "Older than",
    days: "days",
    how: "Close them as",
    unresolved: "Unresolved (nobody followed them up)",
    resolved: "Resolved (handled outside the app)",
    preview: (calls: number, customers: number) => `${calls} missed ${calls === 1 ? "call" : "calls"} from ${customers} ${customers === 1 ? "customer" : "customers"} will be closed.`,
    none: "No missed calls match, with these settings.",
    keep: "Newer calls, and callbacks scheduled for later, are never changed.",
    cancel: "Cancel",
    confirm: (calls: number) => `Close ${calls} ${calls === 1 ? "call" : "calls"}`,
    done: (n: number) => `${n} missed ${n === 1 ? "call" : "calls"} closed.`,
    failed: "Could not close them.",
  },
} as const;

export function CloseOldMissed({ onDone }: { onDone: () => void }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState<"unresolved" | "resolved">("unresolved");
  const [preview, setPreview] = useState<{ calls: number; customers: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setPreview(null);
    const res = await callCenterApi.missed.closeOld({ older_than_days: days, status });
    if (res.success && res.data) setPreview({ calls: res.data.calls, customers: res.data.customers });
  }, [days, status]);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  const confirm = async () => {
    setBusy(true);
    const res = await callCenterApi.missed.closeOld({ older_than_days: days, status, confirm: true });
    setBusy(false);
    if (res.success && res.data) {
      toast({ title: T.done(res.data.closed) });
      setOpen(false);
      onDone();
    } else {
      toast({ title: describeError(res) || T.failed, variant: "destructive" });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Archive className="mr-1.5 h-3.5 w-3.5" />{T.open}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{T.title}</DialogTitle>
            <DialogDescription>{T.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>{T.older}</span>
              <span className="flex items-center gap-2">
                <select className="h-9 rounded-md border bg-background px-2" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[1, 3, 7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {T.days}
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span>{T.how}</span>
              <select className="h-9 rounded-md border bg-background px-2" value={status} onChange={(e) => setStatus(e.target.value as "unresolved" | "resolved")}>
                <option value="unresolved">{T.unresolved}</option>
                <option value="resolved">{T.resolved}</option>
              </select>
            </label>
            <div className="rounded-md bg-muted px-3 py-2 font-medium">
              {preview === null ? "…" : preview.calls === 0 ? T.none : T.preview(preview.calls, preview.customers)}
            </div>
            <p className="text-xs text-muted-foreground">{T.keep}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>{T.cancel}</Button>
            <Button onClick={() => void confirm()} disabled={busy || !preview || preview.calls === 0}>{preview ? T.confirm(preview.calls) : "…"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

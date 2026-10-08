import { useEffect, useState } from "react";
import { ArrowRightLeft, Grid3x3, Loader2, LogOut, Mic, MicOff, NotebookPen, Pause, PhoneOff, Play, Undo2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { formatDuration, useElapsed } from "./callUtils";
import { TransferDialog } from "./TransferDialog";
import { callCenterApi, describeError } from "@/services/callCenterApi";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

/**
 * Floating call controls: stays put while the agent navigates, so they can
 * look up a customer or read a note mid-call without losing the call.
 */
export function ActiveCallPanel() {
  const { active, transfer, workspace, hangup, toggleMute, toggleHold, sendDtmf, transferComplete, transferCancel } = useCallCenter();
  const onHandset = workspace?.agent.audio_mode === "handset";
  const { t } = useLanguage();
  const { toast } = useToast();
  const [keypad, setKeypad] = useState(false);
  const [noting, setNoting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const elapsed = useElapsed(active?.startedAt ?? null);

  useEffect(() => {
    if (!active) {
      setKeypad(false);
      setNoting(false);
      setTransferring(false);
      setNote("");
    }
  }, [active]);

  if (!active) return null;

  const saveNote = async () => {
    if (!active.callId || !note.trim()) return;
    setSaving(true);
    const res = await callCenterApi.notes.create(active.callId, { notes: note.trim() });
    setSaving(false);
    if (!res.success) {
      toast({ title: t("cc.call.note_failed"), description: describeError(res), variant: "destructive" });
      return;
    }
    toast({ title: t("cc.call.note_saved") });
    setNote("");
    setNoting(false);
  };

  return (
    <div
      role="region"
      aria-label={t("cc.call.active_aria")}
      className="fixed bottom-4 right-4 z-[110] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{active.name || t("cc.incoming.unknown_caller")}</p>
          <p className="font-mono text-sm text-muted-foreground">{active.number}</p>
        </div>
        <div className="text-right">
          <p className={cn("font-mono text-xl tabular-nums", active.held ? "text-amber-600" : "text-green-600")}>{formatDuration(elapsed)}</p>
          {active.held && <p className="text-[11px] font-medium uppercase tracking-wide text-amber-600">{t("cc.call.on_hold")}</p>}
        </div>
      </div>

      {transfer && (
        <div className="mt-3 space-y-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-900 dark:bg-violet-950">
          <p className="flex items-center gap-2 font-medium text-violet-900 dark:text-violet-100">
            {transfer.stage === "connected" && transfer.conference ? <Users className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {transfer.stage === "asking" && t("cc.transfer.stage_asking", { name: transfer.targetName })}
            {transfer.stage === "transferring" && t("cc.transfer.stage_calling", { name: transfer.targetName })}
            {transfer.stage === "connected" && transfer.conference && t("cc.transfer.stage_threeway", { name: transfer.targetName })}
            {transfer.stage === "connected" && !transfer.conference && t("cc.transfer.stage_handing", { name: transfer.targetName })}
          </p>
          {onHandset ? (
            // A handset can't be driven by the app: the agent presses the keys on their phone.
            <p className="text-xs text-violet-900/80 dark:text-violet-100/80">{t("cc.transfer.handset_keys")}</p>
          ) : (
            transfer.stage !== "asking" && (
              <div className="flex gap-2">
                {transfer.stage === "connected" && transfer.kind === "warm" && (
                  <Button size="sm" onClick={transferComplete} className="flex-1 gap-1.5">
                    <LogOut className="h-4 w-4" /> {t("cc.transfer.handover")}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={transferCancel} className="flex-1 gap-1.5">
                  <Undo2 className="h-4 w-4" /> {t("cc.transfer.cancel")}
                </Button>
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-5 gap-2">
        <Button variant={active.muted ? "default" : "outline"} size="sm" onClick={toggleMute} className="flex-col gap-0.5 py-6" aria-pressed={active.muted}>
          {active.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className="text-[11px]">{active.muted ? t("cc.call.unmute") : t("cc.call.mute")}</span>
        </Button>
        <Button variant={active.held ? "default" : "outline"} size="sm" onClick={toggleHold} className="flex-col gap-0.5 py-6" aria-pressed={active.held}>
          {active.held ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          <span className="text-[11px]">{active.held ? t("cc.call.resume") : t("cc.call.hold")}</span>
        </Button>
        <Button variant={keypad ? "default" : "outline"} size="sm" onClick={() => setKeypad((k) => !k)} className="flex-col gap-0.5 py-6" aria-pressed={keypad}>
          <Grid3x3 className="h-5 w-5" />
          <span className="text-[11px]">{t("cc.call.keypad")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTransferring(true)}
          disabled={!active.callId || !!transfer}
          className="flex-col gap-0.5 py-6"
          title={active.callId ? undefined : t("cc.transfer.unavailable")}
        >
          <ArrowRightLeft className="h-5 w-5" />
          <span className="text-[11px]">{t("cc.transfer.button")}</span>
        </Button>
        <Button
          variant={noting ? "default" : "outline"}
          size="sm"
          onClick={() => setNoting((n) => !n)}
          disabled={!active.callId}
          className="flex-col gap-0.5 py-6"
          aria-pressed={noting}
        >
          <NotebookPen className="h-5 w-5" />
          <span className="text-[11px]">{t("cc.call.note")}</span>
        </Button>
      </div>

      {active.callId && <TransferDialog open={transferring} onOpenChange={setTransferring} callId={active.callId} />}

      {keypad && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => sendDtmf(k)}
              className="h-10 rounded-md border border-border bg-background font-mono text-lg transition-colors hover:bg-accent active:bg-accent/70"
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {noting && (
        <div className="mt-3 space-y-2">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("cc.call.note_placeholder")} rows={3} autoFocus />
          <Button size="sm" onClick={saveNote} disabled={saving || !note.trim()} className="w-full">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {t("cc.call.save_note")}
          </Button>
        </div>
      )}

      <Button onClick={hangup} className="mt-3 h-12 w-full gap-2 bg-red-600 text-white hover:bg-red-700">
        <PhoneOff className="h-5 w-5" /> {t("cc.call.end")}
      </Button>
    </div>
  );
}

// Chat-transcript "test without a real phone number" panel. Opens the
// simulate session on mount, renders each turn as a message bubble, and
// exposes a DTMF keypad / free-text speech input / force-timeout button
// depending on what the current node is waiting for. Every response's
// `path` is bubbled up via `onPathChange` so the parent can highlight the
// traversed nodes/edges on the canvas.
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PhoneOff, Send, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIvrSimulate } from "./useIvrSimulate";

interface SimulatePanelProps {
  flowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPathChange: (path: string[] | null) => void;
}

const DTMF_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export function SimulatePanel({ flowId, open, onOpenChange, onPathChange }: SimulatePanelProps) {
  const sim = useIvrSimulate(flowId);
  const [speechValue, setSpeechValue] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true;
      sim.start();
    }
    if (!open) {
      startedRef.current = false;
      sim.reset();
      onPathChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (sim.path.length > 0) onPathChange(sim.path);
  }, [sim.path, onPathChange]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sim.transcript]);

  const disabled = sim.isLoading || sim.isTerminal;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Jaribu simu</SheetTitle>
          <SheetDescription>Sikia mtiririko wako kama mteja atakavyousikia, bila kuhitaji namba ya simu.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-border-subtle bg-muted/30 p-3">
          {sim.transcript.length === 0 && sim.isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Tunaanza jaribio…
            </div>
          )}
          {sim.transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex",
                entry.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  entry.role === "assistant" && "rounded-tl-sm bg-card text-foreground shadow-sm",
                  entry.role === "user" && "rounded-tr-sm bg-primary text-primary-foreground",
                  entry.role === "system" && "mx-auto bg-transparent text-center text-[11px] italic text-muted-foreground",
                  entry.role === "error" && "mx-auto bg-destructive/10 text-center text-destructive",
                )}
              >
                {entry.text}
              </div>
            </div>
          ))}
          {sim.isTerminal && (
            <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground">
              <PhoneOff className="h-3.5 w-3.5" />
              Simu imemalizika
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="space-y-2 pt-2">
          {sim.awaitingInputType === "dtmf" && (
            <div className="grid grid-cols-3 gap-1.5">
              {DTMF_KEYS.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-9"
                  disabled={disabled}
                  onClick={() => sim.sendInput("dtmf", key)}
                >
                  {key}
                </Button>
              ))}
            </div>
          )}

          {(sim.awaitingInputType === "speech" || sim.awaitingInputType === "recording") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!speechValue.trim()) return;
                sim.sendInput("speech", speechValue.trim());
                setSpeechValue("");
              }}
              className="flex gap-1.5"
            >
              <Input
                value={speechValue}
                onChange={(e) => setSpeechValue(e.target.value)}
                placeholder={
                  sim.awaitingInputType === "recording"
                    ? "Andika anachosema mteja… (jibu la AI halitajaribiwa hapa)"
                    : "Andika anachosema mteja…"
                }
                disabled={disabled}
                className="h-9 text-xs"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={disabled || !speechValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={() => sim.sendInput("timeout")}
          >
            <TimerOff className="mr-1.5 h-3.5 w-3.5" />
            Onyesha mteja asipojibu
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

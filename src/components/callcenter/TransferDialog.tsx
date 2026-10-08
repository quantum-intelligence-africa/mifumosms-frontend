import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Search, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { callCenterApi, describeError, type TransferMode, type TransferTargets } from "@/services/callCenterApi";
import { StatusDot } from "./StatusDot";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
}

type Choice = { type: "agent" | "team"; id: string; name: string };

/**
 * Hand the live call to another agent or a whole team.
 *
 *  - "Transfer now": the customer moves immediately.
 *  - "Ask first": the other agent is phoned, hears who is transferring and why,
 *    and must accept. If they don't, the customer stays with you.
 *
 * Availability is live (refreshed while the dialog is open). Unavailable people
 * are shown but disabled, so it is clear why they can't be picked.
 */
export function TransferDialog({ open, onOpenChange, callId }: TransferDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [targets, setTargets] = useState<TransferTargets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"agent" | "team">("agent");
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [mode, setMode] = useState<TransferMode>("warm");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setChoice(null);
    setNote("");
    setError(null);
    setQuery("");
    let cancelled = false;
    const load = async () => {
      const res = await callCenterApi.transferTargets();
      if (cancelled) return;
      if (res.success && res.data) {
        setTargets(res.data);
        setLoadError(null);
      } else {
        setLoadError(res.error || t("cc.transfer.load_failed"));
      }
    };
    void load();
    const refresh = setInterval(load, 10_000); // availability changes while you choose
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, [open, t]);

  const q = query.trim().toLowerCase();
  const agents = useMemo(
    () =>
      (targets?.agents ?? [])
        .filter((a) => !q || a.name.toLowerCase().includes(q) || a.extension.includes(q) || a.teams.some((x) => x.toLowerCase().includes(q)))
        .sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name)),
    [targets, q],
  );
  const teams = useMemo(
    () =>
      (targets?.teams ?? [])
        .filter((x) => !q || x.name.toLowerCase().includes(q) || x.extension.includes(q))
        .sort((a, b) => Number(b.available > 0) - Number(a.available > 0) || a.name.localeCompare(b.name)),
    [targets, q],
  );

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    setError(null);
    const res = await callCenterApi.transferCall(callId, {
      target_type: choice.type,
      target_id: choice.id,
      mode,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!res.success) {
      // e.g. "Nobody in Finance is available right now." — shown in place so the agent can pick again.
      setError(describeError(res));
      return;
    }
    onOpenChange(false);
    toast({
      title: mode === "confirm" ? t("cc.transfer.asking_toast", { name: choice.name }) : t("cc.transfer.done_toast", { name: choice.name }),
      description: mode === "confirm" ? t("cc.transfer.asking_desc") : mode === "warm" ? t("cc.transfer.warm_desc") : undefined,
    });
  };

  const tabButton = (value: "agent" | "team", label: string, Icon: typeof Users) => (
    <button
      type="button"
      onClick={() => {
        setTab(value);
        setChoice(null);
      }}
      aria-pressed={tab === value}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cc.transfer.title")}</DialogTitle>
          <DialogDescription>{t("cc.transfer.desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabButton("agent", t("cc.transfer.tab_agents"), UserRound)}
          {tabButton("team", t("cc.transfer.tab_teams"), Users)}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("cc.transfer.search")} className="pl-8" aria-label={t("cc.transfer.search")} />
        </div>

        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1" role="listbox" aria-label={t("cc.transfer.choose")}>
          {!targets && !loadError && <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("cc.transfer.loading")}</p>}
          {loadError && <p className="p-3 text-sm text-destructive">{loadError}</p>}

          {targets && tab === "agent" && agents.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t("cc.transfer.no_agents")}</p>}
          {tab === "agent" && agents.map((a) => (
            <button
              key={a.id}
              type="button"
              role="option"
              aria-selected={choice?.id === a.id}
              disabled={!a.available}
              onClick={() => setChoice({ type: "agent", id: a.id, name: a.name })}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                choice?.id === a.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent",
                !a.available && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              <StatusDot status={a.status} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{a.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[a.teams.join(", "), a.extension && `${t("cc.teams.ext")} ${a.extension}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.available ? t("cc.status.available") : t(`cc.status.${a.status}` as const)}</span>
            </button>
          ))}

          {targets && tab === "team" && teams.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t("cc.transfer.no_teams")}</p>}
          {tab === "team" && teams.map((x) => {
            const usable = x.available > 0 && x.is_open;
            return (
              <button
                key={x.id}
                type="button"
                role="option"
                aria-selected={choice?.id === x.id}
                disabled={!usable}
                onClick={() => setChoice({ type: "team", id: x.id, name: x.name })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  choice?.id === x.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent",
                  !usable && "cursor-not-allowed opacity-50 hover:bg-transparent",
                )}
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{x.name}</span>
                  <span className="block text-xs text-muted-foreground">{x.is_open ? `${x.available} ${t("cc.status.available").toLowerCase()} · ${x.online}/${x.total} ${t("cc.workspace.agents_online").toLowerCase()}` : t("cc.teams.closed_now")}</span>
                </span>
              </button>
            );
          })}
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">{t("cc.transfer.how")}</legend>
          {(["warm", "blind", "confirm"] as const).map((m) => (
            <label key={m} className={cn("flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-sm", mode === m ? "border-primary bg-primary/5" : "border-border")}>
              <input type="radio" name="transfer-mode" checked={mode === m} onChange={() => setMode(m)} className="mt-1" />
              <span>
                <span className="block font-medium">{t(`cc.transfer.mode_${m}` as const)}</span>
                <span className="block text-xs text-muted-foreground">{t(`cc.transfer.mode_${m}_desc` as const)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {tab === "agent" && (
          <div className="space-y-1">
            <Label htmlFor="transfer-note">{t("cc.transfer.note")}</Label>
            <Textarea id="transfer-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={2} placeholder={t("cc.transfer.note_placeholder")} />
            <p className="text-right text-[11px] text-muted-foreground">{note.length}/200</p>
          </div>
        )}
        {tab === "team" && mode === "confirm" && <p className="text-xs text-muted-foreground">{t("cc.transfer.team_confirm_hint")}</p>}

        {error && <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>{t("cc.common.cancel")}</Button>
          <Button onClick={submit} disabled={!choice || busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {choice ? t("cc.transfer.submit_to", { name: choice.name }) : t("cc.transfer.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Clock, Loader2, Lock, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { ccKey } from "@/i18n/callCenter";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { StatusDot } from "@/components/callcenter/StatusDot";
import {
  callCenterApi, describeError, type AfterHoursAction, type CCAgent, type RoutingStrategy, type Team, type TeamInput, type WorkingHours,
} from "@/services/callCenterApi";

const STRATEGIES: RoutingStrategy[] = ["round_robin", "ring_one", "simultaneous"];
const DAYS = [0, 1, 2, 3, 4, 5, 6];
const COMMON_ZONES = ["Africa/Dar_es_Salaam", "Africa/Nairobi", "Africa/Kampala", "Africa/Kigali", "Africa/Lusaka", "UTC"];

interface Draft {
  name: string;
  description: string;
  extension: string;
  routing_strategy: RoutingStrategy;
  alwaysOpen: boolean;
  days: number[];
  start: string;
  end: string;
  timezone: string;
  after_hours_action: AfterHoursAction;
  after_hours_message: string;
  overflow_team: string;
  queue_enabled: boolean;
  queue_max_callers: number;
  queue_max_wait_seconds: number;
  hold_music_url: string;
  waiting_message: string;
  callback_offer: boolean;
  is_active: boolean;
  agent_ids: string[];
}

const EMPTY: Draft = {
  name: "", description: "", extension: "", routing_strategy: "round_robin",
  alwaysOpen: true, days: [0, 1, 2, 3, 4], start: "08:00", end: "17:00", timezone: "Africa/Dar_es_Salaam",
  after_hours_action: "voicemail", after_hours_message: "", overflow_team: "",
  queue_enabled: false, queue_max_callers: 10, queue_max_wait_seconds: 180, hold_music_url: "", waiting_message: "", callback_offer: true,
  is_active: true, agent_ids: [],
};

function toDraft(team: Team): Draft {
  const hours = team.working_hours as Partial<WorkingHours>;
  const hasHours = !!hours && Object.keys(hours).length > 0;
  return {
    name: team.name, description: team.description, extension: team.extension, routing_strategy: team.routing_strategy,
    alwaysOpen: !hasHours, days: hours?.days ?? [0, 1, 2, 3, 4], start: hours?.start ?? "08:00", end: hours?.end ?? "17:00",
    timezone: team.timezone, after_hours_action: team.after_hours_action, after_hours_message: team.after_hours_message,
    overflow_team: team.overflow_team ?? "", is_active: team.is_active, agent_ids: team.members.map((m) => m.id),
    queue_enabled: team.queue_enabled, queue_max_callers: team.queue_max_callers, queue_max_wait_seconds: team.queue_max_wait_seconds,
    hold_music_url: team.hold_music_url, waiting_message: team.waiting_message, callback_offer: team.callback_offer,
  };
}

function toInput(d: Draft): TeamInput {
  return {
    name: d.name.trim(), description: d.description.trim(), extension: d.extension.trim(),
    routing_strategy: d.routing_strategy,
    working_hours: d.alwaysOpen ? {} : { days: d.days, start: d.start, end: d.end },
    timezone: d.timezone.trim(), after_hours_action: d.after_hours_action, after_hours_message: d.after_hours_message.trim(),
    overflow_team: d.overflow_team || null, is_active: d.is_active, agent_ids: d.agent_ids,
    queue_enabled: d.queue_enabled, queue_max_callers: d.queue_max_callers, queue_max_wait_seconds: d.queue_max_wait_seconds,
    hold_music_url: d.hold_music_url.trim(), waiting_message: d.waiting_message.trim(), callback_offer: d.callback_offer,
  };
}

export default function Teams() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const admin = isCallCenterAdmin(user);

  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Team | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // What the package includes. Supervisors can't read the plan (admins only); for them
  // nothing is locked in the UI and the server still enforces the plan.
  const [flags, setFlags] = useState<{ smart_routing: boolean; working_hours: boolean }>({ smart_routing: true, working_hours: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [tr, ar, pr] = await Promise.all([callCenterApi.teams.list(), callCenterApi.agents.list({ active: true }), callCenterApi.plan()]);
    if (tr.success && tr.data) setTeams(tr.data);
    else setError(tr.error || t("cc.teams.load_failed"));
    if (ar.success && ar.data) setAgents(ar.data);
    if (pr.success && pr.data && pr.data.enforcing) {
      setFlags({ smart_routing: !!pr.data.flags.smart_routing, working_hours: !!pr.data.flags.working_hours });
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayLabel = (d: number) => t(ccKey(`cc.day.${d}`));
  const otherTeams = useMemo(() => teams.filter((x) => x.id !== editing?.id), [teams, editing]);

  const startAdd = () => {
    setEditing(null);
    setDraft({ ...EMPTY, routing_strategy: flags.smart_routing ? EMPTY.routing_strategy : "ring_one" });
    setFormError(null);
    setOpen(true);
  };
  const startEdit = (team: Team) => {
    setEditing(team);
    setDraft(toDraft(team));
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    const body = toInput(draft);
    const res = editing ? await callCenterApi.teams.update(editing.id, body) : await callCenterApi.teams.create(body);
    setSaving(false);
    if (!res.success) {
      setFormError(describeError(res));
      return;
    }
    setOpen(false);
    toast({ title: editing ? t("cc.teams.updated") : t("cc.teams.created"), description: body.name });
    void load();
  };

  const remove = async (team: Team) => {
    if (!window.confirm(t("cc.teams.delete_confirm", { name: team.name }))) return;
    const res = await callCenterApi.teams.remove(team.id);
    if (res.success) {
      toast({ title: t("cc.teams.deleted"), description: team.name });
      void load();
    } else {
      toast({ title: t("cc.teams.delete_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const toggleAgent = (id: string, on: boolean) =>
    setDraft((d) => ({ ...d, agent_ids: on ? [...new Set([...d.agent_ids, id])] : d.agent_ids.filter((x) => x !== id) }));
  const toggleDay = (day: number) =>
    setDraft((d) => ({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day].sort() }));

  const hoursText = (team: Team) => {
    const h = team.working_hours as Partial<WorkingHours>;
    if (!h || !h.start) return t("cc.teams.always_open");
    const days = (h.days ?? []).map(dayLabel).join(", ");
    return `${days} · ${h.start}–${h.end}`;
  };

  return (
    <PageFrame
      title={t("cc.teams.title")}
      subtitle={t("cc.teams.subtitle")}
      width="max-w-5xl"
      actions={
        admin && (
          <Button onClick={startAdd}><Plus className="mr-1.5 h-4 w-4" />{t("cc.teams.add")}</Button>
        )
      }
    >
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.try_again")}</Button>
          </CardContent>
        </Card>
      )}

      {!error && loading && <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}

      {!error && !loading && teams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">{t("cc.teams.empty_title")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("cc.teams.empty_desc")}</p>
            {admin && <Button className="mt-2" onClick={startAdd}><Plus className="mr-1.5 h-4 w-4" />{t("cc.teams.add_first")}</Button>}
          </CardContent>
        </Card>
      )}

      {!error && !loading && teams.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className={team.is_active ? "" : "opacity-60"}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">{team.name}</h3>
                    {team.description && <p className="line-clamp-2 text-sm text-muted-foreground">{team.description}</p>}
                  </div>
                  {admin && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(team)} aria-label={t("cc.common.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(team)} aria-label={t("cc.common.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{t(`cc.strategy.${team.routing_strategy}` as const)}</Badge>
                  {team.extension && <Badge variant="outline" className="font-mono">{t("cc.teams.ext")} {team.extension}</Badge>}
                  <Badge variant={team.is_open ? "default" : "outline"}>{team.is_open ? t("cc.teams.open_now") : t("cc.teams.closed_now")}</Badge>
                  {team.queue_enabled && <Badge variant="outline">{t("cc.queue.badge")}{team.waiting_now > 0 ? ` · ${team.waiting_now}` : ""}</Badge>}
                  {!team.is_active && <Badge variant="outline">{t("cc.common.inactive")}</Badge>}
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{hoursText(team)}</p>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("cc.teams.members")} · {team.available_count}/{team.member_count} {t("cc.status.available").toLowerCase()}
                  </p>
                  {team.members.length === 0 ? (
                    <p className="text-xs text-amber-600">{t("cc.teams.no_members")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map((m) => (
                        <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs"><StatusDot status={m.status} />{m.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("cc.teams.edit_title") : t("cc.teams.add")}</DialogTitle>
            <DialogDescription>{t("cc.teams.dialog_desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="team-name">{t("cc.teams.name")}</Label>
                <Input id="team-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t("cc.teams.name_placeholder")} autoFocus />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team-ext">{t("cc.teams.extension")}</Label>
                <Input id="team-ext" value={draft.extension} onChange={(e) => setDraft({ ...draft, extension: e.target.value.replace(/\D/g, "") })} placeholder="101" inputMode="numeric" maxLength={10} className="font-mono" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="team-desc">{t("cc.teams.description")}</Label>
              <Textarea id="team-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
            </div>

            <div className="space-y-1">
              <Label>{t("cc.teams.strategy")}</Label>
              <Select value={draft.routing_strategy} onValueChange={(v) => setDraft({ ...draft, routing_strategy: v as RoutingStrategy })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s} value={s} disabled={s !== "ring_one" && !flags.smart_routing && s !== editing?.routing_strategy}>
                      {t(`cc.strategy.${s}` as const)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!flags.smart_routing && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />{t("cc.plans.locked")} {admin && <Link to="/call-center/plans" className="underline">{t("cc.plans.see_plans")}</Link>}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t(`cc.strategy.${draft.routing_strategy}_desc` as const)}</p>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="team-24h">{t("cc.teams.always_open")}</Label>
                <Switch
                  id="team-24h"
                  checked={draft.alwaysOpen}
                  disabled={!flags.working_hours && draft.alwaysOpen}
                  onCheckedChange={(v) => setDraft({ ...draft, alwaysOpen: v })}
                />
              </div>
              {!flags.working_hours && draft.alwaysOpen && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />{t("cc.plans.locked")} {admin && <Link to="/call-center/plans" className="underline">{t("cc.plans.see_plans")}</Link>}
                </p>
              )}
              {!draft.alwaysOpen && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        aria-pressed={draft.days.includes(d)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${draft.days.includes(d) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-accent"}`}
                      >
                        {dayLabel(d)}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="team-start">{t("cc.teams.opens")}</Label>
                      <Input id="team-start" type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="team-end">{t("cc.teams.closes")}</Label>
                      <Input id="team-end" type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="team-tz">{t("cc.teams.timezone")}</Label>
                      <Input id="team-tz" list="cc-zones" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} />
                      <datalist id="cc-zones">{COMMON_ZONES.map((z) => <option key={z} value={z} />)}</datalist>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>{t("cc.teams.after_hours")}</Label>
                      <Select value={draft.after_hours_action} onValueChange={(v) => setDraft({ ...draft, after_hours_action: v as AfterHoursAction })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="voicemail">{t("cc.teams.after_voicemail")}</SelectItem>
                          <SelectItem value="message">{t("cc.teams.after_message")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="team-after-msg">{t("cc.teams.after_hours_message")}</Label>
                      <Input id="team-after-msg" value={draft.after_hours_message} onChange={(e) => setDraft({ ...draft, after_hours_message: e.target.value })} maxLength={500} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="team-queue">{t("cc.queue.enable")}</Label>
                  <p className="text-xs text-muted-foreground">{t("cc.queue.enable_hint")}</p>
                </div>
                <Switch id="team-queue" checked={draft.queue_enabled} onCheckedChange={(v) => setDraft({ ...draft, queue_enabled: v })} />
              </div>
              {draft.queue_enabled && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="q-max">{t("cc.queue.max_callers")}</Label>
                      <Input id="q-max" type="number" min={1} max={100} value={draft.queue_max_callers}
                        onChange={(e) => setDraft({ ...draft, queue_max_callers: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="q-wait">{t("cc.queue.max_wait")}</Label>
                      <Input id="q-wait" type="number" min={20} max={1800} step={10} value={draft.queue_max_wait_seconds}
                        onChange={(e) => setDraft({ ...draft, queue_max_wait_seconds: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-msg">{t("cc.queue.message")}</Label>
                    <Input id="q-msg" value={draft.waiting_message} maxLength={500} placeholder={t("cc.queue.message_placeholder")}
                      onChange={(e) => setDraft({ ...draft, waiting_message: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="q-cb">{t("cc.queue.callback")}</Label>
                    <Switch id="q-cb" checked={draft.callback_offer} onCheckedChange={(v) => setDraft({ ...draft, callback_offer: v })} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("cc.queue.after_wait_hint")}</p>
                </>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="q-music">{t("cc.queue.music")}</Label>
              <Input id="q-music" value={draft.hold_music_url} placeholder={t("cc.queue.music_placeholder")}
                onChange={(e) => setDraft({ ...draft, hold_music_url: e.target.value })} />
              <p className="text-xs text-muted-foreground">{t("cc.queue.music_hint")}</p>
            </div>

            <div className="space-y-1">
              <Label>{t("cc.teams.overflow")}</Label>
              <Select value={draft.overflow_team || "none"} onValueChange={(v) => setDraft({ ...draft, overflow_team: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("cc.teams.overflow_none")}</SelectItem>
                  {otherTeams.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("cc.teams.overflow_hint")}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t("cc.teams.members")}</Label>
              {agents.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("cc.teams.no_agents_yet")}</p>
              ) : (
                <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
                  {agents.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                      <Checkbox checked={draft.agent_ids.includes(a.id)} onCheckedChange={(v) => toggleAgent(a.id, !!v)} />
                      <span className="truncate">{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="team-active">{t("cc.teams.active")}</Label>
              <Switch id="team-active" checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            </div>

            {formError && <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{t("cc.common.cancel")}</Button>
            <Button onClick={save} disabled={saving || !draft.name.trim()}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

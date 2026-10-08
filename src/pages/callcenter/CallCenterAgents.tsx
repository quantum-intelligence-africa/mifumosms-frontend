// Create and manage call-center agents (owner/admin). Each agent has their OWN
// login — never a shared organization login — created here with a temporary
// password that is shown exactly once and must be replaced at first sign-in.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Copy, KeyRound, Loader2, Mail, Pencil, Plus, RefreshCw, ShieldAlert, UserCheck, UserPlus, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminTenantId } from "@/hooks/useAdminTenantId";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { ccKey } from "@/i18n/callCenter";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { StatusLabel } from "@/components/callcenter/StatusDot";
import {
  attachAgentProfile, callCenterApi, describeError, provisionAgent,
  type AudioMode, type CCAgent, type MemberCandidate, type PendingInvite, type PlanStatus, type ProvisionAgentResult, type Team,
} from "@/services/callCenterApi";

interface Draft {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: "agent" | "supervisor";
  audio_mode: AudioMode;
  extension: string;
  team_ids: string[];
  temporary_password: string;
}

const EMPTY: Draft = {
  first_name: "", last_name: "", email: "", phone_number: "", role: "agent", audio_mode: "browser",
  extension: "", team_ids: [], temporary_password: "",
};

interface Credentials {
  name: string;
  email: string;
  password: string;
  /** Set when the login exists but the agent profile step failed. */
  pending?: { userId: number; draft: Draft; error: string };
}

export default function CallCenterAgents() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // The organization the admin acts for — the same membership the voice
  // service resolves, so the login and the agent profile land together.
  const tenantId = useAdminTenantId();

  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CCAgent | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // package limits, and the people already in the organization who could become agents
  const [plan, setPlan] = useState<PlanStatus | null>(null);
  const [candidates, setCandidates] = useState<MemberCandidate[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState({ user_id: "", phone_number: "", extension: "", audio_mode: "browser" as AudioMode, team_ids: [] as string[] });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "agent" as "agent" | "supervisor" });
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [ar, tr, pr, mr] = await Promise.all([
      callCenterApi.agents.list(), callCenterApi.teams.list(), callCenterApi.plan(), callCenterApi.members(),
    ]);
    if (ar.success && ar.data) setAgents(ar.data);
    else setError(ar.error || t("cc.agents.load_failed"));
    if (tr.success && tr.data) setTeams(tr.data);
    if (pr.success && pr.data) setPlan(pr.data);
    if (mr.success && mr.data) {
      setCandidates(mr.data.available);
      setPendingInvites(mr.data.pending);
    }
    setLoading(false);
  }, [t]);

  const agentMeter = plan?.usage.agents;
  const atLimit = !!plan?.enforcing && !!agentMeter && agentMeter.limit !== null && agentMeter.used >= agentMeter.limit;

  useEffect(() => {
    void load();
  }, [load]);

  const startAdd = () => {
    setEditing(null);
    setDraft(EMPTY);
    setFormError(null);
    setOpen(true);
  };

  const startEdit = (agent: CCAgent) => {
    const [first = "", ...rest] = agent.name.split(" ");
    setEditing(agent);
    setDraft({
      first_name: first, last_name: rest.join(" "), email: agent.email, phone_number: agent.phone_number,
      role: agent.role === "supervisor" ? "supervisor" : "agent", audio_mode: agent.audio_mode, extension: agent.extension,
      team_ids: agent.teams.map((x) => x.id), temporary_password: "",
    });
    setFormError(null);
    setOpen(true);
  };

  const startAddMember = () => {
    setMemberDraft({ user_id: candidates[0] ? String(candidates[0].user_id) : "", phone_number: "", extension: "", audio_mode: "browser", team_ids: [] });
    setDialogError(null);
    setMemberOpen(true);
  };

  const saveMember = async () => {
    setDialogBusy(true);
    setDialogError(null);
    const res = await callCenterApi.agents.createProfile({
      user_id: Number(memberDraft.user_id), phone_number: memberDraft.phone_number.trim(), extension: memberDraft.extension.trim(),
      audio_mode: memberDraft.audio_mode, team_ids: memberDraft.team_ids,
    });
    setDialogBusy(false);
    if (!res.success) return setDialogError(describeError(res));
    setMemberOpen(false);
    toast({ title: t("cc.agents.created"), description: res.data?.name });
    void load();
  };

  const sendInvite = async () => {
    if (!tenantId) return setDialogError(t("cc.agents.no_organization"));
    setDialogBusy(true);
    setDialogError(null);
    const res = await apiClient.inviteCallCenterMember(tenantId, invite.email.trim().toLowerCase(), invite.role);
    setDialogBusy(false);
    if (!res.success) return setDialogError(describeError(res));
    setInviteOpen(false);
    setInvite({ email: "", role: "agent" });
    toast({ title: t("cc.agents.invite_sent") });
    void load();
  };

  const resend = async (inv: PendingInvite) => {
    if (!tenantId) return;
    setResendingId(inv.id);
    const res = await apiClient.resendTeamInvitation(tenantId, inv.id);
    setResendingId(null);
    if (res.success) toast({ title: t("cc.agents.resent"), description: inv.email });
    else toast({ title: t("cc.agents.resend_failed"), description: describeError(res), variant: "destructive" });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("cc.agents.copied") });
    } catch {
      toast({ title: t("cc.agents.copy_failed"), variant: "destructive" });
    }
  };

  const save = async () => {
    setFormError(null);
    if (draft.audio_mode === "handset" && !draft.phone_number.trim()) {
      setFormError(t("cc.agents.handset_needs_phone"));
      return;
    }
    setSaving(true);

    if (editing) {
      const res = await callCenterApi.agents.update(editing.id, {
        name: `${draft.first_name} ${draft.last_name}`.trim() || editing.name,
        phone_number: draft.phone_number, extension: draft.extension, audio_mode: draft.audio_mode, team_ids: draft.team_ids,
      });
      let roleError: string | null = null;
      if (res.success && editing.user && tenantId && draft.role !== editing.role) {
        const roleRes = await apiClient.changeAgentAccountRole(tenantId, editing.user, draft.role);
        if (!roleRes.success) roleError = describeError(roleRes);
      }
      setSaving(false);
      if (!res.success) return setFormError(describeError(res));
      setOpen(false);
      toast({ title: t("cc.agents.updated"), description: roleError ? `${t("cc.agents.role_failed")}: ${roleError}` : editing.name });
      void load();
      return;
    }

    if (!tenantId) {
      setSaving(false);
      return setFormError(t("cc.agents.no_organization"));
    }
    const result = await provisionAgent({
      tenantId, email: draft.email, first_name: draft.first_name, last_name: draft.last_name, role: draft.role,
      phone_number: draft.phone_number, temporary_password: draft.temporary_password, extension: draft.extension,
      audio_mode: draft.audio_mode, team_ids: draft.team_ids,
    });
    setSaving(false);
    const name = `${draft.first_name} ${draft.last_name}`.trim();

    if (result.ok === true) {
      setOpen(false);
      setCredentials({ name, email: draft.email.trim().toLowerCase(), password: result.temporaryPassword });
      void load();
      return;
    }
    // (This project compiles without strictNullChecks, so the union isn't narrowed by `ok`.)
    const failure = result as Extract<ProvisionAgentResult, { ok: false }>;
    if (failure.failedAt === "profile" && failure.userId && failure.temporaryPassword) {
      // The login exists. Never throw its password away — show it, and offer to finish the profile.
      setOpen(false);
      setCredentials({
        name, email: draft.email.trim().toLowerCase(), password: failure.temporaryPassword,
        pending: { userId: failure.userId, draft, error: failure.error },
      });
    } else {
      setFormError(failure.error);
    }
  };

  const retryProfile = async () => {
    if (!credentials?.pending) return;
    setRetrying(true);
    const { userId, draft: d } = credentials.pending;
    const res = await attachAgentProfile(userId, { phone_number: d.phone_number, extension: d.extension, audio_mode: d.audio_mode, team_ids: d.team_ids });
    setRetrying(false);
    if (res.success) {
      setCredentials({ ...credentials, pending: undefined });
      void load();
    } else {
      setCredentials({ ...credentials, pending: { ...credentials.pending, error: describeError(res) } });
    }
  };

  const resetPassword = async (agent: CCAgent) => {
    if (!agent.user || !tenantId) return;
    if (!window.confirm(t("cc.agents.reset_confirm", { name: agent.name }))) return;
    setBusyId(agent.id);
    const res = await apiClient.resetAgentPassword(tenantId, agent.user);
    setBusyId(null);
    if (res.success && res.data) setCredentials({ name: agent.name, email: agent.email, password: res.data.temporary_password });
    else toast({ title: t("cc.agents.reset_failed"), description: describeError(res), variant: "destructive" });
  };

  const setEnabled = async (agent: CCAgent, enabled: boolean) => {
    if (!agent.user || !tenantId) return;
    if (!enabled && !window.confirm(t("cc.agents.disable_confirm", { name: agent.name }))) return;
    setBusyId(agent.id);
    // Login first (it is what actually blocks sign-in), then the call-center profile.
    const account = await apiClient.setAgentAccountEnabled(tenantId, agent.user, enabled);
    if (!account.success) {
      setBusyId(null);
      return toast({ title: t("cc.agents.toggle_failed"), description: describeError(account), variant: "destructive" });
    }
    const profile = await callCenterApi.agents.update(agent.id, { is_active: enabled });
    setBusyId(null);
    if (!profile.success) {
      toast({ title: t("cc.agents.toggle_partial"), description: describeError(profile), variant: "destructive" });
    } else {
      toast({ title: enabled ? t("cc.agents.enabled") : t("cc.agents.disabled"), description: agent.name });
    }
    void load();
  };

  const toggleTeam = (id: string, on: boolean) =>
    setDraft((d) => ({ ...d, team_ids: on ? [...new Set([...d.team_ids, id])] : d.team_ids.filter((x) => x !== id) }));

  const canSubmit = editing
    ? !!draft.first_name.trim()
    : !!draft.first_name.trim() && !!draft.last_name.trim() && /\S+@\S+\.\S+/.test(draft.email);

  return (
    <PageFrame
      title={t("cc.agents.title")}
      subtitle={t("cc.agents.subtitle")}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setInvite({ email: "", role: "agent" }); setDialogError(null); setInviteOpen(true); }}>
            <Mail className="mr-1.5 h-4 w-4" />{t("cc.agents.invite")}
          </Button>
          <Button variant="outline" onClick={startAddMember} disabled={candidates.length === 0}>
            <UserPlus className="mr-1.5 h-4 w-4" />{t("cc.agents.add_member")}
            {candidates.length > 0 && <Badge variant="secondary" className="ml-2">{candidates.length}</Badge>}
          </Button>
          <Button onClick={startAdd}><Plus className="mr-1.5 h-4 w-4" />{t("cc.agents.add")}</Button>
        </div>
      }
    >
      {plan?.plan && agentMeter && (
        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${atLimit ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100" : "text-muted-foreground"}`}>
          <span>
            {agentMeter.limit === null
              ? t("cc.agents.usage_unlimited", { used: agentMeter.used, plan: plan.plan.name })
              : t("cc.agents.usage", { used: agentMeter.used, limit: agentMeter.limit, plan: plan.plan.name })}
          </span>
          {atLimit && <Link to="/call-center/plans" className="font-medium underline">{t("cc.plans.see_plans")}</Link>}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.try_again")}</Button>
          </CardContent>
        </Card>
      )}
      {!error && loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}

      {!error && !loading && agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <UserCheck className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">{t("cc.agents.empty_title")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("cc.agents.empty_desc")}</p>
            <Button className="mt-2" onClick={startAdd}><Plus className="mr-1.5 h-4 w-4" />{t("cc.agents.add_first")}</Button>
          </CardContent>
        </Card>
      )}

      {!error && !loading && agents.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t("cc.agents.col_agent")}</TableHead>
                  <TableHead>{t("cc.agents.col_teams")}</TableHead>
                  <TableHead>{t("cc.agents.col_role")}</TableHead>
                  <TableHead>{t("cc.agents.col_status")}</TableHead>
                  <TableHead>{t("cc.agents.col_mode")}</TableHead>
                  <TableHead>{t("cc.agents.col_extension")}</TableHead>
                  <TableHead className="text-right">{t("cc.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => (
                  <TableRow key={a.id} className={a.is_active ? "" : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.email || a.phone_number}</p>
                    </TableCell>
                    <TableCell className="text-sm">{a.teams.map((x) => x.name).join(", ") || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{a.role ? t(ccKey(`cc.role.${a.role}`)) : "—"}</Badge></TableCell>
                    <TableCell>{a.is_active ? <StatusLabel status={a.status} /> : <Badge variant="outline">{t("cc.common.disabled")}</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t(`cc.mode.${a.audio_mode}` as const)}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{a.extension || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(a)} aria-label={t("cc.common.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                        {a.user && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busyId === a.id} onClick={() => resetPassword(a)} aria-label={t("cc.agents.reset_password")} title={t("cc.agents.reset_password")}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            {a.is_active ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={busyId === a.id} onClick={() => setEnabled(a, false)} aria-label={t("cc.agents.disable")} title={t("cc.agents.disable")}>
                                {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" disabled={busyId === a.id} onClick={() => setEnabled(a, true)} aria-label={t("cc.agents.enable")} title={t("cc.agents.enable")}>
                                {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!error && !loading && pendingInvites.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div>
              <h3 className="text-sm font-semibold">{t("cc.agents.pending_title")}</h3>
              <p className="text-xs text-muted-foreground">{t("cc.agents.pending_desc")}</p>
            </div>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{inv.email} <Badge variant="outline" className="ml-1">{t(ccKey(`cc.role.${inv.role}`))}</Badge></span>
                <Button size="sm" variant="ghost" disabled={resendingId === inv.id} onClick={() => resend(inv)}>
                  {resendingId === inv.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{t("cc.agents.resend")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── invite by email ───────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cc.agents.invite_title")}</DialogTitle>
            <DialogDescription>{t("cc.agents.invite_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="inv-email">{t("cc.agents.email")}</Label>
              <Input id="inv-email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="john@example.com" autoComplete="off" autoFocus />
            </div>
            <div className="space-y-1">
              <Label>{t("cc.agents.role")}</Label>
              <Select value={invite.role} onValueChange={(v) => setInvite({ ...invite, role: v as "agent" | "supervisor" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">{t("cc.role.agent")}</SelectItem>
                  <SelectItem value="supervisor">{t("cc.role.supervisor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dialogError && <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={dialogBusy}>{t("cc.common.cancel")}</Button>
            <Button onClick={sendInvite} disabled={dialogBusy || !/\S+@\S+\.\S+/.test(invite.email)}>
              {dialogBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.agents.invite_send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── add an existing team member as an agent ───────────────────── */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cc.agents.add_member_title")}</DialogTitle>
            <DialogDescription>{t("cc.agents.add_member_desc")}</DialogDescription>
          </DialogHeader>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("cc.agents.no_members")}</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{t("cc.agents.pick_member")}</Label>
                <Select value={memberDraft.user_id} onValueChange={(v) => setMemberDraft({ ...memberDraft, user_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {candidates.map((m) => <SelectItem key={m.user_id} value={String(m.user_id)}>{m.name} · {m.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t("cc.agents.audio_mode")}</Label>
                  <Select value={memberDraft.audio_mode} onValueChange={(v) => setMemberDraft({ ...memberDraft, audio_mode: v as AudioMode })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">{t("cc.mode.browser")}</SelectItem>
                      <SelectItem value="handset">{t("cc.mode.handset")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mem-phone">{t("cc.agents.phone")}{memberDraft.audio_mode === "handset" ? " *" : ""}</Label>
                  <Input id="mem-phone" value={memberDraft.phone_number} onChange={(e) => setMemberDraft({ ...memberDraft, phone_number: e.target.value })} placeholder="+255712345678" inputMode="tel" className="font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="mem-ext">{t("cc.agents.extension")}</Label>
                <Input id="mem-ext" value={memberDraft.extension} onChange={(e) => setMemberDraft({ ...memberDraft, extension: e.target.value.replace(/\D/g, "") })} placeholder="1012" inputMode="numeric" maxLength={10} className="font-mono" />
              </div>
              {teams.length > 0 && (
                <div className="space-y-1.5">
                  <Label>{t("cc.agents.teams")}</Label>
                  <div className="grid gap-1.5 rounded-lg border border-border p-2 sm:grid-cols-2">
                    {teams.map((tm) => (
                      <label key={tm.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                        <Checkbox
                          checked={memberDraft.team_ids.includes(tm.id)}
                          onCheckedChange={(v) => setMemberDraft((d) => ({ ...d, team_ids: v ? [...new Set([...d.team_ids, tm.id])] : d.team_ids.filter((x) => x !== tm.id) }))}
                        />
                        <span className="truncate">{tm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {dialogError && (
                <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{dialogError} {atLimit && <Link to="/call-center/plans" className="font-medium underline">{t("cc.plans.see_plans")}</Link>}</span>
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberOpen(false)} disabled={dialogBusy}>{t("cc.common.cancel")}</Button>
            <Button onClick={saveMember} disabled={dialogBusy || !memberDraft.user_id || (memberDraft.audio_mode === "handset" && !memberDraft.phone_number.trim())}>
              {dialogBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.agents.add_member_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── create / edit ─────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("cc.agents.edit_title") : t("cc.agents.add")}</DialogTitle>
            <DialogDescription>{editing ? t("cc.agents.edit_desc") : t("cc.agents.dialog_desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ag-first">{t("cc.agents.first_name")}</Label>
                <Input id="ag-first" value={draft.first_name} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} autoFocus />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ag-last">{t("cc.agents.last_name")}</Label>
                <Input id="ag-last" value={draft.last_name} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} />
              </div>
            </div>

            {!editing && (
              <div className="space-y-1">
                <Label htmlFor="ag-email">{t("cc.agents.email")}</Label>
                <Input id="ag-email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="john@example.com" autoComplete="off" />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("cc.agents.role")}</Label>
                <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as "agent" | "supervisor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">{t("cc.role.agent")}</SelectItem>
                    <SelectItem value="supervisor">{t("cc.role.supervisor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ag-ext">{t("cc.agents.extension")}</Label>
                <Input id="ag-ext" value={draft.extension} onChange={(e) => setDraft({ ...draft, extension: e.target.value.replace(/\D/g, "") })} placeholder="1012" inputMode="numeric" maxLength={10} className="font-mono" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("cc.agents.audio_mode")}</Label>
                <Select value={draft.audio_mode} onValueChange={(v) => setDraft({ ...draft, audio_mode: v as AudioMode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser">{t("cc.mode.browser")}</SelectItem>
                    <SelectItem value="handset">{t("cc.mode.handset")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ag-phone">{t("cc.agents.phone")}{draft.audio_mode === "handset" ? " *" : ""}</Label>
                <Input id="ag-phone" value={draft.phone_number} onChange={(e) => setDraft({ ...draft, phone_number: e.target.value })} placeholder="+255712345678" inputMode="tel" className="font-mono" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("cc.agents.teams")}</Label>
              {teams.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("cc.agents.no_teams_yet")}</p>
              ) : (
                <div className="grid gap-1.5 rounded-lg border border-border p-2 sm:grid-cols-2">
                  {teams.map((tm) => (
                    <label key={tm.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                      <Checkbox checked={draft.team_ids.includes(tm.id)} onCheckedChange={(v) => toggleTeam(tm.id, !!v)} />
                      <span className="truncate">{tm.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {!editing && (
              <div className="space-y-1">
                <Label htmlFor="ag-pass">{t("cc.agents.temp_password")}</Label>
                <Input id="ag-pass" type="text" value={draft.temporary_password} onChange={(e) => setDraft({ ...draft, temporary_password: e.target.value })} placeholder={t("cc.agents.temp_password_placeholder")} autoComplete="new-password" />
                <p className="text-xs text-muted-foreground">{t("cc.agents.temp_password_hint")}</p>
              </div>
            )}

            {formError && (
              <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{formError} {atLimit && <Link to="/call-center/plans" className="font-medium underline">{t("cc.plans.see_plans")}</Link>}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{t("cc.common.cancel")}</Button>
            <Button onClick={save} disabled={saving || !canSubmit}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{editing ? t("cc.common.save") : t("cc.agents.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── one-time credentials ───────────────────────────────────────── */}
      <Dialog open={!!credentials} onOpenChange={(v) => !v && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          {credentials && (
            <>
              <DialogHeader>
                <DialogTitle>{t("cc.agents.credentials_title")}</DialogTitle>
                <DialogDescription>{credentials.name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {t("cc.agents.credentials_warning")}
                </p>
                {[
                  [t("cc.agents.email"), credentials.email],
                  [t("cc.agents.temp_password"), credentials.password],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={value} className="font-mono" onFocus={(e) => e.currentTarget.select()} />
                      <Button variant="outline" size="icon" onClick={() => copy(value)} aria-label={t("cc.agents.copy")}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t("cc.agents.credentials_hint")}</p>

                {credentials.pending && (
                  <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                    <p className="flex items-start gap-1.5 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{t("cc.agents.profile_pending")}</p>
                    <p className="text-xs text-muted-foreground">{credentials.pending.error}</p>
                    <Button size="sm" onClick={retryProfile} disabled={retrying}>
                      {retrying && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{t("cc.agents.retry_profile")}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setCredentials(null)}>{t("cc.agents.done")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

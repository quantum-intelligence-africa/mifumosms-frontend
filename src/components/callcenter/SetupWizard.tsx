// Guided setup: from "nothing" to "taking calls", one step at a time.
//
// Every tick comes from the server (`/call-center/settings/` -> readiness), not
// from what this component thinks it just did — so a step can't claim success
// it hasn't earned, and "Go live" is refused unless the organization really is
// ready (number connected, a staffed team, an IVR flow that routes to it).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Circle, Copy, Loader2, PartyPopper, PhoneCall, Rocket, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAdminTenantId } from "@/hooks/useAdminTenantId";
import { useLanguage } from "@/hooks/useLanguage";
import { usePlanFlags } from "@/hooks/usePlanFlags";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { cn } from "@/lib/utils";
import {
  callCenterApi, describeError, provisionAgent,
  type AudioMode, type CCAgent, type CallCenterSettings, type GeneratedIvr, type RoutingStrategy, type Team,
} from "@/services/callCenterApi";
import { voiceApi } from "@/services/voiceApi";
import { ccKey } from "@/i18n/callCenter";

const STEPS = ["organization", "number", "team", "agents", "ivr", "routing", "test", "live"] as const;
type Step = (typeof STEPS)[number];
const TEST_KEY = "cc_test_call_done";
const STRATEGIES: RoutingStrategy[] = ["round_robin", "ring_one", "simultaneous"];

interface VoiceAccountRow {
  id: string;
  phone_number: string;
  display_name: string;
  is_active: boolean;
}

function Notice({ tone, children }: { tone: "ok" | "warn" | "error"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
    warn: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    error: "bg-destructive/10 text-destructive",
  }[tone];
  const Icon = tone === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <p className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function SetupWizard({ open, onOpenChange, onChanged }: { open: boolean; onOpenChange: (o: boolean) => void; onChanged?: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const cc = useCallCenter();
  const tenantId = useAdminTenantId();

  const [settings, setSettings] = useState<CallCenterSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [accounts, setAccounts] = useState<VoiceAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const [companyName, setCompanyName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [testDone, setTestDone] = useState(() => {
    try {
      return localStorage.getItem(TEST_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [callDetected, setCallDetected] = useState(false);

  const load = useCallback(async () => {
    const [s, tr, ar, acc] = await Promise.all([
      callCenterApi.settings.get(),
      callCenterApi.teams.list(),
      callCenterApi.agents.list(),
      voiceApi.get<VoiceAccountRow[]>("/voice/accounts/"),
    ]);
    if (s.success && s.data) setSettings(s.data);
    if (tr.success && tr.data) setTeams(tr.data);
    if (ar.success && ar.data) setAgents(ar.data);
    if (acc.success && acc.data) setAccounts(acc.data.filter((a) => a.is_active));
    setLoading(false);
    return s.data ?? null;
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void load().then((s) => s && setStepIndex(Math.min(Math.max(s.wizard_step - 1, 0), STEPS.length - 1)));
  }, [open, load]);

  // The test-call step watches for a call reaching the team, live.
  useEffect(
    () => cc.subscribe((e) => (e.event === "call_ringing" || e.event === "queue_update") && setCallDetected(true)),
    [cc],
  );

  const goto = (index: number) => {
    const next = Math.min(Math.max(index, 0), STEPS.length - 1);
    setStepIndex(next);
    void callCenterApi.settings.patch({ wizard_step: next + 1 });
  };

  const r = settings?.readiness;
  const done: Record<Step, boolean> = {
    organization: companyName.trim().length > 0,
    number: !!r?.number,
    team: !!r?.team,
    agents: !!r?.staffed,
    ivr: !!r?.routing,
    routing: !!r?.team && teams.every((x) => x.member_count > 0),
    test: testDone || callDetected,
    live: !!settings?.is_live,
  };
  const percent = Math.round((STEPS.filter((s) => done[s]).length / STEPS.length) * 100);

  const markTest = (v: boolean) => {
    setTestDone(v);
    try {
      localStorage.setItem(TEST_KEY, v ? "1" : "0");
    } catch {
      /* private mode: the tick just won't persist */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("cc.wizard.title")}</DialogTitle>
          <DialogDescription>{t("cc.wizard.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("cc.wizard.step_of", { n: stepIndex + 1, total: STEPS.length })}</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} className="h-1.5" />
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => goto(i)}
                  aria-current={i === stepIndex ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    i === stepIndex ? "border-primary bg-primary/10 font-medium text-primary" : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {done[s] ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Circle className="h-3.5 w-3.5" />}
                  {t(`cc.wizard.s_${s}` as const)}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="min-h-[14rem] space-y-3 py-1">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("cc.transfer.loading")}</p>
          ) : (
            <>
              <h3 className="text-base font-semibold">{t(`cc.wizard.h_${step}` as const)}</h3>
              <p className="text-sm text-muted-foreground">{t(`cc.wizard.d_${step}` as const)}</p>

              {step === "organization" && (
                <div className="space-y-1">
                  <Label htmlFor="wz-company">{t("cc.wizard.company_name")}</Label>
                  <Input id="wz-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("cc.wizard.company_placeholder")} autoFocus />
                  <p className="text-xs text-muted-foreground">{t("cc.wizard.company_hint")}</p>
                </div>
              )}

              {step === "number" && (
                <div className="space-y-2">
                  {accounts.filter((a) => a.phone_number).map((a) => (
                    <p key={a.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 font-mono text-sm">
                      <PhoneCall className="h-4 w-4 text-green-600" />{a.phone_number}{a.display_name ? <span className="font-sans text-muted-foreground">· {a.display_name}</span> : null}
                    </p>
                  ))}
                  {r?.number ? (
                    <Notice tone="ok">{t("cc.wizard.number_ok")}</Notice>
                  ) : (
                    <>
                      <Notice tone="warn">{t("cc.wizard.number_missing")}</Notice>
                      <div className="flex gap-2">
                        <Button asChild size="sm"><Link to="/voice/numbers" onClick={() => onOpenChange(false)}>{t("cc.wizard.open_numbers")}</Link></Button>
                        <Button size="sm" variant="outline" onClick={() => void load()}>{t("cc.wizard.check_again")}</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === "team" && <TeamStep teams={teams} onCreated={() => { void load(); onChanged?.(); }} />}

              {step === "agents" && (
                <AgentStep
                  agents={agents}
                  teams={teams}
                  tenantId={tenantId}
                  onCreated={() => { void load(); onChanged?.(); }}
                />
              )}

              {step === "ivr" && (
                <IvrStep
                  teams={teams}
                  routing={!!r?.routing}
                  companyName={companyName}
                  greeting={greeting}
                  setGreeting={setGreeting}
                  hasNumber={!!r?.number}
                  onGenerated={() => { void load(); onChanged?.(); }}
                />
              )}

              {step === "routing" && <RoutingStep teams={teams} onChanged={() => { void load(); onChanged?.(); }} />}

              {step === "test" && (
                <div className="space-y-2">
                  {accounts[0]?.phone_number && (
                    <p className="rounded-md bg-muted/50 px-3 py-3 text-center">
                      <span className="block text-xs text-muted-foreground">{t("cc.wizard.call_this")}</span>
                      <span className="font-mono text-xl">{accounts[0].phone_number}</span>
                    </p>
                  )}
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>{t("cc.wizard.test_1")}</li>
                    <li>{t("cc.wizard.test_2")}</li>
                    <li>{t("cc.wizard.test_3")}</li>
                  </ol>
                  {callDetected && <Notice tone="ok">{t("cc.wizard.call_detected")}</Notice>}
                  {!callDetected && cc.socketState !== "ready" && <Notice tone="warn">{t("cc.wizard.not_live_socket")}</Notice>}
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={testDone || callDetected} disabled={callDetected} onCheckedChange={markTest} />
                    {t("cc.wizard.test_done")}
                  </label>
                </div>
              )}

              {step === "live" && (
                <LiveStep
                  settings={settings}
                  testDone={testDone || callDetected}
                  onChanged={() => { void load(); onChanged?.(); }}
                  toast={toast}
                />
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Button variant="ghost" onClick={() => goto(stepIndex - 1)} disabled={stepIndex === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" />{t("cc.wizard.back")}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={() => goto(stepIndex + 1)}>
              {done[step] ? t("cc.wizard.next") : t("cc.wizard.skip")}<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cc.wizard.close")}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── step 3: first team ──────────────────────────────────────────────────────

function TeamStep({ teams, onCreated }: { teams: Team[]; onCreated: () => void }) {
  const { t } = useLanguage();
  const { smart_routing: smartRouting } = usePlanFlags();
  const [name, setName] = useState("");
  const [pickedStrategy, setStrategy] = useState<RoutingStrategy>("round_robin");
  const strategy: RoutingStrategy = smartRouting ? pickedStrategy : "ring_one";
  const [queue, setQueue] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setSaving(true);
    setError(null);
    const res = await callCenterApi.teams.create({ name: name.trim(), routing_strategy: strategy, queue_enabled: queue });
    setSaving(false);
    if (!res.success) return setError(describeError(res));
    setName("");
    onCreated();
  };

  return (
    <div className="space-y-3">
      {teams.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {teams.map((x) => (
            <span key={x.id} className="rounded-full bg-muted px-2.5 py-1 text-sm">{x.name} <span className="text-xs text-muted-foreground">· {x.member_count}</span></span>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="wz-team">{teams.length ? t("cc.wizard.add_another_team") : t("cc.teams.name")}</Label>
          <Input id="wz-team" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("cc.teams.name_placeholder")} />
        </div>
        <div className="space-y-1">
          <Label>{t("cc.teams.strategy")}</Label>
          <Select value={strategy} onValueChange={(v) => setStrategy(v as RoutingStrategy)}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s} value={s} disabled={s !== "ring_one" && !smartRouting}>{t(`cc.strategy.${s}` as const)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><Switch checked={queue} onCheckedChange={setQueue} />{t("cc.wizard.queue_when_busy")}</label>
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={create} disabled={saving || !name.trim()}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.teams.add")}</Button>
    </div>
  );
}

// ── step 4: agents ──────────────────────────────────────────────────────────

function AgentStep({ agents, teams, tenantId, onCreated }: { agents: CCAgent[]; teams: Team[]; tenantId: string | null; onCreated: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "", audio_mode: "browser" as AudioMode, team_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string; pending?: string } | null>(null);

  useEffect(() => {
    if (!form.team_id && teams[0]) setForm((f) => ({ ...f, team_id: teams[0].id }));
  }, [teams, form.team_id]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("cc.agents.copied") });
    } catch {
      toast({ title: t("cc.agents.copy_failed"), variant: "destructive" });
    }
  };

  const create = async () => {
    if (!tenantId) return setError(t("cc.agents.no_organization"));
    if (form.audio_mode === "handset" && !form.phone_number.trim()) return setError(t("cc.agents.handset_needs_phone"));
    setSaving(true);
    setError(null);
    const result = await provisionAgent({
      tenantId, email: form.email, first_name: form.first_name, last_name: form.last_name, role: "agent",
      phone_number: form.phone_number, audio_mode: form.audio_mode, team_ids: form.team_id ? [form.team_id] : [],
    });
    setSaving(false);
    if (result.ok === true) {
      setCreds({ email: form.email.trim().toLowerCase(), password: result.temporaryPassword });
      setForm((f) => ({ ...f, first_name: "", last_name: "", email: "", phone_number: "" }));
      onCreated();
      return;
    }
    const failure = result as Extract<typeof result, { ok: false }>;
    if (failure.failedAt === "profile" && failure.temporaryPassword) {
      // The login exists: never lose its one-time password. Finish the profile from the Agents page.
      setCreds({ email: form.email.trim().toLowerCase(), password: failure.temporaryPassword, pending: failure.error });
      onCreated();
    } else {
      setError(failure.error);
    }
  };

  const valid = form.first_name.trim() && form.last_name.trim() && /\S+@\S+\.\S+/.test(form.email);

  return (
    <div className="space-y-3">
      {agents.length > 0 && <p className="text-sm">{t("cc.wizard.agents_so_far", { count: agents.length })}: <span className="text-muted-foreground">{agents.map((a) => a.name).join(", ")}</span></p>}
      {teams.length === 0 && <Notice tone="warn">{t("cc.wizard.agents_need_team")}</Notice>}

      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder={t("cc.agents.first_name")} aria-label={t("cc.agents.first_name")} />
        <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder={t("cc.agents.last_name")} aria-label={t("cc.agents.last_name")} />
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("cc.agents.email")} aria-label={t("cc.agents.email")} autoComplete="off" />
        <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder={t("cc.agents.phone")} aria-label={t("cc.agents.phone")} inputMode="tel" className="font-mono" />
        <Select value={form.audio_mode} onValueChange={(v) => setForm({ ...form, audio_mode: v as AudioMode })}>
          <SelectTrigger aria-label={t("cc.agents.audio_mode")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="browser">{t("cc.mode.browser")}</SelectItem>
            <SelectItem value="handset">{t("cc.mode.handset")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
          <SelectTrigger aria-label={t("cc.agents.teams")}><SelectValue placeholder={t("cc.agents.teams")} /></SelectTrigger>
          <SelectContent>{teams.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={create} disabled={saving || !valid}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{t("cc.agents.create")}</Button>

      {creds && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950">
          <p className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />{t("cc.agents.credentials_warning")}</p>
          {[[t("cc.agents.email"), creds.email], [t("cc.agents.temp_password"), creds.password]].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
              <Input readOnly value={value} className="h-8 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copy(value)} aria-label={t("cc.agents.copy")}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          {creds.pending && <Notice tone="error">{t("cc.agents.profile_pending")} {creds.pending} <Link to="/call-center/agents" className="underline">{t("cc.nav.agents")}</Link></Notice>}
        </div>
      )}
    </div>
  );
}

// ── step 5: generate the IVR from the teams ─────────────────────────────────

function IvrStep({
  teams, routing, companyName, greeting, setGreeting, hasNumber, onGenerated,
}: {
  teams: Team[]; routing: boolean; companyName: string; greeting: string; setGreeting: (v: string) => void; hasNumber: boolean; onGenerated: () => void;
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedIvr | null>(null);

  const generate = async (replace = false) => {
    setBusy(true);
    setError(null);
    const res = await callCenterApi.generateIvr({ greeting: greeting.trim() || undefined, company_name: companyName.trim() || undefined, replace_active: replace });
    setBusy(false);
    if (res.success && res.data) {
      setResult(res.data);
      onGenerated();
      return;
    }
    // An existing flow already answers this number: ask before replacing what callers hear.
    if (res.status === 409 && window.confirm(`${describeError(res)}\n\n${t("cc.wizard.replace_confirm")}`)) {
      return generate(true);
    }
    setError(describeError(res));
  };

  return (
    <div className="space-y-3">
      {routing && !result && <Notice tone="ok">{t("cc.wizard.ivr_ok")}</Notice>}
      {!hasNumber && <Notice tone="warn">{t("cc.wizard.ivr_needs_number")}</Notice>}
      {teams.length === 0 && <Notice tone="warn">{t("cc.wizard.ivr_needs_team")}</Notice>}
      <div className="space-y-1">
        <Label htmlFor="wz-greeting">{t("cc.wizard.greeting")}</Label>
        <Input id="wz-greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder={t("cc.wizard.greeting_placeholder")} />
        <p className="text-xs text-muted-foreground">{t("cc.wizard.greeting_hint")}</p>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={() => generate(false)} disabled={busy || teams.length === 0 || !hasNumber}>
        {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{routing ? t("cc.wizard.regenerate") : t("cc.wizard.generate")}
      </Button>
      {result && (
        <div className="space-y-1 rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium">{t("cc.wizard.menu_created", { number: result.phone_number })}</p>
          {result.menu.length > 0 ? result.menu.map((m) => <p key={m.digit}><b>{m.digit}</b> → {m.team}</p>) : <p className="text-muted-foreground">{t("cc.wizard.single_team_menu")}</p>}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("cc.wizard.ivr_builder_hint")} <Link to="/voice/ivr" className="underline">{t("nav.ivr_flows")}</Link></p>
    </div>
  );
}

// ── step 6: routing per team ────────────────────────────────────────────────

function RoutingStep({ teams, onChanged }: { teams: Team[]; onChanged: () => void }) {
  const { t } = useLanguage();
  const { smart_routing: smartRouting } = usePlanFlags();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = async (team: Team, body: Parameters<typeof callCenterApi.teams.update>[1]) => {
    setBusyId(team.id);
    const res = await callCenterApi.teams.update(team.id, body);
    setBusyId(null);
    if (!res.success) toast({ title: t("cc.teams.load_failed"), description: describeError(res), variant: "destructive" });
    onChanged();
  };

  if (teams.length === 0) return <Notice tone="warn">{t("cc.wizard.ivr_needs_team")}</Notice>;
  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <div key={team.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{team.name}</p>
            {team.member_count === 0 && <span className="text-xs text-amber-600">{t("cc.teams.no_members")}</span>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={team.routing_strategy} onValueChange={(v) => patch(team, { routing_strategy: v as RoutingStrategy })} disabled={busyId === team.id}>
              <SelectTrigger aria-label={t("cc.teams.strategy")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((s) => (
                  <SelectItem key={s} value={s} disabled={s !== "ring_one" && !smartRouting && s !== team.routing_strategy}>
                    {t(`cc.strategy.${s}` as const)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={team.overflow_team ?? "none"}
              onValueChange={(v) => patch(team, { overflow_team: v === "none" ? null : v })}
              disabled={busyId === team.id}
            >
              <SelectTrigger aria-label={t("cc.teams.overflow")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("cc.teams.overflow_none")}</SelectItem>
                {teams.filter((x) => x.id !== team.id).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={team.queue_enabled} onCheckedChange={(v) => patch(team, { queue_enabled: v })} disabled={busyId === team.id} />
            {t("cc.wizard.queue_when_busy")}
          </label>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("cc.wizard.routing_more")} <Link to="/call-center/teams" className="underline">{t("cc.nav.teams")}</Link></p>
    </div>
  );
}

// ── step 8: go live ─────────────────────────────────────────────────────────

function LiveStep({
  settings, testDone, onChanged, toast,
}: {
  settings: CallCenterSettings | null; testDone: boolean; onChanged: () => void; toast: ReturnType<typeof useToast>["toast"];
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const r = settings?.readiness;
  const items = useMemo(
    () => [
      { key: "number", ok: !!r?.number },
      { key: "team", ok: !!r?.team },
      { key: "staffed", ok: !!r?.staffed },
      { key: "routing", ok: !!r?.routing },
      { key: "test", ok: testDone },
    ],
    [r, testDone],
  );

  const toggle = async (live: boolean) => {
    setBusy(true);
    setError(null);
    const res = await callCenterApi.settings.patch({ is_live: live });
    setBusy(false);
    if (!res.success) return setError(describeError(res));
    toast({ title: live ? t("cc.wizard.live_toast") : t("cc.wizard.paused_toast") });
    onChanged();
  };

  if (settings?.is_live) {
    return (
      <div className="space-y-3">
        <Notice tone="ok"><PartyPopper className="mr-1 inline h-4 w-4" />{t("cc.wizard.is_live")}</Notice>
        <Button variant="outline" onClick={() => toggle(false)} disabled={busy}>{t("cc.wizard.pause")}</Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-2 text-sm">
            {i.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            <span className={i.ok ? "" : "text-muted-foreground"}>{t(ccKey(`cc.wizard.check_${i.key}`))}</span>
          </li>
        ))}
      </ul>
      {!r?.ready && <Notice tone="warn">{t("cc.wizard.not_ready")}</Notice>}
      {!testDone && r?.ready && <Notice tone="warn">{t("cc.wizard.no_test_yet")}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <Button onClick={() => toggle(true)} disabled={busy || !r?.ready} className="gap-1.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{t("cc.wizard.go_live")}
      </Button>
    </div>
  );
}

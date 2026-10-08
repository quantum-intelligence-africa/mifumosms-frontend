// Call-center packages: what each includes, which one the organization is on,
// how much of it is used, and a request button. There is no online payment — a
// request is activated by SENDA once the payment is confirmed.
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Check, Clock, FileText, Gift, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { ccKey } from "@/i18n/callCenter";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { PlanCheckoutDialog } from "@/components/callcenter/PlanCheckoutDialog";
import { InvoiceDialog } from "@/components/callcenter/InvoiceDialog";
import {
  callCenterApi, describeError,
  type InvoiceRow, type Meter, type PlanInfo, type PlanRequest, type PlanStatus, type SubscriptionState,
} from "@/services/callCenterApi";

const SALES_EMAIL = "support@mifumosms.com"; // the existing support address; swap for a sales inbox if you have one

function formatPrice(plan: Pick<PlanInfo, "price" | "currency">): string {
  const n = Number(plan.price);
  return `${plan.currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function CallCenterPlans() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [pending, setPending] = useState<PlanRequest | null>(null);
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanInfo | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [sr, br, ir] = await Promise.all([callCenterApi.plan(), apiClient.getCallCenterSubscription(), apiClient.listCallCenterInvoices()]);
    if (sr.success && sr.data) setStatus(sr.data);
    else setError(sr.status === 403 ? t("cc.plans.only_admins") : sr.error || t("cc.plans.load_failed"));
    if (br.success && br.data) {
      setSub(br.data as SubscriptionState);
      setPending(((br.data as SubscriptionState).pending as PlanRequest | null) ?? null);
    }
    if (ir.success && Array.isArray(ir.data)) setInvoices(ir.data as InvoiceRow[]);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const request = async (plan: PlanInfo) => {
    setRequesting(plan.key);
    const res = await apiClient.requestCallCenterPlan(plan.key);
    setRequesting(null);
    if (res.success && res.data) {
      setPending(res.data as PlanRequest);
      toast({ title: t("cc.plans.request_sent"), description: t("cc.plans.request_sent_desc", { plan: plan.name }) });
    } else {
      toast({ title: t("cc.plans.request_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const currentKey = status?.plan?.key;
  const onSubscription = status?.source === "subscription";
  const live = sub?.current ?? null; // the plan running right now (paid or trial)
  const paidLive = live && !live.is_trial ? live : null;

  /** What the button on a plan card does for this customer. */
  const actionFor = (plan: PlanInfo): { label: string; disabled: boolean; hint?: string } => {
    if (paidLive) {
      const livePrice = Number(paidLive.plan.price ?? 0);
      const price = Number(plan.price ?? 0);
      if (plan.key === paidLive.plan.key) return { label: t("cc.plans.renew"), disabled: false };
      if (price < livePrice) {
        return { label: t("cc.plans.locked_downgrade", { date: paidLive.period_end ? new Date(paidLive.period_end).toLocaleDateString() : "" }), disabled: true };
      }
      return { label: t("cc.plans.upgrade"), disabled: false };
    }
    return { label: t("cc.plans.pay_now"), disabled: false };
  };

  return (
    <PageFrame title={t("cc.plans.title")} subtitle={t("cc.plans.subtitle")}>
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.try_again")}</Button>
          </CardContent>
        </Card>
      )}
      {!error && loading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>}

      {!error && !loading && status && (
        <div className="space-y-6">
          {pending && (
            <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              {t("cc.plans.pending", { plan: pending.plan.name })}
            </p>
          )}

          <TrialOrExpiryBanner live={live} t={t} />

          <UsageCard status={status} />

          {!onSubscription && status.plan && (
            <p className="text-sm text-muted-foreground">{t("cc.plans.default_note", { plan: status.plan.name })}</p>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {status.plans.map((plan) => {
              const isCurrent = onSubscription && plan.key === currentKey && !live?.is_trial;
              const isPending = pending?.plan.key === plan.key;
              const action = actionFor(plan);
              return (
                <Card key={plan.key} className={`flex flex-col ${plan.is_popular ? "border-primary shadow-md" : ""}`}>
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrent ? <Badge>{t("cc.plans.current_badge")}</Badge> : plan.is_popular && <Badge variant="secondary">{t("cc.plans.popular")}</Badge>}
                    </div>
                    {plan.tagline && <p className="text-xs text-muted-foreground">{plan.tagline}</p>}
                    <p className="pt-1 text-2xl font-bold">
                      {plan.is_custom || plan.price === null ? t("cc.plans.custom_price") : (
                        <>{formatPrice(plan)} <span className="text-sm font-normal text-muted-foreground">{t("cc.plans.per_month")}</span></>
                      )}
                    </p>
                    {isCurrent && status.subscription?.period_end && (
                      <p className="text-xs text-muted-foreground">
                        {t("cc.plans.active_until", { date: new Date(status.subscription.period_end).toLocaleDateString() })}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <ul className="space-y-1.5 text-sm">
                      {planLines(plan, t).map((line) => (
                        <li key={line} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />{line}</li>
                      ))}
                    </ul>
                    {plan.is_custom ? (
                      <Button variant="outline" asChild><a href={`mailto:${SALES_EMAIL}?subject=SENDA call center - ${plan.name}`}>{t("cc.plans.contact")}</a></Button>
                    ) : (
                      <Button
                        variant={plan.is_popular ? "default" : "outline"}
                        disabled={action.disabled || isPending || requesting !== null}
                        onClick={() => setCheckoutPlan(plan)}
                      >
                        {requesting === plan.key && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        {isPending ? t("cc.plans.request_sent") : isCurrent && !paidLive ? t("cc.plans.pay_now") : action.label}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{t("cc.plans.how")}</p>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />{t("cc.invoices.title")}</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("cc.invoices.empty")}</p>
              ) : (
                <div className="divide-y">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <p className="font-medium">{inv.number}</p>
                        <p className="text-xs text-muted-foreground">{inv.plan} · {new Date(inv.issued_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatPrice({ price: inv.total, currency: inv.currency })}</span>
                        <Button size="sm" variant="outline" onClick={() => setInvoiceId(inv.id)}>{t("cc.invoices.view")}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <PlanCheckoutDialog
        plan={checkoutPlan}
        onOpenChange={(open) => !open && setCheckoutPlan(null)}
        onPaid={() => void load()}
        onRequestInstead={(plan) => void request(plan)}
      />
      <InvoiceDialog subscriptionId={invoiceId} onClose={() => setInvoiceId(null)} />
    </PageFrame>
  );
}

type Translate = ReturnType<typeof useLanguage>["t"];

/** A free trial in progress, or a paid plan about to end — the two moments a customer should act. */
function TrialOrExpiryBanner({ live, t }: { live: PlanRequest | null; t: Translate }) {
  if (!live || live.days_left === null) return null;
  const urgent = live.days_left <= 3;
  const tone = urgent
    ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    : "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";
  if (live.is_trial) {
    const granted = Object.entries(live.feature_flags || {}).filter(([, on]) => on).map(([k]) => t(ccKey(`cc.flag.${k}`)));
    const all = live.feature_overrides === null || Object.values(live.feature_overrides || {}).every(Boolean);
    return (
      <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${tone}`}>
        <Gift className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">{t("cc.plans.trial_banner", { plan: live.plan.name, days: live.days_left })}</p>
          <p className="text-xs opacity-80">{all ? t("cc.plans.trial_all") : t("cc.plans.trial_some", { list: granted.join(", ") || "—" })}</p>
        </div>
      </div>
    );
  }
  if (live.days_left > 7) return null;
  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${tone}`}>
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="font-medium">{t("cc.plans.ending_soon", { days: live.days_left })}</p>
    </div>
  );
}

/** The plan's headline numbers, in the order people compare them. */
function planLines(plan: PlanInfo, t: Translate): string[] {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const lines = [
    plan.max_agents === null ? t("cc.plans.unlimited_agents") : t("cc.plans.agents", { n: fmt(plan.max_agents) }),
    plan.max_numbers === null ? t("cc.plans.unlimited_numbers") : t("cc.plans.numbers", { n: fmt(plan.max_numbers) }),
    plan.max_ivr_menus === null ? t("cc.plans.unlimited_menus") : t("cc.plans.menus", { n: fmt(plan.max_ivr_menus) }),
    plan.included_minutes === null ? t("cc.plans.unlimited_minutes") : t("cc.plans.minutes", { n: fmt(plan.included_minutes) }),
  ];
  if (plan.included_outbound_minutes) lines.push(t("cc.plans.minutes_out", { n: fmt(plan.included_outbound_minutes) }));
  if (plan.feature_flags?.smart_routing) lines.push(t("cc.plans.feat_routing"));
  if (plan.feature_flags?.working_hours) lines.push(t("cc.plans.feat_hours"));
  return [...lines, ...(plan.features || [])];
}

function UsageCard({ status }: { status: PlanStatus }) {
  const { t } = useLanguage();
  const rows: Array<[string, Meter]> = [
    [t("cc.plans.use_agents"), status.usage.agents],
    [t("cc.plans.use_numbers"), status.usage.numbers],
    [t("cc.plans.use_menus"), status.usage.menus],
    [t("cc.plans.use_inbound"), status.usage.inbound_minutes],
    ...(status.usage.outbound_minutes.limit !== null || status.usage.outbound_minutes.used > 0
      ? ([[t("cc.plans.use_outbound"), status.usage.outbound_minutes]] as Array<[string, Meter]>)
      : []),
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {t("cc.plans.usage_title")}
          {status.plan && <Badge variant="outline">{status.plan.name}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.warnings.map((w) => (
          <p key={w} className="flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {t(ccKey(`cc.plans.warn_${w.replace("_minutes_used_up", "_used").replace("_minutes_almost_used", "_almost")}`))}
          </p>
        ))}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([label, m]) => {
            const pct = m.limit ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={m.exceeded ? "font-semibold text-destructive" : "font-medium"}>
                    {m.limit === null ? t("cc.plans.used_unlimited", { used: m.used }) : t("cc.plans.used_of", { used: m.used, limit: m.limit })}
                  </span>
                </div>
                {m.limit !== null && <Progress value={pct} className={pct >= 100 ? "[&>div]:bg-destructive" : pct >= 80 ? "[&>div]:bg-amber-500" : ""} />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

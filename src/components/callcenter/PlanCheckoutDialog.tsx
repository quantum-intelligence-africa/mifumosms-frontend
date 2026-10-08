// Buy, renew or upgrade a call-center plan with mobile money.
//
// The flow: show the quote (with any upgrade credit) -> the customer enters their number ->
// we send the prompt -> this dialog polls until the payment is confirmed. The plan is
// switched on by the server the moment the payment is confirmed (webhook, sync or this
// poll — whichever sees it first), so closing the dialog never loses a payment.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { ccKey } from "@/i18n/callCenter";
import {
  describeError, PAYMENT_PROVIDERS,
  type CheckoutStarted, type CheckoutStatus, type PaymentProvider, type PlanInfo, type PlanQuote,
} from "@/services/callCenterApi";

const POLL_MS = 4000;
const GIVE_UP_AFTER_POLLS = 45; // ~3 minutes; the server keeps trying after we stop looking

type Stage = "form" | "sending" | "waiting" | "paid" | "failed" | "timeout";

const money = (amount: string | number, currency: string) => `${currency} ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const dateOnly = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString() : "");

interface Props {
  plan: PlanInfo | null;
  onOpenChange: (open: boolean) => void;
  /** Called after a confirmed payment, so the page can reload the plan and usage. */
  onPaid: () => void;
  /** The customer prefers to pay outside the app — ask SENDA to activate it. */
  onRequestInstead: (plan: PlanInfo) => void;
}

export function PlanCheckoutDialog({ plan, onOpenChange, onPaid, onRequestInstead }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [quote, setQuote] = useState<PlanQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: "", provider: "vodacom" as PaymentProvider, name: "", email: "" });
  const [paidPlan, setPaidPlan] = useState<{ until: string; email: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const stopPolling = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopPolling();
    };
  }, []);

  // A fresh quote each time the dialog opens for a plan.
  useEffect(() => {
    stopPolling();
    setStage("form");
    setError(null);
    setQuote(null);
    setQuoteError(null);
    if (!plan) return;
    setForm((f) => ({
      ...f,
      phone: f.phone || user?.phone_number || user?.phone || "",
      name: f.name || [user?.first_name, user?.last_name].filter(Boolean).join(" "),
      email: f.email || user?.email || "",
    }));
    let cancelled = false;
    void apiClient.quoteCallCenterPlan(plan.key).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setQuote(res.data as PlanQuote);
      else setQuoteError(describeError(res));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.key]);

  const poll = useCallback(
    (subscriptionId: string, attempt: number) => {
      timer.current = setTimeout(async () => {
        if (!alive.current) return;
        const res = await apiClient.getCallCenterCheckout(subscriptionId);
        if (!alive.current) return;
        if (res.success && res.data) {
          const body = res.data as CheckoutStatus;
          if (body.outcome === "paid") {
            setPaidPlan({ until: dateOnly(body.subscription.period_end), email: form.email });
            setStage("paid");
            onPaid();
            return;
          }
          if (body.outcome === "failed") {
            setStage("failed");
            return;
          }
        }
        if (attempt >= GIVE_UP_AFTER_POLLS) setStage("timeout");
        else poll(subscriptionId, attempt + 1);
      }, POLL_MS);
    },
    [form.email, onPaid],
  );

  const submit = async () => {
    if (!plan) return;
    setStage("sending");
    setError(null);
    const res = await apiClient.startCallCenterCheckout({
      plan: plan.key, buyer_phone: form.phone, mobile_money_provider: form.provider,
      buyer_name: form.name, buyer_email: form.email,
    });
    if (!alive.current) return;
    if (!res.success || !res.data) {
      setError(describeError(res));
      setStage("form");
      return;
    }
    setStage("waiting");
    poll((res.data as CheckoutStarted).subscription_id, 1);
  };

  const close = (open: boolean) => {
    if (!open) stopPolling();
    onOpenChange(open);
  };

  const canPay = !!quote && !quote.blocked && /^(\+?255|0)[67]\d{8}$/.test(form.phone.replace(/[\s-]/g, "")) && /\S+@\S+\.\S+/.test(form.email);

  return (
    <Dialog open={!!plan} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {plan && (
          <>
            <DialogHeader>
              <DialogTitle>{t("cc.pay.title", { plan: plan.name })}</DialogTitle>
              <DialogDescription>{t("cc.pay.desc")}</DialogDescription>
            </DialogHeader>

            {(stage === "form" || stage === "sending") && (
              <div className="space-y-4">
                {!quote && !quoteError && <Skeleton className="h-24" />}
                {quoteError && <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{quoteError}</p>}
                {quote && (
                  <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between"><span>{t("cc.pay.line_plan", { plan: plan.name, days: quote.period_days })}</span><span>{money(quote.price, quote.currency)}</span></div>
                    {Number(quote.credit) > 0 && (
                      <div className="flex justify-between text-green-700 dark:text-green-400"><span>{t("cc.pay.line_credit")}</span><span>− {money(quote.credit, quote.currency)}</span></div>
                    )}
                    <div className="flex justify-between border-t pt-1 font-semibold"><span>{t("cc.pay.total")}</span><span>{money(quote.total, quote.currency)}</span></div>
                    <p className="pt-1 text-xs text-muted-foreground">
                      {quote.action === "renew" ? t("cc.pay.note_renew", { date: dateOnly(quote.current_period_end) })
                        : quote.action === "upgrade" ? t("cc.pay.note_upgrade") : t("cc.pay.note_new")}
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="pay-phone">{t("cc.pay.phone")}</Label>
                    <Input id="pay-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0744 963 858" inputMode="tel" className="font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("cc.pay.provider")}</Label>
                    <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v as PaymentProvider })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{t(ccKey(`cc.pay.provider_${p}`))}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="pay-name">{t("cc.pay.name")}</Label>
                    <Input id="pay-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pay-email">{t("cc.pay.email")}</Label>
                    <Input id="pay-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                {error && <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{t("cc.pay.start_failed")}.</strong> {error}</span></p>}

                <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                  <Button onClick={submit} disabled={!canPay || stage === "sending"} className="w-full">
                    {stage === "sending" ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{t("cc.pay.sending")}</> : t("cc.pay.submit", { amount: quote ? money(quote.total, quote.currency) : "" })}
                  </Button>
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { onRequestInstead(plan); close(false); }}>
                    {t("cc.plans.request_instead")}
                  </button>
                </DialogFooter>
              </div>
            )}

            {stage === "waiting" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Smartphone className="h-10 w-10 text-primary" />
                <h3 className="text-base font-semibold">{t("cc.pay.waiting_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("cc.pay.waiting_desc", { phone: form.phone })}</p>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {stage === "paid" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <h3 className="text-base font-semibold">{t("cc.pay.success_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("cc.pay.success_desc", { plan: plan.name, date: paidPlan?.until ?? "", email: paidPlan?.email ?? "" })}</p>
                <Button onClick={() => close(false)}>{t("cc.pay.close")}</Button>
              </div>
            )}

            {stage === "failed" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <XCircle className="h-10 w-10 text-destructive" />
                <h3 className="text-base font-semibold">{t("cc.pay.failed_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("cc.pay.failed_desc")}</p>
                <Button onClick={() => setStage("form")}>{t("cc.pay.try_again")}</Button>
              </div>
            )}

            {stage === "timeout" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="text-sm text-muted-foreground">{t("cc.pay.timeout")}</p>
                <Button onClick={() => close(false)}>{t("cc.pay.close")}</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

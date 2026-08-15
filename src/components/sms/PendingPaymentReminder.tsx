import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { detectMobileMoneyProvider, validatePhoneNumber } from "@/utils/phoneUtils";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Fallbacks used only if the admin-configured settings can't be fetched —
// the real values (and message text) are controlled from Senda Admin
// (Messaging → Pending Payment Reminder), stored in PendingPaymentReminderSettings.
const DEFAULT_WAIT_HOURS = 5;
const DEFAULT_REMIND_INTERVAL_HOURS = 12;
const DEFAULT_MESSAGE =
  "Habari {name}, bado hujakamilisha malipo ya {credits} za salio (TZS {amount}). " +
  "Tafadhali ingia kwenye akaunti yako na ukamilishe malipo ili salio lako liongezwe.";

const STORAGE_KEY_PREFIX = "pending_payment_reminder";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24; // ~2 minutes

const MOBILE_MONEY_PROVIDER_NAMES: Record<string, string> = {
  vodacom: "Vodacom M-Pesa",
  tigo: "Tigo Pesa",
  airtel: "Airtel Money",
  halotel: "Halotel Money",
};

type PendingPurchase = {
  id: string;
  invoice_number: string;
  amount: string;
  credits: number;
  purchase_type: "sms" | "whatsapp";
  created_at: string;
};

type ThrottleState = { purchaseId: string; lastShownAt: number };

function readThrottle(userId: string): ThrottleState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeThrottle(userId: string, state: ThrottleState) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}:${userId}`, JSON.stringify(state));
  } catch {
    // Private browsing / storage quota — worst case we remind slightly more often.
  }
}

function renderMessage(template: string, name: string, credits: number, amount: number) {
  return template
    .replace("{name}", name || "Mteja")
    .replace("{credits}", credits.toLocaleString())
    .replace("{amount}", amount.toLocaleString());
}

// Mounted once at the app root. Checks for a stuck pending SMS/WhatsApp
// credit purchase right after the user logs in, and — without spamming,
// per admin-configured cadence — reminds them (in Swahili) to complete it,
// letting them pay to any number right there.
export function PendingPaymentReminder() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const wasAuthenticatedRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState<"idle" | "pending" | "failed" | "completed">("idle");

  const detectedProvider = useMemo(() => detectMobileMoneyProvider(phone), [phone]);

  useEffect(() => {
    const justLoggedIn = isAuthenticated && !wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = isAuthenticated;
    if (!justLoggedIn || !user?.id) return;

    const userId = String(user.id);

    (async () => {
      try {
        const [settingsResponse, pendingResponse] = await Promise.all([
          apiClient.getPendingPaymentReminderSettings(),
          apiClient.getMyPendingPayment(),
        ]);

        const settings = settingsResponse.success ? settingsResponse.data : undefined;
        if (settings && settings.enabled === false) return;

        const waitHours = settings?.wait_hours ?? DEFAULT_WAIT_HOURS;
        const remindIntervalHours = settings?.remind_interval_hours ?? DEFAULT_REMIND_INTERVAL_HOURS;
        const template = settings?.message || DEFAULT_MESSAGE;

        const purchase = pendingResponse.success ? pendingResponse.data?.purchase : undefined;
        if (!purchase) return;

        const ageMs = Date.now() - new Date(purchase.created_at).getTime();
        if (ageMs < waitHours * 60 * 60 * 1000) return;

        const throttle = readThrottle(userId);
        const dueForReminder =
          !throttle ||
          throttle.purchaseId !== purchase.id ||
          Date.now() - throttle.lastShownAt >= remindIntervalHours * 60 * 60 * 1000;
        if (!dueForReminder) return;

        setMessageTemplate(template);
        setPendingPurchase(purchase);
        setPhone("");
        setAttemptStatus("idle");
        setOpen(true);
        writeThrottle(userId, { purchaseId: purchase.id, lastShownAt: Date.now() });
      } catch (error) {
        logger.warn("Error checking pending payment");
      }
    })();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handlePayNow = async () => {
    if (!pendingPurchase || !user) return;

    if (!phone.trim() || !validatePhoneNumber(phone)) {
      toast({
        title: "Namba ya simu inahitajika",
        description: "Tafadhali ingiza namba sahihi ya pesa za simu",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setAttemptStatus("idle");

    const buyerName = user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

    try {
      const response = await apiClient.initiateCustomSMSPayment({
        credits: pendingPurchase.credits,
        purchase_type: pendingPurchase.purchase_type,
        buyer_email: user.email,
        buyer_name: buyerName,
        buyer_phone: phone,
        mobile_money_provider: detectedProvider || "vodacom",
      });

      if (!response.success || !response.data) {
        setAttemptStatus("failed");
        setSubmitting(false);
        toast({
          title: "Malipo yameshindikana",
          description: response.error || "Imeshindikana kuanzisha malipo. Tafadhali jaribu namba nyingine.",
          variant: "destructive",
        });
        return;
      }

      setAttemptStatus("pending");
      toast({ title: "Malipo yameanzishwa", description: "Tafadhali angalia simu yako kwa ujumbe wa pesa za simu" });

      const { transaction_id } = response.data;
      if (!transaction_id) {
        setSubmitting(false);
        return;
      }

      let attempts = 0;
      pollingRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const statusResponse = await apiClient.checkPaymentStatus(transaction_id);
          const status = statusResponse.success ? statusResponse.data?.status : undefined;

          if (status === "completed") {
            stopPolling();
            setAttemptStatus("completed");
            setSubmitting(false);
            toast({ title: "Malipo yamefanikiwa!", description: "Salio lako limeongezwa kwenye akaunti yako" });
            setTimeout(() => setOpen(false), 1500);
          } else if (status === "failed" || status === "expired") {
            stopPolling();
            setAttemptStatus("failed");
            setSubmitting(false);
          }
        } catch {
          // A single failed status check shouldn't abort the wait.
        }

        if (attempts >= MAX_POLL_ATTEMPTS && pollingRef.current) {
          stopPolling();
          setSubmitting(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (error) {
      logger.warn("Error retrying pending payment");
      setAttemptStatus("failed");
      setSubmitting(false);
      toast({
        title: "Malipo yameshindikana",
        description: "Hitilafu imetokea. Tafadhali jaribu tena.",
        variant: "destructive",
      });
    }
  };

  if (!pendingPurchase) return null;

  const amount = parseFloat(pendingPurchase.amount || "0");
  const recipientName = user?.first_name || user?.full_name || "";
  const renderedMessage = renderMessage(messageTemplate, recipientName, pendingPurchase.credits, amount);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) stopPolling();
      }}
    >
      <DialogContent className="glass max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Malipo Yanasubiri</DialogTitle>
          <DialogDescription>{renderedMessage}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-between text-sm py-1 border-b border-border-subtle">
            <span className="text-text-subtle">Agizo</span>
            <span className="font-medium">{pendingPurchase.invoice_number}</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-border-subtle">
            <span className="text-text-subtle">Kiasi</span>
            <span className="font-medium text-primary">TZS {amount.toLocaleString()}</span>
          </div>

          {attemptStatus === "completed" ? (
            <div className="flex items-center gap-2 text-success text-sm p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-4 h-4" /> Malipo yamekamilika!
            </div>
          ) : (
            <>
              {attemptStatus === "failed" && (
                <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Jaribio hilo halikufanikiwa — jaribu namba nyingine ya pesa za simu.
                </div>
              )}
              {attemptStatus === "pending" && (
                <div className="flex items-center gap-2 text-sm p-2 bg-primary/5 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" /> Inasubiri uthibitisho kwenye simu yako…
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="pendingPaymentPhone" className="text-sm">Namba ya Pesa za Simu</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    id="pendingPaymentPhone"
                    type="tel"
                    placeholder="mfano, 0762 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    disabled={submitting}
                  />
                  {detectedProvider && (
                    <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                      {MOBILE_MONEY_PROVIDER_NAMES[detectedProvider]}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting && attemptStatus === "pending"}>
            Nikumbushe baadaye
          </Button>
          {attemptStatus !== "completed" && (
            <Button onClick={handlePayNow} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Inachakata…
                </>
              ) : (
                "Lipa Sasa"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A paid plan's invoice: read it, print / save it as PDF, or have it emailed again.
import { useEffect, useState } from "react";
import { Loader2, Mail, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiClient } from "@/lib/api";
import { describeError, type InvoiceDetail } from "@/services/callCenterApi";

const money = (amount: string | number, currency: string) => `${currency} ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A standalone printable page, so printing never drags the whole app along. */
function printableHtml(inv: InvoiceDetail): string {
  const rows = inv.items
    .map((i) => `<tr><td>${esc(i.description)}</td><td class="r">${i.quantity}</td><td class="r">${esc(money(i.amount, inv.currency))}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.number)}</title><style>
    body{font-family:Arial,sans-serif;color:#111827;max-width:680px;margin:32px auto;padding:0 16px}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
    th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}.r{text-align:right}
    .total td{font-weight:bold;border-bottom:0}
  </style></head><body>
    <h2>${esc(inv.brand)} — Invoice ${esc(inv.number)}</h2>
    <p>Issued ${esc(new Date(inv.issued_at).toLocaleDateString())} · <strong>PAID</strong></p>
    <p>Billed to <strong>${esc(inv.bill_to.name)}</strong> (${esc(inv.organization)})<br>${esc(inv.bill_to.email)}</p>
    <table><tr><th>Description</th><th class="r">Qty</th><th class="r">Amount</th></tr>${rows}
    <tr class="total"><td colspan="2" class="r">Total paid</td><td class="r">${esc(money(inv.total, inv.currency))}</td></tr></table>
    <p style="color:#6b7280;font-size:13px">Payment: ${esc(inv.payment_method)}${inv.payment_reference ? " · ref " + esc(inv.payment_reference) : ""}</p>
  </body></html>`;
}

export function InvoiceDialog({ subscriptionId, onClose }: { subscriptionId: string | null; onClose: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    setInvoice(null);
    setError(null);
    if (!subscriptionId) return;
    let cancelled = false;
    void apiClient.getCallCenterInvoice(subscriptionId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setInvoice(res.data as InvoiceDetail);
      else setError(describeError(res) || t("cc.invoices.load_failed"));
    });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId, t]);

  const print = () => {
    if (!invoice) return;
    const win = window.open("", "_blank", "width=760,height=900");
    if (!win) return;
    win.document.write(printableHtml(invoice));
    win.document.close();
    win.focus();
    win.print();
  };

  const emailCopy = async () => {
    if (!subscriptionId) return;
    setEmailing(true);
    const res = await apiClient.emailCallCenterInvoice(subscriptionId);
    setEmailing(false);
    if (res.success) toast({ title: t("cc.invoice.emailed") });
    else toast({ title: t("cc.invoice.email_failed"), description: describeError(res), variant: "destructive" });
  };

  return (
    <Dialog open={!!subscriptionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {invoice ? t("cc.invoice.title", { number: invoice.number }) : t("cc.invoices.title")}
            {invoice && <Badge className="bg-green-600">{t("cc.invoice.paid")}</Badge>}
          </DialogTitle>
          <DialogDescription>{invoice ? `${invoice.brand} · ${new Date(invoice.issued_at).toLocaleDateString()}` : ""}</DialogDescription>
        </DialogHeader>

        {!invoice && !error && <Skeleton className="h-40" />}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {invoice && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("cc.invoice.billed_to")}</p>
              <p className="font-medium">{invoice.bill_to.name}</p>
              <p className="text-muted-foreground">{invoice.organization} · {invoice.bill_to.email}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 font-medium">{t("cc.invoice.description")}</th>
                  <th className="py-1.5 text-right font-medium">{t("cc.invoice.qty")}</th>
                  <th className="py-1.5 text-right font-medium">{t("cc.invoice.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((i) => (
                  <tr key={i.description} className="border-b">
                    <td className="py-1.5 pr-2">{i.description}</td>
                    <td className="py-1.5 text-right">{i.quantity}</td>
                    <td className="py-1.5 text-right">{money(i.amount, invoice.currency)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-2" colSpan={2}>{t("cc.invoice.total")}</td>
                  <td className="pt-2 text-right">{money(invoice.total, invoice.currency)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">
              {t("cc.invoice.payment")}: {invoice.payment_method}{invoice.payment_reference ? ` · ref ${invoice.payment_reference}` : ""}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={emailCopy} disabled={!invoice || emailing}>
            {emailing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}{t("cc.invoice.email_me")}
          </Button>
          <Button onClick={print} disabled={!invoice}><Printer className="mr-1.5 h-4 w-4" />{t("cc.invoice.print")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

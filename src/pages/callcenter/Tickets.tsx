import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Bot, Loader2, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { appLocale } from "@/utils/appLocale";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { aiKey } from "@/i18n/aiAgent";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { SummaryLines } from "@/components/callcenter/AiHandoffCard";
import { aiAgentApi, type Ticket, type TicketStatus } from "@/services/aiAgentApi";
import { callCenterApi, describeError, type CCAgent } from "@/services/callCenterApi";

const STATUSES: TicketStatus[] = ["open", "assigned", "pending_customer", "resolved", "closed"];
const ALL = "all";

const statusStyle: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-900",
  assigned: "bg-sky-100 text-sky-900",
  pending_customer: "bg-violet-100 text-violet-900",
  resolved: "bg-green-100 text-green-900",
  closed: "bg-muted text-muted-foreground",
};

export default function Tickets() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const supervisor = isCallCenterSupervisor(user);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await aiAgentApi.tickets.list({ status: status === ALL ? undefined : status, q: query.trim() || undefined });
    if (res.success && res.data) setTickets(res.data.results);
    else setError(t("ai.tk.load_failed"));
    setLoading(false);
  }, [status, query, t]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    if (supervisor) void callCenterApi.agents.list({ active: true }).then((res) => res.success && res.data && setAgents(res.data));
  }, [supervisor]);

  const openTicket = async (id: string) => {
    setOpenId(id);
    setDetail(null);
    const res = await aiAgentApi.tickets.get(id);
    if (res.success && res.data) setDetail(res.data);
  };

  const update = async (body: Parameters<typeof aiAgentApi.tickets.update>[1]) => {
    if (!detail) return;
    setBusy(true);
    const res = await aiAgentApi.tickets.update(detail.id, body);
    setBusy(false);
    if (res.success && res.data) {
      toast({ title: t("ai.tk.updated") });
      setDetail(res.data);
      void load();
    } else {
      toast({ title: t("ai.tk.update_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const retry = async (id: string) => {
    setBusy(true);
    const res = await aiAgentApi.retryEmail(id);
    setBusy(false);
    toast({ title: res.success && res.data?.status === "sent" ? t("ai.tk.retry_ok") : t("ai.tk.retry_failed"), variant: res.success && res.data?.status === "sent" ? undefined : "destructive" });
    if (detail) void openTicket(detail.id);
  };

  const when = (iso: string) => new Date(iso).toLocaleString(appLocale(), { dateStyle: "short", timeStyle: "short" });

  return (
    <PageFrame
      title={t("ai.tk.title")}
      subtitle={t("ai.tk.subtitle")}
      actions={<Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("sms.common.refresh")}</Button>}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("ai.tk.search")} aria-label={t("ai.tk.search")} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("ai.tk.all")}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(aiKey(`ai.tk.status.${s}`))}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" /> {error}</p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : tickets.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("ai.tk.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">{t("ai.tk.col_ref")}</th>
                    <th className="px-4 py-2">{t("ai.tk.col_request")}</th>
                    <th className="px-4 py-2">{t("ai.tk.col_caller")}</th>
                    <th className="hidden px-4 py-2 md:table-cell">{t("ai.tk.col_dept")}</th>
                    <th className="px-4 py-2">{t("ai.tk.col_status")}</th>
                    <th className="hidden px-4 py-2 md:table-cell">{t("ai.tk.col_when")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((tk) => (
                    <tr key={tk.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40" onClick={() => void openTicket(tk.id)}>
                      <td className="px-4 py-2.5 font-mono text-xs">{tk.reference}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{tk.title}</span>
                        <span className="block text-xs text-muted-foreground">{t(aiKey(`ai.tk.type.${tk.request_type}`))}{tk.priority === "high" ? ` · ${t("ai.tk.priority.high")}` : ""}</span>
                      </td>
                      <td className="px-4 py-2.5">{tk.contact_name || tk.contact_phone || "—"}</td>
                      <td className="hidden px-4 py-2.5 md:table-cell">{tk.department ? t(aiKey(`ai.dept.${tk.department}`)) : "—"}</td>
                      <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[tk.status]}`}>{t(aiKey(`ai.tk.status.${tk.status}`))}</span></td>
                      <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{when(tk.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {!detail ? (
            <div className="space-y-3 py-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24" /></div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{detail.reference}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[detail.status]}`}>{t(aiKey(`ai.tk.status.${detail.status}`))}</span>
                </DialogTitle>
                <DialogDescription>{detail.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t(aiKey(`ai.tk.type.${detail.request_type}`))}</Badge>
                  {detail.department && <Badge variant="outline">{t(aiKey(`ai.dept.${detail.department}`))}</Badge>}
                  {detail.created_by_ai && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bot className="h-3.5 w-3.5" />{t("ai.tk.by_ai")}</span>}
                </div>

                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.contact")}</p>
                  <p>{[detail.contact_name, detail.contact_phone, detail.contact_email].filter(Boolean).join(" · ") || "—"}</p>
                  {detail.preferred_callback_note && <p className="text-muted-foreground">{t("ai.tk.callback_note")}: {detail.preferred_callback_note}</p>}
                </section>

                {detail.description && (
                  <section>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.description")}</p>
                    <p className="whitespace-pre-wrap">{detail.description}</p>
                  </section>
                )}
                {detail.summary && <SummaryLines summary={detail.summary} />}

                <section className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{t("ai.tk.col_status")}</Label>
                    <Select value={detail.status} onValueChange={(v) => void update({ status: v as TicketStatus })} disabled={busy}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(aiKey(`ai.tk.status.${s}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("ai.tk.priority")}</Label>
                    <Select value={detail.priority} onValueChange={(v) => void update({ priority: v })} disabled={busy}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{(["low", "normal", "high"] as const).map((p) => <SelectItem key={p} value={p}>{t(aiKey(`ai.tk.priority.${p}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    {supervisor ? (
                      <Select value={detail.assigned_to ?? "none"} onValueChange={(v) => void update({ assigned_to: v === "none" ? null : v })} disabled={busy}>
                        <SelectTrigger><SelectValue placeholder={t("ai.tk.unassigned")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("ai.tk.unassigned")}</SelectItem>
                          {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : detail.assigned_to ? (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void update({ assigned_to: null })}>{t("ai.tk.release")}</Button>
                    ) : (
                      <Button size="sm" disabled={busy} onClick={() => void update({ assigned_to: "me" })}>{t("ai.tk.take")}</Button>
                    )}
                    {detail.assigned_name && <p className="mt-1 text-xs text-muted-foreground">{t("ai.tk.assigned_to", { name: detail.assigned_name })}</p>}
                  </div>
                </section>

                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.emails")}</p>
                  {(detail.notifications ?? []).length === 0 ? (
                    <p className="text-muted-foreground">{t("ai.tk.email_none")}</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.notifications!.map((n) => (
                        <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate">{n.to}</span>
                            <span className="text-xs text-muted-foreground">
                              {t(n.kind === "internal" ? "ai.tk.email_internal" : "ai.tk.email_customer")} · {t(aiKey(`ai.tk.email_status.${n.status}`))}
                              {n.attempts > 1 ? ` · ${t("ai.tk.email_attempts", { count: n.attempts })}` : ""}
                            </span>
                            {n.status === "failed" && n.last_error && <span className="block text-xs text-red-700">{n.last_error}</span>}
                          </span>
                          {n.status === "failed" && supervisor && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => void retry(n.id)}>
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("ai.tk.retry")}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {detail.call_id && (
                  <Link to="/call-center/history" className="text-sm text-primary underline-offset-2 hover:underline">{t("ai.tk.open_call")}</Link>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

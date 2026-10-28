// Ask for the organization's shared Team Inbox data (conversations, messages, notes, WhatsApp call records) to be deleted. Only that data goes:
// the account, the organization and everything else stay. Nothing is removed when this is submitted: a SENDA administrator reviews every request
// in the admin dashboard, and the person can cancel while it is waiting.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { appLanguage } from "@/utils/appLocale";

interface DeletionRequest { id: string; status: "pending" | "approved" | "completed" | "rejected" | "cancelled" | "failed"; reason: string; requested_at: string; admin_note: string; completed_at: string | null }
interface Organization { id: string; name: string; role: string; conversations: number; messages: number; calls: number; request: DeletionRequest | null }
interface Status { has_password: boolean; organizations: Organization[] }

const TEXT = {
  en: {
    title: "Delete shared inbox data", intro: "Permanently delete the shared Team Inbox data of your organization. Your account and everything else stay.",
    holds: (c: number, m: number, k: number) => `It holds ${c.toLocaleString()} conversations, ${m.toLocaleString()} messages and ${k.toLocaleString()} WhatsApp call records.`,
    erases: "What will be erased", erasesList: "Every conversation and message in the shared inbox, with its reactions and internal notes, and the WhatsApp call records.",
    stays: "What stays: your account and sign-in, the organization, your contacts, campaigns, SMS, WhatsApp settings, inbox settings, team and billing. Copies of messages on your customers' phones are outside SENDA's control.",
    permanent: "This cannot be undone.", review: "A SENDA administrator reviews every request before anything is deleted. Until then nothing changes, and you can cancel the request.",
    understand: "I understand that this inbox data will be permanently deleted.", reason: "Why do you want this? (optional)", password: "Your password", email: "Type your account email to confirm",
    submit: "Request deletion", submitting: "Sending...", sent: "Request sent", sentBody: "A SENDA administrator will review it. We emailed you a confirmation.",
    pendingTitle: "Waiting for review", pendingBody: (d: string) => `You asked for this on ${d}. A SENDA administrator is reviewing it. Nothing has changed.`,
    approvedTitle: "Being deleted", approvedBody: "Your request was approved and the inbox data is being erased.",
    completedTitle: "Deleted", completedBody: (d: string) => `The shared inbox data was permanently deleted on ${d}.`,
    rejectedTitle: "Request not approved", rejectedBody: "Nothing was deleted. You can send a new request.", note: "Note from the administrator",
    failedTitle: "There was a problem", failedBody: "The request was approved but could not be completed yet. SENDA support will finish it. Nothing is half-deleted.",
    cancel: "Cancel request", cancelled: "Request cancelled", again: "Make a new request", none: "Only an owner or admin of an organization can ask to delete its inbox data.", error: "Something went wrong. Try again.",
  },
  sw: {
    title: "Futa data ya sanduku la pamoja", intro: "Futa kabisa data ya sanduku la pamoja la timu ya shirika lako. Akaunti yako na kila kitu kingine kinabaki.",
    holds: (c: number, m: number, k: number) => `Lina mazungumzo ${c.toLocaleString()}, ujumbe ${m.toLocaleString()} na rekodi ${k.toLocaleString()} za simu za WhatsApp.`,
    erases: "Kitakachofutwa", erasesList: "Kila mazungumzo na ujumbe kwenye sanduku la pamoja, pamoja na hisia na madokezo ya ndani, na rekodi za simu za WhatsApp.",
    stays: "Kinachobaki: akaunti yako na kuingia, shirika, anwani zako, kampeni, SMS, mipangilio ya WhatsApp, mipangilio ya sanduku, timu na malipo. Nakala za ujumbe kwenye simu za wateja wako haziko chini ya SENDA.",
    permanent: "Haiwezi kurudishwa.", review: "Msimamizi wa SENDA hukagua kila ombi kabla ya chochote kufutwa. Hadi hapo hakuna kinachobadilika, na unaweza kughairi ombi.",
    understand: "Naelewa kuwa data hii ya sanduku itafutwa kabisa.", reason: "Kwa nini unataka hivi? (si lazima)", password: "Nenosiri lako", email: "Andika barua pepe ya akaunti yako kuthibitisha",
    submit: "Omba kufutwa", submitting: "Inatuma...", sent: "Ombi limetumwa", sentBody: "Msimamizi wa SENDA atalikagua. Tumekutumia uthibitisho kwa barua pepe.",
    pendingTitle: "Inasubiri ukaguzi", pendingBody: (d: string) => `Uliomba hili tarehe ${d}. Msimamizi wa SENDA analikagua. Hakuna kilichobadilika.`,
    approvedTitle: "Inafutwa", approvedBody: "Ombi lako limekubaliwa na data ya sanduku inafutwa.",
    completedTitle: "Imefutwa", completedBody: (d: string) => `Data ya sanduku la pamoja ilifutwa kabisa tarehe ${d}.`,
    rejectedTitle: "Ombi halikukubaliwa", rejectedBody: "Hakuna kilichofutwa. Unaweza kutuma ombi jipya.", note: "Maelezo kutoka kwa msimamizi",
    failedTitle: "Kumekuwa na tatizo", failedBody: "Ombi lilikubaliwa lakini halijakamilika bado. Msaada wa SENDA utamalizia. Hakuna kilichofutwa nusu.",
    cancel: "Ghairi ombi", cancelled: "Ombi limeghairiwa", again: "Tuma ombi jipya", none: "Mmiliki au msimamizi wa shirika tu ndiye anayeweza kuomba kufuta data ya sanduku lake.", error: "Kuna hitilafu. Jaribu tena.",
  },
};

const messageOf = (res: { message?: string; errors?: unknown; data?: unknown }) =>
  String((res.errors as { message?: string } | null)?.message || (res.data as { message?: string } | undefined)?.message || res.message || "");

function OrganizationSection({ org, hasPassword, onChanged }: { org: Organization; hasPassword: boolean; onChanged: () => void }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = org.request;
  const open = request?.status === "pending" || request?.status === "approved";
  const day = (iso: string) => new Date(iso).toLocaleDateString();

  const submit = async () => {
    setBusy(true); setError("");
    const body = { tenant_id: org.id, reason, ...(hasPassword ? { password: secret } : { confirm_email: secret }) };
    const res = await apiClient.call<unknown>("/auth/inbox-data-deletion/", { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    if (res.success) { toast({ title: T.sent, description: T.sentBody }); setSecret(""); setAgree(false); setReason(""); onChanged(); return; }
    setError(messageOf(res) || T.error);
  };

  const cancel = async () => {
    setBusy(true);
    const res = await apiClient.call<unknown>("/auth/inbox-data-deletion/cancel/", { method: "POST", body: JSON.stringify({ tenant_id: org.id }) });
    setBusy(false);
    if (res.success) toast({ title: T.cancelled }); else toast({ title: messageOf(res) || T.error, variant: "destructive" });
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold">{org.name}</p>
        <p className="text-sm text-muted-foreground">{T.holds(org.conversations, org.messages, org.calls)}</p>
      </div>

      {request?.status === "pending" && (
        <div className="space-y-3 rounded-md border bg-amber-50 p-3 text-sm text-amber-950">
          <p className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" />{T.pendingTitle}</p>
          <p>{T.pendingBody(day(request.requested_at))}</p>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void cancel()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : T.cancel}</Button>
        </div>
      )}
      {request?.status === "approved" && <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-950"><p className="flex items-center gap-2 font-semibold"><Loader2 className="h-4 w-4 animate-spin" />{T.approvedTitle}</p><p>{T.approvedBody}</p></div>}
      {request?.status === "failed" && <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">{T.failedTitle}</p><p>{T.failedBody}</p></div>}
      {request?.status === "completed" && request.completed_at && <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-950"><p className="font-semibold">{T.completedTitle}</p><p>{T.completedBody(day(request.completed_at))}</p></div>}
      {request?.status === "rejected" && (
        <div className="rounded-md border bg-muted p-3 text-sm">
          <p className="font-semibold">{T.rejectedTitle}</p><p>{T.rejectedBody}</p>
          {request.admin_note && <p className="mt-1 text-muted-foreground">{T.note}: {request.admin_note}</p>}
        </div>
      )}

      {!open && request?.status !== "failed" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />{T.erases}</p>
            <p>{T.erasesList}</p>
            <p className="text-muted-foreground">{T.stays}</p>
            <p className="font-medium">{T.permanent}</p>
            <p className="text-muted-foreground">{T.review}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`del-reason-${org.id}`}>{T.reason}</Label>
            <Textarea id={`del-reason-${org.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={2000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`del-secret-${org.id}`}>{hasPassword ? T.password : T.email}</Label>
            <Input id={`del-secret-${org.id}`} type={hasPassword ? "password" : "email"} autoComplete={hasPassword ? "current-password" : "off"} value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
            <span>{T.understand}</span>
          </label>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button variant="destructive" disabled={busy || !agree || !secret.trim()} onClick={() => void submit()}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{T.submitting}</> : <><Trash2 className="mr-2 h-4 w-4" />{request?.status === "rejected" || request?.status === "completed" ? T.again : T.submit}</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export function DeleteInboxDataCard() {
  const T = TEXT[appLanguage()];
  const [state, setState] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const res = await apiClient.call<Status>("/auth/inbox-data-deletion/");
    if (res.success && res.data) { setState(res.data); setFailed(false); } else setFailed(true);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (failed) return <p className="text-sm text-destructive">{T.error}</p>;
  if (!state) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <Card className="border-destructive/40">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-destructive"><Trash2 className="h-4 w-4" />{T.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{T.intro}</p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 pt-2">
        {state.organizations.length === 0 && <p className="rounded-md bg-muted p-3 text-sm">{T.none}</p>}
        {state.organizations.map((org) => <OrganizationSection key={org.id} org={org} hasPassword={state.has_password} onChanged={() => void load()} />)}
      </CardContent>
    </Card>
  );
}

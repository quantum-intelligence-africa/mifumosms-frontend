import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, AlertCircle, RefreshCw, Copy, ExternalLink, CheckCircle2, XCircle, Unlink, Mic } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import type { IvrFlowSummary } from "@/components/voice/ivr-builder/types";

interface VoiceAccount {
  id: string;
  provider: string;
  provider_credential: string | null;
  provider_credential_detail: { id: string; name: string; provider_type: string } | null;
  active_flow: string | null;
  active_flow_detail: { id: string; name: string; status: string } | null;
  webhook_url: string | null;
  display_name: string;
  phone_number: string;
  always_record_calls: boolean;
  is_active: boolean;
}

const NONE = "__none__";

export default function VoiceNumbers() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<VoiceAccount[]>([]);
  const [flows, setFlows] = useState<IvrFlowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [phoneDrafts, setPhoneDrafts] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [accountsRes, flowsRes] = await Promise.all([
      voiceApi.get<VoiceAccount[]>("/voice/accounts/"),
      voiceApi.get<IvrFlowSummary[]>("/voice/ivr/"),
    ]);
    if (accountsRes.success && accountsRes.data) {
      setAccounts(accountsRes.data);
      setPhoneDrafts(Object.fromEntries(accountsRes.data.map((a) => [a.id, a.phone_number ?? ""])));
    } else {
      setError(accountsRes.error || "Failed to load phone numbers");
    }
    if (flowsRes.success && flowsRes.data) {
      setFlows(flowsRes.data.filter((f) => f.status === "published"));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFlowChange = async (accountId: string, flowId: string) => {
    setSavingId(accountId);
    const res = await voiceApi.patch<VoiceAccount>(`/voice/accounts/${accountId}/`, {
      active_flow: flowId === NONE ? null : flowId,
    });
    setSavingId(null);
    if (res.success && res.data) {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? res.data as VoiceAccount : a)));
      toast({ title: "Flow connected", description: "This number now runs the selected flow." });
    } else {
      toast({ title: "Failed to update", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  const savePhoneNumber = async (accountId: string) => {
    const current = accounts.find((a) => a.id === accountId);
    const draft = (phoneDrafts[accountId] ?? "").trim();
    if (!current || draft === current.phone_number) return;

    setSavingId(accountId);
    const res = await voiceApi.patch<VoiceAccount>(`/voice/accounts/${accountId}/`, { phone_number: draft });
    setSavingId(null);
    if (res.success && res.data) {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? res.data as VoiceAccount : a)));
      toast({ title: "Phone number saved" });
    } else {
      toast({ title: "Failed to save number", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleRecordAllToggle = async (accountId: string, checked: boolean) => {
    setSavingId(accountId);
    const res = await voiceApi.patch<VoiceAccount>(`/voice/accounts/${accountId}/`, {
      always_record_calls: checked,
    });
    setSavingId(null);
    if (res.success && res.data) {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? res.data as VoiceAccount : a)));
      toast({
        title: checked ? "Recording every conversation" : "Recording turned off",
        description: checked
          ? "Every call forwarded to an agent on this number will now be recorded."
          : "Forwarded calls will only be recorded when a flow explicitly asks for it.",
      });
    } else {
      toast({ title: "Failed to update", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleDisconnect = (account: VoiceAccount) => {
    if (!account.active_flow_detail) return;
    const confirmed = window.confirm(
      `Disconnect "${account.active_flow_detail.name}" from ${account.display_name || "this number"}? ` +
        "Calls to this number will not be answered until you connect another flow."
    );
    if (!confirmed) return;
    handleFlowChange(account.id, NONE);
  };

  const copyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-4xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Phone Numbers</h1>
              <p className="mt-0.5 text-sm text-foreground/60">
                Connect each number to exactly one published flow — that flow is what runs when the number is called.
              </p>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            )}

            {!error && !isLoading && accounts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">No phone numbers yet</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    A SENDA admin needs to set up a provider credential and phone number for your account first.
                  </p>
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && accounts.length > 0 && (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {account.display_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="capitalize">
                            {account.provider.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Phone number</label>
                        <Input
                          className="mt-1"
                          placeholder="+255700000000"
                          value={phoneDrafts[account.id] ?? ""}
                          onChange={(e) => setPhoneDrafts((prev) => ({ ...prev, [account.id]: e.target.value }))}
                          onBlur={() => savePhoneNumber(account.id)}
                          disabled={savingId === account.id}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Active flow</label>

                        {account.active_flow_detail ? (
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                            <span className="flex min-w-0 items-center gap-1.5 text-sm text-emerald-900 dark:text-emerald-200">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                <strong>{account.active_flow_detail.name}</strong> is connected — this is what
                                runs on every call to {account.phone_number || "this number"}.
                              </span>
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 shrink-0 gap-1 text-xs"
                              onClick={() => handleDisconnect(account)}
                              disabled={savingId === account.id}
                            >
                              <Unlink className="h-3 w-3" />
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <XCircle className="h-4 w-4 shrink-0" />
                            No flow connected — calls to this number will not be answered.
                          </div>
                        )}

                        <Select
                          value={account.active_flow ?? NONE}
                          onValueChange={(value) => handleFlowChange(account.id, value)}
                          disabled={savingId === account.id}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Connect a flow…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No flow connected</SelectItem>
                            {flows.map((flow) => (
                              <SelectItem key={flow.id} value={flow.id}>
                                {flow.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {flows.length === 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No published flows yet —{" "}
                            <Link to="/voice/ivr" className="underline underline-offset-2">
                              publish one first
                            </Link>
                            .
                          </p>
                        )}
                      </div>

                      {account.webhook_url && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Webhook URL (paste into your provider's callback URL field)
                          </label>
                          <div className="mt-1 flex items-center gap-1.5">
                            <code className="flex-1 truncate rounded-md border border-input bg-muted px-2 py-1.5 text-xs">
                              {account.webhook_url}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyWebhook(account.webhook_url as string)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                        <Label htmlFor={`record-${account.id}`} className="flex items-start gap-2 text-xs font-normal text-foreground">
                          <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Record every conversation</span>
                            <br />
                            <span className="text-muted-foreground">
                              Automatically records every call forwarded to an agent on this number.
                            </span>
                          </span>
                        </Label>
                        <Switch
                          id={`record-${account.id}`}
                          checked={account.always_record_calls}
                          onCheckedChange={(checked) => handleRecordAllToggle(account.id, checked)}
                          disabled={savingId === account.id}
                        />
                      </div>

                      {account.active_flow_detail && (
                        <Link
                          to={`/voice/ivr/${account.active_flow_detail.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Edit "{account.active_flow_detail.name}" <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

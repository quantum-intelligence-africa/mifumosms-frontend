import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, AlertCircle, RefreshCw, Copy, ExternalLink, CheckCircle2, XCircle, Unlink, Mic, Plus } from "lucide-react";
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
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";
import type { IvrFlowSummary } from "@/components/voice/ivr-builder/types";

interface VoiceAccount {
  id: string;
  active_flow: string | null;
  active_flow_detail: { id: string; name: string; status: string } | null;
  webhook_url: string | null;
  display_name: string;
  phone_number: string;
  always_record_calls: boolean;
  is_active: boolean;
}

interface AvailableNumber {
  id: string;
  phone_number: string;
}

const NONE = "__none__";

export default function VoiceNumbers() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<VoiceAccount[]>([]);
  const [flows, setFlows] = useState<IvrFlowSummary[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [selectedNumberId, setSelectedNumberId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [accountsRes, flowsRes, numbersRes] = await Promise.all([
      voiceApi.get<VoiceAccount[]>("/voice/accounts/"),
      voiceApi.get<IvrFlowSummary[]>("/voice/ivr/"),
      voiceApi.get<AvailableNumber[]>("/voice/available-numbers/"),
    ]);
    if (accountsRes.success && accountsRes.data) {
      setAccounts(accountsRes.data);
    } else {
      setError(accountsRes.error || t("voice.numbers.error_loading"));
    }
    if (flowsRes.success && flowsRes.data) {
      setFlows(flowsRes.data.filter((f) => f.status === "published"));
    }
    if (numbersRes.success && numbersRes.data) {
      setAvailableNumbers(numbersRes.data);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // A tenant picks one of the numbers already set up for this service —
  // there's nothing left to configure, so the account is fully usable the
  // moment it's created.
  const createAccount = async () => {
    if (!selectedNumberId) return;
    setIsCreating(true);
    const res = await voiceApi.post<VoiceAccount>("/voice/accounts/", {
      display_name: newDisplayName.trim(),
      provider_credential: selectedNumberId,
    });
    setIsCreating(false);
    if (res.success && res.data) {
      const created = res.data;
      setAccounts((prev) => [created, ...prev]);
      setAvailableNumbers((prev) => prev.filter((n) => n.id !== selectedNumberId));
      setNewDisplayName("");
      setSelectedNumberId("");
      setShowAddForm(false);
      toast({ title: t("voice.numbers.created_toast_title"), description: t("voice.numbers.created_toast_desc") });
    } else {
      toast({ title: t("voice.numbers.create_failed"), description: res.error || t("common.try_again_desc"), variant: "destructive" });
    }
  };

  const handleFlowChange = async (accountId: string, flowId: string) => {
    setSavingId(accountId);
    const res = await voiceApi.patch<VoiceAccount>(`/voice/accounts/${accountId}/`, {
      active_flow: flowId === NONE ? null : flowId,
    });
    setSavingId(null);
    if (res.success && res.data) {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? res.data as VoiceAccount : a)));
      toast({ title: t("voice.numbers.flow_connected_title"), description: t("voice.numbers.flow_connected_desc") });
    } else {
      toast({ title: t("voice.numbers.update_failed"), description: res.error || t("common.try_again_desc"), variant: "destructive" });
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
        title: checked ? t("voice.numbers.recording_on_title") : t("voice.numbers.recording_off_title"),
        description: checked ? t("voice.numbers.recording_on_desc") : t("voice.numbers.recording_off_desc"),
      });
    } else {
      toast({ title: t("voice.numbers.update_failed"), description: res.error || t("common.try_again_desc"), variant: "destructive" });
    }
  };

  const handleDisconnect = (account: VoiceAccount) => {
    if (!account.active_flow_detail) return;
    const confirmed = window.confirm(
      t("voice.numbers.disconnect_confirm", {
        flow: account.active_flow_detail.name,
        number: account.display_name || t("voice.numbers.this_number"),
      }),
    );
    if (!confirmed) return;
    handleFlowChange(account.id, NONE);
  };

  const copyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: t("voice.numbers.copied_title"), description: t("voice.numbers.copied_desc") });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-4xl space-y-3.5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{t("nav.phone_numbers")}</h1>
                <p className="mt-0.5 text-sm text-foreground/60">{t("voice.numbers.subtitle")}</p>
              </div>
              {!showAddForm && (
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t("voice.numbers.add_number")}
                </Button>
              )}
            </header>

            {showAddForm && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t("voice.numbers.add_number_title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground">{t("voice.numbers.add_number_desc")}</p>
                  {availableNumbers.length === 0 ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      {t("voice.numbers.no_numbers_available")}
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("voice.numbers.phone_label")}</label>
                        <Select value={selectedNumberId} onValueChange={setSelectedNumberId} disabled={isCreating}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t("voice.numbers.choose_number_placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNumbers.map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.phone_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("voice.numbers.display_name_label")}</label>
                        <Input
                          className="mt-1"
                          placeholder={t("voice.numbers.display_name_placeholder")}
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewDisplayName("");
                        setSelectedNumberId("");
                      }}
                      disabled={isCreating}
                    >
                      {t("voice.numbers.cancel")}
                    </Button>
                    <Button type="button" size="sm" onClick={createAccount} disabled={isCreating || !selectedNumberId}>
                      {isCreating ? t("voice.numbers.creating") : t("voice.numbers.save_number")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("common.try_again")}
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

            {!error && !isLoading && accounts.length === 0 && !showAddForm && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">{t("voice.numbers.empty_title")}</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("voice.numbers.empty_desc")}</p>
                  <Button size="sm" className="mt-1" onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t("voice.numbers.add_number")}
                  </Button>
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
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? t("voice.numbers.status_active") : t("voice.numbers.status_inactive")}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("voice.numbers.phone_label")}</label>
                        <p className="mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground">
                          {account.phone_number}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t("voice.numbers.active_flow_label")}</label>

                        {account.active_flow_detail ? (
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                            <span className="flex min-w-0 items-center gap-1.5 text-sm text-emerald-900 dark:text-emerald-200">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                <strong>{account.active_flow_detail.name}</strong>{" "}
                                {t("voice.numbers.flow_connected_suffix", { number: account.phone_number || t("voice.numbers.this_number") })}
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
                              {t("voice.numbers.disconnect")}
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <XCircle className="h-4 w-4 shrink-0" />
                            {t("voice.numbers.no_flow_connected")}
                          </div>
                        )}

                        <Select
                          value={account.active_flow ?? NONE}
                          onValueChange={(value) => handleFlowChange(account.id, value)}
                          disabled={savingId === account.id}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={t("voice.numbers.connect_flow_placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>{t("voice.numbers.no_flow_connected")}</SelectItem>
                            {flows.map((flow) => (
                              <SelectItem key={flow.id} value={flow.id}>
                                {flow.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {flows.length === 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("voice.numbers.no_flows_prefix")}{" "}
                            <Link to="/voice/ivr" className="underline underline-offset-2">
                              {t("voice.numbers.no_flows_link")}
                            </Link>
                            .
                          </p>
                        )}
                      </div>

                      {account.webhook_url && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">{t("voice.numbers.webhook_label")}</label>
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
                            <span className="font-medium">{t("voice.numbers.record_title")}</span>
                            <br />
                            <span className="text-muted-foreground">{t("voice.numbers.record_desc")}</span>
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
                          {t("voice.numbers.edit_flow_prefix")} "{account.active_flow_detail.name}" <ExternalLink className="h-3 w-3" />
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

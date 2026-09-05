import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Workflow, AlertCircle, RefreshCw, Clock, Link2, Unlink } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import type { IvrFlowDetail, IvrFlowSummary } from "@/components/voice/ivr-builder/types";
import { FLOW_TEMPLATES } from "@/components/voice/ivr-builder/templates";
import { LANGUAGE_LABELS } from "@/components/voice/ivr-builder/FlowToolbar";

interface VoiceAccountLite {
  id: string;
  display_name: string;
  phone_number: string;
  active_flow: string | null;
}

const statusVariant = (status: string): "default" | "outline" | "secondary" =>
  status === "published" ? "default" : status === "archived" ? "secondary" : "outline";

export default function IvrFlowList() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flows, setFlows] = useState<IvrFlowSummary[]>([]);
  const [accounts, setAccounts] = useState<VoiceAccountLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(FLOW_TEMPLATES[0].id);

  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [flowsRes, accountsRes] = await Promise.all([
      voiceApi.get<IvrFlowSummary[]>("/voice/ivr/"),
      voiceApi.get<VoiceAccountLite[]>("/voice/accounts/"),
    ]);
    if (flowsRes.success && flowsRes.data) {
      setFlows(flowsRes.data);
    } else {
      setError(flowsRes.status === 403 ? "Your plan does not include the Voice/IVR feature." : flowsRes.error || "Failed to load flows");
    }
    if (accountsRes.success && accountsRes.data) {
      setAccounts(accountsRes.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleDisconnect = async (e: React.MouseEvent, account: VoiceAccountLite) => {
    e.stopPropagation();
    const label = account.phone_number || account.display_name || "this number";
    if (!window.confirm(`Disconnect this flow from ${label}? Calls to it will not be answered until you connect another flow.`)) {
      return;
    }
    setDisconnectingId(account.id);
    const res = await voiceApi.patch<VoiceAccountLite>(`/voice/accounts/${account.id}/`, { active_flow: null });
    setDisconnectingId(null);
    if (res.success) {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, active_flow: null } : a)));
      toast({ title: "Disconnected", description: `This flow no longer runs on ${label}.` });
    } else {
      toast({ title: "Failed to disconnect", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    const template = FLOW_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? FLOW_TEMPLATES[0];
    setIsCreating(true);
    const res = await voiceApi.post<IvrFlowDetail>("/voice/ivr/", {
      name: template.id === "blank" ? "Mtiririko Mpya" : template.name,
      current_definition: template.definition,
    });
    setIsCreating(false);
    if (res.success && res.data) {
      setTemplateDialogOpen(false);
      navigate(`/voice/ivr/${res.data.id}`);
    } else {
      setError(res.error || "Failed to create flow");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-5xl space-y-3.5">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">IVR Flows</h1>
                <p className="mt-0.5 text-sm text-foreground/60">Build and test call flows without a phone line</p>
              </div>
              <Button onClick={() => setTemplateDialogOpen(true)} disabled={isCreating}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Flow
              </Button>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchFlows}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            )}

            {!error && !isLoading && flows.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <Workflow className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">No flows yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first IVR flow to get started.</p>
                  <Button size="sm" className="mt-1" onClick={() => setTemplateDialogOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    New Flow
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && flows.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {flows.map((flow) => {
                  const connectedAccounts = accounts.filter((a) => a.active_flow === flow.id);
                  return (
                    <Card
                      key={flow.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => navigate(`/voice/ivr/${flow.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{flow.name}</span>
                          <Badge variant={statusVariant(flow.status)} className="shrink-0 capitalize">
                            {flow.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Updated {new Date(flow.updated_at).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                            {LANGUAGE_LABELS[flow.language]}
                          </Badge>
                        </div>

                        {connectedAccounts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {connectedAccounts.map((account) => (
                              <span
                                key={account.id}
                                className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-0.5 pl-2 pr-1 text-[11px] text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                              >
                                <Link2 className="h-3 w-3 shrink-0" />
                                {account.phone_number || account.display_name || "Connected"}
                                <button
                                  type="button"
                                  title="Disconnect this flow"
                                  onClick={(e) => handleDisconnect(e, account)}
                                  disabled={disconnectingId === account.id}
                                  className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-900"
                                >
                                  <Unlink className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Anza mtiririko mpya</DialogTitle>
            <DialogDescription>
              Chagua pa kuanzia. Kila mfano unabadilika kabisa baadaye — unaweza kuongeza, kuondoa au kupanga
              upya visanduku vyote ukishaufungua. Salamu zote hutaja jina la biashara yako lenyewe.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId} className="gap-2.5 py-1">
            {FLOW_TEMPLATES.map((template) => (
              <label
                key={template.id}
                htmlFor={`template-${template.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
              >
                <RadioGroupItem value={template.id} id={`template-${template.id}`} className="mt-0.5" />
                <div className="min-w-0">
                  <Label htmlFor={`template-${template.id}`} className="cursor-pointer text-sm font-semibold text-foreground">
                    {template.name}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} disabled={isCreating}>
              Ghairi
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Tunaanzisha…" : "Anza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

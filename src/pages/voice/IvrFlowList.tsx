import { appLocale } from "@/utils/appLocale";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Workflow, AlertCircle, RefreshCw, Clock, Link2, Unlink, Upload, Download, FileJson, Sparkles, Trash2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlowLiveAi } from "@/components/voice/FlowLiveAi";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";
import type { FlowDefinition, IvrFlowDetail, IvrFlowSummary } from "@/components/voice/ivr-builder/types";
import { FLOW_TEMPLATES } from "@/components/voice/ivr-builder/templates";
import { LANGUAGE_LABELS } from "@/components/voice/ivr-builder/FlowToolbar";

interface VoiceAccountLite {
  id: string;
  display_name: string;
  phone_number: string;
  active_flow: string | null;
}

const IMPORT_ID = "__import__";
const MAX_IMPORT_BYTES = 1024 * 1024;

interface ImportedFlow {
  name: string;
  language?: string;
  definition: FlowDefinition;
}

// Accepts a file exported from SENDA ({ name, language, definition }) or a bare
// { nodes, edges } definition. The server re-checks the shape on create.
function parseImportedFlow(text: string, fallbackName: string, t: (key: any) => string): ImportedFlow {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(t("cc.flows.err_not_json"));
  }
  const obj = (raw ?? {}) as Record<string, unknown>;
  const def = (obj.definition ?? obj.current_definition ?? obj) as Record<string, unknown>;
  if (!def || !Array.isArray(def.nodes) || !Array.isArray(def.edges)) {
    throw new Error(t("cc.flows.err_no_flow"));
  }
  const bad = (def.nodes as Array<Record<string, unknown>>).some((n) => !n || !n.id || !n.type);
  if (bad) throw new Error(t("cc.flows.err_bad_node"));
  const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim().slice(0, 100) : fallbackName;
  const language = typeof obj.language === "string" ? obj.language : undefined;
  return { name, language, definition: def as unknown as FlowDefinition };
}

const statusVariant = (status: string): "default" | "outline" | "secondary" =>
  status === "published" ? "default" : status === "archived" ? "secondary" : "outline";

import { AiFlowDialog } from "@/components/voice/ivr-builder/AiFlowDialog";

export default function IvrFlowList() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flows, setFlows] = useState<IvrFlowSummary[]>([]);
  const [accounts, setAccounts] = useState<VoiceAccountLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(FLOW_TEMPLATES[0].id);
  const [imported, setImported] = useState<ImportedFlow | null>(null);
  const [importName, setImportName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setError(flowsRes.status === 403 ? t("voice.plan.no_feature") : flowsRes.error || t("voice.ivr.error_loading"));
    }
    if (accountsRes.success && accountsRes.data) {
      setAccounts(accountsRes.data);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleDisconnect = async (e: React.MouseEvent, account: VoiceAccountLite) => {
    e.stopPropagation();
    const label = account.phone_number || account.display_name || t("cc.flows.a_number");
    if (!window.confirm(t("cc.flows.disconnect_confirm", { label }))) {
      return;
    }
    setDisconnectingId(account.id);
    const res = await voiceApi.patch<VoiceAccountLite>(`/voice/accounts/${account.id}/`, { active_flow: null });
    setDisconnectingId(null);
    if (res.success) {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, active_flow: null } : a)));
      toast({ title: t("cc.flows.disconnected_title"), description: t("cc.flows.disconnected_desc", { label }) });
    } else {
      toast({ title: t("cc.flows.disconnect_failed"), description: res.error || t("cc.flows.try_again_desc"), variant: "destructive" });
    }
  };

  // Delete = archive on the server: the flow disappears from this list, and the calls it already handled stay in history.
  // A number still pointing at it is disconnected first, so no number is left running a deleted flow.
  const handleDelete = async (e: React.MouseEvent, flow: IvrFlowSummary) => {
    e.stopPropagation();
    const inUse = accounts.filter((a) => a.active_flow === flow.id);
    const numbers = inUse.map((a) => a.phone_number || a.display_name).filter(Boolean).join(", ");
    const warning = inUse.length
      ? `\n\n${t(inUse.length > 1 ? "cc.flows.delete_in_use_many" : "cc.flows.delete_in_use_one", { numbers: numbers || t("cc.flows.a_number") })}`
      : "";
    if (!window.confirm(`${t("cc.flows.delete_confirm_head", { name: flow.name })}${warning}\n\n${t("cc.flows.delete_keeps")}`)) return;
    for (const account of inUse) {
      const detached = await voiceApi.patch<VoiceAccountLite>(`/voice/accounts/${account.id}/`, { active_flow: null });
      if (!detached.success) {
        toast({ title: t("cc.flows.delete_failed"), description: detached.error || t("cc.flows.delete_detach_failed"), variant: "destructive" });
        return;
      }
    }
    const res = await voiceApi.delete(`/voice/ivr/${flow.id}/`);
    if (res.success) {
      setFlows((prev) => prev.filter((f) => f.id !== flow.id));
      setAccounts((prev) => prev.map((a) => (a.active_flow === flow.id ? { ...a, active_flow: null } : a)));
      toast({ title: t("cc.flows.deleted_title"), description: t("cc.flows.deleted_desc", { name: flow.name }) });
    } else {
      toast({ title: t("cc.flows.delete_failed"), description: res.error || t("cc.flows.try_again_desc"), variant: "destructive" });
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportError(null);
    setImported(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError(t("cc.flows.err_too_big"));
      return;
    }
    try {
      const fallback = file.name.replace(/\.json$/i, "").slice(0, 100) || t("cc.flows.imported_name");
      const parsed = parseImportedFlow(await file.text(), fallback, t as (key: any) => string);
      setImported(parsed);
      setImportName(parsed.name);
      setSelectedTemplateId(IMPORT_ID);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t("cc.flows.err_read"));
    }
  };

  const handleExport = async (e: React.MouseEvent, flow: IvrFlowSummary) => {
    e.stopPropagation();
    const res = await voiceApi.get<IvrFlowDetail>(`/voice/ivr/${flow.id}/`);
    if (!(res.success && res.data)) {
      toast({ title: t("cc.flows.export_failed"), description: res.error || t("cc.flows.try_again_desc"), variant: "destructive" });
      return;
    }
    const payload = {
      senda_ivr_flow: 1,
      name: res.data.name,
      language: res.data.language,
      definition: res.data.current_definition,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flow.name.replace(/[^\w-]+/g, "_") || "flow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // The AI wrote the flow: create it as a draft (nothing is published) and open it to adjust.
  const handleCreateFromAi = async (definition: FlowDefinition, name: string) => {
    setIsCreating(true);
    const res = await voiceApi.post<IvrFlowDetail>("/voice/ivr/", { name: name.slice(0, 100), current_definition: definition });
    setIsCreating(false);
    if (res.success && res.data) {
      navigate(`/voice/ivr/${res.data.id}`);
    } else {
      toast({ title: t("cc.flows.create_failed"), description: res.error || t("cc.flows.try_again_desc"), variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    const template = FLOW_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? FLOW_TEMPLATES[0];
    const useImport = selectedTemplateId === IMPORT_ID && imported ? imported : null;
    setIsCreating(true);
    const res = await voiceApi.post<IvrFlowDetail>(
      "/voice/ivr/",
      useImport
        ? {
            name: importName.trim() || useImport.name,
            current_definition: useImport.definition,
            ...(useImport.language && useImport.language in LANGUAGE_LABELS ? { language: useImport.language } : {}),
          }
        : {
            name: template.id === "blank" ? t("cc.flows.blank_name") : template.name,
            current_definition: template.definition,
          },
    );
    setIsCreating(false);
    if (res.success && res.data) {
      setTemplateDialogOpen(false);
      navigate(`/voice/ivr/${res.data.id}`);
    } else if (useImport) {
      setImportError(res.error || t("cc.flows.err_rejected"));
    } else {
      setError(res.error || t("cc.flows.create_failed_generic"));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AiFlowDialog open={aiOpen} onOpenChange={setAiOpen} hasContent={false} onApply={handleCreateFromAi} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-5xl space-y-3.5">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{t("cc.flows.title")}</h1>
                <p className="mt-0.5 text-sm text-foreground/60">{t("cc.flows.subtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAiOpen(true)} disabled={isCreating}>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {t("cc.aiflow.button")}
                </Button>
                <Button onClick={() => setTemplateDialogOpen(true)} disabled={isCreating}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("cc.flows.new")}
                </Button>
              </div>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchFlows}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("cc.flows.try_again")}
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
                  <h3 className="text-base font-semibold text-foreground">{t("cc.flows.empty_title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("cc.flows.empty_desc")}</p>
                  <div className="mt-1 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      {t("cc.aiflow.button")}
                    </Button>
                    <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("cc.flows.new")}
                    </Button>
                  </div>
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
                          <span className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              title={t("cc.flows.export_title")}
                              aria-label={t("cc.flows.export_aria")}
                              onClick={(e) => handleExport(e, flow)}
                              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title={t("cc.flows.delete_title")}
                              aria-label={t("cc.flows.delete_aria")}
                              onClick={(e) => handleDelete(e, flow)}
                              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <Badge variant={statusVariant(flow.status)} className="capitalize">
                              {t(`cc.flows.status_${flow.status}` as never) || flow.status}
                            </Badge>
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {t("cc.flows.updated", { date: new Date(flow.updated_at).toLocaleDateString(appLocale()) })}
                          </span>
                          <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                            {LANGUAGE_LABELS[flow.language]}
                          </Badge>
                        </div>

                        <FlowLiveAi flowId={flow.id} />

                        {connectedAccounts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {connectedAccounts.map((account) => (
                              <span
                                key={account.id}
                                className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-0.5 pl-2 pr-1 text-[11px] text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                              >
                                <Link2 className="h-3 w-3 shrink-0" />
                                {account.phone_number || account.display_name || t("cc.flows.connected")}
                                <button
                                  type="button"
                                  title={t("cc.flows.disconnect_title")}
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
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-4 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("cc.flows.dialog_title")}</DialogTitle>
            <DialogDescription>{t("cc.flows.dialog_desc")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <RadioGroup
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              className="grid grid-cols-1 gap-3 py-1 md:grid-cols-2"
            >
              {FLOW_TEMPLATES.map((template) => (
                <label
                  key={template.id}
                  htmlFor={`template-${template.id}`}
                  className="flex h-full cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                >
                  <RadioGroupItem value={template.id} id={`template-${template.id}`} className="mt-0.5" />
                  <div className="min-w-0">
                    <Label htmlFor={`template-${template.id}`} className="cursor-pointer text-sm font-semibold text-foreground">
                      {template.name}
                    </Label>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                  </div>
                </label>
              ))}

              <div
                className={`flex h-full items-start gap-3 rounded-lg border border-dashed p-4 transition-colors md:col-span-2 ${
                  selectedTemplateId === IMPORT_ID ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <RadioGroupItem value={IMPORT_ID} id={`template-${IMPORT_ID}`} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={`template-${IMPORT_ID}`}
                    className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t("cc.flows.import_label")}
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("cc.flows.import_desc")}</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                      <FileJson className="mr-1.5 h-3.5 w-3.5" />
                      {imported ? t("cc.flows.choose_another") : t("cc.flows.choose_file")}
                    </Button>
                    {imported && (
                      <span className="text-xs text-muted-foreground">
                        {t("cc.flows.import_counts", { nodes: imported.definition.nodes.length, edges: imported.definition.edges.length })}
                      </span>
                    )}
                  </div>
                  {imported && (
                    <div className="mt-2">
                      <Label htmlFor="import-name" className="text-xs">
                        {t("cc.flows.import_name")}
                      </Label>
                      <Input
                        id="import-name"
                        value={importName}
                        maxLength={100}
                        onChange={(e) => setImportName(e.target.value)}
                        className="mt-1 max-w-sm"
                      />
                    </div>
                  )}
                  {importError && <p className="mt-2 text-xs text-destructive">{importError}</p>}
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} disabled={isCreating}>
              {t("cc.flows.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || (selectedTemplateId === IMPORT_ID && !imported)}>
              {isCreating ? t("cc.flows.starting") : selectedTemplateId === IMPORT_ID ? t("cc.flows.import_btn") : t("cc.flows.start")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ReactFlowProvider, type Node } from "@xyflow/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { voiceApi } from "@/services/voiceApi";
import { useIvrFlow } from "@/components/voice/ivr-builder/useIvrFlow";
import { FlowCanvas } from "@/components/voice/ivr-builder/FlowCanvas";
import { NodePalette } from "@/components/voice/ivr-builder/NodePalette";
import { FlowToolbar } from "@/components/voice/ivr-builder/FlowToolbar";
import { NodeInspector } from "@/components/voice/ivr-builder/NodeInspector";
import { SimulatePanel } from "@/components/voice/ivr-builder/SimulatePanel";
import { validateFlow } from "@/components/voice/ivr-builder/validation";
import type { AppNodeData, PublishResponse, ValidateResponse, ValidationError } from "@/components/voice/ivr-builder/types";

export default function IvrFlowBuilder() {
  const { flowId } = useParams<{ flowId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [serverErrors, setServerErrors] = useState<ValidationError[] | null>(null);

  const flow = useIvrFlow(flowId);

  const localErrors = useMemo(() => validateFlow(flow.definition), [flow.definition]);

  const errorsByNode = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const err of localErrors) {
      if (!err.node_id) continue;
      const list = map.get(err.node_id) ?? [];
      list.push(err.message);
      map.set(err.node_id, list);
    }
    return map;
  }, [localErrors]);

  const displayNodes: Node<AppNodeData>[] = useMemo(
    () =>
      flow.nodes.map((n) => ({
        ...n,
        data: { ...n.data, errorMessages: errorsByNode.get(n.id) },
      })),
    [flow.nodes, errorsByNode],
  );

  const selectedNode = displayNodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleValidate = useCallback(async () => {
    if (!flowId) return;
    setIsValidating(true);
    setServerErrors(null);
    await flow.saveNow();
    const res = await voiceApi.post<ValidateResponse>(`/voice/ivr/${flowId}/validate/`);
    setIsValidating(false);
    if (res.success && res.data) {
      if (res.data.valid) {
        toast.success("Flow is valid");
        setServerErrors([]);
      } else {
        setServerErrors(res.data.errors ?? []);
        toast.error(`Validation failed: ${res.data.errors?.length ?? 0} error(s)`);
      }
    } else {
      toast.error(res.error || "Validation request failed");
    }
  }, [flowId, flow]);

  const handlePublish = useCallback(async () => {
    if (!flowId || localErrors.length > 0) return;
    setIsPublishing(true);
    await flow.saveNow();
    const res = await voiceApi.post<PublishResponse>(`/voice/ivr/${flowId}/publish/`);
    setIsPublishing(false);
    if (res.success && res.data?.valid) {
      toast.success(`Published as version ${res.data.version_number}`);
      flow.setStatus("published");
      setServerErrors([]);
    } else if (res.data && res.data.valid === false) {
      setServerErrors(res.data.errors ?? []);
      toast.error(`Publish failed: ${res.data.errors?.length ?? 0} error(s)`);
    } else {
      toast.error(res.error || "Publish failed");
    }
  }, [flowId, flow, localErrors.length]);

  if (!flowId) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell-main flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        {flow.isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : flow.loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{flow.loadError}</p>
          </div>
        ) : (
          <>
            <FlowToolbar
              name={flow.name}
              status={flow.status}
              language={flow.language}
              companyName={flow.companyName}
              businessHours={flow.businessHours}
              errors={localErrors}
              isSaving={flow.isSaving}
              hasUnsavedChanges={flow.hasUnsavedChanges}
              saveError={flow.saveError}
              lastSavedAt={flow.lastSavedAt}
              isValidating={isValidating}
              isPublishing={isPublishing}
              onRename={flow.renameFlow}
              onLanguageChange={flow.changeLanguage}
              onBusinessIdentityChange={flow.saveBusinessIdentity}
              onSave={flow.saveNow}
              onExport={flow.exportDefinition}
              onSimulate={() => setSimulateOpen(true)}
              onValidate={handleValidate}
              onPublish={handlePublish}
              onSelectError={(nodeId) => nodeId && setSelectedNodeId(nodeId)}
            />

            {serverErrors && serverErrors.length > 0 && (
              <div className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <ul className="flex-1 list-disc space-y-0.5 pl-4">
                  {serverErrors.slice(0, 6).map((e, i) => (
                    <li key={i}>
                      {e.node_id ? (
                        <button
                          type="button"
                          className="text-left underline-offset-2 hover:underline"
                          onClick={() => setSelectedNodeId(e.node_id)}
                        >
                          {e.message}
                        </button>
                      ) : (
                        e.message
                      )}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setServerErrors(null)} aria-label="Dismiss" className="shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <div className="relative flex-1 overflow-hidden">
                <ReactFlowProvider>
                  <FlowCanvas
                    nodes={displayNodes}
                    edges={flow.edges}
                    onNodesChange={flow.onNodesChange}
                    onEdgesChange={flow.onEdgesChange}
                    onConnect={flow.onConnect}
                    onAddNode={flow.addNode}
                    onNodeSelect={setSelectedNodeId}
                  />
                </ReactFlowProvider>

                {selectedNode && (
                  <NodeInspector
                    key={selectedNode.id}
                    nodeId={selectedNode.id}
                    nodeType={selectedNode.type as never}
                    data={selectedNode.data}
                    onChange={(patch) => flow.updateNodeData(selectedNode.id, patch)}
                    onClose={() => setSelectedNodeId(null)}
                    onDelete={() => {
                      flow.deleteNode(selectedNode.id);
                      setSelectedNodeId(null);
                    }}
                  />
                )}
              </div>

              <NodePalette />
            </div>

            <SimulatePanel
              flowId={flowId}
              open={simulateOpen}
              onOpenChange={setSimulateOpen}
              onPathChange={flow.applyHighlight}
            />
          </>
        )}
      </div>
    </div>
  );
}

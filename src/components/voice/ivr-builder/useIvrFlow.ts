// Loads an IvrFlow, converts its wire `{nodes, edges}` definition into React
// Flow's native node/edge shapes, and keeps the two in sync — including a
// debounced autosave back to `PATCH /voice/ivr/{id}/`. Every other builder
// component only ever touches React Flow's shapes; the wire-format
// conversion is fully isolated here.
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge as rfAddEdge,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import { voiceApi } from "@/services/voiceApi";
import type { AppNodeData, FlowDefinition, IvrFlowDetail, IvrNodeType, WireEdge, WireNode } from "./types";

const AUTOSAVE_DELAY_MS = 1000;

type AppNode = Node<AppNodeData>;

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultStartNode(): AppNode {
  return {
    id: makeId("n"),
    type: "start",
    position: { x: 80, y: 80 },
    data: { fields: {} },
    deletable: false,
  };
}

function wireToNodes(wireNodes: WireNode[]): AppNode[] {
  return wireNodes.map((n, i) => ({
    id: n.id,
    type: n.type,
    position: n.position ?? { x: 80 + (i % 4) * 240, y: 80 + Math.floor(i / 4) * 160 },
    data: { fields: n.data ?? {} },
    deletable: n.type !== "start",
  }));
}

function wireToEdges(wireEdges: WireEdge[]): Edge[] {
  return wireEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
  }));
}

function nodesToWire(nodes: AppNode[]): WireNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type as IvrNodeType,
    position: n.position,
    data: (n.data as AppNodeData).fields ?? {},
  }));
}

function edgesToWire(edges: Edge[]): WireEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
  }));
}

export function useIvrFlow(flowId: string | undefined) {
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [language, setLanguage] = useState<"sw" | "en" | "sw_en">("sw");
  // The business identity every prompt is spoken against. Held here rather
  // than on each node so one edit re-brands every "Karibu {company_name}."
  // in the flow at once — and so the same flow, copied to another business,
  // greets that business's callers by their own name.
  const [companyName, setCompanyName] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastSavedJson = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!flowId) return;
    setIsLoading(true);
    setLoadError(null);
    const res = await voiceApi.get<IvrFlowDetail>(`/voice/ivr/${flowId}/`);
    if (res.success && res.data) {
      const def = res.data.current_definition ?? { nodes: [], edges: [] };
      const originalNodes = wireToNodes(def.nodes ?? []);
      const originalEdges = wireToEdges(def.edges ?? []);
      // Baseline for the autosave diff check must reflect exactly what the
      // backend has right now — computed *before* we potentially inject a
      // synthetic Start node below — so that injection is correctly detected
      // as a pending change and persisted on the next autosave tick, while a
      // normal reload of an already-populated flow produces zero spurious
      // saves (round-tripping through the same wireToNodes/nodesToWire pair
      // yields byte-identical JSON).
      lastSavedJson.current = JSON.stringify({
        nodes: nodesToWire(originalNodes),
        edges: edgesToWire(originalEdges),
      });
      const initialNodes = originalNodes.length === 0 ? [defaultStartNode()] : originalNodes;
      setNodes(initialNodes);
      setEdges(originalEdges);
      setName(res.data.name);
      setStatus(res.data.status);
      setLanguage(res.data.language ?? "sw");
      setCompanyName(res.data.company_name ?? "");
      setBusinessHours(res.data.business_hours ?? "");
      hasLoaded.current = true;
    } else {
      setLoadError(res.error || "Failed to load flow");
      if (res.status === 403) {
        setLoadError("Your plan does not include the Voice/IVR feature.");
      }
    }
    setIsLoading(false);
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    hasLoaded.current = false;
    load();
  }, [load]);

  // Warn before an accidental tab close/reload loses an edit the 1s debounce
  // hasn't flushed yet.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const definition: FlowDefinition = useMemo(
    () => ({ nodes: nodesToWire(nodes), edges: edgesToWire(edges) }),
    [nodes, edges],
  );

  const saveNow = useCallback(async () => {
    if (!flowId || !hasLoaded.current) return;
    const json = JSON.stringify(definition);
    if (json === lastSavedJson.current) return;
    setIsSaving(true);
    setSaveError(null);
    const res = await voiceApi.patch<IvrFlowDetail>(`/voice/ivr/${flowId}/`, { current_definition: definition });
    setIsSaving(false);
    if (res.success) {
      lastSavedJson.current = json;
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
    } else {
      setSaveError(res.error || "Couldn't save your changes.");
    }
  }, [flowId, definition]);

  // Debounced autosave — fires ~1s after the last graph change.
  useEffect(() => {
    if (!hasLoaded.current) return;
    const json = JSON.stringify(definition);
    const changed = json !== lastSavedJson.current;
    setHasUnsavedChanges(changed);
    if (!changed) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNow();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  const onNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => {
      // Never allow the Start node to be removed from the canvas.
      const filtered = changes.filter((c) => {
        if (c.type !== "remove") return true;
        const node = nodes.find((n) => n.id === c.id);
        return node?.type !== "start";
      });
      onNodesChangeRaw(filtered);
    },
    [nodes, onNodesChangeRaw],
  );

  const onEdgesChange: OnEdgesChange<Edge> = onEdgesChangeRaw;

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => rfAddEdge({ ...connection, id: makeId("e") }, eds));
    },
    [setEdges],
  );

  const addNode = useCallback(
    (type: IvrNodeType, position: { x: number; y: number }) => {
      const newNode: AppNode = {
        id: makeId("n"),
        type,
        position,
        data: { fields: {} },
      };
      setNodes((nds) => [...nds, newNode]);
      return newNode.id;
    },
    [setNodes],
  );

  const updateNodeData = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...(n.data as AppNodeData), fields: { ...(n.data as AppNodeData).fields, ...patch } } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId || n.type === "start"));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges],
  );

  const renameFlow = useCallback(
    async (newName: string) => {
      setName(newName);
      if (!flowId) return;
      await voiceApi.patch<IvrFlowDetail>(`/voice/ivr/${flowId}/`, { name: newName });
    },
    [flowId],
  );

  const changeLanguage = useCallback(
    async (newLanguage: "sw" | "en" | "sw_en") => {
      setLanguage(newLanguage);
      if (!flowId) return;
      await voiceApi.patch<IvrFlowDetail>(`/voice/ivr/${flowId}/`, { language: newLanguage });
    },
    [flowId],
  );

  /** Saves the business name and opening hours callers hear. Patched
   * straight through (like the flow name) rather than routed via the
   * graph autosave — these live on the flow row itself, not in the
   * `{nodes, edges}` definition. */
  const saveBusinessIdentity = useCallback(
    async (patch: { company_name?: string; business_hours?: string }) => {
      if (patch.company_name !== undefined) setCompanyName(patch.company_name);
      if (patch.business_hours !== undefined) setBusinessHours(patch.business_hours);
      if (!flowId) return;
      await voiceApi.patch<IvrFlowDetail>(`/voice/ivr/${flowId}/`, patch);
    },
    [flowId],
  );

  /** Highlights the nodes/edges traversed on the most recent Simulate hop.
   * Pass `null` to clear all highlighting. */
  const applyHighlight = useCallback(
    (pathNodeIds: string[] | null) => {
      const pathSet = new Set(pathNodeIds ?? []);
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...(n.data as AppNodeData), highlighted: pathSet.has(n.id) } })));
      setEdges((eds) =>
        eds.map((e) => {
          const isPathEdge =
            pathNodeIds != null &&
            pathNodeIds.some((id, i) => i < pathNodeIds.length - 1 && id === e.source && pathNodeIds[i + 1] === e.target);
          // Only toggle `animated` here — FlowCanvas derives each edge's
          // stroke color from its source handle on every render, so leaving
          // `style` alone keeps that color instead of flattening every
          // highlighted branch to the same primary hue.
          return { ...e, animated: isPathEdge };
        }),
      );
    },
    [setNodes, setEdges],
  );

  const exportDefinition = useCallback(() => {
    const blob = new Blob([JSON.stringify(definition, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "ivr-flow"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [definition, name]);

  return {
    isLoading,
    loadError,
    name,
    status,
    setStatus,
    language,
    changeLanguage,
    companyName,
    businessHours,
    saveBusinessIdentity,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    renameFlow,
    definition,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    saveError,
    saveNow,
    applyHighlight,
    exportDefinition,
    reload: load,
  };
}

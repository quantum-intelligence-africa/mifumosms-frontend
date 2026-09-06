// The canvas itself: a thin @xyflow/react wrapper providing the dotted
// background, zoom/pan/fit/lock controls (bottom-left, per the reference
// screenshot), custom node rendering, and drag-and-drop node creation from
// NodePalette.
import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  useReactFlow,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ivrNodeTypes } from "./nodes";
import { resolveOutputs } from "./nodeMeta";
import { IVR_DRAG_DATA_FORMAT } from "./NodePalette";
import type { AppNodeData, IvrNodeType } from "./types";

type AppNode = Node<AppNodeData>;

const DEFAULT_EDGE_COLOR = "hsl(var(--primary))";

// An edge's color always follows the dot it leaves from — never a single
// flat color for the whole graph — so a glance at a branch tells you which
// output it came from without tracing the line back to the node.
function edgeColor(nodes: AppNode[], edge: Edge): string {
  const source = nodes.find((n) => n.id === edge.source);
  if (!source?.type) return DEFAULT_EDGE_COLOR;
  const outputs = resolveOutputs(source.type as IvrNodeType, (source.data as AppNodeData).fields ?? {});
  const output = outputs.find((o) => o.id === edge.sourceHandle) ?? outputs[0];
  return output?.color ?? DEFAULT_EDGE_COLOR;
}

interface FlowCanvasProps {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onAddNode: (type: IvrNodeType, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string | null) => void;
}

export function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onAddNode, onNodeSelect }: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData(IVR_DRAG_DATA_FORMAT) as IvrNodeType;
      if (!nodeType) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onAddNode(nodeType, position);
    },
    [screenToFlowPosition, onAddNode],
  );

  // Recolored per source handle on every render rather than baked into the
  // stored edge — the color always reflects the *current* output palette
  // (e.g. after a switch node's cases are edited) instead of going stale.
  const coloredEdges = useMemo(
    () =>
      edges.map((edge) => {
        const color = edgeColor(nodes, edge);
        return {
          ...edge,
          style: { ...edge.style, stroke: color, strokeWidth: edge.animated ? 3 : 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
        };
      }),
    [edges, nodes],
  );

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={coloredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={ivrNodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={() => onNodeSelect(null)}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} className="bg-muted/30" />
        <Controls position="bottom-left" showInteractive />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!bg-card !border !border-border"
          maskColor="hsl(var(--muted) / 0.6)"
        />
      </ReactFlow>
    </div>
  );
}

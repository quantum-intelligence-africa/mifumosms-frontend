// The canvas itself: a thin @xyflow/react wrapper providing the dotted
// background, zoom/pan/fit/lock controls (bottom-left, per the reference
// screenshot), custom node rendering, and drag-and-drop node creation from
// NodePalette.
import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
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
import { IVR_DRAG_DATA_FORMAT } from "./NodePalette";
import type { AppNodeData, IvrNodeType } from "./types";

type AppNode = Node<AppNodeData>;

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

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 2, stroke: "hsl(var(--primary))", strokeDasharray: "6 4" },
        }}
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

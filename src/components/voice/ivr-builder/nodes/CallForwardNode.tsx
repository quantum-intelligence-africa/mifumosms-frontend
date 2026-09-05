import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.call_forward;

export function CallForwardNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const destination = typeof fields.destination === "string" ? fields.destination : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={destination || "Hakuna namba bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default CallForwardNode;

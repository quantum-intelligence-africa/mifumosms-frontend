import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.start;

export function StartNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle="Simu inaanzia hapa"
      outputs={meta.outputs}
      showTarget={false}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default StartNode;

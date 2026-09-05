import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.wait;

export function WaitNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const seconds = fields.seconds !== undefined && fields.seconds !== null ? String(fields.seconds) : "1";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={`${seconds}s`}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default WaitNode;

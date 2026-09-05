import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.decision;

export function DecisionNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const variable = typeof fields.variable === "string" ? fields.variable : "";
  const operator = typeof fields.operator === "string" ? fields.operator : "eq";
  const value = fields.value !== undefined && fields.value !== null ? String(fields.value) : "";
  const subtitle = variable ? `${variable} ${operator} ${value}` : "Hakuna masharti bado";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={subtitle}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default DecisionNode;

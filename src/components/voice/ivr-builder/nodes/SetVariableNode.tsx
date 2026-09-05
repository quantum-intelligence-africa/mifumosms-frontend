import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.set_variable;

export function SetVariableNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const name = typeof fields.name === "string" ? fields.name : "";
  const value = fields.value !== undefined && fields.value !== null ? String(fields.value) : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={name ? `${name} = ${value}` : "Hakuna taarifa bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SetVariableNode;

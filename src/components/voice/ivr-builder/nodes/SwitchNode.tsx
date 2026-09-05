import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META, resolveOutputs } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.switch;

// Switch's output ports are dynamic: one `case_<value>` port per configured
// case value plus a fixed `default` port. `resolveOutputs` (nodeMeta.ts)
// derives that list from the node's `fields.cases` array so the rendered
// ports always match what's editable in the inspector.
export function SwitchNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const variable = typeof fields.variable === "string" ? fields.variable : "";
  const outputs = resolveOutputs("switch", fields);

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={variable ? `kwa ${variable}` : "Hakuna taarifa bado"}
      outputs={outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SwitchNode;

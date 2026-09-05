import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.ivr_menu;

// The most detail-critical node in the builder: exactly 3 labeled output
// ports — green check "Match", yellow clock "Timeout", red warning "No Match"
// — laid out in a row along the bottom of the card, per the reference
// screenshot. BaseNode's multi-port branch renders this generically from
// nodeMeta's `outputs` array.
export function IvrMenuNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const prompt = typeof fields.prompt === "string" ? fields.prompt : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={prompt || "Hakuna ujumbe bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default IvrMenuNode;

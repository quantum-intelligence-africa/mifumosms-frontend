import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.http_request;

export function HttpRequestNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const method = typeof fields.method === "string" ? fields.method : "GET";
  const url = typeof fields.url === "string" ? fields.url : "";
  const dryRun = fields.dry_run !== false;

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={url ? `${method} ${url}${dryRun ? " (jaribio)" : ""}` : "Hakuna kiungo bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default HttpRequestNode;

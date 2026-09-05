import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.webhook_notify;

export function WebhookNotifyNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const url = typeof fields.url === "string" ? fields.url : "";
  const dryRun = fields.dry_run !== false;

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={url ? `${url}${dryRun ? " (jaribio)" : ""}` : "Hakuna kiungo bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default WebhookNotifyNode;

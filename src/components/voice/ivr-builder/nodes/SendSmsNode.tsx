import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.send_sms;

export function SendSmsNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const to = typeof fields.to === "string" ? fields.to : "";
  const dryRun = fields.dry_run !== false;

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={to ? `kwenda ${to}${dryRun ? " (jaribio)" : ""}` : "Hakuna mpokeaji bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SendSmsNode;

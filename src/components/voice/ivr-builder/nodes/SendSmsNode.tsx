import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";
import { useLanguage } from "@/hooks/useLanguage";

const meta = NODE_META.send_sms;

export function SendSmsNode({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  const fields = (data as AppNodeData).fields ?? {};
  const to = typeof fields.to === "string" ? fields.to : "";
  const dryRun = fields.dry_run !== false;

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={
        to
          ? `${t("voice.ivr_nodes.send_sms.to", { to })}${dryRun ? ` ${t("voice.ivr_nodes.common.test_suffix")}` : ""}`
          : t("voice.ivr_nodes.send_sms.no_recipient")
      }
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SendSmsNode;

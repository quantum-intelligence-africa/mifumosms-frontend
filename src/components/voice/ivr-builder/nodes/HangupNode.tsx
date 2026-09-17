import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";
import { useLanguage } from "@/hooks/useLanguage";

const meta = NODE_META.hangup;

export function HangupNode({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={t("voice.ivr_nodes.hangup.subtitle")}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default HangupNode;

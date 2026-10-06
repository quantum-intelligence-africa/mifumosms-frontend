import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";
import { useLanguage } from "@/hooks/useLanguage";

const meta = NODE_META.ai_agent;

export function AiAgentNode({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  const fields = (data as AppNodeData).fields ?? {};
  const prompt = typeof fields.prompt === "string" ? fields.prompt : "";
  const audioUrl = typeof fields.audio_url === "string" ? fields.audio_url : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={audioUrl ? "Salamu iliyorekodiwa" : prompt || t("voice.ivr_nodes.ai_agent.subtitle_empty")}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default AiAgentNode;

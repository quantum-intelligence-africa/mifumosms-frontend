import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";
import { useLanguage } from "@/hooks/useLanguage";

const meta = NODE_META.play;

export function PlayNode({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  const fields = (data as AppNodeData).fields ?? {};
  const prompt = typeof fields.prompt === "string" ? fields.prompt : "";
  const audioUrl = typeof fields.audio_url === "string" ? fields.audio_url : "";
  const subtitle =
    prompt ||
    (audioUrl ? t("voice.ivr_nodes.play.audio_label", { url: audioUrl }) : t("voice.ivr_nodes.play.subtitle_empty"));

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

export default PlayNode;

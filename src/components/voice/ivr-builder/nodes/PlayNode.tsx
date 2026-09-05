import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.play;

export function PlayNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const prompt = typeof fields.prompt === "string" ? fields.prompt : "";
  const audioUrl = typeof fields.audio_url === "string" ? fields.audio_url : "";
  const subtitle = prompt || (audioUrl ? `Sauti: ${audioUrl}` : "Hakuna ujumbe wala sauti bado");

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

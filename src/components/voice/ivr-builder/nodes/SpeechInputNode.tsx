import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";

const meta = NODE_META.speech_input;

export function SpeechInputNode({ data, selected }: NodeProps) {
  const fields = (data as AppNodeData).fields ?? {};
  const saveAs = typeof fields.save_as === "string" ? fields.save_as : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={saveAs ? `hifadhi kama ${saveAs}` : "Hakuna taarifa bado"}
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SpeechInputNode;

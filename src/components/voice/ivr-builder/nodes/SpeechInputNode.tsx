import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { NODE_META } from "../nodeMeta";
import type { AppNodeData } from "../types";
import { useLanguage } from "@/hooks/useLanguage";

const meta = NODE_META.speech_input;

export function SpeechInputNode({ data, selected }: NodeProps) {
  const { t } = useLanguage();
  const fields = (data as AppNodeData).fields ?? {};
  const saveAs = typeof fields.save_as === "string" ? fields.save_as : "";

  return (
    <BaseNode
      icon={meta.icon}
      iconClass={meta.iconClass}
      title={meta.label}
      subtitle={
        saveAs
          ? t("voice.ivr_nodes.speech_input.save_as", { name: saveAs })
          : t("voice.ivr_nodes.common.no_data")
      }
      outputs={meta.outputs}
      data={data as AppNodeData}
      selected={selected}
    />
  );
}

export default SpeechInputNode;

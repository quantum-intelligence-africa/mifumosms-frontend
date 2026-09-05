import type { NodeTypes } from "@xyflow/react";
import { StartNode } from "./StartNode";
import { IvrMenuNode } from "./IvrMenuNode";
import { DecisionNode } from "./DecisionNode";
import { PlayNode } from "./PlayNode";
import { CallForwardNode } from "./CallForwardNode";
import { HttpRequestNode } from "./HttpRequestNode";
import { AiPromptNode } from "./AiPromptNode";
import { AiAgentNode } from "./AiAgentNode";
import { HangupNode } from "./HangupNode";
import { SetVariableNode } from "./SetVariableNode";
import { SwitchNode } from "./SwitchNode";
import { WaitNode } from "./WaitNode";
import { SpeechInputNode } from "./SpeechInputNode";
import { SendSmsNode } from "./SendSmsNode";
import { WebhookNotifyNode } from "./WebhookNotifyNode";
import { RecordMessageNode } from "./RecordMessageNode";

export const ivrNodeTypes: NodeTypes = {
  start: StartNode,
  ivr_menu: IvrMenuNode,
  decision: DecisionNode,
  play: PlayNode,
  call_forward: CallForwardNode,
  http_request: HttpRequestNode,
  ai_prompt: AiPromptNode,
  ai_agent: AiAgentNode,
  hangup: HangupNode,
  set_variable: SetVariableNode,
  switch: SwitchNode,
  wait: WaitNode,
  speech_input: SpeechInputNode,
  send_sms: SendSmsNode,
  webhook_notify: WebhookNotifyNode,
  record_message: RecordMessageNode,
};

// Shared types for the IVR flow builder.
//
// Two shapes matter here and they are deliberately kept distinct:
//  - "Wire" shape: the exact `{nodes, edges}` JSON contract the backend
//    stores in `IvrFlow.current_definition` (see graph_validation.py contract
//    documented in the plan). Plain objects, no React Flow concepts.
//  - React Flow shape: `Node<AppNodeData>` / `Edge` as used by @xyflow/react.
//
// Conversion between the two lives in `useIvrFlow.ts` so every other file in
// this folder only ever deals with React Flow's native shapes.

export type IvrNodeType =
  | "start"
  | "ivr_menu"
  | "decision"
  | "play"
  | "call_forward"
  | "http_request"
  | "ai_prompt"
  | "ai_agent"
  | "hangup"
  | "set_variable"
  | "switch"
  | "wait"
  | "speech_input"
  | "send_sms"
  | "webhook_notify"
  | "record_message";

/** A node as stored in `current_definition.nodes`. Position is a sibling key
 * alongside id/type/data — the backend only structurally validates id/type,
 * so the extra key round-trips harmlessly. */
export interface WireNode {
  id: string;
  type: IvrNodeType;
  position?: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WireEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface FlowDefinition {
  nodes: WireNode[];
  edges: WireEdge[];
}

/** Data carried by every React Flow node in this builder. `fields` is exactly
 * the wire node's `data` object (the per-type settings). `highlighted` /
 * `errorMessages` are transient, simulate/validate-driven UI state that never
 * gets persisted back to the wire format. */
export interface AppNodeData {
  fields: Record<string, unknown>;
  highlighted?: boolean;
  errorMessages?: string[];
  [key: string]: unknown;
}

export type FlowStatus = "draft" | "published" | "archived";
export type FlowLanguage = "sw" | "en" | "sw_en";

export interface IvrFlowSummary {
  id: string;
  name: string;
  status: FlowStatus;
  language: FlowLanguage;
  /** Jina la Biashara — the business name callers hear wherever a prompt
   * says `{company_name}`. Blank means "use the tenant's own name", which
   * the backend resolves at call time; the builder never substitutes a
   * default of its own. */
  company_name?: string;
  updated_at: string;
}

export interface IvrFlowDetail extends IvrFlowSummary {
  /** Spoken phrasing of the opening hours, substituted into
   * `{business_hours}` (e.g. "Jumatatu hadi Ijumaa, kuanzia saa mbili
   * asubuhi hadi saa kumi na moja jioni"). */
  business_hours?: string;
  current_definition: FlowDefinition;
  published_version?: number | null;
  created_at: string;
}

export interface ValidationError {
  node_id: string | null;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: ValidationError[];
}

export interface PublishResponse {
  valid: boolean;
  version_number?: number;
  version_id?: string;
  errors?: ValidationError[];
}

export type AwaitingInputType = "dtmf" | "speech" | "recording" | null;

export interface SimulateResponse {
  session_id: string;
  current_node_id: string;
  node_type: IvrNodeType;
  prompt_to_play: string | null;
  /** Every line the caller hears on this hop, in order, with
   * `{company_name}` & co. already resolved — this is what the transcript
   * shows. Optional so an older backend still renders via
   * `prompt_to_play`. */
  spoken?: string[];
  awaiting_input_type: AwaitingInputType;
  is_terminal: boolean;
  branch_taken?: string | null;
  variables: Record<string, unknown>;
  path: string[];
  log: Array<{ node_id: string; node_type: string; message: string }>;
}

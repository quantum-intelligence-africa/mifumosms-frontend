// Client-side structural validation mirroring `ivr/graph_validation.py` on the
// backend (see plan spec — rules are transcribed here, not read from that
// file). Kept pure/synchronous so the toolbar can re-run it on every graph
// change without a network round trip.
//
// Messages name the things the builder shows on screen — "Chaguo la Mteja",
// the "Amechagua" branch — not the wire identifiers underneath them, so the
// person reading the error can find what it is talking about. The backend's
// copy of these rules is worded the same way; keep the two in step.
import type { FlowDefinition, ValidationError, IvrNodeType } from "./types";
import { NODE_META, resolveOutputs } from "./nodeMeta";

/** The on-screen name of one of a node's branches ("match" -> "Amechagua"),
 * so an error can point at the label the user sees on the card. */
function branchLabel(type: IvrNodeType, handle: string): string {
  return NODE_META[type]?.outputs.find((o) => o.id === handle)?.label ?? handle;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function validateFlow(definition: FlowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodes = definition?.nodes ?? [];
  const edges = definition?.edges ?? [];

  const startNodes = nodes.filter((n) => n.type === "start");
  if (startNodes.length === 0) {
    errors.push({ node_id: null, message: "Mtiririko lazima uanze na kisanduku cha Mwanzo wa Simu" });
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Reachability from Start via BFS over edges.
  const reachable = new Set<string>();
  if (startNodes.length > 0) {
    const outgoingBySource = new Map<string, string[]>();
    for (const e of edges) {
      const list = outgoingBySource.get(e.source) ?? [];
      list.push(e.target);
      outgoingBySource.set(e.source, list);
    }
    const queue = [startNodes[0].id];
    reachable.add(startNodes[0].id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of outgoingBySource.get(current) ?? []) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }
    for (const n of nodes) {
      if (!reachable.has(n.id)) {
        errors.push({ node_id: n.id, message: "Kisanduku hiki hakifikiki kutoka Mwanzo wa Simu" });
      }
    }
  }

  // Per-node structural + field checks.
  for (const node of nodes) {
    const meta = NODE_META[node.type as IvrNodeType];
    if (!meta) {
      errors.push({ node_id: node.id, message: `Aina ya kisanduku haijulikani: "${node.type}"` });
      continue;
    }

    const outgoing = edges.filter((e) => e.source === node.id);

    if (node.type === "ivr_menu") {
      for (const handle of ["match", "timeout", "no_match"]) {
        if (!outgoing.some((e) => e.sourceHandle === handle)) {
          errors.push({ node_id: node.id, message: `${meta.label}: njia ya "${branchLabel("ivr_menu", handle)}" haijaunganishwa` });
        }
      }
    } else if (node.type === "decision") {
      for (const handle of ["true", "false"]) {
        if (!outgoing.some((e) => e.sourceHandle === handle)) {
          errors.push({ node_id: node.id, message: `${meta.label}: njia ya "${branchLabel("decision", handle)}" haijaunganishwa` });
        }
      }
    } else if (node.type === "switch") {
      if (!outgoing.some((e) => e.sourceHandle === "default")) {
        errors.push({ node_id: node.id, message: `${meta.label}: njia ya "${branchLabel("switch", "default")}" haijaunganishwa` });
      }
    } else if (!meta.terminal) {
      if (outgoing.length === 0) {
        errors.push({ node_id: node.id, message: `${meta.label}: hakuna njia inayotoka kwenye kisanduku hiki` });
      }
    }

    for (const field of meta.fields) {
      if (field.required && isEmpty((node.data ?? {})[field.key])) {
        errors.push({ node_id: node.id, message: `${meta.label}: "${field.label}" inahitajika` });
      }
    }

    if (node.type === "play") {
      const data = node.data ?? {};
      if (isEmpty(data.prompt) && isEmpty(data.audio_url)) {
        errors.push({ node_id: node.id, message: `${meta.label}: andika ujumbe wa kumsomea mteja au weka sauti iliyorekodiwa` });
      }
    }
  }

  // Dangling edges (defensive — shouldn't happen via the canvas UI, but a
  // hand-edited/imported definition could produce one).
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      errors.push({ node_id: edge.source ?? null, message: "Muunganisho unaelekea kisanduku kisichokuwepo" });
    }
  }

  return errors;
}

// Re-exported for node components that need to know the live output set for
// a switch node (whose ports depend on its `cases` field).
export { resolveOutputs };

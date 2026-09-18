// Lets a user paste or upload a `{nodes, edges}` flow definition — the same
// wire format `exportDefinition()` produces — and load it onto the canvas as
// ordinary, fully editable nodes/edges. Validation here is deliberately
// shallow (shape + known node types): the deeper graph rules (reachability,
// required fields per node type) are already re-run continuously by
// validation.ts the moment the imported nodes land in the canvas, and show
// up as the normal error badge — no need to duplicate them here.
import { useRef, useState } from "react";
import { FileUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { ivrNodeTypes } from "./nodes";
import type { FlowDefinition, WireNode, WireEdge } from "./types";

const KNOWN_TYPES = new Set(Object.keys(ivrNodeTypes));

interface ImportFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (definition: FlowDefinition) => void;
}

/** Parses and shape-checks pasted JSON against the wire contract. Returns
 * either a ready-to-use definition or a list of human-readable problems —
 * never both, so the caller doesn't need its own "is this good enough" call. */
function parseAndValidate(raw: string): { definition: FlowDefinition } | { errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { errors: [`Invalid JSON: ${(e as Error).message}`] };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { errors: ["The top level must be a JSON object with \"nodes\" and \"edges\"."] };
  }
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    return { errors: ["Missing or invalid \"nodes\" / \"edges\" arrays."] };
  }

  const errors: string[] = [];
  const seenIds = new Set<string>();
  const nodes: WireNode[] = [];
  obj.nodes.forEach((n, i) => {
    if (typeof n !== "object" || n === null) {
      errors.push(`Node ${i + 1}: not an object.`);
      return;
    }
    const node = n as Record<string, unknown>;
    if (typeof node.id !== "string" || !node.id) {
      errors.push(`Node ${i + 1}: missing "id".`);
      return;
    }
    if (seenIds.has(node.id)) {
      errors.push(`Node "${node.id}": duplicate id.`);
      return;
    }
    seenIds.add(node.id);
    if (typeof node.type !== "string" || !KNOWN_TYPES.has(node.type)) {
      errors.push(`Node "${node.id}": unknown type "${String(node.type)}".`);
      return;
    }
    const position =
      typeof node.position === "object" && node.position !== null
        ? (node.position as { x: number; y: number })
        : undefined;
    nodes.push({
      id: node.id,
      type: node.type as WireNode["type"],
      position,
      data: (typeof node.data === "object" && node.data !== null ? node.data : {}) as Record<string, unknown>,
    });
  });

  const edges: WireEdge[] = [];
  obj.edges.forEach((e, i) => {
    if (typeof e !== "object" || e === null) {
      errors.push(`Edge ${i + 1}: not an object.`);
      return;
    }
    const edge = e as Record<string, unknown>;
    if (typeof edge.source !== "string" || typeof edge.target !== "string") {
      errors.push(`Edge ${i + 1}: missing "source" or "target".`);
      return;
    }
    if (!seenIds.has(edge.source) || !seenIds.has(edge.target)) {
      errors.push(`Edge ${i + 1}: references a node id that isn't in "nodes".`);
      return;
    }
    edges.push({
      id: typeof edge.id === "string" && edge.id ? edge.id : `e_${i}_${edge.source}_${edge.target}`,
      source: edge.source,
      target: edge.target,
      ...(typeof edge.sourceHandle === "string" ? { sourceHandle: edge.sourceHandle } : {}),
    });
  });

  if (errors.length > 0) return { errors };
  return { definition: { nodes, edges } };
}

export function ImportFlowDialog({ open, onOpenChange, onImport }: ImportFlowDialogProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText("");
    setErrors([]);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const handleImport = () => {
    const result = parseAndValidate(text);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    onImport(result.definition);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("voice.ivr_builder.import_dialog.title")}</DialogTitle>
          <DialogDescription>{t("voice.ivr_builder.import_dialog.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" />
              {t("voice.ivr_builder.import_dialog.choose_file")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{"nodes": [...], "edges": [...]}'
            className="h-72 font-mono text-xs"
          />

          {errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <ul className="list-disc space-y-0.5 pl-4">
                {errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("voice.ivr_builder.import_dialog.cancel")}
          </Button>
          <Button type="button" onClick={handleImport} disabled={!text.trim()}>
            {t("voice.ivr_builder.import_dialog.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

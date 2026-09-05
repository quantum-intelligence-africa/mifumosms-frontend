// Property panel for the currently-selected node. Renders form fields driven
// entirely by nodeMeta.ts's per-type `fields` list, so adding a new field to
// a node type only requires touching nodeMeta.ts.
import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NODE_META } from "./nodeMeta";
import { voiceApi } from "@/services/voiceApi";
import type { AppNodeData, IvrNodeType } from "./types";

interface NodeInspectorProps {
  nodeId: string;
  nodeType: IvrNodeType;
  data: AppNodeData;
  onChange: (patch: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: () => void;
}

// Local draft text for a comma-separated list field. Kept as component-local
// state (seeded once from the incoming value) rather than derived from
// `value` on every render — deriving the display string by re-joining the
// parsed array fights the user mid-typing (e.g. typing "1, " immediately
// collapses back to "1" because a trailing separator parses to nothing).
// NodeInspector is remounted (via `key={nodeId}`) whenever the selected node
// changes, so this local seed is always correct for the node being edited.
function ListField({
  fieldId,
  label,
  required,
  value,
  placeholder,
  helpText,
  onChange,
}: {
  fieldId: string;
  label: string;
  required?: boolean;
  value: unknown;
  placeholder?: string;
  helpText?: string;
  onChange: (list: string[]) => void;
}) {
  const [text, setText] = useState(() => (Array.isArray(value) ? (value as string[]).join(", ") : (value as string) ?? ""));

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId} className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={fieldId}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          onChange(
            raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
        className="h-8 text-xs"
      />
      {helpText && <p className="text-[10px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}

interface AgentOption {
  id: string;
  name: string;
  phone_number: string;
  department: string;
  is_active: boolean;
}

const TYPE_MANUALLY = "__manual__";

// The "Mhudumu" picker on a transfer box: choosing a person fills in the
// number and the spoken name, so the author never types a phone number.
function AgentField({
  fieldId,
  label,
  helpText,
  value,
  onPick,
}: {
  fieldId: string;
  label: string;
  helpText?: string;
  value: unknown;
  onPick: (agent: AgentOption | null) => void;
}) {
  const [agents, setAgents] = useState<AgentOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    voiceApi.get<AgentOption[]>("/voice/agents/?active=true").then((res) => {
      if (!cancelled) setAgents(res.success && res.data ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = typeof value === "string" && value ? value : TYPE_MANUALLY;

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId} className="text-xs">
        {label}
      </Label>
      <Select
        value={current}
        onValueChange={(v) => onPick(v === TYPE_MANUALLY ? null : agents?.find((a) => a.id === v) ?? null)}
        disabled={agents === null}
      >
        <SelectTrigger id={fieldId} className="h-8 text-xs">
          <SelectValue placeholder={agents === null ? "Inapakia…" : "Chagua mhudumu"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TYPE_MANUALLY} className="text-xs">
            Andika namba mwenyewe
          </SelectItem>
          {(agents ?? []).map((a) => (
            <SelectItem key={a.id} value={a.id} className="text-xs">
              {a.name}
              {a.department ? ` · ${a.department}` : ""} — {a.phone_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {agents !== null && agents.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          Hakuna mhudumu bado. Waongeze kwenye Voice / IVR &gt; Agents ili wachaguliwe hapa kwa majina.
        </p>
      ) : (
        helpText && <p className="text-[10px] text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

// The "Wahudumu anaoweza kuunganisha nao" picker on an AI Agent box: a
// checkbox list rather than a single Select, since the AI itself chooses
// one of several at call time (see voice/services.py::_pick_ai_response) —
// this field only narrows which agents it's allowed to pick from.
function AgentMultiSelectField({
  fieldId,
  label,
  helpText,
  value,
  onChange,
}: {
  fieldId: string;
  label: string;
  helpText?: string;
  value: unknown;
  onChange: (ids: string[]) => void;
}) {
  const [agents, setAgents] = useState<AgentOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    voiceApi.get<AgentOption[]>("/voice/agents/?active=true").then((res) => {
      if (!cancelled) setAgents(res.success && res.data ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = new Set(Array.isArray(value) ? (value as string[]) : []);

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {agents === null ? (
        <p className="text-[10px] text-muted-foreground">Inapakia…</p>
      ) : agents.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          Hakuna mhudumu bado. Waongeze kwenye Voice / IVR &gt; Agents ili wachaguliwe hapa.
        </p>
      ) : (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <Checkbox
                id={`${fieldId}-${a.id}`}
                checked={selected.has(a.id)}
                onCheckedChange={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(a.id);
                  else next.delete(a.id);
                  onChange(Array.from(next));
                }}
              />
              <Label htmlFor={`${fieldId}-${a.id}`} className="text-xs font-normal">
                {a.name}
                {a.department ? ` · ${a.department}` : ""}
              </Label>
            </div>
          ))}
        </div>
      )}
      {helpText && <p className="text-[10px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}

interface PromptOption {
  id: string;
  name: string;
  kind: "text" | "audio";
  text: string;
  voice: string;
  audio_url: string;
}

// The "Tumia kutoka Maktaba ya Ujumbe" picker on a Play box: choosing a
// saved message fills the text (and voice) or the recorded-audio link,
// clearing whichever one it replaces so the two never disagree about what
// gets spoken. "Andika/pakia mwenyewe" leaves the fields for manual editing.
function PromptLibraryField({
  fieldId,
  label,
  helpText,
  value,
  onPick,
}: {
  fieldId: string;
  label: string;
  helpText?: string;
  value: unknown;
  onPick: (prompt: PromptOption | null) => void;
}) {
  const [prompts, setPrompts] = useState<PromptOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    voiceApi.get<PromptOption[]>("/voice/ivr/prompts/").then((res) => {
      if (!cancelled) setPrompts(res.success && res.data ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = typeof value === "string" && value ? value : TYPE_MANUALLY;

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId} className="text-xs">
        {label}
      </Label>
      <Select
        value={current}
        onValueChange={(v) => onPick(v === TYPE_MANUALLY ? null : prompts?.find((p) => p.id === v) ?? null)}
        disabled={prompts === null}
      >
        <SelectTrigger id={fieldId} className="h-8 text-xs">
          <SelectValue placeholder={prompts === null ? "Inapakia…" : "Chagua ujumbe"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TYPE_MANUALLY} className="text-xs">
            Andika/pakia mwenyewe hapa chini
          </SelectItem>
          {(prompts ?? []).map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">
              {p.kind === "audio" ? "🔊 " : "📝 "}
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {prompts !== null && prompts.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          Hakuna ujumbe bado. Uongeze kwenye Voice / IVR &gt; Audio Prompts ili uchaguliwe hapa kwa jina.
        </p>
      ) : (
        helpText && <p className="text-[10px] text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

export function NodeInspector({ nodeId, nodeType, data, onChange, onClose, onDelete }: NodeInspectorProps) {
  const meta = NODE_META[nodeType];
  const fields = data.fields ?? {};

  return (
    <Card className="absolute left-3 right-3 top-3 z-10 w-auto shadow-lg sm:right-auto sm:w-72">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-sm">{meta.label}</CardTitle>
          <p className="truncate text-[11px] text-muted-foreground">{meta.description}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose} aria-label="Funga mipangilio">
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="max-h-[60vh] space-y-3 overflow-y-auto pb-3">
        {meta.fields.length === 0 && (
          <p className="text-xs text-muted-foreground">Kisanduku hiki hakina mipangilio ya kubadilisha.</p>
        )}
        {meta.fields.map((field) => {
          const value = fields[field.key];
          const fieldId = `${nodeId}-${field.key}`;

          if (field.type === "agent") {
            return (
              <AgentField
                key={field.key}
                fieldId={fieldId}
                label={field.label}
                helpText={field.helpText}
                value={value}
                onPick={(agent) =>
                  onChange(
                    agent
                      ? { agent_id: agent.id, destination: agent.phone_number, agent_name: agent.department || agent.name }
                      : { agent_id: "" },
                  )
                }
              />
            );
          }

          if (field.type === "agent_multiselect") {
            return (
              <AgentMultiSelectField
                key={field.key}
                fieldId={fieldId}
                label={field.label}
                helpText={field.helpText}
                value={value}
                onChange={(ids) => onChange({ [field.key]: ids })}
              />
            );
          }

          if (field.type === "prompt_library") {
            return (
              <PromptLibraryField
                key={field.key}
                fieldId={fieldId}
                label={field.label}
                helpText={field.helpText}
                value={value}
                onPick={(prompt) =>
                  onChange(
                    prompt
                      ? prompt.kind === "audio"
                        ? { library_prompt_id: prompt.id, audio_url: prompt.audio_url, prompt: "" }
                        : { library_prompt_id: prompt.id, prompt: prompt.text, audio_url: "", ...(prompt.voice ? { voice: prompt.voice } : {}) }
                      : { library_prompt_id: "" },
                  )
                }
              />
            );
          }

          if (field.type === "checkbox") {
            return (
              <div key={field.key} className="flex items-center gap-2">
                <Checkbox
                  id={fieldId}
                  checked={value === undefined ? !!field.defaultValue : !!value}
                  onCheckedChange={(checked) => onChange({ [field.key]: !!checked })}
                />
                <Label htmlFor={fieldId} className="text-xs font-normal">
                  {field.label}
                </Label>
              </div>
            );
          }

          if (field.type === "select") {
            const current = (value as string) ?? (field.defaultValue as string) ?? "";
            return (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={fieldId} className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Select value={current} onValueChange={(v) => onChange({ [field.key]: v })}>
                  <SelectTrigger id={fieldId} className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={fieldId} className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Textarea
                  id={fieldId}
                  value={(value as string) ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                  rows={3}
                  className="text-xs"
                />
              </div>
            );
          }

          if (field.type === "list") {
            return (
              <ListField
                key={field.key}
                fieldId={fieldId}
                label={field.label}
                required={field.required}
                value={value}
                placeholder={field.placeholder}
                helpText={field.helpText}
                onChange={(list) => onChange({ [field.key]: list })}
              />
            );
          }

          return (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={fieldId} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={fieldId}
                type={field.type === "number" ? "number" : "text"}
                value={(value as string | number) ?? ((field.defaultValue as string | number) ?? "")}
                placeholder={field.placeholder}
                onChange={(e) => onChange({ [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                className="h-8 text-xs"
              />
              {field.helpText && <p className="text-[10px] text-muted-foreground">{field.helpText}</p>}
            </div>
          );
        })}

        {nodeType !== "start" && (
          <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Futa kisanduku
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

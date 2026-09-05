// Drives the "test without a real phone number" simulate loop. There is no
// server-side session state — every /input/ call must echo back the previous
// response's `current_node_id` and `variables`, which this hook tracks.
//
// The transcript it builds is the *call*, not the trace: assistant bubbles
// are the response's `spoken` lines, exactly what a caller would hear with
// `{company_name}` and friends already filled in, and the few status lines
// between them are written the way a person would describe what happened.
// The engine's own step log — "DTMF '1' matched — match branch taken." —
// stays where it belongs, in the persisted execution log the API and call
// history expose to operators; a business owner testing their phone line
// should never have to read it.
import { useState, useCallback, useRef } from "react";
import { voiceApi } from "@/services/voiceApi";
import type { AwaitingInputType, SimulateResponse } from "./types";

export interface TranscriptEntry {
  id: string;
  role: "system" | "assistant" | "user" | "error";
  text: string;
}

interface SimulateState {
  isLoading: boolean;
  isTerminal: boolean;
  awaitingInputType: AwaitingInputType;
  transcript: TranscriptEntry[];
  path: string[];
  error: string | null;
}

const initialState: SimulateState = {
  isLoading: false,
  isTerminal: false,
  awaitingInputType: null,
  transcript: [],
  path: [],
  error: null,
};

/** How the call got to this step, in the caller's terms. `match` needs no
 * line at all — the digit the tester just pressed is already on screen. */
function describeBranch(branch: string | null | undefined): string | null {
  if (branch === "no_match") return "Chaguo hilo halipo kwenye menyu.";
  if (branch === "timeout") return "Mteja hakuchagua kwa wakati.";
  return null;
}

function describeEnding(nodeType: string | null | undefined): string {
  if (nodeType === "call_forward") return "Mteja anaunganishwa na mhudumu.";
  if (nodeType === "record_message") return "Mteja anaacha ujumbe wa sauti.";
  return "Simu imemalizika.";
}

let entryCounter = 0;
function newEntryId() {
  entryCounter += 1;
  return `t${entryCounter}`;
}

export function useIvrSimulate(flowId: string | undefined) {
  const [state, setState] = useState<SimulateState>(initialState);
  const sessionIdRef = useRef<string | null>(null);
  const currentNodeIdRef = useRef<string>("");
  const variablesRef = useRef<Record<string, unknown>>({});

  const applyResponse = useCallback((res: SimulateResponse, extraEntries: TranscriptEntry[] = []) => {
    sessionIdRef.current = res.session_id;
    currentNodeIdRef.current = res.current_node_id;
    variablesRef.current = res.variables ?? {};

    const entries: TranscriptEntry[] = [...extraEntries];

    const outcome = describeBranch(res.branch_taken);
    if (outcome) entries.push({ id: newEntryId(), role: "system", text: outcome });

    // `spoken` already carries the menu prompt, so `prompt_to_play` is only
    // used as a fallback for a backend that predates that field.
    const spoken = res.spoken ?? (res.prompt_to_play ? [res.prompt_to_play] : []);
    for (const line of spoken) {
      entries.push({ id: newEntryId(), role: "assistant", text: line });
    }

    if (res.is_terminal) {
      entries.push({ id: newEntryId(), role: "system", text: describeEnding(res.node_type) });
    }

    setState((s) => ({
      ...s,
      isLoading: false,
      isTerminal: res.is_terminal,
      awaitingInputType: res.is_terminal ? null : res.awaiting_input_type,
      transcript: [...s.transcript, ...entries],
      path: res.path ?? [],
      error: null,
    }));
  }, []);

  const start = useCallback(async () => {
    if (!flowId) return;
    setState({ ...initialState, isLoading: true });
    const res = await voiceApi.post<SimulateResponse>(`/voice/ivr/${flowId}/simulate/start/`);
    if (res.success && res.data) {
      applyResponse(res.data);
    } else {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: res.error || "Failed to start simulation",
        transcript: [...s.transcript, { id: newEntryId(), role: "error", text: res.error || "Failed to start simulation" }],
      }));
    }
  }, [flowId, applyResponse]);

  const sendInput = useCallback(
    async (type: "dtmf" | "speech" | "timeout", value?: string) => {
      if (!flowId || !sessionIdRef.current || state.isTerminal) return;

      const userEntry: TranscriptEntry | null =
        type === "timeout"
          ? { id: newEntryId(), role: "user", text: "(hakujibu)" }
          : { id: newEntryId(), role: "user", text: value ?? "" };

      setState((s) => ({
        ...s,
        isLoading: true,
        transcript: userEntry ? [...s.transcript, userEntry] : s.transcript,
      }));

      const res = await voiceApi.post<SimulateResponse>(`/voice/ivr/${flowId}/simulate/${sessionIdRef.current}/input/`, {
        type,
        value,
        current_node_id: currentNodeIdRef.current,
        variables: variablesRef.current,
      });

      if (res.success && res.data) {
        applyResponse(res.data);
      } else {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: res.error || "Simulation step failed",
          transcript: [...s.transcript, { id: newEntryId(), role: "error", text: res.error || "Simulation step failed" }],
        }));
      }
    },
    [flowId, state.isTerminal, applyResponse],
  );

  const reset = useCallback(() => {
    sessionIdRef.current = null;
    currentNodeIdRef.current = "";
    variablesRef.current = {};
    setState(initialState);
  }, []);

  return { ...state, start, sendInput, reset };
}

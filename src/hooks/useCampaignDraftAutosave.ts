// Debounced autosave for the Create Campaign dialog's "Save Draft" flow.
// Modeled on useIvrFlow.ts's save-debounce/dirty-diff/beforeunload pattern
// (src/components/voice/ivr-builder/useIvrFlow.ts), generalized to a plain
// serializable campaign-form object, plus a create-then-update lifecycle
// useIvrFlow doesn't need: a flow always has an id from the moment its page
// loads, but a brand-new campaign draft doesn't exist on the server until
// its first successful save.
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";

const AUTOSAVE_DELAY_MS = 800;

export interface CampaignDraftFormData {
  name: string;
  description?: string;
  campaign_type?: "sms" | "whatsapp" | "email" | "mixed";
  sender_id?: string;
  message_text?: string;
  template?: string | null;
  target_contact_ids?: string[];
  target_segment_ids?: string[];
  target_criteria?: {
    tags?: string[];
    opt_in_status?: string;
  };
  settings?: {
    send_time?: string;
    timezone?: string;
  };
  is_recurring?: boolean;
  recurring_schedule?: Record<string, unknown>;
}

interface UseCampaignDraftAutosaveOptions {
  formData: CampaignDraftFormData;
  /** null until the first save creates a row; the hook switches to PATCH once set. */
  draftId: string | null;
  /** false while the dialog is closed, or while a full (non-draft) submit is in flight. */
  enabled: boolean;
  onDraftCreated: (id: string) => void;
}

export function useCampaignDraftAutosave({
  formData,
  draftId,
  enabled,
  onDraftCreated,
}: UseCampaignDraftAutosaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastSavedJson = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs so saveNow always sees the latest values without needing them in
  // its own dependency array (avoids re-creating the debounce effect below
  // on every keystroke — see the JSON-string dependency note there).
  const draftIdRef = useRef<string | null>(draftId);
  const formDataRef = useRef(formData);
  const isSavingRef = useRef(false);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Stringified once per render for dirty-diffing. Deliberately used as the
  // debounce effect's dependency instead of `formData` itself: the dialog
  // constructs a new formData object literal on every render regardless of
  // whether its content changed, and depending on that reference directly
  // would reset (and therefore starve) the debounce timer on any unrelated
  // re-render, not just on real edits.
  const formDataJson = JSON.stringify(formData);

  const saveNow = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const json = JSON.stringify(formDataRef.current);
    if (json === lastSavedJson.current) return;

    const currentDraftId = draftIdRef.current;
    if (!currentDraftId && !formDataRef.current.name.trim()) {
      // Nothing worth persisting yet — don't create a row for an empty dialog.
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      if (currentDraftId) {
        const res = await apiClient.updateCampaign(currentDraftId, formDataRef.current);
        if (res.success) {
          lastSavedJson.current = json;
          setLastSavedAt(new Date());
          setHasUnsavedChanges(false);
        } else {
          setSaveError(res.error || "Couldn't save your changes.");
        }
      } else {
        const res = await apiClient.createCampaign({
          ...formDataRef.current,
          campaign_type: formDataRef.current.campaign_type || "sms",
          message_text: formDataRef.current.message_text || "",
          save_as_draft: true,
        });
        if (res.success && res.data) {
          lastSavedJson.current = json;
          setLastSavedAt(new Date());
          setHasUnsavedChanges(false);
          draftIdRef.current = res.data.id;
          onDraftCreated(res.data.id);
        } else {
          setSaveError(res.error || "Couldn't save your draft.");
        }
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
    // formDataRef/draftIdRef are refs (stable identity); onDraftCreated should
    // be stable from the caller (useCallback/useState setter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onDraftCreated]);

  // Debounced autosave — fires ~800ms after the last form change.
  useEffect(() => {
    if (!enabled) return;
    const changed = formDataJson !== lastSavedJson.current;
    setHasUnsavedChanges(changed);
    if (!changed) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNow();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDataJson, enabled]);

  // Warn before an accidental tab close/reload loses an edit the debounce
  // hasn't flushed yet.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Retry a save that failed (or was queued) while offline as soon as
  // connectivity returns, instead of waiting for the next edit.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = () => saveNow();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, [hasUnsavedChanges, saveNow]);

  const dismissError = useCallback(() => setSaveError(null), []);

  return { isSaving, lastSavedAt, hasUnsavedChanges, saveError, saveNow, dismissError };
}

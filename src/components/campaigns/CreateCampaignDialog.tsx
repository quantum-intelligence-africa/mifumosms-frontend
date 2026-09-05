import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, MessageSquare, AlertCircle, DollarSign, Info, Tag, ArrowRight, CheckCircle, Repeat, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useContacts } from '@/hooks/useContacts';
import { useSenderNames } from '@/hooks/useSenderNames';
import { useToast } from '@/hooks/use-toast';
import { useCampaignDraftAutosave, type CampaignDraftFormData } from '@/hooks/useCampaignDraftAutosave';
import {
  calculateCampaignCost,
  calculateRecurringWeeklyCost,
  calculateSMSSegments,
  validateRecurringSchedule,
  formatScheduleDescription,
} from '@/utils/campaignUtils';
import { apiClient, SenderNameRequest, UnifiedSenderName } from '@/lib/api';

interface CreateCampaignDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When set, the dialog resumes an existing (usually draft) campaign instead of starting a new one. */
  draftId?: string | null;
}

type CampaignFormData = {
  name: string;
  description: string;
  campaign_type: 'sms' | 'whatsapp' | 'email' | 'mixed';
  sender_id: string;
  message_text: string;
  template: string | null;
  scheduled_at: string | null;
  target_contact_ids: string[];
  target_segment_ids: string[];
  target_criteria: { tags: string[]; opt_in_status: string };
  newTag: string;
  settings: { send_time: string; timezone: string };
  is_recurring: boolean;
  recurring_schedule: {
    type: 'single' | 'daily' | 'weekly' | 'monthly';
    time: string;
    days: string[];
    day_of_month: number;
    end_date: string | null;
  };
};

function blankFormData(): CampaignFormData {
  return {
    name: '',
    description: '',
    campaign_type: 'sms',
    sender_id: '',
    message_text: '',
    template: null,
    scheduled_at: null,
    target_contact_ids: [],
    target_segment_ids: [],
    target_criteria: { tags: [], opt_in_status: 'opted_in' },
    newTag: '',
    settings: { send_time: '09:00', timezone: 'Africa/Dar_es_Salaam' },
    is_recurring: false,
    recurring_schedule: { type: 'daily', time: '09:00', days: [], day_of_month: 1, end_date: null },
  };
}

// --- Local (per-browser) draft mirror ---------------------------------------
// A lightweight offline backstop: the dialog's form state is mirrored to
// localStorage as the user types, keyed by campaign id once one exists (or a
// per-open session token before that). This is a convenience layer on top of
// the real autosave (useCampaignDraftAutosave) — it lets a resumed draft warn
// about locally-newer unsynced edits, and gives the dialog something to fall
// back to if the initial resume fetch fails while offline. It is not a
// substitute for the server copy, which remains the source of truth.
interface LocalDraftSnapshot {
  formData: Partial<CampaignFormData>;
  updatedAt: string;
}

function localDraftKey(id: string) {
  return `campaign_draft:${id}`;
}

function readLocalDraft(key: string): LocalDraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LocalDraftSnapshot) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(key: string, snapshot: LocalDraftSnapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Storage full/unavailable — the offline mirror is a nice-to-have, not required.
  }
}

export function clearLocalCampaignDraft(id: string) {
  try {
    localStorage.removeItem(localDraftKey(id));
  } catch {
    // ignore
  }
}

export function CreateCampaignDialog({ children, onSuccess, open: externalOpen, onOpenChange, draftId }: CreateCampaignDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [formData, setFormData] = useState<CampaignFormData>(blankFormData());

  // The draft this dialog is currently backed by — null until autosave (or a
  // `draftId` resume prop) gives it a real server id.
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId ?? null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  const [localRestore, setLocalRestore] = useState<LocalDraftSnapshot | null>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  const { createCampaign, updateCampaign, startCampaign } = useCampaigns();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const { senderNames, loading: sendersLoading } = useSenderNames();
  const showContactsEmptyState = !contactsLoading && contacts.length === 0;

  // Filter usable sender names - handle both SenderNameRequest and UnifiedSenderName response types.
  const approvedSenders = useMemo(() => {
    if (!senderNames || senderNames.length === 0) return [];

    const mapped = (senderNames || [])
      .filter((req: SenderNameRequest | UnifiedSenderName) => {
        const status = (req.status || '').toLowerCase();
        const senderName = ('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null);
        const isUsable = status === "approved" || status === "active";
        const hasValidName = senderName && senderName.trim() !== "";
        return isUsable && hasValidName;
      })
      .map((req: SenderNameRequest | UnifiedSenderName) => {
        const name = (('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null) || '').trim();
        return { id: req.id, sender_name: name, status: (req.status || '').toLowerCase() };
      });

    const seen = new Map<string, typeof mapped[0]>();
    for (const entry of mapped) {
      if (!seen.has(entry.sender_name)) seen.set(entry.sender_name, entry);
    }
    return Array.from(seen.values());
  }, [senderNames]);

  // Fetch SMS balance when dialog opens
  useEffect(() => {
    if (open) fetchSmsBalance();
  }, [open]);

  const fetchSmsBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await apiClient.getSMSBalance();
      setSmsBalance(response.success && response.data ? response.data.credits || 0 : 0);
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
      setSmsBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Reset (fresh create) or fetch-and-prefill (resume) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    sessionTokenRef.current = crypto.randomUUID();
    setLocalRestore(null);
    setDraftLoadError(null);
    setScheduleErrors([]);
    setStep(1);

    if (!draftId) {
      setCurrentDraftId(null);
      setFormData(blankFormData());
      return;
    }

    setCurrentDraftId(draftId);
    setIsLoadingDraft(true);
    apiClient.getCampaign(draftId).then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        const criteria = (d.target_criteria || {}) as { tags?: string[]; opt_in_status?: string };
        const settings = (d.settings || {}) as { send_time?: string; timezone?: string };
        setFormData((prev) => ({
          ...prev,
          name: d.name || '',
          description: d.description || '',
          campaign_type: (d.campaign_type as CampaignFormData['campaign_type']) || 'sms',
          sender_id: d.sender_name || '',
          message_text: d.message_text || '',
          template: d.template || null,
          scheduled_at: d.scheduled_at || null,
          target_contact_ids: d.target_contact_ids || [],
          target_segment_ids: d.target_segment_ids || [],
          target_criteria: { tags: criteria.tags || [], opt_in_status: criteria.opt_in_status || 'opted_in' },
          settings: { send_time: settings.send_time || '09:00', timezone: settings.timezone || 'Africa/Dar_es_Salaam' },
          is_recurring: d.is_recurring || false,
          recurring_schedule: (d.recurring_schedule as CampaignFormData['recurring_schedule']) || prev.recurring_schedule,
        }));

        const local = readLocalDraft(localDraftKey(draftId));
        if (local && new Date(local.updatedAt).getTime() > new Date(d.updated_at).getTime()) {
          setLocalRestore(local);
        }
      } else {
        const local = readLocalDraft(localDraftKey(draftId));
        if (local) {
          setFormData((prev) => ({ ...prev, ...local.formData }));
          setDraftLoadError('offline');
        } else {
          setDraftLoadError(res.error || 'Failed to load draft');
        }
      }
      setIsLoadingDraft(false);
    });
  }, [open, draftId]);

  // Mirror form state to localStorage as a lightweight offline backstop.
  useEffect(() => {
    if (!open) return;
    const key = currentDraftId ? localDraftKey(currentDraftId) : `campaign_draft:new:${sessionTokenRef.current}`;
    const timer = setTimeout(() => {
      writeLocalDraft(key, { formData, updatedAt: new Date().toISOString() });
    }, 300);
    return () => clearTimeout(timer);
  }, [formData, open, currentDraftId]);

  const handleDraftCreated = useCallback((id: string) => {
    try {
      localStorage.removeItem(`campaign_draft:new:${sessionTokenRef.current}`);
    } catch {
      // ignore
    }
    setCurrentDraftId(id);
  }, []);

  // Subset of formData that's safe to autosave on every debounce tick.
  // scheduled_at is deliberately excluded — scheduling a draft is only ever
  // triggered by an explicit user action (Save Draft / Continue), never by a
  // background timer, so the backend's draft-completeness promotion guard
  // is only ever exercised deliberately.
  const autosaveFormData = useMemo<CampaignDraftFormData>(() => ({
    name: formData.name,
    description: formData.description,
    campaign_type: formData.campaign_type,
    sender_id: formData.sender_id || undefined,
    message_text: formData.message_text,
    template: formData.template,
    target_contact_ids: formData.target_contact_ids,
    target_segment_ids: formData.target_segment_ids,
    target_criteria: formData.target_criteria,
    settings: formData.settings,
    is_recurring: formData.is_recurring,
    recurring_schedule: formData.recurring_schedule,
  }), [formData]);

  const {
    isSaving: isAutosaving,
    lastSavedAt,
    hasUnsavedChanges,
    saveError: autosaveError,
    saveNow,
    dismissError: dismissAutosaveError,
  } = useCampaignDraftAutosave({
    formData: autosaveFormData,
    draftId: currentDraftId,
    enabled: open && !isSubmitting,
    onDraftCreated: handleDraftCreated,
  });

  const requestClose = useCallback(() => {
    if (hasUnsavedChanges && !isSubmitting) {
      const confirmed = window.confirm(
        "You have unsaved changes.\n\nYour latest changes haven't finished saving. Leave anyway?"
      );
      if (!confirmed) return;
    }
    setOpen(false);
  }, [hasUnsavedChanges, isSubmitting, setOpen]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setOpen(true);
    else requestClose();
  };

  const handleSaveDraftClick = () => {
    saveNow().then(() => {
      toast({ title: 'Draft saved', description: 'Find it later under the Draft filter on Campaigns.' });
    });
    requestClose();
  };

  const estimatedCost = calculateCampaignCost(formData.message_text, formData.target_contact_ids.length, 25);

  const weeklyCost = formData.is_recurring
    ? calculateRecurringWeeklyCost(
        formData.message_text,
        formData.target_contact_ids.length,
        formData.recurring_schedule.type as 'single' | 'daily' | 'weekly' | 'monthly',
        formData.recurring_schedule.days?.length || 1,
        25
      )
    : 0;

  const handleInputChange = (field: string, value: unknown): void => {
    let finalValue = value;
    if (field === 'description' || field === 'message_text') {
      finalValue = typeof value === 'string' ? value.slice(0, 160) : value;
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleRecurringScheduleChange = (field: string, value: unknown): void => {
    const newSchedule = { ...formData.recurring_schedule, [field]: value };
    if (formData.is_recurring) {
      const validation = validateRecurringSchedule(newSchedule);
      setScheduleErrors(validation.errors);
    }
    setFormData((prev) => ({ ...prev, recurring_schedule: newSchedule }));
  };

  const handleDayToggle = (day: string) => {
    const newDays = formData.recurring_schedule.days?.includes(day)
      ? formData.recurring_schedule.days.filter((d) => d !== day)
      : [...(formData.recurring_schedule.days || []), day];
    handleRecurringScheduleChange('days', newDays);
  };

  const handleContactToggle = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      target_contact_ids: prev.target_contact_ids.includes(contactId)
        ? prev.target_contact_ids.filter((id) => id !== contactId)
        : [...prev.target_contact_ids, contactId],
    }));
  };

  const handleSelectAllContacts = () => {
    if (contacts.length === 0) return;
    const allContactIds = contacts.map((contact) => contact.id);
    setFormData((prev) => ({
      ...prev,
      target_contact_ids: prev.target_contact_ids.length === allContactIds.length ? [] : allContactIds,
    }));
  };

  const resetForm = () => {
    setFormData(blankFormData());
    setStep(1);
    setScheduleErrors([]);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.message_text.trim()) return;

    if (formData.is_recurring) {
      const validation = validateRecurringSchedule(formData.recurring_schedule);
      if (!validation.isValid) {
        setScheduleErrors(validation.errors);
        return;
      }
    }

    if (smsBalance !== null && estimatedCost > smsBalance) {
      console.warn('Insufficient SMS credits');
    }

    setIsSubmitting(true);

    try {
      const recurringScheduleData: Record<string, unknown> = {
        type: formData.recurring_schedule.type,
        time: formData.recurring_schedule.time,
        ...(formData.recurring_schedule.type === 'weekly' && { days: formData.recurring_schedule.days || [] }),
        ...(formData.recurring_schedule.type === 'monthly' && { day_of_month: formData.recurring_schedule.day_of_month ?? 1 }),
        ...(formData.recurring_schedule.end_date && { end_date: formData.recurring_schedule.end_date }),
      };

      const targetCriteria = {
        tags: formData.target_criteria.tags.length > 0 ? formData.target_criteria.tags : undefined,
        opt_in_status: formData.target_criteria.opt_in_status,
      };
      const commonFields = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sender_id: formData.sender_id || undefined,
        message_text: formData.message_text.trim(),
        template: formData.template || null,
        scheduled_at: formData.scheduled_at || null,
        target_contact_ids: formData.target_contact_ids.length > 0 ? formData.target_contact_ids : undefined,
        target_segment_ids: formData.target_segment_ids.length > 0 ? formData.target_segment_ids : undefined,
        target_criteria: targetCriteria,
        settings: { send_time: formData.settings.send_time, timezone: formData.settings.timezone },
        is_recurring: formData.is_recurring,
        recurring_schedule: recurringScheduleData,
      };

      let success: boolean;
      if (currentDraftId) {
        // Finish the draft this dialog has been autosaving into — update it in
        // place rather than creating a second campaign. Scheduling a future
        // send is handled by the update itself (the backend promotes
        // draft -> scheduled once scheduled_at is set and the draft is
        // complete); an immediate send still needs the dedicated start call.
        success = await updateCampaign(currentDraftId, commonFields);
        if (success && !formData.scheduled_at) {
          success = await startCampaign(currentDraftId);
        }
      } else {
        success = await createCampaign({ ...commonFields, campaign_type: formData.campaign_type });
      }

      if (success) {
        if (currentDraftId) clearLocalCampaignDraft(currentDraftId);
        setOpen(false);
        resetForm();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = formData.name.trim() && formData.message_text.trim() && formData.sender_id;
  const canSubmit = canProceedToStep2 && formData.target_contact_ids.length > 0;

  const saveStatusLabel = (() => {
    if (autosaveError) return null; // shown separately, as a dismissible inline alert
    if (isAutosaving) return 'Saving…';
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastSavedAt) return `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Campaign</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-xl p-0 gap-0 rounded-2xl flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                {draftId ? 'Edit Draft' : 'Create Campaign'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Reach your audience with targeted SMS
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingDraft ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading draft…
          </div>
        ) : (
        <>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
          {draftLoadError === 'offline' && (
            <Alert className="border-warning/40 bg-warning/10 py-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-xs text-foreground/80">
                Couldn't reach the server — showing your last locally saved changes.
              </AlertDescription>
            </Alert>
          )}
          {draftLoadError && draftLoadError !== 'offline' && (
            <Alert className="border-destructive/40 bg-destructive/10 py-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-xs text-destructive">{draftLoadError}</AlertDescription>
            </Alert>
          )}
          {localRestore && (
            <Alert className="border-primary/30 bg-primary/5 py-2">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs text-foreground/80 flex items-center justify-between gap-2 flex-wrap">
                <span>You have unsaved local changes to this draft.</span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="font-semibold text-primary"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, ...localRestore.formData }));
                      setLocalRestore(null);
                    }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-muted-foreground"
                    onClick={() => {
                      if (currentDraftId) clearLocalCampaignDraft(currentDraftId);
                      setLocalRestore(null);
                    }}
                  >
                    Discard
                  </button>
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground">
                    Campaign Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="E.g., Summer Sale Campaign"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">Give your campaign a memorable name</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Campaign Type</Label>
                  <div className="h-9 flex items-center justify-center rounded-md border border-primary/30 bg-primary/5">
                    <span className="text-xs font-semibold text-primary">SMS</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="sender_id" className="text-xs font-medium text-foreground">
                    Sender ID <span className="text-destructive">*</span>
                  </Label>
                  {!loadingBalance && smsBalance !== null && (
                    <span className={`text-[11px] font-medium ${smsBalance < 100 ? 'text-warning' : 'text-muted-foreground'}`}>
                      Balance: TZS {smsBalance.toLocaleString()}{smsBalance < 100 ? ' · Low' : ''}
                    </span>
                  )}
                </div>
                {approvedSenders.length > 0 ? (
                  <Select value={formData.sender_id} onValueChange={(value) => handleInputChange('sender_id', value)}>
                    <SelectTrigger id="sender_id" className="h-9">
                      <SelectValue placeholder="Choose a sender..." />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedSenders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.sender_name}>
                          {sender.sender_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : sendersLoading ? (
                  <div className="h-9 bg-muted rounded-md animate-pulse" />
                ) : (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-destructive">No approved senders</p>
                      <Link to="/dashboard/sms/sender-names" className="text-[11px] font-semibold text-destructive underline">
                        Request Sender Approval →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Text */}
              <div className="space-y-1.5">
                <Label htmlFor="message_text" className="text-xs font-medium text-foreground">
                  Message Text <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message_text"
                  placeholder="Type your message here. Keep it clear and concise..."
                  value={formData.message_text}
                  onChange={(e) => handleInputChange('message_text', e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                  maxLength={160}
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {calculateSMSSegments(formData.message_text)} SMS {formData.message_text.length > 0 ? `(${formData.message_text.length} chars)` : ''}
                  </span>
                  <span className={formData.message_text.length > 140 ? 'text-warning font-semibold' : 'text-muted-foreground'}>
                    {formData.message_text.length}/160
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium text-foreground">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Write a brief description about your campaign..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                  maxLength={160}
                />
              </div>

              {/* Schedule */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleInputChange('is_recurring', !formData.is_recurring);
                    if (!formData.is_recurring) setScheduleErrors([]);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (handleInputChange('is_recurring', !formData.is_recurring), !formData.is_recurring && setScheduleErrors([]))}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                    formData.is_recurring ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${formData.is_recurring ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Recurring Campaign</span>
                      <span className="text-[11px] text-muted-foreground">
                        {formData.is_recurring ? 'Runs automatically on a schedule' : 'Run once or repeat automatically'}
                      </span>
                    </div>
                  </div>
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => {
                      handleInputChange('is_recurring', checked);
                      if (checked) setScheduleErrors([]);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {!formData.is_recurring && (
                  <div className="space-y-1.5 rounded-lg bg-muted/40 p-2.5">
                    <Label htmlFor="scheduled_at" className="text-xs font-medium text-foreground">
                      Run at <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at || ''}
                      onChange={(e) => handleInputChange('scheduled_at', e.target.value || null)}
                      className="h-9"
                    />
                    <p className="text-[11px] text-muted-foreground">Leave empty to send immediately</p>
                  </div>
                )}
              </div>

              {formData.is_recurring && (
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-2.5">
                  <Select
                    value={formData.recurring_schedule.type}
                    onValueChange={(value) => handleRecurringScheduleChange('type', value as 'single' | 'daily' | 'weekly' | 'monthly')}
                  >
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single day — one-time at a specific time</SelectItem>
                      <SelectItem value="daily">Daily — every day at a specific time</SelectItem>
                      <SelectItem value="weekly">Weekly — specific days each week</SelectItem>
                      <SelectItem value="monthly">Monthly — specific day each month</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1.5">
                    <Label htmlFor="recurring_time" className="text-xs font-medium text-foreground">Execution Time</Label>
                    <Input
                      id="recurring_time"
                      type="time"
                      value={formData.recurring_schedule.time}
                      onChange={(e) => handleRecurringScheduleChange('time', e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>

                  {formData.recurring_schedule.type === 'weekly' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <label key={day} className="flex items-center gap-1.5 bg-background rounded-md p-1.5 border border-border text-[11px] font-medium capitalize cursor-pointer">
                          <Checkbox
                            checked={formData.recurring_schedule.days?.includes(day) || false}
                            onCheckedChange={() => handleDayToggle(day)}
                          />
                          {day.slice(0, 3)}
                        </label>
                      ))}
                    </div>
                  )}

                  {formData.recurring_schedule.type === 'monthly' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="day_of_month" className="text-xs font-medium text-foreground">Day of Month</Label>
                      <Input
                        id="day_of_month"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurring_schedule.day_of_month || 1}
                        onChange={(e) => handleRecurringScheduleChange('day_of_month', parseInt(e.target.value))}
                        className="h-9 bg-background"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="end_date" className="text-xs font-medium text-foreground">End Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.recurring_schedule.end_date?.split('T')[0] || ''}
                      onChange={(e) => handleRecurringScheduleChange('end_date', e.target.value ? `${e.target.value}T23:59:59Z` : null)}
                      className="h-9 bg-background"
                    />
                  </div>

                  {!scheduleErrors.length ? (
                    <div className="rounded-md bg-background p-2 text-xs font-medium text-foreground">
                      {formatScheduleDescription(formData.recurring_schedule)}
                    </div>
                  ) : (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 space-y-1">
                      {scheduleErrors.map((error, i) => (
                        <p key={i} className="text-[11px] text-destructive font-medium">• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.message_text && formData.target_contact_ids.length > 0 && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <h4 className="text-xs font-semibold text-foreground">Cost Estimation</h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between bg-background rounded-md px-2.5 py-1.5">
                      <span className="text-muted-foreground">Message Length</span>
                      <span className="font-semibold text-foreground">{formData.message_text.length} chars ({calculateSMSSegments(formData.message_text)} SMS)</span>
                    </div>
                    <div className="flex items-center justify-between bg-background rounded-md px-2.5 py-1.5">
                      <span className="text-muted-foreground">Recipients</span>
                      <span className="font-semibold text-foreground">{formData.target_contact_ids.length} contacts</span>
                    </div>
                    <div className="flex items-center justify-between bg-success/10 rounded-md px-2.5 py-1.5 border border-success/30">
                      <span className="font-semibold text-foreground">Total Cost</span>
                      <span className="text-sm font-bold text-success">TZS {estimatedCost.toLocaleString()}</span>
                    </div>
                    {formData.is_recurring && (
                      <div className="flex items-center justify-between bg-primary/5 rounded-md px-2.5 py-1.5 border border-primary/25">
                        <span className="font-semibold text-foreground">Weekly Cost</span>
                        <span className="text-sm font-bold text-primary">TZS {weeklyCost.toLocaleString()}</span>
                      </div>
                    )}
                    {smsBalance !== null && estimatedCost > smsBalance && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-destructive font-medium">
                          Insufficient credits — you need TZS {(estimatedCost - smsBalance).toLocaleString()} more.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Target Audience */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Select Target Audience</h3>
                  <p className="text-[11px] text-muted-foreground">Choose who will receive this campaign</p>
                </div>
                <Badge className="text-[11px] font-semibold">{formData.target_contact_ids.length} selected</Badge>
              </div>

              {contactsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground mt-2">Loading your contacts...</p>
                </div>
              ) : showContactsEmptyState ? (
                <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg bg-muted/30 space-y-3">
                  <AlertCircle className="w-8 h-8 text-primary mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No Contacts Found</p>
                    <p className="text-xs text-muted-foreground">Create at least one contact before launching a campaign.</p>
                  </div>
                  <Button asChild size="sm" onClick={() => { setStep(1); requestClose(); }}>
                    <Link to="/contacts" className="flex items-center gap-1.5">
                      Add Contacts <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 bg-muted/40 rounded-lg p-2.5 border border-border">
                    <Button variant="outline" size="sm" onClick={handleSelectAllContacts} className="h-8">
                      {formData.target_contact_ids.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <p className="text-[11px] font-medium text-muted-foreground">{contacts.length} total contacts</p>
                  </div>

                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {contacts.map((contact, index) => (
                        <div
                          key={contact.id || `contact-${index}`}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleContactToggle(contact.id)}
                        >
                          <Checkbox
                            checked={formData.target_contact_ids.includes(contact.id)}
                            onCheckedChange={() => handleContactToggle(contact.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-foreground truncate">{contact.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate font-mono">{contact.phone_e164}</p>
                          </div>
                          {formData.target_contact_ids.includes(contact.id) && (
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-lg border border-border p-3">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Target Criteria</h4>
                  <p className="text-[11px] text-muted-foreground">Add tags to further refine your audience</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <Input
                      placeholder="Enter a tag (e.g., VIP, Premium)"
                      value={formData.newTag}
                      onChange={(e) => handleInputChange('newTag', e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                          handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                          handleInputChange('newTag', '');
                        }
                      }}
                      className="pl-8 h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                        handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                        handleInputChange('newTag', '');
                      }
                    }}
                    disabled={!formData.newTag.trim() || formData.target_criteria.tags.includes(formData.newTag.trim())}
                    className="h-9"
                  >
                    Add
                  </Button>
                </div>
                {formData.target_criteria.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.target_criteria.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[11px] font-medium gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleInputChange('target_criteria', { ...formData.target_criteria, tags: formData.target_criteria.tags.filter((t) => t !== tag) })}
                          className="hover:opacity-70"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {autosaveError && (
          <div className="flex-shrink-0 px-4 py-2 border-t border-destructive/20 bg-destructive/5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-destructive">{autosaveError}</span>
            <button type="button" onClick={() => { dismissAutosaveError(); saveNow(); }} className="text-[11px] font-semibold text-destructive underline flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Navigation footer */}
        <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-[11px] text-muted-foreground font-medium">Step {step} of 2</span>
            </div>
            {saveStatusLabel && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {isAutosaving && <Loader2 className="w-3 h-3 animate-spin" />}
                {saveStatusLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-9 px-3">
                ← Previous
              </Button>
            )}
            <Button variant="outline" onClick={handleSaveDraftClick} disabled={!formData.name.trim()} className="h-9 px-3">
              Save Draft
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(2)} disabled={!canProceedToStep2} className="flex-1 sm:flex-none h-9 px-4">
                Next →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="flex-1 sm:flex-none h-9 px-4 gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="truncate">
                      <span className="sm:hidden">Create</span>
                      <span className="hidden sm:inline">Create Campaign</span>
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Plus, MessageSquare, AlertCircle, DollarSign, Info, Trash2, Tag } from 'lucide-react';
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
import {
  calculateCampaignCost,
  calculateRecurringWeeklyCost,
  validateRecurringSchedule,
  formatScheduleDescription,
  estimateCampaignSummary
} from '@/utils/campaignUtils';
import { apiClient, SenderNameRequest, UnifiedSenderName } from '@/lib/api';

interface CreateCampaignDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCampaignDialog({ children, onSuccess, open: externalOpen, onOpenChange }: CreateCampaignDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'sms' as 'sms' | 'whatsapp' | 'email' | 'mixed',
    sender_id: '' as string,
    message_text: '',
    template: null as string | null,
    scheduled_at: null as string | null,
    target_contact_ids: [] as string[],
    target_segment_ids: [] as string[],
    target_criteria: {
      tags: [] as string[],
      opt_in_status: 'opted_in' as string
    },
    newTag: '' as string,
    settings: {
      send_time: '09:00',
      timezone: 'Africa/Dar_es_Salaam'
    },
    is_recurring: false,
    recurring_schedule: {
      type: 'daily' as 'daily' | 'weekly' | 'monthly',
      time: '09:00',
      days: [] as string[],
      day_of_month: 1,
      end_date: null as string | null
    },
  });

  const { createCampaign } = useCampaigns();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const { senderNames, loading: sendersLoading } = useSenderNames();
  const showContactsEmptyState = !contactsLoading && contacts.length === 0;

  // Filter approved sender names - handle both SenderNameRequest and UnifiedSenderName response types
  const approvedSenders = useMemo(() => {
    if (!senderNames || senderNames.length === 0) {
      return [];
    }

    return (senderNames || [])
      .filter((req: SenderNameRequest | UnifiedSenderName) => {
        const status = (req.status || '').toLowerCase();
        const senderName = ('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null);

        // Only include approved status with valid name
        const isApproved = status === "approved";
        const hasValidName = senderName && senderName.trim() !== "";

        return isApproved && hasValidName;
      })
      .map((req: SenderNameRequest | UnifiedSenderName) => {
        const name = (('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null) || '').trim();
        return {
          id: req.id,
          sender_name: name,
          status: (req.status || '').toLowerCase(),
        };
      });
  }, [senderNames]);

  // Fetch SMS balance when dialog opens
  useEffect(() => {
    if (open) {
      fetchSmsBalance();
    }
  }, [open]);

  const fetchSmsBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await apiClient.getSMSBalance();
      if (response.success && response.data) {
        setSmsBalance(response.data.credits || 0);
      } else {
        setSmsBalance(0);
      }
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
      setSmsBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const estimatedCost = calculateCampaignCost(
    formData.message_text,
    formData.target_contact_ids.length,
    25
  );

  const weeklyCost = formData.is_recurring
    ? calculateRecurringWeeklyCost(
        formData.message_text,
        formData.target_contact_ids.length,
        formData.recurring_schedule.type as 'daily' | 'weekly' | 'monthly',
        formData.recurring_schedule.days?.length || 1,
        25
      )
    : 0;

  const handleInputChange = (field: string, value: unknown): void => {
    let finalValue = value;
    if (field === 'description' || field === 'message_text') {
      finalValue = typeof value === 'string' ? value.slice(0, 160) : value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));
  };

  const handleRecurringScheduleChange = (field: string, value: unknown): void => {
    const newSchedule = {
      ...formData.recurring_schedule,
      [field]: value
    };

    // Validate schedule whenever it changes
    if (formData.is_recurring) {
      const validation = validateRecurringSchedule(newSchedule);
      setScheduleErrors(validation.errors);
    }

    setFormData(prev => ({
      ...prev,
      recurring_schedule: newSchedule
    }));
  };

  const handleDayToggle = (day: string) => {
    const newDays = formData.recurring_schedule.days?.includes(day)
      ? formData.recurring_schedule.days.filter(d => d !== day)
      : [...(formData.recurring_schedule.days || []), day];

    handleRecurringScheduleChange('days', newDays);
  };

  const handleContactToggle = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      target_contact_ids: prev.target_contact_ids.includes(contactId)
        ? prev.target_contact_ids.filter(id => id !== contactId)
        : [...prev.target_contact_ids, contactId]
    }));
  };

  const handleSelectAllContacts = () => {
    if (contacts.length === 0) return;

    const allContactIds = contacts.map(contact => contact.id);
    setFormData(prev => ({
      ...prev,
      target_contact_ids: prev.target_contact_ids.length === allContactIds.length ? [] : allContactIds
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.message_text.trim()) {
      return;
    }

    // Validate recurring schedule if enabled
    if (formData.is_recurring) {
      const validation = validateRecurringSchedule(formData.recurring_schedule);
      if (!validation.isValid) {
        setScheduleErrors(validation.errors);
        return;
      }
    }

    // Check if user has enough credits
    if (smsBalance !== null && estimatedCost > smsBalance) {
      console.warn('Insufficient SMS credits');
      // Show warning but allow submission (backend will handle)
    }

    setIsSubmitting(true);

    try {
      // recurring_schedule is required by API - always send non-null
      const recurringScheduleData: Record<string, unknown> = {
        type: formData.recurring_schedule.type,
        time: formData.recurring_schedule.time,
        ...(formData.recurring_schedule.type === 'weekly' && { days: formData.recurring_schedule.days || [] }),
        ...(formData.recurring_schedule.type === 'monthly' && { day_of_month: formData.recurring_schedule.day_of_month ?? 1 }),
        ...(formData.recurring_schedule.end_date && { end_date: formData.recurring_schedule.end_date })
      };

      // Create campaign first and wait for completion
      const success = await createCampaign({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        campaign_type: formData.campaign_type,
        sender_id: formData.sender_id || undefined,
        message_text: formData.message_text.trim(),
        template: formData.template || null,
        scheduled_at: formData.scheduled_at || null,
        target_contact_ids: formData.target_contact_ids.length > 0 ? formData.target_contact_ids : undefined,
        target_segment_ids: formData.target_segment_ids.length > 0 ? formData.target_segment_ids : undefined,
        target_criteria: {
          tags: formData.target_criteria.tags.length > 0 ? formData.target_criteria.tags : undefined,
          opt_in_status: formData.target_criteria.opt_in_status
        },
        settings: {
          send_time: formData.settings.send_time,
          timezone: formData.settings.timezone
        },
        is_recurring: formData.is_recurring,
        recurring_schedule: recurringScheduleData,
      });

      if (success) {
        // Close dialog and reset form after successful creation
        setOpen(false);
        setStep(1);
        setScheduleErrors([]);
        setFormData({
          name: '',
          description: '',
          campaign_type: 'sms',
          sender_id: '',
          message_text: '',
          template: null,
          scheduled_at: null,
          target_contact_ids: [],
          target_segment_ids: [],
          target_criteria: {
            tags: [],
            opt_in_status: 'opted_in'
          },
          settings: {
            send_time: '09:00',
            timezone: 'Africa/Dar_es_Salaam'
          },
          is_recurring: false,
          recurring_schedule: {
            type: 'daily',
            time: '09:00',
            days: [],
            day_of_month: 1,
            end_date: null
          },
          newTag: '',
        });

        // Call success callback to refresh parent component after campaign is created
        onSuccess?.();

        // Refresh the entire page to show new data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = formData.name.trim() && formData.message_text.trim() && formData.sender_id;
  const canSubmit = canProceedToStep2 && formData.target_contact_ids.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              <DialogTitle className="text-sm sm:text-base">Create New Campaign</DialogTitle>
            </div>
            <DialogDescription className="text-[10px] sm:text-xs">
              Create a smart campaign to reach your audience effectively.
            </DialogDescription>
          </div>

          {/* SMS Balance Display */}
          {loadingBalance ? (
            <div className="mt-3 animate-pulse h-8 bg-muted rounded" />
          ) : smsBalance !== null && (
            <Alert className={`mt-3 ${smsBalance < 100 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <DollarSign className="h-4 w-4" />
              <AlertDescription className={`text-xs ${smsBalance < 100 ? 'text-orange-800' : 'text-green-800'}`}>
                SMS Balance: <span className="font-semibold">TZS {smsBalance.toLocaleString()}</span>
                {smsBalance < 100 && <span className="ml-2 font-semibold">⚠️ Low balance - purchase more credits</span>}
              </AlertDescription>
            </Alert>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="grid w-full grid-cols-[1fr_auto] gap-3">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="name" className="text-[10px] sm:text-xs">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-7 text-[10px] sm:text-xs"
                  />
                </div>

                <div className="space-y-1 min-w-[140px]">
                  <Label className="text-xs sm:text-sm">Campaign Type</Label>
                  <div className="relative flex items-center justify-center rounded-[100px] border border-border-subtle bg-background/60 px-4 py-2 shadow-sm shadow-primary/10">
                    <span className="pointer-events-none text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                      SMS
                    </span>
                    <span className="absolute inset-0 rounded-[100px] border border-transparent bg-gradient-to-r from-primary/5 via-white/30 to-primary/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sender_id" className="text-[10px] sm:text-xs">Sender ID (Approved) *</Label>
                {approvedSenders.length > 0 ? (
                  <Select value={formData.sender_id} onValueChange={(value) => handleInputChange('sender_id', value)}>
                    <SelectTrigger id="sender_id" className="h-7 text-[10px] sm:text-xs">
                      <SelectValue placeholder="Select approved sender name" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedSenders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.sender_name}>
                          <span>{sender.sender_name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : sendersLoading ? (
                  <div className="h-8 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md border border-destructive/30 bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-xs text-foreground">
                      No approved senders. <Link to="/dashboard/sms/sender-names" className="underline font-semibold text-primary">Request sender approval</Link>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-[10px] sm:text-xs">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter campaign description (optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="text-[10px] sm:text-xs"
                  maxLength={160}
                />
                <p className="text-[9px] text-muted-foreground">
                  {formData.description.length}/160 characters
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="message_text" className="text-[10px] sm:text-xs">Message Text *</Label>
                <Textarea
                  id="message_text"
                  placeholder="Enter your message content"
                  value={formData.message_text}
                  onChange={(e) => handleInputChange('message_text', e.target.value)}
                  rows={2}
                  className="text-[10px] sm:text-xs"
                  maxLength={160}
                />
                <p className="text-[9px] text-muted-foreground">
                  {formData.message_text.length}/160 characters
                </p>
              </div>

              {/* Schedule - Required (API requires recurring_schedule) */}
              <div className="space-y-2">
                <Label className="text-[10px] sm:text-xs font-medium">Schedule *</Label>
                <p className="text-[9px] text-muted-foreground">When and how often the campaign runs</p>

                {/* Recurring toggle - prominent card style */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleInputChange('is_recurring', !formData.is_recurring);
                    if (!formData.is_recurring) setScheduleErrors([]);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (handleInputChange('is_recurring', !formData.is_recurring), !formData.is_recurring && setScheduleErrors([]))}
                  className={`
                    flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors cursor-pointer
                    ${formData.is_recurring
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-border-hover'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                      ${formData.is_recurring ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-xs font-semibold text-foreground block">
                        Recurring Campaign
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {formData.is_recurring ? 'Runs on a schedule (daily/weekly/monthly)' : 'Run once or repeat automatically'}
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
                    className="h-4 w-4 shrink-0"
                  />
                </div>

                {/* One-time schedule (when not recurring) */}
                {!formData.is_recurring && (
                  <div className="space-y-1">
                    <Label htmlFor="scheduled_at" className="text-[10px] sm:text-xs">Run at (Optional)</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at || ''}
                      onChange={(e) => handleInputChange('scheduled_at', e.target.value || null)}
                      className="h-8 text-[10px] sm:text-xs bg-background border-border"
                    />
                    <p className="text-[9px] text-muted-foreground">Leave empty to run immediately</p>
                  </div>
                )}
              </div>

              {/* Recurring Schedule Configuration - always visible when recurring */}
              {formData.is_recurring && (
                <div className="rounded-lg border border-border bg-card p-3 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-foreground">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    Configure Recurring Schedule
                  </div>

                  {/* Schedule Type */}
                  <div className="space-y-1">
                    <Label className="text-[10px] sm:text-xs">Schedule Type *</Label>
                    <Select
                      value={formData.recurring_schedule.type}
                      onValueChange={(value) => handleRecurringScheduleChange('type', value as 'daily' | 'weekly' | 'monthly')}
                    >
                      <SelectTrigger className="h-7 text-[10px] sm:text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily - Every day at a specific time</SelectItem>
                        <SelectItem value="weekly">Weekly - Specific days each week</SelectItem>
                        <SelectItem value="monthly">Monthly - Specific day each month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Execution Time */}
                  <div className="space-y-1">
                    <Label htmlFor="recurring_time" className="text-[10px] sm:text-xs">Execution Time *</Label>
                    <Input
                      id="recurring_time"
                      type="time"
                      value={formData.recurring_schedule.time}
                      onChange={(e) => handleRecurringScheduleChange('time', e.target.value)}
                      className="h-7 text-[10px] sm:text-xs"
                    />
                  </div>

                  {/* Days Selection for Weekly */}
                  {formData.recurring_schedule.type === 'weekly' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] sm:text-xs">Select Days *</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day} className="flex items-center space-x-1">
                            <Checkbox
                              id={`day-${day}`}
                              checked={formData.recurring_schedule.days?.includes(day) || false}
                              onCheckedChange={() => handleDayToggle(day)}
                              className="h-3 w-3"
                            />
                            <Label htmlFor={`day-${day}`} className="text-[9px] font-normal cursor-pointer capitalize">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day of Month for Monthly */}
                  {formData.recurring_schedule.type === 'monthly' && (
                    <div className="space-y-1">
                      <Label htmlFor="day_of_month" className="text-[10px] sm:text-xs">Day of Month</Label>
                      <Input
                        id="day_of_month"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurring_schedule.day_of_month || 1}
                        onChange={(e) => handleRecurringScheduleChange('day_of_month', parseInt(e.target.value))}
                        className="h-7 text-[10px] sm:text-xs"
                      />
                      <p className="text-[9px] text-muted-foreground">Runs on this day each month (1-31)</p>
                    </div>
                  )}

                  {/* End Date */}
                  <div className="space-y-1">
                    <Label htmlFor="end_date" className="text-[10px] sm:text-xs">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.recurring_schedule.end_date?.split('T')[0] || ''}
                      onChange={(e) => handleRecurringScheduleChange('end_date', e.target.value ? `${e.target.value}T23:59:59Z` : null)}
                      className="h-7 text-[10px] sm:text-xs"
                    />
                    <p className="text-[9px] text-muted-foreground">Leave empty to continue indefinitely</p>
                  </div>

                  {/* Schedule Preview */}
                  {!scheduleErrors.length && (
                    <div className="rounded-md border border-border bg-muted/40 p-2.5">
                      <p className="text-[9px] sm:text-[10px] font-medium text-foreground">
                        📅 {formatScheduleDescription(formData.recurring_schedule)}
                      </p>
                    </div>
                  )}

                  {/* Errors */}
                  {scheduleErrors.length > 0 && (
                    <Alert variant="destructive" className="border-destructive/50">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-[9px]">
                        {scheduleErrors.map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Cost Estimation */}
              {formData.message_text && formData.target_contact_ids.length > 0 && (
                <Alert className="border-border bg-muted/40">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <AlertDescription className="text-[9px] text-foreground">
                    <div className="font-semibold mb-1">Estimated Cost</div>
                    <div className="space-y-1 text-[9px] text-muted-foreground">
                      <div>Message: {formData.message_text.length} chars ({Math.ceil(formData.message_text.length / 160)} seg)</div>
                      <div>Recipients: {formData.target_contact_ids.length}</div>
                      <div className="font-semibold text-foreground mt-1">
                        💳 Cost: TZS {estimatedCost.toLocaleString()}
                      </div>
                      {formData.is_recurring && (
                        <div className="font-semibold text-foreground">
                          📊 Weekly: TZS {weeklyCost.toLocaleString()}
                        </div>
                      )}
                      {smsBalance !== null && estimatedCost > smsBalance && (
                        <div className="text-destructive font-semibold mt-1">⚠️ Insufficient! Need TZS {(estimatedCost - smsBalance).toLocaleString()} more</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Target Audience */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold">Select Target Audience</h3>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                  {formData.target_contact_ids.length} contacts selected
                </Badge>
              </div>

              {contactsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  <p className="text-[9px] text-muted-foreground mt-1">Loading contacts...</p>
                </div>
              ) : showContactsEmptyState ? (
                <div className="text-center py-6 px-4 border border-dashed border-border-subtle rounded-lg bg-muted/30 space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto text-primary" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">No contacts available</p>
                    <p className="text-[9px] text-muted-foreground">
                      Add at least one contact before creating a campaign.
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="h-6 text-[9px]"
                    onClick={() => {
                      setStep(1);
                      setOpen(false);
                    }}
                  >
                    <Link to="/contacts">Go to Contacts</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllContacts}
                      className="h-6 text-[9px]"
                    >
                      {formData.target_contact_ids.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <p className="text-[9px] text-muted-foreground">
                      {contacts.length} total contacts
                    </p>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {contacts.map((contact, index) => (
                      <div
                        key={contact.id || `contact-${index}`}
                        className="flex items-center space-x-2 p-0.5 hover:bg-muted rounded-lg"
                      >
                        <Checkbox
                          id={`contact-${contact.id}`}
                          checked={formData.target_contact_ids.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                          className="h-3 w-3"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`contact-${contact.id}`}
                            className="font-medium cursor-pointer text-[9px] sm:text-xs"
                          >
                            {contact.name}
                          </Label>
                          <p className="text-[8px] text-muted-foreground truncate">
                            {contact.phone_e164}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Criteria Section */}
              <div className="space-y-1">
                <h4 className="text-[10px] sm:text-xs font-medium text-foreground">Target Criteria</h4>
                <div className="space-y-2">
                  {/* Tags Input */}
                  <div className="space-y-2">
                    <Label className="text-[9px]">Enter Tags (Optional)</Label>
                    <div className="space-y-2">
                      {/* Tag Input Field */}
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-subtle w-3 h-3" />
                          <Input
                            placeholder="Type tag name"
                            value={formData.newTag}
                            onChange={(e) => handleInputChange('newTag', e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                                handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                                handleInputChange('newTag', '');
                              }
                            }}
                            className="pl-8 h-7 text-[10px] sm:text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                              handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                              handleInputChange('newTag', '');
                            }
                          }}
                          disabled={!formData.newTag.trim() || formData.target_criteria.tags.includes(formData.newTag.trim())}
                          className="h-7 text-[10px] px-3"
                        >
                          Add
                        </Button>
                      </div>

                      {/* Display Selected Tags */}
                      {formData.target_criteria.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formData.target_criteria.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[9px] py-0.5 flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleInputChange('target_criteria', { ...formData.target_criteria, tags: formData.target_criteria.tags.filter(t => t !== tag) })}
                                className="ml-0.5 hover:text-red-600 font-bold"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            <div className="flex items-center space-x-1">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-6 text-[9px] sm:text-xs"
                >
                  Previous
                </Button>
              )}

              {step < 2 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="h-6 text-[9px] sm:text-xs"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="h-6 text-[9px] sm:text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

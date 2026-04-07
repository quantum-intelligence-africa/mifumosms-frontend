import { useState, useEffect, useMemo } from 'react';
import { Plus, MessageSquare, AlertCircle, DollarSign, Info, Trash2, Tag, ArrowRight, CheckCircle } from 'lucide-react';
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
      // default to daily, user can choose single/weekly/monthly
      type: 'daily' as 'single' | 'daily' | 'weekly' | 'monthly',
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
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Campaign</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-4xl h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-xl sm:rounded-2xl">
        <DialogHeader className="pb-4 sm:pb-6 border-b border-gradient-to-r from-blue-100 to-indigo-100">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Create Campaign
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Reach your audience with smart, targeted messaging
                </DialogDescription>
              </div>
            </div>

            {/* SMS Balance Display - Modern Card */}
            {loadingBalance ? (
              <div className="mt-2 animate-pulse h-16 sm:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg" />
            ) : smsBalance !== null && (
              <div className={`mt-2 rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 ${
                smsBalance < 100
                  ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg shadow-amber-100/50'
                  : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${smsBalance < 100 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${smsBalance < 100 ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs sm:text-sm font-semibold ${smsBalance < 100 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      SMS Balance
                    </p>
                    <p className={`text-sm sm:text-base font-bold ${smsBalance < 100 ? 'text-amber-900' : 'text-emerald-900'}`}>
                      TZS {smsBalance.toLocaleString()}
                    </p>
                  </div>
                  {smsBalance >= 100 ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 animate-pulse" />
                  )}
                </div>
                {smsBalance < 100 && (
                  <p className="text-xs sm:text-sm text-amber-700 mt-2 font-medium">
                    ⚠️ Low balance. Consider purchasing more credits.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5">
              {/* Campaign Name and Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-gray-800">
                    Campaign Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="E.g., Summer Sale Campaign"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500">Give your campaign a memorable name</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-semibold text-gray-800">Campaign Type</Label>
                  <div className="h-10 sm:h-12 flex items-center justify-center rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
                    <span className="text-sm sm:text-base font-bold text-blue-600">📱 SMS</span>
                  </div>
                </div>
              </div>

              {/* Sender ID Section - Modern Select */}
              <div className="space-y-2">
                <Label htmlFor="sender_id" className="text-sm sm:text-base font-semibold text-gray-800">
                  Sender ID <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500">Select your approved sender name</p>
                {approvedSenders.length > 0 ? (
                  <Select value={formData.sender_id} onValueChange={(value) => handleInputChange('sender_id', value)}>
                    <SelectTrigger id="sender_id" className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 transition-all duration-200">
                      <SelectValue placeholder="Choose a sender..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {approvedSenders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.sender_name} className="text-sm sm:text-base">
                          <span className="font-medium">{sender.sender_name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : sendersLoading ? (
                  <div className="h-10 sm:h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse" />
                ) : (
                  <div className="rounded-lg border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-3 sm:p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-red-700">No Approved Senders</p>
                      <p className="text-xs text-red-600 mt-1">
                        You need to request and get approval for a sender name first.
                      </p>
                      <Link to="/dashboard/sms/sender-names" className="text-xs font-bold text-red-700 hover:text-red-800 underline mt-2 inline-block">
                        Request Sender Approval →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base font-semibold text-gray-800">
                  Description <span className="text-gray-400">(Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Write a brief description about your campaign..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  maxLength={160}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Brief description of your campaign</p>
                  <span className={`text-xs font-medium ${formData.description.length > 140 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formData.description.length}/160
                  </span>
                </div>
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <Label htmlFor="message_text" className="text-sm sm:text-base font-semibold text-gray-800">
                  Message Text <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500">Craft your message carefully (max 160 characters)</p>
                <Textarea
                  id="message_text"
                  placeholder="Type your message here. Keep it clear and concise..."
                  value={formData.message_text}
                  onChange={(e) => handleInputChange('message_text', e.target.value)}
                  rows={3}
                  className="text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  maxLength={160}
                />
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-xs sm:text-sm text-blue-800 font-medium">
                      {Math.ceil(formData.message_text.length / 160)} SMS { formData.message_text.length > 0 ? `(${formData.message_text.length} chars)` : ''}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${formData.message_text.length > 140 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formData.message_text.length}/160
                  </span>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-sm sm:text-base font-semibold text-gray-800">
                    Schedule <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">When and how often your campaign runs</p>
                </div>

                {/* Recurring Toggle - Modern Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleInputChange('is_recurring', !formData.is_recurring);
                    if (!formData.is_recurring) setScheduleErrors([]);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (handleInputChange('is_recurring', !formData.is_recurring), !formData.is_recurring && setScheduleErrors([]))}
                  className={`
                    flex items-center justify-between gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md
                    ${formData.is_recurring
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50'
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg font-bold text-lg
                      ${formData.is_recurring
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600'}
                    `}>
                      🔄
                    </div>
                    <div>
                      <span className="text-sm sm:text-base font-semibold text-gray-900 block">
                        Recurring Campaign
                      </span>
                      <span className="text-xs text-gray-600">
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
                    className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 rounded border-2 border-gray-300 cursor-pointer"
                  />
                </div>

                {/* One-time schedule (when not recurring) */}
                {!formData.is_recurring && (
                  <div className="space-y-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 border border-gray-200">
                    <Label htmlFor="scheduled_at" className="text-sm sm:text-base font-semibold text-gray-800">
                      Run at <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at || ''}
                      onChange={(e) => handleInputChange('scheduled_at', e.target.value || null)}
                      className="h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-all"
                    />
                    <p className="text-xs text-gray-600">Leave empty to send immediately</p>
                  </div>
                )}
              </div>
                      id="scheduled_at"              {/* Recurring Schedule Configuration */}
              {formData.is_recurring && (
                <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 space-y-4 shadow-lg shadow-blue-100/30">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Info className="w-5 h-5 text-blue-600" />
                    Configure Recurring Schedule
                  </div>

                  {/* Schedule Type */}
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base font-semibold text-gray-800">Schedule Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.recurring_schedule.type}
                      onValueChange={(value) =>
                        handleRecurringScheduleChange('type', value as 'single' | 'daily' | 'weekly' | 'monthly')
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="single" className="text-sm">📅 Single day - One-time at a specific time</SelectItem>
                        <SelectItem value="daily" className="text-sm">📆 Daily - Every day at a specific time</SelectItem>
                        <SelectItem value="weekly" className="text-sm">📊 Weekly - Specific days each week</SelectItem>
                        <SelectItem value="monthly" className="text-sm">📅 Monthly - Specific day each month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Execution Time */}
                  <div className="space-y-2">
                    <Label htmlFor="recurring_time" className="text-sm sm:text-base font-semibold text-gray-800">
                      Execution Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recurring_time"
                      type="time"
                      value={formData.recurring_schedule.time}
                      onChange={(e) => handleRecurringScheduleChange('time', e.target.value)}
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 bg-white"
                    />
                  </div>

                  {/* Days Selection for Weekly */}
                  {formData.recurring_schedule.type === 'weekly' && (
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-semibold text-gray-800">Select Days <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day} className="flex items-center space-x-2 bg-white rounded-lg p-2 border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                            <Checkbox
                              id={`day-${day}`}
                              checked={formData.recurring_schedule.days?.includes(day) || false}
                              onCheckedChange={() => handleDayToggle(day)}
                              className="h-4 w-4 rounded border-2"
                            />
                            <Label htmlFor={`day-${day}`} className="text-xs sm:text-sm font-semibold cursor-pointer capitalize text-gray-700">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day of Month for Monthly */}
                  {formData.recurring_schedule.type === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="day_of_month" className="text-sm sm:text-base font-semibold text-gray-800">
                        Day of Month
                      </Label>
                      <Input
                        id="day_of_month"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurring_schedule.day_of_month || 1}
                        onChange={(e) => handleRecurringScheduleChange('day_of_month', parseInt(e.target.value))}
                        className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 bg-white"
                      />
                      <p className="text-xs sm:text-sm text-gray-700">Runs on this day each month (1-31)</p>
                    </div>
                  )}

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm sm:text-base font-semibold text-gray-800">
                      End Date <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.recurring_schedule.end_date?.split('T')[0] || ''}
                      onChange={(e) => handleRecurringScheduleChange('end_date', e.target.value ? `${e.target.value}T23:59:59Z` : null)}
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 bg-white"
                    />
                    <p className="text-xs sm:text-sm text-gray-700">Leave empty to continue indefinitely</p>
                  </div>

                  {/* Schedule Preview */}
                  {!scheduleErrors.length && (
                    <div className="rounded-lg border-2 border-emerald-300 bg-white p-3 sm:p-4 shadow-sm">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        📅 {formatScheduleDescription(formData.recurring_schedule)}
                      </p>
                    </div>
                  )}

                  {/* Errors */}
                  {scheduleErrors.length > 0 && (
                    <div className="rounded-lg border-2 border-red-400 bg-gradient-to-r from-red-50 to-pink-50 p-3 sm:p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          {scheduleErrors.map((error, i) => (
                            <p key={i} className="text-xs sm:text-sm text-red-700 font-medium">
                              • {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cost Estimation - Modern Card */}
              {formData.message_text && formData.target_contact_ids.length > 0 && (
                <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 shadow-lg shadow-emerald-100/30">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">Cost Estimation</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between bg-white rounded-lg p-2.5 sm:p-3">
                      <span className="text-gray-700">Message Length</span>
                      <span className="font-bold text-gray-900">{formData.message_text.length} chars ({Math.ceil(formData.message_text.length / 160)} SMS)</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-2.5 sm:p-3">
                      <span className="text-gray-700">Recipients</span>
                      <span className="font-bold text-gray-900">{formData.target_contact_ids.length} contacts</span>
                    </div>
                    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-2.5 sm:p-3 border-2 border-emerald-300">
                      <span className="text-gray-900 font-bold">Total Cost</span>
                      <span className="text-lg sm:text-xl font-bold text-emerald-700">TZS {estimatedCost.toLocaleString()}</span>
                    </div>
                    {formData.is_recurring && (
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2.5 sm:p-3 border-2 border-blue-300">
                        <span className="text-gray-900 font-bold">Weekly Cost</span>
                        <span className="text-lg sm:text-xl font-bold text-blue-700">TZS {weeklyCost.toLocaleString()}</span>
                      </div>
                    )}
                    {smsBalance !== null && estimatedCost > smsBalance && (
                      <div className="rounded-lg border-2 border-red-400 bg-gradient-to-r from-red-50 to-pink-50 p-2.5 sm:p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-red-700 font-semibold">
                          ⚠️ Insufficient credits! You need TZS {(estimatedCost - smsBalance).toLocaleString()} more.
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
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Select Target Audience</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Choose who will receive this campaign</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-bold rounded-full shadow-lg">
                  {formData.target_contact_ids.length} selected
                </Badge>
              </div>

              {contactsLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-3">Loading your contacts...</p>
                </div>
              ) : showContactsEmptyState ? (
                <div className="text-center py-8 sm:py-12 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 space-y-4">
                  <div className="inline-block p-3 sm:p-4 rounded-xl bg-blue-100">
                    <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base sm:text-lg font-bold text-gray-900">No Contacts Found</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      You haven't added any contacts yet. Create at least one contact before launching a campaign.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-10 sm:h-12 px-6 shadow-lg"
                    onClick={() => {
                      setStep(1);
                      setOpen(false);
                    }}
                  >
                    <Link to="/contacts" className="flex items-center gap-2">
                      Add Contacts <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Select/Deselect All */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border-2 border-blue-200">
                    <Button
                      variant="outline"
                      onClick={handleSelectAllContacts}
                      className="flex-1 sm:flex-none h-10 text-sm font-semibold border-2 border-blue-300 hover:bg-blue-100 rounded-lg transition-all"
                    >
                      {formData.target_contact_ids.length === contacts.length ? '✓ Deselect All' : '◯ Select All'}
                    </Button>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      {contacts.length} total contacts
                    </p>
                  </div>

                  {/* Contacts List */}
                  <div className="rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                      <div className="divide-y divide-gray-200">
                        {contacts.map((contact, index) => (
                          <div
                            key={contact.id || `contact-${index}`}
                            className="flex items-center gap-3 p-3 sm:p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
                            onClick={() => handleContactToggle(contact.id)}
                          >
                            <Checkbox
                              id={`contact-${contact.id}`}
                              checked={formData.target_contact_ids.includes(contact.id)}
                              onCheckedChange={() => handleContactToggle(contact.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-5 sm:h-6 sm:w-6 rounded border-2 border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                {contact.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate font-mono">
                                {contact.phone_e164}
                              </p>
                            </div>
                            {formData.target_contact_ids.includes(contact.id) && (
                              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Criteria Section */}
              <div className="space-y-3 rounded-xl border-2 border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Target Criteria</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Add tags to further refine your audience</p>
                </div>

                {/* Tags Input */}
                <div className="space-y-3">
                  {/* Tag Input Field */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Enter a tag (e.g., VIP, Premium, Newsletter)"
                        value={formData.newTag}
                        onChange={(e) => handleInputChange('newTag', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                            handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                            handleInputChange('newTag', '');
                          }
                        }}
                        className="pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-lg border-2 border-gray-200 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (formData.newTag.trim() && !formData.target_criteria.tags.includes(formData.newTag.trim())) {
                          handleInputChange('target_criteria', { ...formData.target_criteria, tags: [...formData.target_criteria.tags, formData.newTag.trim()] });
                          handleInputChange('newTag', '');
                        }
                      }}
                      disabled={!formData.newTag.trim() || formData.target_criteria.tags.includes(formData.newTag.trim())}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold h-10 sm:h-12 px-4 sm:px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      Add Tag
                    </Button>
                  </div>

                  {/* Display Selected Tags */}
                  {formData.target_criteria.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.target_criteria.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 text-xs sm:text-sm font-bold rounded-full flex items-center gap-2 shadow-md"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleInputChange('target_criteria', { ...formData.target_criteria, tags: formData.target_criteria.tags.filter(t => t !== tag) })}
                            className="ml-1 hover:opacity-80 font-bold"
                          >
                            ✕
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Modern Footer */}
          <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-200">
            {/* Step Indicators */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${step >= 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/50' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/50' : 'bg-gray-300'}`} />
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Step {step} of 2</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold border-2 border-gray-300 hover:bg-gray-100 rounded-lg transition-all"
                >
                  ← Previous
                </Button>
              )}

              {step < 2 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="h-10 sm:h-12 px-4 sm:px-8 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-3 border-transparent border-t-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Create Campaign</span>
                    </>
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

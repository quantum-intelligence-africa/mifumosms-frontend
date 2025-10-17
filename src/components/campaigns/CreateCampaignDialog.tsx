import { useState, useEffect } from 'react';
import { Plus, X, Users, MessageSquare, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useContacts } from '@/hooks/useContacts';

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

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'sms' as 'sms' | 'whatsapp' | 'email' | 'mixed',
    message_text: '',
    template: null as string | null,
    scheduled_at: null as string | null,
    target_contact_ids: [] as string[],
    target_segment_ids: [] as string[],
    target_criteria: {
      tags: [] as string[],
      opt_in_status: 'opted_in' as string
    },
    settings: {
      send_time: '09:00',
      timezone: 'Africa/Dar_es_Salaam'
    },
    is_recurring: false,
    recurring_schedule: {},
  });

  const { createCampaign } = useCampaigns();
  const { contacts, isLoading: contactsLoading } = useContacts();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    setIsSubmitting(true);

    // Close dialog and reset form immediately
    setOpen(false);
    setStep(1);
    setFormData({
      name: '',
      description: '',
      campaign_type: 'sms',
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
      recurring_schedule: {},
    });

    // Call success callback to refresh parent component immediately
    onSuccess?.();

    // Create campaign in background (errors ignored)
    createCampaign({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      campaign_type: formData.campaign_type,
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
      recurring_schedule: formData.recurring_schedule,
    }).catch(error => {
      console.log('Create campaign error (ignored):', error);
    });

    setIsSubmitting(false);
  };

  const canProceedToStep2 = formData.name.trim() && formData.message_text.trim();
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
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create a smart campaign to reach your audience effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs sm:text-sm">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-8 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="campaign_type" className="text-xs sm:text-sm">Campaign Type *</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) => handleInputChange('campaign_type', value)}
                  >
                    <SelectTrigger className="h-8 text-xs sm:text-sm">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter campaign description (optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="message_text" className="text-xs sm:text-sm">Message Text *</Label>
                <Textarea
                  id="message_text"
                  placeholder="Enter your message content"
                  value={formData.message_text}
                  onChange={(e) => handleInputChange('message_text', e.target.value)}
                  rows={2}
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message_text.length} characters
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="scheduled_at" className="text-xs sm:text-sm">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at || ''}
                    onChange={(e) => handleInputChange('scheduled_at', e.target.value || null)}
                    className="h-8 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="is_recurring" className="text-xs sm:text-sm">Recurring Campaign</Label>
                </div>
              </div>

              {/* Settings Section */}
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-medium text-foreground">Campaign Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="send_time" className="text-xs">Send Time</Label>
                    <Input
                      id="send_time"
                      type="time"
                      value={formData.settings.send_time}
                      onChange={(e) => handleInputChange('settings', { ...formData.settings, send_time: e.target.value })}
                      className="h-7 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                    <Select
                      value={formData.settings.timezone}
                      onValueChange={(value) => handleInputChange('settings', { ...formData.settings, timezone: value })}
                    >
                      <SelectTrigger className="h-7 text-xs sm:text-sm">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                        <SelectItem value="Africa/Kampala">Africa/Kampala</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Audience */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold">Select Target Audience</h3>
                <Badge variant="outline" className="text-xs">
                  {formData.target_contact_ids.length} contacts selected
                </Badge>
              </div>

              {contactsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs text-muted-foreground mt-1">Loading contacts...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllContacts}
                      className="h-7 text-xs"
                    >
                      {formData.target_contact_ids.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {contacts.length} total contacts
                    </p>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-2 p-1 hover:bg-muted rounded-lg"
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
                            className="font-medium cursor-pointer text-xs sm:text-sm"
                          >
                            {contact.name}
                          </Label>
                          <p className="text-xs text-muted-foreground truncate">
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
                <h4 className="text-xs sm:text-sm font-medium text-foreground">Target Criteria</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tags Filter</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {['vip', 'premium', 'basic', 'new', 'returning', 'active', 'inactive'].map((tag) => (
                        <div key={tag} className="flex items-center space-x-1">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={formData.target_criteria.tags.includes(tag)}
                            onCheckedChange={(checked) => {
                              const newTags = checked
                                ? [...formData.target_criteria.tags, tag]
                                : formData.target_criteria.tags.filter(t => t !== tag);
                              handleInputChange('target_criteria', { ...formData.target_criteria, tags: newTags });
                            }}
                            className="h-3 w-3"
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-xs font-normal cursor-pointer">
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="opt_in_status" className="text-xs">Opt-in Status</Label>
                    <Select
                      value={formData.target_criteria.opt_in_status}
                      onValueChange={(value) => handleInputChange('target_criteria', { ...formData.target_criteria, opt_in_status: value })}
                    >
                      <SelectTrigger className="h-7 text-xs sm:text-sm">
                        <SelectValue placeholder="Select opt-in status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opted_in">Opted In</SelectItem>
                        <SelectItem value="opted_out">Opted Out</SelectItem>
                        <SelectItem value="all">All Contacts</SelectItem>
                      </SelectContent>
                    </Select>
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
                  className="h-7 text-xs sm:text-sm"
                >
                  Previous
                </Button>
              )}

              {step < 2 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="h-7 text-xs sm:text-sm"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="h-7 text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Creating Campaign...
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

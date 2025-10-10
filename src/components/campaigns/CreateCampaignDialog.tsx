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
    template: '',
    scheduled_at: '',
    target_contact_ids: [] as string[],
    target_segment_ids: [] as string[],
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

    try {
      const success = await createCampaign({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        campaign_type: formData.campaign_type,
        message_text: formData.message_text.trim(),
        template: formData.template || undefined,
        scheduled_at: formData.scheduled_at || undefined,
        target_contact_ids: formData.target_contact_ids.length > 0 ? formData.target_contact_ids : undefined,
        target_segment_ids: formData.target_segment_ids.length > 0 ? formData.target_segment_ids : undefined,
        is_recurring: formData.is_recurring,
        recurring_schedule: formData.recurring_schedule,
      });

      if (success) {
        setOpen(false);
        setStep(1);
        setFormData({
          name: '',
          description: '',
          campaign_type: 'sms',
          message_text: '',
          template: '',
          scheduled_at: '',
          target_contact_ids: [],
          target_segment_ids: [],
          is_recurring: false,
          recurring_schedule: {},
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = formData.name.trim() && formData.message_text.trim();
  const canSubmit = canProceedToStep2 && formData.target_contact_ids.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Create a smart campaign to reach your audience effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type *</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) => handleInputChange('campaign_type', value)}
                  >
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter campaign description (optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_text">Message Text *</Label>
                <Textarea
                  id="message_text"
                  placeholder="Enter your message content"
                  value={formData.message_text}
                  onChange={(e) => handleInputChange('message_text', e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.message_text.length} characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                  <Label htmlFor="is_recurring">Recurring Campaign</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Audience */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Target Audience</h3>
                <Badge variant="outline">
                  {formData.target_contact_ids.length} contacts selected
                </Badge>
              </div>

              {contactsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllContacts}
                    >
                      {formData.target_contact_ids.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {contacts.length} total contacts
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg"
                      >
                        <Checkbox
                          id={`contact-${contact.id}`}
                          checked={formData.target_contact_ids.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`contact-${contact.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {contact.name}
                          </Label>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.phone_e164}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            <div className="flex items-center space-x-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Previous
                </Button>
              )}

              {step < 2 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

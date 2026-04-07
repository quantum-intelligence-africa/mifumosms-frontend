import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, User, Phone, Mail, Tag } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';
import { normalizePhoneNumber } from '@/utils/phoneUtils';

interface ContactAddDialogProps {
  children: React.ReactNode;
  onContactAdded?: () => void;
}

// Predefined common tags
const PRESET_TAGS = [
  'vip',
  'marketing',
  'sales',
  'support',
  'premium',
  'basic',
  'new',
  'returning',
  'inactive',
  'active',
  'lead',
  'customer'
];

export function ContactAddDialog({ children, onContactAdded }: ContactAddDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: [] as string[],
    newTag: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createContact } = useContacts();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    // For name field, allow any case - no restrictions
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleTogglePresetTag = (tag: string) => {
    setFormData(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneInfo = normalizePhoneNumber(formData.phone);
      if (!phoneInfo.isValid) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    } else if (formData.newTag.trim()) {
      newErrors.tags = 'Press + to add the tag or clear the input.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a tag typed but not added, treat it as part of the submission
    const pendingTag = formData.newTag.trim();
    const shouldAddPendingTag = pendingTag && !formData.tags.includes(pendingTag);
    const tagsToSend = shouldAddPendingTag ? [...formData.tags, pendingTag] : formData.tags;

    if (shouldAddPendingTag) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, pendingTag],
        newTag: ''
      }));
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Normalize phone number
      const phoneInfo = normalizePhoneNumber(formData.phone);
      if (!phoneInfo.isValid) {
        throw new Error('Invalid phone number format');
      }

      await createContact({
        name: formData.name.trim(),
        phone_e164: phoneInfo.normalized,
        email: formData.email.trim() || undefined,
        tags: tagsToSend
      });

      // Show success notification with tags
      const tagsList = tagsToSend.length > 0 ? tagsToSend.join(', ') : 'No tags';
      toast({
        title: 'Contact Added Successfully',
        description: `${formData.name} has been added. Tags: ${tagsList}`,
        variant: 'default'
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        tags: [],
        newTag: ''
      });
      setErrors({});
      setIsOpen(false);

      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      tags: [],
      newTag: ''
    });
    setErrors({});
    setIsOpen(false);
  };

  // Determine if the Add Contact button should be disabled
  const isAddContactDisabled =
    isLoading ||
    !formData.name.trim() ||
    !formData.phone.trim() ||
    (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) ||
    formData.tags.length === 0 ||
    !!formData.newTag.trim() ||
    (formData.phone.trim() && !normalizePhoneNumber(formData.phone).isValid);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Add New Contact
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
              <Input
                id="name"
                placeholder="Enter full name (any case)"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              💡 You can use any case: "john doe", "John Doe", "JOHN DOE" - all are accepted
            </p>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="+255 700 000 001"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-blue-600 font-medium">
              📱 Accepted formats: +255700000001, 0700000001, 255700000001
            </p>
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags *</Label>
            <div className="space-y-3">
              {/* Preset Tags - Hidden */}
              <div className="hidden">
                <p className="text-sm font-medium text-gray-900 mb-2">Quick Select:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTogglePresetTag(tag)}
                      disabled={isLoading}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Tag Input */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Tags Names: <span className="text-red-600">*</span></p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
                    <Input
                      placeholder="Type a tag name (e.g., 'wholesale', 'partner')"
                      value={formData.newTag}
                      onChange={(e) => handleInputChange('newTag', e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                      disabled={isLoading}
                      aria-required="true"
                      required={formData.tags.length === 0}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!formData.newTag.trim() || isLoading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Display All Selected Tags */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {errors.tags && (
                  <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAddContactDisabled}
              className={
                isAddContactDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300'
                  : 'bg-primary hover:bg-primary-dark text-white'
              }
            >
              {isLoading ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

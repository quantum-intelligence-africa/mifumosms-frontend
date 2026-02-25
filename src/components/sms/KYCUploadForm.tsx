import { useState } from 'react';
import { Upload, X, FileIcon, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useKYCUpload } from '@/hooks/useKYCUpload';
import { useLanguage } from '@/hooks/useLanguage';

interface KYCUploadFormProps {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  defaultSenderId?: string;
}

export const KYCUploadForm = ({ onSuccess, onError, defaultSenderId }: KYCUploadFormProps) => {
  const { t } = useLanguage();
  const { uploadKYC, isLoading, error } = useKYCUpload();

  const [requestedSenderId, setRequestedSenderId] = useState(defaultSenderId || '');
  const [sampleContent, setSampleContent] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validFiles = files.filter(file => {
      if (file.type !== 'application/pdf') {
        onError?.(`${file.name} is not a PDF file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        onError?.(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedSenderId.trim()) {
      onError?.('Please enter a sender ID');
      return;
    }

    if (!sampleContent.trim()) {
      onError?.('Please enter sample content');
      return;
    }

    if (selectedFiles.length === 0) {
      onError?.('Please upload at least one KYC document');
      return;
    }

    setIsSubmitting(true);

    const response = await uploadKYC({
      requested_sender_id: requestedSenderId.trim(),
      sample_content: sampleContent.trim(),
      phone_number: phoneNumber.trim() || undefined,
      kyc_files: selectedFiles,
    });

    if (response) {
      // Reset form
      setRequestedSenderId(defaultSenderId || '');
      setSampleContent('');
      setPhoneNumber('');
      setSelectedFiles([]);
      onSuccess?.(response);
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="p-4 sm:p-6 glass">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender ID */}
        <div className="space-y-2">
          <Label htmlFor="sender-id" className="text-sm font-semibold">
            {t('sender_name') || 'Requested Sender ID'}
          </Label>
          <Input
            id="sender-id"
            placeholder="e.g., MyBrand"
            value={requestedSenderId}
            onChange={(e) => setRequestedSenderId(e.target.value)}
            maxLength={11}
            className="glass-subtle border-0"
            disabled={isLoading || isSubmitting}
          />
          <p className="text-xs text-text-subtle">
            {requestedSenderId.length}/11 characters (alphanumeric + spaces)
          </p>
        </div>

        {/* Sample Content */}
        <div className="space-y-2">
          <Label htmlFor="sample-content" className="text-sm font-semibold">
            {t('sample_message') || 'Sample Message Content'}
          </Label>
          <textarea
            id="sample-content"
            placeholder="Example: 'Hello! This is a test message from MyBrand.'"
            value={sampleContent}
            onChange={(e) => setSampleContent(e.target.value)}
            maxLength={1500}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm placeholder-text-subtle resize-none glass-subtle border-0"
            disabled={isLoading || isSubmitting}
          />
          <p className="text-xs text-text-subtle">
            {sampleContent.length}/1500 characters
          </p>
        </div>

        {/* Phone Number (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold">
            Phone Number <span className="text-text-subtle text-xs font-normal">(Optional)</span>
          </Label>
          <Input
            id="phone"
            placeholder="e.g., 255712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="glass-subtle border-0"
            disabled={isLoading || isSubmitting}
          />
          <p className="text-xs text-text-subtle">
            Required for payment initiation if sender ID is approved
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            KYC Documents <span className="text-red-500">*</span>
          </Label>

          <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isLoading || isSubmitting}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Drag & drop PDF files here or click to select
            </p>
            <p className="text-xs text-text-subtle mt-1">
              PDF files up to 5MB each
            </p>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-semibold text-foreground">
                Selected Files ({selectedFiles.length})
              </p>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-subtle">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isLoading || isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-text-subtle">
            Upload government-issued ID, business registration, or supporting documents
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success State */}
        {false && (
          <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/20 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600">KYC submitted successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || isSubmitting || selectedFiles.length === 0}
          className="w-full"
          size="lg"
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit KYC Documents
            </>
          )}
        </Button>

        <p className="text-xs text-text-subtle text-center">
          Your documents are encrypted and securely stored. We process requests within 24 hours.
        </p>
      </form>
    </Card>
  );
};

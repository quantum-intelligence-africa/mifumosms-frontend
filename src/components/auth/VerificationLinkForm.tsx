import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useVerificationLink } from '@/hooks/useVerificationLink';
import { getPhonePlaceholder } from '@/utils/phoneUtils';

interface VerificationLinkFormProps {
  onSuccess?: () => void;
  onBypass?: () => void;
}

export const VerificationLinkForm: React.FC<VerificationLinkFormProps> = ({
  onSuccess,
  onBypass,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const { sendVerificationLink, resendVerificationLink, isSendingLink, isResendingLink } = useVerificationLink();

  const handleSendLink = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter your phone number');
      setMessageType('error');
      return;
    }

    setMessage('');
    const result = await sendVerificationLink({ phone_number: phoneNumber });

    if (result.success) {
      if (result.bypassed) {
        setMessage('Account verification not required for admin users');
        setMessageType('success');
        onBypass?.();
      } else {
        setMessage('Verification link sent to your phone number. Check your SMS and click the link to verify your account.');
        setMessageType('success');
      }
    } else {
      setMessage(result.error || 'Failed to send verification link');
      setMessageType('error');
    }
  };

  const handleResendLink = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter your phone number');
      setMessageType('error');
      return;
    }

    setMessage('');
    const result = await resendVerificationLink({ phone_number: phoneNumber });

    if (result.success) {
      if (result.bypassed) {
        setMessage('Account verification not required for admin users');
        setMessageType('success');
        onBypass?.();
      } else if (result.message === 'Account is already verified') {
        setMessage('Account is already verified. Redirecting to dashboard...');
        setMessageType('success');
        onSuccess?.();
      } else {
        setMessage('New verification link sent to your phone number');
        setMessageType('success');
      }
    } else {
      setMessage(result.error || 'Failed to resend verification link');
      setMessageType('error');
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Link className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Get Verification Link</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Enter your phone number to receive a verification link via SMS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder={getPhonePlaceholder()}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
          />
          <p className="text-xs text-gray-500">
            Enter the phone number associated with your account
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSendLink}
            disabled={isSendingLink || !phoneNumber.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSendingLink ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Link...
              </>
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                Get Verification Link
              </>
            )}
          </Button>

          <Button
            onClick={handleResendLink}
            disabled={isResendingLink || !phoneNumber.trim()}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
          >
            {isResendingLink ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Link
              </>
            )}
          </Button>
        </div>

        {message && (
          <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {getMessageIcon()}
            <AlertDescription className={messageType === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            The verification link will expire in 1 hour. If you don't receive it, check your spam folder or try resending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

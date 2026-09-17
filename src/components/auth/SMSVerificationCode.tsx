import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface SMSVerificationCodeProps {
  phoneNumber: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: string;
  messageType?: 'password_reset' | 'verification';
}

export const SMSVerificationCode: React.FC<SMSVerificationCodeProps> = ({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  isResending = false,
  error = '',
  attemptsRemaining,
  lockedUntil,
  messageType = 'verification'
}) => {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Simple formatting - you can enhance this based on your needs
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${phone}`;
  };

  // Handle code submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    console.log('Submitting verification code:', trimmedCode, 'length:', trimmedCode.length);
    if (trimmedCode && trimmedCode.length >= 4 && !isLoading) {
      onVerify(trimmedCode);
    }
  };

  // Handle code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setCode(value);
  };

  // Handle resend
  const handleResend = () => {
    if (!isResending && !isLocked) {
      onResend();
    }
  };

  // Check if locked
  useEffect(() => {
    if (lockedUntil) {
      const lockTime = new Date(lockedUntil).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.ceil((lockTime - now) / 1000));

      if (remaining > 0) {
        setIsLocked(true);
        setTimeRemaining(remaining);

        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              setIsLocked(false);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [lockedUntil]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageText = () => {
    switch (messageType) {
      case 'password_reset':
        return t("auth.sms_verification.message_password_reset");
      default:
        return t("auth.sms_verification.message_default");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          {t("auth.sms_verification.title")}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {getMessageText()}
        </CardDescription>
        <div className="text-sm text-gray-500 mt-2">
          {t("auth.sms_verification.code_sent_to", { phone: formatPhoneNumber(phoneNumber) })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-sm font-semibold text-gray-700">
              {t("auth.common.verification_code_label")}
            </Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t("auth.common.enter_6digit_code")}
              value={code}
              onChange={handleCodeChange}
              className="h-12 text-center text-lg font-mono tracking-widest border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              maxLength={6}
              disabled={isLoading || isLocked}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              {t("auth.sms_verification.attempts_remaining", {
                count: attemptsRemaining,
                plural: attemptsRemaining !== 1 ? 's' : ''
              })}
            </div>
          )}

          {isLocked && timeRemaining > 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {t("auth.sms_verification.locked_message", { time: formatTime(timeRemaining) })}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            disabled={code.length < 4 || isLoading || isLocked}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("auth.common.verifying")}
              </div>
            ) : (
              t("auth.sms_verification.verify_code_button")
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">
            {t("auth.common.didnt_receive_code")}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending || isLocked}
            className="w-full"
          >
            {isResending ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("auth.common.sending")}
              </div>
            ) : (
              t("auth.common.resend_code")
            )}
          </Button>
        </div>

        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("auth.sms_verification.back_to_phone")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

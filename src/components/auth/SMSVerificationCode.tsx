import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowLeft, RefreshCw } from 'lucide-react';

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
    if (code.length >= 4 && !isLoading) {
      onVerify(code);
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
        return 'Enter the verification code sent to your phone to reset your password';
      default:
        return 'Enter the verification code sent to your phone';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          Verify Phone Number
        </CardTitle>
        <CardDescription className="text-gray-600">
          {getMessageText()}
        </CardDescription>
        <div className="text-sm text-gray-500 mt-2">
          Code sent to {formatPhoneNumber(phoneNumber)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-sm font-semibold text-gray-700">
              Verification Code
            </Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 6-digit code"
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
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </div>
          )}

          {isLocked && timeRemaining > 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Too many attempts. Try again in {formatTime(timeRemaining)}
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
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">
            Didn't receive the code?
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
                Sending...
              </div>
            ) : (
              'Resend Code'
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
            Back to Phone Number
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

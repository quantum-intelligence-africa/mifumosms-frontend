import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface SMSVerificationCodeProps {
  phoneNumber: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: string;
  messageType?: 'verification' | 'password_reset' | 'account_confirmation';
}

export const SMSVerificationCode = ({
  phoneNumber,
  onVerify,
  onResend,
  isLoading = false,
  isResending = false,
  error,
  attemptsRemaining,
  lockedUntil,
  messageType = 'verification'
}: SMSVerificationCodeProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Start countdown when component mounts
  useEffect(() => {
    setCountdown(60); // 60 seconds countdown
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setCode(newCode);
    
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      // Focus the next empty input
      const nextEmptyIndex = pastedData.length;
      if (nextEmptyIndex < 6) {
        inputRefs.current[nextEmptyIndex]?.focus();
      }
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) return;
    
    try {
      await onVerify(verificationCode);
      // Don't set isVerified here - let the parent component handle step transition
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Verification error:', error);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await onResend();
      setCountdown(60); // Reset countdown
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const getMessageTypeText = () => {
    switch (messageType) {
      case 'password_reset':
        return 'password reset';
      case 'account_confirmation':
        return 'account confirmation';
      default:
        return 'verification';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +255 700 000 001)
    return phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Enter Verification Code
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a {getMessageTypeText()} code to {formatPhoneNumber(phoneNumber)}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <>
            {/* Code Input */}
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-primary"
                  disabled={isLoading || isLocked}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                    <span className="block mt-1">
                      {attemptsRemaining} attempts remaining
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Lockout Message */}
            {isLocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Phone verification is temporarily locked. Please try again later.
                  {lockedUntil && (
                    <span className="block mt-1">
                      Locked until: {new Date(lockedUntil).toLocaleString()}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Resend Button */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={isResending || countdown > 0 || isLocked}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-xs text-muted-foreground text-center bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Security Notice:</p>
              <ul className="space-y-1 text-left">
                <li>• Verification codes expire after 10 minutes</li>
                <li>• Maximum 5 attempts before temporary lockout</li>
                <li>• Do not share this code with anyone</li>
                <li>• Codes are sent from Taarifa-SMS</li>
              </ul>
            </div>
        </>
      </CardContent>
    </Card>
  );
};

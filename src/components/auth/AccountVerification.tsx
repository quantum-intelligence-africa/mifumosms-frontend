import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { Phone, CheckCircle, RefreshCw } from 'lucide-react';

interface AccountVerificationProps {
  phoneNumber: string;
  onVerified?: () => void;
  onSkip?: () => void;
}

export const AccountVerification: React.FC<AccountVerificationProps> = ({
  phoneNumber,
  onVerified,
  onSkip
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const { verifyAccount, sendAccountVerification } = useAuth();
  const { t } = useLanguage();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;

    setIsLoading(true);
    try {
      const result = await verifyAccount(code);

      if (result.success) {
        toast({
          title: t("auth.account_verification.toast_verified_title"),
          description: t("auth.account_verification.toast_verified_desc"),
        });
        onVerified?.();
      } else {
        toast({
          title: t("auth.account_verification.toast_failed_title"),
          description: result.error || t("auth.account_verification.toast_failed_desc_default"),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("auth.account_verification.toast_failed_title"),
        description: t("auth.common.generic_error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await sendAccountVerification(phoneNumber);

      if (result.success) {
        toast({
          title: t("auth.account_verification.toast_sms_sent_title"),
          description: t("auth.account_verification.toast_sms_sent_desc", { phone: phoneNumber }),
        });
      } else {
        toast({
          title: t("auth.account_verification.toast_sms_failed_title"),
          description: result.error || t("auth.account_verification.toast_sms_failed_desc"),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("auth.account_verification.toast_sms_failed_title"),
        description: t("auth.common.generic_error"),
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          {t("auth.common.verify_your_account_title")}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t("auth.account_verification.subtitle")}
        </CardDescription>
        <div className="text-sm text-gray-500 mt-4 md:mt-2">
          {phoneNumber}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-sm font-semibold text-gray-700">
              {t("auth.common.verification_code_label")}
            </Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t("auth.account_verification.code_placeholder")}
              value={code}
              onChange={handleCodeChange}
              className="h-12 text-center text-lg font-mono tracking-widest border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            disabled={code.length < 4 || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("auth.common.verifying")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t("auth.account_verification.verify_button")}
              </div>
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
            disabled={isResending}
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

        {onSkip && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="w-full"
            disabled={isLoading}
          >
            {t("auth.account_verification.skip_button")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

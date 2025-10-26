import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowLeft, Mail, CheckCircle, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSMSVerification } from "@/hooks/useSMSVerification";
import { SMSVerificationCode } from "@/components/auth/SMSVerificationCode";
import { normalizePhoneNumber, getPhonePlaceholder, toBackendPhoneFormat } from "@/utils/phoneUtils";

const ForgotPassword = () => {
  const isMobile = useIsMobile();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backendPhoneNumber, setBackendPhoneNumber] = useState(""); // Store the phone number format returned by backend
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verification' | 'reset'>('phone');
  const [verificationError, setVerificationError] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();
  const { requestPasswordReset, resetPassword, sendVerificationCode, verifyCode, isSendingCode, isVerifying } = useSMSVerification();
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate and normalize phone number
      const phoneInfo = normalizePhoneNumber(phoneNumber);
      if (!phoneInfo.isValid) {
        setVerificationError(phoneInfo.error || 'Please enter a valid phone number');
        toast({
          title: "Invalid Phone Number",
          description: phoneInfo.error || "Please enter a valid phone number",
          variant: "destructive"
        });
        return;
      }

      // Convert to backend format for the request
      const backendFormat = toBackendPhoneFormat(phoneInfo.normalized);
      const result = await requestPasswordReset({ phone_number: backendFormat });

      if (result.success) {
        // Store the phone number format returned by the backend for verification
        setBackendPhoneNumber(result.phone_number || backendFormat);
        setStep('verification');
        toast({
          title: "Reset code sent",
          description: `Reset code sent to ${phoneInfo.formatted}`,
        });
      } else {
        setVerificationError(result.error || 'Failed to send reset code');
        setAttemptsRemaining(result.attempts_remaining);
        setLockedUntil(result.locked_until);
      }
    } catch (error) {
      setVerificationError('Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setVerificationError('');
    setVerificationCode(code); // Store the code for password reset

    // Skip separate verification - go directly to password reset step
    // The verification will happen during password reset
    setStep('reset');
    toast({
      title: "Code entered successfully!",
      description: "You can now reset your password."
    });
  };

  const handleResendCode = async () => {
    setVerificationError('');
    try {
      // Use the phone number format returned by the backend
      const phoneToUse = backendPhoneNumber || toBackendPhoneFormat(phoneNumber);

      const result = await sendVerificationCode({
        phone_number: phoneToUse,
        message_type: 'password_reset'
      });

      if (!result.success) {
        setVerificationError(result.error || 'Failed to resend code');
        setAttemptsRemaining(result.attempts_remaining);
        setLockedUntil(result.locked_until);
      }
    } catch (error) {
      setVerificationError('Failed to resend code. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the phone number format returned by the backend
      const phoneToUse = backendPhoneNumber || toBackendPhoneFormat(phoneNumber);

      const result = await resetPassword({
        phone_number: phoneToUse,
        verification_code: verificationCode,
        new_password: newPassword,
        new_password_confirm: confirmPassword
      });

      if (result.success) {
        toast({
          title: "Password reset successfully!",
          description: "You can now login with your new password."
        });
        navigate("/login");
      } else {
        toast({
          title: "Password reset failed",
          description: result.error || "Failed to reset password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationError('');
    setAttemptsRemaining(undefined);
    setLockedUntil(undefined);
  };

  const renderStep = () => {
    switch (step) {
      case 'phone':
    return (
          <form onSubmit={handlePhoneSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-gray-700">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+255 700 000 001"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Enter the phone number associated with your account
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  📱 Accepted formats: +255700000001, 0700000001, 255700000001
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset code"}
            </Button>
          </form>
        );

      case 'verification':
        return (
          <SMSVerificationCode
            phoneNumber={backendPhoneNumber || toBackendPhoneFormat(phoneNumber)}
            onVerify={handleVerifyCode}
            onResend={handleResendCode}
            isLoading={isVerifying}
            isResending={isSendingCode}
            error={verificationError}
            attemptsRemaining={attemptsRemaining}
            lockedUntil={lockedUntil}
            messageType="password_reset"
          />
        );

      case 'reset':
        return (
          <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold text-gray-700">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
          </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold text-gray-700">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
                </div>

                <Button
              type="submit"
                  className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
                >
              {isLoading ? "Resetting..." : "Reset password"}
                </Button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone':
        return 'Forgot your password?';
      case 'verification':
        return 'Verify your phone number';
      case 'reset':
        return 'Reset your password';
      default:
        return 'Forgot your password?';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'phone':
        return 'No worries! Enter your phone number and we\'ll send you a reset code';
      case 'verification':
        return 'Enter the verification code sent to your phone';
      case 'reset':
        return 'Enter your new password below';
      default:
        return 'No worries! Enter your phone number and we\'ll send you a reset code';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'phone':
        return <Phone className="w-8 h-8 text-blue-600" />;
      case 'verification':
        return <MessageSquare className="w-8 h-8 text-blue-600" />;
      case 'reset':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      default:
        return <Phone className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce" />
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-lg rotate-45 animate-ping" />
      </div>

      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 sm:mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to homepage</span>
          </Link>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-heading text-xl sm:text-2xl font-bold text-white">
              Mifumo SMS
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              {getStepIcon()}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">{getStepTitle()}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              {getStepDescription()}
            </CardDescription>
            {step === 'verification' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToPhone}
                className="absolute left-4 top-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {renderStep()}

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Remember your password?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center text-xs text-white/80">
          <p>
            By using this service, you agree to our{" "}
            <Link to="/terms" className="text-yellow-300 hover:text-yellow-200 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-yellow-300 hover:text-yellow-200 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

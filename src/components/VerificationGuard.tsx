import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, AlertCircle, CheckCircle, Link, Smartphone } from 'lucide-react';
import { VerificationLinkForm } from '@/components/auth/VerificationLinkForm';
import { SMSVerificationCode } from '@/components/auth/SMSVerificationCode';
import { useSMSVerification } from '@/hooks/useSMSVerification';

interface VerificationGuardProps {
  children: React.ReactNode;
}

export const VerificationGuard = ({ children }: VerificationGuardProps) => {
  const { user, isAuthenticated, isVerified, canBypassVerification, isLoading } = useAuth();
  const navigate = useNavigate();
  const [verificationStep, setVerificationStep] = useState<'method' | 'sms' | 'link'>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<string | undefined>();
  const { sendVerificationCode, verifyCode, isSendingCode, isVerifying } = useSMSVerification();

  const handleSMSVerification = async () => {
    if (!phoneNumber.trim()) {
      setVerificationError('Please enter your phone number');
      return;
    }

    setVerificationError('');
    const result = await sendVerificationCode({ 
      phone_number: phoneNumber,
      message_type: 'verification'
    });

    if (result.success) {
      setVerificationStep('sms');
    } else {
      setVerificationError(result.error || 'Failed to send verification code');
      setAttemptsRemaining(result.attempts_remaining);
      setLockedUntil(result.locked_until);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setVerificationError('');
    try {
      const result = await verifyCode({
        phone_number: phoneNumber,
        verification_code: code
      });

      if (result.success) {
        // Verification successful, refresh the page to update auth state
        window.location.reload();
      } else {
        setVerificationError(result.error || 'Invalid verification code');
        setAttemptsRemaining(result.attempts_remaining);
      }
    } catch (error) {
      setVerificationError('Failed to verify code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setVerificationError('');
    try {
      const result = await sendVerificationCode({ 
        phone_number: phoneNumber,
        message_type: 'verification'
      });

      if (!result.success) {
        setVerificationError(result.error || 'Failed to resend verification code');
        setAttemptsRemaining(result.attempts_remaining);
        setLockedUntil(result.locked_until);
      }
    } catch (error) {
      setVerificationError('Failed to resend code. Please try again.');
    }
  };

  const handleBypass = () => {
    // User is admin, refresh to update auth state
    window.location.reload();
  };

  const handleSuccess = () => {
    // Verification successful, refresh to update auth state
    window.location.reload();
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (isAuthenticated && !canBypassVerification) {
        // User is authenticated but cannot bypass verification - stay on verification page
        // Don't redirect, just show verification UI
      }
    }
  }, [isAuthenticated, canBypassVerification, isLoading, navigate]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Checking authentication...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // useEffect will handle redirect
  }

  // Show verification required screen if cannot bypass verification
  if (!canBypassVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-gray-900">
                Mifumo WMS
              </span>
            </div>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Account Verification Required</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account needs to be verified before you can access the dashboard.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Welcome <strong>{user?.first_name} {user?.last_name}</strong>!
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Choose your preferred verification method below.
                  </p>
                </div>

                {verificationStep === 'method' && (
                  <Tabs defaultValue="link" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="link" className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Link
                      </TabsTrigger>
                      <TabsTrigger value="sms" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        SMS Code
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="link" className="mt-4">
                      <VerificationLinkForm 
                        onSuccess={handleSuccess}
                        onBypass={handleBypass}
                      />
                    </TabsContent>
                    
                    <TabsContent value="sms" className="mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="Enter your phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full h-12 px-3 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                        </div>
                        
                        <Button
                          onClick={handleSMSVerification}
                          disabled={isSendingCode || !phoneNumber.trim()}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {isSendingCode ? 'Sending Code...' : 'Send SMS Code'}
                        </Button>
                        
                        {verificationError && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-800">
                              {verificationError}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {verificationStep === 'sms' && (
                  <div className="space-y-4">
                    <SMSVerificationCode
                      phoneNumber={phoneNumber}
                      onVerify={handleVerifyCode}
                      onResend={handleResendCode}
                      isLoading={isVerifying}
                      isResending={isSendingCode}
                      error={verificationError}
                      attemptsRemaining={attemptsRemaining}
                      lockedUntil={lockedUntil}
                      messageType="verification"
                    />
                    
                    <Button
                      variant="outline"
                      onClick={() => setVerificationStep('method')}
                      className="w-full h-10 text-sm"
                    >
                      Back to Verification Methods
                    </Button>
                  </div>
                )}

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Back to Sign In
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Need help? Contact our{" "}
                    <a href="/support" className="text-blue-600 hover:underline">
                      support team
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User is authenticated and can bypass verification - show protected content
  return <>{children}</>;
};

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, XCircle, ArrowLeft, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const EmailActivation = () => {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activationStatus, setActivationStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSwitchToEmail, setShowSwitchToEmail] = useState(false);

  const { toast } = useToast();
  const { verifyEmail, verifySMS, resendActivationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get token from URL or email/phone from location state or localStorage
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Auto-activate if token is in URL
      handleActivate(urlToken);
    }

    // Get email, phone, and verification method from location state
    const stateEmail = location.state?.email;
    const statePhone = location.state?.phoneNumber;
    const stateMethod = location.state?.verificationMethod as 'sms' | 'email' | undefined;

    const storedEmail = localStorage.getItem('pending_email_activation');
    const storedPhone = localStorage.getItem('pending_phone_activation');
    const storedMethod = localStorage.getItem('pending_verification_method') as 'sms' | 'email' | null;

    if (stateEmail) {
      setEmail(stateEmail);
      localStorage.setItem('pending_email_activation', stateEmail);
    } else if (storedEmail && !email) {
      setEmail(storedEmail);
    }

    if (statePhone) {
      setPhoneNumber(statePhone);
      localStorage.setItem('pending_phone_activation', statePhone);
    } else if (storedPhone && !phoneNumber) {
      setPhoneNumber(storedPhone);
    }

    // Determine verification method: prioritize state method, then phone number, then stored method, default to SMS
    const finalPhone = statePhone || storedPhone;
    if (stateMethod) {
      // If verification method is explicitly passed in state, use it
      setVerificationMethod(stateMethod);
      localStorage.setItem('pending_verification_method', stateMethod);
    } else if (finalPhone) {
      // If phone exists, default to SMS
      setVerificationMethod('sms');
      localStorage.setItem('pending_verification_method', 'sms');
    } else if (storedMethod) {
      // Use stored method if available
      setVerificationMethod(storedMethod);
    } else {
      // Default to SMS verification
      setVerificationMethod('sms');
      localStorage.setItem('pending_verification_method', 'sms');
    }
  }, [searchParams, location.state]);

  const handleActivate = async (tokenToUse?: string) => {
    const tokenValue = tokenToUse || token.trim();

    if (!tokenValue) {
      const codeSource = verificationMethod === 'sms' ? 'your phone' : 'your email';
      toast({
        title: "Code required",
        description: `Please enter the 6-digit verification code from ${codeSource}.`,
        variant: "destructive"
      });
      return;
    }

    if (tokenValue.length !== 6 && !tokenValue.includes('/')) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setActivationStatus("idle");
    setErrorMessage("");

    try {
      let result;

      if (verificationMethod === 'sms' && phoneNumber) {
        // Verify via SMS
        result = await verifySMS(phoneNumber, tokenValue);
      } else {
        // Verify via Email
        result = await verifyEmail(tokenValue);
      }

      if (result.success) {
        setActivationStatus("success");
        // Clear pending activation flags
        localStorage.removeItem('pending_email_activation');
        localStorage.removeItem('pending_phone_activation');
        localStorage.removeItem('pending_verification_method');

        // If tokens are returned, set them
        if (result.tokens) {
          const apiClient = (await import('@/lib/api')).apiClient;
          apiClient.setToken(result.tokens.access);
          localStorage.setItem('refresh_token', result.tokens.refresh);
          if (result.user) {
            localStorage.setItem('user_profile', JSON.stringify(result.user));
          }
        } else if (result.user) {
          // User data returned but no tokens - account is activated, user needs to login
          // Or we can try to get tokens by refreshing
          localStorage.setItem('user_profile', JSON.stringify(result.user));
        }

        toast({
          title: "Account activated successfully!",
          description: verificationMethod === 'sms'
            ? "Your account has been activated. Please log in to continue."
            : "Welcome! Redirecting to your dashboard...",
        });

        // If we have tokens, redirect to dashboard, otherwise redirect to login
        if (result.tokens) {
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1000);
        } else {
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      } else {
        setActivationStatus("error");
        const errorMsg = result.error || (verificationMethod === 'sms'
          ? "Invalid or expired code. Please request a new verification code."
          : "Invalid or expired token. Please request a new activation email.");
        setErrorMessage(errorMsg);

        // If SMS verification failed and email is available, show option to switch
        if (verificationMethod === 'sms' && email.trim() && result.error) {
          const errorLower = result.error.toLowerCase();
          // Check if error indicates SMS failure (not just invalid code)
          if (errorLower.includes('failed') || errorLower.includes('unable') || errorLower.includes('error') || errorLower.includes('network')) {
            setShowSwitchToEmail(true);
          }
        }

        toast({
          title: "Activation failed",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error) {
      setActivationStatus("error");
      const errorMsg = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setErrorMessage(errorMsg);

      // If SMS verification failed and email is available, show option to switch
      if (verificationMethod === 'sms' && email.trim()) {
        setShowSwitchToEmail(true);
      }

      toast({
        title: "Activation failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToEmail = async () => {
    setVerificationMethod('email');
    setShowSwitchToEmail(false);
    setActivationStatus("idle");
    setErrorMessage("");
    setToken(""); // Clear the code

    // Try to resend via email
    if (email.trim()) {
      setIsResending(true);
      try {
        const result = await resendActivationEmail(email.trim(), phoneNumber.trim() || undefined);
        if (result.success) {
          toast({
            title: "Switched to email verification",
            description: `Please check your inbox at ${email} for the 6-digit verification code.`,
            duration: 10000
          });
        } else {
          toast({
            title: "Failed to send email",
            description: result.error || "Please try again later.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Failed to send email",
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsResending(false);
      }
    }
  };

  const handleSwitchToSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to switch to SMS verification.",
        variant: "destructive"
      });
      return;
    }

    setVerificationMethod('sms');
    setShowSwitchToEmail(false);
    setActivationStatus("idle");
    setErrorMessage("");
    setToken(""); // Clear the code

    // Try to resend via SMS
    setIsResending(true);
    try {
      const result = await resendActivationEmail(email.trim(), phoneNumber.trim());
      if (result.success) {
        const method = result.method || 'sms';
        if (method === 'sms') {
          toast({
            title: "Switched to SMS verification",
            description: `Please check your phone (${phoneNumber}) for the 6-digit verification code.`,
            duration: 10000
          });
        } else {
          // Backend fell back to email
          toast({
            title: "SMS failed, using email",
            description: `SMS could not be sent. Please check your inbox at ${email} for the activation code.`,
            duration: 10000
          });
          setVerificationMethod('email');
        }
      } else {
        toast({
          title: "Failed to send SMS",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send SMS",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResendSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to resend the SMS verification code.",
        variant: "destructive"
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Email is required for account activation. Please provide your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      // Use resend-activation endpoint which the backend handles automatically
      // Backend will try SMS first if phone number is available, then fallback to email
      const result = await resendActivationEmail(email.trim(), phoneNumber.trim());

      if (result.success) {
        const method = result.method || 'sms';
        if (method === 'sms') {
          toast({
            title: "SMS verification code sent",
            description: `Please check your phone (${phoneNumber}) for the 6-digit verification code.`,
            duration: 10000
          });
          setVerificationMethod('sms');
          setShowSwitchToEmail(false);
        } else {
          // Backend fell back to email
          toast({
            title: "Email verification sent",
            description: `SMS failed. Please check your inbox at ${email} for the activation code.`,
            duration: 10000
          });
          setVerificationMethod('email');
          setShowSwitchToEmail(false);
        }
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        // If SMS failed and email is available, offer to switch
        if (email.trim()) {
          setShowSwitchToEmail(true);
          toast({
            title: "SMS failed",
            description: result.error || "SMS could not be sent. You can switch to email verification.",
            variant: "destructive",
            duration: 8000
          });
        } else {
          toast({
            title: "Failed to send code",
            description: result.error || "Please try again later.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      // If SMS failed and email is available, offer to switch
      if (email.trim()) {
        setShowSwitchToEmail(true);
      }
      toast({
        title: "Failed to send code",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend the activation email.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      const result = await resendActivationEmail(email.trim(), undefined);

      if (result.success) {
        toast({
          title: "Activation email sent",
          description: `Please check your inbox at ${email} for the activation code.`,
          duration: 10000
        });
        setActivationStatus("idle");
        setErrorMessage("");
        setToken(""); // Clear the code
      } else {
        toast({
          title: "Failed to resend email",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleActivate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce" />
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-lg rotate-45 animate-ping" />
      </div>

      <div className="w-full max-w-md sm:max-w-md lg:max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-4 lg:mb-3">
          <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-2 sm:mb-3 lg:mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </Link>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-2 sm:pb-3 lg:pb-2 px-4 sm:px-5 lg:px-4">
            <div className="flex justify-center mb-2 sm:mb-3 lg:mb-2">
              {activationStatus === "success" ? (
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 text-green-500" />
              ) : activationStatus === "error" ? (
                <XCircle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 text-red-500" />
              ) : (
                verificationMethod === 'sms' ? (
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 text-blue-500" />
                ) : (
                  <Mail className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 text-blue-500" />
                )
              )}
            </div>
            <CardTitle className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900">
              {activationStatus === "success"
                ? "Account Activated!"
                : activationStatus === "error"
                ? "Activation Failed"
                : "Activate Your Account"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-xs text-gray-600">
              {activationStatus === "success"
                ? "Your account has been successfully activated. Redirecting to login..."
                : activationStatus === "error"
                ? errorMessage
                : verificationMethod === 'sms'
                ? `Enter the 6-digit verification code sent to your phone (${phoneNumber || 'your number'})`
                : "Enter the 6-digit verification code from the email we sent you"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 lg:px-4 pb-3 sm:pb-4 lg:pb-3">
            {activationStatus === "success" ? (
              <div className="text-center space-y-3 sm:space-y-4 lg:space-y-3">
                <p className="text-xs sm:text-sm lg:text-xs text-gray-600">
                  You will be redirected to your dashboard shortly.
                </p>
                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-3">
                  <div className="space-y-2">
              <Label htmlFor="token" className="text-xs sm:text-sm lg:text-xs font-semibold text-gray-700">
                6-Digit Verification Code
              </Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={token}
                      onChange={(e) => {
                        // Only allow digits, max 6 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setToken(value);
                      }}
                      required
                      disabled={isLoading}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-9 sm:h-10 lg:h-9 text-sm text-center text-base lg:text-sm tracking-widest font-mono border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      {verificationMethod === 'sms'
                        ? `Check your phone (${phoneNumber || 'your number'}) for the 6-digit verification code`
                        : "Check your email inbox (and spam folder) for the 6-digit verification code"}
                    </p>
                  </div>

                  {/* Show switch to email option if SMS failed */}
                  {showSwitchToEmail && verificationMethod === 'sms' && email.trim() && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 mb-2">
                        SMS verification failed. Would you like to use email verification instead?
                      </p>
                      <Button
                        type="button"
                        onClick={handleSwitchToEmail}
                        disabled={isResending}
                        variant="outline"
                        className="w-full h-8 text-xs bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800"
                      >
                        {isResending ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Switching...
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Switch to Email Verification
                          </>
                        )}
                      </Button>
                    </div>
                  )}

              <Button
                type="submit"
                className="w-full h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || token.length !== 6}
              >
                {isLoading ? "Activating..." : "Activate Account"}
              </Button>
                </form>

                <div className="mt-4 sm:mt-5 lg:mt-4 pt-4 sm:pt-5 lg:pt-4 border-t border-gray-200">
                  {verificationMethod === 'sms' ? (
                    // SMS Verification Section - Show only SMS details
                    <div className="space-y-2 sm:space-y-3 lg:space-y-2">
                      <p className="text-xs sm:text-sm lg:text-xs text-gray-600 text-center">
                        Didn't receive the SMS?
                      </p>

                      {/* Switch to Email Option */}
                      {email.trim() && !showSwitchToEmail && (
                        <div className="text-center mb-2">
                          <Button
                            type="button"
                            onClick={handleSwitchToEmail}
                            disabled={isResending}
                            variant="ghost"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline h-auto p-1"
                          >
                            <Mail className="w-3 h-3 mr-1 inline" />
                            Use email verification instead
                          </Button>
                        </div>
                      )}

                      {/* Phone Number Input and Resend SMS Button */}
                      <div className="space-y-1">
                        <Label htmlFor="resend-phone" className="text-xs sm:text-sm lg:text-xs font-semibold text-gray-700">
                          Phone Number
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="resend-phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            onClick={handleResendSMS}
                            disabled={isResending || !phoneNumber.trim()}
                            variant="outline"
                            className="whitespace-nowrap h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs px-3"
                          >
                            {isResending ? (
                              <>
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline lg:hidden">Sending...</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline lg:hidden">Resend SMS</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Email Verification Section - Show only Email details
                    <div className="space-y-2 sm:space-y-3 lg:space-y-2">
                      <p className="text-xs sm:text-sm lg:text-xs text-gray-600 text-center">
                        Didn't receive the email?
                      </p>

                      {/* Switch to SMS Option */}
                      {phoneNumber.trim() && (
                        <div className="text-center mb-2">
                          <Button
                            type="button"
                            onClick={handleSwitchToSMS}
                            disabled={isResending}
                            variant="ghost"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline h-auto p-1"
                          >
                            <Smartphone className="w-3 h-3 mr-1 inline" />
                            Use SMS verification instead
                          </Button>
                        </div>
                      )}

                      {/* Email Input and Resend Email Button */}
                      <div className="space-y-1">
                        <Label htmlFor="resend-email" className="text-xs sm:text-sm lg:text-xs font-semibold text-gray-700">
                          Email Address
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="resend-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            onClick={handleResendEmail}
                            disabled={isResending || !email.trim()}
                            variant="outline"
                            className="whitespace-nowrap h-9 sm:h-10 lg:h-9 text-xs sm:text-sm lg:text-xs px-3"
                          >
                            {isResending ? (
                              <>
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline lg:hidden">Sending...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline lg:hidden">Resend Email</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 lg:mt-3 text-center">
                  <p className="text-xs text-gray-600">
                    Already activated?{" "}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailActivation;



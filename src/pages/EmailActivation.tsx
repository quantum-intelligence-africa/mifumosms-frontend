import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activationStatus, setActivationStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { toast } = useToast();
  const { verifyEmail, resendActivationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get token from URL or email from location state
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Auto-activate if token is in URL
      handleActivate(urlToken);
    }

    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [searchParams, location.state]);

  const handleActivate = async (tokenToUse?: string) => {
    const tokenValue = tokenToUse || token.trim();

    if (!tokenValue) {
      toast({
        title: "Code required",
        description: "Please enter the 6-digit verification code from your email.",
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
      const result = await verifyEmail(tokenValue);

      if (result.success) {
        setActivationStatus("success");
        toast({
          title: "Account activated successfully!",
          description: "You can now log in to your account.",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        setActivationStatus("error");
        setErrorMessage(result.error || "Invalid or expired token. Please request a new activation email.");
        toast({
          title: "Activation failed",
          description: result.error || "Invalid or expired token. Please request a new activation email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setActivationStatus("error");
      const errorMsg = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setErrorMessage(errorMsg);
      toast({
        title: "Activation failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
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
      const result = await resendActivationEmail(email.trim());

      if (result.success) {
        toast({
          title: "Activation email sent",
          description: `Please check your inbox at ${email} for the activation link.`,
          duration: 10000
        });
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

      <div className="w-full max-w-md sm:max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 sm:mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </Link>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex justify-center mb-3">
              {activationStatus === "success" ? (
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
              ) : activationStatus === "error" ? (
                <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
              ) : (
                <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              {activationStatus === "success"
                ? "Account Activated!"
                : activationStatus === "error"
                ? "Activation Failed"
                : "Activate Your Account"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              {activationStatus === "success"
                ? "Your account has been successfully activated. Redirecting to login..."
                : activationStatus === "error"
                ? errorMessage
                : "Enter the 6-digit verification code from the email we sent you"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {activationStatus === "success" ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  You will be redirected to the login page shortly.
                </p>
                <Button
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-semibold text-gray-700">
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
                      className="h-10 sm:h-12 text-sm sm:text-base text-center text-lg tracking-widest font-mono border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Check your email inbox (and spam folder) for the 6-digit verification code
                    </p>
                  </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || token.length !== 6}
              >
                {isLoading ? "Activating..." : "Activate Account"}
              </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">
                      Didn't receive the email?
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="resend-email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="resend-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                        />
                        <Button
                          type="button"
                          onClick={handleResend}
                          disabled={isResending || !email.trim()}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {isResending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Resend
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-600">
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



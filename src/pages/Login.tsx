import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Force light theme on auth page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast({
          title: "Login successful",
          description: "Welcome back to Mifumo SMS!"
        });

        // Redirect to dashboard immediately after successful login
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        // Check if error indicates account needs activation
        const errorMessage = result.error || "Please check your credentials and try again.";
        const needsActivation = errorMessage.toLowerCase().includes('not been activated') ||
                                errorMessage.toLowerCase().includes('activation') ||
                                errorMessage.toLowerCase().includes('verification code');

        if (needsActivation) {
          // Get phone number from result or stored data
          const resultPhone = (result as any).phoneNumber;
          const storedPhone = localStorage.getItem('pending_phone_activation');
          const storedMethod = localStorage.getItem('pending_verification_method') as 'sms' | 'email' | null;

          // Determine verification method: prefer stored method, or SMS if phone exists, else default to SMS
          let verificationMethod: 'sms' | 'email' = 'sms';
          let phoneNumber: string | undefined = resultPhone || storedPhone || undefined;

          if (storedMethod) {
            verificationMethod = storedMethod;
          } else if (phoneNumber) {
            verificationMethod = 'sms';
            // Store phone number for later use
            localStorage.setItem('pending_phone_activation', phoneNumber);
            localStorage.setItem('pending_verification_method', 'sms');
          } else {
            // Default to SMS verification
            verificationMethod = 'sms';
            localStorage.setItem('pending_verification_method', 'sms');
          }

          // Update toast message - always mention SMS
          const toastMessage = phoneNumber
            ? `A new 6-digit verification code has been sent to your phone (${phoneNumber}). Please check your SMS messages and use the code to verify your account.`
            : "A new 6-digit verification code has been sent to your phone. Please check your SMS messages and use the code to verify your account.";

          toast({
            title: "Account not activated",
            description: toastMessage,
            variant: "destructive",
            duration: 10000
          });

          // Redirect to activation page with verification method info
          navigate('/activate-email', {
            state: {
              email: formData.email,
              phoneNumber: phoneNumber,
              verificationMethod: verificationMethod
            }
          });
        } else {
          toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sliding Background Component - Light blue gradient like Landing page
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        {/* Light blue gradient background - almost white at top, slightly darker blue towards bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
          {/* Subtle abstract patterns overlay - positioned on right side like Textmagic */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="patternGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {/* Wavy/fluid patterns - more subtle */}
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradientLogin)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Sliding Background */}
      <SlidingBackground />

      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3 sm:mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to homepage</span>
          </Link>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-heading text-xl sm:text-2xl font-bold text-gray-900">
              Mifumo SMS
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 transition-all duration-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 sm:h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="remember" className="text-xs sm:text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center text-xs text-gray-600">
          <p>
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

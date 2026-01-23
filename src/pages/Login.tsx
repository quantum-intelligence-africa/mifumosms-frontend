import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
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
            variant: "default",
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sliding Background */}
      <SlidingBackground />

      <div className="flex flex-col md:flex-row w-full min-h-screen md:min-h-0">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-6 lg:p-8 relative overflow-hidden min-h-screen">
          {/* Image Section with Header Overlay */}
          <div className="relative z-10 w-full max-w-lg flex-1 flex items-center">
            {/* Header positioned at the top of the image */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-white/90 to-transparent rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-heading text-2xl font-bold text-gray-900">
                    Mifumo SMS
                  </span>
                  <p className="text-base text-black mt-1">
                    Reliable SMS solutions for businesses
                  </p>
                </div>
              </div>
            </div>

            {/* Mifumo SMS Information - positioned at bottom of image area */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-gradient-to-t from-white/90 to-transparent rounded-b-lg p-4">
                <h3 className="text-base font-semibold text-black mb-2">Why Choose Mifumo SMS?</h3>
                <ul className="space-y-1 text-sm text-black">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Reliable delivery across all networks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Competitive pricing with bulk discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
            </div>

            <img
              src="/sign in image.png"
              className="w-full h-auto object-contain"
              alt="Login illustration"
            />
          </div>

          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/home background12.jpg"
              alt="Login background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 bg-white/20 backdrop-blur-sm relative z-10 min-h-screen">
          <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
            {/* Form Header */}
            <div className="text-center mb-4 sm:mb-6">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-base sm:text-lg font-bold text-gray-900">
                  Mifumo SMS
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-10 sm:h-11 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="h-10 sm:h-11 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 rounded-lg text-sm sm:text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 sm:h-11 px-3 hover:bg-transparent"
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
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
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium text-left sm:text-right"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-2 sm:space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4">
                <Link to="/" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  Home
                </Link>
                <span className="hidden sm:inline text-gray-400 text-sm">|</span>
                <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

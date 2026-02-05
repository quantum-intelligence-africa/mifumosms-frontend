import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Mail, Lock, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import MobileMenu from "@/components/layout/MobileMenu";

const Login = () => {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        const errorMessage = result.error || "Please check your credentials and try again.";

        if (result.requiresActivation) {
          const resultData = result as Record<string, unknown>;
          const resultPhone = resultData.phoneNumber as string | undefined;
          const storedPhone = localStorage.getItem('pending_phone_activation');
          const storedMethod = localStorage.getItem('pending_verification_method') as 'sms' | 'email' | null;

          let verificationMethod: 'sms' | 'email' = 'sms';
          const phoneNumber = resultPhone || storedPhone || undefined;

          if (storedMethod) {
            verificationMethod = storedMethod;
          } else if (phoneNumber) {
            verificationMethod = 'sms';
            localStorage.setItem('pending_phone_activation', phoneNumber);
            localStorage.setItem('pending_verification_method', 'sms');
          } else {
            verificationMethod = 'sms';
            localStorage.setItem('pending_verification_method', 'sms');
          }

          const toastMessage = phoneNumber
            ? `A new 6-digit verification code has been sent to your phone (${phoneNumber}). Please check your SMS messages and use the code to verify your account.`
            : "A new 6-digit verification code has been sent to your phone. Please check your SMS messages and use the code to verify your account.";

          toast({
            title: "Account not activated",
            description: toastMessage,
            variant: "default",
            duration: 10000
          });

          navigate('/smsactivation', {
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

  // Mobile Background Component - Blue gradient with abstract shapes
  const MobileBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home background12.jpg"
            className="w-full h-full object-cover"
            alt="Mobile background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
        </div>
      </div>
    );
  };

  // Desktop Sliding Background Component
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
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

  // Mobile Login UI
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <MobileBackground />

        {/* Fixed Header with Menu Button */}
        <header className="fixed top-0 left-0 right-0 z-[50] px-4 py-3 bg-gradient-to-b from-black/20 to-transparent">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                Mifumo SMS
              </span>
            </Link>

            {/* Hamburger Menu Button */}
            <button
              className="p-2 text-white hover:text-gray-200 transition-colors touch-manipulation"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* White Curved Container */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 flex-1 bg-white rounded-t-[40px] px-8 pt-12 pb-8 shadow-2xl mt-24"
        >
          {/* Form Title */}
          <div className="text-center mb-6">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              Welcome back
            </motion.h2>
            <p className="text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <Input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="h-14 pl-12 pr-4 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                <Lock className="w-5 h-5" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                autoComplete="current-password"
                className="h-14 pl-12 pr-12 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-mobile"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                  className="h-4 w-4"
                />
                <Label htmlFor="remember-mobile" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "SIGN IN"}
              </Button>
            </motion.div>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/"
                className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Home
              </Link>
              <span className="text-gray-400">|</span>
              <p className="text-gray-500 text-sm">
                Don't have account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Login UI (unchanged)
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <SlidingBackground />

      <div className="flex flex-col md:flex-row w-full min-h-screen md:min-h-0">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-6 lg:p-8 relative overflow-hidden min-h-screen">
          <div className="relative z-10 w-full max-w-lg flex-1 flex items-center">
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
            <div className="text-center mb-4 sm:mb-6">
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

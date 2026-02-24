import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Mail, Lock, User, Phone, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import MobileMenu from "@/components/layout/MobileMenu";

const Signup = () => {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [smsFailed, setSmsFailed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const { register, isAuthenticated } = useAuth();
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

  // Handle phone verification
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.verifyPhoneCode(registeredPhone, verificationCode);

      if (result.success && result.data) {
        const { access, refresh, user: userData, message } = result.data;

        if (access && refresh && userData) {
          const updatedUser = {
            ...userData,
            is_verified: true,
            is_active: true,
            phone_verified: true
          };

          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          toast({
            title: "Account activated successfully!",
            description: message || "Welcome to Mifumo SMS! You are now logged in and being redirected to your dashboard.",
            duration: 5000
          });

          navigate('/dashboard', { replace: true });
        } else {
          toast({
            title: "Phone verified successfully!",
            description: message || "Your phone has been verified. Please log in to access your account.",
            duration: 5000
          });
          navigate('/login');
        }
      } else {
        toast({
          title: "Verification failed",
          description: result.error || result.message || "Invalid verification code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const countries = [
    { value: "ke", label: "Kenya" },
    { value: "tz", label: "Tanzania" }
  ];

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please provide a phone number.",
        variant: "destructive"
      });
      return;
    }

    const trimmedPhone = formData.phone.trim();
    const phoneDigitsOnly = trimmedPhone.replace(/\D/g, '');

    if (phoneDigitsOnly.length < 8) {
      toast({
        title: "Phone number too short",
        description: "Please enter a complete phone number with at least 8 digits.",
        variant: "destructive"
      });
      return;
    }

    let processedPhone = formData.phone.trim();
    const digitsOnly = processedPhone.replace(/\D/g, '');

    if (digitsOnly.length < 9) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a complete phone number with at least 9 digits.",
        variant: "destructive"
      });
      return;
    }

    if (digitsOnly.startsWith('255')) {
      processedPhone = '+' + digitsOnly;
    } else if (digitsOnly.startsWith('0')) {
      processedPhone = '+255' + digitsOnly.substring(1);
    } else {
      processedPhone = '+255' + digitsOnly;
    }

    if (!processedPhone || processedPhone.trim() === '') {
      toast({
        title: "Phone processing error",
        description: "Failed to process phone number. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const registerData: {
        email: string;
        password: string;
        password_confirm: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        company_name: string;
        country?: string;
      } = {
        email: formData.email.trim(),
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: processedPhone,
        company_name: formData.company.trim()
      };

      if (formData.country) {
        registerData.country = formData.country;
      }

      const result = await register(registerData);

      if (result.stayOnPage || (!result.success && (result.errors || result.error))) {
        if (result.error) {
          const safeErrorMessage = typeof result.error === 'string' ? result.error : 'Validation failed';
          toast({
            title: "Validation failed",
            description: safeErrorMessage,
            variant: "destructive",
            duration: 10000
          });
        }

        if (result.errors && Object.keys(result.errors).length > 0) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            const errorMessage = Array.isArray(errors) ? errors[0] : errors;
            const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Validation error occurred';
            if (safeErrorMessage !== result.error) {
              toast({
                title: `${field.charAt(0).toUpperCase() + field.slice(1)} error`,
                description: safeErrorMessage,
                variant: "destructive",
                duration: 8000
              });
            }
          });
        }
        return;
      }

      if (result.success) {
        if (result.requiresActivation) {
          const phoneNumber = result.phoneNumber || processedPhone;
          setRegisteredPhone(phoneNumber);
          setSmsFailed(result.smsFailed || false);
          setShowVerification(true);

          if (result.smsFailed) {
            toast({
              title: "Account created successfully!",
              description: `Your account has been created, but we encountered an issue sending the verification SMS. Please contact support for assistance with account activation.`,
              duration: 10000
            });
          } else {
            toast({
              title: "Account created successfully!",
              description: result.message || `Please check your phone (${phoneNumber}) for the 6-digit verification code to activate your account.`,
              duration: 10000
            });
          }
        } else {
          toast({
            title: "Account created successfully!",
            description: result.message || "Welcome to Mifumo SMS! You can now access your dashboard."
          });
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Please check your information and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
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

  // Mobile Background Component
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
                  <linearGradient id="patternGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradientSignup)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Signup UI
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
          className="relative z-10 flex-1 bg-white rounded-t-[40px] px-6 pt-20 pb-4 shadow-2xl overflow-y-auto mt-14"
        >
          {!showVerification ? (
            <>
              {/* Form Title */}
              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl font-bold text-gray-800 mb-1"
                >
                  Create your account
                </motion.h2>
                <p className="text-xs text-gray-600">
                  Join Mifumo SMS today
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
                <div className="relative">
                  <Input
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="h-10 px-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
              </div>

              {/* Phone Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  type="tel"
                  placeholder="Phone (+255...)"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="h-10 pl-10 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
              </div>

              {/* Country and Company Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Select onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="h-10 pl-3 pr-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Input
                    name="company"
                    placeholder="Company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                    className="h-10 px-3 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className="h-10 pl-10 pr-10 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className="h-10 pl-10 pr-10 border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox id="terms" required className="mt-0.5" />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                  I agree to the{" "}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              {/* Sign Up Button */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="pt-1"
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "SIGN UP"}
                </Button>
              </motion.div>
            </form>
            </>
          ) : (
            <>
              {/* Verification Title */}
              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl font-bold text-gray-800 mb-1"
                >
                  Verify your phone
                </motion.h2>
                <p className="text-xs text-gray-600">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <form onSubmit={handleVerifyPhone} className="space-y-4">
                <p className="text-center text-gray-600 text-xs">
                {smsFailed
                  ? `We encountered an issue sending your verification code. Please contact support.`
                  : `Enter the 6-digit code sent to ${registeredPhone}`
                }
              </p>

              {!smsFailed && (
                <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl"
                    />
                </div>
              )}

              {!smsFailed ? (
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify Phone"}
                  </Button>
                </motion.div>
              ) : (
                <Button
                  type="button"
                  onClick={() => window.open('mailto:support@mifumosms.com?subject=SMS Verification Issue', '_blank')}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg"
                >
                  Contact Support
                </Button>
              )}

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Back to registration
                </button>
              </div>
            </form>
            </>
          )}

          {/* Links */}
          <div className="mt-3 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/"
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Home
              </Link>
              <span className="text-gray-400">|</span>
              <p className="text-gray-500 text-xs">
                Already have account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Signup UI (unchanged from original)
  return (
    <div className="min-h-screen flex">
      <SlidingBackground />

      <div className="flex w-full">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-8 relative overflow-hidden min-h-screen">
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
              alt="Sign up illustration"
            />
          </div>

          <div className="absolute inset-0">
            <img
              src="/home background12.jpg"
              alt="Signup background"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-8 bg-white/20 backdrop-blur-sm relative z-10 min-h-screen md:min-h-screen">
          <div className="w-full max-w-md space-y-4 sm:space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading text-lg font-bold text-gray-900">
                  Mifumo SMS
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {showVerification ? "Verify your phone" : "Create your account"}
              </h2>
              {showVerification && (
                <p className="text-xs text-gray-600">
                  {smsFailed
                    ? `We encountered an issue sending your verification code. Please contact support for assistance with account activation.`
                    : `Enter the 6-digit code sent to ${registeredPhone}. After verification, you'll be automatically logged in and redirected to your dashboard.`
                  }
                </p>
              )}
            </div>

            {!showVerification ? (
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                      Phone {formData.phone && formData.phone.trim() && formData.phone.trim().length >= 8 ? '✓' : ''}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+255 700 000 001"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className={`h-9 border rounded-lg text-sm ${
                        formData.phone && formData.phone.trim() && formData.phone.trim().length >= 8
                          ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-xs font-medium text-gray-700">Country</Label>
                    <Select onValueChange={(value) => handleInputChange("country", value)}>
                      <SelectTrigger className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="company" className="text-xs font-medium text-gray-700">Company name</Label>
                  <Input
                    id="company"
                    placeholder="Your Company Ltd"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                    className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 rounded-lg text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 rounded-lg text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" required className="mt-0.5" />
                  <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                    I agree to the{" "}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhone} className="space-y-4">
                {!smsFailed && (
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode" className="text-xs font-medium text-gray-700">
                      Verification Code
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="h-12 text-center text-xl font-mono tracking-widest border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                  </div>
                )}

                {!smsFailed ? (
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify Phone"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => window.open('mailto:support@mifumosms.com?subject=SMS Verification Issue', '_blank')}
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  >
                    Contact Support
                  </Button>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowVerification(false)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Back to registration
                  </button>
                </div>
              </form>
            )}

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-3">
                <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs">
                  Home
                </Link>
                <span className="text-gray-400 text-xs">|</span>
                <p className="text-xs text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                    Sign in
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

export default Signup;

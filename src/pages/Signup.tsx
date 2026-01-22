import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { normalizePhoneNumber } from "@/utils/phoneUtils";
import { apiClient } from "@/lib/api";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
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

      if (result.success) {
        toast({
          title: "Phone verified successfully!",
          description: "Your account is now active. You can log in.",
          duration: 5000
        });
        navigate('/login');
      } else {
        toast({
          title: "Verification failed",
          description: result.message || "Invalid verification code. Please try again.",
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
    { value: "tz", label: "Tanzania" },
    { value: "ug", label: "Uganda" },
    { value: "rw", label: "Rwanda" },
    { value: "bi", label: "Burundi" },
    { value: "ss", label: "South Sudan" }
  ];

  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password)
  };

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.phone) {
      toast({
        title: "Phone number required",
        description: "Please provide a phone number.",
        variant: "destructive"
      });
      return;
    }

    // Validate and normalize phone number
    const phoneInfo = normalizePhoneNumber(formData.phone);
    if (!phoneInfo.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneInfo.error || "Please enter a valid phone number",
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
        phone: string;
        company_name?: string;
        country?: string;
      } = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: phoneInfo.normalized
      };

      // Add optional fields if provided
      if (formData.company) {
        registerData.company_name = formData.company;
      }
      if (formData.country) {
        registerData.country = formData.country;
      }

      const result = await register(registerData);

      // CRITICAL: Check if we should stay on page (status 400 - validation failed)
      if (result.stayOnPage || (!result.success && (result.errors || result.error))) {
        // ❌ Status 400 - Account NOT created, validation failed
        // Stay on registration page, show error messages

        // First, show the main error message if available
        if (result.error) {
          toast({
            title: "Validation failed",
            description: result.error,
            variant: "destructive",
            duration: 10000
          });
        }

        // Then show field-specific errors if available
        if (result.errors && Object.keys(result.errors).length > 0) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            const errorMessage = Array.isArray(errors) ? errors[0] : errors;
            // Only show if different from main error message
            if (errorMessage !== result.error) {
              toast({
                title: `${field.charAt(0).toUpperCase() + field.slice(1)} error`,
                description: errorMessage,
                variant: "destructive",
                duration: 8000
              });
            }
          });
        }

        // DO NOT redirect - stay on registration page
        return;
      }

      if (result.success) {
        // ✅ Status 201 - Account created successfully
        if (result.requiresActivation) {
          // Account created but needs phone verification
          const phoneNumber = result.phoneNumber || phoneInfo.normalized;
          setRegisteredPhone(phoneNumber);
          setShowVerification(true);

          toast({
            title: "Account created successfully!",
            description: `Please check your phone (${phoneNumber}) for the 6-digit verification code.`,
            duration: 10000
          });
        } else {
          // Account activated immediately (backward compatibility)
          toast({
            title: "Account created successfully!",
            description: "Welcome to Mifumo SMS! You can now access your dashboard."
          });
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        // Other error cases
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
                  <linearGradient id="patternGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {/* Wavy/fluid patterns - more subtle */}
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

  return (
    <div className="min-h-screen flex">
      {/* Sliding Background */}
      <SlidingBackground />

      <div className="flex w-full">
        {/* Left Column - Header and Image */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-8 relative overflow-hidden min-h-screen">
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
              alt="Sign up illustration"
            />
          </div>

          {/* Background Image */}
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
            {/* Form Header */}
            <div className="text-center mb-4 sm:mb-6">
              {/* Logo */}
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
                  Enter the 6-digit code sent to {registeredPhone}
                </p>
              )}
            </div>

            {!showVerification ? (
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                {/* Name Fields */}
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

                {/* Email */}
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

                {/* Phone and Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+255 700 000 001"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="h-9 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm"
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

                {/* Company */}
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

                {/* Password */}
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

                {/* Confirm Password */}
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

                {/* Terms and Conditions */}
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

                {/* Sign Up Button */}
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

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Phone"}
                </Button>

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

            {/* Footer Links */}
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

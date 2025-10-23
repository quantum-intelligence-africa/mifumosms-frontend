import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSMSVerification } from "@/hooks/useSMSVerification";
import { SMSVerificationCode } from "@/components/auth/SMSVerificationCode";
import { normalizePhoneNumber, getPhonePlaceholder } from "@/utils/phoneUtils";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationError, setVerificationError] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<string | undefined>();
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
  const { register, isAuthenticated, canBypassVerification, confirmAccount, user } = useAuth();
  const { sendVerificationCode, verifyCode, isSendingCode, isVerifying } = useSMSVerification();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated and can bypass verification
  useEffect(() => {
    if (isAuthenticated && canBypassVerification) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, canBypassVerification, navigate, location]);

  const countries = [
    { value: "ke", label: "Kenya" },
    { value: "tz", label: "Tanzania" },
    { value: "ug", label: "Uganda" },
    { value: "ng", label: "Nigeria" },
    { value: "gh", label: "Ghana" },
    { value: "za", label: "South Africa" },
    { value: "eg", label: "Egypt" },
    { value: "ma", label: "Morocco" },
    { value: "sn", label: "Senegal" },
    { value: "ci", label: "Côte d'Ivoire" }
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
        description: "Please provide a phone number for SMS verification.",
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
      const result = await register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: phoneInfo.normalized,
        timezone: "UTC"
      });

      if (result.success) {
        // Check if SMS verification was sent
        if (result.sms_verification?.sent) {
          setStep('verification');
          toast({
            title: "Account created successfully!",
            description: `Please verify your phone number ${phoneInfo.formatted} to complete registration.`
          });
        } else {
          // If no SMS verification, proceed to dashboard
          toast({
            title: "Account created successfully!",
            description: "Welcome to Mifumo WMS! You can now access your dashboard."
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

  const handleVerifyCode = async (code: string) => {
    setVerificationError('');
    try {
      // First verify the SMS code
      const smsResult = await verifyCode({
        phone_number: formData.phone,
        verification_code: code
      });

      if (smsResult.success) {
        // Then confirm the account
        const confirmResult = await confirmAccount(code);
        
        if (confirmResult.success) {
          toast({
            title: "Account verified successfully!",
            description: "Your account is now fully activated."
          });
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        } else {
          setVerificationError(confirmResult.error || 'Account confirmation failed');
        }
      } else {
        setVerificationError(smsResult.error || 'Invalid verification code');
        setAttemptsRemaining(smsResult.attempts_remaining);
      }
    } catch (error) {
      setVerificationError('Failed to verify code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setVerificationError('');
    try {
      const result = await sendVerificationCode({
        phone_number: formData.phone,
        message_type: 'verification'
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

  const handleBackToForm = () => {
    setStep('form');
    setVerificationError('');
    setAttemptsRemaining(undefined);
    setLockedUntil(undefined);
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
        <div className="text-center mb-3 sm:mb-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-heading text-xl sm:text-2xl font-bold text-white">
              Mifumo WMS
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
              {step === 'form' ? 'Create your account' : 'Verify your phone number'}
            </CardTitle>
            {step === 'verification' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToForm}
                className="absolute left-4 top-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-semibold text-gray-700">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-semibold text-gray-700">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+255 700 000 001"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300"
                  />
                  <p className="text-xs text-blue-600 font-medium">
                    📱 +255700000001, 0700000001, 255700000001
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-xs font-semibold text-gray-700">Country</Label>
                  <Select onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300">
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
                <Label htmlFor="company" className="text-xs font-semibold text-gray-700">Company name</Label>
                <Input
                  id="company"
                  placeholder="Your Company Ltd"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  required
                  className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10 transition-all duration-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
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
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="h-9 text-sm border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10 transition-all duration-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
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


              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            ) : (
              <SMSVerificationCode
                phoneNumber={formData.phone}
                onVerify={handleVerifyCode}
                onResend={handleResendCode}
                isLoading={isVerifying}
                isResending={isSendingCode}
                error={verificationError}
                attemptsRemaining={attemptsRemaining}
                lockedUntil={lockedUntil}
                messageType="verification"
              />
            )}

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold text-xs">
                  Home
                </Link>
                <p className="text-xs text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

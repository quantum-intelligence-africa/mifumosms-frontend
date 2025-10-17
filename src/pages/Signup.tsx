import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    marketingEmails: false
  });
  const { toast } = useToast();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the Terms of Service to continue.",
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

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone || undefined,
      });

      if (result.success) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Mifumo WMS! You can now access your dashboard."
        });
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
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

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-1 sm:mb-2 md:mb-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2 md:mb-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            <span className="font-heading text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">
              Mifumo WMS
            </span>
          </div>
        </div>

        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center pb-1 sm:pb-2 md:pb-3 px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-4">
            <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold">Create your account</CardTitle>
            {/* <CardDescription className="text-xs sm:text-sm">
              Start your 14-day free trial today
            </CardDescription> */}
          </CardHeader>
          <CardContent className="px-1 sm:px-2 md:px-4 lg:px-6 pb-1 sm:pb-2 md:pb-4 lg:pb-6">
            <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-2 md:space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <Label htmlFor="firstName" className="text-xs">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="glass-subtle border-0 text-xs h-6 sm:h-7 md:h-8"
                  />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <Label htmlFor="lastName" className="text-xs">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="glass-subtle border-0 text-xs h-6 sm:h-7 md:h-8"
                  />
                </div>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <Label htmlFor="email" className="text-xs">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="glass-subtle border-0 text-xs h-6 sm:h-7 md:h-8"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+255 700 000 000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="glass-subtle border-0 text-xs h-6 sm:h-7 md:h-8"
                  />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <Label htmlFor="country" className="text-xs">Country</Label>
                  <Select onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="glass-subtle border-0 text-xs h-6 sm:h-7 md:h-8">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="company" className="text-xs sm:text-sm">Company name</Label>
                <Input
                  id="company"
                  placeholder="Your Company Ltd"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  required
                  className="glass-subtle border-0 text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="glass-subtle border-0 pr-5 sm:pr-6 md:pr-8 text-xs h-6 sm:h-7 md:h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-6 sm:h-7 md:h-8 px-1 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-subtle" />
                    ) : (
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-subtle" />
                    )}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
                    <div className="grid grid-cols-2 gap-0.5 sm:gap-1 text-xs">
                      <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordStrength.length ? 'text-success' : 'text-text-subtle'}`}>
                        <Check className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${passwordStrength.length ? 'opacity-100' : 'opacity-30'}`} />
                        <span>8+</span>
                      </div>
                      <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordStrength.uppercase ? 'text-success' : 'text-text-subtle'}`}>
                        <Check className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${passwordStrength.uppercase ? 'opacity-100' : 'opacity-30'}`} />
                        <span>A-Z</span>
                      </div>
                      <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordStrength.lowercase ? 'text-success' : 'text-text-subtle'}`}>
                        <Check className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${passwordStrength.lowercase ? 'opacity-100' : 'opacity-30'}`} />
                        <span>a-z</span>
                      </div>
                      <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordStrength.number ? 'text-success' : 'text-text-subtle'}`}>
                        <Check className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${passwordStrength.number ? 'opacity-100' : 'opacity-30'}`} />
                        <span>0-9</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="glass-subtle border-0 pr-5 sm:pr-6 md:pr-8 text-xs h-6 sm:h-7 md:h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-6 sm:h-7 md:h-8 px-1 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-subtle" />
                    ) : (
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-subtle" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && (
                  <div className={`flex items-center gap-0.5 sm:gap-1 text-xs ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                    <Check className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                  </div>
                )}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-start space-x-1 sm:space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                    required
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-xs leading-tight">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <div className="flex items-start space-x-1 sm:space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked) => handleInputChange("marketingEmails", checked as boolean)}
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5"
                  />
                  <Label htmlFor="marketing" className="text-xs text-text-subtle leading-tight">
                    I'd like to receive product updates and marketing emails
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs h-6 sm:h-7 md:h-8"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-1 sm:mt-2 md:mt-3 flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-1 md:gap-0">
              <Link to="/" className="text-xs text-primary hover:underline">
                Home
              </Link>
              <p className="text-text-subtle text-xs text-center sm:text-right">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

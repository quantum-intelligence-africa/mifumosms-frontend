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
          description: "Welcome back to Mifumo WMS!"
        });
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Please check your credentials and try again.",
          variant: "destructive"
        });
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

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-2 sm:p-3 lg:p-4 xl:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-5 lg:mb-6 xl:mb-8">
          <Link to="/" className="inline-flex items-center gap-1 sm:gap-2 text-text-subtle hover:text-foreground mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm lg:text-base">Back to homepage</span>
          </Link>
          <div className="flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            <span className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              Mifumo WMS
            </span>
          </div>
        </div>

        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center p-3 sm:p-4 lg:p-5 xl:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-5 xl:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm lg:text-base">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="glass-subtle border-0 text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 xl:h-12"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm lg:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="glass-subtle border-0 pr-8 sm:pr-10 text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10 xl:h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-8 sm:h-9 lg:h-10 xl:h-12 px-2 sm:px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-text-subtle" />
                    ) : (
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-text-subtle" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                    className="h-3 w-3 sm:h-4 sm:w-4"
                  />
                  <Label htmlFor="remember" className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm lg:text-base text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-8 sm:h-9 lg:h-10 xl:h-12 text-xs sm:text-sm lg:text-base"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-3 sm:mt-4 lg:mt-5 xl:mt-6 text-center">
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Social login section removed */}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-text-subtle">
          <p>
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

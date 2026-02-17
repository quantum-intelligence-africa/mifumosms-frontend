import { useMemo, useState, useEffect } from "react";
import { logger } from "@/utils/logger";
import {
  CreditCard,
  Wallet,
  Zap,
  Check,
  ArrowRight,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Calculator
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiClient, SMSPackage, SMSBalance, PaymentInitiationRequest, PaymentProgress, MobileMoneyProvider, CustomSMSCalculation } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee?: string;
}

interface PaymentState {
  transactionId?: string;
  orderId?: string;
  status?: string;
  progress?: PaymentProgress;
  isActive: boolean;
}

interface CustomSMSState {
  credits: number;
  unitPrice: number;
  totalPrice: number;
  activeTier: string;
  savingsPercentage: number;
  pricingTiers: Array<{
    name: string;
    min_credits: number;
    max_credits: number;
    unit_price: number;
    description: string;
  }>;
}

const PurchaseSMS = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [customCredits, setCustomCredits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userPaymentNumber, setUserPaymentNumber] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [packages, setPackages] = useState<SMSPackage[]>([]);
  const [balance, setBalance] = useState<SMSBalance | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({ isActive: false });
  const [paymentPolling, setPaymentPolling] = useState<NodeJS.Timeout | null>(null);
  const [mobileMoneyProviders, setMobileMoneyProviders] = useState<MobileMoneyProvider[]>([]);
  const [customSMSState, setCustomSMSState] = useState<CustomSMSState | null>(null);
  const [isCalculatingCustom, setIsCalculatingCustom] = useState(false);
  const [customCreditsError, setCustomCreditsError] = useState<string>("");

  // Default packages matching the pricing table
  const defaultPackages: SMSPackage[] = useMemo(() => [
    {
      id: "lite",
      name: "Lite",
      package_type: "lite",
      credits: 5000, // Example amount within range: 1 to 49,999
      price: "90000.00", // 5000 * 18
      unit_price: "18.00",
      subtitle: "1 to 49,999 SMS",
      description: "Perfect for small businesses and startups",
      is_popular: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Never expires",
        "Instant top-up",
        "Basic delivery reports",
        "Email receipt"
      ],
      savings_percentage: 0
    },
    {
      id: "standard",
      name: "Standard",
      package_type: "standard",
      credits: 50000, // Minimum of range: 50,000 to 149,999
      subtitle: "50,000 to 149,999 SMS",
      description: "Ideal for growing businesses",
      price: "700000.00", // 50000 * 14
      unit_price: "14.00",
      is_popular: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Priority top-up & support",
        "Advanced delivery analytics",
        "Campaign scheduling"
      ],
      savings_percentage: 22.2
    },
    {
      id: "pro",
      name: "Pro",
      package_type: "pro",
      credits: 250000, // Minimum of range: 250,000+
      subtitle: "250,000 SMS and above",
      description: "For established businesses with high volume",
      price: "3000000.00", // 250000 * 12
      unit_price: "12.00",
      is_popular: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Bulk campaign tools",
        "Advanced analytics",
        "API access"
      ],
      savings_percentage: 33.3
    },
    {
      id: "enterprise",
      name: "Enterprise",
      package_type: "enterprise",
      credits: 1000000,
      subtitle: "Enterprise (1M+ SMS)",
      description: "Custom pricing for large enterprises",
      price: "12000000.00", // 1000000 * 12
      unit_price: "12.00",
      is_popular: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Dedicated account manager",
        "Custom invoicing & contracts",
        "Enterprise API & SSO"
      ],
      savings_percentage: 60.0
    }
  ], []);

  // Fetch packages, balance, and mobile money providers on component mount (non-blocking)
  useEffect(() => {
    // Fetch packages
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const packagesResponse = await apiClient.getSMSPackages();

        if (packagesResponse.success && packagesResponse.data) {
          if (Array.isArray(packagesResponse.data)) {
            // Handle legacy response format
            setPackages(packagesResponse.data);
          } else if (packagesResponse.data.results && packagesResponse.data.results.length > 0) {
            // Handle new response format
            setPackages(packagesResponse.data.results);
          } else {
            logger.warn('No packages returned from API, using defaults');
            setPackages(defaultPackages);
          }
        } else {
          // Use default packages if API doesn't return any
          logger.warn('API packages request failed, using defaults');
          setPackages(defaultPackages);
        }
      } catch (error) {
        logger.warn('Error fetching packages');
        setPackages(defaultPackages);
      } finally {
        setPackagesLoading(false);
      }
    };

    // Fetch balance
    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        const balanceResponse = await apiClient.getSMSBalance();
        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } catch (error) {
        logger.warn('Error fetching balance');
      } finally {
        setBalanceLoading(false);
      }
    };

    // Fetch providers
    const fetchProviders = async () => {
      try {
        setProvidersLoading(true);
        const providersResponse = await apiClient.getPaymentProviders();
        if (providersResponse.success && providersResponse.data) {
          setMobileMoneyProviders(providersResponse.data.providers);
        }
      } catch (error) {
        logger.warn('Error fetching providers');
      } finally {
        setProvidersLoading(false);
      }
    };

    // Start all requests in parallel (non-blocking)
    fetchPackages();
    fetchBalance();
    fetchProviders();
  }, [defaultPackages]);

  // Cleanup payment polling on unmount
  useEffect(() => {
    return () => {
      if (paymentPolling) {
        clearInterval(paymentPolling);
      }
    };
  }, [paymentPolling]);

  // Dynamic payment methods from API
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    if (mobileMoneyProviders.length > 0) {
      return mobileMoneyProviders.map(provider => ({
        id: provider.code,
        name: provider.name,
        icon: provider.code === 'vodacom' ? '📱' :
              provider.code === 'tigo' ? '📱' :
              provider.code === 'airtel' ? '📱' :
              provider.code === 'halotel' ? '📱' : '🏦'
      }));
    }
    // Fallback to default methods
    return [
      { id: "vodacom", name: "Vodacom M-Pesa", icon: "📱" },
      { id: "tigo", name: "Tigo Pesa", icon: "📱" },
      { id: "airtel", name: "Airtel Money", icon: "📱" },
      { id: "halotel", name: "Halotel Money", icon: "📱" },
    ];
  }, [mobileMoneyProviders]);

  // Payment details for each method
  const paymentDetails = {
    mpesa: {
      number: "0762 123 456",
      instructions: "Send money to this M-Pesa number and include your account reference"
    },
    tigopesa: {
      number: "0652 123 456",
      instructions: "Send money to this Tigo Pesa number and include your account reference"
    },
    airtel: {
      number: "0682 123 456",
      instructions: "Send money to this Airtel Money number and include your account reference"
    },
    card: {
      number: "Account: 1234567890",
      instructions: "Use this account number for card payments"
    },
    bank: {
      number: "Account: 9876543210",
      instructions: "Transfer to this bank account number"
    }
  };

  // Tiered pricing helpers
  type Tier = { id: string; name: string; min: number; max?: number; rate?: number; note?: string; rangeLabel: string };
  const tiers: Tier[] = useMemo(() => [
    { id: "lite", name: "Lite", min: 1, max: 49999, rate: 18, rangeLabel: "1 to 49,999 SMS" },
    { id: "standard", name: "Standard", min: 50000, max: 149999, rate: 14, rangeLabel: "50,000 to 149,999 SMS" },
    { id: "pro", name: "Pro", min: 250000, rate: 12, rangeLabel: "250,000 SMS and above" },
  ], []);

  const selectedPkg = packages.find(p => p.id === selectedPackage) || defaultPackages.find(p => p.id === selectedPackage);
  const parsedCredits = useMemo(() => {
    if (selectedPackage) {
      return selectedPkg?.credits || 0;
    }
    return Math.max(parseInt(customCredits || "0", 10) || 0, 0);
  }, [selectedPackage, selectedPkg, customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits < 50000) return tiers[0]; // Lite: 1-49,999
    if (parsedCredits < 250000) return tiers[1]; // Standard: 50,000-149,999
    return tiers[2]; // Pro: 250,000+
  }, [parsedCredits, tiers]);

  const customPrice = useMemo(() => {
    const localPrice = (() => {
      if (!parsedCredits) return 0;
      if (!activeTier) return 0;
      return parsedCredits * (activeTier.rate as number);
    })();

    if (customSMSState && customSMSState.totalPrice) {
      return customSMSState.totalPrice;
    }

    return localPrice;
  }, [parsedCredits, activeTier, customSMSState]);

  // Calculate custom SMS pricing using API
  const calculateCustomSMSPrice = async (credits: number) => {
    if (credits < 100) return;

    try {
      setIsCalculatingCustom(true);
      const response = await apiClient.calculateCustomSMSPrice({ credits });

      if (response.success && response.data) {
        setCustomSMSState({
          credits: response.data.credits,
          unitPrice: response.data.unit_price,
          totalPrice: response.data.total_price,
          activeTier: response.data.active_tier,
          savingsPercentage: response.data.savings_percentage,
          pricingTiers: response.data.pricing_tiers || []
        });
      }
    } catch (error) {
      logger.warn('Error calculating custom SMS price');
    } finally {
      setIsCalculatingCustom(false);
    }
  };

  // Calculate custom pricing when credits change
  useEffect(() => {
    if (customCredits && !selectedPackage) {
      const credits = parseInt(customCredits);
      if (credits >= 100) {
        setCustomCreditsError("");
        calculateCustomSMSPrice(credits);
      } else if (credits > 0) {
        setCustomCreditsError("Minimum 100 credits required");
        setCustomSMSState(null);
      } else {
        setCustomCreditsError("");
        setCustomSMSState(null);
      }
    } else {
      setCustomCreditsError("");
      setCustomSMSState(null);
    }
  }, [customCredits, selectedPackage]);

  // Payment polling function
  const pollPaymentStatus = async (transactionId: string) => {
    try {
      const response = await apiClient.checkPaymentStatus(transactionId);
      if (response.success && response.data) {
        setPaymentState({
          transactionId: response.data.transaction_id,
          orderId: response.data.order_id,
          status: response.data.status,
          progress: response.data.progress,
          isActive: true
        });

        if (response.data.status === 'completed') {
          // Payment completed successfully
          if (paymentPolling) {
            clearInterval(paymentPolling);
            setPaymentPolling(null);
          }
          setPaymentState(prev => ({ ...prev, isActive: false }));
          setShowInvoice(false);
          setProcessing(false);

          // Refresh balance
          const balanceResponse = await apiClient.getSMSBalance();
          if (balanceResponse.success && balanceResponse.data) {
            setBalance(balanceResponse.data);
          }

          toast({
            title: "Payment successful!",
            description: "SMS credits have been added to your account",
          });

          // Reset form
          setSelectedPackage("");
          setSelectedPackageId("");
          setCustomCredits("");
          setPaymentMethod("");
          setUserPaymentNumber("");
          setUserEmail("");
          setUserName("");
        } else if (response.data.status === 'failed' || response.data.status === 'expired') {
          // Payment failed or expired
          if (paymentPolling) {
            clearInterval(paymentPolling);
            setPaymentPolling(null);
          }
          setPaymentState(prev => ({ ...prev, isActive: false }));
          setShowInvoice(false);
          setProcessing(false);

          toast({
            title: "Payment failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      logger.warn('Error polling payment status');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage && !customCredits) {
      toast({
        title: "Select package",
        description: "Please select a package or enter custom credits",
        variant: "destructive"
      });
      return;
    }

    // Validate custom credits if custom amount is selected
    if (customCredits && customCreditsError) {
      toast({
        title: "Invalid amount",
        description: customCreditsError,
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    if (!userPaymentNumber.trim()) {
      toast({
        title: "Payment details required",
        description: "Please enter your mobile money number",
        variant: "destructive"
      });
      return;
    }

    if (!userEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive"
      });
      return;
    }

    setShowInvoice(true);
  };

  const confirmPurchase = async () => {
    setProcessing(true);

    try {
      let response;

      if (selectedPackage) {
        // Package purchase
        const packageId = selectedPackageId || selectedPackage;
        logger.debug('Processing package purchase', { packageId });

        const paymentData = {
          package_id: packageId, // Use the actual package ID
          buyer_email: userEmail,
          buyer_name: userName,
          buyer_phone: userPaymentNumber,
          mobile_money_provider: paymentMethod
        };

        logger.debug('Payment initiated');
        response = await apiClient.initiatePayment(paymentData);
      } else if (customCredits) {
        // Custom SMS purchase
        const customData = {
          credits: parseInt(customCredits),
          buyer_email: userEmail,
          buyer_name: userName,
          buyer_phone: userPaymentNumber,
          mobile_money_provider: paymentMethod
        };

        response = await apiClient.initiateCustomSMSPayment(customData);
      } else {
        toast({
          title: "No selection",
          description: "Please select a package or enter custom credits",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      if (response.success && response.data) {
        const { transaction_id, order_id } = response.data;

        setPaymentState({
          transactionId: transaction_id,
          orderId: order_id,
          status: 'pending',
          progress: response.data.progress,
          isActive: true
        });

        // Start polling for payment status only if transaction_id exists
        if (transaction_id) {
          const pollingInterval = setInterval(() => {
            pollPaymentStatus(transaction_id);
          }, 5000); // Poll every 5 seconds

          setPaymentPolling(pollingInterval);
        } else {
          // If no transaction_id, just mark as processing without polling
          toast({
            title: "Payment processing",
            description: "Please check your phone for mobile money prompt",
          });
        }

        toast({
          title: "Payment initiated",
          description: "Please check your phone for mobile money prompt",
        });

        // Auto-timeout after 30 minutes
        setTimeout(() => {
          if (paymentPolling) {
            clearInterval(paymentPolling);
            setPaymentPolling(null);
          }
          if (paymentState.isActive) {
            setPaymentState(prev => ({ ...prev, isActive: false }));
            setProcessing(false);
            setShowInvoice(false);
            toast({
              title: "Payment timeout",
              description: "Payment session expired. Please try again.",
              variant: "destructive"
            });
          }
        }, 30 * 60 * 1000);

      } else {
        setProcessing(false);
        logger.error('Payment initiation failed', { status: response.status });

        // Check for specific package ID format error
        if (response.error && response.error.includes('Invalid package ID format')) {
          toast({
            title: "Invalid Package Selection",
            description: "The selected package is not valid. Please refresh the page and try again.",
            variant: "destructive"
          });
        } else {
        toast({
          title: "Payment failed",
          description: response.error || "Failed to initiate payment",
          variant: "destructive"
        });
        }
      }
    } catch (error) {
      setProcessing(false);
      logger.error('Payment error occurred');
      toast({
        title: "Payment error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6">
          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                {t('purchase_sms_credits')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                {t('top_up_account')}
              </p>
            </div>

            {/* Balance Card */}
            <Card className="p-4 sm:p-6 glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-subtle mb-1">{t('current_balance')}</p>
                  {balanceLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {balance?.credits?.toLocaleString() || 0} <span className="text-base sm:text-lg font-normal text-text-subtle">SMS</span>
                  </p>
                  )}
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full gradient-primary flex items-center justify-center">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
              </div>
            </Card>

            {/* Package Selection */}
            <div>
              <h2 className="font-heading text-base sm:text-lg font-semibold mb-2">{t('choose_package')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {packagesLoading ? (
                  // Skeleton loaders for packages
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="p-3 sm:p-4 glass h-full">
                      <Skeleton className="h-5 w-16 mb-2" />
                      <Skeleton className="h-7 w-24 mb-3" />
                      <div className="space-y-2 mb-3 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-5 w-full" />
                    </Card>
                  ))
                ) : (
                  (packages.length > 0 ? packages : defaultPackages).slice(0, 3).map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-3 sm:p-4 cursor-pointer transition-smooth glass relative h-full flex flex-col ${
                      selectedPackage === pkg.id
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      setSelectedPackageId(pkg.id); // Use the actual package ID from API
                      setCustomCredits("");
                      setPaymentMethod(""); // Reset payment method when package changes
                    }}
                  >
                    {pkg.is_popular && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1">
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="font-heading text-base sm:text-lg font-bold mb-2 text-foreground">{pkg.name}</h3>
                    <div className="mb-3">
                      <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                        TZS {pkg.unit_price}/SMS
                      </p>
                      <p className="text-xs text-text-subtle">
                        {pkg.subtitle || (pkg.id === 'lite' ? '1 to 49,999 SMS' :
                         pkg.id === 'standard' ? '50,000 to 149,999 SMS' :
                         pkg.id === 'pro' ? '250,000 SMS and above' :
                         'Custom')}
                      </p>
                    </div>
                    <div className="space-y-2 mb-3 flex-1">
                      {/* <div className="flex items-center text-xs">
                        <Check className="w-3 h-3 mr-1 text-success" />
                        <span>Never expires</span>
                      </div> */}
                      {pkg.features?.map((feature, i) => (
                        <div key={i} className="flex items-start text-xs text-foreground">
                          <Check className="w-3 h-3 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {selectedPackage === pkg.id && (
                      <Badge variant="secondary" className="w-full justify-center text-[10px] mt-auto">
                        Selected
                      </Badge>
                    )}
                  </Card>
                  ))
                )}
              </div>
            </div>

            {/* Custom Amount */}
            <Card className="p-4 sm:p-6 glass">
              <h3 className="font-heading text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {t('enter_custom_amount')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Number of SMS Credits</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={customCredits !== "" ? customCredits : (selectedPackage ? String(selectedPkg?.credits || "") : "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomCredits(value);
                      if (selectedPackage) {
                        // Switch to custom mode when user edits credits
                        setSelectedPackage("");
                        setSelectedPackageId("");
                      }
                      setPaymentMethod(""); // Reset payment method when custom amount changes
                    }}
                    onFocus={() => {
                      if (selectedPackage && customCredits === "") {
                        // Prefill with selected package credits, then switch to custom mode
                        setCustomCredits(String(selectedPkg?.credits || ""));
                        setSelectedPackage("");
                        setSelectedPackageId("");
                      }
                    }}
                    className={`glass-subtle border-0 h-9 text-sm ${
                      customCreditsError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    min="100"
                  />
                  {selectedPackage && customCredits === "" ? (
                  <p className="text-xs text-text-subtle">{t('base_credits_from_package')}</p>
                  ) : customCreditsError ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {customCreditsError}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('total_cost')}</Label>
                  <div className="h-9 px-3 rounded-lg glass-subtle flex items-center text-base font-semibold">
                    {isCalculatingCustom ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('calculating')}
                      </div>
                    ) : (
                      `TZS ${customPrice.toLocaleString()}`
                    )}
                  </div>
                </div>
              </div>

              {/* Custom SMS Pricing Details */}
              {parsedCredits > 0 && !selectedPackage && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Tier:</span>
                      <Badge variant="secondary">{customSMSState?.activeTier || activeTier?.name}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-subtle">Unit Price:</span>
                      <span className="text-sm font-medium">TZS {customSMSState?.unitPrice || activeTier?.rate}/SMS</span>
                    </div>
                    {customSMSState?.savingsPercentage > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-subtle">Savings:</span>
                        <span className="text-sm font-medium text-success">
                          {customSMSState.savingsPercentage}% off
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-text-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span>
                  {customSMSState ? (
                    <>Dynamic pricing based on volume</>
                  ) : (
                    <>Active tier: {activeTier ? (
                      <>
                        <b>{activeTier.name}</b> — {activeTier.rangeLabel} — {activeTier.id === 'enterprise' ? (activeTier.note || 'Custom') : `TZS ${activeTier.rate}/SMS`}
                      </>
                    ) : '—'}</>
                  )}
                </span>
                <span>Minimum 100 {t('credits')}</span>
              </div>
            </Card>

            {/* Payment Method - Only show when package or custom amount is selected */}
            {(selectedPackage || customCredits) && (
              <Card className="p-4 sm:p-6 glass">
                <h3 className="font-heading text-base sm:text-lg font-semibold mb-3">{t('select_payment_method')}</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {providersLoading ? (
                      // Skeleton loaders for payment methods
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 sm:p-3 rounded-lg glass-subtle">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))
                    ) : (
                      paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center space-x-2 p-2 sm:p-3 rounded-lg glass-subtle cursor-pointer transition-smooth ${
                          paymentMethod === method.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} className="h-4 w-4" />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            method.id === 'mpesa' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            method.id === 'tigopesa' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            method.id === 'airtel' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                            method.id === 'bank' ? 'bg-muted text-foreground' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {method.id === 'bank' ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Smartphone className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{method.name}</p>
                            <p className="text-xs text-text-subtle">
                              {method.id === 'mpesa' ? 'Vodacom Tanzania' :
                               method.id === 'tigopesa' ? 'Tigo Tanzania' :
                               method.id === 'airtel' ? 'Airtel Tanzania' :
                               method.id === 'bank' ? 'Halo Pesa Transfer' :
                               'Mobile Money'}
                            </p>
                          </div>
                        </Label>
                      </div>
                      ))
                    )}
                  </div>
                </RadioGroup>

                {/* Payment Number Input */}
                {paymentMethod && (
                  <div className="mt-3 space-y-1">
                    <Label htmlFor="paymentNumber" className="text-sm">
                      {paymentMethod === 'vodacom' ? 'M-Pesa Number (Vodacom)' :
                       paymentMethod === 'tigo' ? 'Tigo Pesa Number' :
                       paymentMethod === 'airtel' ? 'Airtel Money Number' :
                       paymentMethod === 'halotel' ? 'Halotel Money Number' :
                       'Mobile Money Number'}
                    </Label>
                    <Input
                      id="paymentNumber"
                      type="text"
                      placeholder={
                        paymentMethod === 'vodacom' ? 'e.g., 0762 123 456' :
                        paymentMethod === 'tigo' ? 'e.g., 0652 123 456' :
                        paymentMethod === 'airtel' ? 'e.g., 0682 123 456' :
                        paymentMethod === 'halotel' ? 'e.g., 0682 123 456' :
                        'e.g., 0762 123 456'
                      }
                      value={userPaymentNumber}
                      onChange={(e) => setUserPaymentNumber(e.target.value)}
                      className="glass-subtle border-0 h-9 text-sm"
                    />
                    <p className="text-xs text-text-subtle">
                      {t('enter_phone_number_mobile_money')}
                    </p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="userEmail" className="text-sm font-medium text-foreground">
                    {t('email_address')}
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="e.g., sway@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="glass-subtle border-0 h-9 text-sm"
                  />
                  <p className="text-xs text-text-subtle">
                    {t('receipt_and_confirmation')}
                  </p>
                </div>

                {/* Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="userName" className="text-sm font-medium text-foreground">
                    {t('full_name')}
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Enter Full Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="glass-subtle border-0 h-9 text-sm"
                  />
                  <p className="text-xs text-text-subtle">
                    {t('full_name_account')}
                  </p>
                </div>
              </Card>
            )}

            {/* Proceed Button */}
            {(selectedPackage || customCredits) && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handlePurchase}
                  className="w-full sm:w-auto"
                  disabled={customCreditsError !== ""}
                >
                  {t('proceed_to_payment')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Invoice Dialog */}
            <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
              <DialogContent className="glass max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base sm:text-lg">
                    {paymentState.isActive ? t('payment_in_progress') : t('confirm_purchase')}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    {paymentState.isActive
                      ? t('complete_payment_mobile')
                      : t('review_order')
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  {/* Payment Progress */}
                  {paymentState.isActive && paymentState.progress && (
                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          {paymentState.status === 'completed' ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : paymentState.status === 'failed' ? (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-xs sm:text-sm">
                            {paymentState.progress.current_step}
                          </p>
                          <p className="text-xs text-text-subtle">
                            Step {paymentState.progress.step} of {paymentState.progress.total_steps}
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={paymentState.progress.percentage || 0}
                        className="w-full mb-1"
                      />

                      <div className="space-y-1">
                        <p className="text-xs text-text-subtle">Next: {paymentState.progress.next_step}</p>
                        {paymentState.orderId && (
                          <p className="text-xs text-text-subtle font-mono">
                            Order ID: {paymentState.orderId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="space-y-1">
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span className="text-text-subtle text-xs sm:text-sm">{t('package')}</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {selectedPkg?.name || "Custom"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span className="text-text-subtle text-xs sm:text-sm">{t('sms_credits')}</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {(selectedPkg?.credits || parseInt(customCredits || "0")).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-subtle">
                      <span className="text-text-subtle text-xs sm:text-sm">{t('payment_method')}</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {paymentMethods.find(m => m.id === paymentMethod)?.name || 'Mobile Money'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-sm sm:text-base font-semibold">
                      <span>{t('total_amount')}</span>
                      <span className="text-primary">
                        TZS {(selectedPkg?.price || customPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {paymentMethod && !paymentState.isActive && (
                    <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2 text-xs sm:text-sm">
                        <Smartphone className="w-3 h-3" />
                        {t('mobile_money_payment')}
                      </h4>
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs text-text-subtle mb-1">{t('your_mobile_number')}:</p>
                          <p className="font-mono text-xs sm:text-sm font-semibold text-primary bg-background px-2 py-1 rounded border">
                            {userPaymentNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-subtle mb-1">{t('instructions')}:</p>
                          <p className="text-xs text-foreground">
                            {t('payment_instructions_text')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-1">
                  {!paymentState.isActive ? (
                    <>
                      <Button variant="outline" onClick={() => setShowInvoice(false)} disabled={processing} className="h-8 text-xs sm:text-sm">
                        {t('cancel')}
                      </Button>
                      <Button onClick={confirmPurchase} disabled={processing} className="h-8 text-xs sm:text-sm">
                        {processing ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            {t('processing')}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {t('confirm_payment')}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setShowInvoice(false)} className="h-8 text-xs sm:text-sm">
                      {t('close')}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSMS;

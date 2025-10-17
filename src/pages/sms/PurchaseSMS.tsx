import { useMemo, useState, useEffect } from "react";
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
  Smartphone
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
import { useToast } from "@/hooks/use-toast";
import { apiClient, SMSPackage, SMSBalance, PaymentInitiationRequest, PaymentProgress } from "@/lib/api";

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

const PurchaseSMS = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [customCredits, setCustomCredits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userPaymentNumber, setUserPaymentNumber] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SMSPackage[]>([]);
  const [balance, setBalance] = useState<SMSBalance | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({ isActive: false });
  const [paymentPolling, setPaymentPolling] = useState<NodeJS.Timeout | null>(null);

  // Default packages matching the pricing table
  const defaultPackages: SMSPackage[] = useMemo(() => [
    {
      id: "lite",
      name: "Lite",
      package_type: "lite",
      credits: 5000,
      price: "150000.00", // 5000 * 30
      unit_price: "30.00",
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
      credits: 50000,
      price: "1250000.00", // 50000 * 25
      unit_price: "25.00",
      is_popular: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Never expires",
        "Priority top-up & support",
        "Advanced delivery analytics",
        "Campaign scheduling",
        "Team access"
      ],
      savings_percentage: 16.7
    },
    {
      id: "pro",
      name: "Pro",
      package_type: "pro",
      credits: 250000,
      price: "4500000.00", // 250000 * 18
      unit_price: "18.00",
      is_popular: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Never expires",
        "Bulk campaign tools",
        "Advanced analytics",
        "API access"
      ],
      savings_percentage: 28.0
    },
    {
      id: "enterprise",
      name: "Enterprise",
      package_type: "enterprise",
      credits: 1000000,
      price: "12000000.00", // 1000000 * 12
      unit_price: "12.00",
      is_popular: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      features: [
        "Never expires",
        "Dedicated account manager",
        "Custom invoicing & contracts",
        "Priority routing SLA",
        "Enterprise API & SSO"
      ],
      savings_percentage: 60.0
    }
  ], []);

  // Fetch packages and balance on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [packagesResponse, balanceResponse] = await Promise.all([
          apiClient.getSMSPackages(),
          apiClient.getSMSBalance()
        ]);

        if (packagesResponse.success && packagesResponse.data && packagesResponse.data.results.length > 0) {
          setPackages(packagesResponse.data.results);
        } else {
          // Use default packages if API doesn't return any
          setPackages(defaultPackages);
        }

        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use default packages on error
        setPackages(defaultPackages);
        toast({
          title: "Using default packages",
          description: "Could not load packages from server, using default pricing",
          variant: "default"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, defaultPackages]);

  // Cleanup payment polling on unmount
  useEffect(() => {
    return () => {
      if (paymentPolling) {
        clearInterval(paymentPolling);
      }
    };
  }, [paymentPolling]);

  const paymentMethods: PaymentMethod[] = [
    { id: "mpesa", name: "M-Pesa (Vodacom)", icon: "📱" },
    { id: "tigopesa", name: "Tigo Pesa", icon: "📱" },
    { id: "airtel", name: "Airtel Money", icon: "📱" },
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
  ];

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
    { id: "lite", name: "Lite", min: 1, max: 5000, rate: 30, rangeLabel: "1 – 5,000 SMS" },
    { id: "standard", name: "Standard", min: 5001, max: 50000, rate: 25, rangeLabel: "5,001 – 50,000 SMS" },
    { id: "pro", name: "Pro", min: 50001, max: 250000, rate: 18, rangeLabel: "50,001 – 250,000 SMS" },
    { id: "enterprise", name: "Enterprise", min: 1000000, rate: 12, note: "Custom (≤12 TZS/SMS)", rangeLabel: "Enterprise (1M+ SMS)" },
  ], []);

  const selectedPkg = defaultPackages.find(p => p.id === selectedPackage);
  const parsedCredits = useMemo(() => {
    if (selectedPackage) {
      return selectedPkg?.credits || 0;
    }
    return Math.max(parseInt(customCredits || "0", 10) || 0, 0);
  }, [selectedPackage, selectedPkg, customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits <= 5000) return tiers[0];
    if (parsedCredits <= 50000) return tiers[1];
    if (parsedCredits <= 250000) return tiers[2];
    return tiers[3];
  }, [parsedCredits, tiers]);

  const customPrice = useMemo(() => {
    if (selectedPackage) {
      // Package selected - use package price
      return selectedPkg ? parseFloat(selectedPkg.price) : 0;
    }
    // Custom credits - calculate based on tier
    if (!parsedCredits) return 0;
    if (!activeTier) return 0;
    if (activeTier.id === "enterprise") return parsedCredits * (activeTier.rate || 12);
    return parsedCredits * (activeTier.rate as number);
  }, [selectedPackage, selectedPkg, parsedCredits, activeTier]);

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
      console.error('Error polling payment status:', error);
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
      let selectedPkg;
      let credits;
      let totalPrice;

      if (selectedPackage) {
        // Package selected - use full package details
        selectedPkg = defaultPackages.find(pkg => pkg.id === selectedPackage);
      if (!selectedPkg) {
        toast({
          title: "Invalid package",
          description: "Please select a valid package",
            variant: "destructive"
          });
          setProcessing(false);
          return;
        }
        credits = selectedPkg.credits;
        totalPrice = parseFloat(selectedPkg.price);
      } else if (customCredits) {
        // Custom credits entered - calculate based on tier
        credits = parseInt(customCredits);
        totalPrice = customPrice;
      } else {
        toast({
          title: "No selection",
          description: "Please select a package or enter custom credits",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      // Initiate payment with ZenoPay
      const paymentData: PaymentInitiationRequest = {
        package_id: selectedPackage || 'custom',
        buyer_email: userEmail,
        buyer_name: userName,
        buyer_phone: userPaymentNumber,
        payment_method: paymentMethod
      };

      const response = await apiClient.initiatePayment(paymentData);

      if (response.success && response.data) {
        const { transaction_id, order_id } = response.data;

        setPaymentState({
          transactionId: transaction_id,
          orderId: order_id,
          status: 'pending',
          progress: response.data.progress,
          isActive: true
        });

        // Start polling for payment status
        const pollingInterval = setInterval(() => {
          pollPaymentStatus(transaction_id);
        }, 5000); // Poll every 5 seconds

        setPaymentPolling(pollingInterval);

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
        toast({
          title: "Payment failed",
          description: response.error || "Failed to initiate payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      setProcessing(false);
      console.error('Payment error:', error);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto px-[max(16px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
          <div className="mx-auto w-[92vw] max-w-[1200px] space-y-4 lg:space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-foreground mb-2">
                Purchase SMS Credits
              </h1>
              <p className="text-[clamp(0.875rem,2vw,1rem)] text-text-subtle">
                Top up your account to send more messages
              </p>
            </div>

            {/* Balance Card */}
            <Card className="p-4 sm:p-6 glass">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[clamp(0.75rem,2vw,0.875rem)] text-text-subtle mb-1">Current Balance</p>
                  <p className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-foreground">
                    {balance?.credits?.toLocaleString() || 0} <span className="text-[clamp(0.875rem,2vw,1.125rem)] font-normal text-text-subtle">SMS</span>
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
              </div>
            </Card>

            {/* Package Selection */}
            <div>
              <h2 className="font-heading text-[clamp(1rem,2.5vw,1.25rem)] font-semibold mb-4">Choose a Package</h2>
              <div className="grid gap-3 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {defaultPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`[container-type:inline-size] p-4 sm:p-6 cursor-pointer transition-smooth glass relative ${
                      selectedPackage === pkg.id
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      setCustomCredits("");
                      setPaymentMethod("");
                      setUserPaymentNumber("");
                      setUserEmail("");
                      setUserName("");
                    }}
                  >
                    {pkg.is_popular && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[clamp(0.625rem,1.5vw,0.75rem)]">
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="font-heading text-[clamp(1rem,2vw,1.25rem)] font-semibold mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <p className="text-[clamp(1.25rem,3vw,1.875rem)] font-bold text-foreground">
                        TZS {pkg.unit_price}/SMS
                      </p>
                      <p className="text-[clamp(0.625rem,1.5vw,0.875rem)] text-text-subtle">
                        {pkg.id === 'lite' ? '1 – 5,000 SMS' :
                         pkg.id === 'standard' ? '5,001 – 50,000 SMS' :
                         pkg.id === 'pro' ? '50,001 – 250,000 SMS' :
                         'Enterprise (1M+ SMS)'}
                      </p>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-[clamp(0.75rem,1.5vw,0.875rem)]">
                        <Check className="w-4 h-4 mr-2 text-success flex-shrink-0" />
                        <span>Never expires</span>
                      </div>
                      {pkg.features?.map((feature, i) => (
                        <div key={i} className="flex items-center text-[clamp(0.75rem,1.5vw,0.875rem)]">
                          <Check className="w-4 h-4 mr-2 text-success flex-shrink-0" />
                          <span className="truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                    {selectedPackage === pkg.id && (
                      <Badge variant="secondary" className="w-full justify-center text-[clamp(0.75rem,1.5vw,0.875rem)]">
                        Selected
                      </Badge>
                    )}
                  </Card>
                ))}
                </div>
            </div>

            {/* Custom Amount */}
            <Card className="p-4 sm:p-6 glass">
              <h3 className="font-heading text-[clamp(0.875rem,2vw,1.125rem)] font-semibold mb-4">Or Enter Custom Amount</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[clamp(0.75rem,1.5vw,0.875rem)]">Number of SMS Credits</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={customCredits}
                    onChange={(e) => {
                      setCustomCredits(e.target.value);
                      setSelectedPackage("");
                      setPaymentMethod("");
                      setUserPaymentNumber("");
                      setUserEmail("");
                      setUserName("");
                    }}
                    className="glass-subtle border-0 text-[clamp(0.875rem,2vw,1rem)]"
                    min="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[clamp(0.75rem,1.5vw,0.875rem)]">Total Cost</Label>
                  <div className="h-10 px-3 rounded-lg glass-subtle flex items-center text-[clamp(1rem,2vw,1.125rem)] font-semibold">
                    TZS {customPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-text-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>
                  Active tier: {activeTier ? (
                    <>
                      <b>{activeTier.name}</b> — {activeTier.rangeLabel} — {activeTier.id === 'enterprise' ? (activeTier.note || 'Custom') : `TZS ${activeTier.rate}/SMS`}
                    </>
                  ) : '—'}
                </span>
                <span>Minimum 100 credits</span>
              </div>
            </Card>

            {/* Payment Method - Only show after package selection */}
            {(selectedPackage || customCredits) && (
            <Card className="p-4 sm:p-6 glass">
                <h3 className="font-heading text-[clamp(0.875rem,2vw,1.125rem)] font-semibold mb-4">Select Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg glass-subtle cursor-pointer transition-smooth ${
                          paymentMethod === method.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            method.id === 'mpesa' ? 'bg-green-100 text-green-600' :
                            method.id === 'tigopesa' ? 'bg-blue-100 text-blue-600' :
                            method.id === 'airtel' ? 'bg-red-100 text-red-600' :
                            method.id === 'bank' ? 'bg-gray-100 text-gray-600' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {method.id === 'bank' ? (
                              <CreditCard className="w-5 h-5" />
                            ) : (
                              <Smartphone className="w-5 h-5" />
                            )}
                          </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[clamp(0.75rem,1.5vw,0.875rem)] truncate">{method.name}</p>
                              <p className="text-[clamp(0.625rem,1.25vw,0.75rem)] text-text-subtle truncate">
                              {method.id === 'mpesa' ? 'Vodacom Tanzania' :
                               method.id === 'tigopesa' ? 'Tigo Tanzania' :
                               method.id === 'airtel' ? 'Airtel Tanzania' :
                               method.id === 'bank' ? 'Bank Account Transfer' :
                               'Mobile Money'}
                            </p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Payment Number Input */}
                {paymentMethod && (
                  <div className="mt-4 sm:mt-6 space-y-2">
                    <Label htmlFor="paymentNumber">
                      {paymentMethod === 'mpesa' ? 'M-Pesa Number (Vodacom)' :
                       paymentMethod === 'tigopesa' ? 'Tigo Pesa Number' :
                       paymentMethod === 'airtel' ? 'Airtel Money Number' :
                       paymentMethod === 'bank' ? 'Bank Account Number' :
                       paymentMethod === 'card' ? 'Card Number' :
                       'Account Number'}
                    </Label>
                    <Input
                      id="paymentNumber"
                      type="text"
                      placeholder={
                        paymentMethod === 'mpesa' ? 'e.g., 0762 123 456' :
                        paymentMethod === 'tigopesa' ? 'e.g., 0652 123 456' :
                        paymentMethod === 'airtel' ? 'e.g., 0682 123 456' :
                        paymentMethod === 'bank' ? 'e.g., 1234567890' :
                        paymentMethod === 'card' ? 'e.g., 1234 5678 9012 3456' :
                        'e.g., 1234567890'
                      }
                      value={userPaymentNumber}
                      onChange={(e) => setUserPaymentNumber(e.target.value)}
                      className="glass-subtle border-0"
                    />
                    <p className="text-xs text-text-subtle">
                      {paymentMethod === 'mpesa' || paymentMethod === 'tigopesa' || paymentMethod === 'airtel'
                        ? 'Enter the phone number associated with your mobile money account'
                        : paymentMethod === 'bank'
                        ? 'Enter your bank account number for transfer'
                        : 'Enter your account or card number for payment processing'
                      }
                    </p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="glass-subtle border-0"
                  />
                  <p className="text-xs text-text-subtle">
                    We'll send you a receipt and payment confirmation
                  </p>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="e.g., John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="glass-subtle border-0"
                  />
                  <p className="text-xs text-text-subtle">
                    Your full name as it appears on your mobile money account
                  </p>
                </div>
              </Card>
            )}

            {/* Proceed Button - Only show when package and payment method are selected */}
            {(selectedPackage || customCredits) && paymentMethod && (
              <div className="flex justify-end">
                <Button size="lg" onClick={handlePurchase} className="w-full sm:w-auto text-[clamp(0.875rem,2vw,1rem)] py-3 px-6">
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Invoice Dialog */}
            <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
              <DialogContent className="glass max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {paymentState.isActive ? "Payment in Progress" : "Confirm Purchase"}
                  </DialogTitle>
                  <DialogDescription>
                    {paymentState.isActive
                      ? "Please complete the payment on your mobile device"
                      : "Review your order before proceeding"
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                  {/* Payment Progress */}
                  {paymentState.isActive && paymentState.progress && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          {paymentState.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : paymentState.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {paymentState.progress.current_step}
                          </p>
                          <p className="text-sm text-text-subtle">
                            Step {paymentState.progress.step} of {paymentState.progress.total_steps}
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={paymentState.progress.percentage || 0}
                        className="w-full mb-3"
                      />

                      <div className="space-y-2">
                        <p className="text-sm text-text-subtle">Next: {paymentState.progress.next_step}</p>
                        {paymentState.orderId && (
                          <p className="text-xs text-text-subtle font-mono">
                            Order ID: {paymentState.orderId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                      <span className="text-text-subtle">Package</span>
                      <span className="font-medium">
                        {selectedPkg?.name || "Custom"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                      <span className="text-text-subtle">SMS Credits</span>
                      <span className="font-medium">
                        {(selectedPkg?.credits || parseInt(customCredits || "0")).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                      <span className="text-text-subtle">Payment Method</span>
                      <span className="font-medium">
                        {paymentMethods.find(m => m.id === paymentMethod)?.name || 'Mobile Money'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-semibold">
                      <span>Total Amount</span>
                      <span className="text-primary">
                        TZS {(selectedPkg?.price || customPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {paymentMethod && !paymentState.isActive && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
                        {paymentMethod === 'bank' ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Bank Transfer Payment
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4" />
                            Mobile Money Payment
                          </>
                        )}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-text-subtle mb-1">
                            {paymentMethod === 'bank' ? 'Your Account Number:' : 'Your Mobile Number:'}
                          </p>
                          <p className="font-mono text-lg font-semibold text-primary bg-background px-3 py-2 rounded border">
                            {userPaymentNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-subtle mb-1">Instructions:</p>
                          <p className="text-sm text-foreground">
                            {paymentMethod === 'bank'
                              ? 'Transfer the amount to the provided bank account. Your SMS credits will be added after verification.'
                              : 'After confirming payment, you\'ll receive a mobile money prompt on your phone. Complete the payment to add SMS credits to your account.'
                            }
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 sm:p-3">
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> {paymentMethod === 'bank'
                              ? 'Bank transfers may take 1-2 business days to process.'
                              : 'Payment will be processed through ZenoPay mobile money integration.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  {!paymentState.isActive ? (
                    <>
                      <Button variant="outline" onClick={() => setShowInvoice(false)} disabled={processing}>
                        Cancel
                      </Button>
                      <Button onClick={confirmPurchase} disabled={processing}>
                        {processing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Confirm Payment
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setShowInvoice(false)}>
                      Close
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

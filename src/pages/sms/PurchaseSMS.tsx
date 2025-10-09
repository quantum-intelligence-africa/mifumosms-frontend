import { useMemo, useState } from "react";
import {
  CreditCard,
  Wallet,
  Zap,
  Check,
  ArrowRight,
  Download,
  RefreshCw
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
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
import { useToast } from "@/hooks/use-toast";

interface SMSPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  unitPrice: number;
  popular?: boolean;
  savings?: string;
  features?: string[];
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee?: string;
}

const PurchaseSMS = () => {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [customCredits, setCustomCredits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userPaymentNumber, setUserPaymentNumber] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Demo balance - replace with actual API call
  const currentBalance = 1250;

  // Four SMS tiers to match Landing page
  const packages: SMSPackage[] = [
    {
      id: "lite",
      name: "Lite",
      credits: 5000,
      price: 5000 * 30,
      unitPrice: 30,
      features: [
        "Instant top-up",
        "Basic delivery reports",
        "Email receipt",
      ],
    },
    {
      id: "standard",
      name: "Standard",
      credits: 50000,
      price: 50000 * 25,
      unitPrice: 25,
      popular: true,
      features: [
        "Priority top-up & support",
        "Advanced delivery analytics",
        "Campaign scheduling",
        "Team access",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      credits: 250000,
      price: 250000 * 18,
      unitPrice: 18,
      features: [
        "Bulk campaign tools",
        "Advanced analytics",
        "API access",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 1000000,
      price: 1000000 * 12,
      unitPrice: 12,
      features: [
        "Dedicated account manager",
        "Custom invoicing & contracts",
        "Priority routing SLA",
        "Enterprise API & SSO",
      ],
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    { id: "mpesa", name: "M-Pesa", icon: "📱" },
    { id: "tigopesa", name: "Tigo Pesa", icon: "📱" },
    { id: "airtel", name: "Airtel Money", icon: "📱" },
    { id: "card", name: "Credit/Debit Card", icon: "💳", fee: "3.5%" },
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
  const tiers: Tier[] = [
    { id: "lite", name: "Lite", min: 1, max: 5000, rate: 30, rangeLabel: "1 – 5,000 SMS" },
    { id: "standard", name: "Standard", min: 5001, max: 50000, rate: 25, rangeLabel: "5,001 – 50,000 SMS" },
    { id: "pro", name: "Pro", min: 50001, max: 250000, rate: 18, rangeLabel: "50,001 – 250,000 SMS" },
    { id: "enterprise", name: "Enterprise", min: 1000000, rate: 12, note: "Custom (≤12 TZS/SMS)", rangeLabel: "Enterprise (1M+ SMS)" },
  ];

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const parsedCredits = useMemo(() => Math.max(parseInt(customCredits || "0", 10) || 0, 0), [customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits <= 5000) return tiers[0];
    if (parsedCredits <= 50000) return tiers[1];
    if (parsedCredits <= 250000) return tiers[2];
    return tiers[3];
  }, [parsedCredits]);

  const customPrice = useMemo(() => {
    if (!parsedCredits) return 0;
    if (!activeTier) return 0;
    if (activeTier.id === "enterprise") return parsedCredits * (activeTier.rate || 12);
    return parsedCredits * (activeTier.rate as number);
  }, [parsedCredits, activeTier]);

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
        description: "Please enter your payment number or account details",
        variant: "destructive"
      });
      return;
    }

    setShowInvoice(true);
  };

  const confirmPurchase = async () => {
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setShowInvoice(false);
      toast({
        title: "Purchase successful!",
        description: `${selectedPkg?.credits || customCredits} SMS credits added to your account`,
      });
      setSelectedPackage("");
      setCustomCredits("");
      setPaymentMethod("");
      setUserPaymentNumber("");
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Purchase SMS Credits
              </h1>
              <p className="text-text-subtle">
                Top up your account to send more messages
              </p>
            </div>

            {/* Balance Card */}
            <Card className="p-6 glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-subtle mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-foreground">
                    {currentBalance.toLocaleString()} <span className="text-lg font-normal text-text-subtle">SMS</span>
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            </Card>

            {/* Package Selection */}
            <div>
              <h2 className="font-heading text-xl font-semibold mb-4">Choose a Package</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-6 cursor-pointer transition-smooth glass ${
                      selectedPackage === pkg.id
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      setCustomCredits("");
                    }}
                  >
                    {pkg.popular && (
                      <Badge className="mb-3">Most Popular</Badge>
                    )}
                    <h3 className="font-heading text-xl font-semibold mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-foreground">
                        TZS {pkg.unitPrice}/SMS
                      </p>
                      <p className="text-sm text-text-subtle">
                        {pkg.id === 'lite' ? '1 – 5,000 SMS' :
                         pkg.id === 'standard' ? '5,001 – 50,000 SMS' :
                         pkg.id === 'pro' ? '50,001 – 250,000 SMS' :
                         'Enterprise (1M+ SMS)'}
                      </p>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2 text-success" />
                        <span>Never expires</span>
                      </div>
                      {pkg.features?.map((feature, i) => (
                        <div key={i} className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {selectedPackage === pkg.id && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Selected
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <Card className="p-6 glass">
              <h3 className="font-heading text-lg font-semibold mb-4">Or Enter Custom Amount</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of SMS Credits</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={customCredits}
                    onChange={(e) => {
                      setCustomCredits(e.target.value);
                      setSelectedPackage("");
                    }}
                    className="glass-subtle border-0"
                    min="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Cost</Label>
                  <div className="h-10 px-3 rounded-lg glass-subtle flex items-center text-lg font-semibold">
                    TZS {customPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-text-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-2">
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

            {/* Payment Method */}
            {(selectedPackage || customCredits) && (
              <Card className="p-6 glass">
                <h3 className="font-heading text-lg font-semibold mb-4">Select Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid md:grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center space-x-3 p-4 rounded-lg glass-subtle cursor-pointer transition-smooth ${
                          paymentMethod === method.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <p className="font-medium">{method.name}</p>
                            {method.fee && (
                              <p className="text-xs text-text-subtle">Fee: {method.fee}</p>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Payment Number Input */}
                {paymentMethod && (
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="paymentNumber">
                      {paymentMethod === 'mpesa' ? 'M-Pesa Number' :
                       paymentMethod === 'tigopesa' ? 'Tigo Pesa Number' :
                       paymentMethod === 'airtel' ? 'Airtel Money Number' :
                       paymentMethod === 'card' ? 'Card Number' :
                       'Bank Account Number'}
                    </Label>
                    <Input
                      id="paymentNumber"
                      type="text"
                      placeholder={
                        paymentMethod === 'mpesa' ? 'e.g., 0762 123 456' :
                        paymentMethod === 'tigopesa' ? 'e.g., 0652 123 456' :
                        paymentMethod === 'airtel' ? 'e.g., 0682 123 456' :
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
                        : 'Enter your account or card number for payment processing'
                      }
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Proceed Button */}
            {(selectedPackage || customCredits) && (
              <div className="flex justify-end">
                <Button size="lg" onClick={handlePurchase}>
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Invoice Dialog */}
            <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Confirm Purchase</DialogTitle>
                  <DialogDescription>
                    Review your order before proceeding
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
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
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      TZS {(selectedPkg?.price || customPrice).toLocaleString()}
                    </span>
                  </div>

                  {/* Payment Details Section */}
                  {paymentMethod && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Instructions
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-text-subtle mb-1">Your Payment Details:</p>
                          <p className="font-mono text-lg font-semibold text-primary bg-background px-3 py-2 rounded border">
                            {userPaymentNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-subtle mb-1">Instructions:</p>
                          <p className="text-sm text-foreground">
                            {paymentMethod === 'mpesa' || paymentMethod === 'tigopesa' || paymentMethod === 'airtel'
                              ? `Send money to our ${paymentMethods.find(m => m.id === paymentMethod)?.name} number and include your account reference`
                              : `Use this ${paymentMethods.find(m => m.id === paymentMethod)?.name} for payment processing`
                            }
                          </p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Important:</strong> Please include your account reference in the payment description to ensure proper credit allocation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
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

import { useState } from "react";
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Demo balance - replace with actual API call
  const currentBalance = 1250;

  const packages: SMSPackage[] = [
    {
      id: "starter",
      name: "Starter",
      credits: 500,
      price: 10000,
      unitPrice: 20,
    },
    {
      id: "business",
      name: "Business",
      credits: 2000,
      price: 35000,
      unitPrice: 17.5,
      popular: true,
      savings: "12%",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 10000,
      price: 150000,
      unitPrice: 15,
      savings: "25%",
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    { id: "mpesa", name: "M-Pesa", icon: "📱" },
    { id: "tigopesa", name: "Tigo Pesa", icon: "📱" },
    { id: "airtel", name: "Airtel Money", icon: "📱" },
    { id: "card", name: "Credit/Debit Card", icon: "💳", fee: "3.5%" },
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
  ];

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const customPrice = customCredits ? parseInt(customCredits) * 20 : 0;

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
              <div className="grid md:grid-cols-3 gap-4">
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
                        TZS {pkg.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-text-subtle">
                        {pkg.credits.toLocaleString()} SMS credits
                      </p>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2 text-success" />
                        <span>TZS {pkg.unitPrice}/SMS</span>
                      </div>
                      {pkg.savings && (
                        <div className="flex items-center text-sm">
                          <Zap className="w-4 h-4 mr-2 text-warning" />
                          <span>Save {pkg.savings}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2 text-success" />
                        <span>Never expires</span>
                      </div>
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
              <p className="text-sm text-text-subtle mt-2">
                Custom rate: TZS 20/SMS (minimum 100 credits)
              </p>
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

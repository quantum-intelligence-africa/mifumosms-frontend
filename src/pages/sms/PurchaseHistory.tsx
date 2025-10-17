import { useState } from "react";
import {
  Download,
  FileText,
  Filter,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Eye
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type PurchaseStatus = "completed" | "pending" | "failed" | "refunded";

interface Purchase {
  id: string;
  invoice_no: string;
  date: string;
  package_name: string;
  credits: number;
  amount_tzs: number;
  payment_method: string;
  status: PurchaseStatus;
  receipt_url?: string;
  gateway_ref?: string;
}

const PurchaseHistory = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Demo data - replace with actual API calls
  const purchases: Purchase[] = [
    {
      id: "1",
      invoice_no: "INV-2024-001",
      date: "2024-03-15T14:30:00Z",
      package_name: "Business Package",
      credits: 2000,
      amount_tzs: 35000,
      payment_method: "M-Pesa",
      status: "completed",
      receipt_url: "#",
      gateway_ref: "MPESA-ABC123",
    },
    {
      id: "2",
      invoice_no: "INV-2024-002",
      date: "2024-03-10T10:20:00Z",
      package_name: "Starter Package",
      credits: 500,
      amount_tzs: 10000,
      payment_method: "Tigo Pesa",
      status: "completed",
      receipt_url: "#",
      gateway_ref: "TIGO-XYZ789",
    },
    {
      id: "3",
      invoice_no: "INV-2024-003",
      date: "2024-03-08T16:45:00Z",
      package_name: "Custom Top-up",
      credits: 1000,
      amount_tzs: 20000,
      payment_method: "Airtel Money",
      status: "pending",
      gateway_ref: "AIRTEL-DEF456",
    },
    {
      id: "4",
      invoice_no: "INV-2024-004",
      date: "2024-03-05T09:15:00Z",
      package_name: "Enterprise Package",
      credits: 10000,
      amount_tzs: 150000,
      payment_method: "Bank Transfer",
      status: "completed",
      receipt_url: "#",
      gateway_ref: "BANK-GHI321",
    },
    {
      id: "5",
      invoice_no: "INV-2024-005",
      date: "2024-03-01T11:30:00Z",
      package_name: "Business Package",
      credits: 2000,
      amount_tzs: 35000,
      payment_method: "Credit Card",
      status: "failed",
      gateway_ref: "CARD-JKL654",
    },
  ];

  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "refunded":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: PurchaseStatus) => {
    const variants: Record<PurchaseStatus, "default" | "secondary" | "outline" | "destructive"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.package_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter;
    const matchesMethod = methodFilter === "all" || purchase.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalSpent = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount_tzs, 0);

  const totalCredits = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.credits, 0);

  const viewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetails(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Purchase History
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                View all your SMS credit purchases and transactions
              </p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Spent</p>
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">TZS {totalSpent.toLocaleString()}</p>
              </Card>

              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Credits Purchased</p>
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
              </Card>

              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Transactions</p>
                  <CheckCircle2 className="w-5 h-5 text-warning" />
                </div>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 glass">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                    <Input
                      placeholder="Invoice or package..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-subtle border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="glass-subtle border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="glass-subtle border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Tigo Pesa">Tigo Pesa</SelectItem>
                      <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Purchases Table */}
            <Card className="glass">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle">
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id} className="border-border-subtle">
                      <TableCell>
                        <span className="font-mono font-medium">{purchase.invoice_no}</span>
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {formatDate(purchase.date)}
                      </TableCell>
                      <TableCell>{purchase.package_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchase.credits.toLocaleString()} SMS</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        TZS {purchase.amount_tzs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {purchase.payment_method}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(purchase)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {purchase.receipt_url && (
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPurchases.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    No purchases found
                  </h3>
                  <p className="text-text-subtle">
                    No transactions match your current filters
                  </p>
                </div>
              )}
            </Card>

            {/* Purchase Details Sheet */}
            <Sheet open={showDetails} onOpenChange={setShowDetails}>
              <SheetContent className="glass w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="text-sm sm:text-base">Purchase Details</SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm">
                    Transaction information and timeline
                  </SheetDescription>
                </SheetHeader>

                {selectedPurchase && (
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {/* Invoice Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Invoice Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Invoice No.</span>
                          <span className="font-mono font-medium">{selectedPurchase.invoice_no}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Date</span>
                          <span>{formatDate(selectedPurchase.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Status</span>
                          {getStatusBadge(selectedPurchase.status)}
                        </div>
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Package Details</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Package</span>
                          <span className="font-medium">{selectedPurchase.package_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">SMS Credits</span>
                          <span className="font-medium">{selectedPurchase.credits.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Unit Price</span>
                          <span>TZS {(selectedPurchase.amount_tzs / selectedPurchase.credits).toFixed(2)}/SMS</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Payment Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Method</span>
                          <span className="font-medium">{selectedPurchase.payment_method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Gateway Ref</span>
                          <span className="font-mono text-xs">{selectedPurchase.gateway_ref}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                          <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                          <span className="text-base sm:text-lg font-bold text-primary">
                            TZS {selectedPurchase.amount_tzs.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {selectedPurchase.receipt_url && (
                        <Button variant="outline" className="w-full text-sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                      {selectedPurchase.status === "pending" && (
                        <Button variant="outline" className="w-full text-sm">
                          Check Payment Status
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;

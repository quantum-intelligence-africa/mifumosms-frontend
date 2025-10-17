import { useState, useEffect } from "react";
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
  Eye,
  Smartphone,
  Zap,
  AlertCircle,
  RefreshCw
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
import { apiClient, ZenoPayTransactionListResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type PurchaseStatus = "completed" | "pending" | "failed" | "refunded" | "processing" | "cancelled";

interface ZenoPayTransaction {
  id: string;
  order_id: string;
  zenopay_order_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  payment_method: string;
  payment_method_display: string;
  status: string;
  status_display: string;
  zenopay_reference?: string;
  zenopay_transid?: string;
  zenopay_channel?: string;
  zenopay_msisdn?: string;
  webhook_received: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  error_message?: string;
  purchase_data: {
    id: string;
    package_name: string;
    credits: number;
    unit_price: number;
  };
}

const PurchaseHistory = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<ZenoPayTransaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [transactions, setTransactions] = useState<ZenoPayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getZenoPayTransactions({
          page,
          page_size: 20,
          status: statusFilter !== "all" ? statusFilter : undefined
        });

        if (response.success && response.data) {
          setTransactions(response.data.results);
          setTotalCount(response.data.count);
        } else {
          // Enhanced error handling based on documentation
          let errorMessage = "Failed to load purchase history";
          
          if (response.error?.includes("Authentication")) {
            errorMessage = "Please log in again to view your transaction history";
          } else if (response.error?.includes("Network")) {
            errorMessage = "Network error. Please check your connection and try again";
          } else if (response.error?.includes("Permission")) {
            errorMessage = "You don't have permission to view this data";
          } else if (response.message) {
            errorMessage = response.message;
          } else if (response.error) {
            errorMessage = response.error;
          }

          toast({
            title: "Error loading transactions",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error loading transactions",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, statusFilter, toast]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "processing":
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      completed: "default",
      pending: "secondary",
      processing: "outline",
      failed: "destructive",
      cancelled: "outline",
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method.toLowerCase().includes('zenopay') || method.toLowerCase().includes('mobile money')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('transfer')) {
      return <CreditCard className="w-4 h-4" />;
    }
    return <Smartphone className="w-4 h-4" />;
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.purchase_data.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.order_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesMethod = methodFilter === "all" || transaction.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalSpent = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.purchase_data.credits, 0);

  const viewDetails = (transaction: ZenoPayTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Purchase History
              </h1>
              <p className="text-text-subtle">
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
                <p className="text-2xl font-bold">{totalCount}</p>
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
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
                      <SelectItem value="zenopay_mobile_money">ZenoPay Mobile Money</SelectItem>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Clock className="w-6 h-6 animate-spin mr-2" />
                          Loading transactions...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-border-subtle">
                      <TableCell>
                        <span className="font-mono font-medium">{transaction.invoice_number}</span>
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>{transaction.purchase_data.package_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.purchase_data.credits.toLocaleString()} SMS</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        TZS {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-text-subtle flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.payment_method)}
                        {transaction.payment_method_display}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(transaction)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {transaction.status === "completed" && (
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

              {!loading && filteredTransactions.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    No transactions found
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

                {selectedTransaction && (
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {/* Transaction Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Transaction Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Invoice No.</span>
                          <span className="font-mono font-medium">{selectedTransaction.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Order ID</span>
                          <span className="font-mono text-xs">{selectedTransaction.order_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">ZenoPay Order ID</span>
                          <span className="font-mono text-xs">{selectedTransaction.zenopay_order_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Date</span>
                          <span>{formatDate(selectedTransaction.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Status</span>
                          {getStatusBadge(selectedTransaction.status)}
                        </div>
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Package Details</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Package</span>
                          <span className="font-medium">{selectedTransaction.purchase_data.package_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">SMS Credits</span>
                          <span className="font-medium">{selectedTransaction.purchase_data.credits.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Unit Price</span>
                          <span>TZS {selectedTransaction.purchase_data.unit_price.toFixed(2)}/SMS</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Payment Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Method</span>
                          <span className="font-medium flex items-center gap-1">
                            {getPaymentMethodIcon(selectedTransaction.payment_method)}
                            {selectedTransaction.payment_method_display}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Buyer Name</span>
                          <span className="font-medium">{selectedTransaction.buyer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Buyer Email</span>
                          <span className="font-mono text-xs">{selectedTransaction.buyer_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Buyer Phone</span>
                          <span className="font-mono text-xs">{selectedTransaction.buyer_phone}</span>
                        </div>
                        {selectedTransaction.zenopay_reference && (
                          <div className="flex justify-between">
                            <span className="text-text-subtle">ZenoPay Reference</span>
                            <span className="font-mono text-xs">{selectedTransaction.zenopay_reference}</span>
                          </div>
                        )}
                        {selectedTransaction.zenopay_channel && (
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Channel</span>
                            <span className="font-mono text-xs">{selectedTransaction.zenopay_channel}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Webhook Received</span>
                          <span className={selectedTransaction.webhook_received ? "text-success" : "text-warning"}>
                            {selectedTransaction.webhook_received ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                          <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                          <span className="text-base sm:text-lg font-bold text-primary">
                            TZS {selectedTransaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {selectedTransaction.status === "completed" && (
                        <Button variant="outline" className="w-full text-sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                      {(selectedTransaction.status === "pending" || selectedTransaction.status === "processing") && (
                        <Button variant="outline" className="w-full text-sm">
                          <Zap className="w-4 h-4 mr-2" />
                          Check Payment Status
                        </Button>
                      )}
                      {selectedTransaction.error_message && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="font-medium text-destructive">Error</span>
                          </div>
                          <p className="text-destructive text-xs">{selectedTransaction.error_message}</p>
                        </div>
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

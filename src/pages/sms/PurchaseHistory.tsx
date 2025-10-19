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
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight
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
import { useToast } from "@/hooks/use-toast";
import { apiClient, Purchase } from "@/lib/api";

type PurchaseStatus = "completed" | "pending" | "failed" | "cancelled";

const PurchaseHistory = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Fetch purchases from NEW billing history API
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDetailedPurchaseHistory({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        page_size: pageSize
      });

      if (response.success && response.data) {
        setPurchases(response.data.purchases);
        setTotalPages(response.data.pagination.total_pages);
        setTotalCount(response.data.pagination.count);
      } else {
        toast({
          title: "Failed to load purchases",
          description: response.error || "Could not load purchase history",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error loading purchases",
        description: "Failed to load purchase history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh purchases
  const refreshPurchases = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  // Load purchases on component mount and when filters/page change
  useEffect(() => {
    fetchPurchases();
  }, [statusFilter, currentPage]);

  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-text-subtle" />;
    }
  };

  const getStatusBadge = (status: PurchaseStatus) => {
    const variants: Record<PurchaseStatus, "default" | "secondary" | "outline" | "destructive"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
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
      purchase.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.package_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter;
    const matchesMethod = methodFilter === "all" || purchase.payment_method_display === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalSpent = purchases
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

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
                      <SelectItem value="Halo Pesa">Halo Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={refreshPurchases} disabled={refreshing} className="flex-1">
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button variant="outline" className="flex-1">
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
                        <span className="font-mono font-medium">{purchase.invoice_number}</span>
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {formatDate(purchase.created_at)}
                      </TableCell>
                      <TableCell>{purchase.package_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchase.credits.toLocaleString()} SMS</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        TZS {parseFloat(purchase.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {purchase.payment_method_display}
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
                      {purchase.status === "completed" && (
                        <Button variant="ghost" size="icon" title="Download Receipt">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPurchases.length === 0 && !loading && (
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

              {loading && (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-text-subtle">Loading purchases...</p>
                </div>
              )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="p-4 glass">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-subtle">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} purchases
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

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
                          <span className="font-mono font-medium">{selectedPurchase.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Date</span>
                          <span>{formatDate(selectedPurchase.created_at)}</span>
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
                          <span>TZS {selectedPurchase.unit_price}/SMS</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Payment Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Method</span>
                          <span className="font-medium">{selectedPurchase.payment_method_display}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Payment Reference</span>
                          <span className="font-mono text-xs">{selectedPurchase.payment_reference || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                          <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                          <span className="text-base sm:text-lg font-bold text-primary">
                            TZS {parseFloat(selectedPurchase.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {selectedPurchase.status === "completed" && (
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

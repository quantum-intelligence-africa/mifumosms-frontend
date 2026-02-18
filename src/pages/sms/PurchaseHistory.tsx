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
  ChevronRight,
  TrendingUp,
  Package,
  DollarSign,
  Activity
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
import { useSMSBilling } from "@/hooks/useSMSBilling";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useLanguage } from "@/hooks/useLanguage";

const PurchaseHistory = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<{
    id: string;
    invoice_number: string;
    package_name: string;
    credits: number;
    amount: number;
    unit_price?: number;
    payment_method?: string;
    payment_method_display?: string;
    status: string;
    created_at: string;
    completed_at?: string | null;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Use unified purchase history hook - fetches from /api/billing/sms/purchases/history/
  const {
    purchases,
    pagination,
    isLoading,
    error,
    fetchPurchaseHistory,
    goToPage,
    refresh
  } = usePurchaseHistory();

  // Use SMS Billing hook for purchase stats only
  const {
    purchaseStats
  } = useSMSBilling();

  // Load purchase history on component mount
  useEffect(() => {
    fetchPurchaseHistory({
      page: currentPage,
      page_size: pageSize,
      status: statusFilter === "all" ? undefined : statusFilter
    });
  }, [currentPage, pageSize, statusFilter, fetchPurchaseHistory]);

  // Filter purchases based on search (client-side filtering for invoice number)
  const filteredPurchases = (purchases || []).filter(purchase => {
    return searchQuery === "" ||
      purchase.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.package_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const viewDetails = (purchase: {
    id: string;
    invoice_number: string;
    package_name: string;
    credits: number;
    amount: number;
    status: string;
    created_at: string;
    completed_at?: string | null;
  }) => {
    setSelectedTransaction(purchase);
    setShowDetails(true);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'completed': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
      'cancelled': 'outline',
    };
    return variants[status] || 'outline';
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format large numbers to K, M, B format
  const formatCompactNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Format amount with commas and M suffix for millions
  const formatAmount = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    return Math.floor(num).toLocaleString();
  };

  // Handle receipt download
  const downloadReceipt = (purchase: any) => {
    try {
      if (!purchase || !purchase.invoice_number) {
        toast({
          title: 'Error',
          description: 'Invoice number not found',
          variant: 'destructive'
        });
        return;
      }

      // Create a formatted receipt text
      const receiptContent = `RECEIPT\n${'='.repeat(50)}\n\nInvoice Number: ${purchase.invoice_number}\nDate: ${formatDate(purchase.created_at)}\nStatus: ${purchase.status}\n\nPackage: ${purchase.package_name || 'N/A'}\nCredits: ${(purchase.credits || 0).toLocaleString()}\nUnit Price: TZS ${(purchase.unit_price || 0).toLocaleString()}\nPayment Method: ${purchase.payment_method || 'N/A'}\n\n${'='.repeat(50)}\nTOTAL AMOUNT: TZS ${Number(purchase.amount || 0).toLocaleString()}\n${'='.repeat(50)}\n\nThank you for your purchase!`;

      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Receipt_${purchase.invoice_number.replace(/\//g, '-')}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Receipt downloaded successfully'
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive'
      });
    }
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
                {t('purchase_history')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                {t('view_all_credit_purchases')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-3">
              <Card className="p-2 sm:p-3 lg:p-4 glass">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-text-subtle font-medium">Total Spent</p>
                  <DollarSign className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary flex-shrink-0" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">TZS {formatAmount(Number(purchaseStats.total_spent))}</p>
                <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                  all purchases
                </p>
              </Card>

              <Card className="p-2 sm:p-3 lg:p-4 glass">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-text-subtle font-medium">Total Credits</p>
                  <Package className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-success flex-shrink-0" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">{Number(purchaseStats.total_credits).toLocaleString()}</p>
                <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                  credits bought
                </p>
              </Card>

              <Card className="p-2 sm:p-3 lg:p-4 glass">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-text-subtle font-medium">Total Purchases</p>
                  <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-warning flex-shrink-0" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">{formatCompactNumber(Number(purchaseStats.total_purchases))}</p>
                <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                  purchases
                </p>
              </Card>

              <Card className="p-2 sm:p-3 lg:p-4 glass">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-text-subtle font-medium">Completed</p>
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-600 flex-shrink-0" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">{formatCompactNumber(Number(purchaseStats.completed_purchases))}</p>
                <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                  completed
                </p>
              </Card>

              <Card className="p-2 sm:p-3 lg:p-4 glass">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-text-subtle font-medium">Success Rate</p>
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-success flex-shrink-0" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">
                  {Number(purchaseStats.success_rate).toFixed(1)}%
                </p>
                <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                  success
                </p>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-3 sm:p-4 glass">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                    <Input
                      placeholder="Invoice or package..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-subtle border-0 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="glass-subtle border-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refresh({
                      page: currentPage,
                      page_size: pageSize,
                      status: statusFilter === "all" ? undefined : statusFilter
                    })}
                    disabled={isLoading}
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Transactions Table */}
            <Card className="glass">
              {/* Desktop Table View (lg and above) */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle bg-muted/50">
                      <TableHead className="min-w-[140px] font-semibold">Invoice No.</TableHead>
                      <TableHead className="min-w-[130px] font-semibold">Date</TableHead>
                      <TableHead className="min-w-[160px] font-semibold">Payment Method</TableHead>
                      <TableHead className="min-w-[100px] font-semibold">Credits</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Amount</TableHead>
                      <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                      <TableHead className="text-right min-w-[80px] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="border-border-subtle hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <span className="font-mono font-medium text-sm">{purchase.invoice_number}</span>
                        </TableCell>
                        <TableCell className="text-text-subtle text-sm whitespace-nowrap">
                          {formatDate(purchase.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-xs truncate" title={purchase.payment_method}>
                            {purchase.payment_method}
                          </div>
                        </TableCell>
                        <TableCell>
                          {purchase.credits > 0 && (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {String(purchase.credits).toLocaleString()} SMS
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-sm whitespace-nowrap">
                          TZS {Number(purchase.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewDetails(purchase)}
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {purchase.status === "completed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download Receipt"
                                className="h-8 w-8"
                                onClick={() => downloadReceipt(purchase)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Tablet View (md to lg) */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle bg-muted/50">
                      <TableHead className="min-w-[120px] font-semibold text-xs">Invoice</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-xs">Date</TableHead>
                      <TableHead className="min-w-[110px] font-semibold text-xs">Payment</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-xs">Amount</TableHead>
                      <TableHead className="min-w-[80px] font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-right min-w-[70px] font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="border-border-subtle hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <span className="font-mono font-medium text-xs">{purchase.invoice_number}</span>
                        </TableCell>
                        <TableCell className="text-text-subtle text-xs whitespace-nowrap">
                          {formatDate(purchase.created_at).split(',')[0]}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="max-w-xs truncate" title={purchase.payment_method}>
                            {purchase.payment_method}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-xs whitespace-nowrap">
                          TZS {(Number(purchase.amount) / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell className="text-xs">{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(purchase)}
                            className="h-7 w-7"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View (below md) */}

              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4">
                {filteredPurchases.map((purchase) => (
                  <Card key={purchase.id} className="p-3 sm:p-4 glass-subtle hover:shadow-md transition-all">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-medium text-xs sm:text-sm mb-1 truncate" title={purchase.invoice_number}>
                              {purchase.invoice_number}
                            </div>
                            <div className="text-xs text-text-subtle line-clamp-1">
                              {formatDate(purchase.created_at).split(',')[0]}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(purchase)}
                            className="h-7 w-7 flex-shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <div>{getStatusBadge(purchase.status)}</div>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-1">
                        <div className="text-xs text-text-subtle font-medium">Payment</div>
                        <div className="text-xs sm:text-sm text-foreground line-clamp-2">
                          {purchase.payment_method}
                        </div>
                      </div>

                      {/* Credits and Amount Row */}
                      <div className="space-y-2 pt-2 border-t border-border-subtle">
                        {purchase.credits > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-subtle">Credits</span>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {String(purchase.credits).toLocaleString()} SMS
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-subtle font-medium">Total</span>
                          <div className="font-semibold text-sm sm:text-base text-right text-primary">
                            TZS {Number(purchase.amount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Download Receipt Button for Completed */}
                      {purchase.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => downloadReceipt(purchase)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">Download Receipt</span>
                          <span className="inline xs:hidden">Receipt</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {filteredPurchases.length === 0 && !isLoading && (
                <div className="p-8 md:p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    {t('no_transactions')}
                  </h3>
                  <p className="text-text-subtle text-sm">
                    No purchases found. Start by purchasing SMS credits.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="p-8 md:p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-text-subtle text-sm">Loading purchases...</p>
                </div>
              )}

              {/* Pagination Controls */}
              {pagination && filteredPurchases.length > 0 && (
                <div className="p-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs sm:text-sm text-text-subtle">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total_count)} of {pagination.total_count} purchases
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1, {
                        page_size: pageSize,
                        status: statusFilter === "all" ? undefined : statusFilter
                      })}
                      disabled={!pagination.has_previous || isLoading}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm text-text-subtle">Page</span>
                      <Input
                        type="number"
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value) || 1;
                          if (page > 0 && page <= pagination.total_pages) {
                            setCurrentPage(page);
                          }
                        }}
                        className="w-12 h-8 text-xs text-center glass-subtle border-0"
                        min="1"
                        max={pagination.total_pages}
                      />
                      <span className="text-xs sm:text-sm text-text-subtle">of {pagination.total_pages}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1, {
                        page_size: pageSize,
                        status: statusFilter === "all" ? undefined : statusFilter
                      })}
                      disabled={!pagination.has_next || isLoading}
                      className="h-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-24 h-8 text-xs glass-subtle border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="10" className="text-xs">10/page</SelectItem>
                      <SelectItem value="20" className="text-xs">20/page</SelectItem>
                      <SelectItem value="50" className="text-xs">50/page</SelectItem>
                      <SelectItem value="100" className="text-xs">100/page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </Card>

            {/* Purchase Details Sheet */}
            <Sheet open={showDetails} onOpenChange={setShowDetails}>
              <SheetContent className="glass w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="text-sm sm:text-base">Purchase Details</SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm">
                    Complete purchase information
                  </SheetDescription>
                </SheetHeader>

                {selectedTransaction && (
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {/* Invoice Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Invoice Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Invoice No.</span>
                          <span className="font-mono font-medium">{selectedTransaction.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Package</span>
                          <span className="font-medium">{selectedTransaction.package_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Date</span>
                          <span>{formatDate(selectedTransaction.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Status</span>
                          {getStatusBadge(selectedTransaction.status)}
                        </div>
                        {selectedTransaction.completed_at && (
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Completed</span>
                            <span>{formatDate(selectedTransaction.completed_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Credits Info */}
                    {selectedTransaction.credits > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm sm:text-base">Credits Information</h3>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-subtle">SMS Credits</span>
                            <span className="font-medium">{selectedTransaction.credits.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Unit Price</span>
                            <span>TZS {Number(selectedTransaction.unit_price || 0).toLocaleString()}/SMS</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Payment Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Method</span>
                          <span className="font-medium">{selectedTransaction.payment_method_display || selectedTransaction.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                          <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                          <span className="text-base sm:text-lg font-bold text-primary">
                            TZS {Number(selectedTransaction.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {selectedTransaction.status === "completed" && (
                        <Button
                          variant="outline"
                          className="w-full text-sm"
                          onClick={() => downloadReceipt(selectedTransaction)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                      {selectedTransaction.status === "pending" && (
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

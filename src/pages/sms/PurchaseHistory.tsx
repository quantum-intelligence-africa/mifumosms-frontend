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
import { useBillingHistory, BillingTransaction } from "@/hooks/useBillingHistory";
import { useLanguage } from "@/hooks/useLanguage";

const PurchaseHistory = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<BillingTransaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Use the new comprehensive billing history hook
  const {
    transactions,
    summary,
    pagination,
    isLoading,
    error,
    refreshing,
    fetchBillingHistory,
    refreshBillingHistory,
    getTransactionTypeIcon,
    getTransactionTypeColor,
    getStatusBadgeVariant,
    formatCurrency,
    formatDate,
    getFilteredTransactions,
    getTotalSpent,
    getTotalCredits,
    getTransactionStats,
  } = useBillingHistory();

  // Load data when filters change
  useEffect(() => {
    const filters = {
      page: currentPage,
      page_size: pageSize,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      transaction_type: typeFilter !== 'all' ? typeFilter : undefined,
    };
    fetchBillingHistory(filters);
  }, [statusFilter, typeFilter, currentPage]);

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

  const filteredTransactions = getFilteredTransactions(searchQuery).filter(transaction => {
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const transactionStats = getTransactionStats();

  const viewDetails = (transaction: BillingTransaction) => {
    setSelectedTransaction(transaction);
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
                {t('purchase_history')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                {t('view_all_credit_purchases')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Spent</p>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(getTotalSpent())}</p>
                <p className="text-xs text-text-subtle mt-1">
                  {summary?.currency || 'TZS'} across all transactions
                </p>
              </Card>

              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Credits</p>
                  <Package className="w-5 h-5 text-success" />
                </div>
                <p className="text-2xl font-bold">{getTotalCredits().toLocaleString()}</p>
                <p className="text-xs text-text-subtle mt-1">
                  SMS credits purchased
                </p>
              </Card>

              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Total Transactions</p>
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <p className="text-2xl font-bold">{transactionStats.total}</p>
                <p className="text-xs text-text-subtle mt-1">
                  {transactionStats.completed} completed, {transactionStats.pending} pending
                </p>
              </Card>

              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-subtle">Success Rate</p>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <p className="text-2xl font-bold">
                  {transactionStats.total > 0
                    ? Math.round((transactionStats.completed / transactionStats.total) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-text-subtle mt-1">
                  Transaction success rate
                </p>
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
                  <Label>Transaction Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="glass-subtle border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">📦 Purchases</SelectItem>
                      <SelectItem value="payment">💳 Payments</SelectItem>
                      <SelectItem value="custom">⚙️ Custom SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refreshBillingHistory({
                      page: currentPage,
                      page_size: pageSize,
                      status: statusFilter !== 'all' ? statusFilter : undefined,
                      transaction_type: typeFilter !== 'all' ? typeFilter : undefined,
                    })}
                    disabled={refreshing}
                    className="flex-1"
                  >
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

            {/* Transactions Table */}
            <Card className="glass">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle">
                      <TableHead className="min-w-[150px]">Invoice No.</TableHead>
                      <TableHead className="min-w-[150px]">Date</TableHead>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="min-w-[120px]">Credits</TableHead>
                      <TableHead className="min-w-[120px]">Amount</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-border-subtle">
                        <TableCell>
                          <span className="font-mono font-medium text-sm">{transaction.invoice_number}</span>
                        </TableCell>
                        <TableCell className="text-text-subtle text-sm">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.credits > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.credits.toLocaleString()} SMS
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount, transaction.currency)}
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4 glass-subtle">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-medium text-sm mb-1 truncate">
                            {transaction.invoice_number}
                          </div>
                          <div className="text-xs text-text-subtle">
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(transaction.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(transaction)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="text-sm text-foreground">
                        {transaction.description}
                      </div>

                      {/* Credits and Amount Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <div>
                          {transaction.credits > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.credits.toLocaleString()} SMS
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold text-base">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </div>

                      {/* Download Receipt Button for Completed */}
                      {transaction.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {filteredTransactions.length === 0 && !isLoading && (
                <div className="p-8 md:p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    {t('no_transactions')}
                  </h3>
                  <p className="text-text-subtle text-sm">
                    No transactions match your current filters
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="p-8 md:p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-text-subtle text-sm">Loading transactions...</p>
                </div>
              )}
            </Card>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <Card className="p-4 glass">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-subtle">
                    Showing {(pagination.page - 1) * pagination.page_size + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of {pagination.count} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
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
                      onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                      disabled={pagination.page === pagination.total_pages || isLoading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Transaction Details Sheet */}
            <Sheet open={showDetails} onOpenChange={setShowDetails}>
              <SheetContent className="glass w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="text-sm sm:text-base">{t('transaction_details')}</SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm">
                    Complete transaction information and timeline
                  </SheetDescription>
                </SheetHeader>

                {selectedTransaction && (
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {/* Transaction Type */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Transaction Type</h3>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-2xl">{selectedTransaction.icon}</span>
                        <div>
                          <p className="font-medium">{selectedTransaction.type_display}</p>
                          <p className="text-sm text-text-subtle">{selectedTransaction.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Invoice Information</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Invoice No.</span>
                          <span className="font-mono font-medium">{selectedTransaction.invoice_number}</span>
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

                    {/* Package/Credits Info */}
                    {selectedTransaction.credits > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm sm:text-base">Credits Information</h3>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Package</span>
                            <span className="font-medium">{selectedTransaction.package_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">SMS Credits</span>
                            <span className="font-medium">{selectedTransaction.credits.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Unit Price</span>
                            <span>{formatCurrency(selectedTransaction.unit_price, selectedTransaction.currency)}/SMS</span>
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
                          <span className="font-medium">{selectedTransaction.payment_method_display}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                          <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                          <span className="text-base sm:text-lg font-bold text-primary">
                            {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
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

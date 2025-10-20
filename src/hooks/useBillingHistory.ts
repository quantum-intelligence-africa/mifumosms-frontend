import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface BillingTransaction {
  id: string;
  type: string;
  type_display: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  status_display: string;
  payment_method: string;
  payment_method_display: string;
  credits: number;
  package_name: string;
  unit_price: number;
  created_at: string;
  completed_at: string | null;
  description: string;
  icon: string;
  color: string;
}

export interface BillingSummary {
  total_transactions: number;
  total_amount: number;
  total_credits: number;
  currency: string;
}

export interface BillingPagination {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BillingHistoryFilters {
  page?: number;
  page_size?: number;
  status?: string;
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
}

export const useBillingHistory = () => {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [pagination, setPagination] = useState<BillingPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchBillingHistory = async (filters: BillingHistoryFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getComprehensiveBillingHistory(filters);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
        setSummary(response.data.summary || null);
        setPagination(response.data.pagination || null);
      } else {
        const errorMessage = response.error || 'Failed to load billing history';
        setError(errorMessage);
        toast({
          title: "Failed to load billing history",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: "Network error",
        description: "Failed to load billing history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBillingHistory = async (filters: BillingHistoryFilters = {}) => {
    try {
      setRefreshing(true);
      await fetchBillingHistory(filters);
    } finally {
      setRefreshing(false);
    }
  };

  const getTransactionTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'purchase': '📦',
      'payment': '💳',
      'custom': '⚙️',
    };
    return icons[type] || '📄';
  };

  const getTransactionTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'purchase': 'blue',
      'payment': 'green',
      'custom': 'purple',
    };
    return colors[type] || 'gray';
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'completed': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
      'cancelled': 'outline',
      'refunded': 'outline',
    };
    return variants[status] || 'outline';
  };

  const formatCurrency = (amount: number, currency: string = 'TZS'): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredTransactions = (searchQuery: string = '') => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter(transaction => 
      transaction.invoice_number?.toLowerCase().includes(query) ||
      transaction.package_name?.toLowerCase().includes(query) ||
      transaction.description?.toLowerCase().includes(query) ||
      transaction.type_display?.toLowerCase().includes(query)
    );
  };

  const getTransactionsByType = (type: string) => {
    return transactions.filter(transaction => transaction.type === type);
  };

  const getTransactionsByStatus = (status: string) => {
    return transactions.filter(transaction => transaction.status === status);
  };

  const getTotalSpent = (): number => {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalCredits = (): number => {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.credits, 0);
  };

  const getTransactionStats = () => {
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const failed = transactions.filter(t => t.status === 'failed').length;
    
    return {
      completed,
      pending,
      failed,
      total: transactions.length
    };
  };

  // Load initial data
  useEffect(() => {
    fetchBillingHistory();
  }, []);

  return {
    // Data
    transactions,
    summary,
    pagination,
    
    // State
    isLoading,
    error,
    refreshing,
    
    // Actions
    fetchBillingHistory,
    refreshBillingHistory,
    
    // Utilities
    getTransactionTypeIcon,
    getTransactionTypeColor,
    getStatusBadgeVariant,
    formatCurrency,
    formatDate,
    getFilteredTransactions,
    getTransactionsByType,
    getTransactionsByStatus,
    getTotalSpent,
    getTotalCredits,
    getTransactionStats,
  };
};

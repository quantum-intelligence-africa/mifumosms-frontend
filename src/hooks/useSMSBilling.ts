import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useSMSBilling = () => {
  const [packages, setPackages] = useState<Array<{
    id: string;
    name: string;
    package_type: string;
    credits: number;
    price: number;
    unit_price: number;
    is_popular: boolean;
    features: string[];
    savings_percentage: number;
  }>>([]);

  const [balance, setBalance] = useState<{
    id: string;
    credits: number;
    total_purchased: number;
    total_used: number;
    last_updated: string;
    created_at: string;
  } | null>(null);

  const [purchases, setPurchases] = useState<Array<{
    id: string;
    invoice_number: string;
    package_name: string;
    credits: number;
    amount: number;
    unit_price: number;
    payment_method: string;
    payment_method_display: string;
    status: string;
    status_display: string;
    created_at: string;
    completed_at: string | null;
  }>>([]);

  const [usageStats, setUsageStats] = useState<{
    current_balance: number;
    total_usage: {
      credits: number;
      cost: number;
    };
    monthly_usage: {
      credits: number;
      cost: number;
    };
    weekly_usage: {
      credits: number;
      cost: number;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPackages = async () => {
    try {
      const response = await apiClient.getSMSPackages();
      if (response.success && response.data) {
        // Convert API response to expected format
        const formattedPackages = response.data.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          package_type: pkg.package_type || 'standard',
          credits: pkg.credits,
          price: parseFloat(pkg.price),
          unit_price: parseFloat(pkg.unit_price),
          is_popular: pkg.is_popular || false,
          features: pkg.features || [],
          savings_percentage: pkg.savings_percentage || 0
        }));
        setPackages(formattedPackages);
      } else {
        toast({
          title: "Failed to load SMS packages",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to load SMS packages",
        variant: "destructive"
      });
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await apiClient.getSMSBalance();
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        toast({
          title: "Failed to load SMS balance",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to load SMS balance",
        variant: "destructive"
      });
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiClient.getPurchases();
      if (response.success && response.data) {
        // Convert API response to expected format
        const formattedPurchases = response.data.results.map((purchase: any) => ({
          id: purchase.id,
          invoice_number: purchase.invoice_number,
          package_name: purchase.package_name || 'Unknown Package',
          credits: purchase.credits,
          amount: parseFloat(purchase.amount),
          unit_price: parseFloat(purchase.unit_price),
          payment_method: purchase.payment_method,
          payment_method_display: purchase.payment_method_display || purchase.payment_method,
          status: purchase.status,
          status_display: purchase.status_display || purchase.status,
          created_at: purchase.created_at,
          completed_at: purchase.completed_at
        }));
        setPurchases(formattedPurchases);
      } else {
        toast({
          title: "Failed to load purchases",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to load purchases",
        variant: "destructive"
      });
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await apiClient.getUsageStatistics();
      if (response.success && response.data) {
        // Convert API response to expected format
        const formattedStats = {
          current_balance: response.data.current_balance,
          total_usage: response.data.total_usage,
          monthly_usage: response.data.monthly_usage || response.data.total_usage,
          weekly_usage: response.data.weekly_usage || response.data.total_usage
        };
        setUsageStats(formattedStats);
      } else {
        toast({
          title: "Failed to load usage statistics",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to load usage statistics",
        variant: "destructive"
      });
    }
  };

  // New payment flow functions
  const getPaymentProviders = async () => {
    try {
      const response = await apiClient.getPaymentProviders();
      if (response.success && response.data) {
        return response.data.providers;
      } else {
        toast({
          title: "Failed to load payment providers",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return [];
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to load payment providers",
        variant: "destructive"
      });
      return [];
    }
  };

  const initiatePayment = async (data: {
    package_id: string;
    mobile_money_provider: string;
    phone_number: string;
  }) => {
    try {
      const response = await apiClient.initiatePayment(data);
      if (response.success && response.data) {
        return response.data;
      } else {
        toast({
          title: "Payment initiation failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Payment initiation failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const calculateCustomSMSPrice = async (credits: number) => {
    try {
      const response = await apiClient.calculateCustomSMSPrice(credits);
      if (response.success && response.data) {
        return response.data;
      } else {
        toast({
          title: "Price calculation failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Price calculation failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const initiateCustomSMSPayment = async (data: {
    credits: number;
    mobile_money_provider: string;
    phone_number: string;
  }) => {
    try {
      const response = await apiClient.initiateCustomSMSPayment(data);
      if (response.success && response.data) {
        return response.data;
      } else {
        toast({
          title: "Payment initiation failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Payment initiation failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      const response = await apiClient.verifyPayment(orderId);
      if (response.success && response.data) {
        if (response.data.success) {
          toast({
            title: "Payment successful",
            description: "SMS credits have been added to your account",
          });
          // Refresh data
          await Promise.all([fetchBalance(), fetchPurchases(), fetchUsageStats()]);
        }
        return response.data;
      } else {
        toast({
          title: "Payment verification failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Payment verification failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const createPurchase = async (data: {
    package_id: string;
    payment_method: string;
    payment_reference?: string;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.createSMSPurchase(data);
      if (response.success && response.data) {
        toast({
          title: "Purchase successful",
          description: `Added ${response.data.credits} SMS credits to your account`,
        });

        // Refresh data
        await Promise.all([fetchBalance(), fetchPurchases(), fetchUsageStats()]);
        return true;
      } else {
        toast({
          title: "Purchase failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        fetchPackages(),
        fetchBalance(),
        fetchPurchases(),
        fetchUsageStats()
      ]);
    } catch (error) {
      setError('Failed to load SMS billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    packages,
    balance,
    purchases,
    usageStats,
    isLoading,
    error,
    createPurchase,
    getPaymentProviders,
    initiatePayment,
    calculateCustomSMSPrice,
    initiateCustomSMSPayment,
    verifyPayment,
    refetch: fetchAllData,
    refetchBalance: fetchBalance,
    refetchPurchases: fetchPurchases,
    refetchUsageStats: fetchUsageStats,
  };
};

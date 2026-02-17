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

  const [purchaseStats, setPurchaseStats] = useState<{
    total_spent: number;
    total_credits: number;
    total_purchases: number;
    completed_purchases: number;
    success_rate: number;
  }>({
    total_spent: 0,
    total_credits: 0,
    total_purchases: 0,
    completed_purchases: 0,
    success_rate: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPackages = async () => {
    try {
      const response = await apiClient.getSMSPackages();
      if (response.success && response.data) {
        // Convert API response to expected format
        interface PackageData {
          id: string;
          name: string;
          package_type?: string;
          credits: number;
          price: number | string;
          unit_price: number | string;
          is_popular?: boolean;
          features?: string[];
          savings_percentage?: number;
        }
        const packagesArray: PackageData[] = Array.isArray(response.data) ? response.data : (response.data.results || []);
        const formattedPackages = packagesArray.map((pkg: PackageData) => ({
          id: pkg.id,
          name: pkg.name,
          package_type: pkg.package_type || 'standard',
          credits: pkg.credits,
          price: parseFloat(String(pkg.price)),
          unit_price: parseFloat(String(pkg.unit_price)),
          is_popular: pkg.is_popular || false,
          features: pkg.features || [],
          savings_percentage: pkg.savings_percentage || 0
        }));
        setPackages(formattedPackages);
      }
      // Silently ignore errors (expected when user not authenticated)
    } catch (error) {
      // Silently handle errors
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await apiClient.getSMSBalance();
      if (response.success && response.data) {
        setBalance(response.data);
      }
      // Silently ignore errors (expected when user not authenticated)
    } catch (error) {
      // Silently handle errors
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiClient.getPurchases();
      if (response.success && response.data) {
        // Convert API response to expected format
        interface PurchaseData {
          id: string;
          invoice_number: string;
          package_name?: string;
          credits: number;
          amount: number | string;
          unit_price: number | string;
          payment_method: string;
          payment_method_display?: string;
          status: string;
          status_display?: string;
          created_at: string;
          completed_at?: string | null;
        }
        const formattedPurchases = response.data.results.map((purchase: PurchaseData) => ({
          id: purchase.id,
          invoice_number: purchase.invoice_number,
          package_name: purchase.package_name || 'Unknown Package',
          credits: purchase.credits,
          amount: parseFloat(String(purchase.amount)),
          unit_price: parseFloat(String(purchase.unit_price)),
          payment_method: purchase.payment_method,
          payment_method_display: purchase.payment_method_display || purchase.payment_method,
          status: purchase.status,
          status_display: purchase.status_display || purchase.status,
          created_at: purchase.created_at,
          completed_at: purchase.completed_at
        }));
        setPurchases(formattedPurchases);
      }
      // Silently ignore errors (expected when user not authenticated)
    } catch (error) {
      // Silently handle errors
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await apiClient.getUsageStatistics();
      if (response.success && response.data) {
        // Convert API response to expected format
        interface UsageStatsData {
          current_balance: number;
          total_usage: { credits: number; cost: number };
          monthly_usage?: { credits: number; cost: number };
          weekly_usage?: { credits: number; cost: number };
        }
        const statsData = response.data as UsageStatsData;
        const formattedStats = {
          current_balance: statsData.current_balance,
          total_usage: statsData.total_usage,
          monthly_usage: {
            credits: statsData.monthly_usage?.credits || statsData.total_usage.credits,
            cost: statsData.monthly_usage?.cost || statsData.total_usage.cost
          },
          weekly_usage: {
            credits: statsData.weekly_usage?.credits || statsData.total_usage.credits,
            cost: statsData.weekly_usage?.cost || statsData.total_usage.cost
          }
        };
        setUsageStats(formattedStats);
      }
      // Silently ignore errors (expected when user not authenticated)
    } catch (error) {
      // Silently handle errors
    }
  };

  const fetchPurchaseStats = async () => {
    try {
      const response = await apiClient.getPurchaseStats();
      console.log('📊 Full API Response:', JSON.stringify(response, null, 2));
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Success:', response.success);
      console.log('📊 Response Data Type:', typeof response.data);
      console.log('📊 Response Data:', response.data);

      // Handle backend response - check if data is nested in response.data.data
      let statsData: any = response.data;

      // If response.data is an object with nested data property, use that
      if (statsData && typeof statsData === 'object' && 'data' in statsData && statsData.data) {
        statsData = statsData.data;
        console.log('📊 Found nested data structure, using:', statsData);
      }

      if (response.status === 200 && statsData) {
        console.log('✅ Setting Purchase Stats with data:', statsData);
        setPurchaseStats({
          total_spent: Number(statsData.total_spent) || 0,
          total_credits: Number(statsData.total_credits) || 0,
          total_purchases: Number(statsData.total_purchases) || 0,
          completed_purchases: Number(statsData.completed_purchases) || 0,
          success_rate: Number(statsData.success_rate) || 0
        });
      } else {
        console.warn('⚠️ API returned but could not extract data:', {
          status: response.status,
          data: response.data,
          error: response.error,
          message: response.message
        });
      }
    } catch (error) {
      console.error('❌ Purchase Stats Error:', error);
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
      const paymentData = {
        package_id: data.package_id,
        buyer_email: 'user@example.com', // Default values - should be collected from user
        buyer_name: 'User',
        buyer_phone: data.phone_number,
        mobile_money_provider: data.mobile_money_provider
      };
      const response = await apiClient.initiatePayment(paymentData);
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
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const calculateCustomSMSPrice = async (credits: number) => {
    try {
      const response = await apiClient.calculateCustomSMSPrice({ credits });
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
      const paymentData = {
        credits: data.credits,
        buyer_email: 'user@example.com',
        buyer_name: 'User',
        buyer_phone: data.phone_number,
        mobile_money_provider: data.mobile_money_provider
      };
      const response = await apiClient.initiateCustomSMSPayment(paymentData);
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
        description: error instanceof Error ? error.message : "Network error occurred",
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
      console.log('🔄 Starting fetchAllData...');

      await Promise.all([
        fetchPackages(),
        fetchBalance(),
        fetchPurchases(),
        fetchUsageStats(),
        fetchPurchaseStats()
      ]);

      console.log('✅ All data loaded successfully');
    } catch (error) {
      setError('Failed to load SMS billing data');
      console.error('❌ fetchAllData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only run once on mount
  useEffect(() => {
    console.log('🎯 useSMSBilling hook mounted - calling fetchAllData');
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    packages,
    balance,
    purchases,
    usageStats,
    purchaseStats,
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
    refetchPurchaseStats: fetchPurchaseStats,
  };
};

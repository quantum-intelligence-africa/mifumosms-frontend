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
        // Handle both array and object with results
        const packagesData = Array.isArray(response.data) ? response.data : 
                            (response.data as any).results || [];
        setPackages(packagesData);
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
      const response = await apiClient.getSMSPurchases();
      if (response.success && response.data) {
        setPurchases(response.data);
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
      const response = await apiClient.getSMSUsageStatistics();
      if (response.success && response.data) {
        setUsageStats(response.data);
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
    refetch: fetchAllData,
    refetchBalance: fetchBalance,
    refetchPurchases: fetchPurchases,
    refetchUsageStats: fetchUsageStats,
  };
};

import { useState, useEffect } from 'react';
import { apiClient, AnalyticsOverview } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getAnalyticsOverview();
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.error || 'Failed to fetch analytics');
        toast({
          title: "Failed to load analytics",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Network error while fetching analytics');
      toast({
        title: "Network error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
};
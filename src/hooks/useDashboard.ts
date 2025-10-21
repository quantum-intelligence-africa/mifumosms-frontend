import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<{
    metrics: {
      total_messages: number;
      active_contacts: number;
      campaign_success_rate: number;
      sender_ids_this_month: number;
    };
    recent_campaigns: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      sent: number;
      delivered: number;
      opened: number;
      progress: number;
      created_at: string;
      created_at_human: string;
    }>;
    message_stats: {
      today: number;
      this_week: number;
      this_month: number;
      growth_rate: number;
    };
    contact_stats: {
      total: number;
      active: number;
      new_this_month: number;
      growth_rate: number;
    };
    last_updated: string;
  } | null>(null);

  const [metrics, setMetrics] = useState<{
    total_messages: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    active_contacts: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    campaign_success: {
      value: string;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    sender_id: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [overviewResponse, metricsResponse, senderStatsResponse] = await Promise.all([
        apiClient.getDashboardOverview(),
        apiClient.getDashboardMetrics(),
        apiClient.getStatistics()
      ]);

      if (overviewResponse.success && overviewResponse.data) {
        setDashboardData(overviewResponse.data);
      } else {
        setError(overviewResponse.error || 'Failed to fetch dashboard data');
        toast({
          title: "Failed to load dashboard",
          description: overviewResponse.error || 'Please try again',
          variant: "destructive"
        });
      }

      if (metricsResponse.success && metricsResponse.data) {
        // Update the sender_id metric with approved sender names count
        const updatedMetrics = { ...metricsResponse.data };
        if (senderStatsResponse.success && senderStatsResponse.data) {
          updatedMetrics.sender_id = {
            ...updatedMetrics.sender_id,
            value: senderStatsResponse.data.approved_requests,
            description: "Approved sender names"
          };
        }
        setMetrics(updatedMetrics);
      } else {
        setError(metricsResponse.error || 'Failed to fetch metrics');
        toast({
          title: "Failed to load metrics",
          description: metricsResponse.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Network error while fetching dashboard data');
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
    fetchDashboardData();

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    dashboardData,
    metrics,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
};

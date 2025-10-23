import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';

// Types based on the exact API response structure
interface DashboardMetricsResponse {
  success: boolean;
  data: {
    total_messages: {
      value: number;
      description: string;
    };
    active_contacts: {
      value: number;
      description: string;
    };
    campaign_success: {
      value: number;
      unit: string;
      description: string;
    };
    senderId: {
      value: number;
      description: string;
    };
  };
}

interface DashboardOverviewResponse {
  success: boolean;
  data: {
    metrics: {
      total_messages: number;
      total_sms_messages: number;
      active_contacts: number;
      campaign_success_rate: number;
      sms_delivery_rate: number;
      current_credits: number;
      total_purchased: number;
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
    sms_stats: {
      today: number;
      this_month: number;
      delivery_rate: number;
    };
    contact_stats: {
      total: number;
      active: number;
      new_this_month: number;
      growth_rate: number;
    };
    billing_stats: {
      current_credits: number;
      total_purchased: number;
      credits_used: number;
    };
    last_updated: string;
  };
}

interface RecentCampaignsResponse {
  success: boolean;
  summary: {
    recent_campaigns: Array<{
      name: string;
      type: string;
      status: string;
      timeAgo: string;
      sent: number;
      delivered: number;
    }>;
  };
}

interface RecentActivityResponse {
  success: boolean;
  data: {
    activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
      time_ago: string;
      is_live: boolean;
      metadata: {
        [key: string]: any;
      };
    }>;
    has_more: boolean;
    total_count: number;
    live_count: number;
  };
}

interface PerformanceOverviewResponse {
  success: boolean;
  data: {
    metrics: {
      total_messages: number;
      delivery_rate: number;
      response_rate: number;
      active_conversations: number;
      campaign_success_rate: number;
    };
    charts: {
      message_volume: {
        labels: string[];
        data: number[];
      };
      delivery_rates: {
        labels: string[];
        data: number[];
      };
    };
    coming_soon: boolean;
  };
}

interface SenderIdsResponse {
  success: boolean;
  data: Array<{
    id: string;
    sender_id: string;
    sample_content: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse['data'] | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewResponse['data'] | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaignsResponse['summary']['recent_campaigns'] | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse['data']['activities'] | null>(null);
  const [performanceOverview, setPerformanceOverview] = useState<PerformanceOverviewResponse['data'] | null>(null);
  const [senderIds, setSenderIds] = useState<SenderIdsResponse['data'] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        toast({
          title: "Authentication required",
          description: "Please log in to view the dashboard",
          variant: "destructive"
        });
        return;
      }

      // Fetch dashboard data using the correct API endpoints
      const [metricsResponse, overviewResponse, campaignsResponse, activityResponse, performanceResponse, senderIdsResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.DASHBOARD.METRICS}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.DASHBOARD.OVERVIEW}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CAMPAIGNS.SUMMARY}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.ACTIVITY.RECENT}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.PERFORMANCE.OVERVIEW}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_IDS.BASE}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Handle metrics response
      if (metricsResponse.ok) {
        const metricsData: DashboardMetricsResponse = await metricsResponse.json();
        if (metricsData.success) {
          setMetrics(metricsData.data);
        } else {
          console.error('Metrics API error:', metricsData);
          setError('Failed to fetch dashboard metrics');
        }
      } else {
        console.error('Metrics fetch failed:', metricsResponse.status);
        setError('Failed to fetch dashboard metrics');
      }

      // Handle overview response
      if (overviewResponse.ok) {
        const overviewData: DashboardOverviewResponse = await overviewResponse.json();
        if (overviewData.success) {
          setOverview(overviewData.data);
        } else {
          console.error('Overview API error:', overviewData);
        }
      } else {
        console.error('Overview fetch failed:', overviewResponse.status);
      }

      // Handle campaigns response
      if (campaignsResponse.ok) {
        const campaignsData: RecentCampaignsResponse = await campaignsResponse.json();
        if (campaignsData.success) {
          setRecentCampaigns(campaignsData.summary.recent_campaigns);
        } else {
          console.error('Campaigns API error:', campaignsData);
        }
      } else {
        console.error('Campaigns fetch failed:', campaignsResponse.status);
      }

      // Handle activity response
      if (activityResponse.ok) {
        const activityData: RecentActivityResponse = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data.activities);
        } else {
          console.error('Activity API error:', activityData);
        }
      } else {
        console.error('Activity fetch failed:', activityResponse.status);
      }

      // Handle performance response
      if (performanceResponse.ok) {
        const performanceData: PerformanceOverviewResponse = await performanceResponse.json();
        if (performanceData.success) {
          setPerformanceOverview(performanceData.data);
        } else {
          console.error('Performance API error:', performanceData);
        }
      } else {
        console.error('Performance fetch failed:', performanceResponse.status);
      }

      // Handle sender IDs response
      if (senderIdsResponse.ok) {
        const senderIdsData: SenderIdsResponse = await senderIdsResponse.json();
        console.log('Sender IDs API Response:', senderIdsData);
        console.log('Sender IDs Count:', senderIdsData.data?.length);
        if (senderIdsData.success) {
          setSenderIds(senderIdsData.data);
        } else {
          console.error('Sender IDs API error:', senderIdsData);
        }
      } else {
        console.error('Sender IDs fetch failed:', senderIdsResponse.status);
      }

      // Show error toast if critical data failed to load
      if (!metricsResponse.ok) {
        toast({
          title: "Failed to load dashboard",
          description: "Some data may not be available. Please refresh to try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error while fetching dashboard data');
      toast({
        title: "Network error",
        description: "Failed to connect to server. Please check your connection.",
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
    metrics,
    overview,
    recentCampaigns,
    recentActivity,
    performanceOverview,
    senderIds,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
};

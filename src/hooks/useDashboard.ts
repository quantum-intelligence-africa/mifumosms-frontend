import { useState, useEffect, useRef, useCallback } from 'react';
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
      type?: string;
      campaign_type?: string;
      campaign_type_display?: string;
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
        [key: string]: unknown;
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

// Type for campaign with all required fields
type Campaign = {
  id: string;
  name: string;
  type?: string;
  campaign_type?: string;
  campaign_type_display?: string;
  status: string;
  sent: number;
  delivered: number;
  opened: number;
  progress: number;
  created_at: string;
  created_at_human: string;
};

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse['data'] | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewResponse['data'] | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse['data']['activities'] | null>(null);
  const [performanceOverview, setPerformanceOverview] = useState<PerformanceOverviewResponse['data'] | null>(null);
  const [senderIds, setSenderIds] = useState<SenderIdsResponse['data'] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Track if we've already logged errors to avoid console spam
  const errorLoggedRef = useRef({
    metrics: false,
    overview: false,
    activity: false,
    performance: false,
    senderIds: false
  });

  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        if (isInitialLoad) {
          toast({
            title: "Authentication required",
            description: "Please log in to view the dashboard",
            variant: "destructive"
          });
        }
        return;
      }

      // Use apiClient for dashboard overview and metrics
      const [metricsResponse, overviewResponse, activityResponse, performanceResponse, senderIdsResponse] = await Promise.allSettled([
        apiClient.getDashboardMetrics(),
        apiClient.getDashboardOverview(),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.ACTIVITY.RECENT}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.PERFORMANCE.OVERVIEW}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null),
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_IDS.BASE}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null)
      ]);

      // Handle metrics response
      if (metricsResponse.status === 'fulfilled' && metricsResponse.value.success) {
        const metricsData = metricsResponse.value.data;
        if (metricsData) {
          // Transform apiClient response to match expected format
          setMetrics({
            total_messages: {
              value: metricsData.total_messages?.value || 0,
              description: metricsData.total_messages?.description || ''
            },
            active_contacts: {
              value: metricsData.active_contacts?.value || 0,
              description: metricsData.active_contacts?.description || ''
            },
            campaign_success: {
              value: parseFloat(metricsData.campaign_success?.value?.toString() || '0'),
              unit: '%',
              description: metricsData.campaign_success?.description || ''
            },
            senderId: {
              value: metricsData.sender_id?.value || 0,
              description: metricsData.sender_id?.description || ''
            }
          });
          errorLoggedRef.current.metrics = false; // Reset error flag on success
        }
      } else if (!errorLoggedRef.current.metrics && isInitialLoad) {
        // Only log once on initial load
        console.warn('Dashboard metrics endpoint not available or returned error');
        errorLoggedRef.current.metrics = true;
      }

      // Handle overview response
      if (overviewResponse.status === 'fulfilled' && overviewResponse.value.success) {
        const overviewData = overviewResponse.value.data;
        if (overviewData) {
          setOverview(overviewData as DashboardOverviewResponse['data']);
          // Map recent campaigns to ensure we have the correct structure
          // Prioritize campaign_type_display and campaign_type over type field
          const mappedCampaigns: Campaign[] = overviewData.recent_campaigns.map((campaign: {
            id: string;
            name: string;
            type?: string;
            campaign_type?: string;
            campaign_type_display?: string;
            status: string;
            sent?: number;
            sent_count?: number;
            delivered?: number;
            delivered_count?: number;
            opened?: number;
            read_count?: number;
            progress?: number;
            progress_percentage?: number;
            created_at: string;
            created_at_human?: string;
            timeAgo?: string;
          }) => {
            // Debug: Log the raw campaign data to see what fields are available
            if (isInitialLoad && overviewData.recent_campaigns.indexOf(campaign) === 0) {
              console.log('Sample campaign data from API:', campaign);
            }

            // Get the correct campaign type - prioritize campaign_type_display, then campaign_type
            // NEVER use 'type' field if it says 'WhatsApp' as it appears to be hardcoded incorrectly
            // Always prefer campaign_type_display or campaign_type from the API
            let campaignType: string | undefined;
            if (campaign.campaign_type_display) {
              campaignType = campaign.campaign_type_display;
            } else if (campaign.campaign_type) {
              // Convert campaign_type to display format (e.g., 'sms' -> 'SMS', 'whatsapp' -> 'WhatsApp')
              const typeMap: Record<string, string> = {
                'sms': 'SMS',
                'whatsapp': 'WhatsApp',
                'email': 'Email',
                'mixed': 'Mixed'
              };
              campaignType = typeMap[campaign.campaign_type.toLowerCase()] || campaign.campaign_type;
            } else if (campaign.type && campaign.type.toLowerCase() !== 'whatsapp') {
              // Only use 'type' field as last resort if it's not the incorrect 'WhatsApp' value
              campaignType = campaign.type;
            }

            return {
              id: campaign.id,
              name: campaign.name,
              type: campaignType, // Use the correctly prioritized type
              campaign_type: campaign.campaign_type,
              campaign_type_display: campaign.campaign_type_display,
              status: campaign.status,
              sent: campaign.sent || campaign.sent_count || 0,
              delivered: campaign.delivered || campaign.delivered_count || 0,
              opened: campaign.opened || campaign.read_count || 0,
              progress: campaign.progress || campaign.progress_percentage || 0,
              created_at: campaign.created_at,
              created_at_human: campaign.created_at_human || campaign.timeAgo || '',
            };
          });
          setRecentCampaigns(mappedCampaigns);
          errorLoggedRef.current.overview = false; // Reset error flag on success
        }
      } else if (!errorLoggedRef.current.overview && isInitialLoad) {
        console.warn('Dashboard overview endpoint not available or returned error');
        errorLoggedRef.current.overview = true;
      }

      // Handle activity response
      if (activityResponse.status === 'fulfilled' && activityResponse.value) {
        const response = activityResponse.value;
        if (response.ok) {
          try {
            const activityData: RecentActivityResponse = await response.json();
            if (activityData.success) {
              setRecentActivity(activityData.data.activities);
              errorLoggedRef.current.activity = false;
            }
          } catch (e) {
            if (!errorLoggedRef.current.activity && isInitialLoad) {
              console.warn('Failed to parse activity response');
              errorLoggedRef.current.activity = true;
            }
          }
        } else if (!errorLoggedRef.current.activity && isInitialLoad && response.status === 400) {
          // Only log 400 errors once on initial load - suppress subsequent errors
          errorLoggedRef.current.activity = true;
        }
      } else if (!errorLoggedRef.current.activity && isInitialLoad) {
        console.warn('Activity endpoint request failed');
        errorLoggedRef.current.activity = true;
      }

      // Handle performance response
      if (performanceResponse.status === 'fulfilled' && performanceResponse.value) {
        const response = performanceResponse.value;
        if (response.ok) {
          try {
            const performanceData: PerformanceOverviewResponse = await response.json();
            if (performanceData.success) {
              setPerformanceOverview(performanceData.data);
              errorLoggedRef.current.performance = false;
            }
          } catch (e) {
            if (!errorLoggedRef.current.performance && isInitialLoad) {
              console.warn('Failed to parse performance response');
              errorLoggedRef.current.performance = true;
            }
          }
        } else if (!errorLoggedRef.current.performance && isInitialLoad && response.status === 400) {
          // Suppress 400 errors after first log
          errorLoggedRef.current.performance = true;
        }
      } else if (!errorLoggedRef.current.performance && isInitialLoad) {
        console.warn('Performance endpoint request failed');
        errorLoggedRef.current.performance = true;
      }

      // Handle sender IDs response
      if (senderIdsResponse.status === 'fulfilled' && senderIdsResponse.value) {
        const response = senderIdsResponse.value;
        if (response.ok) {
          try {
            const senderIdsData: SenderIdsResponse = await response.json();
            if (senderIdsData.success) {
              setSenderIds(senderIdsData.data);
              errorLoggedRef.current.senderIds = false;
            }
          } catch (e) {
            if (!errorLoggedRef.current.senderIds && isInitialLoad) {
              console.warn('Failed to parse sender IDs response');
              errorLoggedRef.current.senderIds = true;
            }
          }
        } else if (!errorLoggedRef.current.senderIds && isInitialLoad && response.status === 400) {
          // Suppress 400 errors after first log
          errorLoggedRef.current.senderIds = true;
        }
      } else if (!errorLoggedRef.current.senderIds && isInitialLoad) {
        console.warn('Sender IDs endpoint request failed');
        errorLoggedRef.current.senderIds = true;
      }

      // Only show toast on initial load if critical data failed
      if (isInitialLoad && (
        (metricsResponse.status === 'fulfilled' && !metricsResponse.value?.success) ||
        (overviewResponse.status === 'fulfilled' && !overviewResponse.value?.success)
      )) {
        toast({
          title: "Partial data loaded",
          description: "Some dashboard data may not be available.",
          variant: "default"
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
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    // Initial load with loading state
    fetchDashboardData(true);

    // Set up polling for real-time updates every 60 seconds (silent refresh)
    const interval = setInterval(() => {
      fetchDashboardData(false); // Silent refresh without loading state
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    metrics,
    overview,
    recentCampaigns, // campaigns from overview data with all required fields
    recentActivity,
    performanceOverview,
    senderIds,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
};

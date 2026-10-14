import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
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
    current_credits: {
      value: number;
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
      active_contacts: number;
      campaign_success_rate: number;
      current_credits: number;
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
    };
    personal_usage: {
      this_month: {
        credits_used: number;
        messages_sent: number;
      };
      usage_trends: Array<{
        date: string;
        credits_used: number;
        message_count: number;
      }>;
      recent_messages: Array<{
        id: string;
        recipient: string;
        status: string;
        sent_at: string;
        cost_amount: string;
      }>;
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

type MetricsApi = NonNullable<Awaited<ReturnType<typeof apiClient.getDashboardMetrics>>['data']>;
type OverviewApi = NonNullable<Awaited<ReturnType<typeof apiClient.getDashboardOverview>>['data']>;

/** Same transformation the dashboard has always applied to the metrics response. */
function mapMetrics(metricsData: MetricsApi): DashboardMetricsResponse['data'] {
          return {
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
            current_credits: {
              value: metricsData.current_credits?.value || 0,
              description: metricsData.current_credits?.description || ''
            },
            senderId: {
              value: metricsData.sender_id?.value || 0,
              description: metricsData.sender_id?.description || ''
            }
          };
}

/** Same transformation the dashboard has always applied to the overview's recent campaigns. */
function mapCampaigns(overviewData: OverviewApi): Campaign[] {
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
  return mappedCampaigns;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

const POLL_MS = 120_000;

/**
 * Dashboard data, one React Query per section.
 *
 * Before, this was a plain hook with its own state and its own 2-minute timer, and the dashboard used
 * it twice (page + activity feed): every visit fired all five requests twice and the page waited for
 * the slowest of them before drawing anything. Now:
 *  - consumers share one cache entry per section, so each request is made once (and de-duplicated);
 *  - the page draws as soon as the primary metrics are in (`isLoading`), other sections fill in as they
 *    arrive (`secondaryLoading` is true while campaigns / sender IDs are still loading);
 *  - coming back to the dashboard shows the cached data immediately and refreshes it in the background;
 *  - polling pauses while the tab is hidden.
 */
export const useDashboard = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const shared = {
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  } as const;

  const metricsQ = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const r = await apiClient.getDashboardMetrics();
      if (!r.success || !r.data) throw new Error('metrics unavailable');
      return mapMetrics(r.data);
    },
    ...shared,
  });
  const overviewQ = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const r = await apiClient.getDashboardOverview();
      if (!r.success || !r.data) throw new Error('overview unavailable');
      return { overview: r.data as DashboardOverviewResponse['data'], campaigns: mapCampaigns(r.data) };
    },
    ...shared,
  });
  const activityQ = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const d = await fetchJson<RecentActivityResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.ACTIVITY.RECENT}`);
      if (!d?.success) throw new Error('activity unavailable');
      return d.data.activities;
    },
    ...shared,
  });
  const performanceQ = useQuery({
    queryKey: ['dashboard', 'performance'],
    queryFn: async () => {
      const d = await fetchJson<PerformanceOverviewResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.PERFORMANCE.OVERVIEW}`);
      if (!d?.success) throw new Error('performance unavailable');
      return d.data;
    },
    ...shared,
  });
  const senderIdsQ = useQuery({
    queryKey: ['dashboard', 'sender-ids'],
    queryFn: async () => {
      const d = await fetchJson<SenderIdsResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_IDS.BASE}`);
      if (!d?.success) throw new Error('sender ids unavailable');
      return d.data;
    },
    ...shared,
  });

  // Tell the user once if the headline data could not be loaded (same message as before).
  const warned = useRef(false);
  useEffect(() => {
    if (!warned.current && (metricsQ.isError || overviewQ.isError)) {
      warned.current = true;
      toast({ title: "Partial data loaded", description: "Some dashboard data may not be available.", variant: "default" });
    }
  }, [metricsQ.isError, overviewQ.isError, toast]);

  const refetch = async () => {
    await Promise.all([metricsQ.refetch(), overviewQ.refetch(), activityQ.refetch(), performanceQ.refetch(), senderIdsQ.refetch()]);
  };

  return {
    metrics: metricsQ.data ?? null,
    overview: overviewQ.data?.overview ?? null,
    recentCampaigns: overviewQ.data?.campaigns ?? null, // campaigns from overview data with all required fields
    recentActivity: activityQ.data ?? null,
    performanceOverview: performanceQ.data ?? null,
    senderIds: senderIdsQ.data ?? null,
    /** True only until the primary metrics arrive (and never when they are already cached). */
    isLoading: metricsQ.isLoading,
    /** True while the campaign list / sender IDs have not arrived yet. */
    secondaryLoading: overviewQ.isLoading || senderIdsQ.isLoading,
    /** True while the activity feed has not arrived yet. */
    activityLoading: activityQ.isLoading,
    error: metricsQ.isError && overviewQ.isError ? 'Network error while fetching dashboard data' : null,
    refetch,
  };
};

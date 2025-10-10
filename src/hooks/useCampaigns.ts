import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    name: string;
    description: string;
    campaign_type: string;
    campaign_type_display: string;
    message_text: string;
    template: string | null;
    status: string;
    status_display: string;
    scheduled_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
    estimated_cost: number;
    actual_cost: number;
    progress_percentage: number;
    delivery_rate: number;
    read_rate: number;
    is_active: boolean;
    can_edit: boolean;
    can_start: boolean;
    can_pause: boolean;
    can_cancel: boolean;
    is_recurring: boolean;
    recurring_schedule: any;
    settings: any;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    target_contact_count: number;
    target_segment_names: string[];
  }>>([]);

  const [summary, setSummary] = useState<{
    summary: {
      total_campaigns: number;
      active_campaigns: number;
      completed_campaigns: number;
      total_recipients: number;
      total_sent: number;
      total_delivered: number;
      total_read: number;
      total_cost: number;
    };
    recent_campaigns: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      progress: number;
      recipients: number;
      sent: number;
      delivered: number;
      created_at: string;
      created_at_human: string;
    }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = async (params?: {
    status?: string;
    type?: string;
    page?: number;
    page_size?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getCampaigns(params);

      if (response.success && response.data) {
        setCampaigns(response.data.results);
      } else {
        setError(response.error || 'Failed to fetch campaigns');
        setCampaigns([]); // Ensure campaigns is always an array
        toast({
          title: "Failed to load campaigns",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Network error while fetching campaigns');
      setCampaigns([]); // Ensure campaigns is always an array
      toast({
        title: "Network error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      // Since getCampaignSummary endpoint doesn't exist in the backend,
      // we'll calculate summary from the campaigns list
      if (campaigns && campaigns.length > 0) {
        const calculatedSummary = {
          summary: {
            total_campaigns: campaigns.length,
            active_campaigns: campaigns.filter(c => c.is_active).length,
            completed_campaigns: campaigns.filter(c => c.status === 'completed').length,
            total_recipients: campaigns.reduce((sum, c) => sum + c.total_recipients, 0),
            total_sent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
            total_delivered: campaigns.reduce((sum, c) => sum + c.delivered_count, 0),
            total_read: campaigns.reduce((sum, c) => sum + c.read_count, 0),
            total_cost: campaigns.reduce((sum, c) => sum + c.actual_cost, 0),
          },
          recent_campaigns: campaigns
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              type: campaign.campaign_type,
              status: campaign.status,
              progress: campaign.progress_percentage,
              recipients: campaign.total_recipients,
              sent: campaign.sent_count,
              delivered: campaign.delivered_count,
              created_at: campaign.created_at,
              created_at_human: new Date(campaign.created_at).toLocaleDateString(),
            }))
        };
        setSummary(calculatedSummary);
      } else {
        // Set default empty summary
        setSummary({
          summary: {
            total_campaigns: 0,
            active_campaigns: 0,
            completed_campaigns: 0,
            total_recipients: 0,
            total_sent: 0,
            total_delivered: 0,
            total_read: 0,
            total_cost: 0,
          },
          recent_campaigns: []
        });
      }
    } catch (error) {
      console.error('Error calculating campaign summary:', error);
      // Set default empty summary on error
      setSummary({
        summary: {
          total_campaigns: 0,
          active_campaigns: 0,
          completed_campaigns: 0,
          total_recipients: 0,
          total_sent: 0,
          total_delivered: 0,
          total_read: 0,
          total_cost: 0,
        },
        recent_campaigns: []
      });
    }
  };

  const createCampaign = async (data: {
    name: string;
    description?: string;
    campaign_type: 'sms' | 'whatsapp' | 'email' | 'mixed';
    message_text: string;
    template?: string | null;
    scheduled_at?: string | null;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: {
      tags?: string[];
      opt_in_status?: string;
    };
    settings?: {
      send_time?: string;
      timezone?: string;
    };
    is_recurring?: boolean;
    recurring_schedule?: any;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.createCampaign(data);

      if (response.success && response.data) {
        toast({
          title: "Campaign created successfully",
          description: `Campaign "${response.data.name}" has been created with ${response.data.total_recipients} recipients`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to create campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateCampaign = async (id: string, data: {
    name?: string;
    description?: string;
    message_text?: string;
    template?: string;
    scheduled_at?: string;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: any;
    settings?: any;
    is_recurring?: boolean;
    recurring_schedule?: any;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.updateCampaign(id, data);

      if (response.success && response.data) {
        toast({
          title: "Campaign updated successfully",
          description: `Campaign "${response.data.name}" has been updated`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to update campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to update campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.deleteCampaign(id);

      if (response.success) {
        toast({
          title: "Campaign deleted successfully",
          description: "The campaign has been permanently deleted",
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to delete campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to delete campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const startCampaign = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.startCampaign(id);

      if (response.success && response.data) {
        toast({
          title: "Campaign started successfully",
          description: response.data.message || `Campaign is now ${response.data.campaign.status}`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to start campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to start campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const pauseCampaign = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.pauseCampaign(id);

      if (response.success && response.data) {
        toast({
          title: "Campaign paused successfully",
          description: response.data.message || `Campaign is now ${response.data.campaign.status}`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to pause campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to pause campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelCampaign = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.cancelCampaign(id);

      if (response.success && response.data) {
        toast({
          title: "Campaign cancelled successfully",
          description: response.data.message || `Campaign is now ${response.data.campaign.status}`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to cancel campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to cancel campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const duplicateCampaign = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.duplicateCampaign(id);

      if (response.success && response.data) {
        toast({
          title: "Campaign duplicated successfully",
          description: `Campaign "${response.data.duplicate_name}" has been created`,
        });

        // Refresh campaigns list
        await fetchCampaigns();
        await fetchSummary();

        return true;
      } else {
        toast({
          title: "Failed to duplicate campaign",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to duplicate campaign",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchAllData = async (params?: { status?: string; type?: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      await fetchCampaigns(params);
      // fetchSummary will be called automatically when campaigns are loaded
    } catch (error) {
      setError('Failed to load campaign data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate summary whenever campaigns change
  useEffect(() => {
    if (campaigns) {
      fetchSummary();
    }
  }, [campaigns]);

  return {
    campaigns,
    summary,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    duplicateCampaign,
    refetch: fetchAllData,
    refetchCampaigns: fetchCampaigns,
    refetchSummary: fetchSummary,
  };
};

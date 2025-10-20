import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface DefaultSenderOverview {
  default_sender: string;
  current_sender_id: string | null;
  active_request: {
    id: string;
    requested_sender_id: string;
    request_type: string;
    status: string;
    sample_content: string;
    created_at: string;
  } | null;
  can_request: boolean;
  reason: string | null;
  balance: {
    credits: number;
    needs_purchase: boolean;
  };
  actions: {
    request_default_url: string;
    status_url: string;
    available_url: string;
    purchase_url: string;
  };
}

export interface SenderIDRequest {
  id: string;
  requested_sender_id: string;
  request_type: string;
  status: string;
  sample_content: string;
  created_at: string;
}

export interface AvailableSenderID {
  id: string;
  requested_sender_id: string;
  sample_content: string;
}

export interface SenderIDStatus {
  sms_balance: {
    credits: number;
    total_purchased: number;
    can_request_sender_id: boolean;
  };
  sender_id_requests: SenderIDRequest[];
}

export const useDefaultSender = () => {
  const [overview, setOverview] = useState<DefaultSenderOverview | null>(null);
  const [availableSenders, setAvailableSenders] = useState<AvailableSenderID[]>([]);
  const [status, setStatus] = useState<SenderIDStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  // Fetch default sender overview
  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getDefaultSenderOverview();
      
      if (response.success && response.data) {
        setOverview(response.data);
      } else {
        // Don't show error toast for API endpoints that might not exist yet
        console.warn('Default sender overview not available:', response.error);
        // Set a default overview to prevent blank page
        setOverview({
          default_sender: 'Taarifa-SMS',
          current_sender_id: null,
          active_request: null,
          can_request: true,
          reason: null,
          balance: {
            credits: 0,
            needs_purchase: true
          },
          actions: {
            request_default_url: '/api/messaging/sender-requests/request-default/',
            status_url: '/api/messaging/sender-requests/status/',
            available_url: '/api/messaging/sender-requests/available/',
            purchase_url: '/api/billing/sms/purchase/'
          }
        });
      }
    } catch (error) {
      console.warn('Default sender overview API not available:', error);
      // Set a default overview to prevent blank page
      setOverview({
        default_sender: 'Taarifa-SMS',
        current_sender_id: null,
        active_request: null,
        can_request: true,
        reason: null,
        balance: {
          credits: 0,
          needs_purchase: true
        },
        actions: {
          request_default_url: '/api/messaging/sender-requests/request-default/',
          status_url: '/api/messaging/sender-requests/status/',
          available_url: '/api/messaging/sender-requests/available/',
          purchase_url: '/api/billing/sms/purchase/'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available sender IDs
  const fetchAvailableSenders = async () => {
    try {
      const response = await apiClient.getAvailableSenderIDs();
      
      if (response.success && response.data) {
        setAvailableSenders(response.data.available_sender_ids || []);
      } else {
        console.warn('Available senders not available:', response.error);
        setAvailableSenders([]);
      }
    } catch (error) {
      console.warn('Available senders API not available:', error);
      setAvailableSenders([]);
    }
  };

  // Fetch sender ID status
  const fetchStatus = async () => {
    try {
      const response = await apiClient.getSenderIDRequestStatus();
      
      if (response.success && response.data) {
        setStatus(response.data);
      } else {
        console.warn('Sender ID status not available:', response.error);
        setStatus(null);
      }
    } catch (error) {
      console.warn('Sender ID status API not available:', error);
      setStatus(null);
    }
  };

  // Request default sender ID
  const requestDefaultSender = async () => {
    try {
      setIsRequesting(true);
      setError(null);

      const response = await apiClient.requestDefaultSenderID();
      
      if (response.success && response.data) {
        toast({
          title: "Default sender ID requested successfully",
          description: response.data.message || "Your request has been approved automatically",
        });

        // Refresh data to get updated status
        await Promise.all([fetchOverview(), fetchStatus(), fetchAvailableSenders()]);
        
        return { success: true, data: response.data };
      } else {
        const errorMessage = response.error || 'Failed to request default sender ID';
        toast({
          title: "Request failed",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast({
        title: "Request failed",
        description: "Failed to request default sender ID. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsRequesting(false);
    }
  };

  // Cancel/Detach default sender ID
  const cancelDefaultSender = async () => {
    try {
      setIsRequesting(true);
      setError(null);

      const response = await apiClient.cancelDefaultSenderID();

      if (response.success) {
        toast({
          title: "Default sender detached",
          description: response.message || "Default sender ID has been cancelled/detached",
        });

        await Promise.all([fetchOverview(), fetchStatus(), fetchAvailableSenders()]);
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to cancel default sender ID';
        toast({
          title: "Operation failed",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast({
        title: "Operation failed",
        description: "Failed to cancel default sender ID. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsRequesting(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchOverview(), fetchStatus(), fetchAvailableSenders()]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'approved': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
      'cancelled': 'outline',
      'rejected': 'destructive',
    };
    return variants[status] || 'outline';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✅";
      case "pending":
        return "⏳";
      case "failed":
        return "❌";
      case "cancelled":
        return "🚫";
      case "rejected":
        return "❌";
      default:
        return "📄";
    }
  };

  // Check if user can request default sender
  const canRequestDefaultSender = (): boolean => {
    return overview?.can_request || false;
  };

  // Check if user needs to purchase credits
  const needsPurchaseCredits = (): boolean => {
    return overview?.balance?.needs_purchase || false;
  };

  // Get current credits
  const getCurrentCredits = (): number => {
    return overview?.balance?.credits || 0;
  };

  // Get default sender name
  const getDefaultSenderName = (): string => {
    return overview?.default_sender || 'Taarifa-SMS';
  };

  // Get current active sender ID
  const getCurrentSenderID = (): string | null => {
    return overview?.current_sender_id || null;
  };

  // Get reason why can't request
  const getCannotRequestReason = (): string | null => {
    return overview?.reason || null;
  };

  // Get all available sender IDs (including default if approved)
  const getAllAvailableSenders = (): AvailableSenderID[] => {
    const senders = [...availableSenders];
    
    // Add default sender if it's approved and available
    if (overview?.active_request?.status === 'approved' && overview?.current_sender_id) {
      const defaultSenderExists = senders.some(s => s.requested_sender_id === overview.current_sender_id);
      if (!defaultSenderExists) {
        senders.unshift({
          id: overview.active_request.id,
          requested_sender_id: overview.current_sender_id,
          sample_content: overview.active_request.sample_content
        });
      }
    }
    
    return senders;
  };

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  return {
    // Data
    overview,
    availableSenders,
    status,
    
    // State
    isLoading,
    error,
    isRequesting,
    
    // Actions
    requestDefaultSender,
    cancelDefaultSender,
    refreshData,
    fetchOverview,
    fetchAvailableSenders,
    fetchStatus,
    
    // Utilities
    getStatusBadgeVariant,
    formatDate,
    getStatusIcon,
    canRequestDefaultSender,
    needsPurchaseCredits,
    getCurrentCredits,
    getDefaultSenderName,
    getCurrentSenderID,
    getCannotRequestReason,
    getAllAvailableSenders,
  };
};

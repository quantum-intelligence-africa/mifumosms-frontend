import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Square,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  BarChart3,
  Eye,
  RefreshCw,
  X,
  Target,
  DollarSign,
  Info
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateCampaignDialog } from "@/components/campaigns/CreateCampaignDialog";
import CampaignDetailsModal from "@/components/campaigns/CampaignDetailsModal";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { Contact } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStatusColorClass,
  formatCampaignCost,
  formatScheduleDescription
} from "@/utils/campaignUtils";

// Type definitions
interface Campaign {
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
  can_view_analytics: boolean;
  can_duplicate: boolean;
  can_delete: boolean;
  is_recurring: boolean;
  recurring_schedule: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_by: string;
  created_by_name: string;
  created_at: string;
  created_at_human?: string;
  updated_at: string;
  target_contact_count: number;
  target_contact_ids: string[];
  target_segment_ids: string[];
  target_segment_names: string[];
  target_criteria: {
    tags?: string[];
    groups?: string[];
    custom_fields?: Record<string, unknown>;
  };
}

interface Segment {
  id: string;
  name?: string;
  contact_count?: number;
  [key: string]: unknown;
}

const Campaigns = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<Campaign | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const searchParamsToObject = useCallback(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const setSearchParam = useCallback((key: string, value: string): void => {
    const params = searchParamsToObject();
    params[key] = value;
    setSearchParams(params);
  }, [searchParamsToObject, setSearchParams]);

  const removeSearchParamMemoized = useCallback((key: string): void => {
    const params = searchParamsToObject();
    if (params[key] !== undefined) {
      delete params[key];
      setSearchParams(params);
    }
  }, [searchParamsToObject, setSearchParams]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    message_text: '',
    campaign_type: '',
    scheduled_at: '',
    is_recurring: false,
    target_contact_count: 0,
    target_contact_ids: [],
    target_segment_ids: [],
    target_criteria: {
      tags: [] as string[],
      groups: [] as string[],
      custom_fields: {} as Record<string, unknown>
    },
    settings: {}
  });

  // Target audience state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [audienceMode, setAudienceMode] = useState<'contacts' | 'segments' | 'criteria'>('contacts');

  // Use smart campaign hook
  const {
    campaigns,
    summary,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    deleteCampaign,
    duplicateCampaign,
    refetch,
    refetchCampaigns: fetchCampaigns,
  } = useCampaigns();

  // Use contacts hook for target audience
  const {
    contacts,
    isLoading: contactsLoading,
  } = useContacts();

  const performWithRefreshing = useCallback(async (callback: () => Promise<void>): Promise<void> => {
    setIsRefreshing(true);
    try {
      await callback();
    } catch (err) {
      console.error('Campaign refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const runActionWithRefresh = useCallback(async (actionFn: () => Promise<unknown>): Promise<void> => {
    await performWithRefreshing(async () => {
      await actionFn();
      await Promise.all([fetchCampaigns(), refetch()]);
    });
  }, [performWithRefreshing, fetchCampaigns, refetch]);

  const refreshCampaignData = useCallback(async (): Promise<void> => {
    await performWithRefreshing(async () => {
      await Promise.all([fetchCampaigns(), refetch()]);
    });
  }, [performWithRefreshing, fetchCampaigns, refetch]);

  const handleCampaignClick = useCallback((campaign: Campaign) => {
    setSelectedCampaignForDetails(campaign);
    setIsDetailsModalOpen(true);
    setSearchParam("campaign", campaign.id);
    removeSearchParamMemoized("mode");
    removeSearchParamMemoized("action");
  }, [removeSearchParamMemoized, setSearchParam]);

  const populateEditForm = (campaign: Campaign): void => {
    setEditForm({
      name: campaign.name || '',
      description: campaign.description || '',
      message_text: campaign.message_text || '',
      campaign_type: campaign.campaign_type || '',
      scheduled_at: campaign.scheduled_at || '',
      is_recurring: campaign.is_recurring || false,
      target_contact_count: campaign.target_contact_count || 0,
      target_contact_ids: campaign.target_contact_ids || [],
      target_segment_ids: campaign.target_segment_ids || [],
      target_criteria: campaign.target_criteria ? {
        tags: campaign.target_criteria.tags || [],
        groups: campaign.target_criteria.groups || [],
        custom_fields: campaign.target_criteria.custom_fields || {}
      } : {
        tags: [],
        groups: [],
        custom_fields: {}
      },
      settings: campaign.settings || {}
    });
  };

  const openEditDialog = useCallback((campaign: Campaign): void => {
    setSelectedCampaign(campaign);
    populateEditForm(campaign);
    setIsEditMode(true);
    setIsCampaignDetailsOpen(true);
    setIsDetailsModalOpen(false);
    setSearchParam("campaign", campaign.id);
    setSearchParam("mode", "edit");
    removeSearchParamMemoized("action");
  }, [removeSearchParamMemoized, setSearchParam]);

  const closeCampaignDialog = useCallback((): void => {
    setIsCampaignDetailsOpen(false);
    setIsEditMode(false);
    setSelectedCampaign(null);
    removeSearchParamMemoized("mode");
    removeSearchParamMemoized("campaign");
  }, [removeSearchParamMemoized]);

  const handleCampaignDialogOpenChange = (open: boolean) => {
    if (open) {
      setIsCampaignDetailsOpen(true);
    } else {
      closeCampaignDialog();
    }
  };

  const handleCampaignAction = useCallback(async (action: string, campaignId: string): Promise<void> => {
    try {
      // Find the campaign to check permissions
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check permissions before executing actions
    switch (action) {
      case 'start':
          if (!campaign.can_start) {
            throw new Error('You do not have permission to start this campaign');
          }
          await runActionWithRefresh(() => startCampaign(campaignId));
        break;
      case 'pause':
          if (!campaign.can_pause) {
            throw new Error('You do not have permission to pause this campaign');
          }
          await runActionWithRefresh(() => pauseCampaign(campaignId));
        break;
      case 'cancel':
          if (!campaign.can_cancel) {
            throw new Error('You do not have permission to cancel this campaign');
          }
          await runActionWithRefresh(() => cancelCampaign(campaignId));
        break;
      case 'duplicate':
          if (!campaign.can_duplicate) {
            throw new Error('You do not have permission to duplicate this campaign');
          }
          await runActionWithRefresh(() => duplicateCampaign(campaignId));
        break;
      case 'delete':
          if (!campaign.can_delete) {
            throw new Error('You do not have permission to delete this campaign');
          }
        if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            await runActionWithRefresh(() => deleteCampaign(campaignId));
          }
          break;
        case 'view_analytics':
          if (!campaign.can_view_analytics) {
            throw new Error('You do not have permission to view analytics for this campaign');
          }
          // Navigate to analytics page with campaign filter
          window.location.href = `/analytics?campaign=${campaignId}`;
          break;
        case 'edit':
          if (!campaign.can_edit) {
            throw new Error('You do not have permission to edit this campaign');
          }
          openEditDialog(campaign);
        break;
      }
    } catch (error) {
      // Show error message only after refresh attempt
      console.error(`Campaign action ${action} failed:`, error);
      // The error will be handled by the individual campaign action functions
      // which already show appropriate toast messages
    } finally {
      setIsRefreshing(false);
    }
  }, [campaigns, startCampaign, pauseCampaign, cancelCampaign, duplicateCampaign, deleteCampaign, openEditDialog, runActionWithRefresh]);

  // Check if we should open the new campaign dialog
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewCampaignOpen(true);
      removeSearchParamMemoized("new");
    }
  }, [searchParams, removeSearchParamMemoized]);

  useEffect(() => {
    const campaignParam = searchParams.get("campaign");
    const modeParam = searchParams.get("mode");
    const actionParam = searchParams.get("action");

    if (!campaignParam || !Array.isArray(campaigns) || campaigns.length === 0) {
      return;
    }

    const campaign = campaigns.find((c) => c.id === campaignParam);
    if (!campaign) {
      removeSearchParamMemoized("campaign");
      removeSearchParamMemoized("mode");
      removeSearchParamMemoized("action");
      return;
    }

    if (actionParam) {
      // Let action-specific effects handle navigation.
      return;
    }

    if (modeParam === "edit") {
      openEditDialog(campaign);
    } else {
      setSelectedCampaignForDetails(campaign);
      setIsDetailsModalOpen(true);
    }
  }, [searchParams, campaigns, openEditDialog, removeSearchParamMemoized]);

  useEffect(() => {
    const actionParam = searchParams.get("action");
    const campaignParam = searchParams.get("campaign");

    if (actionParam !== "duplicate" || !campaignParam || !Array.isArray(campaigns) || campaigns.length === 0) {
      return;
    }

    const campaign = campaigns.find((c) => c.id === campaignParam);
    if (!campaign) {
      removeSearchParamMemoized("campaign");
      removeSearchParamMemoized("action");
      return;
    }

    (async () => {
      try {
        await handleCampaignAction("duplicate", campaign.id);
      } finally {
        removeSearchParamMemoized("action");
        removeSearchParamMemoized("campaign");
      }
    })();
  }, [searchParams, campaigns, handleCampaignAction, removeSearchParamMemoized]);

  // Reset dialog state when it closes
  const handleDialogClose = (open: boolean) => {
    setIsNewCampaignOpen(open);
    if (!open) {
      removeSearchParamMemoized("new");
    }
  };

  // Filter campaigns based on search and filters
  const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.campaign_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  // Handle form input changes
  const handleFormChange = (field: string, value: unknown): void => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSaveCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      const result = await updateCampaign(selectedCampaign.id, editForm);
      if (result) {
        setIsEditMode(false);
        closeCampaignDialog();
        // Refresh campaigns list
        await fetchCampaigns();

        // Refresh the entire page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditForm({
      name: '',
      description: '',
      message_text: '',
      campaign_type: '',
      scheduled_at: '',
      is_recurring: false,
      target_contact_count: 0,
      target_contact_ids: [],
      target_segment_ids: [],
      target_criteria: {
        tags: [],
        groups: [],
        custom_fields: {}
      },
      settings: {}
    });
    setSelectedContacts([]);
    setSelectedSegments([]);
    setAudienceMode('contacts');
    closeCampaignDialog();
  };

  // Handle contact selection
  const handleContactToggle = (contact: Contact): void => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Handle segment selection
  const handleSegmentToggle = (segment: Segment): void => {
    setSelectedSegments(prev => {
      const isSelected = prev.some(s => s.id === segment.id);
      if (isSelected) {
        return prev.filter(s => s.id !== segment.id);
      } else {
        return [...prev, segment];
      }
    });
  };

  // Update form with selected audience
  const updateAudienceInForm = (): void => {
    setEditForm(prev => ({
      ...prev,
      target_contact_ids: selectedContacts.map(c => c.id),
      target_segment_ids: selectedSegments.map(s => s.id),
      target_contact_count: selectedContacts.length + selectedSegments.reduce((total, segment) => {
        const contactCount = typeof segment.contact_count === 'number' ? segment.contact_count : 0;
        return total + contactCount;
      }, 0)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Loading skeletons */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="grid grid-cols-3 gap-2 lg:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 lg:h-32" />
                ))}
              </div>

              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Campaigns</h3>
                  <p className="text-text-subtle mb-4">{error}</p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 lg:p-4 xl:p-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 lg:gap-4">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  {language === "sw" ? "Kampeni" : "Campaigns"}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  {language === "sw" ? "Dhibiti na fuatilia kampeni zako za masoko" : "Manage and track your marketing campaigns"}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  onClick={refreshCampaignData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {language === "sw" ? "Sasisha" : "Refresh"}
                </Button>
                <CreateCampaignDialog
                  open={isNewCampaignOpen}
                  onOpenChange={handleDialogClose}
                  onSuccess={refreshCampaignData}
                >
                  <Button className="gap-1 sm:gap-2 text-xs sm:text-sm" size="sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{language === "sw" ? "Ongeza Kampeni Mpya" : "Add New Campaign"}</span>
                    <span className="sm:hidden">{language === "sw" ? "Ongeza" : "Add New"}</span>
                  </Button>
                </CreateCampaignDialog>
              </div>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
                <Card>
                  <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-1 sm:mb-2 lg:mb-0">
                        <p className="text-xs font-medium text-text-subtle mb-1">{language === "sw" ? "Jumla ya kampeni" : "Total Campaigns"}</p>
                        <p className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-foreground">{summary.summary.total_campaigns}</p>
                      </div>
                      <div className="p-1 sm:p-1.5 lg:p-2 xl:p-3 rounded-lg lg:rounded-xl bg-primary/10 flex-shrink-0 self-start lg:self-auto">
                        <Send className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-1 sm:mb-2 lg:mb-0">
                        <p className="text-xs font-medium text-text-subtle mb-1 whitespace-nowrap">{language === "sw" ? "Kampeni zinazoendelea" : "Active Campaigns"}</p>
                        <p className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-foreground">{summary.summary.active_campaigns}</p>
                      </div>
                      <div className="p-1 sm:p-1.5 lg:p-2 xl:p-3 rounded-lg lg:rounded-xl bg-green-100 flex-shrink-0 self-start lg:self-auto">
                        <Play className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-green-500" />
                      </div>
                      </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-1 sm:mb-2 lg:mb-0">
                        <p className="text-xs font-medium text-text-subtle mb-1">{language === "sw" ? "Jumla ya wapokeaji" : "Total Recipients"}</p>
                        <p className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-foreground">{summary.summary.total_recipients.toLocaleString()}</p>
                      </div>
                      <div className="p-1 sm:p-1.5 lg:p-2 xl:p-3 rounded-lg lg:rounded-xl bg-blue-100 flex-shrink-0 self-start lg:self-auto">
                        <Users className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Campaign Management Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs sm:text-sm text-blue-900">
                <span className="font-semibold">Campaign Management:</span> Create single or recurring campaigns. SMS costs 18 TZS per segment (160 characters).
                <span className="ml-2 font-semibold">Recurring campaigns</span> execute on your schedule and deduct credits each time.
                <span className="ml-2">
                  <button
                    onClick={() => navigate('/integration-guide#campaign-management')}
                    className="font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                  >
                    View guide
                  </button>
                </span>
              </AlertDescription>
            </Alert>

              {/* Filters */}
            <Card>
              <CardContent className="p-2 sm:p-3 lg:p-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-3 h-3 sm:w-4 sm:h-4" />
                  <Input
                    placeholder={language === "sw" ? "Tafuta kampeni..." : "Search campaigns..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-9"
                  />
                </div>
                  </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 lg:w-48 text-xs sm:text-sm h-8 sm:h-9">
                    <SelectValue placeholder={language === "sw" ? "Chuja kwa hali" : "Filter by status"} />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "sw" ? "Hali zote" : "All Status"}</SelectItem>
                    <SelectItem value="draft">{language === "sw" ? "Rasimu" : "Draft"}</SelectItem>
                    <SelectItem value="scheduled">{language === "sw" ? "Imeratibiwa" : "Scheduled"}</SelectItem>
                    <SelectItem value="running">{language === "sw" ? "Inaendelea" : "Running"}</SelectItem>
                    <SelectItem value="paused">{language === "sw" ? "Imesitishwa" : "Paused"}</SelectItem>
                    <SelectItem value="completed">{language === "sw" ? "Imekamilika" : "Completed"}</SelectItem>
                      <SelectItem value="cancelled">{language === "sw" ? "Imeghairiwa" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40 lg:w-48 text-xs sm:text-sm h-8 sm:h-9">
                    <SelectValue placeholder={language === "sw" ? "Chuja kwa aina" : "Filter by type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "sw" ? "Aina zote" : "All Types"}</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="mixed">{language === "sw" ? "Mchanganyiko" : "Mixed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

            {/* Campaigns Table */}
            <Card className="relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === "sw" ? "Inasasisha kampeni..." : "Refreshing campaigns..."}
                  </div>
                </div>
              )}
              <CardHeader className="p-3 lg:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-base lg:text-xl">{language === "sw" ? "Kampeni" : "Campaigns"}</span>
                  <span className="text-xs lg:text-sm font-normal text-text-subtle">
                    {filteredCampaigns.length} {filteredCampaigns.length === 1 ? (language === "sw" ? "kampeni" : "campaign") : (language === "sw" ? "kampeni" : "campaigns")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
              {filteredCampaigns.length === 0 ? (
                  <div className="p-4 lg:p-12 text-center">
                    <MessageSquare className="w-6 h-6 lg:w-12 lg:h-12 text-text-subtle mx-auto mb-3" />
                    <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-2">
                      {language === "sw" ? "Hakuna kampeni" : "No campaigns found"}
                    </h3>
                    <p className="text-xs lg:text-base text-text-subtle">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? (language === "sw" ? "Jaribu kubadilisha vichujio ili kuona kampeni zaidi." : "Try adjusting your filters to see more campaigns.")
                        : (language === "sw" ? "Hakuna kampeni iliyoundwa bado." : "No campaigns have been created yet.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Table Header */}
                    <div className="px-2 lg:px-6 py-2 bg-muted/50 border-b border-border-subtle">
                      <div className="grid grid-cols-12 gap-1 lg:gap-4 text-xs font-medium text-text-subtle">
                        <div className="col-span-6 sm:col-span-4">{language === "sw" ? "Kampeni" : "Campaign"}</div>
                        <div className="col-span-3 sm:col-span-2 hidden sm:block">{language === "sw" ? "Hali" : "Status"}</div>
                        <div className="col-span-3 sm:col-span-2 hidden md:block">{language === "sw" ? "Aina" : "Type"}</div>
                        <div className="col-span-0 sm:col-span-2 hidden lg:block">{language === "sw" ? "Wapokeaji" : "Recipients"}</div>
                        <div className="col-span-0 sm:col-span-1 hidden lg:block">{language === "sw" ? "Maendeleo" : "Progress"}</div>
                        <div className="col-span-3 sm:col-span-1">{language === "sw" ? "Vitendo" : "Actions"}</div>
                      </div>
                    </div>

                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign.id} className="border-b border-border-subtle last:border-b-0 hover:bg-muted/50 transition-colors">
                        <div className="px-2 lg:px-6 py-2 lg:py-3">
                           {/* Mobile Layout - Ultra Compact */}
                           <div className="block sm:hidden p-2">
                             {/* Header Row */}
                             <div className="flex items-start justify-between mb-2">
                               <div className="flex-1 min-w-0 pr-2">
                                 <h3
                                   className="text-xs font-semibold text-foreground truncate leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                                   onClick={() => handleCampaignClick(campaign)}
                                 >
                                   {campaign.name}
                                 </h3>
                                 {campaign.description && (
                                   <p className="text-xs text-text-subtle truncate mt-0.5 leading-tight">
                                     {campaign.description}
                                   </p>
                                 )}
                               </div>
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                     <MoreVertical className="w-3 h-3" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass">
                                  {campaign.can_start ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('start', campaign.id)}>
                                      <Play className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Endesha Kampeni" : "Start Campaign"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Play className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Endesha Kampeni" : "Start Campaign"}
                                    </DropdownMenuItem>
                                  )}
                                  {campaign.can_pause ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('pause', campaign.id)}>
                                      <Pause className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Sitisha Kampeni" : "Pause Campaign"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Pause className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Sitisha Kampeni" : "Pause Campaign"}
                                    </DropdownMenuItem>
                                  )}
                                  {campaign.can_cancel ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('cancel', campaign.id)}>
                                      <Square className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Ghairi Kampeni" : "Cancel Campaign"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Square className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Ghairi Kampeni" : "Cancel Campaign"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleCampaignClick(campaign)}>
                                    <Eye className="w-3 h-3 mr-2" />
                                    {language === "sw" ? "Tazama Maelezo" : "View Campaign Details"}
                                  </DropdownMenuItem>
                                  {campaign.can_edit ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('edit', campaign.id)}>
                                      <Edit className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Badilisha Kampeni" : "Edit Campaign"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Edit className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Badilisha Kampeni" : "Edit Campaign"}
                                    </DropdownMenuItem>
                                  )}
                                  {campaign.can_duplicate ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('duplicate', campaign.id)}>
                                      <Copy className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Kunakili" : "Duplicate"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Copy className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Kunakili" : "Duplicate"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {campaign.can_delete ? (
                                    <DropdownMenuItem
                                      onClick={() => handleCampaignAction('delete', campaign.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Futa" : "Delete"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      {language === "sw" ? "Futa" : "Delete"}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                             </div>

                             {/* Status and Type Row */}
                             <div className="flex items-center gap-1 mb-2">
                               <Badge className={`${getStatusColor(campaign.status)} text-xs px-1.5 py-0.5`}>
                                 {getStatusIcon(campaign.status)}
                                 <span className="ml-1 text-xs">{campaign.status_display}</span>
                               </Badge>
                               <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                 {campaign.campaign_type_display}
                               </Badge>
                             </div>

                             {/* Metrics Row - Compact Grid */}
                             <div className="grid grid-cols-2 gap-1 text-xs text-text-subtle mb-2">
                               <div className="flex items-center gap-1">
                                 <Users className="w-3 h-3" />
                                 <span>{campaign.total_recipients}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <Send className="w-3 h-3" />
                                 <span>{campaign.sent_count}</span>
                               </div>
                             </div>

                             {/* Cost and Recurring Row */}
                             <div className="grid grid-cols-2 gap-1 text-xs text-text-subtle mb-2">
                               {campaign.actual_cost && (
                                 <div className="flex items-center gap-1">
                                   <DollarSign className="w-3 h-3" />
                                   <span>{Math.round(campaign.actual_cost).toLocaleString()} TZS</span>
                                 </div>
                               )}
                               {campaign.is_recurring && (
                                 <div className="flex items-center gap-1 text-blue-600 font-semibold">
                                   <Clock className="w-3 h-3" />
                                   <span>Recurring</span>
                                 </div>
                               )}
                             </div>

                             {/* Progress Row - Only show if running */}
                             {campaign.status === 'running' && (
                               <div className="mb-2">
                                 <div className="flex items-center justify-between text-xs text-text-subtle mb-1">
                                   <span>{language === "sw" ? "Maendeleo" : "Progress"}</span>
                                   <span>{campaign.progress_percentage}%</span>
                                 </div>
                                 <div className="w-full bg-muted rounded-full h-1.5">
                                   <div
                                     className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                     style={{ width: `${campaign.progress_percentage}%` }}
                                   />
                                 </div>
                               </div>
                             )}

                             {/* Delivery Stats Row - Ultra Compact */}
                             <div className="grid grid-cols-2 gap-1 text-xs text-text-subtle">
                               <div className="flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" />
                                 <span>{campaign.delivered_count} {language === "sw" ? "imewasilishwa" : "delivered"}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <TrendingUp className="w-3 h-3" />
                                 <span>{campaign.delivery_rate}% {language === "sw" ? "kiwango" : "rate"}</span>
                               </div>
                             </div>

                             {/* Date Row - Compact */}
                             <div className="flex items-center gap-1 text-xs text-text-subtle mt-2">
                               <Calendar className="w-3 h-3" />
                               <span>{language === "sw" ? "Iliundwa" : "Created"} {new Date(campaign.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                             </div>
                           </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:grid grid-cols-12 gap-1 lg:gap-4 items-center">
                            {/* Campaign Column */}
                            <div className="col-span-4">
                              <div className="flex flex-col">
                                <h3
                                  className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => handleCampaignClick(campaign)}
                                >
                                  {campaign.name}
                                </h3>
                                {campaign.description && (
                                  <p className="text-xs text-text-subtle truncate mt-0.5">
                                    {campaign.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status Column */}
                            <div className="col-span-2">
                              <Badge className={`${getStatusColor(campaign.status)} text-xs px-1.5 py-0.5`}>
                                {getStatusIcon(campaign.status)}
                                <span className="ml-1 capitalize">{campaign.status_display}</span>
                              </Badge>
                            </div>

                            {/* Type Column */}
                            <div className="col-span-2 hidden md:block">
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                {campaign.campaign_type_display}
                              </Badge>
                            </div>

                            {/* Recipients Column */}
                            <div className="col-span-2 hidden lg:block">
                              <div className="text-xs text-text-subtle">
                                {campaign.total_recipients.toLocaleString()}
                              </div>
                            </div>

                            {/* Progress Column */}
                            <div className="col-span-1 hidden lg:block">
                              {campaign.status === 'running' ? (
                                <div className="text-xs text-text-subtle">
                                  {campaign.progress_percentage}%
                                </div>
                              ) : (
                                <div className="text-xs text-text-subtle">-</div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div className="col-span-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                            {campaign.can_start ? (
                              <DropdownMenuItem onClick={() => handleCampaignAction('start', campaign.id)}>
                                <Play className="w-3 h-3 mr-2" />
                                Start Campaign
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <Play className="w-3 h-3 mr-2" />
                                Start Campaign
                              </DropdownMenuItem>
                            )}
                            {campaign.can_pause ? (
                              <DropdownMenuItem onClick={() => handleCampaignAction('pause', campaign.id)}>
                                  <Pause className="w-3 h-3 mr-2" />
                                  Pause Campaign
                                </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                  <Pause className="w-3 h-3 mr-2" />
                                  Pause Campaign
                                </DropdownMenuItem>
                              )}
                            {campaign.can_cancel ? (
                              <DropdownMenuItem onClick={() => handleCampaignAction('cancel', campaign.id)}>
                                <Square className="w-3 h-3 mr-2" />
                                Cancel Campaign
                                </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <Square className="w-3 h-3 mr-2" />
                                Cancel Campaign
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCampaignClick(campaign)}>
                              <Eye className="w-3 h-3 mr-2" />
                              View Campaign Details
                            </DropdownMenuItem>
                            {campaign.can_edit ? (
                              <DropdownMenuItem onClick={() => handleCampaignAction('edit', campaign.id)}>
                                <Edit className="w-3 h-3 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                              <Edit className="w-3 h-3 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            )}
                            {campaign.can_duplicate ? (
                            <DropdownMenuItem onClick={() => handleCampaignAction('duplicate', campaign.id)}>
                              <Copy className="w-3 h-3 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <Copy className="w-3 h-3 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {campaign.can_delete ? (
                            <DropdownMenuItem
                              onClick={() => handleCampaignAction('delete', campaign.id)}
                              className="text-red-600"
                            >
                                <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Campaign Edit Modal */}
      <Dialog open={isCampaignDetailsOpen} onOpenChange={handleCampaignDialogOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm sm:text-base flex items-center gap-1">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              {isEditMode ? 'Edit Campaign' : 'Campaign Details'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditMode ? 'Edit campaign information and settings' : 'View campaign information'}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-3 sm:space-y-4">
              {isEditMode ? (
                // Edit Form
                <div className="space-y-3 sm:space-y-4">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="name" className="text-xs sm:text-sm">Campaign Name</Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            placeholder="Enter campaign name"
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="campaign_type" className="text-xs sm:text-sm">Campaign Type</Label>
                          <Select
                            value={editForm.campaign_type}
                            onValueChange={(value) => handleFormChange('campaign_type', value)}
                          >
                            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Enter campaign description"
                          rows={2}
                          maxLength={160}
                          className="text-xs sm:text-sm"
                        />
                        <p className="text-[10px] text-text-subtle mt-1">
                          {editForm.description.length}/160 characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Content */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base">Message Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="message_text" className="text-xs sm:text-sm">Message Text</Label>
                        <Textarea
                          id="message_text"
                          value={editForm.message_text}
                          onChange={(e) => handleFormChange('message_text', e.target.value)}
                          placeholder="Enter your message content"
                          rows={4}
                          maxLength={160}
                          className="text-xs sm:text-sm"
                        />
                        <p className="text-[10px] text-text-subtle mt-1">
                          {editForm.message_text.length}/160 characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scheduling */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base">Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="scheduled_at" className="text-xs sm:text-sm">Scheduled Date & Time</Label>
                        <Input
                          id="scheduled_at"
                          type="datetime-local"
                          value={editForm.scheduled_at}
                          onChange={(e) => handleFormChange('scheduled_at', e.target.value)}
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_recurring"
                          checked={editForm.is_recurring}
                          onCheckedChange={(checked) => handleFormChange('is_recurring', checked)}
                          className="h-3 w-3"
                        />
                        <Label htmlFor="is_recurring" className="text-xs sm:text-sm">Recurring Campaign</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Target Audience */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Audience Mode Selection */}
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Button
                          variant={audienceMode === 'contacts' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('contacts')}
                          className="text-xs h-7 sm:h-8"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Individual Contacts</span>
                          <span className="sm:hidden">Contacts</span>
                        </Button>
                        <Button
                          variant={audienceMode === 'segments' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('segments')}
                          className="text-xs h-7 sm:h-8"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Contact Segments</span>
                          <span className="sm:hidden">Segments</span>
                        </Button>
                        <Button
                          variant={audienceMode === 'criteria' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('criteria')}
                          className="text-xs h-7 sm:h-8"
                        >
                          <Filter className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Custom Criteria</span>
                          <span className="sm:hidden">Criteria</span>
                        </Button>
                      </div>

                      {/* Audience Summary */}
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium">Total Audience:</span>
                          <span className="text-sm sm:text-base font-bold text-primary">
                            {editForm.target_contact_count} contacts
                          </span>
                        </div>
                        {selectedContacts.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedContacts.length} individual contacts selected
                          </div>
                        )}
                        {selectedSegments.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedSegments.length} segments selected
                          </div>
                        )}
                      </div>

                      {/* Individual Contacts Selection */}
                      {audienceMode === 'contacts' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Select Contacts</Label>
                            <span className="text-sm text-muted-foreground">
                              {selectedContacts.length} selected
                            </span>
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-lg">
                            {contactsLoading ? (
                              <div className="p-4 text-center text-muted-foreground">
                                Loading contacts...
                              </div>
                            ) : contacts && contacts.length > 0 ? (
                              contacts.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer"
                                  onClick={() => handleContactToggle(contact)}
                                >
                                  <Checkbox
                                    checked={selectedContacts.some(c => c.id === contact.id)}
                                    onChange={() => handleContactToggle(contact)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {contact.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.phone_e164 || contact.email}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                No contacts available
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Segments Selection */}
                      {audienceMode === 'segments' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Select Segments</Label>
                            <span className="text-sm text-muted-foreground">
                              {selectedSegments.length} selected
                            </span>
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-lg">
                            <div className="p-4 text-center text-muted-foreground">
                              Segments feature coming soon
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Criteria */}
                      {audienceMode === 'criteria' && (
                        <div className="space-y-3">
                          <Label>Custom Audience Criteria</Label>
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Advanced audience targeting based on custom criteria will be available soon.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Update Audience Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={updateAudienceInForm}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Audience Selection
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Campaign Stats (Read-only) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{selectedCampaign.sent_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{selectedCampaign.delivered_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{selectedCampaign.read_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Read</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{selectedCampaign.failed_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button onClick={handleSaveCampaign} className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6">
                  {/* Campaign Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedCampaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedCampaign.campaign_type_display}</Badge>
                        <Badge
                          variant={selectedCampaign.status === 'completed' ? 'default' :
                                  selectedCampaign.status === 'running' ? 'secondary' : 'outline'}
                        >
                          {selectedCampaign.status_display}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{selectedCampaign.created_at_human}</p>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{selectedCampaign.sent_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedCampaign.delivered_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedCampaign.read_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Read</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{selectedCampaign.failed_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  {/* Campaign Message Preview */}
                  <div>
                    <h4 className="font-medium mb-2">Message Content</h4>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="text-sm">{selectedCampaign.message_text || "No message content available"}</p>
                    </div>
                  </div>

                  {/* Campaign Settings */}
                  <div>
                    <h4 className="font-medium mb-2">Campaign Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Audience:</span>
                        <span>{selectedCampaign.total_recipients || 0} contacts</span>
                      </div>
                      {selectedCampaign.target_contact_ids && selectedCampaign.target_contact_ids.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Individual Contacts:</span>
                          <span>{selectedCampaign.target_contact_ids.length} selected</span>
                        </div>
                      )}
                      {selectedCampaign.target_segment_ids && selectedCampaign.target_segment_ids.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact Segments:</span>
                          <span>{selectedCampaign.target_segment_ids.length} selected</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scheduled Time:</span>
                        <span>{selectedCampaign.scheduled_at || "Immediate"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Channel:</span>
                        <span className="capitalize">{selectedCampaign.campaign_type_display}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recurring:</span>
                        <span>{selectedCampaign.is_recurring ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedCampaign.can_edit && (
                      <Button
                        onClick={() => setIsEditMode(true)}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Campaign
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={closeCampaignDialog}
                      className={`${selectedCampaign.can_edit ? "flex-1" : "w-full"} text-xs sm:text-sm h-8 sm:h-9`}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        campaign={selectedCampaignForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCampaignForDetails(null);
          removeSearchParamMemoized("campaign");
        }}
        onAction={handleCampaignAction}
      />
    </div>
  );
};

export default Campaigns;

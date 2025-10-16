import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Target
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";

const Campaigns = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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
      tags: [],
      groups: [],
      custom_fields: {}
    },
    settings: {}
  });

  // Target audience state
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<any[]>([]);
  const [audienceMode, setAudienceMode] = useState<'contacts' | 'segments' | 'criteria'>('contacts');

  // Use smart campaign hook
  const {
    campaigns,
    summary,
    isLoading,
    error,
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
    segments,
    isLoading: contactsLoading,
  } = useContacts();

  // Check if we should open the new campaign dialog
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewCampaignOpen(true);
      // Remove the parameter from URL after opening
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Reset dialog state when it closes
  const handleDialogClose = (open: boolean) => {
    setIsNewCampaignOpen(open);
    if (!open) {
      // Reset form state when dialog closes
      setSearchParams({});
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

  const handleCampaignAction = async (action: string, campaignId: string) => {
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
          await startCampaign(campaignId);
          // Refresh data after action
          setIsRefreshing(true);
          await fetchCampaigns();
          setIsRefreshing(false);
        break;
      case 'pause':
          if (!campaign.can_pause) {
            throw new Error('You do not have permission to pause this campaign');
          }
          await pauseCampaign(campaignId);
          // Refresh data after action
          setIsRefreshing(true);
          await fetchCampaigns();
          setIsRefreshing(false);
        break;
      case 'cancel':
          if (!campaign.can_cancel) {
            throw new Error('You do not have permission to cancel this campaign');
          }
          const cancelResult = await cancelCampaign(campaignId);
          if (!cancelResult) {
            // Refresh data first, then show error if still failing
            setIsRefreshing(true);
            await fetchCampaigns();
            setIsRefreshing(false);
            const updatedCampaign = campaigns.find(c => c.id === campaignId);
            if (updatedCampaign?.status !== 'cancelled') {
              throw new Error('Failed to cancel campaign. Please try again.');
            }
          }
        break;
      case 'duplicate':
          if (!campaign.can_duplicate) {
            throw new Error('You do not have permission to duplicate this campaign');
          }
          const duplicateResult = await duplicateCampaign(campaignId);
          if (!duplicateResult) {
            // Refresh data first, then show error if still failing
            setIsRefreshing(true);
            await fetchCampaigns();
            setIsRefreshing(false);
            throw new Error('Failed to duplicate campaign. Please try again.');
          }
        break;
      case 'delete':
          if (!campaign.can_delete) {
            throw new Error('You do not have permission to delete this campaign');
          }
        if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            const deleteResult = await deleteCampaign(campaignId);
            if (!deleteResult) {
              // Refresh data first, then show error if still failing
              setIsRefreshing(true);
              await fetchCampaigns();
              setIsRefreshing(false);
              const campaignStillExists = campaigns.find(c => c.id === campaignId);
              if (campaignStillExists) {
                throw new Error('Failed to delete campaign. Please try again.');
              }
            }
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
          // Find the campaign and open edit form
          if (campaign) {
            setSelectedCampaign(campaign);
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
              target_criteria: campaign.target_criteria || {
                tags: [],
                groups: [],
                custom_fields: {}
              },
              settings: campaign.settings || {}
            });
            setIsEditMode(true);
            setIsCampaignDetailsOpen(true);
          }
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
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: any) => {
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
        setIsCampaignDetailsOpen(false);
        // Refresh campaigns list
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsCampaignDetailsOpen(false);
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
  };

  // Handle contact selection
  const handleContactToggle = (contact: any) => {
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
  const handleSegmentToggle = (segment: any) => {
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
  const updateAudienceInForm = () => {
    setEditForm(prev => ({
      ...prev,
      target_contact_ids: selectedContacts.map(c => c.id),
      target_segment_ids: selectedSegments.map(s => s.id),
      target_contact_count: selectedContacts.length + selectedSegments.reduce((total, segment) => total + (segment.contact_count || 0), 0)
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
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Campaigns</h1>
                  <p className="text-sm lg:text-base text-text-subtle">
                  Manage and track your marketing campaigns
                  </p>
                </div>
              <CreateCampaignDialog
                open={isNewCampaignOpen}
                onOpenChange={handleDialogClose}
              >
                <Button className="gap-2 text-sm" size="sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Campaign</span>
                    </Button>
              </CreateCampaignDialog>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-3 gap-2 lg:gap-6">
                <Card>
                  <CardContent className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-2 lg:mb-0">
                        <p className="text-xs lg:text-sm font-medium text-text-subtle mb-1">Total Campaigns</p>
                        <p className="text-sm lg:text-2xl font-bold text-foreground">{summary.summary.total_campaigns}</p>
                      </div>
                      <div className="p-1.5 lg:p-3 rounded-lg lg:rounded-xl bg-primary/10 flex-shrink-0 self-start lg:self-auto">
                        <MessageSquare className="w-3 h-3 lg:w-5 lg:h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-2 lg:mb-0">
                        <p className="text-xs lg:text-sm font-medium text-text-subtle mb-1">Active Campaigns</p>
                        <p className="text-sm lg:text-2xl font-bold text-foreground">{summary.summary.active_campaigns}</p>
                      </div>
                      <div className="p-1.5 lg:p-3 rounded-lg lg:rounded-xl bg-green-100 flex-shrink-0 self-start lg:self-auto">
                        <Play className="w-3 h-3 lg:w-5 lg:h-5 text-green-500" />
                      </div>
                      </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 min-w-0 mb-2 lg:mb-0">
                        <p className="text-xs lg:text-sm font-medium text-text-subtle mb-1">Total Recipients</p>
                        <p className="text-sm lg:text-2xl font-bold text-foreground">{summary.summary.total_recipients.toLocaleString()}</p>
                      </div>
                      <div className="p-1.5 lg:p-3 rounded-lg lg:rounded-xl bg-blue-100 flex-shrink-0 self-start lg:self-auto">
                        <Users className="w-3 h-3 lg:w-5 lg:h-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

              {/* Filters */}
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                  </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48 text-sm">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>

                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                    </div>
                  </CardContent>
                </Card>

            {/* Campaigns Table */}
            <Card className="relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refreshing campaigns...
                  </div>
                </div>
              )}
              <CardHeader className="p-3 lg:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-base lg:text-xl">Campaigns</span>
                  <span className="text-xs lg:text-sm font-normal text-text-subtle">
                    {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
              {filteredCampaigns.length === 0 ? (
                  <div className="p-4 lg:p-12 text-center">
                    <MessageSquare className="w-6 h-6 lg:w-12 lg:h-12 text-text-subtle mx-auto mb-3" />
                    <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-2">No campaigns found</h3>
                    <p className="text-xs lg:text-base text-text-subtle">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters to see more campaigns."
                        : "No campaigns have been created yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Table Header */}
                    <div className="px-2 lg:px-6 py-2 bg-muted/50 border-b border-border-subtle">
                      <div className="grid grid-cols-12 gap-1 lg:gap-4 text-xs font-medium text-text-subtle">
                        <div className="col-span-6 sm:col-span-4">Campaign</div>
                        <div className="col-span-3 sm:col-span-2 hidden sm:block">Status</div>
                        <div className="col-span-3 sm:col-span-2 hidden md:block">Type</div>
                        <div className="col-span-0 sm:col-span-2 hidden lg:block">Recipients</div>
                        <div className="col-span-0 sm:col-span-1 hidden lg:block">Progress</div>
                        <div className="col-span-3 sm:col-span-1">Actions</div>
                      </div>
                    </div>

                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign.id} className="border-b border-border-subtle last:border-b-0 hover:bg-muted/50 transition-colors">
                        <div className="px-2 lg:px-6 py-2 lg:py-3">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground truncate">
                                  {campaign.name}
                                </h3>
                                {campaign.description && (
                                  <p className="text-xs text-text-subtle truncate mt-0.5">
                                    {campaign.description}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
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
                                  {campaign.can_view_analytics ? (
                                    <DropdownMenuItem onClick={() => handleCampaignAction('view_analytics', campaign.id)}>
                                      <Eye className="w-3 h-3 mr-2" />
                                      View Analytics
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                      <Eye className="w-3 h-3 mr-2" />
                                      View Analytics
                                    </DropdownMenuItem>
                                  )}
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
                                      className="text-destructive"
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

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getStatusColor(campaign.status)} text-xs px-2 py-1`}>
                                {getStatusIcon(campaign.status)}
                                <span className="ml-1 capitalize">{campaign.status_display}</span>
                              </Badge>
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                {campaign.campaign_type_display}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs text-text-subtle">
                              <span>Recipients: {campaign.total_recipients.toLocaleString()}</span>
                              {campaign.status === 'running' && (
                                <span>Progress: {campaign.progress_percentage}%</span>
                              )}
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:grid grid-cols-12 gap-1 lg:gap-4 items-center">
                            {/* Campaign Column */}
                            <div className="col-span-4">
                              <div className="flex flex-col">
                                <h3 className="text-xs font-semibold text-foreground truncate">
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
                            {campaign.can_view_analytics ? (
                              <DropdownMenuItem onClick={() => handleCampaignAction('view_analytics', campaign.id)}>
                                <Eye className="w-3 h-3 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                              <Eye className="w-3 h-3 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            )}
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

                          {/* Additional Details Row */}
                          <div className="mt-2 pt-2 border-t border-border-subtle">
                            <div className="flex items-center gap-4 text-xs text-text-subtle">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{campaign.total_recipients.toLocaleString()} recipients</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                <span>{campaign.sent_count.toLocaleString()} sent</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{campaign.delivered_count.toLocaleString()} delivered</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{campaign.delivery_rate}% delivery rate</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {campaign.status === 'running' && (
                              <div className="mt-2">
                                <Progress value={campaign.progress_percentage} className="h-1" />
                              </div>
              )}
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
      <Dialog open={isCampaignDetailsOpen} onOpenChange={setIsCampaignDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {isEditMode ? 'Edit Campaign' : 'Campaign Details'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edit campaign information and settings' : 'View campaign information'}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              {isEditMode ? (
                // Edit Form
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Campaign Name</Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            placeholder="Enter campaign name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="campaign_type">Campaign Type</Label>
                          <Select
                            value={editForm.campaign_type}
                            onValueChange={(value) => handleFormChange('campaign_type', value)}
                          >
                            <SelectTrigger>
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
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Enter campaign description"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Message Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="message_text">Message Text</Label>
                        <Textarea
                          id="message_text"
                          value={editForm.message_text}
                          onChange={(e) => handleFormChange('message_text', e.target.value)}
                          placeholder="Enter your message content"
                          rows={6}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scheduling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                        <Input
                          id="scheduled_at"
                          type="datetime-local"
                          value={editForm.scheduled_at}
                          onChange={(e) => handleFormChange('scheduled_at', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_recurring"
                          checked={editForm.is_recurring}
                          onCheckedChange={(checked) => handleFormChange('is_recurring', checked)}
                        />
                        <Label htmlFor="is_recurring">Recurring Campaign</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Target Audience */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Audience Mode Selection */}
                      <div className="flex gap-2">
                        <Button
                          variant={audienceMode === 'contacts' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('contacts')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Individual Contacts
                        </Button>
                        <Button
                          variant={audienceMode === 'segments' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('segments')}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Contact Segments
                        </Button>
                        <Button
                          variant={audienceMode === 'criteria' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAudienceMode('criteria')}
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Custom Criteria
                        </Button>
                      </div>

                      {/* Audience Summary */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Audience:</span>
                          <span className="text-lg font-bold text-primary">
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
                                      {contact.first_name} {contact.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.phone_number || contact.email}
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
                            {segments && segments.length > 0 ? (
                              segments.map((segment) => (
                                <div
                                  key={segment.id}
                                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer"
                                  onClick={() => handleSegmentToggle(segment)}
                                >
                                  <Checkbox
                                    checked={selectedSegments.some(s => s.id === segment.id)}
                                    onChange={() => handleSegmentToggle(segment)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {segment.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {segment.contact_count || 0} contacts
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                No segments available
                              </div>
                            )}
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
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleSaveCampaign} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                      <X className="w-4 h-4 mr-2" />
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
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Campaign
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setIsCampaignDetailsOpen(false)}
                      className={selectedCampaign.can_edit ? "flex-1" : "w-full"}
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
    </div>
  );
};

export default Campaigns;

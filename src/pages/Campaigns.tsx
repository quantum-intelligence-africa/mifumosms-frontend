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
  RefreshCw
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCampaignDialog } from "@/components/campaigns/CreateCampaignDialog";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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
    refetch
  } = useCampaigns();

  // Check if we should open the new campaign dialog
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewCampaignOpen(true);
      // Remove the parameter from URL after opening
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.campaign_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCampaignAction = async (action: string, campaignId: string) => {
    switch (action) {
      case 'start':
        await startCampaign(campaignId);
        break;
      case 'pause':
        await pauseCampaign(campaignId);
        break;
      case 'cancel':
        await cancelCampaign(campaignId);
        break;
      case 'duplicate':
        await duplicateCampaign(campaignId);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
          await deleteCampaign(campaignId);
        }
        break;
    }
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
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Loading skeletons */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
                  <p className="text-text-subtle">
                  Manage and track your marketing campaigns
                  </p>
                </div>
              <CreateCampaignDialog>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                      New Campaign
                    </Button>
              </CreateCampaignDialog>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-subtle">Total Campaigns</p>
                        <p className="text-2xl font-bold text-foreground">{summary.summary.total_campaigns}</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-subtle">Active Campaigns</p>
                        <p className="text-2xl font-bold text-foreground">{summary.summary.active_campaigns}</p>
                      </div>
                      <Play className="w-8 h-8 text-green-500" />
                      </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-subtle">Total Recipients</p>
                        <p className="text-2xl font-bold text-foreground">{summary.summary.total_recipients.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

              {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-4 h-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                  />
                </div>
                  </div>
                  
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
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
                    <SelectTrigger className="w-full sm:w-48">
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

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-text-subtle mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns found</h3>
                    <p className="text-text-subtle mb-4">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters to see more campaigns."
                        : "Create your first campaign to get started."}
                    </p>
                    {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                      <CreateCampaignDialog>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Campaign
                        </Button>
                      </CreateCampaignDialog>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {campaign.name}
                            </h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {getStatusIcon(campaign.status)}
                              <span className="ml-1 capitalize">{campaign.status_display}</span>
                            </Badge>
                            <Badge variant="outline">
                              {campaign.campaign_type_display}
                            </Badge>
                          </div>
                          
                          {campaign.description && (
                            <p className="text-text-subtle text-sm mb-3 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm text-text-subtle mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{campaign.total_recipients.toLocaleString()} recipients</span>
                      </div>
                            <div className="flex items-center gap-1">
                              <Send className="w-4 h-4" />
                              <span>{campaign.sent_count.toLocaleString()} sent</span>
                    </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>{campaign.delivered_count.toLocaleString()} delivered</span>
              </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>{campaign.delivery_rate}% delivery rate</span>
                            </div>
                                </div>

                          {campaign.status === 'running' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm text-text-subtle mb-1">
                                <span>Progress</span>
                                <span>{campaign.progress_percentage}%</span>
                              </div>
                              <Progress value={campaign.progress_percentage} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-text-subtle">
                            <span>Created by {campaign.created_by_name}</span>
                            <span>•</span>
                            <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                            {campaign.scheduled_at && (
                              <>
                                <span>•</span>
                                <span>Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</span>
                              </>
                            )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                            {campaign.can_start && (
                              <DropdownMenuItem onClick={() => handleCampaignAction('start', campaign.id)}>
                                <Play className="w-4 h-4 mr-2" />
                                Start Campaign
                              </DropdownMenuItem>
                            )}
                            {campaign.can_pause && (
                              <DropdownMenuItem onClick={() => handleCampaignAction('pause', campaign.id)}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Campaign
                                </DropdownMenuItem>
                              )}
                            {campaign.can_cancel && (
                              <DropdownMenuItem onClick={() => handleCampaignAction('cancel', campaign.id)}>
                                <Square className="w-4 h-4 mr-2" />
                                Cancel Campaign
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCampaignAction('duplicate', campaign.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleCampaignAction('delete', campaign.id)}
                              className="text-red-600"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Campaigns;
import { useState } from "react";
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
  Send
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Campaign {
  id: string;
  name: string;
  type: "whatsapp" | "sms" | "email";
  status: "draft" | "scheduled" | "running" | "completed" | "paused";
  audience: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  scheduled?: string;
  createdAt: string;
  description: string;
}

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Welcome Series - New Users",
      type: "whatsapp",
      status: "running",
      audience: 1250,
      sent: 950,
      delivered: 920,
      opened: 780,
      clicked: 234,
      createdAt: "2024-03-15",
      description: "Onboarding sequence for new user registrations"
    },
    {
      id: "2",
      name: "March Product Launch",
      type: "sms",
      status: "completed",
      audience: 3400,
      sent: 3400,
      delivered: 3385,
      opened: 2890,
      clicked: 567,
      createdAt: "2024-03-01",
      description: "Product launch announcement and feature highlights"
    },
    {
      id: "3",
      name: "Customer Feedback Survey",
      type: "whatsapp",
      status: "scheduled",
      audience: 850,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      scheduled: "2024-03-25 10:00",
      createdAt: "2024-03-20",
      description: "Monthly satisfaction survey for active customers"
    },
    {
      id: "4",
      name: "Flash Sale - Weekend",
      type: "sms",
      status: "draft",
      audience: 2100,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: "2024-03-22",
      description: "Weekend flash sale promotion for premium customers"
    },
    {
      id: "5",
      name: "Account Security Notice",
      type: "whatsapp",
      status: "paused",
      audience: 5600,
      sent: 1200,
      delivered: 1180,
      opened: 950,
      clicked: 89,
      createdAt: "2024-03-10",
      description: "Security update notification for all users"
    }
  ];

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "running": return <Play className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "scheduled": return <Clock className="w-4 h-4" />;
      case "paused": return <Pause className="w-4 h-4" />;
      case "draft": return <Edit className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "running": return "text-success";
      case "completed": return "text-primary";
      case "scheduled": return "text-amber-500";
      case "paused": return "text-text-subtle";
      case "draft": return "text-text-subtle";
      default: return "text-text-subtle";
    }
  };

  const getTypeIcon = (type: Campaign["type"]) => {
    switch (type) {
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "sms": return <Send className="w-4 h-4" />;
      case "email": return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const calculateDeliveryRate = (campaign: Campaign) => {
    return campaign.sent > 0 ? Math.round((campaign.delivered / campaign.sent) * 100) : 0;
  };

  const calculateOpenRate = (campaign: Campaign) => {
    return campaign.delivered > 0 ? Math.round((campaign.opened / campaign.delivered) * 100) : 0;
  };

  const calculateClickRate = (campaign: Campaign) => {
    return campaign.opened > 0 ? Math.round((campaign.clicked / campaign.opened) * 100) : 0;
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-foreground">
                    Campaigns
                  </h1>
                  <p className="text-text-subtle">
                    Create and manage your messaging campaigns
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Campaign</DialogTitle>
                      <DialogDescription>
                        Choose how you want to create your campaign
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name</Label>
                        <Input 
                          id="campaignName"
                          placeholder="Enter campaign name" 
                          className="glass-subtle border-0" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campaignType">Channel</Label>
                        <Select>
                          <SelectTrigger className="glass-subtle border-0">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description"
                          placeholder="Brief description of the campaign"
                          className="glass-subtle border-0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">Create Campaign</Button>
                        <Button variant="outline" className="flex-1">Cancel</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-subtle border-0"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 glass-subtle border-0">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48 glass-subtle border-0">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-text-subtle">Total Campaigns</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Play className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-sm font-medium text-text-subtle">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {campaigns.filter(c => c.status === "running").length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-text-subtle">Scheduled</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {campaigns.filter(c => c.status === "scheduled").length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-text-subtle">Avg. Open Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">78%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns List */}
              <div className="flex-1 overflow-hidden">
                <div className="grid gap-4 h-full overflow-y-auto">
                  {filteredCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="glass border-0 hover:shadow-lg transition-smooth">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg bg-primary/10 ${getStatusColor(campaign.status)}`}>
                                {getTypeIcon(campaign.type)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                  {campaign.name}
                                </h3>
                                <Badge variant="outline" className="capitalize">
                                  {campaign.type}
                                </Badge>
                                <div className={`flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                                  {getStatusIcon(campaign.status)}
                                  <span className="text-sm font-medium capitalize">{campaign.status}</span>
                                </div>
                              </div>
                              <p className="text-text-subtle mb-3">{campaign.description}</p>
                              {campaign.scheduled && (
                                <div className="flex items-center gap-1 text-sm text-amber-600">
                                  <Calendar className="w-4 h-4" />
                                  Scheduled for {campaign.scheduled}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {campaign.status === "running" && (
                                <DropdownMenuItem>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Campaign
                                </DropdownMenuItem>
                              )}
                              {campaign.status === "paused" && (
                                <DropdownMenuItem>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Campaign
                                </DropdownMenuItem>
                              )}
                              {campaign.status === "draft" && (
                                <DropdownMenuItem>
                                  <Send className="w-4 h-4 mr-2" />
                                  Launch Campaign
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Campaign Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-sm text-text-subtle">Audience</p>
                            <p className="text-lg font-semibold text-foreground">
                              {campaign.audience.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-text-subtle">Sent</p>
                            <p className="text-lg font-semibold text-foreground">
                              {campaign.sent.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-text-subtle">Delivery Rate</p>
                            <p className="text-lg font-semibold text-success">
                              {calculateDeliveryRate(campaign)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-text-subtle">Open Rate</p>
                            <p className="text-lg font-semibold text-primary">
                              {calculateOpenRate(campaign)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-text-subtle">Click Rate</p>
                            <p className="text-lg font-semibold text-amber-600">
                              {calculateClickRate(campaign)}%
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {campaign.status === "running" && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-subtle">Progress</span>
                              <span className="text-foreground">
                                {Math.round((campaign.sent / campaign.audience) * 100)}% complete
                              </span>
                            </div>
                            <Progress 
                              value={(campaign.sent / campaign.audience) * 100}
                              className="w-full"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
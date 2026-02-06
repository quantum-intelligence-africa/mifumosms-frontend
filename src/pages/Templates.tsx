import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  MessageSquare,
  Send,
  Globe,
  Tag,
  Eye,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplateFilterParams, CreateTemplateRequest } from "@/lib/api";

const Templates = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateTemplateRequest>({
    name: "",
    category: "",
    language: "",
    channel: "sms",
    body_text: "",
    description: ""
  });
  const location = useLocation();
  const { toast } = useToast();

  // Static template data - no backend connection
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Welcome Message",
      category: "onboarding",
      category_display: "Onboarding",
      language: "en",
      language_display: "English",
      channel: "sms",
      channel_display: "SMS",
      body_text: "Welcome to our service! We're excited to have you on board.",
      preview_text: "Welcome to our service! We're excited to have you on board.",
      description: "A warm welcome message for new users",
      variables: ["name"],
      variables_count: 1,
      status: "approved",
      status_display: "Approved",
      approved: true,
      approval_status: "approved",
      is_favorite: false,
      usage_count: 15,
      last_used_at: "2024-01-15T10:30:00Z",
      last_used_display: "2 days ago",
      created_by: "admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T10:30:00Z"
    },
    {
      id: "2",
      name: "Order Confirmation",
      category: "transactional",
      category_display: "Transactional",
      language: "en",
      language_display: "English",
      channel: "sms",
      channel_display: "SMS",
      body_text: "Your order #{{order_number}} has been confirmed. Expected delivery: {{delivery_date}}",
      preview_text: "Your order #12345 has been confirmed. Expected delivery: Jan 20, 2024",
      description: "Confirmation message for completed orders",
      variables: ["order_number", "delivery_date"],
      variables_count: 2,
      status: "approved",
      status_display: "Approved",
      approved: true,
      approval_status: "approved",
      is_favorite: true,
      usage_count: 42,
      last_used_at: "2024-01-16T14:20:00Z",
      last_used_display: "1 day ago",
      created_by: "admin",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-16T14:20:00Z"
    },
    {
      id: "3",
      name: "Payment Reminder",
      category: "reminders",
      category_display: "Reminders",
      language: "en",
      language_display: "English",
      channel: "whatsapp",
      channel_display: "WhatsApp",
      body_text: "Hi {{name}}, this is a friendly reminder that your payment of ${{amount}} is due on {{due_date}}.",
      preview_text: "Hi John, this is a friendly reminder that your payment of $99.99 is due on Jan 25, 2024.",
      description: "Payment reminder for overdue invoices",
      variables: ["name", "amount", "due_date"],
      variables_count: 3,
      status: "pending",
      status_display: "Pending",
      approved: false,
      approval_status: "pending",
      is_favorite: false,
      usage_count: 8,
      last_used_at: "2024-01-10T09:15:00Z",
      last_used_display: "1 week ago",
      created_by: "admin",
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-10T09:15:00Z"
    },
    {
      id: "4",
      name: "Promotional Offer",
      category: "promotions",
      category_display: "Promotions",
      language: "en",
      language_display: "English",
      channel: "email",
      channel_display: "Email",
      body_text: "🎉 Special offer! Get {{discount}}% off on your next purchase. Use code: {{promo_code}}",
      preview_text: "🎉 Special offer! Get 20% off on your next purchase. Use code: SAVE20",
      description: "Promotional message with discount code",
      variables: ["discount", "promo_code"],
      variables_count: 2,
      status: "approved",
      status_display: "Approved",
      approved: true,
      approval_status: "approved",
      is_favorite: true,
      usage_count: 23,
      last_used_at: "2024-01-14T16:45:00Z",
      last_used_display: "3 days ago",
      created_by: "admin",
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-14T16:45:00Z"
    },
    {
      id: "5",
      name: "Appointment Reminder",
      category: "reminders",
      category_display: "Reminders",
      language: "en",
      language_display: "English",
      channel: "sms",
      channel_display: "SMS",
      body_text: "Reminder: You have an appointment on {{appointment_date}} at {{appointment_time}} with {{doctor_name}}.",
      preview_text: "Reminder: You have an appointment on Jan 22, 2024 at 2:00 PM with Dr. Smith.",
      description: "Medical appointment reminder",
      variables: ["appointment_date", "appointment_time", "doctor_name"],
      variables_count: 3,
      status: "draft",
      status_display: "Draft",
      approved: false,
      approval_status: "draft",
      is_favorite: false,
      usage_count: 0,
      last_used_at: null,
      last_used_display: "Never used",
      created_by: "admin",
      created_at: "2024-01-12T00:00:00Z",
      updated_at: "2024-01-12T00:00:00Z"
    },
    {
      id: "6",
      name: "Password Reset",
      category: "alerts",
      category_display: "Alerts",
      language: "en",
      language_display: "English",
      channel: "email",
      channel_display: "Email",
      body_text: "Your password has been reset. If you didn't request this, please contact support immediately. Reset code: {{reset_code}}",
      preview_text: "Your password has been reset. If you didn't request this, please contact support immediately. Reset code: ABC123",
      description: "Password reset notification",
      variables: ["reset_code"],
      variables_count: 1,
      status: "approved",
      status_display: "Approved",
      approved: true,
      approval_status: "approved",
      is_favorite: false,
      usage_count: 7,
      last_used_at: "2024-01-13T11:30:00Z",
      last_used_display: "4 days ago",
      created_by: "admin",
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-13T11:30:00Z"
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterOptions] = useState({
    categories: [
      { value: "onboarding", label: "Onboarding" },
      { value: "promotions", label: "Promotions" },
      { value: "reminders", label: "Reminders" },
      { value: "loyalty", label: "Loyalty" },
      { value: "win_back", label: "Win-Back" },
      { value: "post_purchase", label: "Post-Purchase" },
      { value: "transactional", label: "Transactional" },
      { value: "marketing", label: "Marketing" },
      { value: "alerts", label: "Alerts" }
    ],
    languages: [
      { value: "en", label: "English" },
      { value: "sw", label: "Kiswahili" },
      { value: "fr", label: "Français" },
      { value: "ar", label: "العربية" }
    ]
  });
  const totalCount = templates.length;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      setIsCreateDialogOpen(true);
    }
  }, [location.search]);

  // Filter templates based on search and filter values
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body_text.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = channelFilter === "all" ||
      template.channel === channelFilter;

    const matchesCategory = categoryFilter === "all" ||
      template.category === categoryFilter;

    const matchesLanguage = languageFilter === "all" ||
      template.language === languageFilter;

    return matchesSearch && matchesChannel && matchesCategory && matchesLanguage;
  });

  const getStatusIcon = (status: Template["status"]) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "draft": return <Edit className="w-4 h-4 text-text-subtle" />;
      case "rejected": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusColor = (status: Template["status"]) => {
    switch (status) {
      case "approved": return "text-success";
      case "pending": return "text-amber-500";
      case "draft": return "text-text-subtle";
      case "rejected": return "text-destructive";
      default: return "text-text-subtle";
    }
  };

  const getChannelIcon = (channel: Template["channel"]) => {
    switch (channel) {
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "sms": return <Send className="w-4 h-4" />;
      case "email": return <MessageSquare className="w-4 h-4" />;
      case "all": return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  // Template Action Functions
  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleEditTemplate = (template: Template) => {
    toast({
      title: "Edit Template",
      description: `Opening editor for "${template.name}"`,
    });
    // TODO: Implement edit functionality
  };

  const handleDuplicateTemplate = async (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0,
      last_used_at: null,
      last_used_display: "Never used"
    };

    setTemplates(prev => [duplicatedTemplate, ...prev]);
    toast({
      title: "Template Duplicated",
      description: `Created a copy of "${template.name}"`,
    });
  };

  const handleToggleStar = async (template: Template) => {
    setTemplates(prev => prev.map(t =>
      t.id === template.id
        ? { ...t, is_favorite: !t.is_favorite }
        : t
    ));

    const action = template.is_favorite ? "removed from" : "added to";
    toast({
      title: "Template Starred",
      description: `"${template.name}" ${action} favorites`,
    });
  };

  const handleApproveTemplate = async (template: Template) => {
    setTemplates(prev => prev.map(t =>
      t.id === template.id
        ? { ...t, status: "approved", status_display: "Approved", approved: true, approval_status: "approved" }
        : t
    ));

    toast({
      title: "Template Approved",
      description: `"${template.name}" has been approved`,
    });
  };

  const handleRejectTemplate = async (template: Template) => {
    setTemplates(prev => prev.map(t =>
      t.id === template.id
        ? { ...t, status: "rejected", status_display: "Rejected", approved: false, approval_status: "rejected" }
        : t
    ));

    toast({
      title: "Template Rejected",
      description: `"${template.name}" has been rejected`,
    });
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast({
        title: "Template Deleted",
        description: `"${template.name}" has been deleted`,
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!createFormData.name || !createFormData.category || !createFormData.language || !createFormData.channel || !createFormData.body_text) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    // Simulate API call delay
    setTimeout(() => {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: createFormData.name,
        category: createFormData.category,
        category_display: createFormData.category.charAt(0).toUpperCase() + createFormData.category.slice(1),
        language: createFormData.language,
        language_display: createFormData.language === "en" ? "English" : createFormData.language,
        channel: createFormData.channel as any,
        channel_display: createFormData.channel.toUpperCase(),
        body_text: createFormData.body_text,
        preview_text: createFormData.body_text,
        description: createFormData.description || "",
        variables: createFormData.body_text.match(/{{(.*?)}}/g)?.map(v => v.replace(/{{|}}/g, '')) || [],
        variables_count: (createFormData.body_text.match(/{{(.*?)}}/g) || []).length,
        status: "draft",
        status_display: "Draft",
        approved: false,
        approval_status: "draft",
        is_favorite: false,
        usage_count: 0,
        last_used_at: null,
        last_used_display: "Never used",
        created_by: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        category: "",
        language: "",
        channel: "sms",
        body_text: "",
        description: ""
      });
      setIsCreating(false);

      toast({
        title: "Template Created",
        description: `"${createFormData.name}" has been created successfully`,
      });
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 lg:mb-5 xl:mb-6 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                    Templates
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    Create and manage reusable message templates
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">New Template</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable message template
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name *</Label>
                        <Input
                          id="templateName"
                          placeholder="Enter template name"
                          value={createFormData.name}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="glass-subtle border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="templateChannel">Channel *</Label>
                        <Select value={createFormData.channel} onValueChange={(value) => setCreateFormData(prev => ({ ...prev, channel: value as any }))}>
                          <SelectTrigger className="glass-subtle border-0">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="all">All Channels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={createFormData.category} onValueChange={(value) => setCreateFormData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger className="glass-subtle border-0">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="onboarding">Onboarding</SelectItem>
                            <SelectItem value="promotions">Promotions</SelectItem>
                            <SelectItem value="reminders">Reminders</SelectItem>
                            <SelectItem value="loyalty">Loyalty</SelectItem>
                            <SelectItem value="win_back">Win-Back</SelectItem>
                            <SelectItem value="post_purchase">Post-Purchase</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="alerts">Alerts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language *</Label>
                        <Select value={createFormData.language} onValueChange={(value) => setCreateFormData(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger className="glass-subtle border-0">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="sw">Kiswahili</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Optional description"
                          value={createFormData.description}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="glass-subtle border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Message Content *</Label>
                        <Textarea
                          id="content"
                          placeholder="Enter your message content. Use {{variable}} for dynamic content."
                          value={createFormData.body_text}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, body_text: e.target.value }))}
                          className="glass-subtle border-0"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={handleCreateTemplate}
                          disabled={isCreating}
                        >
                          {isCreating ? "Creating..." : "Create Template"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-subtle border-0 text-sm"
                  />
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All categories</SelectItem>
                    {filterOptions?.categories?.map((category: any) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All languages</SelectItem>
                    {filterOptions?.languages?.map((language: any) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-text-subtle">Loading templates...</p>
                      <p className="text-xs text-text-subtle mt-2">This may take a moment...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 h-full overflow-y-auto">
                    {filteredTemplates && filteredTemplates.length > 0 ? filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="glass border-0 hover:shadow-lg transition-smooth cursor-pointer"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardHeader className="pb-3 p-4 lg:p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="p-1.5 lg:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                {getChannelIcon(template.channel)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-sm lg:text-lg truncate">{template.name}</CardTitle>
                                <div className="flex items-center gap-1 lg:gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {template.category_display}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {template.language_display}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {template.is_favorite && (
                                <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-amber-400 text-amber-400" />
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 lg:h-8 lg:w-8">
                                    <MoreVertical className="w-3 h-3 lg:w-4 lg:h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewTemplate(template);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplate(template);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Template
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateTemplate(template);
                                  }}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {template.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveTemplate(template);
                                      }}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectTemplate(template);
                                      }}>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStar(template);
                                  }}>
                                    <Star className="w-4 h-4 mr-2" />
                                    {template.is_favorite ? "Remove Star" : "Add Star"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTemplate(template);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Template
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 lg:p-6 pt-0">
                          <div className="flex items-center gap-2 mb-3">
                            {getStatusIcon(template.status)}
                            <span className={`text-xs lg:text-sm font-medium capitalize ${getStatusColor(template.status)}`}>
                              {template.status_display}
                            </span>
                          </div>

                          <p className="text-xs lg:text-sm text-text-subtle mb-4 line-clamp-3">
                            {template.body_text}
                          </p>

                          {template.variables.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-text-subtle mb-2">Variables:</p>
                              <div className="flex flex-wrap gap-1">
                                {template.variables.slice(0, 2).map((variable) => (
                                  <Badge key={variable} variant="outline" className="text-xs">
                                    {variable}
                                  </Badge>
                                ))}
                                {template.variables.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.variables.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-text-subtle gap-1">
                            <span>Used {template.usage_count} times</span>
                            <span className="truncate">
                              {template.last_used_display}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="col-span-full flex items-center justify-center h-96">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-3">
                            {searchQuery || channelFilter !== "all" || categoryFilter !== "all" || languageFilter !== "all"
                              ? "No templates match your filters"
                              : "No templates yet"}
                          </h3>
                          <p className="text-sm text-text-subtle mb-6 leading-relaxed">
                            {searchQuery || channelFilter !== "all" || categoryFilter !== "all" || languageFilter !== "all"
                              ? "Try adjusting your search terms or filters to find what you're looking for."
                              : "Create your first message template to get started with automated communications."}
                          </p>
                          <div className="flex gap-2 justify-center">
                            {(searchQuery || channelFilter !== "all" || categoryFilter !== "all" || languageFilter !== "all") && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSearchQuery("");
                                  setChannelFilter("all");
                                  setCategoryFilter("all");
                                  setLanguageFilter("all");
                                }}
                                className="px-6"
                              >
                                Clear Filters
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => window.location.reload()}
                              className="px-6"
                            >
                              Refresh Page
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Detail Panel */}
      {selectedTemplate && (
        <div className="w-full lg:w-96 border-l border-border-subtle glass flex flex-col">
          <div className="p-4 lg:p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base lg:text-lg font-semibold">Template Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)} className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 lg:gap-3 mb-2">
                  <div className="p-1.5 lg:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    {getChannelIcon(selectedTemplate.channel)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm lg:text-base truncate">{selectedTemplate.name}</h4>
                    <p className="text-xs lg:text-sm text-text-subtle capitalize">{selectedTemplate.channel_display}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(selectedTemplate.status)}
                <span className={`text-xs lg:text-sm font-medium capitalize ${getStatusColor(selectedTemplate.status)}`}>
                  {selectedTemplate.status_display}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Category</p>
                <Badge variant="outline" className="text-xs">{selectedTemplate.category_display}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Language</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 lg:w-4 lg:h-4 text-text-subtle" />
                  <span className="text-xs lg:text-sm text-foreground">{selectedTemplate.language_display}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Usage Statistics</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Total uses</span>
                    <span className="text-foreground">{selectedTemplate.usage_count}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Last used</span>
                    <span className="text-foreground">
                      {selectedTemplate.last_used_display}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Created</span>
                    <span className="text-foreground">{new Date(selectedTemplate.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1 text-xs"
                  size="sm"
                  onClick={() => handleEditTemplate(selectedTemplate)}
                >
                  <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDuplicateTemplate(selectedTemplate)}
                >
                  <Copy className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 lg:p-6">
            <Tabs defaultValue="content" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content" className="text-xs lg:text-sm">Content</TabsTrigger>
                <TabsTrigger value="variables" className="text-xs lg:text-sm">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-foreground mb-2">Message Content</p>
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <p className="text-xs lg:text-sm text-foreground whitespace-pre-wrap">
                        {selectedTemplate.body_text}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-foreground mb-2">
                      Template Variables ({selectedTemplate.variables.length})
                    </p>
                    <div className="space-y-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-surface border border-border-subtle">
                          <Tag className="w-3 h-3 lg:w-4 lg:h-4 text-text-subtle" />
                          <span className="text-xs lg:text-sm text-foreground font-mono">
                            {`{{${variable}}}`}
                          </span>
                        </div>
                      ))}
                      {selectedTemplate.variables.length === 0 && (
                        <p className="text-xs lg:text-sm text-text-subtle">No variables in this template</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;

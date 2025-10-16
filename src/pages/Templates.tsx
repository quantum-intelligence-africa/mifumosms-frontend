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

interface Template {
  id: string;
  name: string;
  type: "whatsapp" | "sms" | "email";
  category: string;
  language: string;
  status: "approved" | "pending" | "draft" | "rejected";
  content: string;
  variables: string[];
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  isStarred: boolean;
}

const Templates = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      setIsCreateDialogOpen(true);
    }
  }, [location.search]);

  const templates: Template[] = [
    {
      id: "1",
      name: "Karibu — Asante kwa Kutuamini",
      type: "whatsapp",
      category: "Onboarding",
      language: "Kiswahili",
      status: "approved",
      content: "Habari {{name}}! 👋 Asante kwa kutuamini {{company}}. Akaunti yako iko tayari—anza hapa: {{short_url}}",
      variables: ["name", "company", "short_url"],
      createdAt: "2025-10-07",
      lastUsed: "2025-10-07",
      usageCount: 0,
      isStarred: true
    },
    {
      id: "2",
      name: "Tangazo la Ofa (General)",
      type: "sms",
      category: "Promotions",
      language: "Kiswahili",
      status: "approved",
      content: "Habari {{name}}! Leo tunayo ofa ya {{discount}}% kwa {{category}} hadi {{expiry}}. Tumia KODI: {{code}}. Nunua hapa: {{short_url}}",
      variables: ["name", "discount", "category", "expiry", "code", "short_url"],
      createdAt: "2025-10-07",
      lastUsed: "2025-10-07",
      usageCount: 0,
      isStarred: true
    },
    {
      id: "3",
      name: "Kumbusho la Ziara / Huduma",
      type: "whatsapp",
      category: "Reminders",
      language: "Kiswahili",
      status: "approved",
      content: "Habari {{name}}, tunakukaribisha tena siku ya {{date}} saa {{time}} 📍{{location}}. Jibu CONFIRM au BADILI hapa: {{short_url}}",
      variables: ["name", "date", "time", "location", "short_url"],
      createdAt: "2025-10-07",
      lastUsed: "2025-10-07",
      usageCount: 0,
      isStarred: false
    },
    {
      id: "4",
      name: "Asante kwa Kutuamini — Karibu Tena",
      type: "whatsapp",
      category: "Loyalty",
      language: "Kiswahili",
      status: "approved",
      content: "Asante {{name}} kwa kutuamini {{company}} 🙏. Tunarahisisha maisha ya biashara yako kila siku. Karibu tena wakati wowote!",
      variables: ["name", "company"],
      createdAt: "2025-10-07",
      usageCount: 0,
      isStarred: false
    },
    {
      id: "5",
      name: "Karibu Tena (Win-Back Soft)",
      type: "sms",
      category: "Win-Back",
      language: "Kiswahili",
      status: "approved",
      content: "Habari {{name}}, tumekumiss! Rudia kututembelea—tunayo ofa maalum kwa ajili yako hadi {{expiry}}. Angalia hapa: {{short_url}}",
      variables: ["name", "expiry", "short_url"],
      createdAt: "2025-10-07",
      lastUsed: "2025-10-07",
      usageCount: 0,
      isStarred: false
    },
    {
      id: "6",
      name: "Shukrani kwa Ununuzi",
      type: "sms",
      category: "Post-Purchase",
      language: "Kiswahili",
      status: "approved",
      content: "Asante {{name}} kwa kuchagua {{company}} 🙌. Tungependa kusikia maoni yako—tuchapie sekunde 30 hapa: {{short_url}}",
      variables: ["name", "company", "short_url"],
      createdAt: "2025-10-07",
      usageCount: 0,
      isStarred: true
    }
  ];


  const categories = Array.from(new Set(templates.map(t => t.category)));
  const languages = Array.from(new Set(templates.map(t => t.language)));

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

  const getTypeIcon = (type: Template["type"]) => {
    switch (type) {
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "sms": return <Send className="w-4 h-4" />;
      case "email": return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesLanguage = languageFilter === "all" || template.language === languageFilter;

    return matchesSearch && matchesType && matchesCategory && matchesLanguage;
  });

  // Template Action Functions
  const handlePreviewTemplate = (template: Template) => {
    // Open template in preview mode
    setSelectedTemplate(template);
    toast({
      title: "Template Preview",
      description: `Previewing "${template.name}"`,
    });
  };

  const handleEditTemplate = (template: Template) => {
    // Navigate to edit template page or open edit dialog
    toast({
      title: "Edit Template",
      description: `Opening editor for "${template.name}"`,
    });
    // TODO: Implement edit functionality
  };

  const handleDuplicateTemplate = (template: Template) => {
    // Create a copy of the template
    toast({
      title: "Template Duplicated",
      description: `Created a copy of "${template.name}"`,
    });
    // TODO: Implement duplicate functionality
  };

  const handleToggleStar = (template: Template) => {
    // Toggle star status
    const action = template.isStarred ? "removed from" : "added to";
    toast({
      title: "Template Starred",
      description: `"${template.name}" ${action} favorites`,
    });
    // TODO: Implement star toggle functionality
  };

  const handleDeleteTemplate = (template: Template) => {
    // Delete template with confirmation
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      toast({
        title: "Template Deleted",
        description: `"${template.name}" has been deleted`,
        variant: "destructive",
      });
      // TODO: Implement delete functionality
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full px-[max(12px,env(safe-area-inset-left))] pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
            <div className="mx-auto w-[92vw] max-w-[1200px] h-full flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-foreground">
                    Templates
                  </h1>
                  <p className="text-[clamp(0.75rem,2vw,1rem)] text-text-subtle">
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
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                          id="templateName"
                          placeholder="Enter template name"
                          className="glass-subtle border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="templateType">Channel</Label>
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
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger className="glass-subtle border-0">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="onboarding">Onboarding</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="reminders">Reminders</SelectItem>
                            <SelectItem value="alerts">Alerts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Message Content</Label>
                        <Textarea
                          id="content"
                          placeholder="Enter your message content. Use {{variable}} for dynamic content."
                          className="glass-subtle border-0"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">Create Template</Button>
                        <Button variant="outline" className="flex-1">Cancel</Button>
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All languages</SelectItem>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language}>{language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 h-full overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="glass border-0 hover:shadow-lg transition-smooth cursor-pointer"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3 p-4 lg:p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="p-1.5 lg:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                              {getTypeIcon(template.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm lg:text-lg truncate">{template.name}</CardTitle>
                              <div className="flex items-center gap-1 lg:gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {template.language}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {template.isStarred && (
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
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(template);
                                }}>
                                  <Star className="w-4 h-4 mr-2" />
                                  {template.isStarred ? "Remove Star" : "Add Star"}
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
                            {template.status}
                          </span>
                        </div>

                        <p className="text-xs lg:text-sm text-text-subtle mb-4 line-clamp-3">
                          {template.content}
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
                          <span>Used {template.usageCount} times</span>
                          <span className="truncate">
                            {template.lastUsed ? `Last used ${template.lastUsed}` : "Never used"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                    {getTypeIcon(selectedTemplate.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm lg:text-base truncate">{selectedTemplate.name}</h4>
                    <p className="text-xs lg:text-sm text-text-subtle capitalize">{selectedTemplate.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(selectedTemplate.status)}
                <span className={`text-xs lg:text-sm font-medium capitalize ${getStatusColor(selectedTemplate.status)}`}>
                  {selectedTemplate.status}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Category</p>
                <Badge variant="outline" className="text-xs">{selectedTemplate.category}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Language</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 lg:w-4 lg:h-4 text-text-subtle" />
                  <span className="text-xs lg:text-sm text-foreground">{selectedTemplate.language}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">Usage Statistics</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Total uses</span>
                    <span className="text-foreground">{selectedTemplate.usageCount}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Last used</span>
                    <span className="text-foreground">
                      {selectedTemplate.lastUsed || "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">Created</span>
                    <span className="text-foreground">{selectedTemplate.createdAt}</span>
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
                        {selectedTemplate.content}
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

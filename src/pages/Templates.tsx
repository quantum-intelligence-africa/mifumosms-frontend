import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
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
  AlertCircle,
  Loader2,
  RefreshCw,
  X
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { cleanTextareaInput } from "@/utils/smsInput";
import { SmsTextHint } from "@/components/sms/SmsTextHint";
import { apiClient } from "@/lib/api";
import type {
  Template,
  CreateTemplateRequest,
  TemplateFilterOptions,
  TemplateStatistics,
  TemplateAvailableVariable,
} from "@/lib/api";

import { appLocale, appLanguage } from "@/utils/appLocale";

// Same choices the backend accepts (messaging.Template). The list response replaces them once it has loaded.
const DEFAULT_FILTER_OPTIONS: TemplateFilterOptions = {
  categories: [
    { value: "onboarding", label: "Onboarding" },
    { value: "promotions", label: "Promotions" },
    { value: "reminders", label: "Reminders" },
    { value: "loyalty", label: "Loyalty" },
    { value: "win_back", label: "Win-Back" },
    { value: "post_purchase", label: "Post-Purchase" },
    { value: "authentication", label: "Authentication" },
    { value: "marketing", label: "Marketing" },
    { value: "utility", label: "Utility" },
    { value: "otp", label: "One-time password" },
  ],
  languages: [
    { value: "en", label: "English" },
    { value: "sw", label: "Kiswahili" },
    { value: "fr", label: "French" },
    { value: "ar", label: "Arabic" },
  ],
  channels: [
    { value: "sms", label: "SMS" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "Email" },
    { value: "all", label: "All Channels" },
  ],
  statuses: [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
};

const EMPTY_FORM: CreateTemplateRequest = {
  name: "",
  category: "",
  language: "",
  channel: "sms",
  body_text: "",
  description: ""
};

// Words that have no key in the shared dictionaries: English / Kiswahili.
const tx = (en: string, sw: string) => (appLanguage() === "sw" ? sw : en);

const errorText = (res: { error?: string; message?: string; errors?: unknown } | undefined, fallback: string) => {
  if (!res) return fallback;
  const errs = res.errors as Record<string, unknown> | null | undefined;
  if (errs && typeof errs === "object") {
    for (const [field, value] of Object.entries(errs)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === "string" && first) return field === "non_field_errors" || field === "detail" ? first : `${field}: ${first}`;
    }
  }
  return res.error || res.message || fallback;
};

const Templates = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTemplateRequest>(EMPTY_FORM);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<TemplateFilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [stats, setStats] = useState<TemplateStatistics | null>(null);
  const [availableVariables, setAvailableVariables] = useState<TemplateAvailableVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.getTemplates({
        search: debouncedSearch || undefined,
        channel: channelFilter !== "all" ? channelFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        language: languageFilter !== "all" ? languageFilter : undefined,
        page_size: 200,
      });
      if (!res.success || !res.data) {
        setLoadError(errorText(res, tx("Could not load templates.", "Imeshindwa kupakia violezo.")));
        return;
      }
      // Paginated: {count, results: {templates, filter_options, total_count}}; unpaginated: {templates, ...}
      const payload = res.data.results ?? res.data;
      setTemplates(payload.templates ?? []);
      setTotalCount(payload.total_count ?? res.data.count ?? (payload.templates ?? []).length);
      if (payload.filter_options) setFilterOptions(payload.filter_options);
    } catch {
      setLoadError(tx("Could not load templates.", "Imeshindwa kupakia violezo."));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, channelFilter, categoryFilter, languageFilter]);

  const loadStats = useCallback(async () => {
    const res = await apiClient.getTemplateStatistics();
    if (res.success && res.data?.overview) setStats(res.data);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadStats();
    apiClient.getTemplateAvailableVariables().then((res) => {
      const list = res.data?.data?.variables;
      if (res.success && Array.isArray(list)) setAvailableVariables(list);
    });
  }, [loadStats]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const hasFilters = Boolean(searchQuery || channelFilter !== "all" || categoryFilter !== "all" || languageFilter !== "all");

  const refreshAll = async () => {
    await Promise.all([loadTemplates(), loadStats()]);
  };

  const statusLabel = (status: string) =>
    filterOptions.statuses.find((s) => s.value === status)?.label ?? status.charAt(0).toUpperCase() + status.slice(1);

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

  const categoryLabel = (value: string) => {
    switch (value) {
      case "onboarding": return t("templates.category_onboarding");
      case "promotions": return t("templates.category_promotions");
      case "reminders": return t("templates.category_reminders");
      case "loyalty": return t("templates.category_loyalty");
      case "win_back": return t("templates.category_win_back");
      case "post_purchase": return t("templates.category_post_purchase");
      case "marketing": return t("templates.category_marketing");
      default: return filterOptions.categories.find((c) => c.value === value)?.label ?? value;
    }
  };

  const languageLabel = (value: string, fallback?: string) => {
    if (value === "en") return t("voice.ai_settings.language_en");
    if (value === "sw") return t("voice.ai_settings.language_sw");
    return filterOptions.languages.find((l) => l.value === value)?.label ?? fallback ?? value;
  };

  // WhatsApp templates may only be English or Kiswahili (the server rejects anything else).
  const formLanguages = useMemo(
    () => (formData.channel === "whatsapp" ? filterOptions.languages.filter((l) => l.value === "en" || l.value === "sw") : filterOptions.languages),
    [filterOptions.languages, formData.channel]
  );

  const bodyOf = (tpl: Template) => tpl.body_text ?? tpl.preview_text ?? "";

  // The list rows are short (preview only); the detail call returns the whole text and the variable names.
  const fetchDetail = async (id: string): Promise<Template | null> => {
    const res = await apiClient.getTemplate(id);
    return res.success && res.data ? res.data : null;
  };

  const handlePreviewTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setSelectedLoading(true);
    const detail = await fetchDetail(template.id);
    if (detail) setSelectedTemplate((cur) => (cur && cur.id === template.id ? { ...cur, ...detail } : cur));
    setSelectedLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const handleEditTemplate = async (template: Template) => {
    setBusyId(template.id);
    const detail = await fetchDetail(template.id);
    setBusyId(null);
    if (!detail) {
      toast({ title: t("pg.Settings.0001"), description: tx("Could not open this template.", "Imeshindwa kufungua kiolezo hiki."), variant: "destructive" });
      return;
    }
    setEditingId(template.id);
    setFormData({
      name: detail.name,
      category: detail.category,
      language: detail.language,
      channel: detail.channel,
      body_text: detail.body_text,
      description: detail.description || "",
    });
    setIsFormOpen(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    setBusyId(template.id);
    const res = await apiClient.copyTemplate(template.id);
    setBusyId(null);
    if (res.success) {
      toast({
        title: t("templates.duplicate_toast_title"),
        description: t("templates.duplicate_toast_desc", { name: template.name }),
      });
      await refreshAll();
    } else {
      toast({ title: t("pg.Settings.0001"), description: errorText(res, tx("Could not copy the template.", "Imeshindwa kunakili kiolezo.")), variant: "destructive" });
    }
  };

  const handleToggleStar = async (template: Template) => {
    setBusyId(template.id);
    const res = await apiClient.toggleTemplateFavorite(template.id);
    setBusyId(null);
    if (res.success && res.data) {
      const isFavorite = res.data.is_favorite;
      setTemplates((prev) => prev.map((tpl) => (tpl.id === template.id ? { ...tpl, is_favorite: isFavorite } : tpl)));
      setSelectedTemplate((cur) => (cur && cur.id === template.id ? { ...cur, is_favorite: isFavorite } : cur));
      toast({
        title: t("templates.star_toast_title"),
        description: isFavorite
          ? t("templates.added_to_favorites", { name: template.name })
          : t("templates.removed_from_favorites", { name: template.name }),
      });
      loadStats();
    } else {
      toast({ title: t("pg.Settings.0001"), description: errorText(res, tx("Could not update favourites.", "Imeshindwa kusasisha vipendwa.")), variant: "destructive" });
    }
  };

  const handleReview = async (template: Template, approve: boolean) => {
    setBusyId(template.id);
    const res = approve ? await apiClient.approveTemplate(template.id) : await apiClient.rejectTemplate(template.id);
    setBusyId(null);
    if (res.success) {
      toast(approve
        ? { title: t("templates.approve_toast_title"), description: t("templates.approve_toast_desc", { name: template.name }) }
        : { title: t("templates.reject_toast_title"), description: t("templates.reject_toast_desc", { name: template.name }) });
      await refreshAll();
      setSelectedTemplate((cur) => (cur && cur.id === template.id ? null : cur));
    } else {
      toast({ title: t("pg.Settings.0001"), description: errorText(res, tx("Could not update the template.", "Imeshindwa kusasisha kiolezo.")), variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (!window.confirm(t("templates.delete_confirm", { name: template.name }))) return;
    setBusyId(template.id);
    const res = await apiClient.deleteTemplate(template.id);
    setBusyId(null);
    if (res.success) {
      toast({
        title: t("templates.delete_toast_title"),
        description: t("templates.delete_toast_desc", { name: template.name }),
        variant: "destructive",
      });
      setSelectedTemplate((cur) => (cur && cur.id === template.id ? null : cur));
      await refreshAll();
    } else {
      toast({ title: t("pg.Settings.0001"), description: errorText(res, tx("Could not delete the template.", "Imeshindwa kufuta kiolezo.")), variant: "destructive" });
    }
  };

  // Count the use, then open the SMS composer with the text filled in (SendSMS reads ?message=).
  const handleUseTemplate = async (template: Template) => {
    setBusyId(template.id);
    const detail = template.body_text ? template : await fetchDetail(template.id);
    if (!detail) {
      setBusyId(null);
      toast({ title: t("pg.Settings.0001"), description: tx("Could not open this template.", "Imeshindwa kufungua kiolezo hiki."), variant: "destructive" });
      return;
    }
    await apiClient.incrementTemplateUsage(template.id);
    setBusyId(null);
    navigate(`/sms/send?message=${encodeURIComponent(detail.body_text)}`);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.category || !formData.language || !formData.channel || !formData.body_text.trim()) {
      toast({
        title: t("templates.validation_error_title"),
        description: t("templates.validation_error_desc"),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    const payload = { ...formData, name: formData.name.trim(), description: formData.description || "" };
    const res = editingId
      ? await apiClient.patchTemplate(editingId, payload)
      : await apiClient.createTemplate(payload);
    setIsSaving(false);

    if (res.success) {
      setIsFormOpen(false);
      setFormData(EMPTY_FORM);
      toast(editingId
        ? { title: t("templates.edit_short"), description: `"${payload.name}"` }
        : { title: t("templates.create_toast_title"), description: t("templates.create_toast_desc", { name: payload.name }) });
      if (editingId) setSelectedTemplate((cur) => (cur && cur.id === editingId ? null : cur));
      setEditingId(null);
      await refreshAll();
    } else {
      toast({ title: t("pg.Settings.0001"), description: errorText(res, tx("Could not save the template.", "Imeshindwa kuhifadhi kiolezo.")), variant: "destructive" });
    }
  };

  // Drop a {{variable}} where the cursor is (or at the end).
  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    const el = bodyRef.current;
    setFormData((prev) => {
      const start = el?.selectionStart ?? prev.body_text.length;
      const end = el?.selectionEnd ?? prev.body_text.length;
      const next = prev.body_text.slice(0, start) + token + prev.body_text.slice(end);
      requestAnimationFrame(() => {
        if (el) {
          el.focus();
          el.setSelectionRange(start + token.length, start + token.length);
        }
      });
      return { ...prev, body_text: next };
    });
  };

  const statTiles = stats
    ? [
        { label: tx("Templates", "Violezo"), value: stats.overview.total_templates },
        { label: statusLabel("approved"), value: stats.overview.approved_templates },
        { label: statusLabel("draft"), value: stats.overview.draft_templates },
        { label: tx("Favourites", "Vipendwa"), value: stats.overview.favorite_templates },
        { label: tx("Approval rate", "Kiwango cha idhini"), value: `${Math.round(stats.overview.approval_rate)}%` },
      ]
    : [];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-[1600px] mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 lg:mb-5 xl:mb-6 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                    {t("templates.title")}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    {t("templates.subtitle")}
                  </p>
                </div>
                <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" onClick={openCreate}>
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("templates.new_template")}</span>
                </Button>
              </div>

              {/* Statistics (GET /messaging/templates/statistics/) */}
              {statTiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 sm:mb-4">
                  {statTiles.map((tile) => (
                    <Card key={tile.label} className="glass border-0">
                      <CardContent className="p-2 sm:p-3">
                        <p className="text-xs text-text-subtle truncate">{tile.label}</p>
                        <p className="text-base sm:text-lg font-bold text-foreground">{tile.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    placeholder={t("templates.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-subtle border-0 text-sm"
                  />
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder={t("templates.all_channels")} />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">{t("templates.all_channels")}</SelectItem>
                    <SelectItem value="sms">{t("templates.channel_sms")}</SelectItem>
                    <SelectItem value="whatsapp">{t("templates.channel_whatsapp")}</SelectItem>
                    <SelectItem value="email">{t("templates.channel_email")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder={t("templates.all_categories")} />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">{t("templates.all_categories")}</SelectItem>
                    {filterOptions.categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {categoryLabel(category.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
                    <SelectValue placeholder={t("templates.all_languages")} />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">{t("templates.all_languages")}</SelectItem>
                    {filterOptions.languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {languageLabel(language.value, language.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-hidden">
                {isLoading && templates.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-text-subtle">{t("templates.loading")}</p>
                      <p className="text-xs text-text-subtle mt-2">{t("templates.loading_hint")}</p>
                    </div>
                  </div>
                ) : loadError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-md">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
                      <p className="text-sm text-foreground mb-3">{loadError}</p>
                      <Button variant="outline" size="sm" onClick={refreshAll}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {tx("Try again", "Jaribu tena")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 h-full overflow-y-auto content-start">
                    {templates.length > 0 ? templates.map((template) => (
                      <Card
                        key={template.id}
                        className="glass border-0 hover:shadow-lg transition-smooth cursor-pointer"
                        onClick={() => handlePreviewTemplate(template)}
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
                                    {categoryLabel(template.category)}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {languageLabel(template.language, template.language_display)}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {busyId === template.id && <Loader2 className="w-3 h-3 animate-spin text-text-subtle" />}
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
                                    {t("templates.action_preview")}
                                  </DropdownMenuItem>
                                  {(template.channel === "sms" || template.channel === "all") && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleUseTemplate(template);
                                    }}>
                                      <Send className="w-4 h-4 mr-2" />
                                      {tx("Use in SMS", "Tumia kwenye SMS")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplate(template);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    {t("templates.action_edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateTemplate(template);
                                  }}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    {t("templates.action_duplicate")}
                                  </DropdownMenuItem>
                                  {template.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleReview(template, true);
                                      }}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {t("templates.action_approve")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleReview(template, false);
                                      }}>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {t("templates.action_reject")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStar(template);
                                  }}>
                                    <Star className="w-4 h-4 mr-2" />
                                    {template.is_favorite ? t("templates.action_remove_star") : t("templates.action_add_star")}
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
                                    {t("templates.action_delete")}
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
                              {statusLabel(template.status)}
                            </span>
                          </div>

                          <p className="text-xs lg:text-sm text-text-subtle mb-4 line-clamp-3">
                            {bodyOf(template)}
                          </p>

                          {template.variables_count > 0 && (
                            <div className="mb-4">
                              <Badge variant="outline" className="text-xs">
                                {t("templates.variables_label")} {template.variables_count}
                              </Badge>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-text-subtle gap-1">
                            <span>{t("templates.used_times", { count: template.usage_count })}</span>
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
                            {hasFilters ? t("templates.empty_filtered_title") : t("templates.empty_title")}
                          </h3>
                          <p className="text-sm text-text-subtle mb-6 leading-relaxed">
                            {hasFilters ? t("templates.empty_filtered_desc") : t("templates.empty_desc")}
                          </p>
                          <div className="flex gap-2 justify-center">
                            {hasFilters && (
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
                                {t("templates.clear_filters")}
                              </Button>
                            )}
                            <Button variant="outline" onClick={refreshAll} className="px-6">
                              {t("templates.refresh_page")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isLoading && !loadError && totalCount > templates.length && (
                <p className="text-xs text-text-subtle pt-2">{tx(`Showing ${templates.length} of ${totalCount}. Narrow the search to see the rest.`, `Inaonyesha ${templates.length} kati ya ${totalCount}. Punguza utafutaji kuona zilizobaki.`)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingId(null); }}>
        <DialogContent className="glass w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t("templates.action_edit") : t("templates.create_dialog_title")}</DialogTitle>
            <DialogDescription>
              {t("templates.create_dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">{t("templates.field_name")}</Label>
              <Input
                id="templateName"
                placeholder={t("templates.placeholder_name")}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glass-subtle border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateChannel">{t("templates.field_channel")}</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  channel: value as CreateTemplateRequest["channel"],
                  language: value === "whatsapp" && prev.language && prev.language !== "en" && prev.language !== "sw" ? "" : prev.language,
                }))}
              >
                <SelectTrigger className="glass-subtle border-0">
                  <SelectValue placeholder={t("templates.select_channel_placeholder")} />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="sms">{t("templates.channel_sms")}</SelectItem>
                  <SelectItem value="whatsapp">{t("templates.channel_whatsapp")}</SelectItem>
                  <SelectItem value="email">{t("templates.channel_email")}</SelectItem>
                  <SelectItem value="all">{t("templates.channel_all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t("templates.field_category")}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="glass-subtle border-0">
                  <SelectValue placeholder={t("templates.select_category_placeholder")} />
                </SelectTrigger>
                <SelectContent className="glass">
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>{categoryLabel(category.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("templates.field_language")}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger className="glass-subtle border-0">
                  <SelectValue placeholder={t("templates.select_language_placeholder")} />
                </SelectTrigger>
                <SelectContent className="glass">
                  {formLanguages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>{languageLabel(language.value, language.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("templates.field_description")}</Label>
              <Input
                id="description"
                placeholder={t("templates.placeholder_description")}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass-subtle border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t("templates.field_message_content")}</Label>
              {availableVariables.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-text-subtle mr-1">{tx("Insert variable", "Weka kigezo")}</span>
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs font-mono"
                      title={`${variable.label}: ${variable.description}`}
                      onClick={() => insertVariable(variable.key)}
                    >
                      {`{{${variable.key}}}`}
                    </Button>
                  ))}
                </div>
              )}
              <Textarea
                id="content"
                ref={bodyRef}
                placeholder={t("templates.placeholder_message_content")}
                value={formData.body_text}
                onChange={(e) => {
                  // SMS templates: invisible characters from pasted text are removed as it is typed
                  if (formData.channel === "sms") {
                    const r = cleanTextareaInput(e);
                    setFormData(prev => ({ ...prev, body_text: r.value }));
                  } else {
                    setFormData(prev => ({ ...prev, body_text: e.target.value }));
                  }
                }}
                className="glass-subtle border-0"
                rows={4}
              />
              {formData.channel === "sms" && <SmsTextHint text={formData.body_text} />}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSaveTemplate}
                disabled={isSaving}
              >
                {isSaving ? t("templates.creating") : editingId ? t("templates.edit_short") : t("templates.create_template_button")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsFormOpen(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Detail Panel */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-background lg:static lg:inset-auto lg:z-auto lg:w-96 lg:flex-shrink-0 lg:border-l border-border-subtle glass flex flex-col">
          <div className="p-4 lg:p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base lg:text-lg font-semibold">{t("templates.details_title")}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)} className="h-8 w-8">
                <X className="w-4 h-4" />
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
                  {statusLabel(selectedTemplate.status)}
                </span>
              </div>

              {selectedTemplate.description && (
                <p className="text-xs lg:text-sm text-text-subtle">{selectedTemplate.description}</p>
              )}

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">{t("templates.detail_category_label")}</p>
                <Badge variant="outline" className="text-xs">{categoryLabel(selectedTemplate.category)}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">{t("templates.detail_language_label")}</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 lg:w-4 lg:h-4 text-text-subtle" />
                  <span className="text-xs lg:text-sm text-foreground">{languageLabel(selectedTemplate.language, selectedTemplate.language_display)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs lg:text-sm font-medium text-foreground">{t("templates.usage_stats")}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">{t("templates.total_uses")}</span>
                    <span className="text-foreground">{selectedTemplate.usage_count}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">{t("templates.last_used")}</span>
                    <span className="text-foreground">
                      {selectedTemplate.last_used_display}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-text-subtle">{t("dashboard.sender_ids.table.created")}</span>
                    <span className="text-foreground">{new Date(selectedTemplate.created_at).toLocaleDateString(appLocale())}</span>
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
                  {t("templates.edit_short")}
                </Button>
                {(selectedTemplate.channel === "sms" || selectedTemplate.channel === "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleUseTemplate(selectedTemplate)}
                  >
                    <Send className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    {tx("Use", "Tumia")}
                  </Button>
                )}
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
                <TabsTrigger value="content" className="text-xs lg:text-sm">{t("templates.tab_content")}</TabsTrigger>
                <TabsTrigger value="variables" className="text-xs lg:text-sm">{t("templates.tab_variables")}</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-foreground mb-2">{t("templates.message_content_label")}</p>
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      {selectedLoading && !selectedTemplate.body_text ? (
                        <Loader2 className="w-4 h-4 animate-spin text-text-subtle" />
                      ) : (
                        <p className="text-xs lg:text-sm text-foreground whitespace-pre-wrap">
                          {bodyOf(selectedTemplate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-foreground mb-2">
                      {t("templates.template_variables_count", { count: selectedTemplate.variables?.length ?? selectedTemplate.variables_count })}
                    </p>
                    <div className="space-y-2">
                      {(selectedTemplate.variables ?? []).map((variable) => (
                        <div key={variable} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-surface border border-border-subtle">
                          <Tag className="w-3 h-3 lg:w-4 lg:h-4 text-text-subtle" />
                          <span className="text-xs lg:text-sm text-foreground font-mono">
                            {`{{${variable}}}`}
                          </span>
                        </div>
                      ))}
                      {!selectedLoading && (selectedTemplate.variables ?? []).length === 0 && (
                        <p className="text-xs lg:text-sm text-text-subtle">{t("templates.no_variables")}</p>
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

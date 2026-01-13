import { useState, useRef } from "react";
import {
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
  Ban,
  Star,
  Hash,
  MoreVertical,
  Upload,
  Loader2,
  RefreshCw,
  Zap,
  CreditCard,
  ShoppingCart,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSenderNames } from "@/hooks/useSenderNames";
import { useDefaultSender } from "@/hooks/useDefaultSender";
import { SenderNameRequest, UnifiedSenderName } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type SenderStatus = "approved" | "pending" | "verifying" | "rejected" | "suspended" | "requires_changes" | "active";

const SenderNames = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const {
    senderNames,
    stats,
    loading,
    error,
    createSenderName,
    updateSenderName,
    deleteSenderName,
    getSenderName,
    refreshData,
    fetchSenderNamesByTenant
  } = useSenderNames();

  // Add default sender functionality
  const {
    overview,
    availableSenders,
    isLoading: defaultSenderLoading,
    error: defaultSenderError,
    isRequesting,
    requestDefaultSender,
    cancelDefaultSender,
    refreshData: refreshDefaultSender,
    canRequestDefaultSender,
    needsPurchaseCredits,
    getCurrentCredits,
    getDefaultSenderName,
    getCurrentSenderID,
    getCannotRequestReason,
    getAllAvailableSenders,
    getStatusBadgeVariant,
    formatDate,
    getStatusIcon
  } = useDefaultSender();

  // Fallback functions in case the hook fails
  const safeFormatDate = formatDate || ((dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  );

  const safeGetStatusIcon = getStatusIcon || ((status: SenderStatus) => {
    switch (status) {
      case "approved": return <Check className="w-4 h-4 text-success" />;
      case "pending": return <Clock className="w-4 h-4 text-warning" />;
      case "verifying": return <Clock className="w-4 h-4 text-primary" />;
      case "rejected": return <X className="w-4 h-4 text-destructive" />;
      case "suspended": return <Ban className="w-4 h-4 text-destructive" />;
      case "requires_changes": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  });

  // Add back the getStatusBadge function that was accidentally removed
  const getStatusBadge = (status: SenderStatus) => {
    const variants: Record<SenderStatus, "default" | "secondary" | "outline" | "destructive"> = {
      approved: "default",
      active: "default",
      pending: "secondary",
      verifying: "secondary",
      rejected: "destructive",
      suspended: "destructive",
      requires_changes: "outline",
    };

    const statusLabels: Record<SenderStatus, string> = {
      approved: "Approved",
      pending: "Pending",
      verifying: "Verifying",
      rejected: "Rejected",
      suspended: "Suspended",
      requires_changes: "Requires Changes",
      active: "Active",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {safeGetStatusIcon(status)}
        <span className="ml-1">{statusLabels[status]}</span>
      </Badge>
    );
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [newSenderName, setNewSenderName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingSender, setEditingSender] = useState<SenderNameRequest | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSenderName, setEditSenderName] = useState("");
  const [editUseCase, setEditUseCase] = useState("");
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [selectedSender, setSelectedSender] = useState<SenderNameRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [tenantFilter, setTenantFilter] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);


  const handleViewDetails = async (sender: SenderNameRequest | UnifiedSenderName) => {
    try {
      // For unified senders, we can only show the available data
      const isUnified = 'tenant_name' in sender;
      if (isUnified) {
        const unifiedSender = sender as UnifiedSenderName;
        // Create a compatible object for the details dialog
        const compatibleSender = {
          id: `${unifiedSender.sender_id}-${unifiedSender.tenant_id}`,
          sender_name: unifiedSender.sender_id,
          status: unifiedSender.status,
          use_case: unifiedSender.tenant_name || 'N/A',
          created_at: unifiedSender.created_at,
          updated_at: unifiedSender.updated_at,
          supporting_documents: [],
          supporting_documents_count: 0
        };
        setSelectedSender(compatibleSender as SenderNameRequest);
        setShowDetailsDialog(true);
        return;
      }

      // For legacy senders, try to fetch fresh details
      const legacySender = sender as SenderNameRequest;
      const result = await getSenderName(legacySender.id);
      if (result.success && result.data) {
        setSelectedSender(result.data);
        setShowDetailsDialog(true);
      } else {
        console.error('Failed to fetch sender details:', result.error);
        // Fallback to using existing data
        setSelectedSender(legacySender);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching sender details:', error);
      // Fallback to using existing data
      setSelectedSender(sender as SenderNameRequest);
      setShowDetailsDialog(true);
    }
  };

  const handleEditRequest = (sender: SenderNameRequest | UnifiedSenderName) => {
    // Handle both unified and legacy sender types
    const isUnified = 'tenant_name' in sender;
    if (isUnified) {
      const unifiedSender = sender as UnifiedSenderName;
      setEditingSender(unifiedSender as unknown as SenderNameRequest);
      setEditSenderName(unifiedSender.sender_id);
      setEditUseCase(unifiedSender.tenant_name || '');
    } else {
      const legacySender = sender as SenderNameRequest;
      setEditingSender(legacySender);
      setEditSenderName(legacySender.sender_name);
      setEditUseCase(legacySender.use_case);
    }
    setEditSelectedFiles([]);
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!editingSender) return;

    setSubmitting(true);
    try {
      const result = await updateSenderName(editingSender.id, {
        sender_name: editSenderName,
        use_case: editUseCase,
        supporting_documents: editSelectedFiles.length > 0 ? editSelectedFiles : undefined
      });

      if (result.success) {
        setShowEditDialog(false);
        setEditingSender(null);
        setEditSenderName("");
        setEditUseCase("");
        setEditSelectedFiles([]);
      } else {
        console.error('Failed to update sender name:', result.error);
      }
    } catch (error) {
      console.error('Error updating sender name:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate file types
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload only PDF, JPEG, or PNG files",
          variant: "destructive"
        });
        return;
      }

      // Validate file sizes (5MB limit per file)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = files.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 5MB each",
          variant: "destructive"
        });
        return;
      }

      setSelectedFiles(files);
      toast({
        title: "Files selected",
        description: `${files.length} file(s) selected for upload`,
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRequestSenderName = async () => {
    if (!newSenderName.trim()) {
      toast({
        title: "Sender name required",
        description: "Please enter a sender name",
        variant: "destructive"
      });
      return;
    }

    if (!useCase.trim()) {
      toast({
        title: "Use case required",
        description: "Please describe how you'll use this sender name",
        variant: "destructive"
      });
      return;
    }

    if (useCase.length < 10) {
      toast({
        title: "Use case too short",
        description: "Please provide at least 10 characters describing your use case",
        variant: "destructive"
      });
      return;
    }


    setSubmitting(true);

    try {
      const result = await createSenderName({
        sender_name: newSenderName,
        use_case: useCase,
        supporting_documents: selectedFiles
      });

      if (result.success) {
        setSubmitting(false);
        setShowRequestDialog(false);

        // Reset form
        setNewSenderName("");
        setUseCase("");
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: "Request submitted",
          description: "Your sender name request is pending approval",
        });
      } else {
        setSubmitting(false);

        if (result.errors) {
          // Handle validation errors
          const errorMessages = Object.values(result.errors).flat();
          toast({
            title: "Validation failed",
            description: errorMessages.join(", "),
            variant: "destructive"
          });
        } else {
          toast({
            title: "Request failed",
            description: result.error || "Failed to submit sender name request",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      setSubmitting(false);
      toast({
        title: "Request failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      const result = await deleteSenderName(id);

      if (result.success) {
        toast({
          title: "Request deleted",
          description: "Sender name request has been deleted",
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete sender name request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleRequestDefaultSender = async () => {
    try {
      const result = await requestDefaultSender();

      if (result.success) {
        // Refresh both sender names and default sender data
        await Promise.all([refreshData(), refreshDefaultSender()]);
      }
    } catch (error) {
      console.error('Error requesting default sender:', error);
    }
  };

  const handleTenantFilter = async (tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    if (tenantId && fetchSenderNamesByTenant) {
      // Use the new tenant filtering function from the hook
      await fetchSenderNamesByTenant(tenantId);
    } else {
      // Refresh all data
      await refreshData();
    }
  };

  // Final safety check - ensure senderNames is always an array
  const safeSenderNames = Array.isArray(senderNames) ? senderNames : [];

  // Debug logging
  console.log('SenderNames render:', {
    loading,
    error,
    senderNames: senderNames?.length,
    senderNamesData: senderNames,
    stats,
    statsTotal: stats?.total_requests,
    statsPending: stats?.pending_requests,
    statsApproved: stats?.approved_requests,
    statsRejected: stats?.rejected_requests,
    isArray: Array.isArray(senderNames),
    safeSenderNamesLength: safeSenderNames.length,
    safeSenderNames: safeSenderNames
  });

  // Show a fallback UI if we're stuck in loading state for too long
  if (loading && safeSenderNames.length === 0 && !error) {
    // Show the page structure with a loading indicator
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    Sender Names
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    Manage your registered sender IDs for SMS campaigns
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Sender Name
                  </Button>
                  <Button
                    onClick={async () => {
                      await Promise.all([refreshData(), refreshDefaultSender()]);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={loading || defaultSenderLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || defaultSenderLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Loading Card */}
              <Card className="p-6 glass">
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading sender names...</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading sender names...</span>
            </div>
          </div>
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
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    Sender Names
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    Manage your registered sender IDs for SMS campaigns
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Sender Name
                  </Button>
                  <Button
                    onClick={async () => {
                      await Promise.all([refreshData(), refreshDefaultSender()]);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={loading || defaultSenderLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || defaultSenderLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Animated Stats Section */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-text-subtle">Total</p>
                      <p className="text-sm sm:text-xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500">
                          {stats?.total_requests || safeSenderNames.length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-100">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-warning" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-text-subtle">Pending</p>
                      <p className="text-sm sm:text-xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-200">
                            {stats?.pending_requests || safeSenderNames.filter(s => s.status === 'pending').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-200">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="w-3 h-3 sm:w-5 sm:h-5 text-success" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-text-subtle">Approved</p>
                      <p className="text-sm sm:text-xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-success border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-300">
                            {stats?.approved_requests || safeSenderNames.filter(s => s.status === 'approved').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-300">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="w-3 h-3 sm:w-5 sm:h-5 text-destructive" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-text-subtle">Rejected</p>
                      <p className="text-sm sm:text-xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-400">
                            {stats?.rejected_requests || safeSenderNames.filter(s => s.status === 'rejected').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Error Card */}
              <Card className="p-6 glass border-l-4 border-destructive">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                   <div>
                     <h3 className="font-semibold text-destructive mb-2">Error loading sender names</h3>
                     <p className="text-sm text-text-subtle mb-4">{error}</p>
                     {error?.includes('permission') && (
                       <p className="text-xs text-text-subtle mb-4">
                         This feature may require specific user roles or account permissions.
                       </p>
                     )}
                     <div className="flex gap-2">
                       <Button onClick={() => window.location.reload()} variant="outline">
                         Try Again
                       </Button>
                       {error?.includes('permission') && (
                         <Button onClick={() => window.location.href = '/settings'} variant="outline">
                           Check Settings
                         </Button>
                       )}
                     </div>
                   </div>
                </div>
              </Card>

              {/* Empty state for when there's an error */}
              <Card className="glass">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    No sender names available
                  </h3>
                  <p className="text-text-subtle">
                    Unable to load sender names. Please try again or contact support.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    Sender Names
                  </h1>
                  <p className="text-sm sm:text-base text-text-subtle">
                    Manage your registered sender IDs for SMS campaigns
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                  <Button onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto h-9 sm:h-10">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Request Sender Name</span>
                    <span className="xs:hidden">Request</span>
                  </Button>
                  <Button
                    onClick={async () => {
                      await Promise.all([refreshData(), refreshDefaultSender()]);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto h-9 sm:h-10"
                    disabled={loading || defaultSenderLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || defaultSenderLoading) ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Tenant Filter */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Label className="text-sm font-medium shrink-0">Filter by Tenant:</Label>
                <div className="flex gap-2 w-full min-w-0">
                  <Input
                    placeholder="Enter tenant ID or name..."
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="flex-1 sm:w-64"
                  />
                  <Button
                    onClick={() => handleTenantFilter(tenantFilter.trim() || null)}
                    variant="outline"
                    disabled={loading}
                    className="shrink-0"
                  >
                    <span className="hidden sm:inline">Filter</span>
                    <span className="sm:hidden">Filter</span>
                  </Button>
                  {selectedTenantId && (
                    <Button
                      onClick={() => handleTenantFilter(null)}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">Clear</span>
                    </Button>
                  )}
                </div>
              </div>
              {selectedTenantId && (
                <Badge variant="secondary" className="text-xs self-start">
                  Filtered: {selectedTenantId}
                </Badge>
              )}
            </div>

            {/* Animated Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <Card className="p-3 sm:p-4 lg:p-6 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <p className="text-xs sm:text-sm text-text-subtle">Total</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto sm:mx-0" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500">
                            {stats?.total_requests || safeSenderNames.length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 lg:p-6 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-100">
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-warning" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <p className="text-xs sm:text-sm text-text-subtle">Pending</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-warning border-t-transparent rounded-full animate-spin mx-auto sm:mx-0" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-200">
                              {stats?.pending_requests || safeSenderNames.filter(s => s.status === 'pending').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 lg:p-6 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-200">
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <p className="text-xs sm:text-sm text-text-subtle">Approved</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-success border-t-transparent rounded-full animate-spin mx-auto sm:mx-0" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-300">
                              {stats?.approved_requests || safeSenderNames.filter(s => s.status === 'approved').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 lg:p-6 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 delay-300">
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-destructive" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <p className="text-xs sm:text-sm text-text-subtle">Rejected</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-destructive border-t-transparent rounded-full animate-spin mx-auto sm:mx-0" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500 delay-400">
                              {stats?.rejected_requests || safeSenderNames.filter(s => s.status === 'rejected').length || 0}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
            </div>

            {/* Default Sender Card */}
            {overview && (
              <Card className="p-3 sm:p-4 lg:p-6 glass border-l-4 border-blue-500">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-blue-600 mb-1">Default Sender ID</h3>
                          <p className="text-sm text-text-subtle">
                            Use the default sender ID "{getDefaultSenderName?.() || 'Taarifa-SMS'}" for instant SMS sending
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                          {(canRequestDefaultSender && canRequestDefaultSender()) ? (
                            <Button
                              onClick={handleRequestDefaultSender}
                              disabled={isRequesting}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                              {isRequesting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Requesting...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Request Default Sender</span>
                                  <span className="sm:hidden">Request</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <Badge variant={getStatusBadgeVariant?.(overview.active_request?.status || 'approved') || 'default'} className="mb-2">
                                {safeGetStatusIcon((overview.active_request?.status || 'approved') as SenderStatus)}
                                <span className="ml-1">{overview.active_request?.status || 'Available'}</span>
                              </Badge>
                              {getCannotRequestReason?.() && (
                                <p className="text-xs text-text-subtle">{getCannotRequestReason()}</p>
                              )}
                              {(overview.active_request?.status === 'pending' || overview.active_request?.status === 'approved') && (
                                <div className="mt-2">
                                  <Button
                                    onClick={async () => { await cancelDefaultSender?.(); await refreshDefaultSender(); }}
                                    variant="outline"
                                    size="sm"
                                    disabled={isRequesting}
                                    className="w-full sm:w-auto"
                                  >
                                    <span className="hidden sm:inline">Cancel Default Sender</span>
                                    <span className="sm:hidden">Cancel</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Balance and Purchase Info */}
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-text-subtle shrink-0" />
                          <span className="text-text-subtle">Credits:</span>
                          <span className="font-medium">{getCurrentCredits?.() || 0}</span>
                        </div>
                        {needsPurchaseCredits?.() && (
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-orange-500 shrink-0" />
                            <span className="text-orange-600 font-medium">Purchase credits to send SMS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Info Card */}
            <Card className="p-3 sm:p-4 lg:p-6 glass border-l-4 border-primary">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-2">Sender Name Requirements</p>
                  <ul className="text-text-subtle space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Maximum 11 characters (letters, numbers, spaces, _, -)</li>
                    <li>Must be relevant to your business or brand</li>
                    <li>Approval typically takes 1-3 business days</li>
                    <li>Provide valid use case and sample messages</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Sender Names Table - Desktop */}
            <Card className="glass overflow-x-auto hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle">
                    <TableHead className="min-w-[120px]">Sender Name</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Tenant</TableHead>
                    <TableHead className="min-w-[120px]">Created</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeSenderNames.map((sender, index) => {
                    // Handle both UnifiedSenderName and SenderNameRequest types
                    const isUnified = 'tenant_name' in sender;
                    const unifiedSender = sender as unknown as UnifiedSenderName;
                    const legacySender = sender as SenderNameRequest;

                    return (
                      <TableRow
                        key={isUnified ? `${unifiedSender.id}-${unifiedSender.sender_id}-${index}` : `${legacySender.id}-${index}`}
                        className="border-border-subtle animate-in slide-in-from-left-4 fade-in-50"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-sm">{isUnified ? unifiedSender.sender_id : sender.sender_name}</span>
                            {isUnified && unifiedSender.source === "SMSSenderID" && (
                              <Badge variant="outline" className="text-xs">
                                Active ID
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sender.status as SenderStatus)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-text-subtle text-sm">
                            {isUnified ? unifiedSender.tenant_name : (legacySender.use_case || "—")}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-subtle text-sm">
                          {safeFormatDate(sender.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                              <DropdownMenuItem onClick={() => handleViewDetails(sender)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditRequest(sender)}
                                disabled={sender.status !== "pending" && sender.status !== "requires_changes"}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {sender.status === "pending" || sender.status === "requires_changes" ? "Edit" : "Edit (Not Available)"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteRequest(isUnified ? unifiedSender.id : legacySender.id)}
                                disabled={sender.status !== "pending" && sender.status !== "requires_changes"}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {sender.status === "pending" || sender.status === "requires_changes" ? "Delete Request" : "Delete (Not Available)"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {safeSenderNames.length === 0 && (
                <div className="p-6 sm:p-12 text-center animate-in fade-in-50 slide-in-from-bottom-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold mb-2 animate-in fade-in-50 delay-200">
                    No sender names yet
                  </h3>
                  <p className="text-sm sm:text-base text-text-subtle animate-in fade-in-50 delay-300">
                    Request your first sender name to start sending SMS
                  </p>
                </div>
              )}
            </Card>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {safeSenderNames.length === 0 ? (
                <Card className="glass p-6 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold mb-2">
                    No sender names yet
                  </h3>
                  <p className="text-sm sm:text-base text-text-subtle">
                    Request your first sender name to start sending SMS
                  </p>
                </Card>
              ) : (
                safeSenderNames.map((sender, index) => {
                  // Handle both UnifiedSenderName and SenderNameRequest types
                  const isUnified = 'tenant_name' in sender;
                  const unifiedSender = sender as unknown as UnifiedSenderName;
                  const legacySender = sender as SenderNameRequest;

                  return (
                    <Card
                      key={isUnified ? `${unifiedSender.id}-${unifiedSender.sender_id}-${index}` : `${legacySender.id}-${index}`}
                      className="glass p-4 sm:p-6 animate-in slide-in-from-bottom-4 fade-in-50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col space-y-3">
                        {/* Header with Sender Name and Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-mono font-semibold text-sm sm:text-base truncate">
                              {isUnified ? unifiedSender.sender_id : sender.sender_name}
                            </span>
                            {isUnified && unifiedSender.source === "SMSSenderID" && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Active ID
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(sender.status as SenderStatus)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass">
                                <DropdownMenuItem onClick={() => handleViewDetails(sender)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditRequest(sender)}
                                  disabled={sender.status !== "pending" && sender.status !== "requires_changes"}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  {isUnified ?
                                    (unifiedSender.source === "SenderIDRequest" && (sender.status === "pending" || sender.status === "requires_changes") ? "Edit" : "Edit (Not Available)") :
                                    (sender.status === "pending" || sender.status === "requires_changes" ? "Edit" : "Edit (Not Available)")
                                  }
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteRequest(isUnified ? unifiedSender.id : legacySender.id)}
                                  disabled={sender.status !== "pending" && sender.status !== "requires_changes"}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isUnified ?
                                    (unifiedSender.source === "SenderIDRequest" && (sender.status === "pending" || sender.status === "requires_changes") ? "Delete Request" : "Delete (Not Available)") :
                                    (sender.status === "pending" || sender.status === "requires_changes" ? "Delete Request" : "Delete (Not Available)")
                                  }
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Footer with Tenant and Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border-subtle">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="text-xs text-text-subtle">
                              <span className="font-medium">Tenant:</span> {isUnified ? unifiedSender.tenant_name : (legacySender.use_case || "—")}
                            </span>
                          </div>
                          <span className="text-xs text-text-subtle">
                            {safeFormatDate(sender.created_at)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Request Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogContent className="glass max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base sm:text-lg">Request New Sender Name</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Submit a request to register a new sender ID for your SMS campaigns
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Sender Name *</Label>
                    <Input
                      placeholder="e.g., MyCompany, MY_COMPANY, My-Company"
                      value={newSenderName}
                      onChange={(e) => setNewSenderName(e.target.value)}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono text-xs sm:text-sm h-8"
                    />
                    <p className="text-xs text-text-subtle">
                      {newSenderName.length}/11 characters (letters, numbers, spaces, _, -)
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Use Case *</Label>
                    <Textarea
                      placeholder="Describe how you plan to use this sender name..."
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      className="glass-subtle border-0 text-xs sm:text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Supporting Documents (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-2 text-center">
                      {selectedFiles.length > 0 ? (
                        <div className="space-y-1">
                          <Check className="w-4 h-4 mx-auto text-green-500" />
                          <p className="text-xs font-medium text-green-600">
                            {selectedFiles.length} file(s) selected
                          </p>
                          <div className="space-y-1">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="truncate flex-1 mr-1">{file.name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveFile(index)}
                                  className="text-red-600 hover:text-red-700 h-4 w-4 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAllFiles}
                            className="text-red-600 hover:text-red-700 text-xs w-full h-7"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove All Files
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-4 h-4 mx-auto mb-1 text-text-subtle" />
                          <p className="text-xs text-text-subtle mb-1">
                            Upload business license or registration
                          </p>
                          <p className="text-xs text-text-subtle mb-1">
                            PDF, JPEG, or PNG (max 5MB)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            id="doc-upload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="doc-upload">
                            <Button variant="outline" size="sm" asChild className="text-xs h-7">
                              <span>Choose File</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-1 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestDialog(false)}
                    disabled={submitting}
                    className="w-full sm:w-auto h-8 text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRequestSenderName} disabled={submitting} className="w-full sm:w-auto h-8 text-xs sm:text-sm">
                    {submitting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="glass max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base sm:text-lg">Edit Sender Name Request</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Update your sender name request details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Sender Name *</Label>
                    <Input
                      placeholder="e.g., MyCompany, MY_COMPANY, My-Company"
                      value={editSenderName}
                      onChange={(e) => setEditSenderName(e.target.value)}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono text-xs sm:text-sm h-8"
                    />
                    <p className="text-xs text-text-subtle">
                      {editSenderName.length}/11 characters (letters, numbers, spaces, _, -)
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Use Case *</Label>
                    <Textarea
                      placeholder="Describe how you plan to use this sender name..."
                      value={editUseCase}
                      onChange={(e) => setEditUseCase(e.target.value)}
                      className="glass-subtle border-0 text-xs sm:text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Additional Supporting Documents (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4 text-center">
                      {editSelectedFiles.length > 0 ? (
                        <div className="space-y-2">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-500" />
                          <p className="text-xs sm:text-sm font-medium text-green-600">
                            {editSelectedFiles.length} file(s) selected
                          </p>
                          <div className="space-y-1">
                            {editSelectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                                <span className="truncate">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-text-subtle" />
                          <div>
                            <p className="text-xs sm:text-sm font-medium">Click to upload files</p>
                            <p className="text-xs text-text-subtle">PDF, DOC, DOCX, JPG, PNG (max 5MB each)</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEditSelectedFiles(prev => [...prev, ...files]);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSubmit} disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Request"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
              <DialogContent className="glass max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base sm:text-lg">Sender Name Request Details</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    View detailed information about this sender name request
                  </DialogDescription>
                </DialogHeader>

                {selectedSender && (
                  <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
                    {/* Header Section */}
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full mb-3">
                        <span className="text-lg sm:text-xl font-bold text-primary">
                          {selectedSender.sender_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">
                        {selectedSender.sender_name}
                      </h3>
                      <div className="flex items-center justify-center">
                        {getStatusBadge(selectedSender.status)}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="font-medium text-sm sm:text-base text-foreground">Basic Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-text-subtle">Sender Name</Label>
                          <div className="p-2 sm:p-3 bg-muted/30 rounded-lg font-mono text-xs sm:text-sm break-all">
                          {selectedSender.sender_name}
                        </div>
                      </div>
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-text-subtle">Status</Label>
                          <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
                          {getStatusBadge(selectedSender.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Use Case */}
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium text-text-subtle">Use Case</Label>
                      <div className="p-2 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm">
                        {selectedSender.use_case}
                      </div>
                    </div>

                    {/* Supporting Documents */}
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium text-text-subtle">Supporting Documents</Label>
                      <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
                        {selectedSender.supporting_documents_count > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm text-text-subtle">
                              {selectedSender.supporting_documents_count} file(s) uploaded
                            </p>
                            <div className="space-y-1">
                              {selectedSender.supporting_documents.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <Upload className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{doc.split('/').pop()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-text-subtle">No supporting documents</p>
                        )}
                      </div>
                    </div>

                    {/* Admin Information */}
                    {(selectedSender.reviewed_by || selectedSender.admin_notes) && (
                      <div className="space-y-3 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-medium text-primary text-sm sm:text-base">Review Information</h4>
                        {selectedSender.reviewed_by && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-text-subtle">Reviewed By</Label>
                              <p className="text-xs sm:text-sm">{selectedSender.reviewed_by_name}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-text-subtle">Reviewed At</Label>
                              <p className="text-xs sm:text-sm">{safeFormatDate(selectedSender.reviewed_at!)}</p>
                            </div>
                          </div>
                        )}
                        {selectedSender.admin_notes && (
                          <div className="space-y-1">
                            <Label className="text-xs text-text-subtle">Admin Notes</Label>
                            <p className="text-xs sm:text-sm">{selectedSender.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm sm:text-base text-foreground">Timestamps</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-text-subtle">
                      <div>
                        <Label className="text-xs">Created</Label>
                          <p className="text-xs sm:text-sm">{safeFormatDate(selectedSender.created_at)}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Last Updated</Label>
                          <p className="text-xs sm:text-sm">{safeFormatDate(selectedSender.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-2 border-t border-border-subtle">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenderNames;

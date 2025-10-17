import { useState, useRef } from "react";
import {
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
  Ban,
  Star,
  MoreVertical,
  Upload,
  Loader2,
  RefreshCw
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSenderNames } from "@/hooks/useSenderNames";
import { SenderNameRequest } from "@/lib/api";
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

type SenderStatus = "approved" | "pending" | "verifying" | "rejected" | "suspended" | "requires_changes";

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
    refreshData
  } = useSenderNames();
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


  const handleViewDetails = async (sender: SenderNameRequest) => {
    try {
      // Fetch fresh details from API
      const result = await getSenderName(sender.id);
      if (result.success && result.data) {
        setSelectedSender(result.data);
        setShowDetailsDialog(true);
      } else {
        console.error('Failed to fetch sender details:', result.error);
        // Fallback to using existing data
        setSelectedSender(sender);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching sender details:', error);
      // Fallback to using existing data
      setSelectedSender(sender);
      setShowDetailsDialog(true);
    }
  };

  const handleEditRequest = (sender: SenderNameRequest) => {
    setEditingSender(sender);
    setEditSenderName(sender.sender_name);
    setEditUseCase(sender.use_case);
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

  const getStatusIcon = (status: SenderStatus) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "verifying":
        return <Clock className="w-4 h-4 text-primary" />;
      case "rejected":
        return <X className="w-4 h-4 text-destructive" />;
      case "suspended":
        return <Ban className="w-4 h-4 text-destructive" />;
      case "requires_changes":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: SenderStatus) => {
    const variants: Record<SenderStatus, "default" | "secondary" | "outline" | "destructive"> = {
      approved: "default",
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
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{statusLabels[status]}</span>
      </Badge>
    );
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
        sender_name: newSenderName.toUpperCase(),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
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
                    onClick={refreshData}
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                    onClick={refreshData}
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Animated Stats Section */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-text-subtle">Total</p>
                      <p className="text-sm sm:text-xl font-bold text-foreground">
                        {loading ? (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="animate-in fade-in-50 duration-500">
                            {stats?.total_requests || 0}
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
                            {stats?.pending_requests || 0}
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
                            {stats?.approved_requests || 0}
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
                            {stats?.rejected_requests || 0}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Sender Names
                </h1>
                <p className="text-sm sm:text-base text-text-subtle">
                  Manage your registered sender IDs for SMS campaigns
                </p>
              </div>
              <Button onClick={() => setShowRequestDialog(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Request Sender Name
              </Button>
            </div>

            {/* Animated Stats Section */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <Card className="p-2 sm:p-4 glass hover:shadow-lg transition-all duration-300 animate-in slide-in-from-top-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-text-subtle">Total</p>
                    <p className="text-sm sm:text-xl font-bold text-foreground">
                      {loading ? (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="animate-in fade-in-50 duration-500">
                          {stats?.total_requests || 0}
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
                          {stats?.pending_requests || 0}
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
                          {stats?.approved_requests || 0}
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
                          {stats?.rejected_requests || 0}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="p-3 sm:p-4 glass border-l-4 border-primary">
              <div className="flex gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-medium mb-1">Sender Name Requirements</p>
                  <ul className="text-text-subtle space-y-1 list-disc list-inside">
                    <li>Maximum 11 characters (alphanumeric)</li>
                    <li>Must be relevant to your business or brand</li>
                    <li>Approval typically takes 1-3 business days</li>
                    <li>Provide valid use case and sample messages</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Sender Names Table */}
            <Card className="glass overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle">
                    <TableHead className="min-w-[120px]">Sender Name</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[150px]">Use Case</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Created</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeSenderNames.map((sender, index) => (
                    <TableRow
                      key={sender.id}
                      className="border-border-subtle animate-in slide-in-from-left-4 fade-in-50"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm">{sender.sender_name}</span>
                        </div>
                        <div className="sm:hidden text-xs text-text-subtle mt-1">
                          {sender.use_case || "—"}
                        </div>
                        <div className="md:hidden text-xs text-text-subtle">
                          {formatDate(sender.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sender.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-xs truncate text-text-subtle text-sm">
                          {sender.use_case || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-text-subtle text-sm">
                        {formatDate(sender.created_at)}
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
                              View Details
                            </DropdownMenuItem>
                            {(sender.status === "pending" || sender.status === "requires_changes") && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditRequest(sender)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteRequest(sender.id)}
                                >
                                  Delete Request
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
                      placeholder="e.g., MYCOMPANY"
                      value={newSenderName}
                      onChange={(e) => setNewSenderName(e.target.value.toUpperCase())}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono text-xs sm:text-sm h-8"
                    />
                    <p className="text-xs text-text-subtle">
                      {newSenderName.length}/11 characters (alphanumeric only)
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
                      placeholder="e.g., MYCOMPANY"
                      value={editSenderName}
                      onChange={(e) => setEditSenderName(e.target.value.toUpperCase())}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono text-xs sm:text-sm h-8"
                    />
                    <p className="text-xs text-text-subtle">
                      {editSenderName.length}/11 characters (alphanumeric only)
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
              <DialogContent className="glass max-w-[95vw] sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Sender Name Request Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this sender name request
                  </DialogDescription>
                </DialogHeader>

                {selectedSender && (
                  <div className="space-y-6 my-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Sender Name</Label>
                        <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                          {selectedSender.sender_name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          {getStatusBadge(selectedSender.status)}
                        </div>
                      </div>
                    </div>

                    {/* Use Case */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Use Case</Label>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {selectedSender.use_case}
                      </div>
                    </div>

                    {/* Supporting Documents */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Supporting Documents</Label>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        {selectedSender.supporting_documents_count > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-text-subtle">
                              {selectedSender.supporting_documents_count} file(s) uploaded
                            </p>
                            <div className="space-y-1">
                              {selectedSender.supporting_documents.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <Upload className="w-3 h-3" />
                                  <span className="truncate">{doc.split('/').pop()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-text-subtle">No supporting documents</p>
                        )}
                      </div>
                    </div>

                    {/* Admin Information */}
                    {(selectedSender.reviewed_by || selectedSender.admin_notes) && (
                      <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-medium text-primary">Review Information</h4>
                        {selectedSender.reviewed_by && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-text-subtle">Reviewed By</Label>
                              <p className="text-sm">{selectedSender.reviewed_by_name}</p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-text-subtle">Reviewed At</Label>
                              <p className="text-sm">{formatDate(selectedSender.reviewed_at!)}</p>
                            </div>
                          </div>
                        )}
                        {selectedSender.admin_notes && (
                          <div className="space-y-1">
                            <Label className="text-xs text-text-subtle">Admin Notes</Label>
                            <p className="text-sm">{selectedSender.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-text-subtle">
                      <div>
                        <Label className="text-xs">Created</Label>
                        <p>{formatDate(selectedSender.created_at)}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Last Updated</Label>
                        <p>{formatDate(selectedSender.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                    className="w-full sm:w-auto"
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

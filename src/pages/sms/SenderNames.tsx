import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logger } from "@/utils/logger";
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
  Trash2,
  ChevronRight
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSenderNames } from "@/hooks/useSenderNames";
import { useDefaultSender } from "@/hooks/useDefaultSender";
import { SenderNameRequest, UnifiedSenderName, apiClient, SenderRequestPaymentResponse } from "@/lib/api";
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
import { useLanguage } from "@/hooks/useLanguage";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

type SenderStatus = "approved" | "pending" | "verifying" | "rejected" | "suspended" | "requires_changes" | "active" | "awaiting_payment" | "cancelled" | "inactive";

interface PaymentData {
  requested_sender_id: string;
  phone_number: string;
  sample_content: string;
  purpose: string;
  kyc_documents?: File[];
}

const extractSenderRequestId = (payload?: SenderNameRequest): string | undefined => {
  if (!payload) return undefined;

  if (payload.data) {
    const nestedId = extractSenderRequestId(payload.data);
    if (nestedId) return nestedId;
  }

  if (payload.id) return payload.id;
  if (payload.sender_request_id) return payload.sender_request_id;
  if (payload.sender_id_request?.id) return payload.sender_id_request.id;

  return undefined;
};

const flattenPaymentResponse = (payload?: SenderRequestPaymentResponse): SenderRequestPaymentResponse | undefined => {
  if (!payload) return undefined;
  if (payload.data && !payload.payment) {
    return flattenPaymentResponse(payload.data);
  }
  return payload;
};

const SenderNames = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    setPageReady(true); // Make page ready immediately

    // Listen for navigation events from sidebar
    const handlePageNavigate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const targetHref: string | undefined = customEvent.detail?.href;
      const isStillOnSenderNames = !!targetHref && (
        targetHref.includes('/sms/sender-names') || targetHref.includes('/messaging/sender-names')
      );
      if (targetHref && !isStillOnSenderNames) {
        // Abort ALL pending operations immediately
        abortControllerRef.current.abort();
        isMountedRef.current = false;
        setPageReady(false);
        setShowRequestDialog(false);
        setShowEditDialog(false);
        setShowDetailsDialog(false);
        setShowPaymentDialog(false);
        setSubmitting(false);
        // Clear payment polling
        setPaymentPolling(prev => {
          if (prev) clearInterval(prev);
          return null;
        });
      }
    };

    window.addEventListener('page-navigate', handlePageNavigate);

    return () => {
      window.removeEventListener('page-navigate', handlePageNavigate);
      abortControllerRef.current.abort();
      isMountedRef.current = false;
      // Cleanup payment polling
      setPaymentPolling(prev => {
        if (prev) clearInterval(prev);
        return null;
      });
    };
  }, []);

  // Immediate cleanup when navigating away from this page
  useEffect(() => {
    const isOnSenderNames =
      location.pathname.includes('/sms/sender-names') ||
      location.pathname.includes('/messaging/sender-names');
    const isLeavingPage = !isOnSenderNames;

    if (isLeavingPage) {
      // Abort ALL pending operations immediately
      abortControllerRef.current.abort();
      isMountedRef.current = false;
      setPageReady(false);
      setShowRequestDialog(false);
      setShowEditDialog(false);
      setShowDetailsDialog(false);
      setSubmitting(false);
    }
  }, [location.pathname]);

  // Auto-open request dialog when action=request query parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'request') {
      setShowRequestDialog(true);
    }
  }, [location.search]);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
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
  let overview, availableSenders, isLoadingDefault, errorDefault, isRequesting, requestDefaultSender, cancelDefaultSender, refreshDefaultSender, fetchSenderNamesByTenantDefault;
  let canRequestDefaultSender, needsPurchaseCredits, getCurrentCredits, getDefaultSenderName, getCurrentSenderID, getCannotRequestReason, getAllAvailableSenders, getStatusBadgeVariant, formatDate, getStatusIcon;

  try {
    const defaultSenderHook = useDefaultSender();
    ({
      overview,
      availableSenders,
      isLoading: isLoadingDefault,
      error: errorDefault,
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
    } = defaultSenderHook);
  } catch (err) {
    logger.error('Error initializing useDefaultSender hook');
  }

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
      case "approved": return <Check className="w-4 h-4 text-green-600" />;
      case "active": return <Check className="w-4 h-4 text-green-600" />;
      case "pending": return <Clock className="w-4 h-4 text-blue-600" />;
      case "verifying": return <Clock className="w-4 h-4 text-purple-600" />;
      case "rejected": return <X className="w-4 h-4 text-red-600" />;
      case "suspended": return <Ban className="w-4 h-4 text-red-600" />;
      case "requires_changes": return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "awaiting_payment": return <CreditCard className="w-4 h-4 text-orange-600" />;
      case "cancelled": return <Ban className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  });

  // Add back the getStatusBadge function that was accidentally removed
  const getStatusBadge = (status: SenderStatus) => {
    const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
      approved: {
        label: "Approved",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200"
      },
      active: {
        label: "Active",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200"
      },
      pending: {
        label: "Pending",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200"
      },
      verifying: {
        label: "Verifying",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200"
      },
      rejected: {
        label: "Rejected",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200"
      },
      suspended: {
        label: "Suspended",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200"
      },
      requires_changes: {
        label: "Requires Changes",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200"
      },
      awaiting_payment: {
        label: "Awaiting Payment",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200"
      },
      cancelled: {
        label: "Cancelled",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200"
      }
    };

    // Default fallback config
    const defaultConfig = {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Unknown',
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200"
    };

    const config = statusConfig[status] || defaultConfig;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} text-sm font-medium`}>
        {safeGetStatusIcon(status as SenderStatus)}
        <span className={config.textColor}>{config.label}</span>
      </div>
    );
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestedSenderId, setRequestedSenderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sampleContent, setSampleContent] = useState("");
  const [senderNamePurpose, setSenderNamePurpose] = useState("");
  const [requestType, setRequestType] = useState("custom");
  const [submitting, setSubmitting] = useState(false);
  const [kycDocuments, setKycDocuments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());
  const pollAttemptsRef = useRef(0);
  const paymentPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [editingSender, setEditingSender] = useState<SenderNameRequest | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSenderName, setEditSenderName] = useState("");
  const [editUseCase, setEditUseCase] = useState("");
  const [editSampleContent, setEditSampleContent] = useState("");
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [selectedSender, setSelectedSender] = useState<SenderNameRequest | UnifiedSenderName | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [senderIdDetails, setSenderIdDetails] = useState<UnifiedSenderName | null>(null);
  const [loadingSenderIdDetails, setLoadingSenderIdDetails] = useState(false);
  const [tenantFilter, setTenantFilter] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentPolling, setPaymentPolling] = useState<NodeJS.Timeout | null>(null);

  // Payment status dialog (after redirect from payment gateway)
  const [showPaymentStatusDialog, setShowPaymentStatusDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>("");
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxPollAttempts = 24; // 2 minutes with 5-second intervals

  // Payment pending state (when payment_url is null)
  const [showPaymentPendingDialog, setShowPaymentPendingDialog] = useState(false);
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<string>("");
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState<string>("");

  // Repay dialog state
  const [showRepayDialog, setShowRepayDialog] = useState(false);
  const [repayRequestId, setRepayRequestId] = useState<string>("");
  const [repayPhoneNumber, setRepayPhoneNumber] = useState("");
  const [repayProcessing, setRepayProcessing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sender request fee (fetched from API)
  const [senderFeeAmount, setSenderFeeAmount] = useState<number | null>(null);
  const [senderFeeCurrency, setSenderFeeCurrency] = useState<string>("TZS");
  const [senderFeeLoading, setSenderFeeLoading] = useState(false);

  const formatSenderFee = () => {
    if (senderFeeAmount == null) return null;
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(senderFeeAmount);
    return `${senderFeeCurrency} ${formatted}`;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchFee = async () => {
      setSenderFeeLoading(true);
      try {
        const response = await apiClient.getSenderRequestFee();
        if (cancelled) return;
        if (response.success && response.data) {
          const payload = response.data as {
            currency?: string;
            amount?: number;
            data?: { currency?: string; amount?: number };
          };
          const amount = payload.amount ?? payload.data?.amount;
          const currency = payload.currency ?? payload.data?.currency ?? "TZS";
          if (typeof amount === 'number') {
            setSenderFeeAmount(amount);
            setSenderFeeCurrency(currency);
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch sender request fee');
      } finally {
        if (!cancelled) setSenderFeeLoading(false);
      }
    };
    fetchFee();
    return () => { cancelled = true; };
  }, []);

  // Check for payment return from payment gateway
  useEffect(() => {
    const orderId = localStorage.getItem('sender_request_order_id');

    if (orderId && paymentStatus === 'checking' && paymentStatusMessage) {
      // Start polling for payment status
      if (paymentPollIntervalRef.current) {
        clearInterval(paymentPollIntervalRef.current);
      }

      paymentPollIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current) {
          if (paymentPollIntervalRef.current) clearInterval(paymentPollIntervalRef.current);
          return;
        }

        pollAttemptsRef.current += 1;
        setPollAttempts(pollAttemptsRef.current);

        const response = await apiClient.checkSenderPaymentStatus(orderId);

        if (response.success && response.data) {
          const remoteStatus = response.data.remote?.payment_status?.toUpperCase();

          if (remoteStatus === 'COMPLETED' || remoteStatus === 'SUCCESS') {
            // Payment successful
            if (paymentPollIntervalRef.current) clearInterval(paymentPollIntervalRef.current);

            // Clear stored data
            localStorage.removeItem('sender_request_order_id');
            localStorage.removeItem('sender_request_id');

            // Reset poll attempts
            pollAttemptsRef.current = 0;

            // Show success notification
            toast({
              title: "Payment Successful",
              description: "Your sender ID request is being processed",
            });

            // Hide the payment status dialog immediately
            setShowPaymentStatusDialog(false);
            setPaymentStatus('checking');
            setPaymentStatusMessage("");
            setPollAttempts(0);

            // Refresh sender names and data immediately
            await refreshData();
          } else if (remoteStatus === 'FAILED' || remoteStatus === 'CANCELLED') {
            // Payment failed
            if (paymentPollIntervalRef.current) clearInterval(paymentPollIntervalRef.current);
            setPaymentStatus('failed');
            setPaymentStatusMessage('Payment failed. Your request has been cancelled. Please try again.');

            // Clear stored data
            localStorage.removeItem('sender_request_order_id');
            localStorage.removeItem('sender_request_id');

            // Reset poll attempts
            pollAttemptsRef.current = 0;

            // Show error notification
            toast({
              title: "Payment Failed",
              description: "Your payment was not completed. Please try again.",
              variant: "destructive"
            });
          }
        }

        // Stop polling after max attempts
        if (pollAttemptsRef.current >= maxPollAttempts) {
          if (paymentPollIntervalRef.current) clearInterval(paymentPollIntervalRef.current);
          setPaymentStatus('success');
          setPaymentStatusMessage('Payment request submitted. Your request will be processed shortly.');
          pollAttemptsRef.current = 0;

          // Show notification
          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. Your request will be reviewed shortly.",
          });
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (paymentPollIntervalRef.current && paymentStatus === 'checking') {
        clearInterval(paymentPollIntervalRef.current);
        paymentPollIntervalRef.current = null;
      }
    };
  }, [paymentStatus, paymentStatusMessage, refreshData, toast]);

  // Initialize payment status check on mount if returning from payment
  useEffect(() => {
    const orderId = localStorage.getItem('sender_request_order_id');
    if (orderId && paymentStatus === 'checking' && !paymentStatusMessage) {
      // Start polling silently in the background (don't show dialog yet)
      pollAttemptsRef.current = 0;
      setPollAttempts(0);
      setPaymentStatusMessage('Checking payment status...');
    }
  }, [paymentStatus, paymentStatusMessage]);

  // Fetch sender ID details when details dialog opens
  useEffect(() => {
    const fetchSenderIdDetails = async () => {
      if (!showDetailsDialog || !selectedSender) {
        setSenderIdDetails(null);
        return;
      }

      setLoadingSenderIdDetails(true);
      try {
        // Get the sender name to search for
        const senderName = 'sender_name' in selectedSender
          ? selectedSender.sender_name
          : selectedSender.sender_id;

        // Get the sender ID for matching
        const senderId = 'id' in selectedSender ? selectedSender.id : undefined;

        // Fetch unified sender names
        const response = await apiClient.getUnifiedSenderNames();

        if (response.success && response.data && response.data.data && Array.isArray(response.data.data)) {
          // Find matching sender by sender_id or id
          const details = response.data.data.find((item: UnifiedSenderName) =>
            item.sender_id === senderName || (senderId && item.id === senderId)
          );
          if (details) {
            setSenderIdDetails(details);
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch sender ID details:', error);
      } finally {
        setLoadingSenderIdDetails(false);
      }
    };

    fetchSenderIdDetails();
  }, [showDetailsDialog, selectedSender]);




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
          supporting_documents_count: 0,
          rejection_reason: unifiedSender.rejection_reason,
          requires_changes: unifiedSender.requires_changes,
          change_details: unifiedSender.change_details,
          sample_content: unifiedSender.sample_content,
          admin_notes: '',
          reviewed_by: null,
          reviewed_by_name: '',
          reviewed_at: null,
          created_by: 0,
          created_by_name: ''
        };
        setSelectedSender(compatibleSender as unknown as SenderNameRequest);
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
        logger.warn('Failed to fetch sender details');
        // Fallback to using existing data
        setSelectedSender(legacySender);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      logger.warn('Error fetching sender details');
      // Fallback to using existing data
      setSelectedSender(sender as unknown as SenderNameRequest);
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
      const sampleContent = (unifiedSender as unknown as Record<string, unknown>)?.sample_content as string | undefined;
      setEditSampleContent(sampleContent || '');
    } else {
      const legacySender = sender as SenderNameRequest;
      setEditingSender(legacySender);
      setEditSenderName(legacySender.sender_name);
      setEditUseCase(legacySender.use_case);
      const sampleContent = (legacySender as unknown as Record<string, unknown>)?.sample_content as string | undefined;
      setEditSampleContent(sampleContent || '');
    }
    setEditSelectedFiles([]);
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!editingSender) return;

    setSubmitting(true);
    try {
      const updateData = {
        sender_name: editSenderName,
        use_case: editUseCase,
        sample_content: editSampleContent.trim() || undefined,
        supporting_documents: editSelectedFiles.length > 0 ? editSelectedFiles : undefined
      };

      const result = await updateSenderName(editingSender.id, updateData);

      if (result.success) {
        setShowEditDialog(false);
        setEditingSender(null);
        setEditSenderName("");
        setEditUseCase("");
        setEditSampleContent("");
        setEditSelectedFiles([]);
        toast({
          title: "Updated successfully",
          description: "Sender name request has been updated",
        });
      } else {
        logger.warn('Failed to update sender name');
        toast({
          title: "Update failed",
          description: result.error || "Failed to update sender name request",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.warn('Error updating sender name');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate file types (PDF only)
      const allowedTypes = ['application/pdf'];
      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload only PDF files",
          variant: "destructive"
        });
        return;
      }

      // Validate file sizes (8MB limit per file per API spec)
      const maxSize = 8 * 1024 * 1024; // 8MB
      const oversizedFiles = files.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 8MB each",
          variant: "destructive"
        });
        return;
      }

      setKycDocuments(files);
      toast({
        title: "Files selected",
        description: `${files.length} file(s) selected for upload`,
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setKycDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setKycDocuments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRequestSenderName = async () => {
    if (!requestedSenderId.trim()) {
      toast({
        title: "Sender ID required",
        description: "Please enter a sender ID",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number (10-15 digits)",
        variant: "destructive"
      });
      return;
    }

    if (!sampleContent.trim()) {
      toast({
        title: "Sample content required",
        description: "Please provide an example SMS message",
        variant: "destructive"
      });
      return;
    }

    // Purpose and KYC documents are now optional

    if (senderNamePurpose.trim() && senderNamePurpose.length < 10) {
      toast({
        title: "Purpose too short",
        description: "Please provide at least 10 characters describing the purpose",
        variant: "destructive"
      });
      return;
    }

    // Show payment confirmation dialog
    setPaymentData({
      requested_sender_id: requestedSenderId,
      phone_number: phoneNumber,
      sample_content: sampleContent,
      purpose: senderNamePurpose,
      kyc_documents: kycDocuments.length > 0 ? kycDocuments : undefined
    });
    setShowPaymentDialog(true);
  };

  const confirmSenderPayment = async () => {
    if (!paymentData) return;

    setPaymentProcessing(true);

    try {
      // STEP 1: Create Sender Request
      const createResponse = await apiClient.createSenderRequest({
        requested_sender_id: paymentData.requested_sender_id,
        phone_number: paymentData.phone_number,
        sample_content: paymentData.sample_content
      });

      if (!isMountedRef.current) return;

      if (!createResponse.success || !createResponse.data) {
        toast({
          title: "Failed to create request",
          description: createResponse.error || "Failed to create sender name request",
          variant: "destructive"
        });
        setPaymentProcessing(false);
        return;
      }

      // Extract sender request ID from any nested response wrappers
      const senderRequestId = extractSenderRequestId(createResponse.data);

      if (!senderRequestId) {
        toast({
          title: "Cannot extract request ID",
          description: "Server response missing required ID field. Check console for details.",
          variant: "destructive"
        });
        setPaymentProcessing(false);
        return;
      }

      // STEP 2: Upload KYC Documents (if any)
      if (paymentData.kyc_documents && paymentData.kyc_documents.length > 0) {
        const uploadResponse = await apiClient.uploadKycDocuments(
          senderRequestId,
          paymentData.kyc_documents,
          "ID"
        );

        if (!isMountedRef.current) return;

        if (!uploadResponse.success) {
          toast({
            title: "Document upload failed",
            description: uploadResponse.error || "Failed to upload KYC documents",
            variant: "destructive"
          });
          setPaymentProcessing(false);
          return;
        }
      }

      // STEP 3: Initiate Payment
      const paymentResponse = await apiClient.initiatePaymentForSenderRequest(
        senderRequestId,
        paymentData.phone_number
      );

      if (!isMountedRef.current) return;

      if (paymentResponse.success && paymentResponse.data) {
        const paymentResponseData = flattenPaymentResponse(paymentResponse.data);

        // The response should have payment object and either payment_required flag or payment exists
        if (paymentResponseData && (paymentResponseData.payment_required || paymentResponseData.payment)) {
          const orderId = paymentResponseData.payment?.order_id;
          const amount = paymentResponseData.payment?.amount;

          // Store the order ID for status checking
          localStorage.setItem('sender_request_order_id', orderId);
          localStorage.setItem('sender_request_id', senderRequestId);

          if (paymentResponseData.payment?.payment_url) {
            // Redirect to payment page
            toast({
              title: "Redirecting to payment",
              description: "You will be redirected to complete the payment of TSH " + amount,
            });

            // Redirect to payment URL
            setTimeout(() => {
              window.location.href = paymentResponseData.payment!.payment_url || '';
            }, 1500);
          } else {
            // Payment URL is null - show pending dialog with order details
            setPaymentProcessing(false);
            setShowPaymentDialog(false);
            setPendingPaymentOrderId(orderId);
            setPendingPaymentAmount(amount);
            setShowPaymentPendingDialog(true);
          }
        } else {
          throw new Error('Payment data missing required properties');
        }
      } else {
        toast({
          title: "Payment initiation failed",
          description: paymentResponse.error || "Failed to initiate payment",
          variant: "destructive"
        });
        setPaymentProcessing(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setPaymentProcessing(false);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      }
    }
  };

  // Handle repay for unpaid sender request
  const handleRepay = async () => {
    if (!repayRequestId || !repayPhoneNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a phone number",
        variant: "destructive"
      });
      return;
    }

    setRepayProcessing(true);

    try {
      const repayResponse = await apiClient.repayForSenderRequest(
        repayRequestId,
        repayPhoneNumber
      );

      if (!isMountedRef.current) return;

      if (repayResponse.success && repayResponse.data) {
        const repayResponseData = flattenPaymentResponse(repayResponse.data);

        // The response should have payment object
        if (repayResponseData && (repayResponseData.payment_required || repayResponseData.payment)) {
          const orderId = repayResponseData.payment?.order_id;
          const amount = repayResponseData.payment?.amount;

          // Store the order ID for status checking
          localStorage.setItem('sender_request_order_id', orderId);
          localStorage.setItem('sender_request_id', repayRequestId);

          if (repayResponseData.payment?.payment_url) {
            // Redirect to payment page
            toast({
              title: "Redirecting to payment",
              description: "You will be redirected to complete the payment of TSH " + amount,
            });

            // Redirect to payment URL
            setTimeout(() => {
              window.location.href = repayResponseData.payment!.payment_url || '';
            }, 1500);
          } else {
            // Payment URL is null - show pending dialog with order details
            setRepayProcessing(false);
            setShowRepayDialog(false);
            setPendingPaymentOrderId(orderId);
            setPendingPaymentAmount(amount);
            setShowPaymentPendingDialog(true);
          }
        } else {
          throw new Error('Payment data missing required properties');
        }
      } else {
        toast({
          title: "Repayment initiation failed",
          description: repayResponse.error || "Failed to initiate repayment",
          variant: "destructive"
        });
        setRepayProcessing(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setRepayProcessing(false);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const handleOpenRepayDialog = (sender: SenderNameRequest | UnifiedSenderName) => {
    setRepayRequestId(sender.id);
    setRepayPhoneNumber("");
    setShowRepayDialog(true);
  };

  const handleDeleteRequest = async (sender: SenderNameRequest | UnifiedSenderName) => {
    try {
      // Always use the UUID from the id field for deletion
      const idToDelete = sender.id;

      const result = await deleteSenderName(idToDelete);

      if (isMountedRef.current) {
        if (result.success) {
          toast({
            title: "Request deleted",
            description: "Sender name request has been deleted",
          });
          // Refresh the page data to show updated list
          await refreshData();
        } else {
          toast({
            title: "Delete failed",
            description: result.error || "Failed to delete sender name request",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Delete failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const handleRequestDefaultSender = async () => {
    try {
      const result = await requestDefaultSender();

      if (isMountedRef.current && result.success) {
        // Refresh both sender names and default sender data
        await Promise.all([refreshData(), refreshDefaultSender()]);
      }
    } catch (error) {
      if (isMountedRef.current) {
        logger.warn('Error requesting default sender');
      }
    }
  };

  const handleTenantFilter = async (tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    if (!tenantId) {
      setTenantFilter(""); // Clear input when clearing filter
    }
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

  // Helper function to check if sender is approved/active
  const isSenderApproved = (sender: SenderNameRequest | UnifiedSenderName, targetNames: string[]): boolean => {
    const name = ((sender as unknown as Record<string, unknown>).sender_name as string) || ((sender as unknown as Record<string, unknown>).sender_id as string) || '';
    const status = ((sender as unknown as Record<string, unknown>).status as string) || '';
    const isApproved = status === 'approved' || status === 'active';
    const hasTargetName = targetNames.some(targetName =>
      name === targetName || name?.toLowerCase() === targetName.toLowerCase()
    );
    return isApproved && hasTargetName;
  };

  // Check if either Taarifa-SMS or Mifumosms is approved/active across entire dataset (pagination-independent)
  const taarifaApproved = safeSenderNames.some(sender =>
    isSenderApproved(sender, ['Taarifa-SMS'])
  );
  const mifumoApproved = safeSenderNames.some(sender =>
    isSenderApproved(sender, ['Mifumosms'])
  );

  // Global flag: any sender ID with status "approved"
  const hasAnyApprovedSender = safeSenderNames.some(sender => {
    const status = ((sender as unknown as Record<string, unknown>).status as string) || '';
    return status.toLowerCase() === 'approved';
  });

  // Hide the default sender/help section as soon as ANY sender ID is approved
  const shouldHideDefaultSenderCard = taarifaApproved || mifumoApproved || hasAnyApprovedSender;

  // Calculate paginated data
  const totalItems = safeSenderNames.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSenderNames = safeSenderNames.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalItems, pageSize, currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };


  // Show a fallback UI if we're stuck in loading state for too long
  if (loading && safeSenderNames.length === 0 && !error) {
    // Show the page structure with a loading indicator
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    {t('sender_names')}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    {t('manage_sender_ids')}
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
                    disabled={loading || isLoadingDefault}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isLoadingDefault) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Loading Card */}
              <Card className="p-6 glass">
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{t('loading_sender_names')}</span>
                  </div>
                </div>
              </Card>
            </div>
          </main>
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
              <span>{t('loading_sender_names')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    {t('sender_names')}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    {t('manage_sender_ids')}
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
                    disabled={loading || isLoadingDefault}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isLoadingDefault) ? 'animate-spin' : ''}`} />
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
                     <h3 className="font-semibold text-destructive mb-2">{t('error_loading_sender_names')}</h3>
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
                    {t('no_sender_names')}
                  </h3>
                  <p className="text-text-subtle">
                    {t('unable_load_sender_names')}
                  </p>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Stat numbers for the redesigned hero
  const statsTotal = stats?.total_requests || safeSenderNames.length || 0;
  const statsPending = stats?.pending_requests || safeSenderNames.filter(s => s.status === 'pending').length || 0;
  const statsApproved = stats?.approved_requests || safeSenderNames.filter(s => s.status === 'approved').length || 0;
  const statsRejected = stats?.rejected_requests || safeSenderNames.filter(s => s.status === 'rejected').length || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-primary/10 via-background to-primary/10 dark:from-primary/15 dark:via-background dark:to-primary/15">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-3xl mx-auto w-full max-w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-8 space-y-5">

            {/* Page header */}
            <header className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-heading text-[24px] sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
                  {t('sender_names')}
                </h1>
                <p className="text-[13px] sm:text-sm text-foreground/60 mt-1">
                  {t('manage_sender_ids')}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => { await Promise.all([refreshData(), refreshDefaultSender()]); }}
                disabled={loading || isLoadingDefault}
                aria-label="Refresh"
                className="flex-shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full text-foreground/65 active:bg-foreground/[0.06] disabled:opacity-50 transition-colors mr-11 md:mr-0"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${(loading || isLoadingDefault) ? 'animate-spin' : ''}`} strokeWidth={2.2} />
              </button>
            </header>

            {/* Primary CTA - Request button */}
            <Button
              onClick={() => setShowRequestDialog(true)}
              className="w-full h-12 rounded-2xl text-[14px] font-semibold shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={2.4} />
              Request new sender ID
            </Button>

            {/* Stats — 2x2 mini grid with brand colors */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <StatCard
                label="Total"
                value={statsTotal}
                icon={Hash}
                tone="primary"
                loading={loading}
              />
              <StatCard
                label="Pending"
                value={statsPending}
                icon={Clock}
                tone="amber"
                loading={loading}
              />
              <StatCard
                label="Approved"
                value={statsApproved}
                icon={Check}
                tone="emerald"
                loading={loading}
              />
              <StatCard
                label="Rejected"
                value={statsRejected}
                icon={X}
                tone="destructive"
                loading={loading}
              />
            </div>

            {/* Default Sender — hero card */}
            {overview && !shouldHideDefaultSenderCard && (
              <div className={[
                "relative overflow-hidden rounded-2xl border bg-card dark:bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
                canRequestDefaultSender?.() ? "border-primary/30 dark:border-primary/40" : "border-emerald-500/30 dark:border-emerald-500/40",
              ].join(" ")}>
                <div className={[
                  "absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl pointer-events-none",
                  canRequestDefaultSender?.() ? "bg-primary/10 dark:bg-primary/15" : "bg-emerald-500/10 dark:bg-emerald-500/15",
                ].join(" ")} />
                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className={[
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      canRequestDefaultSender?.() ? "bg-primary/10 dark:bg-primary/15" : "bg-emerald-500/10 dark:bg-emerald-500/15",
                    ].join(" ")}>
                      {canRequestDefaultSender?.() ? (
                        <Zap className="w-5 h-5 text-primary" strokeWidth={2.2} />
                      ) : (
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.4} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={[
                        "text-[10.5px] font-bold tracking-wider uppercase leading-none",
                        canRequestDefaultSender?.() ? "text-primary" : "text-emerald-600 dark:text-emerald-400",
                      ].join(" ")}>
                        Default Sender ID
                      </p>
                      <h3 className="text-[15px] font-bold text-foreground leading-tight mt-1.5 truncate">
                        {getDefaultSenderName?.() || 'Taarifa-SMS'}
                      </h3>
                      <p className="text-[12px] text-foreground/60 leading-snug mt-1">
                        Use this for instant SMS sending without waiting for approval.
                      </p>

                      {/* Credits + purchase hint */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
                        <div className="inline-flex items-center gap-1.5 text-foreground/65">
                          <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
                          <span>Credits:</span>
                          <span className="font-semibold text-foreground">{getCurrentCredits?.() || 0}</span>
                        </div>
                        {needsPurchaseCredits?.() && (
                          <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.2} />
                            Top up to send SMS
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="mt-4 pt-3 border-t border-border/40 dark:border-border/25">
                    {(canRequestDefaultSender && canRequestDefaultSender()) ? (
                      <Button
                        onClick={handleRequestDefaultSender}
                        disabled={isRequesting}
                        className="w-full h-11 rounded-xl text-[13px] font-semibold"
                      >
                        {isRequesting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Requesting…
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" strokeWidth={2.4} />
                            Request default sender
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            {overview.active_request?.status || 'Available'}
                          </span>
                          {getCannotRequestReason?.() && (
                            <p className="text-[11px] text-foreground/55 mt-1.5 leading-snug">
                              {getCannotRequestReason()}
                            </p>
                          )}
                        </div>
                        {(overview.active_request?.status === 'pending' || overview.active_request?.status === 'approved') && (
                          <Button
                            onClick={async () => { await cancelDefaultSender?.(); await refreshDefaultSender(); }}
                            variant="outline"
                            size="sm"
                            disabled={isRequesting}
                            className="h-9 px-3 rounded-lg text-[12px] font-semibold flex-shrink-0"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Requirements — show until first sender is approved */}
            {!hasAnyApprovedSender && (
              <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/[0.04] dark:bg-primary/10 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-primary" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-foreground leading-tight">
                      Sender Name Requirements
                    </h3>
                    <ul className="text-[12.5px] text-foreground/65 dark:text-foreground/60 mt-2 space-y-1 leading-relaxed">
                      <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Maximum 11 characters (letters, numbers, spaces, _, -)</li>
                      <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Must be relevant to your business or brand</li>
                      <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Approval typically takes 1-3 business days</li>
                      <li className="flex gap-2"><span className="text-primary mt-0.5">•</span> Provide valid use case and sample messages</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
                  {paginatedSenderNames.map((sender, index) => {
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
                                onClick={() => handleOpenRepayDialog(sender)}
                                disabled={sender.status !== "pending" && sender.status !== "awaiting_payment"}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {sender.status === "awaiting_payment" ? "Complete Payment" : sender.status === "pending" ? "Repay" : "Pay (Not Available)"}
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
                                onClick={() => handleDeleteRequest(sender)}
                                disabled={
                                  !["pending", "requires_changes", "awaiting_payment", "cancelled"].includes(sender.status)
                                }
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {
                                  ["pending", "requires_changes", "awaiting_payment", "cancelled"].includes(sender.status)
                                    ? "Delete Request"
                                    : "Delete (Not Available)"
                                }
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

              {/* Desktop Pagination - show only when more than 10 items for cleaner UI */}
              {totalItems > 10 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  isLoading={loading}
                  pageSizeOptions={[10, 20, 30, 50]}
                />
              )}
            </Card>

            {/* Mobile list — full-detail cards (table-style) */}
            <div className="lg:hidden">
              {safeSenderNames.length === 0 ? (
                <div className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                    <Hash className="w-7 h-7 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">
                    No sender names yet
                  </h3>
                  <p className="text-[12.5px] text-foreground/60 leading-snug mt-1 max-w-xs mx-auto">
                    Request your first sender ID to start sending branded SMS.
                  </p>
                </div>
              ) : (
                <>
                  <p className="px-2.5 mb-2 text-[11px] font-bold tracking-wider uppercase text-foreground/55">
                    Your sender IDs · {paginatedSenderNames.length}
                  </p>
                  <div className="space-y-3">
                    {paginatedSenderNames.map((sender, index) => {
                      const isUnified = 'tenant_name' in sender;
                      const unifiedSender = sender as unknown as UnifiedSenderName;
                      const legacySender = sender as SenderNameRequest;
                      const senderId = isUnified ? unifiedSender.sender_id : sender.sender_name;
                      const tenantOrUseCase = isUnified ? unifiedSender.tenant_name : (legacySender.use_case || "—");
                      const sampleContent = !isUnified
                        ? ((legacySender as unknown as Record<string, unknown>)?.sample_content as string | undefined)
                        : undefined;
                      const tone = statusTone(sender.status);
                      const isActive = isUnified && unifiedSender.source === "SMSSenderID";
                      return (
                        <div
                          key={isUnified ? `${unifiedSender.id}-${unifiedSender.sender_id}-${index}` : `${legacySender.id}-${index}`}
                          className={[
                            "relative overflow-hidden rounded-2xl",
                            "bg-card dark:bg-card",
                            "border shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
                            tone.border,
                            "transition-all active:scale-[0.995]",
                          ].join(" ")}
                        >
                          {/* Status accent strip + colored corner glow */}
                          <div className={`absolute inset-x-0 top-0 h-1 ${tone.strip}`} />
                          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${tone.glow}`} />

                          <div className="relative">
                            {/* Hero header */}
                            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone.iconBg}`}>
                                <Hash className={`w-[22px] h-[22px] ${tone.iconColor}`} strokeWidth={2.4} />
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Eyebrow: ACTIVE chip OR "Sender ID" label */}
                                <div className="flex items-center gap-1.5">
                                  {isActive ? (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                                      <Check className="w-2.5 h-2.5" strokeWidth={3.2} />
                                      ACTIVE
                                    </span>
                                  ) : (
                                    <span className={`text-[10px] font-bold tracking-wider uppercase ${tone.eyebrow}`}>
                                      Sender ID
                                    </span>
                                  )}
                                </div>
                                {/* Big mono name */}
                                <h3 className="font-mono font-bold text-[17px] text-foreground leading-tight tracking-tight truncate mt-1">
                                  {senderId}
                                </h3>
                                {/* Status badge */}
                                <div className="mt-2">
                                  {getStatusBadge(sender.status as SenderStatus)}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 rounded-full -mr-1 -mt-1">
                                    <MoreVertical className="w-[18px] h-[18px]" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass">
                                  <DropdownMenuItem onClick={() => handleViewDetails(sender)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenRepayDialog(sender)}
                                    disabled={sender.status !== "pending" && sender.status !== "awaiting_payment"}
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {sender.status === "awaiting_payment" ? "Complete Payment" : sender.status === "pending" ? "Repay" : "Pay (Not Available)"}
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
                                    onClick={() => handleDeleteRequest(sender)}
                                    disabled={
                                      !["pending", "requires_changes", "awaiting_payment", "cancelled"].includes(sender.status)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {["pending", "requires_changes", "awaiting_payment", "cancelled"].includes(sender.status) ? "Delete Request" : "Delete (Not Available)"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Detail rows inside a subtle inner card */}
                            <div className="mx-3 mb-3 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/40 dark:border-border/25 divide-y divide-border/40 dark:divide-border/25">
                              <DetailRow label={isUnified ? "Tenant" : "Use case"} value={tenantOrUseCase} />
                              <DetailRow label="Created" value={safeFormatDate(sender.created_at)} />
                              {sampleContent && (
                                <DetailRow label="Sample" value={sampleContent} clamp />
                              )}
                            </div>

                            {/* Footer action */}
                            <button
                              type="button"
                              onClick={() => handleViewDetails(sender)}
                              className={[
                                "w-full inline-flex items-center justify-center gap-1.5 px-4 py-3",
                                "text-[13px] font-bold transition-colors",
                                "border-t border-border/50 dark:border-border/30",
                                tone.cta,
                              ].join(" ")}
                            >
                              View details
                              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalItems > 10 && (
                    <div className="mt-4">
                      <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        isLoading={loading}
                        pageSizeOptions={[10, 20, 30, 50]}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Request Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={(open) => {
              if (!open) {
                // Reset form when closing
                setRequestedSenderId("");
                setPhoneNumber("");
                setSampleContent("");
                setSenderNamePurpose("");
                setRequestType("custom");
                setKycDocuments([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
              setShowRequestDialog(open);
            }}>
              <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-2xl border-border/60 bg-card">
                {/* Hero header — full design, smaller text */}
                <div className="relative overflow-hidden border-b border-border/60 dark:border-border/40 bg-gradient-to-br from-primary/8 via-card to-card dark:from-primary/15 dark:via-card dark:to-card px-4 pt-3.5 pb-3 flex-shrink-0">
                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/15 dark:bg-primary/20 blur-2xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Hash className="w-[18px] h-[18px]" strokeWidth={2.4} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <DialogTitle className="text-[14px] font-bold text-foreground leading-tight">
                          Request a Sender ID
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-foreground/65 leading-snug mt-0.5">
                          A branded sender ID lets you send SMS as your business name.
                        </DialogDescription>
                      </div>
                    </div>

                    {/* Fee chip */}
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30">
                      <CreditCard className="w-3 h-3 text-primary" strokeWidth={2.4} />
                      <span className="text-[10.5px] font-semibold text-primary">
                        {senderFeeLoading && senderFeeAmount == null
                          ? "Loading fee…"
                          : `${formatSenderFee() ?? "Fee"} · includes 300 SMS credits`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {/* Sender ID + Phone */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[10px] font-bold tracking-wider uppercase text-foreground/55 dark:text-foreground/50">
                        Sender ID
                      </Label>
                      <Input
                        placeholder="e.g. YourBrand"
                        value={requestedSenderId}
                        onChange={(e) => setRequestedSenderId(e.target.value)}
                        maxLength={11}
                        className="mt-1 h-9 rounded-lg font-mono border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[12.5px]"
                      />
                      <p className={`text-[10px] mt-0.5 leading-tight tabular-nums ${requestedSenderId.length >= 11 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-foreground/55"}`}>
                        {requestedSenderId.length}/11 characters
                      </p>
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold tracking-wider uppercase text-foreground/55 dark:text-foreground/50">
                        Phone Number
                      </Label>
                      <Input
                        placeholder="+255 762 781 427"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        type="tel"
                        inputMode="tel"
                        className="mt-1 h-9 rounded-lg border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[12.5px]"
                      />
                      <p className="text-[10px] mt-0.5 leading-tight text-foreground/55">
                        Used for payment
                      </p>
                    </div>
                  </div>

                  {/* Hidden type field - preserved for state */}
                  <div className="hidden">
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                    >
                      <option value="custom">Custom</option>
                      <option value="default">Default</option>
                    </select>
                  </div>

                  {/* Sample Content */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold tracking-wider uppercase text-foreground/55 dark:text-foreground/50">
                        Sample Message
                      </Label>
                      <span className={`text-[10px] tabular-nums leading-tight ${sampleContent.length >= 160 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-foreground/55"}`}>
                        {sampleContent.length}/160
                      </span>
                    </div>
                    <Textarea
                      placeholder="e.g. Ndugu Florence, Hongera. Offer yako ipo tayari. Wasiliana 255808080808"
                      value={sampleContent}
                      onChange={(e) => setSampleContent(e.target.value)}
                      className="mt-1 min-h-[64px] rounded-lg border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[12px] leading-relaxed"
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-[10px] mt-0.5 leading-tight text-foreground/55">
                      An example of the SMS you'll send with this sender ID.
                    </p>
                  </div>

                  {/* Hidden purpose field */}
                  <div className="hidden">
                    <Textarea
                      value={senderNamePurpose}
                      onChange={(e) => setSenderNamePurpose(e.target.value)}
                    />
                  </div>

                  {/* KYC Documents */}
                  <div>
                    <Label className="text-[10px] font-bold tracking-wider uppercase text-foreground/55 dark:text-foreground/50">
                      KYC Documents <span className="text-foreground/40 font-medium normal-case ml-1">(Optional)</span>
                    </Label>

                    {/* Required docs hint */}
                    <div className="mt-1 rounded-lg bg-primary/[0.04] dark:bg-primary/10 border border-primary/15 dark:border-primary/25 px-2.5 py-1.5">
                      <p className="text-[9.5px] font-bold tracking-wider uppercase text-primary mb-0.5">
                        Accepted documents
                      </p>
                      <ul className="text-[10.5px] text-foreground/70 dark:text-foreground/65 leading-snug space-y-0">
                        <li className="flex gap-1"><span className="text-primary">•</span> Business License or BRELA Registration</li>
                        <li className="flex gap-1"><span className="text-primary">•</span> TIN Certificate or Company Registration</li>
                      </ul>
                      <p className="text-[9.5px] text-foreground/50 mt-1">PDF · Max 8MB per file</p>
                    </div>

                    {/* Upload zone */}
                    <div className="mt-1.5 rounded-lg border-2 border-dashed border-border/60 dark:border-border/40 hover:border-primary/40 transition-colors p-2.5 bg-background/40 dark:bg-background/20">
                      {kycDocuments.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                              </div>
                              <p className="text-[11.5px] font-semibold text-foreground">
                                {kycDocuments.length} file{kycDocuments.length === 1 ? "" : "s"} attached
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveAllFiles}
                              className="text-[10.5px] font-semibold text-destructive active:opacity-60 transition-opacity"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-0.5 max-h-20 overflow-y-auto">
                            {kycDocuments.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center justify-between gap-2 px-2 py-0.5 rounded-md bg-card dark:bg-card/95 border border-border/40 dark:border-border/30"
                              >
                                <span className="text-[11px] font-medium text-foreground truncate flex-1">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(fIdx)}
                                  aria-label={`Remove ${file.name}`}
                                  className="w-5 h-5 inline-flex items-center justify-center rounded-full text-foreground/50 active:bg-destructive/15 active:text-destructive transition-colors flex-shrink-0"
                                >
                                  <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                            <Upload className="w-4 h-4 text-primary" strokeWidth={2.2} />
                          </div>
                          <p className="text-[11.5px] font-semibold text-foreground mb-1">
                            Upload documents
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            id="kyc-upload"
                            accept=".pdf"
                            multiple
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="kyc-upload">
                            <Button variant="outline" size="sm" asChild className="h-7 px-3 text-[11px] font-semibold rounded-md">
                              <span>Choose PDF files</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-card border-t border-border/60 dark:border-border/40 px-3.5 py-2.5 flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestDialog(false)}
                    disabled={submitting}
                    className="flex-1 h-10 rounded-lg text-[12.5px] font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestSenderName}
                    disabled={submitting || !requestedSenderId.trim() || !phoneNumber.trim() || !sampleContent.trim()}
                    className="flex-1 h-10 rounded-lg text-[12.5px] font-semibold shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.4} />
                        Pay & Submit
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Confirmation Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={(open) => {
              if (!open) {
                setPaymentProcessing(false);
                setPaymentData(null);
              }
              setShowPaymentDialog(open);
            }}>
              <DialogContent className="glass max-w-[90vw] md:max-w-md lg:max-w-lg max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-5 rounded-lg">
                <DialogHeader className="pb-2 sm:pb-2.5">
                  <DialogTitle className="text-sm sm:text-base md:text-lg">Payment Required</DialogTitle>
                  <DialogDescription className="text-xs sm:text-xs md:text-sm">
                    Complete the 3-step process to submit your sender ID request
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                  {/* Payment Details Card */}
                  <Card className="p-3 sm:p-4 bg-primary/5 border-primary/20">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground">Request Summary</h4>
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Sender ID:</span>
                          <span className="font-mono font-semibold">{paymentData?.requested_sender_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-subtle">Phone Number:</span>
                          <span className="font-mono">{paymentData?.phone_number}</span>
                        </div>
                        {paymentData?.kyc_documents && paymentData.kyc_documents.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-text-subtle">KYC Documents:</span>
                            <span className="font-semibold text-green-600">{paymentData.kyc_documents.length} file(s)</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-primary/10">
                          <div className="flex justify-between items-center">
                            <span className="text-text-subtle font-medium">Total Amount:</span>
                            <span className="text-lg sm:text-xl font-bold text-primary">
                              {senderFeeLoading && senderFeeAmount == null ? "Loading..." : (formatSenderFee() ?? "—")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground">Payment Methods</h4>
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-green-700 font-medium">
                        ✓ Mobile Money (M-Pesa, Tigo Pesa, Airtel Money)
                      </p>
                      <p className="text-[10px] sm:text-xs text-green-600 mt-1">
                        You will be redirected to a secure payment gateway to complete the transaction.
                      </p>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-amber-700">
                      <span className="font-medium">Note:</span> After payment, your request will be reviewed by our admin team within 2-3 business days.
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    disabled={paymentProcessing}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmSenderPayment}
                    disabled={paymentProcessing}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-1 sm:order-2 bg-primary hover:bg-primary/90"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing Steps...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3 mr-1" />
                        Pay {formatSenderFee() ?? "Now"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Payment Status Dialog (After redirect from payment gateway) */}
            <Dialog open={showPaymentStatusDialog} onOpenChange={(open) => {
              if (!open && paymentStatus !== 'checking') {
                setShowPaymentStatusDialog(false);
                setPaymentStatus('checking');
                setPaymentStatusMessage("");
                setPollAttempts(0);
              }
            }}>
              <DialogContent className="glass max-w-md max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg sm:text-xl">
                    {paymentStatus === 'checking' && 'Processing Payment'}
                    {paymentStatus === 'success' && 'Payment Successful'}
                    {paymentStatus === 'failed' && 'Payment Failed'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Status Visual */}
                  <div className="flex justify-center py-4">
                    {paymentStatus === 'checking' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-text-subtle">Please wait...</p>
                      </div>
                    )}
                    {paymentStatus === 'success' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-in scale-in">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                    )}
                    {paymentStatus === 'failed' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-in scale-in">
                          <X className="w-8 h-8 text-red-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Message */}
                  <Card className={`p-3 sm:p-4 ${
                    paymentStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
                    paymentStatus === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm text-center ${
                      paymentStatus === 'checking' ? 'text-blue-700' :
                      paymentStatus === 'success' ? 'text-green-700' :
                      'text-red-700'
                    }`}>
                      {paymentStatusMessage}
                    </p>
                  </Card>

                  {/* Polling Progress */}
                  {paymentStatus === 'checking' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-text-subtle">
                        <span>Checking payment...</span>
                        <span>{pollAttempts}/{maxPollAttempts}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(pollAttempts / maxPollAttempts) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {paymentStatus === 'success' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-xs sm:text-sm text-blue-700">
                        <span className="font-medium">Next Steps:</span> Your request is now pending admin review. You'll receive a notification when it's approved or if we need more information.
                      </p>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-xs sm:text-sm text-amber-700">
                        Your payment was not completed. You can submit the request again.
                      </p>
                    </div>
                  )}
                </div>

                {paymentStatus !== 'checking' && (
                  <DialogFooter className="pt-4">
                    <Button
                      onClick={() => {
                        setShowPaymentStatusDialog(false);
                        setPaymentStatus('checking');
                        setPaymentStatusMessage("");
                        setPollAttempts(0);
                      }}
                      className="w-full"
                    >
                      {paymentStatus === 'success' ? 'Close' : 'Try Again'}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showPaymentPendingDialog} onOpenChange={setShowPaymentPendingDialog}>
              <DialogContent className="glass max-w-sm w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-5 rounded-lg">
                <DialogHeader className="pb-2 sm:pb-3 space-y-1">
                  <DialogTitle className="text-base sm:text-lg text-amber-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    {t('sender_names.payment.title')}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-amber-700">
                    ⏱ {t('sender_names.payment.waiting')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                  {/* Status Visual - Compact */}
                  <div className="flex justify-center py-2 sm:py-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center animate-pulse shadow-sm">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                    </div>
                  </div>

                  {/* Status Message Card */}
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-25 border border-amber-200 p-3 sm:p-4 space-y-3">
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      {t('sender_names.payment.instruction')}
                    </p>

                    {/* Order Details - Compact */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-md p-2.5 sm:p-3 space-y-2 border border-amber-100">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] sm:text-xs font-semibold text-amber-800 flex-shrink-0">{t('sender_names.payment.order_id')}:</span>
                          <span className="font-mono text-[10px] sm:text-xs text-amber-900 break-all text-right line-clamp-2">
                            {pendingPaymentOrderId}
                          </span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-amber-100 to-transparent" />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] sm:text-xs font-semibold text-amber-800 flex-shrink-0">{t('sender_names.payment.amount')}:</span>
                          <span className="text-base sm:text-lg font-bold text-amber-600">TSH {pendingPaymentAmount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-100/50 border border-amber-200/50 rounded-md p-2 text-[10px] sm:text-xs text-amber-800 leading-relaxed">
                      <p>
                        <span className="font-semibold">↳ {t('sender_names.payment.after_approval')} </span> , {t('sender_names.payment.finalize_click')}
                      </p>
                    </div>
                  </Card>

                  {/* Actions - Stack on mobile */}
                  <div className="flex flex-col-reverse sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(pendingPaymentOrderId);
                        toast({
                          title: t('common.copied'),
                          description: t('common.order_id_copied'),
                        });
                      }}
                      className="h-8 sm:h-9 text-xs sm:text-sm w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                      📋 {t('sender_names.payment.copy_order_id')}
                    </Button>
                    <Button
                      onClick={() => {
                        // Show success message
                        toast({
                          title: "We are confirming your payment.",
                          description: "If the transaction was successful, your request will be updated automatically.",
                        });

                        // Hard refresh the entire system after a brief delay
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }}
                      className="h-8 sm:h-9 text-xs sm:text-sm w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      ✓ {t('sender_names.payment.complete')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Repay Dialog */}
            <Dialog open={showRepayDialog} onOpenChange={setShowRepayDialog}>
              <DialogContent className="glass max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-6 rounded-lg">
                <DialogHeader className="pb-3 sm:pb-4 space-y-1">
                  <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    Retry Payment
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Complete the payment for your sender request
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+255 712 345 678"
                      value={repayPhoneNumber}
                      onChange={(e) => setRepayPhoneNumber(e.target.value)}
                      disabled={repayProcessing}
                      className="glass-subtle border-0 text-xs sm:text-sm h-9"
                    />
                    <p className="text-xs text-text-subtle">
                      The phone number associated with your account
                    </p>
                  </div>

                  {/* Info Card */}
                  <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
                    <div className="space-y-2 text-xs sm:text-sm text-blue-900">
                      <p className="font-semibold">⚠️ Important:</p>
                      <ul className="space-y-1 ml-2 list-disc">
                        <li>Complete the payment to activate your sender request</li>
                        <li>You'll receive payment confirmation via SMS</li>
                        <li>Payment status updates automatically</li>
                      </ul>
                    </div>
                  </Card>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRepayDialog(false)}
                    disabled={repayProcessing}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRepay}
                    disabled={repayProcessing || !repayPhoneNumber.trim()}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-1 sm:order-2 bg-primary hover:bg-primary/90"
                  >
                    {repayProcessing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3 mr-1" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
              open={showEditDialog}
              onOpenChange={(open) => {
                if (!open) {
                  // Reset form when closing
                  setEditingSender(null);
                  setEditSenderName("");
                  setEditUseCase("");
                  setEditSampleContent("");
                  setEditSelectedFiles([]);
                }
                setShowEditDialog(open);
              }}
            >
              <DialogContent className="glass max-w-[90vw] md:max-w-md lg:max-w-lg max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-5 rounded-lg">
                <DialogHeader className="pb-2 sm:pb-2.5">
                  <DialogTitle className="text-sm sm:text-base md:text-lg">Edit Sender Name Request</DialogTitle>
                  <DialogDescription className="text-xs sm:text-xs md:text-sm">
                    Update your sender name request details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 sm:space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-medium">Sender Name *</Label>
                    <Input
                      placeholder="e.g., YourBrand"
                      value={editSenderName}
                      onChange={(e) => setEditSenderName(e.target.value)}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono text-xs sm:text-sm h-9 sm:h-8"
                    />
                    <p className="text-xs text-text-subtle">
                      {editSenderName.length}/11 characters
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-medium">Sample Content *</Label>
                    <Textarea
                      placeholder="e.g., Ndugu Florence,Hongera. Offer yako ya huduma zetu kwasasa ipo tayari.Tafadhari tembelea ofisi zetu uweze au wasiliana na mtoa huduma namba 255808080808"
                      value={editSampleContent}
                      onChange={(e) => setEditSampleContent(e.target.value)}
                      className="glass-subtle border-0 text-[10px] min-h-20 sm:min-h-16"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-[10px] text-text-subtle">
                      {editSampleContent.length}/160 characters
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">KYC Documents (Optional)</Label>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-1.5 sm:p-2 mb-2">
                      <p className="text-[10px] text-blue-700 font-medium mb-0.5">Required:</p>
                      <ul className="text-[10px] text-blue-600 space-y-0 ml-3">
                        <li>• Business License • BRELA Registration</li>
                        <li>• TIN Certificate • Company Registration</li>
                      </ul>
                    </div>
                    <p className="text-[10px] text-text-subtle mb-2">PDF - Max 8MB</p>
                    <div className="border border-dashed border-border rounded-lg p-2 sm:p-2 text-center">
                      {editSelectedFiles.length > 0 ? (
                        <div className="space-y-1.5">
                          <Check className="w-4 h-4 mx-auto text-green-500" />
                          <p className="text-[10px] font-medium text-green-600">
                            {editSelectedFiles.length} file(s) uploaded
                          </p>
                          <div className="space-y-0.5 max-h-20 sm:max-h-24 overflow-y-auto text-left">
                            {editSelectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-xs px-1 py-0.5">
                                <span className="truncate flex-1 mr-1">{file.name}</span>
                                <button
                                  onClick={() => setEditSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                  className="text-red-600 hover:text-red-700 flex-shrink-0 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditSelectedFiles([])}
                            className="text-red-600 hover:text-red-700 text-[10px] w-full h-8 sm:h-7"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear Files
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1 py-2 sm:py-1.5">
                          <Upload className="w-4 h-4 mx-auto text-text-subtle" />
                          <p className="text-[10px] font-medium text-text-subtle">Upload KYC Documents</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            id="edit-kyc-upload"
                            accept=".pdf"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setEditSelectedFiles(prev => [...prev, ...files]);
                            }}
                          />
                          <label htmlFor="edit-kyc-upload">
                            <Button variant="outline" size="sm" asChild className="text-[10px] h-8 sm:h-7">
                              <span>Choose Files</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-2.5">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    disabled={submitting}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto h-9 sm:h-8 text-xs sm:text-sm order-1 sm:order-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
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
                          {('sender_name' in selectedSender ? selectedSender.sender_name : selectedSender.sender_id).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">
                        {'sender_name' in selectedSender ? selectedSender.sender_name : selectedSender.sender_id}
                      </h3>
                      <div className="flex items-center justify-center">
                        {getStatusBadge(selectedSender.status as SenderStatus)}
                      </div>
                    </div>

                    {/* Auto-Cancel Warning for Awaiting Payment */}
                    {selectedSender.status === "awaiting_payment" && (
                      <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-25 border border-orange-200">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-orange-900 text-sm sm:text-base mb-1">
                                Payment Required
                              </h4>
                              <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                                This sender request is awaiting payment. Complete payment within <span className="font-bold">3 days</span> from creation date, otherwise it will be automatically cancelled.
                              </p>
                              <p className="text-xs sm:text-sm text-orange-700 mt-2">
                                <span className="font-semibold">Created:</span> {safeFormatDate(selectedSender.created_at)}
                              </p>
                              <p className="text-xs sm:text-sm text-orange-700">
                                <span className="font-semibold">Auto-cancel after:</span> {safeFormatDate(new Date(new Date(selectedSender.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toString())}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setShowDetailsDialog(false);
                              handleOpenRepayDialog(selectedSender);
                            }}
                            className="w-full sm:w-auto h-8 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <CreditCard className="w-3 h-3 mr-2" />
                            Complete Payment Now
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Changes Required Alert */}
                    {selectedSender.status === "requires_changes" && selectedSender.change_details && (
                      <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-25 border border-amber-200">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-amber-900 text-sm sm:text-base mb-2">
                                Changes Required
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-amber-800 mb-1">Reason for Changes:</p>
                                  <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                                    {selectedSender.change_details.reason || selectedSender.rejection_reason || "Your request needs improvements"}
                                  </p>
                                </div>
                                {selectedSender.change_details.fields_to_update && selectedSender.change_details.fields_to_update.length > 0 && (
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium text-amber-800 mb-1.5">Fields to Update:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedSender.change_details.fields_to_update.map((field) => (
                                        <Badge key={field} variant="outline" className="bg-amber-100 border-amber-300 text-amber-800 text-xs font-medium">
                                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setShowDetailsDialog(false);
                              if (selectedSender) {
                                const sender = selectedSender as unknown as SenderNameRequest & UnifiedSenderName;
                                setEditingSender(selectedSender as SenderNameRequest);
                                setEditSenderName('sender_name' in selectedSender ? selectedSender.sender_name : '');
                                setEditSampleContent(senderIdDetails?.sample_content || '');
                                setShowEditDialog(true);
                              }
                            }}
                            className="w-full sm:w-auto h-8 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Update Request
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="font-medium text-sm sm:text-base text-foreground">Basic Information</h4>
                      {loadingSenderIdDetails ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <p className="text-xs sm:text-sm text-muted-foreground ml-2">Loading details...</p>
                        </div>
                      ) : senderIdDetails ? (
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-text-subtle">Sender ID</Label>
                          <div className="p-2 sm:p-3 bg-muted/30 rounded-lg font-mono text-xs sm:text-sm break-all">
                            {senderIdDetails.sender_id}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 bg-muted/20 rounded-lg text-xs sm:text-sm text-muted-foreground">
                          Unable to load sender ID details
                        </div>
                      )}
                    </div>

                    {/* Sample Content */}
                    {senderIdDetails?.sample_content && (
                      <div className="space-y-1">
                        <Label className="text-xs sm:text-sm font-medium text-text-subtle">Sample Content</Label>
                        <div className="p-2 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {senderIdDetails.sample_content}
                        </div>
                      </div>
                    )}

                    {/* Supporting Documents */}
                    {selectedSender && 'supporting_documents_count' in selectedSender && selectedSender.supporting_documents_count > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs sm:text-sm font-medium text-text-subtle">Supporting Documents</Label>
                        <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm text-text-subtle">
                              {selectedSender.supporting_documents_count} file(s) uploaded
                            </p>
                            <div className="space-y-1">
                              {selectedSender.supporting_documents && selectedSender.supporting_documents.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <Upload className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{doc.split('/').pop()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Information */}
                    {selectedSender && 'reviewed_by' in selectedSender && (selectedSender.reviewed_by || selectedSender.admin_notes) && (
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
                        <Label className="text-[9px]">Created</Label>
                          <p className="text-[9px] sm:text-xs">{senderIdDetails ? safeFormatDate(senderIdDetails.created_at) : safeFormatDate(selectedSender?.created_at || '')}</p>
                      </div>
                      <div>
                        <Label className="text-[9px]">Last Updated</Label>
                          <p className="text-[9px] sm:text-xs">{senderIdDetails ? safeFormatDate(senderIdDetails.updated_at) : safeFormatDate(selectedSender?.updated_at || '')}</p>
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
        </main>
      </div>
    </div>
  );
};

interface SenderCardTone {
  border: string;
  strip: string;
  glow: string;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  cta: string;
}

/** Per-status color theme applied to the mobile sender card. */
function statusTone(status: string): SenderCardTone {
  switch (status) {
    case "approved":
    case "active":
      return {
        border: "border-emerald-500/30 dark:border-emerald-500/40",
        strip: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
        glow: "bg-emerald-500/30",
        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        eyebrow: "text-emerald-600 dark:text-emerald-400",
        cta: "text-emerald-700 dark:text-emerald-400 active:bg-emerald-500/10 dark:active:bg-emerald-500/15",
      };
    case "rejected":
    case "suspended":
      return {
        border: "border-destructive/30 dark:border-destructive/40",
        strip: "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600",
        glow: "bg-destructive/30",
        iconBg: "bg-destructive/10 dark:bg-destructive/15",
        iconColor: "text-destructive",
        eyebrow: "text-destructive",
        cta: "text-destructive active:bg-destructive/10 dark:active:bg-destructive/15",
      };
    case "pending":
    case "requires_changes":
    case "awaiting_payment":
      return {
        border: "border-amber-500/30 dark:border-amber-500/40",
        strip: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
        glow: "bg-amber-500/30",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
        iconColor: "text-amber-600 dark:text-amber-400",
        eyebrow: "text-amber-600 dark:text-amber-400",
        cta: "text-amber-700 dark:text-amber-400 active:bg-amber-500/10 dark:active:bg-amber-500/15",
      };
    default:
      return {
        border: "border-border dark:border-border/60",
        strip: "bg-gradient-to-r from-primary/60 via-primary to-primary/60",
        glow: "bg-primary/25",
        iconBg: "bg-primary/10 dark:bg-primary/15",
        iconColor: "text-primary",
        eyebrow: "text-primary",
        cta: "text-primary active:bg-primary/10 dark:active:bg-primary/15",
      };
  }
}

/** Label/value row used inside the mobile sender card. */
function DetailRow({ label, value, clamp = false }: { label: string; value: string; clamp?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="text-[11.5px] font-semibold tracking-wide uppercase text-foreground/50 dark:text-foreground/45 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`text-[13px] font-medium text-foreground/85 text-right ${clamp ? "line-clamp-2" : "truncate"} min-w-0`}>
        {value}
      </span>
    </div>
  );
}

/** Small stat tile used in the Sender Names hero grid. */
function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof Hash;
  tone: "primary" | "amber" | "emerald" | "destructive";
  loading?: boolean;
}) {
  const toneClass = {
    primary: { iconBg: "bg-primary/10 dark:bg-primary/15", iconColor: "text-primary" },
    amber: { iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
    emerald: { iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
    destructive: { iconBg: "bg-destructive/10 dark:bg-destructive/15", iconColor: "text-destructive" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toneClass.iconBg}`}>
          <Icon className={`w-[16px] h-[16px] ${toneClass.iconColor}`} strokeWidth={2.2} />
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-foreground/55 dark:text-foreground/50 line-clamp-1">
          {label}
        </span>
      </div>
      <p className="mt-2 text-[22px] sm:text-2xl font-bold text-foreground tabular-nums tracking-tight leading-none">
        {loading ? (
          <span className="inline-block w-5 h-5 align-middle border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
        ) : (
          value.toLocaleString()
        )}
      </p>
    </div>
  );
}

export default SenderNames;

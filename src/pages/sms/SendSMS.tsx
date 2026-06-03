import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  Users,
  Upload,
  Calendar,
  Zap,
  DollarSign,
  FileText,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient, Contact, SenderNameRequest, UnifiedSenderName } from "@/lib/api";
import { useSubTabSwipe } from "@/hooks/useSubTabSwipe";
import { logger } from "@/utils/logger";
import { useSenderNames } from "@/hooks/useSenderNames";
import { useContactSegments } from "@/hooks/useContactSegments";
import { useContacts } from "@/hooks/useContacts";
import { usePurchaseHistory, PurchaseRecord } from "@/hooks/usePurchaseHistory";
import { calculateSMSegments, validateMessageLength, getSegmentInfo, calculateSMSCost, getCharacterCountDisplay } from "@/utils/smsUtils";
import { parseExcelFile } from "@/utils/excelParser";

// Note: We no longer hardcode sender IDs. We fetch the current user's
// sender name requests via useSenderNames() and use only approved ones.

interface Segment {
  id: string;
  name: string;
  contact_count: number;
}

const SendSMS = () => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<"single" | "bulk" | "segment" | null>(null);
  // Container for the form body. Touch swipes here cycle Quick ↔ Bulk ↔ Group,
  // and spill into the adjacent sidebar page (Dashboard ↔ WhatsApp) at the edges.
  const formBodyRef = useRef<HTMLDivElement>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSender, setSelectedSender] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedTagGroup, setSelectedTagGroup] = useState("");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [segmentContacts, setSegmentContacts] = useState<Contact[]>([]);
  const [isLoadingSegmentContacts, setIsLoadingSegmentContacts] = useState(false);
  // Cached full contact list for group/tag operations (all pages)
  const [allGroupContacts, setAllGroupContacts] = useState<Contact[]>([]);
  const [isLoadingAllGroupContacts, setIsLoadingAllGroupContacts] = useState(false);
  const [allGroupContactsLoaded, setAllGroupContactsLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());
  const [costCalculation, setCostCalculation] = useState<{
    cost_per_sms: number;
    segments: number;
    total_cost: number;
    credits_needed: number;
  } | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);

  // Normalize phone numbers for API: 12 digits, starts with 255 (no plus)
  const normalizeToApi = (input: string): string | null => {
    const digitsOnly = input.replace(/\D/g, "");

    // Tanzania country code is 255, standard format should be 12 digits total
    // Return in E.164 format with + prefix for external gateway
    if (digitsOnly.startsWith("255") && digitsOnly.length === 12) {
      return `+${digitsOnly}`;
    }

    // Convert local TZ format 0XXXXXXXXX (10 digits) to +255XXXXXXXXX
    if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
      return `+255${digitsOnly.slice(1)}`;
    }

    // Handle numbers without 0 but clearly local (9 digits) e.g. 7444..., 6xxxx..., 7xxxx...
    if (!digitsOnly.startsWith("0") && digitsOnly.length === 9) {
      return `+255${digitsOnly}`;
    }

    // Handle E.164 format that already has + prefix
    if (input.startsWith("+") && digitsOnly.startsWith("255") && digitsOnly.length === 12) {
      return `+${digitsOnly}`;
    }

    return null;
  };

  // Load sender names for current user from API (no hardcoding)
  const { senderNames, loading: senderNamesLoading, error: senderNamesError } = useSenderNames();

  // Load real-time contact segment counts
  const { segmentCounts, isLoading: segmentCountsLoading, refreshSegmentCounts } = useContactSegments();
  const { contacts, fetchContacts } = useContacts();

  // Load purchase history to get unit pricing for cost calculation
  const { purchases, isLoading: billingLoading, error: billingError, fetchPurchaseHistory } = usePurchaseHistory();

  // Reduce to approved sender names only
  // Note: senderNames can be either SenderNameRequest or UnifiedSenderName type
  const approvedSenderRequests = useMemo(() => {
    if (!senderNames || senderNames.length === 0) {
      logger.debug('No sender names available', { senderNames });
      return [];
    }

    logger.debug('Filtering sender names', {
      totalCount: senderNames.length,
      senders: senderNames.map((s: SenderNameRequest | UnifiedSenderName) => ({
        id: s.id,
        name: ('sender_id' in s ? s.sender_id : s.sender_name) || 'Unknown',
        status: s.status,
        source: ('source' in s ? s.source : 'unknown')
      }))
    });

    const mapped = (senderNames || [])
      .filter((req: SenderNameRequest | UnifiedSenderName) => {
        const status = (req.status || '').toLowerCase();
        const senderName = ('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null);

        // Include only approved status - these are fully verified and ready to use
        // Exclude: active, cancelled, pending, rejected, requires_changes, verifying
        const isApproved = status === "approved";
        const hasValidName = senderName && senderName.trim() !== "";

        logger.debug('Evaluating sender', {
          name: senderName,
          status,
          isApproved,
          hasValidName,
          included: isApproved && hasValidName
        });

        return isApproved && hasValidName;
      })
      .map((req: SenderNameRequest | UnifiedSenderName) => {
        const name = (('sender_id' in req ? req.sender_id : null) || ('sender_name' in req ? req.sender_name : null) || '').trim();
        return {
          id: req.id, // Database UUID
          sender_id: name, // Alphanumeric branding name
          status: (req.status || '').toLowerCase(),
          source: 'source' in req ? req.source : 'unknown'
        };
      });

    // Deduplicate by sender_id to remove duplicates - keep first occurrence
    const seen = new Map<string, typeof mapped[0]>();
    mapped.forEach((req) => {
      if (!seen.has(req.sender_id)) {
        seen.set(req.sender_id, req);
      }
    });

    const finalResult = Array.from(seen.values());
    logger.debug('Final approved sender names', {
      count: finalResult.length,
      senders: finalResult.map(r => ({
        id: r.id,
        name: r.sender_id,
        status: r.status,
        source: r.source
      })),
      totalProcessed: senderNames?.length,
      filtered: senderNames?.length ? (senderNames.length - finalResult.length) : 0
    });
    return finalResult;
  }, [senderNames]);

  // Build tag list (group names) with counts from the full cached contact list
  const groupTags = useMemo(() => {
    const tagMap = new Map<string, { label: string; count: number }>();

    allGroupContacts.forEach((contact) => {
      (contact.tags || []).forEach((tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return;
        const lower = trimmed.toLowerCase();
        const existing = tagMap.get(lower);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(lower, { label: trimmed, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [allGroupContacts]);

  // Convenience list of tag labels only (for quick checks)
  const uniqueTagNames = useMemo(
    () => groupTags.map((t) => t.label),
    [groupTags]
  );

  // Load ALL contacts across all pages once for group/tag operations
  const loadAllGroupContacts = useCallback(
    async (abortSignal?: AbortSignal): Promise<Contact[]> => {
      if (!isMountedRef.current) return [];

      // If already loaded, reuse
      if (allGroupContactsLoaded && allGroupContacts.length > 0) {
        return allGroupContacts;
      }

      if (isLoadingAllGroupContacts) {
        // If already loading in another call, just return what we have
        return allGroupContacts;
      }

      setIsLoadingAllGroupContacts(true);

      const PAGE_SIZE = 100;
      let all: Contact[] = [];

      try {
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          if (abortSignal?.aborted || !isMountedRef.current) {
            return all;
          }

          const response = await apiClient.getContacts({
            page,
            page_size: PAGE_SIZE,
          });

          if (!response.success || !response.data) {
            logger.error("Error fetching contacts for groups", {
              page,
              status: response.status,
              error: response.error,
            });
            toast({
              title: "Error loading contacts",
              description:
                response.error || "Failed to load contacts for groups",
              variant: "destructive",
            });
            break;
          }

          const { results, next } = response.data;
          all = all.concat(results || []);
          hasNext = Boolean(next);
          page += 1;
        }

        if (!abortSignal?.aborted && isMountedRef.current) {
          setAllGroupContacts(all);
          setAllGroupContactsLoaded(true);
        }

        return all;
      } catch (error) {
        if (!abortSignal?.aborted && isMountedRef.current) {
          logger.error("Error loading all group contacts");
          toast({
            title: "Error loading contacts",
            description: "Failed to load contacts for groups",
            variant: "destructive",
          });
        }
        return all;
      } finally {
        if (!abortSignal?.aborted && isMountedRef.current) {
          setIsLoadingAllGroupContacts(false);
        }
      }
    },
    [allGroupContacts, allGroupContactsLoaded, isLoadingAllGroupContacts, toast]
  );

  // Function to fetch contacts by group or tag using the cached full list
  const fetchContactsByGroup = useCallback(async (groupId: string, abortSignal?: AbortSignal) => {
    if (!isMountedRef.current) return;
    setIsLoadingSegmentContacts(true);

    try {
      // Ensure we have the full contact list cached
      const baseContacts = await loadAllGroupContacts(abortSignal);
      let loadedContacts: Contact[] = [];

      if (groupId === "all") {
        // Use ALL contacts across all pages
        loadedContacts = baseContacts;
      } else if (groupId === "choose-group") {
        if (selectedTagGroup) {
          // Filter locally: contacts that contain the selected tag (case-insensitive)
          const tagLower = selectedTagGroup.trim().toLowerCase();
          loadedContacts = baseContacts.filter((contact) =>
            (contact.tags || []).some(
              (t) => t.trim().toLowerCase() === tagLower
            )
          );
        } else {
          // When user first chooses "Choose Group Name", show ALL contacts
          loadedContacts = baseContacts;
        }
      } else {
        // Fallback: use whatever is already loaded by the contacts hook
        loadedContacts = contacts;
      }

      if (isMountedRef.current && !abortSignal?.aborted) {
        setSegmentContacts(loadedContacts);
        logger.debug(`Group ${groupId} contacts loaded: ${loadedContacts.length}`, {
          groupId,
          selectedTagGroup,
          contactCount: loadedContacts.length,
        });
      }
    } catch (error) {
      if (isMountedRef.current && !abortSignal?.aborted) {
        logger.error('Error loading group contacts');
        setSegmentContacts([]);
        toast({
          title: "Error loading contacts",
          description: "Failed to load contacts for the selected group",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current && !abortSignal?.aborted) {
        setIsLoadingSegmentContacts(false);
      }
    }
  }, [contacts, toast, selectedTagGroup]);

  // Get cost per SMS from purchase history - fetch from completed purchases
  const costPerSMS = useMemo(() => {
    // If still loading or there's an error, use default price
    if (billingLoading || billingError) {
      return 18;
    }

    if (purchases && purchases.length > 0) {
      // Filter for only completed purchases
      const completedPurchases = purchases.filter((purchase: PurchaseRecord) => purchase.status === 'completed');

      if (completedPurchases.length > 0) {
        // Get the most recent completed purchase by creation date
        const mostRecentPurchase = completedPurchases.sort((a: PurchaseRecord, b: PurchaseRecord) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Extract unit price from the most recent purchase
        if (mostRecentPurchase && mostRecentPurchase.unit_price && !isNaN(mostRecentPurchase.unit_price)) {
          return Number(mostRecentPurchase.unit_price);
        }
      }
    }
    // Fallback to 18 TZS if no completed purchase history available or API fails
    return 18;
  }, [purchases, billingLoading, billingError]);

  // Calculate cost using API Cost Calculator endpoint
  const getRecipientCount = () => {
    // Default to "single" when the mode hasn't been explicitly chosen yet —
    // matches the UI which renders Quick by default.
    const m = selectedMode ?? "single";
    if (m === "single") return recipients.length;
    if (m === "bulk") return recipients.length;
    if (m === "segment" && selectedSegment) {
      // Use actual loaded contacts count instead of segment count
      return segmentContacts.length;
    }
    return 0;
  };

  // Call cost calculator API when message or recipients change
  useEffect(() => {
    if (!message.trim() || getRecipientCount() === 0) {
      setCostCalculation(null);
      return;
    }

    const calculateCost = async () => {
      setIsCalculatingCost(true);
      try {
        const response = await apiClient.calculateSMSCost(message, getRecipientCount());
        if (response.success && response.data && isMountedRef.current) {
          setCostCalculation(response.data);
          logger.debug('SMS cost calculated', {
            segments: response.data.segments,
            total_cost: response.data.total_cost,
            credits_needed: response.data.credits_needed
          });
        }
      } catch (error) {
        logger.error('Error calculating SMS cost', { error });
        // Fall back to local calculation if API fails
        const localSegmentInfo = getSegmentInfo(message);
        const localCost = calculateSMSCost(localSegmentInfo.segments, getRecipientCount(), costPerSMS);
        setCostCalculation({
          cost_per_sms: costPerSMS,
          segments: localSegmentInfo.segments,
          total_cost: localCost,
          credits_needed: localSegmentInfo.segments
        });
      } finally {
        if (isMountedRef.current) {
          setIsCalculatingCost(false);
        }
      }
    };

    const debounceTimer = setTimeout(calculateCost, 500);
    return () => clearTimeout(debounceTimer);
  }, [message, selectedMode, recipients.length, selectedSegment, segmentContacts.length, costPerSMS]);

  // SMS segment calculation using proper formula
  const segmentInfo = getSegmentInfo(message);
  const segmentCount = segmentInfo.segments;

  // Use cost from API if available, otherwise use local calculation
  const estimatedCost = costCalculation?.total_cost ?? calculateSMSCost(segmentCount, getRecipientCount(), costPerSMS);

  // Warn the user the first time the message crosses a 160-character segment
  // boundary (e.g. 160→161 makes it cost 2 SMS instead of 1). Show a centered,
  // blocking AlertDialog rather than a toast so the user can't keep typing
  // past the threshold without acknowledging the extra cost. Only fires when
  // segment count increases — deleting back down does nothing.
  const [segmentAlertOpen, setSegmentAlertOpen] = useState(false);
  const [segmentAlertCount, setSegmentAlertCount] = useState(0);
  const lastSegmentWarnedRef = useRef(0);
  useEffect(() => {
    const prev = lastSegmentWarnedRef.current;
    if (segmentCount > prev && segmentCount >= 2) {
      setSegmentAlertCount(segmentCount);
      setSegmentAlertOpen(true);
    }
    lastSegmentWarnedRef.current = segmentCount;
  }, [segmentCount]);

  // Fetch contacts when segment or tag selection changes
  useEffect(() => {
    const abortController = new AbortController();
    if (selectedMode === "segment" && selectedSegment && isMountedRef.current) {
      fetchContactsByGroup(selectedSegment, abortController.signal);
    }
    return () => {
      abortController.abort();
    };
  }, [selectedMode, selectedSegment, selectedTagGroup, fetchContactsByGroup]);

  const location = useLocation();

  // Immediate cleanup when navigating away from this page
  useEffect(() => {
    // This runs whenever the pathname changes
    const isLeavingPage = !location.pathname.includes('/sms/send');

    if (isLeavingPage) {
      // Abort ALL pending operations immediately
      abortControllerRef.current.abort();
      isMountedRef.current = false;
      setSending(false);
      setSendProgress(0);
      setPageReady(false);
      setIsLoadingSegmentContacts(false);
      setSegmentContacts([]);
      setRecipients([]);
      setSelectedMode(null);
    }
  }, [location.pathname]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    setPageReady(true); // Make page ready immediately

    // Listen for navigation events from sidebar
    const handlePageNavigate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.href && !customEvent.detail.href.includes('/sms/send')) {
        // Abort ALL pending operations immediately
        abortControllerRef.current.abort();
        isMountedRef.current = false;
        setSending(false);
        setSendProgress(0);
        setPageReady(false);
        setIsLoadingSegmentContacts(false);
        setSegmentContacts([]);
      }
    };

    window.addEventListener('page-navigate', handlePageNavigate);

    return () => {
      window.removeEventListener('page-navigate', handlePageNavigate);
      abortControllerRef.current.abort();
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    const contactParam = params.get("contact");
    const contactsParam = params.get("contacts");

    // Handle single contact
    if (contactParam) {
      setSelectedMode("single");
      setRecipients([contactParam]);
    }
    // Handle multiple contacts
    else if (contactsParam) {
      const contactIds = contactsParam.split(',').filter(id => id.trim());
      if (contactIds.length === 1) {
        setSelectedMode("single");
        setRecipients(contactIds);
      } else {
        setSelectedMode("bulk");
        setRecipients(contactIds);
      }
    }
    // Handle mode parameter
    else if (modeParam === "single" || modeParam === "bulk" || modeParam === "segment") {
      setSelectedMode(modeParam);
    }
  }, [location.search]);

  // Ensure default sender selection when data loads
  useEffect(() => {
    if (selectedSender) return;
    if (!approvedSenderRequests || approvedSenderRequests.length === 0) return;

    // Prefer "Mifumosms" if available (it's the primary active sender), otherwise use first
    const mifumosms = approvedSenderRequests.find(r => r.sender_id === "Mifumosms" && r.status === "active");
    const defaultSender = mifumosms || approvedSenderRequests[0];

    if (defaultSender?.id) {
      setSelectedSender(defaultSender.id);
      logger.debug('Default sender selected', { sender_id: defaultSender.sender_id, status: defaultSender.status });
    }
  }, [selectedSender, approvedSenderRequests]);

  // Fetch purchase history on component mount to get pricing
  useEffect(() => {
    if (isMountedRef.current) {
      fetchPurchaseHistory({
        page: 1,
        page_size: 100,
        status: 'completed'
      });
    }
  }, [fetchPurchaseHistory]);

  const getSelectedSenderName = () => {
    // Find absolute match by Database ID (UUID)
    const found = approvedSenderRequests.find((r) => r.id === selectedSender);
    // Return the object so we can access both id and sender_id
    return found || null;
  };

  const addRecipient = () => {
    if (!newRecipient) return;
    const apiNumber = normalizeToApi(newRecipient);
    if (apiNumber) {
      if (!recipients.includes(apiNumber)) {
        setRecipients([...recipients, apiNumber]);
      }
      setNewRecipient("");
    } else {
      toast({
        title: "Invalid phone number",
        description: "Use 12 digits starting with 255 (e.g., 255700000000)",
        variant: "destructive"
      });
    }
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter(r => r !== phone));
  };

  const handleSendSMS = async () => {
    if (!selectedSender) {
      toast({
        title: "Sender name required",
        description: "Please select a sender name",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your message",
        variant: "destructive"
      });
      return;
    }

    // Validate message length and segments
    const validation = validateMessageLength(message);
    if (!validation.isValid) {
      toast({
        title: "Message too long",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if ((selectedMode === "single" || selectedMode === "bulk") && recipients.length === 0) {
      toast({
        title: "Recipients required",
        description: selectedMode === "bulk" ? "Please upload a CSV file with phone numbers" : "Please add at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (selectedMode === "segment" && !selectedSegment) {
      toast({
        title: "Segment required",
        description: "Please select a segment",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    setSendProgress(0);

    try {
      // Determine recipients based on mode
      let targetRecipients: string[] = [];

      if (selectedMode === "single" || selectedMode === "bulk") {
        targetRecipients = recipients;
      } else if (selectedMode === "segment") {
        // Use actual contacts from the selected segment
        if (segmentContacts.length > 0) {
          targetRecipients = segmentContacts.map(contact => {
            // Convert E.164 format to API format (remove + and ensure 12 digits)
            let phone = contact.phone_e164;
            if (phone.startsWith('+')) {
              phone = phone.substring(1);
            }
            if (phone.startsWith('255') && phone.length === 12) {
              return phone;
            }
            // If it's in local format, convert it
            if (phone.startsWith('0') && phone.length === 10) {
              return `255${phone.substring(1)}`;
            }
            return phone;
          });
        }
      }

      if (targetRecipients.length === 0) {
        setSending(false);
        toast({
          title: "No recipients",
          description: "No recipients found for the selected mode",
          variant: "destructive"
        });
        return;
      }

      // Use the selected approved sender name
      const senderObj = getSelectedSenderName();
      if (!senderObj) {
        setSending(false);
        toast({
          title: "Sender name required",
          description: "Please select an approved sender name",
          variant: "destructive"
        });
        return;
      }

      // Use the alphanumeric sender ID (max 11 chars) as required by the SMS gateway.
      // This must be the provisioned branding name (e.g., "Mifumosms").
      const senderIdentifier = senderObj.sender_id;

      // Validate that we have a non-empty identifier
      if (!senderIdentifier || !senderIdentifier.trim()) {
        setSending(false);
        toast({
          title: "Invalid sender ID",
          description: "The selected sender ID is not properly configured. Please select another sender name or request a new one.",
          variant: "destructive"
        });
        return;
      }

      // Log sender details for debugging backend issues
      logger.debug('Using approved sender', {
        senderName: senderIdentifier,
        source: senderObj.source,
        status: senderObj.status,
        id: senderObj.id
      });

      const cleanSenderId = senderIdentifier.trim();

      // Ensure all recipients are normalized for the API
      const apiRecipients = targetRecipients
        .map(r => normalizeToApi(r))
        .filter((r): r is string => Boolean(r));

      // Prepare the data for the SMS API - send sender_id name and record id for backend lookup
      const smsData: Record<string, unknown> = {
        message: message.trim(),
        recipients: apiRecipients,
        sender_id: cleanSenderId // Alphanumeric branding name (e.g., "Mifumosms")
      };

      // Add sender_id_record_id to help backend identify the correct SenderIDRequest record
      // This helps avoid provider attribute errors by giving the backend a direct reference
      if (senderObj?.id) {
        smsData.sender_id_record_id = senderObj.id;
      }

      // Only add optional fields if they have values
      if (scheduleType === "later" && scheduledDate) {
        smsData.scheduled_at = scheduledDate;
      }

      // Debug: Log the data being sent
      logger.debug('Sending SMS', {
        recipientCount: apiRecipients.length,
        senderIdentifier: cleanSenderId,
        senderRecordId: senderObj?.id,
        senderSource: senderObj.source,
        senderStatus: senderObj.status,
        payloadKeys: Object.keys(smsData)
      });

      // Call the SMS API
      const response = await apiClient.sendSMS(smsData as {
        message: string;
        recipients: string[];
        sender_id?: string;
        template_id?: string;
        scheduled_at?: string;
      });

      if (response.success) {
        // Extract provider message from nested response, prefer it over generic API message
        let successMessage = `Sent to ${apiRecipients.length} recipient(s)`;

        // Try to get the provider's actual success message (Beem Africa format)
        const providerResponse = response.data?.provider_response?.response;
        const providerMsg = (providerResponse && typeof providerResponse === 'object' && 'message' in providerResponse)
          ? (providerResponse as Record<string, unknown>).message
          : null;
        if (providerMsg && typeof providerMsg === 'string') {
          successMessage = providerMsg; // "Message Submitted Successfully"
        } else if ('message' in response && typeof response.message === 'string' && response.message.trim()) {
          successMessage = response.message; // Fallback to API message
        }

        // Simulate progress for better UX
        const interval = setInterval(() => {
          setSendProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setSending(false);
              toast({
                title: "SMS sent successfully",
                description: successMessage,
              });
              // Reset form
              setRecipients([]);
              setMessage("");
              setSelectedMode(null);
              setSelectedSegment("");
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      } else {
        setSending(false);
        // Enhanced error handling with more details
        let errorMessage = response.error || response.message || "An error occurred while sending SMS";

        logger.error('SMS API Error', { status: response.status });

        if (response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (response.status === 403) {
          errorMessage = "Insufficient credits. Please purchase more SMS credits.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (response.status === 400 && errorMessage.includes("object has no attribute")) {
          // Technical backend error, prefer a cleaner message
          errorMessage = "There is a technical issue with this sender ID. Please try another one or contact support.";
        }

        toast({
          title: "Failed to send SMS",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      setSending(false);
      logger.error('SMS sending error');
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isCSV = lowerName.endsWith(".csv");
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

    // Validate file type
    if (!isCSV && !isExcel) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const phoneNumbers: string[] = [];
      const invalidNumbers: string[] = [];

      if (isExcel) {
        // Use shared Excel parser used by Contacts import
        const result = await parseExcelFile(file);

        result.contacts.forEach((c) => {
          // excelParser normalizes to 255XXXXXXXXX; convert to +255 format
          const normalized = normalizeToApi(c.phone.startsWith("255") ? `+${c.phone}` : c.phone);
          if (normalized) {
            if (!phoneNumbers.includes(normalized)) {
              phoneNumbers.push(normalized);
            }
          } else {
            invalidNumbers.push(c.phone);
          }
        });

        if (result.errors.length > 0) {
          // Show first error as hint, but still use numbers we got
          toast({
            title: "Some rows were skipped",
            description: result.errors[0],
            variant: "destructive",
          });
        }
      } else if (isCSV) {
        const reader = new FileReader();
        const csvText: string = await new Promise((resolve, reject) => {
          reader.onload = (event) => resolve((event.target?.result as string) || "");
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        const lines = csvText.split("\n").map((l) => l.trim()).filter((l) => l);
        if (lines.length === 0) {
          toast({
            title: "Empty file",
            description: "The CSV file is empty",
            variant: "destructive",
          });
          return;
        }

        // Try to detect header; if first line contains any letters, treat as header.
        const firstLine = lines[0];
        const hasLetters = /[A-Za-z]/.test(firstLine);

        let startIndex = 0;
        let phoneColumnIndex = 0;

        if (hasLetters) {
          const header = parseCSVLine(firstLine).map((col) => col.trim().toLowerCase());
          const foundIndex = header.findIndex(
            (col) => col.includes("phone") || col.includes("number") || col.includes("mobile")
          );
          if (foundIndex === -1) {
            // Fallback: assume first column is phone
            phoneColumnIndex = 0;
          } else {
            phoneColumnIndex = foundIndex;
          }
          startIndex = 1;
        } else {
          // No header; every line is data, first column is phone
          phoneColumnIndex = 0;
          startIndex = 0;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          const columns = parseCSVLine(line);
          const rawPhone = (columns[phoneColumnIndex] || "").trim().replace(/['"]/g, "");
          if (!rawPhone) continue;

          const normalizedPhone = normalizeToApi(rawPhone);
          if (normalizedPhone) {
            if (!phoneNumbers.includes(normalizedPhone)) {
              phoneNumbers.push(normalizedPhone);
            }
          } else {
            invalidNumbers.push(rawPhone);
          }
        }
      }

      if (phoneNumbers.length > 0) {
        setRecipients(phoneNumbers);
        toast({
          title: "File processed successfully",
          description: `Found ${phoneNumbers.length} valid phone numbers${
            invalidNumbers.length > 0 ? ` (${invalidNumbers.length} invalid numbers skipped)` : ""
          }`,
        });
      } else {
        toast({
          title: "No valid numbers found",
          description:
            "Please check your file and ensure it contains valid Tanzanian phone numbers (255XXXXXXXXX, 0XXXXXXXXX, or 9-digit local numbers).",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "Error processing file",
        description: "Failed to parse file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      // Reset input so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  // Default to Quick on first open so the segmented control highlights immediately.
  useEffect(() => {
    if (selectedMode === null) setSelectedMode("single");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode = selectedMode ?? "single";
  const recipientCount = getRecipientCount();
  const canSend = !sending && !segmentInfo.isOverLimit && !!message.trim() && recipientCount > 0 && !!selectedSender;

  // Touch swipe across sub-tabs (Quick ↔ Bulk ↔ Group). At the edges, spill
  // into the adjacent sidebar page so the user can keep scrolling forward into
  // WhatsApp or back into the Dashboard.
  useSubTabSwipe({
    containerRef: formBodyRef,
    tabs: ["single", "bulk", "segment"] as const,
    currentTab: mode,
    setTab: (next) => setSelectedMode(next),
    edgePrevHref: "/dashboard",
    edgeNextHref: "/whatsapp",
  });

  // Page background tints to match the active mode color — gradient at top AND bottom.
  const modeBgClass = {
    single: "bg-gradient-to-b from-primary/10 via-background to-primary/10 dark:from-primary/15 dark:via-background dark:to-primary/15",
    bulk: "bg-gradient-to-b from-amber-500/10 via-background to-amber-500/10 dark:from-amber-500/15 dark:via-background dark:to-amber-500/15",
    segment: "bg-gradient-to-b from-emerald-500/10 via-background to-emerald-500/10 dark:from-emerald-500/15 dark:via-background dark:to-emerald-500/15",
  }[mode];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${modeBgClass}`}>
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main data-sticky-bottom-bar className={`flex-1 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${modeBgClass}`}>
          <div className="max-w-2xl mx-auto w-full max-w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-36 sm:pb-32 space-y-5">
            {/* Page header — iOS-style large title */}
            <header>
              <h1 className="font-heading text-[24px] sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
                {language === "sw" ? "Tuma SMS" : "Send SMS"}
              </h1>
              <p className="text-[13px] sm:text-sm text-foreground/60 mt-1">
                {language === "sw" ? "SMS moja kwa moja, wengi, au sehemu" : "Choose how you'd like to send."}
              </p>
            </header>

            {/* Segmented control — filled primary pill for active, strong contrast */}
            <div
              role="tablist"
              aria-label={language === "sw" ? "Aina ya SMS" : "Send mode"}
              className="grid grid-cols-3 gap-1 p-1 bg-foreground/[0.06] dark:bg-foreground/[0.08] rounded-2xl"
            >
              {[
                {
                  key: "single" as const,
                  icon: MessageSquare,
                  label: language === "sw" ? "Quick" : "Quick",
                  activeClass: "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(10,92,219,0.35)]",
                },
                {
                  key: "bulk" as const,
                  icon: Upload,
                  label: language === "sw" ? "Bulk" : "Bulk",
                  activeClass: "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]",
                },
                {
                  key: "segment" as const,
                  icon: Users,
                  label: language === "sw" ? "Group" : "Group",
                  activeClass: "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]",
                },
              ].map(({ key, icon: Icon, label, activeClass }) => {
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedMode(key)}
                    className={[
                      "h-11 rounded-xl inline-flex items-center justify-center gap-1.5",
                      "text-[13px] font-bold tracking-tight transition-all duration-200",
                      isActive
                        ? activeClass
                        : "text-foreground/70 dark:text-foreground/65 active:bg-foreground/[0.04] dark:active:bg-foreground/[0.06]",
                    ].join(" ")}
                  >
                    <Icon className="w-[15px] h-[15px]" strokeWidth={isActive ? 2.6 : 2} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Form sections (iOS grouped style) — always visible (defaults to Quick).
                Wrapped in a div so touch swipes here can drive sub-tab navigation. */}
            <div ref={formBodyRef} className="space-y-5">
                {/* From section */}
                <Section title={language === "sw" ? "Mtumaji" : "From"} subtitle={language === "sw" ? "Sender ID iliyoidhinishwa" : "Approved Sender ID"}>
                  <Select value={selectedSender} onValueChange={setSelectedSender}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[14px]">
                      <SelectValue placeholder={senderNamesLoading ? (language === "sw" ? "Inapakua…" : "Loading…") : (approvedSenderRequests.length === 0 ? (language === "sw" ? "Hakuna" : "No approved senders") : (language === "sw" ? "Chagua mtumaji" : "Select a sender ID"))} />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      {approvedSenderRequests.map((req, index) => (
                        <SelectItem key={req.id || `sender-${index}`} value={req.id}>
                          <div className="flex items-center gap-2">
                            <span>{req.sender_id}</span>
                            {(req.source === 'SMSSenderID' || req.source === 'provider' || req.source === 'sender_id') && (
                              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-primary/30 text-primary">Active</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {senderNamesError && (
                    <p className="text-[12px] text-destructive mt-2 leading-snug">
                      {language === "sw" ? "Imeshindwa kupakia majina ya mtumaji. Tafadhali jaribu tena." : "Failed to load sender names. Please try again."}
                    </p>
                  )}
                  {!senderNamesLoading && approvedSenderRequests.length === 0 && (
                    <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">
                      {language === "sw" ? "Huna ID ya mtumaji iliyoidhinisha bado. Omba moja katika Majina ya Mtumaji." : "No approved sender IDs yet. Request one in Sender Names."}
                    </p>
                  )}
                </Section>

                {/* Recipients - Single Mode */}
                {mode === "single" && (
                  <Section title={language === "sw" ? "Kwa" : "To"} subtitle={recipients.length > 0 ? `${recipients.length} ${language === "sw" ? "wapokeaji" : "recipients"}` : (language === "sw" ? "Ongeza nambari za simu" : "Add phone numbers")}>
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === "sw" ? "+255 7XX XXX XXX" : "+255 7XX XXX XXX"}
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
                        inputMode="tel"
                        className="flex-1 h-11 rounded-xl border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[14px]"
                      />
                      <Button onClick={addRecipient} disabled={!newRecipient.trim()} className="h-11 px-4 text-sm font-semibold rounded-xl">
                        {language === "sw" ? "Ongeza" : "Add"}
                      </Button>
                    </div>
                    {recipients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {recipients.map((phone) => (
                          <span key={phone} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 dark:bg-primary/15 text-primary text-[12px] font-medium">
                            {phone}
                            <button
                              type="button"
                              onClick={() => removeRecipient(phone)}
                              aria-label={`Remove ${phone}`}
                              className="w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-destructive/15 active:bg-destructive/15 hover:text-destructive active:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Section>
                )}

                {/* Recipients - Bulk Mode */}
                {mode === "bulk" && (
                  <Section title={language === "sw" ? "Kwa" : "To"} subtitle={recipients.length > 0 ? `${recipients.length} ${language === "sw" ? "wapokeaji" : "recipients"}` : (language === "sw" ? "CSV au anwani za simu" : "Upload CSV or import from contacts")}>
                    {/* File upload (CSV / Excel) */}
                    <div className="rounded-xl border-2 border-dashed border-border/60 dark:border-border/40 hover:border-primary/40 transition-colors p-5 text-center bg-background/40 dark:bg-background/20">
                      <Upload className="w-7 h-7 mx-auto mb-2 text-foreground/40 dark:text-foreground/35" strokeWidth={1.8} />
                      <p className="text-[13px] text-foreground/70 dark:text-foreground/60 mb-3 leading-snug">
                        {language === "sw"
                          ? "Pakia faili ya CSV au Excel yenye namba za simu"
                          : "Upload CSV or Excel file with phone numbers"}
                      </p>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="recipients-file-upload"
                      />
                      <label htmlFor="recipients-file-upload">
                        <Button variant="outline" size="sm" asChild className="h-9 text-xs font-semibold rounded-lg">
                          <span>{language === "sw" ? "Chagua faili" : "Choose file"}</span>
                        </Button>
                      </label>
                    </div>

                    {/* Optional: Import from phone contacts (where supported) */}
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 text-[13px] font-semibold rounded-xl gap-2"
                        onClick={async () => {
                            const navAny = navigator as any;
                            if (!navAny.contacts || !navAny.contacts.select) {
                              toast({
                                title: language === "sw" ? "Haiwezekani moja kwa moja" : "Direct phone import not available",
                                description:
                                  language === "sw"
                                    ? "Kivinjari chako hakiruhusu kusoma anwani za simu moja kwa moja. Tafadhali toa CSV/Excel kutoka simu yako na ipakie hapa."
                                    : "Your browser cannot read phone contacts directly. Please export contacts to CSV/Excel on your phone and upload the file here.",
                                variant: "destructive",
                              });
                              return;
                            }

                            try {
                              const selected = await navAny.contacts.select(['name', 'tel'], { multiple: true });
                              const numbers: string[] = [];

                              (selected || []).forEach((c: any) => {
                                (c.tel || []).forEach((raw: string) => {
                                  const normalized = normalizeToApi(raw);
                                  if (normalized && !numbers.includes(normalized)) {
                                    numbers.push(normalized);
                                  }
                                });
                              });

                              if (numbers.length === 0) {
                                toast({
                                  title: language === "sw" ? "Hakuna namba zilizopatikana" : "No phone numbers found",
                                  description:
                                    language === "sw"
                                      ? "Hakuna namba halali za simu zilizochaguliwa kutoka kwenye anwani za simu."
                                      : "No valid phone numbers were selected from your phone contacts.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setRecipients(numbers);
                              toast({
                                title: language === "sw" ? "Namba zimeongezwa" : "Contacts imported",
                                description:
                                  language === "sw"
                                    ? `Namba ${numbers.length} zimechaguliwa kutoka kwenye anwani za simu.`
                                    : `Imported ${numbers.length} phone numbers from your phone contacts.`,
                              });
                            } catch (error) {
                              // User may cancel; just ignore silently
                            }
                          }}
                        >
                        <Users className="w-4 h-4" strokeWidth={2.2} />
                        <span className="truncate">
                          {language === "sw" ? "Chukua kutoka anwani za simu" : "Import from phone contacts"}
                        </span>
                      </Button>
                    </div>

                    {/* Uploaded/Imported Preview */}
                    {recipients.length > 0 && (
                      <div className="space-y-2 pt-3 mt-3 border-t border-border/40 dark:border-border/25">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-foreground/70">
                            {recipients.length} {language === "sw" ? "wapokeaji" : "recipients"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRecipients([])}
                            className="text-[12px] font-semibold text-destructive active:opacity-60 transition-opacity"
                          >
                            {language === "sw" ? "Futa" : "Clear"}
                          </button>
                        </div>
                        <div className="max-h-24 overflow-y-auto rounded-xl border border-border/50 dark:border-border/30 p-2 bg-muted/30 dark:bg-muted/15">
                          <div className="flex flex-wrap gap-1">
                            {recipients.slice(0, 20).map((phone) => (
                              <span key={phone} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/15 text-primary font-medium">
                                {phone}
                              </span>
                            ))}
                            {recipients.length > 20 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/60 font-medium">
                                +{recipients.length - 20} {language === "sw" ? "zaidi" : "more"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-foreground/55 dark:text-foreground/50 leading-relaxed mt-3">
                      {language === "sw"
                        ? "Muundo unaokubalika: 255XXXXXXXXX, 0XXXXXXXXX, au 9 tarakimu (zitabadilishwa kiotomatiki kuwa +255...)."
                        : "Supported formats: 255XXXXXXXXX, 0XXXXXXXXX, or 9 digits (auto-converted to +255…)."}
                    </p>
                  </Section>
                )}

                {/* Recipients - Segment Mode */}
                {mode === "segment" && (
                  <Section title={language === "sw" ? "Kwa" : "To"} subtitle={selectedSegment ? `${segmentContacts.length} ${language === "sw" ? "wasilianaji" : "contacts"}` : (language === "sw" ? "Chagua kundi" : "Pick a contact group")}>
                    <Select value={selectedSegment} onValueChange={value => { setSelectedSegment(value); setSelectedTagGroup(""); }}>
                      <SelectTrigger className="w-full h-11 rounded-xl border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[14px]">
                        <SelectValue placeholder={language === "sw" ? "Chagua kundi la wasilianaji" : "Choose a contact group"} />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem key="all" value="all">
                          {language === "sw" ? "Wote" : "All Contacts"}
                        </SelectItem>
                        <SelectItem key="choose-group" value="choose-group">
                          {language === "sw" ? "Chagua Kundi" : "Choose Group Name"}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedSegment === 'choose-group' && (
                      <div className="mt-3">
                        {isLoadingAllGroupContacts && uniqueTagNames.length === 0 ? (
                          <div className="flex items-center gap-2 text-[13px] text-foreground/60">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {language === "sw" ? "Inapakua makundi..." : "Loading groups..."}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {groupTags.map(({ label, count }) => {
                              const formatted = label.replace(/_/g, ' ');
                              const isSelected = selectedTagGroup === label;
                              return (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() => setSelectedTagGroup(label)}
                                  className={[
                                    "px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors active:scale-[0.99]",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted/60 dark:bg-muted/30 text-foreground hover:bg-primary/10 dark:hover:bg-primary/15 border border-border/40 dark:border-border/25",
                                  ].join(" ")}
                                >
                                  <span className="block truncate">{formatted}</span>
                                  {typeof count === "number" && (
                                    <span className={`block text-[11px] mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-foreground/55"}`}>
                                      {count} {language === "sw" ? "wasilianaji" : "contacts"}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedSegment === 'all' || (selectedSegment === 'choose-group' && selectedTagGroup)) && (
                      <div className="mt-3 pt-3 border-t border-border/40 dark:border-border/25">
                        {isLoadingSegmentContacts ? (
                          <div className="flex items-center gap-2 text-[13px] text-foreground/60">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {language === "sw" ? "Inapakia wasilianaji..." : "Loading contacts..."}
                          </div>
                        ) : segmentContacts.length > 0 ? (
                          <div className="max-h-32 overflow-y-auto rounded-xl border border-border/50 dark:border-border/30 p-2 bg-muted/30 dark:bg-muted/15">
                            <div className="flex flex-wrap gap-1">
                              {segmentContacts.slice(0, 20).map((contact) => (
                                <span key={contact.id} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/15 text-primary font-medium">
                                  {contact.name} · {contact.phone_e164}
                                </span>
                              ))}
                              {segmentContacts.length > 20 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/60 font-medium">
                                  +{segmentContacts.length - 20} {language === "sw" ? "zaidi" : "more"}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </Section>
                )}

                {/* Message */}
                <Section
                  title={language === "sw" ? "Ujumbe" : "Message"}
                  subtitle={getCharacterCountDisplay(message)}
                >
                  <Textarea
                    placeholder={language === "sw" ? "Andika ujumbe wako…" : "Type your message…"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={[
                      "min-h-[120px] rounded-xl border-border/60 dark:border-border/40",
                      "bg-background/60 dark:bg-background/40",
                      "text-[14px] leading-relaxed",
                      segmentInfo.isOverLimit ? "border-destructive focus-visible:border-destructive" : "",
                    ].join(" ")}
                    maxLength={800}
                  />
                  <div className="flex items-center justify-between mt-2 text-[11.5px]">
                    <p className="text-foreground/55">
                      {segmentCount > 1 && `${segmentCount} SMS`}
                    </p>
                    {segmentInfo.isOverLimit && (
                      <p className="text-destructive font-semibold">
                        {language === "sw" ? "Inazidi 800 herufi" : "Over 800 characters"}
                      </p>
                    )}
                  </div>
                </Section>

                {/* Schedule */}
                <Section title={language === "sw" ? "Wakati" : "When"}>
                  <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as "now" | "later")}>
                    <TabsList className="w-full h-11 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/40 dark:border-border/30">
                      <TabsTrigger
                        value="now"
                        className="flex-1 h-9 text-[13px] font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                      >
                        {language === "sw" ? "Sasa hivi" : "Now"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="later"
                        className="flex-1 h-9 text-[13px] font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                      >
                        {language === "sw" ? "Baadaye" : "Later"}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="later" className="mt-3">
                      <Input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="h-11 rounded-xl border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 text-[14px]"
                      />
                    </TabsContent>
                  </Tabs>
                </Section>

                {/* Send Progress */}
                {sending && (
                  <div className="space-y-1.5 px-1">
                    <div className="flex items-center justify-between text-[12px] font-medium">
                      <span className="text-foreground/70">{language === "sw" ? "Inatumwa..." : "Sending..."}</span>
                      <span className="text-primary tabular-nums">{sendProgress}%</span>
                    </div>
                    <Progress value={sendProgress} className="h-1.5" />
                  </div>
                )}
            </div>
          </div>

          {/* Sticky bottom action bar (mobile-aware safe area).
              On desktop, offset by the 240px sidebar width so the bar sits
              under the page content, not behind the AppSidebar. */}
          <div
            className={[
              "fixed left-0 right-0 z-30 md:left-[240px]",
              "bg-card/95 dark:bg-background/95 backdrop-blur-xl",
              "border-t border-border/70 dark:border-border/40",
              // Sit above the mobile tab bar; clear of the desktop layout.
              "bottom-[calc(var(--mobile-tabbar-h,0px)+env(safe-area-inset-bottom))] md:bottom-0",
              "pb-3 pt-3 px-4 sm:px-6",
            ].join(" ")}
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <div className="flex-1 min-w-0">
                {recipientCount > 0 && message ? (
                  <>
                    <p className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55 leading-none">
                      {language === "sw" ? "Jumla ya SMS" : "Total SMS"}
                    </p>
                    <p className="text-[18px] font-bold text-foreground leading-tight tabular-nums mt-0.5">
                      {(recipientCount * segmentCount).toLocaleString()} <span className="text-[12px] font-semibold text-foreground/60">{language === "sw" ? "SMS" : (recipientCount * segmentCount === 1 ? "SMS" : "SMS")}</span>
                    </p>
                    <p className="text-[11px] text-foreground/55 leading-tight mt-0.5">
                      {recipientCount} {language === "sw"
                        ? (recipientCount === 1 ? "mpokeaji" : "wapokeaji")
                        : (recipientCount === 1 ? "recipient" : "recipients")}
                      {" × "}
                      {segmentCount} {language === "sw"
                        ? (segmentCount === 1 ? "sehemu" : "sehemu")
                        : (segmentCount === 1 ? "segment" : "segments")}
                      {" = "}
                      <span className="font-semibold text-foreground/75 tabular-nums">
                        {(recipientCount * segmentCount).toLocaleString()} SMS
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10.5px] font-bold tracking-wider uppercase text-foreground/55 leading-none">
                      {language === "sw" ? "Wapokeaji" : "Recipients"}
                    </p>
                    <p className="text-[14px] font-semibold text-foreground/75 leading-tight mt-1">
                      {recipientCount} {language === "sw" ? "waliochaguliwa" : "selected"}
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={handleSendSMS}
                disabled={!canSend}
                className="h-12 px-6 rounded-xl text-[14px] font-semibold shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" strokeWidth={2.4} />
                {segmentInfo.isOverLimit
                  ? (language === "sw" ? "Mrefu sana" : "Too long")
                  : scheduleType === "now"
                    ? (language === "sw" ? "Tuma" : "Send")
                    : (language === "sw" ? "Panga" : "Schedule")}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Centered blocking alert when the message crosses a segment boundary.
          User must click Continue to acknowledge the extra SMS cost — the
          dialog won't auto-dismiss, and won't re-open unless the segment
          count grows further (e.g. 2→3, 3→4). */}
      <AlertDialog open={segmentAlertOpen} onOpenChange={setSegmentAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "sw"
                ? `Ujumbe sasa utatumia ${segmentAlertCount} SMS`
                : `Message will now use ${segmentAlertCount} SMS per recipient`}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {language === "sw"
                  ? `Umevuka herufi 160. Kila mpokeaji atatumia ${segmentAlertCount} SMS, sio 1.`
                  : `You've gone past 160 characters. Each recipient will now be charged ${segmentAlertCount} SMS instead of 1.`}
              </span>
              {(() => {
                const recipients = Math.max(1, getRecipientCount());
                const totalSms = segmentAlertCount * recipients;
                return (
                  <span className="block font-semibold text-foreground">
                    {language === "sw"
                      ? `Wapokeaji ${recipients} × ${segmentAlertCount} SMS = ${totalSms.toLocaleString()} SMS jumla`
                      : `${recipients} recipient${recipients === 1 ? "" : "s"} × ${segmentAlertCount} SMS = ${totalSms.toLocaleString()} SMS total`}
                  </span>
                );
              })()}
              <span className="block text-xs">
                {language === "sw"
                  ? "Bonyeza Endelea kuthibitisha, au futa maandishi ili kurudi kwenye SMS 1."
                  : "Tap Continue to accept, or shorten the message to stay at 1 SMS."}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSegmentAlertOpen(false)}>
              {language === "sw" ? "Endelea" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** iOS-grouped section: title row + body card. */
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-2 px-1 mb-2">
        <h2 className="text-[11px] font-bold tracking-wider uppercase text-foreground/65 dark:text-foreground/55">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[11px] font-medium text-foreground/55 dark:text-foreground/50 truncate">
            {subtitle}
          </span>
        )}
      </div>
      <div className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] p-3.5 sm:p-4">
        {children}
      </div>
    </section>
  );
}

export default SendSMS;

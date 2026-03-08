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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient, Contact, SenderNameRequest, UnifiedSenderName } from "@/lib/api";
import { logger } from "@/utils/logger";
import { useSenderNames } from "@/hooks/useSenderNames";
import { useContactSegments } from "@/hooks/useContactSegments";
import { useContacts } from "@/hooks/useContacts";
import { usePurchaseHistory, PurchaseRecord } from "@/hooks/usePurchaseHistory";
import { calculateSMSegments, validateMessageLength, getSegmentInfo, formatSegmentCount, calculateSMSCost, getCharacterCountDisplay } from "@/utils/smsUtils";
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

  // SMS segment calculation using proper formula
  const segmentInfo = getSegmentInfo(message);
  const segmentCount = segmentInfo.segments;

  // Calculate cost based on current mode
  const getRecipientCount = () => {
    if (selectedMode === "single") return recipients.length;
    if (selectedMode === "bulk") return recipients.length;
    if (selectedMode === "segment" && selectedSegment) {
      // Use actual loaded contacts count instead of segment count
      return segmentContacts.length;
    }
    return 0;
  };

  const estimatedCost = calculateSMSCost(segmentCount, getRecipientCount(), costPerSMS);

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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
          <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
            {/* Header */}
            <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-5">
              <h1 className="font-heading text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 lg:mb-2">
                {language === "sw" ? "Tuma SMS" : "Send SMS"}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-text-subtle">
                {language === "sw" ? "SMS moja kwa moja, wengi, au sehemu" : "Single, bulk, or target segments"}
              </p>
            </div>

            {/* Mode Selection */}
            {!selectedMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                <Card
                  className="p-2.5 sm:p-3 md:p-4 cursor-pointer hover:shadow-md transition-smooth glass hover:border-primary/30"
                  onClick={() => setSelectedMode("single")}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg gradient-primary flex items-center justify-center mb-1.5 sm:mb-2">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-xs sm:text-sm md:text-base font-semibold mb-0.5">{language === "sw" ? "Quick" : "Quick SMS"}</h3>
                  <p className="text-xs text-text-subtle line-clamp-2">
                    {language === "sw" ? "SMS moja kwa moja" : "Single SMS"}
                  </p>
                </Card>

                <Card
                  className="p-2.5 sm:p-3 md:p-4 cursor-pointer hover:shadow-md transition-smooth glass hover:border-secondary/30"
                  onClick={() => setSelectedMode("bulk")}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg gradient-secondary flex items-center justify-center mb-1.5 sm:mb-2">
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-xs sm:text-sm md:text-base font-semibold mb-0.5">
                    {language === "sw" ? "Bulk SMS" : "Bulk SMS"}
                  </h3>
                  <p className="text-xs text-text-subtle line-clamp-2">
                    {language === "sw"
                      ? "CSV, Excel au anwani za simu"
                      : "CSV, Excel or phone contacts"}
                  </p>
                </Card>

                <Card
                  className="p-2.5 sm:p-3 md:p-4 cursor-pointer hover:shadow-md transition-smooth glass hover:border-success/30"
                  onClick={() => setSelectedMode("segment")}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-success flex items-center justify-center mb-1.5 sm:mb-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-foreground" />
                  </div>
                  <h3 className="font-heading text-xs sm:text-sm md:text-base font-semibold mb-0.5">{language === "sw" ? "Group" : "Group SMS"}</h3>
                  <p className="text-xs text-text-subtle line-clamp-2">
                    {language === "sw" ? "Sehemu" : "Segments"}
                  </p>
                </Card>
              </div>
            )}

            {/* Send Form */}
            {selectedMode && (
              <Card className="p-2.5 sm:p-3 md:p-4 lg:p-5 glass">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3 md:mb-4 lg:mb-5">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    {selectedMode === "single" && <MessageSquare className="w-3.5 h-3.5 sm:w-4 md:w-5 text-primary" />}
                    {selectedMode === "bulk" && <Upload className="w-3.5 h-3.5 sm:w-4 md:w-5 text-secondary" />}
                    {selectedMode === "segment" && <Users className="w-3.5 h-3.5 sm:w-4 md:w-5 text-success" />}
                    <h2 className="font-heading text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                    {selectedMode === "single" && (language === "sw" ? "Quick SMS" : "Quick SMS")}
                    {selectedMode === "bulk" && (language === "sw" ? "Bulk SMS" : "Bulk SMS")}
                    {selectedMode === "segment" && (language === "sw" ? "Group SMS" : "Group SMS")}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMode(null)}
                    className="text-xs h-7 sm:h-8 md:h-9 px-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
                  {/* Sender Name */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label className="text-xs sm:text-sm md:text-base font-medium">{language === "sw" ? "Sender" : "Sender"}</Label>
                    <Select value={selectedSender} onValueChange={setSelectedSender}>
                      <SelectTrigger className="glass-subtle border-0 h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base">
                        <SelectValue placeholder={senderNamesLoading ? (language === "sw" ? "Loading..." : "Loading...") : (approvedSenderRequests.length === 0 ? (language === "sw" ? "No senders" : "No approved senders") : (language === "sw" ? "Select sender" : "Select sender"))} />
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
                      <Alert className="mt-2">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          {language === "sw" ? "Imeshindwa kupakia majina ya mtumaji. Tafadhali jaribu tena." : "Failed to load sender names. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}
                    {!senderNamesLoading && approvedSenderRequests.length === 0 && (
                      <Alert className="mt-2">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          {language === "sw" ? "Huna ID ya mtumaji iliyoidhinisha bado. Omba moja katika Majina ya Mtumaji." : "You have no approved sender IDs yet. Request one in Sender Names."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Recipients - Single Mode */}
                  {selectedMode === "single" && (
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium">{language === "sw" ? "Recipients" : "Recipients"}</Label>
                      <div className="flex gap-1.5">
                        <Input
                          placeholder={language === "sw" ? "Phone number" : "Phone number"}
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                          className="glass-subtle border-0 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                        <Button onClick={addRecipient} variant="outline" className="h-8 sm:h-9 text-xs sm:text-sm px-3">
                          {language === "sw" ? "Add" : "Add"}
                        </Button>
                      </div>
                      {recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {recipients.map((phone) => (
                            <Badge key={phone} variant="secondary" className="pl-3 pr-1 py-1">
                              {phone}
                              <button
                                onClick={() => removeRecipient(phone)}
                                className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recipients - Bulk Mode */}
                  {selectedMode === "bulk" && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium">
                        {language === "sw" ? "Wapokeaji kutoka faili / simu" : "Recipients from file / phone"}
                      </Label>

                      {/* File upload (CSV / Excel) */}
                      <div className="border border-dashed border-border rounded-lg p-3 sm:p-4 text-center hover:border-primary/50 transition-colors">
                        <Upload className="w-6 h-6 mx-auto mb-1.5 text-text-subtle" />
                        <p className="text-xs sm:text-sm text-text-subtle mb-1.5">
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
                          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                            <span>{language === "sw" ? "Chagua faili" : "Choose file"}</span>
                          </Button>
                        </label>
                      </div>

                      {/* Optional: Import from phone contacts (where supported) */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 text-xs sm:text-sm flex-1 justify-center"
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
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="truncate">
                            {language === "sw" ? "Chukua kutoka anwani za simu" : "Import from phone contacts"}
                          </span>
                        </Button>
                      </div>

                      {/* Uploaded/Imported Preview */}
                      {recipients.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                              {recipients.length} {language === "sw" ? "wapokeaji" : "recipient(s)"}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecipients([])}
                              className="text-destructive hover:text-destructive h-7 text-xs px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="max-h-24 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                            <div className="flex flex-wrap gap-1">
                              {recipients.slice(0, 20).map((phone) => (
                                <Badge key={phone} variant="secondary" className="text-xs">
                                  {phone}
                                </Badge>
                              ))}
                              {recipients.length > 20 && (
                                <Badge variant="outline" className="text-xs">
                                  +{recipients.length - 20} {language === "sw" ? "zaidi" : "more"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <div className="space-y-1 text-xs">
                            <div>
                              {language === "sw"
                                ? "Faili inaweza kuwa na safu moja tu ya namba au jedwali lenye safu ya namba (jina/email ni hiari)."
                                : "File can be a single column of numbers or a table with a phone column (name/email are optional)."}
                            </div>
                            <div>
                              {language === "sw"
                                ? "Muundo wa namba unaokubalika: 255XXXXXXXXX, 0XXXXXXXXX, au 9 tarakimu kama 7444XXXXXX / 6XXXXXXX / 7XXXXXXX (zitabadilishwa kiotomatiki kuwa +255...)."
                                : "Supported number formats: 255XXXXXXXXX, 0XXXXXXXXX, or 9 digits like 7444XXXXXX / 6XXXXXXX / 7XXXXXXX (auto-converted to +255...)."}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Recipients - Segment Mode */}
                  {selectedMode === "segment" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs sm:text-sm font-medium">{language === "sw" ? "Kundi" : "Group"}</Label>
                      </div>
                      <Select value={selectedSegment} onValueChange={value => { setSelectedSegment(value); setSelectedTagGroup(""); }}>
                        <SelectTrigger className="glass-subtle border-0">
                          <SelectValue placeholder={language === "sw" ? "Chagua kundi la wasilianaji" : "Choose contact Group"} />
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
                      {/* If 'Choose Group Name' is selected, show a secondary dropdown for tags */}
                      {selectedSegment === 'choose-group' && (
                        <div className="mt-2">
                          {isLoadingAllGroupContacts && uniqueTagNames.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {language === "sw" ? "Inapakua makundi..." : "Loading groups..."}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {groupTags.map(({ label, count }) => {
                                const formatted = label.replace(/_/g, ' ');
                                const isSelected = selectedTagGroup === label;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors focus:outline-none ${isSelected ? 'bg-primary text-white border-primary' : 'bg-muted text-foreground border-border hover:bg-primary/10'}`}
                                    onClick={() => setSelectedTagGroup(label)}
                                  >
                                    <span className="flex flex-col items-start">
                                      <span>{formatted}</span>
                                      {typeof count === "number" && (
                                        <span className="text-[11px] text-muted-foreground">
                                          {count} {language === "sw" ? "wasilianaji" : "contacts"}
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedSegment === 'all' || (selectedSegment === 'choose-group' && selectedTagGroup)) && (
                        <div className="space-y-2">
                          {isLoadingSegmentContacts ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {language === "sw" ? "Inapakia wasilianaji..." : "Loading contacts..."}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {segmentContacts.length} {language === "sw" ? "wasilianaji waliopakiwa" : "contacts loaded"}
                            </div>
                          )}
                          {segmentContacts.length > 0 && (
                            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                              <div className="flex flex-wrap gap-1">
                                {segmentContacts.slice(0, 20).map((contact) => (
                                  <Badge key={contact.id} variant="secondary" className="text-xs">
                                    {contact.name} - {contact.phone_e164}
                                  </Badge>
                                ))}
                                {segmentContacts.length > 20 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{segmentContacts.length - 20} {language === "sw" ? "zaidi" : "more"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-1 md:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm md:text-base font-medium">{language === "sw" ? "Message" : "Message"}</Label>
                      <div className="text-xs sm:text-sm text-text-subtle">
                        {getCharacterCountDisplay(message)}
                      </div>
                    </div>
                    <Textarea
                      placeholder={language === "sw" ? "Type message..." : "Type message..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`min-h-[100px] sm:min-h-[90px] md:min-h-[110px] lg:min-h-[120px] glass-subtle border-0 text-xs sm:text-sm md:text-base ${
                        segmentInfo.isOverLimit ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      maxLength={160}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-text-subtle">
                      {segmentCount > 1 && (language === "sw" ? "Ujumbe umezidi kikomo cha maksimum" : "Message exceeds maximum character limit")}
                    </p>
                      {segmentInfo.isOverLimit && (
                        <p className="text-red-500 font-medium">
                          {language === "sw" ? "Ujumbe unazidi kikomo cha 160 herufi" : "Message exceeds 160 character limit"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label className="text-xs sm:text-sm md:text-base font-medium">{language === "sw" ? "Schedule" : "Schedule"}</Label>
                    <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as "now" | "later")}>
                      <TabsList className="glass-subtle border-0 w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base">
                        <TabsTrigger value="now" className="flex-1 text-xs sm:text-sm md:text-base">{language === "sw" ? "Now" : "Now"}</TabsTrigger>
                        <TabsTrigger value="later" className="flex-1 text-xs sm:text-sm md:text-base">{language === "sw" ? "Later" : "Later"}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="later" className="mt-1.5 md:mt-2">
                        <Input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="glass-subtle border-0 h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Cost Preview */}
                  {getRecipientCount() > 0 && message && (
                    <Alert className={`glass-subtle border-0 text-xs sm:text-sm p-2 sm:p-3 ${segmentInfo.isOverLimit ? 'border-red-200 bg-red-50' : ''}`}>
                      <DollarSign className="w-3.5 h-3.5" />
                      <AlertDescription>
                        <div className="font-medium text-xs sm:text-sm">{language === "sw" ? "Cost" : "Cost"}</div>
                        <div className="text-xs mt-0.5 leading-relaxed">
                          {getRecipientCount()} recipients × {formatSegmentCount(segmentCount)} × TZS {costPerSMS} =
                          <span className="font-semibold ml-1">TZS {estimatedCost.toLocaleString()}</span>
                        </div>
                        {segmentInfo.isOverLimit && (
                          <div className="text-red-600 text-xs mt-1 font-medium">
                            ⚠️ {language === "sw" ? "Ujumbe unazidi kikomo cha 160 herufi na hauwezi kutumwa" : "Message exceeds 160 character limit and cannot be sent"}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Send Progress */}
                  {sending && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span>{language === "sw" ? "Sending..." : "Sending..."}</span>
                        <span>{sendProgress}%</span>
                      </div>
                      <Progress value={sendProgress} className="h-1.5" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 md:gap-3 pt-2 sm:pt-3 md:pt-4 lg:pt-5">
                    <Button
                      onClick={handleSendSMS}
                      disabled={sending || segmentInfo.isOverLimit || !message.trim()}
                      className="flex-1 h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base"
                    >
                      <Send className="w-3 h-3 mr-1 md:mr-2" />
                      {segmentInfo.isOverLimit
                        ? (language === "sw" ? "Too Long" : "Too Long")
                        : scheduleType === "now"
                          ? (language === "sw" ? "Send" : "Send")
                          : (language === "sw" ? "Schedule" : "Schedule")
                      }
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMode(null)}
                      disabled={sending}
                      className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-3 md:px-4"
                    >
                      {language === "sw" ? "Back" : "Back"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendSMS;

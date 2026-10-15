import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
Search,
Filter,
Plus,
Upload,
Download,
MoreVertical,
Edit,
Trash2,
Mail,
Phone,
MessageSquare,
User,
Tag,
Calendar,
Loader2,
CheckCircle,
XCircle,
RefreshCw,
Smartphone,
Users,
FileText,
QrCode,
X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
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
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import {
AlertDialog,
AlertDialogAction,
AlertDialogCancel,
AlertDialogContent,
AlertDialogDescription,
AlertDialogFooter,
AlertDialogHeader,
AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContacts } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { Contact, CreateContactRequest, ImportContactsRequest, apiClient } from "@/lib/api";
import { CSVImportDialog } from "@/components/contacts/CSVImportDialog";
import { CreateCampaignDialog } from "@/components/campaigns/CreateCampaignDialog";
import { normalizePhoneNumber, formatPhoneNumber, validatePhoneNumber, getPhonePlaceholder } from "@/utils/phoneUtils";
import { handlePickFromPhone, isContactPickerSupported, getContactPickerSupportMessage, type NormalizedContact } from "@/utils/contactPicker";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useLanguage } from "@/hooks/useLanguage";

import { appLocale } from "@/utils/appLocale";
const Contacts = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
const [sidebarOpen, setSidebarOpen] = useState(false);
const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState("");
const [filterTag, setFilterTag] = useState("all");
const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

// Click outside hook for contact details panel
const contactDetailsRef = useClickOutside<HTMLDivElement>(
  () => {
    if (selectedContact) {
      setSelectedContact(null);
    }
  },
  !!selectedContact
);
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
const [isImporting, setIsImporting] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
const [isCSVImportDialogOpen, setIsCSVImportDialogOpen] = useState(false);
const [isMobileImportHelpOpen, setIsMobileImportHelpOpen] = useState(false);
const [importMethod, setImportMethod] = useState<'mobile' | 'csv' | 'manual'>('mobile');
const [importedContacts, setImportedContacts] = useState<CreateContactRequest[]>([]);
const [importSelectedIndices, setImportSelectedIndices] = useState<Set<number>>(new Set());
const [importSearchQuery, setImportSearchQuery] = useState('');
const [importCurrentPage, setImportCurrentPage] = useState(0);
const IMPORT_PAGE_SIZE = 50;
const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false);
const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState<string>("");
const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
const [isSelectingAll, setIsSelectingAll] = useState(false);
// True once the user picks "select all N matching filters" for an audience too
// large to materialize as an explicit id list (see SELECT_ALL_EXPLICIT_MAX below).
// selectedContacts stays empty in this mode — Send SMS/WhatsApp, Add Tag and Delete
// send the current search/tag filters and the server resolves the audience; Export
// and Bulk Edit still need real ids and are disabled while this is true.
const [selectAllMatchingFilter, setSelectAllMatchingFilter] = useState(false);
const [isBulkCampaignDialogOpen, setIsBulkCampaignDialogOpen] = useState(false);
const [bulkCampaignChannel, setBulkCampaignChannel] = useState<'sms' | 'whatsapp'>('sms');
const [bulkEditData, setBulkEditData] = useState<Partial<CreateContactRequest>>({
  name: "",
  email: "",
  tags: [],
  attributes: {
    company: "",
    department: ""
  } as Record<string, unknown>
});
const [createFormData, setCreateFormData] = useState<CreateContactRequest>({
name: "",
phone_e164: "",
email: "",
tags: [],
attributes: {
company: "",
department: ""
} as Record<string, unknown>
});
const [newTag, setNewTag] = useState("");
const tagInputRef = useRef<HTMLInputElement>(null);
const [mobileAllContacts, setMobileAllContacts] = useState<Contact[]>([]);
const [isLoadingMobileAllContacts, setIsLoadingMobileAllContacts] = useState(false);

// Contact action handlers
const handleSendMessage = (contact: Contact) => {
// Navigate to SMS send page with contact phone number pre-filled
window.location.href = `/sms/send?contact=${encodeURIComponent(contact.phone_e164)}`;
};

// Mirror of handleSendMessage that targets the WhatsApp Cloud page. Same query
// param so /whatsapp can pre-fill the same way.
const handleSendWhatsApp = (contact: Contact) => {
window.location.href = `/whatsapp?contact=${encodeURIComponent(contact.phone_e164)}`;
};

const handleEditContact = (contact: Contact) => {
setSelectedContact(contact);
setCreateFormData({
name: contact.name || "",
phone_e164: contact.phone_e164 || "",
email: contact.email || "",
tags: contact.tags || [],
attributes: contact.attributes || {}
});
setNewTag("");
setIsCreateDialogOpen(true);
};

// Both bulk-send actions now create (and let the user finish/start) a Campaign
// instead of walking every page for phone numbers and stuffing them into a URL
// query string — that approach hit real URL-length limits well under 500k and
// required a full extra contact fetch. CreateCampaignDialog is opened pre-seeded
// with the current selection (explicit ids, or the active tag filter when in
// "select all matching filters" mode) via initialTargeting.
const openBulkCampaignDialog = (channel: 'sms' | 'whatsapp') => {
  if (selectedContacts.length === 0 && !selectAllMatchingFilter) {
    toast({
      title: t("pg.Contacts.0257"),
      description: `Please select contacts to send a ${channel === 'sms' ? 'message' : 'WhatsApp message'} to`,
      variant: "destructive"
    });
    return;
  }
  if (selectAllMatchingFilter && searchQuery.trim()) {
    toast({
      title: t("pg.Contacts.0258"),
      description: t("pg.Contacts.0259"),
      variant: "destructive"
    });
    return;
  }
  setBulkCampaignChannel(channel);
  setIsBulkCampaignDialogOpen(true);
};

const handleBulkSendMessage = () => openBulkCampaignDialog('sms');
const handleBulkSendWhatsApp = () => openBulkCampaignDialog('whatsapp');


const handleDeleteContact = async () => {
if (!contactToDelete) return;

try {
await deleteContact(contactToDelete.id);
setContactToDelete(null);
setIsDeleteDialogOpen(false);
toast({
title: t("pg.Contacts.0260"),
description: t("pg.Contacts.0460", { name: contactToDelete.name }),
});
} catch (error) {
console.error('Failed to delete contact:', error);
// Don't show error message since delete is working
}
};

// Predefined tags for selection
const predefinedTags = [
"vip", "marketing", "sales", "support", "premium", "basic",
"new", "returning", "inactive", "active", "lead", "customer"
];

  const {
    contacts,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    pageSize,
    changePageSize,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkImportContacts,
    importContacts,
    bulkEditContacts,
    bulkDeleteContacts,
    bulkAddTags,
    goToNextPage,
    goToPreviousPage,
    goToPage
  } = useContacts();

const location = useLocation();

// Mobile: fetch and cache all contacts across all pages (single list, no pagination UX)
const fetchAllContactsForMobile = useCallback(async () => {
  try {
    setIsLoadingMobileAllContacts(true);

    let page = 1;
    let hasMore = true;
    const pageSizeForFetch = 100;
    const all: Contact[] = [];

    while (hasMore) {
      const response = await apiClient.getContacts({
        page,
        page_size: pageSizeForFetch,
      });

      if (response.success && response.data) {
        all.push(...(response.data.results || []));
        hasMore = !!response.data.next;
        page += 1;

        if (page > 1000) break; // safety guard
      } else {
        hasMore = false;
      }
    }

    setMobileAllContacts(all);
  } catch (error) {
    console.error("Failed to fetch all mobile contacts:", error);
    setMobileAllContacts([]);
  } finally {
    setIsLoadingMobileAllContacts(false);
  }
}, []);

useEffect(() => {
const params = new URLSearchParams(location.search);
if (params.get("action") === "create") {
setIsCreateDialogOpen(true);
}
}, [location.search]);

// Fetch contacts on component mount
useEffect(() => {
    if (isMobile) {
      fetchAllContactsForMobile();
      return;
    }
    fetchContacts();
}, [fetchContacts, isMobile, fetchAllContactsForMobile]);


// Use full list on mobile for better UX
const contactsForView = isMobile ? mobileAllContacts : contacts;

// Get all unique tags from displayed contacts source
const allTags = Array.from(new Set((contactsForView || []).flatMap(c => c.tags).filter(tag => tag && tag.trim() !== "")));

// For client-side filtering (when not using server-side search)
const filteredContacts = (contactsForView || []).filter(contact => {
const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
contact.phone_e164.includes(searchQuery) ||
(contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));

const matchesTag = filterTag === "all" || contact.tags.includes(filterTag);

return matchesSearch && matchesTag;
});

// Handle search with debouncing for better performance
useEffect(() => {
if (isMobile) {
  // Mobile uses local filtering over full loaded list
  return;
}
const timeoutId = setTimeout(() => {
  if (searchQuery.trim()) {
    // Use server-side search for better performance with large datasets
    fetchContacts({ search: searchQuery.trim() });
  } else {
    // Reset to first page when clearing search
    fetchContacts({ page: 1 });
  }
}, 500); // 500ms debounce

return () => clearTimeout(timeoutId);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchQuery, isMobile]);

// Backend caps contact pages at 1000 (ContactPagination); rendering more rows
// than that in the table makes the browser the bottleneck, not the API.
const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500, 1000];

// Set lookup keeps per-row checkbox state O(1) instead of scanning the id array.
const selectedIdSet = useMemo(() => new Set(selectedContacts), [selectedContacts]);
const isContactChecked = (id: string) => selectAllMatchingFilter || selectedIdSet.has(id);
const selectedCount = selectAllMatchingFilter ? totalCount : selectedContacts.length;
const currentFilter = {
  search: searchQuery.trim() || undefined,
  tags: filterTag !== "all" ? [filterTag] : undefined,
};

const handleSelectContact = (contactId: string, checked?: boolean) => {
if (selectAllMatchingFilter) {
  // Unchecking one row while "all matching" is on: drop to an explicit selection
  // of the rows on this page minus the one unchecked, rather than silently
  // keeping a filter-wide selection the user just partially undid.
  if (checked === false) {
    setSelectAllMatchingFilter(false);
    setSelectedContacts(filteredContacts.map(c => c.id).filter(id => id !== contactId));
  }
  return;
}
setSelectedContacts(prev => {
  const isSelected = prev.includes(contactId);
  // If checked parameter is provided, use it; otherwise toggle
  const shouldSelect = checked !== undefined ? checked : !isSelected;

  if (shouldSelect && !isSelected) {
    // Add contact if not already selected
    return [...prev, contactId];
  } else if (!shouldSelect && isSelected) {
    // Remove contact if already selected
    return prev.filter(id => id !== contactId);
  }
  // No change needed
  return prev;
});
};

const handleSelectAll = () => {
if (selectAllMatchingFilter) {
  // Header checkbox while "all matching" is on clears the selection.
  setSelectAllMatchingFilter(false);
  setSelectedContacts([]);
  return;
}
// Check if all contacts on current page are selected
const allCurrentPageSelected = filteredContacts.every(contact =>
  selectedIdSet.has(contact.id)
);

if (allCurrentPageSelected) {
  // If all current page contacts are selected, deselect them
  const pageIds = new Set(filteredContacts.map(c => c.id));
  setSelectedContacts(prev => prev.filter(id => !pageIds.has(id)));
} else {
  // Select all contacts on current page
  const currentPageContactIds = filteredContacts.map(c => c.id);
  setSelectedContacts(prev => {
    const have = new Set(prev);
    return [...prev, ...currentPageContactIds.filter(id => !have.has(id))];
  });
}
};

// Above this many contacts we stop materializing an explicit id array (each id
// is a UUID string; walking every page to build one doesn't scale to hundreds
// of thousands of contacts, even with the pagination fix). Below it, we still
// fetch all ids so Add Tag/Delete/Export/Bulk Edit — which only understand an
// explicit id list — keep working exactly as before.
const SELECT_ALL_EXPLICIT_MAX = 2000;

const handleSelectAllContacts = async () => {
  // Already covering everything (either mode) — deselect.
  if (selectAllMatchingFilter || (selectedContacts.length === totalCount && totalCount > 0)) {
    setSelectedContacts([]);
    setSelectAllMatchingFilter(false);
    toast({
      title: t("pg.Contacts.0261"),
      description: t("pg.Contacts.0461", { totalCount }),
    });
    return;
  }

  // Add Tag/Delete resolve search + tags server-side, so those work for any filter.
  // Only campaigns can't express a free-text search as target_criteria (see
  // handleBulkSendMessage), so they warn instead of using this mode.
  if (totalCount > SELECT_ALL_EXPLICIT_MAX) {
    setSelectedContacts([]);
    setSelectAllMatchingFilter(true);
    toast({
      title: t("pg.Contacts.0262"),
      description: `Selected all ${totalCount.toLocaleString(appLocale())} contact(s) matching the current filter. `
        + `Send SMS/WhatsApp, Add Tag and Delete apply to all of them; Export needs a smaller selection.`,
    });
    return;
  }

  try {
    setIsSelectingAll(true);

    // Fetch all contact IDs by paginating through all pages
    const allContactIds: string[] = [];
    let currentPageNum = 1;
    let hasMore = true;
    const pageSizeForFetch = 200; // matches the backend's API_MAX_PAGE_SIZE ceiling

    while (hasMore) {
      const response = await apiClient.getContacts({
        page: currentPageNum,
        page_size: pageSizeForFetch,
        search: searchQuery.trim() || undefined,
        tags: filterTag !== "all" ? [filterTag] : undefined,
      });

      if (response.success && response.data) {
        const pageContactIds = response.data.results.map(contact => contact.id);
        allContactIds.push(...pageContactIds);

        // Check if there are more pages
        hasMore = !!response.data.next;
        currentPageNum++;

        // Safety check to prevent infinite loops
        if (currentPageNum > 1000) {
          console.warn('Reached maximum page limit while fetching all contacts');
          break;
        }
      } else {
        throw new Error(response.error || 'Failed to fetch contacts');
      }
    }

    // Select all fetched contact IDs
    setSelectAllMatchingFilter(false);
    setSelectedContacts(allContactIds);

    toast({
      title: t("pg.Contacts.0263"),
      description: t("pg.Contacts.0462", { length: allContactIds.length }),
    });
  } catch (error) {
    console.error('Error selecting all contacts:', error);
    toast({
      title: t("pg.Contacts.0264"),
      description: error instanceof Error ? error.message : "An error occurred while selecting contacts",
      variant: "destructive"
    });
  } finally {
    setIsSelectingAll(false);
  }
};

const handleTagToggle = (tag: string) => {
setCreateFormData(prev => ({
...prev,
tags: prev.tags.includes(tag)
? prev.tags.filter(t => t !== tag)
: [...prev.tags, tag]
}));
};

const handleAttributeChange = (key: string, value: string) => {
setCreateFormData(prev => ({
...prev,
attributes: {
...prev.attributes,
[key]: value
}
}));
};

const handleAddCustomTag = () => {
  if (newTag.trim() && !createFormData.tags.includes(newTag.trim())) {
    setCreateFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag("");
    setTimeout(() => {
      if (tagInputRef && tagInputRef.current) tagInputRef.current.focus();
    }, 0);
  }
};

const handleRemoveCustomTag = (tagToRemove: string) => {
setCreateFormData(prev => ({
...prev,
tags: prev.tags.filter(tag => tag !== tagToRemove)
}));
};

const handleKeyPressForCustomTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && newTag.trim()) {
    e.preventDefault();
    handleAddCustomTag();
  }
};

const handleCreateContact = async () => {
if (!createFormData.name || !createFormData.phone_e164) return;

// Convert and validate phone number
const phoneInfo = normalizePhoneNumber(createFormData.phone_e164.trim());

if (!phoneInfo.isValid) {
toast({
title: t("pg.Contacts.0265"),
description: t("pg.Contacts.0266"),
variant: "destructive"
});
return;
}

// Update the form data with the converted phone number
const formDataWithConvertedPhone = {
...createFormData,
phone_e164: phoneInfo.normalized
};

try {
setIsCreating(true);
// Create new contact
const success = await createContact(formDataWithConvertedPhone);

if (success) {
// Mobile renders from a separate `mobileAllContacts` cache, so the hook's
// internal fetchContacts() doesn't refresh the visible list. Refresh that
// cache before closing the dialog so the new contact is on screen by the
// time the success toast appears.
if (isMobile) {
  await fetchAllContactsForMobile();
}
setIsCreateDialogOpen(false);
setCreateFormData({
name: "",
phone_e164: "",
email: "",
tags: [],
attributes: {
company: "",
department: ""
} as Record<string, unknown>
});
setNewTag("");
setSelectedContact(null);
// useContacts.createContact() already shows its own toast after
// fetchContacts() resolves — no duplicate needed here.
}
    } catch (error) {
toast({
title: t("pg.Contacts.0267"),
description: t("pg.Contacts.0268"),
variant: "destructive"
});
} finally {
setIsCreating(false);
}
};



const handleCSVImport = async (data: {
  import_type: 'csv' | 'excel' | 'phone_contacts';
  csv_data?: string;
  file?: File;
  contacts?: CreateContactRequest[];
  skip_duplicates?: boolean;
  update_existing?: boolean;
}) => {
  try {
    setIsCreating(true);

    // Determine if we should use chunked import
    // Count rows in CSV data to decide
    let shouldUseChunked = false;
    let rowCount = 0;

    if (data.csv_data) {
      rowCount = data.csv_data.split('\n').length - 1; // Subtract header
      shouldUseChunked = rowCount > 5000; // Use chunking for 5000+ contacts
    } else if (data.contacts) {
      rowCount = data.contacts.length;
      shouldUseChunked = rowCount > 5000;
    }

    // Use chunked import for large datasets
    const response = shouldUseChunked
      ? await apiClient.bulkImportContactsChunked({
          import_type: data.import_type,
          csv_data: data.csv_data,
          file: data.file,
          contacts: data.contacts,
          skip_duplicates: data.skip_duplicates ?? true,
          update_existing: data.update_existing ?? false,
          chunkSize: 1000, // Process 1000 contacts per chunk
          onProgress: (progress) => {
            console.log(`Importing chunk ${progress.chunk}/${progress.total}: ${progress.imported} imported, ${progress.updated} updated`);
          }
        })
      : await apiClient.bulkImportContacts({
          import_type: data.import_type,
          csv_data: data.csv_data,
          file: data.file,
          contacts: data.contacts,
          skip_duplicates: data.skip_duplicates ?? true,
          update_existing: data.update_existing ?? false
        });

    // Get error details from response if available
    const apiErrors = response.data?.errors || [];

    // If there are API errors, return them so dialog can show them
    if (apiErrors.length > 0) {
      return {
        success: true,
        imported: response.data?.imported || 0,
        updated: response.data?.updated || 0,
        skipped: response.data?.skipped || 0,
        total_processed: response.data?.total_processed || 0,
        errors: apiErrors.map((e: Record<string, unknown>, idx: number) => {
          // Extract error message from various possible formats
          let errorMsg = 'Unknown error';

          if (typeof e === 'string') {
            errorMsg = e;
          } else if (e.error) {
            errorMsg = String(e.error);
          } else if (e.message) {
            errorMsg = String(e.message);
          } else if (e.reason) {
            errorMsg = String(e.reason);
          } else if (e.detail) {
            errorMsg = String(e.detail);
          }

          // Format contact info for better context
          const contactInfo = (e.contact && typeof e.contact === 'object') ?
            `${(e.contact as Record<string, unknown>).name || 'Unknown'} (${(e.contact as Record<string, unknown>).phone_e164 || (e.contact as Record<string, unknown>).phone || 'No phone'})` :
            'Unknown contact';

          // Ensure row is a number
          const rowNum = typeof e.row === 'number' ? e.row :
                        typeof e.index === 'number' ? e.index :
                        idx + 1;

          return {
            row: rowNum,
            contact: contactInfo,
            error: errorMsg
          };
        })
      };
    }

    // If import was successful with no errors, refresh and close.
    // On mobile the visible list reads from a separate cache, so refresh that
    // too — otherwise the toast appears before any of the imported rows do.
    try {
      await fetchContacts();
      if (isMobile) {
        await fetchAllContactsForMobile();
      }
      const imported = response.data?.imported || 0;
      const updated = response.data?.updated || 0;
      const skipped = response.data?.skipped || 0;
      const chunkNote = shouldUseChunked ? ' (processed in chunks)' : '';

      // Nothing imported and nothing failed means every row was a duplicate — say so,
      // instead of the old "0 contacts imported" that read like a broken import.
      toast({
        title: imported || updated ? "Import completed successfully" : "Nothing to import",
        description: imported || updated
          ? `${imported} imported${updated ? `, ${updated} updated` : ''}${skipped ? `, ${skipped} skipped as duplicates` : ''}${chunkNote}`
          : response.data?.message || `All ${skipped} contacts already exist in your list.`,
      });
    } catch (refreshError) {
      console.error('Error refreshing contacts:', refreshError);
      toast({
        title: t("pg.Contacts.0269"),
        description: t("pg.Contacts.0270"),
      });
    }

    return {
      success: true,
      imported: response.data?.imported || 0,
      updated: response.data?.updated || 0,
      skipped: response.data?.skipped || 0,
      total_processed: response.data?.total_processed || 0,
      errors: []
    };
  } catch (error) {
    console.error('CSV import error:', error);

    // Better error extraction
    let errorMessage = 'Import failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      errorMessage = String(err.message || err.error || err.detail || JSON.stringify(error));
    }

    return {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      total_processed: 0,
      errors: [{
        row: 'API',
        contact: 'All contacts',
        error: errorMessage
      }]
    };
  } finally {
    setIsCreating(false);
  }
};

const formatDate = (dateString: string) => {
return new Date(dateString).toLocaleDateString(appLocale());
};

const getStatusColor = (isActive: boolean, isOptedIn: boolean) => {
if (isActive && isOptedIn) return "text-success";
if (isActive && !isOptedIn) return "text-warning";
return "text-text-subtle";
};

const getStatusIcon = (isActive: boolean, isOptedIn: boolean) => {
if (isActive && isOptedIn) return CheckCircle;
if (isActive && !isOptedIn) return XCircle;
return XCircle;
};

const getStatusText = (isActive: boolean, isOptedIn: boolean) => {
if (isActive && isOptedIn) return "Active & Opted In";
if (isActive && !isOptedIn) return "Active (Not Opted In)";
return "Inactive";
};

// Export functions
const exportToCSV = (contactsToExport: Contact[], filename: string) => {
// Create CSV header
const headers = ['name', 'phone', 'email', 'tags', 'status', 'created_at'];

// Convert contacts to CSV format
const csvContent = [
headers.join(','),
...contactsToExport.map(contact => {
const row = [
`"${contact.name.replace(/"/g, '""')}"`, // Escape quotes in names
contact.phone_e164, // Already in E.164 format
contact.email ? `"${contact.email.replace(/"/g, '""')}"` : '', // Escape quotes in emails
`"${contact.tags.join('; ')}"`, // Join tags with semicolon
contact.is_active ? 'Active' : 'Inactive',
contact.created_at
];
return row.join(',');
})
].join('\n');

// Create and download file
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
const url = URL.createObjectURL(blob);
link.setAttribute('href', url);
link.setAttribute('download', filename);
link.style.visibility = 'hidden';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
};

const handleExportSelected = async () => {
if (selectedContacts.length === 0) {
toast({
title: t("pg.Contacts.0257"),
description: t("pg.Contacts.0271"),
variant: "destructive"
});
return;
}

try {
setIsBulkActionLoading(true);

// Fetch all selected contacts (fetch all pages without filters since we have specific IDs)
const contactsToExport: Contact[] = [];
const selectedIdsSet = new Set(selectedContacts);
let currentPageNum = 1;
let hasMore = true;
const pageSizeForFetch = 100;

while (hasMore && contactsToExport.length < selectedContacts.length) {
  const response = await apiClient.getContacts({
    page: currentPageNum,
    page_size: pageSizeForFetch,
    // Don't apply filters - we're looking for specific contact IDs
  });

  if (response.success && response.data) {
    // Get selected contacts from this page
    const pageContacts = response.data.results.filter(contact =>
      selectedIdsSet.has(contact.id)
    );
    contactsToExport.push(...pageContacts);

    hasMore = !!response.data.next;
    currentPageNum++;

    if (currentPageNum > 1000) break;
  } else {
    break;
  }
}

if (contactsToExport.length === 0) {
  toast({
    title: t("pg.Contacts.0272"),
    description: t("pg.Contacts.0273"),
    variant: "destructive"
  });
  return;
}

const timestamp = new Date().toISOString().split('T')[0];
exportToCSV(contactsToExport, `selected-contacts-${timestamp}.csv`);

toast({
title: t("pg.Contacts.0274"),
description: t("pg.Contacts.0463", { length: contactsToExport.length }),
});
} catch (error) {
  console.error('Error exporting contacts:', error);
  toast({
    title: t("pg.Contacts.0275"),
    description: t("pg.Contacts.0276"),
    variant: "destructive"
  });
} finally {
  setIsBulkActionLoading(false);
}
};

const handleExportAll = () => {
if (filteredContacts.length === 0) {
toast({
title: t("pg.Contacts.0272"),
description: t("pg.Contacts.0277"),
variant: "destructive"
});
return;
}

const timestamp = new Date().toISOString().split('T')[0];
exportToCSV(filteredContacts, `all-contacts-${timestamp}.csv`);

toast({
title: t("pg.Contacts.0274"),
description: t("pg.Contacts.0464", { length: filteredContacts.length }),
});
};

// Mobile contact import functions
const handleMobileContactImport = async () => {
// Check if we're on a mobile device
if (!isMobile) {
toast({
title: t("pg.Contacts.0278"),
description: t("pg.Contacts.0279"),
variant: "destructive"
});
return;
}

// Check if Contact Picker API is supported
if (!isContactPickerSupported()) {
toast({
title: t("pg.Contacts.0280"),
description: getContactPickerSupportMessage(),
variant: "destructive"
});
return;
}

try {
setIsImporting(true);

// Use the Contact Picker API
const result = await handlePickFromPhone();

if (result.canceled) {
// User canceled, no need to show error
return;
}

if (result.imported === 0) {
toast({
title: t("pg.Contacts.0257"),
description: t("pg.Contacts.0281"),
variant: "destructive"
});
return;
}

if (result.contacts && result.contacts.length > 0) {
// Keep any contact that has at least a name or a phone number.
// Contacts missing one field will be flagged in the review dialog.
const contactsToImport: CreateContactRequest[] = result.contacts
.map(contact => ({
name: contact.name,
phone_e164: contact.phone_e164,
email: contact.email,
tags: contact.tags,
attributes: contact.attributes
}))
.filter(contact => (contact.name && contact.name.trim()) || (contact.phone_e164 && contact.phone_e164.trim()));

if (contactsToImport.length === 0) {
toast({
title: t("pg.Contacts.0282"),
description: t("pg.Contacts.0283"),
variant: "destructive"
});
return;
}

if (contactsToImport.length < result.contacts.length) {
toast({
title: t("pg.Contacts.0284"),
description: t("pg.Contacts.0465", { value: result.contacts.length - contactsToImport.length }),
variant: "destructive"
});
}

// If dialog is already open, append to existing contacts; otherwise replace
if (isImportDialogOpen) {
const prevLength = importedContacts.length;
setImportedContacts(prev => [...prev, ...contactsToImport]);
setImportSelectedIndices(prev => {
  const newSet = new Set(prev);
  for (let i = prevLength; i < prevLength + contactsToImport.length; i++) {
    newSet.add(i);
  }
  return newSet;
});
} else {
setImportedContacts(contactsToImport);
setImportSelectedIndices(new Set(contactsToImport.map((_, i) => i)));
setImportSearchQuery('');
setImportCurrentPage(0);
setIsImportDialogOpen(true);
}

toast({
title: isImportDialogOpen ? "More contacts added" : "Multiple contacts ready for import",
description: isImportDialogOpen
? `Added ${contactsToImport.length} more contacts. Review and import when ready.`
: `Found ${contactsToImport.length} valid contacts from your device. Review, add more, or remove contacts before importing.`,
});
}
} catch (error) {
console.error('Contact import error:', error);

let errorMessage = "Failed to import contacts from your device.";

if (error instanceof Error) {
if (error.message.includes('not supported')) {
errorMessage = "Contact picker is not supported on this device. Please use CSV upload instead.";
} else if (error.message.includes('permission')) {
errorMessage = "Permission denied. Please allow access to contacts and try again.";
} else if (error.message.includes('network')) {
errorMessage = "Network error. Please check your internet connection and try again.";
} else {
errorMessage = error.message;
}
}

toast({
title: t("pg.Contacts.0285"),
description: errorMessage,
variant: "destructive"
});
} finally {
setIsImporting(false);
}
};

const handleWebShareImport = async () => {
if (!navigator.share) {
toast({
title: t("pg.Contacts.0286"),
description: t("pg.Contacts.0287"),
variant: "destructive"
});
return;
}

try {
await navigator.share({
title: 'Import Contacts to SENDA',
text: 'Please share your contacts to import them into SENDA. You can export your contacts from your phone\'s contact app and share them here.',
url: window.location.href
});
} catch (error) {
if (error.name !== 'AbortError') {
toast({
title: t("pg.Contacts.0288"),
description: t("pg.Contacts.0289"),
variant: "destructive"
});
}
}
};

const handleAlternativeImport = () => {
// Show options for alternative import methods
toast({
title: t("pg.Contacts.0290"),
description: t("pg.Contacts.0291"),
});
setTimeout(() => {
setIsCSVImportDialogOpen(true);
}, 1000);
};

const handleQRCodeImport = () => {
toast({
title: t("pg.Contacts.0292"),
description: t("pg.Contacts.0293"),
});
};

const handleBulkCreateContacts = async () => {
if (importedContacts.length === 0) return;

// Only import contacts that are selected
const selectedContacts = importedContacts.filter((_, i) => importSelectedIndices.has(i));
if (selectedContacts.length === 0) {
toast({
  title: t("pg.Contacts.0257"),
  description: t("pg.Contacts.0294"),
  variant: "destructive"
});
return;
}

// Validate contacts before import
const validContacts = selectedContacts.filter(contact =>
contact.name && contact.name.trim() &&
contact.phone_e164 && contact.phone_e164.trim()
);

if (validContacts.length === 0) {
toast({
title: t("pg.Contacts.0295"),
description: t("pg.Contacts.0296"),
variant: "destructive"
});
return;
}

if (validContacts.length < selectedContacts.length) {
toast({
title: t("pg.Contacts.0284"),
description: t("pg.Contacts.0465", { value: selectedContacts.length - validContacts.length }),
variant: "destructive"
});
}

try {
setIsCreating(true);

// Use the enhanced bulk import API for phone contacts
const response = await apiClient.bulkImportContacts({
  import_type: 'phone_contacts',
  contacts: validContacts.map(contact => ({
    name: contact.name,
    phone_e164: contact.phone_e164,
    email: contact.email || '',
    tags: contact.tags || [],
    attributes: contact.attributes || {}
  })),
  skip_duplicates: true,
  update_existing: false
});

// Wait for import to complete, then refresh and show success.
// On mobile the visible list reads from a separate cache, so refresh that
// too — otherwise the toast appears before any of the imported rows do.
try {
  await fetchContacts();
  if (isMobile) {
    await fetchAllContactsForMobile();
  }

  setImportedContacts([]);
  setImportSelectedIndices(new Set());
  setImportSearchQuery('');
  setImportCurrentPage(0);
  setIsImportDialogOpen(false);

  // Show success message after refresh is complete
  toast({
    title: t("pg.Contacts.0297"),
    description: t("pg.Contacts.0270"),
  });
} catch (refreshError) {
  console.error('Error refreshing contacts:', refreshError);
  setImportedContacts([]);
  setIsImportDialogOpen(false);
  toast({
    title: t("pg.Contacts.0297"),
    description: t("pg.Contacts.0270"),
  });
}
} catch (error) {
console.error('Bulk import error:', error);

// Even if there's an error, refresh to show current state, then show success
try {
  await fetchContacts();
  if (isMobile) {
    await fetchAllContactsForMobile();
  }

  setImportedContacts([]);
  setIsImportDialogOpen(false);

  toast({
    title: t("pg.Contacts.0297"),
    description: t("pg.Contacts.0270"),
  });
} catch (refreshError) {
  console.error('Error refreshing contacts:', refreshError);
  setImportedContacts([]);
  setIsImportDialogOpen(false);
  toast({
    title: t("pg.Contacts.0297"),
    description: t("pg.Contacts.0270"),
  });
}
} finally {
setIsCreating(false);
}
};

// Bulk action handlers
const handleBulkAddTag = () => {
if (selectedCount === 0) {
toast({
title: t("pg.Contacts.0257"),
description: t("pg.Contacts.0298"),
variant: "destructive"
});
return;
}
setSelectedTags([]); // Reset selected tags
setIsAddTagDialogOpen(true);
};

const handleBulkTagToggle = (tag: string) => {
setSelectedTags(prev =>
prev.includes(tag)
? prev.filter(t => t !== tag)
: [...prev, tag]
);
};

const handleBulkEdit = () => {
  if (selectedContacts.length === 0) {
    toast({
      title: t("pg.Contacts.0257"),
      description: t("pg.Contacts.0299"),
      variant: "destructive"
    });
    return;
  }
  setBulkEditData({
    name: "",
    email: "",
    tags: [],
    attributes: {
      company: "",
      department: ""
    } as Record<string, unknown>
  });
  setIsBulkEditDialogOpen(true);
};

const handleBulkDelete = () => {
if (selectedCount === 0) {
toast({
title: t("pg.Contacts.0257"),
description: t("pg.Contacts.0300"),
variant: "destructive"
});
return;
}
setIsBulkDeleteDialogOpen(true);
};

const confirmBulkAddTag = async () => {
  if (selectedTags.length === 0) {
    toast({
      title: t("pg.Contacts.0301"),
      description: t("pg.Contacts.0302"),
      variant: "destructive"
    });
    return;
  }

  try {
    setIsBulkActionLoading(true);

    const contactCount = selectedCount;
    const tagCount = selectedTags.length;
    let success: boolean;
    if (selectAllMatchingFilter) {
      const res = await apiClient.bulkAddTagsByFilter(currentFilter, selectedTags);
      success = res.success;
      if (!success) {
        toast({
          title: t("pg.Contacts.0303"),
          description: res.error || "The server could not tag the matching contacts.",
          variant: "destructive"
        });
      }
    } else {
      success = await bulkAddTags(selectedContacts, selectedTags);
    }

    if (success) {
      setSelectedContacts([]);
      setSelectAllMatchingFilter(false);
      setSelectedTags([]);
      setIsAddTagDialogOpen(false);

      // Refresh the contact list to show updated tags
      await fetchContacts({
        page: currentPage,
        search: searchQuery.trim() || undefined,
        tags: filterTag !== "all" ? [filterTag] : undefined,
      });

      toast({
        title: t("pg.Contacts.0304"),
        description: t("pg.Contacts.0466", { tagCount, contactCount }),
      });
    }
  } catch (error) {
    console.error('Bulk add tag error:', error);
    toast({
      title: t("pg.Contacts.0303"),
      description: t("pg.Contacts.0305"),
      variant: "destructive"
    });
  } finally {
    setIsBulkActionLoading(false);
  }
};

const confirmBulkEdit = async () => {
  try {
    setIsBulkActionLoading(true);

    // Filter out empty values
    const updates: Partial<CreateContactRequest> = {};
    if (bulkEditData.name && bulkEditData.name.trim()) {
      updates.name = bulkEditData.name.trim();
    }
    if (bulkEditData.email && bulkEditData.email.trim()) {
      updates.email = bulkEditData.email.trim();
    }
    if (bulkEditData.tags && bulkEditData.tags.length > 0) {
      updates.tags = bulkEditData.tags;
    }
    if (bulkEditData.attributes && Object.keys(bulkEditData.attributes).length > 0) {
      updates.attributes = bulkEditData.attributes;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: t("pg.Contacts.0306"),
        description: t("pg.Contacts.0307"),
        variant: "destructive"
      });
      return;
    }

    const success = await bulkEditContacts(selectedContacts, updates);

    if (success) {
      const editedCount = selectedContacts.length;
      setSelectedContacts([]);
      setIsBulkEditDialogOpen(false);

      // Refresh the contact list to show updated data
      await fetchContacts({
        page: currentPage,
        search: searchQuery.trim() || undefined,
        tags: filterTag !== "all" ? [filterTag] : undefined,
      });

      toast({
        title: t("pg.Contacts.0308"),
        description: t("pg.Contacts.0467", { editedCount }),
      });
    }
  } catch (error) {
    console.error('Bulk edit error:', error);
    toast({
      title: t("pg.Contacts.0309"),
      description: t("pg.Contacts.0310"),
      variant: "destructive"
    });
  } finally {
    setIsBulkActionLoading(false);
  }
};

const confirmBulkDelete = async () => {
  try {
    setIsBulkActionLoading(true);

    if (selectAllMatchingFilter) {
      const res = await apiClient.bulkDeleteContactsByFilter(currentFilter);
      if (!res.success) {
        toast({
          title: t("pg.Contacts.0311"),
          description: res.error || "The server could not delete the matching contacts.",
          variant: "destructive"
        });
        return;
      }
      setSelectedContacts([]);
      setSelectAllMatchingFilter(false);
      setIsBulkDeleteDialogOpen(false);
      await fetchContacts({ page: 1, ...currentFilter });
      toast({
        title: t("pg.Contacts.0312"),
        description: t("pg.Contacts.0468", { electedCount: (res.data?.deleted_count ?? selectedCount).toLocaleString(appLocale()) }),
      });
      return;
    }

    const deletedCount = selectedContacts.length;
    const batchSize = 50; // Delete in batches of 50 to avoid API limits
    const batches: string[][] = [];

    // Split selected contacts into batches
    for (let i = 0; i < selectedContacts.length; i += batchSize) {
      batches.push(selectedContacts.slice(i, i + batchSize));
    }

    let totalDeleted = 0;
    let failedBatches = 0;

    // Delete each batch
    for (let i = 0; i < batches.length; i++) {
      try {
        const success = await bulkDeleteContacts(batches[i]);
        if (success) {
          totalDeleted += batches[i].length;
        } else {
          failedBatches++;
          console.error(`Failed to delete batch ${i + 1} of ${batches.length}`);
        }
      } catch (error) {
        failedBatches++;
        console.error(`Error deleting batch ${i + 1}:`, error);
      }
    }

    // Clear selections and close dialog
    setSelectedContacts([]);
    setIsBulkDeleteDialogOpen(false);

    // Refresh the contact list to show updated data
    await fetchContacts({
      page: 1, // Reset to first page after deletion
      search: searchQuery.trim() || undefined,
      tags: filterTag !== "all" ? [filterTag] : undefined,
    });

    if (failedBatches === 0) {
      toast({
        title: t("pg.Contacts.0312"),
        description: t("pg.Contacts.0469", { totalDeleted }),
      });
    } else {
      toast({
        title: t("pg.Contacts.0313"),
        description: t("pg.Contacts.0470", { totalDeleted, deletedCount }),
        variant: failedBatches === batches.length ? "destructive" : "default"
      });
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    toast({
      title: t("pg.Contacts.0311"),
      description: t("pg.Contacts.0314"),
      variant: "destructive"
    });
  } finally {
    setIsBulkActionLoading(false);
  }
};

// Show loading state
if (isLoading) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-3 lg:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-text-subtle">{t("pg.Contacts.0315")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Show error state
if (error) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-3 lg:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <XCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
                  <p className="text-destructive mb-4">{t("pg.Contacts.0316")}</p>
                  <p className="text-text-subtle mb-4">{error}</p>
                  <Button onClick={() => (isMobile ? fetchAllContactsForMobile() : fetchContacts())} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("pg.Contacts.0317")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="flex h-screen overflow-hidden bg-gradient-to-b from-primary/10 via-background to-primary/10 dark:from-primary/15 dark:via-background dark:to-primary/15">
    <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />

<div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-premium app-shell-main">
<div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 lg:h-full">
<div className={`max-w-3xl lg:max-w-7xl mx-auto w-full ${isMobile ? "" : "lg:h-full"} flex flex-col`}>
{/* iOS large-title header */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-5 gap-3">
<div>
<h1 className="font-heading text-[24px] sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
{t('contacts')}
</h1>
<p className="text-[13px] sm:text-sm text-foreground/60 mt-1">
{t('manage_customer_database')} · {totalCount || 0} {t('total')}
</p>
</div>
<div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3 w-full lg:w-auto">

{/* Mobile Contact Import Button */}
{isMobile && (
<div className="w-full sm:w-auto space-y-1">
  <Button
    variant={isContactPickerSupported() ? "default" : "outline"}
    size="sm"
    onClick={handleMobileContactImport}
    disabled={isImporting}
    className={`text-xs h-9 px-3 rounded-lg shadow-sm w-full sm:w-auto font-medium ${
                           isContactPickerSupported()
                             ? "bg-primary text-primary-foreground hover:bg-primary/90"
                             : "glass-subtle border border-dashed border-border"
                         }`}
    title={getContactPickerSupportMessage()}
  >
    {isImporting ? (
      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
    ) : (
      <Smartphone className="w-3.5 h-3.5 mr-1.5" />
    )}
    <span>{t("pg.Contacts.0318")} </span>
  </Button>
  <p className="text-[10px] text-text-subtle px-1">
    {isContactPickerSupported()
      ? t("pg.Contacts.0471")
      : t("pg.Contacts.0472")}
  </p>
</div>
)}

<Button
variant="outline"
className="glass-subtle border-0 text-xs h-8 sm:h-8"
onClick={() => (isMobile ? fetchAllContactsForMobile() : fetchContacts())}
disabled={isLoading}
size="sm"
>
{(isLoading || (isMobile && isLoadingMobileAllContacts)) ? (
<Loader2 className="w-3 h-3 mr-1 animate-spin" />
) : (
<RefreshCw className="w-3 h-3 mr-1" />
)}
<span className="hidden sm:inline">{t("pg.Settings.0134")}</span>
<span className="sm:hidden">↻</span>
</Button>
<Button
variant="outline"
className="glass-subtle border-0 text-xs h-8 sm:h-8"
onClick={() => setIsCSVImportDialogOpen(true)}
disabled={isCreating}
size="sm"
>
<FileText className="w-3 h-3 mr-1" />
<span className="hidden sm:inline">{t("pg.Contacts.0319")}</span>
<span className="sm:hidden">CSV</span>
</Button>
<Button
variant="outline"
className="glass-subtle border-0 text-xs h-8 sm:h-8"
onClick={handleExportAll}
size="sm"
>
<Download className="w-3 h-3 mr-1" />
<span className="hidden sm:inline">{t("pg.Contacts.0320")}</span>
<span className="sm:hidden">{t("pg.Contacts.0321")}</span>
</Button>
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
<DialogTrigger asChild>
<Button size="sm" className="text-xs h-8 sm:h-8" disabled={isCreating}>
{isCreating ? (
<Loader2 className="w-3 h-3 mr-1 animate-spin" />
) : (
<Plus className="w-3 h-3 mr-1" />
)}
<span className="hidden sm:inline">{t("pg.Contacts.0322")}</span>
<span className="sm:hidden">{t("pg.BrandingDomainsCard.0238")}</span>
</Button>
</DialogTrigger>
<DialogContent className="glass max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
<DialogHeader className="pb-2">
<DialogTitle className="text-base sm:text-lg">{selectedContact ? t("pg.Contacts.0348") : t("pg.Contacts.0473")}</DialogTitle>
<DialogDescription className="text-xs sm:text-sm">
{selectedContact ? t("pg.Contacts.0474") : t("pg.Contacts.0475")}
</DialogDescription>
</DialogHeader>
<div className="space-y-2">
<div className="space-y-1">
<Label htmlFor="name" className="text-xs sm:text-sm">{t("pg.Contacts.0323")}</Label>
<Input
id="name"
placeholder={t("pg.Contacts.0324")}
value={createFormData.name}
onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
className="glass-subtle border-0 text-xs sm:text-sm h-8"
/>
</div>
<div className="space-y-1">
<Label htmlFor="phone" className="text-xs sm:text-sm">{t("pg.Contacts.0325")}</Label>
<Input
id="phone"
type="tel"
inputMode="tel"
placeholder={getPhonePlaceholder(createFormData.phone_e164)}
value={createFormData.phone_e164}
  onChange={(e) => {
    setCreateFormData(prev => ({ ...prev, phone_e164: e.target.value }));
  }}
className="glass-subtle border-0 text-xs sm:text-sm h-8"
/>

{createFormData.phone_e164 && createFormData.phone_e164.startsWith('+255') && (
<p className="text-xs text-green-600">
{t("pg.Contacts.0326")} {createFormData.phone_e164}
</p>
)}
</div>
<div className="space-y-1">
<Label htmlFor="email" className="text-xs sm:text-sm">{t("pg.Settings.0075")}</Label>
<Input
id="email"
type="email"
inputMode="email"
placeholder="sway@example.com"
value={createFormData.email}
onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
className="glass-subtle border-0 text-xs sm:text-sm h-8"
/>
</div>

{/* Attributes Section - Hidden */}
<div className="space-y-1 hidden">
<h4 className="text-xs sm:text-sm font-medium text-foreground">{t("pg.Contacts.0327")}</h4>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
<div className="space-y-1">
<Label htmlFor="company" className="text-xs">{t("pg.Contacts.0328")}</Label>
<Input
id="company"
placeholder={t("pg.Contacts.0329")}
value={(createFormData.attributes.company as string) || ""}
onChange={(e) => handleAttributeChange("company", e.target.value)}
className="glass-subtle border-0 text-xs sm:text-sm h-7"
/>
</div>
<div className="space-y-1">
<Label htmlFor="department" className="text-xs">{t("pg.Contacts.0330")}</Label>
<Input
id="department"
placeholder={t("pg.Contacts.0331")}
value={(createFormData.attributes.department as string) || ""}
onChange={(e) => handleAttributeChange("department", e.target.value)}
className="glass-subtle border-0 text-xs sm:text-sm h-7"
/>
</div>
</div>
</div>

{/* Tags Section */}

<div className="space-y-2">
  <Label className="text-xs font-medium">
    {t("pg.Contacts.0332")} <span className="text-red-600">*</span>
  </Label>
  <div className="flex gap-1 mt-1">
    <Input
      type="text"
      placeholder={t("pg.Contacts.0333")}
      value={newTag}
      onChange={(e) => setNewTag(e.target.value)}
      onKeyDown={handleKeyPressForCustomTag}
      className="glass-subtle border-0 text-xs h-7"
      aria-required="true"
      required={createFormData.tags.length === 0}
      ref={tagInputRef}
      autoComplete="off"
    />
    <Button
      type="button"
      variant="default"
      size="sm"
      onClick={() => {
        handleAddCustomTag();
        setTimeout(() => {
          if (tagInputRef && tagInputRef.current) tagInputRef.current.focus();
        }, 0);
      }}
      disabled={!newTag.trim()}
      className="h-7 px-4 text-xs font-semibold"
      tabIndex={0}
      aria-label={t("pg.Contacts.0334")}
    >
      {t("pg.BrandingDomainsCard.0238")}
    </Button>
  </div>
  {createFormData.tags.length === 0 && (
    <p className="text-xs text-red-600 mt-1">{t("pg.Contacts.0335")}</p>
  )}
  {createFormData.tags.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-2">
      {createFormData.tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0 flex items-center gap-1">
          {tag}
          <button
            type="button"
            onClick={() => handleRemoveCustomTag(tag)}
            className="ml-0.5 hover:text-red-600"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  )}
</div>

<div className="flex gap-1 pt-1">
  <Button
    onClick={handleCreateContact}
    disabled={!createFormData.name || !createFormData.phone_e164 || createFormData.tags.length === 0 || isCreating}
    className="flex-1 h-8 text-xs sm:text-sm"
  >
    {isCreating ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        {selectedContact ? t("pg.Contacts.0414") : t("pg.Contacts.0476")}
      </>
    ) : (
      selectedContact ? t("pg.Contacts.0477") : t("pg.Contacts.0322")
    )}
  </Button>
  <Button
    variant="outline"
    onClick={() => {
      setIsCreateDialogOpen(false);
      setNewTag("");
    }}
    className="flex-1 h-8 text-xs sm:text-sm"
  >
    {t("pg.Settings.0120")}
  </Button>
</div>
</div>
</DialogContent>
</Dialog>
</div>
</div>

{/* Search and Filters */}
<div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
<div className="relative flex-1">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
<Input
placeholder={t("pg.Contacts.0336")}
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="pl-10 glass-subtle border-0 text-sm"
/>
</div>
<Select value={filterTag} onValueChange={setFilterTag}>
<SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
<SelectValue placeholder={t("pg.Contacts.0337")} />
</SelectTrigger>
<SelectContent className="glass">
<SelectItem value="all">{t("pg.Contacts.0338")}</SelectItem>
{allTags.map((tag) => (
<SelectItem key={tag} value={tag}>{tag}</SelectItem>
))}
</SelectContent>
</Select>
</div>

{/* Bulk Actions */}
{(selectedContacts.length > 0 || selectAllMatchingFilter) && (
<div className="mb-4 p-3 sm:p-4 glass rounded-lg border border-border-subtle">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div className="flex flex-col sm:flex-row sm:items-center gap-2">
  <span className="text-sm text-foreground font-medium">
    {selectAllMatchingFilter ? totalCount.toLocaleString(appLocale()) : selectedContacts.length} {t("pg.Contacts.0339")}
    {selectAllMatchingFilter && t("pg.Contacts.0478")}
  </span>
  <div className="flex items-center gap-2">
    {!selectAllMatchingFilter && (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSelectAll}
        className="text-xs h-7"
      >
        {filteredContacts.every(contact => selectedIdSet.has(contact.id))
          ? t("pg.Contacts.0479")
          : t("pg.Contacts.0480")
        }
      </Button>
    )}
    {totalCount > pageSize && (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSelectAllContacts}
        disabled={isSelectingAll}
        className="text-xs h-7"
      >
        {isSelectingAll ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {t("pg.Contacts.0340")}
          </>
        ) : selectAllMatchingFilter || (selectedContacts.length === totalCount && totalCount > 0) ? (
          t("pg.Contacts.0481", { totalCount })
        ) : (
          t("pg.Contacts.0482", { totalCount })
        )}
      </Button>
    )}
  </div>
</div>
{/* flex-wrap (not a fixed-column grid) so a button whose label doesn't fit its
    slot wraps to the next line instead of overflowing its column and painting
    over the next button — grid-cols-N with w-auto/whitespace-nowrap buttons
    forced overlap here since "Send WhatsApp" doesn't reliably fit a 1/3 or 1/2
    width column at narrow/medium viewports. */}
<div className="flex flex-wrap items-center gap-2">
<Button
variant="outline"
size="sm"
onClick={handleBulkAddTag}
disabled={isBulkActionLoading}
className="text-xs sm:text-sm h-8 sm:h-9"
>
<Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0341")}
</Button>
<Button
variant="outline"
size="sm"
onClick={handleBulkSendMessage}
className="text-xs sm:text-sm h-8 sm:h-9"
>
<MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0342")}
</Button>
<Button
variant="outline"
size="sm"
onClick={handleBulkSendWhatsApp}
className="text-xs sm:text-sm h-8 sm:h-9 border-[#25D366]/40 text-[#1ebe5d] hover:bg-[#25D366]/10 hover:text-[#1ebe5d]"
>
<WhatsAppIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0343")}
</Button>
<Button
variant="outline"
size="sm"
onClick={handleExportSelected}
disabled={selectAllMatchingFilter}
title={selectAllMatchingFilter ? t("pg.Contacts.0483") : undefined}
className="text-xs sm:text-sm h-8 sm:h-9"
>
<Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0344")}
</Button>
<Button
variant="outline"
size="sm"
className="text-destructive hover:text-destructive text-xs sm:text-sm h-8 sm:h-9"
onClick={handleBulkDelete}
disabled={isBulkActionLoading}
>
<Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0345")}
</Button>
</div>
</div>
            </div>
          )}

          <CreateCampaignDialog
            open={isBulkCampaignDialogOpen}
            onOpenChange={setIsBulkCampaignDialogOpen}
            initialTargeting={{
              campaign_type: bulkCampaignChannel,
              target_contact_ids: selectAllMatchingFilter ? [] : selectedContacts,
              target_criteria_tags: selectAllMatchingFilter && filterTag !== "all" ? [filterTag] : [],
            }}
            onSuccess={() => {
              setIsBulkCampaignDialogOpen(false);
              setSelectedContacts([]);
              setSelectAllMatchingFilter(false);
            }}
          >
            <span className="hidden" />
          </CreateCampaignDialog>

{/* Mobile-only: iOS grouped contact list */}
{!isLoading && !isLoadingMobileAllContacts && (
  <div className="lg:hidden">
    {filteredContacts.length === 0 ? (
      <div className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
          <Phone className="w-7 h-7 text-primary" strokeWidth={1.8} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground">{t("pg.Contacts.0346")}</h3>
        <p className="text-[12.5px] text-foreground/60 leading-snug mt-1 max-w-xs mx-auto">
          {searchQuery || filterTag !== "all"
            ? t("pg.Contacts.0484")
            : t("pg.Contacts.0485")}
        </p>
      </div>
    ) : (
      <>
        <p className="px-2.5 mb-2 text-[11px] font-bold tracking-wider uppercase text-foreground/55">
          {t("pg.Contacts.0347")} {filteredContacts.length}
        </p>
        <div className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {filteredContacts.map((contact, idx) => {
            const initials = contact.name
              ? contact.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
              : "—";
            const isSelected = isContactChecked(contact.id);
            const isLast = idx === filteredContacts.length - 1;
            return (
              <div
                key={contact.id}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 active:bg-accent/40 dark:active:bg-accent/30 transition-colors",
                  !isLast ? "border-b border-border/35 dark:border-border/20" : "",
                  isSelected ? "bg-primary/[0.04] dark:bg-primary/[0.08]" : "",
                ].join(" ")}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                  className="h-4 w-4 flex-shrink-0"
                  aria-label={t("pg.Contacts.0486", { name: contact.name })}
                />
                <button
                  type="button"
                  onClick={() => setSelectedContact(contact)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-semibold text-foreground leading-tight truncate">
                        {contact.name || t("pg.Contacts.0487")}
                      </span>
                      <span
                        className={[
                          "inline-block w-1.5 h-1.5 rounded-full flex-shrink-0",
                          contact.is_active && contact.is_opted_in
                            ? "bg-emerald-500"
                            : !contact.is_active
                              ? "bg-foreground/30"
                              : "bg-amber-500",
                        ].join(" ")}
                        aria-label={getStatusText(contact.is_active, contact.is_opted_in)}
                      />
                    </div>
                    <p className="text-[11.5px] font-mono text-foreground/60 dark:text-foreground/55 leading-tight truncate mt-0.5">
                      {contact.phone_e164}
                      {contact.tags.length > 0 && (
                        <span className="ml-1.5 text-primary font-sans font-semibold">
                          · {contact.tags.slice(0, 2).join(", ")}
                          {contact.tags.length > 2 ? ` +${contact.tags.length - 2}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-full -mr-1">
                      <MoreVertical className="w-[17px] h-[17px]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass">
                    <DropdownMenuItem onClick={() => handleSendMessage(contact)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("pg.Contacts.0342")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendWhatsApp(contact)}>
                      <WhatsAppIcon className="w-4 h-4 mr-2 text-[#25D366]" />
                      {t("pg.Contacts.0343")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t("pg.Contacts.0348")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setContactToDelete(contact);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("pg.Contacts.0349")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
)}

{/* Contacts Table — desktop+ only */}
<Card className={`hidden lg:block flex-1 glass border-0 overflow-hidden`}>
<div className={"overflow-auto h-full scrollbar-premium"}>
{(isLoading || (isMobile && isLoadingMobileAllContacts)) ? (
<div className="p-4 lg:p-6 space-y-4">
{Array.from({ length: Math.min(pageSize, 20) }).map((_, i) => (
<Skeleton key={i} className="h-12 lg:h-16 w-full" />
))}
      </div>
) : (
<div className="overflow-x-auto scrollbar-premium">
<Table>
<TableHeader>
<TableRow className="border-b border-border hover:bg-transparent bg-muted/30 sticky top-0">
<TableHead className="w-6 sm:w-8 lg:w-12 py-3 sm:py-4">
<Checkbox
checked={filteredContacts.length > 0 && (selectAllMatchingFilter || filteredContacts.every(contact => selectedIdSet.has(contact.id)))}
onCheckedChange={handleSelectAll}
className="h-3 w-3 sm:h-4 sm:w-4"
/>
</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground py-3 sm:py-4">{t("pg.Contacts.0350")}</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground hidden sm:table-cell py-3 sm:py-4">{t("pg.Contacts.0351")}</TableHead>
<TableHead className="text-xs sm:text-sm hidden">{t("pg.Contacts.0352")}</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground hidden lg:table-cell py-3 sm:py-4">{t("pg.Contacts.0353")}</TableHead>
<TableHead className="w-6 sm:w-8 lg:w-12 py-3 sm:py-4"></TableHead>
</TableRow>
</TableHeader>
<TableBody>
{filteredContacts.map((contact) => {
const StatusIcon = getStatusIcon(contact.is_active, contact.is_opted_in);
return (
<TableRow
key={contact.id}
className="border-b border-border/50 cursor-pointer hover:bg-primary/5 transition-colors duration-150"
onClick={() => setSelectedContact(contact)}
>
<TableCell onClick={(e) => e.stopPropagation()} className="py-3 sm:py-4">
<Checkbox
checked={isContactChecked(contact.id)}
onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
className="h-3 w-3 sm:h-4 sm:w-4"
/>
</TableCell>
<TableCell className="py-3 sm:py-4">
<div className="flex items-center gap-2 sm:gap-3">
<Avatar className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10">
<AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
{contact.name.split(" ").map(n => n[0]).join("").toUpperCase()}
</AvatarFallback>
</Avatar>
<div className="min-w-0 flex-1">
<p className="font-semibold text-foreground text-xs sm:text-sm lg:text-base truncate">{contact.name}</p>
<div className="flex items-center gap-1 text-xs text-text-subtle mt-0.5">
<Phone className="w-3 h-3 flex-shrink-0" />
<span className="truncate">{contact.phone_e164}</span>
</div>
{contact.email && (
<div className="flex items-center gap-1 text-xs text-text-subtle mt-0.5">
<Mail className="w-3 h-3 flex-shrink-0" />
<span className="truncate">{contact.email}</span>
</div>
)}
{/* Tags for mobile view */}
{contact.tags.length > 0 && (
<div className="flex gap-1 flex-wrap mt-2 sm:hidden">
{contact.tags.slice(0, 3).map((tag) => (
<Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
{tag}
</Badge>
))}
{contact.tags.length > 3 && (
<Badge variant="outline" className="text-xs px-2 py-0.5">
+{contact.tags.length - 3}
</Badge>
)}
</div>
)}
</div>
</div>
</TableCell>
<TableCell className="hidden sm:table-cell py-3 sm:py-4">
<div className="flex gap-1 flex-wrap">
{contact.tags.slice(0, 2).map((tag) => (
<Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
{tag}
</Badge>
))}
{contact.tags.length > 2 && (
<Badge variant="outline" className="text-xs px-2 py-0.5">
+{contact.tags.length - 2}
</Badge>
)}
</div>
</TableCell>
<TableCell className="hidden">
<div className="flex items-center gap-2">
<StatusIcon className={`w-3 h-3 lg:w-4 lg:h-4 ${getStatusColor(contact.is_active, contact.is_opted_in)}`} />
<span className={`text-xs lg:text-sm ${getStatusColor(contact.is_active, contact.is_opted_in)}`}>
{getStatusText(contact.is_active, contact.is_opted_in)}
</span>
</div>
</TableCell>
<TableCell className="hidden lg:table-cell py-3 sm:py-4">
<span className="text-xs lg:text-sm text-text-subtle">{formatDate(contact.created_at)}</span>
</TableCell>
<TableCell onClick={(e) => e.stopPropagation()} className="py-3 sm:py-4">
<DropdownMenu>
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon">
<MoreVertical className="w-4 h-4" />
</Button>
</DropdownMenuTrigger>
<DropdownMenuContent align="end" className="glass">
<DropdownMenuItem onClick={() => handleSendMessage(contact)}>
<MessageSquare className="w-4 h-4 mr-2" />
{t("pg.Contacts.0342")}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleSendWhatsApp(contact)}>
<WhatsAppIcon className="w-4 h-4 mr-2 text-[#25D366]" />
{t("pg.Contacts.0343")}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleEditContact(contact)}>
<Edit className="w-4 h-4 mr-2" />
{t("pg.Contacts.0348")}
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem
className="text-destructive"
onClick={() => {
setContactToDelete(contact);
setIsDeleteDialogOpen(true);
}}
>
<Trash2 className="w-4 h-4 mr-2" />
{t("pg.Contacts.0349")}
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</TableCell>
</TableRow>
);
})}
</TableBody>
{filteredContacts.length === 0 && (
<TableBody>
<TableRow>
<TableCell colSpan={6} className="text-center py-8 text-sm">
<div className="text-text-subtle">
{searchQuery || filterTag !== "all"
? t("pg.Contacts.0488")
: t("pg.Contacts.0489")}
</div>
</TableCell>
</TableRow>
</TableBody>
)}
</Table>
</div>
)}
</div>
</Card>

{/* Pagination Controls */}
{totalCount > 20 && (
  <div className="hidden sm:block mt-4 rounded-lg border border-border-subtle bg-muted/20 p-2.5 sm:p-0 sm:border-0 sm:bg-transparent sm:rounded-none">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-3 text-xs sm:text-sm text-text-subtle text-center sm:text-left">
        <span>
          {t("pg.Contacts.0354")} {((currentPage - 1) * pageSize) + 1} {t("pg.Contacts.0355")} {Math.min(currentPage * pageSize, totalCount)} {t("pg.Contacts.0356")} {totalCount} {t("pg.Contacts.0357")}
        </span>
        <div className="flex items-center gap-1.5">
          <span>{t("pg.Contacts.0358")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => changePageSize(Number(v), currentFilter)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[84px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)}>{n.toLocaleString(appLocale())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile page indicator */}
      <div className="sm:hidden text-[11px] text-center text-text-subtle">
        {t("pg.Contacts.0359")} {currentPage} {t("pg.Contacts.0356")} {Math.ceil(totalCount / pageSize)}
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousPage}
        disabled={!hasPreviousPage || isLoading}
        className="text-xs h-8 px-3 sm:px-3 min-w-[82px]"
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        <span className="hidden sm:inline">{t("pg.Contacts.0360")}</span>
        <span className="sm:hidden">{t("pg.Contacts.0361")}</span>
      </Button>

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {(() => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const maxVisiblePages = 5;
          const pages = [];

          if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
              pages.push(
                <Button
                  key={i}
                  variant={i === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(i)}
                  disabled={isLoading}
                  className={`text-xs w-7 h-7 sm:w-8 sm:h-8 p-0 ${i === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {i}
                </Button>
              );
            }
          } else {
            // Show smart pagination
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            // Always show first page
            if (startPage > 1) {
              pages.push(
                <Button
                  key={1}
                  variant={1 === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={isLoading}
                  className={`text-xs w-7 h-7 sm:w-8 sm:h-8 p-0 ${1 === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  1
                </Button>
              );

              if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="text-text-subtle text-xs">...</span>);
              }
            }

            // Show pages around current page
            for (let i = startPage; i <= endPage; i++) {
              if (i !== 1 && i !== totalPages) {
                pages.push(
                  <Button
                    key={i}
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(i)}
                    disabled={isLoading}
                    className={`text-xs w-7 h-7 sm:w-8 sm:h-8 p-0 ${i === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {i}
                  </Button>
                );
              }
            }

            // Always show last page
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="text-text-subtle text-xs">...</span>);
              }

              pages.push(
                <Button
                  key={totalPages}
                  variant={totalPages === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={isLoading}
                  className={`text-xs w-7 h-7 sm:w-8 sm:h-8 p-0 ${totalPages === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {totalPages}
                </Button>
              );
            }
          }

          return pages;
        })()}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextPage}
        disabled={!hasNextPage || isLoading}
        className="text-xs h-8 px-3 sm:px-3 min-w-[82px]"
      >
        <span className="hidden sm:inline">{t("pg.Contacts.0362")}</span>
        <span className="sm:hidden">{t("pg.Contacts.0362")}</span>
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : null}
      </Button>
      </div>
    </div>
  </div>
)}
</div>
</div>
</div>
</div>

{/* Contact Detail Panel */}
{selectedContact && (
<>
  {/* Mobile Overlay */}
  {isMobile && (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={() => setSelectedContact(null)}
    />
  )}

  <div
    ref={contactDetailsRef}
    className={`w-80 border-l border-border-subtle glass flex flex-col ${
      isMobile ? 'fixed right-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out' : ''
    }`}
  >
<div className="p-4 sm:p-6 border-b border-border-subtle">

<div className="flex items-center justify-between mb-3 sm:mb-4">
  <h3 className="font-heading text-base sm:text-lg font-semibold">{t("pg.Contacts.0363")}</h3>
  <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
    <X className="w-4 h-4" />
  </Button>
</div>

<div className="text-center mb-4 sm:mb-6">
  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3">
    <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
      {selectedContact.name.split(" ").map(n => n[0]).join("").toUpperCase()}
    </AvatarFallback>
  </Avatar>
  <h4 className="font-semibold text-foreground mb-1">{selectedContact.name}</h4>
  <div className="flex items-center justify-center gap-2 mb-2">
    <Badge variant={selectedContact.is_active ? "default" : "secondary"}>
      {selectedContact.is_active ? t("pg.Contacts.0490") : t("pg.Contacts.0491")}
    </Badge>
    {/* Removed Opted In/Not Opted In badge */}
  </div>
</div>

<div className="space-y-3 sm:space-y-4">
<div>
<p className="text-xs sm:text-sm text-text-subtle mb-1">{t("pg.Settings.0077")}</p>
<p className="text-sm sm:text-base text-foreground">{selectedContact.phone_e164}</p>
</div>

{selectedContact.email && (
<div>
<p className="text-sm text-text-subtle mb-1">Email</p>
<p className="text-foreground">{selectedContact.email}</p>
</div>
)}

{/* Display attributes if they exist */}
{selectedContact.attributes && Object.keys(selectedContact.attributes).filter(key => !['company', 'department'].includes(key.toLowerCase())).length > 0 && (
  <div>
    <p className="text-sm text-text-subtle mb-1">{t("pg.Contacts.0364")}</p>
    <div className="space-y-1">
      {Object.entries(selectedContact.attributes)
        .filter(([key]) => !['company', 'department'].includes(key.toLowerCase()))
        .map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-sm text-text-subtle capitalize">{key}:</span>
            <span className="text-sm text-foreground">{String(value)}</span>
          </div>
        ))}
    </div>
  </div>
)}

<div>
<p className="text-sm text-text-subtle mb-1">{t("pg.Contacts.0365")}</p>
<div className="flex flex-wrap gap-1">
{selectedContact.tags.length > 0 ? (
selectedContact.tags.map((tag) => (
<Badge key={tag} variant="outline" className="text-xs">
{tag}
</Badge>
))
) : (
<p className="text-text-subtle text-sm">{t("pg.Contacts.0366")}</p>
)}
</div>
</div>

<div>
<p className="text-sm text-text-subtle mb-1">{t("pg.Contacts.0353")}</p>
<p className="text-foreground">{formatDate(selectedContact.created_at)}</p>
</div>


</div>

<div className="flex gap-2 mt-4 sm:mt-6">
<Button
size="sm"
className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
onClick={() => handleSendMessage(selectedContact)}
>
<MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
SMS
</Button>
<Button
size="sm"
className="flex-1 text-xs sm:text-sm h-8 sm:h-9 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
onClick={() => handleSendWhatsApp(selectedContact)}
>
<WhatsAppIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
WhatsApp
</Button>
<Button
variant="outline"
size="sm"
className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
onClick={() => handleEditContact(selectedContact)}
>
<Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
{t("pg.Contacts.0367")}
</Button>
</div>
</div>
</div>
</>
)}

{/* Delete Confirmation Dialog */}
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
<AlertDialogContent className="glass">
<AlertDialogHeader>
<AlertDialogTitle>{t("pg.Contacts.0349")}</AlertDialogTitle>
<AlertDialogDescription>
{t("pg.Contacts.0368")} {contactToDelete?.name}{t("pg.Contacts.0369")}
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogCancel>{t("pg.Settings.0120")}</AlertDialogCancel>
<AlertDialogAction
onClick={handleDeleteContact}
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
{t("pg.Contacts.0345")}
</AlertDialogAction>
</AlertDialogFooter>
</AlertDialogContent>
</AlertDialog>

{/* Bulk Import Dialog */}
<Dialog open={isImportDialogOpen} onOpenChange={(open) => {
  if (!open) {
    setImportedContacts([]);
    setImportSelectedIndices(new Set());
    setImportSearchQuery('');
    setImportCurrentPage(0);
  }
  setIsImportDialogOpen(open);
}}>
<DialogContent className="glass w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
<DialogHeader>
<DialogTitle>{t("pg.Contacts.0318")}</DialogTitle>
<DialogDescription>
{importedContacts.length} {t("pg.Contacts.0370")}{importedContacts.length !== 1 ? t("pg.common.plural_s") : ''} {t("pg.Contacts.0371")} {importSelectedIndices.size} {t("pg.Contacts.0372")}
</DialogDescription>
</DialogHeader>

<div className="flex-1 overflow-hidden flex flex-col gap-3">

{/* Search + Select All toolbar */}
<div className="flex items-center gap-2">
<div className="relative flex-1">
<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
<input
  type="text"
  placeholder={t("pg.Contacts.0373")}
  value={importSearchQuery}
  onChange={e => { setImportSearchQuery(e.target.value); setImportCurrentPage(0); }}
  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
/>
</div>
<Button
  variant="outline"
  size="sm"
  className="text-xs h-8 shrink-0"
  onClick={() => {
    const q = importSearchQuery.toLowerCase();
    const filtered = importedContacts
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !q || c.name?.toLowerCase().includes(q) || c.phone_e164?.includes(q));
    const allSelected = filtered.length > 0 && filtered.every(({ i }) => importSelectedIndices.has(i));
    setImportSelectedIndices(prev => {
      const newSet = new Set(prev);
      filtered.forEach(({ i }) => { if (allSelected) newSet.delete(i); else newSet.add(i); });
      return newSet;
    });
  }}
>
  {(() => {
    const q = importSearchQuery.toLowerCase();
    const filtered = importedContacts.map((c, i) => ({ c, i })).filter(({ c }) => !q || c.name?.toLowerCase().includes(q) || c.phone_e164?.includes(q));
    return filtered.length > 0 && filtered.every(({ i }) => importSelectedIndices.has(i)) ? 'Deselect All' : 'Select All';
  })()}
</Button>
<Button
  variant="outline"
  size="sm"
  className="text-xs h-8 shrink-0"
  onClick={handleMobileContactImport}
  disabled={isImporting}
>
<Smartphone className="w-3 h-3 mr-1" />
{t("pg.Contacts.0374")}
</Button>
</div>

{/* Count summary */}
{importedContacts.length > 0 && (
<div className="flex items-center justify-between text-xs text-text-subtle px-1">
  <span>
    {(() => {
      const q = importSearchQuery.toLowerCase();
      const n = importedContacts.filter(c => !q || c.name?.toLowerCase().includes(q) || c.phone_e164?.includes(q)).length;
      return `${n} matching • ${importSelectedIndices.size} selected`;
    })()}
  </span>
  {importSelectedIndices.size > 0 && (
    <button className="text-destructive underline text-xs" onClick={() => setImportSelectedIndices(new Set())}>
      {t("pg.Contacts.0375")}
    </button>
  )}
</div>
)}

{/* Contacts list - paginated for performance with large contact sets */}
<div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-border-subtle">
{importedContacts.length === 0 ? (
<div className="text-center py-10 text-text-subtle">
<Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
<p className="text-sm">{t("pg.Contacts.0376")}</p>
<p className="text-xs mt-1">{t("pg.Contacts.0377")}</p>
</div>
) : (() => {
  const q = importSearchQuery.toLowerCase();
  const filtered = importedContacts
    .map((contact, originalIdx) => ({ contact, originalIdx }))
    .filter(({ contact: c }) => !q || c.name?.toLowerCase().includes(q) || c.phone_e164?.includes(q));
  const pageStart = importCurrentPage * IMPORT_PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + IMPORT_PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / IMPORT_PAGE_SIZE);
  if (pageItems.length === 0) {
    return <div className="text-center py-10 text-text-subtle"><p className="text-sm">{t("pg.Contacts.0378")}</p></div>;
  }
  return (
    <>
      {pageItems.map(({ contact, originalIdx }) => {
        const isSelected = importSelectedIndices.has(originalIdx);
        return (
          <div
            key={originalIdx}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
            onClick={() => setImportSelectedIndices(prev => {
              const s = new Set(prev);
              if (s.has(originalIdx)) s.delete(originalIdx); else s.add(originalIdx);
              return s;
            })}
          >
            <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
              {isSelected && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{contact.name || <span className="text-destructive text-xs italic">{t("pg.Contacts.0379")}</span>}</span>
                {!contact.name && <Badge variant="outline" className="text-[10px] text-destructive shrink-0">{t("pg.Contacts.0380")}</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-subtle mt-0.5">
                {contact.phone_e164 ? (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone_e164}</span>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-destructive">{t("pg.Contacts.0381")}</Badge>
                )}
                {contact.email && <span className="truncate flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/10 shrink-0"
              title={t("pg.Contacts.0382")}
              onClick={e => {
                e.stopPropagation();
                setImportedContacts(prev => prev.filter((_, i) => i !== originalIdx));
                setImportSelectedIndices(prev => {
                  const s = new Set<number>();
                  for (const i of prev) {
                    if (i < originalIdx) s.add(i);
                    else if (i > originalIdx) s.add(i - 1);
                  }
                  return s;
                });
              }}
            >
              <XCircle className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        );
      })}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted/20 text-xs text-text-subtle sticky bottom-0">
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={importCurrentPage === 0} onClick={() => setImportCurrentPage(p => p - 1)}>{t("pg.Contacts.0383")}</Button>
          <span>{t("pg.Contacts.0359")} {importCurrentPage + 1} / {totalPages} &nbsp;({filtered.length} {t("pg.Contacts.0384")}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={importCurrentPage >= totalPages - 1} onClick={() => setImportCurrentPage(p => p + 1)}>{t("pg.Contacts.0385")}</Button>
        </div>
      )}
    </>
  );
})()}
</div>

{/* Action Buttons */}
<div className="flex items-center justify-between pt-2 border-t shrink-0">
<div className="text-xs text-text-subtle">
{importSelectedIndices.size === 0 ? t("pg.Contacts.noneToImport") : t("pg.Contacts.willImport", { count: importSelectedIndices.size })}
</div>
<div className="flex gap-2">
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setImportedContacts([]);
    setImportSelectedIndices(new Set());
    setImportSearchQuery('');
    setImportCurrentPage(0);
    setIsImportDialogOpen(false);
  }}
  disabled={isCreating}
>
{t("pg.Settings.0120")}
</Button>
<Button
  size="sm"
  onClick={handleBulkCreateContacts}
  disabled={isCreating || importSelectedIndices.size === 0}
  className="gap-2"
>
{isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
{t("pg.Contacts.0386")} {importSelectedIndices.size} {t("pg.Contacts.0350")}{importSelectedIndices.size !== 1 ? t("pg.common.plural_s") : ''}
</Button>
</div>
</div>
</div>
</DialogContent>
</Dialog>

{/* CSV Import Dialog */}
<CSVImportDialog
  open={isCSVImportDialogOpen}
  onOpenChange={(open) => {
    setIsCSVImportDialogOpen(open);
    if (!open) {
      setImportedContacts([]);
    }
  }}
  onImport={handleCSVImport}
  isImporting={isCreating}
/>

{/* Mobile Import Help Dialog */}
<Dialog open={isMobileImportHelpOpen} onOpenChange={setIsMobileImportHelpOpen}>
<DialogContent className="glass max-w-md">
<DialogHeader>
<DialogTitle className="flex items-center gap-2">
<Smartphone className="w-5 h-5 text-primary" />
{t("pg.Contacts.0387")}
</DialogTitle>
<DialogDescription>
{t("pg.Contacts.0388")}
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-3">
<h4 className="font-medium text-sm">{t("pg.Contacts.0387")}</h4>
<div className="space-y-2 text-sm text-text-subtle">
<p>{t("pg.Contacts.0389")}</p>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">1</div>
<p>{t("pg.Contacts.0390")}</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">2</div>
<p>{t("pg.Contacts.0391")}</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">3</div>
<p>{t("pg.Contacts.0392")}</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">4</div>
<p>{t("pg.Contacts.0393")}</p>
</div>
</div>
</div>

<div className="p-3 bg-muted/30 rounded-lg">
<p className="text-xs text-text-subtle">
<strong>{t("pg.Settings.0198")}</strong> {t("pg.Contacts.0394")}
</p>
</div>

<div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
<p className="text-xs text-blue-700 dark:text-blue-300">
<strong>{t("pg.Contacts.0395")}</strong> {t("pg.Contacts.0396")}
</p>
</div>
</div>

<div className="flex gap-2 pt-2">
<Button
variant="outline"
onClick={() => setIsMobileImportHelpOpen(false)}
className="flex-1"
>
{t("pg.Contacts.0397")}
</Button>
<Button
onClick={() => {
setIsMobileImportHelpOpen(false);
handleMobileContactImport();
}}
className="flex-1"
>
<Smartphone className="w-4 h-4 mr-2" />
{t("pg.Contacts.0398")}
</Button>
</div>
</DialogContent>
</Dialog>

{/* Add Tag Dialog — type your own tag names */}
<Dialog open={isAddTagDialogOpen} onOpenChange={(open) => {
  setIsAddTagDialogOpen(open);
  if (!open) {
    setSelectedTags([]);
    setTagInput("");
  }
}}>
<DialogContent className="glass max-w-md">
<DialogHeader>
<DialogTitle className="flex items-center gap-2">
<Tag className="w-5 h-5" />
{t("pg.Contacts.0399")}
</DialogTitle>
<DialogDescription>
{t("pg.Contacts.0400")} {selectedCount.toLocaleString(appLocale())} {t("pg.Contacts.0401")}{selectedCount === 1 ? "" : t("pg.common.plural_s")}{t("pg.Contacts.0402")}
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-2">
<Label htmlFor="bulk-tag-input" className="text-sm font-medium">{t("pg.Contacts.0403")}</Label>
<div className="flex flex-wrap items-center gap-1.5 min-h-[44px] rounded-xl border border-border/60 dark:border-border/40 bg-background/60 dark:bg-background/40 px-2.5 py-2 focus-within:border-primary/50">
  {selectedTags.map((tag) => (
    <span
      key={tag}
      className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-primary/10 dark:bg-primary/15 text-primary text-[12px] font-semibold"
    >
      {tag}
      <button
        type="button"
        onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
        aria-label={t("pg.Contacts.0492", { tag })}
        className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-destructive/15 hover:text-destructive transition-colors"
      >
        <X className="w-2.5 h-2.5" strokeWidth={2.6} />
      </button>
    </span>
  ))}
  <input
    id="bulk-tag-input"
    type="text"
    value={tagInput}
    onChange={(e) => setTagInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const trimmed = tagInput.trim().replace(/,$/, "");
        if (trimmed && !selectedTags.includes(trimmed)) {
          setSelectedTags([...selectedTags, trimmed]);
        }
        setTagInput("");
      } else if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
        setSelectedTags(selectedTags.slice(0, -1));
      }
    }}
    onBlur={() => {
      const trimmed = tagInput.trim();
      if (trimmed && !selectedTags.includes(trimmed)) {
        setSelectedTags([...selectedTags, trimmed]);
      }
      setTagInput("");
    }}
    placeholder={selectedTags.length === 0 ? t("pg.Contacts.0493") : ""}
    className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-[13px] py-0.5"
  />
</div>
<p className="text-xs text-text-subtle">
  {t("pg.Contacts.0404")} <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> {t("pg.Contacts.0405")} <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">,</kbd> {t("pg.Contacts.0406")}
</p>
</div>
</div>

<DialogFooter>
<Button
variant="outline"
onClick={() => {
setIsAddTagDialogOpen(false);
setSelectedTags([]);
}}
disabled={isBulkActionLoading}
>
{t("pg.Settings.0120")}
</Button>
<Button
onClick={confirmBulkAddTag}
disabled={isBulkActionLoading || selectedTags.length === 0}
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t("pg.Contacts.0407")}
</>
) : (
<>
<Tag className="w-4 h-4 mr-2" />
{t("pg.BrandingDomainsCard.0238")} {selectedTags.length} {t("pg.Contacts.0408")}
</>
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>

{/* Bulk Edit Dialog */}
<Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
<DialogContent className="glass max-w-md">
<DialogHeader>
<DialogTitle className="flex items-center gap-2">
<Edit className="w-5 h-5" />
{t("pg.Contacts.0409")}
</DialogTitle>
<DialogDescription>
{t("pg.Contacts.0410")} {selectedContacts.length} {t("pg.Contacts.0411")}
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-2">
<Label htmlFor="bulk-name" className="text-sm font-medium">{t("pg.Contacts.0412")}</Label>
<Input
id="bulk-name"
placeholder={t("pg.Contacts.0413")}
value={bulkEditData.name || ""}
onChange={(e) => setBulkEditData(prev => ({ ...prev, name: e.target.value }))}
className="glass-subtle border-0 text-sm"
/>
</div>

<div className="space-y-2">
<Label htmlFor="bulk-email" className="text-sm font-medium">Email</Label>
<Input
id="bulk-email"
type="email"
placeholder={t("pg.Contacts.0413")}
value={bulkEditData.email || ""}
onChange={(e) => setBulkEditData(prev => ({ ...prev, email: e.target.value }))}
className="glass-subtle border-0 text-sm"
/>
</div>

{/* Tags Section */}
<div className="space-y-2">
<Label className="text-sm font-medium">{t("pg.Contacts.0365")}</Label>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
{predefinedTags.map((tag) => (
<div key={tag} className="flex items-center space-x-2">
<Checkbox
id={`bulk-edit-tag-${tag}`}
checked={bulkEditData.tags?.includes(tag) || false}
onCheckedChange={(checked) => {
if (checked) {
setBulkEditData(prev => ({
...prev,
tags: [...(prev.tags || []), tag]
}));
} else {
setBulkEditData(prev => ({
...prev,
tags: (prev.tags || []).filter(t => t !== tag)
}));
}
}}
className="h-4 w-4"
/>
<Label
htmlFor={`bulk-edit-tag-${tag}`}
className="text-sm font-normal cursor-pointer"
>
{tag}
</Label>
</div>
))}
</div>
{bulkEditData.tags && bulkEditData.tags.length > 0 && (
<div className="flex flex-wrap gap-1 mt-2">
{bulkEditData.tags.map((tag) => (
<Badge key={tag} variant="secondary" className="text-xs">
{tag}
</Badge>
))}
</div>
)}
</div>

{/* Attributes Section - Hidden */}
<div className="space-y-2 hidden">
<h4 className="text-sm font-medium text-foreground">{t("pg.Contacts.0327")}</h4>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
<div className="space-y-1">
<Label htmlFor="bulk-company" className="text-xs">{t("pg.Contacts.0328")}</Label>
<Input
id="bulk-company"
placeholder={t("pg.Contacts.0413")}
value={(bulkEditData.attributes?.company as string) || ""}
onChange={(e) => setBulkEditData(prev => ({
...prev,
attributes: {
...prev.attributes,
company: e.target.value
}
}))}
className="glass-subtle border-0 text-xs"
/>
</div>
<div className="space-y-1">
<Label htmlFor="bulk-department" className="text-xs">{t("pg.Contacts.0330")}</Label>
<Input
id="bulk-department"
placeholder={t("pg.Contacts.0413")}
value={(bulkEditData.attributes?.department as string) || ""}
onChange={(e) => setBulkEditData(prev => ({
...prev,
attributes: {
...prev.attributes,
department: e.target.value
}
}))}
className="glass-subtle border-0 text-xs"
/>
</div>
</div>
</div>
</div>

<DialogFooter>
<Button
variant="outline"
onClick={() => {
setIsBulkEditDialogOpen(false);
setBulkEditData({
name: "",
email: "",
tags: [],
attributes: {
company: "",
department: ""
} as Record<string, unknown>
});
}}
disabled={isBulkActionLoading}
>
{t("pg.Settings.0120")}
</Button>
<Button
onClick={confirmBulkEdit}
disabled={isBulkActionLoading}
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t("pg.Contacts.0414")}
</>
) : (
<>
<Edit className="w-4 h-4 mr-2" />
{t("pg.Contacts.0410")} {selectedContacts.length} {t("pg.Contacts.0415")}
</>
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>

{/* Bulk Delete Confirmation Dialog */}
<AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
<AlertDialogContent className="glass">
<AlertDialogHeader>
<AlertDialogTitle className="flex items-center gap-2">
<Trash2 className="w-5 h-5 text-destructive" />
{t("pg.Contacts.0416")}
</AlertDialogTitle>
<AlertDialogDescription>
{t("pg.Contacts.0368")} {selectedCount.toLocaleString(appLocale())} {t("pg.Contacts.0417")}
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogCancel disabled={isBulkActionLoading}>
{t("pg.Settings.0120")}
</AlertDialogCancel>
<AlertDialogAction
onClick={confirmBulkDelete}
disabled={isBulkActionLoading}
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t("pg.Contacts.0418")}
</>
) : (
<>
<Trash2 className="w-4 h-4 mr-2" />
{t("pg.Contacts.0345")} {selectedCount.toLocaleString(appLocale())} {t("pg.Contacts.0415")}
</>
)}
</AlertDialogAction>
</AlertDialogFooter>
</AlertDialogContent>
</AlertDialog>
    </div>
  );
};

export default Contacts;

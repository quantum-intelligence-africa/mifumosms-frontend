import { useEffect, useState, useRef, useCallback } from "react";
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
X
} from "lucide-react";
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
import { normalizePhoneNumber, formatPhoneNumber, validatePhoneNumber, getPhonePlaceholder } from "@/utils/phoneUtils";
import { handlePickFromPhone, isContactPickerSupported, getContactPickerSupportMessage, type NormalizedContact } from "@/utils/contactPicker";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useLanguage } from "@/hooks/useLanguage";

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
const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
const [isSelectingAll, setIsSelectingAll] = useState(false);
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

const handleBulkSendMessage = async () => {
if (selectedContacts.length === 0) {
toast({
title: "No contacts selected",
description: "Please select contacts to send a message to",
variant: "destructive"
});
return;
}

try {
setIsBulkActionLoading(true);

// Fetch phone numbers for all selected contacts (fetch all pages without filters since we have specific IDs)
const phoneNumbers: string[] = [];
const selectedIdsSet = new Set(selectedContacts);
let currentPageNum = 1;
let hasMore = true;
const pageSizeForFetch = 100;

while (hasMore && phoneNumbers.length < selectedContacts.length) {
  const response = await apiClient.getContacts({
    page: currentPageNum,
    page_size: pageSizeForFetch,
    // Don't apply filters - we're looking for specific contact IDs
  });

  if (response.success && response.data) {
    // Get phone numbers for selected contacts on this page
    const pagePhoneNumbers = response.data.results
      .filter(contact => selectedIdsSet.has(contact.id))
      .map(contact => contact.phone_e164)
      .filter(phone => phone); // Filter out empty phone numbers
    phoneNumbers.push(...pagePhoneNumbers);

    hasMore = !!response.data.next;
    currentPageNum++;

    if (currentPageNum > 1000) break;
  } else {
    break;
  }
}

if (phoneNumbers.length === 0) {
  toast({
    title: "No valid contacts",
    description: "Selected contacts don't have phone numbers",
    variant: "destructive"
  });
  return;
}

// Navigate to SMS send page with selected contact phone numbers
const phoneNumbersParam = phoneNumbers.map(phone => encodeURIComponent(phone)).join(',');
window.location.href = `/sms/send?contacts=${phoneNumbersParam}`;
} catch (error) {
  console.error('Error fetching contacts for bulk send:', error);
  toast({
    title: "Failed to send message",
    description: "An error occurred while preparing contacts. Please try again.",
    variant: "destructive"
  });
} finally {
  setIsBulkActionLoading(false);
}
};


const handleDeleteContact = async () => {
if (!contactToDelete) return;

try {
await deleteContact(contactToDelete.id);
setContactToDelete(null);
setIsDeleteDialogOpen(false);
toast({
title: "Contact deleted successfully",
description: `${contactToDelete.name} has been removed from your contacts.`,
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

const handleSelectContact = (contactId: string, checked?: boolean) => {
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
// Check if all contacts on current page are selected
const allCurrentPageSelected = filteredContacts.every(contact =>
  selectedContacts.includes(contact.id)
);

if (allCurrentPageSelected) {
  // If all current page contacts are selected, deselect them
  setSelectedContacts(prev =>
    prev.filter(id => !filteredContacts.some(contact => contact.id === id))
  );
} else {
  // Select all contacts on current page
  const currentPageContactIds = filteredContacts.map(c => c.id);
  setSelectedContacts(prev => {
    const newSelection = [...prev];
    currentPageContactIds.forEach(id => {
      if (!newSelection.includes(id)) {
        newSelection.push(id);
      }
    });
    return newSelection;
  });
}
};

const handleSelectAllContacts = async () => {
  // Check if all contacts are already selected
  if (selectedContacts.length === totalCount && totalCount > 0) {
    // Deselect all
    setSelectedContacts([]);
    toast({
      title: "Deselected all contacts",
      description: `Deselected ${totalCount} contact(s)`,
    });
    return;
  }

  try {
    setIsSelectingAll(true);

    // Fetch all contact IDs by paginating through all pages
    const allContactIds: string[] = [];
    let currentPageNum = 1;
    let hasMore = true;
    const pageSizeForFetch = 100; // Use larger page size for fetching IDs

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
    setSelectedContacts(allContactIds);

    toast({
      title: "Selected all contacts",
      description: `Selected ${allContactIds.length} contact(s) from the list`,
    });
  } catch (error) {
    console.error('Error selecting all contacts:', error);
    toast({
      title: "Failed to select all contacts",
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
title: "Invalid phone number",
description: "Please enter a valid phone number (e.g., 0689726060 or +255689726060)",
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
toast({
title: "Contact created",
description: "Contact has been successfully added to your database",
});
}
    } catch (error) {
toast({
title: "Failed to create contact",
description: "Please try again",
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
        imported: response.data?.imported_count || 0,
        updated: response.data?.updated_count || 0,
        skipped: response.data?.skipped_count || 0,
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

    // If import was successful with no errors, refresh and close
    try {
      await fetchContacts();
      toast({
        title: "Import completed successfully",
        description: `${response.data?.imported_count || 0} contacts imported${shouldUseChunked ? ' (processed in chunks)' : ''}`,
      });
    } catch (refreshError) {
      console.error('Error refreshing contacts:', refreshError);
      toast({
        title: "Import completed",
        description: "Contacts have been imported successfully",
      });
    }

    return {
      success: true,
      imported: response.data?.imported_count || 0,
      updated: response.data?.updated_count || 0,
      skipped: response.data?.skipped_count || 0,
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
return new Date(dateString).toLocaleDateString();
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
title: "No contacts selected",
description: "Please select contacts to export",
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
    title: "No contacts to export",
    description: "Selected contacts could not be found",
    variant: "destructive"
  });
  return;
}

const timestamp = new Date().toISOString().split('T')[0];
exportToCSV(contactsToExport, `selected-contacts-${timestamp}.csv`);

toast({
title: "Export successful",
description: `Exported ${contactsToExport.length} selected contacts to CSV`,
});
} catch (error) {
  console.error('Error exporting contacts:', error);
  toast({
    title: "Export failed",
    description: "An error occurred while exporting contacts. Please try again.",
    variant: "destructive"
  });
} finally {
  setIsBulkActionLoading(false);
}
};

const handleExportAll = () => {
if (filteredContacts.length === 0) {
toast({
title: "No contacts to export",
description: "No contacts match the current filters",
variant: "destructive"
});
return;
}

const timestamp = new Date().toISOString().split('T')[0];
exportToCSV(filteredContacts, `all-contacts-${timestamp}.csv`);

toast({
title: "Export successful",
description: `Exported ${filteredContacts.length} contacts to CSV`,
});
};

// Mobile contact import functions
const handleMobileContactImport = async () => {
// Check if we're on a mobile device
if (!isMobile) {
toast({
title: "Mobile Only Feature",
description: "Contact import from device is only available on mobile devices. Please use CSV upload or manual entry on desktop.",
variant: "destructive"
});
return;
}

// Check if Contact Picker API is supported
if (!isContactPickerSupported()) {
toast({
title: "Not Supported",
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
title: "No contacts selected",
description: "No contacts were selected for import. Please try again and select contacts to import.",
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
title: "No contacts found",
description: "The selected contacts have no name or phone number. Please try again.",
variant: "destructive"
});
return;
}

if (contactsToImport.length < result.contacts.length) {
toast({
title: "Some contacts skipped",
description: `${result.contacts.length - contactsToImport.length} contacts were skipped because they're missing required information.`,
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
title: "Import failed",
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
title: "Not supported",
description: "Web Share API is not supported on this device. Please use CSV upload or manual entry instead.",
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
title: "Share failed",
description: "Failed to share contacts. Please try again or use CSV upload instead.",
variant: "destructive"
});
}
}
};

const handleAlternativeImport = () => {
// Show options for alternative import methods
toast({
title: "Alternative Import Methods",
description: "Choose CSV upload or manual entry to add your contacts.",
});
setTimeout(() => {
setIsCSVImportDialogOpen(true);
}, 1000);
};

const handleQRCodeImport = () => {
toast({
title: "QR Code Import",
description: "QR code import feature will be available soon. Please use manual entry or CSV upload for now.",
});
};

const handleBulkCreateContacts = async () => {
if (importedContacts.length === 0) return;

// Only import contacts that are selected
const selectedContacts = importedContacts.filter((_, i) => importSelectedIndices.has(i));
if (selectedContacts.length === 0) {
toast({
  title: "No contacts selected",
  description: "Please select at least one contact to import.",
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
title: "No valid contacts",
description: "All contacts must have both name and phone number to be imported.",
variant: "destructive"
});
return;
}

if (validContacts.length < selectedContacts.length) {
toast({
title: "Some contacts skipped",
description: `${selectedContacts.length - validContacts.length} contacts were skipped because they're missing required information.`,
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

// Wait for import to complete, then refresh and show success
try {
  // Refresh contacts to show the imported data
  await fetchContacts();

  setImportedContacts([]);
  setImportSelectedIndices(new Set());
  setImportSearchQuery('');
  setImportCurrentPage(0);
  setIsImportDialogOpen(false);

  // Show success message after refresh is complete
  toast({
    title: "Import successful",
    description: "Contacts have been imported successfully",
  });
} catch (refreshError) {
  console.error('Error refreshing contacts:', refreshError);
  setImportedContacts([]);
  setIsImportDialogOpen(false);
  toast({
    title: "Import successful",
    description: "Contacts have been imported successfully",
  });
}
} catch (error) {
console.error('Bulk import error:', error);

// Even if there's an error, refresh to show current state, then show success
try {
  await fetchContacts();

  setImportedContacts([]);
  setIsImportDialogOpen(false);

  toast({
    title: "Import successful",
    description: "Contacts have been imported successfully",
  });
} catch (refreshError) {
  console.error('Error refreshing contacts:', refreshError);
  setImportedContacts([]);
  setIsImportDialogOpen(false);
  toast({
    title: "Import successful",
    description: "Contacts have been imported successfully",
  });
}
} finally {
setIsCreating(false);
}
};

// Bulk action handlers
const handleBulkAddTag = () => {
if (selectedContacts.length === 0) {
toast({
title: "No contacts selected",
description: "Please select contacts to add tags to",
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
      title: "No contacts selected",
      description: "Please select contacts to edit",
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
if (selectedContacts.length === 0) {
toast({
title: "No contacts selected",
description: "Please select contacts to delete",
variant: "destructive"
});
return;
}
setIsBulkDeleteDialogOpen(true);
};

const confirmBulkAddTag = async () => {
  if (selectedTags.length === 0) {
    toast({
      title: "No tags selected",
      description: "Please select at least one tag to add",
      variant: "destructive"
    });
    return;
  }

  try {
    setIsBulkActionLoading(true);

    const contactCount = selectedContacts.length;
    const tagCount = selectedTags.length;
    const success = await bulkAddTags(selectedContacts, selectedTags);

    if (success) {
      setSelectedContacts([]);
      setSelectedTags([]);
      setIsAddTagDialogOpen(false);

      // Refresh the contact list to show updated tags
      await fetchContacts({
        page: currentPage,
        search: searchQuery.trim() || undefined,
        tags: filterTag !== "all" ? [filterTag] : undefined,
      });

      toast({
        title: "Tags added successfully",
        description: `Added ${tagCount} tag(s) to ${contactCount} contact(s).`,
      });
    }
  } catch (error) {
    console.error('Bulk add tag error:', error);
    toast({
      title: "Failed to add tags",
      description: "An error occurred while adding tags. Please try again.",
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
        title: "No changes specified",
        description: "Please provide at least one field to update",
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
        title: "Contacts updated successfully",
        description: `Updated ${editedCount} contact(s).`,
      });
    }
  } catch (error) {
    console.error('Bulk edit error:', error);
    toast({
      title: "Bulk edit failed",
      description: "An error occurred while editing contacts. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsBulkActionLoading(false);
  }
};

const confirmBulkDelete = async () => {
  try {
    setIsBulkActionLoading(true);

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
        title: "Contacts deleted successfully",
        description: `${totalDeleted} contact(s) have been permanently deleted.`,
      });
    } else {
      toast({
        title: "Partial deletion completed",
        description: `${totalDeleted} out of ${deletedCount} contact(s) were deleted. Some batches may have failed.`,
        variant: failedBatches === batches.length ? "destructive" : "default"
      });
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    toast({
      title: "Bulk delete failed",
      description: "An error occurred while deleting contacts. Please try again.",
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
                  <p className="text-text-subtle">Loading contacts...</p>
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
                  <p className="text-destructive mb-4">Failed to load contacts</p>
                  <p className="text-text-subtle mb-4">{error}</p>
                  <Button onClick={() => (isMobile ? fetchAllContactsForMobile() : fetchContacts())} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
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
  <div className="flex h-screen bg-background">
    <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />

<div className="flex-1 overflow-y-auto sm:overflow-hidden scrollbar-premium">
<div className="h-full p-2 sm:p-3 lg:p-4 xl:p-6">
<div className={`max-w-7xl mx-auto ${isMobile ? "min-h-full" : "h-full"} flex flex-col`}>
{/* Header */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 lg:mb-5 xl:mb-6 gap-2 sm:gap-3 lg:gap-4">
<div>
<h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
{t('contacts')}
</h1>
<p className="text-xs sm:text-sm lg:text-base text-text-subtle">
{t('manage_customer_database')} ({totalCount || 0} {t('total')})
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
    <span>Import Contacts from Phone </span>
  </Button>
  <p className="text-[10px] text-text-subtle px-1">
    {isContactPickerSupported()
      ? "Pick contacts directly from your phone."
      : "If phone import is not supported, use CSV Import."}
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
<span className="hidden sm:inline">Refresh</span>
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
<span className="hidden sm:inline">CSV Import</span>
<span className="sm:hidden">CSV</span>
</Button>
<Button
variant="outline"
className="glass-subtle border-0 text-xs h-8 sm:h-8"
onClick={handleExportAll}
size="sm"
>
<Download className="w-3 h-3 mr-1" />
<span className="hidden sm:inline">Export All</span>
<span className="sm:hidden">Export</span>
</Button>
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
<DialogTrigger asChild>
<Button size="sm" className="text-xs h-8 sm:h-8" disabled={isCreating}>
{isCreating ? (
<Loader2 className="w-3 h-3 mr-1 animate-spin" />
) : (
<Plus className="w-3 h-3 mr-1" />
)}
<span className="hidden sm:inline">Add Contact</span>
<span className="sm:hidden">Add</span>
</Button>
</DialogTrigger>
<DialogContent className="glass max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
<DialogHeader className="pb-2">
<DialogTitle className="text-base sm:text-lg">{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
<DialogDescription className="text-xs sm:text-sm">
{selectedContact ? 'Update contact information' : 'Create a new contact in your database'}
</DialogDescription>
</DialogHeader>
<div className="space-y-2">
<div className="space-y-1">
<Label htmlFor="name" className="text-xs sm:text-sm">Full Name *</Label>
<Input
id="name"
placeholder="Enter Name"
value={createFormData.name}
onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
className="glass-subtle border-0 text-xs sm:text-sm h-8"
/>
</div>
<div className="space-y-1">
<Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number *</Label>
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
✓ Will be saved as: {createFormData.phone_e164}
</p>
)}
</div>
<div className="space-y-1">
<Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
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
<h4 className="text-xs sm:text-sm font-medium text-foreground">Additional Info</h4>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
<div className="space-y-1">
<Label htmlFor="company" className="text-xs">Company</Label>
<Input
id="company"
placeholder="Acme Corp"
value={(createFormData.attributes.company as string) || ""}
onChange={(e) => handleAttributeChange("company", e.target.value)}
className="glass-subtle border-0 text-xs sm:text-sm h-7"
/>
</div>
<div className="space-y-1">
<Label htmlFor="department" className="text-xs">Department</Label>
<Input
id="department"
placeholder="Marketing"
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
    Enter Tags Names: <span className="text-red-600">*</span>
  </Label>
  <div className="flex gap-1 mt-1">
    <Input
      type="text"
      placeholder="Type tag name and press Enter or Add"
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
      aria-label="Add tag"
    >
      Add
    </Button>
  </div>
  {createFormData.tags.length === 0 && (
    <p className="text-xs text-red-600 mt-1">At least one tag is required.</p>
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
        {selectedContact ? 'Updating...' : 'Creating...'}
      </>
    ) : (
      selectedContact ? "Update Contact" : "Add Contact"
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
    Cancel
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
placeholder="Search contacts..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="pl-10 glass-subtle border-0 text-sm"
/>
</div>
<Select value={filterTag} onValueChange={setFilterTag}>
<SelectTrigger className="w-full sm:w-48 glass-subtle border-0 text-sm">
<SelectValue placeholder="Filter by tag" />
</SelectTrigger>
<SelectContent className="glass">
<SelectItem value="all">All tags</SelectItem>
{allTags.map((tag) => (
<SelectItem key={tag} value={tag}>{tag}</SelectItem>
))}
</SelectContent>
</Select>
</div>

{/* Bulk Actions */}
{selectedContacts.length > 0 && (
<div className="mb-4 p-3 sm:p-4 glass rounded-lg border border-border-subtle">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div className="flex flex-col sm:flex-row sm:items-center gap-2">
  <span className="text-sm text-foreground font-medium">
    {selectedContacts.length} contact(s) selected
  </span>
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handleSelectAll}
      className="text-xs h-7"
    >
      {filteredContacts.every(contact => selectedContacts.includes(contact.id))
        ? "Deselect Page"
        : "Select Page"
      }
    </Button>
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
            Loading...
          </>
        ) : selectedContacts.length === totalCount && totalCount > 0 ? (
          `Deselect All (${totalCount})`
        ) : (
          `Select All (${totalCount})`
        )}
      </Button>
    )}
  </div>
</div>
<div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
{/* <Button
variant="outline"
size="sm"
onClick={handleBulkEdit}
disabled={isBulkActionLoading}
className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
>
<Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Edit
</Button> */}
<Button
variant="outline"
size="sm"
onClick={handleBulkAddTag}
disabled={isBulkActionLoading}
className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
>
<Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Add Tag
</Button>
<Button
variant="outline"
size="sm"
onClick={handleBulkSendMessage}
className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
>
<MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Send Message
</Button>
<Button
variant="outline"
size="sm"
onClick={handleExportSelected}
className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
>
<Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Export Selected
</Button>
<Button
variant="outline"
size="sm"
className="text-destructive hover:text-destructive w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
onClick={handleBulkDelete}
disabled={isBulkActionLoading}
>
<Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Delete
</Button>
</div>
</div>
            </div>
          )}

{/* Contacts Table */}
<Card className={`${isMobile ? "glass border-0 overflow-visible" : "flex-1 glass border-0 overflow-hidden"}`}>
<div className={isMobile ? "overflow-visible" : "overflow-auto h-full scrollbar-premium"}>
{(isLoading || (isMobile && isLoadingMobileAllContacts)) ? (
<div className="p-4 lg:p-6 space-y-4">
{Array.from({ length: pageSize }).map((_, i) => (
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
checked={filteredContacts.length > 0 && filteredContacts.every(contact => selectedContacts.includes(contact.id))}
onCheckedChange={handleSelectAll}
className="h-3 w-3 sm:h-4 sm:w-4"
/>
</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground py-3 sm:py-4">Contact</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground hidden sm:table-cell py-3 sm:py-4">Tags & Groups</TableHead>
<TableHead className="text-xs sm:text-sm hidden">Status</TableHead>
<TableHead className="text-xs sm:text-sm font-semibold text-foreground hidden lg:table-cell py-3 sm:py-4">Created</TableHead>
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
checked={selectedContacts.includes(contact.id)}
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
Send Message
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleEditContact(contact)}>
<Edit className="w-4 h-4 mr-2" />
Edit Contact
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
Delete Contact
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
? "No contacts match your current search or filter criteria."
: "No contacts available. Click 'Add Contact' to get started."}
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
{totalCount > pageSize && (
  <div className="hidden sm:block mt-4 rounded-lg border border-border-subtle bg-muted/20 p-2.5 sm:p-0 sm:border-0 sm:bg-transparent sm:rounded-none">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div className="text-xs sm:text-sm text-text-subtle text-center sm:text-left">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} contacts
      </div>

      {/* Mobile page indicator */}
      <div className="sm:hidden text-[11px] text-center text-text-subtle">
        Page {currentPage} of {Math.ceil(totalCount / pageSize)}
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
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
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
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">Next</span>
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
  <h3 className="font-heading text-base sm:text-lg font-semibold">Contact Details</h3>
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
      {selectedContact.is_active ? "Active" : "Inactive"}
    </Badge>
    {/* Removed Opted In/Not Opted In badge */}
  </div>
</div>

<div className="space-y-3 sm:space-y-4">
<div>
<p className="text-xs sm:text-sm text-text-subtle mb-1">Phone Number</p>
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
    <p className="text-sm text-text-subtle mb-1">Additional Information</p>
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
<p className="text-sm text-text-subtle mb-1">Tags</p>
<div className="flex flex-wrap gap-1">
{selectedContact.tags.length > 0 ? (
selectedContact.tags.map((tag) => (
<Badge key={tag} variant="outline" className="text-xs">
{tag}
</Badge>
))
) : (
<p className="text-text-subtle text-sm">No tags</p>
)}
</div>
</div>

<div>
<p className="text-sm text-text-subtle mb-1">Created</p>
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
Message
</Button>
<Button
variant="outline"
size="sm"
className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
onClick={() => handleEditContact(selectedContact)}
>
<Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
Edit
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
<AlertDialogTitle>Delete Contact</AlertDialogTitle>
<AlertDialogDescription>
Are you sure you want to delete {contactToDelete?.name}? This action cannot be undone.
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogCancel>Cancel</AlertDialogCancel>
<AlertDialogAction
onClick={handleDeleteContact}
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
Delete
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
<DialogTitle>Import Contacts from Phone</DialogTitle>
<DialogDescription>
{importedContacts.length} contact{importedContacts.length !== 1 ? 's' : ''} loaded &mdash; {importSelectedIndices.size} selected for import.
</DialogDescription>
</DialogHeader>

<div className="flex-1 overflow-hidden flex flex-col gap-3">

{/* Search + Select All toolbar */}
<div className="flex items-center gap-2">
<div className="relative flex-1">
<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
<input
  type="text"
  placeholder="Search by name or number…"
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
Add More
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
      Clear selection
    </button>
  )}
</div>
)}

{/* Contacts list - paginated for performance with large contact sets */}
<div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-border-subtle">
{importedContacts.length === 0 ? (
<div className="text-center py-10 text-text-subtle">
<Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
<p className="text-sm">No contacts loaded yet</p>
<p className="text-xs mt-1">Tap "Add More" to pick contacts from your phone</p>
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
    return <div className="text-center py-10 text-text-subtle"><p className="text-sm">No contacts match your search</p></div>;
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
                <span className="font-medium text-sm truncate">{contact.name || <span className="text-destructive text-xs italic">No name</span>}</span>
                {!contact.name && <Badge variant="outline" className="text-[10px] text-destructive shrink-0">Missing name</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-subtle mt-0.5">
                {contact.phone_e164 ? (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone_e164}</span>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-destructive">Missing phone</Badge>
                )}
                {contact.email && <span className="truncate flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/10 shrink-0"
              title="Remove contact"
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
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={importCurrentPage === 0} onClick={() => setImportCurrentPage(p => p - 1)}>← Prev</Button>
          <span>Page {importCurrentPage + 1} / {totalPages} &nbsp;({filtered.length} contacts)</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={importCurrentPage >= totalPages - 1} onClick={() => setImportCurrentPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </>
  );
})()}
</div>

{/* Action Buttons */}
<div className="flex items-center justify-between pt-2 border-t shrink-0">
<div className="text-xs text-text-subtle">
{importSelectedIndices.size === 0 ? "No contacts selected" : `${importSelectedIndices.size} contact${importSelectedIndices.size !== 1 ? 's' : ''} will be imported`}
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
Cancel
</Button>
<Button
  size="sm"
  onClick={handleBulkCreateContacts}
  disabled={isCreating || importSelectedIndices.size === 0}
  className="gap-2"
>
{isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
Import {importSelectedIndices.size} Contact{importSelectedIndices.size !== 1 ? 's' : ''}
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
Import Multiple Contacts from Phone
</DialogTitle>
<DialogDescription>
Access your phone's contact list to quickly import multiple contacts at once
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-3">
<h4 className="font-medium text-sm">Import Multiple Contacts from Phone</h4>
<div className="space-y-2 text-sm text-text-subtle">
<p>This will open your phone's contact picker where you can select multiple contacts to import.</p>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">1</div>
<p>Tap "Import Multiple Contacts" to open the contact picker</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">2</div>
<p>Select multiple contacts you want to import (name and phone required)</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">3</div>
<p>Review, add more, or remove contacts before importing</p>
</div>
<div className="flex items-start gap-2">
<div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">4</div>
<p>Confirm to add all selected contacts to your contact list</p>
</div>
</div>
</div>

<div className="p-3 bg-muted/30 rounded-lg">
<p className="text-xs text-text-subtle">
<strong>Note:</strong> You can select multiple contacts at once. Only contacts with both name and phone number will be imported.
Your contacts remain private and are only stored in your SENDA account.
</p>
</div>

<div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
<p className="text-xs text-blue-700 dark:text-blue-300">
<strong>Tip:</strong> You can add more contacts after the initial selection by tapping "Add More Contacts" in the review dialog.
If direct access doesn't work, you can export your contacts from your phone's contact app and use CSV upload instead.
</p>
</div>
</div>

<div className="flex gap-2 pt-2">
<Button
variant="outline"
onClick={() => setIsMobileImportHelpOpen(false)}
className="flex-1"
>
Close
</Button>
<Button
onClick={() => {
setIsMobileImportHelpOpen(false);
handleMobileContactImport();
}}
className="flex-1"
>
<Smartphone className="w-4 h-4 mr-2" />
Import Multiple Contacts
</Button>
</div>
</DialogContent>
</Dialog>

{/* Add Tag Dialog */}
<Dialog open={isAddTagDialogOpen} onOpenChange={setIsAddTagDialogOpen}>
<DialogContent className="glass max-w-md">
<DialogHeader>
<DialogTitle className="flex items-center gap-2">
<Tag className="w-5 h-5" />
Add Tags to Selected Contacts
</DialogTitle>
<DialogDescription>
Select tags to add to {selectedContacts.length} selected contact(s)
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-2">
<Label className="text-sm font-medium">Select Tags</Label>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
{predefinedTags.map((tag) => (
<div key={tag} className="flex items-center space-x-2">
<Checkbox
id={`bulk-tag-${tag}`}
checked={selectedTags.includes(tag)}
onCheckedChange={() => handleBulkTagToggle(tag)}
className="h-4 w-4"
/>
<Label
htmlFor={`bulk-tag-${tag}`}
className="text-sm font-normal cursor-pointer"
>
{tag}
</Label>
</div>
))}
</div>
{selectedTags.length > 0 && (
<div className="flex flex-wrap gap-1 mt-2">
{selectedTags.map((tag) => (
<Badge key={tag} variant="secondary" className="text-xs">
{tag}
</Badge>
))}
</div>
)}
<p className="text-xs text-text-subtle">
Selected tags will be added to all selected contacts
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
Cancel
</Button>
<Button
onClick={confirmBulkAddTag}
disabled={isBulkActionLoading || selectedTags.length === 0}
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
Adding...
</>
) : (
<>
<Tag className="w-4 h-4 mr-2" />
Add {selectedTags.length} Tag(s)
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
Edit Selected Contacts
</DialogTitle>
<DialogDescription>
Update {selectedContacts.length} selected contact(s). Leave fields empty to keep existing values.
</DialogDescription>
</DialogHeader>

<div className="space-y-4">
<div className="space-y-2">
<Label htmlFor="bulk-name" className="text-sm font-medium">Name</Label>
<Input
id="bulk-name"
placeholder="Leave empty to keep existing"
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
placeholder="Leave empty to keep existing"
value={bulkEditData.email || ""}
onChange={(e) => setBulkEditData(prev => ({ ...prev, email: e.target.value }))}
className="glass-subtle border-0 text-sm"
/>
</div>

{/* Tags Section */}
<div className="space-y-2">
<Label className="text-sm font-medium">Tags</Label>
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
<h4 className="text-sm font-medium text-foreground">Additional Info</h4>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
<div className="space-y-1">
<Label htmlFor="bulk-company" className="text-xs">Company</Label>
<Input
id="bulk-company"
placeholder="Leave empty to keep existing"
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
<Label htmlFor="bulk-department" className="text-xs">Department</Label>
<Input
id="bulk-department"
placeholder="Leave empty to keep existing"
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
Cancel
</Button>
<Button
onClick={confirmBulkEdit}
disabled={isBulkActionLoading}
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
Updating...
</>
) : (
<>
<Edit className="w-4 h-4 mr-2" />
Update {selectedContacts.length} Contact(s)
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
Delete Selected Contacts
</AlertDialogTitle>
<AlertDialogDescription>
Are you sure you want to delete {selectedContacts.length} selected contact(s)?
This action cannot be undone and will permanently remove these contacts from your database.
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogCancel disabled={isBulkActionLoading}>
Cancel
</AlertDialogCancel>
<AlertDialogAction
onClick={confirmBulkDelete}
disabled={isBulkActionLoading}
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
{isBulkActionLoading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
Deleting...
</>
) : (
<>
<Trash2 className="w-4 h-4 mr-2" />
Delete {selectedContacts.length} Contact(s)
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

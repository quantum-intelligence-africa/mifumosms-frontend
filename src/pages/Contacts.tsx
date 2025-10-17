import { useEffect, useRef, useState } from "react";
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
  QrCode
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
import { Contact, CreateContactRequest } from "@/lib/api";

const Contacts = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'mobile' | 'csv' | 'manual'>('mobile');
  const [importedContacts, setImportedContacts] = useState<CreateContactRequest[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact action handlers
  const handleSendMessage = (contact: Contact) => {
    // Navigate to SMS send page with contact pre-selected
    window.location.href = `/sms/send?contact=${contact.id}`;
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
    setIsCreateDialogOpen(true);
  };


  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const success = await deleteContact(contactToDelete.id);
      if (success) {
        setContactToDelete(null);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Contact deleted successfully",
          description: `${contactToDelete.name} has been removed from your contacts.`,
        });
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast({
        title: "Failed to delete contact",
        description: "Please try again later.",
        variant: "destructive"
      });
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
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkImportContacts
  } = useContacts();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "create") {
      setIsCreateDialogOpen(true);
    }
  }, [location.search]);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Get all unique tags from contacts
  const allTags = Array.from(new Set((contacts || []).flatMap(c => c.tags)));

  const filteredContacts = (contacts || []).filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone_e164.includes(searchQuery) ||
                         (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = filterTag === "all" || contact.tags.includes(filterTag);

    return matchesSearch && matchesTag;
  });

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length
        ? []
        : filteredContacts.map(c => c.id)
    );
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

  const handleCreateContact = async () => {
    if (!createFormData.name || !createFormData.phone_e164) return;

    // Basic phone number validation
    const phoneNumber = createFormData.phone_e164.trim();
    if (!phoneNumber.startsWith('+')) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must start with + (e.g., +1234567890)",
        variant: "destructive"
      });
      return;
    }

    // Check if phone number has at least 10 digits after +
    const digitsOnly = phoneNumber.slice(1).replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must have at least 10 digits",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      let success;
      if (selectedContact) {
        // Update existing contact
        success = await updateContact(selectedContact.id, createFormData);
      } else {
        // Create new contact
        success = await createContact(createFormData);
      }

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
        setSelectedContact(null);
        toast({
          title: selectedContact ? "Contact updated" : "Contact created",
          description: selectedContact
            ? "Contact has been successfully updated"
            : "Contact has been successfully added to your database",
        });
      }
    } catch (error) {
      toast({
        title: selectedContact ? "Failed to update contact" : "Failed to create contact",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };


  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await bulkImportContacts(file);
    setIsImporting(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleExportSelected = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select contacts to export",
        variant: "destructive"
      });
      return;
    }

    const contactsToExport = contacts.filter(contact =>
      selectedContacts.includes(contact.id)
    );

    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(contactsToExport, `selected-contacts-${timestamp}.csv`);

    toast({
      title: "Export successful",
      description: `Exported ${contactsToExport.length} selected contacts to CSV`,
    });
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
    // Check if Navigator Contacts API is available
    const navWithContacts = navigator as Navigator & {
      contacts?: {
        select: (fields: string[], options: { multiple: boolean }) => Promise<Array<{
          name?: string[];
          phone?: string[];
          email?: string[];
        }>>;
      };
    };

    if (!navWithContacts.contacts) {
      toast({
        title: "Contact Import Options",
        description: "Direct contact import is not supported on this device. You can use CSV upload or manual entry instead.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);

      // Use a more compatible approach for contact selection
      const contacts = await navWithContacts.contacts.select(['name', 'phone', 'email'], {
        multiple: true
      });

      const formattedContacts: CreateContactRequest[] = contacts.map(contact => ({
        name: contact.name?.[0] || '',
        phone_e164: contact.phone?.[0] || '',
        email: contact.email?.[0] || '',
        tags: [],
        attributes: {}
      }));

      setImportedContacts(formattedContacts);
      setIsImportDialogOpen(true);

      toast({
        title: "Contacts imported",
        description: `Successfully imported ${formattedContacts.length} contacts from your device.`,
      });
    } catch (error) {
      console.error('Contact import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import contacts from your device. Please try CSV upload or manual entry instead.",
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
        description: "Web Share API is not supported on this device.",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.share({
        title: 'Import Contacts',
        text: 'Please share your contacts to import them into Mifumo Connect',
        url: window.location.href
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Failed to share contacts. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleQRCodeImport = () => {
    toast({
      title: "QR Code Import",
      description: "QR code import feature will be available soon. Please use manual entry or CSV upload for now.",
    });
  };

  const handleBulkCreateContacts = async () => {
    if (importedContacts.length === 0) return;

    try {
      setIsCreating(true);
      let successCount = 0;
      let errorCount = 0;

      for (const contact of importedContacts) {
        try {
          await createContact(contact);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Bulk import completed",
        description: `Successfully imported ${successCount} contacts. ${errorCount} failed.`,
      });

      setImportedContacts([]);
      setIsImportDialogOpen(false);
      fetchContacts();
    } catch (error) {
      toast({
        title: "Bulk import failed",
        description: "Failed to import contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
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
                    <Button onClick={() => fetchContacts()} variant="outline">
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

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 lg:mb-5 xl:mb-6 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                    Contacts
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    Manage your customer database and relationships ({totalCount || 0} total)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 lg:gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                  />

                  {/* Mobile Contact Import Button */}
                  {isMobile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMobileContactImport}
                      disabled={isImporting}
                      className="glass-subtle border-0 text-xs h-7 sm:h-8"
                    >
                      {isImporting ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Smartphone className="w-3 h-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Import from Phone</span>
                      <span className="sm:hidden">Phone</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="glass-subtle border-0 text-xs h-7 sm:h-8"
                    onClick={() => fetchContacts()}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="glass-subtle border-0 text-xs h-7 sm:h-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    size="sm"
                  >
                    {isImporting ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    <span className="hidden sm:inline">Import</span>
                    <span className="sm:hidden">📁</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="glass-subtle border-0 text-xs h-7 sm:h-8"
                    onClick={handleExportAll}
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Export All</span>
                    <span className="sm:hidden">📥</span>
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-7 sm:h-8" disabled={isCreating}>
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
                            placeholder="+1234567890"
                            value={createFormData.phone_e164}
                            onChange={(e) => setCreateFormData(prev => ({ ...prev, phone_e164: e.target.value }))}
                            className="glass-subtle border-0 text-xs sm:text-sm h-8"
                          />
                          <p className="text-xs text-text-subtle">
                            International format (e.g., +1234567890)
                          </p>
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

                        {/* Attributes Section */}
                        <div className="space-y-1">
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
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground">Tags</h4>
                          <div className="space-y-1">
                            <Label className="text-xs">Select Tags</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                              {predefinedTags.map((tag) => (
                                <div key={tag} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`tag-${tag}`}
                                    checked={createFormData.tags.includes(tag)}
                                    onCheckedChange={() => handleTagToggle(tag)}
                                    className="h-3 w-3"
                                  />
                                  <Label
                                    htmlFor={`tag-${tag}`}
                                    className="text-xs font-normal cursor-pointer"
                                  >
                                    {tag}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {createFormData.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {createFormData.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 pt-1">
                          <Button
                            onClick={handleCreateContact}
                            disabled={!createFormData.name || !createFormData.phone_e164 || isCreating}
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
                            onClick={() => setIsCreateDialogOpen(false)}
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
                <div className="mb-4 p-3 glass rounded-lg border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {selectedContacts.length} contact(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Tag className="w-4 h-4 mr-1" />
                        Add Tag
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Send Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportSelected}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export Selected
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Table */}
              <Card className="flex-1 glass border-0 overflow-hidden">
                <div className="overflow-auto h-full">
                  {isLoading ? (
                    <div className="p-4 lg:p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 lg:h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border-subtle">
                            <TableHead className="w-8 lg:w-12">
                              <Checkbox
                                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                                onCheckedChange={handleSelectAll}
                                className="h-4 w-4"
                              />
                            </TableHead>
                            <TableHead className="text-xs lg:text-sm">Contact</TableHead>
                            <TableHead className="text-xs lg:text-sm hidden sm:table-cell">Tags</TableHead>
                            <TableHead className="text-xs lg:text-sm hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Created</TableHead>
                            <TableHead className="w-8 lg:w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {filteredContacts.map((contact) => {
                          const StatusIcon = getStatusIcon(contact.is_active, contact.is_opted_in);
                          return (
                            <TableRow
                              key={contact.id}
                              className="border-border-subtle cursor-pointer hover:bg-accent/50"
                              onClick={() => setSelectedContact(contact)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedContacts.includes(contact.id)}
                                  onCheckedChange={() => handleSelectContact(contact.id)}
                                  className="h-4 w-4"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs lg:text-sm">
                                      {contact.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground text-sm lg:text-base truncate">{contact.name}</p>
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 text-xs lg:text-sm text-text-subtle">
                                      <span className="flex items-center gap-1 truncate">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{contact.phone_e164}</span>
                                      </span>
                                      {contact.email && (
                                        <span className="flex items-center gap-1 truncate">
                                          <Mail className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">{contact.email}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex gap-1 flex-wrap">
                                  {contact.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {contact.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{contact.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-3 h-3 lg:w-4 lg:h-4 ${getStatusColor(contact.is_active, contact.is_opted_in)}`} />
                                  <span className={`text-xs lg:text-sm ${getStatusColor(contact.is_active, contact.is_opted_in)}`}>
                                    {getStatusText(contact.is_active, contact.is_opted_in)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="text-xs lg:text-sm text-text-subtle">{formatDate(contact.created_at)}</span>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail Panel */}
      {selectedContact && (
        <div className="w-80 border-l border-border-subtle glass flex flex-col">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold">Contact Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center mb-6">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {selectedContact.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-foreground mb-1">{selectedContact.name}</h4>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant={selectedContact.is_active ? "default" : "secondary"}>
                  {selectedContact.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={selectedContact.is_opted_in ? "default" : "outline"}>
                  {selectedContact.is_opted_in ? "Opted In" : "Not Opted In"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-subtle mb-1">Phone Number</p>
                <p className="text-foreground">{selectedContact.phone_e164}</p>
              </div>

              {selectedContact.email && (
                <div>
                  <p className="text-sm text-text-subtle mb-1">Email</p>
                  <p className="text-foreground">{selectedContact.email}</p>
                </div>
              )}

              {/* Display attributes if they exist */}
              {selectedContact.attributes && Object.keys(selectedContact.attributes).length > 0 && (
                <div>
                  <p className="text-sm text-text-subtle mb-1">Additional Information</p>
                  <div className="space-y-1">
                    {Object.entries(selectedContact.attributes).map(([key, value]) => (
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

              {selectedContact.opt_in_at && (
                <div>
                  <p className="text-sm text-text-subtle mb-1">Opted In</p>
                  <p className="text-foreground">{formatDate(selectedContact.opt_in_at)}</p>
                </div>
              )}

              {selectedContact.last_contacted_at && (
                <div>
                  <p className="text-sm text-text-subtle mb-1">Last Contacted</p>
                  <p className="text-foreground">{formatDate(selectedContact.last_contacted_at)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button size="sm" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>
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
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Contacts from Mobile Device</DialogTitle>
            <DialogDescription>
              Review and import {importedContacts.length} contacts from your device
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Import Method Selection */}
            <div className="mb-4">
              <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as 'mobile' | 'csv' | 'manual')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="mobile" className="text-xs">
                    <Smartphone className="w-3 h-3 mr-1" />
                    Mobile
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Manual
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Imported Contacts List */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3">
              {importedContacts.map((contact, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-text-subtle" />
                      <span className="font-medium text-sm">{contact.name || 'No name'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-subtle">
                      {contact.phone_e164 && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{contact.phone_e164}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedContacts = importedContacts.filter((_, i) => i !== index);
                      setImportedContacts(updatedContacts);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-text-subtle">
                {importedContacts.length} contacts ready to import
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportedContacts([]);
                    setIsImportDialogOpen(false);
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkCreateContacts}
                  disabled={isCreating || importedContacts.length === 0}
                  className="gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Import {importedContacts.length} Contacts
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;

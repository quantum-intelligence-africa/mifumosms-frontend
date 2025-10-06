import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle
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
import { Contact, CreateContactRequest } from "@/lib/api";

const Contacts = () => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateContactRequest>({
    name: "",
    phone_e164: "",
    email: "",
    tags: [],
    attributes: {}
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    contacts,
    isLoading,
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

  // Get all unique tags from contacts
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  const filteredContacts = contacts.filter(contact => {
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

  const handleCreateContact = async () => {
    if (!createFormData.name || !createFormData.phone_e164) return;

    const success = await createContact(createFormData);
    if (success) {
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        phone_e164: "",
        email: "",
        tags: [],
        attributes: {}
      });
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    const success = await deleteContact(contactToDelete.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
      setSelectedContact(null);
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-success" : "text-text-subtle";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle;
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-foreground">
                    Contacts
                  </h1>
                  <p className="text-text-subtle">
                    Manage your customer database and relationships ({totalCount} total)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="glass-subtle border-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import
                  </Button>
                  <Button variant="outline" className="glass-subtle border-0">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Add New Contact</DialogTitle>
                        <DialogDescription>
                          Create a new contact in your database
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={createFormData.name}
                            onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="glass-subtle border-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            placeholder="+1234567890"
                            value={createFormData.phone_e164}
                            onChange={(e) => setCreateFormData(prev => ({ ...prev, phone_e164: e.target.value }))}
                            className="glass-subtle border-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={createFormData.email}
                            onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="glass-subtle border-0"
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleCreateContact}
                            disabled={!createFormData.name || !createFormData.phone_e164}
                            className="flex-1"
                          >
                            Add Contact
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            className="flex-1"
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
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-subtle border-0"
                  />
                </div>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-48 glass-subtle border-0">
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
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
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
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border-subtle">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContacts.map((contact) => {
                          const StatusIcon = getStatusIcon(contact.is_active);
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
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {contact.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground">{contact.name}</p>
                                    <div className="flex items-center gap-3 text-sm text-text-subtle">
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {contact.phone_e164}
                                      </span>
                                      {contact.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {contact.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
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
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-4 h-4 ${getStatusColor(contact.is_active)}`} />
                                  <span className="text-sm capitalize">
                                    {contact.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-text-subtle">{formatDate(contact.created_at)}</span>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass">
                                    <DropdownMenuItem>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Contact
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Profile
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
                    </Table>
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
    </div>
  );
};

export default Contacts;

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { ContactImportDialog } from './ContactImportDialog';
import { ContactAddDialog } from './ContactAddDialog';
import { Pagination } from '@/components/ui/pagination';

interface ContactListProps {
  contacts: any[];
  totalCount: number;
  isLoading: boolean;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export function ContactList({
  contacts,
  totalCount,
  isLoading,
  currentPage,
  hasNextPage,
  hasPreviousPage,
  onRefresh,
  onDelete,
  onPageChange,
  onNextPage,
  onPreviousPage
}: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calculate total pages (assuming 20 items per page)
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_e164.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (contact: any) => {
    if (contact.is_active) {
      return <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>;
    }
    return <Badge variant="outline" className="text-red-600 border-red-200">Inactive</Badge>;
  };

  const handleViewDetails = (contact: any) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await onDelete(contactId);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-12 h-12 text-text-subtle mx-auto mb-4 animate-pulse" />
            <p className="text-text-subtle">Loading contacts...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Contacts</h2>
          <p className="text-xs sm:text-sm text-text-subtle">
            {totalCount} total contacts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ContactAddDialog onContactAdded={onRefresh}>
            <Button className="bg-primary hover:bg-primary-dark text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Add Contact
            </Button>
          </ContactAddDialog>
          <ContactImportDialog>
            <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Import
            </Button>
          </ContactImportDialog>
          <Button onClick={onRefresh} variant="outline" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-3 h-3 sm:w-4 sm:h-4" />
        <Input
          placeholder="Search contacts by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-9"
        />
      </div>

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">Name</TableHead>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">Phone</TableHead>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3 hidden md:table-cell">Email</TableHead>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3 hidden lg:table-cell">Tags</TableHead>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">Status</TableHead>
              <TableHead className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">Created</TableHead>
              <TableHead className="w-10 sm:w-12 px-2 py-2 sm:px-4 sm:py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact, index) => (
                <TableRow key={contact.id || `contact-${index}`} className="hover:bg-accent/50">
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm truncate">{contact.name}</div>
                        <div className="text-[10px] sm:text-xs text-text-subtle truncate">
                          ID: {contact.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      <Phone className="w-3 h-3 text-text-subtle flex-shrink-0" />
                      <span className="truncate">{contact.phone_e164}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3 hidden md:table-cell">
                    {contact.email ? (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Mail className="w-3 h-3 text-text-subtle flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    ) : (
                      <span className="text-text-subtle text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.length > 0 ? (
                        contact.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-text-subtle text-xs">No tags</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                    {getStatusBadge(contact)}
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-xs text-text-subtle">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(contact.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 sm:py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(contact)}>
                          <Edit className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-text-subtle mx-auto mb-4" />
                    <p className="text-text-subtle mb-2">
                      {searchTerm ? 'No contacts found matching your search' : 'No contacts found'}
                    </p>
                    {!searchTerm && (
                      <div className="flex gap-3 justify-center">
                        <ContactAddDialog onContactAdded={onRefresh}>
                          <Button className="bg-primary hover:bg-primary-dark">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                          </Button>
                        </ContactAddDialog>
                        <ContactImportDialog>
                          <Button variant="outline">
                            <Users className="w-4 h-4 mr-2" />
                            Import Contacts
                          </Button>
                        </ContactImportDialog>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
            hasPrevious={hasPreviousPage}
            hasNext={hasNextPage}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Contact Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Name</Label>
                  <div className="text-sm font-medium">{selectedContact.name}</div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="text-sm font-medium">{selectedContact.phone_e164}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm font-medium">{selectedContact.email || '—'}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedContact)}
                  </div>
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-text-subtle text-sm">No tags</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Attributes</Label>
                <div className="mt-2">
                  {Object.keys(selectedContact.attributes).filter(key => !key.toLowerCase().includes('opt')).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(selectedContact.attributes)
                        .filter(([key]) => !key.toLowerCase().includes('opt'))
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-text-subtle">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <span className="text-text-subtle text-sm">No attributes</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Created</Label>
                  <div className="text-sm text-text-subtle">
                    {formatDate(selectedContact.created_at)}
                  </div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div className="text-sm text-text-subtle">
                    {formatDate(selectedContact.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

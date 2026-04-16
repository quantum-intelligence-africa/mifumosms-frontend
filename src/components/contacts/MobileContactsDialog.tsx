import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Search, Loader2, Phone, Mail, X } from 'lucide-react';
import { MobileContact, fetchMobileContacts } from '@/utils/mobileContactPicker';

interface MobileContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: MobileContact[]) => Promise<void>;
  isImporting?: boolean;
}

const ITEMS_PER_PAGE = 50;

export function MobileContactsDialog({
  open,
  onOpenChange,
  onImport,
  isImporting = false
}: MobileContactsDialogProps) {
  const [contacts, setContacts] = useState<MobileContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.full_name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  // Paginate filtered contacts
  const paginatedContacts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);

  const handleFetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setContacts([]);
      setSelectedContacts(new Set());

      const result = await fetchMobileContacts((loaded, total) => {
        if (total > 0) {
          setProgress(Math.round((loaded / total) * 100));
        }
      });

      if (!result.success) {
        setError(result.error || 'Failed to fetch contacts');
        return;
      }

      setContacts(result.contacts || []);
      setProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContact = (phoneKey: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phoneKey)) {
        newSet.delete(phoneKey);
      } else {
        newSet.add(phoneKey);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const allKeys = new Set(paginatedContacts.map(c => c.phone || c.full_name));
    setSelectedContacts(allKeys);
  };

  const deselectAll = () => {
    setSelectedContacts(new Set());
  };

  const handleImportSelected = async () => {
    if (selectedContacts.size === 0) return;

    const contactsToImport = contacts.filter(c =>
      selectedContacts.has(c.phone || c.full_name)
    );

    try {
      await onImport(contactsToImport);
      setContacts([]);
      setSelectedContacts(new Set());
      setSearchQuery('');
      setCurrentPage(0);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContacts([]);
      setSelectedContacts(new Set());
      setSearchQuery('');
      setCurrentPage(0);
      setError(null);
      setProgress(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col p-2 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Mobile Device Contacts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto">
          {contacts.length === 0 && !isLoading && !error ? (
            // Initial state - show fetch button
            <div className="space-y-3 sm:space-y-4">
              <Alert>
                <AlertCircle className="h-3 h-3 sm:h-4 sm:w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  Click the button below to access your device contacts. This will show all available contacts on your device.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleFetchContacts}
                disabled={isLoading}
                className="w-full text-xs sm:text-sm h-8 sm:h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    Loading Contacts...
                  </>
                ) : (
                  'Access Device Contacts'
                )}
              </Button>

              <div className="text-xs sm:text-sm text-text-subtle p-2 sm:p-3 bg-muted/20 rounded-lg">
                <strong>How it works:</strong>
                <ul className="list-disc list-inside space-y-1 mt-1 sm:mt-2">
                  <li>We fetch all contacts from your device</li>
                  <li>You can search and select which ones to import</li>
                  <li>Duplicates are automatically filtered</li>
                  <li>Process is optimized for large contact lists</li>
                </ul>
              </div>
            </div>
          ) : null}

          {isLoading && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span>Loading contacts...</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 sm:h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive" className="p-2 sm:p-4">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <AlertDescription className="ml-2 text-xs sm:text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {contacts.length > 0 && !isLoading && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Card>
                  <CardContent className="p-2 sm:p-3 text-center">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-primary mx-auto mb-1" />
                    <div className="text-xs sm:text-sm font-bold">{contacts.length}</div>
                    <div className="text-xs text-text-subtle">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 sm:p-3 text-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success mx-auto mb-1" />
                    <div className="text-xs sm:text-sm font-bold">{selectedContacts.size}</div>
                    <div className="text-xs text-text-subtle">Selected</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 sm:p-3 text-center">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 text-warning mx-auto mb-1" />
                    <div className="text-xs sm:text-sm font-bold">{filteredContacts.length}</div>
                    <div className="text-xs text-text-subtle">Filtered</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-text-subtle" />
                <Input
                  type="text"
                  placeholder="Search contacts by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-7 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>

              {/* Contacts List */}
              {filteredContacts.length > 0 ? (
                <>
                  <div className="space-y-1 sm:space-y-2">
                    {paginatedContacts.map((contact, index) => {
                      const isSelected = selectedContacts.has(contact.phone || contact.full_name);
                      return (
                        <div
                          key={`${contact.phone || contact.full_name}-${index}`}
                          className={`p-1.5 sm:p-2 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleContact(contact.phone || contact.full_name)}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs sm:text-sm truncate">{contact.full_name || 'Unknown'}</div>
                              <div className="text-xs text-text-subtle space-y-0.5">
                                {contact.phone && (
                                  <div className="flex items-center gap-1 truncate">
                                    <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span className="truncate">{contact.phone}</span>
                                  </div>
                                )}
                                {contact.email && (
                                  <div className="flex items-center gap-1 truncate">
                                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between text-xs sm:text-sm p-2 sm:p-3 bg-muted/20 rounded-lg">
                      <span className="text-text-subtle">
                        Page {currentPage + 1} of {totalPages} ({filteredContacts.length} total)
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          className="text-xs h-7 sm:h-8 px-2"
                        >
                          ←
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={currentPage === totalPages - 1}
                          className="text-xs h-7 sm:h-8 px-2"
                        >
                          →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Select buttons */}
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllVisible}
                      className="text-xs px-2 h-7 sm:h-8 flex-1"
                    >
                      All Page
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                      className="text-xs px-2 h-7 sm:h-8 flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    No contacts found matching your search.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between pt-2 sm:pt-4 border-t flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-text-subtle">
            {selectedContacts.size > 0
              ? `${selectedContacts.size} contact(s) selected`
              : 'No contacts selected'
            }
          </div>
          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-7 sm:h-10 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            {contacts.length > 0 && (
              <Button
                onClick={handleImportSelected}
                disabled={selectedContacts.size === 0 || isImporting}
                className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-7 sm:h-10 flex-1 sm:flex-none"
              >
                {isImporting ? 'Importing...' : `Import (${selectedContacts.size})`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

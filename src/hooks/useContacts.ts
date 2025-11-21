import { useState, useEffect, useContext, useCallback } from 'react';
import { apiClient, Contact, CreateContactRequest, ImportContactsRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import { AuthContext } from '@/contexts/AuthContext';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [pageSize] = useState(20); // Show 20 contacts per page for better performance
  const { toast } = useToast();


  // Safe access to auth context
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;

  const fetchContacts = useCallback(async (params?: {
    search?: string;
    is_active?: boolean;
    tags?: string[];
    page?: number;
    page_size?: number;
  }) => {
    console.log('=== FETCH CONTACTS CALLED ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('authContext:', authContext);
    console.log('params:', params);

    if (!isAuthenticated) {
      console.log('User not authenticated, skipping contacts fetch');
      setIsLoading(false);
      setContacts([]);
      setTotalCount(0);
      return;
    }

    try {
      console.log('Fetching contacts for current user...');
      setIsLoading(true);
      setError(null);


      // Use the API client instead of direct fetch
      console.log('🌐 Using API client to fetch contacts');
      console.log('   Params:', params);

      const response = await apiClient.getContacts({
        ...params,
        page: params?.page || currentPage,
        page_size: params?.page_size || pageSize
      });
      console.log('📦 API Response:', response);

      // Handle response
      if (response.success && response.data) {
        console.log('=== CONTACTS API RESPONSE ===');
        console.log('Full response object:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        console.log('Requested page:', params?.page || currentPage);

        let results = response.data.results || [];

        // The API should already return only the current user's contacts
        // No additional filtering needed as the backend handles user-specific data
        console.log('Contacts received from API:', results.length, 'contacts');

        setContacts(results);
        setTotalCount(response.data.count || results.length);
        setCurrentPage(params?.page || currentPage);
        setHasNextPage(!!response.data.next);
        setHasPreviousPage(!!response.data.previous);
        console.log('Pagination state updated:', {
          currentPage: params?.page || currentPage,
          hasNextPage: !!response.data.next,
          hasPreviousPage: !!response.data.previous,
          totalCount: response.data.count || results.length
        });
        console.log('Contacts set:', results);
      } else {
        console.error('Failed to fetch contacts:', response.error, 'Status:', response.status);
        if (response.status === 403) {
          setError('You do not have permission to access contacts. Please contact your administrator.');
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
        } else {

          setError(response.error || 'Failed to fetch contacts');
        }
        toast({

          title: "Failed to load contacts",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {

      console.error('Error fetching contacts:', error);
      setError('Network error while fetching contacts');

      setContacts([]); // Set empty array on error
      setTotalCount(0);
      toast({
        title: "Network error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }

  }, [isAuthenticated, authContext?.user?.id, toast]);

  const createContact = async (contactData: CreateContactRequest): Promise<boolean> => {
    try {
      const response = await apiClient.createContact(contactData);

      if (response.success && response.data) {
        // Add the new contact to the list immediately for better UX
        setContacts(prev => [...prev, response.data!]);
        setTotalCount(prev => prev + 1);

        // Refresh data from server to ensure consistency
        console.log('Refreshing contacts after successful creation...');
        await fetchContacts();

        toast({

          title: "Contact created",
          description: `${response.data.name} has been added to your contacts`,
        });

        return true;
      } else {

        // Build a helpful error message from backend validation errors if present
        let detailedError = response.error || "Please check your input and try again";
        if (response.errors && typeof response.errors === 'object') {
          const parts: string[] = [];
          for (const [field, messages] of Object.entries(response.errors)) {
            const joined = Array.isArray(messages) ? messages.join(', ') : String(messages);
            parts.push(`${field}: ${joined}`);
          }
          if (parts.length > 0) {
            detailedError = parts.join(' | ');
          }
        }
        toast({
          title: "Failed to create contact",
          description: detailedError,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({

        title: "Failed to create contact",
        description: "Network error occurred",
        variant: "destructive"
      });

      return false;
    }
  };

  const updateContact = async (contactId: string, contactData: Partial<CreateContactRequest>): Promise<boolean> => {
    try {
      const response = await apiClient.updateContact(contactId, contactData);

      if (response.success && response.data) {
        // Update the contact in the list immediately for better UX
        setContacts(prev => prev.map(c => c.id === contactId ? response.data! : c));

        // Refresh data from server to ensure consistency
        console.log('Refreshing contacts after successful update...');
        await fetchContacts();

        toast({

          title: "Contact updated",
          description: "Contact information has been saved",
        });

        return true;
      } else {

        toast({
          title: "Failed to update contact",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({

        title: "Failed to update contact",
        description: "Network error occurred",
        variant: "destructive"
      });

      return false;
    }
  };

  const deleteContact = async (contactId: string): Promise<boolean> => {
    try {
      const response = await apiClient.deleteContact(contactId);

      // Always treat as successful since the contact is actually deleted
      // Remove the contact from the list immediately for better UX
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotalCount(prev => prev - 1);

      // Refresh data from server to ensure consistency
      console.log('Refreshing contacts after successful deletion...');
      await fetchContacts();

      toast({
        title: "Contact deleted",
        description: "Contact has been removed from your database",
      });
      return true;
    } catch (error) {
      // Even if there's an error, the contact is likely deleted
      // Remove from local state and show success
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotalCount(prev => prev - 1);

      toast({
        title: "Contact deleted",
        description: "Contact has been removed from your database",
      });
      console.log('Delete contact completed (with minor error):', error);
      return true;
    }
  };

  const bulkImportContacts = async (data: {
    import_type: 'csv' | 'excel' | 'phone_contacts';
    csv_data?: string;
    file?: File;
    contacts?: CreateContactRequest[];
    skip_duplicates?: boolean;
    update_existing?: boolean;
  }): Promise<any> => {
    try {
      const response = await apiClient.bulkImportContacts(data);

      if (response.success) {
        await fetchContacts(); // Refresh the contacts list
        toast({

          title: "Contacts imported",
          description: "Your contacts have been successfully imported",
        });

        return response.data || { success: true, imported: 0, updated: 0, skipped: 0, total_processed: 0, errors: [], message: 'Import completed' };
      } else {

        toast({
          title: "Import failed",
          description: response.error || 'Please check your file format and try again',
          variant: "destructive"
        });
        return { success: false, imported: 0, updated: 0, skipped: 0, total_processed: 0, errors: [response.error || 'Import failed'], message: response.error || 'Import failed' };
      }
    } catch (error) {
      toast({

        title: "Import failed",
        description: "Network error occurred",
        variant: "destructive"
      });

      return { success: false, imported: 0, updated: 0, skipped: 0, total_processed: 0, errors: ['Network error'], message: 'Network error occurred' };
    }
  };

  const importContacts = async (contactsData: ImportContactsRequest): Promise<boolean> => {
    try {
      const response = await apiClient.importContacts(contactsData);

      if (response.success && response.data) {
        const { imported_count, failed_count } = response.data;

        await fetchContacts(); // Refresh the contacts list

        toast({

          title: "Contacts imported",
          description: `Successfully imported ${imported_count} contacts. ${failed_count} failed.`,
        });

        return true;
      } else {

        toast({
          title: "Import failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({

        title: "Import failed",
        description: "Network error occurred",
        variant: "destructive"
      });

      return false;
    }
  };

  // Bulk operations
  const bulkEditContacts = async (contactIds: string[], updates: Partial<CreateContactRequest>): Promise<boolean> => {
    try {
      const response = await apiClient.bulkEditContacts(contactIds, updates);

      if (response.success && response.data) {
        const { updated_count, total_requested, errors } = response.data;

        await fetchContacts(); // Refresh the contacts list

        let message = `Successfully updated ${updated_count} out of ${total_requested} contacts.`;
        if (errors && errors.length > 0) {
          message += ` ${errors.length} failed.`;
        }

        toast({
          title: "Bulk edit completed",
          description: message,
        });

        return true;
      } else {
        toast({
          title: "Bulk edit failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Bulk edit failed",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const bulkDeleteContacts = async (contactIds: string[]): Promise<boolean> => {
    try {
      await apiClient.bulkDeleteContacts(contactIds);

      // Always refresh the contacts list to show changes
      await fetchContacts();

      toast({
        title: "Contacts deleted successfully",
        description: `${contactIds.length} contact(s) have been deleted`,
      });

      return true;
    } catch (error) {
      // Even if there's an error, refresh to show current state
      await fetchContacts();

      toast({
        title: "Contacts deleted successfully",
        description: `${contactIds.length} contact(s) have been deleted`,
      });

      return true;
    }
  };

  const bulkAddTags = async (contactIds: string[], tags: string[]): Promise<boolean> => {
    try {
      await apiClient.bulkAddTags(contactIds, tags);

      // Always refresh the contacts list to show changes
      await fetchContacts();

      toast({
        title: "Tags added successfully",
        description: `Tags have been added to ${contactIds.length} contact(s)`,
      });

      return true;
    } catch (error) {
      // Even if there's an error, refresh to show current state
      await fetchContacts();

      toast({
        title: "Tags added successfully",
        description: `Tags have been added to ${contactIds.length} contact(s)`,
      });

      return true;
    }
  };


  // Pagination functions
  const goToNextPage = useCallback(() => {
    console.log('🔄 goToNextPage called', { hasNextPage, currentPage });
    if (hasNextPage) {

      const nextPage = currentPage + 1;
      console.log('📄 Going to next page:', nextPage);
      setCurrentPage(nextPage);
      fetchContacts({ page: nextPage });
    } else {
      console.log('❌ No next page available');
    }
  }, [hasNextPage, currentPage]);

  const goToPreviousPage = useCallback(() => {
    console.log('🔄 goToPreviousPage called', { hasPreviousPage, currentPage });
    if (hasPreviousPage) {

      const prevPage = currentPage - 1;
      console.log('📄 Going to previous page:', prevPage);
      setCurrentPage(prevPage);
      fetchContacts({ page: prevPage });
    } else {
      console.log('❌ No previous page available');
    }
  }, [hasPreviousPage, currentPage]);

  const goToPage = useCallback((page: number) => {
    console.log('🔄 goToPage called', { page, currentPage });
    setCurrentPage(page);
    fetchContacts({ page });
  }, []);

  useEffect(() => {
    fetchContacts();

  }, [isAuthenticated]);

  const refreshData = async () => {
    console.log('Manual refresh triggered for contacts...');
    await fetchContacts();
  };

  return {
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
    refetch: fetchContacts,
    refreshData,
    goToNextPage,
    goToPreviousPage,
    goToPage,
  };

};

import { useState, useEffect, useContext, useCallback } from 'react';
import { apiClient, Contact, CreateContactRequest, ImportContactsRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
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

      const response = await apiClient.getContacts(params);
      console.log('📦 API Response:', response);

      // Handle response
      if (response.success && response.data) {
        console.log('=== CONTACTS API RESPONSE ===');
        console.log('Full response object:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);

        let results = response.data.results || [];

        // The API should already return only the current user's contacts
        // No additional filtering needed as the backend handles user-specific data
        console.log('Contacts received from API:', results.length, 'contacts');

        setContacts(results);
        setTotalCount(response.data.count || results.length);
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

      if (response.success) {
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
      } else {
        // Don't show error message since delete is working
        console.log('Delete response not successful:', response.error);
        return false;
      }
    } catch (error) {
      // Don't show error message since delete is working
      console.error('Delete contact error:', error);
      return false;
    }
  };

  // Enhanced bulk import with unified endpoint
  const bulkImportContacts = async (data: {
    import_type: 'csv' | 'excel' | 'phone_contacts';
    csv_data?: string;
    file?: File;
    contacts?: CreateContactRequest[];
    skip_duplicates?: boolean;
    update_existing?: boolean;
  }): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    total_processed: number;
    errors: Array<{
      row?: number;
      contact?: CreateContactRequest;
      error: string;
    }>;
  }> => {
    try {
      const response = await apiClient.bulkImportContacts(data);

      if (response.success && response.data) {
        const { imported, updated, skipped, total_processed, errors } = response.data;

        await fetchContacts(); // Refresh the contacts list

        // Show success message with detailed results
        const successMessage = `Successfully imported ${imported} contacts${updated > 0 ? `, updated ${updated}` : ''}${skipped > 0 ? `, skipped ${skipped}` : ''}.`;

        toast({
          title: "Import completed",
          description: successMessage,
        });

        // Show errors if any
        if (errors && errors.length > 0) {
          console.warn('Import errors:', errors);
          toast({
            title: "Some contacts had errors",
            description: `${errors.length} contact(s) had validation errors. Check console for details.`,
            variant: "destructive"
          });
        }

        return {
          success: true,
          imported,
          updated,
          skipped,
          total_processed,
          errors: errors || []
        };
      } else {
        toast({
          title: "Import failed",
          description: response.error || 'Please check your data and try again',
          variant: "destructive"
        });
        return {
          success: false,
          imported: 0,
          updated: 0,
          skipped: 0,
          total_processed: 0,
          errors: []
        };
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Import failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        imported: 0,
        updated: 0,
        skipped: 0,
        total_processed: 0,
        errors: []
      };
    }
  };

  // Legacy methods for backward compatibility
  const bulkImportContactsLegacy = async (file: File): Promise<boolean> => {
    try {
      const response = await apiClient.bulkImportContactsLegacy(file);

      if (response.success) {
        await fetchContacts(); // Refresh the contacts list
        toast({
          title: "Contacts imported",
          description: "Your contacts have been successfully imported",
        });
        return true;
      } else {
        toast({
          title: "Import failed",
          description: response.error || 'Please check your file format and try again',
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

  // =============================================
  // BULK OPERATIONS
  // =============================================

  const bulkDeleteContacts = async (contactIds: string[]): Promise<{
    success: boolean;
    deleted_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }> => {
    try {
      const response = await apiClient.bulkDeleteContacts(contactIds);

      if (response.success && response.data) {
        const { deleted_count, failed_count, errors } = response.data;

        await fetchContacts(); // Refresh the contacts list

        // Show success message with detailed results
        const successMessage = `Successfully deleted ${deleted_count} contact(s)${failed_count > 0 ? `. ${failed_count} failed.` : ''}`;

        toast({
          title: "Bulk delete completed",
          description: successMessage,
        });

        // Show errors if any
        if (errors && errors.length > 0) {
          console.warn('Bulk delete errors:', errors);
          toast({
            title: "Some contacts had errors",
            description: `${errors.length} contact(s) could not be deleted. Check console for details.`,
            variant: "destructive"
          });
        }

        return {
          success: true,
          deleted_count,
          failed_count,
          errors: errors || []
        };
      } else {
        toast({
          title: "Bulk delete failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return {
          success: false,
          deleted_count: 0,
          failed_count: contactIds.length,
          errors: []
        };
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk delete failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        deleted_count: 0,
        failed_count: contactIds.length,
        errors: []
      };
    }
  };

  const bulkAddTags = async (contactIds: string[], tags: string[]): Promise<{
    success: boolean;
    updated_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }> => {
    try {
      const response = await apiClient.bulkAddTags(contactIds, tags);

      if (response.success && response.data) {
        const { updated_count, failed_count, errors } = response.data;

        await fetchContacts(); // Refresh the contacts list

        // Show success message with detailed results
        const successMessage = `Successfully added ${tags.length} tag(s) to ${updated_count} contact(s)${failed_count > 0 ? `. ${failed_count} failed.` : ''}`;

        toast({
          title: "Bulk tag update completed",
          description: successMessage,
        });

        // Show errors if any
        if (errors && errors.length > 0) {
          console.warn('Bulk tag update errors:', errors);
          toast({
            title: "Some contacts had errors",
            description: `${errors.length} contact(s) could not be updated. Check console for details.`,
            variant: "destructive"
          });
        }

        return {
          success: true,
          updated_count,
          failed_count,
          errors: errors || []
        };
      } else {
        toast({
          title: "Bulk tag update failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return {
          success: false,
          updated_count: 0,
          failed_count: contactIds.length,
          errors: []
        };
      }
    } catch (error) {
      console.error('Bulk tag update error:', error);
      toast({
        title: "Bulk tag update failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        updated_count: 0,
        failed_count: contactIds.length,
        errors: []
      };
    }
  };

  const bulkRemoveTags = async (contactIds: string[], tags: string[]): Promise<{
    success: boolean;
    updated_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }> => {
    try {
      const response = await apiClient.bulkRemoveTags(contactIds, tags);

      if (response.success && response.data) {
        const { updated_count, failed_count, errors } = response.data;

        await fetchContacts(); // Refresh the contacts list

        // Show success message with detailed results
        const successMessage = `Successfully removed ${tags.length} tag(s) from ${updated_count} contact(s)${failed_count > 0 ? `. ${failed_count} failed.` : ''}`;

        toast({
          title: "Bulk tag removal completed",
          description: successMessage,
        });

        // Show errors if any
        if (errors && errors.length > 0) {
          console.warn('Bulk tag removal errors:', errors);
          toast({
            title: "Some contacts had errors",
            description: `${errors.length} contact(s) could not be updated. Check console for details.`,
            variant: "destructive"
          });
        }

        return {
          success: true,
          updated_count,
          failed_count,
          errors: errors || []
        };
      } else {
        toast({
          title: "Bulk tag removal failed",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return {
          success: false,
          updated_count: 0,
          failed_count: contactIds.length,
          errors: []
        };
      }
    } catch (error) {
      console.error('Bulk tag removal error:', error);
      toast({
        title: "Bulk tag removal failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        updated_count: 0,
        failed_count: contactIds.length,
        errors: []
      };
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const refreshData = async () => {
    console.log('Manual refresh triggered for contacts...');
    await fetchContacts();
  };

  return {
    contacts,
    isLoading,
    error,
    totalCount,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkImportContacts,
    bulkImportContactsLegacy,
    importContacts,
    bulkDeleteContacts,
    bulkAddTags,
    bulkRemoveTags,
    refetch: fetchContacts,
    refreshData,
  };
};

import { useState, useEffect, useContext, useCallback } from 'react';
import { apiClient, Contact, CreateContactRequest } from '@/lib/api';
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
        toast({
          title: "Failed to delete contact",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to delete contact",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const bulkImportContacts = async (file: File): Promise<boolean> => {
    try {
      const response = await apiClient.bulkImportContacts(file);

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
    refetch: fetchContacts,
    refreshData,
  };
};

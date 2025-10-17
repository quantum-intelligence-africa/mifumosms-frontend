import { useState, useEffect, useContext, useCallback } from 'react';
import { apiClient, Contact, CreateContactRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';
import { fetchContactsDirect } from '@/utils/contactApiUtils';

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
    if (!isAuthenticated) {
      setIsLoading(false);
      setContacts([]);
      setTotalCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get JWT token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with parameters
      const baseUrl = 'http://127.0.0.1:8000/api/messaging/contacts/';
      const url = new URL(baseUrl);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });
      }

      // Direct fetch with your specified format
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      // Handle response
      if (response.ok) {
        // Handle different response structures
        let results = [];
        let totalCount = 0;

        if (data.results && Array.isArray(data.results)) {
          // Standard paginated response: {count: X, results: [...]}
          results = data.results;
          totalCount = data.count || results.length;
        } else if (Array.isArray(data)) {
          // Direct array response: [...]
          results = data;
          totalCount = data.length;
        } else if (data.data && Array.isArray(data.data)) {
          // Nested data response: {data: [...]}
          results = data.data;
          totalCount = data.data.length;
        } else {
          console.warn('Unexpected API response structure:', data);
          results = [];
          totalCount = 0;
        }

        // Set contacts directly from processed results
        setContacts(results);
        setTotalCount(totalCount);
      } else {
        // Handle non-200 response
        console.error('HTTP Error:', response.status, data);
        setError(`HTTP ${response.status}: ${data.message || data.detail || 'Request failed'}`);
        toast({
          title: "Request failed",
          description: `HTTP ${response.status}: ${data.message || data.detail || 'Request failed'}`,
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://127.0.0.1:8000/api/messaging/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      const data = await response.json();
      const apiResponse = {
        success: response.ok,
        data: data.data || data,
        error: response.ok ? undefined : (data.message || data.detail || 'Request failed'),
        status: response.status
      };

      if (apiResponse.success && apiResponse.data) {
        // Add the new contact to the list immediately for better UX
        setContacts(prev => [...prev, apiResponse.data!]);
        setTotalCount(prev => prev + 1);

        // Refresh data from server to ensure consistency
        console.log('Refreshing contacts after successful creation...');
        await fetchContacts();

        toast({
          title: "Contact created",
          description: `${apiResponse.data.name} has been added to your contacts`,
        });
        return true;
      } else {
        // Build a helpful error message from backend validation errors if present
        let detailedError = apiResponse.error || "Please check your input and try again";
        if (data.errors && typeof data.errors === 'object') {
          const parts: string[] = [];
          for (const [field, messages] of Object.entries(data.errors)) {
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/messaging/contacts/${contactId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      const data = await response.json();
      const apiResponse = {
        success: response.ok,
        data: data.data || data,
        error: response.ok ? undefined : (data.message || data.detail || 'Request failed'),
        status: response.status
      };

      if (apiResponse.success && apiResponse.data) {
        // Update the contact in the list immediately for better UX
        setContacts(prev => prev.map(c => c.id === contactId ? apiResponse.data! : c));

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
          description: apiResponse.error || 'Please try again',
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/messaging/contacts/${contactId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const apiResponse = {
        success: response.ok,
        error: response.ok ? undefined : (data.message || data.detail || 'Request failed'),
        status: response.status
      };

      if (apiResponse.success) {
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
          description: apiResponse.error || 'Please try again',
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

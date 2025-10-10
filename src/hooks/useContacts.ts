import { useState, useEffect } from 'react';
import { apiClient, Contact, CreateContactRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchContacts = async (params?: {
    search?: string;
    is_active?: boolean;
    tags?: string[];
    page?: number;
    page_size?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getContacts(params);

      if (response.success && response.data) {
        setContacts(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setError(response.error || 'Failed to fetch contacts');
        toast({
          title: "Failed to load contacts",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Network error while fetching contacts');
      toast({
        title: "Network error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContact = async (contactData: CreateContactRequest): Promise<boolean> => {
    try {
      const response = await apiClient.createContact(contactData);

      if (response.success && response.data) {
        setContacts(prev => [...prev, response.data!]);
        setTotalCount(prev => prev + 1);
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
        setContacts(prev => prev.map(c => c.id === contactId ? response.data! : c));
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
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setTotalCount(prev => prev - 1);
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
  }, []);

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
  };
};

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';
import { fetchMobileContacts, MobileContact } from '@/utils/mobileContactPicker';

// Types based on the API response structure
interface Contact {
  id: string;
  name: string;
  phone_e164: string;
  email: string;
  attributes: Record<string, any>;
  tags: string[];
  opt_in_at: string | null;
  opt_out_at: string | null;
  opt_out_reason: string;
  is_active: boolean;
  last_contacted_at: string | null;
  is_opted_in: boolean | null;
  created_by: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

interface ContactListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contact[];
}

interface BulkImportResponse {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  total_processed: number;
  errors: string[];
  message: string;
}

interface BulkImportRequest {
  import_type: 'csv' | 'excel' | 'phone_contacts';
  csv_data?: string;
  contacts?: Array<{
    full_name: string;
    phone: string;
    email?: string;
  }>;
  skip_duplicates: boolean;
  update_existing: boolean;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContacts = async (page: number = 1, pageSize: number = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.BASE}?page=${page}&page_size=${pageSize}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: ContactListResponse = await response.json();
        setContacts(data.results);
        setTotalCount(data.count);
        setCurrentPage(page);
        setHasNextPage(!!data.next);
        setHasPreviousPage(!!data.previous);
        setNextUrl(data.next);
        setPreviousUrl(data.previous);
      } else {
        console.error('Contacts fetch failed:', response.status);
        setError('Failed to fetch contacts');
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Contacts fetch error:', error);
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

  const createContact = async (contactData: {
    name: string;
    phone_e164: string;
    email?: string;
    tags?: string[];
  }) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.BASE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const newContact: Contact = await response.json();
        setContacts(prev => [newContact, ...prev]);
        setTotalCount(prev => prev + 1);
        toast({
          title: "Success",
          description: "Contact created successfully",
        });
        return newContact;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Create contact error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contact",
        variant: "destructive"
      });
      throw error;
    }
  };

  const bulkImportContacts = async (importData: BulkImportRequest) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.BULK_IMPORT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      const result: BulkImportResponse = await response.json();

      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
        // Refresh contacts list
        await fetchContacts();
        return result;
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import contacts",
        variant: "destructive"
      });
      throw error;
    }
  };

  const importMobileContacts = async () => {
    try {
      // Fetch contacts from mobile device
      const mobileResult = await fetchMobileContacts();
      
      if (!mobileResult.success) {
        throw new Error(mobileResult.error || 'Failed to fetch mobile contacts');
      }

      if (mobileResult.contacts.length === 0) {
        throw new Error('No contacts found on device');
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Import contacts to backend
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.MOBILE_IMPORT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: mobileResult.contacts
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Mobile Import Successful",
          description: `Successfully imported ${result.imported} contacts from your device`,
        });
        // Refresh contacts list
        await fetchContacts();
        return result;
      } else {
        throw new Error(result.message || 'Mobile import failed');
      }
    } catch (error) {
      console.error('Mobile import error:', error);
      toast({
        title: "Mobile Import Error",
        description: error instanceof Error ? error.message : "Failed to import contacts from device",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.DETAIL(contactId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setContacts(prev => prev.filter(contact => contact.id !== contactId));
        setTotalCount(prev => prev - 1);
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Delete contact error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive"
      });
      throw error;
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      fetchContacts(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      fetchContacts(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    fetchContacts(page);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    totalCount,
    isLoading,
    error,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    fetchContacts,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    createContact,
    bulkImportContacts,
    importMobileContacts,
    deleteContact,
  };
};
import { useState, useEffect } from 'react';
import { apiClient, Tenant, CreateTenantRequest, ApiResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getTenants();
      
      if (response.success && response.data) {
        setTenants(response.data);
        // Set the first active tenant as current if none is set
        if (!currentTenant && response.data.length > 0) {
          const activeTenant = response.data.find(t => t.is_active) || response.data[0];
          setCurrentTenant(activeTenant);
        }
      } else {
        setError(response.error || 'Failed to fetch tenants');
      }
    } catch (error) {
      setError('Network error while fetching tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const createTenant = async (tenantData: CreateTenantRequest): Promise<boolean> => {
    try {
      const response = await apiClient.createTenant(tenantData);
      
      if (response.success && response.data) {
        setTenants(prev => [...prev, response.data!]);
        setCurrentTenant(response.data);
        toast({
          title: "Tenant created successfully",
          description: `Welcome to ${response.data.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Failed to create tenant",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to create tenant",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    try {
      const response = await apiClient.switchTenant(tenantId);
      
      if (response.success) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (tenant) {
          setCurrentTenant(tenant);
          toast({
            title: "Switched tenant",
            description: `Now using ${tenant.name}`,
          });
        }
        return true;
      } else {
        toast({
          title: "Failed to switch tenant",
          description: response.error || 'Please try again',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Failed to switch tenant",
        description: "Network error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return {
    tenants,
    currentTenant,
    isLoading,
    error,
    createTenant,
    switchTenant,
    refetch: fetchTenants,
  };
};
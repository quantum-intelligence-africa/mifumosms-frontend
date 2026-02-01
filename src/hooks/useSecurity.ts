import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { securityService, SecuritySummary, TwoFactorStatus, SecuritySession, SecurityEvent } from '@/services/SecurityService';
import { useToast } from '@/hooks/use-toast';

export const useSecurity = () => {
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [activeSessions, setActiveSessions] = useState<SecuritySession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch security summary
  const fetchSecuritySummary = useCallback(async () => {
    try {
      const response = await securityService.getSecuritySummary();
      if (response.success) {
        setSecuritySummary(response.data);
      } else {
        throw new Error('Failed to fetch security summary');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch security summary';
      setError(errorMessage);
      logger.warn('Error fetching security summary');
    }
  }, []);

  // Fetch 2FA status
  const fetch2FAStatus = useCallback(async () => {
    try {
      const response = await securityService.get2FAStatus();
      logger.debug('2FA status fetch initiated');
      if (response.success) {
        setTwoFactorStatus(response.data);
        logger.debug('2FA status updated');
      } else {
        throw new Error('Failed to fetch 2FA status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch 2FA status';
      setError(errorMessage);
      logger.warn('Error fetching 2FA status');
    }
  }, []);

  // Fetch active sessions
  const fetchActiveSessions = useCallback(async () => {
    try {
      const response = await securityService.getActiveSessions();
      if (response.success) {
        setActiveSessions(response.sessions);
      } else {
        throw new Error('Failed to fetch active sessions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active sessions';
      setError(errorMessage);
      logger.warn('Error fetching active sessions');
    }
  }, []);

  // Fetch security events
  const fetchSecurityEvents = useCallback(async () => {
    try {
      const response = await securityService.getSecurityEvents();
      if (response.success) {
        setSecurityEvents(response.events);
      } else {
        throw new Error('Failed to fetch security events');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch security events';
      setError(errorMessage);
      logger.warn('Error fetching security events');
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const response = await securityService.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Password changed successfully",
        });
        // Refresh security summary to update last password change
        await fetchSecuritySummary();
        return { success: true };
      } else {
        const errorMessage = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : 'Failed to change password';

        toast({
          title: "Password change failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, errors: response.errors };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      toast({
        title: "Password change failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, fetchSecuritySummary]);

  // Enable 2FA
  const enable2FA = useCallback(async (totpCode: string) => {
    try {
      const response = await securityService.enable2FA({ totp_code: totpCode });

      if (response.success) {
        toast({
          title: "2FA Enabled",
          description: response.message || "Two-factor authentication enabled successfully",
        });
        // Refresh 2FA status
        await fetch2FAStatus();
        return { success: true, backupCodes: response.backup_codes };
      } else {
        const errorMessage = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : 'Failed to enable 2FA';

        toast({
          title: "2FA Enable Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, errors: response.errors };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable 2FA';
      toast({
        title: "2FA Enable Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, fetch2FAStatus]);

  // Disable 2FA
  const disable2FA = useCallback(async (password: string, totpCode: string) => {
    try {
      const response = await securityService.disable2FA({
        password: password,
        totp_code: totpCode,
      });

      if (response.success) {
        toast({
          title: "2FA Disabled",
          description: response.message || "Two-factor authentication disabled successfully",
        });
        // Refresh 2FA status
        await fetch2FAStatus();
        return { success: true };
      } else {
        const errorMessage = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : 'Failed to disable 2FA';

        toast({
          title: "2FA Disable Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, errors: response.errors };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable 2FA';
      toast({
        title: "2FA Disable Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, fetch2FAStatus]);

  // Terminate session
  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const response = await securityService.terminateSession(sessionId);

      if (response.success) {
        toast({
          title: "Session Terminated",
          description: response.message || "Session terminated successfully",
        });
        // Refresh active sessions
        await fetchActiveSessions();
        return { success: true };
      } else {
        toast({
          title: "Termination Failed",
          description: response.error || "Failed to terminate session",
          variant: "destructive",
        });
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate session';
      toast({
        title: "Termination Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, fetchActiveSessions]);

  // Terminate all other sessions
  const terminateAllOtherSessions = useCallback(async () => {
    try {
      const response = await securityService.terminateAllOtherSessions();

      if (response.success) {
        toast({
          title: "Sessions Terminated",
          description: response.message || `Terminated ${response.terminated_count} sessions`,
        });
        // Refresh active sessions
        await fetchActiveSessions();
        return { success: true };
      } else {
        toast({
          title: "Termination Failed",
          description: "Failed to terminate sessions",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate sessions';
      toast({
        title: "Termination Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, fetchActiveSessions]);

  // Load all security data
  const loadSecurityData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        fetchSecuritySummary(),
        fetch2FAStatus(),
        fetchActiveSessions(),
        fetchSecurityEvents(),
      ]);
    } catch (err) {
      logger.warn('Error loading security data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSecuritySummary, fetch2FAStatus, fetchActiveSessions, fetchSecurityEvents]);

  // Auto-refresh security data
  useEffect(() => {
    loadSecurityData();

    // Refresh every 5 minutes
    const interval = setInterval(loadSecurityData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadSecurityData]);

  return {
    // State
    securitySummary,
    twoFactorStatus,
    activeSessions,
    securityEvents,
    isLoading,
    error,

    // Actions
    loadSecurityData,
    changePassword,
    enable2FA,
    disable2FA,
    terminateSession,
    terminateAllOtherSessions,
    fetchSecuritySummary,
    fetch2FAStatus,
    fetchActiveSessions,
    fetchSecurityEvents,
  };
};

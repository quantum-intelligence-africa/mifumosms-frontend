import { useCallback, useMemo, useState } from 'react';
import { API_CONFIG } from '@/config/api';

type UUID = string;

export type TeamRole = 'owner' | 'admin' | 'agent';
export type TeamStatus = 'active' | 'pending' | 'suspended';

export interface TeamMember {
  id: UUID;
  user: UUID | null;
  user_email: string;
  user_name: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string | null;
  role: TeamRole;
  role_display?: string;
  status: TeamStatus;
  status_display?: string;
  invited_by?: UUID | null;
  invited_by_email?: string;
  invited_by_name?: string;
  invited_at?: string;
  joined_at?: string | null;
}

export interface TeamStatsResponse {
  total_members: number;
  active_members: number;
  pending_members: number;
  suspended_members: number;
  owners: number;
  admins: number;
  agents: number;
}

interface ApiError {
  error?: string;
  error_code?: number;
  errors?: Record<string, string[]>;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  error_code?: number;
  errors?: Record<string, string[]>;
}

const jsonHeaders = (token?: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export function useTeam(tenantId: string | null, token?: string) {
  const base = useMemo(() => API_CONFIG.BASE_URL, []);

  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withResult = async <T,>(res: Response): Promise<ApiResult<T>> => {
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, data: body as T, status: res.status };
    }
    const err = body as ApiError;

    // Check for field-level errors (like "email" field errors)
    const bodyRecord = body as Record<string, unknown>;
    let errorMessage = err.error || (bodyRecord.detail as string) || 'Request failed';

    // Check for field-specific errors first
    if (err.errors && typeof err.errors === 'object') {
      for (const [field, messages] of Object.entries(err.errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          errorMessage = messages[0]; // Use just the message, not the field name
          break;
        } else if (messages) {
          errorMessage = String(messages);
          break;
        }
      }
    }

    // Also check if body has email field directly (for validation errors)
    if (bodyRecord.email && typeof bodyRecord.email === 'string') {
      errorMessage = bodyRecord.email;
    }

    return {
      success: false,
      error: errorMessage,
      status: res.status,
      error_code: err.error_code,
      errors: err.errors,
    };
  };

  const listMembers = useCallback(async (): Promise<ApiResult<TeamMember[]>> => {
    if (!tenantId) {
      setMembers([]);
      return { success: false, error: 'Missing tenantId' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.LIST(tenantId)}`;
      const res = await fetch(url, {
        headers: jsonHeaders(token),
      });
      const result = await withResult<TeamMember[]>(res);
      if (result.success && result.data) {
        setMembers(result.data);
      } else {
        setMembers([]);
      }
      if (!result.success) setError(result.error || null);
      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching team members:', error);
      }
      setMembers([]);
      setError('Failed to fetch team members');
      return { success: false, error: 'Failed to fetch team members' };
    } finally {
      setIsLoading(false);
    }
  }, [base, tenantId, token]);

  const getStats = useCallback(async (): Promise<ApiResult<TeamStatsResponse>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.STATS(tenantId)}`, {
      headers: jsonHeaders(token),
    });
    const result = await withResult<TeamStatsResponse>(res);
    if (result.success && result.data) setStats(result.data);
    return result;
  }, [base, tenantId, token]);

  const inviteMember = useCallback(async (email: string, role: TeamRole): Promise<ApiResult<TeamMember>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    try {
      const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.INVITE(tenantId)}`, {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify({ email, role }),
      });
      const result = await withResult<TeamMember>(res);

      // If error response, check for backend's email field error message
      if (!result.success && !result.error) {
        const body = await res.json().catch(() => ({}));
        if (body.email) {
          result.error = Array.isArray(body.email) ? body.email[0] : body.email;
        }
      }

      // Refresh lists on success
      if (result.success) listMembers();
      return result;
    } catch (error) {
      console.error('Error inviting member:', error);
      return { success: false, error: 'Failed to invite member. Please try again.' };
    }
  }, [base, tenantId, token, listMembers]);

  const getMember = useCallback(async (memberId: string): Promise<ApiResult<TeamMember>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.DETAIL(tenantId, memberId)}`, {
      headers: jsonHeaders(token),
    });
    return withResult<TeamMember>(res);
  }, [base, tenantId, token]);

  const updateMember = useCallback(async (memberId: string, data: Partial<Pick<TeamMember, 'role' | 'status'>>): Promise<ApiResult<TeamMember>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.DETAIL(tenantId, memberId)}`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(data),
    });
    const result = await withResult<TeamMember>(res);
    if (result.success) listMembers();
    return result;
  }, [base, tenantId, token, listMembers]);

  const removeMember = useCallback(async (memberId: string): Promise<ApiResult<{ message: string }>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.DETAIL(tenantId, memberId)}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    const result = await withResult<{ message: string }>(res);
    if (result.success) listMembers();
    return result;
  }, [base, tenantId, token, listMembers]);

  const suspendMember = useCallback(async (memberId: string): Promise<ApiResult<{ message: string }>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.SUSPEND(tenantId, memberId)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    const result = await withResult<{ message: string }>(res);
    if (result.success) listMembers();
    return result;
  }, [base, tenantId, token, listMembers]);

  const activateMember = useCallback(async (memberId: string): Promise<ApiResult<{ message: string }>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.ACTIVATE(tenantId, memberId)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    const result = await withResult<{ message: string }>(res);
    if (result.success) listMembers();
    return result;
  }, [base, tenantId, token, listMembers]);

  const resendInvitation = useCallback(async (memberId: string): Promise<ApiResult<{ message: string }>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.RESEND_INVITATION(tenantId, memberId)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    return withResult<{ message: string }>(res);
  }, [base, tenantId, token]);

  const transferOwnership = useCallback(async (memberId: string): Promise<ApiResult<{ message: string }>> => {
    if (!tenantId) return { success: false, error: 'Missing tenantId' };
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.TEAM.TRANSFER_OWNERSHIP(tenantId, memberId)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    return withResult<{ message: string }>(res);
  }, [base, tenantId, token]);

  const acceptInvitation = useCallback(async (tokenParam: string): Promise<ApiResult<{ message: string }>> => {
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.INVITES.ACCEPT(tokenParam)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    return withResult<{ message: string }>(res);
  }, [base, token]);

  const rejectInvitation = useCallback(async (tokenParam: string): Promise<ApiResult<{ message: string }>> => {
    const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.TENANTS.INVITES.REJECT(tokenParam)}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    return withResult<{ message: string }>(res);
  }, [base, token]);

  return {
    isLoading,
    error,
    members,
    stats,
    listMembers,
    getStats,
    inviteMember,
    getMember,
    updateMember,
    removeMember,
    suspendMember,
    activateMember,
    resendInvitation,
    transferOwnership,
    acceptInvitation,
    rejectInvitation,
  };
}



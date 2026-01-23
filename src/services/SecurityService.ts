// Security Service - API client for security endpoints
import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api';

// Types based on the real API documentation
export interface SecuritySummary {
  two_factor_enabled: boolean;
  active_sessions: number;
  recent_events_count: number;
  last_password_change: string;
  security_score: number;
}

export interface TwoFactorStatus {
  id: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  qr_code_data?: {
    qr_code: string;
    secret_key: string;
    manual_entry_key: string;
  } | null;
  backup_codes?: string[] | null;
}

export interface SecuritySession {
  id: string;
  session_key: string;
  ip_address: string;
  device_name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_current: boolean;
  device_info: {
    browser: string;
    os: string;
    device_type: string;
  };
  time_ago: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  event_type_display: string;
  description: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
  time_ago: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TwoFactorEnableRequest {
  totp_code: string;
}

export interface TwoFactorDisableRequest {
  password: string;
  totp_code: string;
}

export interface TwoFactorVerifyRequest {
  totp_code?: string;
  backup_code?: string;
}

class SecurityService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Get security summary
  async getSecuritySummary(): Promise<{ success: boolean; data: SecuritySummary }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/summary/`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get security summary: ${response.statusText}`);
    }

    return response.json();
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/change-password/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to change password: ${response.statusText}`);
    }

    return response.json();
  }

  // Get 2FA status
  async get2FAStatus(): Promise<{ success: boolean; data: TwoFactorStatus }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/2fa/status/`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get 2FA status: ${response.statusText}`);
    }

    return response.json();
  }

  // Enable 2FA
  async enable2FA(data: TwoFactorEnableRequest & { phone?: string; phone_number?: string }): Promise<{
    success: boolean;
    message?: string;
    backup_codes?: string[];
    warning?: string;
    errors?: Record<string, string[]>;
  }> {
    // Extract phone number from the request data
    const phone = (data as any).phone || (data as any).phone_number;
    const response = await apiClient.enableTwoFactor(phone);
    const responseData = response.data as any;
    return {
      success: response.success ?? false,
      message: response.message,
      backup_codes: responseData?.backup_codes,
      errors: response.errors
    };
  }

  // Disable 2FA
  async disable2FA(data: TwoFactorDisableRequest): Promise<{
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  }> {
    const response = await apiClient.disableTwoFactor();
    return {
      success: response.success ?? false,
      message: response.message,
      errors: response.errors
    };
  }

  // Verify 2FA
  async verify2FA(data: TwoFactorVerifyRequest): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/2fa/verify/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to verify 2FA: ${response.statusText}`);
    }

    return response.json();
  }

  // Get active sessions
  async getActiveSessions(): Promise<{
    success: boolean;
    sessions: SecuritySession[];
    total_count: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/sessions/`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get active sessions: ${response.statusText}`);
    }

    return response.json();
  }

  // Terminate specific session
  async terminateSession(sessionId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/sessions/${sessionId}/terminate/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to terminate session: ${response.statusText}`);
    }

    return response.json();
  }

  // Terminate all other sessions
  async terminateAllOtherSessions(): Promise<{
    success: boolean;
    message?: string;
    terminated_count?: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/sessions/terminate-all-others/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to terminate all other sessions: ${response.statusText}`);
    }

    return response.json();
  }

  // Get security events
  async getSecurityEvents(): Promise<{
    success: boolean;
    events: SecurityEvent[];
    total_count: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/auth/security/events/`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get security events: ${response.statusText}`);
    }

    return response.json();
  }
}

export const securityService = new SecurityService();

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthTokens, LoginRequest, RegisterRequest } from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { useSMSVerification } from '@/hooks/useSMSVerification';
import {
  isPartina,
  isOwnerInAnyTenant,
  isAdminInAnyTenant,
  isAgentInAnyTenant,
  hasActiveMembership,
  canManageUsers,
  canAccessAdmin,
  getPartinaStatus,
  getHighestRole,
  getRoleInTenant,
  getActiveMemberships
} from '@/utils/roleUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string; user?: User; requiresActivation?: boolean; email?: string; phoneNumber?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string; errors?: Record<string, string[]>; requiresActivation?: boolean; email?: string; phoneNumber?: string; verificationMethod?: 'sms' | 'email'; stayOnPage?: boolean; message?: string; smsFailed?: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  sendAccountVerification: (phoneNumber?: string) => Promise<{ success: boolean; error?: string }>;
  verifyAccount: (code: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }>;
  verifySMS: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }>;
  resendActivationEmail: (email?: string, phoneNumber?: string) => Promise<{ success: boolean; error?: string; method?: 'sms' | 'email'; phoneNumber?: string }>;
  // New API methods
  sendPhoneVerification: (phone?: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneCode: (phone: string | undefined, code: string) => Promise<{ success: boolean; error?: string }>;
  generateApiKey: (keyData: { name: string; permissions?: string[] }) => Promise<{ success: boolean; error?: string; data?: any }>;
  listApiKeys: () => Promise<{ success: boolean; error?: string; data?: any[] }>;
  revokeApiKey: (keyId: string) => Promise<{ success: boolean; error?: string }>;
  enableTwoFactor: (phone: string) => Promise<{ success: boolean; error?: string }>;
  disableTwoFactor: () => Promise<{ success: boolean; error?: string }>;
  // Role checking methods
  isPartina: () => boolean;
  isOwnerInAnyTenant: () => boolean;
  isAdminInAnyTenant: () => boolean;
  isAgentInAnyTenant: () => boolean;
  hasActiveMembership: () => boolean;
  canManageUsers: () => boolean;
  canAccessAdmin: () => boolean;
  getPartinaStatus: () => { isPartina: boolean; status: 'approved' | 'none' };
  getHighestRole: () => 'owner' | 'admin' | 'agent' | null;
  getRoleInTenant: (tenantId: string) => 'owner' | 'admin' | 'agent' | null;
  getActiveMemberships: () => any[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sendAccountVerification, verifyAccount: verifyAccountSMS, verifyCode } = useSMSVerification();

  const isAuthenticated = !!user;

  const persistUser = (data: User | null) => {
    if (data) {
      localStorage.setItem('user', JSON.stringify(data));
    } else {
      localStorage.removeItem('user');
    }
  };

  const mergeUserData = (next: User, prev?: User | null): User => {
    if (!prev) {
      return next;
    }
    return {
      ...prev,
      ...next,
      email: next.email || prev.email,
      phone_number: next.phone_number || prev.phone_number,
      full_name: next.full_name || prev.full_name,
      first_name: next.first_name || prev.first_name,
      last_name: next.last_name || prev.last_name,
    };
  };

  const updateUserState = (data: User) => {
    setUser(prev => {
      const merged = mergeUserData(data, prev);
      persistUser(merged);
      return merged;
    });
  };

  const clearUserState = () => {
    setUser(null);
    persistUser(null);
  };

  // Initialize auth state on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.warn('Failed to parse stored user from storage:', error);
        localStorage.removeItem('user');
      }
    }

    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await apiClient.getProfile();
          if (response.data) {
            updateUserState(response.data);
          } else if (response.status === 401 || response.status === 403) {
            // Token is invalid, try to refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await apiClient.refreshToken(refreshToken);
              if (refreshResponse.data?.access) {
                apiClient.setToken(refreshResponse.data.access);
                const profileResponse = await apiClient.getProfile();
                if (profileResponse.data) {
                  updateUserState(profileResponse.data);
                } else {
                  // Still can't get profile after refresh, clear tokens
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  apiClient.setToken(null);
                  clearUserState();
                }
              } else {
                // Refresh failed, clear tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                apiClient.setToken(null);
                clearUserState();
              }
            } else {
              // No refresh token, clear access token
              localStorage.removeItem('access_token');
              apiClient.setToken(null);
              clearUserState();
            }
          } else {
            // Unexpected response but not auth error, keep tokens
            console.warn('Auth initialization returned unexpected status:', response.status);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);

          // Never clear tokens on network errors - user might just have poor connection
          const isNetworkError = error instanceof TypeError && error.message.includes('fetch');

          if (isNetworkError) {
            // Network error - keep tokens and let user try again or stay logged in
            console.warn('Network error during auth init, keeping tokens');
            // Don't clear tokens, user stays logged in
          } else {
            // Other error - could be server issue, don't log user out
            console.warn('Auth initialization failed, but keeping tokens for now');
            // Only clear if we're absolutely sure it's auth-related
            // Keep tokens to prevent unnecessary logouts
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string; user?: User; requiresActivation?: boolean; email?: string; phoneNumber?: string }> => {
    try {
      const response = await apiClient.login(credentials);

      if (response.data && (response.data as any).user) {
        const userData = (response.data as any).user as User;
        const access = (response.data as any).access || (response.data as any).tokens?.access;
        const refresh = (response.data as any).refresh || (response.data as any).tokens?.refresh;

        // Set token first so profile request is authenticated
        if (access) {
          apiClient.setToken(access);
        }
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }

        // Fetch complete profile to get all role/Partina information
        try {
          const profileResponse = await apiClient.getProfile();
          if (profileResponse.data) {
            // Use the complete profile data which includes is_partina, partina_approved_at, etc.
            updateUserState(profileResponse.data);
            localStorage.setItem('user_profile', JSON.stringify(profileResponse.data));
            return { success: true, user: profileResponse.data };
          }
        } catch (profileError) {
          // Profile fetch failed, but login succeeded - use initial user data
          console.warn('Failed to fetch complete profile after login:', profileError);
          updateUserState(userData);
          localStorage.setItem('user_profile', JSON.stringify(userData));
          return { success: true, user: userData };
        }
      } else {
        // Extract error message from response
        // API returns errors in non_field_errors array or error/message fields
        let errorMessage = response.error || 'Login failed';

        // Check for non_field_errors (common in Django REST Framework)
        if (response.errors && typeof response.errors === 'object') {
          const nonFieldErrors = (response.errors as any).non_field_errors;
          if (nonFieldErrors && Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
            errorMessage = nonFieldErrors[0];
          } else if (typeof response.errors === 'string') {
            errorMessage = response.errors;
          } else if ((response.errors as any).detail) {
            errorMessage = (response.errors as any).detail;
          }
        }

        // Check if error indicates account needs activation
        const needsActivation = errorMessage.toLowerCase().includes('not been activated') ||
                                errorMessage.toLowerCase().includes('activation') ||
                                errorMessage.toLowerCase().includes('verification code') ||
                                errorMessage.toLowerCase().includes('6-digit');

        if (needsActivation) {
          // Backend automatically sends a new 6-digit code when login fails for unverified account
          // Try to get phone number from response data, stored data, or fetch from backend
          let phoneNumber: string | undefined = undefined;

          // Check if response includes user data with phone number
          if (response.data && (response.data as any).user) {
            phoneNumber = (response.data as any).user.phone_number;
          }

          // If not in response, check stored data
          if (!phoneNumber) {
            phoneNumber = localStorage.getItem('pending_phone_activation') || undefined;
          }

          // If still not available, try to parse it from the error message
          if (!phoneNumber && errorMessage) {
            const match = errorMessage.match(/\+\d{6,15}/);
            if (match && match[0]) {
              phoneNumber = match[0];
              localStorage.setItem('pending_phone_activation', phoneNumber);
            }
          }

          return {
            success: false,
            error: errorMessage,
            requiresActivation: true,
            email: credentials.username,
            phoneNumber: phoneNumber
          };
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; error?: string; errors?: Record<string, string[]>; requiresActivation?: boolean; email?: string; phoneNumber?: string; verificationMethod?: 'sms' | 'email'; stayOnPage?: boolean; message?: string; smsFailed?: boolean }> => {
    try {
      const response = await apiClient.register(userData);

      // Debug logging to help troubleshoot
      console.log('Registration request data:', userData);
      console.log('Registration response:', response);

      // CRITICAL: Check status code first
      // Status 400 = Validation failed, account NOT created - stay on page
      if (response.status === 400) {
        // Account was NOT created - validation failed
        // API returns error message in 'message' field: "Phone Number: This phone number is already registered..."
        const errorMessage = response.message || response.error || 'Validation failed';

        return {
          success: false,
          error: errorMessage,
          errors: response.errors || {},
          stayOnPage: true // Explicit flag to prevent redirects
        };
      }

      // Status 201 = Account created successfully - can redirect
      if (response.status === 201 && response.data) {
        const {
          user: newUser,
          tokens,
          requires_activation,
          activation_required,
          account_active,
          sms_verification_sent,
          email_verification_sent,
          message,
          error: responseError
        } = response.data;

        // According to new API: tokens are null until account is activated
        // If tokens are present, account is already activated - authenticate the user
        if (tokens) {
          updateUserState(newUser);
          apiClient.setToken(tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          localStorage.setItem('user_profile', JSON.stringify(newUser));

          return { success: true, message };
        }

        // No tokens means account needs activation
        // Backend automatically sends SMS verification code on registration if phone number exists
        // Check sms_verification_sent to determine if SMS was sent
        const phoneNumber = newUser?.phone_number || userData.phone_number;
        const hasPhoneNumber = !!phoneNumber;

        // Check if there was an SMS sending error
        const smsSendingFailed = responseError && typeof responseError === 'string' &&
          (responseError.includes('Failed to send verification SMS') ||
           responseError.includes('SMS') ||
           responseError.includes('verification code'));

        // Determine verification method based on API response
        // Default to SMS verification
        // If sms_verification_sent is true, SMS was sent
        // Otherwise, email was used (or SMS failed and fell back to email)
        let verificationMethod: 'sms' | 'email' = 'sms';
        if (email_verification_sent && !sms_verification_sent) {
          verificationMethod = 'email';
        } else if ((sms_verification_sent || smsSendingFailed) && hasPhoneNumber) {
          verificationMethod = 'sms';
        } else if (hasPhoneNumber) {
          // If phone number exists but no explicit verification method, assume SMS was attempted
          verificationMethod = 'sms';
        }

        // Check if activation is required
        const needsActivation = requires_activation ||
                                activation_required ||
                                !account_active ||
                                sms_verification_sent ||
                                email_verification_sent ||
                                smsSendingFailed ||
                                !newUser?.is_verified;

        if (needsActivation) {
          return {
            success: true,
            requiresActivation: true,
            email: newUser?.email || userData.email,
            phoneNumber: phoneNumber,
            verificationMethod: verificationMethod,
            message,
            smsFailed: smsSendingFailed
          };
        }

        // Edge case: user data exists but no clear activation status
        // Treat as success but require activation to be safe
        return {
          success: true,
          requiresActivation: true,
          email: newUser?.email || userData.email,
          phoneNumber: phoneNumber,
          verificationMethod: verificationMethod,
          message,
          smsFailed: smsSendingFailed
        };
      } else {
        // Other error cases (500, etc.)
        console.error('Registration failed - no data in response:', response);

        // Extract specific validation errors
        let errorMessage = response.error || 'Registration failed';
        if (response.errors) {
          const errorDetails = Object.entries(response.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `Validation failed: ${errorDetails}`;
        }

        return {
          success: false,
          error: errorMessage,
          errors: response.errors || {},
          stayOnPage: response.status === 400 // Stay on page for 400 errors
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUserState();
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) return false;

      const response = await apiClient.refreshToken(refreshTokenValue);
      if (response.data?.access) {
        apiClient.setToken(response.data.access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.updateProfile(userData);

      if (response.data) {
        updateUserState(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  };

  const sendAccountVerificationSMS = async (phoneNumber?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await sendAccountVerification({ phone_number: phoneNumber });
      return { success: result.success, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification SMS'
      };
    }
  };

  const verifyAccountCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await verifyAccountSMS({ code });
      if (result.success && user) {
        // Update user verification status
        const updatedUser = { ...user, phone_verified: true, is_verified: true };
        updateUserState(updatedUser);
      }
      return { success: result.success, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify account'
      };
    }
  };

  const verifyEmail = async (code: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }> => {
    try {
      // Use the new activation endpoint: GET /api/auth/activate-account/{code}/
      // This endpoint returns HTML, so we check the status code
      const response = await apiClient.activateAccount(code);

      if (response.status === 200) {
        // Account activated successfully
        // The endpoint returns HTML, but we need to get user data
        // Try to fetch profile to get user data and check if we can get tokens
        try {
          const profileResponse = await apiClient.getProfile();
          if (profileResponse.data) {
            updateUserState(profileResponse.data);
            // Check if we have tokens in localStorage
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            if (accessToken && refreshToken) {
              return {
                success: true,
                tokens: { access: accessToken, refresh: refreshToken },
                user: profileResponse.data
              };
            } else {
              // Account is activated but no tokens - user needs to login
              return {
                success: true,
                user: profileResponse.data
              };
            }
          }
        } catch (profileError) {
          // Profile fetch failed, but activation succeeded
          // User will need to login
          return { success: true };
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || 'Invalid or expired verification code'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  };

  const verifySMS = async (phoneNumber: string, code: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }> => {
    try {
      // Use the new RECOMMENDED endpoint: POST /api/auth/sms/verify-code/
      const response = await apiClient.verifySMSCode(phoneNumber, code);

      // Check if verification was successful
      if (response.success && response.data) {
        const access = (response.data as any).access || (response.data as any).tokens?.access;
        const refresh = (response.data as any).refresh || (response.data as any).tokens?.refresh;
        const tokens = access && refresh ? { access, refresh } : (response.data as any).tokens;
        const userData = (response.data as any).user as User | undefined;

        if (tokens && userData) {
          // Account activated successfully with tokens - user is automatically logged in
          updateUserState(userData);
          apiClient.setToken(tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          localStorage.setItem('user_profile', JSON.stringify(userData));

              return {
                success: true,
            tokens: tokens,
            user: userData
              };
        }

        // If we have success but no tokens/user, still return success
        return { success: true };
      }

      // Error case - verification failed
        return {
          success: false,
        error: response.error || response.message || 'Invalid or expired verification code'
        };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS verification failed'
      };
    }
  };

  const resendActivationEmail = async (email?: string, phoneNumber?: string): Promise<{ success: boolean; error?: string; method?: 'sms' | 'email'; phoneNumber?: string }> => {
    // Use the resend-activation endpoint - accepts email OR phone_number, sends SMS only
    try {
      const response = await apiClient.resendActivationEmail(email, phoneNumber);
      if (response.success !== false) {
        // Backend sends SMS only - no email codes
        const returnedPhone = response.data?.phone_number || phoneNumber;
        return {
          success: true,
          method: 'sms',
          phoneNumber: returnedPhone
        };
      } else {
        return {
          success: false,
          error: response.error || response.message || 'Failed to resend activation code',
          method: 'sms'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend activation code',
        method: 'sms'
      };
    }
  };

  // New API methods
  const sendPhoneVerification = async (phone?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.sendPhoneVerification(phone);
      if (response.success !== false) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to send phone verification' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send phone verification'
      };
    }
  };

  const verifyPhoneCode = async (phone: string | undefined, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.verifyPhoneCode(phone, code);
      if (response.success !== false) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to verify phone code' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify phone code'
      };
    }
  };

  const generateApiKey = async (keyData: { name: string; permissions?: string[] }): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const response = await apiClient.generateApiKey(keyData);
      if (response.success !== false && response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Failed to generate API key' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate API key'
      };
    }
  };

  const listApiKeys = async (): Promise<{ success: boolean; error?: string; data?: any[] }> => {
    try {
      const response = await apiClient.listApiKeys();
      if (response.success !== false && response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Failed to list API keys' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list API keys'
      };
    }
  };

  const revokeApiKey = async (keyId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.revokeApiKey(keyId);
      if (response.success !== false) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to revoke API key' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke API key'
      };
    }
  };

  const enableTwoFactor = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.enableTwoFactor(phone);
      if (response.success !== false) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to enable two-factor authentication' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable two-factor authentication'
      };
    }
  };

  const disableTwoFactor = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.disableTwoFactor();
      if (response.success !== false) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to disable two-factor authentication' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable two-factor authentication'
      };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    sendAccountVerification: sendAccountVerificationSMS,
    verifyAccount: verifyAccountCode,
    verifyEmail,
    verifySMS,
    resendActivationEmail,
    // New API methods
    sendPhoneVerification,
    verifyPhoneCode,
    generateApiKey,
    listApiKeys,
    revokeApiKey,
    enableTwoFactor,
    disableTwoFactor,
    // Role checking methods
    isPartina: () => isPartina(user),
    isOwnerInAnyTenant: () => isOwnerInAnyTenant(user),
    isAdminInAnyTenant: () => isAdminInAnyTenant(user),
    isAgentInAnyTenant: () => isAgentInAnyTenant(user),
    hasActiveMembership: () => hasActiveMembership(user),
    canManageUsers: () => canManageUsers(user),
    canAccessAdmin: () => canAccessAdmin(user),
    getPartinaStatus: () => getPartinaStatus(user),
    getHighestRole: () => getHighestRole(user),
    getRoleInTenant: (tenantId: string) => getRoleInTenant(user, tenantId),
    getActiveMemberships: () => getActiveMemberships(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

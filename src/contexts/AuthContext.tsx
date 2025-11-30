import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthTokens, LoginRequest, RegisterRequest } from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { useSMSVerification } from '@/hooks/useSMSVerification';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string; user?: User; requiresActivation?: boolean; email?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string; requiresActivation?: boolean; email?: string; phoneNumber?: string; verificationMethod?: 'sms' | 'email' }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  sendAccountVerification: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyAccount: (code: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }>;
  verifySMS: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string; tokens?: AuthTokens; user?: User }>;
  resendActivationEmail: (email: string, phoneNumber?: string) => Promise<{ success: boolean; error?: string; method?: 'sms' | 'email' }>;
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

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string; user?: User; requiresActivation?: boolean; email?: string }> => {
    try {
      const response = await apiClient.login(credentials);

      if (response.data && response.data.tokens) {
        const { user: userData, tokens } = response.data;

        updateUserState(userData);
        apiClient.setToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('user_profile', JSON.stringify(userData));

        // Note: SMS verification is handled automatically by backend during registration
        // No need to send SMS here as backend manages verification code sending

        return { success: true, user: userData };
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
          }
        }

        // Check if error indicates account needs email activation
        const needsActivation = errorMessage.toLowerCase().includes('not been activated') ||
                                errorMessage.toLowerCase().includes('activation') ||
                                errorMessage.toLowerCase().includes('verification code') ||
                                errorMessage.toLowerCase().includes('6-digit');

        if (needsActivation) {
          // Backend automatically sends a new 6-digit code when login fails for unverified account
          return {
            success: false,
            error: errorMessage,
            requiresActivation: true,
            email: credentials.email
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

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; error?: string; requiresActivation?: boolean; email?: string; phoneNumber?: string; verificationMethod?: 'sms' | 'email' }> => {
    try {
      const response = await apiClient.register(userData);

      // Debug logging to help troubleshoot
      console.log('Registration request data:', userData);
      console.log('Registration response:', response);

      if (response.data) {
        const {
          user: newUser,
          tokens,
          requires_activation,
          activation_required,
          account_active,
          sms_verification_sent,
          email_verification_sent
        } = response.data;

        // According to new API: tokens are null until account is activated
        // If tokens are present, account is already activated - authenticate the user
        if (tokens) {
          updateUserState(newUser);
          apiClient.setToken(tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          localStorage.setItem('user_profile', JSON.stringify(newUser));

          return { success: true };
        }

        // No tokens means account needs activation
        // Backend automatically sends SMS verification code on registration if phone number exists
        // Check sms_verification_sent to determine if SMS was sent
        const phoneNumber = newUser?.phone_number || userData.phone_number;
        const hasPhoneNumber = !!phoneNumber;

        // Determine verification method based on API response
        // If sms_verification_sent is true, SMS was sent
        // Otherwise, email was used (or SMS failed and fell back to email)
        let verificationMethod: 'sms' | 'email' = 'email';
        if (sms_verification_sent && hasPhoneNumber) {
          verificationMethod = 'sms';
        } else if (email_verification_sent) {
          verificationMethod = 'email';
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
                                !newUser?.is_verified;

        if (needsActivation) {
          return {
            success: true,
            requiresActivation: true,
            email: newUser?.email || userData.email,
            phoneNumber: phoneNumber,
            verificationMethod: verificationMethod
          };
        }

        // Edge case: user data exists but no clear activation status
        // Treat as success but require activation to be safe
        return {
          success: true,
          requiresActivation: true,
          email: newUser?.email || userData.email,
          phoneNumber: phoneNumber,
          verificationMethod: verificationMethod
        };
      } else {
        console.error('Registration failed - no data in response:', response);

        // Extract specific validation errors
        let errorMessage = response.error || 'Registration failed';
        if (response.errors) {
          const errorDetails = Object.entries(response.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `Validation failed: ${errorDetails}`;
        }

        return { success: false, error: errorMessage };
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

  const sendAccountVerificationSMS = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
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
      const result = await verifyAccountSMS({ verification_code: code });
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
      // Use the new activation endpoint: GET /api/auth/activate-account/{code}/
      // This endpoint works for both SMS and email verification codes
      // It returns HTML, so we check the status code
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
        error: error instanceof Error ? error.message : 'SMS verification failed'
      };
    }
  };

  const resendActivationEmail = async (email: string, phoneNumber?: string): Promise<{ success: boolean; error?: string; method?: 'sms' | 'email' }> => {
    // Use the resend-activation endpoint which the backend handles automatically
    // Backend will try SMS first if phone number is available, then fallback to email
    try {
      const response = await apiClient.resendActivationEmail(email);
      if (response.success !== false) {
        // Backend automatically tries SMS first if phone number is available
        // We determine the method based on whether phone number was provided
        const method = phoneNumber ? 'sms' : 'email';
        return { success: true, method };
      } else {
        return {
          success: false,
          error: response.error || response.message || 'Failed to resend activation code',
          method: phoneNumber ? 'sms' : 'email'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend activation code',
        method: phoneNumber ? 'sms' : 'email'
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

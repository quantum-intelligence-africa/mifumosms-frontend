import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthTokens, LoginRequest, RegisterRequest } from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { useSMSVerification } from '@/hooks/useSMSVerification';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  sendAccountVerification: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyAccount: (code: string) => Promise<{ success: boolean; error?: string }>;
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
  const { sendAccountVerification, verifyAccount: verifyAccountSMS } = useSMSVerification();

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

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await apiClient.login(credentials);

      if (response.data && response.data.tokens) {
        const { user: userData, tokens } = response.data;

        updateUserState(userData);
        apiClient.setToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        // Check if user needs verification and send SMS
        if (userData && userData.phone_number && !userData.phone_verified && !userData.is_verified) {
          try {
            await sendAccountVerification({ phone_number: userData.phone_number });
            console.log('Verification SMS sent to:', userData.phone_number);
          } catch (error) {
            console.error('Failed to send verification SMS:', error);
            // Don't fail login if SMS sending fails
          }
        }

        return { success: true, user: userData };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.register(userData);

      // Debug logging to help troubleshoot
      console.log('Registration request data:', userData);
      console.log('Registration response:', response);

      if (response.data && response.data.tokens) {
        const { user: newUser, tokens } = response.data;
        updateUserState(newUser);
        apiClient.setToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        // Send verification SMS for new users
        if (newUser && newUser.phone_number) {
          try {
            await sendAccountVerification({ phone_number: newUser.phone_number });
            console.log('Verification SMS sent to new user:', newUser.phone_number);
          } catch (error) {
            console.error('Failed to send verification SMS to new user:', error);
            // Don't fail registration if SMS sending fails
          }
        }

        return { success: true };
      } else {
        console.error('Registration failed - no tokens in response:', response);

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

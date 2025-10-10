import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, User, AuthTokens, LoginRequest, RegisterRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await apiClient.getProfile();
          if (response.data) {
            setUser(response.data);
          } else {
            // Token might be invalid, try to refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await apiClient.refreshToken(refreshToken);
              if (refreshResponse.data?.access) {
                apiClient.setToken(refreshResponse.data.access);
                const profileResponse = await apiClient.getProfile();
                if (profileResponse.data) {
                  setUser(profileResponse.data);
                }
              } else {
                // Refresh failed, clear tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                apiClient.setToken(null);
              }
            } else {
              // No refresh token, clear access token
              localStorage.removeItem('access_token');
              apiClient.setToken(null);
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          apiClient.setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.login(credentials);
      
      if (response.data && response.data.tokens) {
        const { user: userData, tokens } = response.data;
        setUser(userData);
        apiClient.setToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        return { success: true };
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
        setUser(newUser);
        apiClient.setToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
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
      setUser(null);
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
        setUser(response.data);
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

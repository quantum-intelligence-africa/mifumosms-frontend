// API Configuration and Client
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone_number?: string;
  is_verified: boolean;
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          data: data,
          error: data.message || data.error || 'An error occurred',
          status: response.status,
        };
      }

      return {
        data: data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access: string }>> {
    return this.request<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile/');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(data: { old_password: string; new_password: string }): Promise<ApiResponse> {
    return this.request('/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.request('/auth/password/reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async generateApiKey(): Promise<ApiResponse<{ api_key: string }>> {
    return this.request<{ api_key: string }>('/auth/api-key/generate/', {
      method: 'POST',
    });
  }

  async revokeApiKey(): Promise<ApiResponse> {
    return this.request('/auth/api-key/revoke/', {
      method: 'POST',
    });
  }

  async logout(): Promise<ApiResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
    
    this.setToken(null);
    localStorage.removeItem('refresh_token');
    return { status: 200 };
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

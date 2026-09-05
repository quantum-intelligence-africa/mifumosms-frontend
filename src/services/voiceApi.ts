// Standalone API client for the SENDA Voice/IVR backend (senda_voice_backend).
// Deliberately separate from `src/lib/api.ts`'s ApiClient: that class's request
// internals are private and hardwired to one base URL, so a second backend gets
// its own small client instead of being bolted onto it.
import { logger } from '@/utils/logger';
import { apiClient, type ApiResponse } from '@/lib/api';

// No working default exists yet for the voice backend (brand new service) — fall
// back to a same-origin placeholder path and warn in dev so misconfiguration is
// obvious instead of silently hitting the wrong host.
const VOICE_API_URL = import.meta.env.VITE_VOICE_API_URL || '/voice-api';

if (import.meta.env.DEV && !import.meta.env.VITE_VOICE_API_URL) {
  logger.warn('VITE_VOICE_API_URL is not set — voiceApi is falling back to same-origin path "/voice-api"');
}

class VoiceApiClient {
  constructor(private baseURL: string) {}

  private getHeaders(includeContentType = true): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(!(options.body instanceof FormData)),
          ...options.headers,
        },
      });

      // On a 401, refresh the shared access token via the core API client and
      // retry the request once before giving up.
      if (response.status === 401 && !isRetry) {
        const refreshResult = await apiClient.refreshTokenFromStorage();
        if (refreshResult.success) {
          return this.request<T>(endpoint, options, true);
        }
      }

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: response.ok, status: response.status };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: response.ok, status: response.status };
      }

      const data = await response.json();

      if (response.ok) {
        return { success: true, data, status: response.status };
      }

      return {
        success: false,
        error: typeof data === 'string' ? data : data?.detail || data?.message || 'An error occurred',
        errors: data?.errors,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0,
      };
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /** Multipart upload (a file plus fields) — `post()` always JSON-encodes
   * its body, which would mangle a File, so uploads go through this
   * instead. `getHeaders` already skips the JSON content-type header for a
   * FormData body, letting the browser set its own multipart boundary. */
  async postForm<T = unknown>(endpoint: string, form: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: form });
  }
}

export const voiceApi = new VoiceApiClient(VOICE_API_URL);

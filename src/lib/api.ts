// API Configuration and Client for Mifumo SMS
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
  success?: boolean;
  errors?: Record<string, string[]>;
}

// Authentication Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone_number?: string;
  is_verified: boolean;
  is_superuser?: boolean;
  is_staff?: boolean;
  phone_verified?: boolean;
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
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string; // Required: E.164 format (e.g., +255123456789)
  timezone?: string;
  company_name?: string;
  business_name?: string; // Alias for company_name
  country?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens?: AuthTokens | null; // Null until account is activated
  sms_verification_sent?: boolean; // True if SMS verification code was sent
  email_verification_sent?: boolean; // True if email verification was sent (fallback)
  account_active?: boolean; // False until account is activated
  requires_activation?: boolean; // True if account needs activation
  activation_required?: boolean; // True if activation is required
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  business_name?: string;
  business_type?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  business_name?: string;
  business_type?: string;
  phone_number?: string;
  email?: string;
}

// Contact Types
export interface Contact {
  id: string;
  name: string;
  phone_e164: string;
  email?: string;
  is_active: boolean;
  is_opted_in: boolean;
  opt_in_at?: string;
  last_contacted_at?: string;
  tags: string[];
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  name: string;
  phone_e164: string;
  email?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export interface ImportContactsRequest {
  contacts: CreateContactRequest[];
}

export interface ImportContactsResponse {
  imported_count: number;
  failed_count: number;
  errors?: Array<{
    contact: CreateContactRequest;
    error: string;
  }>;
}

// Segment Types
export interface Segment {
  id: string;
  name: string;
  description?: string;
  contact_count: number;
  filter_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  filter_json: Record<string, unknown>;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  category: string;
  category_display: string;
  language: string;
  language_display: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'all';
  channel_display: string;
  body_text: string;
  formatted_body_text?: string;
  preview_text: string;
  description?: string;
  variables: string[];
  variables_count: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  status_display: string;
  approved: boolean;
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
  is_favorite: boolean;
  wa_template_name?: string;
  wa_template_id?: string;
  usage_count: number;
  last_used_at?: string;
  last_used_display: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  language: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'all';
  body_text: string;
  description?: string;
}

export interface TemplateUpdateRequest {
  name?: string;
  category?: string;
  language?: string;
  channel?: 'sms' | 'whatsapp' | 'email' | 'all';
  body_text?: string;
  description?: string;
}

export interface TemplateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    templates: Template[];
    filter_options: {
      categories: Array<{ value: string; label: string }>;
      languages: Array<{ value: string; label: string }>;
      channels: Array<{ value: string; label: string }>;
      statuses: Array<{ value: string; label: string }>;
    };
    total_count: number;
  };
}

// Integration API Types
export interface IntegrationSMSSendRequest {
  message: string;
  recipients: string[];
  sender_id?: string;
}

export interface IntegrationSMSSendResponse {
  message_id: string;
  recipients: string[];
  successful_sends: number;
  failed_sends: number;
  total_recipients: number;
  cost?: number;
  currency?: string;
  provider?: string;
  sender_id?: string;
  status: string;
}

export interface IntegrationDeliveryReport {
  message_id: string;
  status: string;
  recipient_count: number;
  created_at: string;
  sender_id: string;
}

export interface IntegrationSenderIdRequestPayload {
  sender_id: string;
  use_case: string;
}

export interface IntegrationTenantCreateRequest {
  tenant_id: string;
  tenant_name: string;
  owner_email: string;
  owner_name: string;
  contact_phone: string;
  initial_credits?: number;
}

export interface IntegrationTenantCreditRequest {
  package_id?: string;
  credits?: number;
  payment_reference: string;
  payment_method: string;
  amount_paid?: number;
}

export interface IntegrationPaymentInitiationRequest {
  package_id: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  mobile_money_provider: string;
}

export interface IntegrationCustomPaymentRequest {
  credits: number;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  mobile_money_provider: string;
}

export interface IntegrationPricingRequest {
  credits: number;
}

export interface TemplateFilterParams {
  category?: string;
  language?: string;
  channel?: string;
  status?: string;
  search?: string;
  favorites_only?: boolean;
  approved_only?: boolean;
  page?: number;
  page_size?: number;
}

// Conversation Types
export interface Conversation {
  id: string;
  contact: Contact;
  status: "active" | "closed" | "archived";
  last_message_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// Message Types
export interface Message {
  id: string;
  conversation: string;
  direction: "in" | "out";
  provider: "whatsapp" | "sms";
  text?: string;
  status: "sent" | "delivered" | "read" | "failed";
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  cost_micro?: number;
  created_at: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  text: string;
  provider: "whatsapp" | "sms";
  template_id?: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "scheduled" | "running" | "completed" | "cancelled" | "paused";
  template?: Template;
  segment?: Segment;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  template_id: string;
  segment_id: string;
  scheduled_at?: string;
}

// Analytics Types
export interface AnalyticsOverview {
  total_messages: number;
  messages_today: number;
  active_conversations: number;
  total_contacts: number;
  delivery_rate: number;
  response_time_avg: number;
  top_templates: Array<{
    id: string;
    name: string;
    usage_count: number;
  }>;
  messages_by_provider: Record<string, number>;
}

// Sender Name Types
export interface SenderNameRequest {
  id: string;
  sender_name: string;
  use_case: string;
  supporting_documents: string[];
  supporting_documents_count: number;
  status: "pending" | "approved" | "rejected" | "requires_changes" | "verifying";
  admin_notes: string;
  reviewed_by: number | null;
  reviewed_by_name: string;
  reviewed_at: string | null;
  provider_request_id?: string;
  provider_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
  tenant?: string;
}

// Payment Types
export interface PaymentProgress {
  step: number;
  total_steps: number;
  current_step: string;
  next_step: string | null;
  completed_steps: string[];
  remaining_steps: string[];
  percentage?: number;
  status_color?: string;
  status_icon?: string;
}

export interface PaymentTransaction {
  id: string;
  tenant: string;
  user: string;
  zenopay_order_id: string;
  zenopay_reference?: string;
  zenopay_transid?: string;
  zenopay_channel?: string;
  zenopay_msisdn?: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  payment_method: string;
  payment_reference?: string;
  status: string;
  webhook_url?: string;
  webhook_received: boolean;
  webhook_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  metadata?: Record<string, unknown>;
  error_message?: string;
  progress?: PaymentProgress;
}

export interface PaymentInitiationRequest {
  package_id: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  payment_method?: string;
}

export interface PaymentInitiationResponse {
  transaction_id: string;
  order_id: string;
  zenopay_order_id: string;
  invoice_number: string;
  amount: number;
  credits: number;
  status: string;
  payment_instructions: string;
  progress: PaymentProgress;
}

export interface PaymentStatusResponse {
  transaction_id: string;
  order_id: string;
  status: string;
  payment_status: string;
  amount: number;
  reference?: string;
  progress: PaymentProgress;
  updated_at: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  transaction_reference?: string;
  message: string;
  last_checked: string;
}

export interface PaymentProgressResponse {
  transaction_id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  progress: PaymentProgress;
  purchase: {
    package_name: string;
    credits: number;
    unit_price: number;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ActivePaymentsResponse {
  active_payments: Record<string, {
    transaction_id: string;
    order_id: string;
    invoice_number: string;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    timeout_in: number;
  }>;
  expired_payments: Array<{
    transaction_id: string;
    order_id: string;
    amount: number;
    reason: string;
  }>;
  count: number;
}

// SMS Billing Types
export interface SMSPackage {
  id: string;
  name: string;
  package_type: string;
  credits: number;
  price: string;
  unit_price: string;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
  savings_percentage?: number;
  subtitle?: string;
  description?: string;
}

export interface SMSBalance {
  id: string;
  credits: number;
  total_purchased: number;
  total_used: number;
  last_updated: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  tenant: string;
  user: string;
  package: string;
  payment_transaction?: string;
  invoice_number: string;
  amount: string;
  credits: number;
  unit_price: string;
  payment_method: string;
  payment_method_display: string;
  payment_reference?: string;
  status: string;
  status_display: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  package_name?: string;
}

export interface PurchaseHistoryQuery {
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface UsageStatistics {
  current_balance: number;
  total_usage: {
    credits: number;
    cost: number;
  };
  monthly_usage: {
    credits: number;
    cost: number;
  };
  weekly_usage: {
    credits: number;
    cost: number;
  };
}

// Subscription Types
export interface BillingPlan {
  id: string;
  name: string;
  plan_type: string;
  description: string;
  price: string;
  currency: string;
  billing_cycle: string;
  max_contacts: number;
  max_campaigns: number;
  max_sms_per_month: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  plan_name: string;
  status: string;
  status_display: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BillingOverview {
  subscription: {
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_end: string;
    is_active: boolean;
  };
  usage: {
    total_credits: number;
    total_cost: number;
  };
}

export interface UsageRecord {
  id: string;
  credits_used: number;
  cost: string;
  created_at: string;
}

export interface CreateSenderNameRequest {
  sender_name: string;
  use_case: string;
  supporting_documents?: File[];
}

export interface UpdateSenderNameRequest {
  sender_name?: string;
  use_case?: string;
  supporting_documents?: File[];
  status?: string;
  admin_notes?: string;
}

export interface SenderNameStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  requires_changes_requests: number;
  my_requests: number;
  my_pending_requests: number;
}

export interface MobileMoneyProvider {
  code: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  min_amount: number;
  max_amount: number;
}

export interface CustomSMSCalculation {
  credits: number;
  unit_price: number;
  total_price: number;
  active_tier: string;
  tier_min_credits: number;
  tier_max_credits: number;
  savings_percentage: number;
  pricing_tiers: Array<{
    name: string;
    min_credits: number;
    max_credits: number;
    unit_price: number;
    description: string;
  }>;
}

// Legacy Billing Types (deprecated - use new comprehensive types above)

export interface Usage {
  messages_sent: number;
  messages_limit: number;
  contacts_count: number;
  contacts_limit: number;
  campaigns_count: number;
  campaigns_limit: number;
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

  getHeaders(includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`
    };

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async handleResponse<T = unknown>(response: Response): Promise<ApiResponse<T>> {
    // Handle empty responses (common for DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, data: null, message: 'Operation completed successfully', status: response.status };
    }

    // Check if response has content to parse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (response.ok) {
        return { success: true, data: null, message: 'Operation completed successfully', status: response.status };
      } else {
        return {
          success: false,
          message: 'An error occurred',
          error: 'An error occurred',
          errors: null,
          status: response.status
        };
      }
    }

    try {
      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data || data, message: data.message, status: response.status };
      } else {
        return {
          success: false,
          message: data.message || data.detail || 'An error occurred',
          error: data.message || data.detail || 'An error occurred',
          errors: data.errors || null,
          status: response.status
        };
      }
    } catch (jsonError) {
      // If JSON parsing fails but response is OK, consider it successful
      if (response.ok) {
        return { success: true, data: null, message: 'Operation completed successfully', status: response.status };
      } else {
        return {
          success: false,
          message: 'Failed to parse response',
          error: 'Failed to parse response',
          errors: null,
          status: response.status
        };
      }
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

      // Log error responses for debugging
      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          config: config
        });
      }

      const data = await response.json();

      // Log error response data for debugging
      if (!response.ok) {
        console.error('API Error Data:', data);
      }

      // Handle authentication errors with token refresh
      if (response.status === 401 || response.status === 403) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && !endpoint.includes('/auth/token/refresh/')) {
          console.log('Token expired, attempting refresh...');
          try {
            const refreshResponse = await this.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.data?.access) {
              // Update token and retry request
              this.setToken(refreshResponse.data.access);
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${refreshResponse.data.access}`,
              };

              const retryResponse = await fetch(url, config);
              const retryData = await retryResponse.json();

              if (!retryResponse.ok) {
                return {
                  data: retryData,
                  error: retryData?.message || retryData?.error || 'An error occurred',
                  status: retryResponse.status,
                  success: false,
                  errors: retryData?.errors || retryData,
                };
              }

              // Handle backend response format for retry
              if (retryData && typeof retryData === 'object' && 'success' in retryData) {
                return {
                  data: retryData.data,
                  status: retryResponse.status,
                  success: retryData.success,
                  message: retryData.message,
                  error: retryData.success ? undefined : (retryData.message || retryData.error),
                };
              }

              return {
                data: retryData,
                status: retryResponse.status,
                success: true,
              };
            } else {
              // Refresh failed, clear tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              this.setToken(null);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            this.setToken(null);
          }
        }
      }

      if (!response.ok) {
        return {
          data: data,
          message: data?.message,
          error: data?.message || data?.error || 'An error occurred',
          status: response.status,
          success: false,
          errors: data?.errors || data,
        };
      }

      // Handle backend response format: { "success": true, "data": {...} }
      // OR: { "success": true, "tokens": {...}, "user": {...} } (for verify-code endpoint)
      if (data && typeof data === 'object' && 'success' in data) {
        // Check if data has nested 'data' field (standard format)
        // OR if it has 'tokens' and 'user' at root level (verify-code format)
        if (data.data) {
          return {
            data: data.data,
            status: response.status,
            success: data.success,
            message: data.message,
            error: data.success ? undefined : (data.message || data.error),
          };
        } else {
          // Response has success:true but data is at root level (e.g., verify-code endpoint)
          return {
            data: data, // Return the whole response as data since tokens/user are at root
            status: response.status,
            success: data.success,
            message: data.message,
            error: data.success ? undefined : (data.message || data.error),
          };
        }
      }

      return {
        data: data,
        status: response.status,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
        success: false,
      };
    }
  }

  // =============================================
  // AUTHENTICATION ENDPOINTS
  // =============================================

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

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string; user: User; tokens: AuthTokens }>> {
    return this.request<{ message: string; user: User; tokens: AuthTokens }>('/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendActivation(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/resend-activation/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access: string }>> {
    return this.request<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.PROFILE);
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // User Preferences Management
  async getPreferences(): Promise<ApiResponse<{
    language: string;
    timezone: string;
    date_format: string;
    time_format: string;
    theme: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.PREFERENCES);
  }

  async updatePreferences(preferences: {
    language?: string;
    timezone?: string;
    date_format?: string;
    time_format?: string;
  }): Promise<ApiResponse<{
    language: string;
    timezone: string;
    date_format: string;
    time_format: string;
    theme: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Notification Settings Management
  async getNotificationSettings(): Promise<ApiResponse<{
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    notification_frequency: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.NOTIFICATIONS);
  }

  async updateNotificationSettings(settings: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    marketing_emails?: boolean;
  }): Promise<ApiResponse<{
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    notification_frequency: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.NOTIFICATIONS, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // API Settings Management
  async getAPISettings(): Promise<ApiResponse<{
    api_account: {
      id: string;
      account_id: string;
      name: string;
      status: string;
      is_active: boolean;
      created_at: string;
    };
    api_keys: Array<{
      id: string;
      key_name: string;
      api_key: string;
      secret_key: string;
      status: string;
      permissions: Record<string, string[]>;
      total_uses: number;
      last_used: string | null;
      expires_at: string | null;
      created_at: string;
    }>;
    webhooks: Array<{
      id: string;
      url: string;
      events: string[];
      is_active: boolean;
      total_calls: number;
      successful_calls: number;
      failed_calls: number;
      last_triggered: string | null;
      last_error: string;
      created_at: string;
    }>;
    last_updated: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.API);
  }

  async createAPIKey(data: {
    key_name: string;
    permissions: Record<string, string[]>;
    expires_at?: string | null;
  }): Promise<ApiResponse<{
    id: string;
    key_name: string;
    api_key: string;
    secret_key: string;
    status: string;
    permissions: Record<string, string[]>;
    total_uses: number;
    last_used: string | null;
    expires_at: string | null;
    created_at: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.KEYS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeAPIKey(keyId: string): Promise<ApiResponse<{
    id: string;
    status: string;
    is_active: boolean;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.KEYS.REVOKE(keyId), {
      method: 'POST',
    });
  }

  async regenerateAPIKey(keyId: string): Promise<ApiResponse<{
    id: string;
    key_name: string;
    api_key: string;
    secret_key: string;
    status: string;
    permissions: Record<string, string[]>;
    last_used: string | null;
    expires_at: string | null;
    updated_at: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.KEYS.REGENERATE(keyId), {
      method: 'POST',
    });
  }

  async createWebhook(data: {
    url: string;
    events: string[];
    is_active?: boolean;
  }): Promise<ApiResponse<{
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    last_triggered: string | null;
    last_error: string;
    created_at: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.WEBHOOKS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleWebhook(webhookId: string): Promise<ApiResponse<{
    id: string;
    is_active: boolean;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.WEBHOOKS.TOGGLE(webhookId), {
      method: 'POST',
    });
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<null>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SETTINGS.WEBHOOKS.DELETE(webhookId), {
      method: 'DELETE',
    });
  }

  async changePassword(data: { old_password: string; new_password: string }): Promise<ApiResponse> {
    return this.request('/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.request('/api/accounts/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/api/accounts/password/reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({
        token: token,
        new_password: newPassword
      }),
    });
  }


  async activateAccount(code: string): Promise<ApiResponse> {
    // Note: This endpoint returns HTML, not JSON
    // We need to handle the response differently
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.ACTIVATE_ACCOUNT(code)}`;

    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add token if available (though activation might not require it)
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      // For activation endpoint, we check status code
      // 200 = success, 400 = invalid/expired code
      if (response.ok) {
        // Try to parse as text (HTML response)
        const text = await response.text();
        return {
          status: response.status,
          success: true,
          data: { message: 'Account activated successfully' },
        };
      } else {
        // Error response - try to parse as JSON first, then text
        let errorMessage = 'Invalid or expired verification code';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, read as text
          const errorText = await response.text();
          // Try to extract error message from HTML if possible
          errorMessage = errorText || errorMessage;
        }

        return {
          status: response.status,
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      return {
        status: 500,
        success: false,
        error: error instanceof Error ? error.message : 'Activation request failed',
      };
    }
  }

  async resendActivationEmail(email?: string, phoneNumber?: string): Promise<ApiResponse<{ message: string; phone_number?: string }>> {
    const body: { email?: string; phone_number?: string } = {};
    if (email) body.email = email;
    if (phoneNumber) body.phone_number = phoneNumber;

    return this.request<{ message: string; phone_number?: string }>(API_CONFIG.ENDPOINTS.AUTH.RESEND_ACTIVATION, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifySMSCode(phoneNumber: string, verificationCode: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    phone_verified: boolean;
    account_activated: boolean;
    is_verified: boolean;
    is_active: boolean;
    tokens: AuthTokens;
    user: User;
  }>> {
    return this.request<{
      success: boolean;
      message: string;
      phone_verified: boolean;
      account_activated: boolean;
      is_verified: boolean;
      is_active: boolean;
      tokens: AuthTokens;
      user: User;
    }>(API_CONFIG.ENDPOINTS.AUTH.SMS.VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        verification_code: verificationCode,
      }),
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
    return { status: 200, success: true };
  }

  // =============================================
  // TENANT MANAGEMENT ENDPOINTS - Updated to match backend API
  // =============================================

  async getTenants(): Promise<ApiResponse<{
    results: Tenant[];
  }>> {
    return this.request<{ results: Tenant[] }>('/tenants/');
  }

  async createTenant(tenantData: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    return this.request<Tenant>('/tenants/', {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async getTenant(tenantId: string): Promise<ApiResponse<Tenant>> {
    return this.request<Tenant>(`/tenants/${tenantId}/`);
  }

  async updateTenant(tenantId: string, tenantData: Partial<CreateTenantRequest>): Promise<ApiResponse<Tenant>> {
    return this.request<Tenant>(`/tenants/${tenantId}/`, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async switchTenant(tenantId: string): Promise<ApiResponse<{
    message: string;
    tenant: {
      id: string;
      name: string;
    };
  }>> {
    return this.request<{
      message: string;
      tenant: {
        id: string;
        name: string;
      };
    }>('/tenants/switch/', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    });
  }

  // Get team members
  async getTenantMembers(tenantId: string): Promise<ApiResponse<{
    results: Array<{
      id: string;
      user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
      };
      role: string;
      joined_at: string;
    }>;
  }>> {
    return this.request<{
      results: Array<{
        id: string;
        user: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
        };
        role: string;
        joined_at: string;
      }>;
    }>(`/tenants/${tenantId}/members/`);
  }

  // Invite team member
  async inviteTenantMember(tenantId: string, data: {
    email: string;
    role: 'agent' | 'admin' | 'owner';
  }): Promise<ApiResponse<{
    message: string;
    invitation: {
      id: string;
      email: string;
      role: string;
      status: string;
    };
  }>> {
    return this.request<{
      message: string;
      invitation: {
        id: string;
        email: string;
        role: string;
        status: string;
      };
    }>(`/tenants/${tenantId}/members/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update member role
  async updateTenantMemberRole(tenantId: string, memberId: string, role: string): Promise<ApiResponse<{
    message: string;
    member: {
      id: string;
      role: string;
    };
  }>> {
    return this.request<{
      message: string;
      member: {
        id: string;
        role: string;
      };
    }>(`/tenants/${tenantId}/members/${memberId}/`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Get custom domains
  async getTenantDomains(tenantId: string): Promise<ApiResponse<{
    results: Array<{
      id: string;
      domain: string;
      is_primary: boolean;
      status: string;
      created_at: string;
    }>;
  }>> {
    return this.request<{
      results: Array<{
        id: string;
        domain: string;
        is_primary: boolean;
        status: string;
        created_at: string;
      }>;
    }>(`/tenants/${tenantId}/domains/`);
  }

  // Add custom domain
  async addTenantDomain(tenantId: string, data: {
    domain: string;
    is_primary?: boolean;
  }): Promise<ApiResponse<{
    message: string;
    domain: {
      id: string;
      domain: string;
      is_primary: boolean;
      status: string;
    };
  }>> {
    return this.request<{
      message: string;
      domain: {
        id: string;
        domain: string;
        is_primary: boolean;
        status: string;
      };
    }>(`/tenants/${tenantId}/domains/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =============================================
  // CONTACTS ENDPOINTS
  // =============================================

  async getContacts(params?: {
    search?: string;
    is_active?: boolean;
    is_opted_in?: boolean;
    tags?: string[];
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{ results: Contact[]; count: number; next?: string; previous?: string }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_opted_in !== undefined) queryParams.append('is_opted_in', params.is_opted_in.toString());
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/messaging/contacts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ results: Contact[]; count: number; next?: string; previous?: string }>(endpoint);
  }

  async createContact(contactData: CreateContactRequest): Promise<ApiResponse<Contact>> {
    return this.request<Contact>('/messaging/contacts/', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getContact(contactId: string): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/messaging/contacts/${contactId}/`);
  }

  async updateContact(contactId: string, contactData: Partial<CreateContactRequest>): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/messaging/contacts/${contactId}/`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(contactId: string): Promise<ApiResponse> {
    return this.request(`/messaging/contacts/${contactId}/`, {
      method: 'DELETE',
    });
  }

  // Enhanced Bulk Import - Unified Endpoint
  async bulkImportContacts(data: {
    import_type: 'csv' | 'excel' | 'phone_contacts';
    csv_data?: string;
    file?: File;
    contacts?: CreateContactRequest[];
    skip_duplicates?: boolean;
    update_existing?: boolean;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    imported_count: number;
    updated_count: number;
    skipped_count: number;
    total_processed: number;
    errors: Array<{
      row?: number;
      contact?: CreateContactRequest;
      error: string;
    }>;
  }>> {
    if (data.import_type === 'excel' && data.file) {
      // Excel file upload
      const formData = new FormData();
      formData.append('import_type', data.import_type);
      formData.append('file', data.file);
      if (data.skip_duplicates !== undefined) {
        formData.append('skip_duplicates', data.skip_duplicates.toString());
      }
      if (data.update_existing !== undefined) {
        formData.append('update_existing', data.update_existing.toString());
      }

      return this.request('/messaging/contacts/bulk-import/', {
        method: 'POST',
        headers: {}, // Don't set Content-Type for FormData
        body: formData,
      });
    } else if (data.import_type === 'phone_contacts' && data.contacts) {
      // Phone contacts - convert to CSV format
      const csvData = this.convertContactsToCSV(data.contacts);
      const requestData = {
        import_type: 'csv',
        csv_data: csvData,
        skip_duplicates: data.skip_duplicates ?? true,
        update_existing: data.update_existing ?? false
      };

      return this.request('/messaging/contacts/bulk-import/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } else {
      // JSON data (CSV)
      console.log('Bulk import request data:', data);

      // If we have contacts but no csv_data, convert contacts to CSV
      const requestData = { ...data };
      if (data.contacts && data.contacts.length > 0 && !data.csv_data) {
        requestData.csv_data = this.convertContactsToCSV(data.contacts);
        // Remove contacts from request as we're sending CSV data
        delete requestData.contacts;
      }

      console.log('Final request data:', requestData);

      return this.request('/messaging/contacts/bulk-import/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    }
  }

  // Helper method to convert contacts to CSV format
  private convertContactsToCSV(contacts: CreateContactRequest[]): string {
    // Use standard column names that the backend expects
    const headers = ['name', 'phone', 'email'];
    const rows = contacts.map(contact => {
      // Ensure phone number has + prefix for E.164 format
      let phone = contact.phone_e164 || '';
      if (phone && !phone.startsWith('+')) {
        phone = '+' + phone;
      }

      return [
        contact.name || '',
        phone,
        contact.email || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    console.log('Converted CSV data:', csvContent);
    return csvContent;
  }

  // Legacy methods for backward compatibility
  async bulkImportContactsLegacy(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/messaging/contacts/bulk-import/', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    });
  }

  async importContacts(contactsData: ImportContactsRequest): Promise<ApiResponse<ImportContactsResponse>> {
    return this.request<ImportContactsResponse>('/messaging/contacts/import/', {
      method: 'POST',
      body: JSON.stringify(contactsData),
    });
  }

  async optInContact(contactId: string): Promise<ApiResponse> {
    return this.request(`/messaging/contacts/${contactId}/opt-in/`, {
      method: 'POST',
    });
  }

  async optOutContact(contactId: string): Promise<ApiResponse> {
    return this.request(`/messaging/contacts/${contactId}/opt-out/`, {
      method: 'POST',
    });
  }

  // =============================================
  // BULK OPERATIONS ENDPOINTS
  // =============================================

  async bulkEditContacts(contactIds: string[], updates: Partial<CreateContactRequest>): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updated_count: number;
    total_requested: number;
    errors: string[];
  }>> {
    return this.request('/messaging/contacts/bulk-edit/', {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds, updates }),
    });
  }

  async bulkDeleteContacts(contactIds: string[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    deleted_count: number;
    total_requested: number;
  }>> {
    return this.request('/messaging/contacts/bulk-delete/', {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds }),
    });
  }

  async bulkUpdateContacts(updates: Array<{
    contact_id: string;
    data: Partial<CreateContactRequest>;
  }>): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updated_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }>> {
    return this.request('/messaging/contacts/bulk-update/', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }

  async bulkAddTags(contactIds: string[], tags: string[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updated_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }>> {
    return this.request('/messaging/contacts/bulk-add-tags/', {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds, tags }),
    });
  }

  async bulkRemoveTags(contactIds: string[], tags: string[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    updated_count: number;
    failed_count: number;
    errors: Array<{
      contact_id: string;
      error: string;
    }>;
  }>> {
    return this.request('/messaging/contacts/bulk-remove-tags/', {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds, tags }),
    });
  }

  // =============================================
  // SEGMENTS ENDPOINTS
  // =============================================

  async getSegments(): Promise<ApiResponse<Segment[]>> {
    return this.request<Segment[]>('/messaging/segments/');
  }

  async createSegment(segmentData: CreateSegmentRequest): Promise<ApiResponse<Segment>> {
    return this.request<Segment>('/messaging/segments/', {
      method: 'POST',
      body: JSON.stringify(segmentData),
    });
  }

  async getSegment(segmentId: string): Promise<ApiResponse<Segment>> {
    return this.request<Segment>(`/messaging/segments/${segmentId}/`);
  }

  async updateSegment(segmentId: string, segmentData: Partial<CreateSegmentRequest>): Promise<ApiResponse<Segment>> {
    return this.request<Segment>(`/messaging/segments/${segmentId}/`, {
      method: 'PUT',
      body: JSON.stringify(segmentData),
    });
  }

  async deleteSegment(segmentId: string): Promise<ApiResponse> {
    return this.request(`/messaging/segments/${segmentId}/`, {
      method: 'DELETE',
    });
  }

  async updateSegmentCount(segmentId: string): Promise<ApiResponse> {
    return this.request(`/messaging/segments/${segmentId}/update-count/`, {
      method: 'POST',
    });
  }

  // =============================================
  // TEMPLATES ENDPOINTS
  // =============================================

  // =============================================
  // TEMPLATE ENDPOINTS
  // =============================================

  async getTemplates(params?: TemplateFilterParams): Promise<ApiResponse<TemplateListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.language) queryParams.append('language', params.language);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.favorites_only) queryParams.append('favorites_only', 'true');
    if (params?.approved_only) queryParams.append('approved_only', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/messaging/templates/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<TemplateListResponse>(endpoint);
  }

  async createTemplate(templateData: CreateTemplateRequest): Promise<ApiResponse<Template>> {
    return this.request<Template>('/messaging/templates/', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async getTemplate(templateId: string): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/messaging/templates/${templateId}/`);
  }

  async updateTemplate(templateId: string, templateData: TemplateUpdateRequest): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/messaging/templates/${templateId}/`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async patchTemplate(templateId: string, templateData: TemplateUpdateRequest): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/messaging/templates/${templateId}/`, {
      method: 'PATCH',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse> {
    return this.request(`/messaging/templates/${templateId}/`, {
      method: 'DELETE',
    });
  }

  // Template Actions
  async toggleTemplateFavorite(templateId: string): Promise<ApiResponse<{ is_favorite: boolean }>> {
    return this.request<{ is_favorite: boolean }>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.TOGGLE_FAVORITE(templateId), {
      method: 'POST',
    });
  }

  async incrementTemplateUsage(templateId: string): Promise<ApiResponse<{ usage_count: number }>> {
    return this.request<{ usage_count: number }>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.INCREMENT_USAGE(templateId), {
      method: 'POST',
    });
  }

  async approveTemplate(templateId: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.APPROVE(templateId), {
      method: 'POST',
    });
  }

  async rejectTemplate(templateId: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.REJECT(templateId), {
      method: 'POST',
    });
  }

  async getTemplateVariables(templateId: string): Promise<ApiResponse<{ variables: string[] }>> {
    return this.request<{ variables: string[] }>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.VARIABLES(templateId));
  }

  async copyTemplate(templateId: string, newName?: string): Promise<ApiResponse<Template>> {
    return this.request<Template>(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_ACTIONS.COPY(templateId), {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
  }

  async getTemplateStatistics(): Promise<ApiResponse<{
    total_templates: number;
    approved_templates: number;
    pending_templates: number;
    draft_templates: number;
    rejected_templates: number;
    favorite_templates: number;
    templates_by_category: Record<string, number>;
    templates_by_language: Record<string, number>;
    templates_by_channel: Record<string, number>;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_STATISTICS);
  }

  // =============================================
  // CONVERSATIONS ENDPOINTS
  // =============================================

  async getConversations(params?: {
    contact_id?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{ results: Conversation[]; count: number; next?: string; previous?: string }>> {
    const queryParams = new URLSearchParams();
    if (params?.contact_id) queryParams.append('contact_id', params.contact_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/messaging/conversations/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ results: Conversation[]; count: number; next?: string; previous?: string }>(endpoint);
  }

  async createConversation(contactId: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('/messaging/conversations/', {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId }),
    });
  }

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>(`/messaging/conversations/${conversationId}/`);
  }

  async updateConversation(conversationId: string, data: { status?: string }): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>(`/messaging/conversations/${conversationId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // =============================================
  // MESSAGES ENDPOINTS
  // =============================================

  async getMessages(params?: {
    conversation_id?: string;
    direction?: "in" | "out";
    status?: string;
    provider?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{ results: Message[]; count: number; next?: string; previous?: string }>> {
    const queryParams = new URLSearchParams();
    if (params?.conversation_id) queryParams.append('conversation_id', params.conversation_id);
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.provider) queryParams.append('provider', params.provider);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/messaging/messages/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ results: Message[]; count: number; next?: string; previous?: string }>(endpoint);
  }

  async sendMessage(messageData: SendMessageRequest): Promise<ApiResponse<Message>> {
    return this.request<Message>('/messaging/messages/', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessage(messageId: string): Promise<ApiResponse<Message>> {
    return this.request<Message>(`/messaging/messages/${messageId}/`);
  }

  // =============================================
  // CAMPAIGNS ENDPOINTS (MOVED TO SMART CAMPAIGNS SECTION)
  // =============================================

  // =============================================
  // AI FEATURES ENDPOINTS
  // =============================================

  async getSuggestedReply(conversationId: string): Promise<ApiResponse<{
    suggestions: string[];
    confidence: number;
  }>> {
    return this.request<{
      suggestions: string[];
      confidence: number;
    }>(`/messaging/ai/suggest-reply/${conversationId}/`, {
      method: 'POST',
    });
  }

  async summarizeConversation(conversationId: string): Promise<ApiResponse<{
    summary: string;
    key_points: string[];
    sentiment: string;
  }>> {
    return this.request<{
      summary: string;
      key_points: string[];
      sentiment: string;
    }>(`/messaging/ai/summarize/${conversationId}/`, {
      method: 'POST',
    });
  }

  // =============================================
  // ANALYTICS ENDPOINTS
  // =============================================

  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
    return this.request<AnalyticsOverview>('/messaging/analytics/overview/');
  }

  // =============================================
  // DASHBOARD ENDPOINTS
  // =============================================

  async getDashboardOverview(): Promise<ApiResponse<{
    metrics: {
      total_messages: number;
      active_contacts: number;
      campaign_success_rate: number;
      sender_ids_this_month: number;
    };
    recent_campaigns: Array<{
      id: string;
      name: string;
      type?: string;
      campaign_type?: string;
      campaign_type_display?: string;
      status: string;
      sent?: number;
      sent_count?: number;
      delivered?: number;
      delivered_count?: number;
      opened?: number;
      read_count?: number;
      progress?: number;
      progress_percentage?: number;
      created_at: string;
      created_at_human?: string;
      timeAgo?: string;
    }>;
    message_stats: {
      today: number;
      this_week: number;
      this_month: number;
      growth_rate: number;
    };
    contact_stats: {
      total: number;
      active: number;
      new_this_month: number;
      growth_rate: number;
    };
    last_updated: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.DASHBOARD.OVERVIEW);
  }

  async getDashboardMetrics(): Promise<ApiResponse<{
    total_messages: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    active_contacts: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    campaign_success: {
      value: string;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
    sender_id: {
      value: number;
      change: string;
      change_type: 'positive' | 'negative' | 'neutral';
      description: string;
    };
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.DASHBOARD.METRICS);
  }

  // =============================================
  // SMS ENDPOINTS
  // =============================================

  async sendSMS(data: {
    message: string;
    recipients: string[];
    sender_id?: string;
    template_id?: string;
    scheduled_at?: string;
  }): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.SEND, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Legacy getSMSBalance - use new comprehensive version below

  async getSMSStats(): Promise<ApiResponse<{
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    this_month_sent: number;
    this_month_delivered: number;
    this_month_failed: number;
    cost_this_month: number;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.STATS);
  }

  async validatePhoneNumber(phone: string): Promise<ApiResponse<{ valid: boolean; formatted: string }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.VALIDATE_PHONE, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async testSMSConnection(): Promise<ApiResponse<{ connected: boolean; message: string }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.TEST_CONNECTION);
  }

  async getDeliveryReports(params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<{
    reports: Array<{
      message_id: string;
      status: string;
      created_at: string;
      recipient_count: number;
      content_preview: string;
      sender_id: string;
    }>;
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const endpoint = `${API_CONFIG.ENDPOINTS.MESSAGING.SMS.DELIVERY_REPORTS}?${queryParams.toString()}`;
    return this.request(endpoint);
  }

  async getSMSBalanceIntegration(): Promise<ApiResponse<{
    account_id: string;
    balance: number;
    currency: string;
    last_updated: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.BALANCE);
  }

  async getSMSStatus(messageId: string): Promise<ApiResponse<{
    message_id: string;
    status: string;
    created_at: string;
    recipient_count: number;
    content_preview: string;
    sender_id: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.MESSAGING.SMS.STATUS(messageId));
  }

  // =============================================
  // INTEGRATION API ENDPOINTS
  // =============================================

  async integrationSendSMS(data: IntegrationSMSSendRequest): Promise<ApiResponse<IntegrationSMSSendResponse>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.SEND, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationGetMessageStatus(messageId: string): Promise<ApiResponse<IntegrationSMSSendResponse>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.STATUS(messageId));
  }

  async integrationGetBalance(): Promise<ApiResponse<{
    account_owner: string;
    account_owner_name?: string;
    account_id: string;
    sms_balance: number;
    balance_last_updated: string;
    api_key_prefix?: string;
    tenant_name?: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.BALANCE);
  }

  async integrationGetDeliveryReports(params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<{
    messages: IntegrationDeliveryReport[];
    total: number;
    page: number;
    per_page: number;
  }>> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    const endpoint = params ? `${API_CONFIG.ENDPOINTS.INTEGRATION.SMS.DELIVERY_REPORTS}?${query.toString()}` : API_CONFIG.ENDPOINTS.INTEGRATION.SMS.DELIVERY_REPORTS;
    return this.request(endpoint);
  }

  async integrationRequestSenderId(data: IntegrationSenderIdRequestPayload): Promise<ApiResponse<{
    request_id: string;
    sender_id: string;
    status: string;
    use_case: string;
    created_at: string;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.REQUEST, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationListSenderIdRequests(): Promise<ApiResponse<{
    requests: Array<{
      request_id: string;
      sender_id: string;
      status: string;
      use_case: string;
      created_at: string;
      reviewed_at?: string;
    }>;
    total: number;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.REQUESTS);
  }

  async integrationListAvailableSenderIds(): Promise<ApiResponse<{
    sender_ids: Array<{
      sender_id: string;
      status: string;
      provider?: string;
      provider_name?: string;
      created_at: string;
      approved_at?: string;
    }>;
    total: number;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.AVAILABLE);
  }

  async integrationCreateTenantAccount(data: IntegrationTenantCreateRequest): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.TENANT_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationGetTenantAccount(tenantId: string): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.TENANT_DETAIL(tenantId));
  }

  async integrationListPackages(): Promise<ApiResponse<{
    packages: Array<{
      id: string;
      name: string;
      package_type: string;
      credits: number;
      price: number;
      unit_price: number;
      is_popular: boolean;
      is_active: boolean;
      subtitle?: string;
    }>;
    total_packages: number;
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.PACKAGES);
  }

  async integrationAddTenantCredits(tenantId: string, data: IntegrationTenantCreditRequest): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.TENANT_CREDITS(tenantId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationInitiateTenantPayment(tenantId: string, data: IntegrationPaymentInitiationRequest): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.TENANT_PAYMENT_INIT(tenantId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationCheckTenantPaymentStatus(tenantId: string, transactionId: string): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.TENANT_PAYMENT_STATUS(tenantId, transactionId));
  }

  async integrationInitiateCustomPurchase(tenantId: string, data: IntegrationCustomPaymentRequest): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.CUSTOM_PAYMENT_INIT(tenantId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async integrationCheckCustomPurchaseStatus(tenantId: string, purchaseId: string): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.CUSTOM_PAYMENT_STATUS(tenantId, purchaseId));
  }

  async integrationGetTenantPaymentHistory(tenantId: string, params?: { status?: string; limit?: number; offset?: number }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const endpoint = params
      ? `${API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.PAYMENT_HISTORY(tenantId)}?${query.toString()}`
      : API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.PAYMENT_HISTORY(tenantId);
    return this.request(endpoint);
  }

  async integrationCalculatePricing(data: IntegrationPricingRequest): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PARTNER.CALCULATE_PRICING, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =============================================
  // PAYMENT MANAGEMENT ENDPOINTS - Updated to match backend API
  // =============================================

  // 1. Get Mobile Money Providers
  async getPaymentProviders(): Promise<ApiResponse<{ providers: MobileMoneyProvider[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.PROVIDERS}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ providers: MobileMoneyProvider[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Initiate Payment for Package
  async initiatePayment(data: {
    package_id: string;
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    mobile_money_provider: string;
  }): Promise<ApiResponse<{
    transaction_id: string;
    order_id: string;
    payment_instructions: string;
    amount: number;
    credits: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.INITIATE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<{
        transaction_id: string;
        order_id: string;
        payment_instructions: string;
        amount: number;
        credits: number;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Calculate Custom SMS Price
  async calculateCustomSMSPrice(data: { credits: number }): Promise<ApiResponse<CustomSMSCalculation>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.CUSTOM_CALCULATE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<CustomSMSCalculation>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. Initiate Custom SMS Payment
  async initiateCustomSMSPayment(data: {
    credits: number;
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    mobile_money_provider: string;
  }): Promise<ApiResponse<{
    transaction_id: string;
    order_id: string;
    payment_instructions: string;
    amount: number;
    credits: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.CUSTOM_INITIATE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<{
        transaction_id: string;
        order_id: string;
        payment_instructions: string;
        amount: number;
        credits: number;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Check Payment Status
  async checkPaymentStatus(transactionId: string): Promise<ApiResponse<PaymentStatusResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.STATUS(transactionId)}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<PaymentStatusResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Verify Payment
  async verifyPayment(orderId: string): Promise<ApiResponse<PaymentVerificationResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.VERIFY(orderId)}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<PaymentVerificationResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. Get Payment Progress
  async getPaymentProgress(transactionId: string): Promise<ApiResponse<PaymentProgressResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.PROGRESS(transactionId)}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<PaymentProgressResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 5. Get Active Payments
  async getActivePayments(): Promise<ApiResponse<ActivePaymentsResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.ACTIVE}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<ActivePaymentsResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 6. Cancel Payment
  async cancelPayment(transactionId: string): Promise<ApiResponse<{ success: boolean; message: string; cancelled_order: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.CANCEL(transactionId)}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ success: boolean; message: string; cancelled_order: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 7. Cleanup Payments
  async cleanupPayments(): Promise<ApiResponse<{ success: boolean; message: string; cleaned_count: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PAYMENTS.CLEANUP}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ success: boolean; message: string; cleaned_count: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // =============================================
  // SMS BILLING ENDPOINTS - Updated to match backend API
  // =============================================

  // 1. List SMS Packages
  async getSMSPackages(): Promise<ApiResponse<{ results: SMSPackage[]; count: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.PACKAGES}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ results: SMSPackage[]; count: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Get SMS Balance (updated to use new interface)
  async getSMSBalance(): Promise<ApiResponse<SMSBalance>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.BALANCE}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<SMSBalance>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Create Purchase (legacy endpoint)
  async createPurchase(data: {
    package_id: string;
    payment_method: string;
    payment_reference?: string;
  }): Promise<ApiResponse<Purchase>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.PURCHASE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<Purchase>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. List Purchases
  async getPurchases(): Promise<ApiResponse<{ results: Purchase[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.PURCHASES}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ results: Purchase[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 5. Purchase History
  async getPurchaseHistory(query: PurchaseHistoryQuery = {}): Promise<ApiResponse<{ results: Purchase[] }>> {
    try {
      const params = new URLSearchParams();
      if (query.status) params.append('status', query.status);
      if (query.start_date) params.append('start_date', query.start_date);
      if (query.end_date) params.append('end_date', query.end_date);
      if (query.page) params.append('page', query.page.toString());
      if (query.page_size) params.append('page_size', query.page_size.toString());

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.PURCHASE_HISTORY}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ results: Purchase[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 6. Usage Statistics
  async getUsageStatistics(): Promise<ApiResponse<{
    current_balance: number;
    total_usage: {
      credits: number;
      cost: number;
    };
    daily_usage: Array<{
      date: string;
      credits: number;
      cost: number;
    }>;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SMS.USAGE_STATISTICS}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{
        current_balance: number;
        total_usage: {
          credits: number;
          cost: number;
        };
        daily_usage: Array<{
          date: string;
          credits: number;
          cost: number;
        }>;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // =============================================
  // BILLING HISTORY ENDPOINTS
  // =============================================

  // 1. Comprehensive Billing History (RECOMMENDED)
  async getComprehensiveBillingHistory(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    transactions: Array<{
      id: string;
      type: string;
      type_display: string;
      invoice_number: string;
      amount: number;
      currency: string;
      status: string;
      status_display: string;
      payment_method: string;
      payment_method_display: string;
      credits: number;
      package_name: string;
      unit_price: number;
      created_at: string;
      completed_at: string | null;
      description: string;
      icon: string;
      color: string;
    }>;
    summary: {
      total_transactions: number;
      total_amount: number;
      total_credits: number;
      currency: string;
    };
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.COMPREHENSIVE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Legacy Comprehensive Billing History
  async getBillingHistory(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    summary: {
      total_purchased: number;
      total_credits_purchased: number;
      total_usage_cost: number;
      total_credits_used: number;
      current_balance: number;
      total_purchases: number;
      total_payments: number;
      total_usage_records: number;
    };
    purchases: Purchase[];
    payments: Array<{
      id: string;
      order_id: string;
      amount: number;
      currency: string;
      payment_method: string;
      status: string;
      created_at: string;
    }>;
    usage_records: Array<{
      id: string;
      credits_used: number;
      cost: number;
      created_at: string;
    }>;
    custom_purchases: Array<{
      id: string;
      credits: number;
      unit_price: number;
      total_price: number;
      active_tier: string;
      status: string;
      created_at: string;
    }>;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.BASE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Billing History Summary with Charts
  async getBillingHistorySummary(params?: {
    period?: '7d' | '30d' | '90d' | '1y';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    summary: {
      total_purchased: number;
      total_credits_purchased: number;
      total_usage_cost: number;
      total_credits_used: number;
      current_balance: number;
      total_purchases: number;
      total_payments: number;
      total_usage_records: number;
      period: string;
      start_date: string;
      end_date: string;
    };
    charts: {
      monthly_usage: Array<{
        month: string;
        credits: number;
        cost: number;
      }>;
      payment_methods: Array<{
        method: string;
        count: number;
        amount: number;
      }>;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.SUMMARY}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Detailed Purchase History (New API)
  async getDetailedPurchaseHistory(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    purchases: Purchase[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.PURCHASES}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. Detailed Payment History
  async getDetailedPaymentHistory(params?: {
    status?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    transactions: Array<{
      id: string;
      order_id: string;
      zenopay_order_id: string;
      invoice_number: string;
      amount: number;
      currency: string;
      buyer_email: string;
      buyer_name: string;
      buyer_phone: string;
      payment_method: string;
      payment_method_display: string;
      status: string;
      status_display: string;
      zenopay_reference: string;
      zenopay_transid: string;
      zenopay_channel: string;
      zenopay_msisdn: string;
      webhook_received: boolean;
      created_at: string;
      updated_at: string;
      completed_at: string | null;
      failed_at: string | null;
      error_message: string;
      purchase_data: {
        id: string;
        package_name: string;
        credits: number;
        unit_price: number;
      };
    }>;
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.PAYMENTS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 5. Detailed Usage History
  async getDetailedUsageHistory(params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    usage_records: Array<{
      id: string;
      credits_used: number;
      cost: number;
      created_at: string;
    }>;
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.HISTORY_DETAILED.USAGE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // =============================================
  // SUBSCRIPTION MANAGEMENT ENDPOINTS
  // =============================================

  // 1. List Billing Plans
  async getBillingPlans(): Promise<ApiResponse<{ results: BillingPlan[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PLANS}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ results: BillingPlan[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Get Subscription
  async getSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.SUBSCRIPTION}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<Subscription>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // Get Billing Balance (new endpoint)
  async getBillingBalance(): Promise<ApiResponse<{
    credits: number;
    total_purchased: number;
    total_used: number;
    last_purchase?: string;
    package_history?: Array<{
      package_name: string;
      credits: number;
      purchased_at: string;
    }>;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.BALANCE}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{
        credits: number;
        total_purchased: number;
        total_used: number;
        last_purchase?: string;
        package_history?: Array<{
          package_name: string;
          credits: number;
          purchased_at: string;
        }>;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // Get Billing Packages (new endpoint)
  async getBillingPackages(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    credits: number;
    price: number;
    currency: string;
    savings_percentage: number;
  }>>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.PACKAGES}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<Array<{
        id: number;
        name: string;
        credits: number;
        price: number;
        currency: string;
        savings_percentage: number;
      }>>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Get Billing Overview
  async getBillingOverview(): Promise<ApiResponse<{
    sms_balance: {
      credits: number;
      total_purchased: number;
      total_used: number;
    };
    recent_purchases: Array<{
      id: string;
      package_name: string;
      credits: number;
      amount: number;
      status: string;
      created_at: string;
    }>;
    active_payments: Array<{
      transaction_id: string;
      order_id: string;
      amount: number;
      status: string;
      created_at: string;
    }>;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.OVERVIEW}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{
        sms_balance: {
          credits: number;
          total_purchased: number;
          total_used: number;
        };
        recent_purchases: Array<{
          id: string;
          package_name: string;
          credits: number;
          amount: number;
          status: string;
          created_at: string;
        }>;
        active_payments: Array<{
          transaction_id: string;
          order_id: string;
          amount: number;
          status: string;
          created_at: string;
        }>;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. List Usage Records
  async getUsageRecords(): Promise<ApiResponse<{ results: UsageRecord[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.BILLING.USAGE}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{ results: UsageRecord[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  async createSubscription(planId: string): Promise<ApiResponse> {
    return this.request('/billing/subscription/create/', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async cancelSubscription(): Promise<ApiResponse> {
    return this.request('/billing/subscription/cancel/', {
      method: 'POST',
    });
  }

  async getUsage(): Promise<ApiResponse<Usage>> {
    return this.request<Usage>('/billing/usage/');
  }


  // =============================================
  // SENDER ID MANAGEMENT ENDPOINTS - Updated to match backend API
  // =============================================

  // 1. Request Custom Sender ID
  async requestCustomSenderID(data: {
    request_type: 'custom';
    requested_sender_id: string;
    sample_content: string;
    business_justification: string;
  }): Promise<ApiResponse<{
    id: string;
    requested_sender_id: string;
    status: string;
    created_at: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<{
        id: string;
        requested_sender_id: string;
        status: string;
        created_at: string;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Get Sender ID Requests

  // 5. Attach Sender ID to SMS Package
  async attachSenderIDToPackage(data: {
    sender_id_request: string;
    sms_package: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.USAGE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // =============================================
  // DEFAULT SENDER ID ENDPOINTS
  // =============================================

  // 1. Get Default Sender Overview
  async getDefaultSenderOverview(): Promise<ApiResponse<{
    default_sender: string;
    current_sender_id: string | null;
    active_request: {
      id: string;
      requested_sender_id: string;
      request_type: string;
      status: string;
      sample_content: string;
      created_at: string;
    } | null;
    can_request: boolean;
    reason: string | null;
    balance: {
      credits: number;
      needs_purchase: boolean;
    };
    actions: {
      request_default_url: string;
      status_url: string;
      available_url: string;
      purchase_url: string;
    };
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.DEFAULT_OVERVIEW}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. Request Default Sender ID
  async requestDefaultSenderID(): Promise<ApiResponse<{
    message: string;
    sender_id_request: {
      id: string;
      requested_sender_id: string;
      request_type: string;
      status: string;
      sample_content: string;
      created_at: string;
    };
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.REQUEST_DEFAULT}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2a. Get Available Sender IDs
  async getAvailableSenderIDList(): Promise<ApiResponse<{
    available_sender_ids: Array<{
      id: string;
      requested_sender_id: string;
      sample_content: string;
    }>;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.AVAILABLE}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2b. Cancel/Detach Default Sender ID
  async cancelDefaultSenderID(): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.CANCEL_DEFAULT}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. Get Sender ID Request Status
  async getSenderIDRequestStatus(): Promise<ApiResponse<{
    sms_balance: {
      credits: number;
      total_purchased: number;
      can_request_sender_id: boolean;
    };
    sender_id_requests: Array<{
      id: string;
      requested_sender_id: string;
      request_type: string;
      status: string;
      sample_content: string;
      created_at: string;
    }>;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.STATUS}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }


  // =============================================
  // SENDER NAME ENDPOINTS - COMPREHENSIVE API (Legacy)
  // =============================================

  // 1. SUBMIT SENDER NAME REQUEST
  // POST /api/messaging/sender-requests/submit/
  async submitSenderRequest(formData: FormData): Promise<ApiResponse<SenderNameRequest>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      return await this.handleResponse<SenderNameRequest>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 1. SUBMIT SENDER NAME REQUEST (JSON version)
  // POST /api/messaging/sender-requests/submit/
  async submitSenderRequestJSON(data: {
    requested_sender_id: string;
    sample_content: string;
  }): Promise<ApiResponse<SenderNameRequest>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      });

      return await this.handleResponse<SenderNameRequest>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 2. GET USER REQUESTS
  // GET /api/messaging/sender-requests/
  async getUserRequests(page = 1, pageSize = 10, status: string | null = null, search: string | null = null): Promise<ApiResponse<{
    results: SenderNameRequest[];
    count: number;
    next?: string;
    previous?: string;
  }>> {
    try {
      // Use the user-specific endpoint to ensure we only get current user's requests
      let url = `${API_BASE_URL}/messaging/sender-requests/?page=${page}&page_size=${pageSize}`;

      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      console.log('=== API CLIENT getUserRequests ===');
      console.log('URL:', url);
      console.log('Headers:', this.getHeaders());
      console.log('Token:', this.token);
      console.log('Note: This endpoint should return only current user\'s sender requests');

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      console.log('Raw response status:', response.status);
      console.log('Raw response ok:', response.ok);

      const result = await this.handleResponse<{
        results: SenderNameRequest[];
        count: number;
        next?: string;
        previous?: string;
      }>(response);

      console.log('Processed result:', result);
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 3. GET REQUEST DETAILS
  // GET /api/messaging/sender-requests/{request_id}/
  async getRequestDetails(requestId: string): Promise<ApiResponse<SenderNameRequest>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/${requestId}/`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<SenderNameRequest>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 4. GET STATISTICS
  // GET /api/messaging/sender-requests/stats/
  async getStatistics(): Promise<ApiResponse<SenderNameStats>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/stats/`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<SenderNameStats>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 5. UPDATE REQUEST (ADMIN ONLY)
  // PUT /api/messaging/sender-requests/{request_id}/update/
  async updateRequest(requestId: string, updateData: {
    status?: string;
    admin_notes?: string;
  }): Promise<ApiResponse<SenderNameRequest>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/${requestId}/update/`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      return await this.handleResponse<SenderNameRequest>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 6. DELETE REQUEST
  // DELETE /api/messaging/sender-requests/{request_id}/delete/
  async deleteRequest(requestId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/${requestId}/delete/`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return await this.handleResponse<SenderNameRequest>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 7. ADMIN DASHBOARD
  // GET /api/messaging/sender-requests/admin/dashboard/
  async getAdminDashboard(): Promise<ApiResponse<{
    stats: SenderNameStats;
    recent_requests: SenderNameRequest[];
    pending_requests: SenderNameRequest[];
    tenant_name: string;
    admin_user: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/messaging/sender-requests/admin/dashboard/`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse<{
        stats: SenderNameStats;
        recent_requests: SenderNameRequest[];
        pending_requests: SenderNameRequest[];
        tenant_name: string;
        admin_user: string;
      }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 8. AUTHENTICATION CHECK
  // GET /api/auth/profile/
  async checkAuth(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data, status: response.status };
      } else {
        return { success: false, status: response.status };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // 9. REFRESH TOKEN (using existing method)
  // POST /api/auth/token/refresh/
  async refreshTokenFromStorage(): Promise<ApiResponse<{ access: string }>> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return { success: false, error: 'No refresh token available', status: 401 };
      }

      return await this.refreshToken(refreshToken);
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 0
      };
    }
  }

  // ========================================
  // ERROR HANDLING FUNCTIONS
  // ========================================
  async handleAPIError(result: ApiResponse, context = 'operation'): Promise<boolean> {
    if (!result.success) {
      console.error(`${context} failed:`, result.error);

      // Handle specific error types
      if (result.status === 401) {
        // Token expired, try to refresh
        return await this.refreshTokenAndRetry(context);
      } else if (result.status === 403) {
        console.error(`Access denied: ${result.error}`);
      } else if (result.status === 404) {
        console.error('Resource not found');
      } else if (result.status === 400) {
        console.error(`Validation error: ${result.error}`);
      } else if (result.status === 500) {
        console.error('Server error. Please try again later.');
      } else {
        console.error(result.error || 'An unexpected error occurred');
      }
      return false;
    }
    return true;
  }

  async refreshTokenAndRetry(context: string): Promise<boolean> {
    console.log('Token expired, attempting to refresh...');
    const refreshResult = await this.refreshTokenFromStorage();

    if (refreshResult.success) {
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Token refresh failed, redirecting to login');
      this.redirectToLogin();
      return false;
    }
  }

  redirectToLogin() {
    window.location.href = '/login/';
  }

  // ========================================
  // STATUS HELPER FUNCTIONS
  // ========================================
  getStatusEmoji(status: string): string {
    const statusEmojis: Record<string, string> = {
      'pending': '🟡',
      'approved': '🟢',
      'rejected': '🔴',
      'requires_changes': '🔵'
    };
    return statusEmojis[status] || '⚪';
  }

  getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      'pending': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'requires_changes': 'Requires Changes'
    };
    return statusTexts[status] || status;
  }

  // ========================================
  // LEGACY METHODS (for backward compatibility)
  // ========================================
  async getSenderNameRequests(): Promise<ApiResponse<{
    results: SenderNameRequest[];
    count: number;
    next?: string;
    previous?: string;
  }>> {
    return this.getUserRequests(1, 10);
  }

  async createSenderNameRequest(data: CreateSenderNameRequest): Promise<ApiResponse<SenderNameRequest>> {
    const formData = new FormData();
    formData.append('sender_name', data.sender_name);
    formData.append('use_case', data.use_case);

    if (data.supporting_documents) {
      data.supporting_documents.forEach((file) => {
        formData.append('supporting_documents', file);
      });
    }

    return this.submitSenderRequest(formData);
  }

  async getSenderNameRequest(requestId: string): Promise<ApiResponse<SenderNameRequest>> {
    return this.getRequestDetails(requestId);
  }

  async updateSenderNameRequest(requestId: string, data: UpdateSenderNameRequest): Promise<ApiResponse<SenderNameRequest>> {
    const updateData: { status?: string; admin_notes?: string } = {};
    if (data.status) updateData.status = data.status;
    if (data.admin_notes) updateData.admin_notes = data.admin_notes;

    return this.updateRequest(requestId, updateData);
  }

  async deleteSenderNameRequest(requestId: string): Promise<ApiResponse> {
    return this.deleteRequest(requestId);
  }

  async getSenderNameStats(): Promise<ApiResponse<SenderNameStats>> {
    return this.getStatistics();
  }


  async createSMSPurchase(data: {
    package_id: string;
    payment_method: string;
    payment_reference?: string;
  }): Promise<ApiResponse<{
    purchase_id: string;
    invoice_number: string;
    credits: number;
    amount: number;
    status: string;
    new_balance: number;
  }>> {
    return this.request('/billing/sms/purchase/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSMSPurchases(): Promise<ApiResponse<Array<{
    id: string;
    invoice_number: string;
    package_name: string;
    credits: number;
    amount: number;
    unit_price: number;
    payment_method: string;
    payment_method_display: string;
    status: string;
    status_display: string;
    created_at: string;
    completed_at: string | null;
  }>>> {
    return this.request('/billing/sms/purchases/');
  }

  async getSMSPurchaseHistory(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    purchases: Array<{
      id: string;
      invoice_number: string;
      package_name: string;
      credits: number;
      amount: number;
      unit_price: number;
      payment_method: string;
      status: string;
      created_at: string;
      completed_at: string | null;
    }>;
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/billing/sms/purchases/history/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getSMSUsageStatistics(): Promise<ApiResponse<{
    current_balance: number;
    total_usage: {
      credits: number;
      cost: number;
    };
    monthly_usage: {
      credits: number;
      cost: number;
    };
    weekly_usage: {
      credits: number;
      cost: number;
    };
  }>> {
    return this.request('/billing/sms/usage/statistics/');
  }

  // =============================================
  // SMART CAMPAIGN ENDPOINTS
  // =============================================

  async getCampaigns(params?: {
    status?: string;
    type?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    results: Array<{
      id: string;
      name: string;
      description: string;
      campaign_type: string;
      campaign_type_display: string;
      message_text: string;
      template: string | null;
      status: string;
      status_display: string;
      scheduled_at: string | null;
      started_at: string | null;
      completed_at: string | null;
      total_recipients: number;
      sent_count: number;
      delivered_count: number;
      read_count: number;
      failed_count: number;
      estimated_cost: number;
      actual_cost: number;
      progress_percentage: number;
      delivery_rate: number;
      read_rate: number;
      is_active: boolean;
      can_edit: boolean;
      can_start: boolean;
      can_pause: boolean;
      can_cancel: boolean;
      is_recurring: boolean;
      recurring_schedule: Record<string, unknown>;
      settings: Record<string, unknown>;
      created_by: string;
      created_by_name: string;
      created_at: string;
      updated_at: string;
      target_contact_count: number;
      target_segment_names: string[];
    }>;
    count: number;
    next?: string;
    previous?: string;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const endpoint = `/messaging/campaigns/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // =============================================
  // CAMPAIGN SUMMARY (REMOVED - NOT IN BACKEND API)
  // =============================================

  async getCampaign(id: string): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    campaign_type: string;
    campaign_type_display: string;
    message_text: string;
    template: string | null;
    status: string;
    status_display: string;
    scheduled_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    failed_count: number;
    estimated_cost: number;
    actual_cost: number;
    progress_percentage: number;
    delivery_rate: number;
    read_rate: number;
    is_active: boolean;
    can_edit: boolean;
    can_start: boolean;
    can_pause: boolean;
    can_cancel: boolean;
    is_recurring: boolean;
    recurring_schedule: Record<string, unknown>;
    settings: Record<string, unknown>;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    target_contact_count: number;
    target_segment_names: string[];
  }>> {
    return this.request(`/messaging/campaigns/${id}/`);
  }

  async createCampaign(data: {
    name: string;
    description?: string;
    campaign_type: 'sms' | 'whatsapp' | 'email' | 'mixed';
    message_text: string;
    template?: string | null;
    scheduled_at?: string | null;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: {
      tags?: string[];
      opt_in_status?: string;
    };
    settings?: {
      send_time?: string;
      timezone?: string;
    };
    is_recurring?: boolean;
    recurring_schedule?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    campaign_type: string;
    status: string;
    total_recipients: number;
    created_at: string;
    target_contact_count: number;
    target_segment_names: string[];
  }>> {
    return this.request('/messaging/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: string, data: {
    name?: string;
    description?: string;
    message_text?: string;
    template?: string | null;
    scheduled_at?: string | null;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: {
      tags?: string[];
      opt_in_status?: string;
    };
    settings?: {
      send_time?: string;
      timezone?: string;
    };
    is_recurring?: boolean;
    recurring_schedule?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    campaign_type: string;
    status: string;
    total_recipients: number;
    created_at: string;
    target_contact_count: number;
    target_segment_names: string[];
  }>> {
    return this.request(`/messaging/campaigns/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string): Promise<ApiResponse> {
    return this.request(`/messaging/campaigns/${id}/`, {
      method: 'DELETE',
    });
  }

  async startCampaign(id: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    campaign: {
      id: string;
      status: string;
      started_at: string;
    };
  }>> {
    return this.request(`/messaging/campaigns/${id}/start/`, {
      method: 'POST',
    });
  }

  async pauseCampaign(id: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    campaign: {
      id: string;
      status: string;
    };
  }>> {
    return this.request(`/messaging/campaigns/${id}/pause/`, {
      method: 'POST',
    });
  }

  async cancelCampaign(id: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    campaign: {
      id: string;
      status: string;
      completed_at: string;
    };
  }>> {
    return this.request(`/messaging/campaigns/${id}/cancel/`, {
      method: 'POST',
    });
  }

  async getCampaignAnalytics(id: string): Promise<ApiResponse<{
    campaign_id: string;
    campaign_name: string;
    status: string;
    overview: {
      total_recipients: number;
      sent_count: number;
      delivered_count: number;
      read_count: number;
      failed_count: number;
      progress_percentage: number;
      delivery_rate: number;
      read_rate: number;
    };
    costs: {
      estimated_cost: number;
      actual_cost: number;
    };
    timing: {
      created_at: string;
      scheduled_at: string | null;
      started_at: string | null;
      completed_at: string | null;
    };
    daily_breakdown?: Array<{
      date: string;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
      cost: number;
    }>;
  }>> {
    return this.request(`/messaging/campaigns/${id}/analytics/`);
  }

  async duplicateCampaign(id: string): Promise<ApiResponse<{
    original_id: string;
    duplicate_id: string;
    duplicate_name: string;
  }>> {
    return this.request(`/messaging/campaigns/${id}/duplicate/`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API Configuration and Client for Mifumo WMS
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
  language: string;
  content: string;
  variables: string[];
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  language: string;
  content: string;
  variables: string[];
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

// Billing Types
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  features: string[];
}

export interface Subscription {
  id: string;
  plan: BillingPlan;
  status: "active" | "cancelled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

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
          error: data?.message || data?.error || 'An error occurred',
          status: response.status,
          success: false,
          errors: data?.errors || data,
        };
      }

      // Handle backend response format: { "success": true, "data": {...} }
      if (data && typeof data === 'object' && 'success' in data) {
        return {
          data: data.data,
          status: response.status,
          success: data.success,
          message: data.message,
          error: data.success ? undefined : (data.message || data.error),
        };
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
    return { status: 200, success: true };
  }

  // =============================================
  // TENANT MANAGEMENT ENDPOINTS
  // =============================================

  async getTenants(): Promise<ApiResponse<Tenant[]>> {
    return this.request<Tenant[]>('/tenants/');
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

  async switchTenant(tenantId: string): Promise<ApiResponse> {
    return this.request('/tenants/switch/', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    });
  }

  // =============================================
  // CONTACTS ENDPOINTS
  // =============================================

  async getContacts(params?: {
    search?: string;
    is_active?: boolean;
    is_opted_in?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{ results: Contact[]; count: number; next?: string; previous?: string }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_opted_in !== undefined) queryParams.append('is_opted_in', params.is_opted_in.toString());
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

  async bulkImportContacts(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/messaging/contacts/bulk-import/', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
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

  async getTemplates(): Promise<ApiResponse<Template[]>> {
    return this.request<Template[]>('/messaging/templates/');
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

  async updateTemplate(templateId: string, templateData: Partial<CreateTemplateRequest>): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/messaging/templates/${templateId}/`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse> {
    return this.request(`/messaging/templates/${templateId}/`, {
      method: 'DELETE',
    });
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
      type: string;
      status: string;
      sent: number;
      delivered: number;
      opened: number;
      progress: number;
      created_at: string;
      created_at_human: string;
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
    return this.request('/messaging/dashboard/overview/');
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
    return this.request('/messaging/dashboard/metrics/');
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
    return this.request('/messaging/sms/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSMSBalance(): Promise<ApiResponse<{
    id: string;
    credits: number;
    total_purchased: number;
    total_used: number;
    last_updated: string;
    created_at: string;
  }>> {
    return this.request('/billing/sms/balance/');
  }

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
    return this.request('/messaging/sms/stats/');
  }

  async validatePhoneNumber(phone: string): Promise<ApiResponse<{ valid: boolean; formatted: string }>> {
    return this.request('/messaging/sms/validate-phone/', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async testSMSConnection(): Promise<ApiResponse<{ connected: boolean; message: string }>> {
    return this.request('/messaging/sms/test-connection/');
  }

  // =============================================
  // BILLING ENDPOINTS
  // =============================================

  async getBillingPlans(): Promise<ApiResponse<BillingPlan[]>> {
    return this.request<BillingPlan[]>('/billing/plans/');
  }

  async getSubscription(): Promise<ApiResponse<Subscription>> {
    return this.request<Subscription>('/billing/subscription/');
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

  async getBillingOverview(): Promise<ApiResponse> {
    return this.request('/billing/overview/');
  }

  // =============================================
  // SENDER NAME ENDPOINTS - COMPREHENSIVE API
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

  // 2. GET USER REQUESTS
  // GET /api/messaging/sender-requests/
  async getUserRequests(page = 1, pageSize = 10, status: string | null = null, search: string | null = null): Promise<ApiResponse<{
    results: SenderNameRequest[];
    count: number;
    next?: string;
    previous?: string;
  }>> {
    try {
      let url = `${API_BASE_URL}/messaging/sender-requests/?page=${page}&page_size=${pageSize}`;

      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      console.log('=== API CLIENT getUserRequests ===');
      console.log('URL:', url);
      console.log('Headers:', this.getHeaders());
      console.log('Token:', this.token);

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

  // =============================================
  // SMS BILLING ENDPOINTS
  // =============================================

  async getSMSPackages(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    package_type: string;
    credits: number;
    price: number;
    unit_price: number;
    is_popular: boolean;
    features: string[];
    savings_percentage: number;
  }>>> {
    return this.request('/billing/sms/packages/');
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

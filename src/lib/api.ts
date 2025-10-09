// API Configuration and Client for Mifumo WMS
const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
  // CAMPAIGNS ENDPOINTS
  // =============================================

  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    return this.request<Campaign[]>('/messaging/campaigns/');
  }

  async createCampaign(campaignData: CreateCampaignRequest): Promise<ApiResponse<Campaign>> {
    return this.request<Campaign>('/messaging/campaigns/', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  async getCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    return this.request<Campaign>(`/messaging/campaigns/${campaignId}/`);
  }

  async updateCampaign(campaignId: string, campaignData: Partial<CreateCampaignRequest>): Promise<ApiResponse<Campaign>> {
    return this.request<Campaign>(`/messaging/campaigns/${campaignId}/`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    });
  }

  async startCampaign(campaignId: string): Promise<ApiResponse> {
    return this.request(`/messaging/campaigns/${campaignId}/start/`, {
      method: 'POST',
    });
  }

  async pauseCampaign(campaignId: string): Promise<ApiResponse> {
    return this.request(`/messaging/campaigns/${campaignId}/pause/`, {
      method: 'POST',
    });
  }

  async cancelCampaign(campaignId: string): Promise<ApiResponse> {
    return this.request(`/messaging/campaigns/${campaignId}/cancel/`, {
      method: 'POST',
    });
  }

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
  // SMS ENDPOINTS
  // =============================================

  async sendSMS(data: {
    message: string;
    recipients: string[];
    sender_id?: string;
    template_id?: string;
  }): Promise<ApiResponse> {
    return this.request('/messaging/sms/sms/beem/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendBulkSMS(data: {
    message: string;
    recipients: string[];
    sender_id?: string;
    template_id?: string;
  }): Promise<ApiResponse> {
    return this.request('/messaging/sms/sms/beem/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSMSBalance(): Promise<ApiResponse<{ balance: number; currency: string }>> {
    return this.request<{ balance: number; currency: string }>('/messaging/sms/sms/balance/');
  }

  async getSMSStats(): Promise<ApiResponse> {
    return this.request('/messaging/sms/sms/stats/');
  }

  async sendBeemSMS(data: {
    message: string;
    recipients: string[];
    sender_id?: string;
    template_id?: string;
    scheduled_at?: string;
  }): Promise<ApiResponse> {
    return this.request('/messaging/sms/sms/beem/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
}

export const apiClient = new ApiClient(API_BASE_URL);

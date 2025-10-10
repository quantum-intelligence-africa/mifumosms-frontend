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
  // DASHBOARD ENDPOINTS
  // =============================================

  async getDashboardOverview(): Promise<ApiResponse<{
    metrics: {
      total_messages: number;
      active_contacts: number;
      campaign_success_rate: number;
      revenue_this_month: number;
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
    revenue: {
      value: string;
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

  async getSMSBalance(): Promise<ApiResponse<{ balance: number; currency: string }>> {
    return this.request<{ balance: number; currency: string }>('/messaging/sms/balance/');
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
  }): Promise<ApiResponse<Array<{
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
    recurring_schedule: any;
    settings: any;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    target_contact_count: number;
    target_segment_names: string[];
  }>>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);

    const endpoint = `/messaging/campaigns/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getCampaignSummary(): Promise<ApiResponse<{
    summary: {
      total_campaigns: number;
      active_campaigns: number;
      completed_campaigns: number;
      total_recipients: number;
      total_sent: number;
      total_delivered: number;
      total_read: number;
      total_cost: number;
    };
    recent_campaigns: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      progress: number;
      recipients: number;
      sent: number;
      delivered: number;
      created_at: string;
      created_at_human: string;
    }>;
  }>> {
    return this.request('/messaging/campaigns/summary/');
  }

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
    recurring_schedule: any;
    settings: any;
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
    template?: string;
    scheduled_at?: string;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: any;
    settings?: any;
    is_recurring?: boolean;
    recurring_schedule?: any;
  }): Promise<ApiResponse<{
    id: string;
    name: string;
    status: string;
    total_recipients: number;
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
    template?: string;
    scheduled_at?: string;
    target_contact_ids?: string[];
    target_segment_ids?: string[];
    target_criteria?: any;
    settings?: any;
    is_recurring?: boolean;
    recurring_schedule?: any;
  }): Promise<ApiResponse<{
    id: string;
    name: string;
    status: string;
    total_recipients: number;
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
    campaign_id: string;
    status: string;
    started_at: string | null;
  }>> {
    return this.request(`/messaging/campaigns/${id}/start/`, {
      method: 'POST',
    });
  }

  async pauseCampaign(id: string): Promise<ApiResponse<{
    campaign_id: string;
    status: string;
  }>> {
    return this.request(`/messaging/campaigns/${id}/pause/`, {
      method: 'POST',
    });
  }

  async cancelCampaign(id: string): Promise<ApiResponse<{
    campaign_id: string;
    status: string;
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

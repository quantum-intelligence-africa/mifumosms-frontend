// Notification Service - API client for notification endpoints
import { API_CONFIG } from '@/config/api';

// Types based on the real API documentation
export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'error' | 'warning' | 'info' | 'sms_credit' | 'system' | 'campaign' | 'billing' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'unread' | 'read';
  is_system: boolean;
  is_auto_generated: boolean;
  action_text?: string;
  action_url?: string | null;
  data?: Record<string, any>;
  created_at: string;
  time_ago: string;
  is_unread: boolean;
}

export interface NotificationSettings {
  id: string;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  in_app_notifications_enabled: boolean;
  sms_credit_warning_threshold: number;
  sms_credit_critical_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  recent_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemHealthCheck {
  healthy: boolean;
  issues: Array<{
    component: string;
    healthy: boolean;
    status: string;
    error: string;
    priority: string;
    details: Record<string, any>;
  }>;
  warnings: Array<{
    component: string;
    healthy: boolean;
    status: string;
    error: string;
    priority: string;
    details: Record<string, any>;
  }>;
  timestamp: string;
}

export interface ProblemReport {
  problem_type: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  data?: Record<string, any>;
}

export interface SystemNotificationRequest {
  title: string;
  message: string;
  notification_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  metadata?: Record<string, any>;
}

export interface SMSCreditTestRequest {
  current_credits: number;
  total_credits: number;
}

export interface CleanupRequest {
  days: number;
}

class NotificationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Get recent notifications for header dropdown
  async getRecentNotifications(): Promise<{
    success: boolean;
    notifications: Notification[];
    unread_count: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.RECENT}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get recent notifications: ${response.statusText}`);
    }

    return response.json();
  }

  // Get comprehensive notifications list
  async getRealNotifications(limit: number = 20): Promise<{
    success: boolean;
    notifications: Notification[];
    count: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.REAL}?limit=${limit}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get notifications: ${response.statusText}`);
    }

    return response.json();
  }

  // Get unread count
  async getUnreadCount(): Promise<{ success: boolean; unread_count: number }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.statusText}`);
    }

    return response.json();
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{ success: boolean; data: NotificationStats }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.STATS}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get notification stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
    }

    return response.json();
  }

  // System health check (Admin only)
  async getSystemHealthCheck(): Promise<{ success: boolean; health_status: SystemHealthCheck }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SYSTEM_HEALTH_CHECK}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get system health check: ${response.statusText}`);
    }

    return response.json();
  }

  // Report system problem (Admin only)
  async reportSystemProblem(problemData: ProblemReport): Promise<{
    success: boolean;
    message: string;
    notification_id: string;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SYSTEM_REPORT_PROBLEM}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(problemData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to report system problem: ${response.statusText}`);
    }

    return response.json();
  }

  // Create system notification (Admin only)
  async createSystemNotification(notificationData: SystemNotificationRequest): Promise<{
    success: boolean;
    message: string;
    notification_id: string;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SYSTEM_CREATE}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create system notification: ${response.statusText}`);
    }

    return response.json();
  }

  // Test SMS credit notification
  async testSMSCreditNotification(testData: SMSCreditTestRequest): Promise<{
    success: boolean;
    message: string;
    percentage: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SMS_CREDIT_TEST}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(testData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to test SMS credit notification: ${response.statusText}`);
    }

    return response.json();
  }

  // Cleanup old notifications (Admin only)
  async cleanupOldNotifications(cleanupData: CleanupRequest): Promise<{
    success: boolean;
    message: string;
    deleted_count: number;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SYSTEM_CLEANUP}`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(cleanupData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cleanup old notifications: ${response.statusText}`);
    }

    return response.json();
  }

  // Get notification settings
  async getNotificationSettings(): Promise<{ success: boolean; data: NotificationSettings }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SETTINGS}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get notification settings: ${response.statusText}`);
    }

    return response.json();
  }

  // Update notification settings
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<{
    success: boolean;
    message: string;
    data: NotificationSettings;
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.SETTINGS}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update notification settings: ${response.statusText}`);
    }

    return response.json();
  }

  // Get notification templates (Admin only)
  async getNotificationTemplates(): Promise<{
    success: boolean;
    templates: NotificationTemplate[];
  }> {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.TEMPLATES}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get notification templates: ${response.statusText}`);
    }

    return response.json();
  }
}

export const notificationService = new NotificationService();
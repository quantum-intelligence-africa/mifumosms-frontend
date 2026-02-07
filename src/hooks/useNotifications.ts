import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, NotificationSettings, NotificationStats } from '@/services/NotificationService';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  const { toast } = useToast();

  // Fetch recent notifications for header dropdown
  const fetchRecentNotifications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await notificationService.getRecentNotifications();

      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      } else {
        throw new Error('Failed to fetch recent notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching recent notifications:', err);

      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch comprehensive notifications list
  const fetchNotifications = useCallback(async (limit: number = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.getRealNotifications(limit);

      if (response.success) {
        setNotifications(response.notifications);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);

      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Refresh notifications (alias for fetchRecentNotifications)
  const refreshNotifications = useCallback(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);

      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_unread: false, status: 'read' as const }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        toast({
          title: "Success",
          description: "Notification marked as read",
        });
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      console.error('Error marking notification as read:', err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            is_unread: false,
            status: 'read' as const
          }))
        );

        setUnreadCount(0);

        toast({
          title: "Success",
          description: response.message || "All notifications marked as read",
        });
      } else {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      console.error('Error marking all notifications as read:', err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Delete notification (if supported by API)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));

      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification?.is_unread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      console.error('Error deleting notification:', err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [notifications, toast]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();

      if (response.success) {
        setUnreadCount(response.unread_count);
      } else {
        throw new Error('Failed to fetch unread count');
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Fetch notification settings
  const fetchNotificationSettings = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationSettings();

      if (response.success) {
        setSettings(response.data);
      } else {
        throw new Error('Failed to fetch notification settings');
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
    }
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const response = await notificationService.updateNotificationSettings(newSettings);

      if (response.success) {
        setSettings(response.data);

        toast({
          title: "Success",
          description: response.message || "Settings updated successfully",
        });
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      console.error('Error updating notification settings:', err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch notification statistics
  const fetchNotificationStats = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationStats();

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error('Failed to fetch notification stats');
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  }, []);

  // Auto-refresh notifications every 60 seconds (increased from 30s to reduce load)
  useEffect(() => {
    fetchRecentNotifications();

    const interval = setInterval(() => {
      // Use requestIdleCallback to avoid blocking main thread
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          fetchRecentNotifications();
        }, { timeout: 5000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          fetchRecentNotifications();
        }, 100);
      }
    }, 60000); // 60 seconds (increased from 30s)

    return () => clearInterval(interval);
  }, [fetchRecentNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    isRefreshing,
    isLoading,
    error,
    settings,
    stats,

    // Actions
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount,
    fetchNotificationSettings,
    updateNotificationSettings,
    fetchNotificationStats,
  };
};

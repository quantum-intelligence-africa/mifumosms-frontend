import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  CreditCard, 
  Save,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings } from '@/services/NotificationService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const NotificationSettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    settings,
    fetchNotificationSettings,
    updateNotificationSettings
  } = useNotifications();

  const [formData, setFormData] = useState<Partial<NotificationSettings>>({
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    in_app_notifications_enabled: true,
    sms_credit_warning_threshold: 25.0,
    sms_credit_critical_threshold: 10.0,
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        email_notifications_enabled: settings.email_notifications_enabled,
        sms_notifications_enabled: settings.sms_notifications_enabled,
        in_app_notifications_enabled: settings.in_app_notifications_enabled,
        sms_credit_warning_threshold: settings.sms_credit_warning_threshold,
        sms_credit_critical_threshold: settings.sms_credit_critical_threshold,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof NotificationSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateNotificationSettings(formData);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await fetchNotificationSettings();
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notification Settings</h1>
                <p className="text-text-subtle">
                  Manage your notification preferences and thresholds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="outline"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                    <p className="text-sm text-text-subtle">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={formData.email_notifications_enabled || false}
                    onCheckedChange={(checked) => handleInputChange('email_notifications_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  SMS Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="sms-notifications">Enable SMS Notifications</Label>
                    <p className="text-sm text-text-subtle">
                      Receive critical notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={formData.sms_notifications_enabled || false}
                    onCheckedChange={(checked) => handleInputChange('sms_notifications_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  In-App Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="in-app-notifications">Enable In-App Notifications</Label>
                    <p className="text-sm text-text-subtle">
                      Show notifications in the application interface
                    </p>
                  </div>
                  <Switch
                    id="in-app-notifications"
                    checked={formData.in_app_notifications_enabled || false}
                    onCheckedChange={(checked) => handleInputChange('in_app_notifications_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SMS Credit Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  SMS Credit Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="warning-threshold">Warning Threshold (%)</Label>
                    <p className="text-sm text-text-subtle">
                      Receive a warning when SMS credits fall below this percentage
                    </p>
                    <Input
                      id="warning-threshold"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.sms_credit_warning_threshold || 25}
                      onChange={(e) => handleInputChange('sms_credit_warning_threshold', parseFloat(e.target.value))}
                      className="max-w-xs"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="critical-threshold">Critical Threshold (%)</Label>
                    <p className="text-sm text-text-subtle">
                      Receive a critical alert when SMS credits fall below this percentage
                    </p>
                    <Input
                      id="critical-threshold"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.sms_credit_critical_threshold || 10}
                      onChange={(e) => handleInputChange('sms_credit_critical_threshold', parseFloat(e.target.value))}
                      className="max-w-xs"
                    />
                  </div>
                </div>

                {/* Threshold Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Threshold Guidelines</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Warning threshold should be higher than critical threshold</li>
                        <li>• Recommended warning threshold: 25-30%</li>
                        <li>• Recommended critical threshold: 10-15%</li>
                        <li>• Critical alerts are sent via SMS if enabled</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings Summary */}
            {settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Current Settings Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Email Notifications:</p>
                      <p className={cn(
                        "text-sm",
                        settings.email_notifications_enabled ? "text-green-600" : "text-gray-500"
                      )}>
                        {settings.email_notifications_enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">SMS Notifications:</p>
                      <p className={cn(
                        "text-sm",
                        settings.sms_notifications_enabled ? "text-green-600" : "text-gray-500"
                      )}>
                        {settings.sms_notifications_enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">In-App Notifications:</p>
                      <p className={cn(
                        "text-sm",
                        settings.in_app_notifications_enabled ? "text-green-600" : "text-gray-500"
                      )}>
                        {settings.in_app_notifications_enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated:</p>
                      <p className="text-sm text-text-subtle">
                        {new Date(settings.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
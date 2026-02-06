import { useState, useEffect, useCallback } from "react";
import { logger } from "@/utils/logger";
import {
  User,
  Bell,
  Shield,
  Key,
  Globe,
  CreditCard,
  Users,
  Webhook,
  Database,
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  CheckCircle
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getToastVariant, getToastTitle } from "@/utils/toastUtils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, User as UserType } from "@/lib/api";
import { useSecurity } from "@/hooks/useSecurity";
import { generate2FAQRCode, generateRandomSecretKey, QRCodeData } from "@/utils/qrCodeUtils";
import { SettingsAPI } from "./SettingsAPI";
import { useSMSVerification } from "@/hooks/useSMSVerification";
import { useTenants } from "@/hooks/useTenants";
import { useTeam, TeamMember, TeamRole } from "@/hooks/useTeam";
import { usePartinaRequest } from "@/hooks/usePartinaRequest";
import { useLanguage } from "@/hooks/useLanguage";
import { usePreferences } from "@/hooks/usePreferences";
import { useTheme } from "next-themes";

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ApiAccount {
  id: string;
  account_id: string;
  name: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

interface ApiKey {
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
}

interface Webhook {
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
}

interface ApiSettings {
  api_account?: ApiAccount;
  api_keys?: ApiKey[];
  webhooks?: Webhook[];
  last_updated?: string;
}

interface ExtendedUser extends UserType {
  profile_photo?: string;
  profile?: {
    phone_number?: string;
    phone?: string;
  };
  phone?: string;
  phone_e164?: string;
}

interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
}

const Settings = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [twoFactorData, setTwoFactorData] = useState({
    totpCode: "",
    password: "",
    backupCode: "",
  });
  const [show2FAPassword, setShow2FAPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);
  const [fallbackQRCode, setFallbackQRCode] = useState<QRCodeData | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme: currentTheme, setTheme } = useTheme();

  // Use the new preferences hook
  const {
    preferences,
    isLoading: preferencesLoading,
    isSaving: preferencesSaving,
    updateTheme,
    updateLanguage,
    updateTimezone,
    updateNotifications,
    fetchPreferences,
    updateAllPreferences,
  } = usePreferences();

  // API Settings State
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newApiKeyForm, setNewApiKeyForm] = useState({ key_name: "", permissions: {} as Record<string, string[]> });
  const [newWebhookForm, setNewWebhookForm] = useState({ url: "", events: [] as string[] });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    api_key: string;
    secret_key: string;
  } | null>(null);
  const [showCreatedKeyDialog, setShowCreatedKeyDialog] = useState(false);

  // Notification settings state (separate for backwards compatibility)
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    marketing_emails: false,
  });

  const {
    securitySummary,
    twoFactorStatus,
    activeSessions,
    securityEvents,
    isLoading: securityLoading,
    changePassword: changePasswordSecurity,
    enable2FA,
    disable2FA,
    terminateSession,
    terminateAllOtherSessions,
    fetch2FAStatus,
  } = useSecurity();

  // SMS Verification state
  const { sendAccountVerification, verifyAccount, isSendingCode, isVerifying } = useSMSVerification();
  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  // Team state
  const { currentTenant } = useTenants();
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined;
  const team = useTeam(currentTenant?.id || null, accessToken);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("agent");

  // Billing state
  const [billingData, setBillingData] = useState<{
    balance: {
      credits: number;
      total_purchased: number;
      total_used: number;
      last_purchase?: string;
    } | null;
    packages: Array<{
      id: number;
      name: string;
      credits: number;
      price: number;
      currency: string;
      savings_percentage: number;
    }>;
    isLoading: boolean;
  }>({
    balance: null,
    packages: [],
    isLoading: false,
  });

  useEffect(() => {
    if (currentCategory === 'team' && currentTenant?.id) {
      logger.debug('Loading team members for tenant');
      team.listMembers().catch(err => {
        if (import.meta.env.DEV) logger.warn('Failed to load team members');
      });
      team.getStats().catch(err => {
        if (import.meta.env.DEV) logger.warn('Failed to load team stats');
      });
    }
  }, [currentCategory, currentTenant?.id, team]);

  const fetchBillingData = useCallback(async () => {
    try {
      setBillingData(prev => ({ ...prev, isLoading: true }));

      // Fetch balance using the new endpoint
      const balanceResponse = await apiClient.getBillingBalance();
      const packagesResponse = await apiClient.getBillingPackages();

      if (balanceResponse.success && balanceResponse.data) {
        setBillingData(prev => ({
          ...prev,
          balance: balanceResponse.data,
        }));
      }

      if (packagesResponse.success && packagesResponse.data) {
        let packagesList: Array<{
          id: number;
          name: string;
          credits: number;
          price: number;
          currency: string;
          savings_percentage: number;
        }> = [];

        if (Array.isArray(packagesResponse.data)) {
          packagesList = packagesResponse.data;
        } else if (typeof packagesResponse.data === 'object' && packagesResponse.data !== null && 'packages' in packagesResponse.data) {
          const dataWithPackages = packagesResponse.data as { packages?: typeof packagesList };
          packagesList = Array.isArray(dataWithPackages.packages) ? dataWithPackages.packages : [];
        }

        setBillingData(prev => ({
          ...prev,
          packages: packagesList,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setBillingData(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Fetch billing data when billing category is selected
  useEffect(() => {
    if (currentCategory === 'billing') {
      fetchBillingData();
    }
  }, [currentCategory, fetchBillingData]);

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    const res = await team.inviteMember(inviteEmail, inviteRole);
    if (res.success) {
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail} as ${inviteRole}. They will receive an email with a link to join.`,
        duration: 5000
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("agent");
    } else {
      // Parse detailed error messages from backend
      let errorMessage = res.error || "Please try again";
      let showAction = false;
      let actionText = "";

      if (res.errors && res.errors.email) {
        errorMessage = Array.isArray(res.errors.email) ? res.errors.email[0] : res.errors.email;
      }

      // Check for specific error patterns and suggest actions
      if (errorMessage.toLowerCase().includes("pending invitation")) {
        showAction = true;
        actionText = "Resend Invitation";
        // Find the member in the list
        const pendingMember = team.members.find(m =>
          m.user_email.toLowerCase() === inviteEmail.toLowerCase() &&
          m.status === 'pending'
        );

        if (pendingMember) {
          errorMessage += `\n\nWould you like to resend the invitation?`;
        }
      } else if (errorMessage.toLowerCase().includes("already an active member")) {
        // Just show info, they're already added
        toast({
          title: "Member already active",
          description: errorMessage,
          duration: 7000
        });
        return;
      } else if (errorMessage.toLowerCase().includes("suspended")) {
        showAction = true;
        actionText = "Activate Member";
        const suspendedMember = team.members.find(m =>
          m.user_email.toLowerCase() === inviteEmail.toLowerCase() &&
          m.status === 'suspended'
        );

        if (suspendedMember) {
          errorMessage += `\n\nWould you like to activate them?`;
        }
      }

      toast({
        title: showAction ? "Action needed" : "Failed to send invitation",
        description: errorMessage,
        variant: "destructive",
        duration: 10000
      });
    }
  };

  const handleChangeMemberRole = async (member: TeamMember, role: TeamRole) => {
    // Don't allow changing role for pending members
    if (member.status === 'pending') {
      toast({
        title: "Cannot change role",
        description: "Pending members must accept their invitation first.",
        variant: "destructive"
      });
      return;
    }
    const res = await team.updateMember(member.id, { role });
    if (res.success) {
      toast({ title: "Role updated", description: `Role changed to ${role}` });
    } else {
      toast({ title: "Failed to change role", description: res.error || "", variant: "destructive" });
    }
  };

  const handleToggleMemberStatus = async (member: TeamMember) => {
    const action = member.status === 'active' ? team.suspendMember : team.activateMember;
    const res = await action(member.id);
    if (!res.success) toast({ title: "Action failed", description: res.error || "", variant: "destructive" });
  };

  const handleRemoveMember = async (member: TeamMember) => {
    const res = await team.removeMember(member.id);
    if (!res.success) toast({ title: "Failed to remove", description: res.error || "", variant: "destructive" });
  };

  const handleResendInvitation = async (member: TeamMember) => {
    const res = await team.resendInvitation(member.id);
    if (res.success) toast({ title: "Invitation resent", description: member.user_email });
    else toast({ title: "Failed to resend", description: res.error || "", variant: "destructive" });
  };

  const settingsCategories: SettingsCategory[] = [
    {
      id: "profile",
      title: language === "sw" ? "Wasifu" : "Profile",
      description: language === "sw" ? "Dhibiti taarifa zako binafsi" : "Manage your personal information",
      icon: User,
      color: "bg-blue-500"
    },
    {
      id: "preferences",
      title: language === "sw" ? "Mapendeleo" : "Preferences",
      description: language === "sw"
        ? "Mandhari, lugha, eneo la saa na mapendeleo ya arifa"
        : "Theme, language, timezone, and notification preferences",
      icon: Globe,
      color: "bg-green-500"
    },
    {
      id: "notifications",
      title: language === "sw" ? "Arifa" : "Notifications",
      description: language === "sw" ? "Mapendeleo ya barua pepe na arifa" : "Email and push notification preferences",
      icon: Bell,
      color: "bg-yellow-500"
    },
    {
      id: "security",
      title: language === "sw" ? "Usalama" : "Security",
      description: language === "sw" ? "Mipangilio ya nenosiri na usalama wa akaunti" : "Password and account security settings",
      icon: Shield,
      color: "bg-red-500"
    },
    {
      id: "api",
      title: language === "sw" ? "API na Webhooks" : "API & Webhooks",
      description: language === "sw" ? "API keys na mipangilio ya webhook" : "API keys and webhook configurations",
      icon: Key,
      color: "bg-purple-500"
    },
    {
      id: "team",
      title: language === "sw" ? "Timu" : "Team",
      description: language === "sw" ? "Dhibiti wanatimu na ruhusa" : "Manage team members and permissions",
      icon: Users,
      color: "bg-indigo-500"
    },
    {
      id: "billing",
      title: "Billing",
      description: "Subscription and payment information",
      icon: CreditCard,
      color: "bg-emerald-500"
    },
    {
      id: "partina",
      title: "Partner",
      description: "Request to become a Partner",
      icon: Users,
      color: "bg-orange-500"
    }
  ];

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      const extendedUser = user as ExtendedUser;
      const resolvedPhone =
        user.phone_number ||
        extendedUser?.profile?.phone_number ||
        extendedUser?.profile?.phone ||
        extendedUser?.phone ||
        extendedUser?.phone_e164 ||
        "";

      setProfileData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: resolvedPhone,
      });
    }
  }, [user]);

  // Load notification settings separately (preferences are loaded by usePreferences hook)
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const notifResponse = await apiClient.getNotificationSettings();

        if (notifResponse.success && notifResponse.data) {
          setNotificationSettings({
            email_notifications: notifResponse.data.email_notifications,
            sms_notifications: notifResponse.data.sms_notifications,
            push_notifications: notifResponse.data.push_notifications,
            marketing_emails: notifResponse.data.marketing_emails,
          });
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  // Ensure we stay on the settings page and profile category after successful updates
  useEffect(() => {
    // Only auto-select profile category on desktop, let mobile users choose
    if (currentCategory === null && !isMobile) {
      setCurrentCategory('profile');
    }
  }, [currentCategory, isMobile]);

  // Load API Settings
  const loadAPISettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAPISettings();
      if (response.success && response.data) {
        setApiSettings(response.data as any);
      } else {
        toast({
          title: "Failed to load API settings",
          description: response.error || "Could not fetch API keys.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load API settings:', error);
      toast({
        title: "Failed to load API settings",
        description: error instanceof Error ? error.message : "Could not fetch API keys.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load API settings when API category is selected
  useEffect(() => {
    if (currentCategory === 'api' && !apiSettings) {
      loadAPISettings();
    }
  }, [currentCategory, apiSettings, loadAPISettings]);

  // API Key Handlers
  const handleCreateAPIKey = async () => {
    if (!newApiKeyForm.key_name) {
      toast({
        title: "Key name required",
        description: "Please enter a name for your API key.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.generateApiKey({
        name: newApiKeyForm.key_name,
        permissions: newApiKeyForm.permissions ? Object.values(newApiKeyForm.permissions).flat() : undefined
      });
      if (response.success && response.data) {
        setNewlyCreatedKey({
          api_key: response.data.key,
          secret_key: response.data.key // API returns single key, not separate secret
        });
        setShowCreatedKeyDialog(true);
        setShowApiKeyDialog(false);
        setNewApiKeyForm({ key_name: "", permissions: {} });
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast({
        title: "Failed to create API key",
        description: "An error occurred while creating the API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.revokeApiKey(keyId);
      if (response.success) {
        toast({
          title: "API key revoked",
          description: "The API key has been revoked successfully.",
        variant: "default"
        });
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast({
        title: "Failed to revoke API key",
        description: "An error occurred while revoking the API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateAPIKey = async (keyId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.regenerateAPIKey(keyId);
      if (response.success && response.data) {
        setNewlyCreatedKey({
          api_key: response.data.api_key,
          secret_key: response.data.secret_key || response.data.api_key
        });
        setShowCreatedKeyDialog(true);
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      toast({
        title: "Failed to regenerate API key",
        description: "An error occurred while regenerating the API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Webhook Handlers
  const handleCreateWebhook = async () => {
    if (!newWebhookForm.url || newWebhookForm.events.length === 0) {
      toast({
        title: "Webhook details required",
        description: "Please provide a URL and at least one event.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.createWebhook({
        url: newWebhookForm.url,
        events: newWebhookForm.events,
        is_active: true
      });
      if (response.success) {
        toast({
          title: "Webhook created",
          description: "The webhook has been created successfully.",
        });
        setShowWebhookDialog(false);
        setNewWebhookForm({ url: "", events: [] });
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast({
        title: "Failed to create webhook",
        description: "An error occurred while creating the webhook.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWebhook = async (webhookId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.toggleWebhook(webhookId);
      if (response.success) {
        toast({
          title: "Webhook status updated",
          description: "The webhook status has been toggled successfully.",
        });
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      toast({
        title: "Failed to toggle webhook",
        description: "An error occurred while toggling the webhook.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.deleteWebhook(webhookId);
      if (response.success) {
        toast({
          title: "Webhook deleted",
          description: "The webhook has been deleted successfully.",
        });
        await loadAPISettings();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast({
        title: "Failed to delete webhook",
        description: "An error occurred while deleting the webhook.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@company.com",
      role: "Admin",
      status: "active",
      lastActive: "Online"
    },
    {
      id: "2",
      name: "Sarah Smith",
      email: "sarah@company.com",
      role: "Editor",
      status: "active",
      lastActive: "2 hours ago"
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@company.com",
      role: "Viewer",
      status: "pending",
      lastActive: "Never"
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The API key has been copied to your clipboard."
    });
  };


  const handleProfileUpdate = async (e?: React.FormEvent) => {
    // Prevent any form submission that might cause navigation
    if (e) {
      e.preventDefault();
    }

    // Prevent multiple simultaneous updates
    if (isUpdatingProfile) {
      return;
    }

    setIsLoading(true);
    setIsUpdatingProfile(true);

    try {
      const updateData: ProfileUpdateData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phone,
      };

      if (profileData.email && profileData.email !== user?.email) {
        updateData.email = profileData.email;
      }

      console.log('Updating profile with data:', updateData);
      const result = await updateProfile(updateData);
      console.log('Profile update result:', result);

      if (result.success) {
        toast({
          title: "Profile updated successfully",
          description: "Your profile information has been saved.",
        });

        // Clear any form state if needed
        // The user data will be automatically updated via the AuthContext

        // Ensure we stay on the current page
        console.log('Profile update successful, staying on settings page');

        // Force the component to stay on the current category
        if (currentCategory !== 'profile') {
          setCurrentCategory('profile');
        }
      } else {
        console.error('Profile update failed:', result.error);
        toast({
          title: "Update failed",
          description: result.error || "Failed to update profile. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      if (response.success) {
        toast({
          title: "Password updated successfully",
          description: "Your password has been changed successfully.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({
          title: "Password change failed",
          description: response.error || "Failed to change password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Password change failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!preferences) return;
    try {
      await updateAllPreferences({
        theme: preferences.theme as 'light' | 'dark' | 'system',
        language: preferences.language as 'en' | 'sw',
        timezone: preferences.timezone,
        date_format: preferences.date_format,
        time_format: preferences.time_format,
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        marketing_emails: preferences.marketing_emails,
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.updateNotificationSettings(notificationSettings);
      if (response.success) {
        toast({
          title: "Notification settings updated successfully",
          description: "Your notification preferences have been saved.",
        });
      } else {
        toast({
          title: "Update failed",
          description: response.error || "Failed to update notification settings. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA handlers
  const handleEnable2FA = async () => {
    if (!twoFactorData.totpCode) {
      toast({
        title: "TOTP Code Required",
        description: "Please enter the 6-digit code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await enable2FA(twoFactorData.totpCode);
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setShowBackupCodes(true);
        setTwoFactorData({ ...twoFactorData, totpCode: "" });
      }
    } catch (error) {
      console.error('2FA enable error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFactorData.password || !twoFactorData.totpCode) {
      toast({
        title: "Credentials Required",
        description: "Please enter your password and TOTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await disable2FA(twoFactorData.password, twoFactorData.totpCode);
      if (result.success) {
        setShow2FADisable(false);
        setTwoFactorData({ ...twoFactorData, password: "", totpCode: "" });
      }
    } catch (error) {
      console.error('2FA disable error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback QR code
  const generateFallbackQRCode = async () => {
    if (fallbackQRCode) return fallbackQRCode;

    setIsGeneratingQR(true);
    try {
      const secretKey = generateRandomSecretKey();
      const accountName = user?.email || 'user@example.com';
      const qrData = await generate2FAQRCode(accountName, secretKey);
      setFallbackQRCode(qrData);
      return qrData;
    } catch (error) {
      console.error('Error generating fallback QR code:', error);
      toast({
        title: "QR Code Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Session handlers
  const handleTerminateSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      await terminateSession(sessionId);
    } catch (error) {
      console.error('Session termination error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    setIsLoading(true);
    try {
      await terminateAllOtherSessions();
    } catch (error) {
      console.error('Session termination error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // SMS Verification Handlers
  const handleSendVerificationCode = async () => {
    const targetPhone = (profileData.phone || user?.phone_number || "").trim();
    if (!targetPhone) {
      toast({
        title: "Phone number required",
        description: "Please add a phone number to your profile first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendAccountVerification({ phone_number: targetPhone });
      if (result.success) {
        toast({
          title: "Verification code sent",
          description: `Code sent to ${targetPhone}. Please check your messages.`
        });
        setCodeSent(true);
      } else {
        const errorMessage = result.error || "Please try again.";
        const variant = getToastVariant(errorMessage);
        const title = getToastTitle("Failed to send code", errorMessage, variant);
        toast({
          title,
          description: errorMessage,
          variant
        });
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again.";
      const variant = getToastVariant(errorMessage);
      const title = getToastTitle("Failed to send code", errorMessage, variant);
      toast({
        title,
        description: errorMessage,
        variant
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!smsVerificationCode || smsVerificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyAccount({ code: smsVerificationCode });
      if (result.success) {
        toast({
          title: "Account verified",
          description: "Your account has been successfully verified via SMS."
        });
        setSmsVerificationCode("");
        setCodeSent(false);
        // Refresh user data
        if (updateProfile) {
          updateProfile({ phone_verified: true, is_verified: true });
        }
      } else {
        toast({
          title: "Verification failed",
          description: result.error || "Invalid verification code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryContent = () => {
    const category = settingsCategories.find(cat => cat.id === currentCategory);
    if (!category) return null;

    switch (currentCategory) {
      case "profile":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={(user as ExtendedUser)?.profile_photo || ""} alt={user?.full_name || user?.first_name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                      <p className="text-xs text-text-subtle">
                        Keep your email up to date. Changes may require verification.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                        placeholder="e.g. +255712345678"
                      />
                      <p className="text-xs text-text-subtle">Enter phone number in international format.</p>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading || isUpdatingProfile} className="w-full text-sm">
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading || isUpdatingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {preferencesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-text-subtle">Loading preferences...</p>
                  </div>
                ) : preferences ? (
                  <div className="space-y-4">
                    {/* Theme Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm">Theme</Label>
                      <Select
                        value={currentTheme || 'light'}
                        onValueChange={(value) => updateTheme(value as 'light' | 'dark' | 'system')}
                        disabled={preferencesSaving}
                      >
                        <SelectTrigger className="glass-subtle border-0 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="light">☀️ Light</SelectItem>
                          <SelectItem value="dark">🌙 Dark</SelectItem>
                          <SelectItem value="system">💻 System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm">{t("settings.language")}</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => updateLanguage(value as 'en' | 'sw')}
                        disabled={preferencesSaving}
                      >
                        <SelectTrigger className="glass-subtle border-0 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => updateTimezone(value)}
                        disabled={preferencesSaving}
                      >
                        <SelectTrigger className="glass-subtle border-0 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                          <SelectItem value="Africa/Kampala">Africa/Kampala</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notification Preferences */}
                    <div className="space-y-3">
                      <Label className="text-sm">Notification Preferences</Label>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Email Notifications</Label>
                          <p className="text-xs text-text-subtle">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => updateNotifications('email', checked)}
                          disabled={preferencesSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">SMS Notifications</Label>
                          <p className="text-xs text-text-subtle">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={preferences.sms_notifications}
                          onCheckedChange={(checked) => updateNotifications('sms', checked)}
                          disabled={preferencesSaving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Marketing Emails</Label>
                          <p className="text-xs text-text-subtle">Receive marketing and promotional emails</p>
                        </div>
                        <Switch
                          checked={preferences.marketing_emails}
                          onCheckedChange={(checked) => updateNotifications('marketing', checked)}
                          disabled={preferencesSaving}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-subtle">
                    Failed to load preferences. Please try refreshing the page.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Email Notifications</h4>
                      <p className="text-xs text-text-subtle">Receive email updates about your account</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">SMS Notifications</h4>
                      <p className="text-xs text-text-subtle">Receive SMS alerts for important updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Push Notifications</h4>
                      <p className="text-xs text-text-subtle">Get browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push_notifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Marketing Emails</h4>
                      <p className="text-xs text-text-subtle">Receive promotional and marketing content</p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketing_emails}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketing_emails: checked }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleNotificationSettingsUpdate}
                  disabled={isLoading}
                  className="w-full text-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            {/* Security Summary - Coming Soon */}
            {/*
            {securitySummary && (
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{securitySummary.security_score}</div>
                      <div className="text-xs text-text-subtle">Security Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{securitySummary.active_sessions}</div>
                      <div className="text-xs text-text-subtle">Active Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{securitySummary.recent_events_count}</div>
                      <div className="text-xs text-text-subtle">Recent Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {twoFactorStatus?.is_enabled ? "✓" : "✗"}
                      </div>
                      <div className="text-xs text-text-subtle">2FA Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            */}

            {/* Change Password */}
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-foreground transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-foreground transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-foreground transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="w-full text-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication - Coming Soon */}
            {/*
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground text-sm">2FA Status</h4>
                    <p className="text-xs text-text-subtle">
                      {twoFactorStatus?.is_enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Badge variant={twoFactorStatus?.is_enabled ? "default" : "secondary"} className="text-xs">
                    {twoFactorStatus?.is_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                {!twoFactorStatus?.is_enabled ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h5 className="font-medium text-blue-900 text-sm mb-2">Setup Two-Factor Authentication</h5>
                      <p className="text-xs text-blue-800 mb-3">
                        Add an extra layer of security to your account using any authenticator app.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h6 className="font-medium text-foreground text-sm">Step 1: Download an Authenticator App</h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">G</span>
                            </div>
                            <span className="font-medium text-sm">Google Authenticator</span>
                          </div>
                          <p className="text-xs text-text-subtle mb-2">Most popular choice</p>
                          <div className="flex gap-1">
                            <a
                              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Android
                            </a>
                            <span className="text-xs text-text-subtle">•</span>
                            <a
                              href="https://apps.apple.com/app/google-authenticator/id388497605"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              iOS
                            </a>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <span className="font-medium text-sm">Authy</span>
                          </div>
                          <p className="text-xs text-text-subtle mb-2">Cloud backup</p>
                          <div className="flex gap-1">
                            <a
                              href="https://play.google.com/store/apps/details?id=com.authy.authy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Android
                            </a>
                            <span className="text-xs text-text-subtle">•</span>
                            <a
                              href="https://apps.apple.com/app/authy/id494168017"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              iOS
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                          </div>
                          <span className="font-medium text-sm">Microsoft Authenticator</span>
                        </div>
                        <p className="text-xs text-text-subtle mb-2">Microsoft ecosystem</p>
                        <div className="flex gap-1">
                          <a
                            href="https://play.google.com/store/apps/details?id=com.azure.authenticator"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Android
                          </a>
                          <span className="text-xs text-text-subtle">•</span>
                          <a
                            href="https://apps.apple.com/app/microsoft-authenticator/id983156458"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            iOS
                          </a>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleEnable2FA}
                      disabled={isLoading || !twoFactorData.totpCode || twoFactorData.totpCode.length !== 6}
                      className="w-full text-sm"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isLoading ? "Enabling..." : "Enable 2FA"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <h5 className="font-medium text-green-900 text-sm mb-1">2FA is Enabled</h5>
                      <p className="text-xs text-green-800">
                        Your account is protected with two-factor authentication.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShow2FADisable(true)}
                      className="w-full text-sm"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Disable 2FA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            */}

            {/* SMS Verification */}
            {!user?.phone_verified && (
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    SMS Account Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Verification Status</h4>
                      <p className="text-xs text-text-subtle">
                        {user?.phone_verified ? "Verified" : "Not verified"}
                      </p>
                    </div>
                    <Badge variant={user?.phone_verified ? "default" : "secondary"} className="text-xs">
                      {user?.phone_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h5 className="font-medium text-blue-900 text-sm mb-1">Verify Your Phone Number</h5>
                    <p className="text-xs text-blue-800">
                      Add an extra layer of security by verifying your phone number with SMS.
                    </p>
                  </div>

                  {!codeSent ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Phone Number</Label>
                        <Input
                          value={profileData.phone || user?.phone_number || ""}
                          disabled
                          className="glass-subtle border-0 text-sm bg-muted/50"
                        />
                        <p className="text-xs text-text-subtle">
                          We'll send a verification code to this number
                        </p>
                      </div>
                      <Button
                        onClick={handleSendVerificationCode}
                        disabled={isLoading || isSendingCode}
                        className="w-full text-sm"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {isSendingCode ? "Sending..." : "Send Verification Code"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode" className="text-sm">Verification Code</Label>
                        <Input
                          id="verificationCode"
                          placeholder="Enter 6-digit code"
                          value={smsVerificationCode}
                          onChange={(e) => setSmsVerificationCode(e.target.value)}
                          className="glass-subtle border-0 text-sm text-center text-lg tracking-widest"
                          maxLength={6}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <p className="text-xs text-text-subtle">
                          Check your phone for the verification code sent via SMS
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyAccount}
                          disabled={isLoading || isVerifying || smsVerificationCode.length !== 6}
                          className="flex-1 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isVerifying ? "Verifying..." : "Verify Account"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCodeSent(false);
                            setSmsVerificationCode("");
                          }}
                          disabled={isLoading}
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendVerificationCode}
                        disabled={isLoading || isSendingCode}
                        className="w-full text-xs"
                      >
                        Didn't receive code? Resend
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Sessions - Coming Soon */}
            {/*
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Active Sessions
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSessions(!showSessions)}
                    className="text-xs"
                  >
                    {showSessions ? "Hide" : "View"} Sessions
                  </Button>
                </CardTitle>
              </CardHeader>
              {showSessions && (
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {activeSessions.length === 0 ? (
                      <p className="text-sm text-text-subtle text-center py-4">No active sessions</p>
                    ) : (
                      <>
                        {activeSessions.map((session) => (
                          <div key={session.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="font-medium text-sm">{session.device_name}</span>
                                {session.is_current && (
                                  <Badge variant="default" className="text-xs">Current</Badge>
                                )}
                              </div>
                              {!session.is_current && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTerminateSession(session.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Terminate
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-text-subtle space-y-1">
                              <div>IP: {session.ip_address}</div>
                              <div>Location: {session.location}</div>
                              <div>Last Activity: {session.time_ago}</div>
                            </div>
                          </div>
                        ))}

                        {activeSessions.filter(s => !s.is_current).length > 0 && (
                          <Button
                            variant="outline"
                            onClick={handleTerminateAllOtherSessions}
                            className="w-full text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Terminate All Other Sessions
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Security Events
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecurityEvents(!showSecurityEvents)}
                    className="text-xs"
                  >
                    {showSecurityEvents ? "Hide" : "View"} Events
                  </Button>
                </CardTitle>
              </CardHeader>
              {showSecurityEvents && (
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {securityEvents.length === 0 ? (
                      <p className="text-sm text-text-subtle text-center py-4">No security events</p>
                    ) : (
                      securityEvents.map((event) => (
                        <div key={event.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{event.event_type_display}</span>
                            <span className="text-xs text-text-subtle">{event.time_ago}</span>
                          </div>
                          <p className="text-xs text-text-subtle mb-1">{event.description}</p>
                          <div className="text-xs text-text-subtle">
                            IP: {event.ip_address}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
            */}

            {/* 2FA Disable Dialog - Coming Soon */}
            {/*
            <Dialog open={show2FADisable} onOpenChange={setShow2FADisable}>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="text-sm">Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription className="text-xs">
                    This will remove the extra security layer from your account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="disablePassword" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="disablePassword"
                        type={show2FAPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={twoFactorData.password}
                        onChange={(e) => setTwoFactorData(prev => ({ ...prev, password: e.target.value }))}
                        className="glass-subtle border-0 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShow2FAPassword(!show2FAPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-foreground transition-colors"
                      >
                        {show2FAPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disableTotpCode" className="text-sm">6-Digit Code</Label>
                    <Input
                      id="disableTotpCode"
                      placeholder="Enter 6-digit code from your app"
                      value={twoFactorData.totpCode}
                      onChange={(e) => setTwoFactorData(prev => ({ ...prev, totpCode: e.target.value }))}
                      className="glass-subtle border-0 text-sm"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleDisable2FA}
                    disabled={isLoading || !twoFactorData.password || !twoFactorData.totpCode}
                    className="w-full text-sm"
                  >
                    {isLoading ? "Disabling..." : "Disable 2FA"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="text-sm">Backup Codes</DialogTitle>
                  <DialogDescription className="text-xs">
                    Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ These codes will not be shown again. Save them now!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowBackupCodes(false)}
                    className="w-full text-sm"
                  >
                    I've Saved These Codes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            */}
          </div>
        );

      case "api":
        return (
          <SettingsAPI
            apiSettings={apiSettings}
            isLoading={isLoading}
            showApiKeyDialog={showApiKeyDialog}
            setShowApiKeyDialog={setShowApiKeyDialog}
            showWebhookDialog={showWebhookDialog}
            setShowWebhookDialog={setShowWebhookDialog}
            newApiKeyForm={newApiKeyForm}
            setNewApiKeyForm={setNewApiKeyForm}
            newWebhookForm={newWebhookForm}
            setNewWebhookForm={setNewWebhookForm}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            copyToClipboard={copyToClipboard}
            handleCreateAPIKey={handleCreateAPIKey}
            handleRevokeAPIKey={handleRevokeAPIKey}
            handleRegenerateAPIKey={handleRegenerateAPIKey}
            handleCreateWebhook={handleCreateWebhook}
            handleToggleWebhook={handleToggleWebhook}
            handleDeleteWebhook={handleDeleteWebhook}
            formatDate={formatDate}
          />
        );

      case "team":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Members
                  </div>
                  <Button size="sm" className="text-xs" onClick={() => setInviteOpen(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Invite
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {Array.isArray(team.members) && team.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.user_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.user_name ? member.user_name.split(" ").map(n => n[0]).join("") :
                             member.user_email ? member.user_email.substring(0, 2).toUpperCase() :
                             "AU"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {member.user_name || member.user_email || "Unknown User"}
                          </p>
                          <p className="text-xs text-text-subtle">
                            {member.user_email || "No email"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-1 py-0">{member.role_display || member.role}</Badge>
                        <Badge
                          variant={
                            member.status === "active"
                              ? "default"
                              : member.status === 'pending'
                                ? 'secondary'
                                : 'secondary'
                          }
                          className={`text-xs px-1 py-0 ${member.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}`}
                        >
                          {member.status_display || member.status}
                          {member.status === 'pending' && (
                            <span className="ml-1 animate-pulse">⏳</span>
                          )}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem className="text-xs" onClick={() => handleChangeMemberRole(member, member.role === 'agent' ? 'admin' : 'agent')}>
                              <Edit className="w-3 h-3 mr-2" />
                              {member.role === 'agent' ? 'Promote to Admin' : 'Demote to Agent'}
                            </DropdownMenuItem>
                            {member.status !== 'pending' && (
                              <DropdownMenuItem className="text-xs" onClick={() => handleToggleMemberStatus(member)}>
                                <RefreshCw className="w-3 h-3 mr-2" />
                                {member.status === 'active' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                            )}
                            {member.status === 'pending' && (
                              <DropdownMenuItem className="text-xs" onClick={() => handleResendInvitation(member)}>
                                <Mail className="w-3 h-3 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive text-xs">
                              <Trash2 className="w-3 h-3 mr-2" />
                              <span onClick={() => handleRemoveMember(member)}>Remove</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(team.members) || team.members.length === 0) && (
                    <div className="p-4 rounded-lg bg-muted/30 text-xs text-text-subtle">
                      {team.isLoading ? 'Loading...' : 'No members yet.'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation email to join your team.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email</Label>
                    <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                      <SelectTrigger id="inviteRole" className="glass-subtle border-0">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setInviteOpen(false)} className="text-xs">Cancel</Button>
                  <Button onClick={handleInviteMember} className="text-xs">Send Invite</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4" />
                    Billing Information
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchBillingData}
                    disabled={billingData.isLoading}
                    className="text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${billingData.isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {billingData.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-text-subtle" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SMS Credits Balance */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 text-sm">SMS Credits</h4>
                      <div className="p-4 rounded-lg bg-gradient-surface border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-foreground text-sm">Current Balance</h5>
                          <Badge variant="default" className="text-xs">
                            {billingData.balance?.credits || 0} Credits
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">
                          {billingData.balance?.credits?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-text-subtle mb-3">
                          Total Purchased: {billingData.balance?.total_purchased?.toLocaleString() || '0'} •
                          Total Used: {billingData.balance?.total_used?.toLocaleString() || '0'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.location.href = '/sms/purchase'}
                        >
                          Purchase Credits
                        </Button>
                      </div>
                    </div>

                    {/* Available Packages */}
                    {billingData.packages.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3 text-sm">Available Packages</h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {billingData.packages.slice(0, 3).map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-3 rounded-lg bg-gradient-surface border border-border-subtle"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-foreground text-sm">{pkg.name}</h5>
                                {pkg.savings_percentage > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Save {pkg.savings_percentage}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-lg font-bold text-foreground mb-1">
                                {pkg.credits.toLocaleString()} Credits
                              </p>
                              <p className="text-xs text-text-subtle mb-2">
                                {pkg.currency} {pkg.price.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Usage Statistics */}
                    {billingData.balance && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3 text-sm">Usage Statistics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-subtle">Credits Used</span>
                            <span className="font-medium">
                              {billingData.balance.total_used?.toLocaleString() || '0'} / {billingData.balance.total_purchased?.toLocaleString() || '0'}
                            </span>
                          </div>
                          {billingData.balance.total_purchased > 0 && (
                            <>
                              <div className="w-full bg-gradient-surface rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(100, ((billingData.balance.total_used || 0) / billingData.balance.total_purchased) * 100)}%`
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-text-subtle">
                                  {billingData.balance.last_purchase
                                    ? `Last purchase: ${new Date(billingData.balance.last_purchase).toLocaleDateString()}`
                                    : 'No purchases yet'}
                                </span>
                                <span className="text-success">
                                  {billingData.balance.credits} Remaining
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Quick Actions */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 text-sm">Quick Actions</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => window.location.href = '/sms/purchase'}
                        >
                          <CreditCard className="w-3 h-3 mr-2" />
                          Purchase Credits
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => window.location.href = '/sms/purchase-history'}
                        >
                          <Calendar className="w-3 h-3 mr-2" />
                          Purchase History
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "partina":
        return <PartinaRequestSection />;

      default:
        return null;
    }
  };

  // Partina Request Section Component
  const PartinaRequestSection = () => {
    const { submitPartinaRequest, isLoading } = usePartinaRequest();
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
      const result = await submitPartinaRequest(reason);
      if (result.success) {
        setSubmitted(true);
        setReason('');
        setTimeout(() => setSubmitted(false), 5000);
      }
    };

    return (
      <div className="space-y-4">
        <Card className="glass border-0">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Become a Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            {submitted ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 text-sm">Request Submitted</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Your request to become a Partner has been submitted! Our admin team will review it and notify you once approved.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 text-sm">Why Become a Partner?</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Access to exclusive Partner Insights analytics</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Partner Reference resources and guides</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Priority support and onboarding</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Ability to earn commissions and rewards</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Early access to new features</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-subtle">
                        <span className="text-blue-500 mt-1">✓</span>
                        <span>Enhanced dashboard and reporting tools</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="partina-reason" className="text-sm font-medium">
                        Tell us why you want to become a Partner
                      </Label>
                      <p className="text-xs text-text-subtle mt-1 mb-3">
                        Please provide details about your business, goals, and how you plan to use the Partner features.
                      </p>
                      <textarea
                        id="partina-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={isLoading}
                        placeholder="I want to become a Partner to access partner features..."
                        className="w-full min-h-[150px] p-3 rounded-lg border border-border-subtle bg-background text-foreground placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !reason.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-text-subtle">
              <strong>Note:</strong> After submitting your request, our admin team will review your application and contact you within 2-3 business days with a decision.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto flex flex-col">
              {/* Header */}
              <div className="mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
                <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  Manage your account, team, and application preferences
                </p>
              </div>

              {/* Mobile Category Navigation */}
              {isMobile ? (
                <div className="flex-1 overflow-hidden">
                  {!currentCategory ? (
                    <div className="space-y-2 sm:space-y-3 overflow-y-auto pb-4 sm:pb-6 h-full">
                      {/* Mobile Category Selection Header */}
                      <div className="mb-4">
                        <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
                          Choose Settings Category
                        </h2>
                        <p className="text-sm text-text-subtle">
                          Select a category to manage your settings
                        </p>
                      </div>

                      {settingsCategories.map((category) => (
                        <Card
                          key={category.id}
                          className={`glass border-0 cursor-pointer transition-all duration-200 ${
                            currentCategory === category.id
                              ? 'border-l-4 border-t-4 border-primary bg-primary/5 shadow-lg'
                              : 'hover:shadow-lg'
                          }`}
                          onClick={() => setCurrentCategory(category.id)}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                <category.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground text-xs sm:text-sm">{category.title}</h3>
                                <p className="text-xs text-text-subtle">{category.description}</p>
                              </div>
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-subtle" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentCategory(null)}
                            className="h-8 w-8"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${settingsCategories.find(cat => cat.id === currentCategory)?.color} flex items-center justify-center`}>
                              {(() => {
                                const category = settingsCategories.find(cat => cat.id === currentCategory);
                                const IconComponent = category?.icon;
                                return IconComponent ? <IconComponent className="w-4 h-4 text-white" /> : null;
                              })()}
                            </div>
                            <div>
                              <h2 className="font-medium text-foreground text-sm">
                                {settingsCategories.find(cat => cat.id === currentCategory)?.title}
                              </h2>
                              <p className="text-xs text-text-subtle">
                                {settingsCategories.find(cat => cat.id === currentCategory)?.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quick Category Switcher */}
                        <Select value={currentCategory || ""} onValueChange={setCurrentCategory}>
                          <SelectTrigger className="w-32 h-8 text-xs glass-subtle border-0">
                            <SelectValue placeholder="Switch" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            {settingsCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <category.icon className="w-3 h-3" />
                                  {category.title}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category Content */}
                      <div className="flex-1 overflow-y-auto pb-6">
                        {renderCategoryContent()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout - Keep original tabs */
                <div className="flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        {settingsCategories.map((category) => (
                          <Card
                            key={category.id}
                            className={`glass border-0 cursor-pointer transition-all duration-200 ${
                              currentCategory === category.id
                                ? 'border-l-4 border-t-4 border-primary bg-primary/5 shadow-lg'
                                : 'hover:shadow-lg'
                            }`}
                            onClick={() => setCurrentCategory(category.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                                  <category.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground text-sm">{category.title}</h3>
                                  <p className="text-xs text-text-subtle">{category.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                      <div className="overflow-y-auto pb-6">
                        {renderCategoryContent()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Key Display Dialog */}
      <Dialog open={showCreatedKeyDialog} onOpenChange={setShowCreatedKeyDialog}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="text-sm">API Key Created Successfully!</DialogTitle>
            <DialogDescription className="text-xs">
              Copy these credentials now. You won't be able to see them again.
            </DialogDescription>
          </DialogHeader>
          {newlyCreatedKey && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-xs text-yellow-800 font-medium">
                  ⚠️ Important: Save these credentials securely!
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">API Key</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-3 py-2 rounded font-mono flex-1 break-all">
                    {newlyCreatedKey.api_key}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(newlyCreatedKey.api_key)}
                    className="h-8 w-8"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Secret Key</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-3 py-2 rounded font-mono flex-1 break-all">
                    {newlyCreatedKey.secret_key}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(newlyCreatedKey.secret_key)}
                    className="h-8 w-8"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setShowCreatedKeyDialog(false)}
                className="w-full text-sm"
              >
                I've Saved These Credentials
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

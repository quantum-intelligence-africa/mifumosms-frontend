import { useState, useEffect } from "react";
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
  Calendar
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
import { useAuth } from "@/contexts/AuthContext";

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const Settings = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();

  const settingsCategories: SettingsCategory[] = [
    {
      id: "profile",
      title: "Profile",
      description: "Manage your personal information",
      icon: User,
      color: "bg-blue-500"
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Language, timezone, and display settings",
      icon: Globe,
      color: "bg-green-500"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Email and push notification preferences",
      icon: Bell,
      color: "bg-yellow-500"
    },
    {
      id: "security",
      title: "Security",
      description: "Password, 2FA, and security settings",
      icon: Shield,
      color: "bg-red-500"
    },
    {
      id: "api",
      title: "API & Webhooks",
      description: "API keys and webhook configurations",
      icon: Key,
      color: "bg-purple-500"
    },
    {
      id: "team",
      title: "Team",
      description: "Manage team members and permissions",
      icon: Users,
      color: "bg-indigo-500"
    },
    {
      id: "billing",
      title: "Billing",
      description: "Subscription and payment information",
      icon: CreditCard,
      color: "bg-emerald-500"
    }
  ];

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone_number || "",
      });
    }
  }, [user]);

  const apiKeys = [
    {
      id: "1",
      name: "Production API Key",
      key: "mw_live_pk_1234567890abcdef",
      created: "2024-03-01",
      lastUsed: "2 hours ago",
      permissions: ["read", "write"]
    },
    {
      id: "2",
      name: "Development API Key",
      key: "mw_test_pk_0987654321fedcba",
      created: "2024-03-15",
      lastUsed: "1 day ago",
      permissions: ["read"]
    }
  ];

  const webhooks = [
    {
      id: "1",
      url: "https://myapp.com/webhooks/mifumo",
      events: ["message.sent", "message.delivered", "message.read"],
      status: "active",
      lastTriggered: "5 minutes ago"
    },
    {
      id: "2",
      url: "https://analytics.example.com/webhook",
      events: ["campaign.completed"],
      status: "inactive",
      lastTriggered: "2 days ago"
    }
  ];

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


  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const updateData: any = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phone,
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update profile. Please try again.",
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: "Password change",
        description: "Password change functionality will be implemented soon.",
        variant: "destructive"
      });
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.profile_photo || ""} alt={user?.full_name || user?.first_name} />
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
                      disabled
                      className="glass-subtle border-0 bg-muted/50 text-sm"
                    />
                    <p className="text-xs text-text-subtle">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="glass-subtle border-0 text-sm"
                    />
                  </div>
                </div>

                <Button onClick={handleProfileUpdate} disabled={isLoading} className="w-full text-sm">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
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
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="glass-subtle border-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="text-sm">Date Format</Label>
                    <Select defaultValue="dd-mm-yyyy">
                      <SelectTrigger className="glass-subtle border-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Campaign Alerts</h4>
                      <p className="text-xs text-text-subtle">Get notified when campaigns complete</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Delivery Failures</h4>
                      <p className="text-xs text-text-subtle">Alert me when messages fail to deliver</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Weekly Reports</h4>
                      <p className="text-xs text-text-subtle">Receive weekly performance summaries</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Product Updates</h4>
                      <p className="text-xs text-text-subtle">Stay informed about new features</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground mb-2 text-sm">Change Password</h4>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                      <Input
                        type="password"
                        placeholder="New password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="glass-subtle border-0 text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Two-Factor Authentication</h4>
                      <p className="text-xs text-text-subtle">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      Enable 2FA
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Login Sessions</h4>
                      <p className="text-xs text-text-subtle">Manage your active sessions</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "api":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        New Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle className="text-sm">Create API Key</DialogTitle>
                        <DialogDescription className="text-xs">
                          Generate a new API key for your applications
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="keyName" className="text-xs">Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="e.g., Production API Key"
                            className="glass-subtle border-0 text-sm"
                          />
                        </div>
                        <Button className="w-full text-xs">Create API Key</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{key.name}</h5>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem className="text-xs">
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive text-xs">
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-gradient-surface px-2 py-1 rounded flex-1">
                          {showApiKey ? key.key : key.key.replace(/./g, '•').slice(0, 20) + '...'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="h-6 w-6"
                        >
                          {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(key.key)}
                          className="h-6 w-6"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-subtle">
                        <span>Last used: {key.lastUsed}</span>
                        <div className="flex gap-1">
                          {key.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs px-1 py-0">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4" />
                    Webhooks
                  </div>
                  <Button size="sm" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Webhook
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-xs bg-gradient-surface px-2 py-1 rounded flex-1">
                          {webhook.url}
                        </code>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem className="text-xs">
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive text-xs">
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs px-1 py-0">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant={webhook.status === "active" ? "default" : "secondary"}
                          className="text-xs px-1 py-0"
                        >
                          {webhook.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-subtle mt-1">Last triggered: {webhook.lastTriggered}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <Button size="sm" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Invite
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{member.name}</p>
                          <p className="text-xs text-text-subtle">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-1 py-0">{member.role}</Badge>
                        <Badge
                          variant={member.status === "active" ? "default" : "secondary"}
                          className="text-xs px-1 py-0"
                        >
                          {member.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem className="text-xs">
                              <Edit className="w-3 h-3 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive text-xs">
                              <Trash2 className="w-3 h-3 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-3 text-sm">Current Plan</h4>
                    <div className="p-4 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-foreground text-sm">Professional</h5>
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </div>
                      <p className="text-lg font-bold text-foreground mb-1">Tsh 99/month</p>
                      <p className="text-xs text-text-subtle mb-3">
                        Up to 10,000 messages/month
                      </p>
                      <Button variant="outline" size="sm" className="text-xs">
                        Change Plan
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3 text-sm">Usage This Month</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-subtle">Messages Sent</span>
                        <span className="font-medium">7,245 / 10,000</span>
                      </div>
                      <div className="w-full bg-gradient-surface rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-subtle">Next billing: April 1, 2024</span>
                        <span className="text-success">Tsh 99.00</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-foreground mb-3 text-sm">Payment Method</h4>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-primary rounded flex items-center justify-center">
                          <span className="text-xs text-white font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">•••• •••• •••• 4242</p>
                          <p className="text-xs text-text-subtle">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-3 lg:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="mb-4 lg:mb-6">
                <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-sm lg:text-base text-text-subtle">
                  Manage your account, team, and application preferences
                </p>
              </div>

              {/* Mobile Category Navigation */}
              {isMobile ? (
                <div className="flex-1 overflow-hidden">
                  {!currentCategory ? (
                    <div className="space-y-3 h-full overflow-y-auto pb-6">
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
                              <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                <category.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground text-sm">{category.title}</h3>
                                <p className="text-xs text-text-subtle">{category.description}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-text-subtle" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4">
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

                      {/* Category Content */}
                      <div className="flex-1 overflow-y-auto pb-6">
                        {renderCategoryContent()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout - Keep original tabs */
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
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
                      <div className="h-full overflow-y-auto pb-6">
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
    </div>
  );
};

export default Settings;

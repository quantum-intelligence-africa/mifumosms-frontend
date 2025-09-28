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
  MoreVertical
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Settings = () => {
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
      const result = await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phone,
      });

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
      // This would need to be implemented in the API client
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <h1 className="font-heading text-3xl font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-text-subtle">
                  Manage your account, team, and application preferences
                </p>
              </div>

              {/* Settings Tabs */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="profile" className="h-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="api">API & Webhooks</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Settings */}
                  <TabsContent value="profile" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Profile Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src="" alt={user?.full_name || user?.first_name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl">
                              {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Button variant="outline" size="sm" className="mb-2" disabled>
                              Change Photo
                            </Button>
                            <p className="text-sm text-text-subtle">
                              Photo upload coming soon
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              value={profileData.firstName}
                              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="glass-subtle border-0" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              value={profileData.lastName}
                              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="glass-subtle border-0" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={profileData.email}
                              disabled
                              className="glass-subtle border-0 bg-muted/50" 
                            />
                            <p className="text-xs text-text-subtle">Email cannot be changed</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone" 
                              type="tel" 
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                              className="glass-subtle border-0" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input 
                              id="company" 
                              defaultValue="Tech Corp" 
                              disabled
                              className="glass-subtle border-0 bg-muted/50" 
                            />
                            <p className="text-xs text-text-subtle">Company management coming soon</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select defaultValue="africa-nairobi" disabled>
                              <SelectTrigger className="glass-subtle border-0 bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass">
                                <SelectItem value="africa-nairobi">Africa/Nairobi (EAT)</SelectItem>
                                <SelectItem value="africa-cairo">Africa/Cairo (EET)</SelectItem>
                                <SelectItem value="africa-lagos">Africa/Lagos (WAT)</SelectItem>
                                <SelectItem value="africa-johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-text-subtle">Timezone settings coming soon</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleProfileUpdate} disabled={isLoading}>
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select defaultValue="en">
                              <SelectTrigger className="glass-subtle border-0">
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
                            <Label htmlFor="dateFormat">Date Format</Label>
                            <Select defaultValue="dd-mm-yyyy">
                              <SelectTrigger className="glass-subtle border-0">
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
                  </TabsContent>

                  {/* Notifications */}
                  <TabsContent value="notifications" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notification Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Email Notifications</h4>
                              <p className="text-sm text-text-subtle">Receive email updates about your account</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Campaign Alerts</h4>
                              <p className="text-sm text-text-subtle">Get notified when campaigns complete</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Delivery Failures</h4>
                              <p className="text-sm text-text-subtle">Alert me when messages fail to deliver</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Weekly Reports</h4>
                              <p className="text-sm text-text-subtle">Receive weekly performance summaries</p>
                            </div>
                            <Switch />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Product Updates</h4>
                              <p className="text-sm text-text-subtle">Stay informed about new features</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Security */}
                  <TabsContent value="security" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Security Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Change Password</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input 
                                type="password" 
                                placeholder="Current password" 
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="glass-subtle border-0" 
                              />
                              <Input 
                                type="password" 
                                placeholder="New password" 
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="glass-subtle border-0" 
                              />
                              <Input 
                                type="password" 
                                placeholder="Confirm password" 
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="glass-subtle border-0" 
                              />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={handlePasswordChange}
                              disabled={isLoading}
                            >
                              {isLoading ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                              <p className="text-sm text-text-subtle">Add an extra layer of security</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Enable 2FA
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">Login Sessions</h4>
                              <p className="text-sm text-text-subtle">Manage your active sessions</p>
                            </div>
                            <Button variant="outline" size="sm">
                              View Sessions
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* API & Webhooks */}
                  <TabsContent value="api" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            API Keys
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New API Key
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass">
                              <DialogHeader>
                                <DialogTitle>Create API Key</DialogTitle>
                                <DialogDescription>
                                  Generate a new API key for your applications
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="keyName">Key Name</Label>
                                  <Input 
                                    id="keyName"
                                    placeholder="e.g., Production API Key" 
                                    className="glass-subtle border-0" 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Permissions</Label>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <input type="checkbox" id="read" className="rounded" />
                                      <Label htmlFor="read">Read access</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="checkbox" id="write" className="rounded" />
                                      <Label htmlFor="write">Write access</Label>
                                    </div>
                                  </div>
                                </div>
                                <Button className="w-full">Create API Key</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Key</TableHead>
                              <TableHead>Permissions</TableHead>
                              <TableHead>Last Used</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apiKeys.map((key) => (
                              <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <code className="text-sm bg-gradient-surface px-2 py-1 rounded">
                                      {showApiKey ? key.key : key.key.replace(/./g, '•').slice(0, 20) + '...'}
                                    </code>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => copyToClipboard(key.key)}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {key.permissions.map((permission) => (
                                      <Badge key={permission} variant="secondary" className="text-xs">
                                        {permission}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-text-subtle">{key.lastUsed}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass">
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Webhook className="w-5 h-5" />
                            Webhooks
                          </div>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Webhook
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>URL</TableHead>
                              <TableHead>Events</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Triggered</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {webhooks.map((webhook) => (
                              <TableRow key={webhook.id}>
                                <TableCell>
                                  <code className="text-sm bg-gradient-surface px-2 py-1 rounded">
                                    {webhook.url}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {webhook.events.slice(0, 2).map((event) => (
                                      <Badge key={event} variant="outline" className="text-xs">
                                        {event}
                                      </Badge>
                                    ))}
                                    {webhook.events.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{webhook.events.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={webhook.status === "active" ? "default" : "secondary"}
                                    className="capitalize"
                                  >
                                    {webhook.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-text-subtle">{webhook.lastTriggered}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass">
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Team */}
                  <TabsContent value="team" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Team Members
                          </div>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Invite Member
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Active</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {member.name.split(" ").map(n => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-foreground">{member.name}</p>
                                      <p className="text-sm text-text-subtle">{member.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{member.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={member.status === "active" ? "default" : "secondary"}
                                    className="capitalize"
                                  >
                                    {member.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-text-subtle">{member.lastActive}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass">
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Change Role
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Billing */}
                  <TabsContent value="billing" className="space-y-6 h-full overflow-y-auto">
                    <Card className="glass border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Billing Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-foreground mb-4">Current Plan</h4>
                            <div className="p-4 rounded-lg bg-gradient-surface border border-border-subtle">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-foreground">Professional</h5>
                                <Badge variant="default">Active</Badge>
                              </div>
                              <p className="text-2xl font-bold text-foreground mb-1">$99/month</p>
                              <p className="text-sm text-text-subtle">
                                Up to 10,000 messages/month
                              </p>
                              <Button variant="outline" size="sm" className="mt-3">
                                Change Plan
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-foreground mb-4">Usage This Month</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-text-subtle">Messages Sent</span>
                                <span className="font-medium">7,245 / 10,000</span>
                              </div>
                              <div className="w-full bg-gradient-surface rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }}></div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-subtle">Next billing: April 1, 2024</span>
                                <span className="text-success">$99.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium text-foreground mb-4">Payment Method</h4>
                          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-surface border border-border-subtle">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-6 bg-primary rounded flex items-center justify-center">
                                <span className="text-xs text-white font-bold">VISA</span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                                <p className="text-sm text-text-subtle">Expires 12/2025</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
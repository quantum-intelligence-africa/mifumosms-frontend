import { Bell, Menu, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State management
  const [notifications] = useState([
    { id: 1, title: "Campaign Sent", message: "Your campaign has been sent successfully", time: "2 minutes ago", unread: true },
    { id: 2, title: "Low Balance", message: "Your account balance is running low", time: "1 hour ago", unread: true },
    { id: 3, title: "Contact Import", message: "50 contacts have been imported successfully", time: "3 hours ago", unread: false },
  ]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  const unreadCount = notifications.filter(n => n.unread).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-14 lg:h-16 glass border-b border-border-subtle flex items-center justify-between px-3 lg:px-6">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Spacer for desktop - pushes actions to the right */}
      {!isMobile && <div className="flex-1" />}

      {/* Actions */}
      <div className="flex items-center gap-1 lg:gap-3">

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 ${notification.unread ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-text-subtle">{notification.time}</span>
                  </div>
                  <span className="text-xs text-text-subtle mt-1">{notification.message}</span>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-center py-6">
                <span className="text-text-subtle">No notifications</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <span className="text-sm">View all</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`h-8 lg:h-9 ${isMobile ? 'px-1' : 'px-2'}`}>
              <Avatar className={`h-7 w-7 lg:h-8 lg:w-8 ${isMobile ? '' : 'mr-2'}`}>
                <AvatarImage src="" alt={user?.full_name || user?.first_name} />
                <AvatarFallback className="text-xs">
                  {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <span className="text-sm font-medium">
                  {user?.first_name || 'User'}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.full_name || `${user?.first_name} ${user?.last_name}`}
                </p>
                <p className="text-xs leading-none text-text-subtle">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Indicator - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-subtle">Online</span>
          </div>
        )}
      </div>
    </header>
  );
}

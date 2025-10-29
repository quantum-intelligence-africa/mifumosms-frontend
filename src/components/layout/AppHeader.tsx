import { Menu, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <header className="h-14 lg:h-16 glass border-b border-border-subtle flex items-center justify-between px-3 lg:px-6 relative z-50">
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
        <NotificationDropdown />

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
                  {isLoading ? 'Loading...' : (user?.first_name || 'User')}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {isLoading ? 'Loading...' : (user?.full_name || `${user?.first_name} ${user?.last_name}` || 'User')}
                </p>
                <p className="text-xs leading-none text-text-subtle">
                  {isLoading ? '...' : (user?.email || 'No email')}
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

import { Bell, Search, Menu, Globe, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, logout } = useAuth();
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

      {/* Search */}
      <div className={`flex-1 ${isMobile ? 'mx-3' : 'max-w-md mx-6'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <Input
            placeholder={isMobile ? "Search..." : "Search conversations, contacts, campaigns..."}
            className="pl-10 glass-subtle border-0 focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 lg:gap-3">
        {/* Language Selector - Hidden on mobile */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuLabel>Languages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
              <DropdownMenuItem>🇰🇪 Kiswahili</DropdownMenuItem>
              <DropdownMenuItem>🇫🇷 Français</DropdownMenuItem>
              <DropdownMenuItem>🇸🇦 العربية</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9 relative">
          <Bell className="w-4 h-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 text-xs p-0 flex items-center justify-center"
          >
            3
          </Badge>
        </Button>

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

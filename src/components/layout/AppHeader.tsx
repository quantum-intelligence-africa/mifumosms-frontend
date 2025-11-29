import { Menu, User, Settings, LogOut, Moon, Sun } from "lucide-react";
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
import { useTheme } from "next-themes";
// import NotificationDropdown from "@/components/notifications/NotificationDropdown";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

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
    <header className="sticky top-0 h-14 lg:h-16 glass border-b border-border-subtle flex items-center justify-between px-3 lg:px-6 relative z-50 backdrop-blur-xl">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 hover:bg-accent rounded-lg transition-fast"
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Spacer for desktop - pushes actions to the right */}
      {!isMobile && <div className="flex-1" />}

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-3">

        {/* Notifications - Removed for now */}
        {/* <NotificationDropdown /> */}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 rounded-lg hover:bg-accent transition-smooth"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`h-9 hover:bg-accent rounded-lg transition-fast ${isMobile ? 'px-1.5' : 'px-2.5'}`}
            >
              <Avatar className={`h-7 w-7 ring-2 ring-border ${isMobile ? '' : 'mr-2.5'}`}>
                <AvatarImage src="" alt={user?.full_name || user?.first_name} />
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-primary-light text-primary-foreground">
                  {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <span className="text-[13px] font-medium">
                  {isLoading ? 'Loading...' : (user?.first_name || 'User')}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass-subtle shadow-xl">
            <DropdownMenuLabel className="font-normal pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-border">
                  <AvatarImage src="" alt={user?.full_name || user?.first_name} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground">
                    {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">
                    {isLoading ? 'Loading...' : (user?.full_name || `${user?.first_name} ${user?.last_name}` || 'User')}
                  </p>
                  <p className="text-xs leading-none text-text-subtle truncate">
                    {isLoading ? '...' : (user?.email || 'No email')}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem 
              onClick={() => navigate('/settings')} 
              className="cursor-pointer hover:bg-accent transition-fast py-2.5"
            >
              <User className="mr-3 h-4 w-4" />
              <span className="text-sm">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/settings')} 
              className="cursor-pointer hover:bg-accent transition-fast py-2.5"
            >
              <Settings className="mr-3 h-4 w-4" />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive cursor-pointer hover:bg-destructive/10 transition-fast py-2.5"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Indicator - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </div>
            <span className="text-[11px] font-medium text-success">Online</span>
          </div>
        )}
      </div>
    </header>
  );
}

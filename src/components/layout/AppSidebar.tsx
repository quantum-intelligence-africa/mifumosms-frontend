import {
  MessageSquare,
  Users,
  Send,
  FileText,
  BarChart3,
  Settings,
  Home,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  CreditCard,
  Tag,
  History,
  X,
  LogOut,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  children?: NavItem[];
}

// Navigation will be created dynamically using translations

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation();
  const [smsOpen, setSmsOpen] = useState(true);
  const { user, logout, isLoading } = useAuth();
  const isMobile = useIsMobile();

  // Navigation items
  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, count: undefined },
    {
      name: "SMS",
      href: "#",
      icon: Send,
      children: [
        { name: "Send SMS", href: "/sms/send", icon: Zap },
        { name: "Purchase SMS", href: "/sms/purchase", icon: CreditCard },
        { name: "Sender Names", href: "/sms/sender-names", icon: Tag },
        { name: "Purchase History", href: "/sms/purchase-history", icon: History },
      ]
    },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Campaigns", href: "/campaigns", icon: Send },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Integration Guide", href: "/integration-guide", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex h-screen flex-col glass border-r border-border-subtle
        ${isMobile
          ? `fixed left-0 top-0 z-50 w-72 sm:w-80 transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-64 relative'
        }
      `}>
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 border-b border-border-subtle">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-base sm:text-lg font-semibold text-foreground truncate">Mifumo SMS</h1>
            <p className="text-xs text-text-subtle truncate">Communication Hub</p>
          </div>
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
            >
              <X className="h-3 h-4 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>

      {/* Quick Actions */}
      <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 border-b border-border-subtle">
        <Link to="/campaigns?new=true" onClick={isMobile ? onClose : undefined}>
          <Button variant="hero" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">New Campaign</span>
            <span className="xs:hidden">New Campaign</span>
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 sm:px-3 lg:px-4 py-2 custom-scrollbar overflow-y-auto">
        <ul className="space-y-0.5 sm:space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <li key={item.name}>
                  <Collapsible open={smsOpen} onOpenChange={setSmsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-9 sm:h-10 lg:h-11 px-2 lg:px-3 text-xs sm:text-sm lg:text-base"
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        {smsOpen ? (
                          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-auto flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto flex-shrink-0" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <ul className="space-y-0.5 sm:space-y-1 ml-1 sm:ml-2 lg:ml-4 pl-1 sm:pl-2 lg:pl-4 border-l-2 border-border-subtle">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = location.pathname === child.href;
                          return (
                            <li key={child.name}>
                              <Link
                                to={child.href}
                                className="block"
                                onClick={isMobile ? onClose : undefined}
                              >
                                <Button
                                  variant={childActive ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start h-7 sm:h-8 lg:h-9 text-xs lg:text-sm px-1 sm:px-2"
                                >
                                  <ChildIcon className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                                  <span className="truncate">{child.name}</span>
                                </Button>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="block"
                  onClick={isMobile ? onClose : undefined}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start h-9 sm:h-10 lg:h-11 px-2 lg:px-3 text-xs sm:text-sm lg:text-base"
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    {item.count && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1 sm:px-1.5 lg:px-2 py-0.5 flex-shrink-0">
                        {item.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-2 sm:p-3 lg:p-4 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 p-1.5 sm:p-2 lg:p-3 rounded-xl glass-subtle">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 flex-shrink-0">
            <AvatarImage src="" alt={user?.full_name || user?.first_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm">
              {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium text-foreground truncate">
              {isLoading ? 'Loading...' : (user?.full_name || `${user?.first_name} ${user?.last_name}` || 'User')}
            </p>
            <p className="text-xs text-text-subtle truncate">
              {isLoading ? '...' : (user?.email || 'No email')}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0"
                onClick={logout}
              >
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Log out</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}

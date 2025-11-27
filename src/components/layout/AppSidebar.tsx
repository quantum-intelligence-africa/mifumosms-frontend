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
    // { name: "Templates", href: "/templates", icon: FileText },
    // { name: "Analytics", href: "/analytics", icon: BarChart3 },
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
          ? `fixed left-0 top-0 z-50 w-64 sm:w-72 transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-56 relative'
        }
      `}>
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border-subtle">
          <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
            <MessageSquare className="w-3 h-3 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-sm font-semibold text-foreground truncate">Mifumo SMS</h1>
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
      <div className="px-3 py-2 border-b border-border-subtle">
        <Link to="/sms/purchase" onClick={isMobile ? onClose : undefined}>
          <Button variant="hero" size="sm" className="w-full text-xs h-7">
            <Plus className="w-3 h-3" />
            <span>Buy SMS</span>
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 custom-scrollbar overflow-y-auto">
        <ul className="space-y-0.5">
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
                        className="w-full justify-start h-8 px-2 text-xs"
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        {smsOpen ? (
                          <ChevronDown className="w-3 h-3 ml-auto flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <ul className="space-y-0.5 ml-2 pl-2 border-l-2 border-border-subtle">
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
                                  className="w-full justify-start h-6 text-xs px-2"
                                >
                                  <ChildIcon className="w-3 h-3 flex-shrink-0" />
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
                    className="w-full justify-start h-8 px-2 text-xs"
                  >
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    {item.count && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1 py-0.5 flex-shrink-0">
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
      <div className="p-2 border-t border-border-subtle">
        <div className="flex items-center gap-2 p-2 rounded-lg glass-subtle">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src="" alt={user?.full_name || user?.first_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
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
                className="h-6 w-6 flex-shrink-0"
                onClick={logout}
              >
                <LogOut className="w-3 h-3" />
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

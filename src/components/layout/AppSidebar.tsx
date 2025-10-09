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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home, count: undefined },
  // { name: "Conversations", href: "/conversations", icon: MessageSquare, count: 12 },
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
  { name: "Contacts", href: "/contacts", icon: Users, count: 1240 },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [smsOpen, setSmsOpen] = useState(true);
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen w-64 flex-col glass border-r border-border-subtle">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-semibold text-foreground">Mifumo</h1>
          <p className="text-xs text-text-subtle">Communication Hub</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <Link to="/campaigns?new=true">
          <Button variant="hero" size="sm" className="w-full">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 custom-scrollbar overflow-y-auto">
        <ul className="space-y-1">
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
                        className="w-full justify-start h-11 px-3"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {smsOpen ? (
                          <ChevronDown className="w-4 h-4 ml-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <ul className="space-y-1 ml-4 pl-4 border-l-2 border-border-subtle">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = location.pathname === child.href;
                          return (
                            <li key={child.name}>
                              <Link to={child.href} className="block">
                                <Button
                                  variant={childActive ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start h-9"
                                >
                                  <ChildIcon className="w-4 h-4" />
                                  <span className="text-sm">{child.name}</span>
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
                <Link to={item.href} className="block">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start h-11 px-3"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count && (
                      <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
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
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-3 p-3 rounded-xl glass-subtle">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={user?.full_name || user?.first_name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.full_name || `${user?.first_name} ${user?.last_name}` || 'User'}
            </p>
            <p className="text-xs text-text-subtle truncate">
              {user?.email || 'No email'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

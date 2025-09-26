import { Bell, Search, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  return (
    <header className="h-16 glass border-b border-border-subtle flex items-center justify-between px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <Input
            placeholder="Search conversations, contacts, campaigns..."
            className="pl-10 glass-subtle border-0 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
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

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="w-4 h-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            3
          </Badge>
        </Button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-subtle">Online</span>
        </div>
      </div>
    </header>
  );
}
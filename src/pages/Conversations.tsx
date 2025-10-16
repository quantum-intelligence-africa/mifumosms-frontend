import { useState } from "react";
import {
  Search,
  Filter,
  MessageSquare,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Archive,
  Star,
  Trash2,
  User,
  CheckCheck,
  Check
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isIncoming: boolean;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "document";
}

interface Conversation {
  id: string;
  contact: {
    name: string;
    phone: string;
    avatar?: string;
    status: "online" | "offline";
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isStarred: boolean;
  tags: string[];
  messages: Message[];
}

const Conversations = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const conversations: Conversation[] = [
    {
      id: "1",
      contact: {
        name: "Sarah Mwangi",
        phone: "+254 700 123 456",
        status: "online"
      },
      lastMessage: "Thank you for the quick response! I'll check that out.",
      timestamp: "2 min ago",
      unreadCount: 2,
      isStarred: true,
      tags: ["VIP", "Customer"],
      messages: [
        {
          id: "1",
          text: "Hi! I have a question about your services.",
          timestamp: "10:30 AM",
          isIncoming: true
        },
        {
          id: "2",
          text: "Hello Sarah! I'd be happy to help. What would you like to know?",
          timestamp: "10:32 AM",
          isIncoming: false,
          status: "read"
        },
        {
          id: "3",
          text: "Thank you for the quick response! I'll check that out.",
          timestamp: "10:35 AM",
          isIncoming: true
        }
      ]
    },
    {
      id: "2",
      contact: {
        name: "Ahmed Hassan",
        phone: "+20 100 567 890",
        status: "offline"
      },
      lastMessage: "Perfect! When can we schedule a demo?",
      timestamp: "1 hour ago",
      unreadCount: 0,
      isStarred: false,
      tags: ["Lead", "Enterprise"],
      messages: [
        {
          id: "1",
          text: "I'm interested in your enterprise solution.",
          timestamp: "9:15 AM",
          isIncoming: true
        },
        {
          id: "2",
          text: "Great! I can show you our enterprise features. Would you like to schedule a demo?",
          timestamp: "9:18 AM",
          isIncoming: false,
          status: "delivered"
        },
        {
          id: "3",
          text: "Perfect! When can we schedule a demo?",
          timestamp: "9:20 AM",
          isIncoming: true
        }
      ]
    },
    {
      id: "3",
      contact: {
        name: "Marie Dubois",
        phone: "+33 6 78 90 12 34",
        status: "online"
      },
      lastMessage: "Merci beaucoup pour votre aide!",
      timestamp: "3 hours ago",
      unreadCount: 1,
      isStarred: false,
      tags: ["French", "Support"],
      messages: [
        {
          id: "1",
          text: "Bonjour! J'ai besoin d'aide avec votre plateforme.",
          timestamp: "7:45 AM",
          isIncoming: true
        },
        {
          id: "2",
          text: "Bonjour Marie! Je serais ravi de vous aider. Quel est le problème?",
          timestamp: "7:50 AM",
          isIncoming: false,
          status: "read"
        },
        {
          id: "3",
          text: "Merci beaucoup pour votre aide!",
          timestamp: "8:15 AM",
          isIncoming: true
        }
      ]
    }
  ];

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim() && currentConversation) {
      // In a real app, this would send the message via API
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const formatTime = (timestamp: string) => {
    // In a real app, this would format actual timestamps
    return timestamp;
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 flex">
          {/* Conversations List */}
          <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-border-subtle flex flex-col ${isMobile && selectedConversation ? 'hidden' : ''}`}>
            {/* Search and Filters */}
            <div className="px-[max(12px,env(safe-area-inset-left))] py-[max(8px,env(safe-area-inset-top))] border-b border-border-subtle">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-subtle border-0 text-sm"
                />
              </div>
              <div className="flex gap-1 lg:gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="glass-subtle border-0 text-xs">
                  <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  <span className="hidden sm:inline">All</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <span className="hidden sm:inline">Unread</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <span className="hidden sm:inline">Starred</span>
                </Button>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 lg:p-4 border-b border-border-subtle cursor-pointer hover:bg-accent/50 transition-smooth ${
                    selectedConversation === conversation.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-2 lg:gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 lg:w-12 lg:h-12">
                        <AvatarImage src={conversation.contact.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs lg:text-sm">
                          {conversation.contact.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-background ${
                        conversation.contact.status === "online" ? "bg-success" : "bg-text-subtle"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-foreground truncate text-sm lg:text-base">
                          {conversation.contact.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {conversation.isStarred && (
                            <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-amber-400 text-amber-400" />
                          )}
                          <span className="text-xs text-text-subtle">
                            {conversation.timestamp}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs lg:text-sm text-text-subtle truncate mb-2">
                        {conversation.lastMessage}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {conversation.tags.slice(0, 1).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {conversation.tags.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              +{conversation.tags.length - 1}
                            </Badge>
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="w-4 h-4 lg:w-5 lg:h-5 text-xs p-0 flex items-center justify-center">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 lg:p-4 border-b border-border-subtle glass">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedConversation(null)}
                          className="h-8 w-8 mr-2"
                        >
                          ←
                        </Button>
                      )}
                      <Avatar className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0">
                        <AvatarImage src={currentConversation.contact.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {currentConversation.contact.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground text-sm lg:text-base truncate">
                          {currentConversation.contact.name}
                        </h3>
                        <p className="text-xs lg:text-sm text-text-subtle truncate">
                          {currentConversation.contact.phone} • {currentConversation.contact.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 lg:gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                        <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                        <Star className={`w-3 h-3 lg:w-4 lg:h-4 ${currentConversation.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                            <MoreVertical className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="w-4 h-4 mr-2" />
                            View contact
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete conversation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isIncoming ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 lg:px-4 py-2 rounded-2xl ${
                          message.isIncoming
                            ? "bg-card glass border border-border-subtle"
                            : "gradient-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-xs lg:text-sm">{message.text}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          message.isIncoming ? "text-text-subtle" : "text-primary-foreground/70"
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {!message.isIncoming && (
                            <div className="ml-2">
                              {message.status === "read" ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : message.status === "delivered" ? (
                                <CheckCheck className="w-3 h-3 opacity-50" />
                              ) : (
                                <Check className="w-3 h-3 opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-3 lg:p-4 border-t border-border-subtle glass">
                  <div className="flex items-end gap-2 lg:gap-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="min-h-[36px] lg:min-h-[40px] max-h-32 resize-none glass-subtle border-0 text-sm"
                        rows={1}
                      />
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                        <Paperclip className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                        <Smile className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="icon"
                        className="h-8 w-8 lg:h-9 lg:w-9"
                      >
                        <Send className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-base lg:text-lg font-semibold text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm lg:text-base text-text-subtle">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;

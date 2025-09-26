import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  User,
  Tag,
  Calendar,
  ExternalLink
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuSeparator,
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

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  tags: string[];
  status: "active" | "inactive" | "blocked";
  lastContact: string;
  createdAt: string;
  avatar?: string;
  country: string;
  totalMessages: number;
  lastMessage?: string;
}

const Contacts = () => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const contacts: Contact[] = [
    {
      id: "1",
      name: "Sarah Mwangi",
      email: "sarah@example.com",
      phone: "+254 700 123 456",
      company: "TechCorp Kenya",
      tags: ["VIP", "Customer", "Enterprise"],
      status: "active",
      lastContact: "2 hours ago",
      createdAt: "2024-01-15",
      country: "Kenya",
      totalMessages: 45,
      lastMessage: "Thank you for the quick response!"
    },
    {
      id: "2",
      name: "Ahmed Hassan",
      email: "ahmed@company.eg",
      phone: "+20 100 567 890",
      company: "Cairo Solutions",
      tags: ["Lead", "Enterprise", "Hot"],
      status: "active",
      lastContact: "1 day ago",
      createdAt: "2024-02-20",
      country: "Egypt",
      totalMessages: 12,
      lastMessage: "When can we schedule a demo?"
    },
    {
      id: "3",
      name: "Marie Dubois",
      email: "marie@startup.sn",
      phone: "+221 77 123 4567",
      company: "Dakar Innovation",
      tags: ["Customer", "French", "SME"],
      status: "active",
      lastContact: "3 days ago",
      createdAt: "2024-01-08",
      country: "Senegal",
      totalMessages: 28,
      lastMessage: "Merci beaucoup!"
    },
    {
      id: "4",
      name: "John Okafor",
      email: "john@business.ng",
      phone: "+234 803 456 7890",
      company: "Lagos Enterprises",
      tags: ["Prospect", "Nigeria"],
      status: "inactive",
      lastContact: "1 week ago",
      createdAt: "2024-03-01",
      country: "Nigeria",
      totalMessages: 8
    },
    {
      id: "5",
      name: "Fatima Al-Zahra",
      email: "fatima@tech.ma",
      phone: "+212 6 78 90 12 34",
      company: "Casablanca Tech",
      tags: ["Customer", "Arabic", "Premium"],
      status: "active",
      lastContact: "5 hours ago",
      createdAt: "2024-02-14",
      country: "Morocco",
      totalMessages: 67,
      lastMessage: "شكرا لكم على الخدمة الممتازة"
    }
  ];

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery) ||
                         contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = filterTag === "all" || contact.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length 
        ? []
        : filteredContacts.map(c => c.id)
    );
  };

  const getStatusColor = (status: Contact["status"]) => {
    switch (status) {
      case "active": return "bg-success";
      case "inactive": return "bg-amber-500";
      case "blocked": return "bg-destructive";
      default: return "bg-text-subtle";
    }
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-foreground">
                    Contacts
                  </h1>
                  <p className="text-text-subtle">
                    Manage your customer database and relationships
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="glass-subtle border-0">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" className="glass-subtle border-0">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Add New Contact</DialogTitle>
                        <DialogDescription>
                          Create a new contact in your database
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Full Name" className="glass-subtle border-0" />
                        <Input placeholder="Email Address" className="glass-subtle border-0" />
                        <Input placeholder="Phone Number" className="glass-subtle border-0" />
                        <Input placeholder="Company" className="glass-subtle border-0" />
                        <div className="flex gap-2">
                          <Button className="flex-1">Add Contact</Button>
                          <Button variant="outline" className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-subtle border-0"
                  />
                </div>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-48 glass-subtle border-0">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedContacts.length > 0 && (
                <div className="mb-4 p-3 glass rounded-lg border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {selectedContacts.length} contact(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Tag className="w-4 h-4 mr-1" />
                        Add Tag
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Send Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Table */}
              <Card className="flex-1 glass border-0 overflow-hidden">
                <div className="overflow-auto h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-subtle">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === filteredContacts.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow 
                          key={contact.id}
                          className="border-border-subtle cursor-pointer hover:bg-accent/50"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={() => handleSelectContact(contact.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={contact.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {contact.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{contact.name}</p>
                                <div className="flex items-center gap-3 text-sm text-text-subtle">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {contact.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {contact.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-text-subtle">{contact.company || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {contact.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {contact.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{contact.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.status)}`} />
                              <span className="text-sm capitalize">{contact.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground font-medium">{contact.totalMessages}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-text-subtle">{contact.lastContact}</span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass">
                                <DropdownMenuItem>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail Panel */}
      {selectedContact && (
        <div className="w-80 border-l border-border-subtle glass flex flex-col">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold">Contact Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {selectedContact.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-medium text-foreground mb-1">{selectedContact.name}</h4>
              <p className="text-sm text-text-subtle">{selectedContact.company}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedContact.status)}`} />
                <span className="text-sm capitalize">{selectedContact.status}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-subtle" />
                <span className="text-sm text-foreground">{selectedContact.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-text-subtle" />
                <span className="text-sm text-foreground">{selectedContact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-text-subtle" />
                <span className="text-sm text-foreground">{selectedContact.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-subtle" />
                <span className="text-sm text-foreground">
                  Joined {new Date(selectedContact.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Tags</p>
              <div className="flex gap-1 flex-wrap">
                {selectedContact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button className="flex-1" size="sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <Tabs defaultValue="activity" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-4 space-y-4">
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <p className="text-sm text-text-subtle mb-2">Last Message</p>
                    <p className="text-sm text-foreground">
                      {selectedContact.lastMessage || "No recent messages"}
                    </p>
                    <p className="text-xs text-text-subtle mt-2">{selectedContact.lastContact}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4 space-y-4">
                <Card className="glass border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Message Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-subtle">Total Messages</span>
                      <span className="text-sm font-medium">{selectedContact.totalMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-subtle">Last Contact</span>
                      <span className="text-sm font-medium">{selectedContact.lastContact}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
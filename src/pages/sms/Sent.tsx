import { useState, useEffect, useCallback } from "react";
import { logger } from "@/utils/logger";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type SMSMessageItem } from "@/lib/api";
import { Search, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";

const PAGE_SIZE = 20;

const Sent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSMSMessages({
        status__in: "sent,delivered",
        page: currentPage,
        search: search || undefined,
      });
      if (response.success && response.data) {
        setMessages(response.data.results || []);
        setTotal(response.data.count || 0);
      } else {
        setMessages([]);
        setTotal(0);
      }
    } catch (error) {
      logger.warn("Failed to load sent messages");
      toast({
        title: "Failed to load sent messages",
        description: "Could not fetch sent messages.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, toast]);

  useEffect(() => {
    loadMessages();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setCurrentPage(1);
    loadMessages();
  };

  const recipientOf = (m: SMSMessageItem) =>
    m.recipient_number || m.contact_phone || m.contact_name || "—";

  const statusVariant = (status: string) =>
    status === "delivered" ? "default" : "secondary";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
                <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  Sent
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  Messages that were successfully sent or delivered.
                </p>
              </div>

              {/* Toolbar */}
              <Card className="glass border-0 mb-4 sm:mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
                      <Input
                        placeholder="Search by recipient or message ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="glass-subtle border-0 text-sm pl-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSearch} disabled={isLoading} className="text-xs">
                        <Search className="w-3 h-3 mr-2" />
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => loadMessages()}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Sent messages
                    <Badge variant="secondary" className="text-xs ml-1">
                      {total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      <p className="text-xs text-text-subtle">Loading sent messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="w-12 h-12 mx-auto text-text-subtle mb-3" />
                      <p className="text-sm text-text-subtle">No sent messages yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Recipient</TableHead>
                              <TableHead className="text-xs">Message</TableHead>
                              <TableHead className="text-xs">Sender</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Sent at</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {messages.map((m) => (
                              <TableRow key={m.id}>
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  {recipientOf(m)}
                                </TableCell>
                                <TableCell className="text-xs max-w-[280px] truncate" title={m.message || ""}>
                                  {m.message || "—"}
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {m.sender_name || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(m.status)} className="text-xs">
                                    {m.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {formatDate(m.sent_at || m.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="text-xs"
                          >
                            Previous
                          </Button>
                          <span className="text-xs text-text-subtle">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || isLoading}
                            className="text-xs"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sent;

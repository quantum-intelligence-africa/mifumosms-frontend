import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { MessagesSubNav } from "@/components/layout/MessagesSubNav";
import { Search, RefreshCw, AlertCircle, Send, Pencil, Inbox } from "lucide-react";

const PAGE_SIZE = 20;

const Outbox = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSMSMessages({
        status: "failed",
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
      logger.warn("Failed to load outbox");
      toast({
        title: "Failed to load outbox",
        description: "Could not fetch failed messages.",
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

  const handleRetry = async (m: SMSMessageItem) => {
    setRetryingId(m.id);
    try {
      const response = await apiClient.retrySMSMessage(m.id);
      if (response.success) {
        toast({
          title: "Message re-queued",
          description: `Resending to ${recipientOf(m)}.`,
        });
        // It's no longer "failed" — drop it and refresh counts.
        loadMessages();
      } else {
        toast({
          title: "Could not resend",
          description: response.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.warn("Retry failed");
      toast({
        title: "Could not resend",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleEditResend = (m: SMSMessageItem) => {
    const phone = m.recipient_number || m.contact_phone || "";
    const params = new URLSearchParams();
    params.set("mode", "single");
    if (phone) params.set("contact", phone);
    if (m.message) params.set("message", m.message);
    navigate(`/messaging/send?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
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
              <MessagesSubNav />
              {/* Header */}
              <div className="mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
                <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  Outbox
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  Messages that failed to send. Review the reason and resend.
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
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Failed messages
                    <Badge variant="secondary" className="text-xs ml-1">
                      {total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      <p className="text-xs text-text-subtle">Loading outbox...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <Inbox className="w-12 h-12 mx-auto text-text-subtle mb-3" />
                      <p className="text-sm text-text-subtle">No failed messages. You're all caught up.</p>
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
                              <TableHead className="text-xs">Reason</TableHead>
                              <TableHead className="text-xs">Failed at</TableHead>
                              <TableHead className="text-xs text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {messages.map((m) => (
                              <TableRow key={m.id}>
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  {recipientOf(m)}
                                </TableCell>
                                <TableCell className="text-xs max-w-[220px] truncate" title={m.message || ""}>
                                  {m.message || "—"}
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {m.sender_name || "—"}
                                </TableCell>
                                <TableCell className="text-xs max-w-[240px]">
                                  <span className="text-destructive" title={m.error_message || ""}>
                                    {m.error_message || m.error_code || "Unknown error"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {formatDate(m.failed_at || m.created_at)}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => handleRetry(m)}
                                      disabled={retryingId === m.id}
                                      className="text-xs h-7"
                                    >
                                      <Send
                                        className={`w-3 h-3 mr-1.5 ${retryingId === m.id ? "animate-pulse" : ""}`}
                                      />
                                      {retryingId === m.id ? "Sending..." : "Retry"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditResend(m)}
                                      className="text-xs h-7"
                                    >
                                      <Pencil className="w-3 h-3 mr-1.5" />
                                      Edit &amp; resend
                                    </Button>
                                  </div>
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

export default Outbox;

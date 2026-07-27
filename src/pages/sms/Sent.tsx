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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type SMSMessageItem } from "@/lib/api";
import { MessagesSubNav } from "@/components/layout/MessagesSubNav";
import { Search, RefreshCw, CheckCircle2, MessageSquare, Copy, Check } from "lucide-react";

const PAGE_SIZE = 20;

const Sent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMessage, setViewMessage] = useState<SMSMessageItem | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Message copied to clipboard." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the message.",
        variant: "destructive",
      });
    }
  };

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
              <MessagesSubNav />
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
                      {/* Desktop / tablet table */}
                      <div className="hidden md:block overflow-x-auto">
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
                              <TableRow
                                key={m.id}
                                onClick={() => m.message && setViewMessage(m)}
                                title={m.message ? "Click to view and copy the full message" : undefined}
                                className={m.message ? "cursor-pointer" : undefined}
                              >
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  {recipientOf(m)}
                                </TableCell>
                                <TableCell className="text-xs max-w-[280px]">
                                  <span className="block max-w-full truncate">
                                    {m.message || "—"}
                                  </span>
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

                      {/* Mobile card list */}
                      <div className="md:hidden space-y-3">
                        {messages.map((m) => (
                          <Card
                            key={m.id}
                            onClick={() => m.message && setViewMessage(m)}
                            className={`glass-subtle border-0 ${m.message ? "cursor-pointer active:opacity-80" : ""}`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium break-all">
                                  {recipientOf(m)}
                                </span>
                                <Badge variant={statusVariant(m.status)} className="text-xs flex-shrink-0">
                                  {m.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-text-subtle line-clamp-2 break-words">
                                {m.message || "—"}
                              </p>
                              <span className="block text-[11px] text-text-subtle truncate">
                                {m.sender_name || "—"} · {formatDate(m.sent_at || m.created_at)}
                              </span>
                            </CardContent>
                          </Card>
                        ))}
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

      {/* View & copy message */}
      <Dialog open={!!viewMessage} onOpenChange={(open) => !open && setViewMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Message</DialogTitle>
            <DialogDescription>
              To {viewMessage ? recipientOf(viewMessage) : ""}
              {viewMessage?.sender_name ? ` · from ${viewMessage.sender_name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-sm">
            {viewMessage?.message}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => viewMessage?.message && handleCopy(viewMessage.message)}
              className="text-xs"
            >
              {copied ? (
                <Check className="w-3 h-3 mr-2" />
              ) : (
                <Copy className="w-3 h-3 mr-2" />
              )}
              {copied ? "Copied" : "Copy message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sent;

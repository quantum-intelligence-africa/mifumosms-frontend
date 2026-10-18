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
import { ListPager, usePageSize } from "@/components/ui/ListPager";
import { useLanguage } from "@/hooks/useLanguage";
import { Search, RefreshCw, CheckCircle2, MessageSquare, Copy, Check } from "lucide-react";

const Sent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("sent");
  const [viewMessage, setViewMessage] = useState<SMSMessageItem | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("common.copied"), description: t("sms.common.message_copied_desc") });
    } catch {
      toast({
        title: t("sms.common.copy_failed_title"),
        description: t("sms.common.copy_failed_desc"),
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
        page_size: pageSize,
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
        title: t("sms.sent.load_error_title"),
        description: t("sms.sent.load_error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, toast, t]);

  useEffect(() => {
    loadMessages();
  }, [currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setCurrentPage(1);
    loadMessages();
  };

  const recipientOf = (m: SMSMessageItem) =>
    m.recipient_number || m.contact_phone || m.contact_name || "—";

  // Bulk sends are stored as one row carrying every recipient. Show the first
  // number plus a "+N more" hint so a 240-recipient blast doesn't look like one.
  const extraRecipients = (m: SMSMessageItem) =>
    m.recipient_count && m.recipient_count > 1 ? m.recipient_count - 1 : 0;

  const statusVariant = (status: string) =>
    status === "delivered" ? "default" : "secondary";

  const statusLabel = (status: string) =>
    status === "delivered" ? t("status.delivered") : t("status.sent");

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
                  {t("sms.sent.title")}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  {t("sms.sent.subtitle")}
                </p>
              </div>

              {/* Toolbar */}
              <Card className="glass border-0 mb-4 sm:mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
                      <Input
                        placeholder={t("sms.common.search_placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="glass-subtle border-0 text-sm pl-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSearch} disabled={isLoading} className="text-xs">
                        <Search className="w-3 h-3 mr-2" />
                        {t("sms.common.search")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => loadMessages()}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        {t("sms.common.refresh")}
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
                    {t("sms.sent.list_title")}
                    <Badge variant="secondary" className="text-xs ml-1">
                      {total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      <p className="text-xs text-text-subtle">{t("sms.sent.loading")}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="w-12 h-12 mx-auto text-text-subtle mb-3" />
                      <p className="text-sm text-text-subtle">{t("sms.sent.empty")}</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop / tablet table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">{t("sms.common.col_recipient")}</TableHead>
                              <TableHead className="text-xs">{t("sms.common.col_message")}</TableHead>
                              <TableHead className="text-xs">{t("sms.common.col_sender")}</TableHead>
                              <TableHead className="text-xs">{t("status")}</TableHead>
                              <TableHead className="text-xs">{t("sms.sent.col_sent_at")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {messages.map((m) => (
                              <TableRow
                                key={m.id}
                                onClick={() => m.message && setViewMessage(m)}
                                title={m.message ? t("sms.common.row_click_hint") : undefined}
                                className={m.message ? "cursor-pointer" : undefined}
                              >
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  {recipientOf(m)}
                                  {extraRecipients(m) > 0 && (
                                    <span className="ml-1.5 text-[11px] font-normal text-text-subtle">
                                      {t("sms.common.more_recipients", { count: extraRecipients(m) })}
                                    </span>
                                  )}
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
                                    {statusLabel(m.status)}
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
                      <div className="md:hidden divide-y divide-border/60 rounded-lg border border-border/60 bg-background/40">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => m.message && setViewMessage(m)}
                            className={`space-y-1.5 p-3 ${m.message ? "cursor-pointer active:bg-muted/50" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[15px] font-semibold tabular-nums break-all">
                                {recipientOf(m)}
                                {extraRecipients(m) > 0 && (
                                  <span className="ml-1.5 text-[11px] font-normal text-text-subtle">
                                    {t("sms.common.more_recipients", { count: extraRecipients(m) })}
                                  </span>
                                )}
                              </span>
                              <Badge variant={statusVariant(m.status)} className="flex-shrink-0 px-2 py-0.5 text-[11px]">
                                {statusLabel(m.status)}
                              </Badge>
                            </div>
                            <p className="line-clamp-3 break-words text-[13px] leading-snug text-foreground/80">
                              {m.message || "—"}
                            </p>
                            <div className="flex items-center justify-between gap-2 text-[11px] text-text-subtle">
                              <span className="truncate font-medium">{m.sender_name || "—"}</span>
                              <span className="flex-shrink-0">{formatDate(m.sent_at || m.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <ListPager
                        page={currentPage}
                        pageSize={pageSize}
                        total={total}
                        isLoading={isLoading}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                      />
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
            <DialogTitle>{t("sms.common.message_dialog_title")}</DialogTitle>
            <DialogDescription>
              {t("sms.common.to_prefix")} {viewMessage ? recipientOf(viewMessage) : ""}
              {viewMessage?.sender_name ? ` · ${t("sms.common.from_label")} ${viewMessage.sender_name}` : ""}
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
              {copied ? t("common.copied") : t("sms.common.copy_message")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sent;

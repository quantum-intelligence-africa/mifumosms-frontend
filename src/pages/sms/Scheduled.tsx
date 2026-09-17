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
import { MessagesSubNav } from "@/components/layout/MessagesSubNav";
import { useLanguage } from "@/hooks/useLanguage";
import { Search, RefreshCw, Clock, CalendarClock, X } from "lucide-react";

const PAGE_SIZE = 20;

const Scheduled = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSMSMessages({
        status: "scheduled",
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
      logger.warn("Failed to load scheduled messages");
      toast({
        title: t("sms.scheduled.load_error_title"),
        description: t("sms.scheduled.load_error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, toast, t]);

  useEffect(() => {
    loadMessages();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setCurrentPage(1);
    loadMessages();
  };

  const recipientOf = (m: SMSMessageItem) =>
    m.recipient_number || m.contact_phone || m.contact_name || "—";

  const handleCancel = async (m: SMSMessageItem) => {
    setCancellingId(m.id);
    try {
      const response = await apiClient.cancelScheduledSMS(m.id);
      if (response.success) {
        toast({
          title: t("sms.scheduled.cancel_success_title"),
          description: t("sms.scheduled.cancel_success_desc", { recipient: recipientOf(m) }),
        });
        loadMessages();
      } else {
        toast({
          title: t("sms.scheduled.cancel_error_title"),
          description: response.error || t("sms.scheduled.cancel_error_fallback_desc"),
          variant: "destructive",
        });
        loadMessages();
      }
    } catch (error) {
      logger.warn("Cancel scheduled failed");
      toast({
        title: t("sms.scheduled.cancel_error_title"),
        description: t("common.try_again_desc"),
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

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

  // Human hint for how far away the send is (e.g. "in 3h", "due now").
  const relativeWhen = (dateString: string | null) => {
    if (!dateString) return "";
    const diffMs = new Date(dateString).getTime() - Date.now();
    if (Number.isNaN(diffMs)) return "";
    if (diffMs <= 0) return t("sms.scheduled.due_now");
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return t("sms.scheduled.in_minutes", { mins });
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return t("sms.scheduled.in_hours", { hrs });
    const days = Math.round(hrs / 24);
    return t("sms.scheduled.in_days", { days });
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
                  {t("status.scheduled")}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  {t("sms.scheduled.subtitle")}
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
                    <CalendarClock className="w-4 h-4 text-primary" />
                    {t("sms.scheduled.list_title")}
                    <Badge variant="secondary" className="text-xs ml-1">
                      {total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      <p className="text-xs text-text-subtle">{t("sms.scheduled.loading")}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <CalendarClock className="w-12 h-12 mx-auto text-text-subtle mb-3" />
                      <p className="text-sm text-text-subtle">
                        {t("sms.scheduled.empty")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">{t("sms.common.col_recipient")}</TableHead>
                              <TableHead className="text-xs">{t("sms.common.col_message")}</TableHead>
                              <TableHead className="text-xs">{t("sms.common.col_sender")}</TableHead>
                              <TableHead className="text-xs">{t("status")}</TableHead>
                              <TableHead className="text-xs">{t("sms.scheduled.col_scheduled_for")}</TableHead>
                              <TableHead className="text-xs text-right">{t("sms.common.col_actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {messages.map((m) => (
                              <TableRow key={m.id}>
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  {recipientOf(m)}
                                </TableCell>
                                <TableCell className="text-xs max-w-[260px] truncate" title={m.message || ""}>
                                  {m.message || "—"}
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {m.sender_name || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                                    <Clock className="w-3 h-3" />
                                    {t("status.scheduled")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {formatDate(m.scheduled_at)}
                                  <span className="ml-1 text-text-subtle">
                                    {relativeWhen(m.scheduled_at) && `(${relativeWhen(m.scheduled_at)})`}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(m)}
                                    disabled={cancellingId === m.id}
                                    className="text-xs h-7"
                                  >
                                    <X
                                      className={`w-3 h-3 mr-1.5 ${cancellingId === m.id ? "animate-pulse" : ""}`}
                                    />
                                    {cancellingId === m.id ? t("sms.scheduled.cancelling") : t("cancel")}
                                  </Button>
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
                            {t("sms.common.previous")}
                          </Button>
                          <span className="text-xs text-text-subtle">
                            {t("sms.common.page_of", { current: currentPage, total: totalPages })}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || isLoading}
                            className="text-xs"
                          >
                            {t("sms.common.next")}
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

export default Scheduled;

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";

interface SenderId {
  id: string;
  sender_id: string;
  sample_content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SenderIdsProps {
  senderIds?: SenderId[] | null;
}

export function SenderIds({ senderIds }: SenderIdsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const handleManageSenderIds = () => {
    navigate('/sms/sender-names');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-warning" />;
      default:
        return <Hash className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile card layout for each sender ID
  const MobileSenderCard = ({ senderId, index }: { senderId: SenderId; index: number }) => (
    <div
      key={senderId.id || `sender-${index}`}
      className="p-3 rounded-xl glass-subtle border border-border-subtle hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Hash className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium text-sm text-foreground">{senderId.sender_id}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-2 ${getStatusColor(senderId.status)}`}
        >
          <div className="flex items-center gap-1">
            {getStatusIcon(senderId.status)}
            <span className="capitalize">
              {senderId.status.toLowerCase() === 'active'
                ? t("status.active")
                : senderId.status.toLowerCase() === 'pending'
                  ? t("status.pending")
                  : senderId.status}
            </span>
          </div>
        </Badge>
      </div>
      <p className="text-xs text-text-subtle line-clamp-2 mb-2">{senderId.sample_content}</p>
      <p className="text-[10px] text-muted-foreground">{formatDate(senderId.created_at)}</p>
    </div>
  );

  return (
    <Card className="p-4 sm:p-5 lg:p-6 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="font-heading text-sm sm:text-base lg:text-lg font-semibold text-foreground">
          {t("dashboard.sender_ids.title")}
        </h3>
        <Badge variant="outline" className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5">
          {senderIds?.length || 0} {t("dashboard.sender_ids.active")}
        </Badge>
      </div>

      {senderIds && senderIds.length > 0 ? (
        <>
          {/* Mobile: Card-based layout */}
          {isMobile ? (
            <div className="space-y-2">
              {senderIds.slice(0, 3).map((senderId, index) => (
                <MobileSenderCard key={senderId.id || `sender-${index}`} senderId={senderId} index={index} />
              ))}
            </div>
          ) : (
            /* Desktop: Table layout */
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.sender_id")}</TableHead>
                    <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.status")}</TableHead>
                    <TableHead className="text-xs font-medium text-text-subtle py-2 hidden md:table-cell">{t("dashboard.sender_ids.table.sample_content")}</TableHead>
                    <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senderIds.slice(0, 3).map((senderId, index) => (
                    <TableRow key={senderId.id || `sender-${index}`} className="hover:bg-accent/50 transition-smooth">
                      <TableCell className="font-medium text-foreground py-2">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs">{senderId.sender_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getStatusColor(senderId.status)}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(senderId.status)}
                            <span className="capitalize text-xs">
                              {senderId.status.toLowerCase() === 'active'
                                ? t("status.active")
                                : senderId.status.toLowerCase() === 'pending'
                                  ? t("status.pending")
                                  : senderId.status}
                            </span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-text-subtle max-w-xs truncate py-2 hidden md:table-cell">
                        {senderId.sample_content}
                      </TableCell>
                      <TableCell className="text-xs text-text-subtle py-2">
                        {formatDate(senderId.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 sm:py-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Hash className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/50" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-1">{t("dashboard.sender_ids.empty_title")}</h4>
          <p className="text-xs text-text-subtle mb-4">{t("dashboard.sender_ids.empty_subtitle")}</p>
          <Button
            variant="default"
            size="sm"
            onClick={handleManageSenderIds}
            className="text-xs"
          >
            Request Sender ID
          </Button>
        </div>
      )}

      <div className="mt-3 sm:mt-4 pt-3 border-t border-border-subtle">
        <button
          onClick={handleManageSenderIds}
          className="w-full flex items-center justify-center gap-1 text-xs text-primary hover:text-primary-dark transition-smooth"
        >
          {t("dashboard.sender_ids.manage")}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
}

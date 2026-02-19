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
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'rejected':
      case 'suspended':
        return <CheckCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'bg-green-500/15 text-green-700 border border-green-500/30 shadow-sm';
      case 'pending':
        return 'bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-sm';
      case 'rejected':
      case 'suspended':
        return 'bg-red-500/15 text-red-700 border border-red-500/30 shadow-sm';
      default:
        return 'bg-muted/15 text-muted-foreground border border-border/50';
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
      className="p-3 rounded-xl glass-subtle border border-border-subtle/50 hover:border-primary/40 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-xs text-foreground block truncate">{senderId.sender_id}</span>
          <p className="text-[11px] text-text-subtle mt-1 line-clamp-1">{senderId.sample_content}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-2 py-0.5 ml-2 flex-shrink-0 ${getStatusColor(senderId.status)}`}
        >
          <div className="flex items-center gap-1">
            {getStatusIcon(senderId.status)}
            <span className="capitalize font-medium text-[10px]">
              {senderId.status.toLowerCase() === 'approved'
                ? 'Approved'
                : senderId.status.toLowerCase() === 'active'
                  ? 'Active'
                  : senderId.status.toLowerCase() === 'pending'
                    ? t("status.pending")
                    : senderId.status}
            </span>
          </div>
        </Badge>
      </div>
      <p className="text-[9px] text-muted-foreground">{formatDate(senderId.created_at)}</p>
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
                    <TableRow key={senderId.id || `sender-${index}`} className="hover:bg-accent/30 transition-smooth">
                      <TableCell className="font-semibold text-foreground py-3">
                        <span className="text-sm">{senderId.sender_id}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2.5 py-1 ${getStatusColor(senderId.status)}`}
                        >
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(senderId.status)}
                            <span className="capitalize font-medium">
                              {senderId.status.toLowerCase() === 'approved'
                                ? 'Approved'
                                : senderId.status.toLowerCase() === 'active'
                                  ? 'Active'
                                  : senderId.status.toLowerCase() === 'pending'
                                    ? t("status.pending")
                                    : senderId.status}
                            </span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-text-subtle max-w-xs truncate py-3 hidden md:table-cell">
                        {senderId.sample_content}
                      </TableCell>
                      <TableCell className="text-xs text-text-subtle py-3">
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

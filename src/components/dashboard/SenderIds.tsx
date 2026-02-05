import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const handleManageSenderIds = () => {
    navigate('/sms/sender-names');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-5 sm:p-6 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
          {t("dashboard.sender_ids.title")}
        </h3>
        <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5">
          {senderIds?.length || 0} {t("dashboard.sender_ids.active")}
        </Badge>
      </div>

      {senderIds && senderIds.length > 0 ? (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.sender_id")}</TableHead>
                <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.status")}</TableHead>
                <TableHead className="text-xs font-medium text-text-subtle py-2">{t("dashboard.sender_ids.table.sample_content")}</TableHead>
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
                      className={`text-xs ${getStatusColor(senderId.status)}`}
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
                  <TableCell className="text-xs text-text-subtle max-w-xs truncate py-2">
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
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs text-text-subtle mb-1">{t("dashboard.sender_ids.empty_title")}</p>
          <p className="text-xs text-text-subtle">{t("dashboard.sender_ids.empty_subtitle")}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border-subtle">
        <button
          onClick={handleManageSenderIds}
          className="w-full text-xs text-primary hover:text-primary-dark transition-smooth"
        >
          {t("dashboard.sender_ids.manage")}
        </button>
      </div>
    </Card>
  );
}

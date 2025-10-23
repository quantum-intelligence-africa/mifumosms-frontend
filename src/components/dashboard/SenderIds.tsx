import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, CheckCircle, Clock } from "lucide-react";

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
    <Card className="p-6 glass border-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Active Sender IDs
        </h3>
        <Badge variant="outline" className="text-xs">
          {senderIds?.length || 0} Active
        </Badge>
      </div>

      {senderIds && senderIds.length > 0 ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium text-text-subtle">Sender ID</TableHead>
                <TableHead className="text-xs font-medium text-text-subtle">Status</TableHead>
                <TableHead className="text-xs font-medium text-text-subtle">Sample Content</TableHead>
                <TableHead className="text-xs font-medium text-text-subtle">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senderIds.map((senderId) => (
                <TableRow key={senderId.id} className="hover:bg-accent/50 transition-smooth">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      {senderId.sender_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(senderId.status)}`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(senderId.status)}
                        <span className="capitalize">{senderId.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-subtle max-w-xs truncate">
                    {senderId.sample_content}
                  </TableCell>
                  <TableCell className="text-sm text-text-subtle">
                    {formatDate(senderId.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-text-subtle mb-2">No sender IDs found</p>
          <p className="text-xs text-text-subtle">Sender IDs will appear here once they are approved</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border-subtle">
        <button className="w-full text-sm text-primary hover:text-primary-dark transition-smooth">
          Manage sender IDs
        </button>
      </div>
    </Card>
  );
}

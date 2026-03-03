import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Users,
  Send,
  CheckCircle,
  Eye,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  MessageSquare,
  Settings,
  Repeat,
  User,
  Mail,
  Phone,
  Tag,
  Globe,
  Activity,
  TrendingUp,
  DollarSign,
  Hash,
  FileText,
  Zap
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  campaign_type_display: string;
  message_text: string;
  template: string | null;
  status: string;
  status_display: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  estimated_cost: number;
  actual_cost: number;
  progress_percentage: number;
  delivery_rate: number;
  read_rate: number;
  is_active: boolean;
  can_edit: boolean;
  can_start: boolean;
  can_pause: boolean;
  can_cancel: boolean;
  can_view_analytics: boolean;
  can_duplicate: boolean;
  can_delete: boolean;
  is_recurring: boolean;
  recurring_schedule: any;
  settings: any;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  target_contact_count: number;
  target_contact_ids: string[];
  target_segment_ids: string[];
  target_segment_names: string[];
  target_criteria: any;
}

interface CampaignDetailsModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, campaignId: string) => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onAction
}) => {
  if (!campaign) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-3 h-3" />;
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'running': return <Activity className="w-3 h-3" />;
      case 'paused': return <AlertCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xs sm:text-sm flex items-center gap-1">
            <MessageSquare className="w-3 h-3 sm:w-3 sm:h-3" />
            Campaign Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 sm:space-y-2">
          {/* Header Section */}
          <Card>
            <CardHeader className="pb-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    {campaign.name}
                  </h2>
                  {campaign.description && (
                    <p className="text-[9px] text-text-subtle mt-0.5 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  <Badge className={`${getStatusColor(campaign.status)} text-[8px] px-1 py-0.5`}>
                    {getStatusIcon(campaign.status)}
                    <span className="ml-0.5">{campaign.status_display}</span>
                  </Badge>
                  <Badge variant="outline" className="text-[8px] px-1 py-0.5">
                    {campaign.campaign_type_display}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-1.5">
            <Card>
              <CardContent className="p-1.5 text-center">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Recipients</p>
                <p className="text-[9px] sm:text-xs font-semibold">{formatNumber(campaign.total_recipients)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-1.5 text-center">
                <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Sent</p>
                <p className="text-[9px] sm:text-xs font-semibold">{formatNumber(campaign.sent_count)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-1.5 text-center">
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Delivered</p>
                <p className="text-[9px] sm:text-xs font-semibold">{formatNumber(campaign.delivered_count)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-1.5 text-center">
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Read</p>
                <p className="text-[9px] sm:text-xs font-semibold">{formatNumber(campaign.read_count)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-1.5 text-center">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Rate</p>
                <p className="text-[9px] sm:text-xs font-semibold">{campaign.delivery_rate.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-1.5 text-center">
                <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500 mx-auto mb-0.5" />
                <p className="text-[8px] text-text-subtle">Cost</p>
                <p className="text-[9px] sm:text-xs font-semibold">{formatCurrency(campaign.actual_cost)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          {campaign.status === 'running' && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-[9px] sm:text-xs flex items-center gap-1">
                  <BarChart3 className="w-2.5 h-2.5" />
                  Campaign Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="space-y-1">
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span>Progress</span>
                      <span>{campaign.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={campaign.progress_percentage} className="h-1" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px]">
                    <div>
                      <p className="text-text-subtle">Sent</p>
                      <p className="font-semibold">{formatNumber(campaign.sent_count)}</p>
                    </div>
                    <div>
                      <p className="text-text-subtle">Delivered</p>
                      <p className="font-semibold">{formatNumber(campaign.delivered_count)}</p>
                    </div>
                    <div>
                      <p className="text-text-subtle">Read</p>
                      <p className="font-semibold">{formatNumber(campaign.read_count)}</p>
                    </div>
                    <div>
                      <p className="text-text-subtle">Failed</p>
                      <p className="font-semibold">{formatNumber(campaign.failed_count)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Content */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[9px] sm:text-xs flex items-center gap-1">
                <MessageSquare className="w-2.5 h-2.5" />
                Message Content
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 sm:p-2">
                <p className="text-[9px] sm:text-xs whitespace-pre-wrap break-words">
                  {campaign.message_text}
                </p>
                <div className="mt-0.5 text-[8px] text-text-subtle">
                  <span className="flex items-center gap-0.5">
                    <Hash className="w-1.5 h-1.5" />
                    {campaign.message_text.length} chars
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-1.5">
            {/* Timing Information */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-[9px] sm:text-xs flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Timing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-text-subtle">Created</span>
                  <span className="text-[8px] font-medium">{formatDate(campaign.created_at)}</span>
                </div>
                {campaign.scheduled_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-text-subtle">Scheduled</span>
                    <span className="text-[8px] font-medium">{formatDate(campaign.scheduled_at)}</span>
                  </div>
                )}
                {campaign.started_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-text-subtle">Started</span>
                    <span className="text-[8px] font-medium">{formatDate(campaign.started_at)}</span>
                  </div>
                )}
                {campaign.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-text-subtle">Completed</span>
                    <span className="text-[8px] font-medium">{formatDate(campaign.completed_at)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-text-subtle">Updated</span>
                  <span className="text-[8px] font-medium">{formatDate(campaign.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-[9px] sm:text-xs flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-text-subtle">Total Recipients</span>
                  <span className="text-[8px] font-medium">{formatNumber(campaign.total_recipients)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-text-subtle">Contact IDs</span>
                  <span className="text-[8px] font-medium">{campaign.target_contact_ids?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-text-subtle">Segment IDs</span>
                  <span className="text-[8px] font-medium">{campaign.target_segment_ids?.length || 0}</span>
                </div>
                {campaign.target_criteria?.tags && campaign.target_criteria.tags.length > 0 && (
                  <div>
                    <span className="text-[8px] text-text-subtle block mb-0.5">Target Tags</span>
                    <div className="flex flex-wrap gap-0.5">
                      {campaign.target_criteria.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-[7px] px-1 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[9px] sm:text-xs flex items-center gap-1">
                <Settings className="w-2.5 h-2.5" />
                Campaign Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5">
                <div>
                  <span className="text-[8px] text-text-subtle block">Send Time</span>
                  <span className="text-[8px] font-medium">{campaign.settings?.send_time || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-subtle block">Timezone</span>
                  <span className="text-[8px] font-medium">{campaign.settings?.timezone || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-subtle block">Recurring</span>
                  <span className="text-[8px] font-medium">{campaign.is_recurring ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-subtle block">Created By</span>
                  <span className="text-[8px] font-medium">{campaign.created_by_name || campaign.created_by}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-subtle block">Template</span>
                  <span className="text-[8px] font-medium">{campaign.template || 'None'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-subtle block">Opt-in Status</span>
                  <span className="text-[8px] font-medium">{campaign.target_criteria?.opt_in_status || 'Not set'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-[9px] h-6 sm:h-7"
            >
              Close
            </Button>
            {campaign.can_duplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('duplicate', campaign.id)}
                className="text-[9px] h-6 sm:h-7"
              >
                <Repeat className="w-2.5 h-2.5 mr-0.5" />
                Duplicate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailsModal;

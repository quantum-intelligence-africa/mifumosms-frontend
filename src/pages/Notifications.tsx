import { useMemo, useState, useEffect } from 'react';
import { Activity, MessageSquare, Send, Users, CheckCircle, Download, Upload, MoreVertical, Trash2, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useDashboard } from '@/hooks/useDashboard';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  time_ago: string;
  is_live: boolean;
  metadata?: Record<string, unknown>;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "message_sent":
    case "reply":
    case "message":
      return MessageSquare;
    case "campaign_completed":
    case "campaign_completion":
    case "campaign":
      return Send;
    case "contact_added":
    case "contacts_added":
    case "contact":
      return Users;
    case "template_approval":
    case "template":
      return CheckCircle;
    default:
      return Activity;
  }
};

const getStatusBadgeColor = (type: string) => {
  if (type.includes('sent') || type.includes('completed') || type.includes('delivered')) {
    return 'bg-green-100 text-green-700';
  } else if (type.includes('failed') || type.includes('error')) {
    return 'bg-red-100 text-red-700';
  } else if (type.includes('pending')) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-blue-100 text-blue-700';
};

const NotificationsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { recentActivity, isLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Update activities when recentActivity changes
  useMemo(() => {
    if (!recentActivity) return;
    const sorted = [...recentActivity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(sorted as ActivityItem[]);
  }, [recentActivity]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, searchTerm]);

  const paginatedActivities = useMemo(() => {
    return filteredActivities.slice(0, entriesPerPage);
  }, [filteredActivities, entriesPerPage]);

  // Handle View action
  const handleViewActivity = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setShowViewModal(true);
  };

  // Handle Delete action
  const handleDeleteActivity = (activityId: string) => {
    setActivities(prevActivities => prevActivities.filter(activity => activity.id !== activityId));
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
            {/* Header Section */}
            <div>
              <h1 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">Notifications</h1>
            </div>

            {/* Report Card */}
            <Card className="glass border border-border-subtle">
              {/* Header with Controls */}
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-subtle whitespace-nowrap">Show entries</span>
                      <select
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                        className="h-8 px-2 rounded border border-border-subtle bg-background text-foreground text-sm"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:inline-flex">
                      <Upload className="w-3 h-3" />
                      <span className="hidden md:inline">Import</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:inline-flex">
                      <Download className="w-3 h-3" />
                      <span className="hidden md:inline">Export</span>
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <Input
                        placeholder="Search here..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 text-sm pl-3 pr-8 w-full sm:w-48"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none">
                        Filter
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none">
                            Action
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Table Content */}
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-accent/30">
                        <th className="hidden sm:table-cell px-4 py-3 text-left font-semibold text-foreground w-8">
                          <input type="checkbox" className="rounded border-border-subtle" />
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-foreground">Time</th>
                        <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Title</th>
                        <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold text-foreground">Description</th>
                        <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold text-foreground">Type</th>
                        <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-3 sm:px-4 py-3 text-center font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedActivities.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-text-subtle">
                            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                            <p className="text-sm">New notifications will appear here.</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedActivities.map((activity) => {
                          const Icon = getActivityIcon(activity.type);
                          const date = new Date(activity.timestamp);
                          const formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
                          const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                          return (
                            <tr key={activity.id} className="border-b border-border-subtle hover:bg-accent/50 transition-colors">
                              <td className="hidden sm:table-cell px-4 py-3">
                                <input type="checkbox" className="rounded border-border-subtle" />
                              </td>
                              <td className="hidden md:table-cell px-4 py-3 text-foreground text-xs whitespace-nowrap">
                                {formattedDate}, {formattedTime}
                              </td>
                              <td className="px-3 sm:px-4 py-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span className="font-medium text-foreground text-[9px] sm:text-xs truncate">{activity.title}</span>
                                </div>
                              </td>
                              <td className="hidden lg:table-cell px-4 py-3 text-text-subtle max-w-xs truncate">
                                {activity.description}
                              </td>
                              <td className="hidden lg:table-cell px-4 py-3">
                                <Badge variant="outline" className="text-[11px]">
                                  {activity.type.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-3 sm:px-4 py-3">
                                <Badge className={`text-[11px] ${getStatusBadgeColor(activity.type)}`}>
                                  {activity.is_live ? 'LIVE' : 'COMPLETED'}
                                </Badge>
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewActivity(activity)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteActivity(activity.id)} className="text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Footer Info */}
            {filteredActivities.length > 0 && (
              <div className="text-xs text-text-subtle text-center">
                Showing {paginatedActivities.length} of {filteredActivities.length} notifications
              </div>
            )}

            {/* View Activity Modal */}
            {showViewModal && selectedActivity && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md glass border border-border-subtle">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle>Activity Details</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowViewModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-subtle mb-1">Title</p>
                      <p className="text-sm font-semibold text-foreground">{selectedActivity.title}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-subtle mb-1">Description</p>
                      <p className="text-sm text-foreground">{selectedActivity.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-text-subtle mb-1">Type</p>
                        <Badge variant="outline" className="text-[11px]">
                          {selectedActivity.type.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-text-subtle mb-1">Status</p>
                        <Badge className={`text-[11px] ${getStatusBadgeColor(selectedActivity.type)}`}>
                          {selectedActivity.is_live ? 'LIVE' : 'COMPLETED'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-subtle mb-1">Time</p>
                      <p className="text-sm text-foreground">
                        {new Date(selectedActivity.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowViewModal(false)}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleDeleteActivity(selectedActivity.id);
                          setShowViewModal(false);
                        }}
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;

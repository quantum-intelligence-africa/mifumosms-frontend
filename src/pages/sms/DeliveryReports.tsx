import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Search, Filter, Download, RefreshCw, Calendar, MessageSquare, Users, Clock } from "lucide-react";

interface DeliveryReport {
  message_id: string;
  status: string;
  created_at: string;
  recipient_count: number;
  content_preview: string;
  sender_id: string;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

const DeliveryReports = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<DeliveryReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDeliveryReports({
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        status: filters.status || undefined,
        page: currentPage,
        per_page: 20,
      });

      if (response.success && response.data) {
        setReports(response.data.reports);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load delivery reports:", error);
      toast({
        title: "Failed to load reports",
        description: "Could not fetch delivery reports.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    loadReports();
  };

  const handleReset = () => {
    setFilters({
      start_date: "",
      end_date: "",
      status: "",
      search: "",
    });
    setCurrentPage(1);
    setTimeout(() => loadReports(), 100);
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default";
      case "sent":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredReports = filters.search
    ? reports.filter(
        (report) =>
          report.message_id.toLowerCase().includes(filters.search.toLowerCase()) ||
          report.content_preview.toLowerCase().includes(filters.search.toLowerCase()) ||
          report.sender_id.toLowerCase().includes(filters.search.toLowerCase())
      )
    : reports;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
                <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  Delivery Reports
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                  Track and monitor SMS delivery status
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-text-subtle">Total Reports</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                          {pagination?.total || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-text-subtle">This Page</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                          {reports.length}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-text-subtle">Page</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                          {pagination?.page || 1} / {pagination?.pages || 1}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="glass border-0 mb-4 sm:mb-6">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-subtle" />
                        <Input
                          placeholder="Search by ID or content..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange("search", e.target.value)}
                          className="glass-subtle border-0 text-sm pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Status</Label>
                      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                        <SelectTrigger className="glass-subtle border-0 text-sm">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-subtle" />
                        <Input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) => handleFilterChange("start_date", e.target.value)}
                          className="glass-subtle border-0 text-sm pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-subtle" />
                        <Input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) => handleFilterChange("end_date", e.target.value)}
                          className="glass-subtle border-0 text-sm pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button onClick={handleSearch} disabled={isLoading} className="text-xs">
                      <Search className="w-3 h-3 mr-2" />
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Table */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>Reports</span>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="w-3 h-3 mr-2" />
                      Export
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-xs text-text-subtle">Loading reports...</p>
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-text-subtle mb-3" />
                      <p className="text-sm text-text-subtle">No reports found</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Message ID</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Sender</TableHead>
                              <TableHead className="text-xs">Content</TableHead>
                              <TableHead className="text-xs">Recipients</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReports.map((report) => (
                              <TableRow key={report.message_id}>
                                <TableCell className="text-xs font-mono">
                                  {report.message_id.substring(0, 20)}...
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusVariant(report.status)} className="text-xs">
                                    {report.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">{report.sender_id}</TableCell>
                                <TableCell className="text-xs max-w-xs truncate">
                                  {report.content_preview}
                                </TableCell>
                                <TableCell className="text-xs">{report.recipient_count}</TableCell>
                                <TableCell className="text-xs">{formatDate(report.created_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="text-xs"
                          >
                            Previous
                          </Button>
                          <span className="text-xs text-text-subtle">
                            Page {currentPage} of {pagination.pages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                            disabled={currentPage === pagination.pages || isLoading}
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

export default DeliveryReports;


import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Filter,
  Users,
  MessageSquare,
  Send,
  Target,
  Eye,
  MousePointer,
  DollarSign,
  Globe,
  ArrowLeft,
  ChevronRight,
  Activity,
  Zap,
  TrendingUp as RevenueIcon
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const Analytics = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedChannel, setSelectedChannel] = useState("all");

  const analyticsCategories: AnalyticsCategory[] = [
    {
      id: "overview",
      title: "Overview",
      description: "Key metrics and performance insights",
      icon: Activity,
      color: "bg-blue-500"
    },
    {
      id: "campaigns",
      title: "Campaigns",
      description: "Campaign performance and analytics",
      icon: Send,
      color: "bg-green-500"
    },
    {
      id: "audience",
      title: "Audience",
      description: "Audience insights and engagement",
      icon: Users,
      color: "bg-purple-500"
    },
    {
      id: "revenue",
      title: "Revenue",
      description: "Revenue attribution and ROI analysis",
      icon: RevenueIcon,
      color: "bg-emerald-500"
    }
  ];

  // Mock data for charts
  const messageVolumeData = {
    labels: ['Mar 1', 'Mar 5', 'Mar 10', 'Mar 15', 'Mar 20', 'Mar 25', 'Mar 30'],
    datasets: [
      {
        label: 'WhatsApp',
        data: [1200, 1900, 3000, 5000, 4500, 6000, 7200],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'SMS',
        data: [800, 1200, 1800, 2200, 2800, 3200, 3600],
        borderColor: 'hsl(var(--secondary))',
        backgroundColor: 'hsl(var(--secondary) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const deliveryRateData = {
    labels: ['Mar 1', 'Mar 5', 'Mar 10', 'Mar 15', 'Mar 20', 'Mar 25', 'Mar 30'],
    datasets: [
      {
        label: 'Delivery Rate (%)',
        data: [94, 96, 95, 97, 96, 98, 97],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const channelDistributionData = {
    labels: ['WhatsApp', 'SMS', 'Email'],
    datasets: [
      {
        data: [65, 30, 5],
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--accent))',
        ],
        borderWidth: 0,
      },
    ],
  };

  const campaignPerformanceData = {
    labels: ['Welcome Series', 'Product Launch', 'Customer Survey', 'Flash Sale', 'Security Notice'],
    datasets: [
      {
        label: 'Open Rate (%)',
        data: [85, 72, 68, 91, 76],
        backgroundColor: 'hsl(var(--primary))',
      },
      {
        label: 'Click Rate (%)',
        data: [24, 18, 15, 35, 12],
        backgroundColor: 'hsl(var(--secondary))',
      },
    ],
  };

  const countryData = [
    { country: "Kenya", messages: 12500, percentage: 35, flag: "🇰🇪" },
    { country: "Nigeria", messages: 8900, percentage: 25, flag: "🇳🇬" },
    { country: "Egypt", messages: 6200, percentage: 17, flag: "🇪🇬" },
    { country: "South Africa", messages: 4800, percentage: 13, flag: "🇿🇦" },
    { country: "Ghana", messages: 3600, percentage: 10, flag: "🇬🇭" },
  ];

  const topCampaigns = [
    { name: "Welcome Series", sent: 12500, delivered: 12100, opened: 10200, clicked: 2800, revenue: "Tsh 4,200" },
    { name: "Product Launch", sent: 8900, delivered: 8650, opened: 6200, clicked: 1580, revenue: "Tsh 8,900" },
    { name: "Customer Survey", sent: 6200, delivered: 6050, opened: 4100, clicked: 920, revenue: "Tsh 1,200" },
    { name: "Flash Sale", sent: 4800, delivered: 4720, opened: 4350, clicked: 1680, revenue: "Tsh 15,600" },
  ];

  const metrics = [
    {
      title: "Total Messages",
      value: "45,280",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: MessageSquare,
      description: "Last 30 days"
    },
    {
      title: "Delivery Rate",
      value: "96.8%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: Target,
      description: "Average across channels"
    },
    {
      title: "Open Rate",
      value: "78.4%",
      change: "-1.2%",
      changeType: "negative" as const,
      icon: Eye,
      description: "Engagement metric"
    },
    {
      title: "Click Rate",
      value: "24.6%",
      change: "+5.8%",
      changeType: "positive" as const,
      icon: MousePointer,
      description: "Action conversion"
    },
    {
      title: "Active Contacts",
      value: "8,940",
      change: "+8.9%",
      changeType: "positive" as const,
      icon: Users,
      description: "Engaged this month"
    },
    {
      title: "Revenue Impact",
      value: "Tsh 42,800",
      change: "+18.7%",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Attributed revenue"
    }
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          color: 'hsl(var(--foreground))',
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 10
          }
        },
      },
      y: {
        grid: {
          color: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 10
          }
        },
      },
    },
  };

  const renderCategoryContent = () => {
    const category = analyticsCategories.find(cat => cat.id === currentCategory);
    if (!category) return null;

    switch (currentCategory) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.map((metric, index) => (
                <Card key={index} className="glass border-0">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <metric.icon className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-text-subtle mb-1 truncate">{metric.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-bold text-foreground">{metric.value}</h3>
                    </div>
                    <p className="text-xs text-text-subtle mt-1 line-clamp-2">{metric.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Message Volume */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Message Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-48">
                    <Line data={messageVolumeData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Rate */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-success" />
                    Delivery Rate Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-48">
                    <Line data={deliveryRateData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Channel Distribution */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChart className="w-4 h-4 text-secondary" />
                    Channel Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-48">
                    <Doughnut
                      data={channelDistributionData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            position: 'bottom' as const,
                            labels: {
                              usePointStyle: true,
                              color: 'hsl(var(--foreground))',
                              font: {
                                size: 10
                              }
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card className="glass border-0">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {countryData.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{country.flag}</span>
                          <div>
                            <p className="font-medium text-foreground text-sm">{country.country}</p>
                            <p className="text-xs text-text-subtle">
                              {country.messages.toLocaleString()} messages
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground text-sm">{country.percentage}%</p>
                          <div className="w-12 h-2 bg-gradient-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "campaigns":
        return (
          <div className="space-y-4">
            {/* Campaign Performance Chart */}
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-primary" />
                  Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-48">
                  <Bar data={campaignPerformanceData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Top Campaigns Table */}
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {topCampaigns.map((campaign, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{campaign.name}</h5>
                        <Badge variant="outline" className="text-xs">{campaign.revenue}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-text-subtle">Sent</p>
                          <p className="font-medium">{campaign.sent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-text-subtle">Delivered</p>
                          <p className="font-medium">{campaign.delivered.toLocaleString()}</p>
                          <p className="text-success">
                            {Math.round((campaign.delivered / campaign.sent) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-text-subtle">Opened</p>
                          <p className="font-medium">{campaign.opened.toLocaleString()}</p>
                          <p className="text-primary">
                            {Math.round((campaign.opened / campaign.delivered) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-text-subtle">Clicked</p>
                          <p className="font-medium">{campaign.clicked.toLocaleString()}</p>
                          <p className="text-amber-600">
                            {Math.round((campaign.clicked / campaign.opened) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "audience":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  Audience Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                      <p className="text-2xl font-bold text-primary">8,940</p>
                      <p className="text-xs text-text-subtle">Active Contacts</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                      <p className="text-2xl font-bold text-success">78.4%</p>
                      <p className="text-xs text-text-subtle">Engagement Rate</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                    <h4 className="font-medium text-sm mb-2">Engagement Patterns</h4>
                    <p className="text-xs text-text-subtle">Peak engagement times: 9-11 AM and 6-8 PM</p>
                    <p className="text-xs text-text-subtle mt-1">Most active day: Tuesday</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-primary" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {countryData.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{country.flag}</span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{country.country}</p>
                          <p className="text-xs text-text-subtle">
                            {country.messages.toLocaleString()} contacts
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground text-sm">{country.percentage}%</p>
                        <div className="w-12 h-2 bg-gradient-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${country.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-4">
            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <RevenueIcon className="w-4 h-4 text-primary" />
                  Revenue Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                      <p className="text-2xl font-bold text-success">Tsh 42,800</p>
                      <p className="text-xs text-text-subtle">Total Revenue</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                      <p className="text-2xl font-bold text-primary">+18.7%</p>
                      <p className="text-xs text-text-subtle">Growth Rate</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                    <h4 className="font-medium text-sm mb-2">Top Revenue Campaigns</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Flash Sale</span>
                        <span className="text-xs font-medium">Tsh 15,600</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Product Launch</span>
                        <span className="text-xs font-medium">Tsh 8,900</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Welcome Series</span>
                        <span className="text-xs font-medium">Tsh 4,200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  ROI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                    <p className="text-2xl font-bold text-success">4.2x</p>
                    <p className="text-xs text-text-subtle">Return on Investment</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                    <h4 className="font-medium text-sm mb-2">Cost Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">SMS Costs</span>
                        <span className="text-xs font-medium">Tsh 8,200</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">WhatsApp Costs</span>
                        <span className="text-xs font-medium">Tsh 2,100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Platform Fees</span>
                        <span className="text-xs font-medium">Tsh 1,500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full p-3 lg:p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-4">
                <div>
                  <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                    Analytics
                  </h1>
                  <p className="text-sm lg:text-base text-text-subtle">
                    Track performance and insights across all channels
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full sm:w-40 glass-subtle border-0 text-sm">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="w-full sm:w-40 glass-subtle border-0 text-sm">
                      <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All channels</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="glass-subtle border-0 text-sm" size="sm">
                    <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>

              {/* Mobile Category Navigation */}
              {isMobile ? (
                <div className="flex-1 overflow-hidden">
                  {!currentCategory ? (
                    <div className="space-y-3 h-full overflow-y-auto pb-6">
                      {analyticsCategories.map((category) => (
                        <Card
                          key={category.id}
                          className="glass border-0 cursor-pointer hover:shadow-lg transition-all duration-200"
                          onClick={() => setCurrentCategory(category.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                <category.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground text-sm">{category.title}</h3>
                                <p className="text-xs text-text-subtle">{category.description}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-text-subtle" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentCategory(null)}
                          className="h-8 w-8"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${analyticsCategories.find(cat => cat.id === currentCategory)?.color} flex items-center justify-center`}>
                            {(() => {
                              const category = analyticsCategories.find(cat => cat.id === currentCategory);
                              const IconComponent = category?.icon;
                              return IconComponent ? <IconComponent className="w-4 h-4 text-white" /> : null;
                            })()}
                          </div>
                          <div>
                            <h2 className="font-medium text-foreground text-sm">
                              {analyticsCategories.find(cat => cat.id === currentCategory)?.title}
                            </h2>
                            <p className="text-xs text-text-subtle">
                              {analyticsCategories.find(cat => cat.id === currentCategory)?.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Category Content */}
                      <div className="flex-1 overflow-y-auto pb-6">
                        {renderCategoryContent()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout - Keep original tabs */
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        {analyticsCategories.map((category) => (
                          <Card
                            key={category.id}
                            className={`glass border-0 cursor-pointer transition-all duration-200 ${
                              currentCategory === category.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                            }`}
                            onClick={() => setCurrentCategory(category.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                                  <category.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground text-sm">{category.title}</h3>
                                  <p className="text-xs text-text-subtle">{category.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                      <div className="h-full overflow-y-auto pb-6">
                        {renderCategoryContent()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

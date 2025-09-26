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
  Globe
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Analytics = () => {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedChannel, setSelectedChannel] = useState("all");

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
    { name: "Welcome Series", sent: 12500, delivered: 12100, opened: 10200, clicked: 2800, revenue: "$4,200" },
    { name: "Product Launch", sent: 8900, delivered: 8650, opened: 6200, clicked: 1580, revenue: "$8,900" },
    { name: "Customer Survey", sent: 6200, delivered: 6050, opened: 4100, clicked: 920, revenue: "$1,200" },
    { name: "Flash Sale", sent: 4800, delivered: 4720, opened: 4350, clicked: 1680, revenue: "$15,600" },
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
      value: "$42,800",
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
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        grid: {
          color: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
    },
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-foreground">
                    Analytics
                  </h1>
                  <p className="text-text-subtle">
                    Track performance and insights across all channels
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40 glass-subtle border-0">
                      <Calendar className="w-4 h-4 mr-2" />
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
                    <SelectTrigger className="w-40 glass-subtle border-0">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All channels</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="glass-subtle border-0">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {metrics.map((metric, index) => (
                  <Card key={index} className="glass border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <metric.icon className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-text-subtle mb-1">{metric.title}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-foreground">{metric.value}</h3>
                        <span className={`text-xs font-medium flex items-center gap-1 ${
                          metric.changeType === "positive" ? "text-success" : "text-destructive"
                        }`}>
                          {metric.changeType === "positive" ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {metric.change}
                        </span>
                      </div>
                      <p className="text-xs text-text-subtle mt-1">{metric.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts and Tables */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="overview" className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Message Volume */}
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Message Volume
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <Line data={messageVolumeData} options={chartOptions} />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Delivery Rate */}
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-success" />
                            Delivery Rate Trend
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <Line data={deliveryRateData} options={chartOptions} />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Channel Distribution */}
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-secondary" />
                            Channel Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
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
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Top Countries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {countryData.map((country, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{country.flag}</span>
                                  <div>
                                    <p className="font-medium text-foreground">{country.country}</p>
                                    <p className="text-sm text-text-subtle">
                                      {country.messages.toLocaleString()} messages
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-foreground">{country.percentage}%</p>
                                  <div className="w-16 h-2 bg-gradient-surface rounded-full overflow-hidden">
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
                  </TabsContent>

                  <TabsContent value="campaigns" className="space-y-6 h-full overflow-y-auto">
                    <div className="grid gap-6">
                      {/* Campaign Performance Chart */}
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" />
                            Campaign Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <Bar data={campaignPerformanceData} options={chartOptions} />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Campaigns Table */}
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle>Top Performing Campaigns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border-subtle">
                                  <th className="text-left py-3 text-sm font-medium text-text-subtle">Campaign</th>
                                  <th className="text-right py-3 text-sm font-medium text-text-subtle">Sent</th>
                                  <th className="text-right py-3 text-sm font-medium text-text-subtle">Delivered</th>
                                  <th className="text-right py-3 text-sm font-medium text-text-subtle">Opened</th>
                                  <th className="text-right py-3 text-sm font-medium text-text-subtle">Clicked</th>
                                  <th className="text-right py-3 text-sm font-medium text-text-subtle">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topCampaigns.map((campaign, index) => (
                                  <tr key={index} className="border-b border-border-subtle">
                                    <td className="py-3">
                                      <p className="font-medium text-foreground">{campaign.name}</p>
                                    </td>
                                    <td className="text-right py-3 text-foreground">
                                      {campaign.sent.toLocaleString()}
                                    </td>
                                    <td className="text-right py-3">
                                      <div className="text-foreground">
                                        {campaign.delivered.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-success">
                                        {Math.round((campaign.delivered / campaign.sent) * 100)}%
                                      </div>
                                    </td>
                                    <td className="text-right py-3">
                                      <div className="text-foreground">
                                        {campaign.opened.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-primary">
                                        {Math.round((campaign.opened / campaign.delivered) * 100)}%
                                      </div>
                                    </td>
                                    <td className="text-right py-3">
                                      <div className="text-foreground">
                                        {campaign.clicked.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-amber-600">
                                        {Math.round((campaign.clicked / campaign.opened) * 100)}%
                                      </div>
                                    </td>
                                    <td className="text-right py-3 font-semibold text-foreground">
                                      {campaign.revenue}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="audience" className="space-y-6 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle>Audience Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-text-subtle">Audience analytics coming soon...</p>
                        </CardContent>
                      </Card>

                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle>Engagement Patterns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-text-subtle">Engagement patterns coming soon...</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="revenue" className="space-y-6 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle>Revenue Attribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-text-subtle">Revenue analytics coming soon...</p>
                        </CardContent>
                      </Card>

                      <Card className="glass border-0">
                        <CardHeader>
                          <CardTitle>ROI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-text-subtle">ROI analysis coming soon...</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
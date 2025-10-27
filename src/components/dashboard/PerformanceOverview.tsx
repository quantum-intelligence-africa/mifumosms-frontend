import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Clock, BarChart, LineChart, PieChart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

interface PerformanceOverviewProps {
  performance?: {
    metrics: {
      total_messages: number;
      delivery_rate: number;
      response_rate: number;
      active_conversations: number;
      campaign_success_rate: number;
    };
    charts: {
      message_volume: {
        labels: string[];
        data: number[];
      };
      delivery_rates: {
        labels: string[];
        data: number[];
      };
    };
    coming_soon: boolean;
  } | null;
}

type ChartType = 'bar' | 'line' | 'pie';

export function PerformanceOverview({ performance }: PerformanceOverviewProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const navigate = useNavigate();

  const handleViewDetailedAnalytics = () => {
    navigate('/analytics');
  };

  // Transform real data from API to chart format
  const currentChartData = performance?.charts?.message_volume ?
    performance.charts.message_volume.labels.map((label, index) => ({
      name: label,
      messages: performance.charts.message_volume.data[index] || 0,
      delivery_rate: performance.charts.delivery_rates?.data[index] || 0,
    })) : [];

  // Create pie chart data, but only show meaningful values (don't show zero slices)
  const currentPieData = performance?.metrics ? [
    { name: 'Messages', value: performance.metrics.total_messages || 0, color: '#8884d8' },
    { name: 'Active Conversations', value: performance.metrics.active_conversations || 0, color: '#82ca9d' },
    { name: 'Delivery Rate', value: performance.metrics.delivery_rate || 0, color: '#ffc658' },
    { name: 'Campaign Success', value: performance.metrics.campaign_success_rate || 0, color: '#ff7300' },
  ].filter(item => item.value > 0) : [];

  // Check if we have data to display
  const hasChartData = currentChartData.length > 0;
  const hasPieData = currentPieData.length > 0;
  const hasData = hasChartData || hasPieData;

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'bar':
        return <BarChart className="w-4 h-4" />;
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const renderChart = () => {
    // Show loading state if no data is available
    if (!hasData) {
      return (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-text-subtle mb-1">Loading chart data...</p>
            <p className="text-xs text-text-subtle">Fetching real-time data from database</p>
          </div>
        </div>
      );
    }

    // Check if we have data for the selected chart type
    if (chartType === 'pie' && !hasPieData) {
      return (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-text-subtle mb-1">No pie chart data available</p>
            <p className="text-xs text-text-subtle">Try switching to bar or line chart</p>
          </div>
        </div>
      );
    }

    if ((chartType === 'bar' || chartType === 'line') && !hasChartData) {
      return (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-text-subtle mb-1">No chart data available</p>
            <p className="text-xs text-text-subtle">Data will appear as it becomes available</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: 240,
      data: chartType === 'pie' ? currentPieData : currentChartData,
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsBarChart data={currentChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="messages" fill="#8884d8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivery_rate" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={currentChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="messages" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="delivery_rate" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsPieChart>
              <Pie
                data={currentPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
              >
                {currentPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px'
                }}
                formatter={(value: any, name: string) => [`${value}`, name]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string, entry: any) => (
                  <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>
                    {entry.payload?.name}: {entry.payload?.value || 0}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4 glass border-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Performance Overview
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {hasData ? "Real Data" : "Loading..."}
          </Badge>
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center gap-1.5">
                  <BarChart className="w-3 h-3" />
                  <span>Bar</span>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center gap-1.5">
                  <LineChart className="w-3 h-3" />
                  <span>Line</span>
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center gap-1.5">
                  <PieChart className="w-3 h-3" />
                  <span>Pie</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-64 w-full">
          {renderChart()}
        </div>

        {performance && (
          <div className="text-center py-1">
            <p className="text-xs text-text-subtle">
              {hasData ? `Total Messages: ${performance.metrics.total_messages} | Delivery Rate: ${performance.metrics.delivery_rate}%` : "Loading performance data..."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle">
        <button
          onClick={handleViewDetailedAnalytics}
          className="w-full text-xs text-primary hover:text-primary-dark transition-smooth"
        >
          View detailed analytics
        </button>
      </div>
    </Card>
  );
}

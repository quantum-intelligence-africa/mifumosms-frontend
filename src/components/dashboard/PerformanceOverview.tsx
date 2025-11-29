import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Clock, BarChart, LineChart, PieChart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  PieLabelRenderProps
} from "recharts";

interface PerformanceOverviewProps {
  performance?: {
    metrics: {
      total_messages: number;
      delivery_rate: number;
      response_rate?: number;
      active_conversations?: number;
      campaign_success_rate?: number;
    };
    charts: {
      message_volume: {
        labels: string[];
        data: number[];
        label?: string;
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      };
      delivery_rates: {
        labels: string[];
        data: number[];
        label?: string;
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      };
      message_status_distribution?: {
        labels: string[];
        data: number[];
        backgroundColor?: string[];
        borderColor?: string[];
      };
    };
    legend?: Array<{
      label: string;
      color: string;
      description?: string;
      chartTypes: string[];
    }>;
    coming_soon?: boolean;
  } | null;
}

type ChartType = 'bar' | 'line' | 'pie';

type LegendItem = {
  label: string;
  color?: string;
  description?: string;
};

export function PerformanceOverview({ performance }: PerformanceOverviewProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleViewDetailedAnalytics = () => {
    navigate('/analytics');
  };

  // Transform data for Bar/Line charts (time-series data)
  // Use message_volume and delivery_rates for bar/line charts
  const currentChartData = performance?.charts?.message_volume ?
    performance.charts.message_volume.labels.map((label, index) => ({
      name: label,
      message_volume: performance.charts.message_volume.data[index] || 0,
      delivery_rate: performance.charts.delivery_rates?.data[index] || 0,
    })) : [];

  // Transform data for Pie chart (status distribution)
  const currentPieData = performance?.charts?.message_status_distribution ?
    performance.charts.message_status_distribution.labels.map((label, index) => {
      const bgColors = performance.charts.message_status_distribution.backgroundColor;
      const color = Array.isArray(bgColors)
        ? (bgColors[index] || '#8884d8')
        : (typeof bgColors === 'string' ? bgColors : '#8884d8');
      return {
        name: label,
        value: performance.charts.message_status_distribution.data[index] || 0,
        color: color
      };
    }).filter(item => item.value > 0) : [];

  // Get colors from API or use defaults
  const messageVolumeColor = (() => {
    const bgColor = performance?.charts?.message_volume?.backgroundColor;
    if (Array.isArray(bgColor)) return bgColor[0] || '#8B7FE8';
    if (typeof bgColor === 'string') return bgColor;
    return '#8B7FE8';
  })();

  const deliveryRateColor = (() => {
    const bgColor = performance?.charts?.delivery_rates?.backgroundColor;
    if (Array.isArray(bgColor)) return bgColor[0] || '#5DD39E';
    if (typeof bgColor === 'string') return bgColor;
    return '#5DD39E';
  })();

  // Get labels from API
  const messageVolumeLabel = performance?.charts?.message_volume?.label || 'Message Volume';
  const deliveryRateLabel = performance?.charts?.delivery_rates?.label || 'Delivery Rate';

  // Check if we have data to display
  const hasChartData = currentChartData.length > 0;
  const hasPieData = currentPieData.length > 0;
  const hasData = hasChartData || hasPieData;

  const RADIAN = Math.PI / 180;

  const renderPieLabel = (props: PieLabelRenderProps) => {
    if (!props?.percent || !props?.name) return null;
    const baseRadius = typeof props.outerRadius === 'number' ? props.outerRadius : Number(props.outerRadius) || 0;
    const cx = typeof props.cx === 'number' ? props.cx : Number(props.cx) || 0;
    const cy = typeof props.cy === 'number' ? props.cy : Number(props.cy) || 0;
    const radius = baseRadius + (isMobile ? 8 : 16);
    const x = cx + radius * Math.cos(-props.midAngle * RADIAN);
    const y = cy + radius * Math.sin(-props.midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#0f172a"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight={600}
      >
        {`${props.name}: ${(props.percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const legendItems: LegendItem[] = performance?.legend?.length
    ? performance.legend
        .filter(item => item.chartTypes.includes(chartType))
        .map(item => ({ label: item.label, color: item.color, description: item.description }))
    : (chartType === 'pie'
      ? currentPieData.map(item => ({ label: item.name, color: item.color }))
      : [
          { label: messageVolumeLabel, color: messageVolumeColor },
          { label: deliveryRateLabel, color: deliveryRateColor }
        ]);

  const renderLegendContent = () => {
    if (!legendItems?.length) return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] sm:text-xs text-foreground/80">
        {legendItems.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color || '#8B7FE8' }}
            />
            <span className="font-medium">{item.label}</span>
            {item.description && (
              <span className="text-[10px] text-text-subtle">({item.description})</span>
            )}
          </div>
        ))}
      </div>
    );
  };

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
    // Show loading state if performance data hasn't loaded yet
    if (performance === null || performance === undefined) {
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

    // Show "No chart yet" if performance data exists but is empty
    if (!hasData) {
      return (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No chart yet</p>
            <p className="text-xs text-text-subtle">Start sending messages to see your performance data</p>
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
            <p className="text-sm font-medium text-foreground mb-1">No chart yet</p>
            <p className="text-xs text-text-subtle">Try switching to bar or line chart, or start sending messages</p>
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
            <p className="text-sm font-medium text-foreground mb-1">No chart yet</p>
            <p className="text-xs text-text-subtle">Start sending messages to see your performance trends</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: isMobile ? 200 : 240,
      data: chartType === 'pie' ? currentPieData : currentChartData,
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsBarChart
              data={currentChartData}
              margin={isMobile ? { top: 5, right: 5, left: -20, bottom: 5 } : { top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 50 : 60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: isMobile ? '11px' : '12px',
                  padding: isMobile ? '4px 8px' : '6px 12px'
                }}
              />
              <Bar
                dataKey="message_volume"
                fill={messageVolumeColor}
                radius={[4, 4, 0, 0]}
                name={messageVolumeLabel}
              />
              <Bar
                dataKey="delivery_rate"
                fill={deliveryRateColor}
                radius={[4, 4, 0, 0]}
                name={deliveryRateLabel}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart
              data={currentChartData}
              margin={isMobile ? { top: 5, right: 5, left: -20, bottom: 5 } : { top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis
                className="text-xs"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 50 : 60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: isMobile ? '11px' : '12px',
                  padding: isMobile ? '4px 8px' : '6px 12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="message_volume"
                stroke={messageVolumeColor}
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 3 : 4 }}
                name={messageVolumeLabel}
              />
              <Line
                type="monotone"
                dataKey="delivery_rate"
                stroke={deliveryRateColor}
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 3 : 4 }}
                name={deliveryRateLabel}
              />
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
                label={renderPieLabel}
                outerRadius={isMobile ? 70 : 95}
                innerRadius={isMobile ? 40 : 60}
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
                  fontSize: isMobile ? '11px' : '12px',
                  padding: isMobile ? '4px 8px' : '8px'
                }}
                formatter={(value: number | string, name: string) => [`${value}`, name]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4 sm:p-5 glass border border-border-subtle">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-2">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
          Performance Overview
        </h3>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5">
            {hasData ? "Real Data" : "Loading..."}
          </Badge>
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-24 sm:w-28 h-7 text-xs">
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

      <div className="space-y-2 sm:space-y-3">
        <div className="h-48 sm:h-64 w-full">
          {renderChart()}
        </div>
        {renderLegendContent()}

        {performance && (
          <div className="text-center py-1">
            <p className="text-xs text-text-subtle">
              {hasData ? `Total Messages: ${performance.metrics.total_messages} | Delivery Rate: ${performance.metrics.delivery_rate}%` : "Loading performance data..."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border-subtle">
        {/* <button
          onClick={handleViewDetailedAnalytics}
          className="w-full text-xs text-primary hover:text-primary-dark transition-smooth text-center"
        >
          View detailed analytics
        </button> */}
      </div>
    </Card>
  );
}

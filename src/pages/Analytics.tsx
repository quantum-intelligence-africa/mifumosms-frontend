import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Users,
  MessageSquare,
  Send,
  Target,
  Eye,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  Activity,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileText,
  TrendingUp as CostIcon
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
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
import { appLocale, appLanguage } from "@/utils/appLocale";
import {
  loadAnalytics,
  buildAnalyticsCsv,
  downloadCsv,
  percentChange,
  type AnalyticsData,
  type RangeKey,
} from "@/lib/analyticsApi";
// jspdf + html2canvas together are ~540 kB (158 kB gzip). They are imported lazily
// inside handleExportToPDF so they only download when the user clicks "Export PDF".

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

// Words that have no key in the shared dictionaries: English / Kiswahili.
const tx = (en: string, sw: string) => (appLanguage() === "sw" ? sw : en);

const PATH_LABELS: Record<string, [string, string]> = {
  single: ["Single SMS", "SMS moja"],
  bulk: ["Bulk SMS", "SMS nyingi"],
  campaign: ["Campaign", "Kampeni"],
  api: ["API", "API"],
  broadcast: ["Broadcast", "Matangazo"],
  verification: ["Verification", "Uthibitisho"],
  notification: ["Notification", "Arifa"],
  invitation: ["Invitation", "Mwaliko"],
  scheduled: ["Scheduled", "Zilizopangwa"],
  template: ["Template", "Kiolezo"],
};
const pathLabel = (key: string) => {
  const entry = PATH_LABELS[key];
  return entry ? tx(entry[0], entry[1]) : key;
};

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--destructive))',
];

const Analytics = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<RangeKey>("30d");
  const [isExporting, setIsExporting] = useState(false);
  const selectedCampaign = searchParams.get('campaign');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const analyticsContentRef = useRef<HTMLDivElement>(null);

  // A link to a campaign's analytics opens the Campaigns section on that campaign.
  useEffect(() => {
    if (selectedCampaign) setCurrentCategory("campaigns");
  }, [selectedCampaign]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await loadAnalytics(dateRange, selectedCampaign));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedCampaign]);

  useEffect(() => {
    load();
  }, [load]);

  const num = (n: number | undefined | null) => (n ?? 0).toLocaleString(appLocale());
  const money = (n: number | undefined | null) => `Tsh ${Math.round(n ?? 0).toLocaleString(appLocale())}`;
  const pct = (n: number | undefined | null) => `${(n ?? 0).toFixed(1)}%`;
  const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
  const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(appLocale(), { month: 'short', day: 'numeric' });

  const analyticsCategories: AnalyticsCategory[] = [
    {
      id: "overview",
      title: t("pages.analytics.category.overview.title"),
      description: t("pages.analytics.category.overview.desc"),
      icon: Activity,
      color: "bg-blue-500"
    },
    {
      id: "campaigns",
      title: t("pages.analytics.category.campaigns.title"),
      description: t("pages.analytics.category.campaigns.desc"),
      icon: Send,
      color: "bg-green-500"
    },
    {
      id: "audience",
      title: t("pages.analytics.category.audience.title"),
      description: t("pages.analytics.category.audience.desc"),
      icon: Users,
      color: "bg-purple-500"
    },
    {
      // The old "Revenue" section had no data behind it (nothing records revenue). What the system does
      // record is what the SMS cost, so this section shows that.
      id: "cost",
      title: tx("Cost", "Gharama"),
      description: tx("What your SMS cost, and where", "SMS zako zilivyogharimu, na wapi"),
      icon: CostIcon,
      color: "bg-emerald-500"
    }
  ];

  const daily = data?.daily ?? [];
  const summary = data?.summary ?? null;

  const changeText = (now: number, before: number | undefined | null) => {
    const c = percentChange(now, before);
    if (c === null) return undefined;
    return `${c >= 0 ? '+' : ''}${c.toFixed(1)}% ${tx("vs previous period", "dhidi ya kipindi kilichopita")}`;
  };

  const metrics = useMemo(() => {
    if (!data) return [];
    const list: Array<{ title: string; value: string; change?: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [];
    if (data.summary) {
      list.push({
        title: t("dashboard.metric.total_messages"),
        value: num(data.summary.total_messages),
        change: changeText(data.summary.total_messages, data.previous?.total_messages),
        icon: MessageSquare,
        description: tx("SMS in the selected period", "SMS katika kipindi kilichochaguliwa"),
      });
      list.push({
        title: tx("Send success rate", "Kiwango cha kutuma"),
        value: pct(data.summary.success_rate),
        change: data.previous && data.previous.total_messages > 0
          ? `${data.summary.success_rate - data.previous.success_rate >= 0 ? '+' : ''}${(data.summary.success_rate - data.previous.success_rate).toFixed(1)} ${tx("pts vs previous period", "pointi dhidi ya kipindi kilichopita")}`
          : undefined,
        icon: Target,
        description: tx("SMS accepted for sending / all SMS", "SMS zilizokubaliwa kutumwa / SMS zote"),
      });
      list.push({
        title: tx("Segments", "Vipande"),
        value: num(data.summary.total_segments),
        change: changeText(data.summary.total_segments, data.previous?.total_segments),
        icon: BarChart3,
        description: tx("SMS parts sent", "Vipande vya SMS vilivyotumwa"),
      });
      list.push({
        title: tx("SMS cost", "Gharama ya SMS"),
        value: money(data.summary.total_cost),
        change: changeText(data.summary.total_cost, data.previous?.total_cost),
        icon: DollarSign,
        description: tx("As recorded in the usage log", "Kama ilivyorekodiwa kwenye kumbukumbu"),
      });
    }
    if (data.overview) {
      list.push({
        title: tx("Read rate", "Kiwango cha kusomwa"),
        value: pct(data.overview.messages.read_rate),
        icon: Eye,
        description: tx("Delivered conversation messages that were read (all time)", "Ujumbe wa mazungumzo uliosomwa (wakati wote)"),
      });
      list.push({
        title: t("dashboard.metric.active_contacts"),
        value: num(data.overview.contacts.total),
        icon: Users,
        description: tx(`${num(data.overview.contacts.opted_in)} opted in (all time)`, `${num(data.overview.contacts.opted_in)} wamekubali (wakati wote)`),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, t]);

  const labels = daily.map((d) => shortDate(d.date));

  const messageVolumeData = {
    labels,
    datasets: [
      {
        label: tx("SMS", "SMS"),
        data: daily.map((d) => d.messages),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.4,
      },
      {
        label: tx("Segments", "Vipande"),
        data: daily.map((d) => d.segments),
        borderColor: 'hsl(var(--secondary))',
        backgroundColor: 'hsl(var(--secondary) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const deliveryRateData = {
    labels,
    datasets: [
      {
        label: tx("Send success rate (%)", "Kiwango cha kutuma (%)"),
        data: daily.map((d) => Number(rate(d.successful, d.messages).toFixed(1))),
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const pathEntries = Object.entries(data?.byPath ?? {}).sort((a, b) => b[1].count - a[1].count);
  const pathDistributionData = {
    labels: pathEntries.map(([key]) => pathLabel(key)),
    datasets: [
      {
        data: pathEntries.map(([, v]) => v.count),
        backgroundColor: pathEntries.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 0,
      },
    ],
  };

  const dailyCostData = {
    labels,
    datasets: [
      {
        label: tx("Cost (Tsh)", "Gharama (Tsh)"),
        data: daily.map((d) => d.cost),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const campaigns = data?.campaigns ?? [];
  const topCampaigns = [...campaigns].sort((a, b) => b.sent_count - a.sent_count).slice(0, 8);
  const campaignPerformanceData = {
    labels: topCampaigns.slice(0, 5).map((c) => c.name),
    datasets: [
      {
        label: tx("Delivered (% of sent)", "Zilizofika (% ya zilizotumwa)"),
        data: topCampaigns.slice(0, 5).map((c) => Number(rate(c.delivered_count, c.sent_count).toFixed(1))),
        backgroundColor: 'hsl(var(--primary))',
      },
      {
        label: tx("Read (% of delivered)", "Zilizosomwa (% ya zilizofika)"),
        data: topCampaigns.slice(0, 5).map((c) => Number(rate(c.read_count, c.delivered_count).toFixed(1))),
        backgroundColor: 'hsl(var(--secondary))',
      },
    ],
  };

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
        beginAtZero: true,
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

  const handleExportCsv = () => {
    if (!data) return;
    downloadCsv(`analytics-report-${data.startDate}_${data.endDate}.csv`, buildAnalyticsCsv(data));
  };

  // PDF Export Function
  const handleExportToPDF = async () => {
    if (!analyticsContentRef.current) return;

    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const element = analyticsContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add title
      pdf.setFontSize(20);
      pdf.text(t("pages.analytics.pdf.title"), 20, 20);
      pdf.setFontSize(12);
      pdf.text(t("pages.analytics.pdf.generated_on", { date: new Date().toLocaleDateString(appLocale()) }), 20, 30);
      pdf.text(t("pages.analytics.pdf.date_range", { range: data ? `${data.startDate} - ${data.endDate}` : dateRange }), 20, 35);

      position = 45; // Start image below title
      heightLeft = imgHeight;

      // Add the image
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t("pages.analytics.error.export_failed"));
    } finally {
      setIsExporting(false);
    }
  };

  const NoData = ({ text }: { text?: string }) => (
    <p className="text-xs text-text-subtle py-6 text-center">{text ?? tx("No data for this period yet.", "Hakuna data kwa kipindi hiki bado.")}</p>
  );

  const renderCategoryContent = () => {
    const category = analyticsCategories.find(cat => cat.id === currentCategory);
    if (!category) return null;

    if (isLoading && !data) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }
    if (!data) return null;

    const coreFailed = data.failed.filter((f) => f !== "previous");
    const everythingFailed = !data.summary && !data.daily && !data.byPath && !data.overview && !data.campaigns;
    if (everythingFailed) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-foreground mb-3">{tx("Could not load the analytics.", "Imeshindwa kupakia uchambuzi.")}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {tx("Try again", "Jaribu tena")}
          </Button>
        </div>
      );
    }

    const partialNote = coreFailed.length > 0 ? (
      <div className="flex items-center gap-2 p-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{tx("Some figures could not be loaded:", "Baadhi ya takwimu hazikupakiwa:")} {coreFailed.join(", ")}</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={load}>{tx("Retry", "Jaribu tena")}</Button>
      </div>
    ) : null;

    switch (currentCategory) {
      case "overview":
        return (
          <div className="space-y-3">
            {partialNote}
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {metrics.map((metric, index) => (
                <Card key={index} className="glass border-0">
                  <CardContent className="p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                        <metric.icon className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-text-subtle mb-1 truncate">{metric.title}</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-sm font-bold text-foreground">{metric.value}</h3>
                    </div>
                    {metric.change && <p className="text-xs text-text-subtle mt-1">{metric.change}</p>}
                    <p className="text-xs text-text-subtle mt-1 line-clamp-2">{metric.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Message Volume */}
              <Card className="glass border-0">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {t("dashboard.performance.message_volume")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {daily.length > 0 ? (
                    <div className="h-40">
                      <Line data={messageVolumeData} options={chartOptions} />
                    </div>
                  ) : <NoData />}
                </CardContent>
              </Card>

              {/* Send success trend */}
              <Card className="glass border-0">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-success" />
                    {tx("Send success rate by day", "Kiwango cha kutuma kwa siku")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {daily.length > 0 ? (
                    <div className="h-40">
                      <Line data={deliveryRateData} options={chartOptions} />
                    </div>
                  ) : <NoData />}
                </CardContent>
              </Card>

              {/* SMS by sending path */}
              <Card className="glass border-0">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChart className="w-4 h-4 text-secondary" />
                    {tx("SMS by how they were sent", "SMS kwa njia ya kutuma")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {pathEntries.length > 0 ? (
                    <div className="h-40">
                      <Doughnut
                        data={pathDistributionData}
                        options={{
                          ...chartOptions,
                          scales: undefined,
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
                  ) : <NoData />}
                </CardContent>
              </Card>

              {/* Conversation messages (all time) */}
              <Card className="glass border-0">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {tx("Conversation messages (all time)", "Ujumbe wa mazungumzo (wakati wote)")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {data.overview ? (
                    <div className="space-y-2">
                      {[
                        [tx("Sent", "Zilizotumwa"), data.overview.messages.sent, undefined],
                        [tx("Delivered", "Zilizofika"), data.overview.messages.delivered, data.overview.messages.delivery_rate],
                        [tx("Read", "Zilizosomwa"), data.overview.messages.read, data.overview.messages.read_rate],
                      ].map(([label, value, share]) => (
                        <div key={String(label)} className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">{label as string}</p>
                          <div className="text-right">
                            <p className="font-medium text-foreground text-sm">{num(value as number)}</p>
                            {share !== undefined && <p className="text-xs text-text-subtle">{pct(share as number)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <NoData />}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "campaigns":
        return (
          <div className="space-y-3">
            {partialNote}
            {/* One campaign, when the page was opened from it (?campaign=<id>) */}
            {selectedCampaign && data.campaignDetail && (
              <Card className="glass border-0 border-l-4 border-primary">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{data.campaignDetail.campaign_name}</span>
                    <Badge variant="outline" className="text-xs capitalize">{data.campaignDetail.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><p className="text-text-subtle">{tx("Recipients", "Wapokeaji")}</p><p className="font-medium">{num(data.campaignDetail.total_recipients)}</p></div>
                    <div><p className="text-text-subtle">{t("dashboard.recent_campaigns.sent")}</p><p className="font-medium">{num(data.campaignDetail.sent_count)}</p></div>
                    <div><p className="text-text-subtle">{t("dashboard.recent_campaigns.delivered")}</p><p className="font-medium">{num(data.campaignDetail.delivered_count)}</p><p className="text-success">{pct(data.campaignDetail.delivery_rate)}</p></div>
                    <div><p className="text-text-subtle">{tx("Read", "Zilizosomwa")}</p><p className="font-medium">{num(data.campaignDetail.read_count)}</p><p className="text-primary">{pct(data.campaignDetail.read_rate)}</p></div>
                    <div><p className="text-text-subtle">{tx("Failed", "Zilizoshindwa")}</p><p className="font-medium">{num(data.campaignDetail.failed_count)}</p></div>
                    <div><p className="text-text-subtle">{tx("Progress", "Maendeleo")}</p><p className="font-medium">{pct(data.campaignDetail.progress_percentage)}</p></div>
                    <div><p className="text-text-subtle">{tx("Estimated cost", "Gharama inayokadiriwa")}</p><p className="font-medium">{money(data.campaignDetail.estimated_cost)}</p></div>
                    <div><p className="text-text-subtle">{tx("Actual cost", "Gharama halisi")}</p><p className="font-medium">{money(data.campaignDetail.actual_cost)}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedCampaign && data.failed.includes("campaign") && (
              <p className="text-xs text-text-subtle">{tx("This campaign's figures could not be loaded.", "Takwimu za kampeni hii hazikupakiwa.")}</p>
            )}

            {/* Campaign Performance Chart */}
            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-primary" />
                  {t("pages.analytics.chart.campaign_performance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {topCampaigns.length > 0 ? (
                  <div className="h-40">
                    <Bar data={campaignPerformanceData} options={chartOptions} />
                  </div>
                ) : <NoData text={tx("No campaigns in this period.", "Hakuna kampeni katika kipindi hiki.")} />}
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{t("pages.analytics.chart.top_campaigns")}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  {topCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-2 rounded-lg bg-gradient-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h5 className="font-medium text-sm truncate">{campaign.name}</h5>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{money(campaign.actual_cost)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-text-subtle">{t("dashboard.recent_campaigns.sent")}</p>
                          <p className="font-medium">{num(campaign.sent_count)}</p>
                        </div>
                        <div>
                          <p className="text-text-subtle">{t("dashboard.recent_campaigns.delivered")}</p>
                          <p className="font-medium">{num(campaign.delivered_count)}</p>
                          <p className="text-success">{Math.round(rate(campaign.delivered_count, campaign.sent_count))}%</p>
                        </div>
                        <div>
                          <p className="text-text-subtle">{tx("Read", "Zilizosomwa")}</p>
                          <p className="font-medium">{num(campaign.read_count)}</p>
                          <p className="text-primary">{Math.round(rate(campaign.read_count, campaign.delivered_count))}%</p>
                        </div>
                        <div>
                          <p className="text-text-subtle">{tx("Failed", "Zilizoshindwa")}</p>
                          <p className="font-medium">{num(campaign.failed_count)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topCampaigns.length === 0 && <NoData text={tx("No campaigns in this period.", "Hakuna kampeni katika kipindi hiki.")} />}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "audience": {
        const busiest = daily.length > 0 ? daily.reduce((best, d) => (d.messages > best.messages ? d : best), daily[0]) : null;
        const avgPerDay = daily.length > 0 ? daily.reduce((sum, d) => sum + d.messages, 0) / daily.length : 0;
        return (
          <div className="space-y-3">
            {partialNote}
            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  {t("pages.analytics.audience.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {data.overview ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-primary">{num(data.overview.contacts.total)}</p>
                        <p className="text-xs text-text-subtle">{tx("Contacts", "Wasiliani")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-success">{pct(data.overview.contacts.opt_in_rate)}</p>
                        <p className="text-xs text-text-subtle">{tx(`Opted in (${num(data.overview.contacts.opted_in)})`, `Wamekubali (${num(data.overview.contacts.opted_in)})`)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-foreground">{num(data.overview.conversations.total)}</p>
                        <p className="text-xs text-text-subtle">{tx("Conversations", "Mazungumzo")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-foreground">{num(data.overview.conversations.open)}</p>
                        <p className="text-xs text-text-subtle">{tx("Open conversations", "Mazungumzo yaliyo wazi")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-subtle">{tx("All-time figures; they do not change with the date range.", "Takwimu za wakati wote; hazibadiliki kwa kipindi.")}</p>
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t("pages.analytics.audience.patterns_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {busiest ? (
                  <div className="space-y-1">
                    <p className="text-xs text-text-subtle">
                      {tx(`Busiest day: ${new Date(`${busiest.date}T00:00:00`).toLocaleDateString(appLocale(), { weekday: 'long', month: 'short', day: 'numeric' })} (${num(busiest.messages)} SMS)`,
                        `Siku yenye shughuli nyingi: ${new Date(`${busiest.date}T00:00:00`).toLocaleDateString(appLocale(), { weekday: 'long', month: 'short', day: 'numeric' })} (SMS ${num(busiest.messages)})`)}
                    </p>
                    <p className="text-xs text-text-subtle">
                      {tx(`Average on days with sending: ${avgPerDay.toFixed(1)} SMS`, `Wastani kwa siku zenye utumaji: SMS ${avgPerDay.toFixed(1)}`)}
                    </p>
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>
          </div>
        );
      }

      case "cost": {
        const totalCost = summary?.total_cost ?? 0;
        return (
          <div className="space-y-3">
            {partialNote}
            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CostIcon className="w-4 h-4 text-primary" />
                  {tx("SMS cost", "Gharama ya SMS")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {summary ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-success">{money(summary.total_cost)}</p>
                        <p className="text-xs text-text-subtle">{tx("Total cost", "Gharama jumla")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle text-center">
                        <p className="text-xl font-bold text-primary">{money(summary.total_messages > 0 ? summary.total_cost / summary.total_messages : 0)}</p>
                        <p className="text-xs text-text-subtle">{tx("Per SMS", "Kwa SMS")}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-surface border border-border-subtle">
                      <h4 className="font-medium text-sm mb-1">{tx("Cost by how SMS were sent", "Gharama kwa njia ya kutuma")}</h4>
                      <div className="space-y-1">
                        {[...pathEntries].sort((a, b) => b[1].cost - a[1].cost).map(([key, v]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-xs">{pathLabel(key)} ({num(v.count)})</span>
                            <span className="text-xs font-medium">{money(v.cost)}{totalCost > 0 ? ` (${Math.round(rate(v.cost, totalCost))}%)` : ""}</span>
                          </div>
                        ))}
                        {pathEntries.length === 0 && <NoData />}
                      </div>
                    </div>
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {tx("Cost by day", "Gharama kwa siku")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {daily.length > 0 ? (
                  <div className="h-40">
                    <Line data={dailyCostData} options={chartOptions} />
                  </div>
                ) : <NoData />}
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const exportButtons = (compact: boolean) => (
    <>
      <Button
        variant="outline"
        className="glass-subtle border-0 text-xs sm:text-sm h-7 sm:h-8"
        size="sm"
        onClick={handleExportCsv}
        disabled={!data || isLoading}
      >
        <FileText className="w-3 h-3 mr-1 sm:mr-2" />
        <span>{compact ? "CSV" : tx("Export CSV", "Pakua CSV")}</span>
      </Button>
      <Button
        variant="outline"
        className="glass-subtle border-0 text-xs sm:text-sm h-7 sm:h-8"
        size="sm"
        onClick={handleExportToPDF}
        disabled={isExporting || !currentCategory}
      >
        <Download className="w-3 h-3 mr-1 sm:mr-2" />
        <span className={compact ? undefined : "hidden sm:inline"}>
          {isExporting ? t("pages.analytics.export.exporting") : compact ? t("pages.analytics.export.export_short") : t("pages.analytics.export.export_pdf")}
        </span>
        {!compact && (
          <span className="sm:hidden">
            {isExporting ? "..." : t("pages.analytics.export.pdf_short")}
          </span>
        )}
      </Button>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4 xl:p-6">
            <div className="max-w-7xl mx-auto flex flex-col">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 lg:mb-5 xl:mb-6 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                    {t("pages.analytics.title")}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    {t("pages.analytics.subtitle")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 lg:gap-3">
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as RangeKey)}>
                    <SelectTrigger className="w-full sm:w-36 lg:w-40 glass-subtle border-0 text-xs sm:text-sm h-7 sm:h-8">
                      <Calendar className="w-3 h-3 mr-1 sm:mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="7d">{t("pages.analytics.range.7d")}</SelectItem>
                      <SelectItem value="30d">{t("pages.analytics.range.30d")}</SelectItem>
                      <SelectItem value="90d">{t("pages.analytics.range.90d")}</SelectItem>
                      <SelectItem value="1y">{t("pages.analytics.range.1y")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isMobile && exportButtons(false)}
                </div>
              </div>

              {/* Mobile Category Navigation */}
              {isMobile ? (
                <div className="flex-1 overflow-hidden">
                  {!currentCategory ? (
                    <div className="space-y-3 overflow-y-auto pb-6 h-full">
                      {analyticsCategories.map((category) => (
                        <Card
                          key={category.id}
                          className="glass border-0 cursor-pointer transition-all duration-200 hover:shadow-lg"
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
                    <div className="flex flex-col h-full">
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
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
                        <div className="flex items-center gap-1">{exportButtons(true)}</div>
                      </div>

                      {/* Category Content */}
                      <div className="flex-1 overflow-y-auto pb-4" ref={analyticsContentRef}>
                        {renderCategoryContent()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout - Keep original tabs */
                <div className="flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        {analyticsCategories.map((category) => (
                          <Card
                            key={category.id}
                            className={`glass border-0 cursor-pointer transition-all duration-200 ${
                              currentCategory === category.id
                                ? 'border-l-4 border-t-4 border-primary bg-primary/5 shadow-lg'
                                : 'hover:shadow-lg'
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
                      <div className="overflow-y-auto pb-4" ref={analyticsContentRef}>
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

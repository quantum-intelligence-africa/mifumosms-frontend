import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  apiClient,
  PertinaAllBalanceResponse,
  PertinaAllUsageResponse,
  PertinaTenantBalance,
  PertinaTenantUsageResponse,
} from "@/lib/api";
import { useTenants } from "@/hooks/useTenants";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const PertinaInsights = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tenants, currentTenant, isLoading: tenantsLoading } = useTenants();
  const [selectedTenantId, setSelectedTenantId] = useState<string>();
  const [tenantBalance, setTenantBalance] = useState<PertinaTenantBalance | null>(null);
  const [allBalance, setAllBalance] = useState<PertinaAllBalanceResponse | null>(null);
  const [tenantUsage, setTenantUsage] = useState<PertinaTenantUsageResponse | null>(null);
  const [allUsage, setAllUsage] = useState<PertinaAllUsageResponse | null>(null);
  const [loadingState, setLoadingState] = useState({
    singleBalance: false,
    allBalance: false,
    singleUsage: false,
    allUsage: false,
  });
  const [singleFilters, setSingleFilters] = useState({ startDate: "", endDate: "" });
  const [allFilters, setAllFilters] = useState({ startDate: "", endDate: "" });
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  useEffect(() => {
    if (currentTenant) {
      setSelectedTenantId(currentTenant.id);
    }
  }, [currentTenant]);

  useEffect(() => {
    if (!currentTenant && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, currentTenant, selectedTenantId]);

  const buildDateParams = (filters: { startDate: string; endDate: string }) => {
    const params: { start_date?: string; end_date?: string } = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    return Object.keys(params).length ? params : undefined;
  };

  const formatTime = (value?: string) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";

  const aggregatedUsageSummary = useMemo(() => {
    if (!allUsage) return null;
    const totalUsers = allUsage.tenants.reduce(
      (sum, tenant) => sum + (tenant.summary?.total_users ?? 0),
      0,
    );
    const totalUsageRecords = allUsage.tenants.reduce(
      (sum, tenant) => sum + (tenant.summary?.total_usage_records ?? 0),
      0,
    );
    const totalCreditsUsed = allUsage.tenants.reduce(
      (sum, tenant) => sum + (tenant.used_credits ?? 0),
      0,
    );
    const avgCreditsPerUser = totalUsers ? Math.round(totalCreditsUsed / totalUsers) : 0;
    return { totalUsers, totalUsageRecords, avgCreditsPerUser };
  }, [allUsage]);

  const handleApiError = (error?: any, message?: string) => {
    // Check if it's a 404 error for pertina endpoints
    if (error?.status === 404 && message?.includes('pertina')) {
      toast({
        title: language === "sw" ? "Huduma haipatikani" : "Feature not available",
        description: language === "sw"
          ? "Endpoints za ujumuishaji wa mshirika bado hazijatekelezwa kwenye backend."
          : "Partner integration endpoints are not yet implemented on the backend.",
        variant: "default",
      });
      return;
    }

    toast({
      title: language === "sw" ? "Ombi limeshindwa" : "Request failed",
      description: message || (language === "sw" ? "Imeshindwa kupakia data kwa sasa." : "Unable to load data at the moment."),
      variant: "destructive",
    });
  };

  const handleFetchTenantBalance = async () => {
    if (!selectedTenantId) {
      return toast({
        title: language === "sw" ? "Chagua tenant" : "Select a tenant",
        description: language === "sw"
          ? "Chagua tenant kabla ya kuchukua salio."
          : "Choose a tenant before fetching the balance.",
        variant: "default",
      });
    }

    setLoadingState((prev) => ({ ...prev, singleBalance: true }));
    try {
      const response = await apiClient.pertinaGetTenantBalance(selectedTenantId);
      if (response.success && response.data) {
        setTenantBalance(response.data);
      } else {
        handleApiError(response, response.error || response.message);
      }
    } catch (error) {
      handleApiError(error, error instanceof Error ? error.message : undefined);
    } finally {
      setLoadingState((prev) => ({ ...prev, singleBalance: false }));
    }
  };

  const handleFetchAllBalance = async () => {
    setLoadingState((prev) => ({ ...prev, allBalance: true }));
    try {
      const response = await apiClient.pertinaGetAllBalance();
      if (response.success && response.data) {
        setAllBalance(response.data);
      } else {
        handleApiError(response, response.error || response.message);
      }
    } catch (error) {
      handleApiError(error, error instanceof Error ? error.message : undefined);
    } finally {
      setLoadingState((prev) => ({ ...prev, allBalance: false }));
    }
  };

  const handleFetchTenantUsage = async () => {
    if (!selectedTenantId) {
      return toast({
        title: "Select a tenant",
        description: "Choose a tenant before fetching usage.",
        variant: "default",
      });
    }

    setLoadingState((prev) => ({ ...prev, singleUsage: true }));
    try {
      const response = await apiClient.pertinaGetTenantUsage(selectedTenantId, buildDateParams(singleFilters));
      if (response.success && response.data) {
        setTenantUsage(response.data);
      } else {
        handleApiError(response, response.error || response.message);
      }
    } catch (error) {
      handleApiError(error, error instanceof Error ? error.message : undefined);
    } finally {
      setLoadingState((prev) => ({ ...prev, singleUsage: false }));
    }
  };

  const handleFetchAllUsage = async () => {
    setLoadingState((prev) => ({ ...prev, allUsage: true }));
    try {
      const response = await apiClient.pertinaGetAllUsage(buildDateParams(allFilters));
      if (response.success && response.data) {
        setAllUsage(response.data);
      } else {
        handleApiError(response, response.error || response.message);
      }
    } catch (error) {
      handleApiError(error, error instanceof Error ? error.message : undefined);
    } finally {
      setLoadingState((prev) => ({ ...prev, allUsage: false }));
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 lg:p-6 bg-gradient-to-b from-background to-background/80 text-sm">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/20 to-primary/5 p-6 shadow-xl shadow-primary/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {language === "sw" ? "Maarifa ya Mshirika" : "Partner Insights"}
                </p>
                <h1 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                  {language === "sw"
                    ? "Fuatilia afya ya salio la washirika wako sehemu moja."
                    : "Monitor your partners' credit health in one place."}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  {language === "sw"
                    ? "Pata salio za hivi karibuni na takwimu za matumizi kwa mshirika mmoja au wote kwa bonyezo moja."
                    : "Fetch the latest balances and usage stats per partner or across all partners with a single click."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {language === "sw" ? "API kwanza" : "API first"}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold">
                  {language === "sw" ? "Hufanywa upya kwa muda halisi" : "Updated in realtime"}
                </Badge>
              </div>
            </div>

            {/* COMMENTED OUT: Single Tenant Balance section - temporarily hidden */}
            {/*
            <section className="rounded-3xl border border-border bg-card shadow-sm shadow-border/20 p-6 space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Single Tenant Balance</p>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">Track a specific tenant</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-48 min-w-[180px]">
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger>
                        <SelectValue placeholder={tenantsLoading ? "Loading tenants..." : "Select tenant"} />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="secondary"
                    className="min-w-[150px] justify-center"
                    onClick={handleFetchTenantBalance}
                    disabled={!selectedTenantId || loadingState.singleBalance}
                  >
                    {loadingState.singleBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <span>Fetch balance</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {tenantBalance ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Current balance</p>
                      <p className="text-3xl font-bold text-foreground">{tenantBalance.current_balance.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Unused credits</p>
                      <p className="text-3xl font-bold text-foreground">{tenantBalance.unused_credits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-muted/10 to-muted/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Total purchased</p>
                      <p className="text-2xl font-bold text-foreground">{tenantBalance.total_purchased.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <p className="text-xs text-muted-foreground">Credits used</p>
                      <p className="text-xl font-semibold text-foreground">{tenantBalance.total_used.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <p className="text-xs text-muted-foreground">Last updated</p>
                      <p className="text-base font-medium text-foreground">{formatTime(tenantBalance.balance_last_updated)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/30 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  Select a tenant and fetch the balance to see live data.
                </div>
              )}
            </section>
            */}

            <section className="rounded-3xl border border-border bg-card shadow-sm shadow-border/20 p-6 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">All Tenants Balance</p>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    {language === "sw" ? "Muhtasari wa salio kwa tenants" : "Cross-tenant rollover"}
                  </h2>
                </div>
                <Button
                  variant="secondary"
                  className="min-w-[150px] justify-center"
                  onClick={handleFetchAllBalance}
                  disabled={loadingState.allBalance}
                >
                  {loadingState.allBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <span>{language === "sw" ? "Sasisha salio zote" : "Refresh all balances"}</span>
                </Button>
              </div>

              <Separator />

              {allBalance ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-background/80 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === "sw" ? "Jumla ya tenants" : "Total tenants"}
                      </p>
                      <p className="text-3xl font-bold text-foreground">{allBalance.summary.total_tenants}</p>
                    </div>
                    <div className="rounded-2xl bg-background/80 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === "sw" ? "Jumla ya salio" : "Total credits"}
                      </p>
                      <p className="text-3xl font-bold text-foreground">{allBalance.summary.total_credits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-background/80 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === "sw" ? "Salio lisilotumika" : "Total unused"}
                      </p>
                      <p className="text-3xl font-bold text-foreground">{allBalance.summary.total_unused.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allBalance.tenants.map((tenant) => (
                      <div key={tenant.tenant_id} className="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-foreground">{tenant.tenant_name}</p>
                          <Badge variant="outline" className="text-[11px]">
                            #{tenant.tenant_id.slice(0, 8)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "sw" ? "Salio la sasa" : "Current balance"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">{tenant.current_balance.toLocaleString()}</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{language === "sw" ? "Imetumika" : "Used"}</span>
                            <span>{tenant.total_used.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{language === "sw" ? "Haijatumiwa" : "Unused"}</span>
                            <span>{tenant.unused_credits.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/30 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  {language === "sw" ? "Sasisha ili kupakia salio za tenants wote." : "Refresh to load all tenant balances."}
                </div>
              )}
            </section>

            {/* COMMENTED OUT: Single Tenant Usage section - temporarily hidden */}
            {/*
            <section className="rounded-3xl border border-border bg-card shadow-sm shadow-border/20 p-6 space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Single Tenant Usage</p>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">Per user SMS usage</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Start</label>
                    <input
                      type="date"
                      value={singleFilters.startDate}
                      onChange={(event) =>
                        setSingleFilters((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                      className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">End</label>
                    <input
                      type="date"
                      value={singleFilters.endDate}
                      onChange={(event) =>
                        setSingleFilters((prev) => ({ ...prev, endDate: event.target.value }))
                      }
                      className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="min-w-[150px] justify-center"
                    onClick={handleFetchTenantUsage}
                    disabled={!selectedTenantId || loadingState.singleUsage}
                  >
                    {loadingState.singleUsage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <span>Load usage</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {tenantUsage ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total credits</p>
                      <p className="text-2xl font-semibold text-foreground">{tenantUsage.total_credits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Used</p>
                      <p className="text-2xl font-semibold text-foreground">{tenantUsage.used_credits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Unused</p>
                      <p className="text-2xl font-semibold text-foreground">{tenantUsage.unused_credits.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 overflow-auto">
                    <table className="w-full text-sm text-left text-foreground">
                      <thead className="bg-background/80 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3 text-right">Credits</th>
                          <th className="px-4 py-3 text-right">Usage count</th>
                          <th className="px-4 py-3">First used</th>
                          <th className="px-4 py-3">Last used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantUsage.usage_by_user.length ? (
                          tenantUsage.usage_by_user.map((user) => (
                            <tr key={user.user_id} className="border-t border-border/70">
                              <td className="px-4 py-3 font-semibold text-sm">{user.user_name}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{user.user_email}</td>
                              <td className="px-4 py-3 text-right">{user.credits_used.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right">{user.usage_count}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{formatTime(user.first_used)}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{formatTime(user.last_used)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-xs text-muted-foreground">
                              No usage records in this time window.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/30 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  Fetch usage to reveal how each user is consuming credits.
                </div>
              )}
            </section>
            */}

            <section className="rounded-3xl border border-border bg-card shadow-sm shadow-border/20 p-6 space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {language === "sw" ? "Matumizi ya tenants wote" : "All Tenants Usage"}
                  </p>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    {language === "sw" ? "Muhtasari wa matumizi kwa ujumla" : "Holistic usage overview"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {language === "sw" ? "Kuanzia" : "Start"}
                    </label>
                    <input
                      type="date"
                      value={allFilters.startDate}
                      onChange={(event) =>
                        setAllFilters((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                      className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {language === "sw" ? "Mpaka" : "End"}
                    </label>
                    <input
                      type="date"
                      value={allFilters.endDate}
                      onChange={(event) =>
                        setAllFilters((prev) => ({ ...prev, endDate: event.target.value }))
                      }
                      className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="min-w-[150px] justify-center"
                    onClick={handleFetchAllUsage}
                    disabled={loadingState.allUsage}
                  >
                    {loadingState.allUsage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <span>{language === "sw" ? "Sasisha muhtasari" : "Refresh overview"}</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {allUsage ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-background/80 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === "sw" ? "Tenants waliorejesha" : "Tenants reported"}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{allUsage.total_tenants}</p>
                    </div>
                    {aggregatedUsageSummary ? (
                      <>
                        <div className="rounded-2xl bg-background/80 p-4 text-center">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {language === "sw" ? "Rekodi za matumizi" : "Usage records"}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {aggregatedUsageSummary.totalUsageRecords.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-background/80 p-4 text-center">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {language === "sw" ? "Wastani salio/mtumiaji" : "Avg credits/user"}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {aggregatedUsageSummary.avgCreditsPerUser
                              ? aggregatedUsageSummary.avgCreditsPerUser.toLocaleString()
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-background/80 p-4 text-center">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {language === "sw" ? "Watumiaji waliorekodiwa" : "Users tracked"}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {aggregatedUsageSummary.totalUsers.toLocaleString()}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {allUsage.tenants.map((tenant) => (
                      <div key={tenant.tenant_id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-foreground">{tenant.tenant_name}</p>
                          <Badge variant="outline" className="text-[11px]">
                            {tenant.tenant_id.slice(0, 6)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{language === "sw" ? "Salio" : "Credits"}: {tenant.total_credits.toLocaleString()}</span>
                          <span>{language === "sw" ? "Imetumika" : "Used"}: {tenant.used_credits.toLocaleString()}</span>
                          <span>{language === "sw" ? "Haijatumiwa" : "Unused"}: {tenant.unused_credits.toLocaleString()}</span>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {tenant.summary?.total_users
                            ? `${tenant.summary.total_users} ${language === "sw" ? "watumiaji waliorekodiwa" : "users tracked"}`
                            : (language === "sw" ? "Hakuna muhtasari wa watumiaji" : "No user summary")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/30 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  {language === "sw" ? "Sasisha ili kuona muhtasari wa matumizi kwa tenants wote." : "Refresh to see usage insights for all tenants."}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PertinaInsights;


import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

const methodClass = (method: string) => {
  if (method === "GET") return "bg-emerald-200 text-emerald-900 dark:bg-emerald-300 dark:text-emerald-950";
  if (method === "POST") return "bg-blue-600 text-white dark:bg-blue-500";
  if (method === "PUT") return "bg-orange-500 text-white dark:bg-orange-400";
  if (method === "DELETE") return "bg-red-600 text-white dark:bg-red-500";
  return "bg-muted text-foreground border border-border-subtle";
};

type EndpointProps = {
  id?: string;
  method: string;
  path: string;
  description?: string;
  request?: string;
  response?: string;
};

const Endpoint = ({ id, method, path, description, request, response }: EndpointProps) => (
  <article
    id={id}
    className="group relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-gradient-to-b from-card to-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-primary/20 transition-smooth"
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-r from-primary/8 via-transparent to-violet-500/8 opacity-70" />

    <div className="relative">
      <div className="rounded-xl border border-border-subtle/70 bg-muted/30 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span
            className={`inline-flex items-center justify-center min-w-[46px] px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide leading-none shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${methodClass(method)}`}
          >
            {method}
          </span>
          <code className="text-xs sm:text-sm break-all font-semibold text-foreground">{path}</code>
        </div>
      </div>
    </div>

    {description && <p className="mt-3.5 text-sm text-foreground/80 leading-relaxed">{description}</p>}

    {request && (
      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Request</p>
        <pre className="text-xs bg-muted/50 border border-border-subtle/80 rounded-xl p-3 overflow-auto scrollbar-premium whitespace-pre-wrap shadow-inner">
          {request}
        </pre>
      </div>
    )}

    {response && (
      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Sample Response</p>
        <pre className="text-xs bg-zinc-900 text-zinc-100 dark:bg-zinc-950 rounded-xl p-3 overflow-auto scrollbar-premium whitespace-pre-wrap border border-zinc-700/60 dark:border-zinc-800 shadow-inner">
          {response}
        </pre>
      </div>
    )}
  </article>
);

const IntegrationGuide = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={!isMobile || sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto scrollbar-premium p-2 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
            <Card className="glass border border-border-subtle overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 sm:p-6 lg:p-7 bg-gradient-to-br from-primary/10 via-background to-violet-500/10">
                  <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                    Integration Guide & API Reference
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-foreground/80 max-w-4xl">
                    Complete documentation for Normal, Partner, and Pertina integrations with clear request and response examples.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-lg border border-border-subtle bg-card/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-foreground/65">Base URL</p>
                      <code className="text-xs break-all">https://sms.mifumolabs.com</code>
                    </div>
                    <div className="rounded-lg border border-border-subtle bg-card/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-foreground/65">Prefix</p>
                      <code className="text-xs break-all">/api/integration/v1/</code>
                    </div>
                    <div className="rounded-lg border border-border-subtle bg-card/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-foreground/65">Auth Header</p>
                      <code className="text-xs break-all">Authorization: Bearer mif_your_api_key_here</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              <aside className="lg:col-span-3">
                <Card className="glass border border-border-subtle lg:sticky lg:top-4">
                  <CardContent className="p-4 space-y-2.5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/75">On This Page</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-bold pt-1">Normal</p>
                        <a href="#integration-normal" className="group flex items-center justify-between rounded-md border border-blue-200/60 dark:border-blue-800/60 bg-blue-500/5 px-2.5 py-1.5 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Overview</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-status" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Status and info</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-sms" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>SMS and sender IDs</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-campaigns" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Campaigns</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-internal" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Internal API</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-bold pt-1">Partina/Whitelabel</p>
                        <a href="#integration-partina" className="group flex items-center justify-between rounded-md border border-violet-200/60 dark:border-violet-800/60 bg-violet-500/5 px-2.5 py-1.5 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Overview</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-partner" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Partner API</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-pertina" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Pertina API</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <section className="lg:col-span-9 space-y-4 sm:space-y-5">
                <Card id="integration-normal" className="glass border border-blue-200/60 dark:border-blue-800/60">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">Section 1</p>
                      <h2 className="text-lg sm:text-xl font-semibold">Normal (standard) integration</h2>
                      <p className="text-sm text-foreground/80">
                        For a single Mifumo customer sending on their own tenant. Use dashboard API key and omit
                        <code> tenant_account_id </code> in normal SMS send flow.
                      </p>
                    </div>

                    <Endpoint
                      id="ep-status"
                      method="GET"
                      path="/api/integration/v1/status/"
                      description="Health and API status."
                      response={`{
  "success": true,
  "message": "API is operational",
  "data": { "status": "active", "version": "1.0.0" }
}`}
                    />

                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/info/"
                      description="Returns account info, rate limits, and endpoint hints."
                      response={`{
  "success": true,
  "message": "API information retrieved successfully",
  "data": { "account_id": "ABC123XYZ", "api_version": "1.0.0" }
}`}
                    />

                    <h3 id="ep-sms" className="text-base sm:text-lg font-semibold pt-2">SMS - /api/integration/v1/sms/</h3>
                    <Endpoint
                      method="POST"
                      path="/api/integration/v1/sms/send/"
                      description="Send SMS to one or more recipients. For whitelabel, include tenant_account_id."
                      request={`{
  "message": "Hello from Mifumo",
  "recipients": ["+255712345678"],
  "sender_id": "MIFUMO"
}`}
                      response={`{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "message_id": "uuid",
    "successful_sends": 1,
    "failed_sends": 0,
    "total_recipients": 1,
    "status": "sent"
  }
}`}
                    />
                    <Endpoint method="GET" path="/api/integration/v1/sms/status/{message_id}/" description="Check message and delivery details." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/delivery-reports/" description="Query with start_date, end_date, status, page, per_page." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/balance/" description="Fetch tenant SMS balance." />
                    <Endpoint method="POST" path="/api/integration/v1/sms/sender-id/request/" description="Submit sender ID approval request." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/sender-id/requests/" description="List sender ID request statuses." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/sender-id/available/" description="List approved sender IDs." />

                    <h3 id="ep-campaigns" className="text-base sm:text-lg font-semibold pt-2">Campaigns and templates</h3>
                    <Endpoint method="GET" path="/api/integration/v1/campaigns/" description="List campaigns." />
                    <Endpoint method="POST" path="/api/integration/v1/campaigns/create/" description="Create campaign (if enabled)." />
                    <Endpoint method="GET" path="/api/integration/v1/templates/" description="List templates." />
                    <Endpoint method="POST" path="/api/integration/v1/templates/create/" description="Create template (if enabled)." />

                    <h3 id="ep-internal" className="text-base sm:text-lg font-semibold pt-2">Internal API - /api/integration/api/</h3>
                    <Endpoint method="POST" path="/api/integration/api/accounts/" description="Create API account using JWT/session." />
                    <Endpoint method="POST" path="/api/integration/api/accounts/{uuid}/keys/" description="Create API key for an account." />
                    <Endpoint method="POST" path="/api/integration/api/keys/{uuid}/regenerate/" description="Regenerate API key pair." />
                  </CardContent>
                </Card>

                <Card id="integration-partina" className="glass border border-violet-200/60 dark:border-violet-800/60">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold">Section 2</p>
                      <h2 className="text-lg sm:text-xl font-semibold">Partina and whitelabel integration</h2>
                      <p className="text-sm text-foreground/80">
                        Parent/reseller flow for provisioning child tenants, funding accounts, and sending messages on behalf of clients.
                      </p>
                    </div>

                    <h3 id="ep-partner" className="text-base sm:text-lg font-semibold">Partner API - /api/integration/v1/partner/</h3>
                    <Endpoint method="POST" path="/partner/tenants/create/" description="Provision child tenant account." />
                    <Endpoint method="GET" path="/partner/tenants/" description="List tenants with pagination filters." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/" description="Get tenant details." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/balance/" description="Get one tenant balance." />
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/{tenant_id}/credits/"
                      description="Add credits (package_id or direct credits)."
                      request={`{
  "credits": 1000,
  "payment_reference": "EXT-TXN-123",
  "payment_method": "mpesa"
}`}
                    />
                    <Endpoint method="POST" path="/partner/tenants/{tenant_id}/payments/initiate/" description="Initiate package purchase payment." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/payments/{transaction_id}/status/" description="Check payment status." />
                    <Endpoint method="POST" path="/partner/tenants/{tenant_id}/payments/custom/initiate/" description="Initiate custom credit purchase." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/payments/custom/{purchase_id}/status/" description="Check custom payment status." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/payments/history/" description="Get payments history." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/messages/" description="List tenant messages." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/messages/{message_id}/status/" description="Tenant message status." />
                    <Endpoint method="POST" path="/partner/tenants/{tenant_id}/sender-ids/request/" description="Submit sender ID for tenant." />
                    <Endpoint method="GET" path="/partner/tenants/{tenant_id}/sender-ids/requests/" description="Tenant sender ID requests." />
                    <Endpoint method="GET" path="/partner/sender-ids/all/" description="Aggregate sender IDs across all tenants." />
                    <Endpoint method="GET" path="/partner/packages/" description="List package catalog." />
                    <Endpoint method="POST" path="/partner/pricing/calculate/" description="Tier pricing calculator." />

                    <h3 id="ep-pertina" className="text-base sm:text-lg font-semibold">Pertina API - /api/integration/v1/pertina/</h3>
                    <Endpoint method="POST" path="/pertina/tenants/{tenant_id}/credits/purchase/" description="Direct credit purchase for tenant." />
                    <Endpoint method="GET" path="/pertina/tenants/{tenant_id}/balance/" description="Get tenant credits/balance." />
                    <Endpoint method="GET" path="/pertina/tenants/" description="List accessible tenants." />
                    <Endpoint method="GET" path="/pertina/balance/" description="Aggregate balances across tenants." />
                    <Endpoint method="GET" path="/pertina/tenants/{tenant_id}/usage/" description="SMS usage per tenant." />
                    <Endpoint method="GET" path="/pertina/usage/" description="Aggregated usage." />
                    <Endpoint method="GET" path="/pertina/tenants/{tenant_id}/messages/" description="Tenant messages with filters." />
                    <Endpoint method="GET" path="/pertina/messages/" description="Messages across multiple tenants." />
                    <Endpoint method="GET" path="/pertina/user/usage/" description="Usage stats for authenticated user." />
                  </CardContent>
                </Card>
              </section>
            </div>

            <Card className="glass border border-border-subtle">
              <CardContent className="p-4 sm:p-5 text-sm text-foreground/75">
                Examples mirror live integration responses and may vary by provider and tenant permissions. Configure webhooks and API keys from your API dashboard.
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IntegrationGuide;


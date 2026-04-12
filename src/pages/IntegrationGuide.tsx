import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

const methodClass = (method: string) => {
  if (method === "GET") return "bg-emerald-200 text-emerald-900 dark:bg-emerald-300 dark:text-emerald-950";
  if (method === "POST") return "bg-blue-600 text-white dark:bg-blue-500";
  if (method === "PUT") return "bg-orange-500 text-white dark:bg-orange-400";
  if (method === "PATCH") return "bg-amber-500 text-white dark:bg-amber-400";
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
                    External Integration API Reference
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-foreground/80 max-w-4xl">
                    Documentation for standard external users, Partner/Pertina resellers, Auth, Notifications, and AI/Voice Copilots. Excludes internal admin flows.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-lg border border-border-subtle bg-card/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-foreground/65">Base URL</p>
                      <code className="text-xs break-all">https://mifumosms.mifumolabs.com</code>
                    </div>
                    <div className="rounded-lg border border-border-subtle bg-card/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-foreground/65">External Prefix</p>
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
                          <span>Status & info</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-sms" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Send SMS</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-senderid" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Sender IDs</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-campaigns" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Campaigns</span>
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
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-bold pt-1">Auth & Notifications</p>
                        <a href="#integration-auth" className="group flex items-center justify-between rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-500/5 px-2.5 py-1.5 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Authentication</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-notifications" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Notifications</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-indigo-700 dark:text-indigo-300 font-bold pt-1">AI & Voice</p>
                        <a href="#integration-copilots" className="group flex items-center justify-between rounded-md border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-500/5 px-2.5 py-1.5 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>AI Copilots</span>
                          <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                        </a>
                        <a href="#ep-voice-copilots" className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-2.5 py-1.5 text-foreground/90 font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast">
                          <span>Voice Copilots</span>
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
                      <h2 className="text-lg sm:text-xl font-semibold">External User Integration (v1)</h2>
                      <p className="text-sm text-foreground/80">
                        For standard external users sending on their own account. All requests require{" "}
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer mif_your_api_key_here</code>.
                        Do not use <code className="text-xs bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> — it is not supported on these endpoints.
                      </p>
                    </div>

                    {/* Response format */}
                    <div className="rounded-xl border border-border-subtle/80 bg-muted/30 p-4 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60">Standard Response Envelope</p>
                      <pre className="text-xs bg-zinc-900 text-zinc-100 rounded-xl p-3 overflow-auto whitespace-pre-wrap border border-zinc-700/60">{`{
  "success": true,
  "timestamp": "2026-04-09T10:30:00+03:00",
  "message": "Human readable message",
  "data": {}
}`}</pre>
                      <p className="text-xs text-foreground/60">On errors, an <code>error_code</code> field is included alongside <code>"success": false</code>.</p>
                    </div>

                    {/* Auth errors */}
                    <div className="rounded-xl border border-rose-200/70 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">Authentication Errors (401)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {[
                          ["AUTHENTICATION_REQUIRED", "Missing Authorization header"],
                          ["INVALID_AUTH_FORMAT", "Header doesn't start with Bearer"],
                          ["INVALID_API_KEY", "Key is not valid"],
                          ["API_KEY_NOT_FOUND", "Key doesn't exist"],
                          ["API_KEY_EXPIRED", "Key has expired"],
                          ["API_KEY_REVOKED", "Key was revoked"],
                        ].map(([code, desc]) => (
                          <div key={code} className="flex items-start gap-2 text-xs">
                            <code className="shrink-0 text-rose-700 dark:text-rose-400 font-semibold">{code}</code>
                            <span className="text-foreground/70">— {desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h3 id="ep-status" className="text-base sm:text-lg font-semibold pt-2">Status & Info</h3>
                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/status/"
                      description="Health check. Confirms the API is operational and returns the current version."
                      response={`{
  "success": true,
  "message": "API is operational",
  "data": {
    "status": "active",
    "version": "1.0.0",
    "timestamp": "2026-04-09T10:30:00+03:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/info/"
                      description="Account-level API information, rate limits, and endpoint hints."
                    />

                    <h3 id="ep-sms" className="text-base sm:text-lg font-semibold pt-2">SMS — /api/integration/v1/sms/</h3>
                    <Endpoint
                      method="POST"
                      path="/api/integration/v1/sms/send/"
                      description="Send SMS to one or more recipients. recipients must be in international format (+255...). sender_id and schedule_time are optional."
                      request={`{
  "recipients": ["+255614853618"],
  "message": "Hello from API",
  "sender_id": "Mifumosms",
  "schedule_time": "2026-04-10T08:00:00+03:00"
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
                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/sms/status/{message_id}/"
                      description="Retrieve status and delivery details for a sent message. Requires Bearer auth — do not use X-API-Key."
                    />
                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/sms/delivery-reports/"
                      description="Query delivery reports. Optional query params: start_date, end_date, status, page (default 1), per_page (default 50, max 100)."
                    />
                    <Endpoint
                      method="GET"
                      path="/api/integration/v1/sms/balance/"
                      description="Get SMS credit balance for the authenticated account."
                    />

                    <h3 id="ep-senderid" className="text-base sm:text-lg font-semibold pt-2">Sender ID Management</h3>
                    <Endpoint
                      method="POST"
                      path="/api/integration/v1/sms/sender-id/request/"
                      description="Submit a sender ID approval request. Accepts requested_sender_id or sender_name. Accepts sample_content or message for the use-case description."
                      request={`{
  "requested_sender_id": "MyBrand1",
  "request_type": "custom",
  "sample_content": "Sample message content for marketing campaigns"
}`}
                    />
                    <Endpoint method="GET" path="/api/integration/v1/sms/sender-id/requests/" description="List all sender ID requests and their current statuses." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/sender-id/requests/{request_id}/" description="Get details of a specific sender ID request." />
                    <Endpoint method="GET" path="/api/integration/v1/sms/sender-id/available/" description="List all approved and active sender IDs for this account." />

                    {/* Error codes */}
                    <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2 mt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Other Error Codes to Handle</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {[
                          ["MISSING_MESSAGE (400)", "message field is required"],
                          ["MISSING_RECIPIENTS (400)", "recipients array is required"],
                          ["INVALID_PHONE_FORMAT (400)", "Phone not in international format"],
                          ["TOO_MANY_RECIPIENTS (400)", "Batch size exceeds allowed limit"],
                          ["INSUFFICIENT_CREDITS (400)", "Not enough SMS credits"],
                          ["SENDER_ID_NOT_APPROVED (400)", "Sender ID pending approval"],
                          ["SENDER_ID_NOT_REGISTERED (400)", "Sender ID not registered"],
                          ["MESSAGE_NOT_FOUND (404)", "message_id does not exist"],
                        ].map(([code, desc]) => (
                          <div key={code} className="flex items-start gap-2 text-xs">
                            <code className="shrink-0 text-amber-700 dark:text-amber-400 font-semibold">{code}</code>
                            <span className="text-foreground/70">— {desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h3 id="ep-campaigns" className="text-base sm:text-lg font-semibold pt-2">Campaigns & Templates</h3>
                    <Endpoint method="GET" path="/api/integration/v1/campaigns/" description="List campaigns for this account." />
                    <Endpoint method="POST" path="/api/integration/v1/campaigns/create/" description="Create a new campaign (if enabled for this account)." />
                    <Endpoint method="GET" path="/api/integration/v1/templates/" description="List message templates." />
                    <Endpoint method="POST" path="/api/integration/v1/templates/create/" description="Create a new template (if enabled for this account)." />
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

                {/* ── Authentication ─────────────────────────── */}
                <Card id="integration-auth" className="glass border border-emerald-200/60 dark:border-emerald-800/60">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">Section 3</p>
                      <h2 className="text-lg sm:text-xl font-semibold">Authentication</h2>
                      <p className="text-sm text-foreground/80">
                        JWT-based auth. Login returns <code>access</code> + <code>refresh</code> tokens. Pass <code>Authorization: Bearer &lt;access_token&gt;</code> on all protected requests.
                      </p>
                    </div>

                    <Endpoint method="POST" path="/api/auth/login/" description="Login with email and password. Returns access and refresh tokens."
                      request={`{ "email": "user@example.com", "password": "yourpassword" }`}
                      response={`{
  "success": true,
  "tokens": { "access": "<jwt_access>", "refresh": "<jwt_refresh>" },
  "user": { "id": "uuid", "email": "user@example.com" }
}`} />
                    <Endpoint method="POST" path="/api/auth/token/refresh/" description="Refresh expired access token using refresh token."
                      request={`{ "refresh": "<jwt_refresh_token>" }`} />
                    <Endpoint method="POST" path="/api/auth/logout/" description="Invalidate current session / token." />
                    <Endpoint method="POST" path="/api/auth/register/" description="Create new user account." request={`{ "email": "user@example.com", "password": "...", "full_name": "John Doe" }`} />
                    <Endpoint method="GET" path="/api/auth/profile/" description="Get authenticated user profile." />
                    <Endpoint method="GET" path="/api/auth/activate-account/{token}/" description="Activate account with 6-digit verification code or token." />
                    <Endpoint method="POST" path="/api/auth/resend-activation/" description="Resend activation code — tries SMS first, falls back to email." />
                    <Endpoint method="POST" path="/api/auth/forgot-password/" description="Send password reset link to email." request={`{ "email": "user@example.com" }`} />
                    <Endpoint method="POST" path="/api/auth/password/change/" description="Change password for authenticated user." request={`{ "old_password": "...", "new_password": "..." }`} />
                    <Endpoint method="POST" path="/api/auth/password/reset/" description="Reset password using token from email." />
                    <Endpoint method="POST" path="/api/auth/api-key/generate/" description="Generate an API key for the current user." />
                    <Endpoint method="POST" path="/api/auth/api-key/revoke/" description="Revoke the current API key." />
                    <Endpoint method="POST" path="/api/auth/keys/create/" description="Create a named API key." request={`{ "name": "My Key", "description": "Optional" }`} />
                    <Endpoint method="POST" path="/api/auth/keys/{key_id}/regenerate/" description="Regenerate a specific named API key." />
                    <Endpoint method="POST" path="/api/auth/keys/{key_id}/revoke/" description="Revoke a specific named API key." />
                    <Endpoint method="GET" path="/api/auth/lookup/users/" description="Admin — lookup users by email or phone." />

                    <h3 id="ep-notifications" className="text-base sm:text-lg font-semibold pt-2">Notifications — /api/v1/notifications</h3>
                    <p className="text-sm text-foreground/80">In-app notification system. All endpoints require authentication.</p>
                    <Endpoint method="GET" path="/api/v1/notifications" description="List all notifications for the authenticated user." />
                    <Endpoint method="POST" path="/api/v1/notifications" description="Create a notification." request={`{ "title": "...", "body": "...", "type": "info" }`} />
                    <Endpoint method="GET" path="/api/v1/notifications/{pk}/" description="Get single notification by ID." />
                    <Endpoint method="PATCH" path="/api/v1/notifications/{pk}/" description="Partially update a notification." />
                    <Endpoint method="PUT" path="/api/v1/notifications/{pk}/" description="Full update of a notification." />
                    <Endpoint method="DELETE" path="/api/v1/notifications/{pk}/" description="Delete a notification." />
                    <Endpoint method="POST" path="/api/v1/notifications/{notification_id}/mark-read/" description="Mark a single notification as read." />
                    <Endpoint method="POST" path="/api/v1/notifications/mark-all-read/" description="Mark all notifications as read." />
                    <Endpoint method="GET" path="/api/v1/notifications/unread-count/" description="Get count of unread notifications."
                      response={`{ "data": { "unread_count": 5 } }`} />
                    <Endpoint method="GET" path="/api/v1/notifications/recent/" description="Get most recent notifications (last 10–20)." />
                    <Endpoint method="GET" path="/api/v1/notifications/real/" description="Get live/real-time notifications." />
                    <Endpoint method="GET" path="/api/v1/notifications/stats/" description="Notification statistics (total, unread, by type)." />
                    <Endpoint method="GET" path="/api/v1/notifications/templates/" description="List notification templates." />
                    <Endpoint method="GET" path="/api/v1/notifications/settings/" description="Get user notification preferences." />
                    <Endpoint method="PATCH" path="/api/v1/notifications/settings/" description="Update notification preferences." request={`{ "email_enabled": true, "sms_enabled": false }`} />
                    <Endpoint method="GET" path="/api/revenue-overview/" description="Revenue overview data for the dashboard." />
                    <Endpoint method="GET" path="/api/v1/senderidrequest-callback/" description="Callback endpoint for sender ID request status updates." />
                    <Endpoint method="GET" path="/api/v1/zenopay-status/" description="Check Zenopay payment gateway status." />
                  </CardContent>
                </Card>

                {/* ── AI & Voice Copilots ─────────────────────── */}
                <Card id="integration-copilots" className="glass border border-indigo-200/60 dark:border-indigo-800/60">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300 font-semibold">Section 4</p>
                      <h2 className="text-lg sm:text-xl font-semibold">AI Copilots & Voice Copilots</h2>
                      <p className="text-sm text-foreground/80">
                        Early access features. All endpoints require <code>Authorization: Bearer &lt;access_token&gt;</code>. The waitlist endpoint also accepts unauthenticated requests with a KYC file.
                      </p>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold pt-2">AI Copilots — /api/early-access/ai-copilots/</h3>
                    <Endpoint method="GET" path="/api/early-access/ai-copilots/status/" description="Check if the authenticated user has AI Copilot access or is on the waitlist."
                      response={`{
  "data": {
    "has_access": true,
    "status": "approved"
  }
}`} />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/waitlist/" description="Join the AI Copilot waitlist. Send as multipart/form-data."
                      request={`product=ai_copilots
full_name=John Doe
email=john@example.com
phone=+255700000000
kyc_file=<file: pdf/png/jpg>`} />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/create/" description="Create a new AI copilot. Returns an id or chatbot_id used in all subsequent calls."
                      request={`{
  "name": "Kuza Sales Copilot",
  "business": "My Company Ltd",
  "industry": "Retail",
  "language": "en",
  "tone": "Friendly",
  "channel": "SMS",
  "intent": "Help customers check prices and place orders."
}`}
                      response={`{
  "id": "abc123",
  "chatbot_id": "abc123",
  "name": "Kuza Sales Copilot",
  "status": "draft"
}`} />
                    <Endpoint method="GET" path="/api/early-access/ai-copilots/" description="List all AI copilots for the authenticated user." />
                    <Endpoint method="GET" path="/api/early-access/ai-copilots/{id}/" description="Get full details of a specific AI copilot." />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/{id}/flow/" description="Save the conversation flow JSON for a copilot."
                      request={`{
  "flow": {
    "states": [
      {
        "id": "START",
        "message": "Hello! How can I help you today?",
        "options": [
          { "id": "opt1", "label": "Check prices", "nextStateId": "PRICES" }
        ]
      }
    ]
  }
}`} />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/{id}/simulate/" description="Run a test simulation of the flow starting from the START step."
                      request={`{
  "flow": { "states": [...] },
  "start_state": "START"
}`}
                      response={`{
  "result": "Simulation passed",
  "steps_executed": 3,
  "path": ["START", "PRICES", "END"]
}`} />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/{id}/deploy/" description="Deploy the copilot to production after flow validation passes."
                      request={`{ "flow": { "states": [...] } }`}
                      response={`{
  "message": "Deployed successfully",
  "webhook_url": "https://mifumosms.mifumolabs.com/hooks/copilot/abc123"
}`} />
                    <Endpoint method="POST" path="/api/early-access/ai-copilots/{id}/webhooks/{action}/" description="Webhook fired when a specific flow step is reached. action can be: sales-lead, support-ticket, booking-request, or any custom name." />

                    <h3 id="ep-voice-copilots" className="text-base sm:text-lg font-semibold pt-4">Voice Copilots — /api/early-access/voice-copilots/</h3>
                    <Endpoint method="GET" path="/api/early-access/voice-copilots/status/" description="Check if the authenticated user has Voice Copilot access or is on the waitlist."
                      response={`{
  "data": {
    "has_access": false,
    "status": "pending"
  }
}`} />
                    <Endpoint method="POST" path="/api/early-access/voice-copilots/waitlist/" description="Join the Voice Copilot waitlist. Send as multipart/form-data."
                      request={`product=voice_copilots
full_name=John Doe
email=john@example.com
phone=+255700000000
kyc_file=<file: pdf/png/jpg>`} />
                    <Endpoint method="GET" path="/api/early-access/voice-copilots/features/" description="Optional — return dynamic feature card titles, descriptions, and perk list for the UI."
                      response={`{
  "data": {
    "perks": [
      "Free access during private beta",
      "Direct line to the product team"
    ],
    "features": [
      { "title": "Voice Dashboard", "desc": "Custom description override" }
    ]
  }
}`} />
                    <Endpoint method="POST" path="/api/early-access/voice-copilots/create/" description="Create a new voice copilot." request={`{ "name": "...", "language": "en", "voice": "female", "channel": "inbound" }`} />
                    <Endpoint method="GET" path="/api/early-access/voice-copilots/" description="List all voice copilots for the authenticated user." />
                    <Endpoint method="GET" path="/api/early-access/voice-copilots/{id}/" description="Get full details of a specific voice copilot." />
                    <Endpoint method="POST" path="/api/early-access/voice-copilots/{id}/deploy/" description="Deploy the voice copilot to production." />
                    <Endpoint method="GET" path="/api/early-access/voice-copilots/{id}/call-logs/" description="Retrieve call recordings, transcripts, and metadata for a voice copilot." />
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


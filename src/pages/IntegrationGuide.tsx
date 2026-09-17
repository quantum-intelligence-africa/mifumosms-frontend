import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronRight } from "lucide-react";
import { ApiSandbox } from "@/components/integration-guide/ApiSandbox";

const methodClass = (method: string) => {
  if (method === "GET") return "bg-emerald-200 text-emerald-900 dark:bg-emerald-300 dark:text-emerald-950";
  if (method === "POST") return "bg-blue-600 text-white dark:bg-blue-500";
  if (method === "PUT") return "bg-orange-500 text-white dark:bg-orange-400";
  if (method === "PATCH") return "bg-amber-500 text-white dark:bg-amber-400";
  if (method === "DELETE") return "bg-red-600 text-white dark:bg-red-500";
  return "bg-muted text-foreground border border-border-subtle";
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 absolute top-2 right-2 text-foreground/50 hover:text-foreground"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

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
        <div className="relative">
          <pre className="text-xs bg-muted/50 border border-border-subtle/80 rounded-xl p-3 pr-9 overflow-auto scrollbar-premium whitespace-pre-wrap shadow-inner">
            {request}
          </pre>
          <CopyButton text={request} />
        </div>
      </div>
    )}

    {response && (
      <details className="group mt-4 space-y-1.5">
        <summary className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="w-3 h-3 flex-shrink-0 transition-transform duration-150 group-open:rotate-90" strokeWidth={2.5} />
          Sample Response
        </summary>
        <div className="relative mt-1.5">
          <pre className="text-xs bg-zinc-900 text-zinc-100 dark:bg-zinc-950 rounded-xl p-3 pr-9 overflow-auto scrollbar-premium whitespace-pre-wrap border border-zinc-700/60 dark:border-zinc-800 shadow-inner">
            {response}
          </pre>
          <CopyButton text={response} />
        </div>
      </details>
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-primary/10 via-background to-primary/10 dark:from-primary/15 dark:via-background dark:to-primary/15">
      <AppSidebar isOpen={!isMobile || sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-premium px-3 sm:px-5 pt-3 sm:pt-4 pb-6">
          <div className="max-w-7xl mx-auto w-full space-y-3 sm:space-y-3.5">
            <Card className="glass border border-border-subtle overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-primary/10 via-background to-violet-500/10">
                  <h1 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
                    External Integration API Reference
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-foreground/80 max-w-4xl">
                    Documentation for standard external users, Partner/Pertina resellers, and AI/Voice Copilots. Excludes internal admin flows.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

            <ApiSandbox />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5">
              <aside className="lg:col-span-3">
                <Card className="glass border border-border-subtle lg:sticky lg:top-4">
                  <CardContent className="p-3 space-y-2.5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/75">On This Page</h2>
                    <a href="#integration-sandbox" className="group flex items-center justify-between rounded-md border border-teal-200/60 dark:border-teal-800/60 bg-teal-500/5 px-2.5 py-1.5 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-fast text-sm">
                      <span>✦ Live Sandbox</span>
                      <span className="text-xs text-foreground/45 group-hover:text-primary/80">↗</span>
                    </a>
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

              <section className="lg:col-span-9 space-y-3 sm:space-y-3.5">
                <Card id="integration-normal" className="glass border border-blue-200/60 dark:border-blue-800/60">
                  <CardContent className="p-3 sm:p-4 space-y-3">
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
                      <div className="relative">
                        <pre className="text-xs bg-zinc-900 text-zinc-100 rounded-xl p-3 pr-9 overflow-auto whitespace-pre-wrap border border-zinc-700/60">{`{
  "success": true,
  "timestamp": "2026-04-09T10:30:00+03:00",
  "message": "Human readable message",
  "data": {}
}`}</pre>
                        <CopyButton text={`{
  "success": true,
  "timestamp": "2026-04-09T10:30:00+03:00",
  "message": "Human readable message",
  "data": {}
}`} />
                      </div>
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
    "status": "sent",
    "cost": 18.0,
    "currency": "TZS",
    "provider": "beem"
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
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold">Section 2</p>
                      <h2 className="text-lg sm:text-xl font-semibold">Partina and whitelabel integration</h2>
                      <p className="text-sm text-foreground/80">
                        Parent/reseller flow for provisioning child tenants, funding accounts, and sending messages on behalf of clients.
                      </p>
                    </div>

                    <p className="text-xs text-foreground/60 -mt-1">
                      Every Partner/Pertina response uses the same envelope: <code className="text-[11px] bg-muted px-1 py-0.5 rounded">{`{ success, timestamp, data, message }`}</code> (errors add <code className="text-[11px] bg-muted px-1 py-0.5 rounded">error_code</code>/<code className="text-[11px] bg-muted px-1 py-0.5 rounded">detail</code> instead of <code className="text-[11px] bg-muted px-1 py-0.5 rounded">data</code>).
                      <strong className="text-foreground/80"> Partner API accepts an API key only</strong> (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">Bearer mif_...</code>); <strong className="text-foreground/80">Pertina API accepts an API key or a JWT</strong>. <code className="text-[11px] bg-muted px-1 py-0.5 rounded">tenant_id</code> is always the Tenant UUID — tenants provisioned this way never get their own API key.
                    </p>

                    <h3 id="ep-partner" className="text-base sm:text-lg font-semibold">Partner API - /api/integration/v1/partner/</h3>
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/create/"
                      description="Provision a child tenant account. Required: tenant_name, owner_email. If a tenant with the same name already exists under this parent, returns 200 with 'Tenant already exists' instead of creating a duplicate."
                      request={`{
  "tenant_name": "Acme Traders Ltd",
  "owner_email": "owner@acmetraders.co.tz",
  "owner_name": "Jane Mwakasege",
  "contact_phone": "+255744123456",
  "initial_credits": 0
}`}
                      response={`{
  "success": true,
  "timestamp": "2026-09-17T10:30:00+03:00",
  "message": "Tenant account created successfully",
  "data": {
    "mifumo_account_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "mifumo_api_key": null,
    "tenant_name": "Acme Traders Ltd",
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "sms_balance": 0,
    "owner_email": "owner@acmetraders.co.tz",
    "created_at": "2026-09-17T10:30:00.123456+00:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/"
                      description="List tenants. Query params: status (active|inactive), search, page (default 1), page_size (default 50, max 100)."
                      response={`{
  "success": true,
  "message": "Tenants retrieved successfully",
  "data": {
    "tenants": [
      {
        "mifumo_account_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
        "mifumo_api_key": null,
        "tenant_name": "Acme Traders Ltd",
        "business_name": "Acme Traders Ltd",
        "sms_balance": 4200,
        "owner_email": "owner@acmetraders.co.tz",
        "contact_phone": "+255744123456",
        "status": "active",
        "created_at": "2026-09-01T08:00:00+00:00",
        "updated_at": "2026-09-15T12:00:00+00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 50,
    "total_pages": 1
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/"
                      description="Get one tenant's full details and balance."
                      response={`{
  "success": true,
  "message": "Client account and balance retrieved successfully",
  "data": {
    "mifumo_account_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "business_name": "Acme Traders Ltd",
    "client_account_id": "ACC-000123",
    "sms_balance": 4200,
    "balance_last_updated": "2026-09-16T09:12:00+00:00",
    "total_purchased": 10000,
    "total_used": 5800,
    "owner_email": "owner@acmetraders.co.tz",
    "contact_phone": "+255744123456",
    "status": "active",
    "created_at": "2026-09-01T08:00:00+00:00",
    "updated_at": "2026-09-15T12:00:00+00:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/balance/"
                      description="Get one tenant's SMS balance. Optional query param: account_id (your own APIAccount.account_id, for a mismatch check — 403 if it doesn't match your key)."
                      response={`{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "mifumo_account_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "client_account_id": "ACC-000123",
    "sms_balance": 4200,
    "balance_last_updated": "2026-09-16T09:12:00+00:00",
    "total_purchased": 10000,
    "total_used": 5800
  }
}`}
                    />
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/{tenant_id}/credits/"
                      description="Add credits directly (no payment gateway). Two mutually-exclusive modes: raw 'credits', or 'package_id' (pricing/credits pulled from the SMSPackage). Replay-safe only in package_id mode: reusing the same payment_reference/transaction_id on a completed purchase returns idempotent_replay: true instead of double-crediting. currency defaults to 'USD' (not TZS) when omitted."
                      request={`{
  "package_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "payment_reference": "EXT-TXN-123",
  "transaction_id": "ext-txn-789",
  "payment_method": "mpesa",
  "amount_paid": 18000.00,
  "currency": "TZS",
  "notes": "Payment via external system"
}`}
                      response={`{
  "success": true,
  "message": "Successfully added 1000 credits to account. New balance: 5200 credits",
  "data": {
    "mifumo_account_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "credits_added": 1000,
    "previous_balance": 4200,
    "new_balance": 5200,
    "payment_reference": "EXT-TXN-123",
    "invoice_number": "EXT-20260917-A1B2C3D4",
    "idempotent_replay": false,
    "idempotency_supported": true,
    "package": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Standard Package",
      "package_type": "standard",
      "price": 14000.00,
      "unit_price": 14.00
    }
  }
}`}
                    />
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/{tenant_id}/payments/initiate/"
                      description="Start a real ZenoPay mobile-money payment for a package. Required: package_id, buyer_email, buyer_name, buyer_phone (must start with 07 or 06). Optional: mobile_money_provider (default 'vodacom')."
                      request={`{
  "package_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "buyer_email": "customer@example.com",
  "buyer_name": "John Doe",
  "buyer_phone": "0744963858",
  "mobile_money_provider": "vodacom"
}`}
                      response={`{
  "success": true,
  "message": "Payment initiated successfully. Customer should complete payment on their mobile device.",
  "data": {
    "transaction_id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    "order_id": "ORD1726567890AB",
    "invoice_number": "INV-20260917-1A2B3C4D",
    "amount": 14000.00,
    "currency": "TZS",
    "credits": 1000,
    "status": "pending",
    "mobile_money_provider": "vodacom",
    "payment_instructions": "Please enter your PIN to complete payment",
    "reference": "ZP-REF-98765",
    "package": { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "Standard Package", "credits": 1000, "price": 14000.00, "unit_price": 14.00 },
    "buyer": { "name": "John Doe", "email": "customer@example.com", "phone": "0744963858" }
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/payments/{transaction_id}/status/"
                      description="Poll a ZenoPay payment's status."
                      response={`// status: "completed"
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "transaction_id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    "order_id": "ORD1726567890AB",
    "status": "completed",
    "payment_status": "COMPLETED",
    "amount": 14000.00,
    "currency": "TZS",
    "credits": 1000,
    "credits_added": true,
    "zenopay_reference": "ZP-REF-98765",
    "zenopay_transid": "TXN998877",
    "updated_at": "2026-09-17T10:05:00+00:00"
  }
}

// status: "pending"
{ "success": true, "message": "Payment is pending", "data": { "transaction_id": "b2c3d4e5-...", "status": "pending", "payment_status": "PENDING", "amount": 14000.00, "credits_added": false } }

// status: "failed" (HTTP 400)
{ "success": false, "message": "Payment failed or was cancelled", "error_code": "PAYMENT_FAILED", "data": { "transaction_id": "b2c3d4e5-...", "status": "failed", "payment_status": "FAILED", "amount": 14000.00, "credits_added": false } }`}
                    />
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/{tenant_id}/payments/custom/initiate/"
                      description="Same as payments/initiate/ but for an arbitrary credit amount (min 1000) instead of a fixed package — priced off the tier table (1-49,999 @ 18/credit 'Lite', 50,000-149,999 @ 14/credit 'Standard', 250,000+ @ 12/credit 'Pro'; note 150,000-249,999 falls in an uncovered gap in the pricing code)."
                      request={`{
  "credits": 5000,
  "buyer_email": "customer@example.com",
  "buyer_name": "John Doe",
  "buyer_phone": "0744963858",
  "mobile_money_provider": "vodacom"
}`}
                      response={`{
  "success": true,
  "message": "Custom SMS purchase initiated successfully. Customer should complete payment on their mobile device.",
  "data": {
    "purchase_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "transaction_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "order_id": "ORD1726567999CD",
    "invoice_number": "INV-20260917-5E6F7A8B",
    "credits": 5000,
    "unit_price": 18.00,
    "total_price": 90000.00,
    "active_tier": "Lite",
    "tier_min_credits": 1,
    "tier_max_credits": 49999,
    "status": "processing",
    "mobile_money_provider": "vodacom",
    "payment_instructions": "Please enter your PIN to complete payment",
    "reference": "ZP-REF-11223",
    "buyer": { "name": "John Doe", "email": "customer@example.com", "phone": "0744963858" }
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/payments/custom/{purchase_id}/status/"
                      description="Poll a custom (tiered) purchase's status. Pending/failed shapes mirror payments/{transaction_id}/status/ above."
                      response={`{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "purchase_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "transaction_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    "status": "completed",
    "payment_status": "COMPLETED",
    "credits": 5000,
    "unit_price": 18.00,
    "total_price": 90000.00,
    "active_tier": "Lite",
    "credits_added": true,
    "zenopay_reference": "ZP-REF-11223",
    "updated_at": "2026-09-17T10:10:00+00:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/payments/history/"
                      description="Paginated payment history for a tenant. Query params: status (pending|completed|failed|cancelled), limit (default 50, max 100), offset (default 0)."
                      response={`{
  "success": true,
  "message": "Retrieved 1 payment transactions",
  "data": {
    "total": 1,
    "count": 1,
    "limit": 50,
    "offset": 0,
    "transactions": [
      {
        "transaction_id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
        "order_id": "ORD1726567999CD",
        "invoice_number": "INV-20260917-5E6F7A8B",
        "type": "custom_purchase",
        "credits": 5000,
        "unit_price": 18.00,
        "total_price": 90000.00,
        "active_tier": "Lite",
        "status": "completed",
        "payment_status": "COMPLETED",
        "payment_method": "zenopay_mobile_money",
        "mobile_money_provider": "vodacom",
        "zenopay_reference": "ZP-REF-11223",
        "credits_added": true,
        "credits_added_at": "2026-09-17T10:10:05+00:00",
        "buyer": { "name": "John Doe", "email": "customer@example.com", "phone": "0744963858" },
        "created_at": "2026-09-17T10:00:00+00:00",
        "completed_at": "2026-09-17T10:10:05+00:00",
        "failed_at": null
      }
    ]
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/messages/"
                      description="List a tenant's SMS messages. Query params: status, limit (default 50), offset (default 0), from_date, to_date (ISO). Note: cost_currency inside sms_details defaults to 'USD' even though pricing elsewhere is TZS."
                      response={`{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "total": 42,
    "successful": 38,
    "failed": 2,
    "stats": { "queued": 2, "sent": 10, "delivered": 28, "failed": 2 },
    "limit": 50,
    "offset": 0,
    "messages": [
      {
        "message_id": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
        "status": "delivered",
        "recipient_number": "+255744963858",
        "content": "Your order #1234 has shipped.",
        "created_at": "2026-09-17T09:00:00+03:00",
        "sent_at": "2026-09-17T09:00:02+03:00",
        "delivered_at": "2026-09-17T09:00:10+03:00",
        "sms_details": { "sender_id": "ACMESHOP", "provider_message_id": "PMID-556677", "cost_amount": "18.00", "cost_currency": "USD" }
      }
    ]
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/messages/{message_id}/status/"
                      description="Status and delivery timestamps for a single message."
                      response={`{
  "success": true,
  "message": "Message status retrieved successfully",
  "data": {
    "message_id": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "status": "delivered",
    "created_at": "2026-09-17T09:00:00+00:00",
    "updated_at": "2026-09-17T09:00:10+00:00",
    "sent_at": "2026-09-17T09:00:02+00:00",
    "delivered_at": "2026-09-17T09:00:10+00:00",
    "failed_at": null,
    "recipient_number": "+255744963858",
    "content": "Your order #1234 has shipped.",
    "sms_details": { "sender_id": "ACMESHOP", "provider_message_id": "PMID-556677", "cost_amount": "18.00", "cost_currency": "USD" }
  }
}`}
                    />
                    <Endpoint
                      method="POST"
                      path="/partner/tenants/{tenant_id}/sender-ids/request/"
                      description="Submit a sender ID for review. Accepts JSON or multipart/form-data (for KYC uploads via a repeatable kyc_documents file field, PDF/image/doc/txt, max 8MB each). Required: sender_id. If the same sender_id already exists for this tenant, returns 200 (not 201) with its current status instead of creating a duplicate."
                      request={`{
  "sender_id": "ACMESHOP",
  "use_case": "Order confirmations and delivery updates for our customers",
  "sender_name_purpose": "E-commerce order notifications",
  "callback_url": "https://partner.example.com/webhooks/sender-id-status"
}`}
                      response={`{
  "success": true,
  "message": "Sender ID request submitted successfully. It will be reviewed by our team.",
  "data": {
    "request_id": "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    "sender_id": "ACMESHOP",
    "status": "pending",
    "use_case": "Order confirmations and delivery updates for our customers",
    "created_at": "2026-09-17T10:20:00+00:00",
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "callback_url": "https://partner.example.com/webhooks/sender-id-status",
    "kyc_documents_count": 0
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/tenants/{tenant_id}/sender-ids/requests/"
                      description="List a tenant's sender ID requests. Query param: status (pending|approved|rejected)."
                      response={`{
  "success": true,
  "message": "Retrieved 1 sender ID requests for tenant",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "requests": [
      {
        "request_id": "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
        "sender_id": "ACMESHOP",
        "status": "approved",
        "use_case": "Order confirmations and delivery updates for our customers",
        "created_at": "2026-09-17T10:20:00+00:00",
        "reviewed_at": "2026-09-17T11:00:00+00:00",
        "rejection_reason": null,
        "request_type": "custom",
        "callback_url": "https://partner.example.com/webhooks/sender-id-status"
      }
    ],
    "total": 1
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/sender-ids/all/"
                      description="Aggregate sender ID requests across every tenant of this parent account (no tenant_id in the URL). Query param: status."
                      response={`{
  "success": true,
  "message": "Retrieved 2 sender names for all tenants of parent account",
  "data": {
    "requests": [
      {
        "request_id": "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
        "sender_id": "ACMESHOP",
        "status": "approved",
        "use_case": "Order confirmations and delivery updates",
        "created_at": "2026-09-17T10:20:00+00:00",
        "reviewed_at": "2026-09-17T11:00:00+00:00",
        "rejection_reason": null,
        "request_type": "custom",
        "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
        "tenant_name": "Acme Traders Ltd",
        "callback_url": "https://partner.example.com/webhooks/sender-id-status"
      }
    ],
    "total": 2,
    "requested_by": { "user_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "user_email": "partner@example.com", "account_id": "ACC-000123" }
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/partner/packages/"
                      description="List active SMS packages (lite/standard/pro/enterprise)."
                      response={`{
  "success": true,
  "message": "Found 1 available SMS packages",
  "data": {
    "packages": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Lite Package",
        "package_type": "lite",
        "credits": 10000,
        "price": 180000.00,
        "unit_price": 18.00,
        "is_popular": false,
        "is_active": true,
        "features": ["Basic support", "Standard delivery"],
        "savings_percentage": 40.0,
        "subtitle": "1 to 49,999 SMS",
        "default_sender_id": "TAARIFA-SMS",
        "sender_id_restriction": "any",
        "created_at": "2025-06-01T00:00:00+00:00",
        "updated_at": "2025-06-01T00:00:00+00:00"
      }
    ],
    "total_packages": 1
  }
}`}
                    />
                    <Endpoint
                      method="POST"
                      path="/partner/pricing/calculate/"
                      description="Calculate price for an arbitrary credit amount using the tier table. Required: credits (int, minimum 1000)."
                      request={`{ "credits": 5000 }`}
                      response={`{
  "success": true,
  "message": "Pricing calculated for 5000 SMS credits",
  "data": {
    "credits": 5000,
    "unit_price": 18.00,
    "total_price": 90000.00,
    "active_tier": "Lite",
    "tier_min_credits": 1,
    "tier_max_credits": 49999,
    "savings_percentage": 40.0,
    "pricing_tiers": [
      { "tier": "Lite", "min_credits": 1, "max_credits": 49999, "unit_price": 18.00, "description": "1 to 49,999 SMS" },
      { "tier": "Standard", "min_credits": 50000, "max_credits": 149999, "unit_price": 14.00, "description": "50,000 to 149,999 SMS" },
      { "tier": "Pro", "min_credits": 250000, "max_credits": null, "unit_price": 12.00, "description": "250,000 SMS and above" }
    ],
    "currency": "TZS"
  }
}`}
                    />

                    <h3 id="ep-pertina" className="text-base sm:text-lg font-semibold pt-2">Pertina API - /api/integration/v1/pertina/</h3>
                    <p className="text-sm text-foreground/80">
                      Auth accepts an API key or a JWT. The three "all tenants" list endpoints below (balance/usage/messages with no tenant_id)
                      switch their response shape based on how many tenants actually match — a caller with exactly one tenant gets the single-tenant
                      shape even from the no-tenant-id URL, not the array-wrapped one.
                    </p>
                    <Endpoint
                      method="POST"
                      path="/pertina/tenants/{tenant_id}/credits/purchase/"
                      description="Add credits directly — no payment gateway involved. Required: credits (int, minimum 100)."
                      request={`{ "credits": 5000 }`}
                      response={`{
  "success": true,
  "message": "Successfully purchased 5000 credits. New balance: 9200",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "credits_purchased": 5000,
    "previous_balance": 4200,
    "new_balance": 9200,
    "total_purchased": 15000,
    "purchased_at": "2026-09-17T10:30:00.123456+00:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/tenants/{tenant_id}/balance/"
                      description="One tenant's credit balance."
                      response={`{
  "success": true,
  "message": "Credit balance retrieved successfully",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "current_balance": 9200,
    "total_purchased": 15000,
    "total_used": 5800,
    "unused_credits": 9200,
    "balance_last_updated": "2026-09-17T10:30:00+00:00"
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/tenants/"
                      description="Simplified dropdown listing of every tenant you can access. Empty result is a 200 with an empty array (not a 404)."
                      response={`{
  "success": true,
  "message": "Retrieved 2 tenant(s)",
  "data": {
    "tenants": [
      { "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789", "tenant_name": "Acme Traders Ltd", "current_balance": 9200 },
      { "tenant_id": "9a25f56g-dfeb-5f12-9c02-3d4e5f6a7890", "tenant_name": "Beta Retail Co", "current_balance": 1500 }
    ],
    "total": 2
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/balance/"
                      description="Full balances for every tenant you can access (includes grandchild tenants). Empty result is a 404 error_code: NO_TENANTS — unlike the dropdown endpoint above."
                      response={`{
  "success": true,
  "message": "Credit balances retrieved for 2 tenant(s)",
  "data": {
    "tenants": [
      {
        "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
        "tenant_name": "Acme Traders Ltd",
        "current_balance": 9200,
        "total_purchased": 15000,
        "total_used": 5800,
        "unused_credits": 9200,
        "balance_last_updated": "2026-09-17T10:30:00+00:00"
      }
    ],
    "summary": { "total_tenants": 2, "total_credits": 25000, "total_used": 15000, "total_unused": 10000 }
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/tenants/{tenant_id}/usage/"
                      description="SMS usage broken down by user, for one tenant. Query params: start_date, end_date (ISO YYYY-MM-DD)."
                      response={`{
  "success": true,
  "message": "SMS usage statistics retrieved successfully",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "total_credits": 15000,
    "used_credits": 5800,
    "unused_credits": 9200,
    "usage_by_user": [
      {
        "user_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "user_email": "staff@acmetraders.co.tz",
        "user_name": "Grace Mushi",
        "credits_used": 3200,
        "usage_count": 210,
        "first_used": "2026-08-01T08:00:00+00:00",
        "last_used": "2026-09-16T17:00:00+00:00"
      }
    ],
    "summary": { "total_users": 1, "total_usage_records": 210, "average_credits_per_user": 3200.0 }
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/usage/"
                      description="Same as above for every tenant you can access (includes grandchild tenants) — wraps per-tenant objects in a tenants[] array when more than one tenant matches."
                      response={`{
  "success": true,
  "message": "SMS usage statistics retrieved for 2 tenant(s)",
  "data": {
    "tenants": [
      { "tenant_id": "8f14e45f-...", "tenant_name": "Acme Traders Ltd", "total_credits": 15000, "used_credits": 5800, "unused_credits": 9200, "usage_by_user": [], "summary": {} },
      { "tenant_id": "9a25f56g-...", "tenant_name": "Beta Retail Co", "total_credits": 5000, "used_credits": 1200, "unused_credits": 3800, "usage_by_user": [], "summary": {} }
    ],
    "total_tenants": 2
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/tenants/{tenant_id}/messages/"
                      description="Filterable message list for one tenant. Query params: start_date, end_date, status (queued|sent|delivered|read|failed), provider, direction (in|out), limit (default 50, max 500), offset. The provider field on each message is always 'SENDA' regardless of the real Message.provider value, though the provider filter still matches the real field."
                      response={`{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "tenant_id": "8f14e45f-ceea-4e01-8b91-2c3d4e5f6789",
    "tenant_name": "Acme Traders Ltd",
    "total": 210,
    "successful": 198,
    "failed": 4,
    "stats": { "queued": 0, "sent": 20, "delivered": 178, "failed": 4 },
    "limit": 50,
    "offset": 0,
    "messages": [
      {
        "message_id": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
        "direction": "out",
        "provider": "SENDA",
        "status": "delivered",
        "recipient_number": "+255744963858",
        "content": "Your order #1234 has shipped.",
        "created_at": "2026-09-17T09:00:00+03:00",
        "sent_at": "2026-09-17T09:00:02+03:00",
        "delivered_at": "2026-09-17T09:00:10+03:00",
        "read_at": null,
        "sms_details": { "sender_id": "ACMESHOP", "provider_message_id": "PMID-556677", "cost_amount": "18.00", "cost_currency": "USD" }
      }
    ]
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/messages/"
                      description="Same as above for every tenant you can access — but only direct child tenants, NOT grandchildren (unlike the balance/usage 'all tenants' endpoints). Wraps per-tenant blocks in tenants[] when more than one tenant matches."
                      response={`{
  "success": true,
  "message": "Messages retrieved for 2 tenant(s)",
  "data": {
    "tenants": [
      { "tenant_id": "8f14e45f-...", "tenant_name": "Acme Traders Ltd", "total": 210, "successful": 198, "failed": 4, "stats": {}, "limit": 50, "offset": 0, "messages": [] },
      { "tenant_id": "9a25f56g-...", "tenant_name": "Beta Retail Co", "total": 40, "successful": 39, "failed": 1, "stats": {}, "limit": 50, "offset": 0, "messages": [] }
    ],
    "total_tenants": 2,
    "grand_total": 250,
    "grand_successful": 237,
    "grand_failed": 5
  }
}`}
                    />
                    <Endpoint
                      method="GET"
                      path="/pertina/user/usage/"
                      description="Usage for the authenticated user (not a tenant admin/parent-only endpoint, unlike the rest of the Pertina API). Query params: start_date, end_date (default: last 30 days)."
                      response={`{
  "success": true,
  "message": "User SMS usage statistics retrieved successfully",
  "data": {
    "user_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "user_email": "staff@acmetraders.co.tz",
    "user_name": "Grace Mushi",
    "total_sms_sent": 42,
    "total_credits_used": 42,
    "usage_period": { "start_date": "2026-08-18", "end_date": "2026-09-17" },
    "recent_messages": [
      {
        "message_id": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
        "recipient_number": "+255744963858",
        "content": "Your order #1234 has shipped.",
        "status": "delivered",
        "sent_at": "2026-09-17T09:00:02+00:00",
        "delivered_at": "2026-09-17T09:00:10+00:00",
        "credits_used": 1,
        "sms_segments": 1,
        "sms_details": { "sender_id": "ACMESHOP", "provider_message_id": "PMID-556677", "cost_amount": "18.00", "cost_currency": "USD" }
      }
    ],
    "usage_summary": { "successful_deliveries": 40, "failed_deliveries": 2, "pending_messages": 0, "total_messages": 42, "average_daily_usage": 1.4 }
  }
}`}
                    />
                  </CardContent>
                </Card>

                {/* ── AI & Voice Copilots ─────────────────────── */}
                <Card id="integration-copilots" className="glass border border-indigo-200/60 dark:border-indigo-800/60">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300 font-semibold">Section 3</p>
                      <h2 className="text-lg sm:text-xl font-semibold">AI Copilots & Voice Copilots</h2>
                      <p className="text-sm text-foreground/80">
                        Early access features. All endpoints require <code>Authorization: Bearer &lt;access_token&gt;</code>. The waitlist endpoint also accepts unauthenticated requests with a KYC file.
                      </p>
                    </div>

                    <h3 id="ep-ai-copilots" className="text-base sm:text-lg font-semibold pt-2">AI Copilots — /api/early-access/ai-copilots/</h3>
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
              <CardContent className="p-3 sm:p-4 text-sm text-foreground/75">
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


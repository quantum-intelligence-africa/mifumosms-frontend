import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Shield,
  Server,
  BookOpen,
  Layers,
  Target,
  Zap,
  Code,
  Link as LinkIcon,
} from "lucide-react";

const quickStartSteps = [
  {
    title: "Generate API Key",
    description: "Dashboard → Settings → API & Webhooks → + New Key",
  },
  {
    title: "Send Your First SMS",
    description: `POST /sms/send/ with Authorization header and E.164 recipients.`,
  },
  {
    title: "Check Balance",
    description: `GET /sms/balance/ to confirm credits and account ownership.`,
  },
];

const baseUrls = [
  { label: "Production", value: "https://mifumosms.servehttp.com/api/integration/v1/" },
  { label: "Development", value: "http://127.0.0.1:8001/api/integration/v1/" },
];

const integrationEndpoints = [
  {
    category: "Messaging",
    endpoints: [
      { path: "/sms/send/", method: "POST", description: "Send SMS to one or more recipients." },
      { path: "/sms/status/{message_id}/", method: "GET", description: "Check delivery status for a message." },
      { path: "/sms/balance/", method: "GET", description: "Fetch current SMS credit balance." },
      { path: "/sms/delivery-reports/", method: "GET", description: "Paginated delivery reports with filters." },
    ],
  },
  {
    category: "Sender IDs",
    endpoints: [
      { path: "/sms/sender-id/request/", method: "POST", description: "Submit a sender ID approval request." },
      { path: "/sms/sender-id/requests/", method: "GET", description: "List sender ID requests and statuses." },
      { path: "/sms/sender-id/available/", method: "GET", description: "List approved sender IDs and providers." },
    ],
  },
  {
    category: "Partner / Tenant Accounts",
    endpoints: [
      { path: "/partner/tenants/create/", method: "POST", description: "Provision tenant + API key automatically." },
      { path: "/partner/tenants/{tenant_id}/", method: "GET", description: "Retrieve tenant account details." },
      { path: "/partner/packages/", method: "GET", description: "List SMS packages (Lite, Standard, Pro)." },
      { path: "/partner/tenants/{tenant_id}/credits/", method: "POST", description: "Add credits via package or direct." },
      { path: "/partner/tenants/{tenant_id}/payments/initiate/", method: "POST", description: "Start ZenoPay purchase." },
      { path: "/partner/tenants/{tenant_id}/payments/{transaction_id}/status/", method: "GET", description: "Check payment status + credits." },
      { path: "/partner/tenants/{tenant_id}/payments/custom/initiate/", method: "POST", description: "Start custom credit purchase (≥100)." },
      { path: "/partner/tenants/{tenant_id}/payments/custom/{purchase_id}/status/", method: "GET", description: "Check custom payment status." },
      { path: "/partner/tenants/{tenant_id}/payments/history/", method: "GET", description: "Fetch payment history with status filters." },
      { path: "/partner/pricing/calculate/", method: "POST", description: "Price calculator using tiered pricing." },
    ],
  },
];

const ownerConfigFields = [
  { key: "api_base_url", note: "Include /api/integration/v1 or allow app to append automatically." },
  { key: "api_key", note: "Starts with mif_; never expose publicly." },
  { key: "secret_key", note: "Store securely for automation flows." },
  { key: "sender_id", note: "Optional but recommended for branding." },
];

const securityTips = [
  "Use HTTPS everywhere and rotate API keys regularly.",
  "Store credentials in environment variables or vaults, never in client bundles.",
  "Validate phone numbers in E.164 format before sending.",
  "Check response.success and error_code for granular error handling.",
];

const IntegrationGuide = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleCopyHeader = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText("Authorization: Bearer mif_your_api_key_here").catch(() => {});
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={!isMobile || sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            <div className="space-y-1">
              <h1 className="font-heading text-xl sm:text-2xl font-bold">Mifumo SMS Integration Guide</h1>
              <p className="text-sm text-text-subtle">
                Version 1.3 &middot; Last updated November 15, 2025 &middot; Production-ready.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {quickStartSteps.map((step, index) => (
                <Card key={step.title} className="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-subtle">
                      <span>Step {index + 1}</span>
                      <Zap className="w-3 h-3" />
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-subtle">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="w-4 h-4" />
                  Base URLs & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {baseUrls.map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-muted/40 border border-border-subtle">
                      <p className="text-xs uppercase tracking-wide text-text-subtle">{item.label}</p>
                      <code className="text-sm font-mono break-all">{item.value}</code>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Authorization Header</p>
                    <code className="text-sm font-mono break-all">
                      Authorization: Bearer mif_your_api_key_here
                    </code>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={handleCopyHeader}>
                    Copy Example Header
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4" />
                  Owner Configuration Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {ownerConfigFields.map((field) => (
                  <div key={field.key} className="p-3 rounded-lg border border-border-subtle bg-muted/30">
                    <p className="text-xs uppercase tracking-wide text-text-subtle">{field.key}</p>
                    <p className="text-sm">{field.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-4 h-4" />
                  Integration Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrationEndpoints.map((group) => (
                  <div key={group.category}>
                    <p className="text-sm font-semibold mb-2">{group.category}</p>
                    <div className="space-y-2">
                      {group.endpoints.map((endpoint) => (
                        <div
                          key={endpoint.path}
                          className="p-3 rounded-lg border border-border-subtle bg-muted/20 flex flex-col gap-1"
                        >
                          <div className="flex items-center gap-2 text-sm font-mono">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {endpoint.method}
                            </Badge>
                            <span>{endpoint.path}</span>
                          </div>
                          <p className="text-xs text-text-subtle">{endpoint.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-4 h-4" />
                    Automatic Tenant Provisioning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text-subtle">
                  <p>
                    Once the owner configures API settings, every tenant creation event can automatically create a
                    Mifumo SMS account, supply an API key, and inherit the owner’s approved sender IDs.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Owner controls costs and can rotate credentials anytime.</li>
                    <li>Tenants receive their own account IDs and balances instantly.</li>
                    <li>No tenant-side configuration is required—accounts are provisioned server-side.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4" />
                    Security & Error Handling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-text-subtle">
                  {securityTips.map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <p>{tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-4 h-4" />
                  Quick Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-3">
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30">
                  <p className="text-xs uppercase tracking-wide text-text-subtle mb-1">Send SMS</p>
                  <code className="text-xs font-mono break-all">POST /sms/send/</code>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30">
                  <p className="text-xs uppercase tracking-wide text-text-subtle mb-1">Balance</p>
                  <code className="text-xs font-mono break-all">GET /sms/balance/</code>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30">
                  <p className="text-xs uppercase tracking-wide text-text-subtle mb-1">Payment History</p>
                  <code className="text-xs font-mono break-all">
                    {"GET /partner/tenants/{tenant_id}/payments/history/"}
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LinkIcon className="w-4 h-4" />
                  Support
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 text-sm">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-text-subtle">support@mifumosms.com</p>
                </div>
                <div>
                  <p className="font-medium">Dashboard</p>
                  <p className="text-text-subtle">https://mifumosms.servehttp.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationGuide;


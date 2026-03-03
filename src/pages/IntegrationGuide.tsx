import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import {
  CheckCircle2,
  Shield,
  Server,
  BookOpen,
  Layers,
  Target,
  Code,
  Link as LinkIcon,
} from "lucide-react";

const quickStartSteps = [
  {
    title: "1. Get Your API Key",
    description: "Create a production-ready key for integrations.",
    details: [
      "Log in to the dashboard.",
      "Navigate to Settings → API & Webhooks.",
      "Click “+ New Key” and copy the key (format: mif_xxxx).",
    ],
  },
  {
    title: "2. Send Your First SMS",
    description: "Use POST /sms/send/ with Authorization header and E.164 recipients.",
    details: [
      "Set Content-Type to application/json.",
      "Provide message body (max 160 chars).",
      "Include recipients array with +countrycode numbers.",
    ],
  },
  {
    title: "3. Check Your Balance",
    description: "Verify credits remain available for the account.",
    details: [
      "Call GET /sms/balance/ with the same API key.",
      "Inspect sms_balance to confirm credit allocation.",
    ],
  },
];

const baseUrls = [
  { label: "Production", value: "https://mifumosms.mifumolabs.com/api/integration/v1/" },
  { label: "Development", value: "http://127.0.0.1:8001/api/integration/v1/" },
];

const curlExamples = [
  {
    title: "Send Your First SMS",
    description: "Fire a production request with a JSON payload and bearer token.",
    command: `curl -X POST "https://mifumosms.mifumolabs.com/api/integration/v1/sms/send/" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-d '{"message": "Hello from Mifumo SMS!", "recipients": ["+255123456789"]}'`,
  },
  {
    title: "Check Your Balance",
    description: "Confirm remaining SMS credits for the authenticated account.",
    command: `curl -X GET "https://mifumosms.mifumolabs.com/api/integration/v1/sms/balance/" \\
-H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    title: "Get Credit Balance (Single Tenant)",
    description: "Get credit balance for a specific tenant using Partner integration.",
    command: `curl -X GET "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/{tenant_id}/balance/" \\
-H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    title: "Get Credit Balance (All Clients)",
    description: "Get credit balance for all clients using Partner integration.",
    command: `curl -X GET "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/balance/" \\
-H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    title: "Get SMS Usage by User (Single Tenant)",
    description: "Get SMS usage statistics for a specific tenant.",
    command: `curl -X GET "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/{tenant_id}/usage/" \\
-H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    title: "Get SMS Usage by User (All Tenants)",
    description: "Get SMS usage statistics for all tenants.",
    command: `curl -X GET "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/usage/" \\
-H "Authorization: Bearer YOUR_API_KEY"`,
  },
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
  {
    category: "Pertina Integration",
    endpoints: [
      { path: "/pertina/tenants/{tenant_id}/balance/", method: "GET", description: "Get credit balance for a specific tenant." },
      { path: "/pertina/balance/", method: "GET", description: "Get credit balance for all clients." },
      { path: "/pertina/tenants/{tenant_id}/usage/", method: "GET", description: "Get SMS usage statistics for a specific tenant." },
      { path: "/pertina/usage/", method: "GET", description: "Get SMS usage statistics for all tenants." },
    ],
  },
];

const coreEndpointDetails = [
  {
    name: "Send SMS",
    method: "POST",
    path: "/sms/send/",
    description: "Send SMS to one or many recipients with optional sender ID.",
    parameters: [
      "message (required): SMS text, max 160 characters.",
      "recipients (required): Array of E.164 phone numbers.",
      'sender_id (optional): Defaults to "Taarifa-SMS" if omitted.',
    ],
    request: `{
  "message": "Hello from Mifumo SMS!",
  "recipients": ["+255123456789", "+255987654321"],
  "sender_id": "MIFUMO"
}`,
    response: `{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "message_id": "msg_123456789",
    "successful_sends": 2,
    "total_recipients": 2,
    "status": "sent"
  }
}`,
  },
  {
    name: "Get Account Balance",
    method: "GET",
    path: "/sms/balance/",
    description: "Retrieve SMS credit inventory for the authenticated owner.",
    parameters: ["No parameters required beyond Authorization header."],
    response: `{
  "success": true,
  "data": {
    "account_owner": "user@example.com",
    "sms_balance": 1000,
    "account_id": "JLJYJTEMPEN1YIBCRM29AG"
  }
}`,
    note: "sms_balance shows the exact number of SMS credits. Each SMS deducts one credit.",
  },
  {
    name: "Get Message Status",
    method: "GET",
    path: "/sms/status/{message_id}/",
    description: "Check message lifecycle (queued → delivered/failed).",
    parameters: ["message_id (path): Use ID returned from /sms/send/."],
    response: `{
  "success": true,
  "data": {
    "message_id": "msg_123456789",
    "status": "delivered",
    "created_at": "2025-11-07T10:30:00Z"
  }
}`,
    statusValues: ["queued", "sent", "delivered", "failed", "undelivered"],
  },
  {
    name: "Get Delivery Reports",
    method: "GET",
    path: "/sms/delivery-reports/",
    description: "Query delivery logs with rich filters and pagination.",
    parameters: [
      "start_date/end_date (optional, ISO 8601).",
      "status (optional): sent, delivered, failed.",
      "page/per_page (optional): defaults 1 / 50 (max 100).",
    ],
  },
];

const ownerConfigFields = [
  { key: "api_base_url", note: "Include /api/integration/v1 or allow app to append automatically." },
  { key: "api_key", note: "Starts with mif_; never expose publicly." },
  { key: "secret_key", note: "Store securely for automation flows." },
  { key: "sender_id", note: "Optional but recommended for branding." },
];

const accountEndpoints = [
  {
    title: "Create Tenant Account",
    method: "POST",
    path: "/partner/tenants/create/",
    request: `{
  "tenant_id": "customer_12345",
  "tenant_name": "Acme Corporation",
  "owner_email": "john@acme.com",
  "owner_name": "John Doe",
  "contact_phone": "+255123456789",
  "initial_credits": 100
}`,
    response: `{
  "success": true,
  "message": "Tenant account created successfully",
  "data": {
    "mifumo_account_id": "550e8400-e29b-41d4-a716-446655440000",
    "mifumo_api_key": "mif_4ndp-3x-Pf5edLnc-jmW10aHWGfCLJNdtfSxzXJLFIM",
    "tenant_name": "Acme Corporation",
    "sms_balance": 100
  }
}`,
  },
  {
    title: "List SMS Packages",
    method: "GET",
    path: "/partner/packages/",
    response: `{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Lite",
        "credits": 49999,
        "price": 899982.00,
        "unit_price": 18.00,
        "subtitle": "1 to 49,999 SMS"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Standard",
        "credits": 149999,
        "price": 2099986.00,
        "unit_price": 14.00,
        "is_popular": true,
        "subtitle": "50,000 to 149,999 SMS"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Pro",
        "credits": 250000,
        "price": 3000000.00,
        "unit_price": 12.00,
        "subtitle": "250,000 SMS and above"
      }
    ]
  }
}`,
  },
  {
    title: "Add Credits to Tenant Account",
    method: "POST",
    path: "/partner/tenants/{tenant_id}/credits/",
    request: `{
  "package_id": "550e8400-e29b-41d4-a716-446655440000",
  "payment_reference": "TXN-12345",
  "payment_method": "mpesa",
  "amount_paid": 180000.00
}`,
    requestAlt: `{
  "credits": 1000,
  "payment_reference": "TXN-12345",
  "payment_method": "mpesa"
}`,
  },
  {
    title: "Calculate SMS Pricing",
    method: "POST",
    path: "/partner/pricing/calculate/",
    request: `{
  "credits": 5000
}`,
    response: `{
  "success": true,
  "data": {
    "credits": 5000,
    "unit_price": 18.00,
    "total_price": 90000.00,
    "active_tier": "Lite",
    "savings_percentage": 40.0,
    "currency": "TZS"
  }
}`,
  },
];

const pricingTiers = [
  { name: "Lite", range: "1 - 49,999 SMS", unitPrice: "18.00 TZS/SMS" },
  { name: "Standard", range: "50,000 - 149,999 SMS", unitPrice: "14.00 TZS/SMS", note: "Most Popular" },
  { name: "Pro", range: "250,000+ SMS", unitPrice: "12.00 TZS/SMS" },
];

const securityTips = [
  "Use HTTPS everywhere and rotate API keys regularly.",
  "Store credentials in environment variables or vaults, never in client bundles.",
  "Validate phone numbers in E.164 format before sending.",
  "Check response.success and error_code for granular error handling.",
];

const errorCodes = [
  { code: "AUTHENTICATION_REQUIRED (401)", note: "Missing Authorization header." },
  { code: "INVALID_API_KEY (401)", note: "API key is invalid or expired." },
  { code: "INSUFFICIENT_CREDITS (400)", note: "Account does not have enough SMS credits." },
  { code: "MISSING_FIELD (400)", note: "Required field omitted from payload." },
];

const creditManagement = [
  "1 SMS = 1 credit per recipient.",
  "Credits deduct only on confirmed successful sends.",
  "Two recipients = 2 credits; multi-recipient campaigns scale linearly.",
  "Automatic deduction keeps balances synchronized with delivery confirmations.",
];

const quickReferenceEndpoints = [
  "POST /sms/send/ - Send SMS",
  "GET /sms/balance/ - Check balance",
  "GET /sms/status/{message_id}/ - Get message status",
  "GET /sms/delivery-reports/ - Get delivery reports",
  "POST /partner/tenants/create/ - Create tenant account",
  "GET /partner/packages/ - List SMS packages",
  "POST /partner/tenants/{tenant_id}/credits/ - Add credits",
  "POST /partner/pricing/calculate/ - Calculate pricing",
];

const IntegrationGuide = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Handle hash-based navigation
    const hash = window.location.hash.slice(1); // Remove the '#'
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textarea);
      return result;
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      return false;
    }
  };

  const handleCopyHeader = async () => {
    const success = await copyToClipboard("Authorization: Bearer mif_your_api_key_here");
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
              <h1 className="font-heading text-xl sm:text-2xl font-bold">{t('app.name')} {t('integration_guide')}</h1>
              <p className="text-sm text-foreground/70">
                {t('integration.version')}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {quickStartSteps.map((step, index) => (
                <Card key={step.title} className="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-foreground/70">
                      <span>{t('integration.step', { step: index + 1 })}</span>
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70">{step.description}</p>
                    {step.details && (
                      <ul className="mt-2 text-xs text-foreground/70 space-y-1 list-disc list-inside">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {t('integration.quick_start_requests')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {curlExamples.map((example) => (
                  <div key={example.title} className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="font-medium text-sm">{example.title}</p>
                      <span className="text-xs text-foreground/70">{example.description}</span>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{example.command}</pre>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-4 h-4" />
                  {t('integration.python_examples')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm">Get Credit Balance (Single Tenant)</p>
                    <span className="text-xs text-foreground/70">Get balance for a specific tenant</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{`import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/e35bb90d-d67b-4e97-aa00-d983c2d282d9/balance/"

payload = {}
headers = {
  'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)`}</pre>
                </div>

                <div className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm">Get Credit Balance (All Clients)</p>
                    <span className="text-xs text-foreground/70">Get balance for all clients</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{`import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/balance/"

payload = {}
headers = {
  'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)`}</pre>
                </div>

                <div className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm">Get SMS Usage by User (Single Tenant)</p>
                    <span className="text-xs text-foreground/70">Get usage statistics for a specific tenant</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{`import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/e35bb90d-d67b-4e97-aa00-d983c2d282d9/usage/"

payload = {}
headers = {
  'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)`}</pre>
                </div>

                <div className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm">Get SMS Usage by User (All Tenants)</p>
                    <span className="text-xs text-foreground/70">Get usage statistics for all tenants</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{`import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/usage/"

payload = {}
headers = {
  'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)`}</pre>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-xs uppercase tracking-wide text-foreground/70">{item.label}</p>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleCopyHeader}
                    disabled={copied}
                  >
                    {copied ? "Copied!" : "Copy Example Header"}
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
                    <p className="text-xs uppercase tracking-wide text-foreground/70">{field.key}</p>
                    <p className="text-sm">{field.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-4 h-4" />
                  Core API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {coreEndpointDetails.map((endpoint) => (
                  <div key={endpoint.path} className="p-4 rounded-lg border border-border-subtle bg-muted/20 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center flex-wrap gap-2 text-sm font-mono">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {endpoint.method}
                        </Badge>
                        <span className="break-all">{endpoint.path}</span>
                      </div>
                      <p className="text-sm font-semibold">{endpoint.name}</p>
                      <p className="text-xs text-foreground/70">{endpoint.description}</p>
                    </div>
                    {endpoint.parameters && (
                      <ul className="text-xs text-foreground/70 list-disc list-inside space-y-1">
                        {endpoint.parameters.map((param) => (
                          <li key={param}>{param}</li>
                        ))}
                      </ul>
                    )}
                    {endpoint.request && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-foreground/70 mb-1">Request</p>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{endpoint.request}</pre>
                      </div>
                    )}
                    {endpoint.response && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-foreground/70 mb-1">Response</p>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{endpoint.response}</pre>
                      </div>
                    )}
                    {endpoint.note && (
                      <p className="text-[11px] text-foreground/70 italic">{endpoint.note}</p>
                    )}
                    {endpoint.statusValues && (
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase mb-1">Status Values</p>
                        <ul className="text-[11px] text-foreground/70 list-disc list-inside space-y-0.5">
                          {endpoint.statusValues.map((status) => (
                            <li key={status}>{status}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                          <div className="flex items-center gap-2 text-sm font-mono flex-wrap">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {endpoint.method}
                            </Badge>
                            <span className="inline-block break-all">{endpoint.path}</span>
                          </div>
                          <p className="text-xs text-foreground/70">{endpoint.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4" />
                  Account Creation API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountEndpoints.map((endpoint) => (
                  <div key={endpoint.title} className="p-4 rounded-lg border border-border-subtle bg-muted/30 space-y-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{endpoint.title}</p>
                      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {endpoint.method}
                        </Badge>
                        <span className="break-all">{endpoint.path}</span>
                      </div>
                    </div>
                    {endpoint.request && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-foreground/70 mb-1">Request</p>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{endpoint.request}</pre>
                      </div>
                    )}
                    {endpoint.requestAlt && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-foreground/70 mb-1">Alternative Request</p>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{endpoint.requestAlt}</pre>
                      </div>
                    )}
                    {endpoint.response && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-foreground/70 mb-1">Response</p>
                        <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{endpoint.response}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass" id="campaign-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-4 h-4" />
                  Campaign Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-foreground/70">
                  <p>
                    <span className="font-semibold text-foreground">Campaign Management</span> allows you to create and manage SMS campaigns with advanced scheduling options. All campaigns execute on the dashboard and are tracked for delivery and engagement.
                  </p>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">Campaign Types</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><span className="font-semibold">Single Campaign:</span> Send SMS immediately to selected contacts</li>
                      <li><span className="font-semibold">Recurring Campaign:</span> Schedule SMS to send on a recurring basis (daily, weekly, or monthly)</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">SMS Segmentation & Costs</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Each SMS segment is <span className="font-semibold">160 characters</span> maximum</li>
                      <li>Cost per segment: <span className="font-semibold">18 TZS</span></li>
                      <li>Total cost = Number of segments × Number of recipients × 18 TZS</li>
                      <li>Message exceeding 160 characters will be automatically split into multiple segments</li>
                      <li>Cost is deducted once for single campaigns, and for each execution of recurring campaigns</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">Recurring Campaign Scheduling</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><span className="font-semibold">Daily:</span> Execute at the same time every day until the end date</li>
                      <li><span className="font-semibold">Weekly:</span> Execute on selected days (e.g., Monday, Wednesday, Friday) at a specific time</li>
                      <li><span className="font-semibold">Monthly:</span> Execute on a specific day of the month (1-31) at a specified time</li>
                      <li>Optional end date: Campaign runs until the specified date</li>
                      <li>All times are in 24-hour format (HH:MM)</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">Campaign Statuses</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><span className="font-semibold">Draft:</span> Campaign is being prepared, not active yet</li>
                      <li><span className="font-semibold">Scheduled:</span> Campaign is scheduled for a future execution</li>
                      <li><span className="font-semibold">Running:</span> Campaign is currently executing or in progress</li>
                      <li><span className="font-semibold">Paused:</span> Campaign execution has been paused</li>
                      <li><span className="font-semibold">Completed:</span> Single campaign has finished sending, or recurring campaign has reached end date</li>
                      <li><span className="font-semibold">Cancelled:</span> Campaign execution has been cancelled</li>
                      <li><span className="font-semibold">Failed:</span> Campaign encountered an error during execution</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">SMS Balance Requirements</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Always verify sufficient SMS balance before creating a campaign</li>
                      <li>System shows warning if balance is below 100 TZS</li>
                      <li>For recurring campaigns, ensure sufficient balance for multiple executions</li>
                      <li>Check <span className="font-semibold">/sms/balance/</span> endpoint to verify current balance</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-border-subtle bg-muted/30 space-y-2">
                    <p className="font-semibold text-foreground">Best Practices</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Test with a small recipient group before sending to large audiences</li>
                      <li>Schedule recurring campaigns during optimal engagement times</li>
                      <li>Monitor campaign delivery status regularly</li>
                      <li>Keep messages concise and clear (aim for under 160 characters for single segment)</li>
                      <li>Review cost estimation before creating high-volume campaigns</li>
                      <li>Set appropriate end dates for recurring campaigns to prevent unnecessary charges</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="w-4 h-4" />
                    Pricing Tiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pricingTiers.map((tier) => (
                    <div key={tier.name} className="p-3 rounded-lg border border-border-subtle bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{tier.name}</p>
                        {tier.note && <Badge variant="secondary">{tier.note}</Badge>}
                      </div>
                      <p className="text-xs text-foreground/70">{tier.range}</p>
                      <p className="text-sm mt-1">{tier.unitPrice}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-4 h-4" />
                    Automatic Tenant Provisioning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/70">
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
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4" />
                  Security & Error Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-foreground/70">
                {securityTips.map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <p>{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4" />
                    Common Error Codes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-foreground/70">
                  {errorCodes.map((item) => (
                    <div key={item.code}>
                      <p className="font-medium">{item.code}</p>
                      <p>{item.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Credit Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-foreground/70 list-disc list-inside space-y-1">
                    {creditManagement.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-4 h-4" />
                  {t('integration.quick_reference')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-3">
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-foreground/70">{t('integration.base_url')}</p>
                  <code className="text-xs font-mono break-all">https://mifumosms.mifumolabs.com/api/integration/v1/</code>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-foreground/70">{t('integration.authentication')}</p>
                  <code className="text-xs font-mono break-all">Authorization: Bearer YOUR_API_KEY</code>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-muted/30 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-foreground/70">{t('integration.endpoints_label')}</p>
                  <ul className="text-xs text-foreground/70 space-y-1">
                    {quickReferenceEndpoints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LinkIcon className="w-4 h-4" />
                  {t('integration.support')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 text-sm">
                <div>
                  <p className="font-medium">{t('integration.email')}</p>
                  <p className="text-foreground/70">support@mifumosms.com</p>
                </div>
                <div>
                  <p className="font-medium">{t('integration.dashboard_link')}</p>
                  <p className="text-foreground/70">https://sms.mifumolabs.com</p>
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


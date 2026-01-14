import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Server, Code, Link as LinkIcon, Zap } from "lucide-react";

const partnerEndpoints = [
  {
    title: "Tenant Balance",
    path: "/integration/v1/pertina/tenants/{tenant_id}/balance/",
    method: "GET",
    description: "Returns the remaining credit balance for the specified Pertina tenant.",
    parameters: [
      "tenant_id (path) – UUID assigned to each tenant.",
      "Requires Authorization: Bearer YOUR_API_KEY",
    ],
    response: `{
  "success": true,
  "data": {
    "tenant_id": "e35bb90d-d67b-4e97-aa00-d983c2d282d9",
    "sms_balance": 1200,
    "currency": "TZS"
  }
}`,
  },
  {
    title: "All Clients Balance",
    path: "/integration/v1/pertina/balance/",
    method: "GET",
    description: "Fetches credit balances for all clients under the Partner account.",
    parameters: [
      "Optional filters: ?tenant_id={uuid}",
      "Requires Authorization header",
    ],
    response: `{
  "success": true,
  "data": [
    { "tenant_id": "...", "sms_balance": 500, "currency": "TZS" },
    { "tenant_id": "...", "sms_balance": 1800, "currency": "TZS" }
  ]
}`,
  },
  {
    title: "Tenant Usage",
    path: "/integration/v1/pertina/tenants/{tenant_id}/usage/",
    method: "GET",
    description: "Gets per-user SMS usage for a single tenant (monthly or date range).",
    parameters: [
      "tenant_id (path) – Tenant UUID.",
      "Optional query: ?start_date=2025-01-01&end_date=2025-01-31",
    ],
    response: `{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "name": "Jane Doe",
      "sent_messages": 210,
      "credits_used": 210
    }
  ]
}`,
  },
  {
    title: "Global Usage",
    path: "/integration/v1/pertina/usage/",
    method: "GET",
    description: "Aggregate SMS usage statistics for all tenants managed by the Partner.",
    parameters: [
      "Optional filters: tenant_id, start_date, end_date",
      "Requires Authorization header",
    ],
    response: `{
  "success": true,
  "data": {
    "total_messages": 987,
    "total_credits": 987,
    "by_tenant": [
      { "tenant_id": "...", "credits_used": 340 },
      { "tenant_id": "...", "credits_used": 647 }
    ]
  }
}`,
  },
];

const implementationSteps = [
  "Add a dedicated `PERTINA` section to `API_CONFIG.ENDPOINTS.INTEGRATION` and keep the helper functions listed above in sync.",
  "Expose helper methods in `src/lib/api.ts` (`pertinaGetTenantBalance`, `pertinaGetAllBalance`, etc.) so consumers can call `apiClient` directly.",
  "If you use `APIService`, wrap the helper methods there so UI components stay consistent with retry/error patterns.",
  "Document the endpoints in the new Partner reference page and link to it from navigation (this page).",
];

const configSnippet = String.raw`PERTINA: {
  TENANT_BALANCE: (tenantId: string) => \`/integration/v1/pertina/tenants/\${tenantId}/balance/\`,
  ALL_BALANCE: '/integration/v1/pertina/balance/',
  TENANT_USAGE: (tenantId: string) => \`/integration/v1/pertina/tenants/\${tenantId}/usage/\`,
  ALL_USAGE: '/integration/v1/pertina/usage/',
},`;

const apiSnippet = String.raw`// In src/lib/api.ts
async pertinaGetTenantBalance(tenantId: string): Promise<ApiResponse<any>> {
  return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PERTINA.TENANT_BALANCE(tenantId));
}

async pertinaGetAllBalance(): Promise<ApiResponse<any>> {
  return this.request(API_CONFIG.ENDPOINTS.INTEGRATION.PERTINA.ALL_BALANCE);
}

// Repeat for usage endpoints
`;

const partnerExamples = [
  {
    title: "Get Credit Balance (Single Tenant)",
    description: "Point to /pertina/tenants/{tenant_id}/balance/ and swap in your API key.",
    command: `import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/{tenant_id}/balance/"

headers = {
  "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
  },
  {
    title: "Get Credit Balance (All Clients)",
    description: "No tenant_id required, the response bundles every client balance.",
    command: `import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/balance/"

headers = {
  "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
  },
  {
    title: "Get SMS Usage by User (Single Tenant)",
    description: "Restrict the query to a single tenant and optionally pass start/end dates.",
    command: `import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/tenants/{tenant_id}/usage/"

headers = {
  "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
  },
  {
    title: "Get SMS Usage by User (All Tenants)",
    description: "Pull organization-wide usage to reconcile billing or quotas.",
    command: `import requests

url = "https://mifumosms.mifumolabs.com/api/integration/v1/pertina/usage/"

headers = {
  "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
  },
];

const PertinaIntegration = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={!isMobile || sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-5 text-sm text-foreground">
          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-5">
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold">Partner Integration Reference</h1>
              <p className="text-sm text-foreground/90 max-w-2xl">
                Everything you need to wire the Partner integration endpoints into the dashboard, from API
                configuration to example requests for credit balance and usage statistics.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Partner integration endpoints are currently not implemented on the backend.
                  This documentation is for future reference when the feature becomes available.
                </p>
              </div>
            </div>

            <Card className="glass p-3 sm:p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4" />
                  Endpoint Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-foreground/90">
                  Partner endpoints sit under `/integration/v1/pertina` and are protected with the same API key
                  used for sending SMS. Each request expects the standard Authorization header.
                </p>
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {partnerEndpoints.map((endpoint) => (
                    <div key={endpoint.path} className="p-3 sm:p-4 rounded-lg border border-border-subtle bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {endpoint.method}
                        </Badge>
                        <span className="text-[11px] text-foreground/80 flex-1 break-all">{endpoint.path}</span>
                      </div>
                      <p className="text-sm font-semibold">{endpoint.title}</p>
                      <p className="text-xs text-foreground/80">{endpoint.description}</p>
                      {endpoint.parameters && (
                        <ul className="text-[11px] text-foreground/80 list-disc list-inside space-y-0.5">
                          {endpoint.parameters.map((param) => (
                            <li key={param}>{param}</li>
                          ))}
                        </ul>
                      )}
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-foreground/80 mb-1">Sample response</p>
                        <pre className="text-[10px] font-mono whitespace-pre-wrap bg-background p-2 rounded-md border border-border-subtle overflow-auto">{endpoint.response}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="glass p-3 sm:p-4 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="w-4 h-4" />
                    Configuration Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-foreground/90">
                  <p>
                    Keep `src/config/api.ts` updated so the client can resolve the Partner routes referenced by `src/lib/api.ts`.
                    When you add a new Partner endpoint, register it in the `PERTINA` block below.
                  </p>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{configSnippet}</pre>
                  <p>
                    After the config entry exists, expose helper methods inside `src/lib/api.ts` so higher layers reuse the same configuration.
                  </p>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{apiSnippet}</pre>
                </CardContent>
              </Card>

              <Card className="glass p-3 sm:p-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LinkIcon className="w-4 h-4" />
                    Implementation Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="text-sm text-foreground/90 list-disc list-inside space-y-1 break-words">
                    {implementationSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="glass p-3 sm:p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-4 h-4" />
                  Partner Python Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partnerExamples.map((example) => (
                  <div key={example.title} className="p-4 rounded-lg border border-border-subtle bg-muted/20 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="font-medium text-sm">{example.title}</p>
                      <span className="text-xs text-foreground/90">{example.description}</span>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-md border border-border-subtle overflow-auto">{example.command}</pre>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass p-3 sm:p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground/90 space-y-1">
                <p>Persist the API key in a secure vault and rotate it regularly—Partner endpoints rely on the same credentials as your SMS sends.</p>
                <p>Always inspect `response.success` before trusting the data, especially for usage summaries that drive billing.</p>
                <p>Add pagination query parameters when tenant usage responses grow beyond a page.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PertinaIntegration;


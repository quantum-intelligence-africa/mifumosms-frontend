import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert, Trash2, RefreshCw, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl, API_CONFIG } from "@/config/api";

const EP = API_CONFIG.ENDPOINTS.MESSAGING.ADMIN_WHATSAPP_CREDENTIALS;

interface PartnerDetail {
  id: number;
  email: string;
  name: string;
  is_partina: boolean;
}

interface WaCredential {
  id: string;
  partner: number | null;
  partner_detail: PartnerDetail | null;
  is_default: boolean;
  label: string;
  phone_number_id: string;
  access_token_configured: boolean;
  masked_token: string;
  waba_id: string;
  verify_token: string;
  display_phone_number: string;
  graph_api_base: string;
  is_active: boolean;
  verified: boolean;
  verified_at: string | null;
  last_verify_error: string;
  is_configured: boolean;
  updated_at: string;
}

interface PartnerOption {
  id: number;
  email: string;
  name: string;
  has_credential: boolean;
}

// Editable form shape. partner === null => the platform default row.
interface FormState {
  partner: number | null;
  label: string;
  phone_number_id: string;
  access_token: string; // blank on edit = leave unchanged
  waba_id: string;
  verify_token: string;
  graph_api_base: string;
  is_active: boolean;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const emptyForm = (partner: number | null): FormState => ({
  partner,
  label: "",
  phone_number_id: "",
  access_token: "",
  waba_id: "",
  verify_token: "",
  graph_api_base: "",
  is_active: true,
});

const fromCredential = (c: WaCredential): FormState => ({
  partner: c.partner,
  label: c.label || "",
  phone_number_id: c.phone_number_id || "",
  access_token: "", // never prefilled; blank means keep stored token
  waba_id: c.waba_id || "",
  verify_token: c.verify_token || "",
  graph_api_base: c.graph_api_base || "",
  is_active: c.is_active,
});

export default function WhatsAppCredentialsAdmin() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<WaCredential[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  // Which credential is being edited: "default", a partner id (string), or "new" partner pick.
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("default");
  const [form, setForm] = useState<FormState>(emptyForm(null));
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const credByPartner = useMemo(() => {
    const map = new Map<string, WaCredential>();
    for (const c of credentials) map.set(c.partner === null ? "default" : String(c.partner), c);
    return map;
  }, [credentials]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [credRes, partnerRes] = await Promise.all([
        fetch(buildApiUrl(EP.LIST), { headers: authHeaders() }),
        fetch(buildApiUrl(EP.PARTNERS), { headers: authHeaders() }),
      ]);
      if (!credRes.ok) throw new Error(`Failed to load credentials (HTTP ${credRes.status})`);
      const credData = await credRes.json();
      const partnerData = partnerRes.ok ? await partnerRes.json() : { results: [] };
      // List endpoint may paginate; support both shapes.
      const list: WaCredential[] = Array.isArray(credData) ? credData : credData.results || [];
      setCredentials(list);
      setPartners(partnerData.results || []);
    } catch (err) {
      toast({
        title: "Could not load WhatsApp credentials",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // When the selected scope changes, hydrate the form from the existing credential (if any).
  useEffect(() => {
    const existing = credByPartner.get(selectedPartnerId);
    if (existing) {
      setForm(fromCredential(existing));
    } else {
      const partnerId = selectedPartnerId === "default" ? null : Number(selectedPartnerId);
      setForm(emptyForm(partnerId));
    }
  }, [selectedPartnerId, credByPartner]);

  const selectedExisting = credByPartner.get(selectedPartnerId) || null;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.phone_number_id.trim()) {
      toast({ title: "Phone Number ID is required", variant: "destructive" });
      return;
    }
    // On first save (no stored token yet) an access token is mandatory.
    if (!selectedExisting?.access_token_configured && !form.access_token.trim()) {
      toast({ title: "Access Token is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        partner: form.partner,
        label: form.label.trim(),
        phone_number_id: form.phone_number_id.trim(),
        waba_id: form.waba_id.trim(),
        verify_token: form.verify_token.trim(),
        graph_api_base: form.graph_api_base.trim(),
        is_active: form.is_active,
      };
      // Only send the token when the admin typed one (blank = keep existing).
      if (form.access_token.trim()) body.access_token = form.access_token.trim();

      // POST upserts by partner/default on the backend.
      const res = await fetch(buildApiUrl(EP.LIST), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.detail || JSON.stringify(data))) || `HTTP ${res.status}`);
      }
      toast({ title: "Saved", description: "WhatsApp credentials updated." });
      await load();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const verify = async (cred: WaCredential) => {
    setVerifyingId(cred.id);
    try {
      const res = await fetch(buildApiUrl(EP.VERIFY(cred.id)), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.detail)) || `HTTP ${res.status}`);
      }
      toast({
        title: "Verified",
        description: data?.data?.display_phone_number
          ? `Connected: ${data.data.display_phone_number}`
          : "Credentials are valid.",
      });
      await load();
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      await load();
    } finally {
      setVerifyingId(null);
    }
  };

  const remove = async (cred: WaCredential) => {
    if (!window.confirm(`Delete WhatsApp credentials for ${cred.is_default ? "the platform default" : cred.partner_detail?.email}?`))
      return;
    try {
      const res = await fetch(buildApiUrl(EP.DETAIL(cred.id)), {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Deleted" });
      if ((cred.partner === null ? "default" : String(cred.partner)) === selectedPartnerId) {
        setSelectedPartnerId("default");
      }
      await load();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const StatusBadge = ({ cred }: { cred: WaCredential }) => {
    if (!cred.is_configured) return <Badge variant="outline">Not configured</Badge>;
    if (!cred.is_active) return <Badge variant="secondary">Disabled</Badge>;
    return cred.verified ? (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">Verified</Badge>
    ) : (
      <Badge variant="outline" className="text-amber-600 border-amber-500">Unverified</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading WhatsApp credentials…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">WhatsApp Credentials</h2>
        <p className="text-sm text-muted-foreground">
          Set the platform's default Meta WhatsApp number (used for normal customers) and each
          partner's own number (used for that partner and all of their clients).
        </p>
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit credentials</CardTitle>
          <CardDescription>
            Choose the platform default or a partner, then enter their Meta Cloud API details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Platform default (our credentials)</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name || p.email} {p.has_credential ? "✓" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPartnerId !== "default" && (
              <p className="text-xs text-muted-foreground">
                Used for this partner and every client/sub-tenant they create.
              </p>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wa-label">Label</Label>
              <Input
                id="wa-label"
                placeholder="Business / WABA name"
                value={form.label}
                onChange={(e) => setField("label", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-phone-id">Phone Number ID *</Label>
              <Input
                id="wa-phone-id"
                placeholder="e.g. 123456789012345"
                value={form.phone_number_id}
                onChange={(e) => setField("phone_number_id", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wa-token">
                Access Token {selectedExisting?.access_token_configured ? "(leave blank to keep current)" : "*"}
              </Label>
              <Input
                id="wa-token"
                type="password"
                autoComplete="new-password"
                placeholder={
                  selectedExisting?.access_token_configured
                    ? `Stored ${selectedExisting.masked_token} — type to replace`
                    : "Meta long-lived / system-user token"
                }
                value={form.access_token}
                onChange={(e) => setField("access_token", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-waba">WhatsApp Business Account ID (WABA)</Label>
              <Input
                id="wa-waba"
                placeholder="Optional"
                value={form.waba_id}
                onChange={(e) => setField("waba_id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-verify">Verify Token</Label>
              <Input
                id="wa-verify"
                placeholder="Webhook verify token"
                value={form.verify_token}
                onChange={(e) => setField("verify_token", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wa-base">Graph API base (optional)</Label>
              <Input
                id="wa-base"
                placeholder="https://graph.facebook.com/v24.0"
                value={form.graph_api_base}
                onChange={(e) => setField("graph_api_base", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="wa-active"
              checked={form.is_active}
              onCheckedChange={(v) => setField("is_active", v)}
            />
            <Label htmlFor="wa-active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {selectedExisting ? "Update credentials" : "Add credentials"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing credentials list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured credentials</CardTitle>
          <CardDescription>{credentials.length} credential set(s).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {credentials.length === 0 && (
            <p className="text-sm text-muted-foreground">No credentials saved yet.</p>
          )}
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {cred.is_default ? "Platform default" : cred.partner_detail?.email || "Partner"}
                  </span>
                  <StatusBadge cred={cred} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {cred.display_phone_number || cred.phone_number_id || "—"}
                  {cred.label ? ` · ${cred.label}` : ""}
                </div>
                {!cred.verified && cred.last_verify_error && (
                  <div className="text-xs text-red-500 mt-0.5 truncate">{cred.last_verify_error}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPartnerId(cred.is_default ? "default" : String(cred.partner))}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!cred.is_configured || verifyingId === cred.id}
                  onClick={() => verify(cred)}
                >
                  {verifyingId === cred.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cred.verified ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" />
                  )}
                  <span className="ml-1 hidden sm:inline">Verify</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(cred)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={load} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

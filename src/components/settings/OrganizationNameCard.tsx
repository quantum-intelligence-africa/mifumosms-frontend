// Every direct sign-up gets an automatic organization named after their email. This lets the
// owner or an admin give it a proper name (it appears on invoices and for teammates).
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

export function OrganizationNameCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // The organization this person administers (the same one the rest of the app acts for).
  const membership = useMemo(
    () => (user?.memberships ?? []).find((m) => m.status === "active" && (m.role === "owner" || m.role === "admin")),
    [user?.memberships],
  );
  const tenantId = membership?.tenant_id ?? membership?.tenant;

  const [savedName, setSavedName] = useState(membership?.tenant_name ?? "");
  const [name, setName] = useState(membership?.tenant_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedName(membership?.tenant_name ?? "");
    setName(membership?.tenant_name ?? "");
  }, [membership?.tenant_name]);

  if (!tenantId) return null; // agents and supervisors can't rename it

  const dirty = name.trim() !== savedName && name.trim().length >= 2;

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await apiClient.renameOrganization(String(tenantId), name.trim());
    setSaving(false);
    if (res.success && res.data) {
      const next = (res.data as { name: string }).name;
      setSavedName(next);
      setName(next);
      toast({ title: "Organization name updated", description: next });
      return;
    }
    const fieldErrors = res.errors as Record<string, string[]> | undefined;
    setError(fieldErrors?.name?.[0] || res.error || "Couldn't update the name. Please try again.");
  };

  return (
    <Card className="glass border-0">
      <CardHeader className="p-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4" />
          Organization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <Label htmlFor="org-name">Organization name</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="org-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dirty && !saving && void save()}
          />
          <Button onClick={save} disabled={!dirty || saving} className="sm:w-auto">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Shown to your team and on your invoices.</p>
      </CardContent>
    </Card>
  );
}

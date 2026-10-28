// Shows which organization the person is working in and, when they belong to more than one, lets them switch. The choice is saved on their account,
// so it holds on every device until they change it. Switching reloads the app, so every page starts again inside the other organization.
import { useState } from "react";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { apiClient } from "@/lib/api";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  en: { label: "Organization", switchTo: "Switch organization", failed: "Could not switch organization. Try again.", roles: { owner: "Owner", admin: "Admin", supervisor: "Supervisor", agent: "Agent" } as Record<string, string> },
  sw: { label: "Shirika", switchTo: "Badili shirika", failed: "Imeshindikana kubadili shirika. Jaribu tena.", roles: { owner: "Mmiliki", admin: "Msimamizi", supervisor: "Msimamizi wa simu", agent: "Mhudumu" } as Record<string, string> },
};

/** Switch to ``tenantId`` and start the app again inside it. Returns false when the server refused. */
export async function switchOrganization(tenantId: string): Promise<boolean> {
  const res = await apiClient.switchTenant(tenantId);
  if (!res.success) return false;
  window.location.assign("/dashboard");
  return true;
}

export function OrganizationSwitcher({ className = "" }: { className?: string }) {
  const T = TEXT[appLanguage()];
  const { toast } = useToast();
  const { currentOrganization, organizations } = useServices();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  if (!currentOrganization) return null;

  const several = organizations.length > 1;
  const currentId = currentOrganization.tenant_id ?? currentOrganization.tenant;
  const name = currentOrganization.tenant_name || T.label;
  const body = (
    <span className="flex min-w-0 items-center gap-2 text-left">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{T.label}</span>
        <span className="block truncate text-[13px] font-semibold leading-tight" title={name}>{name}</span>
      </span>
      {several && <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
    </span>
  );
  if (!several) return <div className={`rounded-lg border border-border/60 px-2 py-1.5 ${className}`}>{body}</div>;

  const pick = async (id: string) => {
    if (id === currentId || busy) { setOpen(false); return; }
    setBusy(id);
    const ok = await switchOrganization(id);
    if (!ok) { setBusy(null); toast({ title: T.failed, variant: "destructive" }); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={T.switchTo} className={`w-full rounded-lg border border-border/60 px-2 py-1.5 transition-colors hover:bg-accent/50 ${className}`}>{body}</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{T.switchTo}</p>
        {organizations.map((m) => {
          const id = m.tenant_id ?? m.tenant;
          return (
            <button key={m.id ?? id} type="button" onClick={() => void pick(id)} disabled={!!busy}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent ${id === currentId ? "bg-accent/60" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.tenant_name || id}</span>
                <span className="block text-xs text-muted-foreground">{T.roles[m.role] ?? m.role}</span>
              </span>
              {busy === id ? <Loader2 className="h-4 w-4 animate-spin" /> : id === currentId ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

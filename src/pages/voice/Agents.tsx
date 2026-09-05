// Wahudumu — the business's directory of people a call can be handed to.
// A transfer box in the builder picks one of these by name, and every call
// that reaches an agent (or that an agent places from the app) is
// attributed to them in Call History and Recordings.
import { useCallback, useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, AlertCircle, RefreshCw, PhoneForwarded } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { voiceApi } from "@/services/voiceApi";
import { AgentChip } from "@/components/voice/RecordingPlayerBar";

export interface Agent {
  id: string;
  name: string;
  phone_number: string;
  department: string;
  user: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Draft {
  name: string;
  phone_number: string;
  department: string;
  linkToMe: boolean;
}

const EMPTY: Draft = { name: "", phone_number: "", department: "", linkToMe: false };

export default function Agents() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await voiceApi.get<Agent[]>("/voice/agents/");
    if (res.success && res.data) setAgents(res.data);
    else setError(res.error || "Failed to load agents");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setEditing(null);
    setDraft(EMPTY);
    setFormError(null);
    setOpen(true);
  };
  const startEdit = (agent: Agent) => {
    setEditing(agent);
    setDraft({
      name: agent.name,
      phone_number: agent.phone_number,
      department: agent.department,
      linkToMe: !!user && agent.user === Number(user.id),
    });
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    const body = {
      name: draft.name.trim(),
      phone_number: draft.phone_number.trim(),
      department: draft.department.trim(),
      user: draft.linkToMe && user ? Number(user.id) : null,
    };
    const res = editing
      ? await voiceApi.patch<Agent>(`/voice/agents/${editing.id}/`, body)
      : await voiceApi.post<Agent>("/voice/agents/", body);
    setSaving(false);
    if (!res.success) {
      setFormError(res.error || "Haikuweza kuhifadhiwa.");
      return;
    }
    setOpen(false);
    toast({ title: editing ? "Mhudumu amesasishwa" : "Mhudumu ameongezwa", description: body.name });
    load();
  };

  const toggleActive = async (agent: Agent) => {
    const res = await voiceApi.patch<Agent>(`/voice/agents/${agent.id}/`, { is_active: !agent.is_active });
    if (res.success && res.data) setAgents((prev) => prev.map((a) => (a.id === agent.id ? res.data! : a)));
  };

  const remove = async (agent: Agent) => {
    if (!window.confirm(`Ondoa ${agent.name} kwenye orodha ya wahudumu?`)) return;
    const res = await voiceApi.delete(`/voice/agents/${agent.id}/`);
    if (res.success) {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      toast({ title: "Mhudumu ameondolewa", description: agent.name });
    } else {
      toast({ title: "Haikuweza kuondolewa", description: res.error, variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-5xl space-y-3.5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Agents</h1>
                <p className="mt-0.5 text-sm text-foreground/60">
                  Wahudumu wanaopokea simu. A transfer box in a flow picks one of these by name, and their calls are
                  credited to them.
                </p>
              </div>
              <Button onClick={startAdd}>
                <Plus className="mr-1.5 h-4 w-4" />
                Ongeza mhudumu
              </Button>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={load}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}

            {!error && !isLoading && agents.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Hakuna mhudumu bado</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Ongeza watu wanaopokea simu za wateja. Ukishawaongeza, kisanduku cha "Mpeleke kwa Mhudumu" kwenye
                    mtiririko kitawaonyesha kwa majina.
                  </p>
                  <Button className="mt-2" onClick={startAdd}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Ongeza mhudumu wa kwanza
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && agents.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Agent</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>App login</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id} className={agent.is_active ? "" : "opacity-60"}>
                          <TableCell>
                            <AgentChip name={agent.name} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-sm text-foreground">{agent.phone_number}</TableCell>
                          <TableCell className="text-sm text-foreground/80">{agent.department || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {agent.user ? (user && agent.user === Number(user.id) ? "Mimi" : `User #${agent.user}`) : "—"}
                          </TableCell>
                          <TableCell>
                            <Switch checked={agent.is_active} onCheckedChange={() => toggleActive(agent)} aria-label="Available for transfers" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(agent)} aria-label="Hariri">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(agent)} aria-label="Ondoa">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {!error && !isLoading && agents.length > 0 && (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <PhoneForwarded className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Kwenye mtiririko, fungua kisanduku cha "Mpeleke kwa Mhudumu" na uchague mhudumu kutoka kwenye orodha. Namba
                yake na jina hujazwa yenyewe.
              </p>
            )}
          </div>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Hariri mhudumu" : "Ongeza mhudumu"}</DialogTitle>
            <DialogDescription>Simu za wateja zitaelekezwa kwenye namba hii.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="agent-name">Jina</Label>
              <Input id="agent-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="mf. Sally" autoFocus />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-phone">Namba ya simu</Label>
              <Input
                id="agent-phone"
                value={draft.phone_number}
                onChange={(e) => setDraft({ ...draft, phone_number: e.target.value })}
                placeholder="+255712345678"
                inputMode="tel"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-dept">Idara (si lazima)</Label>
              <Input id="agent-dept" value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="mf. Huduma kwa Wateja" />
            </div>
            {user && (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={draft.linkToMe} onCheckedChange={(v) => setDraft({ ...draft, linkToMe: v === true })} className="mt-0.5" />
                <span>
                  Huyu ni mimi ({user.email})
                  <span className="block text-xs text-muted-foreground">Simu nitakazopiga kutoka kwenye programu zitahesabiwa kwa mhudumu huyu.</span>
                </span>
              </label>
            )}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Ghairi
            </Button>
            <Button onClick={save} disabled={saving || !draft.name.trim() || draft.phone_number.replace(/\D/g, "").length < 9}>
              {saving ? "Inahifadhi…" : "Hifadhi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

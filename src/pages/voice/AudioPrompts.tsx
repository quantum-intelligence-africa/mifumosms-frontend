// Maktaba ya Ujumbe — the tenant's reusable message library. A prompt is
// either typed text (read aloud by the provider's text-to-speech, same
// {company_name}-style placeholders as everywhere else) or an uploaded
// audio file (played verbatim). Built here once, then picked by name from
// any flow's "Ujumbe wa Sauti" box instead of retyping or re-pasting a URL.
import { useCallback, useEffect, useRef, useState } from "react";
import { FileAudio, Type, Plus, Pencil, Trash2, AlertCircle, RefreshCw, Search, Upload, MessageSquareText } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";
import { PlayButton, RecordingPlayerBar, formatSize, useRecordingPlayer } from "@/components/voice/RecordingPlayerBar";
import { cn } from "@/lib/utils";

export interface AudioPrompt {
  id: string;
  name: string;
  kind: "text" | "audio";
  text: string;
  voice: string;
  audio_url: string;
  mime_type: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

const SW_VOICE = "sw-KE-Chirp3-HD-Aoede";
const PLACEHOLDER_HELP = "Unaweza kutumia {company_name}, {customer_name}, {agent_name}, {business_hours}.";

type Mode = "text" | "audio";
interface Draft {
  name: string;
  text: string;
  voice: string;
}
const EMPTY: Draft = { name: "", text: "", voice: SW_VOICE };

export default function AudioPrompts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompts, setPrompts] = useState<AudioPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AudioPrompt | null>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const player = useRecordingPlayer();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await voiceApi.get<AudioPrompt[]>("/voice/ivr/prompts/");
    if (res.success && res.data) setPrompts(res.data);
    else setError(res.error || "Failed to load prompts");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = prompts.filter((p) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()));

  const startAdd = (kind: Mode) => {
    setEditing(null);
    setMode(kind);
    setDraft(EMPTY);
    setFile(null);
    setFormError(null);
    setOpen(true);
  };
  const startEdit = (prompt: AudioPrompt) => {
    setEditing(prompt);
    setMode(prompt.kind);
    setDraft({ name: prompt.name, text: prompt.text, voice: prompt.voice || SW_VOICE });
    setFile(null);
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setFormError("Andika jina la ujumbe.");
      return;
    }
    setSaving(true);
    setFormError(null);

    if (mode === "text") {
      if (!draft.text.trim()) {
        setFormError("Andika maandishi ya kusomwa.");
        setSaving(false);
        return;
      }
      const body = { name: draft.name.trim(), kind: "text", text: draft.text.trim(), voice: draft.voice };
      const res = editing
        ? await voiceApi.patch<AudioPrompt>(`/voice/ivr/prompts/${editing.id}/`, body)
        : await voiceApi.post<AudioPrompt>("/voice/ivr/prompts/", body);
      setSaving(false);
      if (!res.success) {
        setFormError(res.error || "Haikuweza kuhifadhiwa.");
        return;
      }
      setOpen(false);
      toast({ title: editing ? "Ujumbe umesasishwa" : "Ujumbe umeongezwa", description: draft.name });
      load();
      return;
    }

    // audio: rename-only (no new file) goes through the plain JSON endpoint;
    // a chosen file goes through the multipart upload endpoint.
    if (!file) {
      if (!editing) {
        setFormError("Chagua faili la sauti.");
        setSaving(false);
        return;
      }
      const res = await voiceApi.patch<AudioPrompt>(`/voice/ivr/prompts/${editing.id}/`, { name: draft.name.trim() });
      setSaving(false);
      if (!res.success) {
        setFormError(res.error || "Haikuweza kuhifadhiwa.");
        return;
      }
      setOpen(false);
      toast({ title: "Ujumbe umesasishwa", description: draft.name });
      load();
      return;
    }
    const form = new FormData();
    form.set("name", draft.name.trim());
    if (editing) form.set("id", editing.id);
    form.set("audio_file", file);
    const res = await voiceApi.postForm<AudioPrompt>("/voice/ivr/prompts/upload/", form);
    setSaving(false);
    if (!res.success) {
      setFormError(res.error || "Upakiaji haukufanikiwa.");
      return;
    }
    setOpen(false);
    toast({ title: editing ? "Sauti imesasishwa" : "Sauti imepakiwa", description: draft.name });
    load();
  };

  const remove = async (prompt: AudioPrompt) => {
    if (!window.confirm(`Futa ujumbe "${prompt.name}"? Mtiririko yoyote unaoutumia utabaki na maandishi/kiungo cha zamani.`)) return;
    const res = await voiceApi.delete(`/voice/ivr/prompts/${prompt.id}/`);
    if (res.success) {
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
      toast({ title: "Ujumbe umefutwa", description: prompt.name });
    } else {
      toast({ title: "Haikuweza kufutwa", description: res.error, variant: "destructive" });
    }
  };

  const play = (prompt: AudioPrompt) => {
    if (!prompt.audio_url) return;
    player.toggle({ id: prompt.id, url: prompt.audio_url, title: prompt.name, subtitle: formatSize(prompt.size_bytes) });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn("flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4", player.track && "pb-28")}>
          <div className="mx-auto max-w-5xl space-y-3.5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Audio Prompts</h1>
                <p className="mt-0.5 text-sm text-foreground/60">
                  Maktaba ya ujumbe — tengeneza mara moja, tumia kwenye mtiririko wowote kwa jina.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startAdd("audio")}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Pakia sauti
                </Button>
                <Button onClick={() => startAdd("text")}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Andika ujumbe
                </Button>
              </div>
            </header>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…" className="h-10 pl-9" aria-label="Search prompts" />
            </div>

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

            {!error && !isLoading && filtered.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <MessageSquareText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">{query ? "Hakuna kinacholingana" : "Hakuna ujumbe bado"}</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {query
                      ? "Jaribu jina lingine."
                      : 'Ongeza ujumbe wa kwanza — andika maandishi ya kusomwa na mfumo, au pakia faili la sauti. Kisha uchague kwenye kisanduku cha "Ujumbe wa Sauti" katika mtiririko wowote.'}
                  </p>
                  {!query && (
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" onClick={() => startAdd("audio")}>
                        <Upload className="mr-1.5 h-4 w-4" />
                        Pakia sauti
                      </Button>
                      <Button onClick={() => startAdd("text")}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Andika ujumbe
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && filtered.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-10" />
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="min-w-[280px]">Content</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((prompt) => {
                        const current = player.isCurrent(prompt.id);
                        const playing = player.isPlaying(prompt.id);
                        return (
                          <TableRow key={prompt.id} className={cn(current && "bg-primary/5 hover:bg-primary/5")}>
                            <TableCell className="pr-0">
                              {prompt.kind === "audio" ? (
                                <PlayButton active={current} playing={playing} onClick={() => play(prompt)} />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/50">
                                  <Type className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium text-foreground">{prompt.name}</TableCell>
                            <TableCell>
                              <Badge variant={prompt.kind === "audio" ? "secondary" : "outline"} className="gap-1">
                                {prompt.kind === "audio" ? <FileAudio className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                                {prompt.kind === "audio" ? "Audio" : "Text"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md">
                              {prompt.kind === "text" ? (
                                <p className="line-clamp-2 text-sm text-foreground/80">{prompt.text}</p>
                              ) : (
                                <p className="truncate font-mono text-xs text-muted-foreground">{prompt.mime_type || "audio"}</p>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {prompt.kind === "audio" ? formatSize(prompt.size_bytes) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(prompt)} aria-label="Hariri">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(prompt)} aria-label="Futa">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Hariri ujumbe" : mode === "audio" ? "Pakia sauti" : "Andika ujumbe"}</DialogTitle>
            <DialogDescription>
              {mode === "text"
                ? "Maandishi haya yatasomwa na mfumo popote unapoyachagua kwenye mtiririko."
                : "Faili hili litachezwa moja kwa moja — muziki wa kusubiri, salamu iliyorekodiwa, au jingle."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  ["text", Type, "Andika maandishi"],
                  ["audio", FileAudio, "Pakia sauti"],
                ] as Array<[Mode, typeof Type, string]>
              ).map(([m, Icon, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="prompt-name">Jina</Label>
              <Input id="prompt-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="mf. Salamu ya Asubuhi" autoFocus />
            </div>

            {mode === "text" ? (
              <div className="space-y-1">
                <Label htmlFor="prompt-text">Maandishi ya kusomwa</Label>
                <Textarea
                  id="prompt-text"
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  placeholder="Karibu {company_name}. Asante kwa kuwasiliana nasi."
                  rows={4}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">{PLACEHOLDER_HELP}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="prompt-file">{editing ? "Badilisha faili (si lazima)" : "Faili la sauti"}</Label>
                <input
                  ref={fileRef}
                  id="prompt-file"
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
                />
                {file && <p className="text-[11px] text-muted-foreground">{file.name} · {formatSize(file.size)}</p>}
                {!file && editing && <p className="text-[11px] text-muted-foreground">Bila kuchagua faili jipya, jina tu ndilo litakalosasishwa.</p>}
                <p className="text-[11px] text-muted-foreground">MP3, WAV au OGG. Kiwango cha juu 10 MB.</p>
              </div>
            )}

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Ghairi
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Inahifadhi…" : "Hifadhi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KeyRound,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Wallet,
  Search,
  Send,
  Tag,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

const methodClass = (method: string) => {
  if (method === "GET") return "bg-emerald-200 text-emerald-900 dark:bg-emerald-300 dark:text-emerald-950";
  if (method === "POST") return "bg-blue-600 text-white dark:bg-blue-500";
  return "bg-muted text-foreground border border-border-subtle";
};

interface SandboxResult {
  status: number | null;
  ok: boolean;
  durationMs: number;
  body: unknown;
  error?: string;
}

async function sandboxFetch(path: string, apiKey: string, init?: RequestInit): Promise<SandboxResult> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.headers || {}),
      },
    });
    const durationMs = Math.round(performance.now() - start);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, ok: res.ok, durationMs, body };
  } catch (err) {
    return {
      status: null,
      ok: false,
      durationMs: Math.round(performance.now() - start),
      body: null,
      error: err instanceof Error ? err.message : "Network error — check the URL or your connection.",
    };
  }
}

function ResultPanel({ result }: { result: SandboxResult | null }) {
  if (!result) return null;
  const label = result.error
    ? "Network error"
    : `${result.status} ${result.ok ? "OK" : "Error"}`;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge
          className={`text-[10px] font-bold ${
            result.error || !result.ok
              ? "bg-red-600 text-white dark:bg-red-500"
              : "bg-emerald-200 text-emerald-900 dark:bg-emerald-300 dark:text-emerald-950"
          }`}
        >
          {label}
        </Badge>
        <span className="text-[11px] text-foreground/50">{result.durationMs}ms</span>
      </div>
      <pre className="text-xs bg-zinc-900 text-zinc-100 dark:bg-zinc-950 rounded-xl p-3 overflow-auto scrollbar-premium whitespace-pre-wrap border border-zinc-700/60 dark:border-zinc-800 shadow-inner max-h-72">
        {result.error || JSON.stringify(result.body, null, 2)}
      </pre>
    </div>
  );
}

function RunButton({
  onClick,
  loading,
  disabled,
  label = "Run",
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button size="sm" onClick={onClick} disabled={loading || disabled} className="gap-1.5">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      {loading ? "Running…" : label}
    </Button>
  );
}

export function ApiSandbox() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [balanceResult, setBalanceResult] = useState<SandboxResult | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [messageId, setMessageId] = useState("");
  const [statusResult, setStatusResult] = useState<SandboxResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [senderId, setSenderId] = useState("");
  const [sendResult, setSendResult] = useState<SandboxResult | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  const [senderListResult, setSenderListResult] = useState<SandboxResult | null>(null);
  const [senderListLoading, setSenderListLoading] = useState(false);
  const [requestedSenderName, setRequestedSenderName] = useState("");
  const [requestedSampleContent, setRequestedSampleContent] = useState("");
  const [senderRequestResult, setSenderRequestResult] = useState<SandboxResult | null>(null);
  const [senderRequestLoading, setSenderRequestLoading] = useState(false);

  const hasKey = apiKey.trim().length > 0;

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.generateApiKey({ name: `Sandbox key ${new Date().toLocaleString()}` });
      if (res.success && res.data?.api_key) {
        setApiKey(res.data.api_key);
        setShowKey(true);
        toast({
          title: "Sandbox key generated",
          description: "This key is only shown once — it's held in this page's memory only, not saved anywhere.",
        });
      } else {
        toast({
          title: "Couldn't generate a key",
          description: res.error || "Try again, or paste an existing key below instead.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Couldn't generate a key", description: "Network error.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runBalance = async () => {
    setBalanceLoading(true);
    setBalanceResult(await sandboxFetch(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.BALANCE, apiKey));
    setBalanceLoading(false);
  };

  const runStatus = async () => {
    if (!messageId.trim()) return;
    setStatusLoading(true);
    setStatusResult(await sandboxFetch(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.STATUS(messageId.trim()), apiKey));
    setStatusLoading(false);
  };

  const runSend = async () => {
    setConfirmSendOpen(false);
    setSendLoading(true);
    setSendResult(
      await sandboxFetch(API_CONFIG.ENDPOINTS.INTEGRATION.SMS.SEND, apiKey, {
        method: "POST",
        body: JSON.stringify({
          recipients: [recipient.trim()],
          message,
          ...(senderId.trim() ? { sender_id: senderId.trim() } : {}),
        }),
      })
    );
    setSendLoading(false);
  };

  const runSenderList = async () => {
    setSenderListLoading(true);
    setSenderListResult(await sandboxFetch(API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.AVAILABLE, apiKey));
    setSenderListLoading(false);
  };

  const runSenderRequest = async () => {
    if (!requestedSenderName.trim()) return;
    setSenderRequestLoading(true);
    setSenderRequestResult(
      await sandboxFetch(API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.REQUEST, apiKey, {
        method: "POST",
        body: JSON.stringify({
          requested_sender_id: requestedSenderName.trim(),
          request_type: "custom",
          sample_content: requestedSampleContent.trim() || "Sandbox test request",
        }),
      })
    );
    setSenderRequestLoading(false);
  };

  return (
    <Card id="integration-sandbox" className="glass border border-teal-200/60 dark:border-teal-800/60">
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-300 font-semibold">Live Sandbox</p>
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
            Try the API for real
          </h2>
          <p className="text-sm text-foreground/80">
            Run real requests against your own account below — no copy-pasting into a terminal required. Your
            sandbox key stays in this page's memory only: it's never saved to your browser or sent anywhere except
            the API itself.
          </p>
        </div>

        {/* Key management */}
        <div className="rounded-xl border border-border-subtle/80 bg-muted/30 p-3 sm:p-4 space-y-2.5">
          <Label className="text-[11px] font-bold uppercase tracking-wide text-foreground/60 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            API Key
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="mif_... — paste an existing key, or generate one"
                className="pr-16 font-mono text-xs"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowKey((s) => !s)}
                  disabled={!apiKey}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyKey}
                  disabled={!apiKey}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateKey} disabled={generating} className="gap-1.5 shrink-0">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              Generate sandbox key
            </Button>
          </div>
        </div>

        {!hasKey && (
          <p className="text-xs text-foreground/60 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Add a key above to enable the actions below.
          </p>
        )}

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="balance" className="text-xs py-1.5 gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Balance
            </TabsTrigger>
            <TabsTrigger value="status" className="text-xs py-1.5 gap-1.5">
              <Search className="w-3.5 h-3.5" /> Status
            </TabsTrigger>
            <TabsTrigger value="send" className="text-xs py-1.5 gap-1.5">
              <Send className="w-3.5 h-3.5" /> Send SMS
            </TabsTrigger>
            <TabsTrigger value="sender" className="text-xs py-1.5 gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Sender IDs
            </TabsTrigger>
          </TabsList>

          {/* Balance */}
          <TabsContent value="balance" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${methodClass("GET")}`}>
                GET
              </span>
              <code className="text-xs font-semibold">{API_CONFIG.ENDPOINTS.INTEGRATION.SMS.BALANCE}</code>
            </div>
            <RunButton onClick={runBalance} loading={balanceLoading} disabled={!hasKey} label="Check balance" />
            <ResultPanel result={balanceResult} />
          </TabsContent>

          {/* Status */}
          <TabsContent value="status" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${methodClass("GET")}`}>
                GET
              </span>
              <code className="text-xs font-semibold">/api/integration/v1/sms/status/&#123;message_id&#125;/</code>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="message_id from a previous send"
                className="text-xs"
              />
              <RunButton onClick={runStatus} loading={statusLoading} disabled={!hasKey || !messageId.trim()} label="Look up" />
            </div>
            <ResultPanel result={statusResult} />
          </TabsContent>

          {/* Send SMS */}
          <TabsContent value="send" className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${methodClass("POST")}`}>
                POST
              </span>
              <code className="text-xs font-semibold">{API_CONFIG.ENDPOINTS.INTEGRATION.SMS.SEND}</code>
            </div>
            <div className="rounded-lg border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              This sends a real SMS and deducts real credits from your account (18 TZS/segment).
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Recipient (international format)</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+255700000000" className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sender ID (optional)</Label>
                <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="Uses your default if left blank" className="text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Test message from the sandbox" className="text-xs" />
            </div>
            <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
              <Button
                size="sm"
                onClick={() => setConfirmSendOpen(true)}
                disabled={sendLoading || !hasKey || !recipient.trim() || !message.trim()}
                className="gap-1.5"
              >
                {sendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendLoading ? "Sending…" : "Send real SMS"}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send a real SMS?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send an actual message to <span className="font-semibold text-foreground">{recipient}</span> and
                    deduct credits from your account. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={runSend}>Send it</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <ResultPanel result={sendResult} />
          </TabsContent>

          {/* Sender IDs */}
          <TabsContent value="sender" className="mt-3 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${methodClass("GET")}`}>
                  GET
                </span>
                <code className="text-xs font-semibold">{API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.AVAILABLE}</code>
              </div>
              <RunButton onClick={runSenderList} loading={senderListLoading} disabled={!hasKey} label="List approved sender IDs" />
              <ResultPanel result={senderListResult} />
            </div>

            <div className="space-y-2 pt-1 border-t border-border-subtle/70">
              <div className="flex items-center gap-2 pt-3">
                <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${methodClass("POST")}`}>
                  POST
                </span>
                <code className="text-xs font-semibold">{API_CONFIG.ENDPOINTS.INTEGRATION.SENDER_ID.REQUEST}</code>
              </div>
              <p className="text-[11px] text-foreground/60">
                Submits a real sender ID approval request that a reviewer will see — not billed, but not throwaway either.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Requested sender ID</Label>
                  <Input value={requestedSenderName} onChange={(e) => setRequestedSenderName(e.target.value)} placeholder="MyBrand1" className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sample message content</Label>
                  <Input value={requestedSampleContent} onChange={(e) => setRequestedSampleContent(e.target.value)} placeholder="What you'll send with this sender ID" className="text-xs" />
                </div>
              </div>
              <RunButton
                onClick={runSenderRequest}
                loading={senderRequestLoading}
                disabled={!hasKey || !requestedSenderName.trim()}
                label="Submit request"
              />
              <ResultPanel result={senderRequestResult} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

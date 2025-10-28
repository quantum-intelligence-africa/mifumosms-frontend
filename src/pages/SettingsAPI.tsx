import React from "react";
import { Key, Webhook, Plus, MoreVertical, Eye, EyeOff, Copy, RefreshCw, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface SettingsAPIProps {
  apiSettings: {
    api_account?: any;
    api_keys?: any[];
    webhooks?: any[];
  } | null;
  isLoading: boolean;
  showApiKeyDialog: boolean;
  setShowApiKeyDialog: (open: boolean) => void;
  showWebhookDialog: boolean;
  setShowWebhookDialog: (open: boolean) => void;
  newApiKeyForm: { key_name: string; permissions: Record<string, string[]> };
  setNewApiKeyForm: (form: any) => void;
  newWebhookForm: { url: string; events: string[] };
  setNewWebhookForm: (form: any) => void;
  showApiKey: Record<string, boolean>;
  setShowApiKey: (state: Record<string, boolean>) => void;
  copyToClipboard: (text: string) => void;
  handleCreateAPIKey: () => void;
  handleRevokeAPIKey: (keyId: string) => void;
  handleRegenerateAPIKey: (keyId: string) => void;
  handleCreateWebhook: () => void;
  handleToggleWebhook: (webhookId: string) => void;
  handleDeleteWebhook: (webhookId: string) => void;
  formatDate: (dateString: string | null) => string;
}

export const SettingsAPI: React.FC<SettingsAPIProps> = ({
  apiSettings,
  isLoading,
  showApiKeyDialog,
  setShowApiKeyDialog,
  showWebhookDialog,
  setShowWebhookDialog,
  newApiKeyForm,
  setNewApiKeyForm,
  newWebhookForm,
  setNewWebhookForm,
  showApiKey,
  setShowApiKey,
  copyToClipboard,
  handleCreateAPIKey,
  handleRevokeAPIKey,
  handleRegenerateAPIKey,
  handleCreateWebhook,
  handleToggleWebhook,
  handleDeleteWebhook,
  formatDate,
}) => {
  const availableEvents = [
    "message.sent",
    "message.delivered",
    "message.failed",
    "campaign.completed",
    "campaign.started",
  ];

  const toggleEvent = (event: string) => {
    const events = newWebhookForm.events || [];
    if (events.includes(event)) {
      setNewWebhookForm({ ...newWebhookForm, events: events.filter(e => e !== event) });
    } else {
      setNewWebhookForm({ ...newWebhookForm, events: [...events, event] });
    }
  };

  return (
    <div className="space-y-4">
      {/* API Keys Card */}
      <Card className="glass border-0">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </div>
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="text-sm">Create API Key</DialogTitle>
                  <DialogDescription className="text-xs">
                    Generate a new API key for your applications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="text-xs">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production API Key"
                      value={newApiKeyForm.key_name}
                      onChange={(e) => setNewApiKeyForm({ ...newApiKeyForm, key_name: e.target.value })}
                      className="glass-subtle border-0 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleCreateAPIKey}
                    disabled={isLoading}
                    className="w-full text-xs"
                  >
                    {isLoading ? "Creating..." : "Create API Key"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading && !apiSettings?.api_keys ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs text-text-subtle">Loading API keys...</p>
            </div>
          ) : !apiSettings?.api_keys || apiSettings.api_keys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-text-subtle mb-3" />
              <p className="text-sm text-text-subtle">No API keys created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiSettings.api_keys.map((key) => (
                <div key={key.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{key.key_name}</h5>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => handleRegenerateAPIKey(key.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Regenerate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive text-xs"
                          onClick={() => handleRevokeAPIKey(key.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs bg-gradient-surface px-2 py-1 rounded flex-1 font-mono break-all">
                      {showApiKey[key.id] ? key.api_key : `mif_${'•'.repeat(40)}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKey({ ...showApiKey, [key.id]: !showApiKey[key.id] })}
                      className="h-6 w-6"
                    >
                      {showApiKey[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(key.api_key)}
                      className="h-6 w-6"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span>Last used: {formatDate(key.last_used)}</span>
                    <Badge
                      variant={key.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {key.status}
                    </Badge>
                  </div>
                  {key.permissions && Object.keys(key.permissions).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.entries(key.permissions).flatMap(([resource, perms]: [string, any]) =>
                        Array.isArray(perms) ? perms.map((perm: string, idx: number) => (
                          <Badge key={`${resource}-${perm}-${idx}`} variant="outline" className="text-xs px-1 py-0">
                            {resource}: {perm}
                          </Badge>
                        )) : []
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Card */}
      <Card className="glass border-0">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </div>
            <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm">Create Webhook</DialogTitle>
                  <DialogDescription className="text-xs">
                    Configure a webhook endpoint to receive events
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl" className="text-xs">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://your-domain.com/webhooks/mifumo"
                      value={newWebhookForm.url}
                      onChange={(e) => setNewWebhookForm({ ...newWebhookForm, url: e.target.value })}
                      className="glass-subtle border-0 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Events</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableEvents.map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <Checkbox
                            id={event}
                            checked={newWebhookForm.events.includes(event)}
                            onCheckedChange={() => toggleEvent(event)}
                          />
                          <label
                            htmlFor={event}
                            className="text-xs cursor-pointer"
                          >
                            {event}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={isLoading || !newWebhookForm.url || newWebhookForm.events.length === 0}
                    className="w-full text-xs"
                  >
                    {isLoading ? "Creating..." : "Create Webhook"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading && !apiSettings?.webhooks ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs text-text-subtle">Loading webhooks...</p>
            </div>
          ) : !apiSettings?.webhooks || apiSettings.webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="w-12 h-12 mx-auto text-text-subtle mb-3" />
              <p className="text-sm text-text-subtle">No webhooks configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiSettings.webhooks.map((webhook) => (
                <div key={webhook.id} className="p-3 rounded-lg bg-gradient-surface border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Link2 className="w-3 h-3 text-text-subtle" />
                      <code className="text-xs bg-gradient-surface px-2 py-1 rounded flex-1 break-all">
                        {webhook.url}
                      </code>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => handleToggleWebhook(webhook.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Toggle Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive text-xs"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <Badge
                      variant={webhook.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {webhook.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-text-subtle">
                      {webhook.successful_calls} / {webhook.total_calls} successful
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {webhook.events.slice(0, 3).map((event) => (
                      <Badge key={event} variant="outline" className="text-xs px-1 py-0">
                        {event}
                      </Badge>
                    ))}
                    {webhook.events.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                      +{webhook.events.length - 3}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-subtle">
                    Last triggered: {formatDate(webhook.last_triggered)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


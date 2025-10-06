import { useState } from "react";
import { 
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
  Ban,
  Star,
  MoreVertical,
  Upload
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type SenderStatus = "approved" | "pending" | "verifying" | "rejected" | "suspended";

interface SenderName {
  id: string;
  name: string;
  status: SenderStatus;
  provider: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
  use_case?: string;
  sample_messages?: string[];
}

const SenderNames = () => {
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [newSenderName, setNewSenderName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [sampleMessage1, setSampleMessage1] = useState("");
  const [sampleMessage2, setSampleMessage2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Demo data - replace with actual API calls
  const [senderNames, setSenderNames] = useState<SenderName[]>([
    {
      id: "1",
      name: "MIFUMO",
      status: "approved",
      provider: "Beem Africa",
      is_default: true,
      created_by: "Mkuu Kariuki",
      created_at: "2024-01-15T10:30:00Z",
      use_case: "Transactional notifications",
    },
    {
      id: "2",
      name: "TAARIFA",
      status: "approved",
      provider: "Beem Africa",
      is_default: false,
      created_by: "Mkuu Kariuki",
      created_at: "2024-02-01T14:20:00Z",
      use_case: "Marketing campaigns",
    },
    {
      id: "3",
      name: "ALERT",
      status: "pending",
      provider: "Beem Africa",
      is_default: false,
      created_by: "Mkuu Kariuki",
      created_at: "2024-03-10T09:15:00Z",
      use_case: "Emergency alerts",
    },
    {
      id: "4",
      name: "PROMO",
      status: "verifying",
      provider: "Beem Africa",
      is_default: false,
      created_by: "Mkuu Kariuki",
      created_at: "2024-03-15T11:45:00Z",
      use_case: "Promotional offers",
    },
  ]);

  const getStatusIcon = (status: SenderStatus) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "verifying":
        return <Clock className="w-4 h-4 text-primary" />;
      case "rejected":
        return <X className="w-4 h-4 text-destructive" />;
      case "suspended":
        return <Ban className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: SenderStatus) => {
    const variants: Record<SenderStatus, "default" | "secondary" | "outline" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      verifying: "secondary",
      rejected: "destructive",
      suspended: "destructive",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const handleRequestSenderName = async () => {
    if (!newSenderName.trim()) {
      toast({
        title: "Sender name required",
        description: "Please enter a sender name",
        variant: "destructive"
      });
      return;
    }

    if (!useCase.trim()) {
      toast({
        title: "Use case required",
        description: "Please describe how you'll use this sender name",
        variant: "destructive"
      });
      return;
    }

    if (!sampleMessage1.trim()) {
      toast({
        title: "Sample message required",
        description: "Please provide at least one sample message",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newSender: SenderName = {
        id: Date.now().toString(),
        name: newSenderName.toUpperCase(),
        status: "pending",
        provider: "Beem Africa",
        is_default: false,
        created_by: "Mkuu Kariuki",
        created_at: new Date().toISOString(),
        use_case: useCase,
        sample_messages: [sampleMessage1, sampleMessage2].filter(Boolean),
      };

      setSenderNames([newSender, ...senderNames]);
      setSubmitting(false);
      setShowRequestDialog(false);
      
      // Reset form
      setNewSenderName("");
      setUseCase("");
      setSampleMessage1("");
      setSampleMessage2("");

      toast({
        title: "Request submitted",
        description: "Your sender name request is pending approval",
      });
    }, 1500);
  };

  const handleSetDefault = (id: string) => {
    setSenderNames(
      senderNames.map(sender => ({
        ...sender,
        is_default: sender.id === id
      }))
    );

    toast({
      title: "Default sender updated",
      description: "This sender name will be used by default",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                  Sender Names
                </h1>
                <p className="text-text-subtle">
                  Manage your registered sender IDs for SMS campaigns
                </p>
              </div>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Request Sender Name
              </Button>
            </div>

            {/* Info Card */}
            <Card className="p-4 glass border-l-4 border-primary">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Sender Name Requirements</p>
                  <ul className="text-text-subtle space-y-1 list-disc list-inside">
                    <li>Maximum 11 characters (alphanumeric)</li>
                    <li>Must be relevant to your business or brand</li>
                    <li>Approval typically takes 1-3 business days</li>
                    <li>Provide valid use case and sample messages</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Sender Names Table */}
            <Card className="glass">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle">
                    <TableHead>Sender Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Use Case</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senderNames.map((sender) => (
                    <TableRow key={sender.id} className="border-border-subtle">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{sender.name}</span>
                          {sender.is_default && (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sender.status)}</TableCell>
                      <TableCell className="text-text-subtle">{sender.provider}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-text-subtle">
                          {sender.use_case || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-text-subtle">
                        {formatDate(sender.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            {sender.status === "approved" && !sender.is_default && (
                              <>
                                <DropdownMenuItem onClick={() => handleSetDefault(sender.id)}>
                                  <Star className="w-4 h-4 mr-2" />
                                  Set as Default
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {sender.status === "pending" && (
                              <DropdownMenuItem className="text-destructive">
                                Cancel Request
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {senderNames.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    No sender names yet
                  </h3>
                  <p className="text-text-subtle mb-4">
                    Request your first sender name to start sending SMS
                  </p>
                  <Button onClick={() => setShowRequestDialog(true)}>
                    Request Sender Name
                  </Button>
                </div>
              )}
            </Card>

            {/* Request Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogContent className="glass max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Request New Sender Name</DialogTitle>
                  <DialogDescription>
                    Submit a request to register a new sender ID for your SMS campaigns
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                  <div className="space-y-2">
                    <Label>Sender Name *</Label>
                    <Input
                      placeholder="e.g., MYCOMPANY"
                      value={newSenderName}
                      onChange={(e) => setNewSenderName(e.target.value.toUpperCase())}
                      maxLength={11}
                      className="glass-subtle border-0 font-mono"
                    />
                    <p className="text-xs text-text-subtle">
                      {newSenderName.length}/11 characters (alphanumeric only)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Use Case *</Label>
                    <Textarea
                      placeholder="Describe how you plan to use this sender name..."
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      className="glass-subtle border-0"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sample Message 1 *</Label>
                    <Textarea
                      placeholder="Provide a sample message you will send..."
                      value={sampleMessage1}
                      onChange={(e) => setSampleMessage1(e.target.value)}
                      className="glass-subtle border-0"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sample Message 2 (Optional)</Label>
                    <Textarea
                      placeholder="Provide another sample message..."
                      value={sampleMessage2}
                      onChange={(e) => setSampleMessage2(e.target.value)}
                      className="glass-subtle border-0"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Supporting Documents (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-text-subtle" />
                      <p className="text-sm text-text-subtle mb-2">
                        Upload business license or registration
                      </p>
                      <input type="file" className="hidden" id="doc-upload" />
                      <label htmlFor="doc-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRequestDialog(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRequestSenderName} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenderNames;

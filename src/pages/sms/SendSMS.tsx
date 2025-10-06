import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  Users,
  Upload,
  Calendar,
  Zap,
  DollarSign,
  FileText,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SenderName {
  id: string;
  name: string;
  status: "approved" | "pending";
  is_default: boolean;
}

interface Segment {
  id: string;
  name: string;
  contact_count: number;
}

const SendSMS = () => {
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<"single" | "bulk" | "segment" | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSender, setSelectedSender] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Demo data - replace with actual API calls
  const senderNames: SenderName[] = [
    { id: "1", name: "MIFUMO", status: "approved", is_default: true },
    { id: "2", name: "TAARIFA", status: "approved", is_default: false },
    { id: "3", name: "ALERT", status: "pending", is_default: false },
  ];

  const segments: Segment[] = [
    { id: "1", name: "VIP Customers", contact_count: 150 },
    { id: "2", name: "All Contacts", contact_count: 1240 },
    { id: "3", name: "Active Users", contact_count: 450 },
  ];

  const messageLength = message.length;
  const segmentCount = Math.ceil(messageLength / 160);
  const costPerSMS = 25; // TZS
  const estimatedCost = recipients.length * segmentCount * costPerSMS;

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    if (modeParam === "single" || modeParam === "bulk" || modeParam === "segment") {
      setSelectedMode(modeParam);
    }
  }, [location.search]);

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      // Basic E.164 validation
      const normalized = newRecipient.startsWith("+") ? newRecipient : `+${newRecipient}`;
      setRecipients([...recipients, normalized]);
      setNewRecipient("");
    }
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter(r => r !== phone));
  };

  const handleSendSMS = async () => {
    if (!selectedSender) {
      toast({
        title: "Sender name required",
        description: "Please select a sender name",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your message",
        variant: "destructive"
      });
      return;
    }

    if (selectedMode === "single" && recipients.length === 0) {
      toast({
        title: "Recipients required",
        description: "Please add at least one recipient",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    setSendProgress(0);

    // Simulate sending progress
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSending(false);
          toast({
            title: "SMS sent successfully",
            description: `Sent to ${recipients.length} recipient(s)`,
          });
          // Reset form
          setRecipients([]);
          setMessage("");
          setSelectedMode(null);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, parse CSV and extract phone numbers
      toast({
        title: "File uploaded",
        description: `Processing ${file.name}...`,
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Send SMS
              </h1>
              <p className="text-text-subtle">
                Send single SMS, bulk messages, or target specific segments
              </p>
            </div>

            {/* Mode Selection */}
            {!selectedMode && (
              <div className="grid md:grid-cols-3 gap-4">
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("single")}
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">Quick SMS</h3>
                  <p className="text-sm text-text-subtle">
                    Send instant messages to individual recipients
                  </p>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("bulk")}
                >
                  <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">File SMS</h3>
                  <p className="text-sm text-text-subtle">
                    Upload CSV file with multiple recipients
                  </p>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("segment")}
                >
                  <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-success-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">Group SMS</h3>
                  <p className="text-sm text-text-subtle">
                    Target contacts from saved segments
                  </p>
                </Card>
              </div>
            )}

            {/* Send Form */}
            {selectedMode && (
              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {selectedMode === "single" && <Zap className="w-5 h-5 text-primary" />}
                    {selectedMode === "bulk" && <Upload className="w-5 h-5 text-secondary" />}
                    {selectedMode === "segment" && <Users className="w-5 h-5 text-success" />}
                    <h2 className="font-heading text-xl font-semibold">
                      {selectedMode === "single" && "Quick SMS"}
                      {selectedMode === "bulk" && "Bulk SMS from File"}
                      {selectedMode === "segment" && "Segment SMS"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMode(null)}
                  >
                    Change method
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Sender Name */}
                  <div className="space-y-2">
                    <Label>Sender Name</Label>
                    <Select value={selectedSender} onValueChange={setSelectedSender}>
                      <SelectTrigger className="glass-subtle border-0">
                        <SelectValue placeholder="Select sender name" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {senderNames.filter(s => s.status === "approved").map((sender) => (
                          <SelectItem key={sender.id} value={sender.id}>
                            {sender.name} {sender.is_default && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipients - Single Mode */}
                  {selectedMode === "single" && (
                    <div className="space-y-2">
                      <Label>Recipients</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter phone number (e.g., +255700000000)"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                          className="glass-subtle border-0"
                        />
                        <Button onClick={addRecipient} variant="outline">
                          Add
                        </Button>
                      </div>
                      {recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {recipients.map((phone) => (
                            <Badge key={phone} variant="secondary" className="pl-3 pr-1 py-1">
                              {phone}
                              <button
                                onClick={() => removeRecipient(phone)}
                                className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recipients - Bulk Mode */}
                  {selectedMode === "bulk" && (
                    <div className="space-y-2">
                      <Label>Upload CSV File</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-text-subtle" />
                        <p className="text-sm text-text-subtle mb-2">
                          Upload CSV file with phone numbers
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload">
                          <Button variant="outline" size="sm" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                      </div>
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          CSV must contain a 'phone' column with E.164 formatted numbers
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Recipients - Segment Mode */}
                  {selectedMode === "segment" && (
                    <div className="space-y-2">
                      <Label>Select Segment</Label>
                      <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                        <SelectTrigger className="glass-subtle border-0">
                          <SelectValue placeholder="Choose a contact segment" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          {segments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name} ({segment.contact_count} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Message</Label>
                      <div className="text-sm text-text-subtle">
                        {messageLength}/160 ({segmentCount} {segmentCount === 1 ? "segment" : "segments"})
                      </div>
                    </div>
                    <Textarea
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[120px] glass-subtle border-0"
                      maxLength={918} // 6 segments max
                    />
                    <p className="text-xs text-text-subtle">
                      {segmentCount > 1 && "Long messages are split into multiple segments"}
                    </p>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as "now" | "later")}>
                      <TabsList className="glass-subtle border-0 w-full">
                        <TabsTrigger value="now" className="flex-1">Send Now</TabsTrigger>
                        <TabsTrigger value="later" className="flex-1">Schedule</TabsTrigger>
                      </TabsList>
                      <TabsContent value="later" className="mt-4">
                        <Input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="glass-subtle border-0"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Cost Preview */}
                  {recipients.length > 0 && message && (
                    <Alert className="glass-subtle border-0">
                      <DollarSign className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium">Cost Estimate</div>
                        <div className="text-sm mt-1">
                          {recipients.length} recipients × {segmentCount} segment(s) × TZS {costPerSMS} =
                          <span className="font-semibold ml-1">TZS {estimatedCost.toLocaleString()}</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Send Progress */}
                  {sending && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sending messages...</span>
                        <span>{sendProgress}%</span>
                      </div>
                      <Progress value={sendProgress} className="h-2" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSendSMS}
                      disabled={sending}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {scheduleType === "now" ? "Send SMS" : "Schedule SMS"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMode(null)}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendSMS;

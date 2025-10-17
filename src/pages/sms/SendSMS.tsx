import { useEffect, useState, useMemo } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
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
import { apiClient } from "@/lib/api";

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
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Normalize phone numbers for API: 12 digits, starts with 255 (no plus)
  const normalizeToApi = (input: string): string | null => {
    const digitsOnly = input.replace(/\D/g, "");
    if (digitsOnly.startsWith("255") && digitsOnly.length === 12) {
      return digitsOnly;
    }
    // Convert local TZ format 0XXXXXXXXX (10 digits) to 255XXXXXXXXX
    if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
      return `255${digitsOnly.slice(1)}`;
    }
    // Convert E.164 +255XXXXXXXXX to 255XXXXXXXXX
    if (input.startsWith("+") && digitsOnly.startsWith("255") && digitsOnly.length === 12) {
      return digitsOnly;
    }
    return null;
  };

  // Demo data - replace with actual API calls
  const senderNames: SenderName[] = useMemo(() => [
    { id: "1", name: "MIFUMO", status: "approved", is_default: false },
    { id: "2", name: "Taarifa-SMS", status: "approved", is_default: true },
    { id: "3", name: "ALERT", status: "pending", is_default: false },
  ], []);

  const segments: Segment[] = useMemo(() => [
    { id: "1", name: "VIP Customers", contact_count: 150 },
    { id: "2", name: "All Contacts", contact_count: 1240 },
    { id: "3", name: "Active Users", contact_count: 450 },
  ], []);

  const messageLength = message.length;
  const segmentCount = Math.ceil(messageLength / 160);
  const costPerSMS = 25; // TZS

  // Calculate cost based on current mode
  const getRecipientCount = () => {
    if (selectedMode === "single") return recipients.length;
    if (selectedMode === "bulk") return recipients.length;
    if (selectedMode === "segment" && selectedSegment) {
      const selectedSegmentData = segments.find(s => s.id === selectedSegment);
      return selectedSegmentData?.contact_count || 0;
    }
    return 0;
  };

  const estimatedCost = getRecipientCount() * segmentCount * costPerSMS;

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    if (modeParam === "single" || modeParam === "bulk" || modeParam === "segment") {
      setSelectedMode(modeParam);
    }
  }, [location.search]);

  // Ensure default sender is Taarifa-SMS if not selected
  useEffect(() => {
    if (!selectedSender) {
      const defaultSender = senderNames.find(s => s.name === "Taarifa-SMS");
      if (defaultSender) setSelectedSender(defaultSender.id);
    }
  }, [selectedSender, senderNames]);

  const addRecipient = () => {
    if (!newRecipient) return;
    const apiNumber = normalizeToApi(newRecipient);
    if (apiNumber) {
      if (!recipients.includes(apiNumber)) {
        setRecipients([...recipients, apiNumber]);
      }
      setNewRecipient("");
    } else {
      toast({
        title: "Invalid phone number",
        description: "Use 12 digits starting with 255 (e.g., 255700000000)",
        variant: "destructive"
      });
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

    if ((selectedMode === "single" || selectedMode === "bulk") && recipients.length === 0) {
      toast({
        title: "Recipients required",
        description: selectedMode === "bulk" ? "Please upload a CSV file with phone numbers" : "Please add at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (selectedMode === "segment" && !selectedSegment) {
      toast({
        title: "Segment required",
        description: "Please select a segment",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    setSendProgress(0);

    try {
      // Determine recipients based on mode
      let targetRecipients: string[] = [];

      if (selectedMode === "single" || selectedMode === "bulk") {
        targetRecipients = recipients;
      } else if (selectedMode === "segment") {
        // For demo purposes, generate mock phone numbers based on segment count
        const selectedSegmentData = segments.find(s => s.id === selectedSegment);
        if (selectedSegmentData) {
          // Generate mock 12-digit TZ numbers without plus, starting with 255
          targetRecipients = Array.from({ length: selectedSegmentData.contact_count }, (_, i) => `255700000${String(i).padStart(3, '0')}`);
        }
      }

      if (targetRecipients.length === 0) {
        setSending(false);
        toast({
          title: "No recipients",
          description: "No recipients found for the selected mode",
          variant: "destructive"
        });
        return;
      }

      // Force sender name to Taarifa-SMS as required by backend
      const senderName = "Taarifa-SMS";

      // Ensure all recipients are normalized for the API
      const apiRecipients = targetRecipients
        .map(r => normalizeToApi(r))
        .filter((r): r is string => Boolean(r));

      // Prepare the data for the Beem SMS API
      const smsData: Record<string, unknown> = {
        message: message.trim(),
        recipients: apiRecipients,
        sender_id: senderName
      };

      // Only add optional fields if they have values
      if (scheduleType === "later" && scheduledDate) {
        smsData.scheduled_at = scheduledDate;
      }

      // Debug: Log the data being sent
      console.log('Sending SMS data:', smsData);
      console.log('Recipients count:', apiRecipients.length);
      console.log('Sender name:', senderName);

      // Call the SMS API
      const response = await apiClient.sendSMS(smsData as {
        message: string;
        recipients: string[];
        sender_id?: string;
        template_id?: string;
        scheduled_at?: string;
      });

      if (response.success) {
        // Simulate progress for better UX
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSending(false);
          toast({
            title: "SMS sent successfully",
                description: `Sent to ${apiRecipients.length} recipient(s)`,
          });
          // Reset form
          setRecipients([]);
          setMessage("");
          setSelectedMode(null);
              setSelectedSegment("");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
      } else {
        setSending(false);
        // Enhanced error handling with more details
        let errorMessage = "An error occurred while sending SMS";

        console.error('SMS API Error:', response);

        if (response.status === 400) {
          // Try to get more specific error details
          if (response.data && typeof response.data === 'object') {
            const errorData = response.data as Record<string, unknown>;
            if ('errors' in errorData && errorData.errors) {
              errorMessage = `Validation errors: ${JSON.stringify(errorData.errors)}`;
            } else if ('message' in errorData && typeof errorData.message === 'string') {
              errorMessage = errorData.message as string;
            } else if ('error' in errorData && typeof errorData.error === 'string') {
              errorMessage = errorData.error as string;
            } else {
              errorMessage = "Invalid data. Please check your input.";
            }
          } else {
            errorMessage = "Invalid data. Please check your input.";
          }
        } else if (response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (response.status === 403) {
          errorMessage = "Insufficient credits. Please purchase more SMS credits.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (response.error) {
          errorMessage = response.error;
        }

        toast({
          title: "Failed to send SMS",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      setSending(false);
      console.error('SMS sending error:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast({
            title: "Invalid CSV",
            description: "CSV file must contain at least a header and one data row",
            variant: "destructive"
          });
          return;
        }

        // Parse CSV header to find phone column
        const header = lines[0].split(',').map(col => col.trim().toLowerCase());
        const phoneColumnIndex = header.findIndex(col =>
          col.includes('phone') || col.includes('number') || col.includes('mobile')
        );

        if (phoneColumnIndex === -1) {
          toast({
            title: "Phone column not found",
            description: "CSV must contain a column with 'phone', 'number', or 'mobile' in the header",
            variant: "destructive"
          });
          return;
        }

        const phoneNumbers: string[] = [];
        const invalidNumbers: string[] = [];

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Handle CSV parsing with proper quote handling
          const columns = parseCSVLine(line);
          const phone = columns[phoneColumnIndex]?.trim().replace(/['"]/g, '');

          if (phone) {
            // Normalize phone number to API format
            const normalizedPhone = normalizeToApi(phone);
            if (normalizedPhone) {
              if (!phoneNumbers.includes(normalizedPhone)) {
                phoneNumbers.push(normalizedPhone);
              }
            } else {
              invalidNumbers.push(phone);
            }
          }
        }

        if (phoneNumbers.length > 0) {
          setRecipients(phoneNumbers);
          toast({
            title: "File processed successfully",
            description: `Found ${phoneNumbers.length} valid phone numbers${invalidNumbers.length > 0 ? ` (${invalidNumbers.length} invalid numbers skipped)` : ''}`,
          });
        } else {
          toast({
            title: "No valid numbers found",
            description: "Please check your CSV format and ensure phone numbers are in E.164 format (+255XXXXXXXXX)",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast({
          title: "Error processing file",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Send SMS
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                Send single SMS, bulk messages, or target specific segments
              </p>
            </div>

            {/* Mode Selection */}
            {!selectedMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card
                  className="p-3 sm:p-4 lg:p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("single")}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl gradient-primary flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2">Quick SMS</h3>
                  <p className="text-xs sm:text-sm text-text-subtle">
                    Send instant messages to individual recipients
                  </p>
                </Card>

                <Card
                  className="p-3 sm:p-4 lg:p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("bulk")}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl gradient-secondary flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2">File SMS</h3>
                  <p className="text-xs sm:text-sm text-text-subtle">
                    Upload CSV file with multiple recipients
                  </p>
                </Card>

                <Card
                  className="p-3 sm:p-4 lg:p-6 cursor-pointer hover:shadow-lg transition-smooth glass"
                  onClick={() => setSelectedMode("segment")}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-success flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success-foreground" />
                  </div>
                  <h3 className="font-heading text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2">Group SMS</h3>
                  <p className="text-xs sm:text-sm text-text-subtle">
                    Target contacts from saved segments
                  </p>
                </Card>
              </div>
            )}

            {/* Send Form */}
            {selectedMode && (
              <Card className="p-3 sm:p-4 lg:p-6 glass">
                <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {selectedMode === "single" && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                    {selectedMode === "bulk" && <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />}
                    {selectedMode === "segment" && <Users className="w-4 h-4 sm:w-5 sm:h-5 text-success" />}
                    <h2 className="font-heading text-lg sm:text-xl font-semibold">
                      {selectedMode === "single" && "Quick SMS"}
                      {selectedMode === "bulk" && "Bulk SMS from File"}
                      {selectedMode === "segment" && "Segment SMS"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMode(null)}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  >
                    <span className="hidden sm:inline">Change method</span>
                    <span className="sm:hidden">Change</span>
                  </Button>
                </div>

                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  {/* Sender Name */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Sender Name</Label>
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
                    <div className="space-y-4">
                      <Label>Upload CSV File</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
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

                      {/* Uploaded File Preview */}
                      {recipients.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Uploaded Recipients ({recipients.length})</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecipients([])}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                          </div>
                          <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                            <div className="flex flex-wrap gap-1">
                              {recipients.slice(0, 20).map((phone) => (
                                <Badge key={phone} variant="secondary" className="text-xs">
                                  {phone}
                                </Badge>
                              ))}
                              {recipients.length > 20 && (
                                <Badge variant="outline" className="text-xs">
                                  +{recipients.length - 20} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <div>CSV must contain a column with 'phone', 'number', or 'mobile' in the header</div>
                            <div className="text-xs">Supported formats: +255XXXXXXXXX, 255XXXXXXXXX, 0XXXXXXXXX</div>
                          </div>
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
                  {getRecipientCount() > 0 && message && (
                    <Alert className="glass-subtle border-0">
                      <DollarSign className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium">Cost Estimate</div>
                        <div className="text-sm mt-1">
                          {getRecipientCount()} recipients × {segmentCount} segment(s) × TZS {costPerSMS} =
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

import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Users, Mail, Phone, Tag, Building, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { parseCSVFile, generateSampleCSV, CSVContact, CSVParseResult } from '@/utils/csvParser';
import { CreateContactRequest } from '@/lib/api';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: CreateContactRequest[]) => Promise<void>;
  isImporting?: boolean;
}

export function CSVImportDialog({ open, onOpenChange, onImport, isImporting = false }: CSVImportDialogProps) {
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<CSVContact[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseCSVFile(file);
      setParseResult(result);
      setSelectedContacts(result.contacts);
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_contacts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (selectedContacts.length === 0) return;

    try {
      setImportProgress(0);

      // Convert CSV contacts to CreateContactRequest format
      const contactsToImport: CreateContactRequest[] = selectedContacts.map(contact => ({
        name: contact.name,
        phone_e164: contact.phone,
        email: contact.email,
        tags: contact.tags || [],
        attributes: {
          company: contact.company || '',
          department: contact.department || ''
        }
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onImport(contactsToImport);

      clearInterval(progressInterval);
      setImportProgress(100);

      // Reset form
      setTimeout(() => {
        setParseResult(null);
        setSelectedContacts([]);
        setImportProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const toggleContactSelection = (index: number) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(contact => contact === parseResult?.contacts[index]);
      if (isSelected) {
        return prev.filter(contact => contact !== parseResult?.contacts[index]);
      } else {
        return [...prev, parseResult?.contacts[index]!];
      }
    });
  };

  const selectAllContacts = () => {
    if (parseResult?.contacts) {
      setSelectedContacts(parseResult.contacts);
    }
  };

  const deselectAllContacts = () => {
    setSelectedContacts([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Contacts from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {!parseResult ? (
            // File Upload Section
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-text-subtle" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-text-subtle mb-4">
                  Select a CSV file containing your contacts with name, email, and phone number columns
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CSV Format Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Required Columns:</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>name (or full_name, fullname, contact_name)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>phone (or phone_number, mobile, mobile_number, tel, telephone)</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Optional Columns:</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-text-subtle" />
                          <span>email (or email_address, e_mail)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-text-subtle" />
                          <span>tags (comma-separated)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-text-subtle" />
                          <span>company (or organization, org)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-text-subtle" />
                          <span>department (or dept, division)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Parse Results Section
            <div className="space-y-4">
              {/* Parse Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-success">{parseResult.contacts.length}</div>
                    <div className="text-sm text-text-subtle">Valid Contacts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <div className="text-2xl font-bold text-destructive">{parseResult.errors.length}</div>
                    <div className="text-sm text-text-subtle">Errors</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="w-8 h-8 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold text-warning">{parseResult.warnings.length}</div>
                    <div className="text-sm text-text-subtle">Warnings</div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Import Errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {parseResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {parseResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Contact Selection */}
              {parseResult.contacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Select Contacts to Import</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllContacts}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAllContacts}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {parseResult.contacts.map((contact, index) => {
                        const isSelected = selectedContacts.includes(contact);
                        return (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleContactSelection(index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-text-subtle space-x-4">
                                  {contact.email && <span>{contact.email}</span>}
                                  <span>{contact.phone}</span>
                                  {contact.company && <span>{contact.company}</span>}
                                </div>
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {contact.tags.map((tag, tagIndex) => (
                                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Progress */}
              {isImporting && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Importing contacts...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-text-subtle">
            {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {parseResult && (
              <Button
                onClick={handleImport}
                disabled={selectedContacts.length === 0 || isImporting}
              >
                {isImporting ? 'Importing...' : `Import ${selectedContacts.length} Contacts`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

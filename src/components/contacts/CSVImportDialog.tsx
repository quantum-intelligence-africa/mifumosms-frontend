import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Users, Mail, Phone, Tag, Building, Users2, FileSpreadsheet } from 'lucide-react';
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
  onImport: (data: {
    import_type: 'csv' | 'excel' | 'phone_contacts';
    csv_data?: string;
    file?: File;
    contacts?: CreateContactRequest[];
    skip_duplicates?: boolean;
    update_existing?: boolean;
  }) => Promise<{
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    total_processed: number;
    errors: Array<{
      row?: number;
      contact?: CreateContactRequest;
      error: string;
    }>;
  }>;
  isImporting?: boolean;
}

export function CSVImportDialog({ open, onOpenChange, onImport, isImporting = false }: CSVImportDialogProps) {
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<CSVContact[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importType, setImportType] = useState<'csv' | 'excel'>('csv');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    total_processed: number;
    errors: Array<{
      row?: number;
      contact?: CreateContactRequest;
      error: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (importType === 'excel') {
        // For Excel files, we'll let the backend handle parsing
        setParseResult({
          contacts: [],
          errors: [],
          warnings: []
        });
        setSelectedContacts([]);
      } else {
        // For CSV files, parse locally
        const result = await parseCSVFile(file);
        setParseResult(result);
        setSelectedContacts(result.contacts);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
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
    if (importType === 'excel' && !fileInputRef.current?.files?.[0]) return;
    if (importType === 'csv' && selectedContacts.length === 0) return;

    try {
      setImportProgress(0);
      setImportResult(null);

      let importData: {
        import_type: 'csv' | 'excel' | 'phone_contacts';
        csv_data?: string;
        file?: File;
        contacts?: CreateContactRequest[];
        skip_duplicates?: boolean;
        update_existing?: boolean;
      };

      if (importType === 'excel') {
        // Excel file import
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        importData = {
          import_type: 'excel',
          file: file,
          skip_duplicates: skipDuplicates,
          update_existing: updateExisting
        };
      } else {
        // CSV data import
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

        importData = {
          import_type: 'csv',
          contacts: contactsToImport,
          skip_duplicates: skipDuplicates,
          update_existing: updateExisting
        };
      }

      // Show loading state during import
      setImportProgress(50);

      // Call the new bulk import function
      const result = await onImport(importData);
      setImportResult(result);

      // Show completion
      setImportProgress(100);

      // Wait a bit to show completion, then close
      setTimeout(() => {
        setParseResult(null);
        setSelectedContacts([]);
        setImportProgress(0);
        setImportResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onOpenChange(false);
      }, 3000); // Increased delay to show completion message

    } catch (error) {
      console.error('Import error:', error);
      setImportProgress(0);
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
      <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[90vh] max-h-[95vh] flex flex-col p-2 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Import Contacts from File
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {!parseResult ? (
            // File Upload Section
            <div className="space-y-3 sm:space-y-4">
              {/* Import Type Selection */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={importType === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('csv')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV File
                </Button>
                <Button
                  variant={importType === 'excel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('excel')}
                  className="flex-1"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel File
                </Button>
              </div>

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skipDuplicates"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="skipDuplicates" className="text-sm font-medium">
                    Skip Duplicates
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateExisting"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="updateExisting" className="text-sm font-medium">
                    Update Existing
                  </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-text-subtle" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  Upload {importType === 'excel' ? 'Excel' : 'CSV'} File
                </h3>
                <p className="text-sm sm:text-base text-text-subtle mb-3 sm:mb-4">
                  Select a {importType === 'excel' ? 'Excel (.xlsx, .xls)' : 'CSV'} file containing your contacts with name, email, and phone number columns
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importType === 'excel' ? '.xlsx,.xls' : '.csv'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                  Choose {importType === 'excel' ? 'Excel' : 'CSV'} File
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-xs sm:text-sm">
                    {importType === 'excel' ? 'Excel' : 'CSV'} Format Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground text-sm">Required Columns:</h4>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">name (or full_name, fullname, contact_name)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">phone (or phone_number, mobile, mobile_number, tel, telephone)</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground text-sm">Optional Columns:</h4>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-text-subtle mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">email (or email_address, e_mail)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-text-subtle mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">tags (comma-separated)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building className="w-3 h-3 sm:w-4 sm:h-4 text-text-subtle mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">company (or organization, org)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Users2 className="w-3 h-3 sm:w-4 sm:h-4 text-text-subtle mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">department (or dept, division)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {importType === 'excel' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Excel Support:</strong> Excel files (.xlsx, .xls) are automatically parsed.
                        The first row should contain column headers, and data should start from the second row.
                      </p>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={handleDownloadSample} className="w-full sm:w-auto">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Parse Results Section
            <div className="space-y-4">
              {/* Import Results Summary */}
              {importResult ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-success">{importResult.imported}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Imported</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{importResult.updated}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Updated</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <X className="w-6 h-6 sm:w-8 sm:h-8 text-warning mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-warning">{importResult.skipped}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Skipped</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-destructive">{importResult.errors.length}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Errors</div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-success">{parseResult.contacts.length}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Valid Contacts</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-destructive">{parseResult.errors.length}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Errors</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-warning mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-warning">{parseResult.warnings.length}</div>
                      <div className="text-xs sm:text-sm text-text-subtle">Warnings</div>
                    </CardContent>
                  </Card>
                </div>
              )}

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

              {/* Contact Selection - Only for CSV files */}
              {importType === 'csv' && parseResult.contacts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-xs sm:text-sm">Select Contacts to Import</CardTitle>
                      <div className="flex gap-1 sm:gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllContacts} className="text-xs px-2 sm:px-3">
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAllContacts} className="text-xs px-2 sm:px-3">
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
                      {parseResult.contacts.map((contact, index) => {
                        const isSelected = selectedContacts.includes(contact);
                        return (
                          <div
                            key={index}
                            className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleContactSelection(index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-base truncate">{contact.name}</div>
                                <div className="text-xs sm:text-sm text-text-subtle space-y-1 sm:space-x-4 sm:space-y-0">
                                  {contact.email && <div className="truncate">{contact.email}</div>}
                                  <div className="truncate">{contact.phone}</div>
                                  {contact.company && <div className="truncate">{contact.company}</div>}
                                </div>
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {contact.tags.map((tag, tagIndex) => (
                                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isSelected && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 ml-2" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Excel file ready for import */}
              {importType === 'excel' && parseResult && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <h3 className="text-lg font-semibold mb-2">Excel File Ready for Import</h3>
                    <p className="text-sm text-text-subtle mb-4">
                      Your Excel file has been selected and is ready to be imported.
                      The backend will automatically parse the file and process all valid contacts.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-text-subtle">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Skip Duplicates: {skipDuplicates ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Update Existing: {updateExisting ? 'Yes' : 'No'}</span>
                      </div>
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

        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2 sm:pt-4">
          <div className="text-xs sm:text-sm text-text-subtle order-2 sm:order-1">
            {importType === 'excel'
              ? 'Excel file ready for import'
              : `${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''} selected`
            }
          </div>
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            {parseResult && (
              <Button
                onClick={handleImport}
                disabled={
                  (importType === 'csv' && selectedContacts.length === 0) ||
                  (importType === 'excel' && !fileInputRef.current?.files?.[0]) ||
                  isImporting
                }
                className="w-full sm:w-auto"
              >
                {isImporting
                  ? 'Importing...'
                  : importType === 'excel'
                    ? 'Import Excel File'
                    : `Import ${selectedContacts.length} Contacts`
                }
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

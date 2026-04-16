import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Users, Mail, Phone, Tag, Building, Users2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { parseCSVFile, generateSampleCSV, CSVContact, CSVParseResult } from '@/utils/csvParser';
import { parseExcelFile } from '@/utils/excelParser';
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
        // For Excel files, parse locally like CSV
        const result = await parseExcelFile(file);
        setParseResult(result);
        setSelectedContacts(result.contacts);
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
    if (importType === 'excel' && selectedContacts.length === 0) return;
    if (importType === 'csv' && selectedContacts.length === 0) return;

    try {
      setImportProgress(0);

      // Convert selected contacts to CreateContactRequest format
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

      const importData = {
        import_type: importType as 'csv' | 'excel',
        contacts: contactsToImport,
        skip_duplicates: skipDuplicates,
        update_existing: updateExisting
      };

      // Show loading state during import
      setImportProgress(50);

      // Call the new bulk import function
      const result = await onImport(importData);
      setImportResult(result);

      // Show completion
      setImportProgress(100);

      // Only auto-close if successful with no errors
      if (result.success && result.errors.length === 0) {
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
        }, 2000); // Show success for 2 seconds
      }
      // If there are errors, keep dialog open to allow retry

    } catch (error) {
      console.error('Import error:', error);
      setImportProgress(0);
      // Don't auto-close on error, let user retry
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

  // Reset form state when dialog closes
  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setParseResult(null);
      setSelectedContacts([]);
      setImportProgress(0);
      setImportResult(null);
      setImportType('csv');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col p-2 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Import Contacts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {!parseResult ? (
            // File Upload Section - Compact Design
            <div className="space-y-4">
              {/* File Type & Upload in One Section */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  variant={importType === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('csv')}
                  className="h-9 sm:h-12 text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  CSV
                </Button>
                <Button
                  variant={importType === 'excel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('excel')}
                  className="h-9 sm:h-12 text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Excel
                </Button>
              </div>

              {/* Upload Area - Compact */}
              <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-text-subtle" />
                <h3 className="font-semibold text-xs sm:text-base mb-1 sm:mb-2">
                  Upload {importType === 'excel' ? 'Excel' : 'CSV'} File
                </h3>
                <p className="text-xs text-text-subtle mb-2 sm:mb-4">
                  Phone column required (name & email optional)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importType === 'excel' ? '.xlsx,.xls' : '.csv'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                  Choose File
                </Button>
              </div>

              {/* Options & Requirements in Tabs/Accordion Style */}
              <div className="grid grid-cols-1 gap-4">
                {/* Import Options - Compact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="checkbox"
                        id="skipDuplicates"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      <label htmlFor="skipDuplicates" className="text-xs sm:text-sm font-medium">
                        Skip Duplicates
                      </label>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="checkbox"
                        id="updateExisting"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      <label htmlFor="updateExisting" className="text-xs sm:text-sm font-medium">
                        Update Existing
                      </label>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadSample} className="text-xs h-7 sm:h-8 px-2">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Sample
                  </Button>
                </div>

                {/* Format Requirements - Collapsible */}
                <details className="group">
                  <summary className="flex items-center justify-between p-2 sm:p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
                    <span className="font-medium text-xs sm:text-sm">Format Requirements</span>
                    <span className="text-xs text-text-subtle group-open:hidden">View</span>
                    <span className="text-xs text-text-subtle hidden group-open:inline">Hide</span>
                  </summary>
                  <div className="mt-2 p-2 sm:p-4 bg-muted/10 rounded-lg border text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <h4 className="font-medium text-primary mb-1 sm:mb-2 text-xs sm:text-sm">Required:</h4>
                        <div className="space-y-0.5 sm:space-y-1 text-xs">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Phone className="w-3 h-3 text-primary" />
                            <span>phone, mobile</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-text-subtle mb-1 sm:mb-2 text-xs sm:text-sm">Optional:</h4>
                        <div className="space-y-0.5 sm:space-y-1 text-xs">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Users className="w-3 h-3 text-text-subtle" />
                            <span>name, full_name</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Mail className="w-3 h-3 text-text-subtle" />
                            <span>email</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Tag className="w-3 h-3 text-text-subtle" />
                            <span>tags, company</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            // Parse Results Section
            <div className="space-y-4">
              {/* Import Results Summary */}
              {importResult ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-success mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-success">{importResult.imported}</div>
                        <div className="text-xs text-text-subtle">Imported</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-blue-600">{importResult.updated}</div>
                        <div className="text-xs text-text-subtle">Updated</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <X className="w-4 h-4 sm:w-6 sm:h-6 text-warning mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-warning">{importResult.skipped}</div>
                        <div className="text-xs text-text-subtle">Skipped</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-destructive mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-destructive">{importResult.errors.length}</div>
                        <div className="text-xs text-text-subtle">Errors</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Import Result Errors */}
                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive" className="p-2 sm:p-4">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <AlertDescription className="ml-2 text-xs sm:text-sm">
                        <div className="font-medium mb-1 sm:mb-2">Import Errors ({importResult.errors.length}):</div>
                        <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs">
                            {importResult.errors.map((error, index) => {
                              const errorObj = typeof error === 'object' ? error : { error: String(error) };
                              const rowDisplay = errorObj.row ? `Row ${errorObj.row}` : 'Error';
                              const errorMsg = errorObj.error || String(error);
                              const contactInfo = errorObj.contact ? ` (${errorObj.contact})` : '';

                              return (
                                <li key={index} className="break-words">
                                  <span className="font-medium">{rowDisplay}:</span> {errorMsg}{contactInfo}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-success mx-auto mb-1" />
                      <div className="text-sm sm:text-2xl font-bold text-success">{parseResult.contacts.length}</div>
                      <div className="text-xs text-text-subtle">Valid</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-destructive mx-auto mb-1" />
                      <div className="text-sm sm:text-2xl font-bold text-destructive">{parseResult.errors.length}</div>
                      <div className="text-xs text-text-subtle">Errors</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-warning mx-auto mb-1" />
                      <div className="text-sm sm:text-2xl font-bold text-warning">{parseResult.warnings.length}</div>
                      <div className="text-xs text-text-subtle">Warnings</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive" className="p-2 sm:p-4">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <AlertDescription className="ml-2 text-xs sm:text-sm">
                    <div className="font-medium mb-1 sm:mb-2">Parsing Errors ({parseResult.errors.length}):</div>
                    <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs max-h-32 sm:max-h-40 overflow-y-auto">
                      {parseResult.errors.map((error, index) => {
                        // Handle different error formats
                        const errorStr = typeof error === 'string' ? error : error.error || String(error);
                        return (
                          <li key={index} className="break-words">
                            {errorStr}
                          </li>
                        );
                      })}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <Alert className="p-2 sm:p-4">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <AlertDescription className="ml-2 text-xs sm:text-sm">
                    <div className="font-medium mb-1 sm:mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs">
                      {parseResult.warnings.map((warning, index) => (
                        <li key={index} className="break-words">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Contact Selection - For both CSV and Excel files */}
              {parseResult.contacts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <CardTitle className="text-xs sm:text-sm">Select Contacts ({parseResult.contacts.length})</CardTitle>
                      <div className="flex gap-1 sm:gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllContacts} className="text-xs px-2 h-7 sm:h-8">
                          All
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAllContacts} className="text-xs px-2 h-7 sm:h-8">
                          None
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    <div className="max-h-40 sm:max-h-64 overflow-y-auto space-y-1 sm:space-y-2">
                      {parseResult.contacts.map((contact, index) => {
                        const isSelected = selectedContacts.includes(contact);
                        return (
                          <div
                            key={index}
                            className={`p-1.5 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleContactSelection(index)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">{contact.name}</div>
                                <div className="text-xs text-text-subtle space-y-0.5 sm:space-y-1">
                                  {contact.email && <div className="truncate">{contact.email}</div>}
                                  <div className="truncate">{contact.phone}</div>
                                  {contact.company && <div className="truncate text-xs">{contact.company}</div>}
                                </div>
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                    {contact.tags.map((tag, tagIndex) => (
                                      <Badge key={tagIndex} variant="secondary" className="text-xs h-5">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isSelected && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-1" />}
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
                  <CardContent className="p-2 sm:p-4">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span>Importing contacts...</span>
                        <span className="font-medium">{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-1.5 sm:h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t flex-col sm:flex-row gap-2 sm:gap-4">
          {parseResult && !importResult && (
            <div className="text-xs sm:text-sm text-text-subtle">
              {selectedContacts.length > 0
                ? `${selectedContacts.length} contact(s) selected`
                : 'No contacts selected'
              }
            </div>
          )}
          {importResult && (
            <div className="text-xs sm:text-sm text-text-subtle truncate">
              {importResult.imported > 0 && `${importResult.imported} imported • `}
              {importResult.updated > 0 && `${importResult.updated} updated • `}
              {importResult.errors.length > 0 && `${importResult.errors.length} errors`}
            </div>
          )}
          <div className="flex gap-1 sm:gap-2 ml-auto w-full sm:w-auto">
            {importResult && importResult.errors.length > 0 ? (
              <>
                <Button variant="outline" onClick={() => {
                  setImportResult(null);
                  setImportProgress(0);
                }} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none">
                  Back to Selection
                </Button>
                <Button onClick={() => {
                  setParseResult(null);
                  setSelectedContacts([]);
                  setImportResult(null);
                  setImportProgress(0);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none">
                  Retry Upload
                </Button>
              </>
            ) : importResult && importResult.success ? (
              <Button onClick={() => onOpenChange(false)} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 w-full sm:w-auto">
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none">
                  Cancel
                </Button>
                {parseResult && (
                  <Button
                    onClick={handleImport}
                    disabled={selectedContacts.length === 0 || isImporting}
                    className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none"
                  >
                    {isImporting
                      ? 'Importing...'
                      : `Import (${selectedContacts.length})`
                    }
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

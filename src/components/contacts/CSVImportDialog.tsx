import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Users, Mail, Phone, Tag, Building, Users2, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { parseCSVFile, generateSampleCSV, CSVContact, CSVParseResult } from '@/utils/csvParser';
import { parseExcelFile } from '@/utils/excelParser';
import { parseVCardFile } from '@/utils/vcardParser';
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
      row?: number | string;
      contact?: string | CreateContactRequest;
      error: string;
    }>;
  }>;
  isImporting?: boolean;
}

export function CSVImportDialog({ open, onOpenChange, onImport, isImporting = false }: CSVImportDialogProps) {
  const { t } = useLanguage();
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<CSVContact[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importType, setImportType] = useState<'csv' | 'excel' | 'vcard'>('csv');
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
      } else if (importType === 'vcard') {
        // For vCard (.vcf) files exported from a phone's Contacts app
        const result = await parseVCardFile(file);
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
    if (selectedContacts.length === 0) return;

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
        // vCard contacts are already parsed into the same shape as CSV/Excel --
        // 'phone_contacts' sends them as a plain contacts array instead of raw
        // csv_data/file, which is what the backend expects for this import_type.
        import_type: (importType === 'vcard' ? 'phone_contacts' : importType) as 'csv' | 'excel' | 'phone_contacts',
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
            <span className="truncate">{t('import_contacts')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {!parseResult ? (
            // File Upload Section - Compact Design
            <div className="space-y-4">
              {/* File Type & Upload in One Section */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Button
                  variant={importType === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('csv')}
                  className="h-9 sm:h-12 text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t('contacts.csv_import.tab_csv')}
                </Button>
                <Button
                  variant={importType === 'excel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('excel')}
                  className="h-9 sm:h-12 text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t('contacts.csv_import.tab_excel')}
                </Button>
                <Button
                  variant={importType === 'vcard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportType('vcard')}
                  className="h-9 sm:h-12 text-xs sm:text-sm"
                >
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t('contacts.csv_import.tab_phone')}
                </Button>
              </div>

              {/* Upload Area - Compact */}
              <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-text-subtle" />
                <h3 className="font-semibold text-xs sm:text-base mb-1 sm:mb-2">
                  {importType === 'vcard'
                    ? t('contacts.csv_import.upload_vcf_title')
                    : t('contacts.csv_import.upload_file_title', { type: importType === 'excel' ? t('contacts.csv_import.tab_excel') : t('contacts.csv_import.tab_csv') })}
                </h3>
                <p className="text-xs text-text-subtle mb-2 sm:mb-4">
                  {importType === 'vcard'
                    ? t('contacts.csv_import.vcard_hint')
                    : t('contacts.csv_import.phone_column_hint')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importType === 'excel' ? '.xlsx,.xls' : importType === 'vcard' ? '.vcf,text/vcard,text/x-vcard' : '.csv,text/csv'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                  {t('contacts.csv_import.choose_file')}
                </Button>
                {importType === 'vcard' ? (
                  <p className="text-xs text-text-subtle mt-2 sm:mt-3">
                    {t('contacts.csv_import.vcard_instructions')}
                  </p>
                ) : (
                  <p className="text-xs text-text-subtle mt-2 sm:mt-3">
                    {t('contacts.csv_import.not_sure_format')}{' '}
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="text-primary font-medium underline underline-offset-2 hover:opacity-80"
                    >
                      {t('contacts.csv_import.sample_link')}
                    </button>
                    {importType === 'excel' ? t('contacts.csv_import.after_sample_excel') : t('contacts.csv_import.after_sample_csv')}
                  </p>
                )}
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
                        {t('contacts.csv_import.skip_duplicates')}
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
                        {t('contacts.csv_import.update_existing')}
                      </label>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadSample} className="text-xs h-7 sm:h-8 px-2">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {t('contacts.csv_import.sample')}
                  </Button>
                </div>

                {/* Format Requirements - Collapsible */}
                <details className="group">
                  <summary className="flex items-center justify-between p-2 sm:p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
                    <span className="font-medium text-xs sm:text-sm">{t('contacts.csv_import.format_requirements')}</span>
                    <span className="text-xs text-text-subtle group-open:hidden">{t('contacts.csv_import.view')}</span>
                    <span className="text-xs text-text-subtle hidden group-open:inline">{t('contacts.csv_import.hide')}</span>
                  </summary>
                  <div className="mt-2 p-2 sm:p-4 bg-muted/10 rounded-lg border text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <h4 className="font-medium text-primary mb-1 sm:mb-2 text-xs sm:text-sm">{t('contacts.csv_import.required_label')}</h4>
                        <div className="space-y-0.5 sm:space-y-1 text-xs">
                          <div className="flex items-start gap-1 sm:gap-2">
                            <Phone className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{t('contacts.csv_import.phone_required_desc')}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-text-subtle mb-1 sm:mb-2 text-xs sm:text-sm">{t('contacts.csv_import.optional_label')}</h4>
                        <div className="space-y-0.5 sm:space-y-1 text-xs">
                          <div className="flex items-start gap-1 sm:gap-2">
                            <Users className="w-3 h-3 text-text-subtle mt-0.5 shrink-0" />
                            <span>{t('contacts.csv_import.name_optional_desc')}</span>
                          </div>
                          <div className="flex items-start gap-1 sm:gap-2">
                            <Mail className="w-3 h-3 text-text-subtle mt-0.5 shrink-0" />
                            <span>{t('contacts.csv_import.email_optional_desc')}</span>
                          </div>
                          <div className="flex items-start gap-1 sm:gap-2">
                            <Tag className="w-3 h-3 text-text-subtle mt-0.5 shrink-0" />
                            <span>{t('contacts.csv_import.tags_optional_desc')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 sm:mt-3 text-[11px] text-text-subtle leading-snug">
                      {t('contacts.csv_import.format_footer')}
                    </p>
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
                        <div className="text-xs text-text-subtle">{t('contacts.csv_import.imported')}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-blue-600">{importResult.updated}</div>
                        <div className="text-xs text-text-subtle">{t('contacts.csv_import.updated')}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <X className="w-4 h-4 sm:w-6 sm:h-6 text-warning mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-warning">{importResult.skipped}</div>
                        <div className="text-xs text-text-subtle">{t('contacts.csv_import.skipped')}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-4 text-center">
                        <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-destructive mx-auto mb-1" />
                        <div className="text-sm sm:text-2xl font-bold text-destructive">{importResult.errors.length}</div>
                        <div className="text-xs text-text-subtle">{t('contacts.csv_import.errors')}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Import Result Errors */}
                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive" className="p-2 sm:p-4">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <AlertDescription className="ml-2 text-xs sm:text-sm">
                        <div className="font-medium mb-1 sm:mb-2">{t('contacts.csv_import.import_errors_count', { count: importResult.errors.length })}</div>
                        <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs">
                            {importResult.errors.map((error, index) => {
                              const errorObj = typeof error === 'object' ? error : { error: String(error) };
                              const rowDisplay = errorObj.row ? t('contacts.csv_import.row_label', { row: errorObj.row }) : t('contacts.csv_import.error_label');
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
                      <div className="text-xs text-text-subtle">{t('contacts.csv_import.valid')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-destructive mx-auto mb-1" />
                      <div className="text-sm sm:text-2xl font-bold text-destructive">{parseResult.errors.length}</div>
                      <div className="text-xs text-text-subtle">{t('contacts.csv_import.errors')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 sm:p-4 text-center">
                      <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-warning mx-auto mb-1" />
                      <div className="text-sm sm:text-2xl font-bold text-warning">{parseResult.warnings.length}</div>
                      <div className="text-xs text-text-subtle">{t('contacts.csv_import.warnings')}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive" className="p-2 sm:p-4">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <AlertDescription className="ml-2 text-xs sm:text-sm">
                    <div className="font-medium mb-1 sm:mb-2">{t('contacts.csv_import.parsing_errors_count', { count: parseResult.errors.length })}</div>
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
                    <div className="font-medium mb-1 sm:mb-2">{t('contacts.csv_import.warnings_label')}</div>
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
                      <CardTitle className="text-xs sm:text-sm">{t('contacts.csv_import.select_contacts_count', { count: parseResult.contacts.length })}</CardTitle>
                      <div className="flex gap-1 sm:gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllContacts} className="text-xs px-2 h-7 sm:h-8">
                          {t('contacts.csv_import.all')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAllContacts} className="text-xs px-2 h-7 sm:h-8">
                          {t('contacts.csv_import.none')}
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
                        <span>{t('contacts.csv_import.importing_progress')}</span>
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
                ? t('contacts.csv_import.contacts_selected_count', { count: selectedContacts.length })
                : t('no_contacts_selected')
              }
            </div>
          )}
          {importResult && (
            <div className="text-xs sm:text-sm text-text-subtle truncate">
              {importResult.imported > 0 && `${t('contacts.csv_import.imported_count', { count: importResult.imported })} • `}
              {importResult.updated > 0 && `${t('contacts.csv_import.updated_count', { count: importResult.updated })} • `}
              {importResult.errors.length > 0 && t('contacts.csv_import.errors_count', { count: importResult.errors.length })}
            </div>
          )}
          <div className="flex gap-1 sm:gap-2 ml-auto w-full sm:w-auto">
            {importResult && importResult.errors.length > 0 ? (
              <>
                <Button variant="outline" onClick={() => {
                  setImportResult(null);
                  setImportProgress(0);
                }} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none">
                  {t('contacts.csv_import.back_to_selection')}
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
                  {t('contacts.csv_import.retry_upload')}
                </Button>
              </>
            ) : importResult && importResult.success ? (
              <Button onClick={() => onOpenChange(false)} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 w-full sm:w-auto">
                {t('close')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none">
                  {t('cancel')}
                </Button>
                {parseResult && (
                  <Button
                    onClick={handleImport}
                    disabled={selectedContacts.length === 0 || isImporting}
                    className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex-1 sm:flex-none"
                  >
                    {isImporting
                      ? t('contacts.csv_import.importing')
                      : t('contacts.csv_import.import_count', { count: selectedContacts.length })
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

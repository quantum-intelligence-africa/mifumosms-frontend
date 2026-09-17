import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Users, CheckCircle, AlertCircle, X, Smartphone } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';
import { isContactPickerSupported, isMobileDevice, MobileContact } from '@/utils/mobileContactPicker';
import { parseCSVFile } from '@/utils/csvParser';
import { parseExcelFile } from '@/utils/excelParser';
import { parseVCardFile } from '@/utils/vcardParser';
import { MobileContactsDialog } from './MobileContactsDialog';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactImportDialogProps {
  children: React.ReactNode;
}

type ImportType = 'csv' | 'excel' | 'vcard' | 'phone_contacts' | 'mobile_contacts';

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  total_processed: number;
  errors: string[];
  message: string;
}

export function ContactImportDialog({ children }: ContactImportDialogProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileContactsOpen, setIsMobileContactsOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>('csv');
  const [csvData, setCsvData] = useState('');
  const [phoneContacts, setPhoneContacts] = useState<Array<{full_name: string; phone: string; email: string}>>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { bulkImportContacts } = useContacts();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    // Auto-detect file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      setImportType('csv');
      // Parse CSV and show preview/analysis
      const result = await parseCSVFile(selectedFile);
      setCsvData(''); // Optionally keep raw text if needed
      setImportResult({
        success: result.errors.length === 0,
        imported: result.contacts.length,
        updated: 0,
        skipped: 0,
        total_processed: result.contacts.length,
        errors: result.errors,
        message: result.warnings.join('\n')
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      setImportType('excel');
      // Parse Excel and show preview/analysis
      const result = await parseExcelFile(selectedFile);
      setCsvData('');
      setImportResult({
        success: result.errors.length === 0,
        imported: result.contacts.length,
        updated: 0,
        skipped: 0,
        total_processed: result.contacts.length,
        errors: result.errors,
        message: result.warnings.join('\n')
      });
    } else if (extension === 'vcf') {
      setImportType('vcard');
      // Parse vCard and show preview/analysis
      const result = await parseVCardFile(selectedFile);
      setCsvData('');
      setImportResult({
        success: result.errors.length === 0,
        imported: result.contacts.length,
        updated: 0,
        skipped: 0,
        total_processed: result.contacts.length,
        errors: result.errors,
        message: result.warnings.join('\n')
      });
    }
  };

  const handlePhoneContactAdd = () => {
    setPhoneContacts(prev => [...prev, { full_name: '', phone: '', email: '' }]);
  };

  const handlePhoneContactChange = (index: number, field: string, value: string) => {
    setPhoneContacts(prev => prev.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact
    ));
  };

  const handlePhoneContactRemove = (index: number) => {
    setPhoneContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleMobileContactsImport = async (selectedContacts: MobileContact[]) => {
    try {
      setIsImporting(true);

      const importData = {
        // The backend only recognizes 'csv' | 'excel' | 'phone_contacts' -- 'mobile_contacts'
        // is a frontend-only label for where these came from, not a valid API import_type.
        import_type: 'phone_contacts' as const,
        contacts: selectedContacts.map(contact => ({
          name: contact.full_name || 'Unknown',
          phone_e164: contact.phone,
          email: contact.email || '',
          tags: [],
          attributes: {}
        })),
        skip_duplicates: skipDuplicates,
        update_existing: updateExisting
      };

      const result = await bulkImportContacts(importData);

      if (result.success) {
        toast({
          title: t('contacts.import_dialog.toast_success_title'),
          description: t('contacts.import_dialog.toast_success_desc', { count: result.imported }),
        });
        setIsOpen(false);
      } else {
        setImportResult({
          ...result,
          errors: result.errors?.map(e => typeof e === 'string' ? e : e.error || 'Unknown error') || [],
          message: ''
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('contacts.import_dialog.toast_error_fallback');
      toast({
        title: t('contacts.import_dialog.toast_error_title'),
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);

      if (importType === 'mobile_contacts') {
        // Open mobile contacts dialog instead of importing directly
        setIsMobileContactsOpen(true);
        setIsImporting(false);
        return;
      } else {
        let importData: any = {
          import_type: importType,
          skip_duplicates: skipDuplicates,
          update_existing: updateExisting,
        };

        if (importType === 'phone_contacts') {
          const validContacts = phoneContacts.filter(contact =>
            contact.full_name.trim() && contact.phone.trim()
          );
          if (validContacts.length === 0) {
            throw new Error('Please add at least one contact');
          }
          importData.contacts = validContacts;
        } else if (importType === 'csv' && file) {
          // Parse CSV again for import
          const result = await parseCSVFile(file);
          importData.contacts = result.contacts;
        } else if (importType === 'excel' && file) {
          // Parse Excel again for import
          const result = await parseExcelFile(file);
          importData.contacts = result.contacts;
        } else if (importType === 'vcard' && file) {
          // Parse vCard again for import
          const result = await parseVCardFile(file);
          importData.contacts = result.contacts;
        } else {
          if (!csvData.trim()) {
            throw new Error('Please provide CSV data or upload a file');
          }
          importData.csv_data = csvData;
        }

        const result = await bulkImportContacts(importData);
        setImportResult(result);
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setCsvData('');
    setPhoneContacts([]);
    setFile(null);
    setImportResult(null);
    setSkipDuplicates(true);
    setUpdateExisting(false);
    setImportType('csv');
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300); // Reset after dialog closes
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('import_contacts')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label>{t('contacts.import_dialog.import_type_label')}</Label>
            <Select value={importType} onValueChange={(value: ImportType) => setImportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('contacts.import_dialog.csv_file')}
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('contacts.import_dialog.excel_file')}
                  </div>
                </SelectItem>
                <SelectItem value="phone_contacts">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('contacts.import_dialog.phone_contacts')}
                  </div>
                </SelectItem>
                <SelectItem value="vcard">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    {t('contacts.import_dialog.vcf_file')}
                  </div>
                </SelectItem>
                <SelectItem
                  value="mobile_contacts"
                  disabled={!isContactPickerSupported() || !isMobileDevice()}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    {t('contacts.import_dialog.mobile_device_contacts')}
                    {(!isContactPickerSupported() || !isMobileDevice()) && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {t('contacts.import_dialog.mobile_only_badge')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          {(importType === 'csv' || importType === 'excel') && (
            <div className="space-y-2">
              <Label>{t('contacts.import_dialog.upload_file_label')}</Label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-text-subtle">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>
          )}

          {/* vCard Upload — works in every browser (plain file input), unlike the
              native device-contacts picker below which only a few browsers support */}
          {importType === 'vcard' && (
            <div className="space-y-2">
              <Label>{t('contacts.import_dialog.upload_vcf_label')}</Label>
              <Input
                type="file"
                accept=".vcf,text/vcard,text/x-vcard"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-text-subtle">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              )}
              <div className="text-xs text-text-subtle">
                {t('contacts.import_dialog.vcard_hint')}
              </div>
            </div>
          )}

          {/* CSV Data Input */}
          {(importType === 'csv' || importType === 'excel') && (
            <div className="space-y-2">
              <Label>{t('contacts.import_dialog.csv_data_label')}</Label>
              <Textarea
                placeholder="name,phone,email,tags&#10;John Mkumbo,0712345678,john@example.com,vip&#10;Fatma Mbwana,+255771978307,,customer"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-text-subtle">
                {t('contacts.import_dialog.csv_data_hint')}
              </div>
            </div>
          )}

          {/* Mobile Contacts Info */}
          {importType === 'mobile_contacts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  {t('contacts.import_dialog.mobile_device_contacts')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-text-subtle">
                  {t('contacts.import_dialog.mobile_contacts_desc')}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t('contacts.import_dialog.requirements_label')}</div>
                  <ul className="text-sm text-text-subtle space-y-1 ml-4">
                    <li>• {t('contacts.import_dialog.requirement_1')}</li>
                    <li>• {t('contacts.import_dialog.requirement_2')}</li>
                    <li>• {t('contacts.import_dialog.requirement_3')}</li>
                  </ul>
                </div>
                {!isMobileDevice() && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('contacts.import_dialog.mobile_required_title')}</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('contacts.import_dialog.mobile_required_desc')}
                    </p>
                  </div>
                )}
                {isMobileDevice() && !isContactPickerSupported() && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('contacts.import_dialog.browser_not_supported_title')}</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {t('contacts.import_dialog.browser_not_supported_desc')}
                    </p>
                  </div>
                )}
                {isMobileDevice() && isContactPickerSupported() && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('contacts.import_dialog.ready_to_import_title')}</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {t('contacts.import_dialog.ready_to_import_desc')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phone Contacts Input */}
          {importType === 'phone_contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('contacts.import_dialog.phone_contacts')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePhoneContactAdd}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('add_contact')}
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {phoneContacts.map((contact, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{t('contacts.import_dialog.contact_number_label', { number: index + 1 })}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePhoneContactRemove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`name-${index}`}>{t('contacts.import_dialog.full_name_label')}</Label>
                        <Input
                          id={`name-${index}`}
                          value={contact.full_name}
                          onChange={(e) => handlePhoneContactChange(index, 'full_name', e.target.value)}
                          placeholder="John Mkumbo"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`}>{t('contacts.import_dialog.phone_label')}</Label>
                        <Input
                          id={`phone-${index}`}
                          value={contact.phone}
                          onChange={(e) => handlePhoneContactChange(index, 'phone', e.target.value)}
                          placeholder="+255672883530"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`}>{t('contacts.import_dialog.email_label')}</Label>
                        <Input
                          id={`email-${index}`}
                          value={contact.email}
                          onChange={(e) => handlePhoneContactChange(index, 'email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Import Options */}
          {importType !== 'mobile_contacts' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('contacts.import_dialog.import_options_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <Label htmlFor="skip-duplicates">{t('contacts.import_dialog.skip_duplicate_contacts')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                  />
                  <Label htmlFor="update-existing">{t('contacts.import_dialog.update_existing_contacts')}</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Result */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {t('contacts.import_dialog.import_result_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-sm text-text-subtle">{t('contacts.csv_import.imported')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                    <div className="text-sm text-text-subtle">{t('contacts.csv_import.updated')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-sm text-text-subtle">{t('contacts.csv_import.skipped')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{importResult.total_processed}</div>
                    <div className="text-sm text-text-subtle">{t('contacts.import_dialog.total_label')}</div>
                  </div>
                </div>

                <div className="text-sm text-text-subtle">
                  {importResult.message}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('contacts.import_dialog.errors_label')}</Label>
                    <div className="space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || (importType === 'mobile_contacts' && (!isContactPickerSupported() || !isMobileDevice()))}
              className="min-w-24"
            >
              {isImporting ? t('contacts.csv_import.importing') : importType === 'mobile_contacts' ? t('contacts.import_dialog.import_from_device') : t('import_contacts')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Mobile Contacts Dialog for large contact list handling */}
    <MobileContactsDialog
      open={isMobileContactsOpen}
      onOpenChange={setIsMobileContactsOpen}
      onImport={handleMobileContactsImport}
      isImporting={isImporting}
    />
    </>
  );
}

import * as XLSX from 'xlsx';
import { CSVContact, CSVParseResult } from './csvParser';

// Phone number normalization helper (same as csvParser for consistency)
function normalizePhoneNumber(phone: string): string | null {
	// Remove all non-digit characters
	const digitsOnly = phone.replace(/\D/g, '');

	// Handle different formats
	// Format 1: International with country code: 255XXXXXXXXX (12 digits)
	if (digitsOnly.startsWith('255') && digitsOnly.length === 12) {
		return digitsOnly;
	}

	// Format 2: Local format with leading 0: 0XXXXXXXXX (10 digits) -> convert to 255XXXXXXXXX
	if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
		return `255${digitsOnly.slice(1)}`;
	}

	// Format 3: 9-digit number without leading 0 (assume Tanzanian): XXXXXXXXX -> 255XXXXXXXXX
	if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
		return `255${digitsOnly}`;
	}

	// Format 4: Local format variations with leading 7: 7XXXXXXXXX (9 digits starting with 7) -> 2557XXXXXXXXX
	if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
		return `255${digitsOnly}`;
	}

	// Format 5: Local format variations with leading 6: 6XXXXXXXXX (9 digits starting with 6) -> 2556XXXXXXXXX
	if (digitsOnly.startsWith('6') && digitsOnly.length === 9) {
		return `255${digitsOnly}`;
	}

	return null;
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Normalize header for robust matching (case, spaces, underscores, non-alphanumeric)
function normalizeHeader(header: string): string {
	return header.toLowerCase().replace(/\s|_/g, '').replace(/[^a-z0-9]/g, '');
}

export async function parseExcelFile(file: File): Promise<CSVParseResult> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
				const contacts: CSVContact[] = [];
				const errors: string[] = [];
				const warnings: string[] = [];

				if (json.length === 0) {
					errors.push('Excel file is empty');
					resolve({ contacts, errors, warnings });
					return;
				}

				// Helper to get normalized header
				const headerMap: Record<string, string> = {};
				Object.keys(json[0]).forEach((key) => {
					headerMap[normalizeHeader(key)] = key;
				});

				// Helper to find column by possible names
				function findColumn(names: string[]): string | null {
					for (const name of names) {
						const norm = normalizeHeader(name);
						for (const [headerNorm, headerKey] of Object.entries(headerMap)) {
							if (headerNorm === norm || headerNorm.includes(norm)) {
								return headerKey;
							}
						}
					}
					return null;
				}

				// Find column indices
				const nameCol = findColumn(['name', 'full_name', 'fullname', 'contact_name']);
				const phoneCol = findColumn(['phone', 'phone_number', 'mobile', 'mobile_number', 'tel', 'telephone']);
				const emailCol = findColumn(['email', 'email_address', 'e_mail']);
				const tagsCol = findColumn(['tags', 'tag', 'labels', 'label']);
				const companyCol = findColumn(['company', 'organization', 'org']);
				const departmentCol = findColumn(['department', 'dept', 'division']);

				// Validate phone column exists
				if (!phoneCol) {
					errors.push('No phone column found. Phone number is required.');
					resolve({ contacts, errors, warnings });
					return;
				}

				// Process rows
				json.forEach((row, idx) => {
					try {
						const name = nameCol ? (row[nameCol] as string)?.trim() : undefined;
						let phone = row[phoneCol] as unknown;

						// Handle phone number type conversion
						if (typeof phone === 'number') {
							phone = phone.toString();
						}

						// Convert scientific notation
						if (typeof phone === 'string' && /e\+/.test(phone)) {
							const num = Number(phone);
							if (!isNaN(num)) {
								phone = num.toLocaleString('fullwide', { useGrouping: false });
							}
						}

						const phoneStr = String(phone || '').trim();
						if (!phoneStr) {
							throw new Error('Phone number is required');
						}

						// Normalize phone number
						const normalizedPhone = normalizePhoneNumber(phoneStr);
						if (!normalizedPhone) {
							throw new Error(`Invalid phone number format: ${phoneStr}`);
						}

						// Validate email if present
						const email = emailCol ? (row[emailCol] as string)?.trim() : undefined;
						if (email && !isValidEmail(email)) {
							throw new Error(`Invalid email format: ${email}`);
						}

						// Extract tags
						const tagsStr = tagsCol ? (row[tagsCol] as string)?.trim() : '';
						const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : undefined;

						// Extract company and department
						const company = companyCol ? (row[companyCol] as string)?.trim() : undefined;
						const department = departmentCol ? (row[departmentCol] as string)?.trim() : undefined;

						contacts.push({
							name: name || 'Unknown Contact',
							email: email || undefined,
							phone: normalizedPhone,
							tags: tags || undefined,
							company: company || undefined,
							department: department || undefined
						});
					} catch (error) {
						errors.push(`Row ${idx + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
					}
				});

				// Add warnings for missing optional columns
				if (!emailCol) {
					warnings.push('No email column found. Email addresses will not be imported.');
				}

				if (contacts.length === 0 && errors.length === 0) {
					errors.push('No valid contacts found in Excel file.');
				}

				resolve({ contacts, errors, warnings });
			} catch (error) {
				resolve({ contacts: [], errors: ['Failed to parse Excel file'], warnings: [] });
			}
		};
		reader.onerror = () => {
			resolve({ contacts: [], errors: ['Failed to read file'], warnings: [] });
		};
		reader.readAsArrayBuffer(file);
	});
}

export interface CSVContact {
	name: string;
	email?: string;
	phone: string;
	tags?: string[];
	company?: string;
	department?: string;
}

export interface CSVParseResult {
	contacts: CSVContact[];
	errors: string[];
	warnings: string[];
}

export function parseCSVFile(file: File): Promise<CSVParseResult> {
	return new Promise((resolve) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const result = parseCSVText(text);
				resolve(result);
			} catch (error) {
				resolve({
					contacts: [],
					errors: [`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`],
					warnings: []
				});
			}
		};

		reader.onerror = () => {
			resolve({
				contacts: [],
				errors: ['Failed to read file'],
				warnings: []
			});
		};

		reader.readAsText(file);
	});
}

export function parseCSVText(text: string): CSVParseResult {
	const lines = text.split('\n').filter(line => line.trim());
	if (lines.length < 2) {
		return {
			contacts: [],
			errors: ['CSV file must contain at least a header row and one data row'],
			warnings: []
		};
	}

	const headers = parseCSVLine(lines[0]);
	const contacts: CSVContact[] = [];
	const errors: string[] = [];
	const warnings: string[] = [];

	// Find column indices
	const nameIndex = findColumnIndex(headers, ['name', 'full_name', 'fullname', 'contact_name']);
	const emailIndex = findColumnIndex(headers, ['email', 'email_address', 'e_mail']);
	const phoneIndex = findColumnIndex(headers, ['phone', 'phone_number', 'mobile', 'mobile_number', 'tel', 'telephone']);
	const tagsIndex = findColumnIndex(headers, ['tags', 'tag', 'labels', 'label']);
	const companyIndex = findColumnIndex(headers, ['company', 'organization', 'org']);
	const departmentIndex = findColumnIndex(headers, ['department', 'dept', 'division']);

	// Validate required columns
	if (nameIndex === -1) {
		errors.push('Required column "name" not found. Please ensure your CSV has a column with name, full_name, fullname, or contact_name');
	}
	if (phoneIndex === -1) {
		errors.push('Required column "phone" not found. Please ensure your CSV has a column with phone, phone_number, mobile, mobile_number, tel, or telephone');
	}

	if (errors.length > 0) {
		return { contacts, errors, warnings };
	}

	// Process data rows
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		try {
			const values = parseCSVLine(line);
			const contact = parseContactFromValues(values, {
				nameIndex,
				emailIndex,
				phoneIndex,
				tagsIndex,
				companyIndex,
				departmentIndex
			}, i + 1);

			if (contact) {
				contacts.push(contact);
			}
		} catch (error) {
			errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
		}
	}

	// Add warnings for missing optional columns
	if (emailIndex === -1) {
		warnings.push('No email column found. Email addresses will not be imported.');
	}

	return { contacts, errors, warnings };
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote
				current += '"';
				i += 2;
				continue;
			}
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
		i++;
	}

	result.push(current.trim());
	return result;
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
	for (let i = 0; i < headers.length; i++) {
		const header = headers[i].toLowerCase().trim();
		if (possibleNames.some(name => header === name || header.includes(name))) {
			return i;
		}
	}
	return -1;
}

function parseContactFromValues(
	values: string[],
	indices: {
		nameIndex: number;
		emailIndex: number;
		phoneIndex: number;
		tagsIndex: number;
		companyIndex: number;
		departmentIndex: number;
	},
	rowNumber: number
): CSVContact | null {
	const name = values[indices.nameIndex]?.trim();
	const phone = values[indices.phoneIndex]?.trim();
	const email = indices.emailIndex !== -1 ? values[indices.emailIndex]?.trim() : undefined;
	const tags = indices.tagsIndex !== -1 ? values[indices.tagsIndex]?.trim().split(',').map(t => t.trim()).filter(t => t) : undefined;
	const company = indices.companyIndex !== -1 ? values[indices.companyIndex]?.trim() : undefined;
	const department = indices.departmentIndex !== -1 ? values[indices.departmentIndex]?.trim() : undefined;

	// Validate required fields
	if (!name) {
		throw new Error('Name is required');
	}
	if (!phone) {
		throw new Error('Phone number is required');
	}

	// Validate and normalize phone number
	const normalizedPhone = normalizePhoneNumber(phone);
	if (!normalizedPhone) {
		throw new Error(`Invalid phone number format: ${phone}`);
	}

	// Validate email if provided
	if (email && !isValidEmail(email)) {
		throw new Error(`Invalid email format: ${email}`);
	}

	return {
		name,
		email: email || undefined,
		phone: normalizedPhone,
		tags: tags || undefined,
		company: company || undefined,
		department: department || undefined
	};
}

function normalizePhoneNumber(phone: string): string | null {
	// Remove all non-digit characters
	const digitsOnly = phone.replace(/\D/g, '');

	// Handle different formats
	if (digitsOnly.startsWith('255') && digitsOnly.length === 12) {
		// Already in correct format: 255XXXXXXXXX
		return digitsOnly;
	}

	if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
		// Local format: 0XXXXXXXXX -> 255XXXXXXXXX
		return `255${digitsOnly.slice(1)}`;
	}

	if (digitsOnly.startsWith('255') && digitsOnly.length === 12) {
		// E.164 without +: 255XXXXXXXXX
		return digitsOnly;
	}

	// Check if it's a valid 12-digit number starting with 255
	if (digitsOnly.length === 12 && digitsOnly.startsWith('255')) {
		return digitsOnly;
	}

	return null;
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function generateSampleCSV(): string {
	const headers = ['name', 'email', 'phone', 'tags', 'company', 'department'];
	const sampleData = [
		['John Doe', 'john@example.com', '255700000001', 'vip,customer', 'Acme Corp', 'Sales'],
		['Jane Smith', 'jane@example.com', '255700000002', 'premium', 'Tech Inc', 'Marketing'],
		['Bob Johnson', 'bob@example.com', '255700000003', 'regular', 'Startup Ltd', 'Engineering']
	];

	const csvContent = [headers, ...sampleData]
		.map(row => row.map(field => `"${field}"`).join(','))
		.join('\n');

	return csvContent;
}

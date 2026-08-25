// vCard (.vcf) contact import — a universal fallback for phones/browsers where the
// native Web Contacts API (mobileContactPicker.ts) isn't available (Samsung Internet,
// Firefox, iOS Safari, desktop browsers, ...). Every phone's Contacts app can export
// selected contacts (or all contacts) as a .vcf file via its native "Share" sheet, and
// uploading that file is a plain <input type="file">, which every browser supports.
import { parseCSVText, CSVParseResult } from './csvParser';

interface VCardEntry {
	name: string;
	phones: string[];
	email: string;
}

// vCard spec: a line starting with a single space or tab continues the previous line.
function unfoldVCardLines(text: string): string[] {
	const rawLines = text.split(/\r\n|\r|\n/);
	const lines: string[] = [];
	for (const line of rawLines) {
		if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
			lines[lines.length - 1] += line.slice(1);
		} else {
			lines.push(line);
		}
	}
	return lines;
}

function decodeQuotedPrintable(value: string): string {
	return value.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseVCardText(text: string): VCardEntry[] {
	const lines = unfoldVCardLines(text);
	const entries: VCardEntry[] = [];
	let current: VCardEntry | null = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		if (/^BEGIN:VCARD$/i.test(line)) {
			current = { name: '', phones: [], email: '' };
			continue;
		}
		if (/^END:VCARD$/i.test(line)) {
			if (current) entries.push(current);
			current = null;
			continue;
		}
		if (!current) continue;

		const colonIndex = line.indexOf(':');
		if (colonIndex === -1) continue;
		const propPart = line.slice(0, colonIndex);
		let value = line.slice(colonIndex + 1);
		const [propName, ...params] = propPart.split(';');
		const prop = propName.toUpperCase();

		if (params.some((p) => /^ENCODING=QUOTED-PRINTABLE$/i.test(p))) {
			value = decodeQuotedPrintable(value);
		}

		if (prop === 'FN' && !current.name) {
			current.name = value.trim();
		} else if (prop === 'N' && !current.name) {
			// N:Family;Given;Middle;Prefix;Suffix
			const parts = value.split(';').map((p) => p.trim()).filter(Boolean);
			current.name = parts.reverse().join(' ').trim();
		} else if (prop === 'TEL') {
			const tel = value.trim();
			if (tel) current.phones.push(tel);
		} else if (prop === 'EMAIL' && !current.email) {
			current.email = value.trim();
		}
	}

	return entries;
}

function escapeCSVField(value: string): string {
	return `"${(value || '').replace(/"/g, '""')}"`;
}

export function parseVCardFile(file: File): Promise<CSVParseResult> {
	return new Promise((resolve) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const entries = parseVCardText(text);

				if (entries.length === 0) {
					resolve({
						contacts: [],
						errors: ['No contacts found in this file. Make sure it was exported as a vCard (.vcf).'],
						warnings: []
					});
					return;
				}

				// One row per contact using its first phone number — a contact with several
				// numbers (home/work/mobile) is still one person in the recipient list.
				const rows = entries
					.filter((entry) => entry.phones.length > 0)
					.map((entry) =>
						[escapeCSVField(entry.name), escapeCSVField(entry.phones[0]), escapeCSVField(entry.email)].join(',')
					);
				const skippedNoPhone = entries.length - rows.length;

				if (rows.length === 0) {
					resolve({
						contacts: [],
						errors: ['None of the contacts in this file have a phone number.'],
						warnings: []
					});
					return;
				}

				// Reuse the CSV parser so phone normalization/validation stays identical
				// across every import path (vCard, CSV, Excel).
				const result = parseCSVText(['name,phone,email', ...rows].join('\n'));
				if (skippedNoPhone > 0) {
					result.warnings.push(
						`${skippedNoPhone} contact${skippedNoPhone === 1 ? '' : 's'} skipped — no phone number.`
					);
				}
				resolve(result);
			} catch (error) {
				resolve({
					contacts: [],
					errors: [`Failed to parse vCard file: ${error instanceof Error ? error.message : 'Unknown error'}`],
					warnings: []
				});
			}
		};

		reader.onerror = () => {
			resolve({ contacts: [], errors: ['Failed to read file'], warnings: [] });
		};

		reader.readAsText(file);
	});
}

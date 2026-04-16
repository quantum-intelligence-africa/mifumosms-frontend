/**
 * Contact Picker API utilities for mobile contact import
 * Supports Android Chrome/Edge with graceful fallbacks for other platforms
 */

export type RawContact = {
	name?: string[];
	tel?: string[];
	email?: string[];
};

export type NormalizedContact = {
	name: string;
	phone_e164: string;
	email: string;
	tags: string[];
	attributes: Record<string, unknown>;
};

// Check if Contact Picker API is supported
export const isContactPickerSupported = (): boolean => {
	if (typeof navigator === "undefined") return false;

	// @ts-ignore - Contact Picker API is not in TypeScript definitions yet
	return "contacts" in navigator && typeof navigator.contacts?.select === "function";
};

// Normalize Tanzanian phone numbers to E.164 format
export const normalizeTanzanianPhone = (raw?: string): string => {
	if (!raw) return "";

	// Remove all non-digit characters except +
	const digits = raw.replace(/[^\d+]/g, "");

	// If already in E.164 format, return as is
	if (digits.startsWith("+")) {
		return digits;
	}

	// Handle Tanzanian numbers starting with 255
	if (digits.startsWith("255")) {
		return `+${digits}`;
	}

	// Handle Tanzanian numbers starting with 0 (06XX, 07XX)
	if (digits.startsWith("0") && digits.length === 10) {
		return `+255${digits.slice(1)}`;
	}

	// Handle other international numbers
	if (digits.length >= 10) {
		return `+${digits}`;
	}

	// Return original if can't normalize
	return raw;
};

// Validate E.164 phone number
export const isValidE164 = (phone: string): boolean => {
	if (!phone) return false;

	// Must start with +
	if (!phone.startsWith("+")) return false;

	// Must have country code and number
	const digitsOnly = phone.substring(1);
	if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;

	// Must contain only digits after +
	return /^\d+$/.test(digitsOnly);
};

/**
 * Process a large array of raw contacts asynchronously in chunks.
 * Yields to the browser between chunks so the UI doesn't freeze.
 */
async function processContactsInChunks(
	raw: RawContact[],
	chunkSize = 200
): Promise<NormalizedContact[]> {
	const result: NormalizedContact[] = [];

	for (let i = 0; i < raw.length; i += chunkSize) {
		const chunk = raw.slice(i, i + chunkSize);

		for (const contact of chunk) {
			const name = (contact.name?.[0] ?? "").trim();
			const phone = normalizeTanzanianPhone(contact.tel?.[0]);
			const email = (contact.email?.[0] ?? "").trim();

			// Keep any contact that has at least a name or any phone number
			if (name || phone) {
				result.push({ name, phone_e164: phone, email, tags: [], attributes: {} });
			}
		}

		// Yield to the browser event loop between chunks so it stays responsive
		if (i + chunkSize < raw.length) {
			await new Promise<void>((resolve) => setTimeout(resolve, 0));
		}
	}

	return result;
}

// Main function to handle contact picking from phone
export async function handlePickFromPhone(): Promise<{
	imported: number;
	canceled?: boolean;
	contacts?: NormalizedContact[];
}> {
	if (!isContactPickerSupported()) {
		throw new Error(
			"Phone contact import isn't supported on this device/browser. Try Chrome on Android or use CSV upload instead."
		);
	}

	try {
		// Request only name + tel to keep the payload small.
		// Skipping email reduces the data transferred from native → JS,
		// which is the main cause of failures with 2000+ contacts.
		// @ts-ignore - Contact Picker API is not in TypeScript definitions yet
		const picked: RawContact[] = await navigator.contacts.select(
			["name", "tel"],
			{ multiple: true }
		);

		if (!picked || picked.length === 0) {
			return { imported: 0, canceled: true };
		}

		// Process contacts in background chunks so the main thread stays free
		const normalizedContacts = await processContactsInChunks(picked);

		return {
			imported: normalizedContacts.length,
			contacts: normalizedContacts,
			canceled: false
		};
	} catch (err: any) {
		// User canceled — not an error
		if (err?.name === "AbortError") {
			return { imported: 0, canceled: true };
		}

		// Permission denied
		if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
			throw new Error("Please allow access to contacts to use this feature.");
		}

		// API called while another picker is open
		if (err?.name === "InvalidStateError") {
			throw new Error("Contact picker is already open. Please close it and try again.");
		}

		// "not supported" message from the browser
		if (err?.message?.toLowerCase().includes("not supported")) {
			throw new Error("Contact access is not supported on this device. Please use CSV upload instead.");
		}

		// Anything else — give a clear, user-friendly message instead of a raw browser error
		throw new Error(
			"Could not open contacts. Make sure you are using Chrome on Android and have given contact permission, then try again."
		);
	}
}

// Get user-friendly support message
export const getContactPickerSupportMessage = (): string => {
	if (isContactPickerSupported()) {
		return "Tap to select multiple contacts from your phone";
	}

	const userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
		return "Not supported on iOS Safari. Use CSV upload or manual entry.";
	}
	if (userAgent.includes("android")) {
		return "Not supported on this browser. Try Chrome or Edge on Android.";
	}

	return "Not supported on this device. Use CSV upload or manual entry.";
};

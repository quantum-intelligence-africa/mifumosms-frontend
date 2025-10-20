/**
 * Utility functions for phone number handling and conversion
 */

/**
 * Converts a phone number to E.164 format
 * Handles Tanzanian phone numbers starting with 06 or 07
 * @param phoneNumber - The phone number to convert
 * @returns The phone number in E.164 format
 */
export const convertToE164 = (phoneNumber: string): string => {
	if (!phoneNumber) return '';

	// Remove all non-digit characters except +
	let cleaned = phoneNumber.replace(/[^\d+]/g, '');

	// If it already starts with +, return as is
	if (cleaned.startsWith('+')) {
		return cleaned;
	}

	// Handle Tanzanian numbers starting with 06 or 07
	if (cleaned.startsWith('06')) {
		return '+255' + cleaned.substring(1); // 06 -> +2556
	}

	if (cleaned.startsWith('07')) {
		return '+255' + cleaned.substring(1); // 07 -> +2557
	}

	// If it starts with 255 (Tanzania country code without +)
	if (cleaned.startsWith('255')) {
		return '+' + cleaned;
	}

	// If it's a local number without country code, assume Tanzania
	if (cleaned.length >= 9 && cleaned.length <= 10) {
		return '+255' + cleaned;
	}

	// Return with + if it doesn't have one
	return '+' + cleaned;
};

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneForDisplay = (phoneNumber: string): string => {
	if (!phoneNumber) return '';

	// If it's in E.164 format, format it nicely
	if (phoneNumber.startsWith('+255')) {
		const number = phoneNumber.substring(4);
		if (number.length >= 9) {
			// Format as +255 XXX XXX XXX
			return `+255 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
		}
	}

	return phoneNumber;
};

/**
 * Validates if a phone number is in valid E.164 format
 * @param phoneNumber - The phone number to validate
 * @returns True if valid, false otherwise
 */
export const isValidE164 = (phoneNumber: string): boolean => {
	if (!phoneNumber) return false;

	// Must start with +
	if (!phoneNumber.startsWith('+')) return false;

	// Must have country code and number
	const digitsOnly = phoneNumber.substring(1);
	if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;

	// Must contain only digits after +
	return /^\d+$/.test(digitsOnly);
};

/**
 * Gets a placeholder text based on the current input
 * @param currentValue - Current phone number value
 * @returns Placeholder text
 */
export const getPhonePlaceholder = (currentValue: string): string => {
	if (!currentValue) return '+255 6XX XXX XXX or 06XX XXX XXX';

	if (currentValue.startsWith('06') || currentValue.startsWith('07')) {
		return 'Will be saved as +255' + currentValue.substring(1);
	}

	return '+255 6XX XXX XXX or 06XX XXX XXX';
};

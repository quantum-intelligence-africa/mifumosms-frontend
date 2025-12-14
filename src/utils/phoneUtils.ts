/**
 * Phone Number Normalization Utility
 * Handles various phone number formats and normalizes them for consistency
 */

export interface PhoneNumberInfo {
  normalized: string;
  formatted: string;
  countryCode: string;
  nationalNumber: string;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes phone number to E.164 international format (+countrycode)
 * Handles various input formats and supports all countries in E.164 format
 * E.164 format: +[country code][subscriber number] (max 15 digits total)
 * Examples:
 * - +255700000001 (Tanzania)
 * - +254712345678 (Kenya)
 * - +256712345678 (Uganda)
 * - +255 700 000 001 (with spaces)
 * - 255700000001 (without +, will add it)
 * - 0700000001 (local format, will try to convert)
 */
export function normalizePhoneNumber(phoneNumber: string): PhoneNumberInfo {
  if (!phoneNumber) {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+')) {
    // Already in international format - remove + to process
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    // Local format starting with 0, try to detect country
    // For now, default to Tanzania (255) but could be enhanced with country detection
    cleaned = '255' + cleaned.substring(1);
  } else if (cleaned.startsWith('255')) {
    // Tanzania country code without +
    // Keep as is, will add + later
  } else if (cleaned.length >= 9 && cleaned.length <= 12) {
    // Could be a local number - try to detect country
    // Default to Tanzania for backward compatibility
    if (cleaned.length === 9) {
      cleaned = '255' + cleaned;
    } else if (cleaned.length === 10) {
      // Assume local format with leading 0
      cleaned = '255' + cleaned.substring(1);
    }
  }

  // Validate E.164 format: + followed by 1-15 digits
  // E.164 allows country codes from 1-3 digits and subscriber numbers
  if (!cleaned || cleaned.length < 8 || cleaned.length > 15) {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Phone number must be in E.164 format: +[country code][number] (8-15 digits total)'
    };
  }

  // E.164 validation: must start with valid country code (1-3 digits)
  // Country codes: 1 digit (US/Canada: 1), 2 digits (most countries), or 3 digits (some countries)
  // We'll validate that it starts with a valid country code pattern
  const e164Regex = /^\+?[1-9]\d{7,14}$/;
  const testNumber = '+' + cleaned;

  if (!e164Regex.test(testNumber)) {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Invalid phone number format. Please use E.164 format: +[country code][number] (e.g., +255123456789)'
    };
  }

  // Extract country code (try common patterns)
  // This is a simplified extraction - in production, you might want to use a library like libphonenumber
  let countryCode = '';
  let nationalNumber = '';

  // Try to detect country code (1, 2, or 3 digits)
  // Common patterns:
  // - 1 digit: 1 (US/Canada)
  // - 2 digits: 20-99 (most countries)
  // - 3 digits: 255, 254, 256, etc. (East Africa)

  if (cleaned.startsWith('1') && cleaned.length >= 11) {
    // US/Canada: country code is 1
    countryCode = '1';
    nationalNumber = cleaned.substring(1);
  } else if (cleaned.length >= 10) {
    // Try 3-digit country code first (common in Africa)
    const threeDigit = cleaned.substring(0, 3);
    if (['255', '254', '256', '250', '257', '211'].includes(threeDigit)) {
      countryCode = threeDigit;
      nationalNumber = cleaned.substring(3);
    } else {
      // Try 2-digit country code
      const twoDigit = cleaned.substring(0, 2);
      if (parseInt(twoDigit) >= 20 && parseInt(twoDigit) <= 99) {
        countryCode = twoDigit;
        nationalNumber = cleaned.substring(2);
      } else {
        // Fallback: use first digit as country code
        countryCode = cleaned.substring(0, 1);
        nationalNumber = cleaned.substring(1);
      }
    }
  } else {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Invalid phone number format'
    };
  }

  const normalized = '+' + cleaned;
  const formatted = formatPhoneNumber(normalized);

  return {
    normalized,
    formatted,
    countryCode,
    nationalNumber,
    isValid: true
  };
}

/**
 * Formats phone number for display
 * +255700000001 -> +255 700 000 001
 * Supports various country codes
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    return phoneNumber; // Return as is if not in international format
  }

  // Extract country code and number
  const withoutPlus = cleaned.substring(1);

  // Format based on length and country code
  if (cleaned.startsWith('+255') && withoutPlus.length === 12) {
    // Tanzania: +255 700 000 001
    return `+${withoutPlus.substring(0, 3)} ${withoutPlus.substring(3, 6)} ${withoutPlus.substring(6, 9)} ${withoutPlus.substring(9)}`;
  } else if (cleaned.startsWith('+254') && withoutPlus.length === 12) {
    // Kenya: +254 700 000 000
    return `+${withoutPlus.substring(0, 3)} ${withoutPlus.substring(3, 6)} ${withoutPlus.substring(6, 9)} ${withoutPlus.substring(9)}`;
  } else if (cleaned.startsWith('+256') && withoutPlus.length === 12) {
    // Uganda: +256 700 000 000
    return `+${withoutPlus.substring(0, 3)} ${withoutPlus.substring(3, 6)} ${withoutPlus.substring(6, 9)} ${withoutPlus.substring(9)}`;
  } else if (cleaned.startsWith('+1') && withoutPlus.length === 11) {
    // US/Canada: +1 (555) 123-4567
    return `+${withoutPlus.substring(0, 1)} (${withoutPlus.substring(1, 4)}) ${withoutPlus.substring(4, 7)}-${withoutPlus.substring(7)}`;
  } else {
    // Generic formatting: +[country] [rest]
    // Try to format with spaces every 3 digits after country code
    if (withoutPlus.length > 3) {
      const countryCode = withoutPlus.substring(0, withoutPlus.length > 6 ? 3 : (withoutPlus.length > 5 ? 2 : 1));
      const number = withoutPlus.substring(countryCode.length);
      const formattedNumber = number.match(/.{1,3}/g)?.join(' ') || number;
      return `+${countryCode} ${formattedNumber}`;
    }
  }

  return phoneNumber;
}

/**
 * Validates if phone number is in correct format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const result = normalizePhoneNumber(phoneNumber);
  return result.isValid;
}

/**
 * Gets country code from phone number
 */
export function getCountryCode(phoneNumber: string): string {
  const result = normalizePhoneNumber(phoneNumber);
  return result.countryCode;
}

/**
 * Gets national number from phone number
 */
export function getNationalNumber(phoneNumber: string): string {
  const result = normalizePhoneNumber(phoneNumber);
  return result.nationalNumber;
}

/**
 * Common phone number formats for different countries
 */
export const PHONE_FORMATS = {
  TANZANIA: {
    countryCode: '+255',
    format: '+255 XXX XXX XXX',
    example: '+255 700 000 001',
    length: 13, // +255 + 9 digits
    mobilePrefixes: ['7', '6', '5']
  },
  KENYA: {
    countryCode: '+254',
    format: '+254 XXX XXX XXX',
    example: '+254 700 000 000',
    length: 13,
    mobilePrefixes: ['7', '1']
  },
  UGANDA: {
    countryCode: '+256',
    format: '+256 XXX XXX XXX',
    example: '+256 700 000 000',
    length: 13,
    mobilePrefixes: ['7', '3']
  }
} as const;

/**
 * Phone number input placeholder based on country
 */
export function getPhonePlaceholder(countryCode: string = 'TANZANIA'): string {
  const format = PHONE_FORMATS[countryCode as keyof typeof PHONE_FORMATS];
  return format?.example || '+255 700 000 001';
}

/**
 * Phone number mask for input field
 */
export function getPhoneMask(countryCode: string = 'TANZANIA'): string {
  const format = PHONE_FORMATS[countryCode as keyof typeof PHONE_FORMATS];
  return format?.format || '+255 XXX XXX XXX';
}

/**
 * Converts phone number to backend format (0XXXXXXXXX)
 * This is the format the backend expects for verification requests
 */
export function toBackendPhoneFormat(phoneNumber: string): string {
  const phoneInfo = normalizePhoneNumber(phoneNumber);
  if (!phoneInfo.isValid) {
    return phoneNumber; // Return original if invalid
  }

  // Convert from +255XXXXXXXXX to 0XXXXXXXXX
  if (phoneInfo.normalized.startsWith('+255')) {
    return '0' + phoneInfo.normalized.substring(4);
  }

  return phoneNumber;
}

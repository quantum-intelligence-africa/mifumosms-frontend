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
 * Normalizes phone number to international format (+countrycode)
 * Handles various input formats:
 * - +255700000001
 * - 255700000001
 * - 0700000001
 * - +255 700 000 001
 * - 255-700-000-001
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
    // Already in international format
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    // Local format starting with 0, assume Tanzania
    cleaned = '255' + cleaned.substring(1);
  } else if (cleaned.startsWith('255')) {
    // Country code without +
    // Keep as is
  } else if (cleaned.length === 9) {
    // 9 digits, assume Tanzania
    cleaned = '255' + cleaned;
  } else if (cleaned.length === 10) {
    // 10 digits, assume Tanzania with leading 0
    cleaned = '255' + cleaned.substring(1);
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

  // Validate length (should be 12 digits for Tanzania: 255 + 9 digits)
  if (cleaned.length !== 12) {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Phone number must be 9 digits (excluding country code)'
    };
  }

  // Extract country code and national number
  const countryCode = cleaned.substring(0, 3);
  const nationalNumber = cleaned.substring(3);

  // Validate country code (Tanzania = 255)
  if (countryCode !== '255') {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Only Tanzanian phone numbers (+255) are currently supported'
    };
  }

  // Validate national number (should start with 7, 6, or 5 for mobile)
  if (!['7', '6', '5'].includes(nationalNumber[0])) {
    return {
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      isValid: false,
      error: 'Invalid mobile number format'
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
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+255') && cleaned.length === 13) {
    // Format Tanzanian number: +255 700 000 001
    return `+${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 10)} ${cleaned.substring(10)}`;
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
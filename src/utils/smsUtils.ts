/**
 * SMS Segment Calculation Utilities
 *
 * Mirrors the backend's billing rule (messaging/sms_segments.py, GSM 03.38):
 * a single part holds 160 GSM-7 septets (or 70 UCS-2 units for non-GSM-7 text),
 * but once a message needs more than one part, each part only holds 153 septets
 * (or 67 UCS-2 units) because concatenation headers eat into the budget.
 * Maximum: 5 segments (see MAX_SEGMENTS below).
 */

const GSM_7BIT_BASIC = new Set(
	"@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
	"¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
);
const GSM_7BIT_EXTENDED = new Set("^{}\\[~]|€");

function gsmSeptetCount(text: string): number | null {
	let total = 0;
	for (const ch of text) {
		if (GSM_7BIT_EXTENDED.has(ch)) total += 2;
		else if (GSM_7BIT_BASIC.has(ch)) total += 1;
		else return null;
	}
	return total;
}

function utf16CodeUnitCount(text: string): number {
	// UTF-16 code units, matching Python's len(text.encode("utf-16-le")) // 2
	return text.length;
}

/**
 * Calculate the number of billable SMS segments required for a message.
 * @param message - The message text to calculate segments for
 * @returns The number of segments required (0 for empty message)
 */
export function calculateSMSegments(message: string): number {
	if (!message || message.length === 0) return 0;
	const septets = gsmSeptetCount(message);
	if (septets !== null) {
		if (septets <= 160) return 1;
		return Math.max(1, Math.ceil(septets / 153));
	}
	const units = utf16CodeUnitCount(message);
	if (units <= 70) return 1;
	return Math.max(1, Math.ceil(units / 67));
}

/**
 * Validate if a message length is within acceptable limits
 * @param message - The message text to validate
 * @returns Object with validation result and segment count
 */
export function validateMessageLength(message: string): {
	isValid: boolean;
	segments: number;
	error?: string;
} {
	const segments = calculateSMSegments(message);

	if (segments > 5) {
		return {
			isValid: false,
			segments,
			error: `Message too long. Maximum is 5 segments (800 characters).`
		};
	}

	return {
		isValid: true,
		segments
	};
}

/**
 * Get segment information for display
 * @param message - The message text
 * @returns Object with segment information
 */
export function getSegmentInfo(message: string): {
	segments: number;
	characters: number;
	charactersRemaining: number;
	isOverLimit: boolean;
	maxCharacters: number;
} {
	const segments = calculateSMSegments(message);
	const characters = message.length;
	const maxCharacters = 800; // 800 characters maximum (5 segments)
	const charactersRemaining = Math.max(0, maxCharacters - characters);
	const isOverLimit = segments > 5;

	return {
		segments,
		characters,
		charactersRemaining,
		isOverLimit,
		maxCharacters
	};
}

/**
 * Format segment count for display
 * @param segments - Number of segments
 * @returns Formatted string
 */
export function formatSegmentCount(segments: number): string {
	if (segments === 1) return "1 segment";
	return `${segments} segments`;
}

/**
 * Format segment count as "N SMS" — user-facing label that maps the underlying
 * segment count to credits the user actually pays for, which is more intuitive
 * than the carrier-protocol term "segment".
 */
export function formatSegmentCountAsSms(segments: number): string {
	return `${segments} SMS`;
}

/**
 * Calculate cost for SMS based on segments and recipient count
 * @param segments - Number of segments per message
 * @param recipientCount - Number of recipients
 * @param costPerSegment - Cost per segment in TZS (default: 25)
 * @returns Total cost in TZS
 */
export function calculateSMSCost(
	segments: number,
	recipientCount: number,
	costPerSegment: number = 25
): number {
	return segments * recipientCount * costPerSegment;
}

/**
 * Get character count display for textarea
 * @param message - The message text
 * @returns Formatted character count string
 */
export function getCharacterCountDisplay(message: string): string {
	const { characters, segments, maxCharacters } = getSegmentInfo(message);
	return `${characters}/${maxCharacters} characters (${formatSegmentCountAsSms(segments)})`;
}

/**
 * SMS Segment Calculation Utilities
 *
 * SMS segments are calculated based on the following rules:
 * - Plain text only: 160 characters per segment
 * - Maximum segments: 200 per message
 * - Formula: (message_length + 159) // 160
 */

/**
 * Calculate the number of SMS segments required for a message
 * @param message - The message text to calculate segments for
 * @returns The number of segments required
 */
export function calculateSMSegments(message: string): number {
	if (!message || message.length === 0) return 0;
	return Math.ceil(message.length / 160);
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

	if (segments > 25) {
		return {
			isValid: false,
			segments,
			error: `Message too long. Requires ${segments} segments, maximum is 25.`
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
	const maxCharacters = 25 * 160; // 4,000 characters maximum (25 segments × 160 chars)
	const charactersRemaining = Math.max(0, maxCharacters - characters);
	const isOverLimit = segments > 25;

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
	return `${characters}/${maxCharacters} characters (${formatSegmentCount(segments)})`;
}

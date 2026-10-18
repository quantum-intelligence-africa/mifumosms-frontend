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

// ─── Hidden-character cleaning (mirror of messaging/sms_text.py on the backend) ───────────────────────────────────
//
// Pasted text (WhatsApp, Word, websites, PDFs) often carries invisible characters that silently switch a message from
// GSM-7 to Unicode or add segments. The backend cleans with the same rules before it counts credits and sends, so what
// the composer shows is what is sent. Letters of every language, accents, digits, URLs, currency, normal punctuation and
// emoji (with their joiners) are never changed. Curly quotes and long dashes are only swapped when the user asks.

const ALWAYS_REMOVE = new Set([
	"\u200b", "\ufeff", "\u2060", "\u2061", "\u2062", "\u2063", "\u2064", "\u00ad", "\u180e", "￼", "͏",
]);
const JOINERS = new Set(["\u200c", "\u200d"]);
const DIRECTION_MARKS = new Set([
	"\u200e", "\u200f", "\u061c", "\u202a", "\u202b", "\u202c", "\u202d", "\u202e", "\u2066", "\u2067", "\u2068", "\u2069",
]);
const EXOTIC_SPACES = new Set([
	"\u00a0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009",
	"\u200a", "\u202f", "\u205f", "\u3000",
]);
const RTL_RE = /[֐-ࣿיִ-﷿ﹰ-\ufeff]/;
const EMOJI_RE = /[\p{Extended_Pictographic}️⃣]/u;

/** Safe, meaning-preserving GSM-7 equivalents. Offered to the user, never applied silently. */
export const GSM_REPLACEMENTS: Record<string, string> = {
	"‘": "'", "’": "'", "‚": "'", "‛": "'", "′": "'",
	"“": '"', "”": '"', "„": '"', "″": '"', "«": '"', "»": '"',
	"–": "-", "—": "-", "―": "-", "−": "-",
	"…": "...",
	"•": "-",
};

const isPlainLatin = (ch: string | undefined): boolean =>
	ch === undefined || /\s/.test(ch) || (ch.codePointAt(0) as number) < 0x250;
const isEmoji = (ch: string | undefined): boolean => ch !== undefined && EMOJI_RE.test(ch);

/**
 * The cleaned text. `live: true` is for typing: it removes invisible characters and swaps odd spaces, but keeps the
 * user's own spaces and blank lines (so the caret never jumps and a trailing space can still be typed). Use the default
 * for the text that is sent.
 */
export function sanitizeSmsText(text: string | null | undefined, opts: { live?: boolean } = {}): string {
	if (text == null) return "";
	let s = String(text).normalize("NFC");
	s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[\u2028\u2029\u0085]/g, "\n");

	const chars = Array.from(s);
	const hasRtl = RTL_RE.test(s);
	const out: string[] = [];
	for (let i = 0; i < chars.length; i++) {
		const ch = chars[i];
		if (ALWAYS_REMOVE.has(ch)) continue;
		if (JOINERS.has(ch)) {
			const prev = chars[i - 1];
			const next = chars[i + 1];
			if (isEmoji(prev) || isEmoji(next) || !(isPlainLatin(prev) && isPlainLatin(next))) out.push(ch);
			continue;
		}
		if (DIRECTION_MARKS.has(ch)) {
			if (hasRtl) out.push(ch);
			continue;
		}
		if (EXOTIC_SPACES.has(ch) || ch === "\t") {
			out.push(" ");
			continue;
		}
		if (ch === "\n" || ch === "\x0b" || ch === "\x0c") {
			out.push("\n");
			continue;
		}
		if (/\p{Cc}/u.test(ch)) continue;
		out.push(ch);
	}
	s = out.join("").normalize("NFC");
	if (opts.live) return s;
	return s.replace(/ {2,}/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Optional, user-chosen: curly quotes, long dashes, ellipsis and bullets become plain ASCII. Emoji and accents are never touched. */
export function applyGsmReplacements(text: string): string {
	return Array.from(text).map((ch) => GSM_REPLACEMENTS[ch] ?? ch).join("");
}

export interface SmsAnalysis {
	encoding: "GSM-7" | "UCS-2";
	characters: number;
	units: number;
	segments: number;
	singlePartLimit: number;
	multiPartLimit: number;
	/** Characters that force Unicode (up to 10). */
	unicodeCharacters: string[];
	/** The subset of them that have a safe plain-ASCII swap. */
	replaceable: string[];
}

/** How this exact text will be sent (same rules as the backend's `analyze_sms_text`). */
export function analyzeSms(text: string): SmsAnalysis {
	const septets = text ? gsmSeptetCount(text) : 0;
	const gsm = septets !== null;
	const units = gsm ? (septets as number) : utf16CodeUnitCount(text);
	const singlePartLimit = gsm ? 160 : 70;
	const multiPartLimit = gsm ? 153 : 67;
	const segments = !text ? 0 : units <= singlePartLimit ? 1 : Math.max(1, Math.ceil(units / multiPartLimit));
	const forcing: string[] = [];
	if (!gsm) {
		for (const ch of text) {
			if (!GSM_7BIT_BASIC.has(ch) && !GSM_7BIT_EXTENDED.has(ch) && !forcing.includes(ch)) forcing.push(ch);
		}
	}
	return {
		encoding: gsm ? "GSM-7" : "UCS-2",
		characters: Array.from(text).length,
		units,
		segments,
		singlePartLimit,
		multiPartLimit,
		unicodeCharacters: forcing.slice(0, 10),
		replaceable: forcing.filter((ch) => ch in GSM_REPLACEMENTS).slice(0, 10),
	};
}

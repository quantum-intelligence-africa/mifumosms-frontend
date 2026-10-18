import type { ChangeEvent } from "react";
import { analyzeSms, sanitizeSmsText } from "./smsUtils";

/**
 * Typing / pasting into an SMS box: take invisible characters out right away and keep the caret where the user is.
 * The user's own spaces and blank lines are kept (so a trailing space can still be typed); the full tidy happens in
 * `finalizeSmsText` when the box loses focus and when sending.
 */
export function cleanTextareaInput(e: ChangeEvent<HTMLTextAreaElement>): { value: string; changed: boolean } {
	const el = e.target;
	const raw = el.value;
	const value = sanitizeSmsText(raw, { live: true });
	if (value === raw) return { value, changed: false };
	const caret = Math.max(0, (el.selectionStart ?? raw.length) - (raw.length - value.length));
	requestAnimationFrame(() => {
		try {
			el.setSelectionRange(caret, caret);
		} catch {
			/* the box may have been removed meanwhile */
		}
	});
	return { value, changed: true };
}

export interface FinalizedSms {
	/** The text that will be sent. */
	text: string;
	/** True when the final tidy changed what the box showed. */
	changed: boolean;
	segmentsBefore: number;
	segmentsAfter: number;
	/** True when the tidy changed the number of SMS, so the user must see the new estimate before it is sent. */
	estimateChanged: boolean;
}

/** The exact outgoing text, and whether cleaning changed the estimate the user was looking at. */
export function finalizeSmsText(text: string): FinalizedSms {
	const cleaned = sanitizeSmsText(text);
	const segmentsBefore = analyzeSms(text).segments;
	const segmentsAfter = analyzeSms(cleaned).segments;
	return {
		text: cleaned,
		changed: cleaned !== text,
		segmentsBefore,
		segmentsAfter,
		estimateChanged: segmentsBefore !== segmentsAfter,
	};
}

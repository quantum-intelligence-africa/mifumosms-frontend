import { analyzeSms, applyGsmReplacements } from "@/utils/smsUtils";
import { useLanguage } from "@/hooks/useLanguage";

interface SmsTextHintProps {
	text: string;
	/** True once the box has been cleaned of invisible characters (shows the notice). */
	cleaned?: boolean;
	/** Called with the converted text when the user clicks "Convert to plain characters". */
	onConvert?: (converted: string) => void;
	/** When more than one recipient, the credits line is multiplied. */
	recipientCount?: number;
	className?: string;
}

/**
 * Under an SMS box: the encoding (GSM-7 or Unicode), characters used, SMS count and credits; a warning that names the
 * characters that force Unicode; an optional one-click swap of curly quotes / long dashes for plain ones; and a small
 * notice when invisible characters were removed. Same rules as the backend, so the estimate is the real one.
 */
export function SmsTextHint({ text, cleaned = false, onConvert, recipientCount = 1, className = "" }: SmsTextHintProps) {
	const { language } = useLanguage();
	const sw = language === "sw";
	if (!text) return null;
	const a = analyzeSms(text);
	const credits = a.segments * Math.max(1, recipientCount);

	return (
		<div className={`mt-2 space-y-1 text-[11.5px] ${className}`} aria-live="polite">
			<p className="text-foreground/70">
				{a.encoding === "GSM-7" ? "GSM-7" : sw ? "Unicode (herufi maalum)" : "Unicode"}
				{" · "}
				{a.units}/{a.singlePartLimit}
				{" · "}
				{a.segments} SMS
				{recipientCount > 1 ? ` · ${credits} ${sw ? "mikopo" : "credits"}` : ""}
			</p>
			{a.encoding === "UCS-2" && (
				<p className="text-amber-600 dark:text-amber-400">
					{sw
						? `Ujumbe huu una herufi zinazobadilisha usimbaji kuwa Unicode (${a.unicodeCharacters.join(" ")}), hivyo kila SMS inabeba herufi 70 tu badala ya 160.`
						: `This message uses characters that switch it to Unicode (${a.unicodeCharacters.join(" ")}), so each SMS holds 70 characters instead of 160.`}
					{a.replaceable.length > 0 && onConvert && (
						<button type="button" className="ml-2 font-semibold underline" onClick={() => onConvert(applyGsmReplacements(text))}>
							{sw ? "Badilisha kuwa alama za kawaida" : "Convert to plain characters"}
						</button>
					)}
				</p>
			)}
			{cleaned && (
				<p className="text-foreground/55">
					{sw
						? "Ujumbe wako umesafishwa kutoa herufi zisizoonekana. Makadirio ya SMS yamesasishwa."
						: "Your message was cleaned to remove invisible formatting characters. SMS estimate updated."}
				</p>
			)}
		</div>
	);
}

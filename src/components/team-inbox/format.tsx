// Small presentation helpers for Team Inbox messages: clickable links, big emoji for emoji-only messages, and day separators.
import type { ReactNode } from "react";

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])/gi;
const EMOJI = /\p{Extended_Pictographic}|\p{Emoji_Modifier}/u;

/** Text with http(s) / www links made clickable. Links open in a new tab and never run script (React escapes everything else). */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer noopener" className="text-[#027eb5] underline underline-offset-2 dark:text-[#53bdeb]">
        {part}
      </a>
    );
  });
}

/** A message that is only one to three emoji is shown large, as WhatsApp does. */
export function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 24) return false;
  const marks = Array.from(t.replace(/\u200d|\ufe0f|\u20e3|\s/gu, ""));  // joiners and variation selectors are not emoji of their own
  return marks.length > 0 && marks.length <= 3 && marks.every((c) => EMOJI.test(c));
}

/** "Today", "Yesterday", or the date, for the separator between days of a conversation. */
export function dayLabel(iso: string, today: string, yesterday: string, locale?: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return today;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return yesterday;
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

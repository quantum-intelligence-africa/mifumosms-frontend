export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  final: boolean;
  start: number;
  sequence: number;
  unclear: boolean;
}

/**
 * Add one `live_transcript` event to the lines shown. Rules:
 *  - a finalized line is never replaced by a partial (or by anything else for the same segment);
 *  - an older update never replaces a newer one (events can arrive out of order);
 *  - lines stay in the order they were spoken.
 */
export function mergeLine(prev: TranscriptLine[], incoming: TranscriptLine): TranscriptLine[] {
  const existing = prev.find((l) => l.id === incoming.id);
  if (existing && (existing.final || existing.sequence > incoming.sequence)) return prev;
  const next = existing ? prev.map((l) => (l.id === incoming.id ? incoming : l)) : [...prev, incoming];
  return [...next].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

// Filename → contact matching for personalized WhatsApp image sends.
//
// Shared by the Single and Bulk send flows so both pair an uploaded image to a
// recipient using the SAME rules the backend applies:
//   - phone digits in the filename  (e.g. 255712345678.png), or
//   - normalized contact name        (e.g. john_magesa.jpg → "john_magesa").
//
// Bulk matches many files → contacts (to build a recipient list); Single matches
// one contact → its file (to inject as that recipient's template image header).
// Both rely on the primitives below so the normalization can never drift apart.

/** lowercase, whitespace→_, strip non [a-z0-9_], collapse and trim underscores. */
export function normalizeContactName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Drop the file extension: "john.png" → "john". */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export interface FileMatchIndex {
  byPhone: Map<string, File>;
  byName: Map<string, File>;
}

/**
 * The match keys a filename yields: `phone` (digits, when the name looks like a
 * phone number) and `name` (normalized). Used to resolve an uploaded image back
 * to a contact for the "image → contact" review.
 */
export function fileKeys(file: File): { phone: string; name: string } {
  const key = stripExtension(file.name);
  const digits = key.replace(/\D/g, "");
  const looksLikePhone = digits.length >= 9 && /^[+\d\s-]+$/.test(key);
  return { phone: looksLikePhone ? digits : "", name: normalizeContactName(key) };
}

/**
 * Index an uploaded image set by phone digits and normalized name (both derived
 * from each filename) so a recipient can be resolved in O(1). First file wins on
 * a collision, mirroring the contact index the bulk flow already uses.
 */
export function buildFileMatchIndex(files: File[]): FileMatchIndex {
  const byPhone = new Map<string, File>();
  const byName = new Map<string, File>();
  for (const f of files) {
    const key = stripExtension(f.name);
    const digits = key.replace(/\D/g, "");
    const looksLikePhone = digits.length >= 9 && /^[+\d\s-]+$/.test(key);
    if (looksLikePhone && !byPhone.has(digits)) byPhone.set(digits, f);
    const norm = normalizeContactName(key);
    if (norm && !byName.has(norm)) byName.set(norm, f);
  }
  return { byPhone, byName };
}

/**
 * Find the uploaded image that belongs to a contact — phone first (most
 * reliable), normalized name as fallback. Returns null when nothing matches.
 */
export function matchFileForContact(
  name: string,
  phoneE164: string,
  index: FileMatchIndex,
): { file: File; via: "phone" | "name" } | null {
  const digits = (phoneE164 || "").replace(/\D/g, "");
  if (digits) {
    const hit = index.byPhone.get(digits);
    if (hit) return { file: hit, via: "phone" };
  }
  const norm = normalizeContactName(name || "");
  if (norm) {
    const hit = index.byName.get(norm);
    if (hit) return { file: hit, via: "name" };
  }
  return null;
}

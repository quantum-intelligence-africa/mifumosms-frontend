import { useEffect, useState } from "react";
import { fileKeys, normalizeContactName } from "@/utils/contactImageMatch";

// Visual "image → contact" review for personalized WhatsApp image sends.
// After the user uploads images from their device, this shows a thumbnail of
// each file next to the contact it resolved to (by phone digits or normalized
// name in the filename) — so they can confirm the matching is correct before
// sending. Matching here is checked against the contacts currently loaded on
// the page; the send re-matches per recipient regardless.

interface ContactLite {
  name?: string;
  phone_number: string;
}

export function ImageMatchReview({
  files,
  contacts,
  onSend,
  sending = false,
}: {
  files: File[];
  contacts: ContactLite[];
  // When provided, each matched row gets a Send button that delivers the
  // template (with this image) to that contact directly.
  onSend?: (contact: ContactLite) => void;
  sending?: boolean;
}) {
  // One object URL per file for the thumbnail; revoked when files change/unmount.
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const made = files.map((f) => URL.createObjectURL(f));
    setUrls(made);
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  if (files.length === 0) return null;

  // Index the loaded contacts so each file resolves in O(1). First contact wins
  // on a collision, mirroring the send-time matcher.
  const byPhone = new Map<string, ContactLite>();
  const byName = new Map<string, ContactLite>();
  for (const c of contacts) {
    const d = (c.phone_number || "").replace(/\D/g, "");
    if (d && !byPhone.has(d)) byPhone.set(d, c);
    const n = normalizeContactName(c.name || "");
    if (n && !byName.has(n)) byName.set(n, c);
  }

  const matchedCount = files.filter((f) => {
    const k = fileKeys(f);
    return (k.phone && byPhone.get(k.phone)) || (k.name && byName.get(k.name));
  }).length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60">
          Image → contact matches
        </p>
        <span className="text-[10.5px] text-muted-foreground">
          <span className="font-semibold text-[#1ebe5d] tabular-nums">{matchedCount}</span> of{" "}
          {files.length} matched
        </span>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {files.map((f, i) => {
          const k = fileKeys(f);
          const c = (k.phone && byPhone.get(k.phone)) || (k.name && byName.get(k.name)) || null;
          return (
            <div key={`${f.name}-${i}`} className="flex items-center gap-2 px-2 py-1.5">
              {urls[i] ? (
                <img
                  src={urls[i]}
                  alt=""
                  className="w-9 h-9 rounded object-cover flex-shrink-0 border border-border"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-muted flex-shrink-0" />
              )}
              <span className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">
                {f.name}
              </span>
              {c ? (
                <>
                  <span className="text-[11px] font-medium text-[#1ebe5d] truncate max-w-[40%] text-right">
                    → {c.name?.trim() || c.phone_number}
                  </span>
                  {onSend && (
                    <button
                      type="button"
                      onClick={() => onSend(c)}
                      disabled={sending}
                      className="ml-1 h-6 px-2.5 text-[10.5px] font-semibold rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white disabled:opacity-50 flex-shrink-0"
                    >
                      Send
                    </button>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 flex-shrink-0">
                  no match here
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Matches are checked against contacts loaded on this page. The send re-matches each
        selected recipient by filename — phone digits or normalized name.
      </p>
    </div>
  );
}

export default ImageMatchReview;

import { MessageSquare } from "lucide-react";

// ─── Reusable phone-style preview for an outgoing SMS ──────────────────────────
// Renders the message the way it lands on a recipient's phone: the approved
// Sender ID shows as the conversation name, and the body sits in a received
// chat bubble. Used on the Send SMS screen for Single (Quick), Bulk and Group
// modes — they all share one message + sender form, so one preview covers them.
// Mirrors the WhatsApp template preview so both channels feel consistent.

const formatNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

interface SmsMessagePreviewProps {
  /** Approved Sender ID (branding name) — appears as the conversation name. */
  senderName?: string;
  /** The message body the user typed. */
  message?: string;
  /** How many recipients the send will go to (drives the footer summary). */
  recipientCount?: number;
  /** Number of SMS segments the body spans (160 GSM chars each). */
  segmentCount?: number;
  /** First recipient number, shown as "To …" in Single mode. */
  sampleRecipient?: string;
  /** Active send mode — tweaks the footer wording. */
  mode?: "single" | "bulk" | "segment";
  language?: "sw" | "en";
}

export function SmsMessagePreview({
  senderName = "",
  message = "",
  recipientCount = 0,
  segmentCount = 1,
  sampleRecipient = "",
  mode = "single",
  language = "en",
}: SmsMessagePreviewProps) {
  const sw = language === "sw";
  const displaySender = senderName.trim() || (sw ? "Mtumaji" : "Sender ID");
  const avatarLetter = (displaySender[0] || "S").toUpperCase();
  const hasBody = message.trim().length > 0;

  return (
    <aside className="rounded-2xl border border-border/60 bg-card shadow-sm p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <MessageSquare className="w-4 h-4 text-primary" strokeWidth={2.4} />
        <h2 className="text-[14px] font-bold">{sw ? "Onyesho la ujumbe" : "Message preview"}</h2>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 bg-[#ece9e4] dark:bg-[#0b141a]">
        {/* Conversation header — the recipient sees the Sender ID as the name */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-[12px] font-bold">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold leading-tight truncate">{displaySender}</div>
            <div className="text-[10.5px] opacity-80 leading-tight">{sw ? "Ujumbe wa SMS" : "Text message"}</div>
          </div>
        </div>

        {/* Conversation body — received bubble (left aligned, like a phone inbox) */}
        <div
          className="px-3 py-4 min-h-[150px]"
          style={{
            backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        >
          <div className="max-w-[88%] bg-white dark:bg-[#202c33] dark:text-white text-foreground rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
            <div className="px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {hasBody ? (
                message
              ) : (
                <span className="italic text-muted-foreground">
                  {sw ? "Andika ujumbe ili kuuona hapa…" : "Type a message to preview it here…"}
                </span>
              )}
            </div>
            <div className="px-3 pb-1.5 flex items-center justify-end gap-1 text-[10.5px] opacity-60">
              <span className="tabular-nums">{formatNow()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer summary — sender, recipients, segment cost */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground text-center">
        {mode === "single" && sampleRecipient ? (
          <span>
            {sw ? "Kwenda" : "To"}: <span className="font-semibold text-foreground/70">{sampleRecipient}</span>
            {recipientCount > 1 && ` +${recipientCount - 1}`}
          </span>
        ) : recipientCount > 0 ? (
          <span>
            <span className="font-semibold text-foreground/70 tabular-nums">{recipientCount.toLocaleString()}</span>{" "}
            {sw ? "wapokeaji" : recipientCount === 1 ? "recipient" : "recipients"}
          </span>
        ) : (
          <span>{sw ? "Hakuna wapokeaji bado" : "No recipients yet"}</span>
        )}
        {hasBody && (
          <span>
            <span className="font-semibold text-foreground/70 tabular-nums">{segmentCount}</span>{" "}
            {sw ? (segmentCount === 1 ? "sehemu" : "sehemu") : segmentCount === 1 ? "segment" : "segments"}
            {recipientCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-foreground/70 tabular-nums">
                  {(recipientCount * segmentCount).toLocaleString()}
                </span>{" "}
                SMS
              </>
            )}
          </span>
        )}
      </div>
    </aside>
  );
}

export default SmsMessagePreview;

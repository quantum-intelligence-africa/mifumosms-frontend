import { useEffect, useState } from "react";
import { FileText, Video } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type {
  WAMessageTemplate,
  WATemplateComponent,
} from "@/hooks/useWhatsAppCloud";

// ─── Reusable WhatsApp chat-style preview for an approved Meta template ────────
// Renders the selected template inside a faux WhatsApp chat bubble so the user
// sees how the outgoing message will look before sending — in both Single and
// Bulk send. Body/header placeholders ({{1}}, {{name}}) are rendered as chips
// labelled with the field they'll be filled from (Name / Phone / a fixed value),
// mirroring the per-parameter mapping the user configured.

const componentOf = (
  tpl: WAMessageTemplate | null,
  type: WATemplateComponent["type"],
): WATemplateComponent | undefined => tpl?.components?.find((c) => c.type === type);

// Turn a param source ("name" | "phone" | "email" | "attr:company" |
// "static:Hello") into what the preview should show for that placeholder.
//   • static → the literal text (rendered inline, no chip)
//   • everything else → a short human label rendered as a chip
const describeSource = (
  src: string | undefined,
  token: string,
): { kind: "literal"; value: string } | { kind: "chip"; value: string } => {
  if (!src) return { kind: "chip", value: labelForToken(token) };
  if (src.startsWith("static:")) {
    const v = src.slice("static:".length).trim();
    return { kind: "literal", value: v || `{{${token}}}` };
  }
  if (src.startsWith("attr:")) {
    const k = src.slice("attr:".length).trim();
    return { kind: "chip", value: k || token };
  }
  switch (src) {
    case "name":
      return { kind: "chip", value: "Name" };
    case "phone":
      return { kind: "chip", value: "Phone" };
    case "email":
      return { kind: "chip", value: "Email" };
    default:
      return { kind: "chip", value: src };
  }
};

const labelForToken = (token: string): string =>
  /^\d+$/.test(token) ? `Value ${token}` : token;

const formatNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

const Chip = ({ value }: { value: string }) => (
  <span className="inline-flex items-center align-baseline px-1.5 py-[1px] mx-0.5 rounded-md bg-white/80 dark:bg-white/15 text-[#075e54] dark:text-[#a4f0e4] text-[11px] font-semibold shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
    {value}
  </span>
);

// Split a template string on {{token}} and render each token via paramSources.
const renderWithParams = (text: string, paramSources: Record<string, string>) => {
  const re = /{{\s*([^}]+?)\s*}}/g;
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, m.index)}</span>);
    const token = m[1].trim();
    const desc = describeSource(paramSources[token], token);
    out.push(
      desc.kind === "literal" ? (
        <span key={`p${i}`}>{desc.value}</span>
      ) : (
        <Chip key={`p${i}`} value={desc.value} />
      ),
    );
    cursor = m.index + m[0].length;
    i += 1;
  }
  if (cursor < text.length) out.push(<span key={`t${i}`}>{text.slice(cursor)}</span>);
  return out;
};

interface WhatsAppMessagePreviewProps {
  template: WAMessageTemplate | null;
  /** token -> source: "name" | "phone" | "email" | "attr:<k>" | "static:<v>" */
  paramSources?: Record<string, string>;
  /** Public URL for the header media (when the user pasted one). */
  mediaUrl?: string;
  /** Uploaded header media file (when the user chose one). */
  mediaFile?: File | null;
  emptyHint?: string;
}

export function WhatsAppMessagePreview({
  template,
  paramSources = {},
  mediaUrl = "",
  mediaFile = null,
  emptyHint = "Select a template to preview the message.",
}: WhatsAppMessagePreviewProps) {
  const header = componentOf(template, "HEADER");
  const headerFormat = header?.format; // TEXT | IMAGE | VIDEO | DOCUMENT
  const headerIsMedia =
    headerFormat === "IMAGE" || headerFormat === "VIDEO" || headerFormat === "DOCUMENT";
  const bodyText = componentOf(template, "BODY")?.text ?? "";
  const footerText = componentOf(template, "FOOTER")?.text ?? "";
  const buttons = (componentOf(template, "BUTTONS")?.buttons ?? []) as Array<{ text?: string }>;

  // Local object-URL preview for an uploaded header file (revoked on change).
  const [filePreview, setFilePreview] = useState("");
  useEffect(() => {
    if (!mediaFile) {
      setFilePreview("");
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const imageSrc = filePreview || mediaUrl;
  const showImage = headerFormat === "IMAGE" && !!imageSrc;
  const showVideo = headerFormat === "VIDEO";
  const showDocument = headerFormat === "DOCUMENT";

  return (
    <aside className="rounded-2xl border border-border/60 bg-card shadow-sm p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
        <h2 className="text-[14px] font-bold">Message preview</h2>
      </div>

      {!template ? (
        <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
          <p className="text-[12.5px] italic text-muted-foreground">{emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 bg-[#e5ddd5] dark:bg-[#0b141a]">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] dark:from-[#005c4b] dark:to-[#003e35] text-white px-3 py-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-tight truncate">Your Business</div>
                <div className="text-[10.5px] opacity-80 leading-tight">online</div>
              </div>
            </div>

            {/* Chat body */}
            <div
              className="px-3 py-4 min-h-[180px]"
              style={{
                backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            >
              <div className="max-w-[88%] bg-[#dcf8c6] dark:bg-[#005c4b] dark:text-white text-foreground rounded-2xl rounded-tl-sm shadow-sm overflow-hidden relative">
                {showImage && (
                  <img src={imageSrc} alt="" className="w-full max-h-44 object-cover" />
                )}
                {showVideo && (
                  <div className="w-full max-h-44 aspect-video bg-black/60 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/80" />
                  </div>
                )}
                {showDocument && (
                  <div className="px-3 pt-2 pb-1 flex items-center gap-2 bg-black/5 dark:bg-white/5">
                    <FileText className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="text-[11.5px] truncate font-medium">
                      {mediaFile?.name || "document"}
                    </span>
                  </div>
                )}
                {headerFormat === "TEXT" && header?.text && (
                  <div className="px-3 pt-2 font-bold text-[13px]">
                    {renderWithParams(header.text, paramSources)}
                  </div>
                )}

                <div className="px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                  {bodyText ? renderWithParams(bodyText, paramSources) : "Body preview…"}
                </div>

                {footerText && (
                  <div className="px-3 pb-1 text-[11px] opacity-60">{footerText}</div>
                )}

                <div className="px-3 pb-1.5 flex items-center justify-end gap-1 text-[10.5px] opacity-60">
                  <span className="tabular-nums">{formatNow()}</span>
                  <span aria-hidden>✓✓</span>
                </div>

                {buttons.length > 0 && (
                  <div className="border-t border-black/10 dark:border-white/10">
                    {buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 text-center text-[12.5px] font-medium text-[#075e54] dark:text-[#a4f0e4] border-b border-black/5 dark:border-white/5 last:border-b-0"
                      >
                        {btn.text ?? ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(headerIsMedia && !imageSrc) && (
            <p className="text-[10.5px] text-muted-foreground text-center">
              {String(headerFormat).toLowerCase()} header — attach media below to preview it.
            </p>
          )}
          <p className="text-[10.5px] text-muted-foreground text-center">
            Highlighted chips are filled per-recipient when sent.
          </p>
        </>
      )}
    </aside>
  );
}

export default WhatsAppMessagePreview;

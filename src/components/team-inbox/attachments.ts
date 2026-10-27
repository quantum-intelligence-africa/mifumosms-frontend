// What WhatsApp can carry from the Team Inbox. This mirrors the server's rules (team_inbox/attachments.py) so a wrong file is refused
// at once, before anything is uploaded on a slow connection. The server checks again: nothing here is trusted.
export type FileKind = "image" | "video" | "audio" | "document";

const MB = 1024 * 1024;
export const LIMIT_MB: Record<FileKind, number> = { image: 5, video: 16, audio: 16, document: 25 };
export const MAX_FILES = 10;

const EXT: Record<string, FileKind> = {
  jpg: "image", jpeg: "image", png: "image",
  mp4: "video", "3gp": "video",
  aac: "audio", m4a: "audio", mp3: "audio", amr: "audio", ogg: "audio", opus: "audio",
  pdf: "document", doc: "document", docx: "document", xls: "document", xlsx: "document", ppt: "document", pptx: "document", txt: "document",
};

/** The value for `<input accept>`. */
export const ACCEPT = Object.keys(EXT).map((e) => `.${e}`).join(",");
/** Kinds whose message can carry a caption on WhatsApp. */
export const CAPTION_KINDS: FileKind[] = ["image", "video"];

/** `error` is set when the file must not be sent; otherwise `kind` says what it is. */
export interface FileCheck { kind?: FileKind; error?: "type" | "size" | "empty" }

export function checkFile(file: File): FileCheck {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const kind = EXT[ext];
  if (!kind) return { error: "type" };
  if (file.size === 0) return { kind, error: "empty" };
  if (file.size > LIMIT_MB[kind] * MB) return { kind, error: "size" };
  return { kind };
}

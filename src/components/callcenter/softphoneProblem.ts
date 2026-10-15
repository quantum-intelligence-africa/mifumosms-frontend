// What to tell an agent when their browser phone is not connected: the actual reason, in plain words, and what to do.
import type { useLanguage } from "@/hooks/useLanguage";

type T = ReturnType<typeof useLanguage>["t"];

/** ``note`` is the reason the call-center context recorded (a short code, or the server's own message for a refused token). */
export function softphoneProblem(note: string, state: string, t: T): string {
  if (state === "off") return t("cc.softphone.reason_off");
  switch (note) {
    case "no_number": return t("cc.workspace.softphone_no_number");
    case "not_ready": return t("cc.softphone.reason_not_ready");
    case "offline": return t("cc.softphone.reason_offline");
    case "closed": return t("cc.softphone.reason_closed");
    case "mic_denied": return t("cc.softphone.reason_mic");
    case "token_failed": return t("cc.softphone.reason_token", { detail: "" });
    default: return note ? t("cc.softphone.reason_token", { detail: note }) : t("cc.workspace.softphone_error");
  }
}

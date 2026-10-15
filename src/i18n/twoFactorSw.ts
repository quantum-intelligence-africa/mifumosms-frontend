import type { tfEn } from "@/i18n/twoFactor";

export const tfSw: Record<keyof typeof tfEn, string> = {
  "tf.title": "Thibitisha kuwa ni wewe",
  "tf.sent": "Tumetuma msimbo wa tarakimu 6 kwenda {email}. Uuandike hapa chini ili kukamilisha kuingia.",
  "tf.sent_failed": "Hatukuweza kutuma msimbo. Bonyeza \"Tuma msimbo tena\" ujaribu tena.",
  "tf.code_label": "Msimbo wa uthibitisho",
  "tf.verify": "Thibitisha",
  "tf.verifying": "Inathibitisha…",
  "tf.resend": "Tuma msimbo tena",
  "tf.resend_in": "Tuma tena baada ya sekunde {seconds}",
  "tf.resending": "Inatuma…",
  "tf.resent": "Msimbo mpya umetumwa.",
  "tf.expires_in": "Msimbo huisha baada ya {time}",
  "tf.expired": "Msimbo huu umeisha muda. Omba mwingine.",
  "tf.invalid": "Msimbo huo si sahihi. Uangalie kisha ujaribu tena.",
  "tf.locked": "Umekosea mara nyingi. Omba msimbo mpya.",
  "tf.too_many": "Majaribio ni mengi mno. Tafadhali subiri kidogo kisha ujaribu tena.",
  "tf.success": "Imethibitishwa. Inakuingiza…",
  "tf.back": "Rudi kwenye kuingia",
  "tf.generic_error": "Kuna tatizo lililotokea. Tafadhali jaribu tena.",
};

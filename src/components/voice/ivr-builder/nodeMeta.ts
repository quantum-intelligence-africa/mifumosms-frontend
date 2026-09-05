// Central registry describing every IVR node type: icon, palette label, the
// output ports it exposes, and the settings fields it needs in the node
// inspector. NodePalette, the per-type node components, the inspector form,
// and validation.ts all read from this single source instead of repeating
// the field list in four places.
//
// Everything a *person* reads here is written in plain Kiswahili, the way a
// receptionist would describe the step ("Chaguo la Mteja", "Mpeleke kwa
// Mhudumu"), never in call-engine vocabulary — a SENDA customer building
// their own phone line should never have to learn what "DTMF", a "node", or
// a "timeout" is. The technical identifiers stay technical: the `type` keys
// and the `key` of every field are the exact wire contract the backend
// engine reads (ivr/engine.py), and those are what the API, the logs and
// the monitoring keep speaking.
import {
  PhoneIncoming,
  LayoutGrid,
  GitBranch,
  Play,
  PhoneForwarded,
  Globe,
  Sparkles,
  Bot,
  PhoneOff,
  Variable,
  Split,
  Clock,
  Mic,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Voicemail,
  type LucideIcon,
} from "lucide-react";
import type { IvrNodeType } from "./types";

export interface NodeOutput {
  id: string;
  label: string;
  icon?: LucideIcon;
  dotClass?: string; // border/bg classes for the connector dot
  textClass?: string; // classes for the label/icon
}

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "number"
  | "list"
  | "agent"
  | "agent_multiselect"
  | "prompt_library";

export interface NodeField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: unknown;
  helpText?: string;
}

export interface NodeMeta {
  type: IvrNodeType;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  description: string;
  /** true if this node has no outgoing edges by design (call ends here) */
  terminal?: boolean;
  /** true if this node's outputs are computed dynamically (switch: one per case) */
  dynamicOutputs?: boolean;
  /** static outputs; for a single-output node this is a single unlabeled port */
  outputs: NodeOutput[];
  fields: NodeField[];
}

const singleOutput: NodeOutput[] = [{ id: "out", label: "" }];

// Repeated on every node that speaks. Kept as one constant so the guidance
// on writing natural, branded prompts is identical everywhere it appears.
const voiceField: NodeField = {
  key: "voice",
  label: "Sauti ya kusoma ujumbe (si lazima)",
  type: "text",
  placeholder: "mf. sw-KE-Chirp3-HD-Aoede",
  helpText:
    "Jina la sauti ya Google Cloud TTS — ukiacha wazi, itatumika sauti ya kawaida. Sauti za Kiswahili zina muundo sw-KE-Chirp3-HD-<jina>.",
};

const PLACEHOLDER_HELP =
  "Unaweza kutumia {company_name} (jina la biashara), {customer_name}, {agent_name} na {business_hours} ndani ya ujumbe. Kama thamani haipo, itaondolewa yenyewe bila kuacha alama za nyongeza." +
  // The phone system always finishes speaking the whole prompt before it
  // starts listening for a keypress — it can't be interrupted early. Short,
  // comma-free sentences don't create extra silence any more (that used to
  // be true, no longer is), but they're still what a caller sits through
  // before they can press anything, so shorter is still better.
  " Andika sentensi fupi bila mkato (,) — mfumo husoma ujumbe wote kabla ya kuanza kusikiliza bonyeza, hivyo sentensi fupi humaanisha muda mfupi zaidi wa kusubiri kabla ya kubonyeza.";

export const NODE_META: Record<IvrNodeType, NodeMeta> = {
  start: {
    type: "start",
    label: "Mwanzo wa Simu",
    icon: PhoneIncoming,
    iconClass: "text-primary",
    description: "Hapa ndipo simu inapoanzia",
    outputs: singleOutput,
    fields: [],
  },
  ivr_menu: {
    type: "ivr_menu",
    label: "Chaguo la Mteja",
    icon: LayoutGrid,
    iconClass: "text-blue-600",
    description: "Msomee mteja huduma zilizopo, kisha usubiri achague",
    outputs: [
      { id: "match", label: "Amechagua", icon: CheckCircle2, dotClass: "bg-green-500 border-green-600", textClass: "text-green-600" },
      { id: "timeout", label: "Hakujibu", icon: Clock, dotClass: "bg-yellow-400 border-yellow-500", textClass: "text-yellow-600" },
      { id: "no_match", label: "Chaguo si sahihi", icon: AlertTriangle, dotClass: "bg-red-500 border-red-600", textClass: "text-red-600" },
    ],
    fields: [
      {
        key: "prompt",
        label: "Ujumbe wa kumwambia mteja",
        type: "textarea",
        required: true,
        placeholder: "Karibu {company_name}. Kwa huduma kwa wateja, bonyeza 1. Kwa mauzo, bonyeza 2.",
        helpText: `Andika kama sentensi kamili, si orodha ya "Bonyeza 1. Bonyeza 2." ${PLACEHOLDER_HELP}`,
      },
      {
        key: "expected_inputs",
        label: "Chaguo (tenganisha kwa koma)",
        type: "list",
        placeholder: "1, 2, 0",
      },
      {
        key: "save_as",
        label: "Hifadhi chaguo alilobonyeza kama (si lazima)",
        type: "text",
        placeholder: "mf. chaguo_kuu",
        helpText:
          "Huhifadhi namba aliyobonyeza kwenye jina hili. Unganisha njia ya \"Amechagua\" na kisanduku cha \"Elekeza kwa Chaguo\" kinachotumia jina hili ili kila namba iende mahali pake, badala ya kuunganisha menyu nyingi mfululizo.",
      },
      {
        key: "timeout_seconds",
        label: "Muda wa kusubiri baada ya ujumbe (sekunde)",
        type: "number",
        defaultValue: 8,
        helpText:
          "Sekunde za kumsubiri mteja achague baada ya sentensi ya mwisho kusomwa, kabla ya kufuata njia ya \"Hakujibu\". Mteja anayebonyeza wakati ujumbe unasomwa huelekezwa mara sentensi hiyo inapoisha — hahitaji kusikiliza hadi mwisho.",
      },
      voiceField,
    ],
  },
  decision: {
    type: "decision",
    label: "Uamuzi",
    icon: GitBranch,
    iconClass: "text-purple-600",
    description: "Chagua njia kulingana na taarifa uliyohifadhi",
    outputs: [
      { id: "true", label: "Ndiyo", icon: CheckCircle2, dotClass: "bg-green-500 border-green-600", textClass: "text-green-600" },
      { id: "false", label: "Hapana", icon: XCircle, dotClass: "bg-red-500 border-red-600", textClass: "text-red-600" },
    ],
    fields: [
      { key: "variable", label: "Taarifa ya kuangalia", type: "text", required: true, placeholder: "mf. ni_saa_za_kazi" },
      {
        key: "operator",
        label: "Ulinganishe vipi",
        type: "select",
        required: true,
        options: ["eq", "neq", "gt", "gte", "lt", "lte"],
        defaultValue: "eq",
      },
      { key: "value", label: "Thamani ya kulinganisha nayo", type: "text" },
    ],
  },
  play: {
    type: "play",
    label: "Ujumbe wa Sauti",
    icon: Play,
    iconClass: "text-indigo-600",
    description: "Msomee mteja ujumbe au mchezee sauti, kisha endelea",
    outputs: singleOutput,
    fields: [
      {
        key: "library_prompt_id",
        label: "Tumia kutoka Maktaba ya Ujumbe",
        type: "prompt_library",
        helpText: "Chagua ujumbe uliohifadhiwa (Voice / IVR > Audio Prompts), au andika/pakia hapa chini.",
      },
      {
        key: "prompt",
        label: "Ujumbe wa kumsomea mteja",
        type: "textarea",
        placeholder: "Karibu {company_name}. Asante kwa kuwasiliana nasi.",
        helpText: `Acha wazi kama unatumia sauti iliyorekodiwa hapo chini. ${PLACEHOLDER_HELP}`,
      },
      { ...voiceField, helpText: `${voiceField.helpText} Haitumiki kama umeweka sauti iliyorekodiwa.` },
      {
        key: "audio_url",
        label: "Sauti iliyorekodiwa (si lazima)",
        type: "text",
        placeholder: "https://example.com/salamu.mp3",
        helpText:
          "Cheza faili la sauti badala ya kusoma maandishi — mfano muziki wa kusubiri au salamu iliyorekodiwa. Ikiwekwa, inatangulia ujumbe wa maandishi. Lazima iwe kiungo cha http(s) kinachofikika.",
      },
    ],
  },
  call_forward: {
    type: "call_forward",
    label: "Mpeleke kwa Mhudumu",
    icon: PhoneForwarded,
    iconClass: "text-cyan-600",
    description: "Unganisha mteja na mtu halisi",
    // The AT adapter always renders this as the terminal <Dial> action —
    // nothing downstream of it is ever reached, so it behaves like hangup.
    terminal: true,
    outputs: [],
    fields: [
      {
        key: "agent_id",
        label: "Mhudumu",
        type: "agent",
        helpText: "Chagua kutoka kwenye orodha ya wahudumu (Voice / IVR > Agents). Namba na jina hujazwa yenyewe.",
      },
      {
        key: "destination",
        label: "Namba ya mhudumu",
        type: "text",
        required: true,
        placeholder: "+255700000000",
        helpText: "Unaweza pia kuandika {ai_destination} kama namba hii inatoka kwenye kisanduku cha Wakala wa AI kilichotangulia.",
      },
      {
        key: "agent_name",
        label: "Jina la mhudumu au idara (si lazima)",
        type: "text",
        placeholder: "mf. Idara ya Mauzo",
        helpText: 'Likiwekwa, mteja atasikia "Sawa, nakuelekeza kwa Idara ya Mauzo. Tafadhali subiri kidogo."',
      },
      {
        key: "announcement",
        label: "Ujumbe wa kusema kabla ya kuunganisha (si lazima)",
        type: "textarea",
        placeholder: "{ai_reply}",
        helpText:
          'Ukiwekwa, huu ndio ujumbe atakaosikia badala ya "Sawa, nakuelekeza kwa..." — kwa mfano {ai_reply} kutoka kwenye kisanduku cha Wakala wa AI kilichotangulia.',
      },
      {
        key: "announce_transfer",
        label: "Mwambie mteja anaelekezwa",
        type: "checkbox",
        defaultValue: true,
        helpText:
          "Mteja ataambiwa anaunganishwa kabla simu haijaita, badala ya kunyamazishwa ghafla. Ondoa alama kama tayari umeweka ujumbe wako mwenyewe hapo juu.",
      },
      {
        key: "ringback_url",
        label: "Muziki wa kusubiri (si lazima)",
        type: "text",
        placeholder: "https://example.com/muziki.mp3",
        helpText: "Unachezwa kwa mteja wakati simu ikiita kwa mhudumu, badala ya mlio wa kawaida.",
      },
      { key: "record", label: "Rekodi mazungumzo haya", type: "checkbox", defaultValue: false },
      {
        key: "voicemail_if_unanswered",
        label: "Asipopokea, mteja aache ujumbe",
        type: "checkbox",
        defaultValue: true,
        helpText:
          "Mhudumu asipopokea simu, mteja ataambiwa \"hakuna mhudumu anayepatikana\" na kuachiwa nafasi ya kuacha ujumbe wa sauti, unaoonekana kwenye Rekodi.",
      },
    ],
  },
  http_request: {
    type: "http_request",
    label: "Pata Taarifa Nje",
    icon: Globe,
    iconClass: "text-orange-600",
    description: "Wasiliana na mfumo mwingine wakati wa simu",
    outputs: singleOutput,
    fields: [
      { key: "url", label: "Kiungo (URL)", type: "text", required: true, placeholder: "https://example.com/webhook" },
      { key: "method", label: "Aina ya ombi", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"], defaultValue: "GET" },
      { key: "dry_run", label: "Jaribio tu", type: "checkbox", defaultValue: true, helpText: "Hakuna ombi halisi litakalotumwa ukiacha alama hii" },
    ],
  },
  ai_prompt: {
    type: "ai_prompt",
    label: "Jibu la AI",
    icon: Sparkles,
    iconClass: "text-fuchsia-600",
    description: "Tengeneza jibu kwa kutumia akili bandia",
    outputs: singleOutput,
    fields: [{ key: "prompt", label: "Maelekezo kwa AI", type: "textarea" }],
  },
  ai_agent: {
    type: "ai_agent",
    label: "Wakala wa AI",
    icon: Bot,
    iconClass: "text-fuchsia-600",
    description: "Mteja anazungumza na AI, AI inajibu maswali, kisha inamuunganisha na mhudumu",
    // One outgoing edge: after the AI replies, the flow always continues to
    // exactly one next step — normally a "Mpeleke kwa Mhudumu" node wired
    // with {ai_destination}/{ai_agent_name}/{ai_reply} placeholders (see
    // the "Mpokezi wa AI" starter template).
    outputs: singleOutput,
    fields: [
      {
        key: "prompt",
        label: "Ujumbe wa kwanza (AI itajitambulisha na biashara)",
        type: "textarea",
        required: true,
        placeholder:
          "Karibu {company_name}. Tunatoa huduma za kutuma ujumbe kwa biashara. Naweza kukusaidia na nini leo?",
        // Spoken by the flow, not by the AI: the first thing a caller hears
        // must not wait on a model. Say who you are and what you do, then
        // ask an open question — that is the caller's cue to start talking.
        // AT cannot record while it is still speaking, so a caller who
        // answers a long greeting is talking into a closed microphone —
        // keep it short and point at the beep.
        helpText: `Mteja atasikia hii kabla hajaanza kuzungumza, hivyo eleza kwa ufupi kampuni yako inafanya nini kisha muulize anachohitaji. Iwe fupi na mwambie aanze kuzungumza baada ya mlio — simu haisikilizi wakati bado inaongea. Hakuna haja ya kumwambia abonyeze kitufe chochote. ${PLACEHOLDER_HELP}`,
      },
      {
        key: "business_description",
        label: "AI ijue nini kuhusu biashara (si lazima)",
        type: "textarea",
        placeholder: "SENDA inatoa huduma za ujumbe wa simu na WhatsApp kwa biashara ndogo na kubwa nchini Tanzania.",
        // The single highest-leverage field on this node: the model is told
        // never to go beyond what is written here, so anything missing is
        // something it will hand to a human instead of handling itself.
        helpText:
          "Maelezo haya yanamsaidia AI kujibu kama mfanyakazi halisi anayejua biashara. Kadiri unavyoweka bei halisi, vifurushi, masharti na majibu ya maswali yanayoulizwa mara kwa mara, ndivyo AI itakavyoweza kukubaliana na mteja na kutatua tatizo yenyewe badala ya kumpeleka kwa mhudumu.",
      },
      {
        key: "agent_ids",
        label: "Wahudumu anaoweza kuunganisha nao",
        type: "agent_multiselect",
        helpText: "Ukiacha wazi, AI itachagua kutoka kwa wahudumu wote walio hai (Voice / IVR > Agents).",
      },
      {
        key: "default_agent_id",
        label: "Mhudumu wa kawaida (asipoamua AI)",
        type: "agent",
        helpText: "Anayetumika endapo mteja hakusema chochote, au AI ikashindwa kuamua.",
      },
      {
        key: "max_turns",
        label: "Mara ngapi AI ijibu kabla ya kumpa mhudumu",
        type: "number",
        defaultValue: 10,
        helpText:
          "Baada ya idadi hii ya majibu, AI itamuunganisha mteja na mhudumu hata kama mazungumzo hayajaisha. Weka namba kubwa ili AI ipate nafasi ya kuelewa mteja, kukubaliana naye na kutatua tatizo kabla ya kumkabidhi mhudumu.",
      },
      {
        key: "max_length_seconds",
        label: "Muda wa juu wa kusikiliza kwa zamu moja (sekunde)",
        type: "number",
        defaultValue: 8,
        helpText: "Muda mfupi hufanya AI ijibu haraka; muda mrefu humpa mteja nafasi ya kusema sentensi ndefu.",
      },
      {
        key: "silence_timeout_seconds",
        label: "Ukimya wa kumaliza zamu (sekunde)",
        type: "number",
        defaultValue: 4,
        helpText: "Mteja akinyamaza kwa muda huu, AI itaanza kujibu bila kusubiri muda wote hapo juu.",
      },
      { key: "finish_on_key", label: "Kitufe cha hiari cha kumaliza kuzungumza", type: "text", defaultValue: "#", placeholder: "#" },
      voiceField,
    ],
  },
  hangup: {
    type: "hangup",
    label: "Maliza Simu",
    icon: PhoneOff,
    iconClass: "text-red-600",
    description: "Simu inaishia hapa",
    terminal: true,
    outputs: [],
    fields: [],
  },
  set_variable: {
    type: "set_variable",
    label: "Hifadhi Taarifa",
    icon: Variable,
    iconClass: "text-teal-600",
    description: "Weka taarifa utakayoitumia baadaye kwenye simu",
    outputs: singleOutput,
    fields: [
      {
        key: "name",
        label: "Jina la taarifa",
        type: "text",
        required: true,
        helpText: "Jina hili linaweza kutumika ndani ya ujumbe wowote kama {jina_lako}.",
      },
      { key: "value", label: "Thamani", type: "text" },
    ],
  },
  switch: {
    type: "switch",
    label: "Elekeza kwa Chaguo",
    icon: Split,
    iconClass: "text-violet-600",
    description: "Peleka mteja mahali tofauti kulingana na alichochagua",
    dynamicOutputs: true,
    outputs: [{ id: "default", label: "Nyingine", dotClass: "bg-slate-400 border-slate-500", textClass: "text-slate-600" }],
    fields: [
      { key: "variable", label: "Taarifa ya kuangalia", type: "text", required: true, placeholder: "mf. chaguo_kuu" },
      {
        key: "cases",
        label: "Chaguo (tenganisha kwa koma)",
        type: "list",
        helpText: "Kila chaguo linapata njia yake pembeni ya \"Nyingine\"",
      },
    ],
  },
  wait: {
    type: "wait",
    label: "Subiri Kidogo",
    icon: Clock,
    iconClass: "text-slate-600",
    description: "Simama kwa sekunde chache kabla ya kuendelea",
    outputs: singleOutput,
    fields: [{ key: "seconds", label: "Sekunde", type: "number", defaultValue: 1 }],
  },
  speech_input: {
    type: "speech_input",
    label: "Sikiliza Sauti ya Mteja",
    icon: Mic,
    iconClass: "text-rose-600",
    description: "Andika anachosema mteja na kuhifadhi",
    outputs: singleOutput,
    fields: [{ key: "save_as", label: "Hifadhi jibu lake kama", type: "text", required: true }],
  },
  record_message: {
    type: "record_message",
    label: "Pokea Ujumbe wa Mteja",
    icon: Voicemail,
    iconClass: "text-rose-600",
    description: "Mwambie mteja aache ujumbe, kisha rekodi sauti yake",
    terminal: true,
    outputs: [],
    fields: [
      {
        key: "prompt",
        label: "Ujumbe kabla ya mlio",
        type: "textarea",
        required: true,
        placeholder: "Tafadhali acha ujumbe wako baada ya mlio nasi tutawasiliana nawe. Asante.",
        helpText: PLACEHOLDER_HELP,
      },
      { key: "max_length_seconds", label: "Urefu wa juu wa ujumbe (sekunde)", type: "number", defaultValue: 60 },
      { key: "finish_on_key", label: "Kitufe cha kumaliza kurekodi", type: "text", defaultValue: "#", placeholder: "#" },
      voiceField,
    ],
  },
  send_sms: {
    type: "send_sms",
    label: "Tuma SMS",
    icon: MessageSquare,
    iconClass: "text-emerald-600",
    description: "Mtumie mteja ujumbe wa maandishi",
    outputs: singleOutput,
    fields: [
      { key: "to", label: "Kwenda kwa", type: "text", required: true, placeholder: "+255700000000" },
      { key: "message", label: "Ujumbe", type: "textarea", required: true, helpText: PLACEHOLDER_HELP },
      { key: "dry_run", label: "Jaribio tu", type: "checkbox", defaultValue: true, helpText: "Hakuna SMS halisi itakayotumwa ukiacha alama hii" },
    ],
  },
  webhook_notify: {
    type: "webhook_notify",
    label: "Arifa kwa Mfumo Mwingine",
    icon: Bell,
    iconClass: "text-amber-600",
    description: "Peleka taarifa ya tukio kwenye mfumo mwingine",
    outputs: singleOutput,
    fields: [
      { key: "url", label: "Kiungo (URL)", type: "text", required: true },
      { key: "dry_run", label: "Jaribio tu", type: "checkbox", defaultValue: true, helpText: "Hakuna arifa halisi itakayotumwa ukiacha alama hii" },
    ],
  },
};

export const PALETTE_NODE_TYPES: IvrNodeType[] = [
  "ivr_menu",
  "decision",
  "play",
  "call_forward",
  "http_request",
  "ai_prompt",
  "ai_agent",
  "set_variable",
  "switch",
  "wait",
  "speech_input",
  "send_sms",
  "webhook_notify",
  "record_message",
  "hangup",
];

/** Resolves a switch node's outputs given its current `cases` field, so the
 * node component and the inspector agree on what ports exist. */
export function resolveOutputs(type: IvrNodeType, fields: Record<string, unknown>): NodeOutput[] {
  const meta = NODE_META[type];
  if (!meta.dynamicOutputs) return meta.outputs;
  const cases = Array.isArray(fields.cases) ? (fields.cases as string[]) : [];
  const caseOutputs: NodeOutput[] = cases
    .filter((c) => String(c).trim().length > 0)
    .map((c) => ({
      id: `case_${c}`,
      label: String(c),
      dotClass: "bg-blue-500 border-blue-600",
      textClass: "text-blue-600",
    }));
  return [...caseOutputs, ...meta.outputs];
}

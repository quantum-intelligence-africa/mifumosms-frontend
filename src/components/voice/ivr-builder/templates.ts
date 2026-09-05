// Starter flow templates offered when creating a new IVR flow. Each is a
// complete, valid `FlowDefinition` (passes graph_validation.py's rules
// as-is) with hand-placed node positions for a clean initial layout — the
// user edits from there rather than starting from a blank canvas every time.
//
// == How these are written ==
//
// Every prompt is written the way a professional receptionist speaks, in
// natural Tanzanian Swahili, and every one of them opens by naming the
// business. The name is never hard-coded: prompts say `{company_name}`, and
// the backend fills that in from the flow's "Jina la Biashara" (falling back
// to the tenant's own name) when the call is answered — see
// `ivr/prompts.py`. So the same template greets "Karibu SENDA." for SENDA
// and "Karibu Mama Kitchen." for Mama Kitchen, with nothing to edit.
// `{customer_name}`, `{agent_name}` and `{business_hours}` work the same
// way, and a placeholder with no value is dropped cleanly, punctuation and
// all, instead of being read out.
//
// Menus are written as sentences ("Kwa huduma kwa wateja bonyeza 1. Kwa
// mauzo bonyeza 2.") rather than a bare list of "Bonyeza 1. Bonyeza 2.",
// and no caller-facing line ever mentions the machinery behind it. The
// wording of the shared apology/retry lines is kept in step with
// `SYSTEM_PROMPTS` in `ivr/prompts.py`, which is what SENDA says when a flow
// hasn't written a line for the situation itself.
//
// No commas in spoken text — short, comma-free sentences read faster and
// sound less like a machine reading a list.
//
// Africa's Talking's phone system always finishes speaking before it starts
// listening: a <GetDigits> only opens its listening window once its own
// <Say> has finished, so a key pressed while a prompt is still talking is
// never captured — there is no way, on this platform, to have a keypress
// interrupt audio early. Every menu here is therefore kept as short as it
// can be (no "asante kwa kuwasiliana nasi" filler ahead of a menu, no
// restating the instruction the options already carry) so there is as
// little to sit through as possible before the one listening window opens
// — see `voice/providers/africas_talking.py`'s module docstring for the
// full explanation.
//
// == How these are wired ==
//
// Kept deliberately within what FlowExecutionEngine can actually do today:
// an `ivr_menu` node only branches on match/no_match/timeout by itself — it
// does not expose which specific digit was pressed. True multi-way DTMF
// routing ("press 1 for X, 2 for Y, 3 for Z") is composed by setting
// `save_as` on the menu (stores the matched digit into a variable) and
// following its `match` output with a `switch` node keyed on that variable,
// one `case_<digit>` edge per option. Do not chain separate `ivr_menu` nodes
// hoping an unmatched digit "falls through" to the next one — each menu
// always waits for a fresh keypress, so that pattern silently replays the
// wrong prompt instead of routing the caller's original input.
//
// Every menu here also has somewhere kind to go when the caller gets it
// wrong: a wrong key or silence is answered, offered the menu once more, and
// finally handed to voicemail rather than being cut off or left looping.
import type { FlowDefinition, WireEdge, WireNode } from "./types";

const SW_VOICE = "sw-KE-Chirp3-HD-Aoede";

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  definition: FlowDefinition;
}

const blank: FlowTemplate = {
  id: "blank",
  name: "Anza upya",
  description: "Turubai tupu yenye kisanduku cha Mwanzo wa Simu pekee — jenga mwenyewe kuanzia mwanzo.",
  definition: { nodes: [], edges: [] },
};

const connectivityTest: FlowTemplate = {
  id: "connectivity_test",
  name: "Jaribio la Muunganisho",
  description:
    "Salamu fupi na chaguo moja — nzuri kwa kuthibitisha kuwa namba mpya inapokea simu kabla ya kujenga mtiririko halisi.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 160 }, data: {} },
      {
        id: "menu",
        type: "ivr_menu",
        position: { x: 300, y: 160 },
        data: {
          prompt: "Karibu {company_name}. Ili kuthibitisha kuwa umetusikia vizuri bonyeza 1.",
          expected_inputs: ["1"],
          timeout_seconds: 10,
          voice: SW_VOICE,
        },
      },
      {
        id: "confirm",
        type: "play",
        position: { x: 580, y: 60 },
        data: { prompt: "Asante. Simu yako imeungana vizuri kabisa. Kwaheri.", voice: SW_VOICE },
      },
      { id: "confirm_bye", type: "hangup", position: { x: 840, y: 60 }, data: {} },
      {
        id: "retry",
        type: "play",
        position: { x: 580, y: 260 },
        data: {
          prompt: "Samahani hatukupokea chaguo hilo. Kwaheri.",
          voice: SW_VOICE,
        },
      },
      { id: "retry_bye", type: "hangup", position: { x: 840, y: 260 }, data: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "menu" },
      { id: "e2", source: "menu", sourceHandle: "match", target: "confirm" },
      { id: "e3", source: "confirm", target: "confirm_bye" },
      { id: "e4", source: "menu", sourceHandle: "no_match", target: "retry" },
      { id: "e5", source: "menu", sourceHandle: "timeout", target: "retry" },
      { id: "e6", source: "retry", target: "retry_bye" },
    ],
  },
};

const welcomeAndAgent: FlowTemplate = {
  id: "welcome_and_agent",
  name: "Salamu na Mhudumu",
  description:
    "Salamu ya biashara, kisha bonyeza 1 kuunganishwa na mtu halisi. Asiyejibu au aliyekosea anaachiwa nafasi ya kuacha ujumbe.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 200 }, data: {} },
      {
        id: "menu",
        type: "ivr_menu",
        position: { x: 300, y: 200 },
        data: {
          prompt: "Karibu {company_name}. Kama ungependa kuzungumza na mhudumu wetu bonyeza 1.",
          expected_inputs: ["1"],
          timeout_seconds: 8,
          voice: SW_VOICE,
        },
      },
      {
        id: "agent",
        type: "call_forward",
        position: { x: 600, y: 100 },
        data: { destination: "+255700000000", agent_name: "mhudumu wetu", announce_transfer: true },
      },
      {
        id: "sorry",
        type: "play",
        position: { x: 600, y: 300 },
        data: {
          prompt: "Samahani hatukupokea chaguo lako. Tafadhali acha ujumbe wako nasi tutawasiliana nawe.",
          voice: SW_VOICE,
        },
      },
      {
        id: "voicemail",
        type: "record_message",
        position: { x: 880, y: 300 },
        data: {
          prompt: "Tafadhali acha jina lako na ujumbe wako baada ya mlio. Asante kwa kuwasiliana na {company_name}.",
          max_length_seconds: 90,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "menu" },
      { id: "e2", source: "menu", sourceHandle: "match", target: "agent" },
      { id: "e3", source: "menu", sourceHandle: "no_match", target: "sorry" },
      { id: "e4", source: "menu", sourceHandle: "timeout", target: "sorry" },
      { id: "e5", source: "sorry", target: "voicemail" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Menyu Kuu ya Biashara
//
// Built from a data table rather than 30 literal node objects: every
// department is wired the same way, so describing them once and generating
// the graph keeps the prompts (the part a person actually reviews) readable
// and impossible to get out of sync with the wiring.
// ---------------------------------------------------------------------------

interface Department {
  /** Node-id prefix and variable-name stem — internal only, never spoken. */
  key: string;
  /** Digit that reaches this department from the main menu. */
  digit: string;
  menuPrompt: string;
  infoPrompt: string;
  agentName: string;
  agentNumber: string;
  y: number;
}

const DEPARTMENTS: Department[] = [
  {
    key: "cs",
    digit: "1",
    menuPrompt:
      "Karibu {company_name} huduma kwa wateja. Kwa maelezo kuhusu huduma zetu bonyeza 1. Kuzungumza na mhudumu bonyeza 2. Kurudi kwenye menyu kuu bonyeza 0.",
    infoPrompt:
      "Tunatoa huduma mbalimbali zinazokidhi mahitaji ya wateja wetu. Kwa maelezo zaidi tafadhali tembelea tovuti yetu au zungumza na mhudumu wetu. Asante kwa kuwasiliana na {company_name}.",
    agentName: "Huduma kwa Wateja",
    agentNumber: "+255700000010",
    y: 60,
  },
  {
    key: "sales",
    digit: "2",
    menuPrompt:
      "Karibu {company_name} mauzo. Kwa taarifa za bidhaa na bei bonyeza 1. Kuzungumza na mshauri wa mauzo bonyeza 2. Kurudi kwenye menyu kuu bonyeza 0.",
    infoPrompt:
      "Tunauza bidhaa na huduma mbalimbali kwa bei nafuu. Mshauri wetu wa mauzo atafurahi kukueleza zaidi na kukusaidia kuchagua kinachokufaa. Asante kwa kuwasiliana na {company_name}.",
    agentName: "Idara ya Mauzo",
    agentNumber: "+255700000020",
    y: 260,
  },
  {
    key: "pay",
    digit: "3",
    menuPrompt:
      "Karibu {company_name} malipo. Kwa maelezo kuhusu malipo yako bonyeza 1. Kuzungumza na mhudumu bonyeza 2. Kurudi kwenye menyu kuu bonyeza 0.",
    infoPrompt:
      "Tafadhali kuwa na namba yako ya akaunti tayari ili tuweze kukuhudumia haraka. Mhudumu wetu atakusaidia kufuatilia muamala wako. Asante kwa kuwasiliana na {company_name}.",
    agentName: "idara ya malipo",
    agentNumber: "+255700000030",
    y: 460,
  },
];

const DEPT_MENU_X = 940;
const DEPT_ROUTE_X = 1160;
const DEPT_LEAF_X = 1380;
const DEPT_END_X = 1620;

function departmentGraph(dept: Department): { nodes: WireNode[]; edges: WireEdge[] } {
  const { key } = dept;
  const choice = `chaguo_${key}`;

  const nodes: WireNode[] = [
    {
      id: `${key}_menu`,
      type: "ivr_menu",
      position: { x: DEPT_MENU_X, y: dept.y },
      data: {
        prompt: dept.menuPrompt,
        expected_inputs: ["1", "2", "0"],
        save_as: choice,
        timeout_seconds: 8,
        voice: SW_VOICE,
      },
    },
    {
      id: `${key}_route`,
      type: "switch",
      position: { x: DEPT_ROUTE_X, y: dept.y },
      data: { variable: choice, cases: ["1", "2", "0"] },
    },
    {
      id: `${key}_info`,
      type: "play",
      position: { x: DEPT_LEAF_X, y: dept.y - 60 },
      data: { prompt: dept.infoPrompt, voice: SW_VOICE },
    },
    { id: `${key}_bye`, type: "hangup", position: { x: DEPT_END_X, y: dept.y - 60 }, data: {} },
    {
      id: `${key}_agent`,
      type: "call_forward",
      position: { x: DEPT_LEAF_X, y: dept.y + 60 },
      data: {
        destination: dept.agentNumber,
        agent_name: dept.agentName,
        announce_transfer: true,
      },
    },
  ];

  const edges: WireEdge[] = [
    { id: `e_${key}_match`, source: `${key}_menu`, sourceHandle: "match", target: `${key}_route` },
    // A caller who mis-keys inside a department is answered and offered the
    // menu again; one who has gone quiet is offered voicemail. Both land on
    // the shared handling below rather than being hung up on.
    { id: `e_${key}_nomatch`, source: `${key}_menu`, sourceHandle: "no_match", target: "wrong_key" },
    { id: `e_${key}_timeout`, source: `${key}_menu`, sourceHandle: "timeout", target: "no_answer" },
    { id: `e_${key}_1`, source: `${key}_route`, sourceHandle: "case_1", target: `${key}_info` },
    { id: `e_${key}_info_bye`, source: `${key}_info`, target: `${key}_bye` },
    { id: `e_${key}_2`, source: `${key}_route`, sourceHandle: "case_2", target: `${key}_agent` },
    { id: `e_${key}_0`, source: `${key}_route`, sourceHandle: "case_0", target: "main_menu" },
    { id: `e_${key}_default`, source: `${key}_route`, sourceHandle: "default", target: "wrong_key" },
  ];

  return { nodes, edges };
}

const MAIN_MENU_PROMPT =
  "Karibu {company_name}. Kwa huduma kwa wateja bonyeza 1. Kwa mauzo bonyeza 2. " +
  "Kwa masuala ya malipo bonyeza 3. Kama ungependa kuzungumza na mhudumu bonyeza 0.";

const RETRY_MENU_PROMPT =
  "Kwa huduma kwa wateja bonyeza 1. Kwa mauzo bonyeza 2. Kwa masuala ya malipo bonyeza 3. " +
  "Au bonyeza 0 kuzungumza na mhudumu.";

const mainMenu: FlowTemplate = {
  id: "main_menu_sw",
  name: "Menyu Kuu ya Biashara",
  description:
    "Menyu kuu ya idara tatu (Huduma kwa Wateja, Mauzo, Malipo) na njia ya moja kwa moja kwa mhudumu. Salamu hutaja jina la biashara yenyewe, na mteja aliyekosea au asiyejibu hupewa nafasi ya pili kabla ya kuachiwa kuacha ujumbe.",
  definition: (() => {
    const departments = DEPARTMENTS.map(departmentGraph);

    const nodes: WireNode[] = [
      { id: "start", type: "start", position: { x: 40, y: 260 }, data: {} },
      {
        id: "main_menu",
        type: "ivr_menu",
        position: { x: 300, y: 260 },
        data: {
          prompt: MAIN_MENU_PROMPT,
          expected_inputs: ["1", "2", "3", "0"],
          save_as: "chaguo_kuu",
          timeout_seconds: 8,
          voice: SW_VOICE,
        },
      },
      {
        id: "main_route",
        type: "switch",
        position: { x: 620, y: 260 },
        data: { variable: "chaguo_kuu", cases: ["1", "2", "3", "0"] },
      },
      {
        id: "main_agent",
        type: "call_forward",
        position: { x: 940, y: 660 },
        data: { destination: "+255700000000", agent_name: "mhudumu wetu", announce_transfer: true },
      },

      // --- Kutokuelewana: nafasi ya pili, kisha ujumbe wa sauti ---
      {
        id: "wrong_key",
        type: "play",
        position: { x: 300, y: 800 },
        data: { prompt: "Samahani.", voice: SW_VOICE },
      },
      {
        id: "no_answer",
        type: "play",
        position: { x: 300, y: 920 },
        data: { prompt: "Samahani.", voice: SW_VOICE },
      },
      {
        id: "retry_menu",
        type: "ivr_menu",
        position: { x: 620, y: 860 },
        data: {
          prompt: RETRY_MENU_PROMPT,
          expected_inputs: ["1", "2", "3", "0"],
          save_as: "chaguo_kuu",
          timeout_seconds: 10,
          voice: SW_VOICE,
        },
      },
      {
        id: "apology",
        type: "play",
        position: { x: 940, y: 860 },
        data: {
          prompt:
            "Samahani kwa usumbufu. Tafadhali acha ujumbe wako nasi tutawasiliana nawe haraka iwezekanavyo.",
          voice: SW_VOICE,
        },
      },
      {
        id: "voicemail",
        type: "record_message",
        position: { x: 1220, y: 860 },
        data: {
          prompt: "Tafadhali acha jina lako na ujumbe wako baada ya mlio. Asante kwa kuwasiliana na {company_name}.",
          max_length_seconds: 90,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },

      ...departments.flatMap((d) => d.nodes),
    ];

    const edges: WireEdge[] = [
      { id: "e_start", source: "start", target: "main_menu" },
      { id: "e_main_match", source: "main_menu", sourceHandle: "match", target: "main_route" },
      { id: "e_main_nomatch", source: "main_menu", sourceHandle: "no_match", target: "wrong_key" },
      { id: "e_main_timeout", source: "main_menu", sourceHandle: "timeout", target: "no_answer" },
      ...DEPARTMENTS.map((d) => ({
        id: `e_main_${d.digit}`,
        source: "main_route",
        sourceHandle: `case_${d.digit}`,
        target: `${d.key}_menu`,
      })),
      { id: "e_main_0", source: "main_route", sourceHandle: "case_0", target: "main_agent" },
      { id: "e_main_default", source: "main_route", sourceHandle: "default", target: "wrong_key" },

      { id: "e_wrong_retry", source: "wrong_key", target: "retry_menu" },
      { id: "e_noanswer_retry", source: "no_answer", target: "retry_menu" },
      { id: "e_retry_match", source: "retry_menu", sourceHandle: "match", target: "main_route" },
      // Second time round, stop asking and offer a person instead — a caller
      // must never be trapped repeating the same menu forever.
      { id: "e_retry_nomatch", source: "retry_menu", sourceHandle: "no_match", target: "apology" },
      { id: "e_retry_timeout", source: "retry_menu", sourceHandle: "timeout", target: "apology" },
      { id: "e_apology_vm", source: "apology", target: "voicemail" },

      ...departments.flatMap((d) => d.edges),
    ];

    return { nodes, edges };
  })(),
};

const customerService: FlowTemplate = {
  id: "customer_service_sw",
  name: "Huduma kwa Wateja",
  description:
    "Mtiririko mfupi wa msaada: bonyeza 1 kwa msaada, 2 kwa mauzo, au 0 kuzungumza na mhudumu moja kwa moja. Rahisi kuanza nao kama huna idara nyingi.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 300 }, data: {} },
      {
        id: "menu",
        type: "ivr_menu",
        position: { x: 300, y: 300 },
        data: {
          prompt:
            "Karibu {company_name}. Kama unahitaji msaada bonyeza 1. " +
            "Kwa huduma za mauzo bonyeza 2. Au bonyeza 0 kuzungumza na mhudumu.",
          expected_inputs: ["1", "2", "0"],
          save_as: "chaguo",
          timeout_seconds: 8,
          voice: SW_VOICE,
        },
      },
      { id: "route", type: "switch", position: { x: 600, y: 300 }, data: { variable: "chaguo", cases: ["1", "2", "0"] } },
      {
        id: "support",
        type: "call_forward",
        position: { x: 880, y: 120 },
        data: { destination: "+255700000010", agent_name: "timu yetu ya msaada", announce_transfer: true },
      },
      {
        id: "sales",
        type: "call_forward",
        position: { x: 880, y: 300 },
        data: { destination: "+255700000020", agent_name: "Idara ya Mauzo", announce_transfer: true },
      },
      {
        id: "agent",
        type: "call_forward",
        position: { x: 880, y: 480 },
        data: { destination: "+255700000000", agent_name: "mhudumu wetu", announce_transfer: true },
      },
      {
        id: "wrong_key",
        type: "play",
        position: { x: 300, y: 620 },
        data: { prompt: "Samahani.", voice: SW_VOICE },
      },
      {
        id: "no_answer",
        type: "play",
        position: { x: 300, y: 740 },
        data: { prompt: "Samahani.", voice: SW_VOICE },
      },
      {
        id: "retry_menu",
        type: "ivr_menu",
        position: { x: 600, y: 680 },
        data: {
          prompt: "Kwa msaada bonyeza 1. Kwa mauzo bonyeza 2. Au bonyeza 0 kuzungumza na mhudumu.",
          expected_inputs: ["1", "2", "0"],
          save_as: "chaguo",
          timeout_seconds: 10,
          voice: SW_VOICE,
        },
      },
      {
        id: "apology",
        type: "play",
        position: { x: 880, y: 680 },
        data: {
          prompt: "Samahani kwa usumbufu. Tafadhali acha ujumbe wako nasi tutawasiliana nawe.",
          voice: SW_VOICE,
        },
      },
      {
        id: "voicemail",
        type: "record_message",
        position: { x: 1160, y: 680 },
        data: {
          prompt: "Tafadhali acha jina lako na ujumbe wako baada ya mlio. Asante kwa kuwasiliana na {company_name}.",
          max_length_seconds: 90,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "menu" },
      { id: "e2", source: "menu", sourceHandle: "match", target: "route" },
      { id: "e3", source: "menu", sourceHandle: "no_match", target: "wrong_key" },
      { id: "e4", source: "menu", sourceHandle: "timeout", target: "no_answer" },
      { id: "e5", source: "route", sourceHandle: "case_1", target: "support" },
      { id: "e6", source: "route", sourceHandle: "case_2", target: "sales" },
      { id: "e7", source: "route", sourceHandle: "case_0", target: "agent" },
      { id: "e8", source: "route", sourceHandle: "default", target: "wrong_key" },
      { id: "e9", source: "wrong_key", target: "retry_menu" },
      { id: "e10", source: "no_answer", target: "retry_menu" },
      { id: "e11", source: "retry_menu", sourceHandle: "match", target: "route" },
      { id: "e12", source: "retry_menu", sourceHandle: "no_match", target: "apology" },
      { id: "e13", source: "retry_menu", sourceHandle: "timeout", target: "apology" },
      { id: "e14", source: "apology", target: "voicemail" },
    ],
  },
};

const queueToAgent: FlowTemplate = {
  id: "queue_sw",
  name: "Foleni ya Mhudumu",
  description:
    "Hakuna menyu kabisa: mteja anapokelewa, anaambiwa asubiri kidogo, kisha anaunganishwa na mhudumu huku muziki ukiendelea. Nzuri kwa biashara ndogo yenye namba moja ya kupokea simu.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 160 }, data: {} },
      {
        id: "greeting",
        type: "play",
        position: { x: 300, y: 160 },
        data: {
          prompt: "Karibu {company_name}. Tafadhali subiri kidogo tunakuunganisha na mhudumu wetu.",
          voice: SW_VOICE,
        },
      },
      {
        id: "agent",
        type: "call_forward",
        position: { x: 600, y: 160 },
        data: {
          destination: "+255700000000",
          agent_name: "mhudumu wetu",
          // The greeting above already told the caller what is happening —
          // saying it a second time would sound like a machine repeating
          // itself, so the automatic announcement is off here.
          announce_transfer: false,
          ringback_url: "",
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "greeting" },
      { id: "e2", source: "greeting", target: "agent" },
    ],
  },
};

const businessHoursRouter: FlowTemplate = {
  id: "business_hours_router",
  name: "Saa za Kazi",
  description:
    "Hutofautisha simu za ndani ya saa za kazi na za nje yake. Kwa sasa hutumia kisanduku cha \"Hifadhi Taarifa\" kama mfano — baadaye kibadilishe na \"Pata Taarifa Nje\" kinachoangalia saa halisi.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 260 }, data: {} },
      {
        id: "set_open",
        type: "set_variable",
        position: { x: 280, y: 260 },
        data: { name: "tupo_kazini", value: "ndiyo" },
      },
      {
        id: "check",
        type: "decision",
        position: { x: 540, y: 260 },
        data: { variable: "tupo_kazini", operator: "eq", value: "ndiyo" },
      },
      {
        id: "open_msg",
        type: "play",
        position: { x: 820, y: 120 },
        data: {
          prompt: "Karibu {company_name}. Tafadhali subiri kidogo tunakuunganisha na mhudumu wetu.",
          voice: SW_VOICE,
        },
      },
      {
        id: "open_agent",
        type: "call_forward",
        position: { x: 1100, y: 120 },
        data: { destination: "+255700000000", agent_name: "mhudumu wetu", announce_transfer: false },
      },
      {
        id: "closed_msg",
        type: "play",
        position: { x: 820, y: 400 },
        data: {
          prompt:
            "Karibu {company_name}. Kwa sasa ofisi yetu imefungwa. Tunapatikana {business_hours}. " +
            "Tafadhali piga tena wakati wa saa za kazi.",
          voice: SW_VOICE,
        },
      },
      {
        id: "closed_vm",
        type: "record_message",
        position: { x: 1100, y: 400 },
        data: {
          prompt: "Au acha jina lako na ujumbe wako baada ya mlio nasi tutawasiliana nawe. Asante kwa kuwasiliana na {company_name}.",
          max_length_seconds: 90,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "set_open" },
      { id: "e2", source: "set_open", target: "check" },
      { id: "e3", source: "check", sourceHandle: "true", target: "open_msg" },
      { id: "e4", source: "open_msg", target: "open_agent" },
      { id: "e5", source: "check", sourceHandle: "false", target: "closed_msg" },
      { id: "e6", source: "closed_msg", target: "closed_vm" },
    ],
  },
};

const afterHours: FlowTemplate = {
  id: "after_hours_sw",
  name: "Baada ya Saa za Kazi",
  description:
    "Ujumbe wa nje ya saa za kazi unaomalizika kwa mteja kuacha ujumbe wa sauti. Rekodi hupatikana yenyewe kwenye Historia ya Simu mara simu inapoisha.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 160 }, data: {} },
      {
        id: "greet",
        type: "play",
        position: { x: 300, y: 160 },
        data: {
          prompt: "Karibu {company_name}. Kwa sasa ofisi yetu imefungwa. Tunapatikana {business_hours}.",
          voice: SW_VOICE,
        },
      },
      {
        id: "vm",
        type: "record_message",
        position: { x: 600, y: 160 },
        data: {
          prompt:
            "Tafadhali acha jina lako na ujumbe wako baada ya mlio nasi tutawasiliana nawe wakati wa saa za kazi. Asante.",
          max_length_seconds: 90,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "greet" },
      { id: "e2", source: "greet", target: "vm" },
    ],
  },
};

const aiReceptionist: FlowTemplate = {
  id: "ai_receptionist_sw",
  name: "Mpokezi wa AI",
  description:
    "Mteja anazungumza badala ya kubonyeza namba: AI inajitambulisha, inajibu maswali kwa kutumia maelezo ya biashara yako, na inapofika mahali inayohitaji binadamu inamuunganisha na mhudumu sahihi.",
  definition: {
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 200 }, data: {} },
      {
        id: "ai",
        type: "ai_agent",
        position: { x: 300, y: 200 },
        data: {
          prompt: "Karibu {company_name}. Baada ya mlio, niambie unachohitaji.",
          business_description: "",
          agent_ids: [],
          default_agent_id: "",
          max_turns: 10,
          max_length_seconds: 8,
          silence_timeout_seconds: 4,
          finish_on_key: "#",
          voice: SW_VOICE,
        },
      },
      {
        id: "forward",
        type: "call_forward",
        position: { x: 640, y: 200 },
        data: {
          // Filled in per call by the AI Agent node above — see its own
          // module docs (voice/providers/africas_talking.py) for how these
          // three placeholders get resolved.
          destination: "{ai_destination}",
          agent_name: "{ai_agent_name}",
          announcement: "{ai_reply}",
          announce_transfer: true,
          voicemail_if_unanswered: true,
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "ai" },
      { id: "e2", source: "ai", target: "forward" },
    ],
  },
};

export const FLOW_TEMPLATES: FlowTemplate[] = [
  blank,
  welcomeAndAgent,
  customerService,
  mainMenu,
  aiReceptionist,
  queueToAgent,
  businessHoursRouter,
  afterHours,
  connectivityTest,
];

import {
  Inbox,
  Phone,
  Headphones,
  Bot,
  BarChart3,
  Code2,
} from "lucide-react";

export interface PlatformLink {
  id: string;
  anchor: string;
  label: string;
  labelSw: string;
  blurb: string;
  blurbSw: string;
  Icon: typeof Inbox;
}

export const PLATFORM_LINKS: PlatformLink[] = [
  {
    id: "inbox",
    anchor: "inbox",
    label: "Omnichannel Inbox",
    labelSw: "Sanduku Pamoja",
    blurb: "WhatsApp, SMS & Voice in one shared queue",
    blurbSw: "WhatsApp, SMS na Voice katika sanduku moja",
    Icon: Inbox,
  },
  {
    id: "voice",
    anchor: "voice",
    label: "Voice & IVR",
    labelSw: "Sauti & IVR",
    blurb: "Smart routing, telephony, voice surveys",
    blurbSw: "Mwelekeo wa simu, IVR, na uchunguzi wa sauti",
    Icon: Phone,
  },
  {
    id: "agents",
    anchor: "agents",
    label: "Agent Workspace",
    labelSw: "Eneo la Wakala",
    blurb: "Live queues, drag-drop transfer, coaching",
    blurbSw: "Foleni za moja kwa moja na mafunzo",
    Icon: Headphones,
  },
  {
    id: "ai",
    anchor: "ai",
    label: "AI Copilots",
    labelSw: "AI Copilot",
    blurb: "GenAI agents trained on your knowledge base",
    blurbSw: "Wakala wa AI waliofunzwa kwenye maarifa yako",
    Icon: Bot,
  },
  {
    id: "analytics",
    anchor: "analytics",
    label: "Real-time Analytics",
    labelSw: "Takwimu za Wakati Halisi",
    blurb: "Live wallboards for chat and voice",
    blurbSw: "Ubao wa moja kwa moja kwa chat na sauti",
    Icon: BarChart3,
  },
  {
    id: "integrations",
    anchor: "integrations",
    label: "Integrations & API",
    labelSw: "Muunganisho & API",
    blurb: "REST API, webhooks, SDKs, CRM connectors",
    blurbSw: "REST API, webhooks, SDK, na CRM",
    Icon: Code2,
  },
];

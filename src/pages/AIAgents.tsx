import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  ArrowRight,
  BarChart2,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Code,
  Database,
  GitBranch,
  Globe,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_CONFIG, buildApiUrl } from "@/config/api";

type AgentSetup = {
  name: string;
  business: string;
  industry: string;
  language: string;
  tone: string;
  channel: string;
  intent: string;
};

type FlowOption = {
  id: string;
  label: string;
  nextStateId: string;
};

type FlowStep = {
  id: string;
  name: string;
  message: string;
  options: FlowOption[];
  listHeader?: string;
  listBody?: string;
  listButton?: string;
  urlLabel?: string;
  url?: string;
  apiEndpoint?: string;
};

type BuilderTemplate = {
  key: string;
  label: string;
  summary: string;
  setup: AgentSetup;
  flow: FlowStep[];
};

const defaultFeatures = [
  {
    icon: Bot,
    title: "Agent Dashboard",
    desc: "Monitor all agents, conversation volume, and performance metrics in real time.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-500",
  },
  {
    icon: Plus,
    title: "Create Agent",
    desc: "Launch a rapid AI agent builder with onboarding, flow design, JSON output, and SMS-ready endpoints.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderAccent: "border-t-emerald-500",
  },
  {
    icon: MessageCircle,
    title: "Conversations",
    desc: "Full message history and sentiment analysis for every agent-handled conversation.",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    borderAccent: "border-t-violet-500",
  },
  {
    icon: Database,
    title: "Knowledge Base",
    desc: "Upload docs, FAQs, and product data to ground your agents in your business.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    borderAccent: "border-t-amber-500",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Track containment rate, resolution time, and satisfaction scores over time.",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    borderAccent: "border-t-rose-500",
  },
  {
    icon: Zap,
    title: "Automation Triggers",
    desc: "Connect agents to SMS campaigns, contact events, and external webhooks.",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    borderAccent: "border-t-orange-500",
  },
];

const defaultPerks = [
  "Free access during private beta",
  "Direct line to the product team",
  "Shape the feature before launch",
];

const industries = ["Retail", "Education", "Healthcare", "Finance", "Hospitality", "Logistics", "Technology"];
const languages = [
  { value: "sw", label: "Swahili" },
  { value: "en", label: "English" },
  { value: "mixed", label: "Mixed" },
];
const tones = ["Friendly", "Formal", "Sales", "Support"];
const channels = ["SMS", "WhatsApp", "Web", "Voice"];

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/chatbots",
    description: "Create the AI agent profile from onboarding details.",
  },
  {
    method: "POST",
    path: "/api/chatbots/{chatbot_id}/flow",
    description: "Save the structured flow contract for the runtime engine.",
  },
  {
    method: "POST",
    path: "/api/chatbots/{chatbot_id}/channels/sms",
    description: "Connect inbound and outbound SMS delivery settings.",
  },
  {
    method: "POST",
    path: "/api/chatbots/{chatbot_id}/simulate",
    description: "Run fast test sessions against the START step.",
  },
  {
    method: "POST",
    path: "/api/chatbots/{chatbot_id}/deploy",
    description: "Publish the agent to production after validation passes.",
  },
  {
    method: "POST",
    path: "/api/chatbots/{chatbot_id}/webhooks",
    description: "Attach external business logic, CRMs, or automation actions.",
  },
];

const builderTemplates: BuilderTemplate[] = [
  {
    key: "sms-sales",
    label: "SMS Sales Agent",
    summary: "Qualify leads, guide users, and push the next buying action quickly.",
    setup: {
      name: "Kuza Sales Agent",
      business: "Mifumo Labs",
      industry: "Retail",
      language: "mixed",
      tone: "Sales",
      channel: "SMS",
      intent: "Help customers buy faster, check pricing, and request a human sales follow-up.",
    },
    flow: [
      {
        id: "step-start",
        name: "START",
        message: "Karibu Mifumo Labs. I can help with pricing, SMS packages, or connect you to sales. Choose one option below.",
        options: [
          { id: "option-start-1", label: "View packages", nextStateId: "step-packages" },
          { id: "option-start-2", label: "Talk to sales", nextStateId: "step-sales" },
          { id: "option-start-3", label: "Setup help", nextStateId: "step-setup" },
        ],
      },
      {
        id: "step-packages",
        name: "SMS_PACKAGES",
        message: "We have Starter, Growth, and Scale packages. Which package would you like details about?",
        options: [
          { id: "option-packages-1", label: "Starter", nextStateId: "step-sales" },
          { id: "option-packages-2", label: "Growth", nextStateId: "step-sales" },
          { id: "option-packages-3", label: "Back to menu", nextStateId: "step-start" },
        ],
        urlLabel: "Open pricing",
        url: "https://sms.mifumolabs.com/pricing",
      },
      {
        id: "step-sales",
        name: "SALES_HANDOFF",
        message: "Perfect. Share your business name and our sales team will respond fast with the best plan for your volume.",
        options: [
          { id: "option-sales-1", label: "Back to menu", nextStateId: "step-start" },
        ],
        apiEndpoint: "/api/chatbots/{chatbot_id}/webhooks/sales-lead",
      },
      {
        id: "step-setup",
        name: "SMS_SETUP",
        message: "I can guide sender name setup, API keys, and campaign launch steps. What do you want first?",
        options: [
          { id: "option-setup-1", label: "Sender name", nextStateId: "step-sales" },
          { id: "option-setup-2", label: "API access", nextStateId: "step-sales" },
          { id: "option-setup-3", label: "Back to menu", nextStateId: "step-start" },
        ],
      },
    ],
  },
  {
    key: "support",
    label: "Support Agent",
    summary: "Resolve common issues first, then escalate with structured context.",
    setup: {
      name: "Kuza Support Agent",
      business: "Mifumo Labs",
      industry: "Technology",
      language: "en",
      tone: "Support",
      channel: "SMS",
      intent: "Answer support questions, route urgent issues, and reduce manual response time.",
    },
    flow: [
      {
        id: "support-start",
        name: "START",
        message: "Hi, I can help with delivery issues, credits, or technical setup. Pick what you need.",
        options: [
          { id: "support-option-1", label: "Delivery issue", nextStateId: "support-delivery" },
          { id: "support-option-2", label: "Billing", nextStateId: "support-billing" },
          { id: "support-option-3", label: "Technical help", nextStateId: "support-tech" },
        ],
      },
      {
        id: "support-delivery",
        name: "DELIVERY_HELP",
        message: "Please share the sender name and time sent so I can prepare the case for our support team.",
        options: [{ id: "support-delivery-back", label: "Back to menu", nextStateId: "support-start" }],
        apiEndpoint: "/api/chatbots/{chatbot_id}/webhooks/support-ticket",
      },
      {
        id: "support-billing",
        name: "BILLING_HELP",
        message: "I can help with invoice checks, package top-up questions, and payment follow-up.",
        options: [{ id: "support-billing-back", label: "Back to menu", nextStateId: "support-start" }],
      },
      {
        id: "support-tech",
        name: "TECH_HELP",
        message: "Choose API setup, sender name approval, or campaign troubleshooting.",
        options: [{ id: "support-tech-back", label: "Back to menu", nextStateId: "support-start" }],
        urlLabel: "Open developer docs",
        url: "https://sms.mifumolabs.com/developer",
      },
    ],
  },
  {
    key: "booking",
    label: "Booking Agent",
    summary: "Handle scheduling, confirmations, reminders, and follow-up links.",
    setup: {
      name: "Kuza Booking Agent",
      business: "Mifumo Labs",
      industry: "Hospitality",
      language: "sw",
      tone: "Friendly",
      channel: "WhatsApp",
      intent: "Guide bookings, share availability, and collect booking requests without manual chat support.",
    },
    flow: [
      {
        id: "booking-start",
        name: "START",
        message: "Karibu. Tunaweza kusaidia booking mpya, kuangalia availability, au kubadilisha reservation yako.",
        options: [
          { id: "booking-option-1", label: "New booking", nextStateId: "booking-new" },
          { id: "booking-option-2", label: "Check availability", nextStateId: "booking-availability" },
          { id: "booking-option-3", label: "Existing reservation", nextStateId: "booking-manage" },
        ],
      },
      {
        id: "booking-new",
        name: "NEW_BOOKING",
        message: "Tuma tarehe, idadi ya watu, na huduma unayotaka. Nitakuandalia hatua inayofuata.",
        options: [{ id: "booking-new-back", label: "Back to menu", nextStateId: "booking-start" }],
        apiEndpoint: "/api/chatbots/{chatbot_id}/webhooks/booking-request",
      },
      {
        id: "booking-availability",
        name: "CHECK_AVAILABILITY",
        message: "Ninaweza kuonyesha slots zilizopo na kukupeleka kwenye page ya booking.",
        options: [{ id: "booking-availability-back", label: "Back to menu", nextStateId: "booking-start" }],
        urlLabel: "Open booking page",
        url: "https://sms.mifumolabs.com",
      },
      {
        id: "booking-manage",
        name: "MANAGE_BOOKING",
        message: "Tuma namba ya reservation ili nikusaidie kubadilisha au kuthibitisha booking yako.",
        options: [{ id: "booking-manage-back", label: "Back to menu", nextStateId: "booking-start" }],
      },
    ],
  },
];

const createTemplateCopy = (template: BuilderTemplate) => ({
  setup: { ...template.setup },
  flow: template.flow.map((step) => ({
    ...step,
    options: step.options.map((option) => ({ ...option })),
  })),
});

const toStateKey = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "UNTITLED_STATE";

const buildFlowJson = (flow: FlowStep[]) => {
  const stateKeyById = new Map(flow.map((step) => [step.id, toStateKey(step.name)]));

  return flow.reduce<Record<string, Record<string, unknown>>>((acc, step) => {
    const options = step.options.reduce<Record<string, string>>((optionMap, option, index) => {
      const key = option.label.trim() || `option_${index + 1}`;
      const nextStateKey = stateKeyById.get(option.nextStateId);
      if (nextStateKey) optionMap[key] = nextStateKey;
      return optionMap;
    }, {});

    acc[toStateKey(step.name)] = {
      message: step.message,
      options,
      ...(step.listHeader?.trim() ? { list_header: step.listHeader.trim() } : {}),
      ...(step.listBody?.trim() ? { list_body: step.listBody.trim() } : {}),
      ...(step.listButton?.trim() ? { list_button: step.listButton.trim() } : {}),
      ...(step.urlLabel?.trim() ? { url_button_label: step.urlLabel.trim() } : {}),
      ...(step.url?.trim() ? { url: step.url.trim() } : {}),
      ...(step.apiEndpoint?.trim() ? { api_endpoint: step.apiEndpoint.trim() } : {}),
    };

    return acc;
  }, {});
};

const validateFlow = (flow: FlowStep[]) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stateKeys = flow.map((step) => toStateKey(step.name));
  const uniqueStateKeys = new Set(stateKeys);
  const stateIds = new Set(flow.map((step) => step.id));

  if (!stateKeys.includes("START")) errors.push("A START step is required before deploy.");
  if (uniqueStateKeys.size !== stateKeys.length) errors.push("Each step needs a unique state name.");

  flow.forEach((step) => {
    if (!step.message.trim()) warnings.push(`${toStateKey(step.name)} does not have a message yet.`);
    step.options.forEach((option) => {
      if (!option.label.trim()) warnings.push(`${toStateKey(step.name)} has an option without a label.`);
      if (!stateIds.has(option.nextStateId)) errors.push(`${toStateKey(step.name)} links to a missing next step.`);
    });
  });

  return { errors, warnings, isValid: errors.length === 0 };
};

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

export default function AIAgents() {
  const initialTemplate = builderTemplates[0];
  const initialBuilder = createTemplateCopy(initialTemplate);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [features, setFeatures] = useState(defaultFeatures);
  const [perks, setPerks] = useState(defaultPerks);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(initialTemplate.key);
  const [agentSetup, setAgentSetup] = useState<AgentSetup>(initialBuilder.setup);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>(initialBuilder.flow);
  const [selectedStepId, setSelectedStepId] = useState(initialBuilder.flow[0]?.id ?? "");
  const [previewStepId, setPreviewStepId] = useState(initialBuilder.flow[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState("setup");
  const selectedStep = flowSteps.find((step) => step.id === selectedStepId) ?? flowSteps[0];
  const previewStep = flowSteps.find((step) => step.id === previewStepId) ?? flowSteps[0];
  const validation = validateFlow(flowSteps);
  const flowJson = buildFlowJson(flowSteps);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [backendBusy, setBackendBusy] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendResult, setBackendResult] = useState<unknown>(null);

  const createPayload = {
    name: agentSetup.name,
    business: agentSetup.business,
    industry: agentSetup.industry,
    language: agentSetup.language,
    tone: agentSetup.tone.toLowerCase(),
    channel: agentSetup.channel.toLowerCase(),
    intent: agentSetup.intent,
  };

  const deployPayload = {
    chatbot_id: chatbotId ?? "uuid-from-backend",
    flow: flowJson,
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EARLY_ACCESS.AI_AGENTS.STATUS), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;

        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || cancelled) return;

        if (Array.isArray(data.perks) && data.perks.every((x: unknown) => typeof x === "string")) {
          setPerks(data.perks);
        }

        // Backend can optionally return features as [{ title, desc }]
        if (Array.isArray(data.features)) {
          const incoming = data.features as Array<{ title?: string; desc?: string }>;
          const next = defaultFeatures.map((f) => {
            const match = incoming.find((i) => i?.title === f.title);
            return match?.desc ? { ...f, desc: match.desc } : f;
          });
          setFeatures(next);
        }
      } catch {
        // Keep defaults if backend is unavailable
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const postJson = async (endpoint: string, payload: unknown) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Request failed (HTTP ${res.status})`;
      throw new Error(message);
    }
    return data;
  };

  const createChatbotInBackend = async () => {
    setBackendError(null);
    setBackendResult(null);
    try {
      setBackendBusy(true);
      const data = await postJson("/api/chatbots", createPayload);
      const id = data?.data?.chatbot_id || data?.chatbot_id;
      if (typeof id === "string" && id.trim()) setChatbotId(id);
      setBackendResult(data);
      setActiveTab("flow");
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setBackendBusy(false);
    }
  };

  const saveFlowToBackend = async () => {
    setBackendError(null);
    setBackendResult(null);
    if (!chatbotId) {
      setBackendError("Create the agent first to get a chatbot_id.");
      return;
    }
    try {
      setBackendBusy(true);
      const data = await postJson(`/api/chatbots/${chatbotId}/flow`, { flow: flowJson });
      setBackendResult(data);
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to save flow");
    } finally {
      setBackendBusy(false);
    }
  };

  const simulateOnBackend = async () => {
    setBackendError(null);
    setBackendResult(null);
    if (!chatbotId) {
      setBackendError("Create the agent first to get a chatbot_id.");
      return;
    }
    try {
      setBackendBusy(true);
      const data = await postJson(`/api/chatbots/${chatbotId}/simulate`, {
        flow: flowJson,
        start_state: "START",
      });
      setBackendResult(data);
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to simulate");
    } finally {
      setBackendBusy(false);
    }
  };

  const deployToBackend = async () => {
    setBackendError(null);
    setBackendResult(null);
    if (!chatbotId) {
      setBackendError("Create the agent first to get a chatbot_id.");
      return;
    }
    if (!validation.isValid) {
      setBackendError("Fix flow validation errors before deploy.");
      return;
    }
    try {
      setBackendBusy(true);
      const data = await postJson(`/api/chatbots/${chatbotId}/deploy`, { flow: flowJson });
      setBackendResult(data);
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Failed to deploy");
    } finally {
      setBackendBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!name.trim() || !email.trim() || !kycFile) return;

    const formData = new FormData();
    formData.append("product", "ai_agents");
    formData.append("full_name", name.trim());
    formData.append("email", email.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    formData.append("kyc_file", kycFile);

    const token = localStorage.getItem("access_token");

    try {
      setIsSubmitting(true);
      const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EARLY_ACCESS.AI_AGENTS.WAITLIST), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          `Failed to submit (HTTP ${res.status})`;
        throw new Error(message);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTemplate = (templateKey: string) => {
    const template = builderTemplates.find((item) => item.key === templateKey);
    if (!template) return;

    const templateCopy = createTemplateCopy(template);
    setSelectedTemplateKey(template.key);
    setAgentSetup(templateCopy.setup);
    setFlowSteps(templateCopy.flow);
    setSelectedStepId(templateCopy.flow[0]?.id ?? "");
    setPreviewStepId(templateCopy.flow[0]?.id ?? "");
    setBuilderOpen(true);
    setActiveTab("setup");
  };

  const updateSetup = (field: keyof AgentSetup, value: string) => {
    setAgentSetup((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateSelectedStep = (field: keyof Omit<FlowStep, "id" | "options">, value: string) => {
    if (!selectedStep) return;

    setFlowSteps((current) =>
      current.map((step) =>
        step.id === selectedStep.id
          ? {
              ...step,
              [field]: value,
            }
          : step,
      ),
    );
  };

  const updateOption = (optionId: string, field: keyof FlowOption, value: string) => {
    if (!selectedStep) return;

    setFlowSteps((current) =>
      current.map((step) =>
        step.id === selectedStep.id
          ? {
              ...step,
              options: step.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      [field]: value,
                    }
                  : option,
              ),
            }
          : step,
      ),
    );
  };

  const addStep = () => {
    const nextIndex = flowSteps.length + 1;
    const newStep: FlowStep = {
      id: `custom-step-${Date.now()}`,
      name: `STEP_${nextIndex}`,
      message: "Write the next response for this AI agent step.",
      options: [],
    };

    setFlowSteps((current) => [...current, newStep]);
    setSelectedStepId(newStep.id);
    setActiveTab("flow");
  };

  const addOption = () => {
    if (!selectedStep) return;

    const defaultNextState = flowSteps.find((step) => step.id !== selectedStep.id)?.id ?? selectedStep.id;
    const nextIndex = selectedStep.options.length + 1;

    setFlowSteps((current) =>
      current.map((step) =>
        step.id === selectedStep.id
          ? {
              ...step,
              options: [
                ...step.options,
                {
                  id: `option-${Date.now()}-${nextIndex}`,
                  label: `Option ${nextIndex}`,
                  nextStateId: defaultNextState,
                },
              ],
            }
          : step,
      ),
    );
  };

  const resetPreview = () => {
    const startStep = flowSteps.find((step) => toStateKey(step.name) === "START") ?? flowSteps[0];
    if (startStep) setPreviewStepId(startStep.id);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="mb-5 sm:mb-6 md:mb-8">
              <h1 className="text-lg sm:text-[22px] md:text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                AI Agents
              </h1>
              <p className="mt-1 text-xs sm:text-[13px] md:text-[14px] text-slate-500">
                Build and deploy intelligent agents for automated customer engagement
              </p>
            </div>

            <div className="relative bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mb-5 sm:mb-6 md:mb-8">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500" />

              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 px-3.5 sm:px-6 pt-4 sm:pt-8 pb-4 sm:pb-6 lg:py-8 lg:pr-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 flex items-center justify-center">
                      <Bot className="w-[18px] h-[18px] text-blue-600" strokeWidth={1.8} />
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Early Access
                    </Badge>
                  </div>

                  <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight mb-2">
                    AI Agents - in private beta
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-6 max-w-[380px]">
                    Intelligent agents that handle conversations, qualify leads, and trigger
                    SMS workflows - powered by LLMs and built into your existing contacts.
                  </p>

                  <ul className="space-y-2.5">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" strokeWidth={2} />
                        <span className="text-[13px] text-slate-600">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="hidden lg:block w-px bg-slate-100 my-6" />

                <div className="lg:w-[340px] px-3.5 sm:px-6 py-4 sm:py-6 lg:py-8">
                  {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                      <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                      </div>
                      <p className="text-[15px] font-semibold text-slate-900 mb-1">You're on the list</p>
                      <p className="text-[13px] text-slate-500">
                        We'll reach out as soon as early access opens.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] font-semibold text-slate-800 mb-0.5">
                        Join the waitlist
                      </p>
                      <p className="text-[12px] text-slate-400 mb-1">
                        Be among the first to test AI Agents on Mifumo.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-2.5">
                        <Input
                          placeholder="Full name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="email"
                          required
                          placeholder="Work email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="tel"
                          placeholder="Phone number (e.g. +255 689 726 060)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="file"
                          required
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-slate-700"
                        />
                        {submitError ? (
                          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                            {submitError}
                          </div>
                        ) : null}
                        <Button type="submit" disabled={isSubmitting} className="w-full h-9 text-[13px] font-medium gap-2">
                          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                          {isSubmitting ? "Submitting..." : "Request Early Access"}
                          <ArrowRight className="w-3.5 h-3.5 ml-auto" strokeWidth={2} />
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Feature Preview
              </p>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isCreateAgent = feature.title === "Create Agent";

                if (isCreateAgent) {
                  return (
                    <button
                      key={feature.title}
                      type="button"
                      onClick={() => setBuilderOpen((current) => !current)}
                      className={`bg-white rounded-lg sm:rounded-xl border border-slate-200 border-t-[3px] ${feature.borderAccent} shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-all duration-200 p-3 sm:p-4 text-left cursor-pointer ${
                        builderOpen ? "ring-2 ring-emerald-100 border-emerald-200" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${feature.iconBg}`}>
                          <Icon className={`w-4 h-4 ${feature.iconColor}`} strokeWidth={1.8} />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Rapid Builder
                        </Badge>
                      </div>
                      <h3 className="text-[13px] font-semibold text-slate-800 mb-1.5 tracking-[-0.01em]">
                        {feature.title}
                      </h3>
                      <p className="text-[12px] text-slate-500 leading-[1.6]">{feature.desc}</p>
                      <div className="mt-4 flex items-center justify-between text-[12px] font-medium text-emerald-700">
                        <span>{builderOpen ? "Hide builder" : "Open builder"}</span>
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${builderOpen ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                  );
                }

                return (
                  <div
                    key={feature.title}
                    className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${feature.borderAccent} shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-all duration-200 p-4`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${feature.iconBg}`}>
                      <Icon className={`w-4 h-4 ${feature.iconColor}`} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1.5 tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-[12px] text-slate-500 leading-[1.6]">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {builderOpen ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)] overflow-hidden">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_40%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.8} />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                          Rapid AI Builder
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                          SMS-ready
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
                        Create a fast, structured AI agent
                      </h3>
                      <p className="mt-0.5 text-[9px] sm:text-[10px] leading-relaxed text-slate-500 max-w-xl">
                        Every screen maps to a backend-ready flow state. Save, validate, simulate, deploy.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 lg:w-[260px] flex-shrink-0">
                      <div className="rounded-lg border border-slate-200 bg-white/90 px-1.5 py-1.5 text-center">
                        <p className="text-[7px] uppercase tracking-wider text-slate-400 leading-none">Speed</p>
                        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">&lt;5m</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/90 px-1.5 py-1.5 text-center">
                        <p className="text-[7px] uppercase tracking-wider text-slate-400 leading-none">Start</p>
                        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">Auto</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/90 px-1.5 py-1.5 text-center">
                        <p className="text-[7px] uppercase tracking-wider text-slate-400 leading-none">Output</p>
                        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">JSON</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/90 px-1.5 py-1.5 text-center">
                        <p className="text-[7px] uppercase tracking-wider text-slate-400 leading-none">Deploy</p>
                        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">API</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-3 sm:px-4 py-3">
                  <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quick Templates</p>
                      <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Start from a proven use case, then fine-tune.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {builderTemplates.map((template) => (
                        <button
                          key={template.key}
                          type="button"
                          onClick={() => loadTemplate(template.key)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                            selectedTemplateKey === template.key
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          }`}
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-lg sm:rounded-xl bg-slate-100 p-0.5 sm:p-1 h-auto gap-0.5">
                      <TabsTrigger value="setup" className="rounded-lg py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-[12px] font-medium">
                        Setup
                      </TabsTrigger>
                      <TabsTrigger value="flow" className="rounded-lg py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-[12px] font-medium">
                        Flow Build
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="rounded-lg py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-[12px] font-medium">
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="api" className="rounded-lg py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-[12px] font-medium">
                        API
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="setup" className="mt-3">
                      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[1.3fr_0.9fr]">
                        {/* Left: config form */}
                        <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Agent Configuration</h4>
                              <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                                Define context, intent, and the core job your AI agent handles.
                              </p>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[9px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                              Step 1 of 4
                            </Badge>
                          </div>

                          <div className="mb-3 pb-3 border-b border-slate-100">
                            <h5 className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Essential Information</h5>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Agent Name</label>
                                <Input
                                  value={agentSetup.name}
                                  onChange={(e) => updateSetup("name", e.target.value)}
                                  placeholder="e.g., Kuza Sales Agent"
                                  className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50 focus:bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Business Name</label>
                                <Input
                                  value={agentSetup.business}
                                  onChange={(e) => updateSetup("business", e.target.value)}
                                  placeholder="e.g., Mifumo Labs"
                                  className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50 focus:bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Industry</label>
                                <Select value={agentSetup.industry} onValueChange={(value) => updateSetup("industry", value)}>
                                  <SelectTrigger className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50">
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {industries.map((industry) => (
                                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Language</label>
                                <Select value={agentSetup.language} onValueChange={(value) => updateSetup("language", value)}>
                                  <SelectTrigger className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50">
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {languages.map((language) => (
                                      <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Tone</label>
                                <Select value={agentSetup.tone} onValueChange={(value) => updateSetup("tone", value)}>
                                  <SelectTrigger className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50">
                                    <SelectValue placeholder="Select tone" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tones.map((tone) => (
                                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Channel</label>
                                <Select value={agentSetup.channel} onValueChange={(value) => updateSetup("channel", value)}>
                                  <SelectTrigger className="h-8 text-[11px] sm:text-xs border-slate-200 bg-slate-50">
                                    <SelectValue placeholder="Select channel" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {channels.map((channel) => (
                                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Agent Intent & Purpose</label>
                            <Textarea
                              value={agentSetup.intent}
                              onChange={(e) => updateSetup("intent", e.target.value)}
                              placeholder="e.g., Qualify leads, guide users through purchasing, collect contact information..."
                              className="min-h-[80px] sm:min-h-[100px] text-[11px] sm:text-xs border-slate-200 bg-slate-50 focus-visible:bg-white resize-none"
                            />
                          </div>
                        </div>

                        {/* Right: sidebar cards */}
                        <div className="space-y-2">
                          {/* Design Principles */}
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <Wand2 className="w-3.5 h-3.5 text-emerald-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Design Principles</p>
                                <p className="text-[8px] sm:text-[9px] text-emerald-700">Guide every decision</p>
                              </div>
                            </div>
                            <ul className="space-y-1.5 text-[9px] sm:text-[10px] leading-relaxed text-emerald-900/90">
                              <li className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold flex-shrink-0">•</span>Simple, conversational language for non-technical users.</li>
                              <li className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold flex-shrink-0">•</span>Maps every screen to backend-ready flow states.</li>
                              <li className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold flex-shrink-0">•</span>SMS deployment in mind from step one.</li>
                            </ul>
                          </div>

                          {/* Agent Creation */}
                          <div className="rounded-2xl border border-slate-200 p-3 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-blue-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 uppercase tracking-widest">Agent Creation</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-500">Ready to deploy</p>
                              </div>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-2 mb-2 border border-slate-800">
                              <pre className="text-[7px] sm:text-[8px] leading-4 text-slate-100 overflow-x-auto max-h-[140px]">
                                {formatJson(createPayload)}
                              </pre>
                            </div>
                            <Button
                              className="w-full gap-2 h-8 text-[10px] sm:text-xs font-semibold bg-blue-600 hover:bg-blue-700"
                              onClick={createChatbotInBackend}
                              disabled={backendBusy}
                            >
                              <Sparkles className="w-3 h-3" />
                              {backendBusy ? "Creating..." : "Create Agent Now"}
                              <ArrowRight className="w-3 h-3 ml-auto" />
                            </Button>
                            <div className="mt-2 space-y-1.5">
                              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Chatbot ID</p>
                                <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold text-slate-900 break-all">{chatbotId ?? "Pending creation"}</p>
                              </div>
                              {backendError ? (
                                <div className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-2">
                                  <p className="text-[8px] font-semibold text-rose-700 uppercase tracking-widest">Error</p>
                                  <p className="mt-0.5 text-[9px] text-rose-600">{backendError}</p>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Template Overview */}
                          <div className="rounded-2xl border border-slate-200 p-3 bg-gradient-to-br from-indigo-50/50 to-white">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-700" strokeWidth={2} />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 uppercase tracking-widest">Template Overview</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-500">Ready to build your flow</p>
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5 mb-2">
                              <p className="text-[9px] sm:text-[10px] text-slate-700 leading-relaxed">
                                {builderTemplates.find((template) => template.key === selectedTemplateKey)?.summary}
                              </p>
                            </div>
                            <Button className="w-full gap-2 h-8 text-[10px] sm:text-xs font-semibold bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab("flow")}>
                              Proceed to Flow Builder
                              <ChevronRight className="w-3 h-3 ml-auto" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="flow" className="mt-3">
                      <div className="space-y-2.5">
                        <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-white">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-3.5 h-3.5 text-blue-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase tracking-widest">Flow Management</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-500">Design each step of your agent's conversation</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button variant="outline" onClick={addStep} className="h-7 text-[9px] sm:text-[10px] px-2 gap-1">
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                              <Button
                                variant="outline"
                                onClick={saveFlowToBackend}
                                disabled={backendBusy || !chatbotId}
                                className="h-7 text-[9px] sm:text-[10px] px-2 gap-1"
                              >
                                <Database className="w-3 h-3" />
                                {backendBusy ? "Saving…" : "Save"}
                              </Button>
                              <Button onClick={() => setActiveTab("preview")} className="h-7 text-[9px] sm:text-[10px] px-2 gap-1">
                                Preview
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 sm:mt-5 md:mt-6 flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
                            {flowSteps.map((step, index) => (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => setSelectedStepId(step.id)}
                                className={`min-w-[160px] sm:min-w-[200px] md:min-w-[250px] lg:min-w-[280px] max-w-[160px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[280px] rounded-xl border p-3 sm:p-4 text-left transition-colors shrink-0 snap-start flex flex-col ${
                                  selectedStep?.id === step.id
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-slate-200 bg-slate-50 hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 flex-shrink-0">
                                  <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <Badge className="bg-white text-slate-500 border border-slate-200 hover:bg-white text-[8px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-sm flex-shrink-0">
                                    {toStateKey(step.name)}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-slate-900 break-words word-break">{step.name}</p>
                                <p className="mt-1.5 text-[9px] sm:text-[10px] md:text-[11px] leading-4 text-slate-600 break-words word-break flex-grow">
                                  {step.message}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-slate-500 flex-shrink-0">
                                  <GitBranch className="w-3 h-3 flex-shrink-0" />
                                  <span>{step.options.length} path{step.options.length === 1 ? "" : "s"}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[1.2fr_0.9fr]">
                          <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 bg-white">
                            {selectedStep ? (
                              <>
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] sm:text-[10px] font-medium text-slate-600">Step name</label>
                                    <Input
                                      value={selectedStep.name}
                                      onChange={(e) => updateSelectedStep("name", e.target.value)}
                                      className="h-7 sm:h-8 text-[10px] sm:text-[11px] border-slate-200 bg-slate-50 focus:bg-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] sm:text-[10px] font-medium text-slate-600">State key</label>
                                    <div className="h-7 sm:h-8 rounded-md border border-slate-200 bg-slate-50 px-2 flex items-center text-[9px] sm:text-[10px] font-medium text-slate-500">
                                      {toStateKey(selectedStep.name)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 space-y-1">
                                  <label className="text-[9px] sm:text-[10px] font-medium text-slate-600">Message</label>
                                  <Textarea
                                    value={selectedStep.message}
                                    onChange={(e) => updateSelectedStep("message", e.target.value)}
                                    className="min-h-[70px] sm:min-h-[90px] text-[10px] sm:text-[11px] border-slate-200 bg-slate-50 focus-visible:bg-white resize-none"
                                  />
                                </div>

                                <div className="mt-2.5">
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <div>
                                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-800">Options builder</p>
                                      <p className="text-[8px] sm:text-[9px] text-slate-400">Map each button to the next step.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addOption} className="h-6 text-[8px] sm:text-[9px] px-2 gap-1">
                                      <Plus className="w-2.5 h-2.5" />Add
                                    </Button>
                                  </div>

                                  <div className="space-y-1.5">
                                    {selectedStep.options.map((option) => (
                                      <div key={option.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                                          <div className="space-y-1">
                                            <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">Button label</label>
                                            <Input
                                              value={option.label}
                                              onChange={(e) => updateOption(option.id, "label", e.target.value)}
                                              className="h-7 text-[10px] border-slate-200 bg-white"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">Goes to</label>
                                            <Select value={option.nextStateId} onValueChange={(value) => updateOption(option.id, "nextStateId", value)}>
                                              <SelectTrigger className="h-7 text-[10px] border-slate-200 bg-white">
                                                <SelectValue placeholder="Choose next step" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {flowSteps.map((step) => (
                                                  <SelectItem key={step.id} value={step.id}>{step.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {selectedStep.options.length === 0 ? (
                                      <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-[9px] sm:text-[10px] text-slate-400">
                                        No options yet. Add transitions to keep the flow moving.
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-2.5 rounded-xl border border-slate-200 p-2.5 sm:p-3">
                                  <div className="mb-2 flex items-center gap-1.5">
                                    <Globe className="w-3 h-3 text-blue-600 flex-shrink-0" strokeWidth={1.8} />
                                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-800">Advanced actions</p>
                                  </div>

                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">List header</label>
                                      <Input value={selectedStep.listHeader ?? ""} onChange={(e) => updateSelectedStep("listHeader", e.target.value)} className="h-7 text-[10px] border-slate-200 bg-slate-50 focus:bg-white" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">List button</label>
                                      <Input value={selectedStep.listButton ?? ""} onChange={(e) => updateSelectedStep("listButton", e.target.value)} className="h-7 text-[10px] border-slate-200 bg-slate-50 focus:bg-white" />
                                    </div>
                                  </div>

                                  <div className="mt-2 space-y-1">
                                    <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">List body</label>
                                    <Textarea value={selectedStep.listBody ?? ""} onChange={(e) => updateSelectedStep("listBody", e.target.value)} className="min-h-[60px] text-[10px] border-slate-200 bg-slate-50 focus-visible:bg-white resize-none" />
                                  </div>

                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">URL button label</label>
                                      <Input value={selectedStep.urlLabel ?? ""} onChange={(e) => updateSelectedStep("urlLabel", e.target.value)} className="h-7 text-[10px] border-slate-200 bg-slate-50 focus:bg-white" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">URL</label>
                                      <Input value={selectedStep.url ?? ""} onChange={(e) => updateSelectedStep("url", e.target.value)} className="h-7 text-[10px] border-slate-200 bg-slate-50 focus:bg-white" />
                                    </div>
                                  </div>

                                  <div className="mt-2 space-y-1">
                                    <label className="text-[8px] sm:text-[9px] font-medium text-slate-500">API endpoint</label>
                                    <Input value={selectedStep.apiEndpoint ?? ""} onChange={(e) => updateSelectedStep("apiEndpoint", e.target.value)} placeholder="/api/chatbots/{chatbot_id}/webhooks/action" className="h-7 text-[10px] border-slate-200 bg-slate-50 focus:bg-white" />
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            {/* Flow Contract */}
                            <div className="rounded-2xl border border-slate-200 p-3 bg-gradient-to-br from-slate-50 to-white">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                  <Code className="w-3.5 h-3.5 text-violet-700" strokeWidth={1.8} />
                                </div>
                                <div>
                                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 uppercase tracking-widest">Flow Contract</p>
                                  <p className="text-[8px] sm:text-[9px] text-slate-500">Final JSON sent to backend</p>
                                </div>
                              </div>
                              <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                                <pre className="max-h-[200px] sm:max-h-[280px] overflow-auto text-[7px] sm:text-[8px] leading-4 text-slate-100">
                                  {formatJson(flowJson)}
                                </pre>
                              </div>
                            </div>

                            {/* Validation */}
                            <div className="rounded-2xl border border-slate-200 p-3 bg-gradient-to-br from-emerald-50/50 to-white">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                                </div>
                                <div>
                                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 uppercase tracking-widest">Validation</p>
                                  <p className="text-[8px] sm:text-[9px] text-slate-500">Check before deploying</p>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className={`rounded-lg border px-2.5 py-2 text-[9px] sm:text-[10px] font-medium ${
                                  validation.isValid
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}>
                                  {validation.isValid ? "✓ Flow valid — ready to save/deploy" : "✗ Flow needs attention"}
                                </div>
                                {validation.errors.map((error) => (
                                  <div key={error} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[9px] text-rose-700 font-medium">✗ {error}</div>
                                ))}
                                {validation.warnings.map((warning) => (
                                  <div key={warning} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[9px] text-amber-700 font-medium">⚠️ {warning}</div>
                                ))}
                                {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] text-emerald-700 font-medium">No issues. All systems ready.</div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-3">
                      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                          <div className="mb-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-purple-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 uppercase tracking-widest">Live Simulator</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-500">Test flow before deploying</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="outline" onClick={resetPreview} className="h-7 text-[9px] sm:text-[10px] px-2">↻ Reset</Button>
                              <Button
                                variant="outline"
                                onClick={simulateOnBackend}
                                disabled={backendBusy || !chatbotId}
                                className="h-7 text-[9px] sm:text-[10px] px-2 gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                {backendBusy ? "..." : "Simulate"}
                              </Button>
                            </div>
                          </div>

                          {previewStep ? (
                            <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 sm:p-4 md:p-5 lg:p-6">
                              <div className="mb-3.5 sm:mb-4 md:mb-5 flex items-center gap-2.5 sm:gap-3">
                                <div className="w-9 sm:w-10 md:w-11 h-9 sm:h-10 md:h-11 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                  <Bot className="w-5 sm:w-5.5 md:w-6 h-5 sm:h-5.5 md:h-6 text-emerald-700" strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm md:text-[14px] font-bold text-slate-900 truncate">{agentSetup.name || "AI Agent"}</p>
                                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{toStateKey(previewStep.name)}</p>
                                </div>
                              </div>

                              <div className="rounded-xl sm:rounded-2xl bg-white border border-slate-200 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-[14px] leading-relaxed text-slate-700 shadow-md">
                                {previewStep.message}
                              </div>

                              {previewStep.url ? (
                                <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] md:text-xs text-blue-700 font-medium">
                                  🔗 {previewStep.urlLabel || "Open link"}
                                </div>
                              ) : null}

                              {previewStep.apiEndpoint ? (
                                <div className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl border border-violet-200 bg-violet-50 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] md:text-xs text-violet-700 font-medium">
                                  ⚙️ API: {previewStep.apiEndpoint}
                                </div>
                              ) : null}

                              <div className="mt-4 sm:mt-5 md:mt-6 space-y-2">
                                {previewStep.options.map((option) => {
                                  const nextStep = flowSteps.find((step) => step.id === option.nextStateId);

                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => nextStep && setPreviewStepId(nextStep.id)}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm md:text-[14px] font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/80 active:scale-97"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span>{option.label}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      </div>
                                    </button>
                                  );
                                })}

                                {previewStep.options.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-xs sm:text-sm text-amber-700 font-medium text-center">
                                    End of flow path
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-4 sm:space-y-5 md:space-y-6">
                          <div className="rounded-3xl border border-slate-200 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Deployment Payload</p>
                                <p className="mt-0.5 text-xs sm:text-[13px] text-slate-600">Ready for backend</p>
                              </div>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800">
                              <pre className="max-h-[280px] overflow-auto text-[9px] sm:text-[10px] md:text-[11px] leading-5 sm:leading-6 text-slate-100">
                                {formatJson(deployPayload)}
                              </pre>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-emerald-50/50 to-white">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" strokeWidth={2} />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Pre-Deploy Checks</p>
                                <p className="mt-0.5 text-xs sm:text-[13px] text-slate-600">Everything ready?</p>
                              </div>
                            </div>
                            <div className="space-y-2.5 sm:space-y-3">
                              <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-700">
                                <span className={validation.errors.some((error) => error.includes("START")) ? "text-rose-700" : "text-emerald-700"}>
                                  {validation.errors.some((error) => error.includes("START")) ? "✗" : "✓"} START Step
                                </span>
                              </div>
                              <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-700">
                                <span className={validation.errors.some((error) => error.includes("missing next step")) ? "text-rose-700" : "text-emerald-700"}>
                                  {validation.errors.some((error) => error.includes("missing next step")) ? "✗" : "✓"} State Links
                                </span>
                              </div>
                              <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-700">
                                <span className={!agentSetup.channel ? "text-amber-700" : "text-emerald-700"}>
                                  {agentSetup.channel ? "✓" : "⚠"} Channel: {agentSetup.channel || "Need to select"}
                                </span>
                              </div>
                            </div>
                            <Button
                              className="mt-5 sm:mt-6 w-full gap-3 h-10 sm:h-11 md:h-12 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700"
                              onClick={deployToBackend}
                              disabled={backendBusy || !chatbotId || !validation.isValid}
                            >
                              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                              {backendBusy ? "Deploying..." : "Deploy to Production"}
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-auto" />
                            </Button>
                          </div>

                          <div className="rounded-3xl border border-slate-200 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" strokeWidth={1.8} />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Backend Response</p>
                                <p className="mt-0.5 text-xs sm:text-[13px] text-slate-600">Latest API result</p>
                              </div>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800">
                              <pre className="max-h-[320px] overflow-auto text-[9px] sm:text-[10px] md:text-[11px] leading-5 sm:leading-6 text-slate-100">
                                {formatJson(backendResult ?? { chatbot_id: chatbotId, note: "No backend calls yet." })}
                              </pre>
                            </div>
                            {backendError ? (
                              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-700 font-medium">
                                {backendError}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="api" className="mt-2">
                      {/* Single column on mobile, two columns on xl+ */}
                      <div className="flex flex-col xl:grid xl:grid-cols-[1.1fr_0.9fr] gap-2 w-full min-w-0">

                        {/* ── Left: API Endpoints ── */}
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-gradient-to-br from-indigo-50/50 to-white min-w-0 w-full">
                          <div className="mb-2 flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide truncate">API Endpoints</h4>
                              <p className="text-[8px] text-slate-400 mt-0.5">Full lifecycle: create → save → simulate → deploy</p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-[7px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                              Step 4
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {apiEndpoints.map((endpoint) => (
                              <div key={endpoint.path} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 min-w-0">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className="inline-flex items-center bg-slate-900 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 mt-0.5">
                                    {endpoint.method}
                                  </span>
                                  <code className="text-[8px] font-semibold text-slate-700 font-mono break-all leading-tight min-w-0">{endpoint.path}</code>
                                </div>
                                <p className="mt-1 text-[7px] leading-snug text-slate-400 pl-0">{endpoint.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Right: Actions + Schema + Notes (all stacked) ── */}
                        <div className="flex flex-col gap-2 min-w-0 w-full">

                          {/* Connect to Backend — 4 action buttons in a 2x2 grid */}
                          <div className="rounded-xl border border-slate-200 p-2.5 bg-gradient-to-br from-violet-50/40 to-white min-w-0">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-3 h-3 text-violet-700" strokeWidth={2} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider leading-none truncate">Connect to Backend</p>
                                <p className="text-[7px] text-slate-400 mt-0.5">One tap per action</p>
                              </div>
                            </div>
                            {/* 2×2 button grid — each button constrained to half width */}
                            <div className="grid grid-cols-2 gap-1 w-full">
                              <button
                                type="button"
                                onClick={createChatbotInBackend}
                                disabled={backendBusy}
                                className="flex items-center justify-center gap-1 h-7 w-full rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-semibold disabled:opacity-50 truncate px-1.5"
                              >
                                <Plus className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Create</span>
                              </button>
                              <button
                                type="button"
                                onClick={saveFlowToBackend}
                                disabled={backendBusy || !chatbotId}
                                className="flex items-center justify-center gap-1 h-7 w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-semibold disabled:opacity-50 truncate px-1.5"
                              >
                                <Database className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={simulateOnBackend}
                                disabled={backendBusy || !chatbotId}
                                className="flex items-center justify-center gap-1 h-7 w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-semibold disabled:opacity-50 truncate px-1.5"
                              >
                                <Sparkles className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Simulate</span>
                              </button>
                              <button
                                type="button"
                                onClick={deployToBackend}
                                disabled={backendBusy || !chatbotId || !validation.isValid}
                                className="flex items-center justify-center gap-1 h-7 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-semibold disabled:opacity-50 truncate px-1.5"
                              >
                                <Zap className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Deploy</span>
                              </button>
                            </div>
                            <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[7px] text-slate-600 font-medium flex items-center gap-1 min-w-0">
                              <span className="flex-shrink-0 text-slate-400">ID:</span>
                              <span className="font-bold text-slate-900 font-mono truncate">{chatbotId ?? "—"}</span>
                            </div>
                            {backendError ? (
                              <div className="mt-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-[7px] text-rose-700 font-medium">
                                {backendError}
                              </div>
                            ) : null}
                          </div>

                          {/* Frontend → Backend schema */}
                          <div className="rounded-xl border border-slate-200 p-2.5 bg-gradient-to-br from-slate-50 to-white min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Code className="w-3 h-3 text-slate-700" strokeWidth={2} />
                              </div>
                              <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider">Frontend → Backend</p>
                            </div>
                            <p className="text-[7px] text-slate-400 mb-1.5">Contract schema on each request.</p>
                            <div className="bg-slate-900 rounded-lg p-1.5 border border-slate-800 w-full min-w-0 overflow-hidden">
                              <pre className="max-h-[140px] overflow-auto text-[6.5px] sm:text-[7px] leading-[1.4] text-slate-100 font-mono w-full whitespace-pre-wrap break-all">
                                {formatJson(deployPayload)}
                              </pre>
                            </div>
                          </div>

                          {/* Why It Works + Save Sequence — side by side on mobile */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <Zap className="w-2.5 h-2.5 text-emerald-700" strokeWidth={2} />
                                </div>
                                <p className="text-[8px] font-bold text-emerald-900 uppercase tracking-wider">Why It Works</p>
                              </div>
                              <ul className="space-y-1 text-[7px] leading-snug text-emerald-900/80">
                                <li className="flex gap-1"><span className="font-bold text-emerald-600 flex-shrink-0">→</span><span>Business intent, not canned replies</span></li>
                                <li className="flex gap-1"><span className="font-bold text-emerald-600 flex-shrink-0">→</span><span>Executable flow states instantly</span></li>
                                <li className="flex gap-1"><span className="font-bold text-emerald-600 flex-shrink-0">→</span><span>SMS, actions, links in one flow</span></li>
                              </ul>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0">
                                  <ChevronRight className="w-2.5 h-2.5 text-slate-600" strokeWidth={2} />
                                </div>
                                <p className="text-[8px] font-bold text-slate-900 uppercase tracking-wider">Save Sequence</p>
                              </div>
                              <div className="flex items-center flex-wrap gap-1 text-[7px]">
                                <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-semibold text-slate-700">Create</span>
                                <ChevronRight className="w-2 h-2 text-slate-300 flex-shrink-0" />
                                <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-semibold text-slate-700">Save</span>
                                <ChevronRight className="w-2 h-2 text-slate-300 flex-shrink-0" />
                                <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-semibold text-slate-700">Simulate</span>
                                <ChevronRight className="w-2 h-2 text-slate-300 flex-shrink-0" />
                                <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-semibold text-slate-700">Deploy</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

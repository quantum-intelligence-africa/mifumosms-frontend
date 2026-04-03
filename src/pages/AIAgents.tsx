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
  Database,
  GitBranch,
  Globe,
  MessageCircle,
  Plus,
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
        const res = await fetch("/api/early-access/ai-agents/status/", {
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
    formData.append("full_name", name.trim());
    formData.append("email", email.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    formData.append("kyc_file", kycFile);

    const token = localStorage.getItem("access_token");

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/early-access/ai-agents/waitlist/", {
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="mb-8">
              <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                AI Agents
              </h1>
              <p className="mt-1 text-[14px] text-slate-500">
                Build and deploy intelligent agents for automated customer engagement
              </p>
            </div>

            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mb-8">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500" />

              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 px-6 pt-8 pb-6 lg:py-8 lg:pr-0">
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

                <div className="lg:w-[340px] px-6 py-6 lg:py-8">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isCreateAgent = feature.title === "Create Agent";

                if (isCreateAgent) {
                  return (
                    <button
                      key={feature.title}
                      type="button"
                      onClick={() => setBuilderOpen((current) => !current)}
                      className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${feature.borderAccent} shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-all duration-200 p-4 text-left cursor-pointer ${
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
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <BrainCircuit className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                          Rapid AI Agent Builder
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                          SMS-ready
                        </Badge>
                      </div>
                      <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">
                        Create a fast, structured AI agent in one focused flow
                      </h3>
                      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-600">
                        This builder is designed for rapid AI agents, not basic chatbots. Every screen maps directly to a structured state so your backend can save, validate, simulate, and deploy it without extra coding.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[440px]">
                      <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Speed</p>
                        <p className="mt-1 text-[15px] font-semibold text-slate-900">&lt; 5 min</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Start step</p>
                        <p className="mt-1 text-[15px] font-semibold text-slate-900">Auto-ready</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Output</p>
                        <p className="mt-1 text-[15px] font-semibold text-slate-900">Live JSON</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Deploy</p>
                        <p className="mt-1 text-[15px] font-semibold text-slate-900">API-ready</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Quick Templates
                      </p>
                      <p className="mt-1 text-[13px] text-slate-500">
                        Start from a proven use case, then fine-tune the flow for your business.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {builderTemplates.map((template) => (
                        <button
                          key={template.key}
                          type="button"
                          onClick={() => loadTemplate(template.key)}
                          className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
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
                    <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-100 p-1 h-auto">
                      <TabsTrigger value="setup" className="rounded-lg py-2 text-[12px] font-medium">
                        Setup
                      </TabsTrigger>
                      <TabsTrigger value="flow" className="rounded-lg py-2 text-[12px] font-medium">
                        Flow Builder
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="rounded-lg py-2 text-[12px] font-medium">
                        Live Preview
                      </TabsTrigger>
                      <TabsTrigger value="api" className="rounded-lg py-2 text-[12px] font-medium">
                        API Contract
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="setup" className="mt-4">
                      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-[15px] font-semibold text-slate-900">Agent onboarding</h4>
                              <p className="mt-1 text-[13px] text-slate-500">
                                Define the business context and the core job your AI agent should handle.
                              </p>
                            </div>
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Step 1
                            </Badge>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Chatbot name</label>
                              <Input
                                value={agentSetup.name}
                                onChange={(e) => updateSetup("name", e.target.value)}
                                placeholder="Mifumo SMS Bot"
                                className="h-10 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Business name</label>
                              <Input
                                value={agentSetup.business}
                                onChange={(e) => updateSetup("business", e.target.value)}
                                placeholder="Mifumo Labs"
                                className="h-10 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Industry</label>
                              <Select value={agentSetup.industry} onValueChange={(value) => updateSetup("industry", value)}>
                                <SelectTrigger className="h-10 text-[13px] border-slate-200 bg-slate-50">
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                  {industries.map((industry) => (
                                    <SelectItem key={industry} value={industry}>
                                      {industry}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Language</label>
                              <Select value={agentSetup.language} onValueChange={(value) => updateSetup("language", value)}>
                                <SelectTrigger className="h-10 text-[13px] border-slate-200 bg-slate-50">
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {languages.map((language) => (
                                    <SelectItem key={language.value} value={language.value}>
                                      {language.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Tone</label>
                              <Select value={agentSetup.tone} onValueChange={(value) => updateSetup("tone", value)}>
                                <SelectTrigger className="h-10 text-[13px] border-slate-200 bg-slate-50">
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tones.map((tone) => (
                                    <SelectItem key={tone} value={tone}>
                                      {tone}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[12px] font-medium text-slate-700">Channel</label>
                              <Select value={agentSetup.channel} onValueChange={(value) => updateSetup("channel", value)}>
                                <SelectTrigger className="h-10 text-[13px] border-slate-200 bg-slate-50">
                                  <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                                <SelectContent>
                                  {channels.map((channel) => (
                                    <SelectItem key={channel} value={channel}>
                                      {channel}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700">Agent intent</label>
                            <Textarea
                              value={agentSetup.intent}
                              onChange={(e) => updateSetup("intent", e.target.value)}
                              placeholder="Describe the business goal and what the agent should help users accomplish."
                              className="min-h-[120px] text-[13px] border-slate-200 bg-slate-50 focus-visible:bg-white resize-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Wand2 className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
                              <p className="text-[13px] font-semibold text-emerald-800">Rapid agent principles</p>
                            </div>
                            <ul className="space-y-2 text-[12px] leading-5 text-emerald-900/80">
                              <li>Use simple business language so non-technical users can build fast.</li>
                              <li>Map every screen directly to a backend-ready flow state.</li>
                              <li>Keep SMS deployment in mind from the very first onboarding step.</li>
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-[13px] font-semibold text-slate-900">Live create payload</p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              This payload is ready for agent creation before the flow is saved.
                            </p>
                            <pre className="mt-3 rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100 overflow-x-auto">
                              {formatJson(createPayload)}
                            </pre>
                            <Button
                              className="mt-4 w-full gap-2"
                              onClick={createChatbotInBackend}
                              disabled={backendBusy}
                            >
                              <Sparkles className="w-4 h-4" />
                              {backendBusy ? "Creating..." : "Create agent in backend"}
                              <ArrowRight className="w-4 h-4 ml-auto" />
                            </Button>
                            <div className="mt-3 space-y-2">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                                Chatbot ID:{" "}
                                <span className="font-semibold text-slate-900">{chatbotId ?? "—"}</span>
                              </div>
                              {backendError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                                  {backendError}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-[13px] font-semibold text-slate-900">Current template</p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              {builderTemplates.find((template) => template.key === selectedTemplateKey)?.summary}
                            </p>
                            <Button variant="outline" className="mt-4 w-full" onClick={() => setActiveTab("flow")}>
                              Continue to flow builder
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="flow" className="mt-4">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-[15px] font-semibold text-slate-900">Visual step map</p>
                              <p className="mt-1 text-[13px] text-slate-500">
                                Keep the flow easy to understand. Each step below becomes one state in your final JSON.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={addStep}>
                                <Plus className="w-4 h-4" />
                                Add step
                              </Button>
                              <Button
                                variant="outline"
                                onClick={saveFlowToBackend}
                                disabled={backendBusy || !chatbotId}
                              >
                                <Database className="w-4 h-4" />
                                {backendBusy ? "Saving..." : "Save flow"}
                              </Button>
                              <Button onClick={() => setActiveTab("preview")}>
                                Preview agent
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                            {flowSteps.map((step, index) => (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => setSelectedStepId(step.id)}
                                className={`min-w-[220px] rounded-2xl border p-4 text-left transition-colors ${
                                  selectedStep?.id === step.id
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-slate-200 bg-slate-50 hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[12px] font-semibold text-slate-700">
                                    {index + 1}
                                  </div>
                                  <Badge className="bg-white text-slate-600 border border-slate-200 hover:bg-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {toStateKey(step.name)}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-[13px] font-semibold text-slate-900">{step.name}</p>
                                <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-slate-500">
                                  {step.message}
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                                  <GitBranch className="w-3.5 h-3.5" />
                                  {step.options.length} transition{step.options.length === 1 ? "" : "s"}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
                          <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-[15px] font-semibold text-slate-900">Step editor</h4>
                                <p className="mt-1 text-[13px] text-slate-500">
                                  Edit the message, buttons, and optional advanced actions for this step.
                                </p>
                              </div>
                              <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Step 2
                              </Badge>
                            </div>

                            {selectedStep ? (
                              <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <label className="text-[12px] font-medium text-slate-700">Step name</label>
                                    <Input
                                      value={selectedStep.name}
                                      onChange={(e) => updateSelectedStep("name", e.target.value)}
                                      className="h-10 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[12px] font-medium text-slate-700">Generated state key</label>
                                    <div className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-[13px] font-medium text-slate-600">
                                      {toStateKey(selectedStep.name)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-1.5">
                                  <label className="text-[12px] font-medium text-slate-700">Message</label>
                                  <Textarea
                                    value={selectedStep.message}
                                    onChange={(e) => updateSelectedStep("message", e.target.value)}
                                    className="min-h-[120px] text-[13px] border-slate-200 bg-slate-50 focus-visible:bg-white resize-none"
                                  />
                                </div>

                                <div className="mt-4">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[13px] font-semibold text-slate-900">Options builder</p>
                                      <p className="mt-1 text-[12px] text-slate-500">
                                        Add buttons and map each one to the next step.
                                      </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addOption}>
                                      <Plus className="w-4 h-4" />
                                      Add option
                                    </Button>
                                  </div>

                                  <div className="space-y-3">
                                    {selectedStep.options.map((option) => (
                                      <div key={option.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                                          <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-slate-600">Button label</label>
                                            <Input
                                              value={option.label}
                                              onChange={(e) => updateOption(option.id, "label", e.target.value)}
                                              className="h-9 text-[13px] border-slate-200 bg-white"
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-slate-600">Goes to</label>
                                            <Select
                                              value={option.nextStateId}
                                              onValueChange={(value) => updateOption(option.id, "nextStateId", value)}
                                            >
                                              <SelectTrigger className="h-9 text-[13px] border-slate-200 bg-white">
                                                <SelectValue placeholder="Choose next step" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {flowSteps.map((step) => (
                                                  <SelectItem key={step.id} value={step.id}>
                                                    {step.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    {selectedStep.options.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-[12px] text-slate-500">
                                        No options yet. Add one or more transitions to keep the flow moving.
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                                  <div className="mb-3 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
                                    <p className="text-[13px] font-semibold text-slate-900">Advanced actions</p>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-medium text-slate-600">List header</label>
                                      <Input
                                        value={selectedStep.listHeader ?? ""}
                                        onChange={(e) => updateSelectedStep("listHeader", e.target.value)}
                                        className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-medium text-slate-600">List button</label>
                                      <Input
                                        value={selectedStep.listButton ?? ""}
                                        onChange={(e) => updateSelectedStep("listButton", e.target.value)}
                                        className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-1.5">
                                    <label className="text-[11px] font-medium text-slate-600">List body</label>
                                    <Textarea
                                      value={selectedStep.listBody ?? ""}
                                      onChange={(e) => updateSelectedStep("listBody", e.target.value)}
                                      className="min-h-[84px] text-[13px] border-slate-200 bg-slate-50 focus-visible:bg-white resize-none"
                                    />
                                  </div>

                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-medium text-slate-600">URL button label</label>
                                      <Input
                                        value={selectedStep.urlLabel ?? ""}
                                        onChange={(e) => updateSelectedStep("urlLabel", e.target.value)}
                                        className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-medium text-slate-600">URL</label>
                                      <Input
                                        value={selectedStep.url ?? ""}
                                        onChange={(e) => updateSelectedStep("url", e.target.value)}
                                        className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-1.5">
                                    <label className="text-[11px] font-medium text-slate-600">API endpoint</label>
                                    <Input
                                      value={selectedStep.apiEndpoint ?? ""}
                                      onChange={(e) => updateSelectedStep("apiEndpoint", e.target.value)}
                                      placeholder="/api/chatbots/{chatbot_id}/webhooks/action"
                                      className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <p className="text-[13px] font-semibold text-slate-900">Flow contract</p>
                              <p className="mt-1 text-[12px] text-slate-500">
                                Every step is transformed into the backend contract below.
                              </p>
                              <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
                                {formatJson(flowJson)}
                              </pre>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                              <p className="text-[13px] font-semibold text-slate-900">Validation engine</p>
                              <p className="mt-1 text-[12px] text-slate-500">
                                Broken links and missing START steps are caught before deploy.
                              </p>
                              <div className="mt-3 space-y-2">
                                <div className={`rounded-xl border px-3 py-2 text-[12px] ${
                                  validation.isValid
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}>
                                  {validation.isValid
                                    ? "Flow is valid and ready for save/deploy."
                                    : "Flow needs attention before save/deploy."}
                                </div>

                                {validation.errors.map((error) => (
                                  <div key={error} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                                    {error}
                                  </div>
                                ))}

                                {validation.warnings.map((warning) => (
                                  <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                                    {warning}
                                  </div>
                                ))}

                                {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                                    No issues detected.
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-[15px] font-semibold text-slate-900">Live simulator</h4>
                              <p className="mt-1 text-[13px] text-slate-500">
                                Test the flow like a real conversation before sending it to the backend.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={resetPreview}>
                                Reset
                              </Button>
                              <Button
                                variant="outline"
                                onClick={simulateOnBackend}
                                disabled={backendBusy || !chatbotId}
                              >
                                <Sparkles className="w-4 h-4" />
                                {backendBusy ? "Simulating..." : "Simulate (backend)"}
                              </Button>
                            </div>
                          </div>

                          {previewStep ? (
                            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <Bot className="w-5 h-5 text-emerald-700" strokeWidth={1.8} />
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-slate-900">{agentSetup.name || "AI Agent"}</p>
                                  <p className="text-[11px] text-slate-400">{toStateKey(previewStep.name)}</p>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[13px] leading-6 text-slate-700 shadow-sm">
                                {previewStep.message}
                              </div>

                              {previewStep.url ? (
                                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
                                  URL action: {previewStep.urlLabel || "Open link"} -&gt; {previewStep.url}
                                </div>
                              ) : null}

                              {previewStep.apiEndpoint ? (
                                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[12px] text-violet-700">
                                  API action: {previewStep.apiEndpoint}
                                </div>
                              ) : null}

                              <div className="mt-4 space-y-2">
                                {previewStep.options.map((option) => {
                                  const nextStep = flowSteps.find((step) => step.id === option.nextStateId);

                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => nextStep && setPreviewStepId(nextStep.id)}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50/60"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span>{option.label}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      </div>
                                    </button>
                                  );
                                })}

                                {previewStep.options.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-[12px] text-slate-500">
                                    This step ends the current preview path.
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageCircle className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
                              <p className="text-[13px] font-semibold text-slate-900">Deploy payload</p>
                            </div>
                            <p className="text-[12px] text-slate-500">
                              Use this payload when saving the full flow to the backend runtime.
                            </p>
                            <pre className="mt-3 rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100 overflow-x-auto">
                              {formatJson(deployPayload)}
                            </pre>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
                              <p className="text-[13px] font-semibold text-slate-900">Ready-to-deploy checks</p>
                            </div>
                            <div className="space-y-2 text-[12px] text-slate-600">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                START step present: {validation.errors.some((error) => error.includes("START")) ? "No" : "Yes"}
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                State links valid: {validation.errors.some((error) => error.includes("missing next step")) ? "No" : "Yes"}
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                Agent channel: {agentSetup.channel || "Not selected"}
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                Business context: {agentSetup.business || "Missing business name"}
                              </div>
                            </div>
                            <Button
                              className="mt-4 w-full gap-2"
                              onClick={deployToBackend}
                              disabled={backendBusy || !chatbotId || !validation.isValid}
                            >
                              <Zap className="w-4 h-4" />
                              {backendBusy ? "Deploying..." : "Deploy (backend)"}
                              <ArrowRight className="w-4 h-4 ml-auto" />
                            </Button>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-[13px] font-semibold text-slate-900">Backend response</p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              Latest response from create/save/simulate/deploy calls.
                            </p>
                            <pre className="mt-3 max-h-[260px] overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
                              {formatJson(backendResult ?? { chatbot_id: chatbotId, note: "No backend calls yet." })}
                            </pre>
                            {backendError ? (
                              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                                {backendError}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="api" className="mt-4">
                      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-[15px] font-semibold text-slate-900">Ready API endpoints</h4>
                              <p className="mt-1 text-[13px] text-slate-500">
                                These endpoints cover the rapid creation, save, test, and deploy path for SMS-ready AI agents.
                              </p>
                            </div>
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Step 4
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {apiEndpoints.map((endpoint) => (
                              <div key={endpoint.path} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="bg-slate-900 text-white hover:bg-slate-900 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {endpoint.method}
                                  </Badge>
                                  <code className="text-[12px] font-medium text-slate-700">{endpoint.path}</code>
                                </div>
                                <p className="mt-2 text-[12px] leading-5 text-slate-500">{endpoint.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-[13px] font-semibold text-slate-900">Connect to backend</p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              These buttons call the required endpoints so you don’t need extra frontend work after backend implementation.
                            </p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <Button onClick={createChatbotInBackend} disabled={backendBusy} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create agent
                              </Button>
                              <Button
                                variant="outline"
                                onClick={saveFlowToBackend}
                                disabled={backendBusy || !chatbotId}
                                className="gap-2"
                              >
                                <Database className="w-4 h-4" />
                                Save flow
                              </Button>
                              <Button
                                variant="outline"
                                onClick={simulateOnBackend}
                                disabled={backendBusy || !chatbotId}
                                className="gap-2"
                              >
                                <Sparkles className="w-4 h-4" />
                                Simulate
                              </Button>
                              <Button
                                onClick={deployToBackend}
                                disabled={backendBusy || !chatbotId || !validation.isValid}
                                className="gap-2"
                              >
                                <Zap className="w-4 h-4" />
                                Deploy
                              </Button>
                            </div>
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                              Current chatbot_id:{" "}
                              <span className="font-semibold text-slate-900">{chatbotId ?? "—"}</span>
                            </div>
                            {backendError ? (
                              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                                {backendError}
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                              <p className="text-[13px] font-semibold text-slate-900">Frontend to backend contract</p>
                            </div>
                            <p className="text-[12px] text-slate-500">
                              The frontend builder should always send the full flow contract exactly like this.
                            </p>
                            <pre className="mt-3 rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100 overflow-x-auto">
                              {formatJson(deployPayload)}
                            </pre>
                          </div>

                          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
                              <p className="text-[13px] font-semibold text-blue-900">
                                Why this is stronger than a normal chatbot
                              </p>
                            </div>
                            <ul className="space-y-2 text-[12px] leading-5 text-blue-900/80">
                              <li>It starts with business intent, not just canned replies.</li>
                              <li>It generates structured flow states that your runtime engine can execute immediately.</li>
                              <li>It keeps SMS, actions, links, and webhooks inside the same fast creation flow.</li>
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-[13px] font-semibold text-slate-900">Suggested save sequence</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-3 py-1">Create agent</span>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                              <span className="rounded-full bg-slate-100 px-3 py-1">Save flow</span>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                              <span className="rounded-full bg-slate-100 px-3 py-1">Simulate</span>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                              <span className="rounded-full bg-slate-100 px-3 py-1">Deploy to SMS</span>
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

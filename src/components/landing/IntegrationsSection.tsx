import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Workflow,
  PlugZap,
  Code2,
  Webhook,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Boxes,
  Sigma,
  Cable,
} from "lucide-react";
import { SectionHeader, FeaturePillStrip } from "./shared";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type TFn = (key: any, params?: any) => string;

const SNIPPET = `POST https://mifumosms.mifumolabs.com/api/integration/v1/sms/send/
Authorization: Bearer mif_your_api_key_here
Content-Type: application/json

{
  "recipients": ["+255614853618"],
  "message": "Karibu Senda — hello from the API",
  "sender_id": "Mifumosms"
}`;

const getCapabilityStrip = (t: TFn) => [
  { label: "REST API", icon: <Code2 className="h-3.5 w-3.5 text-blue-600" /> },
  { label: "Webhooks", icon: <Webhook className="h-3.5 w-3.5 text-blue-600" /> },
  { label: "SDKs", icon: <Boxes className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.integrations.capability_crm_connectors"), icon: <Cable className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.integrations.capability_multichannel"), icon: <Sigma className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.integrations.capability_sandbox_keys"), icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> },
];

const getUseCases = (
  t: TFn
): Array<{
  Icon: typeof Workflow;
  index: string;
  title: string;
  body: string;
  bullets: string[];
}> => [
  {
    Icon: Workflow,
    index: "01",
    title: t("landing.integrations.usecase1_title"),
    body: t("landing.integrations.usecase1_body"),
    bullets: [
      t("landing.integrations.usecase1_bullet1"),
      t("landing.integrations.usecase1_bullet2"),
      t("landing.integrations.usecase1_bullet3"),
    ],
  },
  {
    Icon: PlugZap,
    index: "02",
    title: t("landing.integrations.usecase2_title"),
    body: t("landing.integrations.usecase2_body"),
    bullets: [
      t("landing.integrations.usecase2_bullet1"),
      t("landing.integrations.usecase2_bullet2"),
      t("landing.integrations.usecase2_bullet3"),
    ],
  },
  {
    Icon: Code2,
    index: "03",
    title: t("landing.integrations.usecase3_title"),
    body: t("landing.integrations.usecase3_body"),
    bullets: [
      t("landing.integrations.usecase3_bullet1"),
      t("landing.integrations.usecase3_bullet2"),
      t("landing.integrations.usecase3_bullet3"),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Code snippet mockup
// ─────────────────────────────────────────────────────────────────────────────

const CodeSnippet = ({ t }: { t: TFn }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = SNIPPET;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 shadow-[0_25px_50px_-20px_rgba(15,23,42,0.6)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-gray-800/80 bg-gray-900/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <p className="text-[10px] font-medium text-white">send-sms.sh</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={
            copied
              ? t("landing.integrations.snippet_copied")
              : t("landing.integrations.copy_snippet")
          }
          aria-live="polite"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold text-white transition-colors",
            copied
              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
              : "border-gray-700 bg-gray-800/60 hover:bg-gray-700/70"
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? t("common.copied") : t("landing.integrations.copy")}
        </button>
      </div>

      {/* Snippet body */}
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-relaxed text-white">
        <code>
          <span className="font-semibold text-blue-300">POST</span>{" "}
          <span className="text-emerald-300">
            https://mifumosms.mifumolabs.com/api/integration/v1/sms/send/
          </span>
          {"\n"}
          <span className="text-white">Authorization:</span>{" "}
          <span className="font-semibold text-amber-300">Bearer</span>{" "}
          <span className="text-white">mif_your_api_key_here</span>
          {"\n"}
          <span className="text-white">Content-Type:</span>{" "}
          <span className="text-white">application/json</span>
          {"\n\n"}
          <span className="text-white">{"{"}</span>
          {"\n  "}
          <span className="text-sky-300">"recipients"</span>
          <span className="text-white">: [</span>
          <span className="text-emerald-300">"+255614853618"</span>
          <span className="text-white">],</span>
          {"\n  "}
          <span className="text-sky-300">"message"</span>
          <span className="text-white">: </span>
          <span className="text-emerald-300">"Karibu Senda — hello from the API"</span>
          <span className="text-white">,</span>
          {"\n  "}
          <span className="text-sky-300">"sender_id"</span>
          <span className="text-white">: </span>
          <span className="text-emerald-300">"Mifumosms"</span>
          {"\n"}
          <span className="text-white">{"}"}</span>
        </code>
      </pre>

      {/* Response */}
      <div className="border-t border-gray-800/80 bg-gray-900/60 px-4 py-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
          {t("landing.integrations.response_200")}
        </p>
        <pre className="mt-1 font-mono text-[10px] leading-relaxed text-white">
          <code>
            <span className="text-white">{"{ "}</span>
            <span className="text-sky-300">"success"</span>
            <span className="text-white">: </span>
            <span className="font-semibold text-amber-300">true</span>
            <span className="text-white">, </span>
            <span className="text-sky-300">"data"</span>
            <span className="text-white">: {"{ "}</span>
            <span className="text-sky-300">"message_id"</span>
            <span className="text-white">: </span>
            <span className="text-emerald-300">"uuid"</span>
            <span className="text-white">, </span>
            <span className="text-sky-300">"status"</span>
            <span className="text-white">: </span>
            <span className="text-emerald-300">"sent"</span>{" "}
            <span className="text-white">{"} }"}</span>
          </code>
        </pre>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

const IntegrationsSection = () => {
  const { t } = useLanguage();
  const useCases = getUseCases(t);
  const capabilityStrip = getCapabilityStrip(t);

  return (
    <section
      id="integrations"
      className="relative overflow-hidden bg-gray-50 py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 translate-x-1/2 translate-y-1/3 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          <SectionHeader
            eyebrow={t("landing.integrations.eyebrow")}
            align="center"
            title={
              <>
                {t("landing.integrations.title_line1")}{" "}
                <span className="text-blue-600">{t("landing.integrations.title_line2")}</span>
              </>
            }
            lead={t("landing.integrations.lead")}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Use-case cards */}
          <div className="lg:col-span-6 space-y-4">
            {useCases.map(({ Icon, index, title, body, bullets }) => (
              <article
                key={index}
                className="group relative flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_40px_-18px_rgba(37,99,235,0.25)]"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold text-white">{index}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {bullets.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            <a
              href="https://docs-sms.mifumolabs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all hover:bg-blue-600"
              )}
            >
              {t("landing.integrations.open_api_reference")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Code snippet */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <CodeSnippet t={t} />

            <FeaturePillStrip
              items={capabilityStrip}
              tone="default"
              className="mt-6 justify-center lg:justify-start"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;

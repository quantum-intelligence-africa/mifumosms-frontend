import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Loader2, PhoneCall, Router } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, SitePage, Tag, focusRing } from "../Layout";
import { AGENT_COUNTS, COUNTRY_CODES, REFERRAL_SOURCES, SUPPORT, useContent } from "../content";
import { useSiteLang } from "../i18n";
import { API_CONFIG } from "@/config/api";
import { Reveal } from "../Reveal";

type Tr = ReturnType<typeof useSiteLang>["tr"];

/**
 * Demo request. The lead is POSTed to the public backend endpoint (crm.DemoRequest), where SENDA
 * admins review it. VITE_DEMO_REQUEST_URL overrides the URL for local testing.
 */
const ENDPOINT =
  (import.meta.env.VITE_DEMO_REQUEST_URL as string | undefined) || `${API_CONFIG.BASE_URL}/v1/demo-requests/`;

const USE_CASES: Record<string, { en: string; sw: string }> = { transport: { en: "Transport operators", sw: "Wasafirishaji" } };

type Fields = {
  fullName: string;
  company: string;
  email: string;
  countryCode: string;
  phone: string;
  agents: string;
  improve: string;
  referral: string;
};

const EMPTY: Fields = { fullName: "", company: "", email: "", countryCode: "+255", phone: "", agents: "", improve: "", referral: "" };

function validate(f: Fields, tr: Tr): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (!f.fullName.trim()) e.fullName = tr("Enter your full name.", "Weka jina lako kamili.");
  if (!f.company.trim()) e.company = tr("Enter your company name.", "Weka jina la kampuni yako.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = tr("Enter a valid work email, like name@company.co.tz.", "Weka barua pepe sahihi ya kazini, kama jina@kampuni.co.tz.");
  const digits = f.phone.replace(/\D/g, "").replace(/^0/, "");
  if (digits.length < 7 || digits.length > 12) e.phone = tr("Enter your phone number, like 712 345 678.", "Weka namba yako ya simu, kama 712 345 678.");
  if (!f.agents) e.agents = tr("Choose how many agents answer calls.", "Chagua idadi ya wahudumu wanaopokea simu.");
  if (f.improve.trim().length < 5) e.improve = tr("Tell us briefly what you want to improve.", "Tueleze kwa ufupi unachotaka kuboresha.");
  return e;
}

const inputClass = (invalid?: boolean) =>
  cn(
    "w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-[#0B1B3F] placeholder:text-[#8A93A3]",
    focusRing,
    invalid ? "border-[#B42318]" : "border-[#D5DCE8]",
  );

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const { tr } = useSiteLang();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#0B1B3F]">
        {label} {optional && <span className="font-normal text-[#5B6575]">{tr("(optional)", "(si lazima)")}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-[#B42318]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

export default function BookDemo() {
  const { tr } = useSiteLang();
  const { PLANS, REFERRAL_SOURCES: REFERRAL_LABELS } = useContent();
  const [params] = useSearchParams();
  const planKey = params.get("plan") || "";
  const useCaseKey = params.get("usecase") || "";
  const source = params.get("source") || "direct";
  const plan = PLANS.find((p) => p.key === planKey);
  const useCase = USE_CASES[useCaseKey];
  const selection = plan
    ? tr(`${plan.name} plan`, `Mpango wa ${plan.name}`)
    : useCase
      ? tr(`${useCase.en} use case`, `Matumizi ya ${useCase.sw}`)
      : null;

  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "failed" | "done">("idle");
  const [honeypot, setHoneypot] = useState("");

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const record = useMemo(
    () => ({
      full_name: f.fullName.trim(),
      company: f.company.trim(),
      work_email: f.email.trim(),
      phone: `${f.countryCode}${f.phone.replace(/\D/g, "").replace(/^0/, "")}`,
      agent_count: f.agents,
      wants_to_improve: f.improve.trim(),
      referral_source: f.referral || "",
      selected_plan: plan?.key ?? "",
      use_case: useCaseKey || "",
      originating_page: source,
      website: honeypot, // honeypot; real visitors leave this empty
    }),
    [f, plan, useCaseKey, source, honeypot],
  );

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const v = validate(f, tr);
    setErrors(v);
    if (Object.keys(v).length) {
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    setState("sending");
    const payload = { ...record, requested_at: new Date().toISOString() };
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("failed"); // entered details stay in the form
    }
  };

  if (state === "done") {
    const prepare = [
      {
        icon: PhoneCall,
        title: tr("A typical call scenario", "Mfano wa simu ya kawaida"),
        body: tr(
          "One customer enquiry your team handles often, so we can walk through it together.",
          "Ulizo moja la mteja ambalo timu yako hushughulikia mara kwa mara, ili tulipitie pamoja.",
        ),
      },
      {
        icon: Router,
        title: tr("Your phone setup", "Mpangilio wako wa simu"),
        body: tr(
          "Your provider, your business number and how calls are routed today (for example, forwarded to staff mobiles).",
          "Mtoa huduma wako, namba yako ya biashara na jinsi simu zinavyoelekezwa sasa (kwa mfano, zinahamishiwa kwenye simu za mkononi za wafanyakazi).",
        ),
      },
    ];
    return (
      <SitePage title={tr("Demo request received — SENDA", "Ombi la onyesho limepokelewa — SENDA")}>
        <section className="bg-white" aria-labelledby="done-title">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF1FF] text-[#2563EB]">
              <Check className="h-10 w-10" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 id="done-title" className="mt-6 text-4xl font-extrabold tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("We received your demo request", "Tumepokea ombi lako la onyesho")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4B5565]">
              {tr("The SENDA team will contact you to agree on a time.", "Timu ya SENDA itawasiliana nawe ili kukubaliana muda.")}{" "}
              {tr("We've sent an acknowledgement to", "Tumetuma uthibitisho kwenda")}{" "}
              <span className="font-semibold text-[#0B1B3F]">{record.work_email}</span>
              {selection && (
                <>
                  {" "}
                  {tr("for the", "kwa")} <span className="font-semibold text-[#0B1B3F]">{selection}</span>
                </>
              )}
              .
            </p>

            <Reveal className="mt-10">
              <div className="rounded-3xl bg-[#F5F6F8] p-6 text-left sm:p-8">
                <h2 className="text-2xl font-bold text-[#0B1B3F]">{tr("What to prepare for your demo", "Unachopaswa kuandaa kwa ajili ya onyesho")}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {prepare.map(({ icon: Icon, title, body }, i) => (
                    <Reveal key={title} delay={i * 80}>
                      <div className="flex h-full gap-4 rounded-2xl border border-[#E3E7EE] bg-white p-5">
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <div>
                          <h3 className="font-semibold text-[#0B1B3F]">{title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#4B5565]">{body}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
            <p className="mt-6 text-sm text-[#5B6575]">
              {tr(
                `Questions before then? Reply to the acknowledgement email or WhatsApp ${SUPPORT.phoneDisplay}.`,
                `Una maswali kabla ya hapo? Jibu barua pepe ya uthibitisho au tuma WhatsApp kwa ${SUPPORT.phoneDisplay}.`,
              )}
            </p>
            <ButtonLink to="/" className="mt-8">
              {tr("Back to SENDA", "Rudi SENDA")}
            </ButtonLink>
          </div>
        </section>
      </SitePage>
    );
  }

  const err = (k: keyof Fields) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

  return (
    <SitePage title={tr("Book a demo — SENDA", "Omba onyesho — SENDA")}>
      <div className="grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr]">
        <section className="bg-white px-4 py-12 sm:px-6 lg:px-12 lg:py-20" aria-labelledby="demo-title">
          <div className="mx-auto max-w-lg lg:ml-auto lg:mr-0">
            <h1 id="demo-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("See SENDA with your workflow", "Ona SENDA ikifanya kazi kwa utaratibu wako")}
            </h1>
            <p className="mt-4 text-lg text-[#4B5565]">{tr("We'll use your enquiry to prepare the demo.", "Tutatumia maelezo yako kuandaa onyesho.")}</p>
            {selection && (
              <p className="mt-6">
                <Tag>
                  {tr("Selected:", "Umechagua:")} {selection}
                </Tag>
              </p>
            )}
          </div>
        </section>

        <section className="bg-[#F5F6F8] px-4 py-12 sm:px-6 lg:px-12 lg:py-16" aria-label={tr("Demo request form", "Fomu ya kuomba onyesho")}>
          <form noValidate onSubmit={submit} className="mx-auto max-w-xl rounded-3xl border border-[#E3E7EE] bg-white p-6 shadow-sm sm:p-8 lg:ml-0">
            <h2 className="text-2xl font-bold text-[#0B1B3F]">{tr("Book a demo", "Omba onyesho")}</h2>
            {/* Honeypot: hidden from people, catches bots. Real submissions leave it empty. */}
            <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            <div className="mt-6 space-y-5">
              <Field id="fullName" label={tr("Full name", "Jina kamili")} error={errors.fullName}>
                <input id="fullName" autoComplete="name" value={f.fullName} onChange={set("fullName")} className={inputClass(!!errors.fullName)} placeholder={tr("e.g. Amina Mwakyusa", "mfano Amina Mwakyusa")} {...err("fullName")} />
              </Field>
              <Field id="company" label={tr("Company", "Kampuni")} error={errors.company}>
                <input id="company" autoComplete="organization" value={f.company} onChange={set("company")} className={inputClass(!!errors.company)} placeholder={tr("e.g. Safari Bora Coaches", "mfano Safari Bora Coaches")} {...err("company")} />
              </Field>
              <Field id="email" label={tr("Work email", "Barua pepe ya kazini")} error={errors.email}>
                <input id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} className={inputClass(!!errors.email)} placeholder={tr("name@company.co.tz", "jina@kampuni.co.tz")} {...err("email")} />
              </Field>
              <Field id="phone" label={tr("Phone number", "Namba ya simu")} error={errors.phone}>
                <div className="flex gap-2">
                  {COUNTRY_CODES.length > 1 ? (
                    <>
                      <label htmlFor="countryCode" className="sr-only">
                        {tr("Country code", "Msimbo wa nchi")}
                      </label>
                      <select id="countryCode" value={f.countryCode} onChange={set("countryCode")} className={cn(inputClass(), "w-[7.5rem] flex-shrink-0 px-2")}>
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code === f.countryCode ? c.code : c.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className={cn(inputClass(), "flex w-[5.5rem] flex-shrink-0 items-center justify-center font-medium text-[#0B1B3F]")}>
                      {COUNTRY_CODES[0].code}
                    </span>
                  )}
                  <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={f.phone} onChange={set("phone")} className={inputClass(!!errors.phone)} placeholder="712 345 678" {...err("phone")} />
                </div>
              </Field>
              <Field id="agents" label={tr("Number of agents who answer calls", "Idadi ya wahudumu wanaopokea simu")} error={errors.agents}>
                <select id="agents" value={f.agents} onChange={set("agents")} className={inputClass(!!errors.agents)} {...err("agents")}>
                  <option value="">{tr("Select number of agents", "Chagua idadi ya wahudumu")}</option>
                  {AGENT_COUNTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="improve" label={tr("What do you want to improve?", "Unataka kuboresha nini?")} error={errors.improve}>
                <textarea
                  id="improve"
                  rows={4}
                  value={f.improve}
                  onChange={set("improve")}
                  className={inputClass(!!errors.improve)}
                  placeholder={tr(
                    "e.g. We miss booking calls in the morning rush and don't know who followed up.",
                    "mfano Tunakosa simu za kukata tiketi wakati wa msongamano wa asubuhi na hatujui nani alifuatilia.",
                  )}
                  {...err("improve")}
                />
              </Field>
              <Field id="referral" label={tr("How did you hear about us?", "Ulitujuaje?")} optional>
                <select id="referral" value={f.referral} onChange={set("referral")} className={inputClass()}>
                  <option value="">{tr("Select an option", "Chagua moja")}</option>
                  {/* Value stays English for the lead record; only the label is localised. */}
                  {REFERRAL_SOURCES.map((r, i) => (
                    <option key={r} value={r}>
                      {REFERRAL_LABELS[i] ?? r}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {state === "failed" && (
              <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-[#F3B8B2] bg-[#FEF3F2] p-4 text-sm text-[#7A271A]">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{tr("We couldn't send your request.", "Hatukuweza kutuma ombi lako.")}</p>
                  <p className="mt-0.5">
                    {tr(
                      `Your details are still here. Check your connection and try again, or WhatsApp ${SUPPORT.phoneDisplay}.`,
                      `Taarifa zako bado zipo hapa. Angalia mtandao wako na ujaribu tena, au tuma WhatsApp kwa ${SUPPORT.phoneDisplay}.`,
                    )}
                  </p>
                  <button type="button" onClick={() => submit()} className={cn("mt-2 font-semibold underline", focusRing)}>
                    {tr("Try again", "Jaribu tena")}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className={cn(
                "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3.5 text-base font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-70",
                focusRing,
              )}
            >
              {state === "sending" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {state === "sending" ? tr("Sending…", "Inatuma…") : tr("Request a demo", "Omba onyesho")}
            </button>
            <p className="mt-3 text-center text-xs text-[#5B6575]">
              {tr("We use these details only to arrange your demo. See our", "Tunatumia taarifa hizi kupanga onyesho lako tu. Soma")}{" "}
              <a href="/privacy" className="underline">
                {tr("privacy notice", "taarifa yetu ya faragha")}
              </a>
              .
            </p>
          </form>
        </section>
      </div>
    </SitePage>
  );
}

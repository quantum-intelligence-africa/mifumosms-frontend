// "Need help? Call us": a floating button on the landing page. It opens a small card with two ways to reach SENDA's own call center:
// call from the browser (when the number takes web calls) or from a phone. The number and the browser link come from the server, so the
// button follows what SENDA staff set in the admin portal and hides itself when no help number is set.
import { useEffect, useState } from "react";
import { Copy, Globe, Headphones, Phone, X } from "lucide-react";
import { voiceApi } from "@/services/voiceApi";
import { appLanguage } from "@/utils/appLocale";

const TEXT = {
  sw: {
    button: "Unahitaji msaada? Piga simu",
    title: "Jaribu huduma yetu ya simu",
    intro: "Piga simu sasa na ujionee jinsi kituo chetu cha simu kinavyofanya kazi, bila kusubiri.",
    web: "Piga simu kutoka kwenye kivinjari",
    webHint: "Hakuna haja ya simu. Tumia kipaza sauti cha kompyuta au simu yako.",
    phone: "Piga kwa simu yako",
    copy: "Nakili namba",
    copied: "Imenakiliwa",
    close: "Funga",
  },
  en: {
    button: "Need help? Call us",
    title: "Try our call center",
    intro: "Call now and hear how our call center works, with no waiting.",
    web: "Call from your browser",
    webHint: "No phone needed. Use your computer's or phone's microphone.",
    phone: "Call from your phone",
    copy: "Copy number",
    copied: "Copied",
    close: "Close",
  },
} as const;

/** "+255699997919" -> "0699 997 919" (how a Tanzanian number is read aloud and dialed locally). */
function local(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) return `0${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  return phone;
}

export function HelpCallButton() {
  const T = TEXT[appLanguage()];
  const [info, setInfo] = useState<{ phone: string; web_path: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    void voiceApi.get<{ phone: string; web_path: string }>("/voice/public/help-call/").then((res) => {
      if (alive && res.success && res.data?.phone) setInfo(res.data);
    });
    return () => { alive = false; };
  }, []);

  if (!info) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div role="dialog" aria-label={T.title} className="w-[min(92vw,22rem)] rounded-2xl border bg-white p-4 text-slate-900 shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{T.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{T.intro}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={T.close} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {info.web_path && (
              <a href={info.web_path} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl border p-3 hover:bg-slate-50">
                <Globe className="mt-0.5 h-5 w-5 text-blue-600" />
                <span>
                  <span className="block text-sm font-medium">{T.web}</span>
                  <span className="block text-xs text-slate-500">{T.webHint}</span>
                </span>
              </a>
            )}
            <div className="flex items-center gap-2 rounded-xl border p-3">
              <a href={`tel:${info.phone}`} className="flex flex-1 items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-blue-600" />
                <span>
                  <span className="block text-sm font-medium">{T.phone}</span>
                  <span className="block text-base font-semibold tracking-wide">{local(info.phone)}</span>
                </span>
              </a>
              <button
                type="button"
                aria-label={T.copy}
                title={T.copy}
                className="rounded p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => { void navigator.clipboard?.writeText(info.phone); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              >
                {copied ? <span className="text-xs text-green-700">{T.copied}</span> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <Headphones className="h-5 w-5" />{T.button}
      </button>
    </div>
  );
}

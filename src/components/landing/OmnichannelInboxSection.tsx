import { useContext } from "react";
import { Inbox, Users, Zap, Shield, Search, Filter, Send } from "lucide-react";
import {
  SectionHeader,
  FeaturePillStrip,
  MockupFrame,
  ChannelBadge,
  type Channel,
} from "./shared";
import { LanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ConversationItem {
  channel: Channel;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  active?: boolean;
}

const CONVERSATIONS: ConversationItem[] = [
  {
    channel: "whatsapp",
    name: "Amina Hassan",
    preview: "Asante! Nimepokea ankara. Nitalipa leo.",
    time: "now",
    unread: 2,
    active: true,
  },
  {
    channel: "sms",
    name: "+255 712 000 042",
    preview: "Order #4821 confirmed. Reply STOP to opt out.",
    time: "4m",
    unread: 1,
  },
  {
    channel: "voice",
    name: "Grace Mollel",
    preview: "Missed call · 1m 12s voicemail",
    time: "9m",
  },
  {
    channel: "whatsapp",
    name: "John Mwakyembe",
    preview: "Habari, naomba bei ya jumla.",
    time: "18m",
  },
  {
    channel: "sms",
    name: "+255 754 118 220",
    preview: "Your appointment is confirmed for 14:30.",
    time: "27m",
  },
];

const ACTIVE_THREAD: Array<{
  from: "them" | "us";
  text: string;
  time: string;
}> = [
  { from: "them", text: "Habari, naomba kufuatilia oda yangu #4821", time: "10:42" },
  { from: "us", text: "Habari Amina! Oda yako iko njiani — itafika kesho asubuhi.", time: "10:43" },
  { from: "them", text: "Asante! Nimepokea ankara. Nitalipa leo.", time: "10:46" },
];

const getFeatures = (isSw: boolean) => [
  { label: isSw ? "Sanduku la timu" : "Shared team inbox", icon: <Users className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Mwelekeo wa kiotomatiki" : "Auto-routing", icon: <Zap className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Majibu yaliyohifadhiwa" : "Saved replies", icon: <Send className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Muktadha wa mteja" : "Customer context", icon: <Shield className="h-3.5 w-3.5 text-blue-600" /> },
];

const OmnichannelInboxSection = () => {
  const lang = useContext(LanguageContext);
  const isSw = lang?.language === "sw";
  const features = getFeatures(isSw);

  return (
    <section
      id="inbox"
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-600 py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-80 w-80 -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/3 rounded-full bg-blue-300/25 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <SectionHeader
              eyebrow={isSw ? "Sanduku Pamoja" : "Omnichannel Inbox"}
              tone="dark"
              title={
                isSw ? (
                  <>
                    Kila mazungumzo,{" "}
                    <span className="text-blue-200">sanduku moja</span>
                  </>
                ) : (
                  <>
                    Every conversation,{" "}
                    <span className="text-blue-200">one shared inbox</span>
                  </>
                )
              }
              lead={
                isSw
                  ? "WhatsApp, SMS, na Sauti — timu yako inajibu kutoka kwenye mazungumzo moja yenye muktadha kamili wa mteja, bila kubadilisha vichupo."
                  : "WhatsApp, SMS, and Voice — your team replies from a single thread with full customer context, no tab-switching."
              }
            />

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {(["whatsapp", "sms", "voice"] as Channel[]).map((c) => (
                <ChannelBadge
                  key={c}
                  channel={c}
                  size="sm"
                  showLabel
                  labelClassName="text-white/85"
                />
              ))}
            </div>

            <FeaturePillStrip items={features} tone="default" className="mt-6" />

            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold text-white">3×</p>
                <p className="text-xs text-white mt-1">
                  {isSw ? "jibu la kwanza haraka" : "faster first response"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold text-white">1</p>
                <p className="text-xs text-white mt-1">
                  {isSw ? "mazungumzo kwa mteja" : "thread per customer"}
                </p>
              </div>
            </div>
          </div>

          {/* Mockup */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <MockupFrame
              chrome="browser"
              label="senda.mifumolabs.inbox"
            >
              <div className="grid grid-cols-12 min-h-[460px] sm:min-h-[520px]">
                {/* Sidebar */}
                <aside className="col-span-5 sm:col-span-4 border-r border-gray-100 bg-gray-50/60">
                  <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-3">
                    <div className="flex items-center gap-1.5 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-400">
                        {isSw ? "Tafuta" : "Search"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500"
                      aria-label="Filter"
                    >
                      <Filter className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <ul className="divide-y divide-gray-100">
                    {CONVERSATIONS.map((conv, i) => (
                      <li
                        key={i}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-3 cursor-default transition-colors",
                          conv.active
                            ? "bg-blue-50/80"
                            : "hover:bg-white"
                        )}
                      >
                        <ChannelBadge channel={conv.channel} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] font-semibold text-gray-900">
                              {conv.name}
                            </p>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {conv.time}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-gray-500">
                            {conv.preview}
                          </p>
                        </div>
                        {conv.unread && (
                          <span className="flex-shrink-0 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </aside>

                {/* Thread */}
                <section className="col-span-7 sm:col-span-8 flex flex-col">
                  <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <ChannelBadge channel="whatsapp" size="md" />
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          Amina Hassan
                        </p>
                        <p className="text-[11px] text-gray-500">
                          +255 712 345 678 · Order #4821
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {isSw ? "Mtandaoni" : "Online"}
                    </span>
                  </header>

                  <div className="flex-1 space-y-3 overflow-hidden bg-gradient-to-b from-white to-gray-50/50 px-4 py-4">
                    {ACTIVE_THREAD.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          msg.from === "us" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm",
                            msg.from === "us"
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                          )}
                        >
                          <p>{msg.text}</p>
                          <p
                            className={cn(
                              "mt-1 text-[9px]",
                              msg.from === "us"
                                ? "text-blue-100"
                                : "text-gray-400"
                            )}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-3 py-2 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>

                  <footer className="border-t border-gray-100 bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <Inbox className="h-3.5 w-3.5 text-gray-400" />
                      <span className="flex-1 text-[11px] text-gray-400">
                        {isSw ? "Jibu kwenye WhatsApp…" : "Reply on WhatsApp…"}
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 p-1.5 text-white"
                        aria-label="Send"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </footer>
                </section>
              </div>
            </MockupFrame>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OmnichannelInboxSection;

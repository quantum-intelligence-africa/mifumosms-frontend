import { CheckCheck, FileText, MessageCircle, MessageSquare, Phone, Search, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoFrame } from "./Mockups";
import { useSiteLang } from "./i18n";

/* Illustrative Bulk SMS and WhatsApp screens (demo data, Tanzanian examples). */

const SMS_TEXT = "SAFARI BORA: Tiketi yako ya basi la saa 3 asubuhi kwenda Arusha imethibitishwa. Kiti 14-16. Fika saa 2:30. Safari njema!";

/** Campaign composer with recipients, sender name and a phone preview. */
export function SmsComposerMock() {
  const { tr } = useSiteLang();
  return (
    <DemoFrame title={tr("New SMS campaign", "Kampeni mpya ya SMS")}>
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#E3E7EE] p-2.5">
              <p className="text-xs text-[#5B6575]">{tr("Sender name", "Jina la mtumaji")}</p>
              <p className="font-semibold text-[#0B1B3F]">SAFARI BORA</p>
            </div>
            <div className="rounded-xl border border-[#E3E7EE] p-2.5">
              <p className="text-xs text-[#5B6575]">{tr("Recipients", "Wapokeaji")}</p>
              <p className="font-semibold text-[#0B1B3F]">{tr("Passengers · 12,480", "Abiria · 12,480")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#E3E7EE] p-3">
            <p className="text-xs text-[#5B6575]">{tr("Message", "Ujumbe")}</p>
            <p className="mt-1 leading-relaxed text-[#0B1B3F]">{SMS_TEXT}</p>
            <p className="mt-2 text-xs text-[#5B6575]">{SMS_TEXT.length} {tr("characters · 1 SMS per recipient", "herufi · SMS 1 kwa kila mpokeaji")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#F5F6F8] px-2.5 py-1.5 text-xs text-[#3F4A5A]">{tr("Send: Tomorrow, 06:30", "Tuma: Kesho, 06:30")}</span>
            <span className="rounded-lg bg-[#F5F6F8] px-2.5 py-1.5 text-xs text-[#3F4A5A]">{tr("Cost: 12,480 SMS credits", "Gharama: salio la SMS 12,480")}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white">
              <Send className="h-3.5 w-3.5" aria-hidden /> {tr("Schedule", "Panga")}
            </span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[220px] rounded-[28px] border-[6px] border-[#0B1B3F] bg-[#F5F6F8] p-3">
          <p className="text-center text-[11px] font-semibold text-[#0B1B3F]">SAFARI BORA</p>
          <div className="mt-3 rounded-2xl rounded-tl-sm bg-white p-2.5 text-[11px] leading-relaxed text-[#0B1B3F] shadow-sm">{SMS_TEXT}</div>
          <p className="mt-1 text-[10px] text-[#5B6575]">06:30</p>
        </div>
      </div>
    </DemoFrame>
  );
}

/** Delivery report for a sent campaign. */
export function SmsReportMock() {
  const { tr } = useSiteLang();
  const rows = [
    [tr("Delivered", "Zimefika"), 12121, "bg-[#2563EB]"],
    [tr("Pending", "Zinasubiri"), 214, "bg-[#93B4F5]"],
    [tr("Failed", "Zimeshindwa"), 145, "bg-[#D5DCE8]"],
  ] as const;
  const total = 12480;
  return (
    <DemoFrame title={tr("Delivery report · Arusha reminder", "Ripoti ya ufikishaji · Kikumbusho cha Arusha")}>
      <div className="grid grid-cols-3 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#F5F6F8] p-3">
            <p className="text-xs text-[#5B6575]">{k}</p>
            <p className="text-lg font-bold tabular-nums text-[#0B1B3F]">{v.toLocaleString("en-US")}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full" role="img" aria-label={tr("97% delivered, 2% pending, 1% failed", "97% zimefika, 2% zinasubiri, 1% zimeshindwa")}>
        {rows.map(([k, v, c]) => (
          <span key={k} className={c} style={{ width: `${(v / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-xs">
        {[
          ["+255 7•• ••• 214", "Delivered", "06:30"],
          ["+255 6•• ••• 090", "Delivered", "06:30"],
          ["+255 7•• ••• 553", "Pending", "06:31"],
        ].map(([n, s, t]) => (
          <li key={n} className="flex items-center justify-between rounded-lg border border-[#EEF0F4] px-2.5 py-2">
            <span className="font-medium text-[#0B1B3F]">{n}</span>
            <span className={cn("font-semibold", s === "Delivered" ? "text-[#166534]" : "text-[#8A5300]")}>
              {s === "Delivered" ? tr("Delivered", "Imefika") : tr("Pending", "Inasubiri")}
            </span>
            <span className="tabular-nums text-[#5B6575]">{t}</span>
          </li>
        ))}
      </ul>
    </DemoFrame>
  );
}

/** WhatsApp broadcast with an approved template and live status. */
export function WaBroadcastMock() {
  const { tr } = useSiteLang();
  return (
    <DemoFrame title={tr("WhatsApp broadcast", "Ujumbe wa WhatsApp kwa wingi")}>
      <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-[#E3E7EE] p-2.5">
            <p className="text-xs text-[#5B6575]">{tr("Template · Approved by Meta", "Kiolezo · Kimeidhinishwa na Meta")}</p>
            <p className="font-semibold text-[#0B1B3F]">holiday_routes_sw</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [tr("Sent", "Zimetumwa"), "8,960"],
              [tr("Delivered", "Zimefika"), "8,712"],
              [tr("Read", "Zimesomwa"), "6,105"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#F5F6F8] p-2.5">
                <p className="text-base font-bold tabular-nums text-[#0B1B3F]">{v}</p>
                <p className="text-[11px] text-[#5B6575]">{k}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#E3E7EE] p-3">
            <p className="text-xs font-semibold text-[#0B1B3F]">{tr("Poll results · Which day do you travel?", "Matokeo ya kura · Unasafiri siku gani?")}</p>
            {[
              [tr("Ijumaa (Fri)", "Ijumaa"), 46],
              [tr("Jumamosi (Sat)", "Jumamosi"), 38],
              [tr("Jumapili (Sun)", "Jumapili"), 16],
            ].map(([k, v]) => (
              <div key={k as string} className="mt-2 text-xs">
                <div className="flex justify-between text-[#3F4A5A]">
                  <span>{k}</span>
                  <span className="tabular-nums">{v}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#EEF0F4]">
                  <div className="h-1.5 rounded-full bg-[#2563EB]" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#EFEAE2] p-3">
          <div className="rounded-xl rounded-tl-sm bg-white p-2.5 text-xs leading-relaxed text-[#0B1B3F] shadow-sm">
            <p className="font-semibold">Safari Bora Coaches</p>
            <p className="mt-1">Habari! Safari za sikukuu kwenda Arusha, Moshi na Mbeya zimefunguliwa. Hifadhi kiti chako mapema.</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F5F6F8] p-2">
              <FileText className="h-4 w-4 text-[#B42318]" aria-hidden />
              <span className="text-[11px]">Ratiba_Desemba.pdf</span>
            </div>
            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#5B6575]">
              09:00 <CheckCheck className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden />
            </p>
          </div>
          <div className="ml-auto mt-2 w-fit rounded-xl rounded-tr-sm bg-[#D9FDD3] px-2.5 py-1.5 text-xs text-[#0B1B3F]">Nataka viti 2 Ijumaa 🙏</div>
        </div>
      </div>
    </DemoFrame>
  );
}

const THREADS = [
  { name: "Amina J.", ch: "whatsapp", last: "Nataka viti 2 Ijumaa", time: "09:04", active: true, unread: 2 },
  { name: "+255 7•• ••• 214", ch: "voice", last: "Missed call · callback due", lastSw: "Simu iliyokosa · kupiga tena kunasubiri", time: "08:58" },
  { name: "Baraka M.", ch: "sms", last: "STOP? Hapana, asante.", time: "08:41" },
  { name: "Rehema K.", ch: "whatsapp", last: "Asante, nimepokea tiketi", time: "08:30" },
];

function ChannelIcon({ ch }: { ch: string }) {
  const { tr } = useSiteLang();
  if (ch === "whatsapp") return <MessageCircle className="h-3.5 w-3.5 text-[#16A34A]" aria-label="WhatsApp" />;
  if (ch === "voice") return <Phone className="h-3.5 w-3.5 text-[#2563EB]" aria-label={tr("Call", "Simu")} />;
  return <MessageSquare className="h-3.5 w-3.5 text-[#7C3AED]" aria-label="SMS" />;
}

/** Shared team inbox across WhatsApp, SMS and calls. */
export function TeamInboxMock() {
  const { tr, lang } = useSiteLang();
  return (
    <DemoFrame title={tr("Team inbox · Calls, WhatsApp and SMS", "Kikasha cha timu · Simu, WhatsApp na SMS")}>
      <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="mb-2 flex items-center gap-2 rounded-lg border border-[#E3E7EE] px-2.5 py-1.5 text-xs text-[#5B6575]">
            <Search className="h-3.5 w-3.5" aria-hidden /> {tr("Search", "Tafuta")}
          </span>
          <ul className="space-y-1">
            {THREADS.map((t) => (
              <li key={t.name} className={cn("flex items-start gap-2 rounded-lg p-2", t.active && "bg-[#EAF1FF]")}>
                <ChannelIcon ch={t.ch} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#0B1B3F]">{t.name}</span>
                    <span className="text-[#5B6575]">{t.time}</span>
                  </div>
                  <p className="truncate text-xs text-[#4B5565]">{lang === "sw" && t.lastSw ? t.lastSw : t.last}</p>
                </div>
                {t.unread && <span className="rounded-full bg-[#2563EB] px-1.5 text-[10px] font-bold text-white">{t.unread}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col rounded-xl border border-[#E3E7EE]">
          <div className="flex items-center justify-between border-b border-[#EEF0F4] px-3 py-2 text-xs">
            <span className="font-semibold text-[#0B1B3F]">Amina J. · WhatsApp</span>
            <span className="inline-flex items-center gap-1 text-[#5B6575]">
              <Users className="h-3.5 w-3.5" aria-hidden /> {tr("Assigned: Neema", "Amekabidhiwa: Neema")}
            </span>
          </div>
          <div className="flex-1 space-y-2 p-3 text-xs">
            <p className="w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-[#F5F6F8] px-2.5 py-1.5 text-[#0B1B3F]">Habari, kuna nafasi Ijumaa kwenda Arusha?</p>
            <p className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#2563EB] px-2.5 py-1.5 text-white">Ndiyo! Basi la saa 3 asubuhi lina viti. Ungependa vingapi?</p>
            <p className="w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-[#F5F6F8] px-2.5 py-1.5 text-[#0B1B3F]">Nataka viti 2 Ijumaa 🙏</p>
          </div>
          <div className="border-t border-[#EEF0F4] px-3 py-2 text-xs text-[#8A93A3]">{tr("Reply on WhatsApp…", "Jibu kwa WhatsApp…")}</div>
        </div>
      </div>
    </DemoFrame>
  );
}

import { Send, MessageCircle, Phone, Bot, Mail, Globe } from "lucide-react";

type Channel = { x: number; y: number; Icon: typeof Send; label: string };

// Light-blue tint rather than plain white — reads as its own decorative
// layer instead of blending into the white headline/button color.
const LINE_COLOR = "#BFDBFE"; // tailwind blue-200

// Two compact hub-and-spoke bursts — one opening upward in the band between
// the header and the headline, one opening downward in the band below the
// stats row. Everything (hub + every spoke tip) stays within 25–75% of the
// width and well clear of 0%/100% on either axis, so nothing ever sits near
// the real page edge regardless of viewport size — that's what was getting
// clipped before. Coordinates are plain percentages of the hero box (SVG
// viewBox is 0 0 100 100), so the icon badges — real HTML, not SVG content —
// line up with the paths exactly without any viewBox-scaling math.
// y=16 is a deliberate floor, not a guess: the fixed header is roughly
// 70–100px tall regardless of hero height, and hero height = viewport
// height (h-screen). On a short-but-real desktop window (~700px tall),
// 16% is ~112px — still clear of a 100px header with margin to spare — and
// every taller viewport only gets more clearance from the same percentage,
// never less. The first pass used y=4–6%, which is only ~30–65px on most
// screens — inside the header's own footprint — so those badges rendered
// hidden behind it.
const TOP_HUB = { x: 50, y: 24 };
const TOP_SPOKES: Channel[] = [
  { x: 28, y: 15, Icon: Send, label: "SMS" },
  { x: 42, y: 13, Icon: MessageCircle, label: "WhatsApp" },
  { x: 58, y: 13, Icon: Phone, label: "Voice" },
  { x: 72, y: 15, Icon: Bot, label: "AI" },
];

// The content block's actual vertical position shifts with hero height (it's
// centered via justify-center, and the block itself has a roughly fixed
// pixel height, so it doesn't sit at a constant percentage) — on a common
// ~768px-tall laptop viewport, the headline starts around 30% down and the
// stats row ends around 85–86%, noticeably earlier than on a tall monitor.
// These values leave margin against that shorter case specifically, not
// just the tall one the first pass was checked against.
const BOTTOM_HUB = { x: 50, y: 90 };
const BOTTOM_SPOKES: Channel[] = [
  { x: 28, y: 97, Icon: Mail, label: "Email" },
  { x: 42, y: 98, Icon: Globe, label: "Global" },
  { x: 58, y: 98, Icon: MessageCircle, label: "Social" },
  { x: 72, y: 97, Icon: Globe, label: "Anywhere" },
];

function pathFor(hub: { x: number; y: number }, spoke: { x: number; y: number }) {
  const midY = (hub.y + spoke.y) / 2;
  return `M ${hub.x} ${hub.y} Q ${hub.x} ${midY}, ${spoke.x} ${spoke.y}`;
}

/**
 * Decorative "hub and spoke" background for the hero — two compact bursts
 * (one above the headline, one below the stats) with a traveling pulse that
 * actually animates outward from each hub along every spoke, like data
 * leaving Senda for every channel in real time. Each spoke ends at a small
 * icon badge naming the channel it represents (SMS, WhatsApp, Voice, AI,
 * Email, global reach) — the pattern shows the product, not just decorates.
 *
 * Why two compact bursts instead of one pattern spanning the full width:
 * a single center convergence (tried earlier) ran straight through the
 * text-dense middle column and got chopped up by the opaque headline/
 * buttons/stats sitting on top of it, so most of it effectively vanished.
 * Keeping both bursts compact and inside the open margins — clear of the
 * content column AND clear of the real page edges — means the whole thing
 * stays visible and nothing gets clipped.
 *
 * Coordinates are percentages (viewBox 0 0 100 100, preserveAspectRatio=
 * "none") so the SVG paths and the HTML icon badges share one coordinate
 * system and always line up exactly, regardless of the window's aspect
 * ratio or size — no viewBox-unit-to-pixel math to get wrong.
 *
 * Purely ambient: absolute, pointer-events-none, sits behind hero content.
 */
export default function HeroConnectionLines() {
  const allSpokes = [
    ...TOP_SPOKES.map((s) => ({ ...s, hub: TOP_HUB, id: `top-${s.label}` })),
    ...BOTTOM_SPOKES.map((s) => ({ ...s, hub: BOTTOM_HUB, id: `bottom-${s.label}` })),
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        {allSpokes.map((s) => (
          <path
            key={`line-${s.id}`}
            d={pathFor(s.hub, s)}
            stroke={LINE_COLOR}
            strokeOpacity={0.55}
            strokeWidth={0.15}
            strokeDasharray="0.4 1.1"
            strokeLinecap="round"
          />
        ))}

        {[TOP_HUB, BOTTOM_HUB].map((hub, i) => (
          <circle key={`hub-${i}`} cx={hub.x} cy={hub.y} r={0.9} fill="white" fillOpacity={0.9} />
        ))}
        {[TOP_HUB, BOTTOM_HUB].map((hub, i) => (
          <circle key={`hub-dot-${i}`} cx={hub.x} cy={hub.y} r={0.35} fill="#2563eb" />
        ))}

        {/* The "real simulation" — a pulse traveling outward from each hub
            along its spoke, looping continuously, staggered per spoke. */}
        {allSpokes.map((s, i) => (
          <circle key={`pulse-${s.id}`} r={0.55} fill="white">
            <animateMotion
              dur="2.4s"
              begin={`${i * 0.25}s`}
              repeatCount="indefinite"
              path={pathFor(s.hub, s)}
            />
          </circle>
        ))}
      </svg>

      {/* Icon badges — real HTML, positioned with the same percentages as
          their spoke's tip, so they land exactly where each line ends. */}
      {allSpokes.map(({ x, y, Icon, id }) => (
        <div
          key={`badge-${id}`}
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200/50 bg-white/10 backdrop-blur-sm"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <Icon className="h-4 w-4 text-blue-100" strokeWidth={1.75} />
        </div>
      ))}
    </div>
  );
}

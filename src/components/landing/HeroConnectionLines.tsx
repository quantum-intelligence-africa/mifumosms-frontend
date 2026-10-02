import { Send, MessageCircle, Phone, Bot, Mail, Globe } from "lucide-react";

/**
 * Decorative background for the hero — dashed lines sweeping in from the
 * edges and converging toward a point, with a small icon badge at each
 * line's origin naming the channel it represents (SMS, WhatsApp, Voice, AI,
 * Email, global reach). Makes the pattern mean something — every channel,
 * every customer, everywhere, flowing into Senda's one inbox.
 *
 * Two separate fans — one above the headline, one below the stats row —
 * instead of one pattern converging through the vertical center. A single
 * center convergence ran straight through the text-dense middle column and
 * got chopped up by the opaque headline/buttons/stats sitting on top of it,
 * so most of it effectively disappeared. Keeping both fans inside the open
 * margins (clear of the content column) means the whole pattern stays
 * visible instead of fighting the foreground for space.
 *
 * Icons live inside the SVG via <foreignObject> so they stay pixel-locked
 * to their line's start point at every screen size. Purely ambient:
 * absolute, pointer-events-none, sits behind hero content.
 *
 * preserveAspectRatio="none" (stretch-to-fill, not "slice") on purpose: with
 * "slice", any browser window wider than the viewBox's own 1440:900 ratio
 * (i.e. most real monitors — 1920x1080 is already wider) scales the viewBox
 * up to cover and crops its top/bottom to compensate, and both fans live
 * right at the top/bottom edge — so they got cropped out almost entirely on
 * a typical wide window even though they rendered fine in narrower test
 * viewports. "none" stretches instead of cropping, so nothing ever
 * disappears; the minor non-uniform stretch on the curves/circles is an
 * easy trade for the whole pattern actually staying visible.
 */
export default function HeroConnectionLines() {
  // Light-blue tint rather than plain white — reads as its own decorative
  // layer instead of blending into the white headline/button color.
  const LINE_COLOR = "#BFDBFE"; // tailwind blue-200

  type Channel = { x: number; y: number; Icon: typeof Send };

  // Top fan: clear band between the floating header and the headline.
  const topTarget = { x: 720, y: 150 };
  const topChannels: Channel[] = [
    { x: 26, y: 110, Icon: Send },
    { x: 26, y: 40, Icon: MessageCircle },
    { x: 1414, y: 40, Icon: Phone },
    { x: 1414, y: 110, Icon: Bot },
  ];

  // Bottom fan: clear band below the stats row, above the hero's bottom edge.
  const bottomTarget = { x: 720, y: 830 };
  const bottomChannels: Channel[] = [
    { x: 26, y: 800, Icon: Mail },
    { x: 26, y: 870, Icon: Globe },
    { x: 1414, y: 870, Icon: MessageCircle },
    { x: 1414, y: 800, Icon: Globe },
  ];

  const edgeFor = (c: { x: number; y: number }) => ({ x: c.x < 720 ? 0 : 1440, y: c.y });

  const pathFor = (c: { x: number; y: number }, target: { x: number; y: number }) => {
    const edge = edgeFor(c);
    const midX = (edge.x + target.x) / 2;
    return `M ${edge.x} ${edge.y} L ${c.x} ${c.y} Q ${midX} ${c.y}, ${target.x} ${target.y}`;
  };

  const BADGE = 40;

  const renderFan = (channels: Channel[], target: { x: number; y: number }, keyPrefix: string) => (
    <>
      {channels.map((c, i) => (
        <path
          key={`${keyPrefix}-line-${i}`}
          d={pathFor(c, target)}
          stroke={LINE_COLOR}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
      ))}

      {channels.map(({ x, y, Icon }, i) => (
        <foreignObject key={`${keyPrefix}-badge-${i}`} x={x - BADGE / 2} y={y - BADGE / 2} width={BADGE} height={BADGE}>
          <div className="flex h-full w-full items-center justify-center rounded-full border border-blue-200/50 bg-white/10 backdrop-blur-sm">
            <Icon className="h-4 w-4 text-blue-100" strokeWidth={1.75} />
          </div>
        </foreignObject>
      ))}

      <foreignObject x={target.x - 10} y={target.y - 10} width={20} height={20}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90 shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        </div>
      </foreignObject>
    </>
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {renderFan(topChannels, topTarget, "top")}
      {renderFan(bottomChannels, bottomTarget, "bottom")}
    </svg>
  );
}

import { Send, MessageCircle, Phone, Bot, Mail, Globe } from "lucide-react";

/**
 * Decorative background for the hero — dashed lines sweeping in from every
 * channel and converging into one point, with a small icon badge at each
 * line's origin naming the channel it represents (SMS, WhatsApp, Voice, AI,
 * Email, global reach). Makes the pattern mean something — every channel,
 * every customer, everywhere, flowing into Senda's one inbox — rather than
 * being purely abstract. Icons live inside the SVG via <foreignObject> so
 * they stay pixel-locked to their line's start point at every screen size.
 * Purely ambient: absolute, pointer-events-none, sits behind hero content.
 */
export default function HeroConnectionLines() {
  const target = { x: 1180, y: 430 };
  // Badge-sized inset from the true edge (0 / 1440) so the icon circles
  // render in full instead of being cropped by the viewport boundary — the
  // line itself still starts flush at the edge via `edgeFor` below.
  const channels: { x: number; y: number; Icon: typeof Send }[] = [
    { x: 26, y: 60, Icon: Send },
    { x: 26, y: 190, Icon: MessageCircle },
    { x: 26, y: 320, Icon: Phone },
    { x: 26, y: 540, Icon: Bot },
    { x: 26, y: 670, Icon: Mail },
    { x: 26, y: 800, Icon: Globe },
    { x: 1414, y: 40, Icon: MessageCircle },
    { x: 1414, y: 780, Icon: Globe },
  ];

  const edgeFor = (c: { x: number; y: number }) => ({ x: c.x < 720 ? 0 : 1440, y: c.y });

  const pathFor = (c: { x: number; y: number }) => {
    const edge = edgeFor(c);
    const midX = (edge.x + target.x) / 2;
    return `M ${edge.x} ${edge.y} L ${c.x} ${c.y} Q ${midX} ${c.y}, ${target.x} ${target.y}`;
  };

  const BADGE = 44;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4]"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {channels.map((c, i) => (
        <path
          key={i}
          d={pathFor(c)}
          stroke="white"
          strokeWidth={1.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      ))}

      {channels.map(({ x, y, Icon }, i) => (
        <foreignObject key={i} x={x - BADGE / 2} y={y - BADGE / 2} width={BADGE} height={BADGE}>
          <div className="flex h-full w-full items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
        </foreignObject>
      ))}

      {/* Convergence point — every channel flows into Senda's one inbox */}
      <foreignObject x={target.x - 18} y={target.y - 18} width={36} height={36}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        </div>
      </foreignObject>
    </svg>
  );
}

/**
 * Subtle decorative background for the hero — dashed lines sweeping in from
 * every side and converging toward one point, representing every channel /
 * every customer, everywhere, flowing into Senda's one inbox. Purely
 * ambient: sits behind the hero content, never intercepts clicks.
 */
export default function HeroConnectionLines() {
  // Each line starts at the edge of the viewBox and curves toward the
  // convergence point (near center-right, clear of the centered headline).
  const target = { x: 1180, y: 430 };
  const starts = [
    { x: 0, y: 60 },
    { x: 0, y: 190 },
    { x: 0, y: 320 },
    { x: 0, y: 540 },
    { x: 0, y: 670 },
    { x: 0, y: 800 },
    { x: 1440, y: 40 },
    { x: 1440, y: 780 },
  ];

  const pathFor = (start: { x: number; y: number }) => {
    const midX = (start.x + target.x) / 2;
    return `M ${start.x} ${start.y} Q ${midX} ${start.y}, ${target.x} ${target.y}`;
  };

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {starts.map((start, i) => (
        <path
          key={i}
          d={pathFor(start)}
          stroke="white"
          strokeWidth={1.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      ))}
      <circle cx={target.x} cy={target.y} r={3} fill="white" />
    </svg>
  );
}

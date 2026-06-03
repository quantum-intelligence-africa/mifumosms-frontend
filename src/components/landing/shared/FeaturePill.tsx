import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FeaturePillProps {
  label: string;
  icon?: React.ReactNode;
  tone?: "default" | "blue" | "soft";
  className?: string;
}

export const FeaturePill = ({
  label,
  icon,
  tone = "default",
  className,
}: FeaturePillProps) => {
  const tones = {
    default:
      "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700",
    blue: "bg-blue-50 border border-blue-200 text-blue-700 hover:border-blue-400",
    soft: "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-colors duration-200 whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      <span className="flex-shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon ?? <Check className="h-3.5 w-3.5 text-blue-600" />}
      </span>
      {label}
    </span>
  );
};

interface FeaturePillStripProps {
  items: Array<{ label: string; icon?: React.ReactNode }>;
  tone?: FeaturePillProps["tone"];
  className?: string;
}

export const FeaturePillStrip = ({
  items,
  tone,
  className,
}: FeaturePillStripProps) => (
  <div className={cn("flex flex-wrap gap-2", className)}>
    {items.map((item, i) => (
      <FeaturePill key={i} label={item.label} icon={item.icon} tone={tone} />
    ))}
  </div>
);

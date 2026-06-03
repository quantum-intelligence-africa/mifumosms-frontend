import { cn } from "@/lib/utils";
import { MessageSquare, Phone } from "lucide-react";

export type Channel = "whatsapp" | "facebook" | "instagram" | "sms" | "voice";

interface ChannelBadgeProps {
  channel: Channel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  /** Override the default label color (text-gray-700). Useful on dark backgrounds. */
  labelClassName?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-6 w-6", icon: "h-3 w-3", text: "text-[10px]" },
  md: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-xs" },
  lg: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-sm" },
};

const channelMeta: Record<
  Channel,
  { label: string; bg: string; ring: string }
> = {
  whatsapp: { label: "WhatsApp", bg: "bg-[#25D366]", ring: "ring-[#25D366]/30" },
  facebook: { label: "Facebook", bg: "bg-[#1877F2]", ring: "ring-[#1877F2]/30" },
  instagram: {
    label: "Instagram",
    bg: "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]",
    ring: "ring-[#d62976]/30",
  },
  sms: { label: "SMS", bg: "bg-blue-600", ring: "ring-blue-600/30" },
  voice: { label: "Voice", bg: "bg-emerald-600", ring: "ring-emerald-600/30" },
};

const ChannelGlyph = ({
  channel,
  className,
}: {
  channel: Channel;
  className?: string;
}) => {
  if (channel === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
      </svg>
    );
  }
  if (channel === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    );
  }
  if (channel === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (channel === "voice") {
    return <Phone className={className} />;
  }
  return <MessageSquare className={className} />;
};

export const ChannelBadge = ({
  channel,
  size = "md",
  showLabel = false,
  labelClassName,
  className,
}: ChannelBadgeProps) => {
  const s = sizeMap[size];
  const meta = channelMeta[channel];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-full text-white ring-2",
          s.box,
          meta.bg,
          meta.ring
        )}
        aria-label={meta.label}
      >
        <ChannelGlyph channel={channel} className={s.icon} />
      </span>
      {showLabel && (
        <span
          className={cn(
            "font-medium",
            s.text,
            labelClassName ?? "text-gray-700"
          )}
        >
          {meta.label}
        </span>
      )}
    </span>
  );
};

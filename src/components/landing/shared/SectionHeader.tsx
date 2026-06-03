import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  /** "dark" inverts the title/lead colors for use on dark backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

export const SectionHeader = ({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className,
}: SectionHeaderProps) => {
  const isCenter = align === "center";
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        "max-w-2xl",
        isCenter && "mx-auto text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 mb-4",
          isCenter && "justify-center"
        )}
      >
        <span className={cn("h-px w-6", isDark ? "bg-blue-400" : "bg-blue-600")} />
        <p
          className={cn(
            "text-xs font-semibold tracking-[0.18em] uppercase",
            isDark ? "text-blue-300" : "text-blue-600"
          )}
        >
          {eyebrow}
        </p>
      </div>
      <h2
        className={cn(
          "font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1]",
          isDark ? "text-white" : "text-gray-900"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-5 text-base sm:text-lg leading-relaxed",
            isDark ? "text-white" : "text-gray-600"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
};

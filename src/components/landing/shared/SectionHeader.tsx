import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  /** "dark" inverts the title/lead colors for use on dark backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

export const SectionHeader = ({
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
      <h2
        className={cn(
          "font-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight",
          isDark ? "text-white" : "text-gray-900"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
            isDark ? "text-white" : "text-gray-600"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
};

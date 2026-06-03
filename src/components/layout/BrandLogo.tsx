import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Tailwind size classes, e.g. "w-8 h-8 sm:w-10 sm:h-10". */
  className?: string;
  alt?: string;
  /** When true, hint the browser to load eagerly (above-the-fold logos). */
  eager?: boolean;
}

/**
 * Senda brand mark — used in the app sidebar, the marketing site header/footer,
 * auth pages, and any other surface that previously rendered the
 * blue-square + MessageSquare placeholder.
 */
export function BrandLogo({ className, alt = "Senda", eager = true }: BrandLogoProps) {
  return (
    <img
      src="/Senda%20Asset.1.3.png"
      alt={alt}
      className={cn("object-contain flex-shrink-0 select-none", className)}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

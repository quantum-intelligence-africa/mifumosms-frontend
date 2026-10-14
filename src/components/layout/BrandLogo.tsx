import { cn } from "@/lib/utils";
import { useBranding } from "@/contexts/BrandingContext";

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
  // An organization with published white-label branding shows its own logo;
  // everyone else keeps the SENDA mark.
  const brand = useBranding();
  const custom = brand.branded && brand.logo_url ? brand.logo_url : null;
  return (
    <img
      src={custom ?? "/Senda%20Asset.1.3.png"}
      alt={custom ? brand.display_name || alt : alt}
      className={cn("object-contain flex-shrink-0 select-none", className)}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

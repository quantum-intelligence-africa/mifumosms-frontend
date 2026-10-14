import { cn } from "@/lib/utils";
import { useBranding } from "@/contexts/BrandingContext";

interface BrandLogoProps {
  /** Tailwind size classes, e.g. "w-8 h-8 sm:w-10 sm:h-10". */
  className?: string;
  alt?: string;
  /** When true, hint the browser to load eagerly (above-the-fold logos). */
  eager?: boolean;
  /** Hero-size box for a custom logo (e.g. the white-label sign-in panel). */
  large?: boolean;
}

// The stock SENDA mark has built-in padding, so call sites size it with a tall height and negative
// margins to pull the wordmark closer. An uploaded logo has no such padding: those same classes make
// it huge and overlap the text beside it. For a custom logo, drop sizing and margin classes and use a
// compact, consistent box instead.
const SIZE_OR_MARGIN = /(^|:)(-?m[trblxy]?-|-?[hw]-|size-)/;

/**
 * Senda brand mark — used in the app sidebar, the marketing site header/footer,
 * auth pages, and any other surface that previously rendered the
 * blue-square + MessageSquare placeholder.
 */
export function BrandLogo({ className, alt = "Senda", eager = true, large = false }: BrandLogoProps) {
  // An organization with published white-label branding shows its own logo;
  // everyone else keeps the SENDA mark.
  const brand = useBranding();
  const custom = brand.branded && brand.logo_url ? brand.logo_url : null;

  if (custom) {
    const kept = (className ?? "").split(/\s+/).filter((c) => c && !SIZE_OR_MARGIN.test(c)).join(" ");
    return (
      <img
        src={custom}
        alt={brand.display_name || alt}
        className={cn(
          large ? "h-24 w-24" : "h-11 w-11 sm:h-12 sm:w-12",
          "flex-shrink-0 select-none rounded-xl object-contain shadow-sm ring-1 ring-black/5",
          kept,
        )}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        draggable={false}
      />
    );
  }

  return (
    <img
      src="/Senda%20Asset.1.3.webp"
      alt={alt}
      className={cn("object-contain flex-shrink-0 select-none", className)}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

/** The product name: the organization's display name on a white-label host, otherwise "SENDA". */
export function BrandName({ fallback = "SENDA" }: { fallback?: string }) {
  const brand = useBranding();
  return <>{brand.branded && (brand.workspace_name || brand.display_name) ? brand.workspace_name || brand.display_name : fallback}</>;
}

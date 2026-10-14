import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { apiClient, type BrandingConfig, type PublicBranding } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * White-label branding. Stock SENDA Copilot unless the backend says this host
 * (before login) or this user's organization (after login) has published,
 * entitled branding. Every value arrives validated by the backend; colors are
 * only ever written as CSS custom properties and the logo as an <img src>.
 */
type Brand = Partial<BrandingConfig> & { branded: boolean };

const STOCK: Brand = { branded: false };
const BrandingContext = createContext<Brand>(STOCK);

export const useBranding = () => useContext(BrandingContext);

const BRAND_VARS = ["--primary", "--primary-hover", "--primary-dark", "--primary-light", "--sidebar-primary", "--sidebar-background"];

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hsl = (c: { h: number; s: number; l: number }, dl = 0) =>
  `${c.h} ${c.s}% ${Math.max(0, Math.min(100, c.l + dl))}%`;

function applyBrand(brand: Brand) {
  const root = document.documentElement;
  BRAND_VARS.forEach((v) => root.style.removeProperty(v));
  const primary = brand.colors?.primary && hexToHsl(brand.colors.primary);
  if (primary) {
    root.style.setProperty("--primary", hsl(primary));
    root.style.setProperty("--primary-hover", hsl(primary, -5));
    root.style.setProperty("--primary-dark", hsl(primary, -10));
    root.style.setProperty("--primary-light", hsl(primary, 10));
    root.style.setProperty("--sidebar-primary", hsl(primary));
  }
  const sidebar = brand.colors?.sidebar && hexToHsl(brand.colors.sidebar);
  if (sidebar) root.style.setProperty("--sidebar-background", hsl(sidebar));
}

const DEFAULT_TITLE = typeof document !== "undefined" ? document.title : "";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  const [hostBrand, setHostBrand] = useState<Brand>(STOCK);
  const [userBrand, setUserBrand] = useState<Brand | null>(null);

  // Before login (and on a branded host): branding for this hostname.
  useEffect(() => {
    let live = true;
    apiClient.getPublicBranding(window.location.hostname).then((b: PublicBranding) => live && setHostBrand(b));
    return () => { live = false; };
  }, []);

  // After login: the signed-in organization's own branding wins.
  useEffect(() => {
    let live = true;
    if (!isAuthenticated) { setUserBrand(null); return; }
    apiClient.getCurrentBranding().then((b: PublicBranding) => live && setUserBrand(b));
    return () => { live = false; };
  }, [isAuthenticated]);

  const brand = useMemo<Brand>(() => (isAuthenticated && userBrand ? userBrand : hostBrand), [isAuthenticated, userBrand, hostBrand]);

  useEffect(() => {
    applyBrand(brand);
    document.title = brand.branded && (brand.workspace_name || brand.display_name) ? (brand.workspace_name || brand.display_name)! : DEFAULT_TITLE;
    if (brand.branded && brand.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = brand.favicon_url;
    }
    // Branded default theme only when the person hasn't chosen one themselves.
    try {
      if (brand.branded && brand.theme && brand.theme !== "system" && !localStorage.getItem("theme-preference")) setTheme(brand.theme);
    } catch { /* storage unavailable */ }
  }, [brand, setTheme]);

  return <BrandingContext.Provider value={brand}>{children}</BrandingContext.Provider>;
}

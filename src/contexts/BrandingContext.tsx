import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

interface BrandingControls {
  /** Re-read the signed-in organization's published branding (call after publish/reset). */
  refresh: () => Promise<void>;
  /** Show an unpublished draft across the whole app (this tab only); null ends the preview. */
  setPreview: (draft: BrandingConfig | null) => void;
  previewing: boolean;
}

/** Hosts that are always the stock SENDA site, so they never wait for the branding lookup. */
const STOCK_HOSTS = new Set([
  "localhost", "127.0.0.1", "sms.mifumolabs.com", "mifumolabs.com", "www.mifumolabs.com",
  "sendacopilot.com", "www.sendacopilot.com",
]);
const isStockHost = (host: string) => STOCK_HOSTS.has(host) || host.endsWith(".netlify.app");

interface HostBranding {
  /** False until we know whether this hostname is a white-label host. */
  loaded: boolean;
  /** True when this hostname is a customer's white-label domain: show only the sign-in screen. */
  branded: boolean;
}

const BrandingContext = createContext<Brand>(STOCK);
const HostContext = createContext<HostBranding>({ loaded: true, branded: false });
const ControlsContext = createContext<BrandingControls>({ refresh: async () => {}, setPreview: () => {}, previewing: false });

export const useBranding = () => useContext(BrandingContext);
export const useBrandingControls = () => useContext(ControlsContext);
export const useHostBranding = () => useContext(HostContext);

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
  const [hostLoaded, setHostLoaded] = useState(() => isStockHost(window.location.hostname));
  const [userBrand, setUserBrand] = useState<Brand | null>(null);
  const [preview, setPreview] = useState<BrandingConfig | null>(null);

  // Before login (and on a branded host): branding for this hostname.
  useEffect(() => {
    let live = true;
    apiClient.getPublicBranding(window.location.hostname).then((b: PublicBranding) => {
      if (!live) return;
      setHostBrand(b);
      setHostLoaded(true);
    });
    return () => { live = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setUserBrand(null); return; }
    setUserBrand(await apiClient.getCurrentBranding());
  }, [isAuthenticated]);

  // After login: the signed-in organization's own branding wins.
  useEffect(() => {
    if (!isAuthenticated) { setUserBrand(null); setPreview(null); return; }
    void refresh();
  }, [isAuthenticated, refresh]);

  const brand = useMemo<Brand>(() => {
    if (isAuthenticated && preview) return { ...preview, branded: true, display_name: preview.display_name || "Preview" };
    return isAuthenticated && userBrand ? userBrand : hostBrand;
  }, [isAuthenticated, preview, userBrand, hostBrand]);
  const host = useMemo<HostBranding>(() => ({ loaded: hostLoaded, branded: hostBrand.branded }), [hostLoaded, hostBrand.branded]);
  const controls = useMemo<BrandingControls>(() => ({ refresh, setPreview, previewing: !!preview }), [refresh, preview]);

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

  return (
    <ControlsContext.Provider value={controls}>
      <HostContext.Provider value={host}>
      <BrandingContext.Provider value={brand}>
        {preview && (
          <div className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 text-xs shadow-lg">
            <span>Previewing unpublished branding</span>
            <button type="button" className="font-semibold text-primary underline" onClick={() => setPreview(null)}>Exit preview</button>
          </div>
        )}
        {children}
      </BrandingContext.Provider>
      </HostContext.Provider>
    </ControlsContext.Provider>
  );
}

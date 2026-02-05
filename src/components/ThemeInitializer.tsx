import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePreferences } from '@/hooks/usePreferences';

/**
 * ThemeInitializer Component
 * Ensures theme preference is loaded from API and applied globally
 * This component should wrap the entire app content
 */
export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { preferences, isLoading } = usePreferences();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only apply theme once when preferences load for the first time
    if (!isLoading && preferences?.theme && !hasInitialized.current) {
      setTheme(preferences.theme);
      hasInitialized.current = true;
    }
  }, [isLoading, preferences?.theme, setTheme]);

  // Show nothing while preferences are loading to avoid theme flicker
  if (isLoading) {
    return <div className="min-h-screen" />;
  }

  return <>{children}</>;
}

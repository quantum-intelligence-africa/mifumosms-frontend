/**
 * WebP Support Detection and Fallback Utilities
 * Ensures images are visible across all browsers and servers
 */

// WebP support detection - cached result
let webpSupported: boolean | null = null;

/**
 * Detects if the browser supports WebP format
 * Uses a cached result to avoid repeated checks
 */
export const supportsWebP = (): boolean => {
  if (webpSupported !== null) {
    return webpSupported;
  }

  // Create a canvas element to test WebP support
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    // Test WebP support by checking if we can create a WebP data URL
    webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } else {
    webpSupported = false;
  }

  return webpSupported;
};

/**
 * Alternative WebP detection using a small WebP image
 * This method is more reliable but requires a network request
 */
export const detectWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (webpSupported !== null) {
      resolve(webpSupported);
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupported = webP.height === 2;
      resolve(webpSupported);
    };
    // Create a minimal WebP image (2x2 transparent pixel)
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
};

/**
 * Image fallback mapping for WebP images
 * Maps WebP images to their PNG fallbacks
 */
const imageFallbacks: Record<string, string> = {
  '/mobile 1.webp': '/mobile2.png',
  '/3desktop3.webp': '/desktop.png', // Assuming desktop.png as fallback
};

/**
 * Gets the appropriate image source based on WebP support
 * @param webpSrc - The WebP image source
 * @param fallbackSrc - Optional explicit fallback (overrides automatic mapping)
 * @returns The appropriate image source
 */
export const getImageSrc = (webpSrc: string, fallbackSrc?: string): string => {
  const fallback = fallbackSrc || imageFallbacks[webpSrc];

  if (!fallback) {
    // No fallback available, return original (might still work in some cases)
    return webpSrc;
  }

  // Use WebP if supported, otherwise use fallback
  return supportsWebP() ? webpSrc : fallback;
};

/**
 * React hook for image sources with WebP fallback
 * @param webpSrc - The WebP image source
 * @param fallbackSrc - Optional explicit fallback
 * @returns Object with current image source and loading state
 */
export const useImageWithFallback = (webpSrc: string, fallbackSrc?: string) => {
  const [imageSrc, setImageSrc] = React.useState<string>(() =>
    getImageSrc(webpSrc, fallbackSrc)
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
    };
    img.onerror = () => {
      // If the current image fails to load, try the fallback
      const fallback = fallbackSrc || imageFallbacks[webpSrc];
      if (fallback && imageSrc !== fallback) {
        setImageSrc(fallback);
        setHasError(false);
        setIsLoading(true);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };
    img.src = imageSrc;
  }, [webpSrc, fallbackSrc, imageSrc]);

  return { imageSrc, isLoading, hasError };
};

// Import React for the hook (needs to be at the end to avoid circular imports)
import React from 'react';

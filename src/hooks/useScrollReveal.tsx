import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              if (triggerOnce) {
                setHasAnimated(true);
                observer.current?.unobserve(element);
              }
            }, delay);
          } else {
            setIsVisible(true);
            if (triggerOnce) {
              setHasAnimated(true);
              observer.current?.unobserve(element);
            }
          }
        } else if (!triggerOnce && !hasAnimated) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.current.observe(element);

    return () => {
      observer.current?.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay, hasAnimated]);

  return { elementRef, isVisible, hasAnimated };
};

// Hook for staggered animations
export const useStaggeredReveal = (
  itemCount: number,
  baseDelay: number = 100,
  options: Omit<ScrollRevealOptions, 'delay'> = {}
) => {
  const reveal = useScrollReveal({
    ...options,
    triggerOnce: true,
  });

  const getItemDelay = (index: number) => {
    return index * baseDelay;
  };

  const getItemClasses = (index: number) => {
    const delay = getItemDelay(index);
    return reveal.isVisible
      ? `animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both`
      : 'opacity-0 translate-y-4';
  };

  return {
    containerRef: reveal.elementRef as any,
    isVisible: reveal.isVisible,
    hasAnimated: reveal.hasAnimated,
    getItemDelay,
    getItemClasses,
  };
};
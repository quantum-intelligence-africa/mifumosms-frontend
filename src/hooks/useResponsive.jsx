import {
    useState,
    useEffect,
    useCallback
} from 'react';
import responsiveManager from '../utils/responsive';

/**
 * React hook for responsive design
 * Provides reactive responsive state and utilities
 */
export function useResponsive() {
    const [responsiveState, setResponsiveState] = useState({
        breakpoint: responsiveManager.getCurrentBreakpoint(),
        deviceType: responsiveManager.getCurrentDeviceType(),
        isTouchDevice: responsiveManager.isTouchDevice(),
        orientation: responsiveManager.getOrientation(),
        viewport: responsiveManager.getViewportDimensions(),
        scaledViewport: responsiveManager.getScaledViewportDimensions(),
        safeAreaInsets: responsiveManager.getSafeAreaInsets(),
        viewportScale: responsiveManager.getViewportScale(),
        maxWidth: responsiveManager.getViewportAwareMaxWidth()
    });

    // Update responsive state
    const updateResponsiveState = useCallback(() => {
        setResponsiveState({
            breakpoint: responsiveManager.getCurrentBreakpoint(),
            deviceType: responsiveManager.getCurrentDeviceType(),
            isTouchDevice: responsiveManager.isTouchDevice(),
            orientation: responsiveManager.getOrientation(),
            viewport: responsiveManager.getViewportDimensions(),
            scaledViewport: responsiveManager.getScaledViewportDimensions(),
            safeAreaInsets: responsiveManager.getSafeAreaInsets(),
            viewportScale: responsiveManager.getViewportScale(),
            maxWidth: responsiveManager.getViewportAwareMaxWidth()
        });
    }, []);

    useEffect(() => {
        // Add listeners for responsive changes
        responsiveManager.addListener('breakpointChange', updateResponsiveState);
        responsiveManager.addListener('resize', updateResponsiveState);
        responsiveManager.addListener('orientationChange', updateResponsiveState);

        // Cleanup listeners on unmount
        return () => {
            responsiveManager.removeListener('breakpointChange', updateResponsiveState);
            responsiveManager.removeListener('resize', updateResponsiveState);
            responsiveManager.removeListener('orientationChange', updateResponsiveState);
        };
    }, [updateResponsiveState]);

    return {
        ...responsiveState,

        // Breakpoint checks
        isBreakpoint: (breakpoint) => responsiveManager.isBreakpoint(breakpoint),
        isBreakpointAbove: (breakpoint) => responsiveManager.isBreakpointAbove(breakpoint),
        isBreakpointBelow: (breakpoint) => responsiveManager.isBreakpointBelow(breakpoint),

        // Device type checks
        isMobile: responsiveManager.isMobile(),
        isTablet: responsiveManager.isTablet(),
        isDesktop: responsiveManager.isDesktop(),
        isUltrawide: responsiveManager.isUltrawide(),

        // Orientation checks
        isPortrait: responsiveManager.isPortrait(),
        isLandscape: responsiveManager.isLandscape(),

        // Utility functions
        getResponsiveValue: (values) => responsiveManager.getResponsiveValue(values),
        getResponsiveClasses: (baseClasses) => responsiveManager.getResponsiveClasses(baseClasses),
        getResponsiveGridColumns: () => responsiveManager.getResponsiveGridColumns(),
        getResponsiveSpacing: (baseSpacing) => responsiveManager.getResponsiveSpacing(baseSpacing),
        calculateClampFontSize: (minSize, maxSize, viewportMin, viewportMax) =>
            responsiveManager.calculateClampFontSize(minSize, maxSize, viewportMin, viewportMax),
        getViewportAwareFontSize: (baseSize, scaleFactor) =>
            responsiveManager.getViewportAwareFontSize(baseSize, scaleFactor),
        getViewportAwareMaxWidth: () => responsiveManager.getViewportAwareMaxWidth()
    };
}

/**
 * Hook for responsive breakpoint detection
 */
export function useBreakpoint() {
    const {
        breakpoint,
        isBreakpoint,
        isBreakpointAbove,
        isBreakpointBelow
    } = useResponsive();

    return {
        current: breakpoint,
        is: isBreakpoint,
        isAbove: isBreakpointAbove,
        isBelow: isBreakpointBelow
    };
}

/**
 * Hook for device type detection
 */
export function useDeviceType() {
    const {
        deviceType,
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice
    } = useResponsive();

    return {
        current: deviceType,
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice
    };
}

/**
 * Hook for orientation detection
 */
export function useOrientation() {
    const {
        orientation,
        isPortrait,
        isLandscape
    } = useResponsive();

    return {
        current: orientation,
        isPortrait,
        isLandscape
    };
}

/**
 * Hook for viewport dimensions
 */
export function useViewport() {
    const {
        viewport,
        safeAreaInsets
    } = useResponsive();

    return {
        ...viewport,
        safeAreaInsets,
        aspectRatio: viewport.width / viewport.height
    };
}

/**
 * Hook for responsive values
 */
export function useResponsiveValue(values) {
    const {
        getResponsiveValue
    } = useResponsive();

    return getResponsiveValue(values);
}

/**
 * Hook for responsive classes
 */
export function useResponsiveClasses(baseClasses) {
    const {
        getResponsiveClasses
    } = useResponsive();

    return getResponsiveClasses(baseClasses);
}

/**
 * Hook for responsive grid
 */
export function useResponsiveGrid() {
    const {
        getResponsiveGridColumns,
        getResponsiveSpacing
    } = useResponsive();

    return {
        columns: getResponsiveGridColumns(),
        spacing: getResponsiveSpacing(),
        getSpacing: (baseSpacing) => getResponsiveSpacing(baseSpacing)
    };
}

/**
 * Hook for responsive typography
 */
export function useResponsiveTypography() {
    const {
        calculateClampFontSize,
        breakpoint
    } = useResponsive();

    const getFontSize = (minSize, maxSize, viewportMin = 320, viewportMax = 1920) => {
        return calculateClampFontSize(minSize, maxSize, viewportMin, viewportMax);
    };

    const getResponsiveTextSize = (sizes) => {
        const breakpointSizes = {
            xs: sizes.xs || sizes.sm || sizes.md || sizes.lg || sizes.xl || sizes['2xl'] || '14px',
            sm: sizes.sm || sizes.md || sizes.lg || sizes.xl || sizes['2xl'] || '16px',
            md: sizes.md || sizes.lg || sizes.xl || sizes['2xl'] || '18px',
            lg: sizes.lg || sizes.xl || sizes['2xl'] || '20px',
            xl: sizes.xl || sizes['2xl'] || '22px',
            '2xl': sizes['2xl'] || '24px'
        };

        return breakpointSizes[breakpoint] || '16px';
    };

    return {
        getFontSize,
        getResponsiveTextSize,
        calculateClampFontSize: getFontSize
    };
}

/**
 * Hook for responsive visibility
 */
export function useResponsiveVisibility(elementRef) {
    const [visibility, setVisibility] = useState({
        isVisible: false,
        visibilityPercentage: 0,
        isAboveViewport: false,
        isBelowViewport: false
    });

    const {
        viewport
    } = useResponsive();

    const checkVisibility = useCallback(() => {
        if (!elementRef.current) return;

        const rect = elementRef.current.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewport.height &&
            rect.right <= viewport.width
        );

        const visibilityPercentage = Math.max(0, Math.min(100,
            ((rect.bottom - Math.max(0, rect.top)) / viewport.height) * 100
        ));

        setVisibility({
            isVisible,
            visibilityPercentage,
            isAboveViewport: rect.bottom < 0,
            isBelowViewport: rect.top > viewport.height
        });
    }, [viewport.height, viewport.width]);

    useEffect(() => {
        checkVisibility();

        const handleScroll = responsiveManager.throttle(checkVisibility, 100);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [checkVisibility]);

    return visibility;
}

/**
 * Hook for responsive media queries
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event) => setMatches(event.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * Hook for responsive container queries
 */
export function useContainerQuery(containerRef, query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const checkQuery = () => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width;

            // Parse query (e.g., "(min-width: 300px)")
            const match = query.match(/\(min-width:\s*(\d+)px\)/);
            if (match) {
                const minWidth = parseInt(match[1]);
                setMatches(width >= minWidth);
            }
        };

        checkQuery();

        const resizeObserver = new ResizeObserver(checkQuery);
        resizeObserver.observe(containerRef.current);

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [query]);

    return matches;
}

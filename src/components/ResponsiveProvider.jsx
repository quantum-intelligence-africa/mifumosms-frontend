import React, { createContext, useContext, useEffect, useState } from 'react';
import responsiveManager from '../utils/responsive';

// Error boundary for responsive provider
class ResponsiveErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ResponsiveProvider Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI - just render children without responsive features
      return this.props.children;
    }

    return this.props.children;
  }
}

// Create responsive context
const ResponsiveContext = createContext();

/**
 * Responsive Provider Component
 * Provides responsive state and utilities to all child components
 */
export function ResponsiveProvider({ children }) {
  const [responsiveState, setResponsiveState] = useState(() => {
    try {
      return {
        breakpoint: responsiveManager.getCurrentBreakpoint(),
        deviceType: responsiveManager.getCurrentDeviceType(),
        isTouchDevice: responsiveManager.isTouchDevice(),
        orientation: responsiveManager.getOrientation(),
        viewport: responsiveManager.getViewportDimensions(),
        safeAreaInsets: responsiveManager.getSafeAreaInsets()
      };
    } catch (error) {
      console.error('Error initializing responsive state:', error);
      return {
        breakpoint: 'lg',
        deviceType: 'desktop',
        isTouchDevice: false,
        orientation: 'landscape',
        viewport: { width: 1024, height: 768, aspectRatio: 1024/768 },
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      };
    }
  });

  // Update responsive state
  const updateResponsiveState = () => {
    try {
      setResponsiveState({
        breakpoint: responsiveManager.getCurrentBreakpoint(),
        deviceType: responsiveManager.getCurrentDeviceType(),
        isTouchDevice: responsiveManager.isTouchDevice(),
        orientation: responsiveManager.getOrientation(),
        viewport: responsiveManager.getViewportDimensions(),
        safeAreaInsets: responsiveManager.getSafeAreaInsets()
      });
    } catch (error) {
      console.error('Error updating responsive state:', error);
    }
  };

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
  }, []);

  // Provide responsive utilities
  const responsiveUtils = {
    ...responsiveState,

    // Breakpoint checks
    isBreakpoint: (breakpoint) => responsiveManager.isBreakpoint(breakpoint),
    isBreakpointAbove: (breakpoint) => responsiveManager.isBreakpointAbove(breakpoint),
    isBreakpointBelow: (breakpoint) => responsiveManager.isBreakpointBelow(breakpoint),

    // Device type checks
    isMobile: responsiveManager.isMobile(),
    isTablet: responsiveManager.isTablet(),
    isDesktop: responsiveManager.isDesktop(),

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

    // Apply responsive styles to element
    applyResponsiveStyles: (element, styles) => responsiveManager.applyResponsiveStyles(element, styles),

    // Get responsive breakpoint classes
    getBreakpointClasses: (baseClass, breakpoints = {}) => {
      const classes = [baseClass];

      Object.entries(breakpoints).forEach(([breakpoint, className]) => {
        if (responsiveManager.isBreakpointAbove(breakpoint)) {
          classes.push(className);
        }
      });

      return classes.join(' ');
    },

    // Get responsive text size
    getResponsiveTextSize: (minSize, maxSize) => {
      return responsiveManager.calculateClampFontSize(minSize, maxSize);
    }
  };

  return (
    <ResponsiveErrorBoundary>
      <ResponsiveContext.Provider value={responsiveUtils}>
        {children}
      </ResponsiveContext.Provider>
    </ResponsiveErrorBoundary>
  );
}

/**
 * Hook to use responsive context
 */
export function useResponsiveContext() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
}

/**
 * Higher-order component for responsive behavior
 */
export function withResponsive(Component) {
  return function ResponsiveComponent(props) {
    const responsive = useResponsiveContext();
    return <Component {...props} responsive={responsive} />;
  };
}

/**
 * Responsive wrapper component
 */
export function ResponsiveWrapper({
  children,
  className = '',
  style = {},
  responsiveProps = {}
}) {
  const responsive = useResponsiveContext();

  // Get responsive classes
  const responsiveClasses = responsive.getResponsiveClasses(responsiveProps.classes || {});

  // Get responsive styles
  const responsiveStyles = responsive.getResponsiveValue(responsiveProps.styles || {});

  return (
    <div
      className={`${className} ${responsiveClasses}`}
      style={{ ...style, ...responsiveStyles }}
    >
      {children}
    </div>
  );
}

/**
 * Responsive text component
 */
export function ResponsiveText({
  children,
  className = '',
  minSize = 14,
  maxSize = 16,
  viewportMin = 320,
  viewportMax = 1920,
  ...props
}) {
  const responsive = useResponsiveContext();

  const fontSize = responsive.calculateClampFontSize(minSize, maxSize, viewportMin, viewportMax);

  return (
    <span
      className={className}
      style={{ fontSize }}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Responsive container component
 */
export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = '1200px',
  padding = '16px',
  ...props
}) {
  const responsive = useResponsiveContext();

  const responsivePadding = responsive.getResponsiveSpacing(parseInt(padding));

  return (
    <div
      className={`mx-auto w-[92vw] max-w-[${maxWidth}] ${className}`}
      style={{
        padding: `${responsivePadding}px`,
        paddingLeft: `max(${responsivePadding}px, env(safe-area-inset-left))`,
        paddingRight: `max(${responsivePadding}px, env(safe-area-inset-right))`,
        paddingTop: `max(${responsivePadding}px, env(safe-area-inset-top))`,
        paddingBottom: `max(${responsivePadding}px, env(safe-area-inset-bottom))`
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Responsive grid component
 */
export function ResponsiveGrid({
  children,
  className = '',
  columns = {},
  gap = 4,
  ...props
}) {
  const responsive = useResponsiveContext();

  const responsiveColumns = responsive.getResponsiveValue(columns);
  const responsiveGap = responsive.getResponsiveSpacing(gap);

  const gridClasses = responsive.getBreakpointClasses('grid', {
    xs: `grid-cols-${columns.xs || 1}`,
    sm: `sm:grid-cols-${columns.sm || 2}`,
    md: `md:grid-cols-${columns.md || 3}`,
    lg: `lg:grid-cols-${columns.lg || 4}`,
    xl: `xl:grid-cols-${columns.xl || 5}`,
    '2xl': `2xl:grid-cols-${columns['2xl'] || 6}`
  });

  return (
    <div
      className={`${gridClasses} gap-${responsiveGap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default ResponsiveProvider;

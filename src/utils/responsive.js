/**
 * Responsive Design Utility
 * Provides dynamic responsive behavior for all screen sizes and device types
 */

// Check if we're in a browser environment
if (typeof window === 'undefined') {
    console.warn('ResponsiveManager: window is not available, some features may not work');
}

class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            xs: 360, // tiny phones
            sm: 640, // small phones
            md: 768, // large phones / small tablets
            lg: 1024, // tablets / small desktops
            xl: 1280, // desktops
            '2xl': 1536, // large desktops
            '3xl': 1920, // ultra-wide desktops
            '4xl': 2560 // 4K displays
        };

        this.deviceTypes = {
            mobile: 'mobile',
            tablet: 'tablet',
            desktop: 'desktop',
            ultrawide: 'ultrawide'
        };

        this.currentBreakpoint = null;
        this.currentDeviceType = null;
        this.touchDevice = false;
        this.orientation = 'portrait';
        this.viewportScale = 1; // Scale factor for large viewports

        this.listeners = new Map();
        this.mediaQueries = new Map();

        this.init();
    }

    /**
     * Initialize responsive manager
     */
    init() {
        try {
            this.detectDeviceType();
            this.detectTouchDevice();
            this.setupMediaQueries();
            this.setupOrientationListener();
            this.updateCurrentBreakpoint();
            this.applyViewportScaling();

            // Listen for window resize
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', this.handleResize.bind(this));

                // Listen for orientation change
                window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
            }
        } catch (error) {
            console.error('ResponsiveManager initialization error:', error);
        }
    }

    /**
     * Detect device type based on screen size and user agent
     */
    detectDeviceType() {
        try {
            const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const height = typeof window !== 'undefined' ? window.innerHeight : 768;
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';

            // Check for mobile devices
            const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || width <= this.breakpoints.md;

            // Check for tablet
            const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || (width > this.breakpoints.md && width <= this.breakpoints.lg);

            // Check for ultrawide displays
            const isUltrawide = width >= this.breakpoints['3xl'] || (width >= 1920 && height >= 1080);

            if (isMobile) {
                this.currentDeviceType = this.deviceTypes.mobile;
            } else if (isTablet) {
                this.currentDeviceType = this.deviceTypes.tablet;
            } else if (isUltrawide) {
                this.currentDeviceType = this.deviceTypes.ultrawide;
            } else {
                this.currentDeviceType = this.deviceTypes.desktop;
            }

            // Calculate viewport scale for large screens
            this.calculateViewportScale(width, height);
        } catch (error) {
            console.error('Error detecting device type:', error);
            this.currentDeviceType = this.deviceTypes.desktop;
        }
    }

    /**
     * Calculate viewport scale for large screens
     */
    calculateViewportScale(width, height) {
        try {
            // Base scale for optimal viewing (1280px width as reference)
            const baseWidth = 1280;
            const baseHeight = 720;

            // For very wide screens (like 1280x638), apply 75% scaling
            if (width >= 1200 && height <= 800) {
                this.viewportScale = 0.75; // 75% scale for wide, short screens
                return;
            }

            // For ultrawide displays (width > 1600), apply 80% scaling
            if (width >= 1600) {
                this.viewportScale = 0.8; // 80% scale for ultrawide
                return;
            }

            // For 4K displays (width > 2000), apply 70% scaling
            if (width >= 2000) {
                this.viewportScale = 0.7; // 70% scale for 4K
                return;
            }

            // Calculate scale based on width and height for normal screens
            const widthScale = Math.min(width / baseWidth, 1.2); // Max 1.2x scale
            const heightScale = Math.min(height / baseHeight, 1.2); // Max 1.2x scale

            // Use the smaller scale to maintain aspect ratio
            this.viewportScale = Math.min(widthScale, heightScale, 1.2);

            // Ensure minimum scale of 0.8 for very small screens
            this.viewportScale = Math.max(this.viewportScale, 0.8);
        } catch (error) {
            console.error('Error calculating viewport scale:', error);
            this.viewportScale = 1;
        }
    }

    /**
     * Detect if device supports touch
     */
    detectTouchDevice() {
        try {
            this.touchDevice = typeof window !== 'undefined' && (
                'ontouchstart' in window ||
                (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
            );
        } catch (error) {
            console.error('Error detecting touch device:', error);
            this.touchDevice = false;
        }
    }

    /**
     * Setup media queries for breakpoint detection
     */
    setupMediaQueries() {
        try {
            if (typeof window !== 'undefined' && window.matchMedia) {
                Object.entries(this.breakpoints).forEach(([name, width]) => {
                    const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
                    this.mediaQueries.set(name, mediaQuery);
                });
            }
        } catch (error) {
            console.error('Error setting up media queries:', error);
        }
    }

    /**
     * Setup orientation change listener
     */
    setupOrientationListener() {
        try {
            if (typeof window !== 'undefined') {
                this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            } else {
                this.orientation = 'landscape';
            }
        } catch (error) {
            console.error('Error setting up orientation listener:', error);
            this.orientation = 'landscape';
        }
    }

    /**
     * Update current breakpoint based on window width
     */
    updateCurrentBreakpoint() {
        try {
            const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
            let newBreakpoint = 'xs';

            Object.entries(this.breakpoints).forEach(([name, breakpointWidth]) => {
                if (width >= breakpointWidth) {
                    newBreakpoint = name;
                }
            });

            if (this.currentBreakpoint !== newBreakpoint) {
                this.currentBreakpoint = newBreakpoint;
                this.notifyListeners('breakpointChange', {
                    breakpoint: newBreakpoint,
                    width
                });
            }
        } catch (error) {
            console.error('Error updating breakpoint:', error);
        }
    }

    /**
     * Apply viewport scaling to the root element
     */
    applyViewportScaling() {
        try {
            if (typeof document !== 'undefined') {
                const rootElement = document.getElementById('root');
                if (rootElement) {
                    // Remove any existing scaling classes
                    rootElement.classList.remove('viewport-scaled');

                    // Apply scaling based on viewport size
                    const width = window.innerWidth;
                    const height = window.innerHeight;

                    if (width >= 1200 && height <= 800) {
                        // Wide, short screens - apply 75% scaling
                        rootElement.style.transform = 'scale(0.75)';
                        rootElement.style.transformOrigin = 'top left';
                        rootElement.style.width = '133.33%';
                        rootElement.style.height = '133.33%';
                        rootElement.style.overflowX = 'auto';
                        rootElement.style.overflowY = 'auto';
                    } else if (width >= 1600) {
                        // Ultrawide displays - apply 80% scaling
                        rootElement.style.transform = 'scale(0.8)';
                        rootElement.style.transformOrigin = 'top left';
                        rootElement.style.width = '125%';
                        rootElement.style.height = '125%';
                        rootElement.style.overflowX = 'auto';
                        rootElement.style.overflowY = 'auto';
                    } else if (width >= 2000) {
                        // 4K displays - apply 70% scaling
                        rootElement.style.transform = 'scale(0.7)';
                        rootElement.style.transformOrigin = 'top left';
                        rootElement.style.width = '142.86%';
                        rootElement.style.height = '142.86%';
                        rootElement.style.overflowX = 'auto';
                        rootElement.style.overflowY = 'auto';
                    } else {
                        // Normal screens - reset scaling
                        rootElement.style.transform = '';
                        rootElement.style.transformOrigin = '';
                        rootElement.style.width = '';
                        rootElement.style.height = '';
                        rootElement.style.overflowX = '';
                        rootElement.style.overflowY = '';
                    }
                }
            }
        } catch (error) {
            console.error('Error applying viewport scaling:', error);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        try {
            this.detectDeviceType();
            this.updateCurrentBreakpoint();
            this.setupOrientationListener();
            this.applyViewportScaling();
            this.notifyListeners('resize', {
                width: typeof window !== 'undefined' ? window.innerWidth : 1024,
                height: typeof window !== 'undefined' ? window.innerHeight : 768,
                breakpoint: this.currentBreakpoint,
                deviceType: this.currentDeviceType
            });
        } catch (error) {
            console.error('Error handling resize:', error);
        }
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        try {
            setTimeout(() => {
                this.setupOrientationListener();
                this.notifyListeners('orientationChange', {
                    orientation: this.orientation,
                    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
                    height: typeof window !== 'undefined' ? window.innerHeight : 768
                });
            }, 100);
        } catch (error) {
            console.error('Error handling orientation change:', error);
        }
    }

    /**
     * Add event listener for responsive events
     */
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    removeListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify all listeners of an event
     */
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in responsive listener:', error);
                }
            });
        }
    }

    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }

    /**
     * Get current device type
     */
    getCurrentDeviceType() {
        return this.currentDeviceType;
    }

    /**
     * Check if current breakpoint matches
     */
    isBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Check if current breakpoint is above
     */
    isBreakpointAbove(breakpoint) {
        const currentIndex = Object.keys(this.breakpoints).indexOf(this.currentBreakpoint);
        const targetIndex = Object.keys(this.breakpoints).indexOf(breakpoint);
        return currentIndex >= targetIndex;
    }

    /**
     * Check if current breakpoint is below
     */
    isBreakpointBelow(breakpoint) {
        const currentIndex = Object.keys(this.breakpoints).indexOf(this.currentBreakpoint);
        const targetIndex = Object.keys(this.breakpoints).indexOf(breakpoint);
        return currentIndex < targetIndex;
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return this.currentDeviceType === this.deviceTypes.mobile;
    }

    /**
     * Check if device is tablet
     */
    isTablet() {
        return this.currentDeviceType === this.deviceTypes.tablet;
    }

    /**
     * Check if device is desktop
     */
    isDesktop() {
        return this.currentDeviceType === this.deviceTypes.desktop;
    }

    /**
     * Check if device is ultrawide
     */
    isUltrawide() {
        return this.currentDeviceType === this.deviceTypes.ultrawide;
    }

    /**
     * Get current viewport scale
     */
    getViewportScale() {
        return this.viewportScale;
    }

    /**
     * Check if device supports touch
     */
    isTouchDevice() {
        return this.touchDevice;
    }

    /**
     * Get current orientation
     */
    getOrientation() {
        return this.orientation;
    }

    /**
     * Check if orientation is portrait
     */
    isPortrait() {
        return this.orientation === 'portrait';
    }

    /**
     * Check if orientation is landscape
     */
    isLandscape() {
        return this.orientation === 'landscape';
    }

    /**
     * Get responsive class names based on current breakpoint
     */
    getResponsiveClasses(baseClasses = {}) {
        const classes = [];

        Object.entries(baseClasses).forEach(([breakpoint, className]) => {
            if (this.isBreakpointAbove(breakpoint)) {
                classes.push(className);
            }
        });

        return classes.join(' ');
    }

    /**
     * Get responsive values based on current breakpoint
     */
    getResponsiveValue(values = {}) {
        // Start from largest breakpoint and work down
        const breakpoints = Object.keys(this.breakpoints).reverse();

        for (const breakpoint of breakpoints) {
            if (this.isBreakpointAbove(breakpoint) && values[breakpoint] !== undefined) {
                return values[breakpoint];
            }
        }

        // Fallback to default or first available value
        return values.default || values[Object.keys(values)[0]] || null;
    }

    /**
     * Apply responsive styles to element
     */
    applyResponsiveStyles(element, styles = {}) {
        if (!element) return;

        Object.entries(styles).forEach(([property, values]) => {
            const value = this.getResponsiveValue(values);
            if (value !== null) {
                element.style[property] = value;
            }
        });
    }

    /**
     * Get viewport dimensions
     */
    getViewportDimensions() {
        try {
            const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const height = typeof window !== 'undefined' ? window.innerHeight : 768;
            return {
                width,
                height,
                aspectRatio: width / height
            };
        } catch (error) {
            console.error('Error getting viewport dimensions:', error);
            return {
                width: 1024,
                height: 768,
                aspectRatio: 1024 / 768
            };
        }
    }

    /**
     * Get scaled viewport dimensions (applies viewport scaling)
     */
    getScaledViewportDimensions() {
        try {
            const dimensions = this.getViewportDimensions();
            return {
                width: dimensions.width * this.viewportScale,
                height: dimensions.height * this.viewportScale,
                aspectRatio: dimensions.aspectRatio,
                originalWidth: dimensions.width,
                originalHeight: dimensions.height,
                scale: this.viewportScale
            };
        } catch (error) {
            console.error('Error getting scaled viewport dimensions:', error);
            return {
                width: 1024,
                height: 768,
                aspectRatio: 1024 / 768,
                originalWidth: 1024,
                originalHeight: 768,
                scale: 1
            };
        }
    }

    /**
     * Get safe area insets (for devices with notches)
     */
    getSafeAreaInsets() {
        try {
            if (typeof document !== 'undefined') {
                const computedStyle = getComputedStyle(document.documentElement);

                return {
                    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
                    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
                };
            }
        } catch (error) {
            console.error('Error getting safe area insets:', error);
        }

        return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
    }

    /**
     * Calculate responsive font size using clamp
     */
    calculateClampFontSize(minSize, maxSize, viewportMin = 320, viewportMax = 1920) {
        try {
            const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const clampedWidth = Math.max(viewportMin, Math.min(viewportMax, currentWidth));

            // Calculate the viewport-based size
            const viewportSize = minSize + (maxSize - minSize) *
                ((clampedWidth - viewportMin) / (viewportMax - viewportMin));

            // Apply viewport scale for large screens
            const scaledSize = viewportSize * this.viewportScale;

            return `${Math.round(scaledSize * 100) / 100}px`;
        } catch (error) {
            console.error('Error calculating clamp font size:', error);
            return `${minSize}px`;
        }
    }

    /**
     * Get viewport-aware font size with better scaling
     */
    getViewportAwareFontSize(baseSize, scaleFactor = 1) {
        try {
            const scaledSize = baseSize * this.viewportScale * scaleFactor;
            return Math.max(scaledSize, baseSize * 0.8); // Minimum 80% of base size
        } catch (error) {
            console.error('Error calculating viewport-aware font size:', error);
            return baseSize;
        }
    }

    /**
     * Get viewport-aware container max width
     */
    getViewportAwareMaxWidth() {
        try {
            const scaledDimensions = this.getScaledViewportDimensions();
            const scaledWidth = scaledDimensions.width;

            // Scale max width based on scaled viewport size
            if (scaledWidth >= this.breakpoints['4xl']) {
                return `${Math.round(1600 * this.viewportScale)}px`; // 4K displays
            } else if (scaledWidth >= this.breakpoints['3xl']) {
                return `${Math.round(1400 * this.viewportScale)}px`; // Ultrawide displays
            } else if (scaledWidth >= this.breakpoints['2xl']) {
                return `${Math.round(1200 * this.viewportScale)}px`; // Large desktops
            } else if (scaledWidth >= this.breakpoints.xl) {
                return `${Math.round(1000 * this.viewportScale)}px`; // Standard desktops
            } else {
                return '100%'; // Mobile/tablet
            }
        } catch (error) {
            console.error('Error calculating viewport-aware max width:', error);
            return '1200px';
        }
    }

    /**
     * Get responsive grid columns based on screen size
     */
    getResponsiveGridColumns() {
        const breakpoint = this.currentBreakpoint;

        const gridConfigs = {
            xs: 1, // 1 column on tiny phones
            sm: 2, // 2 columns on small phones
            md: 3, // 3 columns on large phones/small tablets
            lg: 4, // 4 columns on tablets
            xl: 5, // 5 columns on desktops
            '2xl': 6, // 6 columns on large desktops
            '3xl': 8, // 8 columns on ultrawide
            '4xl': 10 // 10 columns on 4K displays
        };

        return gridConfigs[breakpoint] || 1;
    }

    /**
     * Get responsive spacing based on screen size
     */
    getResponsiveSpacing(baseSpacing = 4) {
        const multipliers = {
            xs: 0.5, // Smaller spacing on tiny phones
            sm: 0.75, // Slightly smaller on small phones
            md: 1, // Normal spacing on large phones
            lg: 1.25, // Slightly larger on tablets
            xl: 1.5, // Larger on desktops
            '2xl': 2, // Much larger on large desktops
            '3xl': 2.5, // Extra large on ultrawide
            '4xl': 3 // Huge spacing on 4K displays
        };

        const multiplier = multipliers[this.currentBreakpoint] || 1;
        const scaledSpacing = baseSpacing * multiplier * this.viewportScale;
        return Math.round(scaledSpacing);
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Destroy the responsive manager
     */
    destroy() {
        try {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', this.handleResize.bind(this));
                window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
            }
            this.listeners.clear();
            this.mediaQueries.clear();
        } catch (error) {
            console.error('Error destroying responsive manager:', error);
        }
    }
}

// Create global instance
const responsiveManager = new ResponsiveManager();

// Export for use in modules
export default responsiveManager;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
    window.ResponsiveManager = ResponsiveManager;
    window.responsiveManager = responsiveManager;
}

// Export utility functions
export const responsiveUtils = {
    /**
     * Get responsive breakpoint classes
     */
    getBreakpointClasses: (baseClass, breakpoints = {}) => {
        const classes = [baseClass];

        Object.entries(breakpoints).forEach(([breakpoint, className]) => {
            if (responsiveManager.isBreakpointAbove(breakpoint)) {
                classes.push(className);
            }
        });

        return classes.join(' ');
    },

    /**
     * Get responsive text size
     */
    getResponsiveTextSize: (minSize, maxSize) => {
        return responsiveManager.calculateClampFontSize(minSize, maxSize);
    },

    /**
     * Get responsive spacing
     */
    getResponsiveSpacing: (baseSpacing) => {
        return responsiveManager.getResponsiveSpacing(baseSpacing);
    },

    /**
     * Check if element is in viewport
     */
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Get element's responsive visibility
     */
    getElementVisibility: (element) => {
        const rect = element.getBoundingClientRect();
        const viewport = responsiveManager.getViewportDimensions();

        return {
            isVisible: responsiveUtils.isInViewport(element),
            visibilityPercentage: Math.max(0, Math.min(100,
                ((rect.bottom - Math.max(0, rect.top)) / viewport.height) * 100
            )),
            isAboveViewport: rect.bottom < 0,
            isBelowViewport: rect.top > viewport.height
        };
    }
};
/**
 * TypeScript declarations for responsive utilities
 */

export interface ResponsiveBreakpoints {
	xs: number;
	sm: number;
	md: number;
	lg: number;
	xl: number;
	'2xl': number;
}

export interface ResponsiveDeviceTypes {
	mobile: 'mobile';
	tablet: 'tablet';
	desktop: 'desktop';
}

export interface ViewportDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

export interface SafeAreaInsets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ResponsiveState {
	breakpoint: keyof ResponsiveBreakpoints;
	deviceType: keyof ResponsiveDeviceTypes;
	isTouchDevice: boolean;
	orientation: 'portrait' | 'landscape';
	viewport: ViewportDimensions;
	safeAreaInsets: SafeAreaInsets;
}

export interface ResponsiveUtils extends ResponsiveState {
	// Breakpoint checks
	isBreakpoint: (breakpoint: keyof ResponsiveBreakpoints) => boolean;
	isBreakpointAbove: (breakpoint: keyof ResponsiveBreakpoints) => boolean;
	isBreakpointBelow: (breakpoint: keyof ResponsiveBreakpoints) => boolean;

	// Device type checks
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;

	// Orientation checks
	isPortrait: boolean;
	isLandscape: boolean;

	// Utility functions
	getResponsiveValue: <T>(values: Partial<Record<keyof ResponsiveBreakpoints, T>> & { default?: T }) => T | null;
	getResponsiveClasses: (baseClasses: Partial<Record<keyof ResponsiveBreakpoints, string>>) => string;
	getResponsiveGridColumns: () => number;
	getResponsiveSpacing: (baseSpacing: number) => number;
	calculateClampFontSize: (minSize: number, maxSize: number, viewportMin?: number, viewportMax?: number) => string;
	applyResponsiveStyles: (element: HTMLElement, styles: Record<string, Partial<Record<keyof ResponsiveBreakpoints, string | number>>>) => void;
	getBreakpointClasses: (baseClass: string, breakpoints?: Partial<Record<keyof ResponsiveBreakpoints, string>>) => string;
	getResponsiveTextSize: (minSize: number, maxSize: number) => string;
	getResponsiveSpacing: (baseSpacing: number) => number;
}

export interface BreakpointHook {
	current: keyof ResponsiveBreakpoints;
	is: (breakpoint: keyof ResponsiveBreakpoints) => boolean;
	isAbove: (breakpoint: keyof ResponsiveBreakpoints) => boolean;
	isBelow: (breakpoint: keyof ResponsiveBreakpoints) => boolean;
}

export interface DeviceTypeHook {
	current: keyof ResponsiveDeviceTypes;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isTouchDevice: boolean;
}

export interface OrientationHook {
	current: 'portrait' | 'landscape';
	isPortrait: boolean;
	isLandscape: boolean;
}

export interface ViewportHook extends ViewportDimensions {
	safeAreaInsets: SafeAreaInsets;
}

export interface ResponsiveVisibility {
	isVisible: boolean;
	visibilityPercentage: number;
	isAboveViewport: boolean;
	isBelowViewport: boolean;
}

export interface ResponsiveProviderProps {
	children: React.ReactNode;
}

export interface ResponsiveWrapperProps {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	responsiveProps?: {
		classes?: Partial<Record<keyof ResponsiveBreakpoints, string>>;
		styles?: Partial<Record<keyof ResponsiveBreakpoints, React.CSSProperties>>;
	};
}

export interface ResponsiveTextProps {
	children: React.ReactNode;
	className?: string;
	minSize?: number;
	maxSize?: number;
	viewportMin?: number;
	viewportMax?: number;
	[key: string]: any;
}

export interface ResponsiveContainerProps {
	children: React.ReactNode;
	className?: string;
	maxWidth?: string;
	padding?: string;
	[key: string]: any;
}

export interface ResponsiveGridProps {
	children: React.ReactNode;
	className?: string;
	columns?: Partial<Record<keyof ResponsiveBreakpoints, number>>;
	gap?: number;
	[key: string]: any;
}

// Global declarations for non-module usage
declare global {
	interface Window {
		ResponsiveManager: typeof import('../utils/responsive').default;
		responsiveManager: import('../utils/responsive').default;
	}
}

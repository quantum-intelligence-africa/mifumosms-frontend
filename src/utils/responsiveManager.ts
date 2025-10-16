/**
 * Responsive Manager - Smart scaling and density control
 * Automatically adjusts content scale based on viewport width
 */

interface ScaleConfig {
  minWidth: number;
  maxWidth: number;
  scale: number;
}

const SCALE_BREAKPOINTS: ScaleConfig[] = [
  { minWidth: 2560, maxWidth: Infinity, scale: 0.75 }, // Ultra-wide monitors
  { minWidth: 1920, maxWidth: 2559, scale: 0.85 },     // Large monitors
  { minWidth: 1536, maxWidth: 1919, scale: 0.90 },     // Standard large screens
  { minWidth: 1280, maxWidth: 1535, scale: 0.95 },     // Standard desktops
  { minWidth: 0, maxWidth: 1279, scale: 1.0 },         // Mobile/tablet (no scaling)
];

class ResponsiveManager {
  private scaleRoot: HTMLElement | null = null;
  private currentScale: number = 1.0;
  private resizeTimeout: number | null = null;

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup() {
    // Find or create scale root
    this.scaleRoot = document.getElementById('app-scale-root');
    
    // Apply initial scale
    this.updateScale();

    // Listen for resize events with debounce
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize() {
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      this.updateScale();
    }, 150);
  }

  private updateScale() {
    const viewportWidth = window.innerWidth;
    const scaleConfig = this.getScaleConfig(viewportWidth);

    if (scaleConfig.scale !== this.currentScale) {
      this.currentScale = scaleConfig.scale;
      this.applyScale(scaleConfig.scale);
    }
  }

  private getScaleConfig(width: number): ScaleConfig {
    return SCALE_BREAKPOINTS.find(
      config => width >= config.minWidth && width <= config.maxWidth
    ) || SCALE_BREAKPOINTS[SCALE_BREAKPOINTS.length - 1];
  }

  private applyScale(scale: number) {
    if (!this.scaleRoot) return;

    // Apply transform scale
    this.scaleRoot.style.transform = `scale(${scale})`;
    this.scaleRoot.style.transformOrigin = 'top center';
    this.scaleRoot.style.transition = 'transform 0.2s ease-out';

    // Set CSS custom property for scale (useful for calculations)
    document.documentElement.style.setProperty('--app-scale', scale.toString());
  }

  getCurrentScale(): number {
    return this.currentScale;
  }
}

// Create singleton instance
const responsiveManager = new ResponsiveManager();

// Auto-initialize
if (typeof window !== 'undefined') {
  responsiveManager.init();
}

export default responsiveManager;

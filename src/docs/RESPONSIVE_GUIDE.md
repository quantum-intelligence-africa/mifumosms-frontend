# Responsive Design System Guide

This guide explains how to use the comprehensive responsive design system in your mifumo-connect application.

## Overview

The responsive system provides:

- **Dynamic breakpoint detection** (xs, sm, md, lg, xl, 2xl)
- **Device type detection** (mobile, tablet, desktop)
- **Touch device detection**
- **Orientation detection** (portrait, landscape)
- **Responsive utilities** for typography, spacing, and layout
- **React hooks** for easy integration
- **CSS utilities** for styling
- **TypeScript support** for type safety

## Quick Start

### 1. Basic Usage with React Hooks

```jsx
import { useResponsive, useBreakpoint, useDeviceType } from '@/hooks/useResponsive';

function MyComponent() {
  const responsive = useResponsive();
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();

  return (
    <div>
      <h1 className={responsive.isMobile ? 'text-lg' : 'text-2xl'}>
        Current breakpoint: {responsive.breakpoint}
      </h1>
      <p>Device type: {deviceType.current}</p>
      <p>Is mobile: {responsive.isMobile ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 2. Using Responsive Components

```jsx
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText } from '@/components/ResponsiveProvider';

function MyPage() {
  return (
    <ResponsiveContainer>
      <ResponsiveText minSize={16} maxSize={24} className="font-bold">
        This text scales responsively
      </ResponsiveText>

      <ResponsiveGrid
        columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
        gap={4}
      >
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
}
```

### 3. Using CSS Classes

```jsx
function MyComponent() {
  return (
    <div className="container-responsive">
      <h1 className="text-responsive-3xl">Responsive Heading</h1>
      <div className="grid-responsive">
        <div className="card-responsive">Card 1</div>
        <div className="card-responsive">Card 2</div>
      </div>
    </div>
  );
}
```

## Breakpoints

| Breakpoint | Min Width | Description |
|------------|-----------|-------------|
| `xs` | 360px | Tiny phones |
| `sm` | 640px | Small phones |
| `md` | 768px | Large phones / Small tablets |
| `lg` | 1024px | Tablets / Small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

## React Hooks

### useResponsive()

The main hook that provides all responsive utilities:

```jsx
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const responsive = useResponsive();

  return (
    <div>
      {/* Breakpoint checks */}
      {responsive.isBreakpoint('md') && <p>Medium screen</p>}
      {responsive.isBreakpointAbove('lg') && <p>Large screen or above</p>}
      {responsive.isBreakpointBelow('sm') && <p>Small screen or below</p>}

      {/* Device type checks */}
      {responsive.isMobile && <p>Mobile device</p>}
      {responsive.isTablet && <p>Tablet device</p>}
      {responsive.isDesktop && <p>Desktop device</p>}

      {/* Responsive values */}
      <div style={{
        fontSize: responsive.calculateClampFontSize(14, 20),
        padding: responsive.getResponsiveSpacing(4)
      }}>
        Responsive content
      </div>
    </div>
  );
}
```

### useBreakpoint()

Hook specifically for breakpoint detection:

```jsx
import { useBreakpoint } from '@/hooks/useResponsive';

function MyComponent() {
  const breakpoint = useBreakpoint();

  return (
    <div>
      <p>Current: {breakpoint.current}</p>
      <p>Is medium: {breakpoint.is('md')}</p>
      <p>Is large or above: {breakpoint.isAbove('lg')}</p>
    </div>
  );
}
```

### useDeviceType()

Hook for device type detection:

```jsx
import { useDeviceType } from '@/hooks/useResponsive';

function MyComponent() {
  const deviceType = useDeviceType();

  return (
    <div>
      <p>Device: {deviceType.current}</p>
      <p>Is mobile: {deviceType.isMobile}</p>
      <p>Is touch device: {deviceType.isTouchDevice}</p>
    </div>
  );
}
```

### useViewport()

Hook for viewport dimensions:

```jsx
import { useViewport } from '@/hooks/useResponsive';

function MyComponent() {
  const viewport = useViewport();

  return (
    <div>
      <p>Width: {viewport.width}px</p>
      <p>Height: {viewport.height}px</p>
      <p>Aspect ratio: {viewport.aspectRatio}</p>
    </div>
  );
}
```

## Responsive Components

### ResponsiveContainer

A container with responsive padding and max-width:

```jsx
import { ResponsiveContainer } from '@/components/ResponsiveProvider';

<ResponsiveContainer maxWidth="1200px" padding="16px">
  <p>Content with responsive container</p>
</ResponsiveContainer>
```

### ResponsiveText

Text that scales responsively:

```jsx
import { ResponsiveText } from '@/components/ResponsiveProvider';

<ResponsiveText minSize={14} maxSize={24} className="font-bold">
  This text scales from 14px to 24px
</ResponsiveText>
```

### ResponsiveGrid

A grid that adapts to different screen sizes:

```jsx
import { ResponsiveGrid } from '@/components/ResponsiveProvider';

<ResponsiveGrid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={4}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</ResponsiveGrid>
```

### ResponsiveWrapper

A wrapper with responsive classes and styles:

```jsx
import { ResponsiveWrapper } from '@/components/ResponsiveProvider';

<ResponsiveWrapper
  className="border-2 border-dashed"
  responsiveProps={{
    classes: {
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6'
    },
    styles: {
      xs: { backgroundColor: '#fef2f2' },
      sm: { backgroundColor: '#fef3c7' },
      md: { backgroundColor: '#ecfdf5' }
    }
  }}
>
  <p>Responsive wrapper content</p>
</ResponsiveWrapper>
```

## CSS Classes

### Typography Classes

```css
.text-responsive-xs    /* clamp(0.625rem, 1.25vw, 0.75rem) */
.text-responsive-sm    /* clamp(0.75rem, 1.5vw, 0.875rem) */
.text-responsive-base  /* clamp(0.875rem, 2vw, 1rem) */
.text-responsive-lg    /* clamp(1rem, 2.5vw, 1.125rem) */
.text-responsive-xl    /* clamp(1.125rem, 3vw, 1.25rem) */
.text-responsive-2xl   /* clamp(1.25rem, 3.5vw, 1.5rem) */
.text-responsive-3xl   /* clamp(1.5rem, 4vw, 2rem) */
.text-responsive-4xl   /* clamp(1.875rem, 5vw, 2.5rem) */
.text-responsive-5xl   /* clamp(2.25rem, 6vw, 3rem) */
```

### Spacing Classes

```css
.space-responsive-xs   /* 0.25rem */
.space-responsive-sm   /* 0.5rem */
.space-responsive-md   /* 1rem */
.space-responsive-lg   /* 1.5rem */
.space-responsive-xl   /* 2rem */
.space-responsive-2xl  /* 3rem */
```

### Layout Classes

```css
.container-responsive  /* Responsive container with safe area insets */
.grid-responsive      /* Responsive grid (1-6 columns based on screen size) */
.flex-responsive      /* Responsive flex (column on mobile, row on desktop) */
```

### Visibility Classes

```css
.visible-mobile       /* Visible only on mobile */
.visible-tablet       /* Visible only on tablet */
.visible-desktop      /* Visible only on desktop */
.hidden-mobile        /* Hidden on mobile */
.hidden-tablet        /* Hidden on tablet */
.hidden-desktop       /* Hidden on desktop */
```

## JavaScript API

### ResponsiveManager

Direct access to the responsive manager:

```javascript
import responsiveManager from '@/utils/responsive';

// Get current state
const breakpoint = responsiveManager.getCurrentBreakpoint();
const deviceType = responsiveManager.getCurrentDeviceType();
const isMobile = responsiveManager.isMobile();

// Check breakpoints
const isMedium = responsiveManager.isBreakpoint('md');
const isLargeOrAbove = responsiveManager.isBreakpointAbove('lg');

// Get responsive values
const columns = responsiveManager.getResponsiveGridColumns();
const spacing = responsiveManager.getResponsiveSpacing(4);

// Calculate font size
const fontSize = responsiveManager.calculateClampFontSize(14, 20);

// Add event listeners
responsiveManager.addListener('breakpointChange', (data) => {
  console.log('Breakpoint changed:', data.breakpoint);
});
```

## Best Practices

### 1. Use Responsive Components

Prefer responsive components over manual breakpoint checks:

```jsx
// ✅ Good
<ResponsiveText minSize={16} maxSize={24}>
  Responsive text
</ResponsiveText>

// ❌ Avoid
<div style={{ fontSize: responsive.isMobile ? '16px' : '24px' }}>
  Manual responsive text
</div>
```

### 2. Use CSS Classes for Common Patterns

```jsx
// ✅ Good
<div className="container-responsive">
  <h1 className="text-responsive-3xl">Title</h1>
  <div className="grid-responsive">
    <div className="card-responsive">Card</div>
  </div>
</div>
```

### 3. Combine Hooks for Complex Logic

```jsx
function MyComponent() {
  const responsive = useResponsive();
  const breakpoint = useBreakpoint();

  // Complex responsive logic
  const getLayout = () => {
    if (responsive.isMobile) return 'mobile';
    if (breakpoint.is('md')) return 'tablet';
    return 'desktop';
  };

  return <div className={`layout-${getLayout()}`}>Content</div>;
}
```

### 4. Use Responsive Values for Dynamic Content

```jsx
function MyComponent() {
  const responsive = useResponsive();

  const gridColumns = responsive.getResponsiveValue({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
      gap: responsive.getResponsiveSpacing(4)
    }}>
      {/* Grid items */}
    </div>
  );
}
```

## Integration with Existing Pages

The responsive system is already integrated into your app through the `ResponsiveProvider` in `App.tsx`. All pages automatically have access to responsive utilities.

### Example: Updating an Existing Page

```jsx
// Before
function MyPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl">Title</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Content */}
      </div>
    </div>
  );
}

// After
import { useResponsive } from '@/hooks/useResponsive';

function MyPage() {
  const responsive = useResponsive();

  return (
    <div className="container-responsive">
      <h1 className="text-responsive-3xl">Title</h1>
      <div className="grid-responsive">
        {/* Content */}
      </div>
    </div>
  );
}
```

## Performance Considerations

1. **Event Listeners**: The responsive manager uses throttled event listeners for optimal performance
2. **CSS Classes**: Use CSS classes when possible instead of inline styles
3. **Memoization**: Consider using `useMemo` for expensive responsive calculations
4. **Debouncing**: Use the built-in debounce function for custom responsive logic

## Troubleshooting

### Common Issues

1. **Responsive not updating**: Ensure the component is wrapped in `ResponsiveProvider`
2. **TypeScript errors**: Import types from `@/types/responsive`
3. **CSS not applying**: Check that `responsive.css` is imported in your main CSS file

### Debug Mode

Enable debug mode to see responsive changes in console:

```javascript
import responsiveManager from '@/utils/responsive';

// Add debug listener
responsiveManager.addListener('breakpointChange', (data) => {
  console.log('Responsive Debug:', data);
});
```

## Examples

See `src/examples/ResponsiveUsageExample.jsx` for comprehensive usage examples.

## TypeScript Support

All responsive utilities are fully typed. Import types from `@/types/responsive` for custom implementations.

```typescript
import { ResponsiveUtils, BreakpointHook } from '@/types/responsive';

function MyComponent() {
  const responsive: ResponsiveUtils = useResponsive();
  const breakpoint: BreakpointHook = useBreakpoint();

  // Type-safe responsive code
}
```

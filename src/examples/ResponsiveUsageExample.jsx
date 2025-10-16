import React from 'react';
import { useResponsive, useBreakpoint, useDeviceType, useViewport } from '../hooks/useResponsive';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText, ResponsiveWrapper } from '../components/ResponsiveProvider';

/**
 * Example component showing how to use responsive utilities
 */
export function ResponsiveUsageExample() {
  // Using the main responsive hook
  const responsive = useResponsive();

  // Using specific hooks
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();
  const viewport = useViewport();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Responsive Usage Examples</h1>

      {/* Example 1: Using responsive context */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Responsive State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Breakpoint</h3>
            <p>{responsive.breakpoint}</p>
            <p>Is Mobile: {responsive.isMobile ? 'Yes' : 'No'}</p>
            <p>Is Desktop: {responsive.isDesktop ? 'Yes' : 'No'}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Device Type</h3>
            <p>{deviceType.current}</p>
            <p>Touch Device: {responsive.isTouchDevice ? 'Yes' : 'No'}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Viewport</h3>
            <p>Width: {viewport.width}px</p>
            <p>Height: {viewport.height}px</p>
            <p>Orientation: {responsive.orientation}</p>
          </div>
        </div>
      </section>

      {/* Example 2: Responsive text sizing */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Text Sizing</h2>
        <div className="space-y-4">
          <ResponsiveText
            minSize={14}
            maxSize={24}
            className="font-bold"
          >
            This text scales from 14px to 24px based on viewport
          </ResponsiveText>

          <ResponsiveText
            minSize={12}
            maxSize={18}
            className="text-gray-600"
          >
            This text scales from 12px to 18px based on viewport
          </ResponsiveText>
        </div>
      </section>

      {/* Example 3: Responsive grid */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Grid</h2>
        <ResponsiveGrid
          columns={{
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5,
            '2xl': 6
          }}
          gap={4}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="p-4 bg-blue-100 rounded text-center">
              Item {i + 1}
            </div>
          ))}
        </ResponsiveGrid>
      </section>

      {/* Example 4: Responsive container */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Container</h2>
        <ResponsiveContainer className="bg-green-100 rounded p-4">
          <p>This container has responsive padding and max-width</p>
        </ResponsiveContainer>
      </section>

      {/* Example 5: Conditional rendering based on breakpoint */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Conditional Rendering</h2>
        <div className="space-y-4">
          {responsive.isMobile && (
            <div className="p-4 bg-yellow-100 rounded">
              This content only shows on mobile devices
            </div>
          )}

          {responsive.isTablet && (
            <div className="p-4 bg-orange-100 rounded">
              This content only shows on tablet devices
            </div>
          )}

          {responsive.isDesktop && (
            <div className="p-4 bg-purple-100 rounded">
              This content only shows on desktop devices
            </div>
          )}
        </div>
      </section>

      {/* Example 6: Responsive values */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Values</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Grid Columns</h3>
            <p>Current columns: {responsive.getResponsiveGridColumns()}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Responsive Spacing</h3>
            <p>Base spacing (4): {responsive.getResponsiveSpacing(4)}</p>
            <p>Large spacing (8): {responsive.getResponsiveSpacing(8)}</p>
          </div>
        </div>
      </section>

      {/* Example 7: Responsive wrapper with custom props */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Wrapper</h2>
        <ResponsiveWrapper
          className="border-2 border-dashed border-gray-300"
          responsiveProps={{
            classes: {
              xs: 'p-2',
              sm: 'p-4',
              md: 'p-6',
              lg: 'p-8'
            },
            styles: {
              xs: { backgroundColor: '#fef2f2' },
              sm: { backgroundColor: '#fef3c7' },
              md: { backgroundColor: '#ecfdf5' },
              lg: { backgroundColor: '#e0f2fe' }
            }
          }}
        >
          <p>This wrapper changes padding and background color based on breakpoint</p>
        </ResponsiveWrapper>
      </section>

      {/* Example 8: Using responsive classes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive CSS Classes</h2>
        <div className="space-y-4">
          <div className="text-responsive-3xl font-bold">
            This uses responsive text size class
          </div>

          <div className="grid-responsive">
            <div className="p-4 bg-red-100 rounded">Grid Item 1</div>
            <div className="p-4 bg-red-100 rounded">Grid Item 2</div>
            <div className="p-4 bg-red-100 rounded">Grid Item 3</div>
            <div className="p-4 bg-red-100 rounded">Grid Item 4</div>
          </div>

          <div className="flex-responsive">
            <div className="p-4 bg-blue-100 rounded flex-1">Flex Item 1</div>
            <div className="p-4 bg-blue-100 rounded flex-1">Flex Item 2</div>
          </div>
        </div>
      </section>

      {/* Example 9: Breakpoint-specific content */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Breakpoint-Specific Content</h2>
        <div className="space-y-4">
          {breakpoint.is('xs') && (
            <div className="p-4 bg-pink-100 rounded">
              Extra Small Screen (360px+)
            </div>
          )}

          {breakpoint.is('sm') && (
            <div className="p-4 bg-indigo-100 rounded">
              Small Screen (640px+)
            </div>
          )}

          {breakpoint.is('md') && (
            <div className="p-4 bg-teal-100 rounded">
              Medium Screen (768px+)
            </div>
          )}

          {breakpoint.is('lg') && (
            <div className="p-4 bg-cyan-100 rounded">
              Large Screen (1024px+)
            </div>
          )}

          {breakpoint.is('xl') && (
            <div className="p-4 bg-emerald-100 rounded">
              Extra Large Screen (1280px+)
            </div>
          )}

          {breakpoint.is('2xl') && (
            <div className="p-4 bg-violet-100 rounded">
              2X Large Screen (1536px+)
            </div>
          )}
        </div>
      </section>

      {/* Example 10: Responsive visibility */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Responsive Visibility</h2>
        <div className="space-y-4">
          <div className="visible-mobile p-4 bg-yellow-200 rounded">
            Visible on Mobile Only
          </div>

          <div className="visible-tablet p-4 bg-orange-200 rounded">
            Visible on Tablet Only
          </div>

          <div className="visible-desktop p-4 bg-purple-200 rounded">
            Visible on Desktop Only
          </div>

          <div className="hidden-mobile p-4 bg-green-200 rounded">
            Hidden on Mobile
          </div>
        </div>
      </section>
    </div>
  );
}

export default ResponsiveUsageExample;

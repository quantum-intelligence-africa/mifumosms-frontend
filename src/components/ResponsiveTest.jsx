import React from 'react';
import { useResponsive } from '../hooks/useResponsive.jsx';

/**
 * Simple test component to verify responsive system is working
 */
export function ResponsiveTest() {
  const responsive = useResponsive();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Breakpoint: {responsive.breakpoint}</div>
      <div>Device: {responsive.deviceType}</div>
      <div>Mobile: {responsive.isMobile ? 'Yes' : 'No'}</div>
      <div>Touch: {responsive.isTouchDevice ? 'Yes' : 'No'}</div>
      <div>Viewport: {responsive.viewport.width}x{responsive.viewport.height}</div>
      <div>Scaled: {responsive.scaledViewport?.width?.toFixed(0) || '0'}x{responsive.scaledViewport?.height?.toFixed(0) || '0'}</div>
      <div>Scale: {responsive.viewportScale?.toFixed(2) || '1.00'}</div>
      <div>Max Width: {responsive.maxWidth || 'auto'}</div>
    </div>
  );
}

export default ResponsiveTest;

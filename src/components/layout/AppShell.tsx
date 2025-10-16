import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close sidebar when screen becomes desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] lg:pl-[272px]">
      {/* Fixed Sidebar (Desktop) */}
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 w-[272px] border-r border-[hsl(var(--border))] bg-white overflow-y-auto custom-scrollbar">
          <AppSidebar isOpen={true} onClose={() => {}} />
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      <div className="lg:hidden">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-dvh">
        {/* Header */}
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable Content with Smart Scaling */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-[92vw] max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Scale Root - This element gets scaled on large screens */}
            <div id="app-scale-root" className="w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

interface PageFrameProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the content column. */
  width?: string;
}

/** The standard SENDA page chrome (sidebar + header + title row) used by every call-center page. */
export function PageFrame({ title, subtitle, actions, children, width = "max-w-6xl" }: PageFrameProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className={cn("mx-auto space-y-3.5", width)}>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-foreground/60">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

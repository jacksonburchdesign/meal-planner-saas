import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function PageWrapper({ children, title, action, noPadding = false }: PageWrapperProps) {
  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] bg-zinc-50 relative flex flex-col overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary-100)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_left,_var(--color-primary-50)_0%,_transparent_50%)] opacity-60 pointer-events-none mix-blend-multiply" />
      
      {/* Sticky Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{title}</h1>
            {action && <div>{action}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-md mx-auto relative z-10 ${noPadding ? '' : 'px-4 py-6'}`}>
        {children}
      </main>

      {/* Global Bottom Navigation */}
      <Navbar />
    </div>
  );
}

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
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] bg-zinc-50 relative flex flex-col">
      {/* Sticky Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{title}</h1>
            {action && <div>{action}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-md mx-auto ${noPadding ? '' : 'px-4 py-6'}`}>
        {children}
      </main>

      {/* Global Bottom Navigation */}
      <Navbar />
    </div>
  );
}

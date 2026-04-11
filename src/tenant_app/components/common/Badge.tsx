import type { ReactNode } from 'react';

export function Badge({ children, variant = 'default', className = '' }: { children: ReactNode, variant?: 'success' | 'warning' | 'danger' | 'default' | 'primary', className?: string }) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    default: 'bg-zinc-100 text-zinc-700 border-zinc-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

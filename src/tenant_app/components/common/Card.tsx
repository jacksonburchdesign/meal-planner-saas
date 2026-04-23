import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, interactive = false, className = '', ...props }: CardProps) {
  const baseStyles = "bg-white/70 backdrop-blur-3xl rounded-2xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] overflow-hidden relative";
  const interactiveStyles = interactive ? "transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] hover:border-white/80 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer" : "";

  return (
    <div className={`${baseStyles} ${interactiveStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

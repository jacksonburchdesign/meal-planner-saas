import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-300 active:scale-[0.97] rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] px-6";
  
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/20 focus:ring-primary-500",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm focus:ring-zinc-900",
    outline: "bg-white/80 backdrop-blur-sm text-zinc-700 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 focus:ring-zinc-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-100",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-200"
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

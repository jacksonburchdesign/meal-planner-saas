import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && <label className="text-[13px] font-semibold text-zinc-700 ml-1 tracking-tight">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</div>}
          <input
            ref={ref}
            className={`w-full bg-zinc-50/50 backdrop-blur-sm border border-zinc-200 text-zinc-900 text-[15px] font-medium rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all duration-300 outline-none min-h-[48px] ${
              icon ? 'pl-11 pr-4' : 'px-4'
            } ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500 ml-1 font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

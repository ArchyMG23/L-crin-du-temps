import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5'
  };

  const variants = {
    primary: 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90 border border-[var(--sep)] shadow-sm active:scale-[0.98]',
    secondary: 'bg-[var(--badge-bg)] text-[var(--text)] hover:bg-[var(--badge-bg)]/80 border border-[var(--sep)] active:scale-[0.98]',
    gold: 'bg-[var(--or)] hover:opacity-90 text-black font-bold uppercase tracking-widest shadow-md shadow-[var(--or)]/10 active:scale-[0.98]',
    outline: 'border border-[var(--or)]/40 text-[var(--or)] hover:bg-[var(--badge-bg)] active:scale-[0.98]',
    ghost: 'text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white active:scale-[0.98]'
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      
      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}
    </button>
  );
};

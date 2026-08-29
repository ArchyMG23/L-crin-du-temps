import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap';

  const variants = {
    default: 'bg-[#1A1A1A] text-white/80 border border-white/10',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
    danger: 'bg-rose-950/80 text-rose-300 border border-rose-500/40',
    gold: 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold',
    outline: 'bg-transparent text-white/70 border border-white/20'
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

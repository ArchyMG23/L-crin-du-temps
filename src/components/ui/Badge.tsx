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
    default: 'bg-[var(--badge-bg)] text-[var(--text)] border border-[var(--badge-border)]',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    gold: 'bg-[var(--badge-bg)] text-[var(--or)] border border-[var(--badge-border)] font-semibold',
    outline: 'bg-transparent text-[var(--text-soft)] border border-[var(--sep)]'
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  children,
  ...props
}) => {
  const sizeClass =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-6 py-3 text-sm'
      : 'px-4 py-2 text-sm';

  const variantClass =
    variant === 'primary'
      ? 'aegion-btn-glow border border-transparent shadow-sm hover:opacity-95'
      : variant === 'secondary'
      ? 'bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] text-[var(--aegion-platform-text)] border border-[var(--aegion-platform-border-strong)]'
      : variant === 'danger'
      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-500 dark:text-red-200 border border-red-500/30'
      : 'bg-transparent hover:bg-[var(--aegion-platform-accent-soft)] text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)] border border-transparent';

  const primaryStyle =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--aegion-platform-accent)',
          color: 'var(--aegion-platform-accent-fg)',
          ...style,
        }
      : style;

  return (
    <button
      {...props}
      style={primaryStyle}
      className={`inline-flex items-center justify-center gap-2 aegion-btn-shape font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aegion-platform-accent)] disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${sizeClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

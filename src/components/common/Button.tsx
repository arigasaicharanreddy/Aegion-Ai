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
      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white border border-transparent shadow-sm'
      : variant === 'secondary'
      ? 'bg-white/[0.06] hover:bg-white/[0.11] text-[#F3F4F6] border border-white/10'
      : variant === 'danger'
      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/25'
      : 'bg-transparent hover:bg-white/[0.06] text-[#D1D5DB] hover:text-white border border-transparent';

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${sizeClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

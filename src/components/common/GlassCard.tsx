import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
}) => {
  const padClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
      ? 'p-4'
      : padding === 'lg'
      ? 'p-6 sm:p-8'
      : 'p-5 sm:p-6';

  return (
    <div
      onClick={onClick}
      className={`aegion-glass rounded-xl transition-colors duration-150 ${padClass} ${
        onClick ? 'cursor-pointer hover:border-white/20' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

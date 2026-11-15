import React from 'react';
import { motion } from 'motion/react';

export const PageTransition: React.FC<{ children: React.ReactNode; routeKey: string }> = ({
  children,
  routeKey,
}) => (
  <motion.div
    key={routeKey}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    className="h-full"
  >
    {children}
  </motion.div>
);

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-20 w-full' }) => (
  <div className={`aegion-shimmer rounded-xl border border-[var(--aegion-platform-border)] ${className}`} />
);

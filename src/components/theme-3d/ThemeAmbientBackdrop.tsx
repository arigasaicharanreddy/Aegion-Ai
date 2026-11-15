import React from 'react';
import { usePlatformTheme } from '../../context/PlatformThemeContext';

/**
 * Restrained GPU-accelerated theme-aware backdrop rendered cleanly behind platform content.
 * Adapts dynamically to each of the 10 platform themes' visualStyle.pattern and motion settings.
 */
export const ThemeAmbientBackdrop: React.FC<{ variant?: 'public' | 'workspace' }> = ({
  variant = 'workspace',
}) => {
  const { activeTheme, effectiveMotionMode } = usePlatformTheme();
  const isDisabled = effectiveMotionMode === 'disabled';
  const preset = isDisabled ? 'static' : activeTheme.animationPreset;
  const pattern = activeTheme.visualStyle.pattern;

  if (pattern === 'minimal') {
    return null;
  }

  const animClass =
    preset === 'aurora-flow'
      ? 'aegion-anim-aurora-flow'
      : preset === 'neural-pulse'
      ? 'aegion-anim-neural-pulse'
      : preset === 'prism-shift'
      ? 'aegion-anim-prism-shift'
      : preset === 'subtle-breath' || preset === 'bento-drift'
      ? 'aegion-anim-subtle-breath'
      : '';

  const opacityFactor = variant === 'public' ? 1 : 0.72;
  const showAtmosphericMesh =
    pattern === 'glass-mesh' ||
    pattern === 'aurora' ||
    pattern === 'neural' ||
    pattern === 'prism' ||
    pattern === 'neon-trace';

  const showGrid =
    pattern === 'swiss-grid' || pattern === 'bento-grid' || pattern === 'graphite-lines';

  const showDots = pattern === 'neural' || pattern === 'neon-trace';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{ opacity: opacityFactor }}
    >
      {/* Primary & Secondary Atmospheric Depth (Glassmorphism, Aurora, Neural, Prism, Neon) */}
      {showAtmosphericMesh && (
        <>
          <div
            className={`absolute -top-[18%] -left-[10%] w-[54vw] h-[54vw] max-w-[780px] max-h-[780px] rounded-full blur-3xl ${animClass}`}
            style={{
              background: `radial-gradient(circle at 38% 38%, var(--aegion-platform-mesh-primary), transparent 72%)`,
            }}
          />
          <div
            className={`absolute -bottom-[20%] -right-[12%] w-[48vw] h-[48vw] max-w-[720px] max-h-[720px] rounded-full blur-3xl ${animClass}`}
            style={{
              background: `radial-gradient(circle at 60% 60%, var(--aegion-platform-mesh-secondary), transparent 72%)`,
              animationDelay: '-6s',
            }}
          />
        </>
      )}

      {/* Subtle Warm Top Vignette for Ivory Executive */}
      {pattern === 'ivory-editorial' && (
        <div
          className="absolute inset-x-0 top-0 h-[420px]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, var(--aegion-platform-mesh-primary), transparent 75%)',
          }}
        />
      )}

      {/* Precision Grid Geometry (Swiss Precision, Bento Intelligence, Graphite Executive) */}
      {showGrid && (
        <div
          className="absolute inset-0 aegion-grid-pattern"
          style={{
            opacity: pattern === 'swiss-grid' ? 0.52 : pattern === 'bento-grid' ? 0.35 : 0.22,
            maskImage: 'radial-gradient(ellipse at 50% 35%, black 22%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 22%, transparent 80%)',
          }}
        />
      )}

      {/* Micro-Node Lattice (Neural Cosmos, Midnight Neon) */}
      {showDots && (
        <div
          className="absolute inset-0 aegion-dot-pattern"
          style={{
            opacity: pattern === 'neural' ? 0.38 : 0.24,
            maskImage: 'radial-gradient(ellipse at 65% 30%, black 15%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 65% 30%, black 15%, transparent 72%)',
          }}
        />
      )}
    </div>
  );
};

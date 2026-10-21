import React from 'react';
import { PlatformName } from '../types/models';

/**
 * Official delivery platform brand colors (used for platform indicator dots).
 * Inline hex values on purpose: Tailwind emerald/green are remapped to Buddy cyan.
 */
export const PLATFORM_BRAND_COLORS: Record<
  PlatformName,
  { dot: string; border: string }
> = {
  Glovo: { dot: '#FFC244', border: '#F59E0B' },
  'Uber Eats': { dot: '#06C167', border: '#04A65A' },
  'Bolt Food': { dot: '#34D186', border: '#22B573' },
};

export const PLATFORM_DISPLAY_ORDER: PlatformName[] = [
  'Glovo',
  'Uber Eats',
  'Bolt Food',
];

/** Returns only the platforms enabled in the courier profile, in display order. */
export function getEnabledProfilePlatforms(
  activePlatforms: PlatformName[] | undefined | null
): PlatformName[] {
  const list = Array.isArray(activePlatforms) ? activePlatforms : [];
  const filtered = PLATFORM_DISPLAY_ORDER.filter((p) => list.includes(p));
  return filtered.length > 0 ? filtered : ['Glovo'];
}

export const PlatformBrandDot: React.FC<{
  platform: PlatformName;
  size?: number;
  className?: string;
}> = ({ platform, size = 10, className = '' }) => {
  const brand = PLATFORM_BRAND_COLORS[platform];
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundColor: brand?.dot || '#94A3B8',
        boxShadow: `inset 0 0 0 1px ${brand?.border || '#64748B'}`,
      }}
      className={`inline-block rounded-full shrink-0 ${className}`}
    />
  );
};

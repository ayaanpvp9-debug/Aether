import { useId } from 'react';

/** The VELTRIX mark: a faceted "V" — one luminous plane, one white blade. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const gradientId = useId();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <path d="M3 7h6.6L18 26.4 26.4 7H33L21.4 31h-6.8z" fill={`url(#${gradientId})`} />
      <path d="M26.4 7H33L21.4 31h-3.6z" fill="#F5F5F7" fillOpacity=".92" />
    </svg>
  );
}

import type { SVGProps } from 'react';

export function KurusLogo({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <rect width="48" height="48" rx="14" fill="url(#kurus-logo-bg)" />
      <path d="M14 11.5v25" stroke="#071525" strokeWidth="5" strokeLinecap="round" />
      <path d="m33.5 10.5-17 14 17 13" stroke="#071525" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="11" r="3.25" fill="#F6E7B0" />
      <defs>
        <linearGradient id="kurus-logo-bg" x1="6" y1="4" x2="43" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67F0E3" />
          <stop offset="1" stopColor="#25B8AA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

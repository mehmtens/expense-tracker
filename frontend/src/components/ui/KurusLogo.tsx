import type { SVGProps } from 'react';

export function KurusLogo({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <circle cx="24" cy="24" r="22" fill="url(#kurus-coin-rim)" />
      <circle cx="24" cy="24" r="18.5" fill="url(#kurus-coin-face)" stroke="#FFF2BC" strokeOpacity=".58" />
      <circle cx="24" cy="24" r="15.5" stroke="#071525" strokeOpacity=".28" />
      <path d="M17 13.5v21M31.5 13.5 18 24.2 31.5 34.5" stroke="#FFF0B8" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34.5" cy="32.8" r="2" fill="#FFF0B8" />
      <path d="M9.7 15.5A17 17 0 0 1 16 9.7" stroke="#FFF8D5" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <defs>
        <linearGradient id="kurus-coin-rim" x1="7" y1="5" x2="42" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0B8" />
          <stop offset=".38" stopColor="#C89232" />
          <stop offset=".68" stopColor="#F4D477" />
          <stop offset="1" stopColor="#8D5D18" />
        </linearGradient>
        <radialGradient id="kurus-coin-face" cx="0" cy="0" r="1" gradientTransform="translate(18 15) rotate(53) scale(30)"><stop stopColor="#35D7C7" /><stop offset=".58" stopColor="#087D78" /><stop offset="1" stopColor="#063C43" /></radialGradient>
      </defs>
    </svg>
  );
}

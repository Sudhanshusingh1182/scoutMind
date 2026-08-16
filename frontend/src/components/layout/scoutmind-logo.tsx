import React from "react";

export default function ScoutMindLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8A00" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>
        <linearGradient id="sm-glow" x1="20" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="32" cy="32" r="32" fill="url(#sm-bg)" />
      {/* Neural network nodes */}
      <circle cx="32" cy="18" r="4" fill="url(#sm-glow)" />
      <circle cx="20" cy="30" r="3.5" fill="url(#sm-glow)" />
      <circle cx="44" cy="30" r="3.5" fill="url(#sm-glow)" />
      <circle cx="24" cy="44" r="3" fill="url(#sm-glow)" />
      <circle cx="40" cy="44" r="3" fill="url(#sm-glow)" />
      <circle cx="32" cy="36" r="2.5" fill="url(#sm-glow)" opacity="0.7" />
      {/* Neural network connections */}
      <line x1="32" y1="18" x2="20" y2="30" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="32" y1="18" x2="44" y2="30" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="20" y1="30" x2="32" y2="36" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="44" y1="30" x2="32" y2="36" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="32" y1="36" x2="24" y2="44" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="32" y1="36" x2="40" y2="44" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="20" y1="30" x2="24" y2="44" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="44" y1="30" x2="40" y2="44" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.3" />
    </svg>
  );
}

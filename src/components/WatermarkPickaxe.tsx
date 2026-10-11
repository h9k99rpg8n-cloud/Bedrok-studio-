import React from 'react';

interface WatermarkPickaxeProps {
  className?: string;
  opacity?: number;
}

export const WatermarkPickaxe: React.FC<WatermarkPickaxeProps> = ({
  className = 'w-64 h-64',
  opacity = 0.08,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} pointer-events-none select-none`}
      style={{ opacity }}
      fill="currentColor"
    >
      {/* Minecraft Pixelated Pickaxe Vector */}
      {/* Handle / Stick (diagonal pixel blocks) */}
      <rect x="20" y="75" width="5" height="5" />
      <rect x="25" y="70" width="5" height="5" />
      <rect x="30" y="65" width="5" height="5" />
      <rect x="35" y="60" width="5" height="5" />
      <rect x="40" y="55" width="5" height="5" />
      <rect x="45" y="50" width="5" height="5" />
      <rect x="50" y="45" width="5" height="5" />
      <rect x="55" y="40" width="5" height="5" />
      <rect x="60" y="35" width="5" height="5" />
      <rect x="65" y="30" width="5" height="5" />

      {/* Pickaxe Head (pixelated arc) */}
      <rect x="45" y="25" width="5" height="5" />
      <rect x="50" y="20" width="5" height="5" />
      <rect x="55" y="20" width="5" height="5" />
      <rect x="60" y="20" width="5" height="5" />
      <rect x="65" y="20" width="5" height="5" />
      <rect x="70" y="20" width="5" height="5" />
      <rect x="75" y="25" width="5" height="5" />

      {/* Pickaxe tips */}
      <rect x="40" y="30" width="5" height="5" />
      <rect x="35" y="35" width="5" height="5" />
      <rect x="30" y="40" width="5" height="5" />

      <rect x="80" y="30" width="5" height="5" />
      <rect x="85" y="35" width="5" height="5" />
      <rect x="90" y="40" width="5" height="5" />

      {/* Head reinforce */}
      <rect x="60" y="25" width="10" height="10" />
      <rect x="55" y="25" width="5" height="5" />
      <rect x="70" y="25" width="5" height="5" />
    </svg>
  );
};

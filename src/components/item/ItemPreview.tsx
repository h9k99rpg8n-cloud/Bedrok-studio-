import React, { useState } from 'react';
import { CustomItem, ItemRarity } from '../../types/item';

interface ItemPreviewProps {
  item: Partial<CustomItem>;
  textureDataUrl?: string;
  className?: string;
}

const RARITY_COLORS: Record<ItemRarity, { text: string; label: string; border: string }> = {
  common: { text: '#ffffff', label: 'Común', border: 'border-slate-700' },
  uncommon: { text: '#ffff55', label: 'Poco común', border: 'border-yellow-500/40' },
  rare: { text: '#55ffff', label: 'Raro', border: 'border-cyan-400/40' },
  epic: { text: '#ff55ff', label: 'Épico', border: 'border-fuchsia-400/40' },
};

export const ItemPreview: React.FC<ItemPreviewProps> = ({
  item,
  textureDataUrl,
  className = '',
}) => {
  const [previewMode, setPreviewMode] = useState<'slot' | 'hand'>('slot');
  const [durabilityDemo, setDurabilityDemo] = useState<number>(100); // 0 to 100%

  const rarity = item.rarity || 'common';
  const rarityConfig = RARITY_COLORS[rarity];
  const maxStack = item.maxStackSize ?? 64;
  const glint = Boolean(item.glint);
  const handEquipped = Boolean(item.handEquipped);
  const hasDurability = Boolean(item.durability?.enabled && (item.durability?.maxDurability || 0) > 0);

  // Compute durability bar color
  const durabilityPct = durabilityDemo;
  const barColor =
    durabilityPct > 50 ? '#55ff55' : durabilityPct > 20 ? '#ffaa00' : '#ff5555';

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-2xl bg-[#090d16] border border-slate-800 ${className}`}>
      {/* Header with Mode Switcher */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <i className="bx bx-show text-emerald-400" />
          Vista Previa Oficial
        </span>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setPreviewMode('slot')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
              previewMode === 'slot'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ranura GUI
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('hand')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
              previewMode === 'hand'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            En Mano (3D)
          </button>
        </div>
      </div>

      {/* Main Preview Frame */}
      <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#101726] to-[#070b14] border-2 border-slate-800/80 shadow-inner overflow-hidden select-none">
        {/* Background Minecraft UI Pattern Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        {previewMode === 'slot' ? (
          /* Minecraft Inventory Slot Frame (Official GUI proportions) */
          <div className="relative w-28 h-28 bg-[#8b8b8b] p-1.5 rounded-lg border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-[#ffffff]/70 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-[#8f8f8f] flex items-center justify-center relative overflow-hidden shadow-inner">
              {textureDataUrl ? (
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <img
                    src={textureDataUrl}
                    alt={item.displayName || 'Ítem'}
                    className="w-full h-full object-contain pixelated drop-shadow-md select-none"
                  />
                  {/* Enchantment Glint Animation Overlay */}
                  {glint && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80 animate-pulse"
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(236,72,153,0.7) 50%, rgba(59,130,246,0.4) 100%)',
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center p-2 text-slate-600">
                  <i className="bx bx-image-alt text-3xl" />
                  <span className="text-[9px] block">Sin textura</span>
                </div>
              )}

              {/* Stack size badge (Minecraft font style in lower right) */}
              {maxStack > 1 && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  }}
                  className="absolute bottom-1 right-1.5 text-sm font-bold text-white leading-none pointer-events-none"
                >
                  {maxStack}
                </span>
              )}

              {/* Durability Health Bar */}
              {hasDurability && (
                <div className="absolute bottom-1 left-1.5 right-1.5 h-1 bg-[#000000] border border-[#2a2a2a] overflow-hidden pointer-events-none">
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${durabilityPct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Hand perspective simulation */
          <div className="relative w-full h-full flex items-center justify-center">
            {textureDataUrl ? (
              <div
                className={`relative w-24 h-24 flex items-center justify-center transition-transform duration-300 ${
                  handEquipped ? 'rotate-45 scale-110 translate-y-2 translate-x-2' : ''
                }`}
              >
                <img
                  src={textureDataUrl}
                  alt={item.displayName || 'Ítem'}
                  className="w-full h-full object-contain pixelated filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                />
                {glint && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80 animate-pulse"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(236,72,153,0.7) 50%, rgba(59,130,246,0.4) 100%)',
                    }}
                  />
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Asigna una textura para ver en mano</span>
            )}
          </div>
        )}
      </div>

      {/* Durability slider demo if durability is enabled */}
      {hasDurability && (
        <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Desgaste de durabilidad:</span>
            <span className="font-mono font-bold" style={{ color: barColor }}>
              {Math.round((durabilityDemo / 100) * (item.durability?.maxDurability || 100))} / {item.durability?.maxDurability}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={durabilityDemo}
            onChange={(e) => setDurabilityDemo(parseInt(e.target.value, 10))}
            className="w-full h-1.5 accent-emerald-400 cursor-pointer"
          />
        </div>
      )}

      {/* Official Minecraft Tooltip Card Preview */}
      <div
        className="p-3 rounded-xl border border-purple-950/80 bg-[#100720]/90 text-left flex flex-col gap-1 shadow-lg"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(168, 85, 247, 0.2)',
        }}
      >
        <span
          className="text-sm font-bold tracking-wide"
          style={{
            color: rarityConfig.text,
            textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
          }}
        >
          {item.displayName || 'Ítem Personalizado'}
        </span>

        <span className="text-[10px] font-mono text-slate-400">
          custom:{item.identifier || 'mi_item'}
        </span>

        {/* Badges / Stats */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1 pt-1 border-t border-purple-900/30 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-medium">
            {rarityConfig.label}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-mono">
            Pila máx: {maxStack}
          </span>
          {item.offHand && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
              Mano secundaria
            </span>
          )}
          {item.weapon?.enabled && (item.weapon.attackDamage || 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
              +{item.weapon.attackDamage} Daño
            </span>
          )}
          {item.food?.enabled && (item.food.nutrition || 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
              +{item.food.nutrition} Comida
            </span>
          )}
          {glint && (
            <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/40 text-fuchsia-300 font-bold">
              Brillo mágica (Glint)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { CustomBlock } from '../types/bedrock';
import { Plus, Copy, Trash2, Box, Sparkles } from 'lucide-react';

interface BlockListSidebarProps {
  blocks: CustomBlock[];
  activeBlockId: string;
  onSelectBlock: (id: string) => void;
  onAddBlock: () => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  compact?: boolean;
}

// Mini 16x16 Canvas Thumbnail
const MiniThumbnail: React.FC<{ grid: string[][] }> = ({ grid }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 16, 16);
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        ctx.fillStyle = grid[r]?.[c] || '#78716C';
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      width={16}
      height={16}
      className="w-9 h-9 rounded-lg border border-white/10 pixelated shrink-0 bg-slate-950 shadow-inner"
    />
  );
};

export const BlockListSidebar: React.FC<BlockListSidebarProps> = ({
  blocks,
  activeBlockId,
  onSelectBlock,
  onAddBlock,
  onDuplicateBlock,
  onDeleteBlock,
  compact = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Bloques del Add-on ({blocks.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onAddBlock}
          className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Block List (Horizontal scroll on mobile, vertical stack on desktop) */}
      <div
        className={`flex ${
          compact ? 'flex-row overflow-x-auto pb-1 gap-2' : 'flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1'
        }`}
      >
        {blocks.map((b) => {
          const isSelected = b.id === activeBlockId;
          return (
            <div
              key={b.id}
              onClick={() => onSelectBlock(b.id)}
              className={`min-h-[52px] group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              } ${compact ? 'shrink-0 min-w-[200px]' : 'w-full'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MiniThumbnail grid={b.textures.all} />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    {b.displayName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {b.identifier}
                  </div>
                </div>
              </div>

              {/* Action buttons (Duplicate, Delete) */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateBlock(b.id);
                  }}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Duplicar bloque"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {blocks.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(b.id);
                    }}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

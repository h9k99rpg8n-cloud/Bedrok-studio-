import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BlockTextures, TextureFace } from '../types/bedrock';
import {
  PALETTE_PRESETS,
  cloneGrid,
  generateStoneTexture,
  generateRubyOreTexture,
  generateNeonLampTexture,
  generateIceTexture,
  generateWoodTexture,
  generateGlowingObsidianTexture,
} from '../utils/texturePresets';
import {
  Paintbrush,
  PaintBucket,
  Eraser,
  Pipette,
  SunMedium,
  Undo2,
  Redo2,
  Sparkles,
  Grid,
  RotateCcw,
} from 'lucide-react';

interface TextureEditorProps {
  textures: BlockTextures;
  onChange: (updated: BlockTextures) => void;
  blockName: string;
}

type Tool = 'pencil' | 'bucket' | 'eraser' | 'picker' | 'shade';

export const TextureEditor: React.FC<TextureEditorProps> = ({
  textures,
  onChange,
  blockName,
}) => {
  const [activeFace, setActiveFace] = useState<TextureFace>('all');
  const [selectedColor, setSelectedColor] = useState<string>('#EF4444');
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [recentColors, setRecentColors] = useState<string[]>([
    '#EF4444', '#DC2626', '#78716C', '#57534E', '#10B981', '#06B6D4', '#F59E0B', '#1E293B',
  ]);

  // History stack for undo / redo
  const [history, setHistory] = useState<string[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active grid based on face selection
  const currentGrid = useCallback((): string[][] => {
    if (textures.mode === 'top_bottom_sides') {
      if (activeFace === 'up') return textures.top || textures.all;
      if (activeFace === 'down') return textures.bottom || textures.all;
      if (activeFace === 'side') return textures.side || textures.all;
    }
    return textures.all;
  }, [textures, activeFace]);

  // Push current state to history when initialized or changed
  const saveToHistory = useCallback((grid: string[][]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, cloneGrid(grid)];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Initialize history with initial grid if empty
  useEffect(() => {
    if (history.length === 0) {
      const g = currentGrid();
      setHistory([cloneGrid(g)]);
      setHistoryIndex(0);
    }
  }, [currentGrid, history.length]);

  const updateGrid = (newGrid: string[][], addToHistory = true) => {
    const updated: BlockTextures = { ...textures };
    if (textures.mode === 'top_bottom_sides') {
      if (activeFace === 'up') updated.top = newGrid;
      else if (activeFace === 'down') updated.bottom = newGrid;
      else if (activeFace === 'side') updated.side = newGrid;
      else updated.all = newGrid;
    } else {
      updated.all = newGrid;
    }
    onChange(updated);
    if (addToHistory) {
      saveToHistory(newGrid);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetGrid = history[nextIndex];
      setHistoryIndex(nextIndex);
      updateGrid(cloneGrid(targetGrid), false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetGrid = history[nextIndex];
      setHistoryIndex(nextIndex);
      updateGrid(cloneGrid(targetGrid), false);
    }
  };

  // Color picker selection
  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
    if (!recentColors.includes(col)) {
      setRecentColors((prev) => [col, ...prev.slice(0, 11)]);
    }
  };

  // Flood fill algorithm
  const floodFill = (grid: string[][], startR: number, startC: number, targetCol: string, replaceCol: string) => {
    if (targetCol === replaceCol) return grid;
    const cloned = cloneGrid(grid);
    const queue: [number, number][] = [[startR, startC]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= 16 || c < 0 || c >= 16) continue;
      if (cloned[r][c] !== targetCol) continue;

      cloned[r][c] = replaceCol;

      queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }
    return cloned;
  };

  // Adjust brightness for shader tool (±15%)
  const adjustBrightness = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Drawing tracking
  const isPointerDownRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw canvas whenever currentGrid or showGridLines changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = currentGrid();
    const cellSize = canvas.width / 16;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        ctx.fillStyle = grid[r]?.[c] || '#78716C';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // Draw pixel grid lines
    if (showGridLines) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 16; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }
    }
  }, [currentGrid, showGridLines]);

  const applyToolAtCell = (r: number, c: number) => {
    if (r < 0 || r >= 16 || c < 0 || c >= 16) return;
    const grid = currentGrid();

    if (activeTool === 'pencil') {
      if (grid[r][c] === selectedColor) return;
      const next = cloneGrid(grid);
      next[r][c] = selectedColor;
      updateGrid(next, false);
    } else if (activeTool === 'eraser') {
      const defaultBg = '#78716C';
      if (grid[r][c] === defaultBg) return;
      const next = cloneGrid(grid);
      next[r][c] = defaultBg;
      updateGrid(next, false);
    } else if (activeTool === 'picker') {
      const picked = grid[r][c] || '#78716C';
      handleSelectColor(picked);
      setActiveTool('pencil');
    } else if (activeTool === 'bucket') {
      const targetCol = grid[r][c];
      const next = floodFill(grid, r, c, targetCol, selectedColor);
      updateGrid(next, true);
    } else if (activeTool === 'shade') {
      const curr = grid[r][c];
      const shaded = adjustBrightness(curr, 15);
      const next = cloneGrid(grid);
      next[r][c] = shaded;
      updateGrid(next, false);
    }
  };

  const getCellFromCoords = (clientX: number, clientY: number): { r: number; c: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) return null;

    const cellSize = rect.width / 16;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    return { r: Math.max(0, Math.min(15, r)), c: Math.max(0, Math.min(15, c)) };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const cell = getCellFromCoords(e.clientX, e.clientY);
    if (cell) {
      applyToolAtCell(cell.r, cell.c);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    if (activeTool === 'bucket' || activeTool === 'picker') return; // only single click for bucket/picker

    const cell = getCellFromCoords(e.clientX, e.clientY);
    if (cell) {
      applyToolAtCell(cell.r, cell.c);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      saveToHistory(currentGrid());
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Add subtle Minecraft texture noise
  const addTextureNoise = () => {
    const grid = currentGrid();
    const next = cloneGrid(grid);
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const rand = Math.random();
        if (rand < 0.25) {
          next[r][c] = adjustBrightness(next[r][c], 10);
        } else if (rand > 0.75) {
          next[r][c] = adjustBrightness(next[r][c], -10);
        }
      }
    }
    updateGrid(next, true);
  };

  // Preset quick textures
  const applyPreset = (presetFn: () => string[][]) => {
    const newTex = presetFn();
    updateGrid(newTex, true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Texture Mode & Face Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Modo de Texturizado</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onChange({ ...textures, mode: 'all' })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                textures.mode === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cubo Uniforme
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...textures,
                  mode: 'top_bottom_sides',
                  top: textures.top || cloneGrid(textures.all),
                  bottom: textures.bottom || cloneGrid(textures.all),
                  side: textures.side || cloneGrid(textures.all),
                })
              }
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                textures.mode === 'top_bottom_sides'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Caras
            </button>
          </div>
        </div>

        {/* If multi-face is enabled, show face selector */}
        {textures.mode === 'top_bottom_sides' && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveFace('up')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeFace === 'up'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ⬆️ Cara Arriba
            </button>
            <button
              type="button"
              onClick={() => setActiveFace('side')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeFace === 'side'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ↔️ Laterales
            </button>
            <button
              type="button"
              onClick={() => setActiveFace('down')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                activeFace === 'down'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ⬇️ Cara Abajo
            </button>
          </div>
        )}
      </div>

      {/* Main Touch Canvas & Tools Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-4 shadow-lg">
        {/* Top Canvas Controls Bar: Undo, Redo, Grid, Noise */}
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform"
              title="Deshacer (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform"
              title="Rehacer (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowGridLines(!showGridLines)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors ${
                showGridLines
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
              title="Alternar cuadrícula de píxeles"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={addTextureNoise}
              className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium active:scale-95 transition-transform"
              title="Agregar ruido y sombreado procedural"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sombra Pixel</span>
            </button>
          </div>
        </div>

        {/* 16x16 Interactive Canvas (Optimized for Mobile Touch) */}
        <div className="relative touch-none select-none rounded-2xl p-2 bg-slate-950 border border-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-xl cursor-crosshair pixelated touch-none"
          />
        </div>

        {/* Tool Palette (Pencil, Bucket, Eraser, Eyedropper, Shading) */}
        <div className="w-full flex items-center justify-around gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTool('pencil')}
            className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTool === 'pencil'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Lápiz"
          >
            <Paintbrush className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Lápiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('bucket')}
            className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTool === 'bucket'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Bote de pintura"
          >
            <PaintBucket className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Relleno</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTool === 'eraser'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Borrador"
          >
            <Eraser className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Borrar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('picker')}
            className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTool === 'picker'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Cuentagotas"
          >
            <Pipette className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Gotero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('shade')}
            className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTool === 'shade'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Aclarar píxel (+15% brillo)"
          >
            <SunMedium className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Aclarar</span>
          </button>
        </div>

        {/* Current Color & Palette Section */}
        <div className="w-full flex flex-col gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300">Color Seleccionado</span>
            <div className="flex items-center gap-2">
              <label className="relative flex items-center gap-2 cursor-pointer bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
                <span
                  className="w-6 h-6 rounded-lg border border-white/20 shadow-inner shrink-0"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-xs font-mono uppercase text-slate-300">{selectedColor}</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleSelectColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>

          {/* Quick Recent Colors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-400 shrink-0 mr-1">Recientes:</span>
            {recentColors.map((col, idx) => (
              <button
                key={`${col}-${idx}`}
                type="button"
                onClick={() => handleSelectColor(col)}
                className={`min-h-[36px] min-w-[36px] rounded-lg border transition-transform active:scale-90 ${
                  selectedColor.toLowerCase() === col.toLowerCase()
                    ? 'border-white scale-110 shadow-sm'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>

          {/* Preset Minecraft Palettes */}
          <div className="flex flex-col gap-2 pt-1">
            {PALETTE_PRESETS.map((cat, catIdx) => (
              <div key={`palette-${cat.name}-${catIdx}`} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-400">{cat.name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.colors.map((c, cIdx) => (
                    <button
                      key={`color-${cat.name}-${c}-${cIdx}`}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      className={`w-7 h-7 rounded-md border transition-transform active:scale-90 ${
                        selectedColor.toLowerCase() === c.toLowerCase()
                          ? 'border-white ring-2 ring-emerald-500 scale-110'
                          : 'border-slate-800/80 hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instant Bedrock Texture Templates (Quick Generators) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Plantillas Rápidas de Bloque
          </span>
          <span className="text-[11px] text-slate-400">1 toque para rellenar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset(generateRubyOreTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-rose-600 border border-rose-400 flex items-center justify-center shrink-0">
              💎
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Mineral Rubí</div>
              <div className="text-[10px] text-slate-400">Veta de gema</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(generateNeonLampTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-cyan-500 border border-cyan-300 flex items-center justify-center shrink-0">
              💡
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Lámpara Neón</div>
              <div className="text-[10px] text-slate-400">Núcleo brillante</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(generateIceTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-sky-400 border border-sky-200 flex items-center justify-center shrink-0">
              🧊
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Hielo Glaciar</div>
              <div className="text-[10px] text-slate-400">Cristalino</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(generateStoneTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-stone-500/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-stone-600 border border-stone-400 flex items-center justify-center shrink-0">
              🪨
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Piedra Lisa</div>
              <div className="text-[10px] text-slate-400">Base rocosa</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(generateWoodTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-700/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-amber-800 border border-amber-600 flex items-center justify-center shrink-0">
              🪵
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Tablones</div>
              <div className="text-[10px] text-slate-400">Veta de roble</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(generateGlowingObsidianTexture)}
            className="min-h-[44px] flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-purple-900 border border-purple-500 flex items-center justify-center shrink-0">
              🔮
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Obsidiana Runas</div>
              <div className="text-[10px] text-slate-400">Grietas mágicas</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

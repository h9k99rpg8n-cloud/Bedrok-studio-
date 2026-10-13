import React, { useState, useRef, useEffect } from 'react';
import { BlockBoxItem, FaceTextures } from '../types/addon';

interface Box3DVisualizerProps {
  collisionBoxes: BlockBoxItem[];
  selectionBoxes: BlockBoxItem[];
  collisionEnabled: boolean;
  selectionEnabled: boolean;
  selectedBoxId?: string;
  selectedBoxType?: 'collision' | 'selection';
  onSelectBox?: (id: string, type: 'collision' | 'selection') => void;
  faceTextures?: FaceTextures;
  className?: string;
}

export const Box3DVisualizer: React.FC<Box3DVisualizerProps> = ({
  collisionBoxes,
  selectionBoxes,
  collisionEnabled,
  selectionEnabled,
  selectedBoxId,
  selectedBoxType,
  onSelectBox,
  faceTextures,
  className = '',
}) => {
  // Orbit angles (isometric view default: rotX = -25, rotY = 45)
  const [rotX, setRotX] = useState<number>(-25);
  const [rotY, setRotY] = useState<number>(45);
  const [zoom, setZoom] = useState<number>(1.0);

  // Layer toggles
  const [showBlockBase, setShowBlockBase] = useState<boolean>(true);
  const [showCollision, setShowCollision] = useState<boolean>(true);
  const [showSelection, setShowSelection] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);

  // Pointer drag tracking
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse / Touch handlers for 3D orbit rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + dx * 0.7);
    setRotX((prev) => Math.max(-85, Math.min(85, prev - dy * 0.7)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Preset view buttons
  const setView = (type: 'iso' | 'front' | 'top' | 'side') => {
    if (type === 'iso') {
      setRotX(-25);
      setRotY(45);
    } else if (type === 'front') {
      setRotX(0);
      setRotY(0);
    } else if (type === 'top') {
      setRotX(-90);
      setRotY(0);
    } else if (type === 'side') {
      setRotX(0);
      setRotY(90);
    }
  };

  // Convert Bedrock 16-unit box coordinates to 3D CSS pixels
  // In Bedrock:
  // Full block size: 16x16x16 units
  // Origin: [-8, 0, -8] to [8, 16, 8]
  // In our 3D stage: let 1 block unit = 9px (so 16 units = 144px cube)
  const SCALE = 8.5; // pixels per Bedrock unit

  const renderBedrockBox = (
    box: BlockBoxItem,
    type: 'collision' | 'selection',
    index: number
  ) => {
    const isSelected = selectedBoxId === box.id && selectedBoxType === type;
    const [ox, oy, oz] = box.origin;
    const [w, h, d] = box.size;

    const widthPx = Math.max(2, w * SCALE);
    const heightPx = Math.max(2, h * SCALE);
    const depthPx = Math.max(2, d * SCALE);

    // Bedrock coordinates: center of block is at (x=0, y=8, z=0)
    // Box origin is minimum corner: x from -8, y from 0, z from -8
    // In CSS 3D stage with center at (0, 0, 0) where ground is y = -72px:
    const posX = (ox + w / 2) * SCALE;
    // In CSS 3D: negative Y is UP, positive Y is DOWN.
    // Bedrock: Y=0 is bottom ground, Y=16 is top of standard block.
    // Let Y=0 map to 72px (ground level), Y=16 map to -72px (top).
    const posY = -(oy + h / 2 - 8) * SCALE;
    const posZ = (oz + d / 2) * SCALE;

    const isCol = type === 'collision';

    return (
      <div
        key={`${type}-${box.id}-${index}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBox?.(box.id, type);
        }}
        className={`absolute cursor-pointer transition-opacity ${
          isSelected ? 'z-30' : 'z-10'
        }`}
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          transformStyle: 'preserve-3d',
          transform: `translate3d(${posX - widthPx / 2}px, ${posY - heightPx / 2}px, ${posZ}px)`,
        }}
        title={`${isCol ? 'Colisión' : 'Selección'}: ${box.name || `Caja ${index + 1}`} [${w}×${h}×${d}]`}
      >
        {/* Front Face (Z+) */}
        <div
          className={`absolute inset-0 border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/40 shadow-lg shadow-emerald-500/50'
                : 'border-emerald-500/90 bg-emerald-500/20'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/40 shadow-lg shadow-cyan-500/50'
              : 'border-cyan-400/90 bg-cyan-500/20'
          }`}
          style={{ transform: `translateZ(${depthPx / 2}px)` }}
        />
        {/* Back Face (Z-) */}
        <div
          className={`absolute inset-0 border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/30'
                : 'border-emerald-500/70 bg-emerald-500/15'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/30'
              : 'border-cyan-400/70 bg-cyan-500/15'
          }`}
          style={{ transform: `rotateY(180deg) translateZ(${depthPx / 2}px)` }}
        />
        {/* Right Face (X+) */}
        <div
          className={`absolute border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/30'
                : 'border-emerald-500/80 bg-emerald-500/15'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/30'
              : 'border-cyan-400/80 bg-cyan-500/15'
          }`}
          style={{
            width: `${depthPx}px`,
            height: `${heightPx}px`,
            left: `${widthPx / 2 - depthPx / 2}px`,
            transform: `rotateY(90deg) translateZ(${widthPx / 2}px)`,
          }}
        />
        {/* Left Face (X-) */}
        <div
          className={`absolute border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/30'
                : 'border-emerald-500/80 bg-emerald-500/15'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/30'
              : 'border-cyan-400/80 bg-cyan-500/15'
          }`}
          style={{
            width: `${depthPx}px`,
            height: `${heightPx}px`,
            left: `${widthPx / 2 - depthPx / 2}px`,
            transform: `rotateY(-90deg) translateZ(${widthPx / 2}px)`,
          }}
        />
        {/* Top Face (Y+) */}
        <div
          className={`absolute border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/35'
                : 'border-emerald-500/80 bg-emerald-500/20'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/35'
              : 'border-cyan-400/80 bg-cyan-500/20'
          }`}
          style={{
            width: `${widthPx}px`,
            height: `${depthPx}px`,
            top: `${heightPx / 2 - depthPx / 2}px`,
            transform: `rotateX(90deg) translateZ(${heightPx / 2}px)`,
          }}
        />
        {/* Bottom Face (Y-) */}
        <div
          className={`absolute border-2 ${
            isCol
              ? isSelected
                ? 'border-emerald-300 bg-emerald-400/25'
                : 'border-emerald-500/60 bg-emerald-500/10'
              : isSelected
              ? 'border-cyan-300 bg-cyan-400/25'
              : 'border-cyan-400/60 bg-cyan-500/10'
          }`}
          style={{
            width: `${widthPx}px`,
            height: `${depthPx}px`,
            top: `${heightPx / 2 - depthPx / 2}px`,
            transform: `rotateX(-90deg) translateZ(${heightPx / 2}px)`,
          }}
        />
      </div>
    );
  };

  const fullBlockSize = 16 * SCALE; // 136px

  return (
    <div
      className={`box3d-visualizer relative w-full bg-[#060911] border border-slate-800 rounded-2xl overflow-hidden flex flex-col select-none ${className}`}
    >
      {/* 3D Canvas Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-64 sm:h-72 flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        style={{ perspective: '850px' }}
      >
        {/* Ambient background glow */}
        <div className="absolute w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none bottom-0" />

        {/* Floating 3D Root Container */}
        <div
          className="relative transition-transform duration-75 ease-out"
          style={{
            width: '0px',
            height: '0px',
            transformStyle: 'preserve-3d',
            transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Ground Grid Platform (at Y = 0, which is +68px from center) */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              width: `${fullBlockSize * 1.5}px`,
              height: `${fullBlockSize * 1.5}px`,
              left: `${-(fullBlockSize * 1.5) / 2}px`,
              top: `${-(fullBlockSize * 1.5) / 2}px`,
              transform: `rotateX(90deg) translateZ(-${fullBlockSize / 2}px)`,
              background:
                'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(9, 13, 22, 0.8) 70%)',
              border: '1px dashed rgba(51, 65, 85, 0.6)',
            }}
          />

          {/* Coordinate Axes at Origin */}
          {showAxes && (
            <div
              className="absolute pointer-events-none"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(-${fullBlockSize / 2}px, ${fullBlockSize / 2}px, -${fullBlockSize / 2}px)`,
              }}
            >
              {/* X Axis (Red) */}
              <div
                className="absolute bg-rose-500"
                style={{
                  width: '36px',
                  height: '2px',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
              {/* Y Axis (Green, pointing UP in Bedrock -> negative in CSS) */}
              <div
                className="absolute bg-emerald-400"
                style={{
                  width: '2px',
                  height: '36px',
                  transform: 'translate3d(0, -36px, 0)',
                }}
              />
              {/* Z Axis (Blue) */}
              <div
                className="absolute bg-sky-400"
                style={{
                  width: '36px',
                  height: '2px',
                  transform: 'rotateY(-90deg) translate3d(0, 0, 0)',
                  transformOrigin: 'left center',
                }}
              />
            </div>
          )}

          {/* BASE REFERENCE BLOCK (16x16x16 Full Cube) */}
          {showBlockBase && (
            <div
              className="absolute pointer-events-none"
              style={{
                width: `${fullBlockSize}px`,
                height: `${fullBlockSize}px`,
                left: `${-fullBlockSize / 2}px`,
                top: `${-fullBlockSize / 2}px`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Front (North) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-800/30 backdrop-blur-[1px] flex items-center justify-center pixelated"
                style={{ transform: `translateZ(${fullBlockSize / 2}px)` }}
              >
                {faceTextures?.north ? (
                  <img
                    src={faceTextures.north}
                    alt=""
                    className="w-full h-full object-cover opacity-80 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
              {/* Back (South) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-800/30 flex items-center justify-center pixelated"
                style={{
                  transform: `rotateY(180deg) translateZ(${fullBlockSize / 2}px)`,
                }}
              >
                {faceTextures?.south ? (
                  <img
                    src={faceTextures.south}
                    alt=""
                    className="w-full h-full object-cover opacity-80 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
              {/* Right (East) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-800/30 flex items-center justify-center pixelated"
                style={{
                  transform: `rotateY(90deg) translateZ(${fullBlockSize / 2}px)`,
                }}
              >
                {faceTextures?.east ? (
                  <img
                    src={faceTextures.east}
                    alt=""
                    className="w-full h-full object-cover opacity-80 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
              {/* Left (West) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-800/30 flex items-center justify-center pixelated"
                style={{
                  transform: `rotateY(-90deg) translateZ(${fullBlockSize / 2}px)`,
                }}
              >
                {faceTextures?.west ? (
                  <img
                    src={faceTextures.west}
                    alt=""
                    className="w-full h-full object-cover opacity-80 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
              {/* Top (Up) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-800/40 flex items-center justify-center pixelated"
                style={{
                  transform: `rotateX(90deg) translateZ(${fullBlockSize / 2}px)`,
                }}
              >
                {faceTextures?.up ? (
                  <img
                    src={faceTextures.up}
                    alt=""
                    className="w-full h-full object-cover opacity-85 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
              {/* Bottom (Down) */}
              <div
                className="absolute inset-0 border border-slate-700/60 bg-slate-900/50 flex items-center justify-center pixelated"
                style={{
                  transform: `rotateX(-90deg) translateZ(${fullBlockSize / 2}px)`,
                }}
              >
                {faceTextures?.down ? (
                  <img
                    src={faceTextures.down}
                    alt=""
                    className="w-full h-full object-cover opacity-75 pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center select-none">
                    <i className="bx bx-image-alt text-2xl text-slate-600 mb-0.5" />
                    <span className="text-[8px] font-mono text-slate-400">Sin textura</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RENDER COLLISION BOXES */}
          {showCollision &&
            collisionEnabled &&
            collisionBoxes.map((box, idx) =>
              renderBedrockBox(box, 'collision', idx)
            )}

          {/* RENDER SELECTION BOXES */}
          {showSelection &&
            selectionEnabled &&
            selectionBoxes.map((box, idx) =>
              renderBedrockBox(box, 'selection', idx)
            )}
        </div>

        {/* Floating Top Controls Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Quick Perspective Views */}
          <div className="flex items-center gap-1 bg-[#090d16]/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto shadow-md">
            <button
              type="button"
              onClick={() => setView('iso')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Vista Isométrica"
            >
              3D Iso
            </button>
            <button
              type="button"
              onClick={() => setView('front')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Vista Frontal"
            >
              Frente
            </button>
            <button
              type="button"
              onClick={() => setView('top')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Vista Superior"
            >
              Arriba
            </button>
            <button
              type="button"
              onClick={() => setView('side')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Vista Lateral"
            >
              Lado
            </button>
          </div>

          {/* Zoom In / Out Buttons */}
          <div className="flex items-center gap-1 bg-[#090d16]/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto shadow-md">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Alejar"
            >
              <i className="bx bx-minus text-xs" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Acercar"
            >
              <i className="bx bx-plus text-xs" />
            </button>
            <input aria-label="Nivel de zoom del visor 3D" type="range" min="0.6" max="2.2" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-20 sm:w-28 accent-emerald-400" />
            <button type="button" onClick={() => { const node = containerRef.current?.closest('.box3d-visualizer') as HTMLElement | null; if (node?.requestFullscreen) void node.requestFullscreen().catch(() => undefined); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800" title="Abrir visor en pantalla completa" aria-label="Pantalla completa">
              <i className="bx bx-fullscreen text-sm" />
            </button>
          </div>
        </div>

        {/* Drag Hint on Center Bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[9px] font-mono text-slate-500 bg-[#090d16]/80 px-2 py-0.5 rounded-full border border-slate-800/80">
            Arrastra para rotar 360° en 3D
          </span>
        </div>
      </div>

      {/* Bottom Bar: Layer Toggles and Legend */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Base Block Toggle */}
          <button
            type="button"
            onClick={() => setShowBlockBase(!showBlockBase)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              showBlockBase
                ? 'bg-slate-900 text-slate-200 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}
          >
            <i className={`bx ${showBlockBase ? 'bx-cube' : 'bx-cube-alt'}`} />
            <span>Cubo Base (16³)</span>
          </button>

          {/* Collision Toggle */}
          <button
            type="button"
            onClick={() => setShowCollision(!showCollision)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
              showCollision && collisionEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-850 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Colisión ({collisionEnabled ? collisionBoxes.length : 'Off'})</span>
          </button>

          {/* Selection Toggle */}
          <button
            type="button"
            onClick={() => setShowSelection(!showSelection)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
              showSelection && selectionEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-850 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Selección ({selectionEnabled ? selectionBoxes.length : 'Off'})</span>
          </button>
        </div>

        {/* Reset View Button */}
        <button
          type="button"
          onClick={() => {
            setView('iso');
            setZoom(1.0);
          }}
          className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
          title="Restablecer posición de cámara 3D"
        >
          <i className="bx bx-reset" />
          <span>Reset Vista</span>
        </button>
      </div>
    </div>
  );
};

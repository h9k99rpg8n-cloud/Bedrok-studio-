import React, { useEffect, useRef, useState } from 'react';
import { CustomBlock } from '../types/bedrock';
import { RotateCw, Sun, Moon, Sparkles, Eye } from 'lucide-react';

interface Block3DPreviewProps {
  block: CustomBlock;
  compact?: boolean;
}

export const Block3DPreview: React.FC<Block3DPreviewProps> = ({ block, compact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(-25); // degrees
  const [rotY, setRotY] = useState<number>(45);  // degrees
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.1);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Face textures as offscreen canvases
  const offscreenTexturesRef = useRef<{
    all: HTMLCanvasElement;
    top: HTMLCanvasElement;
    bottom: HTMLCanvasElement;
    side: HTMLCanvasElement;
  }>({
    all: document.createElement('canvas'),
    top: document.createElement('canvas'),
    bottom: document.createElement('canvas'),
    side: document.createElement('canvas'),
  });

  // Render 16x16 grids to offscreen canvases
  useEffect(() => {
    const renderGridToCanvas = (grid: string[][] | undefined, canvas: HTMLCanvasElement) => {
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (!ctx || !grid) return;
      ctx.clearRect(0, 0, 16, 16);
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          ctx.fillStyle = grid[r]?.[c] || '#78716C';
          ctx.fillRect(c, r, 1, 1);
        }
      }
    };

    const { textures } = block;
    renderGridToCanvas(textures.all, offscreenTexturesRef.current.all);
    renderGridToCanvas(textures.top || textures.all, offscreenTexturesRef.current.top);
    renderGridToCanvas(textures.bottom || textures.all, offscreenTexturesRef.current.bottom);
    renderGridToCanvas(textures.side || textures.all, offscreenTexturesRef.current.side);
  }, [block.textures]);

  // Auto-spin animation loop
  useEffect(() => {
    if (!isAutoSpin) return;
    let animId: number;
    const animate = () => {
      setRotY((prev) => (prev + 0.6) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isAutoSpin]);

  // Main 3D Rendering Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient depending on day/night mode
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isNightMode) {
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0b0f19');
    } else {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Optional subtle grid floor in 3D
    const floorY = height * 0.76;
    ctx.strokeStyle = isNightMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -4; i <= 4; i++) {
      ctx.moveTo(width * 0.5 + i * 36, floorY - 20);
      ctx.lineTo(width * 0.5 + i * 50, floorY + 40);
    }
    ctx.stroke();

    // 3D Math
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    // Cube vertices (-1 to 1)
    const rawVertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // Front (0,1,2,3)
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],  // Back (4,5,6,7)
    ];

    const size = (compact ? 70 : 95) * zoom;
    const centerX = width / 2;
    const centerY = height / 2;

    // Transform vertices
    const transformed = rawVertices.map(([vx, vy, vz]) => {
      // Rotate Y
      const x1 = vx * cosY + vz * sinY;
      const y1 = vy;
      const z1 = -vx * sinY + vz * cosY;

      // Rotate X
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // Perspective projection
      const cameraDistance = 4.2;
      const scale = cameraDistance / (cameraDistance + z2);
      const px = centerX + x2 * size * scale;
      const py = centerY + y2 * size * scale;

      return { x: px, y: py, z: z2 };
    });

    // 6 Faces defined with indices [v0, v1, v2, v3], normal, and face type
    interface FaceDef {
      indices: [number, number, number, number];
      type: 'top' | 'bottom' | 'side';
      normal: [number, number, number];
      name: string;
    }

    const faces: FaceDef[] = [
      { indices: [0, 1, 2, 3], type: 'side', normal: [0, 0, -1], name: 'north' },
      { indices: [5, 4, 7, 6], type: 'side', normal: [0, 0, 1], name: 'south' },
      { indices: [4, 0, 3, 7], type: 'side', normal: [-1, 0, 0], name: 'west' },
      { indices: [1, 5, 6, 2], type: 'side', normal: [1, 0, 0], name: 'east' },
      { indices: [4, 5, 1, 0], type: 'top', normal: [0, -1, 0], name: 'up' },
      { indices: [3, 2, 6, 7], type: 'bottom', normal: [0, 1, 0], name: 'down' },
    ];

    // Calculate center Z for sorting and compute lighting
    const renderableFaces = faces
      .map((face) => {
        const [i0, i1, i2, i3] = face.indices;
        const p0 = transformed[i0];
        const p1 = transformed[i1];
        const p2 = transformed[i2];
        const p3 = transformed[i3];

        // 2D Normal cross product for backface culling
        const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
        const isVisible = cross < 0;

        // Transform 3D Normal
        const [nx, ny, nz] = face.normal;
        const nx1 = nx * cosY + nz * sinY;
        const ny1 = ny;
        const nz1 = -nx * sinY + nz * cosY;
        const ny2 = ny1 * cosX - nz1 * sinX;
        const nz2 = ny1 * sinX + nz1 * cosX;

        // Directional light vector (coming from top-left)
        const lightDir = [-0.4, -0.8, -0.4];
        const len = Math.hypot(...lightDir);
        const lnx = lightDir[0] / len;
        const lny = lightDir[1] / len;
        const lnz = lightDir[2] / len;

        const dot = Math.max(0, -(nx1 * lnx + ny2 * lny + nz2 * lnz));

        // Light level calculation (0 to 15)
        const emissionBoost = (block.properties.lightEmission / 15) * 0.75;
        const ambient = isNightMode ? 0.25 : 0.45;
        const brightness = Math.min(1.2, ambient + dot * (isNightMode ? 0.4 : 0.6) + emissionBoost);

        const avgZ = (p0.z + p1.z + p2.z + p3.z) / 4;

        return {
          face,
          pts: [p0, p1, p2, p3],
          isVisible,
          avgZ,
          brightness,
        };
      })
      .filter((f) => f.isVisible)
      .sort((a, b) => b.avgZ - a.avgZ);

    // Glow aura if block emits light
    if (block.properties.lightEmission > 0) {
      const glowIntensity = block.properties.lightEmission / 15;
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        size * 0.4,
        centerX,
        centerY,
        size * (1.2 + glowIntensity * 0.6)
      );
      const glowColor = block.properties.mapColor || '#38bdf8';
      glowGrad.addColorStop(0, `${glowColor}${Math.floor(glowIntensity * 120).toString(16).padStart(2, '0')}`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow on the floor
    ctx.save();
    ctx.fillStyle = isNightMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + size * 1.1, size * 0.9, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw visible faces
    const isMultiFace = block.textures.mode === 'top_bottom_sides';
    const isTranslucent = block.properties.renderMethod === 'blend';

    renderableFaces.forEach(({ face, pts, brightness }) => {
      const [p0, p1, p2, p3] = pts;

      let srcCanvas = offscreenTexturesRef.current.all;
      if (isMultiFace) {
        if (face.type === 'top') srcCanvas = offscreenTexturesRef.current.top;
        else if (face.type === 'bottom') srcCanvas = offscreenTexturesRef.current.bottom;
        else srcCanvas = offscreenTexturesRef.current.side;
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.clip();

      if (isTranslucent) {
        ctx.globalAlpha = 0.75;
      }

      // Draw the pixel texture mapped by drawing triangular / bilinear affine mesh
      // We can subdivide 16x16 into cells or draw affine transformed halves for crisp pixel rendering
      // Bilinear triangle draw for p0, p1, p2 and p0, p2, p3:
      const drawTexturedTriangle = (
        tp0: { x: number; y: number },
        tp1: { x: number; y: number },
        tp2: { x: number; y: number },
        u0: number, v0: number,
        u1: number, v1: number,
        u2: number, v2: number
      ) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tp0.x, tp0.y);
        ctx.lineTo(tp1.x, tp1.y);
        ctx.lineTo(tp2.x, tp2.y);
        ctx.closePath();
        ctx.clip();

        // Calculate affine transformation matrix
        const delta = u0 * (v1 - v2) - v0 * (u1 - u2) + (u1 * v2 - u2 * v1);
        if (Math.abs(delta) > 1e-6) {
          const m11 = -(v0 * (tp1.x - tp2.x) - v1 * (tp0.x - tp2.x) + v2 * (tp0.x - tp1.x)) / delta;
          const m12 = (v0 * (tp1.y - tp2.y) - v1 * (tp0.y - tp2.y) + v2 * (tp0.y - tp1.y)) / delta;
          const m21 = (u0 * (tp1.x - tp2.x) - u1 * (tp0.x - tp2.x) + u2 * (tp0.x - tp1.x)) / delta;
          const m22 = -(u0 * (tp1.y - tp2.y) - u1 * (tp0.y - tp2.y) + u2 * (tp0.y - tp1.y)) / delta;
          const dx = (u0 * (v1 * tp2.x - v2 * tp1.x) - v0 * (u1 * tp2.x - u2 * tp1.x) + (u1 * v2 - u2 * v1) * tp0.x) / delta;
          const dy = (u0 * (v1 * tp2.y - v2 * tp1.y) - v0 * (u1 * tp2.y - u2 * tp1.y) + (u1 * v2 - u2 * v1) * tp0.y) / delta;

          ctx.transform(m11, m12, m21, m22, dx, dy);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(srcCanvas, 0, 0, 16, 16);
        }
        ctx.restore();
      };

      // Draw two triangles with 0..16 texture coordinates
      drawTexturedTriangle(p0, p1, p2, 0, 0, 16, 0, 16, 16);
      drawTexturedTriangle(p0, p2, p3, 0, 0, 16, 16, 0, 16);

      // Light shading overlay
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();

      if (brightness < 1.0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - brightness})`;
        ctx.fill();
      } else if (brightness > 1.0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(brightness - 1.0) * 0.4})`;
        ctx.fill();
      }

      ctx.restore();

      // Subtle edge line
      ctx.strokeStyle = isNightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();
    });
  }, [rotX, rotY, zoom, isNightMode, compact, block]);

  // Touch and Drag handlers for 360 degree rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoSpin(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => (prev + dx * 0.7) % 360);
    setRotX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.7)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 shadow-lg">
      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-emerald-400" />
          Vista 3D Interactiva
        </span>
        <div className="flex items-center gap-1">
          {block.properties.lightEmission > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              Luz: {block.properties.lightEmission}/15
            </span>
          )}
        </div>
      </div>

      {/* 3D Canvas with Touch Drag */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={compact ? 240 : 320}
          height={compact ? 240 : 320}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        />

        {/* Floating Quick Controls */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-auto">
          {/* Auto spin toggle */}
          <button
            type="button"
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`min-h-[36px] min-w-[36px] px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors backdrop-blur-md ${
              isAutoSpin
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title="Rotación automática"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoSpin ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">{isAutoSpin ? 'Giro' : 'Pausado'}</span>
          </button>

          {/* Day / Night ambient lighting toggle */}
          <button
            type="button"
            onClick={() => setIsNightMode(!isNightMode)}
            className={`min-h-[36px] min-w-[36px] px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors backdrop-blur-md ${
              isNightMode
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title="Alternar luz de noche / día"
          >
            {isNightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Noche</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Día</span>
              </>
            )}
          </button>

          {/* Reset position */}
          <button
            type="button"
            onClick={() => {
              setRotX(-25);
              setRotY(45);
              setZoom(1.1);
            }}
            className="min-h-[36px] px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 backdrop-blur-md"
            title="Reiniciar vista"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-slate-400 text-center">
        Toca y arrastra con el dedo para girar 360° en cualquier dirección
      </p>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BlockFaceKey, CustomBlock, CustomTexture, TextureMode } from '../types/addon';

interface TexturePainterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTexture: (texture: CustomTexture) => void;
  initialBlock?: CustomBlock | null;
  targetFace?: BlockFaceKey | null;
  onApplyToBlockFace?: (face: BlockFaceKey, textureDataUrl: string) => void;
}

export type DrawTool =
  | 'pencil'
  | 'eraser'
  | 'select'
  | 'bucket'
  | 'picker'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'pan';

export type TextureResolution = 16 | 32 | 64 | 128;

export interface SelectedPixelInfo {
  r: number;
  c: number;
  color: string;
}

export const TexturePainterModal: React.FC<TexturePainterModalProps> = ({
  isOpen,
  onClose,
  onSaveTexture,
  initialBlock,
  targetFace,
  onApplyToBlockFace,
}) => {
  // Texture Metadata
  const [textureName, setTextureName] = useState<string>('textura_bloque');
  const [resolution, setResolution] = useState<TextureResolution>(16);
  const [shapeFilled, setShapeFilled] = useState<boolean>(false);

  // Active Tool & Colors
  const [activeTool, setActiveTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState<string>('#10b981');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#78716c', '#ffffff', '#000000',
  ]);

  // Pixel selection state
  const [selectedPixel, setSelectedPixel] = useState<SelectedPixelInfo | null>(null);

  // Grid State: 2D array of RGBA hex string or '' for transparent
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: 16 }, () => Array(16).fill(''))
  );

  // Undo / Redo History
  const [history, setHistory] = useState<string[][][]>([]);
  const [redoStack, setRedoStack] = useState<string[][][]>([]);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // Pointer & Dragging interaction
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastDrawnCellRef = useRef<{ r: number; c: number } | null>(null);

  // Multitouch gesture tracking (natural pinch-to-zoom & two-finger pan)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const initialMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Live shape drag preview coordinates (r, c)
  const [shapePreview, setShapePreview] = useState<{
    startR: number;
    startC: number;
    currR: number;
    currC: number;
  } | null>(null);

  // Face editing state if opened in block context
  const [currentFace, setCurrentFace] = useState<BlockFaceKey>(targetFace || 'up');
  const [faceTexturesMap, setFaceTexturesMap] = useState<Record<BlockFaceKey, string>>({
    up: '',
    down: '',
    north: '',
    south: '',
    east: '',
    west: '',
  });

  // Reference Image Panel
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceOpacity, setReferenceOpacity] = useState<number>(0.8);
  const [referenceZoom, setReferenceZoom] = useState<number>(1);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolution Warning
  const [pendingResolution, setPendingResolution] = useState<TextureResolution | null>(null);

  // Palette of 24 classic Minecraft tones
  const minecraftPalette = [
    // Terrains & Nature
    '#5c8e32', '#416823', '#866043', '#61442c', '#a17849', '#624623',
    // Stones & Ores
    '#808080', '#5a5a5a', '#3a3a3a', '#9ffcfb', '#248f8d', '#fdf49a',
    // Vibrants & Redstone
    '#e2a64c', '#dc2626', '#991b1b', '#10b981', '#06b6d4', '#3b82f6',
    // Nether & Obsidian
    '#8b5cf6', '#2b2340', '#14101e', '#ffffff', '#94a3b8', '#000000',
  ];

  // Initialize or reset on open
  useEffect(() => {
    if (isOpen) {
      if (initialBlock) {
        setTextureName(`${initialBlock.identifier}_tex`);
        setCurrentFace(targetFace || 'up');
        const faces = initialBlock.faceTextures || {
          up: initialBlock.textureDataUrl || '',
          down: initialBlock.textureDataUrl || '',
          north: initialBlock.textureDataUrl || '',
          south: initialBlock.textureDataUrl || '',
          east: initialBlock.textureDataUrl || '',
          west: initialBlock.textureDataUrl || '',
        };
        setFaceTexturesMap({
          up: faces.up || '',
          down: faces.down || '',
          north: faces.north || '',
          south: faces.south || '',
          east: faces.east || '',
          west: faces.west || '',
        });

        // Load active face texture into grid if exists
        const initialTexUrl = faces[targetFace || 'up'] || initialBlock.textureDataUrl || '';
        if (initialTexUrl && initialTexUrl.startsWith('data:image')) {
          loadDataUrlIntoGrid(initialTexUrl, resolution);
        } else {
          setGrid(Array.from({ length: resolution }, () => Array(resolution).fill('')));
        }
      } else {
        setGrid(Array.from({ length: resolution }, () => Array(resolution).fill('')));
      }
      setHistory([]);
      setRedoStack([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setSelectedPixel(null);
    }
  }, [isOpen, initialBlock, targetFace]);

  // Load an existing PNG dataURL into the grid
  const loadDataUrlIntoGrid = (dataUrl: string, targetRes: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = targetRes;
      off.height = targetRes;
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, targetRes, targetRes);
      const imgData = ctx.getImageData(0, 0, targetRes, targetRes);
      const newGrid: string[][] = Array.from({ length: targetRes }, () => Array(targetRes).fill(''));

      for (let r = 0; r < targetRes; r++) {
        for (let c = 0; c < targetRes; c++) {
          const idx = (r * targetRes + c) * 4;
          const a = imgData.data[idx + 3];
          if (a > 20) {
            const red = imgData.data[idx].toString(16).padStart(2, '0');
            const green = imgData.data[idx + 1].toString(16).padStart(2, '0');
            const blue = imgData.data[idx + 2].toString(16).padStart(2, '0');
            newGrid[r][c] = `#${red}${green}${blue}`;
          } else {
            newGrid[r][c] = '';
          }
        }
      }
      setGrid(newGrid);
    };
    img.src = dataUrl;
  };

  // Push state to undo history
  const pushHistory = (currentGrid: string[][]) => {
    setHistory((prev) => [...prev.slice(-30), currentGrid.map((row) => [...row])]);
    setRedoStack([]);
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [grid.map((row) => [...row]), ...prev]);
    setGrid(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    if (selectedPixel) {
      setSelectedPixel((prev) =>
        prev ? { ...prev, color: previous[prev.r]?.[prev.c] || '' } : null
      );
    }
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, grid.map((row) => [...row])]);
    setGrid(next);
    setRedoStack((prev) => prev.slice(1));
    if (selectedPixel) {
      setSelectedPixel((prev) =>
        prev ? { ...prev, color: next[prev.r]?.[prev.c] || '' } : null
      );
    }
  };

  // Color selection helper
  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    if (!recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev.filter((c) => c !== color).slice(0, 11)]);
    }
  };

  // Clear Canvas with confirmation
  const handleClearCanvas = () => {
    if (window.confirm('¿Deseas limpiar todos los píxeles del lienzo?')) {
      pushHistory(grid);
      setGrid(Array.from({ length: resolution }, () => Array(resolution).fill('')));
      setSelectedPixel(null);
    }
  };

  // Resize Resolution with check
  const handleResolutionChange = (newRes: TextureResolution) => {
    if (newRes === resolution) return;
    const hasDrawnPixels = grid.some((row) => row.some((cell) => cell !== ''));
    if (hasDrawnPixels) {
      setPendingResolution(newRes);
    } else {
      applyResolutionChange(newRes);
    }
  };

  const applyResolutionChange = (newRes: TextureResolution) => {
    pushHistory(grid);
    const newGrid: string[][] = Array.from({ length: newRes }, () => Array(newRes).fill(''));
    const minDim = Math.min(grid.length, newRes);
    for (let r = 0; r < minDim; r++) {
      for (let c = 0; c < minDim; c++) {
        newGrid[r][c] = grid[r][c] || '';
      }
    }
    setResolution(newRes);
    setGrid(newGrid);
    setPendingResolution(null);
    setSelectedPixel(null);
  };

  // Algorithms for Shapes and Lines (Bresenham)
  const getBresenhamLine = (r0: number, c0: number, r1: number, c1: number): [number, number][] => {
    const points: [number, number][] = [];
    const dc = Math.abs(c1 - c0);
    const dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1;
    const sr = r0 < r1 ? 1 : -1;
    let err = dc - dr;

    let currC = c0;
    let currR = r0;

    while (true) {
      points.push([currR, currC]);
      if (currC === c1 && currR === r1) break;
      const e2 = 2 * err;
      if (e2 > -dr) {
        err -= dr;
        currC += sc;
      }
      if (e2 < dc) {
        err += dc;
        currR += sr;
      }
    }
    return points;
  };

  const getRectanglePoints = (
    r0: number,
    c0: number,
    r1: number,
    c1: number,
    filled: boolean
  ): [number, number][] => {
    const points: [number, number][] = [];
    const minR = Math.min(r0, r1);
    const maxR = Math.max(r0, r1);
    const minC = Math.min(c0, c1);
    const maxC = Math.max(c0, c1);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (filled || r === minR || r === maxR || c === minC || c === maxC) {
          points.push([r, c]);
        }
      }
    }
    return points;
  };

  const getCirclePoints = (
    r0: number,
    c0: number,
    r1: number,
    c1: number,
    filled: boolean
  ): [number, number][] => {
    const points: [number, number][] = [];
    const radius = Math.round(Math.hypot(r1 - r0, c1 - c0));
    const minR = Math.max(0, r0 - radius);
    const maxR = Math.min(resolution - 1, r0 + radius);
    const minC = Math.max(0, c0 - radius);
    const maxC = Math.min(resolution - 1, c0 + radius);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const dist = Math.hypot(r - r0, c - c0);
        if (filled) {
          if (dist <= radius + 0.5) points.push([r, c]);
        } else {
          if (Math.abs(dist - radius) <= 0.75) points.push([r, c]);
        }
      }
    }
    return points;
  };

  // Convert client pointer coordinates to cell coords (r, c)
  const getCellFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = rect.width / resolution;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    if (r >= 0 && r < resolution && c >= 0 && c < resolution) {
      return { r, c };
    }
    return null;
  };

  // Flood fill algorithm
  const executeBucketFill = (startR: number, startC: number, fillColor: string) => {
    const targetColor = grid[startR][startC];
    if (targetColor === fillColor) return;

    pushHistory(grid);
    const next = grid.map((row) => [...row]);
    const queue: [number, number][] = [[startR, startC]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= resolution || c < 0 || c >= resolution) continue;
      if (next[r][c] !== targetColor) continue;

      next[r][c] = fillColor;
      queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }
    setGrid(next);
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch gesture initiated (e.g. 2 fingers on iPhone/iPad)
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialZoomRef.current = zoom;
      initialMidpointRef.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      initialPanRef.current = { ...pan };
      setShapePreview(null);
      return;
    }

    if (activeTool === 'pan') {
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const cell = getCellFromPointer(e);
    if (!cell) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, r: cell.r, c: cell.c };

    // Direct pixel selection tool: selects without painting or erasing
    if (activeTool === 'select') {
      setSelectedPixel({
        r: cell.r,
        c: cell.c,
        color: grid[cell.r][cell.c] || '',
      });
      return;
    }

    if (activeTool === 'picker') {
      const picked = grid[cell.r][cell.c];
      if (picked) handleSelectColor(picked);
      setActiveTool('pencil');
      return;
    }

    if (activeTool === 'bucket') {
      executeBucketFill(cell.r, cell.c, selectedColor);
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      pushHistory(grid);
      const targetVal = activeTool === 'pencil' ? selectedColor : '';
      const next = grid.map((row) => [...row]);
      next[cell.r][cell.c] = targetVal;
      setGrid(next);
      lastDrawnCellRef.current = { r: cell.r, c: cell.c };
      return;
    }

    if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle') {
      setShapePreview({
        startR: cell.r,
        startC: cell.c,
        currR: cell.r,
        currC: cell.c,
      });
    }
  };

  // Pointer Move (with Continuous Bresenham Interpolation for Pencil/Eraser)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle Natural 2-Finger Pinch Zoom and Pan
    if (activePointersRef.current.size >= 2 && initialPinchDistRef.current && initialMidpointRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = currentDist / initialPinchDistRef.current;
      const nextZoom = Math.min(8, Math.max(0.5, Number((initialZoomRef.current * scale).toFixed(2))));
      setZoom(nextZoom);

      const curMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      setPan({
        x: Math.round(initialPanRef.current.x + (curMid.x - initialMidpointRef.current.x)),
        y: Math.round(initialPanRef.current.y + (curMid.y - initialMidpointRef.current.y)),
      });
      return;
    }

    if (!isPointerDownRef.current) return;

    if (activeTool === 'pan' && panStartRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const cell = getCellFromPointer(e);
    if (!cell) return;

    if (activeTool === 'select') {
      setSelectedPixel({
        r: cell.r,
        c: cell.c,
        color: grid[cell.r][cell.c] || '',
      });
      return;
    }

    // Continuous drawing without pixel gaps
    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const targetVal = activeTool === 'pencil' ? selectedColor : '';
      const lastCell = lastDrawnCellRef.current;

      if (lastCell && (lastCell.r !== cell.r || lastCell.c !== cell.c)) {
        const intermediatePoints = getBresenhamLine(lastCell.r, lastCell.c, cell.r, cell.c);
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (const [r, c] of intermediatePoints) {
            if (r >= 0 && r < resolution && c >= 0 && c < resolution) {
              next[r][c] = targetVal;
            }
          }
          return next;
        });
      } else if (!lastCell) {
        if (grid[cell.r][cell.c] !== targetVal) {
          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[cell.r][cell.c] = targetVal;
            return next;
          });
        }
      }
      lastDrawnCellRef.current = { r: cell.r, c: cell.c };
      return;
    }

    if (
      (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle') &&
      pointerStartRef.current
    ) {
      setShapePreview({
        startR: pointerStartRef.current.r,
        startC: pointerStartRef.current.c,
        currR: cell.r,
        currC: cell.c,
      });
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    panStartRef.current = null;
    lastDrawnCellRef.current = null;
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
      initialMidpointRef.current = null;
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (shapePreview && pointerStartRef.current) {
      pushHistory(grid);
      let pointsToDraw: [number, number][] = [];

      if (activeTool === 'line') {
        pointsToDraw = getBresenhamLine(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC
        );
      } else if (activeTool === 'rectangle') {
        pointsToDraw = getRectanglePoints(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC,
          shapeFilled
        );
      } else if (activeTool === 'circle') {
        pointsToDraw = getCirclePoints(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC,
          shapeFilled
        );
      }

      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        pointsToDraw.forEach(([r, c]) => {
          if (r >= 0 && r < resolution && c >= 0 && c < resolution) {
            next[r][c] = selectedColor;
          }
        });
        return next;
      });

      setShapePreview(null);
      pointerStartRef.current = null;
    }
  };

  // Wheel zoom handler on viewport container
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((z) => Math.min(8, Math.max(0.5, Number((z + zoomDelta).toFixed(2)))));
  };

  // Canvas rendering effect
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / resolution;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Checkerboard pattern for alpha transparency preview (never saved to PNG)
    const checkSize = Math.max(4, Math.floor(cellSize / 2));
    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        const isDark = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
        ctx.fillStyle = isDark ? '#1e293b' : '#0f172a';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // 2. Draw Grid Pixels
    for (let r = 0; r < resolution; r++) {
      for (let c = 0; c < resolution; c++) {
        const color = grid[r]?.[c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // 3. Draw Shape Preview Overlay if dragging
    if (shapePreview) {
      let previewPoints: [number, number][] = [];
      if (activeTool === 'line') {
        previewPoints = getBresenhamLine(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC
        );
      } else if (activeTool === 'rectangle') {
        previewPoints = getRectanglePoints(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC,
          shapeFilled
        );
      } else if (activeTool === 'circle') {
        previewPoints = getCirclePoints(
          shapePreview.startR,
          shapePreview.startC,
          shapePreview.currR,
          shapePreview.currC,
          shapeFilled
        );
      }

      ctx.fillStyle = selectedColor;
      previewPoints.forEach(([r, c]) => {
        if (r >= 0 && r < resolution && c >= 0 && c < resolution) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      });
    }

    // 4. Draw Selected Pixel Highlight Box
    if (selectedPixel && selectedPixel.r < resolution && selectedPixel.c < resolution) {
      const sx = selectedPixel.c * cellSize;
      const sy = selectedPixel.r * cellSize;

      ctx.save();
      // Outer bright white boundary
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.floor(cellSize * 0.12));
      ctx.strokeRect(sx, sy, cellSize, cellSize);

      // Inner pulsating dashed emerald/cyan boundary
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(1.5, Math.floor(cellSize * 0.08));
      ctx.setLineDash([Math.max(3, cellSize * 0.25), Math.max(2, cellSize * 0.15)]);
      ctx.strokeRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

      // Corner accent squares
      ctx.fillStyle = '#38bdf8';
      const cornerSize = Math.max(2, Math.floor(cellSize * 0.25));
      ctx.fillRect(sx, sy, cornerSize, cornerSize);
      ctx.fillRect(sx + cellSize - cornerSize, sy, cornerSize, cornerSize);
      ctx.fillRect(sx, sy + cellSize - cornerSize, cornerSize, cornerSize);
      ctx.fillRect(sx + cellSize - cornerSize, sy + cellSize - cornerSize, cornerSize, cornerSize);
      ctx.restore();
    }

    // 5. Draw Grid lines if enabled
    if (showGridLines) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= resolution; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }
    }
  }, [grid, resolution, shapePreview, activeTool, shapeFilled, selectedColor, showGridLines, selectedPixel]);

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  // Generate PNG Data URL from grid with TRUE transparency
  const exportGridToDataUrl = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = resolution;
    offscreen.height = resolution;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < resolution; r++) {
      for (let c = 0; c < resolution; c++) {
        const color = grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c, r, 1, 1);
        } else {
          ctx.clearRect(c, r, 1, 1);
        }
      }
    }
    return offscreen.toDataURL('image/png');
  };

  // Save texture action
  const handleSave = () => {
    const dataUrl = exportGridToDataUrl();
    const cleanName = textureName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'textura';

    const newTexture: CustomTexture = {
      id: `tex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      dataUrl,
      createdAt: Date.now(),
    };

    onSaveTexture(newTexture);

    if (onApplyToBlockFace && initialBlock) {
      onApplyToBlockFace(currentFace, dataUrl);
    }

    onClose();
  };

  // Face switching inside the painter
  const handleSwitchFace = (nextFace: BlockFaceKey) => {
    if (nextFace === currentFace) return;
    const currentData = exportGridToDataUrl();

    // Cache current face
    const updatedMap = {
      ...faceTexturesMap,
      [currentFace]: currentData,
    };
    setFaceTexturesMap(updatedMap);

    if (onApplyToBlockFace) {
      onApplyToBlockFace(currentFace, currentData);
    }

    // Switch to next face and load its texture
    setCurrentFace(nextFace);
    setSelectedPixel(null);
    const targetData = updatedMap[nextFace];
    if (targetData && targetData.startsWith('data:image')) {
      loadDataUrlIntoGrid(targetData, resolution);
    } else {
      setGrid(Array.from({ length: resolution }, () => Array(resolution).fill('')));
    }
  };

  // Reference Image Upload
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setReferenceImage(event.target.result);
        setIsReferenceOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Selected pixel quick actions
  const handlePaintSelectedPixel = () => {
    if (!selectedPixel) return;
    pushHistory(grid);
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[selectedPixel.r][selectedPixel.c] = selectedColor;
      return next;
    });
    setSelectedPixel((p) => (p ? { ...p, color: selectedColor } : null));
  };

  const handleClearSelectedPixel = () => {
    if (!selectedPixel) return;
    pushHistory(grid);
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[selectedPixel.r][selectedPixel.c] = '';
      return next;
    });
    setSelectedPixel((p) => (p ? { ...p, color: '' } : null));
  };

  if (!isOpen) return null;

  const mode = initialBlock?.textureMode || 'one';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[96dvh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1322] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <i className="bx bxs-paint text-lg" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate">Editor Pixel Art</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 shrink-0">
                  {resolution}×{resolution} px
                </span>
              </div>
              <input
                type="text"
                value={textureName}
                onChange={(e) => setTextureName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="nombre_textura"
                className="bg-transparent text-[11px] sm:text-xs font-mono text-slate-400 hover:text-slate-200 focus:text-emerald-400 focus:outline-none max-w-[130px] sm:max-w-[160px] truncate"
              />
            </div>
          </div>

          {/* Quick Actions (Undo, Redo, Reference, Close) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-colors"
              title="Deshacer (Ctrl+Z)"
            >
              <i className="bx bx-undo text-lg" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-colors"
              title="Rehacer (Ctrl+Y)"
            >
              <i className="bx bx-redo text-lg" />
            </button>

            {/* Reference Image Button */}
            <input
              type="file"
              ref={refFileInputRef}
              accept="image/*"
              onChange={handleReferenceUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (referenceImage) {
                  setIsReferenceOpen(!isReferenceOpen);
                } else {
                  refFileInputRef.current?.click();
                }
              }}
              className={`min-h-[40px] px-2 sm:px-2.5 flex items-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                referenceImage
                  ? isReferenceOpen
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Imagen de Referencia"
            >
              <i className="bx bx-image text-base text-emerald-400" />
              <span className="hidden sm:inline">Referencia</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Cerrar editor"
            >
              <i className="bx bx-x text-xl" />
            </button>
          </div>
        </div>

        {/* Face Selector Bar (if in block context with 3 or 6 faces) */}
        {initialBlock && mode !== 'one' && (
          <div className="px-3 sm:px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0 [scrollbar-width:none]">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <i className="bx bxs-cube text-emerald-400" />
              Cara activa:
            </span>

            <div className="flex items-center gap-1">
              {(mode === 'three'
                ? [
                    { key: 'up' as BlockFaceKey, label: 'Superior' },
                    { key: 'down' as BlockFaceKey, label: 'Inferior' },
                    { key: 'north' as BlockFaceKey, label: 'Laterales' },
                  ]
                : [
                    { key: 'up' as BlockFaceKey, label: 'Arriba' },
                    { key: 'down' as BlockFaceKey, label: 'Abajo' },
                    { key: 'north' as BlockFaceKey, label: 'Norte' },
                    { key: 'south' as BlockFaceKey, label: 'Sur' },
                    { key: 'east' as BlockFaceKey, label: 'Este' },
                    { key: 'west' as BlockFaceKey, label: 'Oeste' },
                  ]
              ).map((face) => (
                <button
                  key={face.key}
                  type="button"
                  onClick={() => handleSwitchFace(face.key)}
                  className={`min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                    currentFace === face.key
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {face.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Warning Modal */}
        {pendingResolution && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-xs bg-slate-900 border border-amber-500/40 p-4 rounded-2xl shadow-xl flex flex-col gap-3 text-center">
              <i className="bx bx-error-circle text-3xl text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-100">¿Cambiar resolución?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cambiar de <strong>{resolution}×{resolution}</strong> a <strong>{pendingResolution}×{pendingResolution}</strong>{' '}
                puede reescalar o recortar los píxeles actuales del dibujo.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingResolution(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => applyResolutionChange(pendingResolution)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Editor Body: Adaptive Columns for Portrait and Landscape Mobile & Desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* TOOLBAR: Top in Portrait / Left in Landscape and Desktop */}
          <div className="p-2.5 sm:p-3 bg-[#0c1220] border-b md:border-b-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center md:items-stretch gap-2 shrink-0 overflow-x-auto md:overflow-y-auto overscroll-contain [scrollbar-width:none]">
            {/* Resolution Selector */}
            <div className="flex md:flex-col gap-1 shrink-0 pr-2 md:pr-0 md:pb-2 border-r md:border-r-0 md:border-b border-slate-800">
              {([16, 32, 64, 128] as TextureResolution[]).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => handleResolutionChange(res)}
                  className={`min-h-[36px] px-2 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                    resolution === res
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                  title={`Resolución ${res}x${res} px`}
                >
                  {res}×{res}
                </button>
              ))}
            </div>

            {/* Drawing Tools Buttons (Min 40px touch targets for mobile ergonomics) */}
            <div className="flex md:grid md:grid-cols-2 gap-1.5 shrink-0">
              {/* Lápiz */}
              <button
                type="button"
                onClick={() => setActiveTool('pencil')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'pencil'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Lápiz: dibujo continuo de píxeles"
              >
                <i className="bx bxs-pencil text-base" />
                <span className="text-[9px]">Lápiz</span>
              </button>

              {/* Borrador */}
              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'eraser'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Borrador transparente"
              >
                <i className="bx bxs-eraser text-base" />
                <span className="text-[9px]">Borrar</span>
              </button>

              {/* Selección Directa de Píxeles (PARTE 4 - NUEVA HERRAMIENTA) */}
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'select'
                    ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Selección directa de píxel: inspecciona X/Y y color sin modificar el lienzo"
              >
                <i className="bx bx-select-multiple text-base" />
                <span className="text-[9px]">Selección</span>
              </button>

              {/* Relleno (Cubeta) */}
              <button
                type="button"
                onClick={() => setActiveTool('bucket')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'bucket'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Cubeta de relleno"
              >
                <i className="bx bxs-color-fill text-base" />
                <span className="text-[9px]">Relleno</span>
              </button>

              {/* Cuentagotas (Picker) */}
              <button
                type="button"
                onClick={() => setActiveTool('picker')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'picker'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Cuentagotas: capturar color"
              >
                <i className="bx bx-colorize text-base" />
                <span className="text-[9px]">Gotero</span>
              </button>

              {/* Línea Recta */}
              <button
                type="button"
                onClick={() => setActiveTool('line')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'line'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Línea recta"
              >
                <i className="bx bx-minus text-base" />
                <span className="text-[9px]">Línea</span>
              </button>

              {/* Rectángulo */}
              <button
                type="button"
                onClick={() => setActiveTool('rectangle')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'rectangle'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Rectángulo"
              >
                <i className="bx bx-square text-base" />
                <span className="text-[9px]">Rect</span>
              </button>

              {/* Círculo */}
              <button
                type="button"
                onClick={() => setActiveTool('circle')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'circle'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Círculo"
              >
                <i className="bx bx-circle text-base" />
                <span className="text-[9px]">Círculo</span>
              </button>

              {/* Mover lienzo (Pan) */}
              <button
                type="button"
                onClick={() => setActiveTool('pan')}
                className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  activeTool === 'pan'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Mover lienzo (también puedes usar 2 dedos para zoom y pan natural)"
              >
                <i className="bx bx-hand text-base" />
                <span className="text-[9px]">Mover</span>
              </button>
            </div>

            {/* Shape fill option toggle */}
            {(activeTool === 'rectangle' || activeTool === 'circle') && (
              <button
                type="button"
                onClick={() => setShapeFilled(!shapeFilled)}
                className={`min-h-[36px] px-2 py-1.5 rounded-lg text-[10px] font-bold border text-center transition-colors shrink-0 ${
                  shapeFilled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {shapeFilled ? 'Relleno: SÍ' : 'Relleno: NO'}
              </button>
            )}

            {/* Canvas Clear Button */}
            <button
              type="button"
              onClick={handleClearCanvas}
              className="md:mt-auto min-h-[40px] px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1 transition-colors shrink-0"
              title="Borrar todos los píxeles del lienzo"
            >
              <i className="bx bx-trash text-sm" />
              <span className="hidden md:inline">Limpiar</span>
            </button>
          </div>

          {/* CENTER: Canvas Interactive Viewport */}
          <div
            ref={containerRef}
            onWheel={handleWheelZoom}
            className="flex-1 bg-[#070a12] p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden select-none touch-none"
          >
            {/* Viewport Floating Controls: Zoom, Reset & Grid Toggle */}
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(8, Number((z + 0.25).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-sm font-bold transition-colors"
                title="Acercar (Zoom In)"
              >
                <i className="bx bx-plus" />
              </button>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1 min-w-[34px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-sm font-bold transition-colors"
                title="Alejar (Zoom Out)"
              >
                <i className="bx bx-minus" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors"
                title="Restablecer vista a 100% y centrar"
              >
                <i className="bx bx-reset" />
              </button>
              <button
                type="button"
                onClick={() => setShowGridLines(!showGridLines)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                  showGridLines ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
                title="Mostrar/Ocultar Cuadrícula de píxeles"
              >
                <i className="bx bx-grid-alt" />
              </button>
            </div>

            {/* Gesture Tip Badge */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 pointer-events-none">
              <i className="bx bx-touch text-emerald-400" />
              <span>Gesto táctil: 2 dedos para zoom y desplazamiento natural</span>
            </div>

            {/* Drawing Canvas Container with Pan & Zoom Transform */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: activePointersRef.current.size >= 2 || activeTool === 'pan' ? 'none' : 'transform 0.08s ease-out',
              }}
              className="p-1 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-2xl relative shrink-0"
            >
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`w-[240px] h-[240px] xs:w-[280px] xs:h-[280px] sm:w-[320px] sm:h-[320px] rounded-xl pixelated touch-none ${
                  activeTool === 'pan'
                    ? 'cursor-grab active:cursor-grabbing'
                    : activeTool === 'select'
                    ? 'cursor-pointer'
                    : activeTool === 'picker'
                    ? 'cursor-crosshair'
                    : 'cursor-crosshair'
                }`}
              />
            </div>

            {/* Floating Pixel Selection Toolbar (PARTE 4 - SELECCIÓN DIRECTA) */}
            {selectedPixel && (
              <div className="absolute bottom-2 sm:bottom-3 z-20 max-w-[94%] bg-slate-900/95 border border-sky-500/50 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border border-slate-700 shrink-0"
                    style={{
                      backgroundColor: selectedPixel.color || 'transparent',
                      backgroundImage: !selectedPixel.color
                        ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 8px 8px'
                        : undefined,
                    }}
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-sky-300 block">
                      Píxel: X: {selectedPixel.c}, Y: {selectedPixel.r}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedPixel.color ? selectedPixel.color.toUpperCase() : 'Transparente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {selectedPixel.color && (
                    <button
                      type="button"
                      onClick={() => handleSelectColor(selectedPixel.color)}
                      className="min-h-[32px] px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Copiar color de este píxel a la paleta activa"
                    >
                      <i className="bx bx-colorize" />
                      <span>Copiar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePaintSelectedPixel}
                    className="min-h-[32px] px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    title="Pintar este píxel con el color activo"
                  >
                    <i className="bx bxs-paint" />
                    <span>Pintar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSelectedPixel}
                    className="min-h-[32px] px-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    title="Borrar este píxel y dejarlo transparente"
                  >
                    <i className="bx bx-trash" />
                    <span>Borrar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPixel(null)}
                    className="min-h-[32px] w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center transition-colors"
                    title="Cerrar panel de selección"
                  >
                    <i className="bx bx-x" />
                  </button>
                </div>
              </div>
            )}

            {/* Floating Reference Image Drawer */}
            {isReferenceOpen && referenceImage && (
              <div className="absolute bottom-3 left-3 z-20 w-48 sm:w-56 bg-slate-900/95 border border-slate-700 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                    <i className="bx bx-image text-emerald-400" />
                    Imagen de Referencia
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setReferenceImage(null)}
                      className="text-slate-400 hover:text-rose-400 text-xs"
                      title="Eliminar referencia"
                    >
                      <i className="bx bx-trash" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReferenceOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      <i className="bx bx-x" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-28 sm:h-32 bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
                  <img
                    src={referenceImage}
                    alt="Referencia"
                    style={{
                      opacity: referenceOpacity,
                      transform: `scale(${referenceZoom})`,
                    }}
                    className="max-w-full max-h-full object-contain pointer-events-auto cursor-copy transition-all"
                    title="Toca para tomar el color con cuentagotas"
                    onClick={(e) => {
                      const img = e.currentTarget;
                      const rect = img.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const off = document.createElement('canvas');
                      off.width = img.naturalWidth || 64;
                      off.height = img.naturalHeight || 64;
                      const ctx = off.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        const normX = Math.floor((x / rect.width) * off.width);
                        const normY = Math.floor((y / rect.height) * off.height);
                        const p = ctx.getImageData(normX, normY, 1, 1).data;
                        const hex = `#${p[0].toString(16).padStart(2, '0')}${p[1]
                          .toString(16)
                          .padStart(2, '0')}${p[2].toString(16).padStart(2, '0')}`;
                        handleSelectColor(hex);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Opacidad</span>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={referenceOpacity}
                    onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT / BOTTOM: Color Palette & Swatches */}
          <div className="p-3 bg-[#0c1220] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col gap-2.5 sm:gap-3 shrink-0 w-full md:w-64 max-h-[32vh] md:max-h-none overflow-y-auto overscroll-contain">
            {/* Active Color Preview & Hex input */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent p-0 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 block">Color Activo</span>
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  {selectedColor}
                </span>
              </div>
            </div>

            {/* Curated Minecraft Swatches */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Paleta Minecraft
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-6 gap-1.5">
                {minecraftPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className={`min-h-[32px] min-w-[32px] rounded-lg border transition-transform active:scale-90 ${
                      selectedColor.toLowerCase() === c.toLowerCase()
                        ? 'border-white ring-2 ring-emerald-500 scale-110 z-10 shadow-md'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Recent Colors */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Colores Recientes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentColors.map((c, i) => (
                  <button
                    key={`${c}_${i}`}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className={`w-7 h-7 rounded-md border transition-transform active:scale-90 ${
                      selectedColor.toLowerCase() === c.toLowerCase()
                        ? 'border-white ring-2 ring-emerald-400'
                        : 'border-slate-800'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Save Texture Button */}
            <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-800/80 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="w-full min-h-[46px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
              >
                <i className="bx bxs-save text-base" />
                <span>Guardar Textura</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

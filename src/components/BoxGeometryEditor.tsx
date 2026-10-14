import React, { useState } from 'react';
import {
  BlockBoxItem,
  BlockCollisionConfig,
  BlockSelectionConfig,
  BoxPresetTemplate,
} from '../types/addon';

interface BoxGeometryEditorProps {
  type: 'collision' | 'selection';
  config: BlockCollisionConfig | BlockSelectionConfig;
  onChangeConfig: (newConfig: BlockCollisionConfig | BlockSelectionConfig) => void;
  selectedBoxId: string;
  onSelectBoxId: (id: string) => void;
}

export const BoxGeometryEditor: React.FC<BoxGeometryEditorProps> = ({
  type,
  config,
  onChangeConfig,
  selectedBoxId,
  onSelectBoxId,
}) => {
  const isCol = type === 'collision';
  const title = isCol ? 'Caja de Colisión (Collision Box)' : 'Caja de Selección (Selection Box)';
  const componentId = isCol ? 'minecraft:collision_box' : 'minecraft:selection_box';
  const accentColor = isCol ? 'emerald' : 'cyan';

  // Bedrock max height: collision allows up to 24 units (e.g. fences), selection up to 16 units
  const maxAllowedY = isCol ? 24 : 16;

  // Active box in the boxes array
  const activeBoxIndex = config.boxes.findIndex((b) => b.id === selectedBoxId);
  const activeBox: BlockBoxItem =
    activeBoxIndex >= 0
      ? config.boxes[activeBoxIndex]
      : config.boxes[0] || {
          id: `box_${Date.now()}`,
          name: 'Caja Principal',
          origin: [-8, 0, -8],
          size: [16, 16, 16],
        };

  // Helper to update boxes array
  const updateBox = (index: number, updated: BlockBoxItem) => {
    const nextBoxes = [...config.boxes];
    nextBoxes[index] = updated;
    onChangeConfig({
      ...config,
      template: 'custom',
      boxes: nextBoxes,
    });
  };

  // Preset Template selector handler
  const handleSelectTemplate = (template: BoxPresetTemplate) => {
    if (template === 'none') {
      onChangeConfig({
        template: 'none',
        enabled: false,
        boxes: config.boxes.length > 0 ? config.boxes : [
          {
            id: `box_${Date.now()}`,
            name: isCol ? 'Sin colisión' : 'Sin selección',
            origin: [-8, 0, -8],
            size: [16, 16, 16],
          },
        ],
      });
      return;
    }

    if (template === 'default' || template === 'full') {
      const fullBox: BlockBoxItem = {
        id: `box_${Date.now()}`,
        name: 'Caja Completa',
        origin: [-8, 0, -8],
        size: [16, 16, 16],
      };
      onChangeConfig({
        template,
        enabled: true,
        boxes: [fullBox],
      });
      onSelectBoxId(fullBox.id);
      return;
    }

    if (template === 'half') {
      const halfBox: BlockBoxItem = {
        id: `box_${Date.now()}`,
        name: 'Medio Bloque (Losa)',
        origin: [-8, 0, -8],
        size: [16, 8, 16],
      };
      onChangeConfig({
        template: 'half',
        enabled: true,
        boxes: [halfBox],
      });
      onSelectBoxId(halfBox.id);
      return;
    }

    if (template === 'carpet') {
      const carpetBox: BlockBoxItem = {
        id: `box_${Date.now()}`,
        name: 'Caja Baja (Alfombra)',
        origin: [-8, 0, -8],
        size: [16, 1, 16],
      };
      onChangeConfig({
        template: 'carpet',
        enabled: true,
        boxes: [carpetBox],
      });
      onSelectBoxId(carpetBox.id);
      return;
    }

    if (template === 'custom') {
      onChangeConfig({
        ...config,
        template: 'custom',
        enabled: true,
      });
    }
  };

  // Add a new box
  const handleAddBox = () => {
    const newBox: BlockBoxItem = {
      id: `box_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Caja ${config.boxes.length + 1}`,
      origin: [-8, 0, -8],
      size: [16, 16, 16],
    };
    onChangeConfig({
      ...config,
      template: 'custom',
      enabled: true,
      boxes: [...config.boxes, newBox],
    });
    onSelectBoxId(newBox.id);
  };

  // Duplicate current box
  const handleDuplicateBox = () => {
    if (!activeBox) return;
    const duplicated: BlockBoxItem = {
      ...activeBox,
      id: `box_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${activeBox.name || 'Caja'} (Copia)`,
      // Offset slightly for visual feedback if within bounds
      origin: [
        Math.min(8, activeBox.origin[0]),
        Math.min(maxAllowedY, activeBox.origin[1]),
        Math.min(8, activeBox.origin[2]),
      ],
    };
    onChangeConfig({
      ...config,
      template: 'custom',
      enabled: true,
      boxes: [...config.boxes, duplicated],
    });
    onSelectBoxId(duplicated.id);
  };

  // Delete current box
  const handleDeleteBox = (idToDelete: string) => {
    if (config.boxes.length <= 1) {
      onChangeConfig({
        ...config,
        enabled: false,
        template: 'none',
      });
      return;
    }

    const filtered = config.boxes.filter((b) => b.id !== idToDelete);
    onChangeConfig({
      ...config,
      template: 'custom',
      boxes: filtered,
    });
    if (selectedBoxId === idToDelete && filtered[0]) {
      onSelectBoxId(filtered[0].id);
    }
  };

  // Reset values of active box
  const handleResetBox = () => {
    if (!activeBox) return;
    updateBox(activeBoxIndex, {
      ...activeBox,
      origin: [-8, 0, -8],
      size: [16, 16, 16],
    });
  };

  // Coordinate adjustments
  const handleOriginChange = (axisIndex: 0 | 1 | 2, val: number) => {
    const nextOrigin: [number, number, number] = [...activeBox.origin];
    nextOrigin[axisIndex] = Math.round(val * 10) / 10;
    updateBox(activeBoxIndex, { ...activeBox, origin: nextOrigin });
  };

  const handleSizeChange = (axisIndex: 0 | 1 | 2, val: number) => {
    const nextSize: [number, number, number] = [...activeBox.size];
    nextSize[axisIndex] = Math.max(0.1, Math.round(val * 10) / 10);
    updateBox(activeBoxIndex, { ...activeBox, size: nextSize });
  };

  // Stepper helper
  const stepOrigin = (axisIndex: 0 | 1 | 2, delta: number) => {
    handleOriginChange(axisIndex, activeBox.origin[axisIndex] + delta);
  };

  const stepSize = (axisIndex: 0 | 1 | 2, delta: number) => {
    handleSizeChange(axisIndex, activeBox.size[axisIndex] + delta);
  };

  // Real-time Bedrock Bounds Validation
  const [ox, oy, oz] = activeBox.origin;
  const [sx, sy, sz] = activeBox.size;
  const endX = ox + sx;
  const endY = oy + sy;
  const endZ = oz + sz;

  const outOfBounds =
    ox < -8 ||
    ox > 8 ||
    oy < 0 ||
    oy > maxAllowedY ||
    oz < -8 ||
    oz > 8 ||
    endX > 8 ||
    endY > maxAllowedY ||
    endZ > 8 ||
    sx <= 0 ||
    sy <= 0 ||
    sz <= 0;

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
          isCol
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-cyan-950/20 border-cyan-500/30'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isCol
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <i className={`bx ${isCol ? 'bxs-shield' : 'bx-target-lock'} text-lg`} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">{title}</h3>
            <span
              className={`text-[10px] font-mono ${
                isCol ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {componentId}
            </span>
          </div>
        </div>

        {/* Toggle Enabled / Disabled Switch */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] text-slate-300 font-semibold">
            {config.enabled ? 'Habilitada' : 'Deshabilitada'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => {
                const nextEnabled = e.target.checked;
                onChangeConfig({
                  ...config,
                  enabled: nextEnabled,
                  template: nextEnabled ? (config.template === 'none' ? 'default' : config.template) : 'none',
                });
              }}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                isCol ? 'peer-checked:bg-emerald-500' : 'peer-checked:bg-cyan-500'
              }`}
            />
          </label>
        </div>
      </div>

      {/* Disabled Explanation Banner */}
      {!config.enabled && (
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <i className="bx bx-info-circle text-base text-amber-400 shrink-0" />
          <span>
            {isCol
              ? 'El bloque no tendrá colisión (entidades y jugadores lo atravesarán libremente).'
              : 'El bloque no tendrá caja de selección (no se podrá apuntar con el cursor del jugador).'}
          </span>
        </div>
      )}

      {/* PLANTILLAS PREDETERMINADAS (PRESETS) */}
      <div className="bg-[#111827]/85 p-3 rounded-xl border border-white/[0.08] flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i className="bx bx-category-alt text-emerald-400" />
          Plantillas Predeterminadas
        </span>
        <span className="text-[10px] text-slate-400">
          Selecciona una configuración rápida coherente con los formatos de Minecraft Bedrock.
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
          {/* 1. Predeterminada */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('default')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              config.template === 'default' && config.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Predeterminada</span>
            <span className="text-[9px] font-mono text-slate-500">16×16×16 Estándar</span>
          </button>

          {/* 2. Sin colisión / selección */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('none')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              !config.enabled || config.template === 'none'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{isCol ? 'Sin Colisión' : 'Sin Selección'}</span>
            <span className="text-[9px] font-mono text-slate-500">Atravesable / Libre</span>
          </button>

          {/* 3. Caja Completa */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('full')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              config.template === 'full' && config.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Caja Completa</span>
            <span className="text-[9px] font-mono text-slate-500">Cubo sólido 16³</span>
          </button>

          {/* 4. Medio Bloque (Slab) */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('half')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              config.template === 'half' && config.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Medio Bloque</span>
            <span className="text-[9px] font-mono text-slate-500">Losa (H: 8u)</span>
          </button>

          {/* 5. Caja Baja (Carpet) */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('carpet')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              config.template === 'carpet' && config.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Caja Baja</span>
            <span className="text-[9px] font-mono text-slate-500">Alfombra (H: 1u)</span>
          </button>

          {/* 6. Personalizada */}
          <button
            type="button"
            onClick={() => handleSelectTemplate('custom')}
            className={`min-h-[44px] p-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
              config.template === 'custom' && config.enabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Personalizada</span>
            <span className="text-[9px] font-mono text-slate-500">Edición manual</span>
          </button>
        </div>
      </div>

      {/* GESTIÓN DE VARIAS CAJAS */}
      {config.enabled && (
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <i className="bx bx-layer text-emerald-400" />
                Cajas Configuradas ({config.boxes.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Selecciona la caja que deseas editar o añade nuevas
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddBox}
              className="min-h-[38px] px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <i className="bx bx-plus text-sm" />
              <span>Añadir Caja</span>
            </button>
          </div>

          {/* Multi-box Warning for Selection Box */}
          {!isCol && config.boxes.length > 1 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
              <i className="bx bx-error text-base shrink-0 mt-0.5" />
              <span>
                <strong>Aviso de compatibilidad:</strong> El componente oficial de Bedrock{' '}
                <code className="font-mono bg-slate-900 px-1 py-0.5 rounded">
                  minecraft:selection_box
                </code>{' '}
                solo admite una única caja de selección. Al exportar, se calculará automáticamente la caja envolvente total para asegurar que Minecraft no rechace el bloque.
              </span>
            </div>
          )}

          {/* Selector de Cajas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {config.boxes.map((b, idx) => {
              const isSelected = b.id === activeBox.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBoxId(b.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border flex items-center gap-2 transition-all ${
                    isSelected
                      ? isCol
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{b.name || `Caja ${idx + 1}`}</span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      isSelected
                        ? 'bg-black/20 text-slate-950'
                        : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {b.size[0]}×{b.size[1]}×{b.size[2]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Box Actions: Renombrar, Duplicar, Eliminar, Reset */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                Nombre de la caja:
              </label>
              <input
                type="text"
                value={activeBox.name || ''}
                onChange={(e) =>
                  updateBox(activeBoxIndex, { ...activeBox, name: e.target.value })
                }
                placeholder={`Caja ${activeBoxIndex + 1}`}
                className="w-full min-h-[36px] px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleDuplicateBox}
                className="min-h-[38px] px-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1"
                title="Duplicar caja"
              >
                <i className="bx bx-copy" />
                <span className="hidden sm:inline">Duplicar</span>
              </button>

              <button
                type="button"
                onClick={handleResetBox}
                className="min-h-[38px] px-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1"
                title="Restablecer a valores 16³"
              >
                <i className="bx bx-reset" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteBox(activeBox.id)}
                className="min-h-[38px] px-2.5 bg-slate-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-1"
                title="Eliminar caja"
              >
                <i className="bx bx-trash" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>

          {/* Bounds Warning Banner */}
          {outOfBounds && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-2">
              <i className="bx bx-error-circle text-base shrink-0" />
              <span>
                Esta caja sobrepasa los límites de Minecraft Bedrock (Origen [-8, 0, -8] a [8, {maxAllowedY}, 8]).
              </span>
            </div>
          )}

          {/* CAMPOS NUMÉRICOS: POSICIÓN DE ORIGEN (X, Y, Z) */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Posición Mínima (Origin)
                </span>
                <span className="text-[10px] text-slate-400">
                  Esquina inferior mínima de la caja [X, Y, Z] (Estándar: [-8, 0, -8])
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                [{ox}, {oy}, {oz}]
              </span>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
              {/* Origin X */}
              <CoordinateControl
                label="Origen X"
                axisColor="rose"
                value={ox}
                min={-8}
                max={8}
                step={0.5}
                onChange={(v) => handleOriginChange(0, v)}
                onStep={(d) => stepOrigin(0, d)}
              />

              {/* Origin Y */}
              <CoordinateControl
                label="Origen Y"
                axisColor="emerald"
                value={oy}
                min={0}
                max={maxAllowedY}
                step={0.5}
                onChange={(v) => handleOriginChange(1, v)}
                onStep={(d) => stepOrigin(1, d)}
              />

              {/* Origin Z */}
              <CoordinateControl
                label="Origen Z"
                axisColor="sky"
                value={oz}
                min={-8}
                max={8}
                step={0.5}
                onChange={(v) => handleOriginChange(2, v)}
                onStep={(d) => stepOrigin(2, d)}
              />
            </div>
          </div>

          {/* CAMPOS NUMÉRICOS: DIMENSIONES (WIDTH, HEIGHT, DEPTH) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Dimensiones de la Caja (Size)
                </span>
                <span className="text-[10px] text-slate-400">
                  Tamaño de los lados [Ancho W, Alto H, Profundidad D] (Estándar: [16, 16, 16])
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border border-slate-800 ${
                  isCol ? 'text-emerald-400 bg-slate-900' : 'text-cyan-400 bg-slate-900'
                }`}
              >
                [{sx}, {sy}, {sz}]
              </span>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
              {/* Size X (Width) */}
              <CoordinateControl
                label="Ancho (W)"
                axisColor="rose"
                value={sx}
                min={0.1}
                max={16}
                step={0.5}
                onChange={(v) => handleSizeChange(0, v)}
                onStep={(d) => stepSize(0, d)}
              />

              {/* Size Y (Height) */}
              <CoordinateControl
                label="Alto (H)"
                axisColor="emerald"
                value={sy}
                min={0.1}
                max={maxAllowedY}
                step={0.5}
                onChange={(v) => handleSizeChange(1, v)}
                onStep={(d) => stepSize(1, d)}
              />

              {/* Size Z (Depth) */}
              <CoordinateControl
                label="Profundo (D)"
                axisColor="sky"
                value={sz}
                min={0.1}
                max={16}
                step={0.5}
                onChange={(v) => handleSizeChange(2, v)}
                onStep={(d) => stepSize(2, d)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for numeric control with slider and precision steppers (+ / -)
interface CoordinateControlProps {
  label: string;
  axisColor: 'rose' | 'emerald' | 'sky';
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  onStep: (delta: number) => void;
}

const CoordinateControl: React.FC<CoordinateControlProps> = ({
  label,
  axisColor,
  value,
  min,
  max,
  step,
  onChange,
  onStep,
}) => {
  const colorBadgeClass =
    axisColor === 'rose'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : axisColor === 'emerald'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : 'text-sky-400 bg-sky-500/10 border-sky-500/20';

  const accentClass =
    axisColor === 'rose'
      ? 'accent-rose-500'
      : axisColor === 'emerald'
      ? 'accent-emerald-500'
      : 'accent-sky-500';

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-[#111827] rounded-xl border border-white/[0.08]">
      <div className="flex items-center justify-between text-xs">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${colorBadgeClass}`}>
          {label}
        </span>
        <span className="font-mono font-bold text-slate-100">{value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 ${accentClass} cursor-pointer my-1`}
      />

      {/* Stepper Buttons for Mobile Touch Precision */}
      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="min-h-[30px] rounded-md bg-[#0B0F17] hover:bg-slate-800 border border-white/[0.08] text-[10px] font-mono text-slate-400"
        >
          -1
        </button>
        <button
          type="button"
          onClick={() => onStep(-0.5)}
          className="min-h-[30px] rounded-md bg-[#0B0F17] hover:bg-slate-800 border border-white/[0.08] text-[10px] font-mono text-slate-400"
        >
          -0.5
        </button>
        <button
          type="button"
          onClick={() => onStep(+0.5)}
          className="min-h-[30px] rounded-md bg-[#0B0F17] hover:bg-slate-800 border border-white/[0.08] text-[10px] font-mono text-slate-400"
        >
          +0.5
        </button>
        <button
          type="button"
          onClick={() => onStep(+1)}
          className="min-h-[30px] rounded-md bg-[#0B0F17] hover:bg-slate-800 border border-white/[0.08] text-[10px] font-mono text-slate-400"
        >
          +1
        </button>
      </div>
    </div>
  );
};

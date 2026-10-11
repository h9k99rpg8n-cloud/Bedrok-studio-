import React, { useState } from 'react';
import {
  BlockComponentId,
  BlockComponentItem,
  BlockFaceKey,
  PlacementDirectionConfig,
  PlacementDirectionState,
  PlacementFilterCondition,
  PlacementFilterConfig,
  PlacementPositionConfig,
  PlacementPositionState,
} from '../types/addon';

interface BlockComponentsManagerProps {
  componentsList: BlockComponentItem[];
  onChangeComponents: (components: BlockComponentItem[]) => void;
}

interface ComponentMeta {
  id: BlockComponentId;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  summary: string;
  explanation: string;
  docUrl: string;
  defaultConfig: PlacementDirectionConfig | PlacementPositionConfig | PlacementFilterConfig;
}

const AVAILABLE_COMPONENTS: ComponentMeta[] = [
  {
    id: 'minecraft:placement_direction',
    name: 'Colocación por Dirección',
    badge: 'Trait de Orientación',
    badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    icon: 'bx bx-compass',
    summary: 'Registra hacia dónde miraba el jugador al colocar el bloque en el mundo.',
    explanation:
      'Imprescindible para bloques orientables como hornos, calabazas, dispensadores o troncos. Permite que la cara frontal del bloque mire automáticamente hacia el jugador o en la dirección en la que fue colocado.',
    docUrl: 'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blocktraits/blocktraitslist',
    defaultConfig: {
      enabledStates: ['minecraft:cardinal_direction'],
      yRotationOffset: 0,
    } as PlacementDirectionConfig,
  },
  {
    id: 'minecraft:placement_position',
    name: 'Colocación por Posición',
    badge: 'Trait de Posicionamiento',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    icon: 'bx bx-target-lock',
    summary: 'Guarda en qué cara o mitad del bloque vecino se colocó este bloque.',
    explanation:
      'Fundamental para bloques como losas (slabs) que se colocan en la mitad superior o inferior del bloque, o bloques tipo antorcha, escaleras de mano y linternas que se adhieren a la cara de un bloque vecino.',
    docUrl: 'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blocktraits/blocktraitslist',
    defaultConfig: {
      enabledStates: ['minecraft:block_face', 'minecraft:vertical_half'],
    } as PlacementPositionConfig,
  },
  {
    id: 'minecraft:placement_filter',
    name: 'Filtro de Colocación (Soporte)',
    badge: 'Componente de Reglas',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    icon: 'bx bx-filter-alt',
    summary: 'Restringe en qué superficies y sobre qué bloques puede colocarse y subsistir.',
    explanation:
      'Establece las condiciones físicas de colocación. Si el bloque de soporte se destruye o el jugador intenta colocarlo en el aire o sobre una superficie no permitida, el bloque no se colocará o caerá inmediatamente como ítem.',
    docUrl: 'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/blockcomponentslist',
    defaultConfig: {
      conditions: [
        {
          id: 'cond_default',
          allowedFaces: ['up'],
          blockFilter: ['minecraft:dirt', 'minecraft:grass_block', 'minecraft:stone'],
        },
      ],
    } as PlacementFilterConfig,
  },
];

const FACE_LABELS: Record<BlockFaceKey, { label: string; icon: string }> = {
  up: { label: 'Arriba (Suelo)', icon: 'bx bx-arrow-to-top' },
  down: { label: 'Abajo (Techo)', icon: 'bx bx-arrow-to-bottom' },
  north: { label: 'Norte', icon: 'bx bx-up-arrow-alt' },
  south: { label: 'Sur', icon: 'bx bx-down-arrow-alt' },
  east: { label: 'Este', icon: 'bx bx-right-arrow-alt' },
  west: { label: 'Oeste', icon: 'bx bx-left-arrow-alt' },
};

const SUGGESTED_BLOCKS = [
  'minecraft:dirt',
  'minecraft:grass_block',
  'minecraft:stone',
  'minecraft:sand',
  'minecraft:gravel',
  'minecraft:oak_log',
  'minecraft:farmland',
];

export const BlockComponentsManager: React.FC<BlockComponentsManagerProps> = ({
  componentsList,
  onChangeComponents,
}) => {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({
    'minecraft:placement_direction': true,
    'minecraft:placement_position': true,
    'minecraft:placement_filter': true,
  });
  const [newBlockInputByCond, setNewBlockInputByCond] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedComponents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isComponentAdded = (id: BlockComponentId): boolean => {
    return componentsList.some((c) => c.id === id);
  };

  // Add Component to Block
  const handleAddComponent = (meta: ComponentMeta) => {
    if (isComponentAdded(meta.id)) return;
    const newItem: BlockComponentItem = {
      id: meta.id,
      enabled: true,
      config: JSON.parse(JSON.stringify(meta.defaultConfig)),
    };
    onChangeComponents([...componentsList, newItem]);
    setExpandedComponents((prev) => ({ ...prev, [meta.id]: true }));
    setIsCatalogModalOpen(false);
  };

  // Toggle component enabled
  const handleToggleEnable = (id: BlockComponentId) => {
    onChangeComponents(
      componentsList.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // Remove component from block
  const handleRemoveComponent = (id: BlockComponentId) => {
    onChangeComponents(componentsList.filter((c) => c.id !== id));
  };

  // Update placement_direction config
  const updatePlacementDirection = (
    updater: (prev: PlacementDirectionConfig) => PlacementDirectionConfig
  ) => {
    onChangeComponents(
      componentsList.map((c) => {
        if (c.id === 'minecraft:placement_direction') {
          return {
            ...c,
            config: updater(c.config as PlacementDirectionConfig),
          };
        }
        return c;
      })
    );
  };

  // Update placement_position config
  const updatePlacementPosition = (
    updater: (prev: PlacementPositionConfig) => PlacementPositionConfig
  ) => {
    onChangeComponents(
      componentsList.map((c) => {
        if (c.id === 'minecraft:placement_position') {
          return {
            ...c,
            config: updater(c.config as PlacementPositionConfig),
          };
        }
        return c;
      })
    );
  };

  // Update placement_filter config
  const updatePlacementFilter = (
    updater: (prev: PlacementFilterConfig) => PlacementFilterConfig
  ) => {
    onChangeComponents(
      componentsList.map((c) => {
        if (c.id === 'minecraft:placement_filter') {
          return {
            ...c,
            config: updater(c.config as PlacementFilterConfig),
          };
        }
        return c;
      })
    );
  };

  const addedComponentIds = new Set(componentsList.map((c) => c.id));
  const availableToAdd = AVAILABLE_COMPONENTS.filter((c) => !addedComponentIds.has(c.id));

  return (
    <div className="flex flex-col gap-3.5">
      {/* Top Banner explaining Components System */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <i className="bx bxs-extension text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100">
                Sistema Oficial de Componentes y Traits
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Bedrock 1.21.50
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Configura comportamientos técnicos de Minecraft estable: rotación según el jugador, posicionamiento vertical u horizontal y filtros de soporte.
            </p>
          </div>
        </div>

        {/* Add Component Action Button */}
        <button
          type="button"
          onClick={() => setIsCatalogModalOpen(true)}
          disabled={availableToAdd.length === 0}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 w-full sm:w-auto shadow-sm ${
            availableToAdd.length > 0
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <i className="bx bx-plus-circle text-base" />
          <span>{availableToAdd.length > 0 ? 'Añadir Componente' : 'Todos añadidos'}</span>
        </button>
      </div>

      {/* List of Configured Components */}
      {componentsList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-2.5 my-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <i className="bx bx-cube-alt text-2xl" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300">
              No hay componentes técnicos añadidos a este bloque
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 leading-relaxed">
              Puedes añadir componentes oficiales de colocación como orientación cardinal (hornos), posición vertical (losas) o filtros de apoyo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="min-h-[42px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mt-1 active:scale-95 transition-all"
          >
            <i className="bx bx-plus text-base" />
            <span>Explorar catálogo de componentes</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {componentsList.map((comp) => {
            const meta = AVAILABLE_COMPONENTS.find((m) => m.id === comp.id);
            if (!meta) return null;

            const isExpanded = !!expandedComponents[comp.id];

            return (
              <div
                key={comp.id}
                className={`rounded-2xl border transition-all ${
                  comp.enabled
                    ? 'bg-slate-950/90 border-slate-800 shadow-md'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Component Card Header */}
                <div className="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.badgeColor}`}
                    >
                      <i className={`${meta.icon} text-lg`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {meta.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${meta.badgeColor}`}
                        >
                          {meta.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400/90 block truncate">
                        {meta.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Enable Toggle, Expand/Collapse, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <label
                      className="relative inline-flex items-center cursor-pointer min-h-[40px] px-1 justify-center"
                      title={comp.enabled ? 'Componente activo' : 'Componente desactivado'}
                    >
                      <input
                        type="checkbox"
                        checked={comp.enabled}
                        onChange={() => handleToggleEnable(comp.id)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[7px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner" />
                    </label>

                    <button
                      type="button"
                      onClick={() => toggleExpand(comp.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                      title={isExpanded ? 'Plegar configuración' : 'Desplegar configuración'}
                    >
                      <i
                        className={`bx bx-chevron-down text-lg transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(comp.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar este componente"
                    >
                      <i className="bx bx-trash text-base" />
                    </button>
                  </div>
                </div>

                {/* Component Settings & Parameters (Collapsible) */}
                {isExpanded && (
                  <div className="p-3.5 flex flex-col gap-3.5">
                    {/* Educational explanation card */}
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2 leading-relaxed">
                      <i className="bx bx-info-circle text-base text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span>{meta.explanation}</span>
                      </div>
                    </div>

                    {/* Specific Editor: minecraft:placement_direction */}
                    {comp.id === 'minecraft:placement_direction' && (
                      <PlacementDirectionEditor
                        config={comp.config as PlacementDirectionConfig}
                        onChange={(updater) => updatePlacementDirection(updater)}
                      />
                    )}

                    {/* Specific Editor: minecraft:placement_position */}
                    {comp.id === 'minecraft:placement_position' && (
                      <PlacementPositionEditor
                        config={comp.config as PlacementPositionConfig}
                        onChange={(updater) => updatePlacementPosition(updater)}
                      />
                    )}

                    {/* Specific Editor: minecraft:placement_filter */}
                    {comp.id === 'minecraft:placement_filter' && (
                      <PlacementFilterEditor
                        config={comp.config as PlacementFilterConfig}
                        newBlockInputByCond={newBlockInputByCond}
                        onSetNewBlockInputByCond={setNewBlockInputByCond}
                        onChange={(updater) => updatePlacementFilter(updater)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Catalog Modal / Drawer: Available Official Components */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <i className="bx bxs-extension text-xl text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Catálogo de Componentes Bedrock
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Esquemas oficiales estables
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            {/* List of Available Components */}
            <div className="flex flex-col gap-3 my-4">
              {AVAILABLE_COMPONENTS.map((meta) => {
                const alreadyAdded = isComponentAdded(meta.id);

                return (
                  <div
                    key={meta.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                      alreadyAdded
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.badgeColor}`}
                        >
                          <i className={`${meta.icon} text-lg`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">
                              {meta.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${meta.badgeColor}`}
                            >
                              {meta.badge}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {meta.id}
                          </span>
                        </div>
                      </div>

                      {alreadyAdded && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                          ✓ Añadido
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {meta.summary}
                    </p>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[10px] text-slate-400 leading-relaxed">
                      {meta.explanation}
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddComponent(meta)}
                        disabled={alreadyAdded}
                        className={`min-h-[40px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all ${
                          alreadyAdded
                            ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/20'
                        }`}
                      >
                        <i className={`bx ${alreadyAdded ? 'bx-check' : 'bx-plus'} text-base`} />
                        <span>{alreadyAdded ? 'Ya configurado' : 'Añadir al Bloque'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="min-h-[44px] px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Subcomponent: PlacementDirectionEditor                                      */
/* -------------------------------------------------------------------------- */

interface PlacementDirectionEditorProps {
  config: PlacementDirectionConfig;
  onChange: (updater: (prev: PlacementDirectionConfig) => PlacementDirectionConfig) => void;
}

const PlacementDirectionEditor: React.FC<PlacementDirectionEditorProps> = ({
  config,
  onChange,
}) => {
  const toggleState = (st: PlacementDirectionState) => {
    onChange((prev) => {
      const exists = prev.enabledStates.includes(st);
      const nextStates = exists
        ? prev.enabledStates.filter((s) => s !== st)
        : [...prev.enabledStates, st];
      return {
        ...prev,
        enabledStates: nextStates,
      };
    });
  };

  const hasConflict =
    config.enabledStates.includes('minecraft:cardinal_direction') &&
    config.enabledStates.includes('minecraft:facing_direction');

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* State selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-200">
          Estados de Dirección Habilitados (enabled_states):
        </label>
        <span className="text-[11px] text-slate-400">
          Elige qué variable registrará Minecraft cuando el jugador coloque este bloque:
        </span>

        <div className="flex flex-col gap-2 mt-1">
          {/* cardinal_direction */}
          <label className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={config.enabledStates.includes('minecraft:cardinal_direction')}
              onChange={() => toggleState('minecraft:cardinal_direction')}
              className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-mono">
                  minecraft:cardinal_direction
                </span>
                <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.2 rounded font-semibold">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                4 direcciones horizontales cardinales: <code className="text-slate-300">"north"</code>, <code className="text-slate-300">"south"</code>, <code className="text-slate-300">"east"</code>, <code className="text-slate-300">"west"</code>. Ideal para hornos o frentes de máquinas.
              </p>
            </div>
          </label>

          {/* facing_direction */}
          <label className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={config.enabledStates.includes('minecraft:facing_direction')}
              onChange={() => toggleState('minecraft:facing_direction')}
              className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 font-mono">
                minecraft:facing_direction
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                6 direcciones completas (incluye vertical): norte, sur, este, oeste, <code className="text-slate-300">"up"</code> y <code className="text-slate-300">"down"</code>. Útil para dispensadores, observadores o pistones.
              </p>
            </div>
          </label>

          {/* corner_and_cardinal_direction */}
          <label className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={config.enabledStates.includes('minecraft:corner_and_cardinal_direction')}
              onChange={() => toggleState('minecraft:corner_and_cardinal_direction')}
              className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 font-mono">
                minecraft:corner_and_cardinal_direction
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Dirección cardinal más detección de esquinas automáticas (<code className="text-slate-300">minecraft:corner</code>) con estados inner_left, inner_right, outer_left, outer_right (típico de escaleras).
              </p>
            </div>
          </label>
        </div>

        {/* Validation warning */}
        {hasConflict && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 mt-1">
            <i className="bx bx-error text-base shrink-0 mt-0.5" />
            <div>
              <strong>Aviso de compatibilidad:</strong> No es recomendable activar simultáneamente <code className="font-mono text-white">cardinal_direction</code> y <code className="font-mono text-white">facing_direction</code>, ya que ambas compiten por la orientación de colocación.
            </div>
          </div>
        )}

        {config.enabledStates.length === 0 && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mt-1">
            <i className="bx bx-error-circle text-base shrink-0" />
            <span>Debes seleccionar al menos un estado de dirección para que el trait funcione en Bedrock.</span>
          </div>
        )}
      </div>

      {/* y_rotation_offset */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200">
            Rotación en eje Y (y_rotation_offset):
          </label>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {config.yRotationOffset}°
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Giro compensatorio en sentido antihorario respecto a la mirada del jugador:
        </span>

        {/* Quick Angle Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {([0, 90, 180, 270] as const).map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, yRotationOffset: angle }))}
              className={`min-h-[42px] px-2 rounded-xl text-xs font-bold border transition-all ${
                config.yRotationOffset === angle
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {angle}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Subcomponent: PlacementPositionEditor                                       */
/* -------------------------------------------------------------------------- */

interface PlacementPositionEditorProps {
  config: PlacementPositionConfig;
  onChange: (updater: (prev: PlacementPositionConfig) => PlacementPositionConfig) => void;
}

const PlacementPositionEditor: React.FC<PlacementPositionEditorProps> = ({
  config,
  onChange,
}) => {
  const toggleState = (st: PlacementPositionState) => {
    onChange((prev) => {
      const exists = prev.enabledStates.includes(st);
      const nextStates = exists
        ? prev.enabledStates.filter((s) => s !== st)
        : [...prev.enabledStates, st];
      return {
        ...prev,
        enabledStates: nextStates,
      };
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-200">
          Estados de Posición de Contacto (enabled_states):
        </label>
        <span className="text-[11px] text-slate-400">
          Permite que el bloque reaccione al lugar exacto donde el jugador hizo clic:
        </span>

        <div className="flex flex-col gap-2 mt-1">
          {/* minecraft:block_face */}
          <label className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={config.enabledStates.includes('minecraft:block_face')}
              onChange={() => toggleState('minecraft:block_face')}
              className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 font-mono">
                minecraft:block_face
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Identifica la cara del bloque adyacente tocada: <code className="text-slate-300">"up"</code>, <code className="text-slate-300">"down"</code>, <code className="text-slate-300">"north"</code>, etc. Ideal para antorchas que se pegan al suelo o a la pared.
              </p>
            </div>
          </label>

          {/* minecraft:vertical_half */}
          <label className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={config.enabledStates.includes('minecraft:vertical_half')}
              onChange={() => toggleState('minecraft:vertical_half')}
              className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 font-mono">
                minecraft:vertical_half
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Determina si el clic fue en la mitad superior o inferior: <code className="text-slate-300">"top"</code> o <code className="text-slate-300">"bottom"</code>. Ideal para losas dobles, trampillas o medios bloques.
              </p>
            </div>
          </label>
        </div>

        {config.enabledStates.length === 0 && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mt-1">
            <i className="bx bx-error-circle text-base shrink-0" />
            <span>Selecciona al menos un estado de posición para habilitar el trait.</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Subcomponent: PlacementFilterEditor                                         */
/* -------------------------------------------------------------------------- */

interface PlacementFilterEditorProps {
  config: PlacementFilterConfig;
  newBlockInputByCond: Record<string, string>;
  onSetNewBlockInputByCond: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onChange: (updater: (prev: PlacementFilterConfig) => PlacementFilterConfig) => void;
}

const PlacementFilterEditor: React.FC<PlacementFilterEditorProps> = ({
  config,
  newBlockInputByCond,
  onSetNewBlockInputByCond,
  onChange,
}) => {
  const addCondition = () => {
    onChange((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          allowedFaces: ['up'],
          blockFilter: ['minecraft:dirt', 'minecraft:stone'],
        },
      ],
    }));
  };

  const removeCondition = (idx: number) => {
    onChange((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx),
    }));
  };

  const toggleFaceInCond = (condIdx: number, face: BlockFaceKey) => {
    onChange((prev) => {
      const nextConds = [...prev.conditions];
      const cond = { ...nextConds[condIdx] };
      const exists = cond.allowedFaces.includes(face);
      cond.allowedFaces = exists
        ? cond.allowedFaces.filter((f) => f !== face)
        : [...cond.allowedFaces, face];
      nextConds[condIdx] = cond;
      return { ...prev, conditions: nextConds };
    });
  };

  const applyFacePreset = (condIdx: number, preset: 'ground' | 'walls' | 'ceiling' | 'all') => {
    onChange((prev) => {
      const nextConds = [...prev.conditions];
      const cond = { ...nextConds[condIdx] };
      if (preset === 'ground') cond.allowedFaces = ['up'];
      else if (preset === 'ceiling') cond.allowedFaces = ['down'];
      else if (preset === 'walls') cond.allowedFaces = ['north', 'south', 'east', 'west'];
      else if (preset === 'all') cond.allowedFaces = ['up', 'down', 'north', 'south', 'east', 'west'];
      nextConds[condIdx] = cond;
      return { ...prev, conditions: nextConds };
    });
  };

  const addBlockToFilter = (condIdx: number, blockId: string) => {
    const cleanId = blockId.trim();
    if (!cleanId) return;
    onChange((prev) => {
      const nextConds = [...prev.conditions];
      const cond = { ...nextConds[condIdx] };
      if (!cond.blockFilter.includes(cleanId)) {
        cond.blockFilter = [...cond.blockFilter, cleanId];
      }
      nextConds[condIdx] = cond;
      return { ...prev, conditions: nextConds };
    });
  };

  const removeBlockFromFilter = (condIdx: number, blockId: string) => {
    onChange((prev) => {
      const nextConds = [...prev.conditions];
      const cond = { ...nextConds[condIdx] };
      cond.blockFilter = cond.blockFilter.filter((b) => b !== blockId);
      nextConds[condIdx] = cond;
      return { ...prev, conditions: nextConds };
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200">
          Reglas y Condiciones de Soporte ({config.conditions.length}):
        </label>
        <button
          type="button"
          onClick={addCondition}
          className="min-h-[38px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
        >
          <i className="bx bx-plus text-sm" />
          <span>Añadir Regla</span>
        </button>
      </div>

      {config.conditions.map((cond, idx) => {
        const condKey = cond.id || `cond_${idx}`;
        const inputVal = newBlockInputByCond[condKey] || '';

        const hasFaceError = cond.allowedFaces.length === 0;
        const hasBlockError = cond.blockFilter.length === 0;

        return (
          <div
            key={condKey}
            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3"
          >
            {/* Condition Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400">
                Condición #{idx + 1}
              </span>
              {config.conditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCondition(idx)}
                  className="min-h-[36px] px-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <i className="bx bx-trash text-sm" />
                  <span>Eliminar regla</span>
                </button>
              )}
            </div>

            {/* Allowed Faces Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-semibold text-slate-300">
                  Caras de apoyo permitidas (allowed_faces):
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyFacePreset(idx, 'ground')}
                    className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300 hover:text-emerald-400"
                  >
                    Solo Suelo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFacePreset(idx, 'walls')}
                    className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300 hover:text-emerald-400"
                  >
                    Paredes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFacePreset(idx, 'all')}
                    className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300 hover:text-emerald-400"
                  >
                    Todas
                  </button>
                </div>
              </div>

              {/* Face Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1">
                {(['up', 'down', 'north', 'south', 'east', 'west'] as BlockFaceKey[]).map((face) => {
                  const isChecked = cond.allowedFaces.includes(face);
                  const meta = FACE_LABELS[face];
                  return (
                    <button
                      key={face}
                      type="button"
                      onClick={() => toggleFaceInCond(idx, face)}
                      className={`min-h-[42px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        isChecked
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <i className={`${meta.icon} text-sm`} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>

              {hasFaceError && (
                <span className="text-[11px] text-rose-400 font-semibold mt-1">
                  ⚠️ Debes seleccionar al menos una cara de apoyo para esta regla.
                </span>
              )}
            </div>

            {/* Block Filter Selector */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300">
                Bloques de soporte permitidos (block_filter):
              </span>
              <span className="text-[11px] text-slate-400">
                El bloque solo podrá descansar sobre estos bloques:
              </span>

              {/* Active Block Filter Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-950 rounded-xl border border-slate-800">
                {cond.blockFilter.map((blk) => (
                  <span
                    key={blk}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300"
                  >
                    <span>{blk}</span>
                    <button
                      type="button"
                      onClick={() => removeBlockFromFilter(idx, blk)}
                      className="text-slate-500 hover:text-rose-400 ml-0.5"
                    >
                      <i className="bx bx-x text-sm" />
                    </button>
                  </span>
                ))}
                {cond.blockFilter.length === 0 && (
                  <span className="text-xs text-slate-500 italic py-1">
                    No hay bloques asignados al filtro.
                  </span>
                )}
              </div>

              {hasBlockError && (
                <span className="text-[11px] text-rose-400 font-semibold">
                  ⚠️ Añade al menos un bloque admitido en el filtro de soporte.
                </span>
              )}

              {/* Quick Suggestions Chips */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-500">Sugerencias:</span>
                {SUGGESTED_BLOCKS.filter((b) => !cond.blockFilter.includes(b)).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => addBlockToFilter(idx, b)}
                    className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-300 rounded-md transition-colors"
                  >
                    + {b.replace('minecraft:', '')}
                  </button>
                ))}
              </div>

              {/* Manual Input Row */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) =>
                    onSetNewBlockInputByCond((prev) => ({ ...prev, [condKey]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (inputVal.trim()) {
                        addBlockToFilter(idx, inputVal.trim());
                        onSetNewBlockInputByCond((prev) => ({ ...prev, [condKey]: '' }));
                      }
                    }
                  }}
                  placeholder="ej. minecraft:grass_block o custom:mi_bloque"
                  className="flex-1 min-h-[40px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputVal.trim()) {
                      addBlockToFilter(idx, inputVal.trim());
                      onSetNewBlockInputByCond((prev) => ({ ...prev, [condKey]: '' }));
                    }
                  }}
                  className="min-h-[40px] px-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <i className="bx bx-plus text-sm" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

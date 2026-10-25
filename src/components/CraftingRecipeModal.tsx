import React, { useState, useEffect, useMemo } from 'react';
import {
  AddonProject,
  CraftingRecipe,
  RecipeSlotItem,
  RecipeType,
  CustomBlock,
} from '../types/addon';
import { checkInappropriateText, censorInappropriateText } from '../utils/textModeration';

interface CraftingRecipeModalProps {
  isOpen: boolean;
  project: AddonProject;
  recipeToEdit?: CraftingRecipe | null;
  onClose: () => void;
  onSaveRecipe: (recipe: CraftingRecipe) => void;
}

// Catálogo de materiales clásicos de Minecraft para recetas
export const VANILLA_CRAFTING_ITEMS: RecipeSlotItem[] = [
  { id: 'minecraft:stick', name: 'Palo', icon: '🪵' },
  { id: 'minecraft:iron_ingot', name: 'Lingote de Hierro', icon: '⚪' },
  { id: 'minecraft:gold_ingot', name: 'Lingote de Oro', icon: '🟡' },
  { id: 'minecraft:diamond', name: 'Diamante', icon: '💎' },
  { id: 'minecraft:redstone', name: 'Polvo de Redstone', icon: '🔴' },
  { id: 'minecraft:coal', name: 'Carbón', icon: '⚫' },
  { id: 'minecraft:oak_planks', name: 'Madera de Roble', icon: '🟫' },
  { id: 'minecraft:cobblestone', name: 'Adoquín de Piedra', icon: '🧱' },
  { id: 'minecraft:glass', name: 'Cristal', icon: '🪟' },
  { id: 'minecraft:emerald', name: 'Esmeralda', icon: '❇️' },
  { id: 'minecraft:quartz', name: 'Cuarzo del Nether', icon: '◽' },
  { id: 'minecraft:glowstone_dust', name: 'Polvo Luminoso', icon: '✨' },
  { id: 'minecraft:string', name: 'Hilo', icon: '🧵' },
  { id: 'minecraft:copper_ingot', name: 'Lingote de Cobre', icon: '🟠' },
  { id: 'minecraft:amethyst_shard', name: 'Fragmento de Amatista', icon: '🔮' },
  { id: 'minecraft:netherite_ingot', name: 'Lingote de Inframundita', icon: '🛡️' },
  { id: 'minecraft:slime_ball', name: 'Bola de Slime', icon: '🟢' },
  { id: 'minecraft:blaze_powder', name: 'Polvo de Blaze', icon: '🔥' },
];

export const CraftingRecipeModal: React.FC<CraftingRecipeModalProps> = ({
  isOpen,
  project,
  recipeToEdit,
  onClose,
  onSaveRecipe,
}) => {
  // 9 slots for 3x3 crafting grid
  const [grid, setGrid] = useState<(RecipeSlotItem | null)[]>(Array(9).fill(null));
  const [resultItem, setResultItem] = useState<RecipeSlotItem | null>(null);
  const [resultCount, setResultCount] = useState<number>(1);
  const [recipeType, setRecipeType] = useState<RecipeType>('shaped');
  const [displayName, setDisplayName] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Slot target selection: 0-8 for grid, or 'result'
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | 'result'>(0);

  // Search filter for catalog drawer
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogTab, setCatalogTab] = useState<'project' | 'vanilla'>('project');

  // Convert project custom blocks to RecipeSlotItems
  const projectItems: RecipeSlotItem[] = useMemo(() => {
    return (project.blocks || []).map((b: CustomBlock) => {
      const tex = b.faceTextures?.up || b.textureDataUrl || '';
      return {
        id: `custom:${b.identifier}`,
        name: b.displayName,
        icon: tex,
        isCustomBlock: true,
      };
    });
  }, [project.blocks]);

  // Initial populate or reset
  useEffect(() => {
    if (isOpen) {
      if (recipeToEdit) {
        setGrid(recipeToEdit.grid ? [...recipeToEdit.grid] : Array(9).fill(null));
        setResultItem(recipeToEdit.resultItem || null);
        setResultCount(recipeToEdit.resultCount || 1);
        setRecipeType(recipeToEdit.type || 'shaped');
        setDisplayName(recipeToEdit.displayName || 'Receta de Fabricación');
        setIdentifier(recipeToEdit.identifier || 'receta_personalizada');
      } else {
        const nextNum = (project.recipes || []).length + 1;
        const defaultBlock = projectItems[0] || null;

        // Auto pre-fill result with first project block if available
        setGrid(Array(9).fill(null));
        setResultItem(defaultBlock);
        setResultCount(1);
        setRecipeType('shaped');
        setDisplayName(
          defaultBlock ? `Receta de ${defaultBlock.name}` : `Receta ${nextNum}`
        );
        setIdentifier(
          defaultBlock
            ? `receta_${defaultBlock.id.replace('custom:', '')}`
            : `receta_${nextNum}`
        );
      }
      setActiveSlotIndex(0);
      setErrorMessage('');
    }
  }, [isOpen, recipeToEdit, project.recipes, projectItems]);

  // Filter catalog items
  const filteredProjectItems = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return projectItems;
    return projectItems.filter(
      (item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
  }, [projectItems, catalogSearch]);

  const filteredVanillaItems = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return VANILLA_CRAFTING_ITEMS;
    return VANILLA_CRAFTING_ITEMS.filter(
      (item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
  }, [catalogSearch]);

  if (!isOpen) return null;

  // Moderation for display name
  const nameModeration = checkInappropriateText(displayName);

  // Handle placing an item in the active slot
  const handleSelectItem = (item: RecipeSlotItem) => {
    if (activeSlotIndex === 'result') {
      setResultItem(item);
    } else {
      const nextGrid = [...grid];
      nextGrid[activeSlotIndex] = item;
      setGrid(nextGrid);

      // Automatically advance to the next empty slot in grid for smooth mobile flow
      const nextEmpty = nextGrid.findIndex((slot, idx) => idx > activeSlotIndex && slot === null);
      if (nextEmpty !== -1) {
        setActiveSlotIndex(nextEmpty);
      }
    }
    setErrorMessage('');
  };

  // Clear specific slot
  const handleClearSlot = (index: number | 'result', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index === 'result') {
      setResultItem(null);
    } else {
      const nextGrid = [...grid];
      nextGrid[index] = null;
      setGrid(nextGrid);
    }
  };

  // Clear all grid slots
  const handleClearAllGrid = () => {
    setGrid(Array(9).fill(null));
  };

  // Save Recipe handler with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage('Introduce un nombre para la receta.');
      return;
    }

    const cleanId = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) {
      setErrorMessage('Introduce un identificador técnico válido.');
      return;
    }

    const hasIngredients = grid.some((slot) => slot !== null);
    if (!hasIngredients) {
      setErrorMessage('Debes colocar al menos 1 material o ingrediente en la cuadrícula 3×3.');
      return;
    }

    if (!resultItem) {
      setErrorMessage('Selecciona el bloque u objeto resultante de la receta.');
      return;
    }

    const recipe: CraftingRecipe = {
      id: recipeToEdit?.id || `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      identifier: cleanId,
      displayName: cleanName,
      type: recipeType,
      grid: [...grid],
      resultItem,
      resultCount: Math.min(64, Math.max(1, resultCount)),
      createdAt: recipeToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveRecipe(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0d1322] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[94dvh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg shadow-sm">
              <i className="bx bxs-grid" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{recipeToEdit ? 'Editar Receta' : 'Mesa de Trabajo — Nueva Receta'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                  3×3 Crafting
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Diseña recetas de crafteo compatibles con Minecraft Bedrock.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 active:scale-95 transition-all"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <i className="bx bx-error-circle text-base shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
          {/* Identity: Recipe Name & Identifier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nombre de la Receta *
                </label>
                {nameModeration.hasInappropriate && (
                  <button
                    type="button"
                    onClick={() => setDisplayName(censorInappropriateText(displayName))}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                  >
                    <i className="bx bx-shield-quarter text-xs" />
                    <span>Censurar</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Ej: Receta de Lámpara"
                className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID Técnico Oficial (Identifier) *
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
                <span className="px-2.5 text-[11px] text-slate-400 font-mono select-none">custom:</span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    setIdentifier(cleaned);
                    setErrorMessage('');
                  }}
                  placeholder="receta_lampara"
                  className="w-full min-h-[42px] pr-3 bg-transparent text-xs font-mono text-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Recipe Type: Shaped (Con Patrón) vs Shapeless (Sin Patrón) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setRecipeType('shaped')}
              className={`min-h-[44px] px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                recipeType === 'shaped'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="bx bx-grid-alt text-base" />
              <div className="text-left">
                <div>Con Patrón (Shaped)</div>
                <div className="text-[9px] font-normal opacity-85">Posición fija en 3×3</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRecipeType('shapeless')}
              className={`min-h-[44px] px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                recipeType === 'shapeless'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="bx bx-shuffle text-base" />
              <div className="text-left">
                <div>Sin Patrón (Shapeless)</div>
                <div className="text-[9px] font-normal opacity-85">Cualquier orden libre</div>
              </div>
            </button>
          </div>

          {/* CRAFTING TABLE WORKBENCH INTERFACE */}
          <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/90 shadow-inner flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <i className="bx bxs-widget text-amber-400" />
                Mesa de Trabajo 3×3
              </span>
              <button
                type="button"
                onClick={handleClearAllGrid}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Vaciar las 9 casillas"
              >
                <i className="bx bx-trash text-xs" />
                <span>Limpiar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-2 w-full">
              {/* 3x3 Grid Matrix */}
              <div className="p-2.5 bg-[#151c2e] border-2 border-slate-700/80 rounded-2xl shadow-xl">
                <div className="grid grid-cols-3 gap-2">
                  {grid.map((slot, index) => {
                    const isSelected = activeSlotIndex === index;
                    return (
                      <div
                        key={index}
                        onClick={() => setActiveSlotIndex(index)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden select-none active:scale-95 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/40'
                            : slot
                            ? 'border-slate-600 bg-slate-900/90 hover:border-slate-500'
                            : 'border-dashed border-slate-700/70 bg-slate-950/70 hover:border-slate-600'
                        }`}
                        title={slot ? `${slot.name} (Toca para cambiar)` : `Casilla ${index + 1} vacía`}
                      >
                        {slot ? (
                          <>
                            {slot.icon && slot.icon.startsWith('data:') ? (
                              <img
                                src={slot.icon}
                                alt={slot.name}
                                className="w-9 h-9 sm:w-10 sm:h-10 object-contain pixelated"
                              />
                            ) : (
                              <span className="text-2xl">{slot.icon || '📦'}</span>
                            )}
                            <span className="text-[8px] font-mono text-slate-300 truncate max-w-full px-1 leading-tight text-center mt-0.5">
                              {slot.name}
                            </span>
                            {/* Clear button on hover/tap */}
                            <button
                              type="button"
                              onClick={(e) => handleClearSlot(index, e)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-950/90 text-slate-400 hover:text-rose-400 flex items-center justify-center text-[10px]"
                              title="Quitar"
                            >
                              <i className="bx bx-x" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 font-bold">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="flex flex-col items-center justify-center text-slate-500">
                <i className="bx bx-right-arrow-alt text-3xl text-amber-400 sm:rotate-0 rotate-90 animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  Fabrica
                </span>
              </div>

              {/* Output Result Slot */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Resultado
                </span>
                <div
                  onClick={() => setActiveSlotIndex('result')}
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden select-none p-1 shadow-2xl active:scale-95 ${
                    activeSlotIndex === 'result'
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-emerald-400/20 ring-2 ring-emerald-400/50'
                      : resultItem
                      ? 'border-emerald-500/60 bg-slate-900 hover:border-emerald-400'
                      : 'border-dashed border-emerald-500/40 bg-slate-950 hover:border-emerald-400'
                  }`}
                  title={resultItem ? `${resultItem.name} (Toca para cambiar)` : 'Seleccionar resultado'}
                >
                  {resultItem ? (
                    <>
                      {resultItem.icon && resultItem.icon.startsWith('data:') ? (
                        <img
                          src={resultItem.icon}
                          alt={resultItem.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 object-contain pixelated"
                        />
                      ) : (
                        <span className="text-3xl">{resultItem.icon || '📦'}</span>
                      )}
                      <span className="text-[9px] font-bold text-slate-200 truncate max-w-full px-1 text-center mt-0.5">
                        {resultItem.name}
                      </span>
                      {/* Count Badge */}
                      <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-mono font-black text-xs shadow-md">
                        ×{resultCount}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1">
                      <i className="bx bx-plus text-xl text-emerald-400" />
                      <span className="text-[10px] text-slate-400 leading-tight">
                        Elegir salida
                      </span>
                    </div>
                  )}
                </div>

                {/* Output Count Stepper */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setResultCount((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-xs font-bold text-emerald-400">
                    {resultCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setResultCount((prev) => Math.min(64, prev + 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold"
                  >
                    +
                  </button>
                  <div className="flex gap-1 ml-1">
                    {[1, 4, 16, 64].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setResultCount(cnt)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          resultCount === cnt
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="w-full text-center">
              <span className="text-[11px] text-slate-400">
                {activeSlotIndex === 'result' ? (
                  <span className="text-emerald-400 font-bold">
                    Editando casilla de resultado. Toca un bloque del catálogo inferior para asignarlo como producto.
                  </span>
                ) : (
                  <span>
                    Editando casilla <strong className="text-amber-400 font-mono">#{Number(activeSlotIndex) + 1}</strong>. Toca cualquier material para colocarlo.
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* RESOURCE CATALOG & ITEM SELECTOR DRAWER */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCatalogTab('project')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    catalogTab === 'project'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="bx bxs-cube text-xs" />
                  <span>Bloques del Addon ({projectItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatalogTab('vanilla')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    catalogTab === 'vanilla'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="bx bx-world text-xs" />
                  <span>Materiales de Minecraft ({VANILLA_CRAFTING_ITEMS.length})</span>
                </button>
              </div>

              {/* Search bar in catalog */}
              <div className="relative min-w-[140px] sm:min-w-[180px]">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar material..."
                  className="w-full min-h-[34px] pl-7 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <i className="bx bx-search text-xs text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-h-48 overflow-y-auto pr-1">
              {catalogTab === 'project' ? (
                filteredProjectItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {projectItems.length === 0
                      ? 'Aún no has creado bloques en este addon. Puedes usar materiales estándar de Minecraft en la otra pestaña.'
                      : 'No se encontraron bloques con esa búsqueda.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredProjectItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center gap-2 text-left group active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 pixelated">
                          {item.icon && item.icon.startsWith('data:') ? (
                            <img
                              src={item.icon}
                              alt={item.name}
                              className="w-full h-full object-contain pixelated"
                            />
                          ) : (
                            <span className="text-base">{item.icon || '🧱'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate block">
                            {item.id}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                filteredVanillaItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No se encontraron materiales.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredVanillaItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 transition-all flex items-center gap-2 text-left group active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate block">
                            {item.id.replace('minecraft:', '')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <i className="bx bxs-save text-base" />
              <span>{recipeToEdit ? 'Actualizar Receta' : 'Guardar Receta en el Addon'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

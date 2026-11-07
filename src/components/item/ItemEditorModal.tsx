import React, { useState, useEffect } from 'react';
import {
  CustomItem,
  ItemCategory,
  ItemRarity,
  ItemUseAnimation,
  ItemFoodConfig,
  ItemDurabilityConfig,
  ItemWeaponConfig,
  ItemFuelConfig,
  ItemCooldownConfig,
  ItemCustomComponentConfig,
} from '../../types/item';
import { BlockGroup, BlockTranslation, CustomTexture, SUPPORTED_LANGUAGES, VisualBehaviorProgram } from '../../types/addon';
import { ItemPreview } from './ItemPreview';
import { ItemComponentsManager } from './ItemComponentsManager';
import { VisualBehaviorEditor } from '../VisualBehaviorEditor';

interface ItemEditorModalProps {
  isOpen: boolean;
  item: CustomItem | null;
  existingItems: CustomItem[];
  availableTextures: CustomTexture[];
  existingGroups: BlockGroup[];
  onClose: () => void;
  onSaveItem: (item: CustomItem) => Promise<boolean> | void;
  onOpenTextureLibrary: () => void;
  onOpenTexturePainter: () => void;
  assignedTextureUrl?: string | null;
  onConsumeAssignedTexture?: () => void;
}

type ItemTab = 'identity' | 'texture' | 'properties' | 'behavior' | 'visual_behavior';

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  isOpen,
  item,
  existingItems,
  availableTextures,
  existingGroups,
  onClose,
  onSaveItem,
  onOpenTextureLibrary,
  onOpenTexturePainter,
  assignedTextureUrl,
  onConsumeAssignedTexture,
}) => {
  // Navigation Tabs específicas de Ítems
  const [activeTab, setActiveTab] = useState<ItemTab>('identity');

  // Vista previa global interactiva (independiente de pestañas)
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Identidad
  const [identifier, setIdentifier] = useState<string>('custom:mi_item');
  const [bedrockGroup, setBedrockGroup] = useState<string>('');
  const [translations, setTranslations] = useState<BlockTranslation[]>([]);
  const [selectedLangToAdd, setSelectedLangToAdd] = useState<string>('es_ES');
  const [displayName, setDisplayName] = useState<string>('Mi Ítem');
  const [category, setCategory] = useState<ItemCategory>('items');
  const [rarity, setRarity] = useState<ItemRarity>('common');

  // Textura y Apariencia
  const [textureDataUrl, setTextureDataUrl] = useState<string>('');
  const [textureId, setTextureId] = useState<string>('');
  const [glint, setGlint] = useState<boolean>(false);
  const [handEquipped, setHandEquipped] = useState<boolean>(false);
  const [offHand, setOffHand] = useState<boolean>(false);

  // Mecánicas de Juego
  const [maxStackSize, setMaxStackSize] = useState<1 | 16 | 64>(64);
  const [durabilityEnabled, setDurabilityEnabled] = useState<boolean>(false);
  const [maxDurability, setMaxDurability] = useState<number>(250);
  const [weaponEnabled, setWeaponEnabled] = useState<boolean>(false);
  const [attackDamage, setAttackDamage] = useState<number>(5);
  const [fuelEnabled, setFuelEnabled] = useState<boolean>(false);
  const [fuelDuration, setFuelDuration] = useState<number>(10);

  // Uso y Alimentos
  const [useAnimation, setUseAnimation] = useState<ItemUseAnimation>('none');
  const [foodEnabled, setFoodEnabled] = useState<boolean>(false);
  const [foodNutrition, setFoodNutrition] = useState<number>(4);
  const [foodSaturation, setFoodSaturation] = useState<'poor' | 'low' | 'normal' | 'good' | 'max' | 'supernatural'>('normal');
  const [foodCanAlwaysEat, setFoodCanAlwaysEat] = useState<boolean>(false);
  const [cooldownEnabled, setCooldownEnabled] = useState<boolean>(false);
  const [cooldownCategory, setCooldownCategory] = useState<string>('item_cooldown');
  const [cooldownDuration, setCooldownDuration] = useState<number>(3);

  // Componentes Bedrock
  const [customComponents, setCustomComponents] = useState<ItemCustomComponentConfig[]>([]);

  // Programación Visual (Separada de Comportamiento)
  const [visualBehavior, setVisualBehavior] = useState<VisualBehaviorProgram | undefined>(undefined);
  const [isVisualBehaviorEditorOpen, setIsVisualBehaviorEditorOpen] = useState<boolean>(false);

  // Errores de validación
  const [validationError, setValidationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sincronizar estado al abrir o cambiar de ítem
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setIdentifier(item.identifier?.includes(':') ? item.identifier : `custom:${item.identifier || 'mi_item'}`);
        setBedrockGroup(item.bedrockGroup || '');
        setTranslations(
          item.translations?.length
            ? JSON.parse(JSON.stringify(item.translations))
            : [
                { langCode: 'es_ES', name: item.displayName || 'Mi Ítem' },
                { langCode: 'en_US', name: item.displayName || 'My Item' },
              ]
        );
        setDisplayName(item.displayName || 'Mi Ítem');
        setCategory(item.category || 'items');
        setRarity(item.rarity || 'common');
        setTextureDataUrl(item.textureDataUrl || '');
        setTextureId(item.textureId || '');
        setGlint(Boolean(item.glint));
        setHandEquipped(Boolean(item.handEquipped));
        setOffHand(Boolean(item.offHand));
        setMaxStackSize(item.maxStackSize || 64);

        setDurabilityEnabled(Boolean(item.durability?.enabled));
        setMaxDurability(item.durability?.maxDurability || 250);

        setWeaponEnabled(Boolean(item.weapon?.enabled));
        setAttackDamage(item.weapon?.attackDamage || 5);

        setFuelEnabled(Boolean(item.fuel?.enabled));
        setFuelDuration(item.fuel?.duration || 10);

        setUseAnimation(item.useAnimation || 'none');
        setFoodEnabled(Boolean(item.food?.enabled));
        setFoodNutrition(item.food?.nutrition || 4);
        setFoodSaturation(item.food?.saturationModifier || 'normal');
        setFoodCanAlwaysEat(Boolean(item.food?.canAlwaysEat));

        setCooldownEnabled(Boolean(item.cooldown?.enabled));
        setCooldownCategory(item.cooldown?.category || 'item_cooldown');
        setCooldownDuration(item.cooldown?.duration || 3);

        setCustomComponents(item.customComponents ? JSON.parse(JSON.stringify(item.customComponents)) : []);
        setVisualBehavior(item.visualBehavior ? JSON.parse(JSON.stringify(item.visualBehavior)) : undefined);
      } else {
        // Inicializar nuevo ítem buscando el primer número libre item_1, item_2...
        let nextNum = 1;
        const existingItemIds = new Set(
          existingItems.map((it) => {
            const idPart = (it.identifier || '').includes(':')
              ? it.identifier.split(':')[1]
              : it.identifier;
            return idPart?.toLowerCase();
          })
        );
        while (existingItemIds.has(`item_${nextNum}`)) {
          nextNum++;
        }

        setIdentifier(`custom:item_${nextNum}`);
        setBedrockGroup('');
        setTranslations([
          { langCode: 'es_ES', name: `Ítem ${nextNum}` },
          { langCode: 'en_US', name: `Item ${nextNum}` },
        ]);
        setDisplayName(`Ítem ${nextNum}`);
        setCategory('items');
        setRarity('common');
        setTextureDataUrl('');
        setTextureId('');
        setGlint(false);
        setHandEquipped(false);
        setOffHand(false);
        setMaxStackSize(64);
        setDurabilityEnabled(false);
        setMaxDurability(250);
        setWeaponEnabled(false);
        setAttackDamage(5);
        setFuelEnabled(false);
        setFuelDuration(10);
        setUseAnimation('none');
        setFoodEnabled(false);
        setFoodNutrition(4);
        setFoodSaturation('normal');
        setFoodCanAlwaysEat(false);
        setCooldownEnabled(false);
        setCooldownCategory('item_cooldown');
        setCooldownDuration(3);
        setCustomComponents([]);
        setVisualBehavior(undefined);
      }
      setValidationError('');
      setIsVisualBehaviorEditorOpen(false);
      setIsSaving(false);
    }
  }, [isOpen, item]);

  // Recibir textura asignada desde la biblioteca externa o pintor
  useEffect(() => {
    if (isOpen && assignedTextureUrl) {
      setTextureDataUrl(assignedTextureUrl);
      const match = availableTextures.find((t) => t.dataUrl === assignedTextureUrl);
      if (match) setTextureId(match.id);
      onConsumeAssignedTexture?.();
    }
  }, [isOpen, assignedTextureUrl, availableTextures, onConsumeAssignedTexture]);

  if (!isOpen) return null;

  const fullIdentifier = identifier.trim().toLowerCase();
  const identifierParts = fullIdentifier.split(':');
  const isValidId =
    identifierParts.length === 2 &&
    /^[a-z0-9_]+$/.test(identifierParts[0]) &&
    /^[a-z0-9_]+$/.test(identifierParts[1]);
  const isDuplicateId = existingItems.some((it) => {
    const existingId = (it.identifier || '').includes(':')
      ? it.identifier.toLowerCase()
      : `custom:${(it.identifier || '').toLowerCase()}`;
    return existingId === fullIdentifier && (!item || it.id !== item.id);
  });

  // Validación y guardado
  const handleSave = async () => {
    if (!fullIdentifier) {
      setValidationError('El identificador del ítem es obligatorio.');
      setActiveTab('identity');
      return;
    }

    if (!isValidId) {
      setValidationError('Usa el formato namespace:identificador. Solo se permiten letras minúsculas, números y guiones bajos (_).');
      setActiveTab('identity');
      return;
    }

    if (isDuplicateId) {
      setValidationError(`Ya existe otro ítem con el identificador «${fullIdentifier}». Usa uno diferente.`);
      setActiveTab('identity');
      return;
    }

    if (!displayName.trim()) {
      setValidationError('El nombre visible del ítem no puede estar vacío.');
      setActiveTab('identity');
      return;
    }

    // Validación de durabilidad vs tamaño de pila (maxStackSize)
    if (durabilityEnabled && maxStackSize !== 1) {
      setValidationError('Los ítems con durabilidad no se pueden apilar (el tamaño máximo de pila debe ser 1). Cambia el tamaño de pila a 1 en Propiedades para continuar.');
      setActiveTab('properties');
      return;
    }

    const foodConfig: ItemFoodConfig | undefined = foodEnabled
      ? {
          enabled: true,
          nutrition: Math.min(20, Math.max(1, Math.round(foodNutrition))),
          saturationModifier: foodSaturation,
          canAlwaysEat: foodCanAlwaysEat,
        }
      : undefined;

    const durabilityConfig: ItemDurabilityConfig | undefined = durabilityEnabled
      ? {
          enabled: true,
          maxDurability: Math.max(1, Math.round(maxDurability)),
        }
      : undefined;

    const weaponConfig: ItemWeaponConfig | undefined = weaponEnabled
      ? {
          enabled: true,
          attackDamage: Math.max(1, Math.round(attackDamage)),
        }
      : undefined;

    const fuelConfig: ItemFuelConfig | undefined = fuelEnabled
      ? {
          enabled: true,
          duration: Math.max(1, Math.round(fuelDuration)),
        }
      : undefined;

    const cooldownConfig: ItemCooldownConfig | undefined = cooldownEnabled
      ? {
          enabled: true,
          category: cooldownCategory.trim() || 'item_cooldown',
          duration: Math.max(0.1, Number(cooldownDuration.toFixed(1))),
        }
      : undefined;

    const saved: CustomItem = {
      id: item?.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      identifier: fullIdentifier,
      displayName: displayName.trim(),
      folderId: item?.folderId,
      bedrockGroup: bedrockGroup || undefined,
      translations: translations.length ? translations : undefined,
      textureId: textureId || undefined,
      textureDataUrl: textureDataUrl || undefined,
      category,
      rarity,
      maxStackSize,
      handEquipped,
      offHand,
      glint,
      useAnimation: foodEnabled && useAnimation === 'none' ? 'eat' : useAnimation,
      food: foodConfig,
      durability: durabilityConfig,
      weapon: weaponConfig,
      fuel: fuelConfig,
      cooldown: cooldownConfig,
      visualBehavior: visualBehavior?.enabled || (visualBehavior?.actions && visualBehavior.actions.length > 0) ? visualBehavior : undefined,
      customComponents: customComponents.filter((c) => c.enabled),
      createdAt: item?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setIsSaving(true);
    try {
      const result = await onSaveItem(saved);
      // Si el guardado devuelve false explícitamente, no cerramos y mostramos error
      if (result === false) {
        setValidationError('No se pudo guardar el ítem en el proyecto. Verifica los datos.');
        setIsSaving(false);
        return;
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar el ítem:', err);
      setValidationError('Ocurrió un error inesperado al guardar el ítem.');
      setIsSaving(false);
    }
  };

  // Ítem temporal para la vista previa
  const previewItemData: Partial<CustomItem> = {
    identifier: fullIdentifier,
    displayName: displayName.trim(),
    rarity,
    maxStackSize,
    handEquipped,
    offHand,
    glint,
    durability: durabilityEnabled ? { enabled: true, maxDurability } : undefined,
    weapon: weaponEnabled ? { enabled: true, attackDamage } : undefined,
    food: foodEnabled ? { enabled: true, nutrition: foodNutrition, saturationModifier: foodSaturation, canAlwaysEat: foodCanAlwaysEat } : undefined,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 [padding-top:max(0.5rem,env(safe-area-inset-top))] [padding-bottom:max(0.5rem,env(safe-area-inset-bottom))] [padding-left:max(0.5rem,env(safe-area-inset-left))] [padding-right:max(0.5rem,env(safe-area-inset-right))]">
      <div className="relative w-full max-w-4xl bg-[#090e18] border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top)+env(safe-area-inset-bottom)))] overflow-hidden">
        {/* Encabezado y Pestañas unificados en un solo contenedor sticky (evita top-[61px] rígido) */}
        <div className="sticky top-0 z-30 bg-[#0d1322]/95 backdrop-blur-xl border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm">
                <i className="bx bxs-shield-alt-2 text-xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100 truncate">
                    {item ? `Editar Ítem: ${displayName}` : 'Nuevo Ítem Personalizado'}
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Minecraft Item
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 truncate block">
                  {fullIdentifier || 'sin_id'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botón Vista Previa disponible en todas las pestañas */}
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className={`min-h-[40px] px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  showPreview
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                aria-label="Alternar vista previa del ítem"
                title="Alternar vista previa del ítem"
              >
                <i className={`bx ${showPreview ? 'bxs-hide' : 'bx-show'} text-base`} />
                <span className="hidden sm:inline">Vista previa</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Cerrar editor"
                title="Cerrar"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>
          </div>

          {/* Barra de pestañas */}
          <div
            role="tablist"
            className="flex gap-1.5 overflow-x-auto whitespace-nowrap overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 sm:px-4 pb-3"
          >
            {([
              ['identity', 'Identidad', 'bx bxs-id-card'],
              ['texture', 'Textura', 'bx bxs-paint'],
              ['properties', 'Propiedades', 'bx bxs-wrench'],
              ['behavior', 'Comportamiento', 'bx bx-chip'],
              ['visual_behavior', 'Programación visual', 'bx bx-code-block'],
            ] as const).map(([tab, label, icon]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`min-h-[38px] shrink-0 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className={`${icon} text-base`} />
                <span>{label}</span>
                {tab === 'behavior' && customComponents.filter((c) => c.enabled).length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 font-bold">
                    {customComponents.filter((c) => c.enabled).length}
                  </span>
                )}
                {tab === 'visual_behavior' && visualBehavior?.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <i className="bx bx-error-circle text-base shrink-0" />
            <span className="flex-1">{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError('')}
              className="text-rose-400 hover:text-rose-200 text-xs"
              aria-label="Cerrar mensaje de error"
            >
              <i className="bx bx-x text-base" />
            </button>
          </div>
        )}

        {/* Cuerpo Principal: Formulario y Vista Previa */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-y-auto overscroll-contain">
          {/* COLUMNA FORMULARIO */}
          <div className="flex-1 flex flex-col gap-4">
            {/* ============================================================= */}
            {/* SECCIÓN 1: IDENTIDAD Y NOMBRE                                 */}
            {/* ============================================================= */}
            {activeTab === 'identity' && (
              <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
                {/* Identificador técnico con namespace completo */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-200">
                    Identificador Técnico Único *
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-400">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value.toLowerCase().replace(/[^a-z0-9_:]/g, ''));
                        setValidationError('');
                      }}
                      placeholder="hive:espada_runica"
                      aria-label="Identificador completo con namespace"
                      className="w-full min-h-[40px] px-3 bg-transparent text-sm font-mono text-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div className="text-[11px] flex flex-col gap-1 mt-1">
                    {fullIdentifier && isDuplicateId && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <i className="bx bx-error-circle" />
                        Ya existe otro ítem con el identificador «{fullIdentifier}».
                      </span>
                    )}
                    {fullIdentifier && !isDuplicateId && isValidId && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <i className="bx bx-check-circle" />
                        Identificador disponible para comandos:{' '}
                        <code className="font-mono font-bold">/give @s {fullIdentifier}</code>
                      </span>
                    )}
                    {!fullIdentifier && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <i className="bx bx-info-circle" />
                        Escribe un identificador para el ítem.
                      </span>
                    )}
                  </div>
                </div>

                {/* Nombre Visible */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-200">
                    Nombre Visible en el Juego *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setValidationError('');
                    }}
                    placeholder="Ej. Espada Rúnica, Manzana Dorada Mística..."
                    className="w-full min-h-[44px] px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400">
                    El nombre que ven los jugadores al pasar el cursor sobre el ítem en su inventario.
                  </span>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">Idioma y traducciones (.lang)</span>
                    <span className="text-[10px] text-emerald-300">{translations.length} idiomas</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Usa los mismos idiomas disponibles en el editor de bloques.</p>
                  {translations.map((trans, idx) => {
                    const langMeta = SUPPORTED_LANGUAGES.find((lang) => lang.code === trans.langCode);
                    return (
                      <div key={trans.langCode} className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                        <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 rounded">
                          {trans.langCode}
                        </span>
                        <input
                          type="text"
                          value={trans.name}
                          onChange={(event) =>
                            setTranslations((prev) =>
                              prev.map((entry, index) => (index === idx ? { ...entry, name: event.target.value } : entry))
                            )
                          }
                          placeholder={langMeta?.label || trans.langCode}
                          className="flex-1 min-w-0 min-h-[36px] px-2 bg-transparent text-xs text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setTranslations((prev) => prev.filter((_, index) => index !== idx))}
                          className="min-h-[36px] min-w-[36px] text-slate-500 hover:text-rose-400"
                          aria-label={`Eliminar traducción ${trans.langCode}`}
                        >
                          <i className="bx bx-trash" />
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <select
                      value={selectedLangToAdd}
                      onChange={(event) => setSelectedLangToAdd(event.target.value)}
                      className="flex-1 min-h-[40px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                    >
                      {SUPPORTED_LANGUAGES.filter((lang) => !translations.some((entry) => entry.langCode === lang.code)).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label} ({lang.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedLangToAdd && !translations.some((entry) => entry.langCode === selectedLangToAdd)) {
                          setTranslations((prev) => [...prev, { langCode: selectedLangToAdd, name: displayName || '' }]);
                        }
                      }}
                      className="min-h-[40px] px-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-200">Grupo personalizado existente</label>
                  <select
                    value={bedrockGroup}
                    onChange={(e) => setBedrockGroup(e.target.value)}
                    className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="">Sin grupo</option>
                    {existingGroups
                      .filter((group) => Boolean(group.bedrockGroup))
                      .map((group) => (
                        <option key={group.id} value={group.bedrockGroup}>
                          {group.name} ({group.bedrockGroup})
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-slate-400">Solo aparecen los grupos ya creados en este proyecto.</span>
                </div>

                {/* Categoría de Inventario Creativo y Rareza */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-200">Categoría Creativa</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ItemCategory)}
                      className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="items">Objetos Misceláneos (Items)</option>
                      <option value="equipment">Equipamiento y Armas (Equipment)</option>
                      <option value="nature">Naturaleza y Plantas (Nature)</option>
                      <option value="construction">Construcción (Construction)</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-200">Rareza del Ítem</label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value as ItemRarity)}
                      className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="common">Común (Texto blanco)</option>
                      <option value="uncommon">Poco común (Texto amarillo)</option>
                      <option value="rare">Raro (Texto cian)</option>
                      <option value="epic">Épico (Texto magenta)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECCIÓN 2: TEXTURA Y APARIENCIA                               */}
            {/* ============================================================= */}
            {activeTab === 'texture' && (
              <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
                {/* Selector de Textura 2D */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Textura 2D del Ítem *</span>
                      <span className="text-[10px] text-slate-400">
                        Icono pixel art que representa el objeto en inventario y mano.
                      </span>
                    </div>

                    {textureDataUrl && (
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={textureDataUrl}
                          alt="Icono actual"
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                    )}
                  </div>

                  {/* Acciones de textura */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={onOpenTextureLibrary}
                      className="min-h-[44px] px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <i className="bx bxs-photo-album text-base" />
                      <span>Elegir de Biblioteca</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenTexturePainter}
                      className="min-h-[44px] px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <i className="bx bxs-paint text-base" />
                      <span>Pintar con Pixel Art</span>
                    </button>
                  </div>

                  {!textureDataUrl && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <i className="bx bx-info-circle" />
                      Selecciona una textura para que el ítem sea visible en Minecraft.
                    </span>
                  )}
                </div>

                {/* Modificadores Visuales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Brillo mágico (Glint) */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Brillo Encantado</span>
                      <span className="text-[10px] text-slate-400">Efecto glint púrpura</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Brillo encantado"
                        checked={glint}
                        onChange={(e) => setGlint(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-fuchsia-500" />
                    </label>
                  </div>

                  {/* Agarre como herramienta/espada (Hand Equipped) */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Como Herramienta</span>
                      <span className="text-[10px] text-slate-400">Inclinación en mano</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Sujetar como herramienta"
                        checked={handEquipped}
                        onChange={(e) => setHandEquipped(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-cyan-500" />
                    </label>
                  </div>

                  {/* Mano Secundaria (Off Hand) */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Mano Secundaria</span>
                      <span className="text-[10px] text-slate-400">Ranura de escudo</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Permitir en mano secundaria"
                        checked={offHand}
                        onChange={(e) => setOffHand(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-emerald-500" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECCIÓN 3: MECÁNICAS DE JUEGO & PROPIEDADES                   */}
            {/* ============================================================= */}
            {activeTab === 'properties' && (
              <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
                {/* Tamaño Máximo de Pila */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-200">
                    Cantidad Máxima por Pila (Max Stack Size)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 16, 64] as const).map((stackSize) => (
                      <button
                        key={stackSize}
                        type="button"
                        onClick={() => {
                          setMaxStackSize(stackSize);
                          if (stackSize > 1 && durabilityEnabled) {
                            setDurabilityEnabled(false);
                          }
                          setValidationError('');
                        }}
                        className={`min-h-[42px] rounded-xl text-xs font-bold border transition-colors ${
                          maxStackSize === stackSize
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {stackSize} {stackSize === 1 ? 'unidad (Armas/Herramientas)' : stackSize === 16 ? 'unidades (Perlas)' : 'unidades (Estándar)'}
                      </button>
                    ))}
                  </div>
                  {durabilityEnabled && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <i className="bx bx-info-circle" />
                      Los ítems con durabilidad requieren tamaño de pila 1.
                    </span>
                  )}
                </div>

                {/* Durabilidad */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Durabilidad y Daño (minecraft:durability)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        El ítem se desgasta con el uso y muestra barra de vida.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Activar durabilidad"
                        checked={durabilityEnabled}
                        onChange={(e) => {
                          setDurabilityEnabled(e.target.checked);
                          if (e.target.checked && maxStackSize > 1) {
                            setMaxStackSize(1);
                          }
                          setValidationError('');
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-emerald-500" />
                    </label>
                  </div>

                  {durabilityEnabled && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                      <label className="text-xs text-slate-300 shrink-0">Usos totales:</label>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={maxDurability}
                        onChange={(e) => setMaxDurability(parseInt(e.target.value, 10) || 1)}
                        className="flex-1 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setMaxDurability(250)}
                          className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-slate-400"
                        >
                          Hierro (250)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaxDurability(1561)}
                          className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-slate-400"
                        >
                          Diamante (1561)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daño de Ataque / Arma */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Modificador de Daño de Ataque (Weapon)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Cantidad de corazones infligidos a monstruos y jugadores.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Activar daño de arma"
                        checked={weaponEnabled}
                        onChange={(e) => setWeaponEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-rose-500" />
                    </label>
                  </div>

                  {weaponEnabled && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                      <label className="text-xs text-slate-300 shrink-0">Puntos de daño:</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={attackDamage}
                        onChange={(e) => setAttackDamage(parseInt(e.target.value, 10) || 1)}
                        className="w-24 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-xs text-slate-400">
                        = {(attackDamage / 2).toFixed(1)} corazones de daño por golpe
                      </span>
                    </div>
                  )}
                </div>

                {/* Combustible en Hornos */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Combustible en Hornos (minecraft:fuel)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Permite que el ítem queme objetos en hornos de Minecraft.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Activar combustible"
                        checked={fuelEnabled}
                        onChange={(e) => setFuelEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-amber-500" />
                    </label>
                  </div>

                  {fuelEnabled && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                      <label className="text-xs text-slate-300 shrink-0">Segundos de quema:</label>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={fuelDuration}
                        onChange={(e) => setFuelDuration(parseInt(e.target.value, 10) || 1)}
                        className="w-24 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs text-slate-400">
                        (Carbón estándar = 80 seg; Madera = 15 seg)
                      </span>
                    </div>
                  )}
                </div>

                {/* Animación de Uso */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-200">
                    Animación de Uso (minecraft:use_animation)
                  </label>
                  <select
                    value={useAnimation}
                    onChange={(e) => setUseAnimation(e.target.value as ItemUseAnimation)}
                    className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="none">Sin animación (Instantáneo / Clic normal)</option>
                    <option value="eat">Comer (Morder alimento)</option>
                    <option value="drink">Beber (Sonido de trago de poción)</option>
                    <option value="bow">Tensar arco (Bow)</option>
                    <option value="spear">Lanzar tridente (Spear)</option>
                    <option value="block">Bloquear con escudo (Block)</option>
                    <option value="camera">Cámara (Apuntar)</option>
                  </select>
                </div>

                {/* Comida y Bebida */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Propiedades de Comida / Poción (minecraft:food)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Restaura hambre y saturación al consumirlo.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Activar propiedades de comida"
                        checked={foodEnabled}
                        onChange={(e) => {
                          setFoodEnabled(e.target.checked);
                          if (e.target.checked && useAnimation === 'none') {
                            setUseAnimation('eat');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-amber-500" />
                    </label>
                  </div>

                  {foodEnabled && (
                    <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-300">
                          Puntos de Comida ({foodNutrition} medios muslos):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={foodNutrition}
                          onChange={(e) => setFoodNutrition(parseInt(e.target.value, 10) || 1)}
                          className="w-20 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-300">Modificador de Saturación:</label>
                        <select
                          value={foodSaturation}
                          onChange={(e) => setFoodSaturation(e.target.value as any)}
                          className="min-h-[38px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                        >
                          <option value="poor">Pobre (Snack rápido)</option>
                          <option value="low">Baja (Manzana / Fruta)</option>
                          <option value="normal">Normal (Pan / Pescado)</option>
                          <option value="good">Buena (Carne cocinada)</option>
                          <option value="max">Máxima (Chuleta / Zanahoria dorada)</option>
                          <option value="supernatural">Sobrenatural</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          aria-label="Comer siempre"
                          checked={foodCanAlwaysEat}
                          onChange={(e) => setFoodCanAlwaysEat(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                        />
                        <span className="text-xs text-slate-300">
                          Comer siempre (incluso con la barra de hambre llena, como la manzana dorada)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Enfriamiento / Cooldown */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Tiempo de Enfriamiento (minecraft:cooldown)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Evita usar el ítem repetidamente durante unos segundos (ej. Perla de Ender).
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Activar tiempo de enfriamiento"
                        checked={cooldownEnabled}
                        onChange={(e) => setCooldownEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-cyan-500" />
                    </label>
                  </div>

                  {cooldownEnabled && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                      <label className="text-xs text-slate-300 shrink-0">Segundos de espera:</label>
                      <input
                        type="number"
                        min={0.1}
                        max={60}
                        step={0.5}
                        value={cooldownDuration}
                        onChange={(e) => setCooldownDuration(parseFloat(e.target.value) || 1)}
                        className="w-24 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECCIÓN 4: COMPONENTES BEDROCK OFICIALES                      */}
            {/* ============================================================= */}
            {activeTab === 'behavior' && (
              <div className="animate-in fade-in duration-150">
                <ItemComponentsManager
                  components={customComponents}
                  onChange={(updated) => setCustomComponents(updated)}
                />
              </div>
            )}

            {/* ============================================================= */}
            {/* SECCIÓN 5: PROGRAMACIÓN VISUAL (SEPARADA DE COMPORTAMIENTO)   */}
            {/* ============================================================= */}
            {activeTab === 'visual_behavior' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <i className="bx bx-code-block text-lg" />
                    <span>Flujo de Programación Visual del Ítem</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Define qué sucede cuando el jugador interactúa con este ítem mediante bloques lógicos visuales. Comenzará con el evento oficial de uso (<code className="text-cyan-300 font-mono">on_use</code>) y se traduce a lógica Bedrock.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Estado del Flujo Visual
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {visualBehavior?.enabled
                          ? 'El flujo está activo y se ejecutará al usar el ítem.'
                          : 'El flujo está desactivado o aún no se ha configurado.'}
                      </span>
                    </div>
                    {visualBehavior && (
                      <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                        <input
                          type="checkbox"
                          aria-label="Activar flujo visual"
                          checked={visualBehavior.enabled}
                          onChange={(e) =>
                            setVisualBehavior({
                              ...visualBehavior,
                              enabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-emerald-500" />
                      </label>
                    )}
                  </div>

                  {visualBehavior ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-bold text-cyan-400">Evento:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-950 text-[11px] font-mono text-cyan-300">
                          {visualBehavior.event}
                        </code>
                        <span className="text-slate-500">·</span>
                        <span className="font-bold text-violet-400">Condición:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-950 text-[11px] font-mono text-violet-300">
                          {visualBehavior.condition}
                        </code>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Acciones programadas ({visualBehavior.actions.length}):
                        </span>
                        {visualBehavior.actions.map((act, idx) => (
                          <div
                            key={act.id || idx}
                            className="flex items-center gap-2 text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800"
                          >
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-300 font-medium">
                              {act.type === 'play_sound'
                                ? 'Reproducir sonido'
                                : act.type === 'spawn_particle'
                                ? 'Generar partícula'
                                : 'Mensaje a pantalla'}
                              :
                            </span>
                            <code className="font-mono text-cyan-300 text-[11px] truncate flex-1">
                              {act.value}
                            </code>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsVisualBehaviorEditorOpen(true)}
                          className="flex-1 min-h-[40px] px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <i className="bx bx-edit text-base" />
                          <span>Editar Bloques Visuales</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisualBehavior(undefined)}
                          className="min-h-[40px] px-3 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <i className="bx bx-trash text-base" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-6 flex flex-col items-center text-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center">
                        <i className="bx bx-code-alt text-2xl" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No hay programación visual configurada para este ítem. Agrega eventos para que realice acciones especiales en el juego.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsVisualBehaviorEditorOpen(true)}
                        className="min-h-[40px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 mt-1 transition-colors"
                      >
                        <i className="bx bx-plus text-base" />
                        <span>Configurar Flujo Visual</span>
                      </button>
                    </div>
                  )}
                </div>

                <VisualBehaviorEditor
                  isOpen={isVisualBehaviorEditorOpen}
                  title={displayName || 'Ítem'}
                  initialProgram={
                    visualBehavior || {
                      enabled: true,
                      event: 'on_use',
                      condition: 'always',
                      actions: [{ id: 'act_default', type: 'play_sound', value: 'random.levelup' }],
                    }
                  }
                  onClose={() => setIsVisualBehaviorEditorOpen(false)}
                  onSave={(prog) => {
                    setVisualBehavior(prog);
                    setIsVisualBehaviorEditorOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* COLUMNA LATERAL: VISTA PREVIA EN PANTALLAS ANCHAS / HORIZONTAL */}
          {showPreview && (
            <div className="hidden md:flex w-72 flex-col gap-3 shrink-0 animate-in fade-in duration-200">
              <div className="sticky top-0 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <i className="bx bx-show text-cyan-400" />
                    <span>Vista previa en vivo</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                    aria-label="Ocultar columna de vista previa"
                  >
                    <i className="bx bx-x text-base" />
                  </button>
                </div>
                <ItemPreview item={previewItemData} textureDataUrl={textureDataUrl} />
              </div>
            </div>
          )}

          {/* BOTÓN INFERIOR DE GUARDADO STICKY */}
          <div className="sticky bottom-0 z-10 w-full md:w-72 shrink-0 bg-[#090e18] pt-2 [padding-bottom:max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <i className="bx bxs-save text-lg" />
              <span>{isSaving ? 'Guardando...' : item ? 'Guardar Cambios del Ítem' : 'Crear Ítem en el Addon'}</span>
            </button>
          </div>
        </div>

        {/* BOTTOM SHEET DE VISTA PREVIA EN MÓVIL / PANTALLA VERTICAL */}
        {showPreview && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
            onClick={() => setShowPreview(false)}
          >
            <div
              className="w-full bg-[#0d1322] border-t border-cyan-500/30 rounded-t-3xl p-4 flex flex-col gap-3 shadow-2xl max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-200 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-sm font-bold text-slate-100">Vista previa del ítem</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
                  aria-label="Cerrar vista previa"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>

              <ItemPreview item={previewItemData} textureDataUrl={textureDataUrl} />

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="w-full min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

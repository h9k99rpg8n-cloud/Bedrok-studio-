import React, { useState, useEffect } from 'react';
import {
  BlockFaceKey,
  BlockGroup,
  BlockTranslation,
  CustomBlock,
  CustomTexture,
  FaceTextures,
  SUPPORTED_LANGUAGES,
  TextureMode,
} from '../types/addon';
import { CubeAtlasEditor } from './CubeAtlasEditor';
import { isValidBedrockIdentifier } from '../utils/diagnostics';

interface FullBlockEditorModalProps {
  isOpen: boolean;
  block: CustomBlock | null;
  existingBlocks: CustomBlock[];
  availableTextures: CustomTexture[];
  availableGroups?: BlockGroup[];
  assignedTexture?: { face: BlockFaceKey; texDataUrl: string; timestamp: number } | null;
  onClose: () => void;
  onSaveBlock: (block: CustomBlock) => void;
  onOpenTextureLibraryForFace: (face: BlockFaceKey) => void;
  onOpenTutorial: () => void;
}

type EditorTab = 'identity' | 'textures' | 'properties';

export const FullBlockEditorModal: React.FC<FullBlockEditorModalProps> = ({
  isOpen,
  block,
  existingBlocks,
  availableTextures,
  availableGroups = [],
  assignedTexture,
  onClose,
  onSaveBlock,
  onOpenTextureLibraryForFace,
  onOpenTutorial,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<EditorTab>('identity');

  // Fields
  const [identifier, setIdentifier] = useState<string>('nuevo_bloque');
  const [displayName, setDisplayName] = useState<string>('Nuevo Bloque');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);
  const [translations, setTranslations] = useState<BlockTranslation[]>([]);
  const [textureMode, setTextureMode] = useState<TextureMode>('one');

  const [faceTextures, setFaceTextures] = useState<FaceTextures>({
    up: '',
    down: '',
    north: '',
    south: '',
    east: '',
    west: '',
  });

  // Properties & Accordion states
  const [emitsLight, setEmitsLight] = useState<boolean>(false);
  const [lightLevel, setLightLevel] = useState<number>(0);

  const [consumesRedstone, setConsumesRedstone] = useState<boolean>(false);
  const [allowsSignalPropagation, setAllowsSignalPropagation] = useState<boolean>(true);

  const [destroyTime, setDestroyTime] = useState<number>(1.5);
  const [explosionResistance, setExplosionResistance] = useState<number>(6.0);

  // Destruction Particles
  const [destructionParticlesEnabled, setDestructionParticlesEnabled] = useState<boolean>(false);
  const [destructionParticleTextureId, setDestructionParticleTextureId] = useState<string>('');
  const [destructionParticleCount, setDestructionParticleCount] = useState<number>(8);

  // Step Particles
  const [stepParticlesEnabled, setStepParticlesEnabled] = useState<boolean>(false);
  const [stepParticleTextureId, setStepParticleTextureId] = useState<string>('');
  const [stepParticleIntensity, setStepParticleIntensity] = useState<number>(5);

  // Accordion collapsed state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    light: true,
    redstone: true,
    destruction_particles: true,
    step_particles: true,
    physics: false,
    translations: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [validationError, setValidationError] = useState<string>('');
  const [selectedLangToAdd, setSelectedLangToAdd] = useState<string>('es_ES');

  // Cleanly synchronize all state whenever modal opens or active block changes
  useEffect(() => {
    if (isOpen) {
      if (block) {
        setIdentifier(block.identifier || 'nuevo_bloque');
        setDisplayName(block.displayName || 'Nuevo Bloque');
        setSelectedGroupId(block.groupId || '');
        setGroupSearchQuery('');
        setIsGroupDropdownOpen(false);
        setTranslations(
          block.translations && block.translations.length > 0
            ? JSON.parse(JSON.stringify(block.translations))
            : [
                { langCode: 'es_ES', name: block.displayName || 'Nuevo Bloque' },
                { langCode: 'en_US', name: block.displayName || 'New Block' },
              ]
        );
        setTextureMode(block.textureMode || 'one');
        setFaceTextures(
          block.faceTextures
            ? { ...block.faceTextures }
            : {
                up: block.textureDataUrl || '',
                down: block.textureDataUrl || '',
                north: block.textureDataUrl || '',
                south: block.textureDataUrl || '',
                east: block.textureDataUrl || '',
                west: block.textureDataUrl || '',
              }
        );
        setEmitsLight(block.emitsLight || false);
        setLightLevel(block.lightLevel ?? 15);
        setConsumesRedstone(block.consumesRedstone || false);
        setAllowsSignalPropagation(
          block.redstoneConfig?.propagatesPower ??
            block.redstoneConfig?.allowsSignalPropagation ??
            true
        );
        setDestroyTime(block.destroyTime ?? 1.5);
        setExplosionResistance(block.explosionResistance ?? 6.0);
        setDestructionParticlesEnabled(block.destructionParticles?.enabled || false);
        setDestructionParticleTextureId(block.destructionParticles?.particleTextureId || '');
        setDestructionParticleCount(block.destructionParticles?.particleCount ?? 8);
        setStepParticlesEnabled(block.stepParticles?.enabled || false);
        setStepParticleTextureId(block.stepParticles?.particleTextureId || '');
        setStepParticleIntensity(block.stepParticles?.intensity ?? 5);
      } else {
        const randSuf = Math.floor(Math.random() * 899 + 100);
        const defaultName = `Bloque Personalizado ${randSuf}`;
        setIdentifier(`bloque_${randSuf}`);
        setDisplayName(defaultName);
        setTranslations([
          { langCode: 'es_ES', name: defaultName },
          { langCode: 'en_US', name: `Custom Block ${randSuf}` },
        ]);
        setTextureMode('one');
        setFaceTextures({
          up: '',
          down: '',
          north: '',
          south: '',
          east: '',
          west: '',
        });
        setEmitsLight(false);
        setLightLevel(0);
        setConsumesRedstone(false);
        setAllowsSignalPropagation(true);
        setDestroyTime(1.5);
        setExplosionResistance(6.0);
        setDestructionParticlesEnabled(false);
        setDestructionParticleTextureId('');
        setDestructionParticleCount(8);
        setStepParticlesEnabled(false);
        setStepParticleTextureId('');
        setStepParticleIntensity(5);
      }
      setValidationError('');
      setActiveTab('identity');
    }
  }, [isOpen, block]);

  // Handle incoming texture assignment from library or painter
  useEffect(() => {
    if (assignedTexture && assignedTexture.face && assignedTexture.texDataUrl) {
      handleFaceTextureChange(assignedTexture.face, assignedTexture.texDataUrl);
    }
  }, [assignedTexture]);

  if (!isOpen) return null;

  // Validation
  const validateBlock = (): boolean => {
    const rawId = identifier.trim().toLowerCase();
    if (!rawId) {
      setValidationError('El identificador técnico no puede estar vacío.');
      setActiveTab('identity');
      return false;
    }
    if (!isValidBedrockIdentifier(rawId)) {
      setValidationError('El identificador solo puede contener letras minúsculas (a-z), números (0-9) y guiones bajos (_).');
      setActiveTab('identity');
      return false;
    }
    // Check collisions with other blocks in same project
    const collision = existingBlocks.find((b) => b.id !== block?.id && b.identifier === rawId);
    if (collision) {
      setValidationError(`Ya existe otro bloque con el identificador "custom:${rawId}". Debe ser único.`);
      setActiveTab('identity');
      return false;
    }
    if (!displayName.trim()) {
      setValidationError('El nombre visible del bloque no puede estar vacío.');
      setActiveTab('identity');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateBlock()) return;

    // Build face textures depending on mode
    const finalFaces: FaceTextures = { ...faceTextures };
    if (textureMode === 'one') {
      const single = faceTextures.up || '';
      finalFaces.down = single;
      finalFaces.north = single;
      finalFaces.south = single;
      finalFaces.east = single;
      finalFaces.west = single;
    } else if (textureMode === 'three') {
      const side = faceTextures.north || faceTextures.up || '';
      finalFaces.south = side;
      finalFaces.east = side;
      finalFaces.west = side;
    }

    const assignedGroupObj = availableGroups.find((g) => g.id === selectedGroupId);

    const saved: CustomBlock = {
      id: block?.id || `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      identifier: identifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      displayName: displayName.trim(),
      groupId: selectedGroupId ? selectedGroupId : undefined,
      groupName: assignedGroupObj ? assignedGroupObj.name : undefined,
      translations: translations.filter((t) => t.name.trim().length > 0),
      textureMode,
      faceTextures: finalFaces,
      textureDataUrl: finalFaces.up,
      emitsLight,
      lightLevel: emitsLight ? Math.min(15, Math.max(0, lightLevel)) : 0,
      consumesRedstone,
      redstoneConfig: consumesRedstone
        ? {
            minPower: 1,
            propagatesPower: allowsSignalPropagation,
            minSignalStrength: 1,
            allowsSignalPropagation,
          }
        : undefined,
      destroyTime: Math.max(0.1, destroyTime),
      explosionResistance: Math.max(0, explosionResistance),
      destructionParticles: destructionParticlesEnabled
        ? {
            enabled: true,
            particleTextureId: destructionParticleTextureId || finalFaces.up,
            particleCount: Math.min(24, Math.max(1, destructionParticleCount)),
          }
        : undefined,
      stepParticles: stepParticlesEnabled
        ? {
            enabled: true,
            particleTextureId: stepParticleTextureId || finalFaces.up,
            intensity: Math.min(10, Math.max(1, stepParticleIntensity)),
          }
        : undefined,
      createdAt: block?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveBlock(saved);
    onClose();
  };

  // Face texture change handler
  const handleFaceTextureChange = (face: BlockFaceKey, val: string) => {
    setFaceTextures((prev) => {
      const next = { ...prev, [face]: val };
      if (textureMode === 'one') {
        next.up = val;
        next.down = val;
        next.north = val;
        next.south = val;
        next.east = val;
        next.west = val;
      } else if (textureMode === 'three' && (face === 'north' || face === 'south' || face === 'east' || face === 'west')) {
        next.north = val;
        next.south = val;
        next.east = val;
        next.west = val;
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <i className="bx bxs-cube text-xl text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {block ? `Editar: ${displayName}` : 'Editor de Bloque Personalizado'}
              </h2>
              <span className="text-[10px] font-mono text-emerald-400">
                custom:{identifier || 'sin_id'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenTutorial}
              className="min-h-[40px] px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1"
              title="Abrir Tutorial Rápido"
            >
              <i className="bx bx-help-circle text-base" />
              <span>Tutorial</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
            >
              <i className="bx bx-x text-xl" />
            </button>
          </div>
        </div>

        {validationError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <i className="bx bx-error-circle text-base shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 my-3">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'identity'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-id-card text-sm" />
            <span>Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('textures')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'textures'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bxs-cube-alt text-sm" />
            <span>Atlas Caras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'properties'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-slider-alt text-sm" />
            <span>Propiedades</span>
          </button>
        </div>

        {/* Tab 1: Identidad del bloque */}
        {activeTab === 'identity' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Nombre Visible en el Juego *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ej: Mineral de Rubí Brillante"
                  className="w-full min-h-[46px] px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  El nombre que aparecerá traducido en el inventario de Minecraft.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Identificador Técnico Único *
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
                  <span className="px-3 text-xs text-slate-400 font-mono select-none">custom:</span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                      setIdentifier(cleaned);
                      setValidationError('');
                    }}
                    placeholder="ruby_ore"
                    className="w-full min-h-[46px] pr-3 bg-transparent text-sm font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Usado para comandos: <code className="font-mono text-slate-300">/give @s custom:{identifier || 'bloque'}</code>.
                </span>
              </div>

              {/* Group Assignment Section */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-200">
                    Grupo del Addon (Inventario Creativo)
                  </label>
                  {selectedGroupId && (
                    <button
                      type="button"
                      onClick={() => setSelectedGroupId('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <i className="bx bx-x" />
                      <span>Quitar grupo</span>
                    </button>
                  )}
                </div>

                {/* Selected Group Pill or Selector Trigger */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                      className="flex-1 min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedGroupId ? (
                          (() => {
                            const grp = availableGroups.find((g) => g.id === selectedGroupId);
                            return (
                              <>
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: grp?.color || '#10b981' }}
                                />
                                <span className="font-bold text-slate-100 truncate">
                                  {grp?.name || 'Grupo asignado'}
                                </span>
                                {grp?.category && (
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    {grp.category}
                                  </span>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <i className="bx bx-category text-base text-slate-500" />
                            <span>Sin grupo asignado (Organización general)</span>
                          </div>
                        )}
                      </div>
                      <i
                        className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${
                          isGroupDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dropdown with live search filter */}
                  {isGroupDropdownOpen && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-2 animate-in fade-in duration-150">
                      <div className="relative">
                        <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                        <input
                          type="text"
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          placeholder="Buscar grupo por nombre..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                        {/* Option: None */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGroupId('');
                            setIsGroupDropdownOpen(false);
                          }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors ${
                            !selectedGroupId
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'hover:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <i className="bx bx-minus-circle text-sm" />
                            <span>Sin grupo asignado</span>
                          </div>
                          {!selectedGroupId && <i className="bx bx-check text-emerald-400" />}
                        </button>

                        {availableGroups.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-500">
                            No has creado grupos en este proyecto todavía.
                          </div>
                        ) : (
                          availableGroups
                            .filter(
                              (g) =>
                                !groupSearchQuery.trim() ||
                                g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
                            )
                            .map((grp) => (
                              <button
                                key={grp.id}
                                type="button"
                                onClick={() => {
                                  setSelectedGroupId(grp.id);
                                  setIsGroupDropdownOpen(false);
                                }}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors ${
                                  selectedGroupId === grp.id
                                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                                    : 'hover:bg-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: grp.color || '#10b981' }}
                                  />
                                  <span className="truncate">{grp.name}</span>
                                  {grp.category && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({grp.category})
                                    </span>
                                  )}
                                </div>
                                {selectedGroupId === grp.id && (
                                  <i className="bx bx-check text-emerald-400" />
                                )}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400 leading-relaxed">
                    Los bloques agrupados se organizan juntos en el espacio de trabajo y se clasifican en la categoría del inventario creativo de Bedrock seleccionada.
                  </span>
                </div>
              </div>
            </div>

            {/* Multilingual Translations Accordion */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('translations')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bx-world text-emerald-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">Traducciones de Nombre (.lang)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    {translations.length} {translations.length === 1 ? 'idioma' : 'idiomas'}
                  </span>
                  <i
                    className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${
                      openSections.translations ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {openSections.translations && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-2.5">
                  <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                    Define cómo se llamará este bloque cuando los jugadores tengan Minecraft en diferentes idiomas.
                  </p>

                  {/* Translations List */}
                  <div className="flex flex-col gap-2">
                    {translations.map((trans, idx) => {
                      const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === trans.langCode);
                      return (
                        <div
                          key={`trans-${trans.langCode}-${idx}`}
                          className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800"
                        >
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 rounded shrink-0">
                            {trans.langCode}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={trans.name}
                              onChange={(e) => {
                                const next = [...translations];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setTranslations(next);
                              }}
                              placeholder={langMeta ? langMeta.label : trans.langCode}
                              className="w-full min-h-[36px] px-2 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-b focus:border-emerald-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTranslations((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                            title="Eliminar traducción"
                          >
                            <i className="bx bx-trash text-sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Language Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <select
                      value={selectedLangToAdd}
                      onChange={(e) => setSelectedLangToAdd(e.target.value)}
                      className="flex-1 min-h-[40px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {SUPPORTED_LANGUAGES.filter(
                        (l) => !translations.some((t) => t.langCode === l.code)
                      ).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label} ({lang.code})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedLangToAdd) return;
                        if (!translations.some((t) => t.langCode === selectedLangToAdd)) {
                          setTranslations((prev) => [
                            ...prev,
                            { langCode: selectedLangToAdd, name: displayName || '' },
                          ]);
                        }
                      }}
                      className="min-h-[40px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <i className="bx bx-plus text-sm" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Block Mini Preview Card */}
            <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-0.5 overflow-hidden pixelated flex items-center justify-center shadow-inner">
                  {faceTextures.up ? (
                    <img src={faceTextures.up} alt="Preview" className="w-full h-full object-contain pixelated" />
                  ) : (
                    <i className="bx bxs-cube text-2xl text-slate-600" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">{displayName}</span>
                  <span className="text-[10px] font-mono text-emerald-400">custom:{identifier}</span>
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg font-mono">
                Modo: {textureMode === 'one' ? '1 cara' : textureMode === 'three' ? '3 caras' : '6 caras'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Atlas de Texturas (1, 3 o 6 caras) */}
        {activeTab === 'textures' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            <CubeAtlasEditor
              mode={textureMode}
              faceTextures={faceTextures}
              availableTextures={availableTextures}
              onChangeMode={(m) => setTextureMode(m)}
              onChangeFaceTexture={handleFaceTextureChange}
              onOpenTextureLibraryForFace={onOpenTextureLibraryForFace}
              onClearFaceTexture={(f) => handleFaceTextureChange(f, '')}
            />
          </div>
        )}

        {/* Tab 3: Propiedades en Paneles Desplegables */}
        {activeTab === 'properties' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* Panel 1: Iluminación */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('light')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bxs-sun text-amber-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">Iluminación (Emisión de Luz)</span>
                </div>
                <div className="flex items-center gap-2">
                  {emitsLight && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                      Nivel {lightLevel}/15
                    </span>
                  )}
                  <i className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${openSections.light ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {openSections.light && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-300">¿El bloque emite luz?</span>
                    {/* 16px+ Mobile Touch Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={emitsLight}
                        onChange={(e) => setEmitsLight(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
                    </label>
                  </div>

                  {emitsLight && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Intensidad de luz:</span>
                        <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {lightLevel} / 15
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        value={lightLevel}
                        onChange={(e) => setLightLevel(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-400 min-h-[36px]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0 (Apagado)</span>
                        <span>7 (Redstone)</span>
                        <span>15 (Sol / Glowstone)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 2: Consumidor de Redstone */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('redstone')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bxs-zap text-rose-500 text-base" />
                  <span className="text-xs font-bold text-slate-200">Consumidor de Redstone</span>
                </div>
                <div className="flex items-center gap-2">
                  {consumesRedstone && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-mono">
                      Activo
                    </span>
                  )}
                  <i className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${openSections.redstone ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {openSections.redstone && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-slate-300 block">¿Conduce señal de Redstone?</span>
                      <span className="text-[10px] text-slate-400">Genera minecraft:redstone_conductivity oficial</span>
                    </div>
                    {/* 16px+ Mobile Touch Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={consumesRedstone}
                        onChange={(e) => setConsumesRedstone(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner" />
                    </label>
                  </div>

                  {consumesRedstone && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400">Permitir propagación descendente</span>
                      <button
                        type="button"
                        onClick={() => setAllowsSignalPropagation(!allowsSignalPropagation)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                          allowsSignalPropagation
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {allowsSignalPropagation ? 'Sí' : 'No'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 3: Partículas al Romper */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('destruction_particles')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bxs-bomb text-orange-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">Partículas al Romper</span>
                </div>
                <div className="flex items-center gap-2">
                  {destructionParticlesEnabled && (
                    <span className="text-[10px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded font-mono">
                      {destructionParticleCount} partículas
                    </span>
                  )}
                  <i className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${openSections.destruction_particles ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {openSections.destruction_particles && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-slate-300 block">Activar partículas de rotura</span>
                      <span className="text-[10px] text-slate-400">Efecto visual al minar o destruir el bloque</span>
                    </div>
                    {/* 16px+ Mobile Touch Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={destructionParticlesEnabled}
                        onChange={(e) => setDestructionParticlesEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner" />
                    </label>
                  </div>

                  {destructionParticlesEnabled && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Número de partículas emitidas:</span>
                        <span className="font-mono font-bold text-orange-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {destructionParticleCount}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={24}
                        value={destructionParticleCount}
                        onChange={(e) => setDestructionParticleCount(parseInt(e.target.value, 10))}
                        className="w-full accent-orange-400 min-h-[36px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 4: Partículas al Pisar (Walking detection via Script API) */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('step_particles')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bxs-sparkles text-purple-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">Partículas al Pisar (Walking)</span>
                </div>
                <div className="flex items-center gap-2">
                  {stepParticlesEnabled && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                      Script API
                    </span>
                  )}
                  <i className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${openSections.step_particles ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {openSections.step_particles && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-slate-300 block">Detectar paso de entidades</span>
                      <span className="text-[10px] text-slate-400">Genera partículas al caminar continuamente sobre él</span>
                    </div>
                    {/* 16px+ Mobile Touch Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={stepParticlesEnabled}
                        onChange={(e) => setStepParticlesEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner" />
                    </label>
                  </div>

                  {stepParticlesEnabled && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-300 flex items-start gap-2">
                        <i className="bx bx-info-circle text-base shrink-0 mt-0.5" />
                        <div>
                          <strong>Nota de compatibilidad Bedrock:</strong> En versiones estables, la detección fiable de entidades caminando requiere un componente registrado vía Script API. Bedrock Studio incluirá automáticamente el módulo <code className="font-mono text-white">@minecraft/server v1.14.0</code> en el manifiesto.
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-slate-400">Intensidad del efecto:</span>
                        <span className="font-mono font-bold text-purple-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {stepParticleIntensity} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={stepParticleIntensity}
                        onChange={(e) => setStepParticleIntensity(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-400 min-h-[36px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 5: Física y Minado */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('physics')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="bx bxs-shield text-emerald-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">Dureza de Minado y Explosión</span>
                </div>
                <i className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${openSections.physics ? 'rotate-180' : ''}`} />
              </button>

              {openSections.physics && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Tiempo de picado (segundos):</span>
                      <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {destroyTime.toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={30.0}
                      step={0.1}
                      value={destroyTime}
                      onChange={(e) => setDestroyTime(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 min-h-[36px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Resistencia a explosiones (TNT):</span>
                      <span className="font-mono font-bold text-rose-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {explosionResistance.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={explosionResistance}
                      onChange={(e) => setExplosionResistance(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 min-h-[36px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Save Button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <i className="bx bxs-save text-base" />
            <span>Guardar Bloque</span>
          </button>
        </div>
      </div>
    </div>
  );
};

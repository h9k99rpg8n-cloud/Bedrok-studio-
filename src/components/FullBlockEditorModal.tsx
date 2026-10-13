import React, { useState, useEffect } from 'react';
import {
  BlockBoxItem,
  BlockCollisionConfig,
  BlockComponentItem,
  BlockFaceKey,
  BlockGroup,
  BlockSelectionConfig,
  BlockTranslation,
  BoxPresetTemplate,
  CustomBlock,
  CustomTexture,
  FaceTextures,
  LootDropType,
  MineralToolRequirement,
  PreferredToolType,
  SUPPORTED_LANGUAGES,
  TextureMode,
  ToolTier,
} from '../types/addon';
import { CubeAtlasEditor } from './CubeAtlasEditor';
import { BlockComponentsManager } from './BlockComponentsManager';
import { Box3DVisualizer } from './Box3DVisualizer';
import { BoxGeometryEditor } from './BoxGeometryEditor';
import { isValidBedrockIdentifier } from '../utils/diagnostics';
import {
  getNextBlockNameAndIdentifier,
  getBlockNameSuggestions,
  generateIdentifierFromName,
} from '../utils/blockNaming';
import {
  checkInappropriateText,
  censorInappropriateText,
} from '../utils/textModeration';

interface FullBlockEditorModalProps {
  isOpen: boolean;
  block: CustomBlock | null;
  existingBlocks: CustomBlock[];
  availableTextures: CustomTexture[];
  availableGroups?: BlockGroup[];
  assignedTexture?: { face: BlockFaceKey | 'item'; texDataUrl: string; textureId?: string; timestamp: number } | null;
  onClose: () => void;
  onSaveBlock: (block: CustomBlock) => void;
  onOpenTextureLibraryForFace: (face: BlockFaceKey) => void;
  onOpenTextureLibraryForItem: () => void;
  onOpenTutorial: () => void;
}

// v0.1.5: Secciones del editor de bloques
type EditorTab = 'identity' | 'atlas' | 'properties' | 'boxes' | 'behavior';

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
  onOpenTextureLibraryForItem,
  onOpenTutorial,
}) => {
  // Navigation Tabs: Identidad, Atlas Core, Propiedades, Cajas (v0.1.5), Comportamiento
  const [activeTab, setActiveTab] = useState<EditorTab>('identity');

  // =========================================================================
  // SECCIÓN 1: IDENTIDAD
  // =========================================================================
  const [identifier, setIdentifier] = useState<string>('nuevo_bloque');
  const [displayName, setDisplayName] = useState<string>('Nuevo Bloque');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);
  const [translations, setTranslations] = useState<BlockTranslation[]>([]);
  const [selectedLangToAdd, setSelectedLangToAdd] = useState<string>('es_ES');

  // =========================================================================
  // SECCIÓN 2: ATLAS CORE
  // =========================================================================
  const [textureMode, setTextureMode] = useState<TextureMode>('one');
  const [faceTextures, setFaceTextures] = useState<FaceTextures>({
    up: '',
    down: '',
    north: '',
    south: '',
    east: '',
    west: '',
  });

  // =========================================================================
  // SECCIÓN 3: PROPIEDADES
  // =========================================================================
  const [destroyTime, setDestroyTime] = useState<number>(1.5);
  const [explosionResistance, setExplosionResistance] = useState<number>(6.0);
  const [emitsLight, setEmitsLight] = useState<boolean>(false);
  const [lightLevel, setLightLevel] = useState<number>(0);
  const [lightDampening, setLightDampening] = useState<number>(15);
  const [friction, setFriction] = useState<number>(0.4);
  const [flammable, setFlammable] = useState<boolean>(false);
  const [flameOdds, setFlameOdds] = useState<number>(5);
  const [burnOdds, setBurnOdds] = useState<number>(20);
  const [mapColor, setMapColor] = useState<string>('#7FB238');

  // Propiedad mineral (v0.1.7); los datos se conservan aunque se desactive.
  const [isMineral, setIsMineral] = useState<boolean>(false);
  const [mineralCustomItem, setMineralCustomItem] = useState<boolean>(false);
  const [mineralDropItemId, setMineralDropItemId] = useState<string>('minecraft:diamond');
  const [mineralDropItemName, setMineralDropItemName] = useState<string>('Fragmento mineral');
  const [mineralDropTextureId, setMineralDropTextureId] = useState<string>('');
  const [mineralMinCount, setMineralMinCount] = useState<number>(1);
  const [mineralMaxCount, setMineralMaxCount] = useState<number>(1);
  const [mineralRequiredTool, setMineralRequiredTool] = useState<MineralToolRequirement>('none');

  // =========================================================================
  // SECCIÓN D: CAJA DE COLISIÓN (v0.1.5)
  // =========================================================================
  const [collisionConfig, setCollisionConfig] = useState<BlockCollisionConfig>({
    template: 'default',
    enabled: true,
    boxes: [
      {
        id: 'col_1',
        name: 'Caja Completa',
        origin: [-8, 0, -8],
        size: [16, 16, 16],
      },
    ],
  });
  const [selectedCollisionBoxId, setSelectedCollisionBoxId] = useState<string>('col_1');

  // =========================================================================
  // SECCIÓN E: CAJA DE SELECCIÓN (v0.1.5)
  // =========================================================================
  const [selectionConfig, setSelectionConfig] = useState<BlockSelectionConfig>({
    template: 'default',
    enabled: true,
    boxes: [
      {
        id: 'sel_1',
        name: 'Caja Completa',
        origin: [-8, 0, -8],
        size: [16, 16, 16],
      },
    ],
  });
  const [selectedSelectionBoxId, setSelectedSelectionBoxId] = useState<string>('sel_1');

  // Subpestaña activa en la sección de Cajas (Colisión vs Selección)
  const [boxSubTab, setBoxSubTab] = useState<'collision' | 'selection'>('collision');

  // =========================================================================
  // SECCIÓN G: COMPORTAMIENTO
  // =========================================================================
  // Control modal de incorporar comportamiento
  const [isAddBehaviorModalOpen, setIsAddBehaviorModalOpen] = useState<boolean>(false);

  // Comportamientos activos en este bloque
  const [enabledBehaviors, setEnabledBehaviors] = useState<{
    mining: boolean;
    loot: boolean;
    redstone: boolean;
    particles: boolean;
    placement: boolean;
  }>({
    mining: true,
    loot: true,
    redstone: false,
    particles: false,
    placement: false,
  });

  // Reglas de minado y herramientas
  const [preferredTool, setPreferredTool] = useState<PreferredToolType>('any');
  const [minToolTier, setMinToolTier] = useState<ToolTier>('any');

  // Botín y recompensas al romperse
  const [lootDrop, setLootDrop] = useState<LootDropType>('self');
  const [customDropItem, setCustomDropItem] = useState<string>('');
  const [customDropCount, setCustomDropCount] = useState<number>(1);
  const [xpDropAmount, setXpDropAmount] = useState<number>(0);

  // Redstone
  const [consumesRedstone, setConsumesRedstone] = useState<boolean>(false);
  const [allowsSignalPropagation, setAllowsSignalPropagation] = useState<boolean>(true);

  // Partículas
  const [destructionParticlesEnabled, setDestructionParticlesEnabled] = useState<boolean>(false);
  const [destructionParticleTextureId, setDestructionParticleTextureId] = useState<string>('');
  const [destructionParticleCount, setDestructionParticleCount] = useState<number>(8);

  const [stepParticlesEnabled, setStepParticlesEnabled] = useState<boolean>(false);
  const [stepParticleTextureId, setStepParticleTextureId] = useState<string>('');
  const [stepParticleIntensity, setStepParticleIntensity] = useState<number>(5);

  // Componentes oficiales de colocación Bedrock
  const [componentsList, setComponentsList] = useState<BlockComponentItem[]>([]);

  // Accordion collapsed states for sub-panels
  const [openBehaviorPanels, setOpenBehaviorPanels] = useState<Record<string, boolean>>({
    mining: true,
    loot: true,
    redstone: true,
    particles: true,
    placement: true,
  });

  const toggleBehaviorPanel = (key: string) => {
    setOpenBehaviorPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [validationError, setValidationError] = useState<string>('');

  // Sincronizar estado al abrir o cambiar de bloque
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

        // Propiedades
        setDestroyTime(block.destroyTime ?? 1.5);
        setExplosionResistance(block.explosionResistance ?? 6.0);
        setEmitsLight(block.emitsLight || false);
        setLightLevel(block.lightLevel ?? 15);
        setLightDampening(block.lightDampening ?? 15);
        setFriction(block.friction ?? 0.4);
        setFlammable(block.flammable || false);
        setFlameOdds(block.flameOdds ?? 5);
        setBurnOdds(block.burnOdds ?? 20);
        setMapColor(/^#[0-9a-fA-F]{6}$/.test(block.mapColor || '') ? block.mapColor! : '#7FB238');

        setIsMineral(block.mineral?.enabled ?? false);
        setMineralCustomItem(block.mineral?.customItem ?? false);
        setMineralDropItemId(block.mineral?.dropItemId || 'minecraft:diamond');
        setMineralDropItemName(block.mineral?.dropItemName || 'Fragmento mineral');
        setMineralDropTextureId(block.mineral?.dropTextureId || '');
        setMineralMinCount(block.mineral?.minDropCount ?? 1);
        setMineralMaxCount(block.mineral?.maxDropCount ?? 1);
        setMineralRequiredTool(block.mineral?.requiredTool || 'none');

        // Comportamientos
        const hasCustomMining =
          Boolean(block.behaviorRules?.preferredTool && block.behaviorRules.preferredTool !== 'any') ||
          Boolean(block.behaviorRules?.minToolTier && block.behaviorRules.minToolTier !== 'any');
        const hasCustomLoot =
          Boolean(block.behaviorRules?.lootDrop && block.behaviorRules.lootDrop !== 'self') ||
          Boolean(block.behaviorRules?.xpDropAmount && block.behaviorRules.xpDropAmount > 0);
        const hasRedstone = Boolean(block.consumesRedstone);
        const hasParticles = Boolean(
          block.destructionParticles?.enabled || block.stepParticles?.enabled
        );
        const hasPlacement = Boolean(block.componentsList && block.componentsList.length > 0);

        setEnabledBehaviors({
          mining: hasCustomMining || true,
          loot: hasCustomLoot || true,
          redstone: hasRedstone,
          particles: hasParticles,
          placement: hasPlacement,
        });

        setPreferredTool(block.behaviorRules?.preferredTool || 'any');
        setMinToolTier(block.behaviorRules?.minToolTier || 'any');
        setLootDrop(block.behaviorRules?.lootDrop || 'self');
        setCustomDropItem(block.behaviorRules?.customDropItem || '');
        setCustomDropCount(block.behaviorRules?.customDropCount ?? 1);
        setXpDropAmount(block.behaviorRules?.xpDropAmount ?? 0);

        setConsumesRedstone(block.consumesRedstone || false);
        setAllowsSignalPropagation(
          block.redstoneConfig?.propagatesPower ??
            block.redstoneConfig?.allowsSignalPropagation ??
            true
        );

        setDestructionParticlesEnabled(block.destructionParticles?.enabled || false);
        setDestructionParticleTextureId(block.destructionParticles?.particleTextureId || '');
        setDestructionParticleCount(block.destructionParticles?.particleCount ?? 8);

        setStepParticlesEnabled(block.stepParticles?.enabled || false);
        setStepParticleTextureId(block.stepParticles?.particleTextureId || '');
        setStepParticleIntensity(block.stepParticles?.intensity ?? 5);

        setComponentsList(
          block.componentsList ? JSON.parse(JSON.stringify(block.componentsList)) : []
        );

        // Cajas de Colisión y Selección (v0.1.5)
        if (block.collisionConfig) {
          setCollisionConfig(JSON.parse(JSON.stringify(block.collisionConfig)));
          setSelectedCollisionBoxId(block.collisionConfig.boxes[0]?.id || 'col_1');
        } else {
          const defColBox: BlockBoxItem = {
            id: `col_${Date.now()}`,
            name: 'Caja Completa',
            origin: [-8, 0, -8],
            size: [16, 16, 16],
          };
          setCollisionConfig({
            template: 'default',
            enabled: true,
            boxes: [defColBox],
          });
          setSelectedCollisionBoxId(defColBox.id);
        }

        if (block.selectionConfig) {
          setSelectionConfig(JSON.parse(JSON.stringify(block.selectionConfig)));
          setSelectedSelectionBoxId(block.selectionConfig.boxes[0]?.id || 'sel_1');
        } else {
          const defSelBox: BlockBoxItem = {
            id: `sel_${Date.now()}`,
            name: 'Caja Completa',
            origin: [-8, 0, -8],
            size: [16, 16, 16],
          };
          setSelectionConfig({
            template: 'default',
            enabled: true,
            boxes: [defSelBox],
          });
          setSelectedSelectionBoxId(defSelBox.id);
        }
      } else {
        // v1.6: Sistema de nombres inteligentes y predecibles («Bloque 1», «Bloque 2»...)
        const nextSequential = getNextBlockNameAndIdentifier(existingBlocks);
        const defaultName = nextSequential.displayName;
        const defaultId = nextSequential.identifier;

        setIdentifier(defaultId);
        setDisplayName(defaultName);
        setSelectedGroupId('');
        setGroupSearchQuery('');
        setIsGroupDropdownOpen(false);
        setTranslations([
          { langCode: 'es_ES', name: defaultName },
          { langCode: 'en_US', name: `Block ${defaultId.replace('bloque_', '')}` },
        ]);
        setTextureMode('one');

        // v1.6: Al crear un bloque, NO asignar automáticamente una textura de la biblioteca
        setFaceTextures({
          up: '',
          down: '',
          north: '',
          south: '',
          east: '',
          west: '',
        });

        setDestroyTime(1.5);
        setExplosionResistance(6.0);
        setEmitsLight(false);
        setLightLevel(0);
        setLightDampening(15);
        setFriction(0.4);
        setFlammable(false);
        setFlameOdds(5);
        setBurnOdds(20);
        setMapColor('#7FB238');

        setIsMineral(false);
        setMineralCustomItem(false);
        setMineralDropItemId('minecraft:diamond');
        setMineralDropItemName('Fragmento mineral');
        setMineralDropTextureId('');
        setMineralMinCount(1);
        setMineralMaxCount(1);
        setMineralRequiredTool('none');

        setEnabledBehaviors({
          mining: true,
          loot: true,
          redstone: false,
          particles: false,
          placement: false,
        });

        setPreferredTool('any');
        setMinToolTier('any');
        setLootDrop('self');
        setCustomDropItem('');
        setCustomDropCount(1);
        setXpDropAmount(0);

        setConsumesRedstone(false);
        setAllowsSignalPropagation(true);

        setDestructionParticlesEnabled(false);
        setDestructionParticleTextureId('');
        setDestructionParticleCount(8);

        setStepParticlesEnabled(false);
        setStepParticleTextureId('');
        setStepParticleIntensity(5);

        setComponentsList([]);

        // Defaults para nuevo bloque (v0.1.5)
        const newColBox: BlockBoxItem = {
          id: `col_${Date.now()}`,
          name: 'Caja Completa',
          origin: [-8, 0, -8],
          size: [16, 16, 16],
        };
        setCollisionConfig({
          template: 'default',
          enabled: true,
          boxes: [newColBox],
        });
        setSelectedCollisionBoxId(newColBox.id);

        const newSelBox: BlockBoxItem = {
          id: `sel_${Date.now()}`,
          name: 'Caja Completa',
          origin: [-8, 0, -8],
          size: [16, 16, 16],
        };
        setSelectionConfig({
          template: 'default',
          enabled: true,
          boxes: [newSelBox],
        });
        setSelectedSelectionBoxId(newSelBox.id);
      }
      setValidationError('');
    }
  }, [isOpen, block]);

  // Recibir textura asignada desde la biblioteca de texturas
  useEffect(() => {
    if (assignedTexture && isOpen) {
      if (assignedTexture.face === 'item') {
        const matchingTexture = availableTextures.find((texture) => texture.dataUrl === assignedTexture.texDataUrl);
        setMineralDropTextureId(assignedTexture.textureId || matchingTexture?.id || assignedTexture.texDataUrl);
        return;
      }
      setFaceTextures((prev) => {
        const next = { ...prev, [assignedTexture.face]: assignedTexture.texDataUrl };
        if (textureMode === 'one') {
          next.up = assignedTexture.texDataUrl;
          next.down = assignedTexture.texDataUrl;
          next.north = assignedTexture.texDataUrl;
          next.south = assignedTexture.texDataUrl;
          next.east = assignedTexture.texDataUrl;
          next.west = assignedTexture.texDataUrl;
        } else if (
          textureMode === 'three' &&
          (assignedTexture.face === 'north' ||
            assignedTexture.face === 'south' ||
            assignedTexture.face === 'east' ||
            assignedTexture.face === 'west')
        ) {
          next.north = assignedTexture.texDataUrl;
          next.south = assignedTexture.texDataUrl;
          next.east = assignedTexture.texDataUrl;
          next.west = assignedTexture.texDataUrl;
        }
        return next;
      });
    }
  }, [assignedTexture, isOpen, textureMode]);

  if (!isOpen) return null;

  // Validación y guardado
  const handleSave = () => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedId) {
      setValidationError('El identificador del bloque es obligatorio.');
      setActiveTab('identity');
      return;
    }

    if (!isValidBedrockIdentifier(trimmedId)) {
      setValidationError('El identificador solo puede contener letras minúsculas, números y guiones bajos (_).');
      setActiveTab('identity');
      return;
    }

    const isDuplicate = existingBlocks.some(
      (b) => b.identifier === trimmedId && (!block || b.id !== block.id)
    );
    if (isDuplicate) {
      setValidationError(`Ya existe otro bloque con el identificador "${trimmedId}". Usa uno diferente.`);
      setActiveTab('identity');
      return;
    }

    if (!trimmedName) {
      setValidationError('El nombre visible del bloque no puede estar vacío.');
      setActiveTab('identity');
      return;
    }

    if (isMineral) {
      if (!Number.isInteger(mineralMinCount) || !Number.isInteger(mineralMaxCount) || mineralMinCount < 1 || mineralMaxCount < 1 || mineralMinCount > 64 || mineralMaxCount > 64) {
        setValidationError('Las cantidades del mineral deben ser números enteros entre 1 y 64.'); setActiveTab('properties'); return;
      }
      if (mineralMinCount > mineralMaxCount) { setValidationError('La cantidad mínima no puede ser mayor que la cantidad máxima.'); setActiveTab('properties'); return; }
      if (mineralCustomItem) {
        const customId = mineralDropItemId.trim().toLowerCase().replace(/^custom:/, '');
        if (!/^[a-z0-9_]+$/.test(customId)) { setValidationError('El identificador del objeto nuevo solo puede contener letras minúsculas, números y guiones bajos.'); setActiveTab('properties'); return; }
        if (!mineralDropItemName.trim()) { setValidationError('Escribe un nombre para el objeto personalizado.'); setActiveTab('properties'); return; }
        if (!mineralDropTextureId) { setValidationError('Selecciona o importa una textura para el objeto personalizado.'); setActiveTab('properties'); return; }
      } else if (!/^[a-z0-9_]+:[a-z0-9_]+$/.test(mineralDropItemId.trim())) { setValidationError('Selecciona un objeto existente válido.'); setActiveTab('properties'); return; }
    }

    const finalFaces: FaceTextures = { ...faceTextures };
    if (textureMode === 'one') {
      const single = faceTextures.up || faceTextures.north || '';
      finalFaces.up = single;
      finalFaces.down = single;
      finalFaces.north = single;
      finalFaces.south = single;
      finalFaces.east = single;
      finalFaces.west = single;
    } else if (textureMode === 'three') {
      const side = faceTextures.north || '';
      finalFaces.south = side;
      finalFaces.east = side;
      finalFaces.west = side;
    }

    const assignedGroup = availableGroups.find((g) => g.id === selectedGroupId);

    const saved: CustomBlock = {
      id: block?.id || `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      identifier: trimmedId,
      displayName: trimmedName,
      groupId: selectedGroupId || undefined,
      groupName: assignedGroup?.name,
      translations: translations.length > 0 ? translations : undefined,
      textureMode,
      faceTextures: finalFaces,
      textureDataUrl: finalFaces.up || finalFaces.north || '',

      // Propiedades Físicas y Visuales
      destroyTime: Math.max(0.1, destroyTime),
      explosionResistance: Math.max(0, explosionResistance),
      mapColor: /^#[0-9a-fA-F]{6}$/.test(mapColor) ? mapColor.toUpperCase() : '#7FB238',
      emitsLight,
      lightLevel: emitsLight ? Math.min(15, Math.max(0, lightLevel)) : 0,
      lightDampening: Math.min(15, Math.max(0, Math.round(lightDampening))),
      friction: Math.min(1.0, Math.max(0.1, friction)),
      flammable,
      flameOdds: flammable ? Math.max(1, flameOdds) : undefined,
      burnOdds: flammable ? Math.max(1, burnOdds) : undefined,

      // Reglas de Comportamiento
      mineral: {
        enabled: isMineral,
        dropItemId: mineralCustomItem ? 'custom:' + mineralDropItemId.trim().toLowerCase().replace(/^custom:/, '') : mineralDropItemId.trim(),
        dropItemName: mineralDropItemName.trim(), customItem: mineralCustomItem,
        dropTextureId: mineralDropTextureId || undefined,
        minDropCount: Math.min(64, Math.max(1, Math.round(mineralMinCount))),
        maxDropCount: Math.min(64, Math.max(1, Math.round(mineralMaxCount))), requiredTool: mineralRequiredTool,
      },

      behaviorRules: {
        preferredTool: enabledBehaviors.mining ? preferredTool : 'any',
        minToolTier: enabledBehaviors.mining && preferredTool !== 'any' ? minToolTier : undefined,
        lootDrop: enabledBehaviors.loot ? lootDrop : 'self',
        customDropItem: enabledBehaviors.loot && lootDrop === 'custom_item' ? customDropItem.trim() : undefined,
        customDropCount: enabledBehaviors.loot && lootDrop === 'custom_item' ? Math.max(1, customDropCount) : undefined,
        xpDropAmount: enabledBehaviors.loot ? Math.max(0, xpDropAmount) : 0,
      },

      consumesRedstone: enabledBehaviors.redstone ? consumesRedstone : false,
      redstoneConfig:
        enabledBehaviors.redstone && consumesRedstone
          ? {
              minPower: 1,
              propagatesPower: allowsSignalPropagation,
              minSignalStrength: 1,
              allowsSignalPropagation,
            }
          : undefined,

      destructionParticles:
        enabledBehaviors.particles && destructionParticlesEnabled
          ? {
              enabled: true,
              particleTextureId: destructionParticleTextureId || finalFaces.up,
              particleCount: Math.min(24, Math.max(1, destructionParticleCount)),
            }
          : undefined,

      stepParticles:
        enabledBehaviors.particles && stepParticlesEnabled
          ? {
              enabled: true,
              particleTextureId: stepParticleTextureId || finalFaces.up,
              intensity: Math.min(10, Math.max(1, stepParticleIntensity)),
            }
          : undefined,

      // Componentes Oficiales de Colocación
      componentsList:
        enabledBehaviors.placement && componentsList.length > 0 ? componentsList : undefined,

      // Cajas de Colisión y Selección (v0.1.5)
      collisionConfig,
      selectionConfig,

      createdAt: block?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveBlock(saved);
    onClose();
  };

  // Manejador de cambio de cara en Atlas Core
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
      } else if (
        textureMode === 'three' &&
        (face === 'north' || face === 'south' || face === 'east' || face === 'west')
      ) {
        next.north = val;
        next.south = val;
        next.east = val;
        next.west = val;
      }
      return next;
    });
  };

  const assignedGroupObj = availableGroups.find((g) => g.id === selectedGroupId);

  // Cantidad de comportamientos activos para badge
  const activeBehaviorsCount = Object.values(enabledBehaviors).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto">
        {/* Header Superior del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <i className="bx bxs-cube text-xl text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate">
                {block ? `Editar: ${displayName}` : 'Editor de Bloque Bedrock'}
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 truncate block">
                custom:{identifier || 'sin_id'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenTutorial}
              className="min-h-[40px] px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1"
              title="Abrir Tutorial Rápido"
            >
              <i className="bx bx-help-circle text-base" />
              <span className="hidden sm:inline">Tutorial</span>
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

        {/* ================================================================= */}
        {/* CINCO SECCIONES ORGANIZADAS (v0.1.5): IDENTIDAD, ATLAS, PROPIEDADES, CAJAS, COMPORTAMIENTO */}
        {/* ================================================================= */}
        <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 my-3 shrink-0">
          {/* SECCIÓN 1: IDENTIDAD */}
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`min-h-[44px] px-1 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'identity'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Identidad: Identificador, Nombre, Grupo y Traducciones"
          >
            <i className="bx bxs-id-card text-base" />
            <span className="truncate">Identidad</span>
          </button>

          {/* SECCIÓN 2: ATLAS CORE */}
          <button
            type="button"
            onClick={() => setActiveTab('atlas')}
            className={`min-h-[44px] px-1 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'atlas'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Atlas Core: Mapeo y Texturas 3D"
          >
            <i className="bx bxs-cube-alt text-base" />
            <span className="truncate">Atlas</span>
          </button>

          {/* SECCIÓN 3: PROPIEDADES */}
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`min-h-[44px] px-1 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'properties'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Propiedades: Dureza, Explosión, Luz, Fricción e Inflamabilidad"
          >
            <i className="bx bx-slider-alt text-base" />
            <span className="truncate">Propiedad</span>
          </button>

          {/* SECCIÓN 4: CAJAS (v0.1.5) */}
          <button
            type="button"
            onClick={() => setActiveTab('boxes')}
            className={`min-h-[44px] px-1 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all relative ${
              activeTab === 'boxes'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cajas 3D: Cajas de Colisión y Selección personalizadas"
          >
            <i className="bx bx-cube text-base" />
            <span className="truncate">Cajas</span>
            {(collisionConfig.boxes.length > 1 || selectionConfig.boxes.length > 1) && (
              <span
                className={`ml-0.5 text-[9px] px-1 rounded-full font-mono font-bold ${
                  activeTab === 'boxes'
                    ? 'bg-slate-950 text-emerald-400'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {Math.max(collisionConfig.boxes.length, selectionConfig.boxes.length)}
              </span>
            )}
          </button>

          {/* SECCIÓN 5: COMPORTAMIENTO */}
          <button
            type="button"
            onClick={() => setActiveTab('behavior')}
            className={`min-h-[44px] px-1 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all relative ${
              activeTab === 'behavior'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Comportamiento: Reglas de minado, botín, redstone y efectos"
          >
            <i className="bx bxs-cog text-base" />
            <span className="truncate">Comportam.</span>
            {activeBehaviorsCount > 0 && (
              <span
                className={`ml-0.5 text-[9px] px-1 rounded-full font-mono font-bold ${
                  activeTab === 'behavior'
                    ? 'bg-slate-950 text-emerald-400'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {activeBehaviorsCount}
              </span>
            )}
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: IDENTIDAD                                                  */}
        {/* ================================================================= */}
        {activeTab === 'identity' && (
          <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
            {/* 1. Identificador del Bloque */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Identificador Técnico Único (Namespace) *
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
                    placeholder="mineral_rubi"
                    className="w-full min-h-[46px] pr-3 bg-transparent text-sm font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identificador oficial para el comando Minecraft:{' '}
                  <code className="font-mono text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                    /give @s custom:{identifier || 'bloque'}
                  </code>
                </span>
              </div>

              {/* 2. Nombre Visible */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200">
                    Nombre Visible en el Juego *
                  </label>
                  {checkInappropriateText(displayName).hasInappropriate && (
                    <button
                      type="button"
                      onClick={() => setDisplayName(censorInappropriateText(displayName))}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                      title="Censurar palabras inapropiadas con asteriscos"
                    >
                      <i className="bx bx-shield-quarter text-xs" />
                      <span>Censurar (***)</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ej: Lámpara de Redstone, Ladrillo Pulido..."
                  className={`w-full min-h-[46px] px-3.5 bg-slate-900 border rounded-xl text-sm text-slate-100 focus:outline-none transition-colors ${
                    checkInappropriateText(displayName).hasInappropriate
                      ? 'border-amber-500/70 focus:border-amber-400'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {checkInappropriateText(displayName).hasInappropriate && (
                  <span className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <i className="bx bx-error text-xs" />
                    <span>Palabra no recomendada detectada. Puedes corregirla o tocar «Censurar».</span>
                  </span>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  El título que ve el jugador en el inventario creativo y al sostener el bloque en mano.
                </span>

                {/* Sugerencias inteligentes de nombres mientras escribe (v1.6) */}
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <i className="bx bx-bulb text-amber-400 text-xs" />
                      <span>Sugerencias para el nombre:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const genId = generateIdentifierFromName(displayName);
                        if (genId) {
                          setIdentifier(genId);
                          setValidationError('');
                        }
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
                      title="Generar identificador técnico a partir del nombre actual"
                    >
                      <i className="bx bx-sync text-xs" />
                      <span>Sincronizar ID técnico</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getBlockNameSuggestions(displayName).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDisplayName(sug);
                          setValidationError('');
                          // Actualizar también traducción al español si está disponible
                          setTranslations((prev) =>
                            prev.map((t) => (t.langCode === 'es_ES' ? { ...t, name: sug } : t))
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-emerald-300 transition-colors flex items-center gap-1 active:scale-95"
                      >
                        <i className="bx bx-plus text-xs text-emerald-400" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Grupo al que Pertenece */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-200">
                    Grupo del Addon (Pestaña Creativa)
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

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                    className="w-full min-h-[46px] px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-left flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {assignedGroupObj ? (
                        <>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: assignedGroupObj.color || '#10b981' }}
                          />
                          <span className="font-bold text-slate-100 truncate">
                            {assignedGroupObj.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                            {assignedGroupObj.category || 'construction'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">
                          Sin grupo asignado (Predeterminado del Addon)
                        </span>
                      )}
                    </div>
                    <i
                      className={`bx bx-chevron-down text-lg text-slate-400 transition-transform ${
                        isGroupDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isGroupDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d1322] border border-slate-800 rounded-2xl p-2 shadow-2xl z-30 flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                      <div className="p-1">
                        <input
                          type="text"
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          placeholder="Buscar grupo..."
                          className="w-full min-h-[36px] px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId('');
                          setIsGroupDropdownOpen(false);
                        }}
                        className={`min-h-[38px] px-2.5 rounded-xl text-xs text-left flex items-center gap-2 hover:bg-slate-900 transition-colors ${
                          !selectedGroupId ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <i className="bx bx-minus text-slate-500" />
                        <span>Sin grupo asignado</span>
                      </button>

                      {availableGroups
                        .filter((g) =>
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
                            className={`min-h-[38px] px-2.5 rounded-xl text-xs text-left flex items-center justify-between hover:bg-slate-900 transition-colors ${
                              selectedGroupId === grp.id
                                ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                                : 'text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: grp.color || '#10b981' }}
                              />
                              <span className="truncate">{grp.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {grp.category}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Configuración de Idioma y Traducciones (.lang) */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bx bx-world text-emerald-400 text-base" />
                  <span className="text-xs font-bold text-slate-200">
                    Configuración de Idioma y Traducciones (.lang)
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  {translations.length} {translations.length === 1 ? 'idioma' : 'idiomas'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Genera los archivos oficiales <code className="font-mono text-slate-300">texts/es_ES.lang</code>, etc., para que Minecraft muestre el nombre del bloque según el idioma del jugador.
              </p>

              {/* Lista de traducciones existentes */}
              <div className="flex flex-col gap-2 pt-1">
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

              {/* Añadir nuevo idioma */}
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
                  className="min-h-[40px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shrink-0"
                >
                  <i className="bx bx-plus text-sm" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ATLAS CORE (Texturas y Mapeo de Caras)                     */}
        {/* ================================================================= */}
        {activeTab === 'atlas' && (
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

        {/* ================================================================= */}
        {/* TAB 3: PROPIEDADES (Físicas, Iluminación, Fricción, Inflamabilidad)*/}
        {/* ================================================================= */}
        {activeTab === 'properties' && (
          <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
            {/* Color del bloque en mapas (v1.8 Beta Preview) */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-cyan-500/25 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="bx bx-map text-cyan-300 text-lg" />
                <div className="flex-1 min-w-0"><label htmlFor="block-map-color" className="text-xs font-bold text-slate-100">Color en el mapa</label><p className="text-[10px] text-slate-400">Cambia el color con el que se representa el bloque en mapas; no modifica su textura.</p></div>
                <span className="w-8 h-8 rounded-lg border border-white/20 shadow-inner shrink-0" style={{ backgroundColor: mapColor }} aria-label={`Vista previa ${mapColor}`} />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_52px] gap-2 items-center">
                <div className="flex flex-col gap-1"><label htmlFor="block-map-color" className="text-[10px] text-slate-400">Código hexadecimal</label><input id="block-map-color" type="text" value={mapColor} maxLength={7} onChange={(e) => { const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`; if (/^#[0-9a-fA-F]{0,6}$/.test(next)) setMapColor(next); }} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400" placeholder="#7FB238" /></div>
                <label className="relative block w-[52px] h-[42px] rounded-xl overflow-hidden border border-slate-700 cursor-pointer" title="Elegir color"><input aria-label="Elegir color del mapa" type="color" value={/^#[0-9a-fA-F]{6}$/.test(mapColor) ? mapColor : '#7FB238'} onChange={(e) => setMapColor(e.target.value.toUpperCase())} className="absolute inset-0 w-full h-full scale-150 cursor-pointer" /></label>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#101827] p-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg p-1 bg-[#202b3b] grid grid-cols-4 grid-rows-4 gap-0.5 shrink-0" aria-label="Vista previa de color en un mapa">
                  {Array.from({ length: 16 }, (_, i) => <span key={i} className="rounded-[2px]" style={{ backgroundColor: i % 5 === 0 ? '#b7b7b7' : i % 7 === 0 ? '#d8c68a' : mapColor, opacity: i % 4 === 0 ? 0.72 : 1 }} />)}
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-slate-200">Vista previa del mapa</p><p className="text-[10px] text-slate-400 mt-1">El tono elegido se muestra como una muestra ilustrativa. El resultado final depende de cómo Minecraft procese el color.</p><p className="text-[10px] font-mono text-cyan-300 mt-1">{mapColor.toUpperCase()}</p></div>
              </div>
            </div>

            {/* Propiedad mineral (v0.1.7) */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/25 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="bx bxs-diamond text-emerald-400 text-base" />
                <div className="flex-1 min-w-0"><label htmlFor="mineral-toggle" className="text-xs font-bold text-slate-100">Es un mineral</label><p className="text-[10px] text-slate-400">Configura el objeto que suelta al romperse.</p></div>
                <input id="mineral-toggle" type="checkbox" checked={isMineral} onChange={(e) => setIsMineral(e.target.checked)} className="h-5 w-5 accent-emerald-500 shrink-0" />
              </div>
              {isMineral && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setMineralCustomItem(false); if (mineralDropItemId.startsWith('custom:') || !mineralDropItemId.includes(':')) setMineralDropItemId('minecraft:diamond'); }} className={'flex-1 min-h-[40px] rounded-xl border text-xs font-semibold ' + (!mineralCustomItem ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-800')}>Objeto existente</button>
                    <button type="button" onClick={() => { setMineralCustomItem(true); if (!mineralDropItemId.startsWith('custom:')) setMineralDropItemId('fragmento_mineral'); if (!mineralDropItemName.trim()) setMineralDropItemName('Fragmento mineral'); }} className={'flex-1 min-h-[40px] rounded-xl border text-xs font-semibold ' + (mineralCustomItem ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-800')}>Crear objeto</button>
                  </div>
                  {!mineralCustomItem ? (
                    <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Objeto que suelta</label>
                      <select value={mineralDropItemId} onChange={(e) => setMineralDropItemId(e.target.value)} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500">
                        <option value="minecraft:diamond">Diamante</option><option value="minecraft:emerald">Esmeralda</option><option value="minecraft:coal">Carbón</option><option value="minecraft:raw_iron">Hierro en bruto</option><option value="minecraft:raw_copper">Cobre en bruto</option><option value="minecraft:raw_gold">Oro en bruto</option><option value="minecraft:redstone">Polvo de redstone</option><option value="minecraft:lapis_lazuli">Lapislázuli</option><option value="minecraft:quartz">Cuarzo del Nether</option><option value="minecraft:amethyst_shard">Fragmento de amatista</option><option value="minecraft:flint">Pedernal</option><option value="minecraft:iron_ingot">Lingote de hierro</option><option value="minecraft:gold_ingot">Lingote de oro</option>
                      </select>
                      <label className="text-[10px] text-slate-400 mt-1">También puedes escribir otro identificador existente:</label>
                      <input value={mineralDropItemId} onChange={(e) => setMineralDropItemId(e.target.value.trim().toLowerCase())} placeholder="minecraft:raw_iron" className="w-full min-h-[40px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Nombre del objeto nuevo</label><input value={mineralDropItemName} onChange={(e) => setMineralDropItemName(e.target.value)} maxLength={64} placeholder="Ej. Fragmento de zafiro" className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Identificador (sin custom:)</label><input value={mineralDropItemId.replace(/^custom:/, '')} onChange={(e) => setMineralDropItemId(e.target.value.toLowerCase())} maxLength={64} placeholder="fragmento_zafiro" className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500" /><span className="text-[10px] text-slate-500">ID exportado: custom:{mineralDropItemId.replace(/^custom:/, '') || 'objeto'}</span></div>
                    </>
                  )}
                  <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Textura del objeto</label>
                    <select value={mineralDropTextureId} onChange={(e) => setMineralDropTextureId(e.target.value)} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500">
                      <option value="">Elegir textura de la biblioteca…</option>{availableTextures.map((texture) => <option key={texture.id} value={texture.id}>{texture.name}</option>)}
                    </select>
                    <button type="button" onClick={onOpenTextureLibraryForItem} className="min-h-[40px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">Abrir biblioteca / importar textura</button>
                    {mineralCustomItem && <span className="text-[10px] text-slate-500">El objeto nuevo necesita una textura propia; no se copiará la textura del bloque.</span>}
                    {!mineralCustomItem && <span className="text-[10px] text-slate-500">En objetos vanilla se conserva el icono original; la textura elegida se usa al crear un objeto personalizado.</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Cantidad mínima</label><input type="number" min={1} max={64} step={1} value={mineralMinCount} onChange={(e) => setMineralMinCount(Number(e.target.value))} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100" /></div>
                    <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Cantidad máxima</label><input type="number" min={1} max={64} step={1} value={mineralMaxCount} onChange={(e) => setMineralMaxCount(Number(e.target.value))} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100" /></div>
                  </div>
                  {mineralMinCount > mineralMaxCount && <p className="text-[11px] text-rose-300">La cantidad mínima no puede superar la máxima.</p>}
                  <div className="flex flex-col gap-1"><label className="text-xs text-slate-300">Herramienta necesaria</label><select value={mineralRequiredTool} onChange={(e) => setMineralRequiredTool(e.target.value as MineralToolRequirement)} className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"><option value="none">No exigir herramienta</option><option value="any_pickaxe">Cualquier pico</option><option value="wood">Pico de madera o superior</option><option value="stone">Pico de piedra o superior</option><option value="iron">Pico de hierro o superior</option><option value="diamond">Pico de diamante o netherita</option><option value="netherite">Solo pico de netherita</option></select><span className="text-[10px] text-slate-500">Se aplica mediante condiciones match_tool de la tabla de botín.</span></div>
                </div>
              )}
            </div>

            {/* Panel 1: Dureza de Minado y Resistencia a Explosión */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="bx bxs-shield text-emerald-400 text-base" />
                <span className="text-xs font-bold text-slate-200">
                  Dureza de Minado y Resistencia a Explosión
                </span>
              </div>

              {/* Dureza / Tiempo de picado */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Tiempo de picado (destructible_by_mining):</span>
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
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.1s (Tierra/Vidrio)</span>
                  <span>1.5s (Piedra)</span>
                  <span>10.0s+ (Obsidiana)</span>
                </div>
              </div>

              {/* Resistencia a explosiones */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Resistencia a explosiones (destructible_by_explosion):</span>
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

            {/* Panel 2: Iluminación (Emisión y Atenuación de Luz) */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="bx bxs-sun text-amber-400 text-base" />
                <span className="text-xs font-bold text-slate-200">
                  Iluminación (Emisión y Atenuación)
                </span>
              </div>

              {/* Emisión de luz */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">¿Emite luz propia en la oscuridad?</span>
                  <span className="text-[10px] text-slate-400">
                    Genera el componente oficial minecraft:light_emission
                  </span>
                </div>
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
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Nivel de brillo (0 a 15):</span>
                    <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Nivel {lightLevel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={lightLevel}
                    onChange={(e) => setLightLevel(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 min-h-[36px]"
                  />
                </div>
              )}

              {/* Atenuación de luz */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-300 block">Atenuación de luz (light_dampening):</span>
                    <span className="text-[10px] text-slate-500">
                      15 = bloque completamente opaco; 0 = transparente como cristal
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                    {lightDampening}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={lightDampening}
                  onChange={(e) => setLightDampening(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 min-h-[36px]"
                />
              </div>
            </div>

            {/* Panel 3: Fricción Física e Inflamabilidad */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="bx bxs-flame text-orange-400 text-base" />
                <span className="text-xs font-bold text-slate-200">
                  Fricción Física e Inflamabilidad
                </span>
              </div>

              {/* Fricción */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-300 block">Fricción (minecraft:friction):</span>
                    <span className="text-[10px] text-slate-500">
                      0.4 = estándar; 0.98 = muy resbaladizo como hielo
                    </span>
                  </div>
                  <span className="font-mono font-bold text-blue-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                    {friction.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.02}
                  value={friction}
                  onChange={(e) => setFriction(parseFloat(e.target.value))}
                  className="w-full accent-blue-400 min-h-[36px]"
                />
              </div>

              {/* Inflamabilidad */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 block">¿Es inflamable? (minecraft:flammable)</span>
                    <span className="text-[10px] text-slate-500">
                      Permite que el bloque se prenda fuego con lava o fuego adyacente
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={flammable}
                      onChange={(e) => setFlammable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner" />
                  </label>
                </div>

                {flammable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="flex flex-col gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Probabilidad de fuego:</span>
                        <span className="font-mono font-bold text-orange-400">{flameOdds}%</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={flameOdds}
                        onChange={(e) => setFlameOdds(parseInt(e.target.value, 10))}
                        className="w-full accent-orange-400 min-h-[30px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Probabilidad de quemarse:</span>
                        <span className="font-mono font-bold text-rose-400">{burnOdds}%</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={burnOdds}
                        onChange={(e) => setBurnOdds(parseInt(e.target.value, 10))}
                        className="w-full accent-rose-400 min-h-[30px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECCIÓN 4 (v0.1.5): CAJAS DE COLISIÓN Y SELECCIÓN 3D               */}
        {/* ================================================================= */}
        {activeTab === 'boxes' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Visualizador 3D Interactivo de Bloque y Cajas */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                    <i className="bx bx-cube" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Visor 3D de Geometría</h4>
                    <p className="text-[10px] text-slate-400">Arrastra para orbitar en 3D. Toca las cajas para editarlas.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                    16×16×16 px
                  </span>
                </div>
              </div>

              {/* Contenedor del Visor 3D */}
              <Box3DVisualizer
                collisionBoxes={collisionConfig.boxes}
                selectionBoxes={selectionConfig.boxes}
                collisionEnabled={collisionConfig.enabled && collisionConfig.template !== 'none'}
                selectionEnabled={selectionConfig.enabled && selectionConfig.template !== 'none'}
                selectedBoxId={boxSubTab === 'collision' ? selectedCollisionBoxId : selectedSelectionBoxId}
                selectedBoxType={boxSubTab}
                onSelectBox={(id, type) => {
                  setBoxSubTab(type);
                  if (type === 'collision') {
                    setSelectedCollisionBoxId(id);
                  } else {
                    setSelectedSelectionBoxId(id);
                  }
                }}
                faceTextures={faceTextures}
                className="w-full"
              />
            </div>

            {/* Selector de Modo: Caja de Colisión vs Caja de Selección */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setBoxSubTab('collision')}
                className={`min-h-[46px] p-2.5 rounded-xl flex items-center justify-between transition-all ${
                  boxSubTab === 'collision'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 shadow-sm'
                    : 'bg-slate-900/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-left min-w-0">
                  <i className="bx bxs-shield text-base text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">Colisión</div>
                    <div className="text-[9px] font-mono text-emerald-400/80 truncate">minecraft:collision_box</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    collisionConfig.enabled && collisionConfig.template !== 'none'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {collisionConfig.enabled && collisionConfig.template !== 'none'
                    ? `${collisionConfig.boxes.length}`
                    : 'Off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBoxSubTab('selection')}
                className={`min-h-[46px] p-2.5 rounded-xl flex items-center justify-between transition-all ${
                  boxSubTab === 'selection'
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-left min-w-0">
                  <i className="bx bx-target-lock text-base text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">Selección</div>
                    <div className="text-[9px] font-mono text-cyan-400/80 truncate">minecraft:selection_box</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    selectionConfig.enabled && selectionConfig.template !== 'none'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectionConfig.enabled && selectionConfig.template !== 'none'
                    ? `${selectionConfig.boxes.length}`
                    : 'Off'}
                </span>
              </button>
            </div>

            {/* Editor de Geometría de Caja correspondiente */}
            {boxSubTab === 'collision' ? (
              <BoxGeometryEditor
                type="collision"
                config={collisionConfig}
                onChangeConfig={(c) => setCollisionConfig(c as BlockCollisionConfig)}
                selectedBoxId={selectedCollisionBoxId}
                onSelectBoxId={setSelectedCollisionBoxId}
              />
            ) : (
              <BoxGeometryEditor
                type="selection"
                config={selectionConfig}
                onChangeConfig={(c) => setSelectionConfig(c as BlockSelectionConfig)}
                selectedBoxId={selectedSelectionBoxId}
                onSelectBoxId={setSelectedSelectionBoxId}
              />
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: COMPORTAMIENTO (Sección Nueva, Clara y Organizada)          */}
        {/* ================================================================= */}
        {activeTab === 'behavior' && (
          <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
            {/* Cabecera de la sección con botón principal destacado */}
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-950/80 p-4 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <i className="bx bxs-cog text-xl text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-100">
                    Reglas de Comportamiento del Bloque
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Define la interacción al picar, recompensas de botín, señales de redstone o colocación.
                  </p>
                </div>
              </div>

              {/* BOTÓN PRINCIPAL REQUERIDO: «+ Agregar comportamiento» */}
              <button
                type="button"
                onClick={() => setIsAddBehaviorModalOpen(true)}
                className="w-full sm:w-auto min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
              >
                <i className="bx bx-plus text-base font-extrabold" />
                <span>+ Agregar comportamiento</span>
              </button>
            </div>

            {/* Lista organizada de comportamientos configurados */}
            <div className="flex flex-col gap-3">
              {/* COMPORTAMIENTO 1: REGLAS DE MINADO Y HERRAMIENTAS */}
              {enabledBehaviors.mining && (
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between bg-slate-900/60 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                        <i className="bx bx-pickaxe" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Reglas de Minado y Herramientas
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          minecraft:destructible_by_mining
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleBehaviorPanel('mining')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                      >
                        {openBehaviorPanels.mining ? 'Ocultar' : 'Configurar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Desactivar las reglas de minado específicas de este bloque?')) {
                            setEnabledBehaviors((prev) => ({ ...prev, mining: false }));
                            setPreferredTool('any');
                            setMinToolTier('any');
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Quitar comportamiento"
                      >
                        <i className="bx bx-trash text-sm" />
                      </button>
                    </div>
                  </div>

                  {openBehaviorPanels.mining && (
                    <div className="p-3.5 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Herramienta adecuada para romper el bloque:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { id: 'any', label: 'Cualquiera (Mano)' },
                            { id: 'pickaxe', label: 'Pico (Pickaxe)' },
                            { id: 'axe', label: 'Hacha (Axe)' },
                            { id: 'shovel', label: 'Pala (Shovel)' },
                            { id: 'hoe', label: 'Azada (Hoe)' },
                          ].map((tool) => (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => setPreferredTool(tool.id as PreferredToolType)}
                              className={`min-h-[40px] px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                preferredTool === tool.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {tool.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {preferredTool !== 'any' && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                          <label className="text-xs font-semibold text-slate-300">
                            Nivel mínimo de herramienta (Tier):
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'any', label: 'Cualquiera' },
                              { id: 'wood', label: 'Madera' },
                              { id: 'stone', label: 'Piedra' },
                              { id: 'iron', label: 'Hierro' },
                              { id: 'diamond', label: 'Diamante' },
                              { id: 'netherite', label: 'Netherite' },
                            ].map((tier) => (
                              <button
                                key={tier.id}
                                type="button"
                                onClick={() => setMinToolTier(tier.id as ToolTier)}
                                className={`min-h-[38px] px-2 rounded-xl text-xs font-semibold border transition-all ${
                                  minToolTier === tier.id
                                    ? 'bg-purple-500 text-white border-purple-400 font-bold shadow-sm'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                              >
                                {tier.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COMPORTAMIENTO 2: BOTÍN Y DROPS AL ROMPER */}
              {enabledBehaviors.loot && (
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between bg-slate-900/60 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">
                        <i className="bx bxs-gift" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Botín y Recompensas al Destruir
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">
                          minecraft:loot / loot_drops
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleBehaviorPanel('loot')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                      >
                        {openBehaviorPanels.loot ? 'Ocultar' : 'Configurar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Desactivar la configuración de botín personalizado?')) {
                            setEnabledBehaviors((prev) => ({ ...prev, loot: false }));
                            setLootDrop('self');
                            setXpDropAmount(0);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Quitar comportamiento"
                      >
                        <i className="bx bx-trash text-sm" />
                      </button>
                    </div>
                  </div>

                  {openBehaviorPanels.loot && (
                    <div className="p-3.5 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          ¿Qué ítem suelta al ser destruido?
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'self', label: 'El mismo bloque' },
                            { id: 'custom_item', label: 'Ítem personalizado' },
                            { id: 'nothing', label: 'Nada (Desaparece)' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setLootDrop(opt.id as LootDropType)}
                              className={`min-h-[40px] px-2 rounded-xl text-xs font-semibold border transition-all ${
                                lootDrop === opt.id
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {lootDrop === 'custom_item' && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Identificador del ítem entregado:
                            </label>
                            <input
                              type="text"
                              value={customDropItem}
                              onChange={(e) => setCustomDropItem(e.target.value)}
                              placeholder="Ej: minecraft:diamond o custom:mi_item"
                              className="w-full min-h-[42px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-400">Cantidad soltada:</span>
                            <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              x{customDropCount}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={16}
                            value={customDropCount}
                            onChange={(e) => setCustomDropCount(parseInt(e.target.value, 10))}
                            className="w-full accent-amber-500 min-h-[30px]"
                          />
                        </div>
                      )}

                      {/* XP Orbs */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Orbes de Experiencia (XP) al minar:</span>
                          <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {xpDropAmount} XP
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={15}
                          value={xpDropAmount}
                          onChange={(e) => setXpDropAmount(parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-500 min-h-[30px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* COMPORTAMIENTO 3: CONDUCCIÓN DE REDSTONE */}
              {enabledBehaviors.redstone && (
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between bg-slate-900/60 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm">
                        <i className="bx bxs-zap" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Conducción de Redstone
                        </span>
                        <span className="text-[10px] font-mono text-rose-400">
                          minecraft:redstone_conductivity
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleBehaviorPanel('redstone')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                      >
                        {openBehaviorPanels.redstone ? 'Ocultar' : 'Configurar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEnabledBehaviors((prev) => ({ ...prev, redstone: false }));
                          setConsumesRedstone(false);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Quitar comportamiento"
                      >
                        <i className="bx bx-trash text-sm" />
                      </button>
                    </div>
                  </div>

                  {openBehaviorPanels.redstone && (
                    <div className="p-3.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-300 block">¿Conduce señal de Redstone?</span>
                          <span className="text-[10px] text-slate-400">
                            Permite la transmisión de energía a través de este bloque
                          </span>
                        </div>
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
              )}

              {/* COMPORTAMIENTO 4: EFECTOS VISUALES DE PARTÍCULAS */}
              {enabledBehaviors.particles && (
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between bg-slate-900/60 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">
                        <i className="bx bxs-sparkles" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Partículas de Rotura y Pisado
                        </span>
                        <span className="text-[10px] font-mono text-purple-400">
                          studio:particles / Script API
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleBehaviorPanel('particles')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                      >
                        {openBehaviorPanels.particles ? 'Ocultar' : 'Configurar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEnabledBehaviors((prev) => ({ ...prev, particles: false }));
                          setDestructionParticlesEnabled(false);
                          setStepParticlesEnabled(false);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Quitar comportamiento"
                      >
                        <i className="bx bx-trash text-sm" />
                      </button>
                    </div>
                  </div>

                  {openBehaviorPanels.particles && (
                    <div className="p-3.5 flex flex-col gap-3">
                      {/* Destruction Particles */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-300 block">Partículas al romper el bloque</span>
                          <span className="text-[10px] text-slate-400">Efecto visual al minar o destruir</span>
                        </div>
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
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Cantidad de partículas emitidas:</span>
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
                            className="w-full accent-orange-400 min-h-[30px]"
                          />
                        </div>
                      )}

                      {/* Step Particles */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-xs text-slate-300 block">Partículas al caminar (Walking)</span>
                          <span className="text-[10px] text-slate-400">Detecta entidades mediante Script API</span>
                        </div>
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
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-xs">
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
                            className="w-full accent-purple-400 min-h-[30px]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COMPORTAMIENTO 5: COMPONENTES OFICIALES DE COLOCACIÓN BEDROCK */}
              {enabledBehaviors.placement && (
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between bg-slate-900/60 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">
                        <i className="bx bxs-extension" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Traits Oficiales de Colocación
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          traits:placement_direction / placement_filter
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleBehaviorPanel('placement')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                      >
                        {openBehaviorPanels.placement ? 'Ocultar' : 'Configurar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Desactivar los componentes de colocación configurados?')) {
                            setEnabledBehaviors((prev) => ({ ...prev, placement: false }));
                            setComponentsList([]);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Quitar comportamiento"
                      >
                        <i className="bx bx-trash text-sm" />
                      </button>
                    </div>
                  </div>

                  {openBehaviorPanels.placement && (
                    <div className="p-3.5">
                      <BlockComponentsManager
                        componentsList={componentsList}
                        onChangeComponents={setComponentsList}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Empty state si no hay ningún comportamiento habilitado */}
              {activeBehaviorsCount === 0 && (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center">
                  <i className="bx bxs-cog text-3xl text-slate-600 mb-2" />
                  <span className="text-xs font-bold text-slate-300">
                    Sin comportamientos asignados
                  </span>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
                    Este bloque utilizará la lógica predeterminada de Minecraft. Pulsa el botón para añadir minado, botín, redstone o colocación.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddBehaviorModalOpen(true)}
                    className="min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <i className="bx bx-plus font-bold" />
                    <span>+ Agregar comportamiento</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL / SELECTOR: «+ AGREGAR COMPORTAMIENTO»                       */}
        {/* ================================================================= */}
        {isAddBehaviorModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <i className="bx bx-plus text-xl font-bold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Incorporar Comportamiento
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Selecciona una regla o función para el bloque
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBehaviorModalOpen(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 my-3.5">
                {/* 1. Reglas de Minado */}
                <button
                  type="button"
                  onClick={() => {
                    setEnabledBehaviors((p) => ({ ...p, mining: true }));
                    setOpenBehaviorPanels((p) => ({ ...p, mining: true }));
                    setIsAddBehaviorModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    enabledBehaviors.mining
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/50 active:scale-98'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="bx bx-pickaxe text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Reglas de Minado y Herramientas
                      </span>
                      {enabledBehaviors.mining && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                          Añadido
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                      minecraft:destructible_by_mining
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Define qué herramienta (pico, pala, hacha) y qué nivel de material (hierro, diamante, etc.) se requiere para romperlo.
                    </p>
                  </div>
                </button>

                {/* 2. Botín y Drops */}
                <button
                  type="button"
                  onClick={() => {
                    setEnabledBehaviors((p) => ({ ...p, loot: true }));
                    setOpenBehaviorPanels((p) => ({ ...p, loot: true }));
                    setIsAddBehaviorModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    enabledBehaviors.loot
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-500/50 active:scale-98'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="bx bxs-gift text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Botín y Drops al Romperse
                      </span>
                      {enabledBehaviors.loot && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded">
                          Añadido
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 block mt-0.5">
                      minecraft:loot / drop_table
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Determina qué objeto entrega el bloque (el mismo, nada o un ítem específico) y orbes de experiencia XP.
                    </p>
                  </div>
                </button>

                {/* 3. Conducción de Redstone */}
                <button
                  type="button"
                  onClick={() => {
                    setEnabledBehaviors((p) => ({ ...p, redstone: true }));
                    setConsumesRedstone(true);
                    setOpenBehaviorPanels((p) => ({ ...p, redstone: true }));
                    setIsAddBehaviorModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    enabledBehaviors.redstone
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-rose-500/50 active:scale-98'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="bx bxs-zap text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Conectividad de Redstone
                      </span>
                      {enabledBehaviors.redstone && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.5 rounded">
                          Añadido
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 block mt-0.5">
                      minecraft:redstone_conductivity
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Configura el paso de corriente eléctrica y propagación de señales a través del bloque.
                    </p>
                  </div>
                </button>

                {/* 4. Efectos Visuales de Partículas */}
                <button
                  type="button"
                  onClick={() => {
                    setEnabledBehaviors((p) => ({ ...p, particles: true }));
                    setDestructionParticlesEnabled(true);
                    setOpenBehaviorPanels((p) => ({ ...p, particles: true }));
                    setIsAddBehaviorModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    enabledBehaviors.particles
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-purple-500/50 active:scale-98'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="bx bxs-sparkles text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Efectos de Partículas (Rotura / Pisado)
                      </span>
                      {enabledBehaviors.particles && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono px-1.5 py-0.5 rounded">
                          Añadido
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 block mt-0.5">
                      studio:particles / Script API
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Emite partículas personalizadas al romperse o al ser pisado por jugadores y entidades.
                    </p>
                  </div>
                </button>

                {/* 5. Traits Oficiales de Colocación Bedrock */}
                <button
                  type="button"
                  onClick={() => {
                    setEnabledBehaviors((p) => ({ ...p, placement: true }));
                    setOpenBehaviorPanels((p) => ({ ...p, placement: true }));
                    setIsAddBehaviorModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    enabledBehaviors.placement
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-cyan-500/50 active:scale-98'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="bx bxs-extension text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Componentes de Colocación Bedrock
                      </span>
                      {enabledBehaviors.placement && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-mono px-1.5 py-0.5 rounded">
                          Añadido
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                      minecraft:placement_direction / position / filter
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Controla la orientación automática según el jugador y restricciones de apoyo sobre bloques.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddBehaviorModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* FOOTER: BOTONES DE ACCIÓN (Cancelar / Guardar Bloque)             */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold active:scale-95 transition-all"
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

export type TextureMode = 'one' | 'three' | 'six';

export type BlockFaceKey = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';

export interface FaceTextures {
  up: string;
  down: string;
  north: string;
  south: string;
  east: string;
  west: string;
}

export interface BlockTranslation {
  langCode: string; // e.g. "es_ES", "en_US", "es_MX", "pt_BR", "fr_FR", "de_DE", "it_IT", "ru_RU", "ja_JP", "zh_CN"
  name: string;
}

export interface RedstoneConfig {
  minPower: number; // 1 to 15 (min_power / intensidad mínima)
  propagatesPower: boolean; // propagates_power (propagación de señal)
  minSignalStrength?: number; // legacy backwards compatibility
  allowsSignalPropagation?: boolean; // legacy backwards compatibility
}

export interface DestructionParticlesConfig {
  enabled: boolean;
  particleTextureId: string;
  particleCount: number; // 1 to 24
}

export interface StepParticlesConfig {
  enabled: boolean;
  particleTextureId: string;
  intensity: number; // 1 to 10
}

export type BedrockCreativeCategory = 'construction' | 'nature' | 'equipment' | 'items' | 'none';

export interface BlockGroup {
  id: string;
  name: string;
  description?: string;
  color?: string; // Color identifier for badges/dots
  category?: BedrockCreativeCategory; // Official Minecraft Bedrock category
  bedrockGroup?: string; // Optional Minecraft itemGroup identifier (e.g. "itemGroup.name.stone")
  createdAt: number;
}

export interface CustomBlock {
  id: string;
  identifier: string;
  displayName: string;
  groupId?: string; // ID of the assigned BlockGroup
  groupName?: string; // Cached name for quick lookup / fallback
  translations?: BlockTranslation[]; // Translated names for multiple languages (.lang)
  textureMode: TextureMode;
  faceTextures: FaceTextures;
  textureDataUrl?: string; // legacy backwards compatibility
  emitsLight: boolean;
  lightLevel: number; // 0 to 15
  consumesRedstone: boolean;
  redstoneConfig?: RedstoneConfig;
  destroyTime: number; // mining hardness
  explosionResistance: number;
  destructionParticles?: DestructionParticlesConfig;
  stepParticles?: StepParticlesConfig;
  createdAt: number;
  updatedAt?: number;
}

export interface CustomTexture {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export interface AddonProject {
  id: string;
  name: string;
  description: string;
  version: string; // e.g. "1.0.0"
  minEngineVersion: string; // e.g. "1.26.20"
  iconDataUrl: string; // Base64 pack_icon.png
  bpUuid: string;
  rpUuid: string;
  createdAt: number;
  updatedAt: number;
  usedCount: number; // For "Más usado" sort
  blocks: CustomBlock[];
  textures: CustomTexture[];
  groups?: BlockGroup[];
}

export type SortOption = 'letters' | 'dates' | 'most_used' | 'oldest' | 'size';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
  affectedTarget: string;
  reason: string;
  suggestion: string;
  canAutoFix?: boolean;
  autoFixType?: 'clean_id' | 'fill_missing_textures' | 'clamp_values' | 'remove_duplicate_id';
  blockId?: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'es_ES', label: 'Español (España)' },
  { code: 'es_MX', label: 'Español (México)' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'pt_BR', label: 'Português (Brasil)' },
  { code: 'pt_PT', label: 'Português (Portugal)' },
  { code: 'fr_FR', label: 'Français (France)' },
  { code: 'de_DE', label: 'Deutsch' },
  { code: 'it_IT', label: 'Italiano' },
  { code: 'ru_RU', label: 'Русский' },
  { code: 'ja_JP', label: '日本語' },
  { code: 'zh_CN', label: '中文 (简体)' },
] as const;

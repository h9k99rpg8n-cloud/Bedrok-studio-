// Bedrock Studio 3.0 Beta 4 - Dedicated Custom Item Types

export type ItemCategory = 'items' | 'equipment' | 'construction' | 'nature';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type ItemUseAnimation = 'none' | 'eat' | 'drink' | 'bow' | 'spear' | 'block' | 'camera';

export type ItemSaturationModifier = 'poor' | 'low' | 'normal' | 'good' | 'max' | 'supernatural';

export interface ItemFoodConfig {
  enabled: boolean;
  nutrition: number; // 1 to 20 half-drumsticks
  saturationModifier: ItemSaturationModifier;
  canAlwaysEat: boolean;
  usingConvertsTo?: string; // e.g. "minecraft:bowl"
  cooldownSeconds?: number;
}

export interface ItemDurabilityConfig {
  enabled: boolean;
  maxDurability: number; // e.g. 250, 1561
  damageChanceMin?: number;
  damageChanceMax?: number;
}

export interface ItemWeaponConfig {
  enabled: boolean;
  attackDamage: number; // e.g. 5, 8
}

export interface ItemDiggerConfig {
  enabled: boolean;
  speed: number;
}

export interface ItemFuelConfig {
  enabled: boolean;
  duration: number; // burn duration in seconds
}

export interface ItemCooldownConfig {
  enabled: boolean;
  category: string;
  duration: number; // in seconds
}

export interface ItemCustomComponentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  value?: string | number | boolean;
}

export interface CustomItem {
  id: string;
  identifier: string; // Full namespace:id; legacy projects may still contain only the suffix
  displayName: string;
  folderId?: string;
  textureId?: string;
  textureDataUrl?: string;
  category: ItemCategory;
  rarity: ItemRarity;
  maxStackSize: 1 | 16 | 64;
  handEquipped: boolean; // Render like a tool/sword in hand
  offHand: boolean; // Allowed in off-hand slot (shield hand)
  glint: boolean; // Enchantment shimmer effect
  useAnimation: ItemUseAnimation;
  food?: ItemFoodConfig;
  durability?: ItemDurabilityConfig;
  weapon?: ItemWeaponConfig;
  digger?: ItemDiggerConfig;
  fuel?: ItemFuelConfig;
  cooldown?: ItemCooldownConfig;
  hoverTextColor?: string;
  interactButton?: string;
  tags?: string[];
  bedrockGroup?: string;
  translations?: Array<{ langCode: string; name: string }>; // Localized item names (.lang)
  canDestroyInCreative?: boolean;
  customComponents?: ItemCustomComponentConfig[];
  createdAt: number;
  updatedAt?: number;
}

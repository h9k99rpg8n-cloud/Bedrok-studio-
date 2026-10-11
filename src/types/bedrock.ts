export type BlockSound =
  | 'stone'
  | 'wood'
  | 'metal'
  | 'glass'
  | 'grass'
  | 'slime'
  | 'sand'
  | 'wool'
  | 'netherite'
  | 'amethyst';

export type BlockRenderMethod = 'opaque' | 'blend' | 'alpha_test';

export interface BlockProperties {
  destroyTime: number; // seconds (0.1 to 50)
  explosionResistance: number; // 0 to 100
  friction: number; // 0.1 to 1.0 (default 0.4, ice 0.98)
  lightEmission: number; // 0 to 15
  lightDampening: number; // 0 to 15
  mapColor: string; // hex
  sound: BlockSound;
  renderMethod: BlockRenderMethod;
  flammable: boolean;
  burnOdds: number;
  flameOdds: number;
  lootDrop: 'self' | 'nothing' | 'custom_item';
  customDropItem: string;
}

export type TextureFace = 'all' | 'up' | 'down' | 'side';

export interface BlockTextures {
  mode: 'all' | 'top_bottom_sides';
  all: string[][]; // 16x16 array of hex colors
  top?: string[][];
  bottom?: string[][];
  side?: string[][];
}

export interface CustomBlock {
  id: string;
  identifier: string; // e.g. "rubi_ore" (without namespace)
  displayName: string; // e.g. "Mineral de Rubí"
  textures: BlockTextures;
  properties: BlockProperties;
  createdAt: number;
}

export interface AddonProject {
  id: string;
  name: string;
  namespace: string; // e.g. "custom"
  version: [number, number, number];
  description: string;
  author: string;
  bpUuid: string;
  rpUuid: string;
  blocks: CustomBlock[];
}

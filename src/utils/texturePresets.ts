export function createEmptyGrid(fillColor: string = '#78716C'): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: string[] = [];
    for (let c = 0; c < 16; c++) {
      row.push(fillColor);
    }
    grid.push(row);
  }
  return grid;
}

export function cloneGrid(grid: string[][]): string[][] {
  return grid.map((row) => [...row]);
}

// Generate Stone base with variations
export function generateStoneTexture(): string[][] {
  const shades = ['#78716C', '#6E6762', '#857E79', '#57534E', '#504C47'];
  const grid: string[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: string[] = [];
    for (let c = 0; c < 16; c++) {
      // Deterministic noise
      const n = (r * 17 + c * 31 + (r ^ c) * 7) % shades.length;
      row.push(shades[n]);
    }
    grid.push(row);
  }
  return grid;
}

// Ruby Ore Texture
export function generateRubyOreTexture(): string[][] {
  const base = generateStoneTexture();
  const rubyGems = [
    { r: 3, c: 4, col: '#EF4444' },
    { r: 3, c: 5, col: '#DC2626' },
    { r: 4, c: 4, col: '#F87171' },
    { r: 4, c: 5, col: '#B91C1C' },
    { r: 4, c: 6, col: '#991B1B' },
    { r: 5, c: 5, col: '#FCA5A5' },

    { r: 9, c: 10, col: '#DC2626' },
    { r: 9, c: 11, col: '#EF4444' },
    { r: 10, c: 10, col: '#F87171' },
    { r: 10, c: 11, col: '#B91C1C' },
    { r: 11, c: 11, col: '#991B1B' },
    { r: 10, c: 12, col: '#FCA5A5' },

    { r: 12, c: 3, col: '#EF4444' },
    { r: 12, c: 4, col: '#DC2626' },
    { r: 13, c: 4, col: '#F87171' },
    { r: 13, c: 5, col: '#B91C1C' },
  ];

  rubyGems.forEach(({ r, c, col }) => {
    if (base[r] && base[r][c]) {
      base[r][c] = col;
    }
  });

  return base;
}

// Neon Lamp Texture
export function generateNeonLampTexture(): string[][] {
  const grid = createEmptyGrid('#0F172A'); // Dark border
  const cyanCore = '#06B6D4';
  const cyanBright = '#67E8F9';
  const cyanHighlight = '#CFFAFE';
  const cyanDeep = '#0891B2';

  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const isBorder = r === 0 || r === 15 || c === 0 || c === 15;
      const isInnerBorder = r === 1 || r === 14 || c === 1 || c === 14;

      if (isBorder) {
        grid[r][c] = '#1E293B';
      } else if (isInnerBorder) {
        grid[r][c] = '#0E7490';
      } else {
        const distCenter = Math.hypot(r - 7.5, c - 7.5);
        if (distCenter < 2.5) {
          grid[r][c] = cyanHighlight;
        } else if (distCenter < 4.5) {
          grid[r][c] = cyanBright;
        } else if (distCenter < 6) {
          grid[r][c] = cyanCore;
        } else {
          grid[r][c] = cyanDeep;
        }
      }
    }
  }
  return grid;
}

// Slippery Ice Texture
export function generateIceTexture(): string[][] {
  const iceShades = ['#38BDF8', '#7DD3FC', '#BAE6FD', '#0284C7', '#0EA5E9'];
  const grid: string[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: string[] = [];
    for (let c = 0; c < 16; c++) {
      const v = (r * 7 + c * 13 + ((r * c) % 5)) % iceShades.length;
      row.push(iceShades[v]);
    }
    grid.push(row);
  }
  // Add crystalline diagonal lines
  for (let i = 2; i < 14; i++) {
    grid[i][i] = '#E0F2FE';
    if (i < 13) grid[i + 1][i] = '#7DD3FC';
  }
  return grid;
}

// Wood Planks Texture
export function generateWoodTexture(): string[][] {
  const darkWood = '#78350F';
  const midWood = '#92400E';
  const lightWood = '#B45309';
  const groove = '#451A03';

  const grid: string[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: string[] = [];
    const isGroove = r % 4 === 3;
    for (let c = 0; c < 16; c++) {
      if (isGroove) {
        row.push(groove);
      } else {
        const rand = (r * 11 + c * 23) % 3;
        row.push(rand === 0 ? darkWood : rand === 1 ? midWood : lightWood);
      }
    }
    grid.push(row);
  }
  return grid;
}

// Glowing Obsidian Texture
export function generateGlowingObsidianTexture(): string[][] {
  const shades = ['#0F081D', '#160C2B', '#1D1038', '#0A0514'];
  const grid: string[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: string[] = [];
    for (let c = 0; c < 16; c++) {
      const idx = (r * 19 + c * 29) % shades.length;
      row.push(shades[idx]);
    }
    grid.push(row);
  }
  // Purple cracks
  const cracks = [
    { r: 2, c: 7, col: '#C084FC' },
    { r: 3, c: 7, col: '#A855F7' },
    { r: 4, c: 8, col: '#9333EA' },
    { r: 5, c: 9, col: '#A855F7' },
    { r: 6, c: 9, col: '#C084FC' },
    { r: 7, c: 10, col: '#E9D5FF' },
    { r: 10, c: 3, col: '#9333EA' },
    { r: 11, c: 4, col: '#A855F7' },
    { r: 12, c: 4, col: '#C084FC' },
    { r: 13, c: 5, col: '#A855F7' },
  ];
  cracks.forEach(({ r, c, col }) => {
    if (grid[r] && grid[r][c]) grid[r][c] = col;
  });
  return grid;
}

export interface PresetPalette {
  name: string;
  colors: string[];
}

export const PALETTE_PRESETS: PresetPalette[] = [
  {
    name: '💎 Minerales',
    colors: [
      '#EF4444', '#DC2626', '#991B1B', // Ruby
      '#10B981', '#059669', '#047857', // Emerald
      '#3B82F6', '#2563EB', '#1D4ED8', // Sapphire
      '#A855F7', '#9333EA', '#7E22CE', // Amethyst
      '#F59E0B', '#D97706', '#B45309', // Gold
      '#F97316', '#EA580C', '#C2410C', // Copper
      '#06B6D4', '#0891B2', '#0E7490', // Diamond
    ],
  },
  {
    name: '🪨 Terreno',
    colors: [
      '#78716C', '#57534E', '#44403C', '#292524', // Stone & Slate
      '#A8A29E', '#D6D3D1', '#E7E5E4', '#F5F5F4', // Light stone & marble
      '#713F12', '#854D0E', '#A16207', '#CA8A04', // Dirt & mud
      '#FEF08A', '#FDE047', '#EAB308', '#D97706', // Sand & desert
    ],
  },
  {
    name: '🌲 Vegetación',
    colors: [
      '#15803D', '#16A34A', '#22C55E', '#4ADE80', // Oak Leaves
      '#052E16', '#14532D', '#166534', '#1B4332', // Pine/Spruce dark leaves
      '#F472B6', '#EC4899', '#DB2777', '#BE185D', // Cherry blossom
      '#78350F', '#92400E', '#B45309', '#D97706', // Oak wood
    ],
  },
  {
    name: '🔮 Neón & Magia',
    colors: [
      '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', // Cyan neon
      '#C084FC', '#A855F7', '#9333EA', '#7E22CE', // Ender glow
      '#FB923C', '#F97316', '#EA580C', '#C2410C', // Magma & Fire
      '#38BDF8', '#0284C7', '#0369A1', '#075985', // Soul Fire
    ],
  },
  {
    name: '⬛ Monocromo',
    colors: [
      '#000000', '#18181B', '#27272A', '#3F3F46',
      '#52525B', '#71717A', '#A1A1AA', '#D4D4D8',
      '#E4E4E7', '#F4F4F5', '#FFFFFF',
    ],
  },
];

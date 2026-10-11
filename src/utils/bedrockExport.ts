import JSZip from 'jszip';
import { AddonProject, CustomBlock } from '../types/bedrock';

/**
 * Creates Behavior Pack manifest.json
 */
export function generateBehaviorPackManifest(project: AddonProject) {
  return {
    format_version: 2,
    header: {
      name: `${project.name} (Comportamientos)`,
      description: project.description || 'Creado con Bedrock Studio Mobile IDE',
      uuid: project.bpUuid,
      version: project.version,
      min_engine_version: [1, 20, 80],
    },
    modules: [
      {
        type: 'data',
        uuid: crypto?.randomUUID ? crypto.randomUUID() : 'b8529cb6-17b5-4cb2-8e0c-974251cb14b3',
        version: project.version,
      },
    ],
    dependencies: [
      {
        uuid: project.rpUuid,
        version: project.version,
      },
    ],
  };
}

/**
 * Creates Resource Pack manifest.json
 */
export function generateResourcePackManifest(project: AddonProject) {
  return {
    format_version: 2,
    header: {
      name: `${project.name} (Recursos)`,
      description: project.description || 'Creado con Bedrock Studio Mobile IDE',
      uuid: project.rpUuid,
      version: project.version,
      min_engine_version: [1, 20, 80],
    },
    modules: [
      {
        type: 'resources',
        uuid: crypto?.randomUUID ? crypto.randomUUID() : 'c9120de8-48b2-4ea1-a06f-124b11cd23a1',
        version: project.version,
      },
    ],
  };
}

/**
 * Generates the Behavior Pack block JSON for a single block
 */
export function generateBlockBehaviorJson(project: AddonProject, block: CustomBlock) {
  const fullId = `${project.namespace}:${block.identifier}`;
  const p = block.properties;

  const components: Record<string, unknown> = {
    'minecraft:destructible_by_mining': {
      seconds_to_destroy: p.destroyTime,
    },
    'minecraft:destructible_by_explosion': {
      explosion_resistance: p.explosionResistance,
    },
    'minecraft:friction': p.friction,
    'minecraft:light_emission': p.lightEmission,
    'minecraft:light_dampening': p.lightDampening,
    'minecraft:map_color': p.mapColor,
  };

  if (p.flammable) {
    components['minecraft:flammable'] = {
      catch_chance_modifier: p.flameOdds,
      destroy_chance_modifier: p.burnOdds,
    };
  }

  return {
    format_version: '1.20.80',
    'minecraft:block': {
      description: {
        identifier: fullId,
        menu_category: {
          category: 'nature',
          is_hidden_in_commands: false,
        },
      },
      components,
    },
  };
}

/**
 * Generates Resource Pack blocks.json mapping
 */
export function generateBlocksResourceJson(project: AddonProject) {
  const blocksMap: Record<string, unknown> = {};

  for (const block of project.blocks) {
    const fullId = `${project.namespace}:${block.identifier}`;
    const isMultiFace = block.textures.mode === 'top_bottom_sides';

    blocksMap[fullId] = {
      sound: block.properties.sound,
      textures: isMultiFace
        ? {
            up: `${block.identifier}_top`,
            down: `${block.identifier}_bottom`,
            side: `${block.identifier}_side`,
          }
        : block.identifier,
    };
  }

  return {
    format_version: [1, 1, 0],
    ...blocksMap,
  };
}

/**
 * Generates Resource Pack textures/terrain_texture.json
 */
export function generateTerrainTextureJson(project: AddonProject) {
  const textureData: Record<string, { textures: string }> = {};

  for (const block of project.blocks) {
    if (block.textures.mode === 'top_bottom_sides') {
      textureData[`${block.identifier}_top`] = {
        textures: `textures/blocks/${block.identifier}_top`,
      };
      textureData[`${block.identifier}_bottom`] = {
        textures: `textures/blocks/${block.identifier}_bottom`,
      };
      textureData[`${block.identifier}_side`] = {
        textures: `textures/blocks/${block.identifier}_side`,
      };
    } else {
      textureData[block.identifier] = {
        textures: `textures/blocks/${block.identifier}`,
      };
    }
  }

  return {
    resource_pack_name: project.name,
    texture_name: 'atlas.terrain',
    padding: 8,
    num_mip_levels: 4,
    texture_data: textureData,
  };
}

/**
 * Generates en_US.lang language file
 */
export function generateLangFile(project: AddonProject) {
  const lines: string[] = [
    `## Bedrock Studio Add-on Texts`,
    `pack.name=${project.name}`,
    `pack.description=${project.description}`,
    ``,
    `## Block Names`,
  ];

  for (const block of project.blocks) {
    lines.push(`tile.${project.namespace}:${block.identifier}.name=${block.displayName}`);
  }

  return lines.join('\n');
}

/**
 * Converts a 16x16 hex grid to a PNG Blob via HTML5 Canvas
 */
export function gridToCanvasBlob(grid: string[][], size = 16): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const scale = size / 16;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        ctx.fillStyle = grid[r][c] || '#000000';
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create Blob from canvas'));
      }
    }, 'image/png');
  });
}

/**
 * Creates default pack icon
 */
export function generatePackIconBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 128);

  // Border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 116, 116);

  // Isometric mini cube in the center
  ctx.fillStyle = '#10b981';
  // Top face
  ctx.beginPath();
  ctx.moveTo(64, 30);
  ctx.lineTo(94, 46);
  ctx.lineTo(64, 62);
  ctx.lineTo(34, 46);
  ctx.closePath();
  ctx.fill();

  // Left face
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(34, 46);
  ctx.lineTo(64, 62);
  ctx.lineTo(64, 98);
  ctx.lineTo(34, 82);
  ctx.closePath();
  ctx.fill();

  // Right face
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.moveTo(64, 62);
  ctx.lineTo(94, 46);
  ctx.lineTo(94, 82);
  ctx.lineTo(64, 98);
  ctx.closePath();
  ctx.fill();

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

/**
 * Builds the complete .mcaddon ZIP archive and triggers browser download
 */
export async function exportAddonArchive(
  project: AddonProject,
  format: 'mcaddon' | 'zip' = 'mcaddon'
): Promise<{ fileName: string; size: number }> {
  const zip = new JSZip();

  const bpFolder = zip.folder(`${project.name}_BP`);
  const rpFolder = zip.folder(`${project.name}_RP`);

  if (!bpFolder || !rpFolder) {
    throw new Error('Failed to create folders inside ZIP');
  }

  const iconBlob = await generatePackIconBlob();

  // --- BEHAVIOR PACK ---
  bpFolder.file('manifest.json', JSON.stringify(generateBehaviorPackManifest(project), null, 2));
  bpFolder.file('pack_icon.png', iconBlob);

  const bpBlocksFolder = bpFolder.folder('blocks');
  for (const block of project.blocks) {
    bpBlocksFolder?.file(
      `${block.identifier}.json`,
      JSON.stringify(generateBlockBehaviorJson(project, block), null, 2)
    );
  }

  // --- RESOURCE PACK ---
  rpFolder.file('manifest.json', JSON.stringify(generateResourcePackManifest(project), null, 2));
  rpFolder.file('pack_icon.png', iconBlob);
  rpFolder.file('blocks.json', JSON.stringify(generateBlocksResourceJson(project), null, 2));

  const textsFolder = rpFolder.folder('texts');
  textsFolder?.file('en_US.lang', generateLangFile(project));
  textsFolder?.file('es_ES.lang', generateLangFile(project));

  const texturesFolder = rpFolder.folder('textures');
  texturesFolder?.file('terrain_texture.json', JSON.stringify(generateTerrainTextureJson(project), null, 2));

  const blockTexturesFolder = texturesFolder?.folder('blocks');
  for (const block of project.blocks) {
    if (block.textures.mode === 'top_bottom_sides') {
      const topBlob = await gridToCanvasBlob(block.textures.top || block.textures.all);
      const bottomBlob = await gridToCanvasBlob(block.textures.bottom || block.textures.all);
      const sideBlob = await gridToCanvasBlob(block.textures.side || block.textures.all);
      blockTexturesFolder?.file(`${block.identifier}_top.png`, topBlob);
      blockTexturesFolder?.file(`${block.identifier}_bottom.png`, bottomBlob);
      blockTexturesFolder?.file(`${block.identifier}_side.png`, sideBlob);
    } else {
      const allBlob = await gridToCanvasBlob(block.textures.all);
      blockTexturesFolder?.file(`${block.identifier}.png`, allBlob);
    }
  }

  // Generate file
  const blob = await zip.generateAsync({ type: 'blob' });
  const sanitizedName = (project.name || 'CustomAddon').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitizedName}.${format}`;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return { fileName, size: blob.size };
}

import JSZip from 'jszip';
import { AddonProject, CustomBlock } from '../types/addon';
import { generateBedrockUUID } from './uuid';

/**
 * Converts a data URL / base64 string to a Blob safely without throwing
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
  }

  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(parts[1] || '');
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    }
  }
}

/**
 * Creates a default pixelated Minecraft pickaxe pack icon if none uploaded
 */
export function createDefaultPackIconBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 116, 116);

  // Pickaxe silhouette
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(35, 30);
  ctx.lineTo(95, 30);
  ctx.lineTo(85, 45);
  ctx.lineTo(65, 45);
  ctx.lineTo(65, 95);
  ctx.lineTo(55, 95);
  ctx.lineTo(55, 45);
  ctx.lineTo(45, 45);
  ctx.closePath();
  ctx.fill();

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

/**
 * Finds texture DataUrl either from block's face or from project textures
 */
function resolveTextureDataUrl(project: AddonProject, texKeyOrDataUrl: string): string {
  if (!texKeyOrDataUrl) return '';
  if (texKeyOrDataUrl.startsWith('data:image')) return texKeyOrDataUrl;
  const found = project.textures.find((t) => t.id === texKeyOrDataUrl || t.name === texKeyOrDataUrl);
  return found?.dataUrl || '';
}

/**
 * Packages the AddonProject into a standard Minecraft Bedrock .mcaddon archive
 * compatible with 1.26.20 - 1.26.52.
 */
export async function exportAddonToMcaddon(project: AddonProject): Promise<{ fileName: string; size: number }> {
  const zip = new JSZip();

  const bpFolder = zip.folder(`${project.name}_BP`);
  const rpFolder = zip.folder(`${project.name}_RP`);

  if (!bpFolder || !rpFolder) {
    throw new Error('No se pudieron inicializar las carpetas BP/RP');
  }

  // Pack icon
  let packIconBlob: Blob;
  if (project.iconDataUrl) {
    packIconBlob = await dataUrlToBlob(project.iconDataUrl);
  } else {
    packIconBlob = await createDefaultPackIconBlob();
  }

  // Parse version
  const verParts = (project.version || '1.0.0').split('.').map((p) => parseInt(p, 10) || 0);
  const versionArray = [verParts[0] || 1, verParts[1] || 0, verParts[2] || 0];

  // Parse min_engine_version (supports 1.26.20 / 1.26.52)
  const engineParts = (project.minEngineVersion || '1.26.20').split('.').map((p) => parseInt(p, 10) || 0);
  const minEngineVersion = [engineParts[0] || 1, engineParts[1] || 26, engineParts[2] || 20];

  // Check if any block has Step Particles enabled (requires Script API module)
  const requiresScriptApi = project.blocks.some((b) => b.stepParticles?.enabled);

  // 1. Behavior Pack Manifest
  const bpModules: Record<string, unknown>[] = [
    {
      type: 'data',
      uuid: generateBedrockUUID(),
      version: versionArray,
    },
  ];

  const bpDependencies: Record<string, unknown>[] = [
    {
      uuid: project.rpUuid,
      version: versionArray,
    },
  ];

  if (requiresScriptApi) {
    bpModules.push({
      type: 'script',
      uuid: generateBedrockUUID(),
      version: versionArray,
      entry: 'scripts/main.js',
    });
    bpDependencies.push({
      module_name: '@minecraft/server',
      version: '1.14.0',
    });
  }

  const bpManifest = {
    format_version: 2,
    header: {
      name: `${project.name} (Comportamientos)`,
      description: project.description || 'Creado con Bedrock Studio v0.1.3',
      uuid: project.bpUuid,
      version: versionArray,
      min_engine_version: minEngineVersion,
    },
    modules: bpModules,
    dependencies: bpDependencies,
  };

  // 2. Resource Pack Manifest
  const rpManifest = {
    format_version: 2,
    header: {
      name: `${project.name} (Recursos)`,
      description: project.description || 'Creado con Bedrock Studio v0.1.3',
      uuid: project.rpUuid,
      version: versionArray,
      min_engine_version: minEngineVersion,
    },
    modules: [
      {
        type: 'resources',
        uuid: generateBedrockUUID(),
        version: versionArray,
      },
    ],
  };

  bpFolder.file('manifest.json', JSON.stringify(bpManifest, null, 2));
  bpFolder.file('pack_icon.png', packIconBlob);
  rpFolder.file('manifest.json', JSON.stringify(rpManifest, null, 2));
  rpFolder.file('pack_icon.png', packIconBlob);

  // 3. Blocks in Behavior Pack and Resource Pack
  const bpBlocksFolder = bpFolder.folder('blocks');
  const rpTexturesFolder = rpFolder.folder('textures');
  const rpBlocksTexturesFolder = rpTexturesFolder?.folder('blocks');
  const rpParticleTexturesFolder = rpTexturesFolder?.folder('particle');

  const blocksResourceMap: Record<string, unknown> = {};
  const terrainTextureData: Record<string, { textures: string }> = {};

  // Multilingual lang dictionaries map: langCode -> array of lines
  const languageCodes = new Set<string>(['en_US', 'es_ES']);
  project.blocks.forEach((b) => {
    b.translations?.forEach((t) => {
      if (t.langCode) languageCodes.add(t.langCode);
    });
  });

  const langFilesMap: Record<string, string[]> = {};
  languageCodes.forEach((code) => {
    langFilesMap[code] = [
      `## Bedrock Studio v0.1.3 Language File [${code}]`,
      `pack.name=${project.name}`,
      `pack.description=${project.description}`,
      ``,
    ];
  });

  for (const block of project.blocks) {
    const fullId = `custom:${block.identifier}`;
    const mode = block.textureMode || 'one';
    const faces = block.faceTextures || {
      up: block.textureDataUrl || '',
      down: block.textureDataUrl || '',
      north: block.textureDataUrl || '',
      south: block.textureDataUrl || '',
      east: block.textureDataUrl || '',
      west: block.textureDataUrl || '',
    };

    // Construct components dictionary cleanly
    const components: Record<string, unknown> = {
      'minecraft:destructible_by_mining': {
        seconds_to_destroy: block.destroyTime ?? 1.5,
      },
      'minecraft:destructible_by_explosion': {
        explosion_resistance: block.explosionResistance ?? 6.0,
      },
    };

    // Friction (v0.1.4)
    if (block.friction !== undefined && block.friction !== 0.4) {
      components['minecraft:friction'] = Math.min(1.0, Math.max(0.1, Number(block.friction)));
    }

    // Light Dampening (v0.1.4)
    if (block.lightDampening !== undefined) {
      components['minecraft:light_dampening'] = Math.min(15, Math.max(0, Math.round(block.lightDampening)));
    }

    // Flammability (v0.1.4)
    if (block.flammable) {
      components['minecraft:flammable'] = {
        burn_odds: block.burnOdds ?? 20,
        flame_odds: block.flameOdds ?? 5,
      };
    }

    // Light emission
    if (block.emitsLight && block.lightLevel > 0) {
      components['minecraft:light_emission'] = Math.min(15, Math.max(0, block.lightLevel));
    }

    // Redstone Consumer
    if (block.consumesRedstone) {
      const allowsWire = block.redstoneConfig?.propagatesPower ?? block.redstoneConfig?.allowsSignalPropagation ?? true;
      components['minecraft:redstone_conductivity'] = {
        redstone_conductor: true,
        allows_wire_to_step_down: allowsWire,
      };
    }

    // Placement Filter Component (minecraft:placement_filter)
    if (block.componentsList) {
      const placementFilterComp = block.componentsList.find(
        (c) => c.id === 'minecraft:placement_filter' && c.enabled
      );
      if (placementFilterComp && 'conditions' in placementFilterComp.config) {
        const conditions = placementFilterComp.config.conditions;
        if (conditions && conditions.length > 0) {
          components['minecraft:placement_filter'] = {
            conditions: conditions.map((cond) => ({
              allowed_faces: cond.allowedFaces && cond.allowedFaces.length > 0 ? cond.allowedFaces : ['up'],
              block_filter: cond.blockFilter && cond.blockFilter.length > 0 ? cond.blockFilter : ['minecraft:dirt'],
            })),
          };
        }
      }
    }

    // Custom Components (Step particles walking detector via Script API)
    if (block.stepParticles?.enabled) {
      components['minecraft:custom_components'] = ['studio:step_particles'];
    }

    // Collision Box Component (minecraft:collision_box) - v0.1.5
    if (block.collisionConfig) {
      if (!block.collisionConfig.enabled || block.collisionConfig.template === 'none') {
        components['minecraft:collision_box'] = false;
      } else if (block.collisionConfig.template === 'default') {
        components['minecraft:collision_box'] = true;
      } else {
        const validBoxes = block.collisionConfig.boxes.filter(
          (b) =>
            Number.isFinite(b.origin[0]) &&
            Number.isFinite(b.origin[1]) &&
            Number.isFinite(b.origin[2]) &&
            Number.isFinite(b.size[0]) &&
            Number.isFinite(b.size[1]) &&
            Number.isFinite(b.size[2]) &&
            b.size[0] > 0 &&
            b.size[1] > 0 &&
            b.size[2] > 0
        );

        if (validBoxes.length === 0) {
          components['minecraft:collision_box'] = true;
        } else if (validBoxes.length === 1) {
          components['minecraft:collision_box'] = {
            origin: [validBoxes[0].origin[0], validBoxes[0].origin[1], validBoxes[0].origin[2]],
            size: [validBoxes[0].size[0], validBoxes[0].size[1], validBoxes[0].size[2]],
          };
        } else {
          // Multiple collision boxes supported in Minecraft Bedrock format_version 1.21.50
          components['minecraft:collision_box'] = validBoxes.map((b) => ({
            origin: [b.origin[0], b.origin[1], b.origin[2]],
            size: [b.size[0], b.size[1], b.size[2]],
          }));
        }
      }
    }

    // Selection Box Component (minecraft:selection_box) - v0.1.5
    if (block.selectionConfig) {
      if (!block.selectionConfig.enabled || block.selectionConfig.template === 'none') {
        components['minecraft:selection_box'] = false;
      } else if (block.selectionConfig.template === 'default') {
        components['minecraft:selection_box'] = true;
      } else {
        const validBoxes = block.selectionConfig.boxes.filter(
          (b) =>
            Number.isFinite(b.origin[0]) &&
            Number.isFinite(b.origin[1]) &&
            Number.isFinite(b.origin[2]) &&
            Number.isFinite(b.size[0]) &&
            Number.isFinite(b.size[1]) &&
            Number.isFinite(b.size[2]) &&
            b.size[0] > 0 &&
            b.size[1] > 0 &&
            b.size[2] > 0
        );

        if (validBoxes.length === 0) {
          components['minecraft:selection_box'] = true;
        } else if (validBoxes.length === 1) {
          components['minecraft:selection_box'] = {
            origin: [validBoxes[0].origin[0], validBoxes[0].origin[1], validBoxes[0].origin[2]],
            size: [validBoxes[0].size[0], validBoxes[0].size[1], validBoxes[0].size[2]],
          };
        } else {
          // Bedrock standard only allows a single selection box object.
          // Compute composite bounding box enclosing all defined selection boxes:
          let minX = Infinity;
          let minY = Infinity;
          let minZ = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          let maxZ = -Infinity;

          for (const b of validBoxes) {
            minX = Math.min(minX, b.origin[0]);
            minY = Math.min(minY, b.origin[1]);
            minZ = Math.min(minZ, b.origin[2]);
            maxX = Math.max(maxX, b.origin[0] + b.size[0]);
            maxY = Math.max(maxY, b.origin[1] + b.size[1]);
            maxZ = Math.max(maxZ, b.origin[2] + b.size[2]);
          }

          components['minecraft:selection_box'] = {
            origin: [
              Math.max(-8, Math.min(8, minX)),
              Math.max(0, Math.min(16, minY)),
              Math.max(-8, Math.min(8, minZ)),
            ],
            size: [
              Math.max(0.1, Math.min(16, maxX - minX)),
              Math.max(0.1, Math.min(16, maxY - minY)),
              Math.max(0.1, Math.min(16, maxZ - minZ)),
            ],
          };
        }
      }
    }

    // Material instances based on 1, 3 or 6 faces
    if (mode === 'one') {
      components['minecraft:material_instances'] = {
        '*': {
          texture: block.identifier,
          render_method: 'opaque',
        },
      };
      blocksResourceMap[fullId] = {
        sound: 'stone',
        textures: block.identifier,
      };
      terrainTextureData[block.identifier] = {
        textures: `textures/blocks/${block.identifier}`,
      };

      const texData = resolveTextureDataUrl(project, faces.up || block.textureDataUrl || '');
      if (texData) {
        const b = await dataUrlToBlob(texData);
        rpBlocksTexturesFolder?.file(`${block.identifier}.png`, b);
      }
    } else if (mode === 'three') {
      const upTexKey = `${block.identifier}_up`;
      const downTexKey = `${block.identifier}_down`;
      const sideTexKey = `${block.identifier}_side`;

      components['minecraft:material_instances'] = {
        up: { texture: upTexKey, render_method: 'opaque' },
        down: { texture: downTexKey, render_method: 'opaque' },
        sides: { texture: sideTexKey, render_method: 'opaque' },
      };

      blocksResourceMap[fullId] = {
        sound: 'stone',
        textures: {
          up: upTexKey,
          down: downTexKey,
          side: sideTexKey,
        },
      };

      terrainTextureData[upTexKey] = { textures: `textures/blocks/${upTexKey}` };
      terrainTextureData[downTexKey] = { textures: `textures/blocks/${downTexKey}` };
      terrainTextureData[sideTexKey] = { textures: `textures/blocks/${sideTexKey}` };

      // Save textures
      const upData = resolveTextureDataUrl(project, faces.up || block.textureDataUrl || '');
      const downData = resolveTextureDataUrl(project, faces.down || faces.up || block.textureDataUrl || '');
      const sideData = resolveTextureDataUrl(project, faces.north || faces.up || block.textureDataUrl || '');

      if (upData) rpBlocksTexturesFolder?.file(`${upTexKey}.png`, await dataUrlToBlob(upData));
      if (downData) rpBlocksTexturesFolder?.file(`${downTexKey}.png`, await dataUrlToBlob(downData));
      if (sideData) rpBlocksTexturesFolder?.file(`${sideTexKey}.png`, await dataUrlToBlob(sideData));
    } else {
      // mode === 'six'
      const faceKeys = ['up', 'down', 'north', 'south', 'east', 'west'] as const;
      const matInstances: Record<string, { texture: string; render_method: string }> = {};
      const blockTexMap: Record<string, string> = {};

      for (const f of faceKeys) {
        const texKey = `${block.identifier}_${f}`;
        matInstances[f] = { texture: texKey, render_method: 'opaque' };
        blockTexMap[f] = texKey;
        terrainTextureData[texKey] = { textures: `textures/blocks/${texKey}` };

        const fData = resolveTextureDataUrl(project, faces[f] || faces.up || block.textureDataUrl || '');
        if (fData) {
          rpBlocksTexturesFolder?.file(`${texKey}.png`, await dataUrlToBlob(fData));
        }
      }

      components['minecraft:material_instances'] = matInstances;
      blocksResourceMap[fullId] = {
        sound: 'stone',
        textures: blockTexMap,
      };
    }

    // Destruction particle texture
    if (block.destructionParticles?.enabled && block.destructionParticles.particleTextureId) {
      const partData = resolveTextureDataUrl(project, block.destructionParticles.particleTextureId);
      if (partData) {
        rpParticleTexturesFolder?.file(`${block.identifier}_destroy_part.png`, await dataUrlToBlob(partData));
      }
    }

    // Step particle texture
    if (block.stepParticles?.enabled && block.stepParticles.particleTextureId) {
      const partData = resolveTextureDataUrl(project, block.stepParticles.particleTextureId);
      if (partData) {
        rpParticleTexturesFolder?.file(`${block.identifier}_step_part.png`, await dataUrlToBlob(partData));
      }
    }

    // Behavior Pack Block JSON
    const assignedGroup = (project.groups || []).find((g) => g.id === block.groupId);
    const menuCategory: Record<string, unknown> = {
      category: assignedGroup?.category && assignedGroup.category !== 'none' ? assignedGroup.category : 'nature',
      is_hidden_in_commands: assignedGroup?.category === 'none',
    };
    if (assignedGroup?.bedrockGroup && assignedGroup.bedrockGroup.trim().length > 0) {
      menuCategory.group = assignedGroup.bedrockGroup.trim();
    }

    // Official Block Traits (v0.1.4: minecraft:placement_direction, minecraft:placement_position)
    const traits: Record<string, unknown> = {};
    if (block.componentsList) {
      for (const comp of block.componentsList) {
        if (!comp.enabled) continue;
        if (comp.id === 'minecraft:placement_direction') {
          const cfg = comp.config as { enabledStates?: string[]; yRotationOffset?: number };
          if (cfg.enabledStates && cfg.enabledStates.length > 0) {
            traits['minecraft:placement_direction'] = {
              enabled_states: cfg.enabledStates,
              y_rotation_offset: cfg.yRotationOffset ?? 0,
            };
          }
        } else if (comp.id === 'minecraft:placement_position') {
          const cfg = comp.config as { enabledStates?: string[] };
          if (cfg.enabledStates && cfg.enabledStates.length > 0) {
            traits['minecraft:placement_position'] = {
              enabled_states: cfg.enabledStates,
            };
          }
        }
      }
    }

    const blockDescription: Record<string, unknown> = {
      identifier: fullId,
      menu_category: menuCategory,
    };

    if (Object.keys(traits).length > 0) {
      blockDescription.traits = traits;
    }

    const blockBpJson = {
      format_version: '1.21.50',
      'minecraft:block': {
        description: blockDescription,
        components,
      },
    };

    bpBlocksFolder?.file(`${block.identifier}.json`, JSON.stringify(blockBpJson, null, 2));

    // Populate multilingual translation entries
    languageCodes.forEach((code) => {
      const matched = block.translations?.find((t) => t.langCode === code);
      const nameForLang = matched?.name?.trim() || block.displayName;
      langFilesMap[code].push(`tile.${fullId}.name=${nameForLang}`);
    });
  }

  // 4. Script file if required
  if (requiresScriptApi) {
    const scriptsFolder = bpFolder.folder('scripts');
    const mainScript = `// Bedrock Studio v0.1.3 - Script API Walking Particle Component
import { world, system } from '@minecraft/server';

world.beforeEvents?.worldInitialize?.subscribe((initEvent) => {
  initEvent.blockComponentRegistry?.registerCustomComponent('studio:step_particles', {
    onStepOn(event) {
      const block = event.block;
      const dim = block.dimension;
      const center = block.center();
      // Spawns celebratory spark particle when walking continuously over the block
      try {
        dim.spawnParticle('minecraft:critical_hit_emitter', {
          x: center.x,
          y: center.y + 0.55,
          z: center.z
        });
      } catch (e) {
        // Fallback safe particle
      }
    }
  });
});
`;
    scriptsFolder?.file('main.js', mainScript);
  }

  // 5. Resource Pack blocks.json
  rpFolder.file(
    'blocks.json',
    JSON.stringify(
      {
        format_version: [1, 1, 0],
        ...blocksResourceMap,
      },
      null,
      2
    )
  );

  // 6. terrain_texture.json
  rpTexturesFolder?.file(
    'terrain_texture.json',
    JSON.stringify(
      {
        resource_pack_name: project.name,
        texture_name: 'atlas.terrain',
        padding: 8,
        num_mip_levels: 4,
        texture_data: terrainTextureData,
      },
      null,
      2
    )
  );

  // 7. Texts (Multilingual .lang files and languages.json)
  const textsFolder = rpFolder.folder('texts');
  const langCodesArray = Array.from(languageCodes);
  textsFolder?.file('languages.json', JSON.stringify(langCodesArray, null, 2));

  langCodesArray.forEach((code) => {
    const fileContent = langFilesMap[code].join('\n');
    textsFolder?.file(`${code}.lang`, fileContent);
  });

  // Generate .mcaddon with explicit octet-stream MIME
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const sanitized = (project.name || 'addon').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitized}.mcaddon`;

  // Robust client-side file download that prevents page reload or iframe navigation
  try {
    const nav = window.navigator as unknown as { msSaveOrOpenBlob?: (b: Blob, d: string) => boolean };
    if (nav && typeof nav.msSaveOrOpenBlob === 'function') {
      nav.msSaveOrOpenBlob(blob, fileName);
    } else {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.style.position = 'absolute';
      a.style.left = '-9999px';
      a.setAttribute('href', url);
      a.setAttribute('download', fileName);
      a.setAttribute('target', '_self');
      a.setAttribute('rel', 'noopener noreferrer');

      // Stop propagation to avoid bubbling to any global event listener
      a.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          window.URL.revokeObjectURL(url);
        } catch {
          // Cleanup safe
        }
      }, 2000);
    }
  } catch (err) {
    console.error('Error al generar enlace de descarga:', err);
    throw new Error('No se pudo descargar el archivo .mcaddon automáticamente.');
  }

  return {
    fileName,
    size: blob.size,
  };
}

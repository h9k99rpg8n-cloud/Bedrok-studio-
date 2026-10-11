import { AddonProject, CustomBlock, DiagnosticIssue } from '../types/addon';

/**
 * Validates a Minecraft Bedrock block identifier.
 * Should be lowercase alphanumeric + underscores.
 */
export function isValidBedrockIdentifier(id: string): boolean {
  if (!id || id.trim().length === 0) return false;
  return /^[a-z0-9_]+$/.test(id);
}

/**
 * Runs a comprehensive diagnosis across an AddonProject.
 */
export function runProjectDiagnostics(project: AddonProject): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  // 1. Manifest Checks
  if (!project.name || project.name.trim().length === 0) {
    issues.push({
      id: 'manifest_empty_name',
      severity: 'error',
      title: 'Nombre de Addon vacío',
      description: 'El complemento no tiene un nombre asignado en el manifiesto.',
      affectedTarget: 'manifest.json',
      reason: 'Minecraft requiere un campo "name" válido en el encabezado del manifiesto.',
      suggestion: 'Edita el manifiesto del proyecto y asigna un nombre claro.',
      canAutoFix: false,
    });
  }

  if (!project.description || project.description.trim().length === 0) {
    issues.push({
      id: 'manifest_empty_desc',
      severity: 'warning',
      title: 'Descripción de Addon vacía',
      description: 'El complemento carece de descripción para los jugadores.',
      affectedTarget: 'manifest.json',
      reason: 'Minecraft mostrará una descripción vacía en el selector de paquetes.',
      suggestion: 'Añade una descripción que explique el propósito del Addon.',
      canAutoFix: false,
    });
  }

  // UUID Checks
  if (project.bpUuid === project.rpUuid) {
    issues.push({
      id: 'manifest_duplicate_uuid',
      severity: 'error',
      title: 'Conflicto de UUIDs idénticos',
      description: 'El Behavior Pack y el Resource Pack comparten el mismo UUID.',
      affectedTarget: 'manifest.json',
      reason: 'Minecraft rechazará la importación si ambos paquetes tienen el mismo identificador UUID.',
      suggestion: 'Regenera los UUIDs en la configuración del proyecto para que sean únicos.',
      canAutoFix: true,
      autoFixType: 'clean_id',
    });
  }

  // 2. Block Identifiers & Duplications
  const seenIds = new Map<string, string[]>(); // id -> blockIds

  project.blocks.forEach((block) => {
    const rawId = block.identifier?.trim() || '';
    if (!seenIds.has(rawId)) {
      seenIds.set(rawId, []);
    }
    seenIds.get(rawId)!.push(block.id);

    // Format check
    if (!rawId) {
      issues.push({
        id: `block_empty_id_${block.id}`,
        severity: 'error',
        title: `Identificador vacío en "${block.displayName || 'Bloque sin nombre'}"`,
        description: 'El bloque no tiene un identificador técnico configurado.',
        affectedTarget: `Bloque: ${block.displayName || block.id}`,
        reason: 'El motor de Minecraft necesita una clave alfanumérica única en minecraft:block.description.identifier.',
        suggestion: 'Asigna un identificador como "rubi_ore" o "bloque_piedra".',
        blockId: block.id,
      });
    } else if (!isValidBedrockIdentifier(rawId)) {
      issues.push({
        id: `block_invalid_id_${block.id}`,
        severity: 'error',
        title: `Identificador con formato inválido: "${rawId}"`,
        description: `El identificador contiene espacios, mayúsculas o caracteres especiales no soportados.`,
        affectedTarget: `Bloque: custom:${rawId}`,
        reason: 'Minecraft solo admite letras minúsculas (a-z), números (0-9) y guiones bajos (_).',
        suggestion: `Cambiar por "${rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_')}".`,
        canAutoFix: true,
        autoFixType: 'clean_id',
        blockId: block.id,
      });
    }

    // Display Name check
    if (!block.displayName || block.displayName.trim().length === 0) {
      issues.push({
        id: `block_empty_name_${block.id}`,
        severity: 'warning',
        title: `Nombre visible no asignado para "custom:${block.identifier}"`,
        description: 'El bloque aparecerá sin nombre legible en el juego.',
        affectedTarget: `en_US.lang`,
        reason: 'No se generará una entrada adecuada en el archivo de idiomas.',
        suggestion: 'Asigna un nombre en español o inglés en la sección de Identidad.',
        blockId: block.id,
      });
    }

    // 3. Texture Assignment Checks (1, 3, or 6 faces)
    const mode = block.textureMode || 'one';
    const faceTex = block.faceTextures || {
      up: block.textureDataUrl || '',
      down: block.textureDataUrl || '',
      north: block.textureDataUrl || '',
      south: block.textureDataUrl || '',
      east: block.textureDataUrl || '',
      west: block.textureDataUrl || '',
    };

    let missingFaces: string[] = [];
    if (mode === 'one') {
      if (!faceTex.up && !block.textureDataUrl) {
        missingFaces.push('todas las caras');
      }
    } else if (mode === 'three') {
      if (!faceTex.up) missingFaces.push('cara superior');
      if (!faceTex.down) missingFaces.push('cara inferior');
      if (!faceTex.north && !faceTex.south && !faceTex.east && !faceTex.west) missingFaces.push('laterales');
    } else if (mode === 'six') {
      if (!faceTex.up) missingFaces.push('arriba');
      if (!faceTex.down) missingFaces.push('abajo');
      if (!faceTex.north) missingFaces.push('norte');
      if (!faceTex.south) missingFaces.push('sur');
      if (!faceTex.east) missingFaces.push('este');
      if (!faceTex.west) missingFaces.push('oeste');
    }

    if (missingFaces.length > 0) {
      issues.push({
        id: `block_missing_textures_${block.id}`,
        severity: 'error',
        title: `Texturas ausentes en "${block.displayName || block.identifier}"`,
        description: `Faltan texturas asignadas en: ${missingFaces.join(', ')}.`,
        affectedTarget: `Atlas del bloque custom:${block.identifier}`,
        reason: 'El bloque se renderizará con la textura morada/negra de error de Minecraft si una cara no tiene textura.',
        suggestion: 'Abre el Atlas de Texturas y selecciona una textura para las caras indicadas.',
        canAutoFix: true,
        autoFixType: 'fill_missing_textures',
        blockId: block.id,
      });
    }

    // 4. Value Range Checks
    if (block.emitsLight && (block.lightLevel < 0 || block.lightLevel > 15)) {
      issues.push({
        id: `block_invalid_light_${block.id}`,
        severity: 'error',
        title: `Nivel de luz fuera de rango en "${block.identifier}"`,
        description: `El valor de emisión de luz (${block.lightLevel}) excede el rango permitido de Minecraft.`,
        affectedTarget: `minecraft:light_emission`,
        reason: 'Minecraft Bedrock solo acepta enteros entre 0 y 15 para iluminación.',
        suggestion: 'Ajusta el control deslizante a un valor entre 0 y 15.',
        canAutoFix: true,
        autoFixType: 'clamp_values',
        blockId: block.id,
      });
    }

    if (block.destroyTime !== undefined && block.destroyTime < 0) {
      issues.push({
        id: `block_invalid_destroy_${block.id}`,
        severity: 'error',
        title: `Tiempo de picado negativo en "${block.identifier}"`,
        description: `El tiempo de destrucción (${block.destroyTime}) no puede ser inferior a 0.`,
        affectedTarget: `minecraft:destructible_by_mining`,
        reason: 'Valores negativos pueden provocar comportamientos erráticos o bloques irrompibles no deseados.',
        suggestion: 'Establece al menos 0.1 segundos o 1.5s estándar.',
        canAutoFix: true,
        autoFixType: 'clamp_values',
        blockId: block.id,
      });
    }

    // 5. Particle System Verification
    if (block.destructionParticles?.enabled && !block.destructionParticles.particleTextureId) {
      issues.push({
        id: `block_destruct_part_missing_tex_${block.id}`,
        severity: 'warning',
        title: `Partícula de rotura sin textura en "${block.identifier}"`,
        description: 'La función de partículas al romper está activada pero no tiene textura asignada.',
        affectedTarget: `minecraft:destruction_particles`,
        reason: 'Minecraft usará la textura principal por defecto o fallará la partícula.',
        suggestion: 'Selecciona una textura de la biblioteca o desactiva la opción.',
        blockId: block.id,
      });
    }

    if (block.stepParticles?.enabled && !block.stepParticles.particleTextureId) {
      issues.push({
        id: `block_step_part_missing_tex_${block.id}`,
        severity: 'warning',
        title: `Partícula al pisar sin textura en "${block.identifier}"`,
        description: 'La función de partículas al pisar está activada pero no tiene textura asignada.',
        affectedTarget: `studio:step_particles`,
        reason: 'El script de partículas no sabrá qué efecto spawnear.',
        suggestion: 'Selecciona una textura para la partícula al pisar.',
        blockId: block.id,
      });
    }

    // 6. Componentes Técnicos de Colocación (v0.1.4)
    if (block.componentsList && block.componentsList.length > 0) {
      const compIdsSeen = new Set<string>();
      block.componentsList.forEach((comp) => {
        if (!comp.enabled) return;

        // Duplicate component check
        if (compIdsSeen.has(comp.id)) {
          issues.push({
            id: `block_duplicate_comp_${block.id}_${comp.id}`,
            severity: 'error',
            title: `Componente duplicado: ${comp.id}`,
            description: `El bloque "${block.displayName}" contiene el componente ${comp.id} más de una vez.`,
            affectedTarget: comp.id,
            reason: 'Minecraft Bedrock solo permite una definición única de cada componente o trait por bloque.',
            suggestion: 'Elimina la copia duplicada en la pestaña de Componentes.',
            blockId: block.id,
          });
        }
        compIdsSeen.add(comp.id);

        // placement_direction check
        if (comp.id === 'minecraft:placement_direction') {
          const cfg = comp.config as { enabledStates?: string[]; yRotationOffset?: number };
          if (!cfg.enabledStates || cfg.enabledStates.length === 0) {
            issues.push({
              id: `block_placement_dir_empty_${block.id}`,
              severity: 'warning',
              title: `minecraft:placement_direction sin estados activos en "${block.identifier}"`,
              description: 'El componente está añadido pero no tiene ningún estado de dirección seleccionado.',
              affectedTarget: 'minecraft:placement_direction',
              reason: 'El rasgo no tendrá ningún efecto en el juego a menos que se active al menos un estado (ej. cardinal_direction).',
              suggestion: 'Selecciona al menos una orientación en la configuración del componente.',
              blockId: block.id,
            });
          } else if (
            cfg.enabledStates.includes('minecraft:cardinal_direction') &&
            cfg.enabledStates.includes('minecraft:facing_direction')
          ) {
            issues.push({
              id: `block_placement_dir_conflict_${block.id}`,
              severity: 'warning',
              title: `Incompatibilidad en placement_direction en "${block.identifier}"`,
              description: 'Se han seleccionado "cardinal_direction" y "facing_direction" a la vez.',
              affectedTarget: 'minecraft:placement_direction',
              reason: 'facing_direction ya incluye las 4 direcciones cardinales más arriba y abajo; combinarlas puede causar redundancia o anulación.',
              suggestion: 'Selecciona únicamente cardinal_direction para orientación horizontal o facing_direction para 6 direcciones.',
              blockId: block.id,
            });
          }
        }

        // placement_position check
        if (comp.id === 'minecraft:placement_position') {
          const cfg = comp.config as { enabledStates?: string[] };
          if (!cfg.enabledStates || cfg.enabledStates.length === 0) {
            issues.push({
              id: `block_placement_pos_empty_${block.id}`,
              severity: 'warning',
              title: `minecraft:placement_position sin estados activos en "${block.identifier}"`,
              description: 'No se ha seleccionado ningún estado para placement_position.',
              affectedTarget: 'minecraft:placement_position',
              reason: 'Debe activarse minecraft:block_face o minecraft:vertical_half para que el bloque responda a la posición de colocación.',
              suggestion: 'Marca al menos una casilla en los parámetros del componente.',
              blockId: block.id,
            });
          }
        }

        // placement_filter check
        if (comp.id === 'minecraft:placement_filter') {
          const cfg = comp.config as { conditions?: { allowedFaces?: string[]; blockFilter?: string[] }[] };
          if (!cfg.conditions || cfg.conditions.length === 0) {
            issues.push({
              id: `block_placement_filter_no_cond_${block.id}`,
              severity: 'error',
              title: `Filtro de colocación sin condiciones en "${block.identifier}"`,
              description: 'El componente placement_filter requiere al menos una condición con caras permitidas y bloques de apoyo.',
              affectedTarget: 'minecraft:placement_filter',
              reason: 'Una lista de condiciones vacía impedirá colocar el bloque por completo en el juego.',
              suggestion: 'Añade una regla indicando las caras (ej. "up") y los bloques admitidos.',
              blockId: block.id,
            });
          } else {
            cfg.conditions.forEach((cond, cIdx) => {
              if (!cond.allowedFaces || cond.allowedFaces.length === 0) {
                issues.push({
                  id: `block_placement_filter_empty_faces_${block.id}_${cIdx}`,
                  severity: 'error',
                  title: `Condición #${cIdx + 1} de filtro sin caras en "${block.identifier}"`,
                  description: 'No se ha especificado ninguna cara permitida (ej. up, down).',
                  affectedTarget: 'minecraft:placement_filter.conditions[].allowed_faces',
                  reason: 'Minecraft necesita saber sobre qué caras del bloque adyacente se permite el soporte.',
                  suggestion: 'Selecciona al menos una cara (ej. "up" para colocarlo en el suelo).',
                  blockId: block.id,
                });
              }
              if (!cond.blockFilter || cond.blockFilter.length === 0) {
                issues.push({
                  id: `block_placement_filter_empty_blocks_${block.id}_${cIdx}`,
                  severity: 'error',
                  title: `Condición #${cIdx + 1} de filtro sin bloques en "${block.identifier}"`,
                  description: 'La lista de bloques de apoyo permitidos está vacía.',
                  affectedTarget: 'minecraft:placement_filter.conditions[].block_filter',
                  reason: 'Sin bloques en el filtro, la condición no coincidirá con ningún bloque en el juego.',
                  suggestion: 'Añade al menos un identificador de bloque de soporte (ej. "minecraft:dirt", "minecraft:stone").',
                  blockId: block.id,
                });
              }
            });
          }
        }
      });
    }

    // 7. Cajas de Colisión y Selección (v0.1.5)
    if (block.collisionConfig?.enabled && block.collisionConfig.boxes) {
      block.collisionConfig.boxes.forEach((box, idx) => {
        const [ox, oy, oz] = box.origin;
        const [w, h, d] = box.size;

        if (w <= 0 || h <= 0 || d <= 0) {
          issues.push({
            id: `block_col_box_zero_size_${block.id}_${idx}`,
            severity: 'error',
            title: `Caja de colisión con dimensiones inválidas en "${block.displayName}"`,
            description: `La caja "${box.name || idx + 1}" tiene dimensiones menores o iguales a cero (${w}×${h}×${d}).`,
            affectedTarget: 'minecraft:collision_box',
            reason: 'Minecraft Bedrock requiere que el tamaño sea estrictamente positivo.',
            suggestion: 'Ajusta el ancho, alto y profundidad a valores mayores que cero.',
            blockId: block.id,
          });
        }

        if (ox < -8 || ox > 8 || oy < 0 || oy > 24 || oz < -8 || oz > 8 || ox + w > 8 || oy + h > 24 || oz + d > 8) {
          issues.push({
            id: `block_col_box_bounds_${block.id}_${idx}`,
            severity: 'warning',
            title: `Caja de colisión fuera de límites estándar en "${block.displayName}"`,
            description: `La caja "${box.name || idx + 1}" sobrepasa el límite del bloque [Origen: ${ox},${oy},${oz} - Fin: ${ox + w},${oy + h},${oz + d}].`,
            affectedTarget: 'minecraft:collision_box',
            reason: 'Bedrock admite hasta Y=24 para colisiones de cercas/muros y X,Z de -8 a 8.',
            suggestion: 'Asegúrate de que la caja quede contenida dentro del rango permitido.',
            blockId: block.id,
          });
        }
      });
    }

    if (block.selectionConfig?.enabled && block.selectionConfig.boxes) {
      if (block.selectionConfig.boxes.length > 1) {
        issues.push({
          id: `block_sel_box_multi_${block.id}`,
          severity: 'info',
          title: `Caja de selección múltiple en "${block.displayName}"`,
          description: `Se han configurado ${block.selectionConfig.boxes.length} cajas de selección.`,
          affectedTarget: 'minecraft:selection_box',
          reason: 'Minecraft Bedrock estándar solo admite una única caja de selección continua en el JSON.',
          suggestion: 'Bedrock Studio calculará automáticamente la caja envolvente que contiene todas las cajas para exportarla válidamente.',
          blockId: block.id,
        });
      }

      block.selectionConfig.boxes.forEach((box, idx) => {
        const [ox, oy, oz] = box.origin;
        const [w, h, d] = box.size;

        if (w <= 0 || h <= 0 || d <= 0) {
          issues.push({
            id: `block_sel_box_zero_size_${block.id}_${idx}`,
            severity: 'error',
            title: `Caja de selección con dimensiones inválidas en "${block.displayName}"`,
            description: `La caja "${box.name || idx + 1}" tiene dimensiones menores o iguales a cero.`,
            affectedTarget: 'minecraft:selection_box',
            reason: 'Minecraft Bedrock requiere tamaños positivos para interactuar con el bloque.',
            suggestion: 'Ajusta las dimensiones de la caja de selección.',
            blockId: block.id,
          });
        }
      });
    }
  });

  // Check for duplicate block identifiers
  seenIds.forEach((blockIds, id) => {
    if (id && blockIds.length > 1) {
      issues.push({
        id: `duplicate_id_${id}`,
        severity: 'error',
        title: `Identificador duplicado: "custom:${id}" (${blockIds.length} bloques)`,
        description: `Existen ${blockIds.length} bloques con el mismo identificador en este Addon.`,
        affectedTarget: `custom:${id}`,
        reason: 'Minecraft sobrescribirá el bloque o provocará un error de colisión de registro en tiempo de carga.',
        suggestion: 'Renombra los bloques duplicados con sufijos únicos (ej. _2, _variante).',
        canAutoFix: true,
        autoFixType: 'remove_duplicate_id',
        blockId: blockIds[1],
      });
    }
  });

  // 6. Script Dependency Audit
  const hasStepParticles = project.blocks.some((b) => b.stepParticles?.enabled);
  if (hasStepParticles) {
    issues.push({
      id: 'script_api_required_step_particles',
      severity: 'info',
      title: 'Módulo @minecraft/server requerido para partículas al pisar',
      description: 'El proyecto incluye detección continua de entidades caminando sobre bloques.',
      affectedTarget: 'manifest.json (Script Module)',
      reason: 'En Bedrock estable, detectar de manera fiable cuando una entidad camina/pisa requiere Script API.',
      suggestion: 'Bedrock Studio generará automáticamente el script scripts/main.js y la dependencia @minecraft/server v1.14.0.',
      canAutoFix: false,
    });
  }

  // 7. Crafting Recipes Validation (v1.6)
  if (Array.isArray(project.recipes) && project.recipes.length > 0) {
    const seenRecipeIds = new Map<string, string[]>();

    project.recipes.forEach((rcp) => {
      // Duplicate recipe identifier check
      const cleanId = (rcp.identifier || '').toLowerCase().trim();
      if (cleanId) {
        if (!seenRecipeIds.has(cleanId)) {
          seenRecipeIds.set(cleanId, [rcp.id]);
        } else {
          seenRecipeIds.get(cleanId)!.push(rcp.id);
        }
      }

      // Ingredients check
      const hasIngredients = Array.isArray(rcp.grid) && rcp.grid.some((s) => s !== null);
      if (!hasIngredients) {
        issues.push({
          id: `recipe_no_ingredients_${rcp.id}`,
          severity: 'error',
          title: `Receta "${rcp.displayName}" sin ingredientes`,
          description: 'La cuadrícula 3×3 de la receta está vacía.',
          affectedTarget: `custom:${rcp.identifier}`,
          reason: 'Una receta en Minecraft debe tener al menos un ingrediente para fabricarse.',
          suggestion: 'Abre el editor de recetas y coloca materiales en la mesa de trabajo.',
        });
      }

      // Result item check
      if (!rcp.resultItem) {
        issues.push({
          id: `recipe_no_result_${rcp.id}`,
          severity: 'error',
          title: `Receta "${rcp.displayName}" sin producto resultante`,
          description: 'La receta no define qué objeto o bloque produce.',
          affectedTarget: `custom:${rcp.identifier}`,
          reason: 'Minecraft requiere una salida válida en el campo result.',
          suggestion: 'Selecciona el bloque o material que se obtendrá al fabricar.',
        });
      }
    });

    seenRecipeIds.forEach((recipeIds, id) => {
      if (recipeIds.length > 1) {
        issues.push({
          id: `duplicate_recipe_id_${id}`,
          severity: 'error',
          title: `Identificador de receta duplicado: "custom:${id}"`,
          description: `Existen ${recipeIds.length} recetas con el mismo identificador.`,
          affectedTarget: `custom:${id}`,
          reason: 'Identificadores duplicados sobrescribirán recetas en Minecraft.',
          suggestion: 'Renombra una de las recetas para que tenga un identificador único.',
        });
      }
    });
  }

  return issues;
}

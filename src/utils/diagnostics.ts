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

  return issues;
}

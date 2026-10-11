/**
 * Sistema de nombres inteligentes y predecibles para bloques (v1.6)
 * 
 * Reglas:
 * - Los bloques nuevos reciben nombres ordenados secuencialmente: «Bloque 1», «Bloque 2», «Bloque 3»...
 * - No genera números aleatorios extraños como «Bloque 900».
 * - Si el usuario cambia manualmente el nombre, se conserva sin sobrescribir.
 * - Sugiere nombres mientras el usuario escribe (lámpara, linterna, ladrillo, cristal, madera...).
 * - Las sugerencias facilitan la escritura sin sustituir automáticamente el texto del usuario.
 */

import { CustomBlock } from '../types/addon';

// Sugerencias de temáticas y conceptos populares para bloques de Minecraft
export const POPULAR_BLOCK_SUGGESTIONS = [
  'Lámpara',
  'Linterna',
  'Ladrillo',
  'Cristal',
  'Madera',
  'Piedra',
  'Obsidiana',
  'Mineral',
  'Cofre',
  'Basalto',
  'Cuarzo',
  'Prismarina',
  'Hielo',
  'Hongo',
  'Arena',
  'Cobre',
  'Hierro',
  'Oro',
  'Amatista',
  'Calcedonia',
  'Pizarra Profunda',
  'Terracota',
  'Hormigón',
  'Lana',
];

// Sugerencias compuestas contextuales
export const COMPOUND_SUGGESTIONS: Record<string, string[]> = {
  lampara: ['Lámpara de Redstone', 'Lámpara Mágica', 'Lámpara Marina', 'Lámpara Brillante'],
  linterna: ['Linterna de Almas', 'Linterna de Cobre', 'Linterna Colgante'],
  ladrillo: ['Ladrillo de Piedra', 'Ladrillo Musgoso', 'Ladrillos Rojos', 'Ladrillo Agrietado'],
  cristal: ['Cristal Reforzado', 'Cristal Tintado', 'Cristal Espejado'],
  madera: ['Madera Antigua', 'Madera Petrificada', 'Madera Encantada'],
  piedra: ['Piedra de Chispa', 'Piedra Pulida', 'Piedra Rúnica'],
  mineral: ['Mineral de Rubí', 'Mineral de Zafiro', 'Mineral de Uranio'],
  obsidiana: ['Obsidiana Llorosa Reforzada', 'Obsidiana Pulida'],
  cuarzo: ['Cuarzo Ahumado', 'Cuarzo Rúnico', 'Pilar de Cuarzo'],
  cobre: ['Cobre Oxidado Decorado', 'Bloque de Cobre Cortado'],
};

/**
 * Calcula de manera predecible el siguiente nombre secuencial para un bloque nuevo.
 * Ejemplo: Si ya existen Bloque 1 y Bloque 2, devolverá «Bloque 3» y «bloque_3».
 */
export function getNextBlockNameAndIdentifier(existingBlocks: CustomBlock[] = []): {
  displayName: string;
  identifier: string;
} {
  const usedNumbers = new Set<number>();
  const nameRegex = /^bloque\s+(\d+)$/i;
  const idRegex = /^bloque_(\d+)$/i;

  for (const b of existingBlocks) {
    if (b.displayName) {
      const mName = b.displayName.trim().match(nameRegex);
      if (mName && mName[1]) {
        usedNumbers.add(parseInt(mName[1], 10));
      }
    }
    if (b.identifier) {
      const mId = b.identifier.trim().match(idRegex);
      if (mId && mId[1]) {
        usedNumbers.add(parseInt(mId[1], 10));
      }
    }
  }

  // Encontrar el primer número entero libre empezando en 1
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return {
    displayName: `Bloque ${nextNumber}`,
    identifier: `bloque_${nextNumber}`,
  };
}

/**
 * Genera sugerencias relevantes mientras el usuario escribe en el campo de nombre.
 */
export function getBlockNameSuggestions(input: string): string[] {
  const clean = (input || '').trim().toLowerCase();

  // Si está vacío, ofrece las categorías principales más útiles
  if (!clean) {
    return ['Lámpara', 'Linterna', 'Ladrillo', 'Cristal', 'Madera', 'Mineral', 'Piedra'];
  }

  const results: string[] = [];

  // Buscar en compuestos primero
  for (const [key, list] of Object.entries(COMPOUND_SUGGESTIONS)) {
    if (clean.includes(key) || key.includes(clean)) {
      results.push(...list);
    }
  }

  // Buscar en palabras populares
  for (const item of POPULAR_BLOCK_SUGGESTIONS) {
    if (item.toLowerCase().includes(clean) && !results.includes(item)) {
      results.push(item);
    }
  }

  // Si no hay coincidencias exactas, sugerir variaciones interesantes
  if (results.length === 0) {
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    results.push(
      `${capitalized} Pulido`,
      `${capitalized} Reforzado`,
      `${capitalized} Brillante`,
      `Bloque de ${capitalized}`
    );
  }

  return results.slice(0, 5);
}

/**
 * Genera un identificador técnico de Minecraft válido a partir de un nombre visible.
 * Ej: "Lámpara de Rubí" -> "lampara_de_rubi"
 */
export function generateIdentifierFromName(name: string): string {
  if (!name) return 'bloque';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

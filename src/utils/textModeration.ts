/**
 * Sistema de moderación y filtro de palabras inapropiadas para Bedrock Studio v1.6
 * 
 * Reglas de diseño:
 * - Detecta lenguaje ofensivo usando límites de palabras para evitar el efecto Scunthorpe
 *   (no bloquea palabras legítimas como "asociación", "clase", "disputa", etc.).
 * - Permite censurar con asteriscos (*).
 * - NO debe usarse en identificadores técnicos, UUIDs, rutas de archivos o nombres internos.
 */

// Lista configurable de términos comunes no deseados en nombres visibles para jugadores
const INAPPROPRIATE_TERMS: string[] = [
  // Términos ofensivos en español (raíces aisladas)
  'puta', 'puto', 'mierda', 'coño', 'pendejo', 'pendeja', 'culiao', 'culia',
  'chinga', 'chingar', 'cabron', 'cabrona', 'gilipollas', 'jodete', 'joder',
  'verga', 'pene', 'vagina', 'tetas', 'maricon', 'zorra', 'maldito', 'bastardo',
  'polla', 'imbecil', 'estupido', 'estupida', 'idiota', 'culero', 'carajo',
  // Términos comunes en inglés
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'bastard', 'nigger', 'faggot',
  'whore', 'slut', 'cock', 'pussy', 'retard'
];

/**
 * Escapa caracteres especiales para regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normaliza texto eliminando acentos básicos para comprobación
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Comprueba si un texto contiene palabras inapropiadas usando límites de palabra
 */
export function checkInappropriateText(text: string): {
  hasInappropriate: boolean;
  flaggedWords: string[];
} {
  if (!text || typeof text !== 'string') {
    return { hasInappropriate: false, flaggedWords: [] };
  }

  const normalized = normalizeText(text);
  const flaggedWords: string[] = [];

  for (const term of INAPPROPRIATE_TERMS) {
    // Usamos límite de caracteres que no sean letras o números
    // Esto asegura que "clase", "asociación", "disputa", etc. NO se bloqueen
    const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, 'i');
    if (regex.test(normalized)) {
      flaggedWords.push(term);
    }
  }

  return {
    hasInappropriate: flaggedWords.length > 0,
    flaggedWords,
  };
}

/**
 * Censura palabras inapropiadas en un texto reemplazándolas por asteriscos (*),
 * conservando la longitud y estructura de mayúsculas/minúsculas original.
 */
export function censorInappropriateText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  for (const term of INAPPROPRIATE_TERMS) {
    // Regex case-insensitive con límites de palabra para sustituir
    // Soporta letras con tildes y caracteres adyacentes
    const regex = new RegExp(`(^|[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])(${escapeRegex(term)})([^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]|$)`, 'gi');
    result = result.replace(regex, (match, prefix, word, suffix) => {
      const asterisks = '*'.repeat(word.length);
      return `${prefix}${asterisks}${suffix}`;
    });
  }

  return result;
}

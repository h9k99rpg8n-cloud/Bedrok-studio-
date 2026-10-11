/**
 * Sugerencias inteligentes y validación para el Manifiesto del Addon (v1.6)
 */

export const DEFAULT_MANIFEST_SUGGESTIONS = [
  'Un emocionante complemento que expande tu mundo con bloques y recursos personalizados.',
  'Añade nuevos bloques, mecánicas y construcciones únicas a tu aventura en Minecraft.',
  'Colección de bloques decorativos y recursos detallados para constructores creativos.',
  'Descubre nuevos materiales, iluminación personalizada y bloques interactivos en Bedrock.',
  'Paquete oficial de recursos y comportamientos personalizados creado con Bedrock Studio.',
];

/**
 * Sugiere descripciones según palabras clave en el nombre del complemento
 */
export function getManifestDescriptionSuggestions(addonName: string): string[] {
  const clean = (addonName || '').toLowerCase().trim();
  const suggestions: string[] = [];

  if (clean.includes('mineral') || clean.includes('rubi') || clean.includes('zafiro') || clean.includes('ore') || clean.includes('mina')) {
    suggestions.push(
      'Descubre nuevos minerales brillantes, bloques de valor y recursos especiales para tus expediciones mineras.',
      'Expande la minería subterránea con bloques preciosos y materiales únicos para Minecraft Bedrock.'
    );
  }

  if (clean.includes('decor') || clean.includes('mueble') || clean.includes('casa') || clean.includes('construc')) {
    suggestions.push(
      'Añade bloques decorativos y materiales arquitectónicos para diseñar interiores y exteriores impresionantes.',
      'Variedad de bloques estilizados para constructores exigentes y mundos creativos.'
    );
  }

  if (clean.includes('luz') || clean.includes('lampar') || clean.includes('brill') || clean.includes('fuego') || clean.includes('noche')) {
    suggestions.push(
      'Ilumina tus noches con nuevas fuentes de luz, lámparas especiales y bloques emisores de partículas luminosas.',
      'Bloques luminosos y antorchas avanzadas para iluminar tus fortalezas con estilo.'
    );
  }

  if (clean.includes('magi') || clean.includes('arcano') || clean.includes('hechiz') || clean.includes('runa')) {
    suggestions.push(
      'Introduce bloques místicos, altares arcanos y runas ancestrales con energía sobrenatural.',
      'Explora el poder de la magia con nuevos altares y bloques encantados para Bedrock.'
    );
  }

  if (clean.includes('tecn') || clean.includes('redstone') || clean.includes('mecanic') || clean.includes('indus')) {
    suggestions.push(
      'Mecanismos avanzados, bloques conductores de redstone y componentes técnicos para tus circuitos.',
      'Automatiza tus granjas y fortalezas con bloques técnicos interactivos y señales de redstone.'
    );
  }

  // Si no hay sugerencias específicas o son pocas, añade las generales
  for (const def of DEFAULT_MANIFEST_SUGGESTIONS) {
    if (!suggestions.includes(def) && suggestions.length < 4) {
      suggestions.push(def);
    }
  }

  return suggestions.slice(0, 4);
}

/**
 * Valida si un número de versión semántica es válido (ej: 1.0.0)
 */
export function isValidSemVer(ver: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(ver.trim());
}

/**
 * Valida la versión mínima del motor de Bedrock (ej: 1.26.20 o [1, 26, 20])
 */
export function isValidEngineVersion(engineVer: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(engineVer.trim());
}

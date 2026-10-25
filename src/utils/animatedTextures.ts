export type AnimatedTextureTemplateKind = 'water' | 'lava' | 'energy' | 'portal';

export interface AnimatedTextureSource {
  dataUrl: string;
  frameWidth: number;
  frameCount: number;
}

export async function inspectAnimatedTexture(dataUrl: string): Promise<{ frameWidth: number; frameCount: number }> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('No se pudo leer el PNG. Elige una imagen PNG válida.'));
    image.src = dataUrl;
  });

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const powerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;

  if (!powerOfTwo(width) || width < 16 || width > 256) {
    throw new Error('El ancho de la textura debe ser 16, 32, 64, 128 o 256 píxeles.');
  }
  if (!powerOfTwo(height) || height <= width || height % width !== 0) {
    throw new Error('La imagen debe ser vertical y contener al menos 2 fotogramas cuadrados apilados. Ejemplo: 16×64 para 4 fotogramas.');
  }
  const frameCount = height / width;
  if (frameCount < 2 || frameCount > 64) {
    throw new Error('La animación debe contener entre 2 y 64 fotogramas.');
  }
  return { frameWidth: width, frameCount };
}

export function createAnimatedTextureTemplate(kind: AnimatedTextureTemplateKind): AnimatedTextureSource {
  const frameWidth = 16;
  const frameCount = 4;
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameWidth * frameCount;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la plantilla de textura.');

  const palettes: Record<AnimatedTextureTemplateKind, string[]> = {
    water: ['#063A67', '#0878A8', '#20C5D8', '#A4F5F0'],
    lava: ['#4A1010', '#B52A0D', '#F05A14', '#FFD34E'],
    energy: ['#052E25', '#087F5B', '#34D399', '#D9F99D'],
    portal: ['#210B3D', '#57218A', '#A855F7', '#E9D5FF'],
  };
  const palette = palettes[kind];

  for (let frame = 0; frame < frameCount; frame++) {
    const offsetY = frame * frameWidth;
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, offsetY, frameWidth, frameWidth);

    for (let y = 0; y < frameWidth; y++) {
      for (let x = 0; x < frameWidth; x++) {
        let colorIndex = 0;
        if (kind === 'water') {
          const wave = (x + frame * 3 + Math.floor(y / 3)) % 7;
          colorIndex = wave === 0 || (y + frame) % 6 === 0 ? 3 : wave < 3 ? 2 : wave < 5 ? 1 : 0;
        } else if (kind === 'lava') {
          const flow = (x * 2 + y + frame * 4 + Math.floor((x + frame) / 3)) % 9;
          colorIndex = flow < 2 ? 3 : flow < 5 ? 2 : flow < 7 ? 1 : 0;
        } else if (kind === 'energy') {
          const dx = x - 7.5;
          const dy = y - 7.5;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const pulse = (x * 3 + y * 5 + frame * 4) % 11;
          colorIndex = distance < 2 + (frame % 2) ? 3 : distance < 5 ? 2 : pulse < 3 ? 1 : 0;
        } else {
          const ring = Math.floor(Math.sqrt((x - 7.5) ** 2 + (y - 7.5) ** 2));
          const swirl = (Math.floor(Math.atan2(y - 7.5, x - 7.5) * 4) + ring + frame * 2 + 32) % 7;
          colorIndex = swirl < 2 ? 3 : swirl < 4 ? 2 : swirl < 6 ? 1 : 0;
        }
        if (colorIndex > 0) {
          ctx.fillStyle = palette[colorIndex];
          ctx.fillRect(x, offsetY + y, 1, 1);
        }
      }
    }
  }

  return { dataUrl: canvas.toDataURL('image/png'), frameWidth, frameCount };
}

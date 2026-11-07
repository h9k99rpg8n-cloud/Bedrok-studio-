import type { AddonProject } from '../types/addon';

/**
 * Código de respaldo de Bedrock Studio (v4.0.0.1).
 *
 * Todo local, sin servidor: el código contiene TODOS los proyectos del
 * usuario comprimidos en un solo texto que se puede copiar y pegar en
 * otro dispositivo o Safari para restaurarlos.
 *
 * Formato: BS401-v1-<gzip|plain>-<base64url>
 *   - Prefijo BS401-: marca clara de que es un código de Bedrock Studio.
 *   - v1: versión del formato (permite cambiarlo en el futuro).
 *   - gzip: se comprime con CompressionStream ('gzip') cuando el
 *     navegador lo ofrece; si no, se guarda el JSON en base64 (plain).
 *   - El contenido es JSON con los proyectos y un contador, validado
 *     al leerlo. No contiene contraseñas ni perfiles, solo proyectos.
 */

export const BACKUP_CODE_PREFIX = 'BS401-';
export const BACKUP_CODE_FORMAT_VERSION = 1;

export type BackupEncoding = 'gzip' | 'plain';

export interface BackupCodeResult {
  code: string;
  encoding: BackupEncoding;
  projectCount: number;
  charLength: number;
  approxKb: number;
}

export interface DecodedBackupCode {
  projects: AddonProject[];
  encoding: BackupEncoding;
  createdAt: number;
  projectCount: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type StreamCtor = new (format: string) => TransformStream<Uint8Array, Uint8Array>;

function getCompressionStream(): StreamCtor | undefined {
  return (globalThis as unknown as { CompressionStream?: StreamCtor }).CompressionStream;
}

function getDecompressionStream(): StreamCtor | undefined {
  return (globalThis as unknown as { DecompressionStream?: StreamCtor }).DecompressionStream;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipBytes(bytes: Uint8Array): Promise<Uint8Array | null> {
  const Ctor = getCompressionStream();
  if (!Ctor) return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new Ctor('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function gunzipBytes(bytes: Uint8Array): Promise<Uint8Array | null> {
  const Ctor = getDecompressionStream();
  if (!Ctor) return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new Ctor('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

/** Genera el código de respaldo con todos los proyectos dados. */
export async function encodeBackupCode(projects: AddonProject[]): Promise<BackupCodeResult> {
  const payload = {
    format: 'bedrock-studio-backup',
    formatVersion: BACKUP_CODE_FORMAT_VERSION,
    appVersion: '4.0.0.1',
    createdAt: Date.now(),
    projectCount: projects.length,
    projects,
  };
  const bytes = textEncoder.encode(JSON.stringify(payload));
  const compressed = await gzipBytes(bytes);
  const encoding: BackupEncoding = compressed ? 'gzip' : 'plain';
  const data = compressed ?? bytes;
  const code = `${BACKUP_CODE_PREFIX}v1-${encoding}-${bytesToBase64Url(data)}`;
  return {
    code,
    encoding,
    projectCount: projects.length,
    charLength: code.length,
    approxKb: Math.round((code.length / 1024) * 10) / 10,
  };
}

/** Lee y valida un código de respaldo. Lanza un Error en español si no es válido. */
export async function decodeBackupCode(raw: string): Promise<DecodedBackupCode> {
  const code = raw.trim();
  if (!code) {
    throw new Error('Pega un código de respaldo para continuar.');
  }
  if (!code.startsWith(BACKUP_CODE_PREFIX)) {
    throw new Error('Este código no parece un código de respaldo de Bedrock Studio: debe empezar por BS401-.');
  }
  // Formato: v1-<gzip|plain>-<payload>. El payload en base64url PUEDE
  // contener guiones, así que no se separa con split('-'): se lee por
  // prefijos fijos (v1-, gzip- o plain-) y el resto es el payload.
  const rest = code.slice(BACKUP_CODE_PREFIX.length);
  if (!rest.startsWith('v1-')) {
    throw new Error('El código tiene un formato desconocido o está incompleto. Revisa que lo copiaste entero, sin espacios ni saltos de línea.');
  }
  const afterVersion = rest.slice(3);
  let encoding: BackupEncoding;
  let payload: string;
  if (afterVersion.startsWith('gzip-')) {
    encoding = 'gzip';
    payload = afterVersion.slice(5);
  } else if (afterVersion.startsWith('plain-')) {
    encoding = 'plain';
    payload = afterVersion.slice(6);
  } else {
    throw new Error('El código tiene un formato desconocido o está incompleto. Revisa que lo copiaste entero, sin espacios ni saltos de línea.');
  }
  if (!payload) {
    throw new Error('El código está incompleto: le falta el contenido.');
  }
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(payload);
  } catch {
    throw new Error('El código está corrupto: no se pudo leer su contenido.');
  }
  let json: string;
  if (encoding === 'gzip') {
    if (!getDecompressionStream()) {
      throw new Error('Este navegador no puede leer códigos comprimidos. Prueba en otro navegador o genera un código nuevo.');
    }
    const decompressed = await gunzipBytes(bytes);
    if (!decompressed) {
      throw new Error('El código está corrupto: no se pudo descomprimir.');
    }
    json = textDecoder.decode(decompressed);
  } else {
    json = textDecoder.decode(bytes);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('El código está corrupto: su contenido no es válido.');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { format?: unknown }).format !== 'bedrock-studio-backup' ||
    !Array.isArray((parsed as { projects?: unknown }).projects)
  ) {
    throw new Error('El código no contiene proyectos válidos de Bedrock Studio.');
  }
  const projects = (parsed as { projects: unknown[] }).projects as AddonProject[];
  for (const project of projects) {
    if (!project || typeof project.id !== 'string' || !project.id || typeof project.name !== 'string') {
      throw new Error('El código contiene un proyecto sin nombre o sin identificador.');
    }
  }
  const createdAt = (parsed as { createdAt?: unknown }).createdAt;
  return {
    projects,
    encoding,
    createdAt: typeof createdAt === 'number' ? createdAt : 0,
    projectCount: projects.length,
  };
}

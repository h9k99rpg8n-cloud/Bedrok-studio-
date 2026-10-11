import React, { useState } from 'react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<'v0.1.3' | 'v0.1.2'>('v0.1.3');

  if (!isOpen) return null;

  const features013 = [
    {
      title: 'Editor Pixel Art de Alta Precisión y Táctil',
      version: 'v0.1.3',
      badge: 'Pixel Art',
      desc: 'Lienzo interactivo optimizado para móviles con zoom hasta 800%, herramienta de desplazamiento (Pan) sin pintar accidentalmente, cuadrícula visible, fondo ajedrezado para transparencias reales y soporte para 16×16, 32×32, 64×64 y 128×128.',
      icon: 'bx bxs-paint',
      illustration: 'atlas_sync',
    },
    {
      title: 'Herramientas de Dibujo y Algoritmos Pixelados',
      version: 'v0.1.3',
      badge: 'Herramientas',
      desc: 'Lápiz, borrador transparente, bote de pintura (flood fill), cuentagotas con selector exacto, línea recta (algoritmo Bresenham), rectángulos y círculos sobre la cuadrícula con previsualización en vivo, deshacer y rehacer.',
      icon: 'bx bx-shape-polygon',
      illustration: 'live_status',
    },
    {
      title: 'Imágenes de Referencia y Catálogo Bedrock',
      version: 'v0.1.3',
      badge: 'Referencia',
      desc: 'Panel flotante para importar fotos de referencia con zoom y opacidad regulable sin alterar el dibujo. Catálogo integrado de texturas oficiales de Minecraft Bedrock (piedra, césped, madera, diamante, obsidiana...) listo para importar o editar.',
      icon: 'bx bxs-photo-album',
      illustration: 'indexeddb',
    },
    {
      title: 'Sistema de Grupos y Categorías Creativas',
      version: 'v0.1.3',
      badge: 'Grupos Addon',
      desc: 'Crea grupos personalizados con colores y asígnalos a la categoría oficial de Minecraft Bedrock (Construcción, Naturaleza, Equipo, Objetos). Búsqueda y asignación instantánea en el editor de bloques con exportación compatible de menu_category.',
      icon: 'bx bx-category',
      illustration: 'multilingual',
    },
    {
      title: 'Persistencia Total e Independiente en IndexedDB',
      version: 'v0.1.3',
      badge: 'Persistencia',
      desc: 'Aislamiento estricto de datos por proyecto. Todos los bloques, texturas, grupos e identificadores se guardan y recuperan de forma atómica sin pérdidas al recargar o alternar entre pantallas.',
      icon: 'bx bxs-data',
      illustration: 'duplicate_safe',
    },
  ];

  const features012 = [
    {
      title: 'Atlas de Texturas (1, 3 y 6 Caras)',
      version: 'v0.1.2',
      badge: 'Atlas',
      desc: 'Mapa interactivo desplegado del cubo en forma de cruz. Asigna texturas independientes a las caras superior, inferior, norte, sur, este y oeste.',
      icon: 'bx bxs-cube-alt',
      illustration: 'atlas_cube',
    },
    {
      title: 'Partículas al Romper y al Pisar',
      version: 'v0.1.2',
      badge: 'Física y Efectos',
      desc: 'Configura efectos de partículas visuales al destruir el bloque y detección real de entidades caminando encima utilizando componentes personalizados de Script API (@minecraft/server).',
      icon: 'bx bxs-sparkles',
      illustration: 'particles',
    },
    {
      title: 'Sistema de Diagnóstico y Validación',
      version: 'v0.1.2',
      badge: 'Estabilidad',
      desc: 'Auditoría automática previa a la exportación que detecta identificadores duplicados, texturas faltantes y referencias rotas con auto-reparación.',
      icon: 'bx bxs-check-shield',
      illustration: 'diagnostics',
    },
  ];

  const currentList = selectedVersion === 'v0.1.3' ? features013 : features012;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <h2 className="text-sm font-black text-slate-100">Novedades de Bedrock Studio</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
              Versión 0.1.3 — Persistencia, Multilingüe y Mejoras Móviles
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Version Switch Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 my-3">
          <button
            type="button"
            onClick={() => setSelectedVersion('v0.1.3')}
            className={`min-h-[38px] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              selectedVersion === 'v0.1.3'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-check-circle" />
            <span>Versión 0.1.3 (Actual)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedVersion('v0.1.2')}
            className={`min-h-[38px] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              selectedVersion === 'v0.1.2'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-history" />
            <span>Versión 0.1.2</span>
          </button>
        </div>

        {/* Feature Cards List */}
        <div className="flex-1 flex flex-col gap-3 mb-3">
          {currentList.map((feat) => (
            <div
              key={feat.title}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-2 shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <i className={`${feat.icon} text-lg`} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 truncate">{feat.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    {feat.version}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {feat.badge}
                  </span>
                </div>
              </div>

              {/* Visual illustration badges */}
              {feat.illustration === 'indexeddb' && (
                <div className="h-12 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between px-3 text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-mono">
                    <i className="bx bx-shield-quarter text-emerald-400 text-base" />
                    <span className="text-[11px]">IndexedDB Data Isolation</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Zero Data-Leak
                  </span>
                </div>
              )}

              {feat.illustration === 'multilingual' && (
                <div className="h-12 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between px-3 text-xs text-cyan-300 font-mono">
                  <span className="text-[11px]">texts/*.lang + languages.json</span>
                  <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200">
                    12 Idiomas
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <span>Entendido y Continuar</span>
            <i className="bx bx-check text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

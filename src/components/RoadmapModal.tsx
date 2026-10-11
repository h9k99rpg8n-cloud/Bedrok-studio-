import React from 'react';
import { X, Box, Bot, FileCode, Sword, CheckCircle, Clock } from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const modules = [
    {
      title: '🧱 Creador y Editor de Bloques',
      status: 'active',
      badge: 'Listo en este Prototipo',
      desc: 'Texturizado táctil 16x16, propiedades de minería, fricción, resistencia, emisión de luz, vista 3D interactiva y exportación automática a .mcaddon.',
      icon: Box,
      accent: 'emerald',
    },
    {
      title: '👾 Editor de Entidades y Mobs',
      status: 'upcoming',
      badge: 'Próxima Versión',
      desc: 'Editor de modelos 3D basados en cajas (.geo.json), texturizado de skins de mobs, comportamientos de IA (minecraft:behavior.*), spawns y familias.',
      icon: Bot,
      accent: 'indigo',
    },
    {
      title: '📜 Editor de Scripts Bedrock & Molang',
      status: 'upcoming',
      badge: 'Próxima Versión',
      desc: 'IDE móvil con resaltado de sintaxis para scripts JavaScript de Minecraft Server API (@minecraft/server) y fórmulas matemáticas de animación Molang (query.*).',
      icon: FileCode,
      accent: 'amber',
    },
    {
      title: '⚔️ Creador de Ítems y Herramientas',
      status: 'upcoming',
      badge: 'Próxima Versión',
      desc: 'Espadas personalizadas, picos, comida con efectos de pociones, armaduras con atributos y recetas de crafteo en mesa de trabajo.',
      icon: Sword,
      accent: 'purple',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100">Visión All-in-One IDE</h2>
            <p className="text-xs text-slate-400">Hoja de ruta para el desarrollo completo de Add-ons</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = m.status === 'active';
            return (
              <div
                key={m.title}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{m.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isActive ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-400" />
                    )}
                    {m.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-9">{m.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Este prototipo ya produce archivos <code className="text-emerald-400 font-mono">.mcaddon</code> 100% compatibles con Minecraft Bedrock 1.20 y 1.21.
          </p>
        </div>
      </div>
    </div>
  );
};

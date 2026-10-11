import React, { useState } from 'react';

interface BlockTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEditor: () => void;
}

export const BlockTutorialModal: React.FC<BlockTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartEditor,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Nombre e Identificador Único',
      subtitle: 'La clave técnica de tu bloque',
      desc: 'Elige un nombre amigable para el jugador (ej. "Mineral de Rubí") y un identificador técnico único en minúsculas (ej. "ruby_ore"). El juego creará el bloque como "custom:ruby_ore".',
      icon: 'bx bx-id-card',
      color: 'emerald',
    },
    {
      title: '2. Atlas de Texturas (1, 3 o 6 caras)',
      subtitle: 'Asignación visual por cada lado del cubo',
      desc: 'Puedes asignar una textura idéntica a todo el cubo, separar caras superior/inferior/lados (como la tierra con césped), o personalizar individualmente las 6 caras con el atlas interactivo desplegado.',
      icon: 'bx bxs-cube-alt',
      color: 'cyan',
    },
    {
      title: '3. Propiedades Físicas y Redstone',
      subtitle: 'Comportamiento en el mundo',
      desc: 'Configura la dureza de minado, resistencia a explosiones, iluminación continua de 0 a 15 y conectividad con circuitos de redstone mediante paneles desplegables.',
      icon: 'bx bxs-zap',
      color: 'amber',
    },
    {
      title: '4. Partículas al Romper y al Pisar',
      subtitle: 'Efectos inmersivos de partículas',
      desc: 'Añade partículas cuando el jugador rompe el bloque, o chispas automáticas cuando una entidad camina por encima usando el componente de Script API integrado.',
      icon: 'bx bxs-sparkles',
      color: 'purple',
    },
    {
      title: '5. Diagnóstico y Exportación Directa',
      subtitle: 'Cero errores de sintaxis',
      desc: 'El sistema de diagnóstico audita identificadores, texturas y UUIDs antes de empaquetar el archivo .mcaddon listo para importar en Minecraft Bedrock.',
      icon: 'bx bxs-check-shield',
      color: 'emerald',
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[460px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-200">Tutorial de Creación de Bloques</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            Omitir
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <i className={`${current.icon} text-4xl`} />
          </div>

          <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase mb-1">
            Paso {step + 1} de {steps.length}
          </span>
          <h3 className="text-sm font-bold text-slate-100 mb-1">{current.title}</h3>
          <span className="text-xs text-slate-400 mb-3">{current.subtitle}</span>
          <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
            {current.desc}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  step === i ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="min-h-[44px] px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
              >
                <span>Siguiente</span>
                <i className="bx bx-right-arrow-alt text-base" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartEditor();
                }}
                className="min-h-[44px] px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
              >
                <i className="bx bx-check text-base" />
                <span>Abrir Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

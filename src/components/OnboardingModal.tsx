import React, { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: 'Bloque de Tierra y Terreno',
      badge: 'Minecraft Bedrock 1.26.52',
      desc: 'Crea nuevos bloques para tu mundo con IDs limpios, nombres en español y asignación de texturas instantáneas sin límite de resolución.',
      iconClass: 'bx bxs-cube',
      artType: 'dirt_block',
    },
    {
      title: 'Pico de Madera y Minería',
      badge: 'Física y Destrucción',
      desc: 'Configura la resistencia a minado, comportamiento ante explosiones y propiedades de redstone en un flujo táctil guiado paso a paso.',
      iconClass: 'fa-solid fa-screwdriver-wrench',
      artType: 'wood_pickaxe',
    },
    {
      title: 'Lobo y Mobs Compañeros',
      badge: 'Carpetas Infinitas',
      desc: 'Guarda múltiples Addons organizados en carpetas ilimitadas directamente en la base de datos IndexedDB de tu móvil.',
      iconClass: 'bx bxs-folder',
      artType: 'wolf_mob',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[490px]">
        {/* Version Badge Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-xs font-bold tracking-wide text-slate-200">Bedrock Studio v0.1.1</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800"
          >
            Saltar
          </button>
        </div>

        {/* Slide Visual Presentation */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          {/* Minecraft Pixel Art Avatar */}
          <div className="w-28 h-28 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-inner relative overflow-hidden">
            {slides[currentSlide].artType === 'dirt_block' && (
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-amber-900/60 shadow-lg flex flex-col">
                {/* Grass top */}
                <div className="h-6 bg-emerald-600 flex items-center justify-center border-b border-emerald-700">
                  <div className="w-full h-1 bg-emerald-500" />
                </div>
                {/* Dirt bottom */}
                <div className="flex-1 bg-amber-800 p-1 grid grid-cols-3 gap-0.5 opacity-90">
                  <span className="bg-amber-900 rounded-sm" />
                  <span className="bg-amber-700 rounded-sm" />
                  <span className="bg-amber-900 rounded-sm" />
                  <span className="bg-amber-700 rounded-sm" />
                  <span className="bg-amber-900 rounded-sm" />
                  <span className="bg-amber-800 rounded-sm" />
                </div>
              </div>
            )}

            {slides[currentSlide].artType === 'wood_pickaxe' && (
              <div className="flex flex-col items-center justify-center text-amber-500">
                <i className="fa-solid fa-hammer text-4xl mb-1 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-300 font-bold">PICO DE MADERA</span>
              </div>
            )}

            {slides[currentSlide].artType === 'wolf_mob' && (
              <div className="flex flex-col items-center justify-center text-slate-200">
                <i className="fa-solid fa-shield-dog text-4xl mb-1 text-slate-300" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">LOBO COMPAÑERO</span>
              </div>
            )}
          </div>

          <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase mb-1">
            {slides[currentSlide].badge}
          </span>
          <h3 className="text-base font-bold text-slate-100 mb-2">{slides[currentSlide].title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
            {slides[currentSlide].desc}
          </p>
        </div>

        {/* v0.1.1 Improvements Banner */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 mb-4 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
            <i className="bx bxs-check-shield text-sm" />
            <span>Mejoras de la versión v0.1.1</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li>Motor compatible con Minecraft Bedrock 1.26.52.</li>
            <li>Almacenamiento permanente en IndexedDB sin LocalStorage.</li>
            <li>Interruptores táctiles de 16px diseñados para iPhone y Safari.</li>
          </ul>
        </div>

        {/* Carousel Dots & Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <span>{currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}</span>
            <i className="bx bx-right-arrow-alt text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface ReleasePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  { icon: 'bx bx-palette', title: 'Diseño renovado', text: 'Tarjetas más claras, colores con mejor contraste y controles táctiles más cómodos.', color: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/30', iconColor: 'text-emerald-300' },
  { icon: 'bx bx-map', title: 'Color del mapa', text: 'Elige un color hexadecimal y consulta una muestra visual antes de guardar el bloque.', color: 'from-cyan-500/20 to-blue-500/5', border: 'border-cyan-500/30', iconColor: 'text-cyan-300' },
  { icon: 'bx bx-cube-alt', title: 'Visor 3D mejorado', text: 'Ajusta el zoom con más precisión y abre el visor de cajas en pantalla completa.', color: 'from-violet-500/20 to-indigo-500/5', border: 'border-violet-500/30', iconColor: 'text-violet-300' },
  { icon: 'bx bx-grid-alt', title: 'Recetas y minerales', text: 'Continúa usando la mesa de trabajo 3×3 y las opciones de botín mineral que ya forman parte del editor.', color: 'from-amber-500/20 to-orange-500/5', border: 'border-amber-500/30', iconColor: 'text-amber-300' },
  { icon: 'bx bx-mobile-landscape', title: 'Vertical y horizontal', text: 'La interfaz se adapta mejor a pantallas estrechas, tabletas y ventanas apaisadas.', color: 'from-pink-500/20 to-rose-500/5', border: 'border-pink-500/30', iconColor: 'text-pink-300' },
  { icon: 'bx bx-slider-alt', title: 'Tus herramientas siguen aquí', text: 'Identidad, texturas, propiedades, cajas, comportamientos, grupos y exportación permanecen en el flujo habitual.', color: 'from-slate-500/20 to-slate-800/5', border: 'border-slate-700', iconColor: 'text-slate-200' },
];

export const ReleasePreviewModal: React.FC<ReleasePreviewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#030711]/90 backdrop-blur-xl p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="release-preview-title" className="relative w-full max-w-3xl max-h-[94dvh] overflow-y-auto rounded-[28px] border border-emerald-400/25 bg-[#0b1220] shadow-2xl shadow-emerald-950/40">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 border-b border-slate-800">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 shadow-lg shadow-emerald-950/30">
              <i className="bx bxs-cube text-3xl text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Nueva versión
              </span>
              <h2 id="release-preview-title" className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">Bedrock Studio</h2>
              <p className="mt-1 text-sm sm:text-base font-bold text-emerald-300">1.8 Beta Preview</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Una actualización centrada en una experiencia más visual, controles más cómodos y una vista previa del color que tendrá tu bloque en el mapa.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-6">
          {features.map((feature) => (
            <article key={feature.title} className={`rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} p-4 min-w-0`}>
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 ${feature.iconColor}`}>
                <i className={`${feature.icon} text-xl`} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-100">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{feature.text}</p>
            </article>
          ))}
        </div>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-[11px] leading-relaxed text-slate-400">
            <i className="bx bx-info-circle mr-1 text-cyan-300" /> Esta presentación se muestra una vez en este navegador o dispositivo. Si borras los datos de la app o cambias de dispositivo, puede aparecer de nuevo. La animación de bloques queda reservada para la versión 2.0.
          </div>
          <button type="button" onClick={onClose} className="mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:brightness-105 active:scale-[.99]">
            <i className="bx bx-rocket text-lg" /> Empezar a crear <i className="bx bx-right-arrow-alt text-lg" />
          </button>
        </div>
      </section>
    </div>
  );
};

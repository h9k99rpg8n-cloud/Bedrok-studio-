import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { VisualBehaviorProgram, VisualBehaviorAction } from '../types/addon';

interface VisualBehaviorEditorProps {
  isOpen: boolean;
  title: string;
  initialProgram?: VisualBehaviorProgram;
  onClose: () => void;
  onSave: (program: VisualBehaviorProgram) => void;
}

const newAction = (): VisualBehaviorAction => ({
  id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type: 'play_sound',
  value: 'random.click',
});

const DEFAULT_PROGRAM: VisualBehaviorProgram = {
  enabled: false,
  event: 'on_use',
  condition: 'always',
  actions: [{ id: 'act_default', type: 'play_sound', value: 'random.click' }],
};

const actionNames: Record<VisualBehaviorAction['type'], string> = {
  play_sound: 'Reproducir sonido',
  spawn_particle: 'Crear partícula',
  send_message: 'Mostrar mensaje al jugador',
};

export const VisualBehaviorEditor: React.FC<VisualBehaviorEditorProps> = ({
  isOpen, title, initialProgram, onClose, onSave,
}) => {
  const [program, setProgram] = useState<VisualBehaviorProgram>(() => ({
    ...DEFAULT_PROGRAM,
    ...initialProgram,
    actions: initialProgram?.actions?.map((action) => ({ ...action })) || DEFAULT_PROGRAM.actions.map((action) => ({ ...action })),
  }));
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    setProgram({
      ...DEFAULT_PROGRAM,
      ...initialProgram,
      actions: initialProgram?.actions?.map((action) => ({ ...action })) || DEFAULT_PROGRAM.actions.map((action) => ({ ...action })),
    });
    setError('');
  }, [isOpen, initialProgram]);

  const validation = useMemo(() => {
    if (!program.actions.length) return 'Agrega al menos una acción.';
    if (program.actions.some((action) => !action.value.trim())) return 'Completa el valor de cada acción.';
    if (program.actions.some((action) => action.type === 'send_message' && action.value.length > 120)) return 'Los mensajes deben tener 120 caracteres o menos.';
    return '';
  }, [program]);

  if (!isOpen) return null;

  const updateAction = (id: string, patch: Partial<VisualBehaviorAction>) => {
    setProgram((current) => ({ ...current, actions: current.actions.map((action) => action.id === id ? { ...action, ...patch } : action) }));
  };
  const moveAction = (index: number, offset: number) => {
    setProgram((current) => {
      const next = [...current.actions];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, actions: next };
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#070b12] text-slate-100 flex flex-col animate-in fade-in duration-150">
      <header className="shrink-0 border-b border-white/10 bg-[#0b111b] px-3 sm:px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-emerald-300">
          <Sparkles size={21} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm sm:text-base truncate">Programación visual</h2>
          <p className="text-[11px] text-slate-400 truncate">{title} · Beta 1</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar editor" className="w-10 h-10 rounded-xl border border-white/10 bg-slate-900 flex items-center justify-center text-slate-300"><X size={19}/></button>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm"><Sparkles size={17}/> Flujo de comportamiento</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Elige cuándo se ejecuta, una condición y después ordena las acciones. Los bloques visuales se convertirán en lógica del complemento al exportar.</p>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-[#0c121d] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-sky-400/15 text-sky-300 flex items-center justify-center text-xs font-black">1</span><h3 className="font-bold text-sm">Evento de inicio</h3></div>
            <label className="text-xs text-slate-400">¿Cuándo se ejecuta este flujo?</label>
            <select value={program.event} onChange={(e) => setProgram((p) => ({ ...p, event: e.target.value as VisualBehaviorProgram['event'] }))} className="w-full min-h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm focus:outline-none focus:border-emerald-400">
              <option value="on_use">Al usar / interactuar</option>
              <option value="on_step_on">Al pisar el bloque</option>
              <option value="on_step_off">Al dejar de pisar el bloque</option>
            </select>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0c121d] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-violet-400/15 text-violet-300 flex items-center justify-center text-xs font-black">2</span><h3 className="font-bold text-sm">Condición</h3></div>
            <label className="text-xs text-slate-400">Regla que debe cumplirse antes de ejecutar las acciones</label>
            <select value={program.condition} onChange={(e) => setProgram((p) => ({ ...p, condition: e.target.value as VisualBehaviorProgram['condition'] }))} className="w-full min-h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm focus:outline-none focus:border-emerald-400">
              <option value="always">Siempre</option>
              <option value="sneaking">Solo si el jugador está agachado</option>
            </select>
            <p className="text-[11px] text-slate-500">La condición de agacharse se aplica a eventos de interacción con jugador. En eventos donde Minecraft no proporciona un jugador, la validación del exportador avisará.</p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0c121d] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center text-xs font-black">3</span><h3 className="font-bold text-sm">Acciones</h3></div>
              <button type="button" onClick={() => setProgram((p) => ({ ...p, actions: [...p.actions, newAction()] }))} className="min-h-10 px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"><Plus size={15}/> Añadir</button>
            </div>
            {program.actions.map((action, index) => (
              <div key={action.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-300 flex items-center justify-center text-xs font-black">{index + 1}</span>
                  <select aria-label={`Tipo de acción ${index + 1}`} value={action.type} onChange={(e) => updateAction(action.id, { type: e.target.value as VisualBehaviorAction['type'], value: e.target.value === 'play_sound' ? 'random.click' : e.target.value === 'spawn_particle' ? 'minecraft:basic_flame_particle' : '¡Comportamiento activado!' })} className="flex-1 min-h-10 min-w-0 rounded-lg bg-slate-900 border border-slate-700 px-2 text-xs">
                    {Object.entries(actionNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Subir acción" disabled={index === 0} onClick={() => moveAction(index, -1)} className="w-9 h-9 rounded-lg border border-slate-700 disabled:opacity-30 flex items-center justify-center"><ArrowUp size={15}/></button>
                    <button type="button" aria-label="Bajar acción" disabled={index === program.actions.length - 1} onClick={() => moveAction(index, 1)} className="w-9 h-9 rounded-lg border border-slate-700 disabled:opacity-30 flex items-center justify-center"><ArrowDown size={15}/></button>
                    <button type="button" aria-label="Eliminar acción" disabled={program.actions.length === 1} onClick={() => setProgram((p) => ({ ...p, actions: p.actions.filter((a) => a.id !== action.id) }))} className="w-9 h-9 rounded-lg border border-rose-500/20 text-rose-300 disabled:opacity-30 flex items-center justify-center"><Trash2 size={15}/></button>
                  </div>
                </div>
                <label className="text-[11px] text-slate-400">{action.type === 'play_sound' ? 'Identificador del sonido' : action.type === 'spawn_particle' ? 'Identificador de la partícula' : 'Texto del mensaje'}</label>
                <input value={action.value} onChange={(e) => updateAction(action.id, { value: e.target.value })} maxLength={action.type === 'send_message' ? 120 : 100} placeholder={action.type === 'send_message' ? '¡Hola, jugador!' : action.type === 'play_sound' ? 'random.click' : 'minecraft:basic_flame_particle'} className="w-full min-h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs font-mono focus:outline-none focus:border-emerald-400"/>
                <p className="text-[10px] text-slate-500">{action.type === 'play_sound' ? 'Ejemplo: random.click, random.pop' : action.type === 'spawn_particle' ? 'Usa un identificador de partícula existente en Minecraft.' : 'Mensaje que verá el jugador que active el evento.'}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0c121d] p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 size={17} className={validation ? 'text-amber-300' : 'text-emerald-300'}/>{validation ? 'Revisar antes de guardar' : 'Flujo válido'}</div>
            <p className="text-xs text-slate-400 mt-1">{validation || `${program.actions.length} acción(es) en orden · Evento: ${program.event} · Condición: ${program.condition}`}</p>
          </section>
          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs p-3">{error}</p>}
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-[#0b111b] p-3 sm:px-5 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-300 min-h-10"><input type="checkbox" checked={program.enabled} onChange={(e) => setProgram((p) => ({ ...p, enabled: e.target.checked }))} className="accent-emerald-400 w-4 h-4"/> Activar comportamiento</label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border border-slate-700 text-xs font-semibold">Cancelar</button>
          <button type="button" onClick={() => { if (validation) { setError(validation); return; } onSave(program); onClose(); }} className="min-h-11 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">Guardar flujo</button>
        </div>
      </footer>
    </div>
  );
};

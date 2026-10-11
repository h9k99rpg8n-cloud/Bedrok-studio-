import React from 'react';
import { BlockProperties, BlockSound, BlockRenderMethod } from '../types/bedrock';
import {
  Pickaxe,
  Bomb,
  Sparkles,
  Volume2,
  Layers,
  Flame,
  FlameKindling,
  Sliders,
  MapPin,
} from 'lucide-react';

interface BlockPropertiesEditorProps {
  identifier: string;
  displayName: string;
  properties: BlockProperties;
  onIdentifierChange: (id: string) => void;
  onDisplayNameChange: (name: string) => void;
  onPropertiesChange: (props: BlockProperties) => void;
}

export const BlockPropertiesEditor: React.FC<BlockPropertiesEditorProps> = ({
  identifier,
  displayName,
  properties,
  onIdentifierChange,
  onDisplayNameChange,
  onPropertiesChange,
}) => {
  const updateProp = <K extends keyof BlockProperties>(key: K, value: BlockProperties[K]) => {
    onPropertiesChange({
      ...properties,
      [key]: value,
    });
  };

  // Quick behavior presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'ore':
        onPropertiesChange({
          ...properties,
          destroyTime: 3.0,
          explosionResistance: 6.0,
          friction: 0.4,
          lightEmission: 0,
          lightDampening: 15,
          sound: 'stone',
          renderMethod: 'opaque',
          flammable: false,
        });
        break;
      case 'lamp':
        onPropertiesChange({
          ...properties,
          destroyTime: 0.3,
          explosionResistance: 1.5,
          friction: 0.4,
          lightEmission: 15,
          lightDampening: 1,
          sound: 'glass',
          renderMethod: 'opaque',
          flammable: false,
        });
        break;
      case 'ice':
        onPropertiesChange({
          ...properties,
          destroyTime: 0.5,
          explosionResistance: 0.5,
          friction: 0.98,
          lightEmission: 0,
          lightDampening: 2,
          sound: 'glass',
          renderMethod: 'blend',
          flammable: false,
        });
        break;
      case 'obsidian':
        onPropertiesChange({
          ...properties,
          destroyTime: 25.0,
          explosionResistance: 100.0,
          friction: 0.4,
          lightEmission: 0,
          lightDampening: 15,
          sound: 'stone',
          renderMethod: 'opaque',
          flammable: false,
        });
        break;
      case 'slime':
        onPropertiesChange({
          ...properties,
          destroyTime: 0.2,
          explosionResistance: 0.0,
          friction: 0.85,
          lightEmission: 0,
          lightDampening: 3,
          sound: 'slime',
          renderMethod: 'blend',
          flammable: false,
        });
        break;
    }
  };

  const SOUND_OPTIONS: { label: string; value: BlockSound }[] = [
    { label: '🪨 Piedra (Stone)', value: 'stone' },
    { label: '🪵 Madera (Wood)', value: 'wood' },
    { label: '🔩 Metal', value: 'metal' },
    { label: '🪟 Cristal (Glass)', value: 'glass' },
    { label: '🌿 Césped (Grass)', value: 'grass' },
    { label: '🟢 Slime', value: 'slime' },
    { label: '🏖️ Arena (Sand)', value: 'sand' },
    { label: '🧶 Lana (Wool)', value: 'wool' },
    { label: '💎 Amatista', value: 'amethyst' },
    { label: '🛡️ Netherite', value: 'netherite' },
  ];

  const RENDER_METHODS: { label: string; value: BlockRenderMethod; desc: string }[] = [
    { label: 'Opaco (Opaque)', value: 'opaque', desc: 'Bloque sólido convencional' },
    { label: 'Mezcla (Blend)', value: 'blend', desc: 'Cristal o hielo semitransparente' },
    { label: 'Recorte (Alpha Test)', value: 'alpha_test', desc: 'Hojas, flores o vidrio transparente' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Basic Identity Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200">Identidad en Minecraft Bedrock</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre en Pantalla (Español / Inglés)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Ej: Bloque de Rubí"
              className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Se mostrará al apuntar al bloque en el juego.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Identificador Técnico (ID)
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
              <span className="px-2.5 text-xs text-slate-400 font-mono select-none">custom:</span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                  onIdentifierChange(cleaned);
                }}
                placeholder="ruby_block"
                className="w-full min-h-[44px] pr-3 bg-transparent text-sm font-mono text-emerald-300 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Usado para <code className="text-slate-300 font-mono">/give @s custom:{identifier || 'nombre'}</code>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Behavior Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg">
        <span className="text-xs font-bold text-slate-200">Ajustes Predefinidos de Juego</span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('ore')}
            className="min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left text-xs text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">⛏️ Mineral</div>
            <div className="text-[10px] text-slate-400">Piedra, 3s picado</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('lamp')}
            className="min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left text-xs text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">💡 Lámpara</div>
            <div className="text-[10px] text-slate-400">Luz 15, Cristal</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ice')}
            className="min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left text-xs text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">🧊 Hielo</div>
            <div className="text-[10px] text-slate-400">Fricción 0.98</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('obsidian')}
            className="min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left text-xs text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">🛡️ Obsidiana</div>
            <div className="text-[10px] text-slate-400">25s picado, Antiexplosión</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('slime')}
            className="min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-lime-500/50 text-left text-xs text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">🟢 Gelatina</div>
            <div className="text-[10px] text-slate-400">Rebotador/Slime</div>
          </button>
        </div>
      </div>

      {/* Physics & Interaction Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
        <h4 className="text-xs font-bold text-slate-200 pb-1 border-b border-slate-800">
          Física y Resistencia del Bloque
        </h4>

        {/* Mining Hardness */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Pickaxe className="w-4 h-4 text-amber-400" />
              Tiempo de Picado / Destrucción
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {properties.destroyTime.toFixed(1)} segundos
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={30.0}
            step={0.1}
            value={properties.destroyTime}
            onChange={(e) => updateProp('destroyTime', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 min-h-[36px]"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Rápido (Tierra 0.5s)</span>
            <span>Estándar (Piedra 1.5s)</span>
            <span>Duro (Hierro 3.0s)</span>
            <span>Pesado (Obsidiana 25s+)</span>
          </div>
        </div>

        {/* Explosion Resistance */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Bomb className="w-4 h-4 text-rose-400" />
              Resistencia a Explosiones (TNT / Creepers)
            </span>
            <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {properties.explosionResistance.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={properties.explosionResistance}
            onChange={(e) => updateProp('explosionResistance', parseFloat(e.target.value))}
            className="w-full accent-rose-500 min-h-[36px]"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Frágil (Cristal 0.3)</span>
            <span>Medio (Piedra 6.0)</span>
            <span>Robusto (Metal 30.0)</span>
            <span>Inmune (Búnker 100)</span>
          </div>
        </div>

        {/* Light Emission */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Emisión de Luz (Brillo)
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              Nivel {properties.lightEmission} / 15
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={1}
            value={properties.lightEmission}
            onChange={(e) => updateProp('lightEmission', parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 min-h-[36px]"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 (Oscuro)</span>
            <span>7 (Redstone)</span>
            <span>12 (Fuego)</span>
            <span>15 (Lámpara / Sol)</span>
          </div>
        </div>

        {/* Friction (Slipperiness) */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              ⛸️ Fricción (Resbalamiento)
            </span>
            <span className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {properties.friction.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.02}
            value={properties.friction}
            onChange={(e) => updateProp('friction', parseFloat(e.target.value))}
            className="w-full accent-sky-400 min-h-[36px]"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.1 (Pegajoso)</span>
            <span>0.4 (Caminar Normal)</span>
            <span>0.8 (Resbaladizo)</span>
            <span>0.98 (Hielo Azul)</span>
          </div>
        </div>
      </div>

      {/* Visual, Audio and Render Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
        <h4 className="text-xs font-bold text-slate-200 pb-1 border-b border-slate-800">
          Aspecto y Efectos de Sonido
        </h4>

        {/* Sound Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            Efectos de Sonido (Paso, Rotura y Colocación)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {SOUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateProp('sound', opt.value)}
                className={`min-h-[44px] px-2.5 py-1.5 text-xs rounded-xl border text-left transition-colors ${
                  properties.sound === opt.value
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render Method */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Método de Renderizado
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {RENDER_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => updateProp('renderMethod', m.value)}
                className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-colors ${
                  properties.renderMethod === m.value
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">{m.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Map Color */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-xs font-medium text-slate-300">Color en Mapas de Bedrock</div>
              <div className="text-[11px] text-slate-400">Tinte al explorar con mapas en el juego</div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span
              className="w-5 h-5 rounded-md border border-white/20 shadow-inner"
              style={{ backgroundColor: properties.mapColor }}
            />
            <span className="text-xs font-mono uppercase text-slate-300">{properties.mapColor}</span>
            <input
              type="color"
              value={properties.mapColor}
              onChange={(e) => updateProp('mapColor', e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        {/* Flammability */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-xs font-medium text-slate-300">Inflamable (Arde con Fuego)</div>
              <div className="text-[11px] text-slate-400">¿El fuego se propaga y lo consume?</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateProp('flammable', !properties.flammable)}
            className={`min-h-[44px] min-w-[70px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              properties.flammable
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {properties.flammable ? 'Sí (Arde)' : 'No'}
          </button>
        </div>
      </div>
    </div>
  );
};

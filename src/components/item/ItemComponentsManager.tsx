import React from 'react';
import { ItemCustomComponentConfig } from '../../types/item';

interface ItemComponentsManagerProps {
  components: ItemCustomComponentConfig[];
  onChange: (components: ItemCustomComponentConfig[]) => void;
}

const AVAILABLE_ITEM_COMPONENTS: Array<{
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue: boolean | string | number;
}> = [
  {
    id: 'minecraft:interact_button',
    name: 'Botón de interacción táctil',
    description: 'Texto que aparece en el botón de acción en móviles (ej. "Beber", "Activar", "Lanzar").',
    type: 'string',
    defaultValue: 'Usar',
  },
  {
    id: 'minecraft:hover_text_color',
    name: 'Color del título (Hover Text)',
    description: 'Color oficial Bedrock del nombre (ej. "gold", "aqua", "light_purple", "green").',
    type: 'string',
    defaultValue: 'yellow',
  },
  {
    id: 'minecraft:can_destroy_in_creative',
    name: 'Destrucción en Creativo',
    description: 'Permite o impide romper bloques cuando el jugador está en modo creativo.',
    type: 'boolean',
    defaultValue: true,
  },
  {
    id: 'minecraft:tags',
    name: 'Etiquetas de Ítem (Tags)',
    description: 'Lista de etiquetas separadas por comas para comandos y recetas (ej. "minecraft:is_food, custom:runic").',
    type: 'string',
    defaultValue: 'custom:item',
  },
  {
    id: 'minecraft:repairable',
    name: 'Reparable en yunque',
    description: 'Identificador del material necesario para reparar este ítem en el yunque.',
    type: 'string',
    defaultValue: 'minecraft:iron_ingot',
  },
];

export const ItemComponentsManager: React.FC<ItemComponentsManagerProps> = ({
  components,
  onChange,
}) => {
  const isEnabled = (id: string) => components.some((c) => c.id === id && c.enabled);

  const getComponent = (id: string) => components.find((c) => c.id === id);

  const toggleComponent = (itemDef: typeof AVAILABLE_ITEM_COMPONENTS[0]) => {
    const existing = components.find((c) => c.id === itemDef.id);
    if (existing) {
      onChange(
        components.map((c) =>
          c.id === itemDef.id ? { ...c, enabled: !c.enabled } : c
        )
      );
    } else {
      onChange([
        ...components,
        {
          id: itemDef.id,
          name: itemDef.name,
          description: itemDef.description,
          enabled: true,
          value: itemDef.defaultValue,
        },
      ]);
    }
  };

  const updateValue = (id: string, value: string | number | boolean) => {
    onChange(
      components.map((c) => (c.id === id ? { ...c, value } : c))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
        Los <strong>Componentes Bedrock</strong> definen cómo interactúa Minecraft con tu ítem en controles táctiles, interfaz y comandos.
      </div>

      <div className="flex flex-col gap-2.5">
        {AVAILABLE_ITEM_COMPONENTS.map((itemDef) => {
          const enabled = isEnabled(itemDef.id);
          const current = getComponent(itemDef.id);

          return (
            <div
              key={itemDef.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                enabled
                  ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{itemDef.name}</span>
                    <code className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {itemDef.id}
                    </code>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {itemDef.description}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleComponent(itemDef)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full after:content-[''] after:absolute after:top-[10px] after:left-[5px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* Value Input when enabled */}
              {enabled && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-300 shrink-0">
                    Configuración:
                  </span>
                  {itemDef.type === 'string' && (
                    <input
                      type="text"
                      value={String(current?.value ?? itemDef.defaultValue)}
                      onChange={(e) => updateValue(itemDef.id, e.target.value)}
                      placeholder={String(itemDef.defaultValue)}
                      className="flex-1 min-h-[38px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                  {itemDef.type === 'boolean' && (
                    <button
                      type="button"
                      onClick={() => updateValue(itemDef.id, !current?.value)}
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-bold border transition-colors ${
                        current?.value
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {current?.value ? 'Activado (True)' : 'Desactivado (False)'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

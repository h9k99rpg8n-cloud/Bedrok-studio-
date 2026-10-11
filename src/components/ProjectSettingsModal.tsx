import React from 'react';
import { AddonProject } from '../types/bedrock';
import { generateBedrockUUID } from '../utils/uuid';
import { Settings, X, RefreshCw, Box } from 'lucide-react';

interface ProjectSettingsModalProps {
  project: AddonProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: AddonProject) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const handleRegenerateUuids = () => {
    onUpdate({
      ...project,
      bpUuid: generateBedrockUUID(),
      rpUuid: generateBedrockUUID(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Configuración del Add-on</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre del Add-on
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => onUpdate({ ...project, name: e.target.value })}
              className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="Ej: Mis Bloques Personalizados"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Namespace Técnico (Prefijo único)
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
              <span className="px-3 text-xs text-slate-400 select-none">prefijo:</span>
              <input
                type="text"
                value={project.namespace}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  onUpdate({ ...project, namespace: val || 'custom' });
                }}
                className="w-full min-h-[44px] pr-3 bg-transparent text-sm font-mono text-emerald-300 focus:outline-none"
                placeholder="custom"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Todos tus bloques tendrán el formato <code className="text-slate-300 font-mono">{project.namespace}:id_bloque</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Descripción del Paquete
            </label>
            <textarea
              rows={2}
              value={project.description}
              onChange={(e) => onUpdate({ ...project, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Descripción visible en el menú de paquetes de Minecraft"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Autor / Creador
              </label>
              <input
                type="text"
                value={project.author}
                onChange={(e) => onUpdate({ ...project, author: e.target.value })}
                className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="Tu Gamertag o Nick"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Versión del Add-on
              </label>
              <input
                type="text"
                value={project.version.join('.')}
                onChange={(e) => {
                  const parts = e.target.value.split('.').map((p) => parseInt(p, 10) || 0);
                  const ver: [number, number, number] = [parts[0] || 1, parts[1] || 0, parts[2] || 0];
                  onUpdate({ ...project, version: ver });
                }}
                className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="1.0.0"
              />
            </div>
          </div>

          {/* UUIDs section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Identificadores UUID del Manifiesto</span>
              <button
                type="button"
                onClick={handleRegenerateUuids}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                title="Generar nuevos UUIDs"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerar UUIDs
              </button>
            </div>
            <div className="text-[10px] font-mono text-slate-400 space-y-1">
              <div>BP: <span className="text-slate-300">{project.bpUuid}</span></div>
              <div>RP: <span className="text-slate-300">{project.rpUuid}</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

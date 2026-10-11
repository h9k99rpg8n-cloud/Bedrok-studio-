import React, { useState, useRef, useEffect } from 'react';
import { AddonProject } from '../types/addon';
import { generateBedrockUUID } from '../utils/uuid';

interface ManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: AddonProject) => void;
  initialProject?: AddonProject | null;
}

export const ManifestModal: React.FC<ManifestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [version, setVersion] = useState(initialProject?.version || '1.0.0');
  const [minEngineVersion, setMinEngineVersion] = useState(initialProject?.minEngineVersion || '1.26.20');
  const [iconDataUrl, setIconDataUrl] = useState(initialProject?.iconDataUrl || '');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state cleanly whenever modal opens or target project changes
  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        setName(initialProject.name || '');
        setDescription(initialProject.description || '');
        setVersion(initialProject.version || '1.0.0');
        setMinEngineVersion(initialProject.minEngineVersion || '1.26.20');
        setIconDataUrl(initialProject.iconDataUrl || '');
      } else {
        setName('');
        setDescription('');
        setVersion('1.0.0');
        setMinEngineVersion('1.26.20');
        setIconDataUrl('');
      }
      setErrorMessage('');
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor sube un archivo de imagen válido (PNG/JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setIconDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('El nombre del complemento es obligatorio.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('La descripción del complemento es obligatoria.');
      return;
    }

    const project: AddonProject = {
      id: initialProject?.id || `project_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      version: version.trim() || '1.0.0',
      minEngineVersion: minEngineVersion.trim() || '1.26.20',
      iconDataUrl,
      bpUuid: initialProject?.bpUuid || generateBedrockUUID(),
      rpUuid: initialProject?.rpUuid || generateBedrockUUID(),
      createdAt: initialProject?.createdAt || Date.now(),
      updatedAt: Date.now(),
      usedCount: initialProject?.usedCount || 0,
      blocks: initialProject?.blocks || [],
      textures: initialProject?.textures || [],
    };

    onSave(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <i className="bx bxs-file-doc text-xl text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              {initialProject ? 'Editar Manifiesto' : 'Nuevo Addon — Manifiesto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <i className="bx bx-error-circle text-base" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">
          {/* Icon Upload with Preview */}
          <div className="flex items-center gap-3.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
              {iconDataUrl ? (
                <img
                  src={iconDataUrl}
                  alt="Icono del Addon"
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="bx bxs-image text-2xl text-slate-600" />
              )}
            </div>

            <div className="flex-1">
              <span className="block text-xs font-semibold text-slate-200 mb-1">
                Icono del Addon (pack_icon)
              </span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <i className="bx bx-upload text-sm text-emerald-400" />
                <span>Subir Imagen</span>
              </button>
            </div>
          </div>

          {/* Nombre del complemento */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del Complemento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Ej: Poppicraft Addon"
              className="w-full min-h-[46px] px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción en el Juego *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Descripción visible en Ajustes de Mundo de Minecraft"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Versiones */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Versión del Addon
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Minecraft Mínimo
              </label>
              <input
                type="text"
                value={minEngineVersion}
                onChange={(e) => setMinEngineVersion(e.target.value)}
                placeholder="1.26.20"
                className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Compatible con Minecraft Bedrock 1.26.20 y versión estable 1.26.52.
          </span>

          {/* APIs Section (Visually Locked) */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/90 flex flex-col gap-2 opacity-85">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <i className="bx bx-code-alt text-emerald-400" />
                Módulos de Script API
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                <i className="fa-solid fa-lock text-[9px]" />
                Bloqueado v0.1.1
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                <span className="font-mono text-[11px]">@minecraft/server (v1.14.0)</span>
                <i className="bx bx-lock-alt text-slate-400" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                <span className="font-mono text-[11px]">@minecraft/server-ui (v1.3.0)</span>
                <i className="bx bx-lock-alt text-slate-400" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <i className="bx bxs-save text-base" />
              <span>{initialProject ? 'Actualizar Manifiesto' : 'Crear Addon'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

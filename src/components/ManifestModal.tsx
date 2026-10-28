import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AddonProject } from '../types/addon';
import { generateBedrockUUID } from '../utils/uuid';
import {
  getManifestDescriptionSuggestions,
  isValidSemVer,
  isValidEngineVersion,
} from '../utils/manifestSuggestions';
import {
  checkInappropriateText,
  censorInappropriateText,
} from '../utils/textModeration';

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
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);

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

  // Smart suggestions based on name
  const descriptionSuggestions = useMemo(() => {
    return getManifestDescriptionSuggestions(name);
  }, [name]);

  // Moderation checks for name and description
  const nameModeration = useMemo(() => checkInappropriateText(name), [name]);
  const descModeration = useMemo(() => checkInappropriateText(description), [description]);

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

    // Validate version format
    if (!isValidSemVer(version)) {
      setErrorMessage('La versión debe tener formato x.y.z (ejemplo: 1.0.0).');
      return;
    }

    // Validate engine version format
    if (!isValidEngineVersion(minEngineVersion)) {
      setErrorMessage('La versión mínima de Minecraft debe tener formato x.y.z (ejemplo: 1.26.20).');
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
      groups: initialProject?.groups || [],
      recipes: initialProject?.recipes || [],
    };

    onSave(project);
    onClose();
  };

  if (!isOpen) return null;

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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Nombre del Complemento *
              </label>
              {nameModeration.hasInappropriate && (
                <button
                  type="button"
                  onClick={() => setName(censorInappropriateText(name))}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                  title="Censurar palabras inapropiadas con asteriscos"
                >
                  <i className="bx bx-shield-quarter text-xs" />
                  <span>Censurar (***)</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={name}
              list="bedrock-addon-name-suggestions"
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Ej: Poppicraft Addon"
              autoComplete="off"
              className={`w-full min-h-[46px] px-3.5 bg-slate-950 border rounded-xl text-sm text-slate-100 focus:outline-none transition-colors ${
                nameModeration.hasInappropriate
                  ? 'border-amber-500/70 focus:border-amber-400'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
            <datalist id="bedrock-addon-name-suggestions">
              {['Mi primer Addon', 'Nuevos bloques', 'Decoración Minecraft', 'Herramientas personalizadas', 'Aventura y exploración'].map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
            {nameModeration.hasInappropriate && (
              <span className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                <i className="bx bx-error text-xs" />
                <span>Palabra no recomendada detectada. Puedes corregirla o tocar «Censurar».</span>
              </span>
            )}
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Descripción en el Juego *
              </label>
              {descModeration.hasInappropriate && (
                <button
                  type="button"
                  onClick={() => setDescription(censorInappropriateText(description))}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                  title="Censurar palabras inapropiadas con asteriscos"
                >
                  <i className="bx bx-shield-quarter text-xs" />
                  <span>Censurar (***)</span>
                </button>
              )}
            </div>
            <textarea
              required
              rows={2}
              value={description}
              onFocus={() => setShowDescriptionSuggestions(true)}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Descripción visible en Ajustes de Mundo de Minecraft"
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 focus:outline-none resize-none transition-colors ${
                descModeration.hasInappropriate
                  ? 'border-amber-500/70 focus:border-amber-400'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
            {descModeration.hasInappropriate && (
              <span className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                <i className="bx bx-error text-xs" />
                <span>Palabra no recomendada detectada en la descripción.</span>
              </span>
            )}

            {/* Sugerencias inteligentes de descripción (v1.6) */}
            <div className="mt-2 flex flex-col gap-1.5">
              <button type="button" onClick={() => setShowDescriptionSuggestions((visible) => !visible)} className="flex min-h-9 items-center gap-1 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"><i className="bx bx-bulb text-amber-400 text-xs" /><span>Sugerencias para la descripción</span><span className="ml-auto text-blue-300">{showDescriptionSuggestions ? 'Ocultar' : 'Mostrar'}</span></button>
              {showDescriptionSuggestions && <div className="flex flex-col gap-1">
                <i className="bx bx-bulb text-amber-400 text-xs" />
              
                {descriptionSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDescription(sug);
                      setErrorMessage('');
                    }}
                    className="text-left text-[11px] p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1.5 leading-snug group"
                  >
                    <i className="bx bx-plus text-xs text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>}
            </div>
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

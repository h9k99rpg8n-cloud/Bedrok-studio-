import React, { useRef, useState, useMemo } from 'react';
import { AddonProject, CustomTexture } from '../types/addon';
import { getMinecraftReferenceTextures, MinecraftReferenceTexture } from '../utils/minecraftReferenceTextures';

interface TextureLibraryModalProps {
  isOpen: boolean;
  project: AddonProject;
  onClose: () => void;
  onSelectTextureForFace?: (textureDataUrl: string) => void;
  onSelectTextureForItem?: (textureDataUrl: string) => void;
  onSaveNewTexture: (texture: CustomTexture) => void;
  onDeleteTexture: (textureId: string) => void;
  onOpenPainter: () => void;
}

export const TextureLibraryModal: React.FC<TextureLibraryModalProps> = ({
  isOpen,
  project,
  onClose,
  onSelectTextureForFace,
  onSelectTextureForItem,
  onSaveNewTexture,
  onDeleteTexture,
  onOpenPainter,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'minecraft'>('project');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minecraftCategory, setMinecraftCategory] = useState<string>('todos');
  const [deleteWarningTex, setDeleteWarningTex] = useState<{ id: string; name: string; usedIn: string[] } | null>(null);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mcCatalog = useMemo(() => getMinecraftReferenceTextures(), []);

  // Filtered Minecraft Catalog
  const filteredMinecraft = useMemo(() => {
    return mcCatalog.filter((item) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.englishName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        minecraftCategory === 'todos' || item.category === minecraftCategory;

      return matchesSearch && matchesCat;
    });
  }, [mcCatalog, searchQuery, minecraftCategory]);

  // Filtered Project Textures
  const filteredProjectTextures = useMemo(() => {
    if (!searchQuery.trim()) return project.textures;
    return project.textures.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [project.textures, searchQuery]);

  if (!isOpen) return null;

  // Calculates which blocks and faces use a given texture
  const getTextureUsage = (texDataUrl: string, texName: string): string[] => {
    const usages: string[] = [];
    project.blocks.forEach((block) => {
      const faces = block.faceTextures;
      const matchedFaces: string[] = [];
      if (faces) {
        Object.entries(faces).forEach(([fName, val]) => {
          if (val === texDataUrl || val === texName) {
            matchedFaces.push(fName);
          }
        });
      } else if (block.textureDataUrl === texDataUrl) {
        matchedFaces.push('todas');
      }

      if (matchedFaces.length > 0) {
        usages.push(`${block.displayName} (${matchedFaces.join(', ')})`);
      }
    });
    return usages;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const rawName = file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        const newTex: CustomTexture = {
          id: `tex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rawName || 'textura',
          dataUrl: event.target.result,
          createdAt: Date.now(),
        };
        onSaveNewTexture(newTex);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportMinecraftTexture = (mcItem: MinecraftReferenceTexture) => {
    const newTex: CustomTexture = {
      id: `tex_mc_${mcItem.id}_${Date.now()}`,
      name: mcItem.englishName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      dataUrl: mcItem.dataUrl,
      createdAt: Date.now(),
    };
    onSaveNewTexture(newTex);
    setImportedNotice(`"${mcItem.name}" importada al proyecto`);
    setTimeout(() => setImportedNotice(null), 3000);
  };

  const handleDeleteClick = (tex: CustomTexture) => {
    const usage = getTextureUsage(tex.dataUrl, tex.name);
    if (usage.length > 0) {
      setDeleteWarningTex({ id: tex.id, name: tex.name, usedIn: usage });
    } else {
      onDeleteTexture(tex.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <i className="bx bxs-photo-album text-xl text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Biblioteca de Texturas</h2>
              <span className="text-[10px] text-slate-400">
                {activeTab === 'project'
                  ? `${project.textures.length} texturas en el Addon`
                  : 'Catálogo oficial de referencia Minecraft Bedrock'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Tab Switcher: Mis Texturas vs Catálogo Bedrock */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 my-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('project')}
            className={`min-h-[38px] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'project'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-folder" />
            <span>Mis Texturas ({project.textures.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('minecraft')}
            className={`min-h-[38px] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'minecraft'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bxs-cube-alt" />
            <span>Catálogo Bedrock</span>
          </button>
        </div>

        {/* Search Bar & Filter */}
        <div className="flex flex-col gap-2 mb-3 shrink-0">
          <div className="relative">
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'project'
                  ? 'Buscar textura en el addon...'
                  : 'Buscar por nombre (ej. piedra, tierra, diamante)...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <i className="bx bx-x" />
              </button>
            )}
          </div>

          {/* Minecraft Category filters */}
          {activeTab === 'minecraft' && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'natural', label: 'Naturales' },
                { id: 'construccion', label: 'Construcción' },
                { id: 'mineral', label: 'Minerales' },
                { id: 'utilidad', label: 'Utilidad' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMinecraftCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors ${
                    minecraftCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating Notification */}
        {importedNotice && (
          <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-1.5 shrink-0 animate-in fade-in duration-150">
            <i className="bx bx-check-circle text-base text-emerald-400" />
            <span>{importedNotice}</span>
          </div>
        )}

        {/* Delete Warning Notice */}
        {deleteWarningTex && (
          <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col gap-2 text-xs text-rose-200 shrink-0">
            <span className="font-bold flex items-center gap-1.5 text-rose-400">
              <i className="bx bx-error-circle text-base" />
              ¡Esta textura está en uso!
            </span>
            <p className="text-[11px] leading-relaxed">
              La textura <strong className="font-mono text-white">{deleteWarningTex.name}</strong> está asignada en:
            </p>
            <ul className="text-[11px] list-disc list-inside text-rose-300">
              {deleteWarningTex.usedIn.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-500/20">
              <button
                type="button"
                onClick={() => setDeleteWarningTex(null)}
                className="px-3 py-1 bg-slate-900 rounded-lg text-slate-300 border border-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTexture(deleteWarningTex.id);
                  setDeleteWarningTex(null);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
              >
                Eliminar de todos modos
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: MIS TEXTURAS DEL PROYECTO */}
        {activeTab === 'project' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[42px] px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <i className="bx bx-upload text-base text-emerald-400" />
                <span>Importar PNG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPainter();
                }}
                className="min-h-[42px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <i className="bx bxs-paint text-base" />
                <span>Pintar con Píxeles</span>
              </button>
            </div>

            {/* Grid of Textures */}
            {filteredProjectTextures.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
                <i className="bx bx-images text-4xl text-slate-600 mb-2" />
                <span>No se encontraron texturas en el proyecto.</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Usa "Importar PNG" o explora la pestaña "Catálogo Bedrock".
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                {filteredProjectTextures.map((tex) => {
                  const usages = getTextureUsage(tex.dataUrl, tex.name);
                  return (
                    <div
                      key={tex.id}
                      className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-0.5 overflow-hidden shrink-0 pixelated shadow-inner">
                          <img
                            src={tex.dataUrl}
                            alt={tex.name}
                            className="w-full h-full object-contain pixelated"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-mono font-bold text-slate-200 block truncate">
                            {tex.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {usages.length > 0 ? `En uso: ${usages.length} cara(s)` : 'Sin usar'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                        {(onSelectTextureForFace || onSelectTextureForItem) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectTextureForItem) onSelectTextureForItem(tex.dataUrl);
                              else onSelectTextureForFace?.(tex.dataUrl);
                              onClose();
                            }}
                            className="flex-1 min-h-[34px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                          >
                            <i className="bx bx-check" />
                            <span>{onSelectTextureForItem ? 'Usar para objeto' : 'Asignar'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(tex)}
                          className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500"
                          title="Eliminar textura"
                        >
                          <i className="bx bx-trash text-sm" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATÁLOGO DE REFERENCIA MINECRAFT BEDROCK */}
        {activeTab === 'minecraft' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
              {filteredMinecraft.map((mcItem) => (
                <div
                  key={mcItem.id}
                  className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-0.5 overflow-hidden shrink-0 pixelated shadow-inner">
                      <img
                        src={mcItem.dataUrl}
                        alt={mcItem.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-200 block truncate">
                        {mcItem.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400/90 block truncate">
                        {mcItem.englishName}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block mt-0.5">
                        16×16 px
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                    {(onSelectTextureForFace || onSelectTextureForItem) ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTextureForItem) {
                            handleImportMinecraftTexture(mcItem);
                            onSelectTextureForItem(mcItem.dataUrl);
                          } else {
                            onSelectTextureForFace?.(mcItem.dataUrl);
                          }
                          onClose();
                        }}
                        className="flex-1 min-h-[34px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                      >
                        <i className="bx bx-check" />
                        <span>{onSelectTextureForItem ? 'Importar y usar' : 'Asignar'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImportMinecraftTexture(mcItem)}
                        className="flex-1 min-h-[34px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <i className="bx bx-download text-sm" />
                        <span>Importar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

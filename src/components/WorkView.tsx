import React, { useState, useMemo } from 'react';
import { AddonProject, SortOption } from '../types/addon';
import { WatermarkPickaxe } from './WatermarkPickaxe';

interface WorkViewProps {
  projects: AddonProject[];
  onOpenProject: (project: AddonProject) => void;
  onCreateProjectClick: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onDuplicateProject?: (project: AddonProject, e: React.MouseEvent) => void;
  onOpenChangelog: () => void;
}

export const WorkView: React.FC<WorkViewProps> = ({
  projects,
  onOpenProject,
  onCreateProjectClick,
  onDeleteProject,
  onDuplicateProject,
  onOpenChangelog,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('dates');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);

  // Sorting logic
  const sortedProjects = useMemo(() => {
    let filtered = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    const copy = [...filtered];
    switch (sortOption) {
      case 'letters':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'dates':
        return copy.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      case 'most_used':
        return copy.sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0));
      case 'oldest':
        return copy.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      case 'size':
        return copy.sort((a, b) => (b.blocks.length + b.textures.length) - (a.blocks.length + a.textures.length));
      default:
        return copy;
    }
  }, [projects, searchQuery, sortOption]);

  const sortLabels: Record<SortOption, { label: string; icon: string }> = {
    letters: { label: 'Letras (A-Z)', icon: 'bx bx-sort-a-z' },
    dates: { label: 'Fechas (Más reciente)', icon: 'bx bx-calendar' },
    most_used: { label: 'Más usado', icon: 'bx bx-trending-up' },
    oldest: { label: 'Más viejo', icon: 'bx bx-history' },
    size: { label: 'Tamaño (Nº objetos)', icon: 'bx bx-layer' },
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto min-h-screen relative select-none">
      {/* Top Navigation Bar: Search (Left), Brand (Center), Create & Sort (Right) */}
      <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 h-14 flex items-center justify-between gap-2">
        {/* Left: Search Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
            isSearchOpen ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-100'
          }`}
          title="Buscar carpeta de Addon"
        >
          <i className="bx bx-search text-xl" />
        </button>

        {/* Center: Brand & Version */}
        <button
          type="button"
          onClick={onOpenChangelog}
          className="flex flex-col items-center hover:opacity-90 active:scale-98 transition-all px-2 py-1 rounded-xl"
          title="Ver novedades de la versión 0.1.4.1"
        >
          <span className="text-xs font-black tracking-wider text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Bedrock Studio</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-tight flex items-center gap-1">
            <span>v0.1.4.1</span>
            <i className="bx bx-sparkles text-[10px] text-amber-400" />
            <span>Novedades</span>
          </span>
        </button>

        {/* Right: Create Folder + Sort Separator */}
        <div className="flex items-center gap-1">
          {/* Create Addon Button */}
          <button
            type="button"
            onClick={onCreateProjectClick}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all"
            title="Crear Addon (Nuevo Manifiesto)"
          >
            <i className="bx bxs-folder-plus text-2xl" />
          </button>

          {/* 3 lines separator icon (Sort Menu) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                isSortMenuOpen ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100'
              }`}
              title="Opciones de Ordenar"
            >
              <i className="fa-solid fa-bars-staggered text-base" />
            </button>

            {/* Sort Dropdown Menu */}
            {isSortMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsSortMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-52 bg-[#0d1322] border border-slate-800 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <span className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/80 mb-1">
                    Ordenar carpetas por:
                  </span>
                  {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortOption(key);
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full min-h-[40px] px-3 rounded-xl text-xs flex items-center justify-between text-left transition-colors ${
                        sortOption === key
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`${sortLabels[key].icon} text-sm`} />
                        <span>{sortLabels[key].label}</span>
                      </div>
                      {sortOption === key && <i className="bx bx-check text-base text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2.5 bg-[#0b0f1a] border-b border-slate-800/80 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 focus-within:border-emerald-500">
            <i className="bx bx-search text-slate-500 mr-2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe para buscar (ej. Poppicraft)..."
              className="w-full min-h-[40px] bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <i className="bx bx-x text-base" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Work Canvas Area */}
      <main className="flex-1 p-4 flex flex-col relative">
        {/* Active sort info pill */}
        {projects.length > 0 && (
          <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400 px-1">
            <span>
              {sortedProjects.length} {sortedProjects.length === 1 ? 'carpeta de Addon' : 'carpetas de Addons'}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <i className={sortLabels[sortOption].icon} />
              {sortLabels[sortOption].label}
            </span>
          </div>
        )}

        {/* EMPTY STATE with Minecraft Pickaxe Watermark */}
        {projects.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 relative">
            {/* Pickaxe Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <WatermarkPickaxe className="w-80 h-80 text-emerald-500" opacity={0.06} />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-xs px-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
                <i className="bx bxs-folder-open text-4xl" />
              </div>

              <h2 className="text-base font-bold text-slate-100 mb-1">El "Work" está vacío</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Aún no has creado ningún Addon. Toca el icono de carpeta en la esquina superior para configurar tu primer manifiesto.
              </p>

              <button
                type="button"
                onClick={onCreateProjectClick}
                className="min-h-[48px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                <i className="bx bxs-folder-plus text-lg" />
                <span>Crear Primer Addon</span>
              </button>
            </div>
          </div>
        )}

        {/* SEARCH NO RESULTS */}
        {projects.length > 0 && sortedProjects.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <i className="bx bx-search-alt text-4xl text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">
              No se encontraron Addons que coincidan con "{searchQuery}".
            </p>
          </div>
        )}

        {/* FOLDERS GRID (Infinite folders system) */}
        {sortedProjects.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {sortedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProject(p)}
                className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/60 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Folder / Profile Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner">
                    {p.iconDataUrl ? (
                      <img
                        src={p.iconDataUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="bx bxs-folder text-3xl text-emerald-400" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[200px]">
                      {p.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="font-mono text-emerald-400">v{p.version}</span>
                      <span>·</span>
                      <span>{p.blocks.length} {p.blocks.length === 1 ? 'bloque' : 'bloques'}</span>
                      {p.textures.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{p.textures.length} tex</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions: duplicate, delete, and chevron */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {onDuplicateProject && (
                    <button
                      type="button"
                      onClick={(e) => onDuplicateProject(p, e)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-colors"
                      title="Duplicar Addon con aislamiento total"
                    >
                      <i className="bx bx-copy text-lg" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => onDeleteProject(p.id, e)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-colors"
                    title="Eliminar Addon"
                  >
                    <i className="bx bx-trash text-lg" />
                  </button>
                  <i className="bx bx-chevron-right text-xl text-slate-600 group-hover:text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

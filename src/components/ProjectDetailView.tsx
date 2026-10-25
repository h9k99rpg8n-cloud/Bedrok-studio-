import React, { useState } from 'react';
import {
  AddonProject,
  BlockGroup,
  BedrockCreativeCategory,
  CustomBlock,
  CustomTexture,
  CraftingRecipe,
  ProjectFolder,
} from '../types/addon';
import { WatermarkPickaxe } from './WatermarkPickaxe';
import { exportAddonToMcaddon } from '../utils/exporter';
import { runProjectDiagnostics } from '../utils/diagnostics';
import confetti from 'canvas-confetti';

interface ProjectDetailViewProps {
  project: AddonProject;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onBack: () => void;
  onOpenManifest: () => void;
  onSaveProject: () => Promise<void>;
  onOpenBlockWizard: () => void;
  onOpenBlockEditor: (block: CustomBlock) => void;
  onOpenTexturePainter: () => void;
  onOpenTextureLibrary: () => void;
  onOpenDiagnostics: () => void;
  onOpenTutorial: () => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteTexture: (textureId: string) => void;
  onSaveGroup: (group: BlockGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenCreateRecipe: () => void;
  onOpenEditRecipe: (recipe: CraftingRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onUpdateProject: (project: AddonProject) => Promise<void>;
  onExportComplete: () => void;
}

type WorkspaceTab = 'blocks' | 'recipes' | 'textures' | 'groups';

const GROUP_PALETTE = [
  { color: '#10b981', name: 'Esmeralda' },
  { color: '#3b82f6', name: 'Azul' },
  { color: '#f59e0b', name: 'Ámbar' },
  { color: '#f43f5e', name: 'Rosa' },
  { color: '#a855f7', name: 'Púrpura' },
  { color: '#06b6d4', name: 'Cian' },
  { color: '#f97316', name: 'Naranja' },
  { color: '#64748b', name: 'Piedra' },
];

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  saveStatus = 'idle',
  onBack,
  onOpenManifest,
  onSaveProject,
  onOpenBlockWizard,
  onOpenBlockEditor,
  onOpenTexturePainter,
  onOpenTextureLibrary,
  onOpenDiagnostics,
  onOpenTutorial,
  onDeleteBlock,
  onDeleteTexture,
  onSaveGroup,
  onDeleteGroup,
  onOpenCreateRecipe,
  onOpenEditRecipe,
  onDeleteRecipe,
  onUpdateProject,
  onExportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('blocks');
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'alphabetical'>('recent');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<{ fileName: string; size: number } | null>(null);
  const [exportErrorNotice, setExportErrorNotice] = useState<string | null>(null);

  // Group Create/Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<BlockGroup | null>(null);
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [groupColorInput, setGroupColorInput] = useState<string>('#10b981');
  const [groupCategoryInput, setGroupCategoryInput] = useState<BedrockCreativeCategory>('construction');
  const [groupBedrockInput, setGroupBedrockInput] = useState<string>('');
  const [groupModalError, setGroupModalError] = useState<string>('');

  // Filter blocks by group in Blocks tab
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [activeFolderId, setActiveFolderId] = useState<string>('all');

  // Manual save trigger from bottom bar
  const handleSaveClick = async () => {
    try {
      await onSaveProject();
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Run diagnostics before export
  const handleExportClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const issues = runProjectDiagnostics(project);
    const hasBlockingErrors = issues.some((i) => i.severity === 'error');

    if (hasBlockingErrors) {
      onOpenDiagnostics();
      return;
    }

    try {
      setIsExporting(true);
      setExportErrorNotice(null);
      const res = await exportAddonToMcaddon(project);
      setExportNotice(res);
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
      // The download has been initiated successfully: return to the Workbench without reloading.
      onExportComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al exportar el Addon.';
      console.error('Error al exportar:', err);
      setExportErrorNotice(msg);
      setTimeout(() => setExportErrorNotice(null), 6000);
    } finally {
      setIsExporting(false);
    }
  };

  // Open Group Modal for Create
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupNameInput('');
    setGroupColorInput('#10b981');
    setGroupCategoryInput('construction');
    setGroupBedrockInput('');
    setGroupModalError('');
    setIsGroupModalOpen(true);
  };

  // Open Group Modal for Edit
  const handleOpenEditGroup = (grp: BlockGroup) => {
    setEditingGroup(grp);
    setGroupNameInput(grp.name);
    setGroupColorInput(grp.color || '#10b981');
    setGroupCategoryInput(grp.category || 'construction');
    setGroupBedrockInput(grp.bedrockGroup || '');
    setGroupModalError('');
    setIsGroupModalOpen(true);
  };

  // Save Group Action
  const handleSaveGroupModal = () => {
    const cleanName = groupNameInput.trim();
    if (!cleanName) {
      setGroupModalError('El nombre del grupo no puede estar vacío.');
      return;
    }

    const saved: BlockGroup = {
      id: editingGroup?.id || `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      color: groupColorInput,
      category: groupCategoryInput,
      bedrockGroup: groupBedrockInput.trim() || undefined,
      createdAt: editingGroup?.createdAt || Date.now(),
    };

    onSaveGroup(saved);
    setIsGroupModalOpen(false);
  };

  // Delete Group with confirmation
  const handleDeleteGroupClick = (grp: BlockGroup) => {
    const count = (project.blocks || []).filter((b) => b.groupId === grp.id).length;
    const confirmMessage = count > 0
      ? `¿Eliminar el grupo "${grp.name}"? Los ${count} bloques asignados no se borrarán; únicamente quedarán sin grupo.`
      : `¿Eliminar el grupo "${grp.name}"?`;

    if (window.confirm(confirmMessage)) {
      onDeleteGroup(grp.id);
      if (filterGroupId === grp.id) setFilterGroupId('all');
    }
  };

  const createProjectFolder = async () => {
    const name = window.prompt('Nombre de la nueva carpeta:')?.trim();
    if (!name) return;
    if (projectFolders.some((folder) => folder.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
      window.alert('Ya existe una carpeta con ese nombre.');
      return;
    }
    const folder: ProjectFolder = { id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, resourceType: 'all', createdAt: Date.now() };
    await onUpdateProject({ ...project, folders: [...projectFolders, folder], updatedAt: Date.now() });
    setActiveFolderId(folder.id);
  };

  const moveBlockToFolder = async (block: CustomBlock) => {
    const options = ['Sin carpeta', ...projectFolders.map((folder) => folder.name)];
    const choice = window.prompt(`Mover “${block.displayName}” a una carpeta:\n${options.map((name, index) => `${index}. ${name}`).join('\n')}`, '0');
    if (choice === null) return;
    const index = Number(choice);
    if (!Number.isInteger(index) || index < 0 || index >= options.length) {
      window.alert('Selecciona el número de una carpeta válida.');
      return;
    }
    const folderId = index === 0 ? undefined : projectFolders[index - 1].id;
    await onUpdateProject({ ...project, blocks: project.blocks.map((item) => item.id === block.id ? { ...item, folderId } : item), updatedAt: Date.now() });
  };

  const duplicateBlock = async (block: CustomBlock) => {
    const copy: CustomBlock = { ...JSON.parse(JSON.stringify(block)), id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, identifier: `${block.identifier}_copy`, displayName: `${block.displayName} (Copia)`, createdAt: Date.now(), updatedAt: Date.now() };
    await onUpdateProject({ ...project, blocks: [...project.blocks, copy], updatedAt: Date.now() });
  };

  const projectFolders = project.folders || [];
  const projectGroups = project.groups || [];
  const projectRecipes = project.recipes || [];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('es');
  const matchesSearch = (value: string | undefined) =>
    !normalizedQuery || (value || '').toLocaleLowerCase('es').includes(normalizedQuery);
  const sortByNameOrDate = <T extends { createdAt?: number; updatedAt?: number },>(
    items: T[],
    getName: (item: T) => string,
  ): T[] => [...items].sort((a, b) => {
    if (sortOrder === 'alphabetical') return getName(a).localeCompare(getName(b), 'es', { sensitivity: 'base' });
    return ((b.createdAt || 0) - (a.createdAt || 0));
  });
  // Default view groups blocks together; within each group, newest blocks appear first.
  const filteredBlocks = sortOrder === 'alphabetical'
    ? sortByNameOrDate((project.blocks || []).filter((b) =>
        (filterGroupId === 'all' || b.groupId === filterGroupId) &&
        (activeFolderId === 'all' || (activeFolderId === 'unfiled' ? !b.folderId : b.folderId === activeFolderId)) &&
        (matchesSearch(b.displayName) || matchesSearch(b.identifier) || matchesSearch(b.groupName))
      ), (b) => b.displayName)
    : (project.blocks || []).filter((b) =>
        (filterGroupId === 'all' || b.groupId === filterGroupId) &&
        (activeFolderId === 'all' || (activeFolderId === 'unfiled' ? !b.folderId : b.folderId === activeFolderId)) &&
        (matchesSearch(b.displayName) || matchesSearch(b.identifier) || matchesSearch(b.groupName))
      ).sort((a, b) =>
        (a.groupName || projectGroups.find((g) => g.id === a.groupId)?.name || 'Sin grupo')
          .localeCompare(b.groupName || projectGroups.find((g) => g.id === b.groupId)?.name || 'Sin grupo', 'es', { sensitivity: 'base' }) ||
        ((b.createdAt || 0) - (a.createdAt || 0))
      );
  const filteredRecipes = sortByNameOrDate(
    projectRecipes.filter((recipe) => (activeFolderId === 'all' || (activeFolderId === 'unfiled' ? !recipe.folderId : recipe.folderId === activeFolderId)) && (matchesSearch(recipe.displayName) || matchesSearch(recipe.identifier))),
    (recipe) => recipe.displayName,
  );
  const filteredTextures = sortByNameOrDate(
    (project.textures || []).filter((texture) => (activeFolderId === 'all' || (activeFolderId === 'unfiled' ? !texture.folderId : texture.folderId === activeFolderId)) && matchesSearch(texture.name)),
    (texture) => texture.name,
  );
  const filteredGroups = sortByNameOrDate(
    projectGroups.filter((group) => matchesSearch(group.name) || matchesSearch(group.category) || matchesSearch(group.bedrockGroup)),
    (group) => group.name,
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-24 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0d1322]/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 flex items-center justify-between gap-2 shadow-sm">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 active:scale-95 transition-colors"
          title="Volver a la lista de proyectos"
        >
          <i className="bx bx-chevron-left text-2xl" />
        </button>

        {/* Project Name & Live Save Status */}
        <div className="flex-1 min-w-0 text-center px-1">
          <h2 className="text-sm font-bold text-slate-100 truncate">{project.name}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {saveStatus === 'saving' && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <i className="bx bx-loader-alt bx-spin" /> Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <i className="bx bx-check" /> Guardado en IndexedDB
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                <i className="bx bx-error" /> Error al guardar
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-[10px] font-mono text-slate-400">
                v{project.version || '1.0.0'} • Bedrock {project.minEngineVersion || '1.26.20'}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Diagnostics & Manifest */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="min-h-[44px] px-2.5 flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-emerald-400 transition-colors"
            title="Diagnóstico y Validación Previa"
          >
            <i className="bx bx-check-shield text-base" />
            <span className="hidden sm:inline">Auditoría</span>
          </button>

          <button
            type="button"
            onClick={onOpenManifest}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="Ajustes de Manifiesto"
          >
            <i className="bx bx-cog text-xl" />
          </button>
        </div>
      </header>

      {/* Floating Notices */}
      {saveSuccessNotice && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <i className="bx bx-check-circle text-base text-emerald-400" />
          <span>Proyecto guardado con éxito en IndexedDB.</span>
        </div>
      )}

      {exportNotice && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <i className="bx bxs-package text-lg text-emerald-400" />
          <div>
            <span className="font-bold">¡{exportNotice.fileName} exportado!</span>
            <p className="text-[10px] text-emerald-400">Listo para abrir e instalar en Minecraft Bedrock.</p>
          </div>
        </div>
      )}

      {exportErrorNotice && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <i className="bx bx-error-circle text-lg text-rose-400 shrink-0" />
          <div>
            <span className="font-bold">Error en la exportación</span>
            <p className="text-[10px] text-rose-300">{exportErrorNotice}</p>
          </div>
        </div>
      )}

      {/* Workspace navigation: compact hamburger menu replaces the crowded tab row */}
      <div className="relative flex justify-end px-4 pt-3">
        <button
          type="button"
          onClick={() => setIsWorkspaceMenuOpen((open) => !open)}
          aria-label="Abrir secciones del espacio de trabajo"
          aria-expanded={isWorkspaceMenuOpen}
          className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#0d1322] border border-slate-800 text-slate-100 hover:border-emerald-500/50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <i className="bx bx-menu text-2xl" />
          <span className="text-xs font-semibold hidden sm:inline">Secciones</span>
        </button>
        {isWorkspaceMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar menú de secciones"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsWorkspaceMenuOpen(false)}
            />
            <div className="absolute right-4 top-14 z-50 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-[#0d1322] p-2 shadow-2xl">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Ir a una sección</p>
              {([
                { id: 'blocks', label: 'Bloques', icon: 'bx bxs-cube', count: project.blocks?.length || 0 },
                { id: 'recipes', label: 'Recetas', icon: 'bx bxs-grid', count: projectRecipes.length },
                { id: 'textures', label: 'Texturas', icon: 'bx bxs-paint', count: project.textures?.length || 0 },
                { id: 'groups', label: 'Grupos', icon: 'bx bx-category', count: projectGroups.length },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsWorkspaceMenuOpen(false);
                    setSearchQuery('');
                    setSortOrder('recent');
                  }}
                  className={`w-full min-h-[46px] px-3 rounded-xl flex items-center justify-between gap-3 text-left transition-colors ${
                    activeTab === item.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <i className={`${item.icon} text-lg`} />
                    {item.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{item.count}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Live search and sort controls apply to the selected workspace section */}
      <section className="px-4 pt-3 flex flex-col sm:flex-row gap-2 sm:items-center" aria-label="Buscar y ordenar elementos">
        <label className="flex-1 min-w-0 min-h-[44px] flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d1322] px-3 focus-within:border-emerald-500/70">
          <i className="bx bx-search text-lg text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Buscar en ${activeTab === 'blocks' ? 'bloques' : activeTab === 'recipes' ? 'recetas' : activeTab === 'textures' ? 'texturas' : 'grupos'}...`}
            aria-label="Buscar en la sección actual"
            className="w-full min-w-0 min-h-[42px] bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="min-h-[32px] min-w-[32px] rounded-lg text-slate-400 hover:text-white" aria-label="Limpiar búsqueda">
              <i className="bx bx-x text-lg" />
            </button>
          )}
        </label>
        <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-800 bg-[#0d1322] px-3 sm:w-56">
          <i className="bx bx-sort-alt-2 text-lg text-emerald-400" />
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as 'recent' | 'alphabetical')}
            aria-label="Ordenar elementos"
            className="w-full min-h-[42px] bg-transparent text-xs font-semibold text-slate-200 outline-none"
          >
            <option value="recent">Más reciente</option>
            <option value="alphabetical">Orden alfabético (A-Z)</option>
          </select>
        </label>
      </section>

      {/* 2.2 Project folders */}
      <section className="mx-4 mt-3 rounded-2xl border border-slate-800 bg-[#0d1322] p-3" aria-label="Carpetas del proyecto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0"><i className="bx bx-folder text-xl text-emerald-400" /><span className="text-xs font-bold text-slate-200">Carpetas del proyecto</span><span className="text-[10px] text-slate-500">{projectFolders.length}</span></div>
          <button type="button" onClick={createProjectFolder} className="min-h-[38px] px-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5"><i className="bx bx-folder-plus text-base" /> Nueva carpeta</button>
        </div>
        <label className="flex items-center gap-2 min-h-[42px] rounded-xl border border-slate-800 bg-slate-950/70 px-3"><i className="bx bx-filter-alt text-emerald-400" /><select value={activeFolderId} onChange={(event) => setActiveFolderId(event.target.value)} className="w-full min-h-[40px] bg-transparent text-xs text-slate-200 outline-none" aria-label="Filtrar por carpeta"><option value="all">Todos los recursos</option><option value="unfiled">Sin carpeta</option>{projectFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
        <p className="mt-2 text-[10px] text-slate-500">Las carpetas y las ubicaciones se guardan con el proyecto. En esta versión, puedes organizar bloques; las carpetas de partículas son una estructura preparada, no un editor de partículas independiente.</p>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-4 flex flex-col relative">
        {/* TAB 1: BLOQUES DEL ADDON */}
        {activeTab === 'blocks' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* Header with Add Block Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i className="bx bxs-cube text-emerald-400" />
                Bloques Personalizados
              </span>
              <button
                type="button"
                onClick={onOpenBlockWizard}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <i className="bx bx-plus text-sm" />
                <span>Crear Bloque</span>
              </button>
            </div>

            {/* Filter by Group if groups exist */}
            {projectGroups.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterGroupId('all')}
                  className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors ${
                    filterGroupId === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({project.blocks.length})
                </button>
                {projectGroups.map((grp) => {
                  const count = project.blocks.filter((b) => b.groupId === grp.id).length;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setFilterGroupId(grp.id)}
                      className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                        filterGroupId === grp.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: grp.color || '#10b981' }} />
                      <span>{grp.name}</span>
                      <span className="text-[10px] opacity-70 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Blocks List */}
            {project.blocks.length === 0 && !normalizedQuery ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 relative">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                  <i className="bx bxs-cube text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Crea tu primer bloque</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                  Diseña bloques con texturas de 1, 3 o 6 caras, propiedades físicas de Bedrock, partículas y asignación a grupos.
                </p>
                <button
                  type="button"
                  onClick={onOpenBlockWizard}
                  className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <i className="bx bx-plus text-lg" />
                  <span>Crear Nuevo Bloque</span>
                </button>
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {normalizedQuery ? `No se encontraron bloques para “${searchQuery}”.` : 'No hay bloques asignados al grupo seleccionado.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredBlocks.map((block) => {
                  const topTex = block.faceTextures?.up || block.textureDataUrl || '';
                  const mode = block.textureMode || 'one';
                  const assignedGroup = projectGroups.find((g) => g.id === block.groupId);

                  return (
                    <div
                      key={block.id}
                      onClick={() => onOpenBlockEditor(block)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#0d1322] border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Texture Icon */}
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center overflow-hidden shrink-0 pixelated shadow-inner">
                          {topTex ? (
                            <img
                              src={topTex}
                              alt={block.displayName}
                              className="w-full h-full object-contain pixelated"
                            />
                          ) : (
                            <i className="bx bxs-cube text-2xl text-slate-600" />
                          )}
                        </div>

                        {/* Title & Technical ID */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                              {block.displayName}
                            </h4>

                            {/* Group Pill if assigned */}
                            {assignedGroup && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold"
                                style={{
                                  backgroundColor: `${assignedGroup.color || '#10b981'}15`,
                                  borderColor: `${assignedGroup.color || '#10b981'}40`,
                                  color: assignedGroup.color || '#10b981',
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: assignedGroup.color || '#10b981' }}
                                />
                                <span>{assignedGroup.name}</span>
                              </span>
                            )}
                          </div>

                          <span className="text-xs font-mono text-emerald-400/90 block truncate">
                            custom:{block.identifier}
                          </span>

                          {/* Quick Badges */}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap">
                            <span className="text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                              {mode === 'one' ? '1 cara' : mode === 'three' ? '3 caras' : '6 caras'}
                            </span>
                            {block.emitsLight && (
                              <span className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <i className="bx bxs-sun text-[10px]" />
                                Luz {block.lightLevel}
                              </span>
                            )}
                            {block.consumesRedstone && (
                              <span className="text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <i className="bx bxs-zap text-[10px]" />
                                Redstone
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2.2 resource actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); void duplicateBlock(block); }} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10" title="Duplicar bloque"><i className="bx bx-copy text-lg" /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); void moveBlockToFolder(block); }} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10" title="Mover a carpeta"><i className="bx bx-folder-open text-lg" /></button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBlockEditor(block);
                          }}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-900"
                          title="Editar bloque"
                        >
                          <i className="bx bx-edit text-lg" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar bloque "${block.displayName}"?`)) {
                              onDeleteBlock(block.id);
                            }
                          }}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-colors"
                          title="Eliminar bloque"
                        >
                          <i className="bx bx-trash text-lg" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECETAS DE FABRICACIÓN (v1.6: Mesa de Trabajo 3×3) */}
        {activeTab === 'recipes' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* Header with Add Recipe Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i className="bx bxs-grid text-amber-400" />
                Recetas de Fabricación (Crafting)
              </span>
              <button
                type="button"
                onClick={onOpenCreateRecipe}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 active:scale-95 transition-all"
              >
                <i className="bx bx-plus text-sm" />
                <span>Crear Receta</span>
              </button>
            </div>

            {filteredRecipes.length === 0 && normalizedQuery ? (<div className="py-12 text-center text-sm text-slate-400">No se encontraron recetas para “{searchQuery}”.</div>) : filteredRecipes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 relative">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                  <i className="bx bxs-grid text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">
                  Crea tu primera receta 3×3
                </h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                  Diseña recetas con patrón o sin patrón para que los jugadores puedan craftear tus bloques personalizados en la mesa de trabajo de Minecraft Bedrock.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateRecipe}
                  className="min-h-[46px] px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-amber-500/20 transition-all"
                >
                  <i className="bx bx-plus text-lg" />
                  <span>Crear Nueva Receta</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecipes.map((recipe) => {
                  const result = recipe.resultItem;
                  const isShaped = recipe.type === 'shaped';

                  return (
                    <div
                      key={recipe.id}
                      className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3 shadow-sm group"
                    >
                      {/* Top Info Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                              {recipe.displayName}
                            </h4>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                                isShaped
                                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                  : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                              }`}
                            >
                              <i className={isShaped ? 'bx bx-grid-alt' : 'bx bx-shuffle'} />
                              <span>{isShaped ? 'Con Patrón' : 'Sin Patrón'}</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                            custom:{recipe.identifier}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenEditRecipe(recipe)}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 flex items-center justify-center transition-colors"
                            title="Editar receta"
                          >
                            <i className="bx bx-edit text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la receta "${recipe.displayName}"?`)) {
                                onDeleteRecipe(recipe.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 flex items-center justify-center transition-colors"
                            title="Eliminar receta"
                          >
                            <i className="bx bx-trash text-sm" />
                          </button>
                        </div>
                      </div>

                      {/* Visual Crafting Table Miniature */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 gap-3">
                        {/* Mini 3x3 Grid */}
                        <div className="grid grid-cols-3 gap-1 bg-[#151c2e] p-1 rounded-lg border border-slate-700/60 shrink-0">
                          {recipe.grid.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] overflow-hidden select-none ${
                                slot
                                  ? 'border-slate-600 bg-slate-900 text-slate-200'
                                  : 'border-slate-800/80 bg-slate-950/40'
                              }`}
                              title={slot?.name || 'Vacío'}
                            >
                              {slot ? (
                                slot.icon && slot.icon.startsWith('data:') ? (
                                  <img
                                    src={slot.icon}
                                    alt={slot.name}
                                    className="w-full h-full object-contain pixelated"
                                  />
                                ) : (
                                  <span className="text-xs">{slot.icon || '📦'}</span>
                                )
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {/* Arrow */}
                        <i className="bx bx-right-arrow-alt text-xl text-amber-400 shrink-0" />

                        {/* Result Output Preview */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-emerald-500/40 p-1 flex items-center justify-center shrink-0 relative pixelated shadow-sm">
                            {result?.icon && result.icon.startsWith('data:') ? (
                              <img
                                src={result.icon}
                                alt={result.name}
                                className="w-full h-full object-contain pixelated"
                              />
                            ) : (
                              <span className="text-2xl">{result?.icon || '📦'}</span>
                            )}
                            <span className="absolute -bottom-1 -right-1 px-1 rounded-md bg-emerald-500 text-slate-950 font-mono font-black text-[10px]">
                              ×{recipe.resultCount || 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-emerald-400 block truncate">
                              {result?.name || 'Producto'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {result?.id || 'custom:item'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEXTURAS DEL ADDON */}
        {activeTab === 'textures' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i className="bx bxs-photo-album text-emerald-400" />
                Biblioteca de Texturas ({project.textures.length})
              </span>
              <button
                type="button"
                onClick={onOpenTexturePainter}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <i className="bx bxs-paint text-sm" />
                <span>Pintar Píxeles</span>
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenTextureLibrary}
                className="min-h-[44px] px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
              >
                <i className="bx bx-folder-open text-base text-emerald-400" />
                <span>Explorar Biblioteca</span>
              </button>
              <button
                type="button"
                onClick={onOpenTexturePainter}
                className="min-h-[44px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2"
              >
                <i className="bx bxs-paint text-base" />
                <span>Nuevo Pixel Art</span>
              </button>
            </div>

            {/* Textures Grid */}
            {filteredTextures.length === 0 && normalizedQuery ? (<div className="py-12 text-center text-sm text-slate-400">No se encontraron texturas para “{searchQuery}”.</div>) : filteredTextures.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center">
                <i className="bx bx-images text-4xl text-slate-600 mb-2" />
                <span>No hay texturas en el proyecto.</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Usa "Pintar Pixel Art" o importa imágenes PNG desde la biblioteca.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredTextures.map((tex) => (
                  <div
                    key={tex.id}
                    className="p-2.5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-0.5 shrink-0 overflow-hidden pixelated">
                        <img src={tex.dataUrl} alt={tex.name} className="w-full h-full object-cover pixelated" />
                      </div>
                      <span className="text-xs font-mono text-slate-200 truncate">{tex.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTexture(tex.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-400"
                      title="Eliminar textura"
                    >
                      <i className="bx bx-trash text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GRUPOS DEL ADDON */}
        {activeTab === 'groups' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* Header with New Group Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i className="bx bx-category text-emerald-400" />
                Grupos y Categorías del Addon
              </span>
              <button
                type="button"
                onClick={handleOpenCreateGroup}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <i className="bx bx-plus text-sm" />
                <span>Nuevo Grupo</span>
              </button>
            </div>

            {/* Informative Explanation Banner */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <i className="bx bx-info-circle text-lg text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100 block mb-0.5">Sistema de Grupos Bedrock:</strong>
                Los grupos organizan tus bloques en el espacio de trabajo y configuran la propiedad oficial{' '}
                <code className="text-emerald-400 font-mono text-[11px]">menu_category</code> en el archivo de comportamiento del bloque de Minecraft Bedrock.
              </div>
            </div>

            {/* Groups List */}
            {filteredGroups.length === 0 && normalizedQuery ? (<div className="py-12 text-center text-sm text-slate-400">No se encontraron grupos para “{searchQuery}”.</div>) : filteredGroups.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                  <i className="bx bx-category text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Sin grupos creados</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                  Crea grupos como "Construcción", "Minerales" o "Naturaleza" para agrupar tus bloques y ubicarlos en el inventario creativo de Bedrock.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateGroup}
                  className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <i className="bx bx-plus text-lg" />
                  <span>Crear Primer Grupo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {projectGroups.map((grp) => {
                  const assignedBlocks = project.blocks.filter((b) => b.groupId === grp.id);

                  return (
                    <div
                      key={grp.id}
                      className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col gap-2.5 shadow-sm"
                    >
                      {/* Top Row: Color badge, Name, Category and Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: grp.color || '#10b981' }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">{grp.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {grp.category || 'construction'}
                              </span>
                              {grp.bedrockGroup && (
                                <span className="font-mono text-slate-400">
                                  {grp.bedrockGroup}
                                </span>
                              )}
                              <span>• {assignedBlocks.length} bloques asignados</span>
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGroup(grp)}
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400"
                            title="Editar Grupo"
                          >
                            <i className="bx bx-edit text-base" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroupClick(grp)}
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Eliminar Grupo"
                          >
                            <i className="bx bx-trash text-base" />
                          </button>
                        </div>
                      </div>

                      {/* Blocks list within this group */}
                      {assignedBlocks.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                          {assignedBlocks.map((blk) => (
                            <button
                              key={blk.id}
                              type="button"
                              onClick={() => onOpenBlockEditor(blk)}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-300 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                            >
                              <div className="w-3.5 h-3.5 rounded bg-slate-900 overflow-hidden shrink-0 pixelated">
                                {blk.faceTextures?.up && (
                                  <img
                                    src={blk.faceTextures.up}
                                    alt={blk.displayName}
                                    className="w-full h-full object-cover pixelated"
                                  />
                                )}
                              </div>
                              <span className="truncate max-w-[140px]">{blk.displayName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PARA CREAR O EDITAR GRUPO */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <i className="bx bx-category text-xl text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo de Bloques'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            {groupModalError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {groupModalError}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Nombre del Grupo *
              </label>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => {
                  setGroupNameInput(e.target.value);
                  setGroupModalError('');
                }}
                placeholder="ej. Bloques de Piedra, Minerales Mágicos..."
                className="w-full min-h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Color Identificador
              </label>
              <div className="flex items-center gap-2">
                {GROUP_PALETTE.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setGroupColorInput(p.color)}
                    className={`w-7 h-7 rounded-full border transition-transform ${
                      groupColorInput === p.color
                        ? 'border-white ring-2 ring-emerald-500 scale-110'
                        : 'border-slate-800 hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>

            {/* Minecraft Category */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Categoría en Inventario Creativo de Bedrock
              </label>
              <select
                value={groupCategoryInput}
                onChange={(e) => setGroupCategoryInput(e.target.value as BedrockCreativeCategory)}
                className="w-full min-h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="construction">construction (Construcción - bloques estructurales)</option>
                <option value="nature">nature (Naturaleza - piedras, tierra, flora)</option>
                <option value="equipment">equipment (Equipo y utilidades)</option>
                <option value="items">items (Objetos y consumibles)</option>
                <option value="none">none (Sin categoría / Oculto en comandos)</option>
              </select>
            </div>

            {/* Minecraft Group string optional */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Identificador Oficial de Grupo Bedrock (Opcional)
              </label>
              <input
                type="text"
                value={groupBedrockInput}
                onChange={(e) => setGroupBedrockInput(e.target.value)}
                placeholder="ej. itemGroup.name.stone, itemGroup.name.ore"
                className="w-full min-h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGroupModal}
                className="flex-1 min-h-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20"
              >
                Guardar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MENU FOR "AGREGAR OBJETO" */}
      {isAddMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddMenuOpen(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-[#0d1322] border border-slate-800 rounded-3xl p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <span className="px-3 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ¿Qué deseas agregar al Addon?
            </span>

            {/* 1. Nuevo Bloque */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                onOpenBlockWizard();
              }}
              className="min-h-[50px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <i className="bx bxs-cube text-xl" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">Nuevo Bloque Personalizado</span>
                <span className="text-[10px] text-slate-400">Editor con atlas de 1, 3 o 6 caras y grupos</span>
              </div>
            </button>

            {/* 2. Nuevo Grupo */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleOpenCreateGroup();
              }}
              className="min-h-[50px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <i className="bx bx-category text-xl" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">Nuevo Grupo de Bloques</span>
                <span className="text-[10px] text-slate-400">Organiza y clasifica en inventario creativo</span>
              </div>
            </button>

            {/* 3. Pintar Pixel Art */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                onOpenTexturePainter();
              }}
              className="min-h-[50px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <i className="bx bxs-paint text-xl" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">Pintar Textura Pixel Art</span>
                <span className="text-[10px] text-slate-400">Lienzo táctil móvil con paleta de colores y figuras</span>
              </div>
            </button>

            {/* 4. Biblioteca de Texturas */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                onOpenTextureLibrary();
              }}
              className="min-h-[50px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <i className="bx bxs-photo-album text-xl" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">Biblioteca de Texturas</span>
                <span className="text-[10px] text-slate-400">Catálogo Bedrock e importación de PNGs</span>
              </div>
            </button>

            {/* 5. Nueva Receta de Fabricación (v1.6) */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                onOpenCreateRecipe();
              }}
              className="min-h-[50px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-colors active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <i className="bx bxs-grid text-xl" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">Nueva Receta de Fabricación</span>
                <span className="text-[10px] text-slate-400">Mesa de trabajo 3×3 con o sin patrón</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Floating Bottom Action Bar */}
      <nav className="fixed bottom-3 left-3 right-3 z-30 max-w-md mx-auto bg-[#0d1322]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around gap-1">
        {/* Guardar Manifiesto / Datos */}
        <button
          type="button"
          onClick={handleSaveClick}
          className="flex-1 min-h-[46px] flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 rounded-xl transition-colors active:scale-95"
        >
          <i className="bx bxs-save text-xl" />
          <span className="text-[10px] font-semibold mt-0.5">Guardar</span>
        </button>

        {/* Botón Central: Agregar Objeto */}
        <button
          type="button"
          onClick={() => setIsAddMenuOpen(true)}
          className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all -translate-y-2 border-2 border-[#090d16]"
          title="Añadir bloque, textura o grupo"
        >
          <i className="bx bx-plus text-2xl font-bold" />
        </button>

        {/* Exportar .mcaddon */}
        <button
          type="button"
          onClick={handleExportClick}
          disabled={isExporting}
          className="flex-1 min-h-[46px] flex flex-col items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
        >
          <i className={`bx ${isExporting ? 'bx-loader-alt bx-spin' : 'bxs-package'} text-xl`} />
          <span className="text-[10px] font-bold mt-0.5">Exportar</span>
        </button>
      </nav>
    </div>
  );
};

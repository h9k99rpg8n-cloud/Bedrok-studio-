/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AddonProject,
  BlockFaceKey,
  BlockGroup,
  CustomBlock,
  CustomTexture,
  CraftingRecipe,
  DiagnosticIssue,
} from './types/addon';
import { dbService } from './services/db';
import { OnboardingModal } from './components/OnboardingModal';
import { ManifestModal } from './components/ManifestModal';
import { TexturePainterModal } from './components/TexturePainterModal';
import { WorkView } from './components/WorkView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { ChangelogModal } from './components/ChangelogModal';
import { ReleasePreviewModal } from './components/ReleasePreviewModal';
import { BlockTutorialModal } from './components/BlockTutorialModal';
import { FullBlockEditorModal } from './components/FullBlockEditorModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { TextureLibraryModal } from './components/TextureLibraryModal';
import { CraftingRecipeModal } from './components/CraftingRecipeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { runProjectDiagnostics } from './utils/diagnostics';
import { exportAddonToMcaddon } from './utils/exporter';
import confetti from 'canvas-confetti';

export default function App() {
  // Phase 1: Splash Loading (v0.1.4.1)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(1);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando Bedrock Studio...');
  const [loadingDetail, setLoadingDetail] = useState<string>('Preparando entorno de trabajo...');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isReleasePreviewOpen, setIsReleasePreviewOpen] = useState<boolean>(false);
  const [showOnboardingAfterRelease, setShowOnboardingAfterRelease] = useState<boolean>(false);

  // Phase 2: Work Data & Active Project
  const [projects, setProjects] = useState<AddonProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Modals state
  const [isManifestModalOpen, setIsManifestModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<AddonProject | null>(null);

  // Block & Texture Modals
  const [isFullBlockEditorOpen, setIsFullBlockEditorOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<CustomBlock | null>(null);

  const [isTexturePainterOpen, setIsTexturePainterOpen] = useState<boolean>(false);
  const [isTextureLibraryOpen, setIsTextureLibraryOpen] = useState<boolean>(false);
  const [targetFaceForLibrary, setTargetFaceForLibrary] = useState<BlockFaceKey | null>(null);
  const [targetItemTextureForLibrary, setTargetItemTextureForLibrary] = useState<boolean>(false);
  const [assignedTextureForEditor, setAssignedTextureForEditor] = useState<{
    face: BlockFaceKey | 'item';
    texDataUrl: string;
    textureId?: string;
    timestamp: number;
  } | null>(null);

  // Diagnostics Modal
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // Crafting Recipes Modal (2.2: Mesa de trabajo 3x3)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<CraftingRecipe | null>(null);

  // Load from IndexedDB on startup with verifiable stages (v0.1.4.1)
  const loadProjectsFromDb = useCallback(async () => {
    // Stage 1: Initializing local storage
    setLoadingProgress(12);
    setLoadingMessage('Conectando con almacenamiento local IndexedDB...');
    setLoadingDetail('Verificando repositorio de datos persistente en el dispositivo');

    try {
      // Small pause for visual smooth progression between stages
      await new Promise((r) => setTimeout(r, 120));

      // Stage 2: Fetching stored projects & textures
      setLoadingProgress(45);
      setLoadingMessage('Cargando proyectos y bloques del Addon...');
      setLoadingDetail('Sincronizando modelos, atlas de texturas y grupos');

      const stored = await dbService.getProjects();
      setProjects(stored);

      await new Promise((r) => setTimeout(r, 150));

      // Stage 3: Checking preferences & user onboarding state
      setLoadingProgress(78);
      setLoadingMessage('Comprobando preferencias y estado...');
      setLoadingDetail('Validando compatibilidad con Minecraft Bedrock 1.26.20+');

      const seen = await dbService.hasSeenOnboarding();
      const seenReleasePreview = await dbService.hasSeenReleasePreview();
      if (!seenReleasePreview) {
        setIsReleasePreviewOpen(true);
        setShowOnboardingAfterRelease(!seen);
      } else if (!seen) {
        setIsOnboardingOpen(true);
      }

      await new Promise((r) => setTimeout(r, 120));

      // Stage 4: Preparing components & workspace
      setLoadingProgress(96);
      setLoadingMessage('Preparando editor de bloques y componentes...');
      setLoadingDetail('Estructurando secciones de Identidad, Atlas Core y Comportamiento');

      await new Promise((r) => setTimeout(r, 100));

      // Stage 5: Finalized
      setLoadingProgress(100);
      setLoadingMessage('¡Inicialización completada!');
      setLoadingDetail('Bienvenido a Bedrock Studio 2.2');

      await new Promise((r) => setTimeout(r, 150));
      setIsLoading(false);
    } catch (err) {
      console.error('Error al inicializar IndexedDB:', err);
      setLoadingProgress(100);
      setLoadingMessage('Inicialización completada con aviso');
      setLoadingDetail('Se utilizará almacenamiento temporal si IndexedDB está bloqueado');
      setTimeout(() => setIsLoading(false), 200);
    }
  }, []);

  useEffect(() => {
    loadProjectsFromDb();
  }, [loadProjectsFromDb]);

  // Handle closing onboarding
  const handleCloseOnboarding = async () => {
    setIsOnboardingOpen(false);
    await dbService.setSeenOnboarding(true);
  };

  // Open an Addon folder
  const handleOpenProject = async (project: AddonProject) => {
    setActiveProjectId(project.id);
    await dbService.incrementUsage(project.id);
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, usedCount: (p.usedCount || 0) + 1 } : p))
    );
  };

  // Active project object
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Save or Update Manifest / Addon in IndexedDB
  const handleSaveManifest = async (updated: AddonProject) => {
    try {
      setSaveStatus('saving');
      await dbService.saveProject(updated);
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        if (exists) {
          return prev.map((p) => (p.id === updated.id ? updated : p));
        }
        return [updated, ...prev];
      });
      if (!activeProjectId) {
        setActiveProjectId(updated.id);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar manifiesto:', err);
      setSaveStatus('error');
    }
  };

  // Duplicate project safely with deep clone
  const handleDuplicateProject = async (project: AddonProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSaveStatus('saving');
      const duplicated = await dbService.duplicateProject(project);
      setProjects((prev) => [duplicated, ...prev]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al duplicar proyecto:', err);
      setSaveStatus('error');
    }
  };

  // Delete project from IndexedDB
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar esta carpeta de Addon?')) {
      await dbService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    }
  };

  // Save current active project to IndexedDB
  const handleSaveActiveProject = async () => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      await dbService.saveProject(activeProject);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar proyecto activo:', err);
      setSaveStatus('error');
    }
  };

  // 2.2: persist project-level edits such as folder creation and resource moves.
  const handleUpdateProject = async (updatedProject: AddonProject) => {
    try {
      setSaveStatus('saving');
      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => p.id === updatedProject.id ? { ...updatedProject, updatedAt: Date.now() } : p));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error al actualizar el proyecto:', err);
      setSaveStatus('error');
      throw err;
    }
  };

  // Create or Update Block in active project
  const handleSaveBlock = async (savedBlock: CustomBlock) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const exists = activeProject.blocks.some((b) => b.id === savedBlock.id);
      let updatedBlocks: CustomBlock[];

      if (exists) {
        updatedBlocks = activeProject.blocks.map((b) => (b.id === savedBlock.id ? savedBlock : b));
      } else {
        updatedBlocks = [...activeProject.blocks, savedBlock];
      }

      const updatedProject: AddonProject = {
        ...activeProject,
        blocks: updatedBlocks,
        updatedAt: Date.now(),
      };

      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      setEditingBlock(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar bloque:', err);
      setSaveStatus('error');
    }
  };

  // Delete Block
  const handleDeleteBlock = async (blockId: string) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const updated: AddonProject = {
        ...activeProject,
        blocks: activeProject.blocks.filter((b) => b.id !== blockId),
        updatedAt: Date.now(),
      };
      await dbService.saveProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al eliminar bloque:', err);
      setSaveStatus('error');
    }
  };

  // Save New Texture to active project
  const handleSaveTexture = async (newTexture: CustomTexture) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const updated: AddonProject = {
        ...activeProject,
        textures: [...activeProject.textures, newTexture],
        updatedAt: Date.now(),
      };
      await dbService.saveProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar textura:', err);
      setSaveStatus('error');
    }
  };

  // Delete Texture
  const handleDeleteTexture = async (textureId: string) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const updated: AddonProject = {
        ...activeProject,
        textures: activeProject.textures.filter((t) => t.id !== textureId),
        updatedAt: Date.now(),
      };
      await dbService.saveProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al eliminar textura:', err);
      setSaveStatus('error');
    }
  };

  // Save or Update BlockGroup in active project
  const handleSaveGroup = async (group: BlockGroup) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const groups = activeProject.groups || [];
      const exists = groups.some((g) => g.id === group.id);
      const updatedGroups = exists
        ? groups.map((g) => (g.id === group.id ? group : g))
        : [...groups, group];

      // Update cached groupName on any blocks that belong to this group
      const updatedBlocks = activeProject.blocks.map((b) =>
        b.groupId === group.id ? { ...b, groupName: group.name } : b
      );

      const updatedProject: AddonProject = {
        ...activeProject,
        groups: updatedGroups,
        blocks: updatedBlocks,
        updatedAt: Date.now(),
      };

      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar grupo:', err);
      setSaveStatus('error');
    }
  };

  // Delete BlockGroup safely without deleting blocks
  const handleDeleteGroup = async (groupId: string) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const updatedGroups = (activeProject.groups || []).filter((g) => g.id !== groupId);
      // Blocks that belonged to this group become unassigned
      const updatedBlocks = activeProject.blocks.map((b) =>
        b.groupId === groupId ? { ...b, groupId: undefined, groupName: undefined } : b
      );

      const updatedProject: AddonProject = {
        ...activeProject,
        groups: updatedGroups,
        blocks: updatedBlocks,
        updatedAt: Date.now(),
      };

      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al eliminar grupo:', err);
      setSaveStatus('error');
    }
  };

  // Create or Update Recipe in active project (1.8 Beta Preview)
  const handleSaveRecipe = async (savedRecipe: CraftingRecipe) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const existingRecipes = activeProject.recipes || [];
      const exists = existingRecipes.some((r) => r.id === savedRecipe.id);
      let updatedRecipes: CraftingRecipe[];

      if (exists) {
        updatedRecipes = existingRecipes.map((r) => (r.id === savedRecipe.id ? savedRecipe : r));
      } else {
        updatedRecipes = [savedRecipe, ...existingRecipes];
      }

      const updatedProject: AddonProject = {
        ...activeProject,
        recipes: updatedRecipes,
        updatedAt: Date.now(),
      };

      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      setEditingRecipe(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al guardar receta:', err);
      setSaveStatus('error');
    }
  };

  // Delete Recipe from active project (1.8 Beta Preview)
  const handleDeleteRecipe = async (recipeId: string) => {
    if (!activeProject) return;
    try {
      setSaveStatus('saving');
      const updatedProject: AddonProject = {
        ...activeProject,
        recipes: (activeProject.recipes || []).filter((r) => r.id !== recipeId),
        updatedAt: Date.now(),
      };

      await dbService.saveProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error al eliminar receta:', err);
      setSaveStatus('error');
    }
  };

  // Auto-Fix Diagnostic issues
  const handleAutoFix = async (issue: DiagnosticIssue) => {
    if (!activeProject) return;

    if (issue.autoFixType === 'clean_id' && issue.blockId) {
      const blk = activeProject.blocks.find((b) => b.id === issue.blockId);
      if (blk) {
        const cleaned = blk.identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        await handleSaveBlock({ ...blk, identifier: cleaned });
      }
    } else if (issue.autoFixType === 'remove_duplicate_id' && issue.blockId) {
      const blk = activeProject.blocks.find((b) => b.id === issue.blockId);
      if (blk) {
        const unique = `${blk.identifier}_${Math.floor(Math.random() * 899 + 100)}`;
        await handleSaveBlock({ ...blk, identifier: unique });
      }
    } else if (issue.autoFixType === 'clamp_values' && issue.blockId) {
      const blk = activeProject.blocks.find((b) => b.id === issue.blockId);
      if (blk) {
        await handleSaveBlock({
          ...blk,
          lightLevel: Math.min(15, Math.max(0, blk.lightLevel)),
          destroyTime: Math.max(0.1, blk.destroyTime ?? 1.5),
        });
      }
    } else if (issue.autoFixType === 'fill_missing_textures' && issue.blockId) {
      const blk = activeProject.blocks.find((b) => b.id === issue.blockId);
      if (blk) {
        // Find first project texture or generate default
        const defaultTex = activeProject.textures[0]?.dataUrl || blk.textureDataUrl || '';
        await handleSaveBlock({
          ...blk,
          faceTextures: {
            up: blk.faceTextures?.up || defaultTex,
            down: blk.faceTextures?.down || defaultTex,
            north: blk.faceTextures?.north || defaultTex,
            south: blk.faceTextures?.south || defaultTex,
            east: blk.faceTextures?.east || defaultTex,
            west: blk.faceTextures?.west || defaultTex,
          },
        });
      }
    }
  };

  // Proceed with export after diagnostics passed
  const handleProceedExport = async () => {
    if (!activeProject) return;
    try {
      await exportAddonToMcaddon(activeProject);
      setActiveProjectId(null);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch (err) {
      console.error('Error al exportar:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido al crear el archivo.';
      window.alert(`No se pudo exportar el Add-On.\n\n${message}\n\nTus proyectos guardados no se han eliminado.`);
    }
  };

  // 1. Initial Splash Screen (v0.1.4.1)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090d16] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -top-10" />
        <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -bottom-10" />

        {/* Logo Cube */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow-2xl shadow-emerald-500/10">
            <i className="bx bxs-cube text-4xl text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#090d16] shadow-sm shadow-emerald-400" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
            1.8 Beta Preview
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-black text-slate-100 tracking-wider mb-1">
          Bedrock Studio <span className="text-emerald-400 font-extrabold">1.8 Beta Preview</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mb-7 max-w-xs">
          Editor profesional de bloques para Minecraft Bedrock
        </p>

        {/* Progress Card */}
        <div className="w-full max-w-xs bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col gap-2.5">
          {/* Header with Step & Numeric Percentage */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 truncate max-w-[200px] text-left">
              {loadingMessage}
            </span>
            <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">
              {loadingProgress}%
            </span>
          </div>

          {/* Progress Bar (1% to 100%) */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.min(100, Math.max(1, loadingProgress))}%` }}
            />
          </div>

          {/* Informational Sub-Message */}
          <p className="text-[11px] text-slate-400 font-mono text-left truncate pt-0.5">
            {loadingDetail}
          </p>
        </div>

        {/* Bottom micro note */}
        <span className="text-[10px] text-slate-400 font-mono mt-6">
          Compatibilidad Bedrock 1.26.20 · IndexedDB Local Seguro
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans antialiased overflow-x-hidden">
      {/* Active View Switching */}
      {activeProject ? (
        <ProjectDetailView
          project={activeProject}
          saveStatus={saveStatus}
          onBack={() => setActiveProjectId(null)}
          onOpenManifest={() => {
            setEditingProject(activeProject);
            setIsManifestModalOpen(true);
          }}
          onSaveProject={handleSaveActiveProject}
          onOpenBlockWizard={() => {
            setEditingBlock(null);
            setIsFullBlockEditorOpen(true);
          }}
          onOpenBlockEditor={(blk) => {
            setEditingBlock(blk);
            setIsFullBlockEditorOpen(true);
          }}
          onOpenTexturePainter={() => setIsTexturePainterOpen(true)}
          onOpenTextureLibrary={() => {
            setTargetItemTextureForLibrary(false);
            setTargetFaceForLibrary(null);
            setIsTextureLibraryOpen(true);
          }}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onDeleteBlock={handleDeleteBlock}
          onDeleteTexture={handleDeleteTexture}
          onSaveGroup={handleSaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onOpenCreateRecipe={() => {
            setEditingRecipe(null);
            setIsRecipeModalOpen(true);
          }}
          onOpenEditRecipe={(rcp) => {
            setEditingRecipe(rcp);
            setIsRecipeModalOpen(true);
          }}
          onDeleteRecipe={handleDeleteRecipe}
          onUpdateProject={handleUpdateProject}
          onExportComplete={() => setActiveProjectId(null)}
        />
      ) : (
        <WorkView
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateProjectClick={() => {
            setEditingProject(null);
            setIsManifestModalOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onOpenChangelog={() => setIsChangelogOpen(true)}
        />
      )}

      {/* Onboarding Carousel */}
      <ReleasePreviewModal
        isOpen={isReleasePreviewOpen}
        onClose={async () => {
          setIsReleasePreviewOpen(false);
          await dbService.setSeenReleasePreview(true);
          if (showOnboardingAfterRelease) {
            setIsOnboardingOpen(true);
            setShowOnboardingAfterRelease(false);
          }
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      {/* Novedades v0.1.3 Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* Tutorial Rápido de Creación de Bloque */}
      <BlockTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartEditor={() => {
          setIsTutorialOpen(false);
          setEditingBlock(null);
          setIsFullBlockEditorOpen(true);
        }}
      />

      {/* Manifest Modal (Crear o Editar Addon) */}
      <ManifestModal
        isOpen={isManifestModalOpen}
        initialProject={editingProject}
        onClose={() => {
          setIsManifestModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveManifest}
      />

      {/* Editor Completo de Bloque v0.1.3 (Identidad, Multilingüe, Atlas 1/3/6 caras, Propiedades) */}
      {activeProject && (
        <FullBlockEditorModal
          isOpen={isFullBlockEditorOpen}
          block={editingBlock}
          existingBlocks={activeProject.blocks}
          availableTextures={activeProject.textures}
          availableGroups={activeProject.groups || []}
          assignedTexture={assignedTextureForEditor}
          onClose={() => {
            setIsFullBlockEditorOpen(false);
            setEditingBlock(null);
          }}
          onSaveBlock={handleSaveBlock}
          onOpenTextureLibraryForFace={(face) => {
            setTargetItemTextureForLibrary(false);
            setTargetFaceForLibrary(face);
            setIsTextureLibraryOpen(true);
          }}
          onOpenTextureLibraryForItem={() => {
            setTargetFaceForLibrary(null);
            setTargetItemTextureForLibrary(true);
            setIsTextureLibraryOpen(true);
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />
      )}

      {/* Biblioteca Unificada de Texturas */}
      {activeProject && (
        <TextureLibraryModal
          isOpen={isTextureLibraryOpen}
          project={activeProject}
          onClose={() => {
            setIsTextureLibraryOpen(false);
            setTargetFaceForLibrary(null);
            setTargetItemTextureForLibrary(false);
          }}
          onSelectTextureForItem={targetItemTextureForLibrary ? (texDataUrl, textureId) => {
            setAssignedTextureForEditor({ face: 'item', texDataUrl, textureId, timestamp: Date.now() });
            setTargetItemTextureForLibrary(false);
            setIsTextureLibraryOpen(false);
          } : undefined}
          onSelectTextureForFace={
            targetFaceForLibrary
              ? (texDataUrl) => {
                  setAssignedTextureForEditor({
                    face: targetFaceForLibrary,
                    texDataUrl,
                    timestamp: Date.now(),
                  });
                  setTargetFaceForLibrary(null);
                  setIsTextureLibraryOpen(false);
                }
              : undefined
          }
          onSaveNewTexture={handleSaveTexture}
          onDeleteTexture={handleDeleteTexture}
          onOpenPainter={() => setIsTexturePainterOpen(true)}
        />
      )}

      {/* Sistema de Diagnóstico y Validación Previa */}
      {activeProject && (
        <DiagnosticsModal
          isOpen={isDiagnosticsOpen}
          project={activeProject}
          issues={runProjectDiagnostics(activeProject)}
          onClose={() => setIsDiagnosticsOpen(false)}
          onAutoFix={handleAutoFix}
          onProceedExport={handleProceedExport}
        />
      )}

      {/* Editor Táctil Pixel Art Avanzado */}
      <TexturePainterModal
        isOpen={isTexturePainterOpen}
        onClose={() => {
          setIsTexturePainterOpen(false);
          setTargetFaceForLibrary(null);
        }}
        onSaveTexture={handleSaveTexture}
        initialBlock={editingBlock}
        targetFace={targetFaceForLibrary}
        onApplyToBlockFace={(face, dataUrl) => {
          setAssignedTextureForEditor({
            face,
            texDataUrl: dataUrl,
            timestamp: Date.now(),
          });
        }}
      />

      {/* Mesa de Trabajo 3×3 — Editor de Recetas de Fabricación (1.8 Beta Preview) */}
      {activeProject && (
        <CraftingRecipeModal
          isOpen={isRecipeModalOpen}
          project={activeProject}
          recipeToEdit={editingRecipe}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setEditingRecipe(null);
          }}
          onSaveRecipe={handleSaveRecipe}
        />
      )}
    </div>
  );
}

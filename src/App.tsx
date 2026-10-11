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
  DiagnosticIssue,
} from './types/addon';
import { dbService } from './services/db';
import { OnboardingModal } from './components/OnboardingModal';
import { ManifestModal } from './components/ManifestModal';
import { TexturePainterModal } from './components/TexturePainterModal';
import { WorkView } from './components/WorkView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { ChangelogModal } from './components/ChangelogModal';
import { BlockTutorialModal } from './components/BlockTutorialModal';
import { FullBlockEditorModal } from './components/FullBlockEditorModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { TextureLibraryModal } from './components/TextureLibraryModal';
import { runProjectDiagnostics } from './utils/diagnostics';
import { exportAddonToMcaddon } from './utils/exporter';
import confetti from 'canvas-confetti';

export default function App() {
  // Phase 1: Splash Loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

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
  const [assignedTextureForEditor, setAssignedTextureForEditor] = useState<{
    face: BlockFaceKey;
    texDataUrl: string;
    timestamp: number;
  } | null>(null);

  // Diagnostics Modal
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // Load from IndexedDB on startup
  const loadProjectsFromDb = useCallback(async () => {
    try {
      const stored = await dbService.getProjects();
      setProjects(stored);
      const seen = await dbService.hasSeenOnboarding();
      if (!seen) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Error al inicializar IndexedDB:', err);
    } finally {
      setTimeout(() => setIsLoading(false), 800);
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
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  // 1. Initial Splash Screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090d16] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 relative shadow-2xl">
          <i className="bx bxs-cube text-4xl text-emerald-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#090d16]" />
        </div>
        <h1 className="text-lg font-black text-slate-100 tracking-wider mb-1">
          Bedrock Studio <span className="text-emerald-400">v0.1.3</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mb-6">
          Editor profesional de bloques para Minecraft Bedrock
        </p>

        <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full w-1/2 animate-[spin_1.5s_linear_infinite]" />
        </div>
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
            setTargetFaceForLibrary(null);
            setIsTextureLibraryOpen(true);
          }}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onDeleteBlock={handleDeleteBlock}
          onDeleteTexture={handleDeleteTexture}
          onSaveGroup={handleSaveGroup}
          onDeleteGroup={handleDeleteGroup}
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
            setTargetFaceForLibrary(face);
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
          }}
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
    </div>
  );
}

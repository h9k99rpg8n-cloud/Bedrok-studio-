import localforage from 'localforage';
import { AddonProject } from '../types/addon';
import { generateBedrockUUID } from '../utils/uuid';

// Prefer IndexedDB and fall back to localStorage when the browser blocks IndexedDB.
localforage.config({
  name: 'BedrockStudioDB',
  storeName: 'bedrock_studio_projects',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
  description: 'Almacenamiento persistente IndexedDB para Bedrock Studio v0.1.3',
});

// App settings use the same fallback order as project storage.
const settingsStore = localforage.createInstance({
  name: 'BedrockStudioDB',
  storeName: 'app_settings',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
});

export const dbService = {
  /**
   * Retrieves all addon projects from IndexedDB
   */
  async getProjects(): Promise<AddonProject[]> {
    try {
      const keys = await localforage.keys();
      const projects: AddonProject[] = [];
      for (const key of keys) {
        const item = await localforage.getItem<AddonProject>(key);
        if (item && item.id) {
          // Ensure arrays are initialized cleanly
          projects.push({
            ...item,
            blocks: Array.isArray(item.blocks) ? item.blocks : [],
            textures: Array.isArray(item.textures) ? item.textures : [],
            groups: Array.isArray(item.groups) ? item.groups : [],
            recipes: Array.isArray(item.recipes) ? item.recipes : [],
          });
        }
      }
      return projects;
    } catch (err) {
      console.error('Error al leer proyectos de IndexedDB:', err);
      return [];
    }
  },

  /**
   * Retrieves a single project by ID
   */
  async getProject(id: string): Promise<AddonProject | null> {
    try {
      const proj = await localforage.getItem<AddonProject>(id);
      if (proj) {
        return {
          ...proj,
          blocks: Array.isArray(proj.blocks) ? proj.blocks : [],
          textures: Array.isArray(proj.textures) ? proj.textures : [],
          groups: Array.isArray(proj.groups) ? proj.groups : [],
          recipes: Array.isArray(proj.recipes) ? proj.recipes : [],
        };
      }
      return null;
    } catch (err) {
      console.error(`Error al obtener proyecto ${id} de IndexedDB:`, err);
      return null;
    }
  },

  /**
   * Saves or updates a project in IndexedDB with deep cloning to prevent reference leaks
   */
  async saveProject(project: AddonProject): Promise<void> {
    try {
      const cleanProject: AddonProject = JSON.parse(JSON.stringify({
        ...project,
        updatedAt: Date.now(),
      }));
      await localforage.setItem(cleanProject.id, cleanProject);
    } catch (err) {
      console.error('Error al guardar en IndexedDB:', err);
      throw err;
    }
  },

  /**
   * Deletes a project from IndexedDB
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await localforage.removeItem(id);
    } catch (err) {
      console.error(`Error al eliminar proyecto ${id} de IndexedDB:`, err);
      throw err;
    }
  },

  /**
   * Duplicates a project safely with deep cloned data, fresh UUIDs, and isolated blocks/textures
   */
  async duplicateProject(project: AddonProject): Promise<AddonProject> {
    try {
      const cloned: AddonProject = JSON.parse(JSON.stringify(project));
      const newId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      cloned.id = newId;
      cloned.name = `${cloned.name} (Copia)`;
      cloned.bpUuid = generateBedrockUUID();
      cloned.rpUuid = generateBedrockUUID();
      cloned.createdAt = Date.now();
      cloned.updatedAt = Date.now();
      cloned.usedCount = 0;

      // Duplicate groups with new IDs and map old groupId to new groupId
      const groupIdMap: Record<string, string> = {};
      if (Array.isArray(cloned.groups)) {
        cloned.groups = cloned.groups.map((grp) => {
          const newGrpId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          groupIdMap[grp.id] = newGrpId;
          return {
            ...grp,
            id: newGrpId,
          };
        });
      } else {
        cloned.groups = [];
      }

      // Assign new IDs to duplicated blocks and remap custom mineral items consistently.
      if (Array.isArray(cloned.blocks)) {
        const mineralItemIdMap: Record<string, string> = {};
        cloned.blocks = cloned.blocks.map((blk) => {
          let mineral = blk.mineral;
          if (mineral?.customItem && mineral.dropItemId?.startsWith('custom:')) {
            if (!mineralItemIdMap[mineral.dropItemId]) {
              const oldItemId = mineral.dropItemId.slice('custom:'.length);
              mineralItemIdMap[mineral.dropItemId] = `custom:${oldItemId}_copy`;
            }
            mineral = { ...mineral, dropItemId: mineralItemIdMap[mineral.dropItemId] };
          }
          return {
            ...blk,
            id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            identifier: `${blk.identifier}_copy`,
            displayName: `${blk.displayName} (Copia)`,
            groupId: blk.groupId ? (groupIdMap[blk.groupId] || blk.groupId) : undefined,
            mineral,
          };
        });
      }

      // Duplicate recipes safely
      if (Array.isArray(cloned.recipes)) {
        cloned.recipes = cloned.recipes.map((rcp) => ({
          ...rcp,
          id: `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          identifier: `${rcp.identifier}_copy`,
          displayName: `${rcp.displayName} (Copia)`,
        }));
      } else {
        cloned.recipes = [];
      }

      await localforage.setItem(newId, cloned);
      return cloned;
    } catch (err) {
      console.error('Error al duplicar proyecto:', err);
      throw err;
    }
  },

  /**
   * Increments the project's used count for "Más usado" sort
   */
  async incrementUsage(id: string): Promise<void> {
    try {
      const proj = await localforage.getItem<AddonProject>(id);
      if (proj) {
        proj.usedCount = (proj.usedCount || 0) + 1;
        await localforage.setItem(id, proj);
      }
    } catch (err) {
      console.error('Error al incrementar uso:', err);
    }
  },

  /**
   * Checks if user has already seen onboarding in IndexedDB
   */
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const val = await settingsStore.getItem<boolean>('onboarding_seen');
      return !!val;
    } catch {
      return false;
    }
  },

  /**
   * Sets onboarding completed flag in IndexedDB
   */
  async setSeenOnboarding(seen: boolean): Promise<void> {
    try {
      await settingsStore.setItem('onboarding_seen', seen);
    } catch (err) {
      console.error('Error al guardar estado de onboarding en IndexedDB:', err);
    }
  },
};

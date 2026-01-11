/**
 * Design Store using Zustand
 * Manages design state with IndexedDB persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Canvas } from 'fabric';
import type { Design, Page, Layer, PageConfig } from '../../types/design.types';
import { generateId, DEFAULT_DESIGN_NAME } from '../../constants/design';
import {
  saveDesign,
  getDesign,
  savePageData,
  getPageData,
  deletePageData,
} from '../../infrastructure/storage/indexedDB';

// StateStorage interface for custom storage
interface StateStorage {
  getItem: (name: string) => Promise<string | null> | string | null;
  setItem: (name: string, value: string) => Promise<void> | void;
  removeItem: (name: string) => Promise<void> | void;
}

// State interface
interface DesignState {
  design: Design | null;
  canvasRefs: Map<string, Canvas | null>;
  
  // Design actions
  createDesign: (name?: string) => void;
  setDesignName: (name: string) => void;
  loadDesign: (designId: string) => Promise<void>;
  
  // Page actions
  addPage: (config: Omit<PageConfig, 'id'>) => void;
  deletePage: (pageId: string) => Promise<void>;
  setActivePage: (pageId: string) => Promise<void>;
  updatePageConfig: (pageId: string, config: Partial<PageConfig>) => void;
  
  // Layer actions
  addLayer: (pageId: string, layer: Omit<Layer, 'id'>) => void;
  deleteLayer: (pageId: string, layerId: string) => void;
  updateLayer: (pageId: string, layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (pageId: string, layerId: string | null) => void;
  toggleLayerVisibility: (pageId: string, layerId: string) => void;
  toggleLayerLock: (pageId: string, layerId: string) => void;
  reorderLayers: (pageId: string, oldIndex: number, newIndex: number) => void;
  
  // Canvas actions
  setCanvasRef: (pageId: string, canvas: Canvas | null) => void;
  getCanvas: (pageId: string) => Canvas | null;
  saveCurrentPageData: () => Promise<void>;
  loadPageData: (pageId: string) => Promise<void>;
  
  // Helper getters
  getActivePage: () => Page | null;
  getActiveLayer: () => Layer | null;
}

// Custom storage for Zustand persist middleware
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Zustand persist stores the entire state under the key name
      // We need to handle this differently - just use localStorage for now
      // and manually save design to IndexedDB
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Store in localStorage for Zustand persist
      localStorage.setItem(name, value);
      
      // Also save design to IndexedDB
      const state = JSON.parse(value);
      if (state.design) {
        await saveDesign(state.design);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

// Helper functions
function updatePage(pages: Page[], pageId: string, updater: (page: Page) => Page): Page[] {
  return pages.map(page => (page.id === pageId ? updater(page) : page));
}

function updateLayer(
  pages: Page[],
  pageId: string,
  layerId: string,
  updater: (layer: Layer) => Layer
): Page[] {
  return pages.map(page =>
    page.id === pageId
      ? { ...page, layers: page.layers.map(layer => (layer.id === layerId ? updater(layer) : layer)) }
      : page
  );
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      design: null,
      canvasRefs: new Map(),

      // Create new design
      createDesign: (name: string = DEFAULT_DESIGN_NAME) => {
        const design: Design = {
          id: generateId('design'),
          name,
          pages: [],
          activePageId: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ design });
        saveDesign(design);
      },

      // Set design name
      setDesignName: (name: string) => {
        const { design } = get();
        if (!design) return;
        
        const updatedDesign = {
          ...design,
          name,
          updatedAt: Date.now(),
        };
        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Load design from IndexedDB
      loadDesign: async (designId: string) => {
        const design = await getDesign(designId);
        if (design) {
          set({ design });
        }
      },

      // Add page
      addPage: (config: Omit<PageConfig, 'id'>) => {
        const { design } = get();
        if (!design) return;

        const newPage: Page = {
          id: generateId('page'),
          config: {
            id: generateId('page_config'),
            name: config.name,
            width: config.width,
            height: config.height,
            backgroundColor: config.backgroundColor,
          },
          layers: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedDesign = {
          ...design,
          pages: [...design.pages, newPage],
          activePageId: newPage.id,
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Delete page
      deletePage: async (pageId: string) => {
        const { design } = get();
        if (!design) return;

        const pages = design.pages.filter(p => p.id !== pageId);
        if (pages.length === 0) return; // Can't delete last page

        const activePageId =
          design.activePageId === pageId ? pages[0].id : design.activePageId;

        const updatedDesign = {
          ...design,
          pages,
          activePageId,
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        await saveDesign(updatedDesign);
        await deletePageData(design.id, pageId);
      },

      // Set active page (with data isolation)
      setActivePage: async (pageId: string) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        // Save current page data BEFORE updating activePageId
        // This ensures we use the existing canvas before it gets disposed
        if (design.activePageId) {
          const currentCanvas = canvasRefs.get(design.activePageId);
          if (currentCanvas) {
            const objects = currentCanvas.getObjects();
            const canvasJSON = JSON.stringify(currentCanvas.toJSON());
            console.log(`[setActivePage] Saving ${objects.length} objects for current page ${design.activePageId} before switching`);
            await savePageData(design.id, design.activePageId, canvasJSON);
            console.log(`[setActivePage] Successfully saved current page data`);
          }
        }

        // Update active page
        const updatedDesign = { ...design, activePageId: pageId };
        set({ design: updatedDesign });
        await saveDesign(updatedDesign);

        // Note: loadPageData will be called automatically by FabricCanvas useEffect
        // when the new canvas instance is ready
      },

      // Update page config
      updatePageConfig: (pageId: string, config: Partial<PageConfig>) => {
        const { design } = get();
        if (!design) return;

        const updatedDesign = {
          ...design,
          pages: updatePage(design.pages, pageId, page => ({
            ...page,
            config: { ...page.config, ...config },
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Add layer
      addLayer: (pageId: string, layer: Omit<Layer, 'id'>) => {
        const { design } = get();
        if (!design) return;

        const updatedDesign = {
          ...design,
          pages: updatePage(design.pages, pageId, page => ({
            ...page,
            layers: [...page.layers, { ...layer, id: generateId('layer') }],
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Delete layer
      deleteLayer: (pageId: string, layerId: string) => {
        const { design } = get();
        if (!design) return;

        const updatedDesign = {
          ...design,
          pages: updatePage(design.pages, pageId, page => ({
            ...page,
            layers: page.layers.filter(l => l.id !== layerId),
            activeLayerId:
              page.activeLayerId === layerId ? undefined : page.activeLayerId,
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Update layer
      updateLayer: (pageId: string, layerId: string, updates: Partial<Layer>) => {
        const { design } = get();
        if (!design) return;

        const updatedDesign = {
          ...design,
          pages: updateLayer(
            design.pages,
            pageId,
            layerId,
            layer => ({ ...layer, ...updates })
          ),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);
      },

      // Set active layer
      setActiveLayer: (pageId: string, layerId: string | null) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        const updatedDesign = {
          ...design,
          pages: updatePage(design.pages, pageId, page => ({
            ...page,
            activeLayerId: layerId ?? undefined,
          })),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);

        // Select object in canvas
        if (layerId) {
          const currentPage = updatedDesign.pages.find(p => p.id === pageId);
          if (!currentPage) return;

          const layer = currentPage.layers.find(l => l.id === layerId);
          if (!layer || !layer.fabricObjectId) return;

          const canvas = canvasRefs.get(pageId);
          if (!canvas) return;

          const currentActiveObject = canvas.getActiveObject();
          const currentActiveId = (currentActiveObject as any)?.id;

          if (currentActiveId !== layer.fabricObjectId) {
            const fabricObject = canvas.getObjects().find(obj => obj.id === layer.fabricObjectId);
            if (fabricObject) {
              canvas.setActiveObject(fabricObject);
              canvas.requestRenderAll();
            }
          }
        }
      },

      // Toggle layer visibility
      toggleLayerVisibility: (pageId: string, layerId: string) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        const currentPage = design.pages.find(p => p.id === pageId);
        if (!currentPage) return;

        const layer = currentPage.layers.find(l => l.id === layerId);
        if (!layer || !layer.fabricObjectId) return;

        const newVisible = !layer.visible;

        const updatedDesign = {
          ...design,
          pages: updateLayer(
            design.pages,
            pageId,
            layerId,
            layer => ({ ...layer, visible: newVisible })
          ),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);

        // Update fabric object
        const canvas = canvasRefs.get(pageId);
        if (!canvas) return;

        const fabricObject = canvas.getObjects().find(obj => obj.id === layer.fabricObjectId);
        if (fabricObject) {
          fabricObject.set('visible', newVisible);
          fabricObject.set('selectable', newVisible);
          fabricObject.set('evented', newVisible);
          canvas.requestRenderAll();
        }
      },

      // Toggle layer lock
      toggleLayerLock: (pageId: string, layerId: string) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        const currentPage = design.pages.find(p => p.id === pageId);
        if (!currentPage) return;

        const layer = currentPage.layers.find(l => l.id === layerId);
        if (!layer || !layer.fabricObjectId) return;

        const newLocked = !layer.locked;

        const updatedDesign = {
          ...design,
          pages: updateLayer(
            design.pages,
            pageId,
            layerId,
            layer => ({ ...layer, locked: newLocked })
          ),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);

        // Update fabric object
        const canvas = canvasRefs.get(pageId);
        if (!canvas) return;

        const fabricObject = canvas.getObjects().find(obj => obj.id === layer.fabricObjectId);
        if (fabricObject) {
          fabricObject.set('selectable', !newLocked);
          fabricObject.set('evented', !newLocked);
          fabricObject.set('lockMovementX', newLocked);
          fabricObject.set('lockMovementY', newLocked);
          fabricObject.set('lockRotation', newLocked);
          fabricObject.set('lockScalingX', newLocked);
          fabricObject.set('lockScalingY', newLocked);
          canvas.requestRenderAll();
        }
      },

      // Reorder layers
      reorderLayers: (pageId: string, oldIndex: number, newIndex: number) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        const currentPage = design.pages.find(p => p.id === pageId);
        if (!currentPage) return;

        const movedLayer = currentPage.layers[oldIndex];
        if (!movedLayer || !movedLayer.fabricObjectId) return;

        const updatedDesign = {
          ...design,
          pages: updatePage(design.pages, pageId, page => {
            const layers = [...page.layers];
            const [moved] = layers.splice(oldIndex, 1);
            layers.splice(newIndex, 0, moved);
            return { ...page, layers, updatedAt: Date.now() };
          }),
          updatedAt: Date.now(),
        };

        set({ design: updatedDesign });
        saveDesign(updatedDesign);

        // Update fabric canvas
        const canvas = canvasRefs.get(pageId);
        if (!canvas) return;

        const fabricObject = canvas.getObjects().find(obj => obj.id === movedLayer.fabricObjectId);
        if (!fabricObject) return;

        canvas.moveObjectTo(fabricObject, newIndex);
        canvas.requestRenderAll();
      },

      // Set canvas ref
      setCanvasRef: (pageId: string, canvas: Canvas | null) => {
        const { canvasRefs } = get();
        const newCanvasRefs = new Map(canvasRefs);
        newCanvasRefs.set(pageId, canvas);
        set({ canvasRefs: newCanvasRefs });
      },

      // Get canvas
      getCanvas: (pageId: string) => {
        const { canvasRefs } = get();
        return canvasRefs.get(pageId) || null;
      },

      // Save current page canvas data to IndexedDB
      saveCurrentPageData: async () => {
        const { design, canvasRefs } = get();
        if (!design || !design.activePageId) {
          console.log('[saveCurrentPageData] No design or active page');
          return;
        }

        const canvas = canvasRefs.get(design.activePageId);
        if (!canvas) {
          console.log(`[saveCurrentPageData] No canvas found for page ${design.activePageId}`);
          return;
        }

        const objects = canvas.getObjects();
        const canvasJSON = JSON.stringify(canvas.toJSON());
        console.log(`[saveCurrentPageData] Saving ${objects.length} objects for page ${design.activePageId}`);
        
        await savePageData(design.id, design.activePageId, canvasJSON);
        console.log(`[saveCurrentPageData] Successfully saved to IndexedDB`);
      },

      // Load page canvas data from IndexedDB
      loadPageData: async (pageId: string) => {
        const { design, canvasRefs } = get();
        if (!design) return;

        console.log(`[loadPageData] Loading data for page ${pageId}`);
        console.log(`[loadPageData] Available canvasRefs:`, Array.from(canvasRefs.keys()));
        console.log(`[loadPageData] Looking for canvas of page:`, pageId);

        // When using key prop, each page gets its own canvas instance
        // We need to find the canvas for this specific page
        // Try to get canvas from canvasRefs, or use the one from CanvasContext
        const canvasEntries = Array.from(canvasRefs.entries());
        let canvas: Canvas | null = null;

        // Try to find canvas by pageId
        const canvasByPageId = canvasRefs.get(pageId);
        if (canvasByPageId) {
          console.log(`[loadPageData] Found canvas by pageId`);
          canvas = canvasByPageId;
        } else {
          // Fallback: use any available canvas (for backward compatibility)
          console.log(`[loadPageData] Canvas not found by pageId, trying fallback`);
          canvas = canvasEntries[0]?.[1] || null;
        }

        // Check if canvas exists - don't check context as it may not be available immediately
        if (!canvas) {
          console.warn('[loadPageData] Canvas not available, skipping page data load');
          return;
        }

        // Wait for canvas to be fully initialized
        if (!canvas.getElement()) {
          console.warn('[loadPageData] Canvas element not available, skipping page data load');
          return;
        }

        console.log(`[loadPageData] Canvas found and initialized, loading data...`);

        const canvasJSON = await getPageData(design.id, pageId);
        if (canvasJSON) {
          try {
            await canvas.loadFromJSON(JSON.parse(canvasJSON));
            canvas.requestRenderAll();
            console.log(`[loadPageData] Successfully loaded ${canvas.getObjects().length} objects for page ${pageId}`);
          } catch (error) {
            console.error('[loadPageData] Failed to load canvas data:', error);
            // Clear canvas on error
            try {
              canvas.clear();
              canvas.requestRenderAll();
            } catch (clearError) {
              console.error('[loadPageData] Failed to clear canvas after load error:', clearError);
            }
          }
        } else {
          console.log(`[loadPageData] No saved data found for page ${pageId}`);
          // No saved data, canvas is already empty after initialization
          // Don't clear it to avoid errors
        }
      },

      // Get active page
      getActivePage: () => {
        const { design } = get();
        if (!design) return null;
        return design.pages.find(p => p.id === design.activePageId) || null;
      },

      // Get active layer
      getActiveLayer: () => {
        const { getActivePage } = get();
        const activePage = getActivePage();
        if (!activePage || !activePage.activeLayerId) return null;
        return activePage.layers.find(l => l.id === activePage.activeLayerId) || null;
      },
    }),
    {
      name: 'design-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ design: state.design }),
    }
  )
);

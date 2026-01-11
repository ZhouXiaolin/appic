/**
 * DesignContext - 管理设计项目状态
 * 支持 Design -> Page -> Layer 三层结构
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import type { Canvas } from 'fabric';
import type { Design, Page, Layer, PageConfig } from '../types/design.types';
import { generateId, DEFAULT_DESIGN_NAME } from '../constants/design';

// Action 类型
type DesignAction =
  | { type: 'INIT_DESIGN'; payload: Design }
  | { type: 'SET_DESIGN_NAME'; payload: string }
  | { type: 'ADD_PAGE'; payload: { config: Omit<PageConfig, 'id'> } }
  | { type: 'DELETE_PAGE'; payload: string }
  | { type: 'SET_ACTIVE_PAGE'; payload: string }
  | { type: 'UPDATE_PAGE_CONFIG'; payload: { pageId: string; config: Partial<PageConfig> } }
  | { type: 'ADD_LAYER'; payload: { pageId: string; layer: Omit<Layer, 'id'> } }
  | { type: 'DELETE_LAYER'; payload: { pageId: string; layerId: string } }
  | { type: 'UPDATE_LAYER'; payload: { pageId: string; layerId: string; updates: Partial<Layer> } }
  | { type: 'SET_ACTIVE_LAYER'; payload: { pageId: string; layerId: string | null } }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: { pageId: string; layerId: string } }
  | { type: 'TOGGLE_LAYER_LOCK'; payload: { pageId: string; layerId: string } }
  | { type: 'SET_CANVAS_REF'; payload: { pageId: string; canvas: Canvas | null } };

// 状态
interface DesignState {
  design: Design | null;
  canvasRefs: Map<string, Canvas | null>;
}

// 初始状态
const initialState: DesignState = {
  design: null,
  canvasRefs: new Map(),
};

// 辅助函数：更新指定页面的属性
function updatePage(pages: Page[], pageId: string, updater: (page: Page) => Page): Page[] {
  return pages.map(page => (page.id === pageId ? updater(page) : page));
}

// 辅助函数：更新指定页面的指定图层
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

// Reducer
function designReducer(state: DesignState, action: DesignAction): DesignState {
  const design = state.design;
  if (!design && action.type !== 'INIT_DESIGN') {
    return state;
  }

  switch (action.type) {
    case 'INIT_DESIGN': {
      return {
        ...state,
        design: action.payload,
      };
    }

    case 'SET_DESIGN_NAME': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          name: action.payload,
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_PAGE': {
      if (!design) return state;
      const newPage: Page = {
        id: generateId('page'),
        config: {
          id: generateId('page_config'),
          name: action.payload.config.name,
          width: action.payload.config.width,
          height: action.payload.config.height,
          backgroundColor: action.payload.config.backgroundColor,
        },
        layers: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        design: {
          ...design,
          pages: [...design.pages, newPage],
          activePageId: newPage.id,
          updatedAt: Date.now(),
        },
      };
    }

    case 'DELETE_PAGE': {
      if (!design) return state;
      const pages = design.pages.filter(p => p.id !== action.payload);
      if (pages.length === 0) return state; // 不能删除最后一个页面
      const activePageId =
        design.activePageId === action.payload ? pages[0].id : design.activePageId;
      return {
        ...state,
        design: {
          ...design,
          pages,
          activePageId,
          updatedAt: Date.now(),
        },
      };
    }

    case 'SET_ACTIVE_PAGE': {
      if (!design) return state;
      return {
        ...state,
        design: { ...design, activePageId: action.payload },
      };
    }

    case 'UPDATE_PAGE_CONFIG': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updatePage(design.pages, action.payload.pageId, page => ({
            ...page,
            config: { ...page.config, ...action.payload.config },
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_LAYER': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updatePage(design.pages, action.payload.pageId, page => ({
            ...page,
            layers: [...page.layers, { ...action.payload.layer, id: generateId('layer') }],
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        },
      };
    }

    case 'DELETE_LAYER': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updatePage(design.pages, action.payload.pageId, page => ({
            ...page,
            layers: page.layers.filter(l => l.id !== action.payload.layerId),
            activeLayerId:
              page.activeLayerId === action.payload.layerId ? undefined : page.activeLayerId,
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        },
      };
    }

    case 'UPDATE_LAYER': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updateLayer(
            design.pages,
            action.payload.pageId,
            action.payload.layerId,
            layer => ({ ...layer, ...action.payload.updates })
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'SET_ACTIVE_LAYER': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updatePage(design.pages, action.payload.pageId, page => ({
            ...page,
            activeLayerId: action.payload.layerId ?? undefined,
          })),
        },
      };
    }

    case 'TOGGLE_LAYER_VISIBILITY': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updateLayer(
            design.pages,
            action.payload.pageId,
            action.payload.layerId,
            layer => ({ ...layer, visible: !layer.visible })
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'TOGGLE_LAYER_LOCK': {
      if (!design) return state;
      return {
        ...state,
        design: {
          ...design,
          pages: updateLayer(
            design.pages,
            action.payload.pageId,
            action.payload.layerId,
            layer => ({ ...layer, locked: !layer.locked })
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'SET_CANVAS_REF': {
      const newCanvasRefs = new Map(state.canvasRefs);
      newCanvasRefs.set(action.payload.pageId, action.payload.canvas);
      return {
        ...state,
        canvasRefs: newCanvasRefs,
      };
    }

    default:
      return state;
  }
}

// Context 类型
interface DesignContextValue {
  state: DesignState;
  dispatch: React.Dispatch<DesignAction>;

  // 便捷方法
  createDesign: (name?: string) => void;
  setDesignName: (name: string) => void;
  addPage: (config: Omit<PageConfig, 'id'>) => void;
  deletePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  updatePageConfig: (pageId: string, config: Partial<PageConfig>) => void;

  addLayer: (pageId: string, layer: Omit<Layer, 'id'>) => void;
  deleteLayer: (pageId: string, layerId: string) => void;
  updateLayer: (pageId: string, layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (pageId: string, layerId: string | null) => void;
  toggleLayerVisibility: (pageId: string, layerId: string) => void;
  toggleLayerLock: (pageId: string, layerId: string) => void;

  getActivePage: () => Page | null;
  getActiveLayer: () => Layer | null;
  getCanvas: (pageId: string) => Canvas | null;
  setCanvasRef: (pageId: string, canvas: Canvas | null) => void;
}

// Context
const DesignContext = createContext<DesignContextValue | undefined>(undefined);

// Provider
export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(designReducer, initialState);

  // 创建新设计
  const createDesign = useCallback((name: string = DEFAULT_DESIGN_NAME) => {
    const design: Design = {
      id: generateId('design'),
      name,
      pages: [],
      activePageId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'INIT_DESIGN', payload: design });
  }, []);

  // 设置设计名称
  const setDesignName = useCallback((name: string) => {
    dispatch({ type: 'SET_DESIGN_NAME', payload: name });
  }, []);

  // 添加页面
  const addPage = useCallback((config: Omit<PageConfig, 'id'>) => {
    dispatch({ type: 'ADD_PAGE', payload: { config } });
  }, []);

  // 删除页面
  const deletePage = useCallback((pageId: string) => {
    dispatch({ type: 'DELETE_PAGE', payload: pageId });
  }, []);

  // 设置活动页面
  const setActivePage = useCallback((pageId: string) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: pageId });
  }, []);

  // 更新页面配置
  const updatePageConfig = useCallback((pageId: string, config: Partial<PageConfig>) => {
    dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { pageId, config } });
  }, []);

  // 添加图层
  const addLayer = useCallback((pageId: string, layer: Omit<Layer, 'id'>) => {
    dispatch({ type: 'ADD_LAYER', payload: { pageId, layer } });
  }, []);

  // 删除图层
  const deleteLayer = useCallback((pageId: string, layerId: string) => {
    dispatch({ type: 'DELETE_LAYER', payload: { pageId, layerId } });
  }, []);

  // 更新图层
  const updateLayer = useCallback((pageId: string, layerId: string, updates: Partial<Layer>) => {
    dispatch({ type: 'UPDATE_LAYER', payload: { pageId, layerId, updates } });
  }, []);

  // 设置活动图层
  const setActiveLayer = useCallback((pageId: string, layerId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_LAYER', payload: { pageId, layerId } });
  }, []);

  // 切换图层可见性
  const toggleLayerVisibility = useCallback((pageId: string, layerId: string) => {
    // 获取当前页面
    const currentPage = state.design?.pages.find(p => p.id === pageId);
    if (!currentPage) return;

    // 找到对应的图层
    const layer = currentPage.layers.find(l => l.id === layerId);
    if (!layer || !layer.fabricObjectId) return;

    // 计算新的可见性状态（取反）
    const newVisible = !layer.visible;

    // 先更新状态
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: { pageId, layerId } });

    // 然后操作 Fabric 对象
    const canvas = state.canvasRefs.get(pageId);
    if (!canvas) return;

    // 在 Fabric canvas 中查找对应的对象
    const fabricObject = canvas.getObjects().find(obj => obj.id === layer.fabricObjectId);
    if (fabricObject) {
      fabricObject.set('visible', newVisible);
      fabricObject.set('selectable', newVisible);
      fabricObject.set('evented', newVisible);
      canvas.requestRenderAll();
    }
  }, [state.design, state.canvasRefs]);

  // 切换图层锁定
  const toggleLayerLock = useCallback((pageId: string, layerId: string) => {
    // 获取当前页面
    const currentPage = state.design?.pages.find(p => p.id === pageId);
    if (!currentPage) return;

    // 找到对应的图层
    const layer = currentPage.layers.find(l => l.id === layerId);
    if (!layer || !layer.fabricObjectId) return;

    // 计算新的锁定状态（取反）
    const newLocked = !layer.locked;

    // 先更新状态
    dispatch({ type: 'TOGGLE_LAYER_LOCK', payload: { pageId, layerId } });

    // 然后操作 Fabric 对象
    const canvas = state.canvasRefs.get(pageId);
    if (!canvas) return;

    // 在 Fabric canvas 中查找对应的对象
    const fabricObject = canvas.getObjects().find(obj => obj.id === layer.fabricObjectId);
    if (fabricObject) {
      // 锁定后不可选择、不可移动、不可编辑
      fabricObject.set('selectable', !newLocked);
      fabricObject.set('evented', !newLocked);
      fabricObject.set('lockMovementX', newLocked);
      fabricObject.set('lockMovementY', newLocked);
      fabricObject.set('lockRotation', newLocked);
      fabricObject.set('lockScalingX', newLocked);
      fabricObject.set('lockScalingY', newLocked);
      canvas.requestRenderAll();
    }
  }, [state.design, state.canvasRefs]);

  // 获取活动页面
  const getActivePage = useCallback((): Page | null => {
    if (!state.design) return null;
    return state.design.pages.find(p => p.id === state.design!.activePageId) || null;
  }, [state.design]);

  // 获取活动图层
  const getActiveLayer = useCallback((): Layer | null => {
    const activePage = getActivePage();
    if (!activePage || !activePage.activeLayerId) return null;
    return activePage.layers.find(l => l.id === activePage.activeLayerId) || null;
  }, [getActivePage]);

  // 获取 Canvas
  const getCanvas = useCallback((pageId: string): Canvas | null => {
    return state.canvasRefs.get(pageId) || null;
  }, [state.canvasRefs]);

  // 设置 Canvas ref
  const setCanvasRef = useCallback((pageId: string, canvas: Canvas | null) => {
    dispatch({ type: 'SET_CANVAS_REF', payload: { pageId, canvas } });
  }, []);

  const value: DesignContextValue = {
    state,
    dispatch,
    createDesign,
    setDesignName,
    addPage,
    deletePage,
    setActivePage,
    updatePageConfig,
    addLayer,
    deleteLayer,
    updateLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    getActivePage,
    getActiveLayer,
    getCanvas,
    setCanvasRef,
  };

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

// Hook
export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesign must be used within DesignProvider');
  }
  return context;
}

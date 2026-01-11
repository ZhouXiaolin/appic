import React, { createContext, useContext, useReducer, useRef, useCallback, useState } from 'react';
import type { Canvas, Object as FabricObject } from 'fabric';
import type { CanvasState, CanvasConfig } from '../types/canvas.types';
import { defaultCanvasConfig } from '../constants/canvas';

// Action 类型
type CanvasAction =
  | { type: 'INIT_CANVAS'; payload: Canvas }
  | { type: 'SET_SELECTED'; payload: FabricObject | null }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_CONFIG'; payload: Partial<CanvasConfig> }
  | { type: 'CLEAR_CANVAS' };

// 初始状态
const initialState: CanvasState = {
  canvas: null,
  objects: [],
  selection: {
    selectedObjects: [],
    activeObject: null,
  },
  config: defaultCanvasConfig,
};

// Reducer
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'INIT_CANVAS':
      return {
        ...state,
        canvas: action.payload,
        objects: action.payload.getObjects(),
      };

    case 'SET_SELECTED':
      return {
        ...state,
        selection: {
          selectedObjects: action.payload ? [action.payload] : [],
          activeObject: action.payload,
        },
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: {
          selectedObjects: [],
          activeObject: null,
        },
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case 'CLEAR_CANVAS':
      return {
        ...state,
        objects: [],
        selection: {
          selectedObjects: [],
          activeObject: null,
        },
      };

    default:
      return state;
  }
}

// Context 类型
interface CanvasContextValue {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  canvasRef: React.MutableRefObject<Canvas | null>;
  selectedObject: FabricObject | null;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  setSelectedObject: (obj: FabricObject | null) => void;
  clearSelection: () => void;
  updateCanvasSize: (width: number, height: number) => void;
}

// Context
export const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

// Provider
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const canvasRef = useRef<Canvas | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setSelectedObject = useCallback((obj: FabricObject | null) => {
    if (obj) {
      canvasRef.current?.setActiveObject(obj);
      canvasRef.current?.requestRenderAll();
    }
    dispatch({ type: 'SET_SELECTED', payload: obj });
  }, []);

  const clearSelection = useCallback(() => {
    canvasRef.current?.discardActiveObject();
    canvasRef.current?.requestRenderAll();
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const updateCanvasSize = useCallback((width: number, height: number) => {
    if (canvasRef.current) {
      canvasRef.current.setDimensions({ width, height });
      // 同时更新DOM元素的样式，确保显示尺寸与canvas尺寸一致
      const canvasElement = canvasRef.current.getElement();
      if (canvasElement) {
        canvasElement.style.width = `${width}px`;
        canvasElement.style.height = `${height}px`;
        canvasElement.style.maxWidth = '100%';
        canvasElement.style.maxHeight = '100%';
      }
      dispatch({ type: 'UPDATE_CONFIG', payload: { width, height } });
    }
  }, []);

  const value: CanvasContextValue = {
    state,
    dispatch,
    canvasRef,
    selectedObject: state.selection.activeObject,
    isDragging,
    setIsDragging,
    setSelectedObject,
    clearSelection,
    updateCanvasSize,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

// Hook
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider');
  }
  return context;
}

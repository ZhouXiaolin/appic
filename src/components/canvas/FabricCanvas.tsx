import React, { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useCanvas } from '../../contexts/CanvasContext';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { useHistory } from '../../hooks/useHistory';
import { defaultCanvasConfig } from '../../constants/canvas';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  onReady?: (canvas: Canvas) => void;
}

export function FabricCanvas({ width = 800, height = 600, onReady }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch, canvasRef, setSelectedObject, clearSelection } = useCanvas();

  // 撤销/重做功能
  const { saveHistory } = useHistory(canvasRef.current);

  // 初始化 Canvas
  useEffect(() => {
    if (!containerRef.current || canvasRef.current) return;

    // 清空容器（防止重复初始化）
    containerRef.current.innerHTML = '';

    // 使用Fabric.js初始化canvas - 不传入元素，让Fabric.js自己创建
    const canvas = new Canvas(null, {
      width,
      height,
      backgroundColor: defaultCanvasConfig.backgroundColor,
      preserveObjectStacking: true,
      selection: true,
    });

    // 获取Fabric.js创建的canvas-container并添加到我们的容器中
    const canvasElement = canvas.getElement();
    const canvasContainer = canvasElement?.parentElement;
    if (canvasContainer) {
      containerRef.current.appendChild(canvasContainer);
    }

    canvasRef.current = canvas;
    dispatch({ type: 'INIT_CANVAS', payload: canvas });

    onReady?.(canvas);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 Canvas 事件
  useCanvasEvents(canvasRef.current, {
    'selection:created': (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        setSelectedObject(selected);
      }
    },
    'selection:updated': (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        setSelectedObject(selected);
      }
    },
    'selection:cleared': () => {
      clearSelection();
    },
    'object:modified': () => {
      saveHistory();
    },
    'object:added': () => {
      saveHistory();
    },
    'object:removed': () => {
      saveHistory();
    },
  });

  return (
    <div className="flex items-center justify-center bg-gray-100 p-8 min-h-full">
      <div
        ref={containerRef}
        className="bg-white shadow-lg relative overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          zIndex: 1,
        }}
      />
    </div>
  );
}

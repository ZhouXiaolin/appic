import { useEffect, useRef, useState } from 'react';
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

interface ScaleInfo {
  scale: number;
  width: number;
  height: number;
}

export function FabricCanvas({ width = 800, height = 600, onReady }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasInnerWrapperRef = useRef<HTMLDivElement>(null);
  const { dispatch, canvasRef, setSelectedObject, clearSelection } = useCanvas();
  const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({ scale: 1, width, height });

  // 撤销/重做功能
  const { saveHistory } = useHistory(canvasRef.current);

  // 计算缩放比例
  const calculateScale = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 留出一些边距 (每个方向 32px，总共 64px)
    const padding = 64;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    // 计算宽高比
    const canvasAspectRatio = width / height;
    const containerAspectRatio = availableWidth / availableHeight;

    let scale: number;

    if (canvasAspectRatio > containerAspectRatio) {
      // 画布更宽，以宽度为准
      scale = availableWidth / width;
    } else {
      // 画布更高，以高度为准
      scale = availableHeight / height;
    }

    // 限制最大缩放比例为 1（不放大，只缩小）
    scale = Math.min(scale, 1);

    setScaleInfo({ scale, width, height });
  };

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    resizeObserver.observe(containerRef.current);

    // 初始计算
    calculateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  // 初始化 Canvas
  useEffect(() => {
    if (!canvasInnerWrapperRef.current || canvasRef.current) return;

    // 清空容器（防止重复初始化）
    canvasInnerWrapperRef.current.innerHTML = '';

    // 使用Fabric.js初始化canvas - 不传入元素，让Fabric.js自己创建
    const canvas = new Canvas(undefined, {
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
      canvasInnerWrapperRef.current.appendChild(canvasContainer);
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
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100">
      {/* 外层容器：缩放后的尺寸 */}
      <div
        style={{
          width: `${width * scaleInfo.scale}px`,
          height: `${height * scaleInfo.scale}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 内层容器：原始尺寸，使用 transform scale */}
        <div
          ref={canvasInnerWrapperRef}
          className="bg-white shadow-lg relative"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scaleInfo.scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  );
}

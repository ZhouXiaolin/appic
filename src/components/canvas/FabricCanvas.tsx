import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';
import { Download } from 'lucide-react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { useHistory } from '../../hooks/useHistory';
import { defaultCanvasConfig } from '../../constants/canvas';
import { exportCanvas } from '../../utils/fabric/exportUtils';
import type { ExportFormat } from '../../types/canvas.types';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  onReady?: (canvas: Canvas) => void;
}

const PADDING = 64;

// 导出格式配置
const exportFormats: { format: ExportFormat; label: string; extension: string }[] = [
  { format: 'png', label: 'PNG 图片', extension: 'png' },
  { format: 'jpeg', label: 'JPEG 图片', extension: 'jpg' },
  { format: 'json', label: 'JSON 数据', extension: 'json' },
  { format: 'svg', label: 'SVG 矢量', extension: 'svg' },
];

interface ScaleInfo {
  scale: number;
  width: number;
  height: number;
}

export function FabricCanvas({ width = 800, height = 600, onReady }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasInnerWrapperRef = useRef<HTMLDivElement>(null);
  const { dispatch, canvasRef, setSelectedObject, clearSelection, state, setIsDragging } = useCanvas();
  const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({ scale: 1, width, height });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 撤销/重做功能
  const { saveHistory } = useHistory(canvasRef.current);

  // 计算缩放比例
  const calculateScale = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const availableWidth = containerWidth - PADDING;
    const availableHeight = containerHeight - PADDING;

    // 根据宽高比选择合适的缩放基准
    const canvasAspectRatio = width / height;
    const containerAspectRatio = availableWidth / availableHeight;

    let scale: number;
    if (canvasAspectRatio > containerAspectRatio) {
      scale = availableWidth / width;
    } else {
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

  // 导出处理函数
  const handleExport = (format: ExportFormat) => {
    if (!canvasRef.current) return;
    exportCanvas(canvasRef.current, format);
    setIsExportMenuOpen(false);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  // 监听 Canvas 事件
  useCanvasEvents(canvasRef.current, {
    'selection:created': (e) => {
      const selected = e.selected?.[0];
      if (selected) setSelectedObject(selected);
    },
    'selection:updated': (e) => {
      const selected = e.selected?.[0];
      if (selected) setSelectedObject(selected);
    },
    'selection:cleared': () => {
      clearSelection();
    },
    'mouse:dblclick': (e) => {
      const target = e.target;
      if (target) {
        setSelectedObject(target);
      }
    },
    'object:moving': () => {
      setIsDragging(true);
    },
    'object:scaling': () => {
      setIsDragging(true);
    },
    'object:rotating': () => {
      setIsDragging(true);
    },
    'object:modified': () => {
      setIsDragging(false);
      saveHistory();
    },
    'mouse:up': () => {
      setIsDragging(false);
    },
    'object:added': () => saveHistory(),
    'object:removed': () => saveHistory(),
  });

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100 relative">
      <div
        style={{
          width: width * scaleInfo.scale,
          height: height * scaleInfo.scale,
        }}
        className="flex items-center justify-center"
      >
        <div
          ref={canvasInnerWrapperRef}
          className="bg-white shadow-lg relative"
          style={{
            width,
            height,
            transform: `scale(${scaleInfo.scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* 右下角导出按钮 */}
      <div className="absolute bottom-4 right-4" ref={exportMenuRef}>
        <button
          onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
          disabled={!state.canvas}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50
                     rounded-lg shadow-md hover:shadow-lg border border-gray-200
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     disabled:hover:bg-white group"
          title="导出设计"
        >
          <Download className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
            导出
          </span>
        </button>

        {/* 导出选项弹出菜单 */}
        {isExportMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-lg
                          shadow-xl border border-gray-200 overflow-hidden">
            <div className="py-1">
              {exportFormats.map((item) => (
                <button
                  key={item.format}
                  onClick={() => handleExport(item.format)}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             text-left hover:bg-blue-50 transition-colors
                             group"
                >
                  <Download className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">.{item.extension}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

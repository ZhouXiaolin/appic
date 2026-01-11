import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from 'fabric';
import { Download } from 'lucide-react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useDesignStore } from '../../presentation/stores/useDesignStore';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';
import { useHistory } from '../../hooks/useHistory';
import { defaultCanvasConfig } from '../../constants/canvas';
import { exportCanvas } from '../../utils/fabric/exportUtils';
import type { ExportFormat } from '../../types/canvas.types';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  onReady?: (canvas: Canvas) => void;
  onObjectDelete?: (fabricObjectId: string) => void;
  onObjectSelect?: (fabricObjectId: string | null) => void;
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

export function FabricCanvas({ width = 800, height = 600, onReady, onObjectDelete, onObjectSelect }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasInnerWrapperRef = useRef<HTMLDivElement>(null);
  const { dispatch, canvasRef, setSelectedObject, clearSelection, state, setIsDragging } = useCanvas();
  const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({ scale: 1, width, height });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 撤销/重做功能 - pass current canvas ref value (will be null initially)
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

  // Get store actions for page data management
  const design = useDesignStore(state => state.design);
  const loadPageData = useDesignStore(state => state.loadPageData);
  const saveCurrentPageData = useDesignStore(state => state.saveCurrentPageData);

  // 当 canvas 准备好后，加载页面数据
  useEffect(() => {
    if (!canvasRef.current || !design?.activePageId) return;

    // 使用 requestAnimationFrame 确保在下一帧执行，此时 canvas 应该已经注册到 canvasRefs
    const rafId = requestAnimationFrame(() => {
      // 再使用 setTimeout 确保在所有状态更新后执行
      setTimeout(() => {
        loadPageData(design.activePageId);
      }, 50);
    });

    return () => cancelAnimationFrame(rafId);
  }, [canvasRef.current, design?.activePageId, loadPageData]);

  // 当画布尺寸变化时，更新 Canvas 尺寸
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.setDimensions({ width, height });
      canvas.requestRenderAll();
    }
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

  // 阻止文本编辑时的页面滚动
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // 保存当前滚动位置
    let scrollY = 0;
    let isEditing = false;
    let rafId: number | null = null;
    let scrollInterval: number | null = null;

    // 恢复滚动位置的函数
    const restoreScrollPosition = () => {
      if (window.scrollY !== scrollY) {
        window.scrollTo(0, scrollY);
      }
    };

    // 监听所有滚动事件
    const handleScroll = () => {
      if (isEditing && window.scrollY !== scrollY) {
        // 立即恢复滚动位置
        window.scrollTo(0, scrollY);
      }
    };

    // 使用捕获阶段监听滚动，确保优先处理
    window.addEventListener('scroll', handleScroll, true);

    // 开始持续恢复滚动位置
    const startRestoreScroll = () => {
      scrollY = window.scrollY;
      isEditing = true;
      console.log('[文本编辑] 保存滚动位置:', scrollY);

      // 设置文档样式防止滚动
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';

      // 立即执行一次恢复
      restoreScrollPosition();

      // 使用 setInterval 持续恢复（比 requestAnimationFrame 更可靠）
      scrollInterval = window.setInterval(() => {
        restoreScrollPosition();
      }, 16); // ~60fps
    };

    // 停止恢复滚动位置
    const stopRestoreScroll = () => {
      if (!isEditing) return;
      isEditing = false;
      console.log('[文本编辑] 恢复正常滚动');

      // 恢复文档样式
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';

      if (scrollInterval !== null) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // 监听双击文本事件（在 editing:entered 之前触发）
    const handleTextDoubleClick = () => {
      console.log('[FabricCanvas] 检测到文本双击，提前锁定滚动');
      startRestoreScroll();
    };

    // 监听 Fabric.js 的编辑事件
    const handleEditingEntered = () => {
      console.log('[FabricCanvas] editing:entered 事件触发');
      // 如果还没有开始保护（可能是直接进入编辑而没有双击），现在开始
      if (!isEditing) {
        startRestoreScroll();
      }
    };

    const handleEditingExited = () => {
      console.log('[FabricCanvas] editing:exited 事件触发');
      stopRestoreScroll();
    };

    // 注册事件监听
    window.addEventListener('fabric-text-double-click', handleTextDoubleClick);
    (canvas as any).on('editing:entered', handleEditingEntered);
    (canvas as any).on('editing:exited', handleEditingExited);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('fabric-text-double-click', handleTextDoubleClick);
      (canvas as any).off('editing:entered', handleEditingEntered);
      (canvas as any).off('editing:exited', handleEditingExited);
      stopRestoreScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save page data before browser close
  useEffect(() => {
    if (!design?.activePageId) return;

    // Save current page data before browser closes
    const handleBeforeUnload = () => {
      saveCurrentPageData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [design?.activePageId, saveCurrentPageData]);

  // 导出处理函数
  const handleExport = useCallback((format: ExportFormat) => {
    if (!canvasRef.current) return;
    exportCanvas(canvasRef.current, format);
    setIsExportMenuOpen(false);
  }, [canvasRef]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current?.contains(event.target as Node)) return;
      setIsExportMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  // Shared handler for object selection
  const handleSelectionChange = useCallback((selected: any) => {
    if (!selected) return;
    setSelectedObject(selected);
    const fabricObjectId = (selected as any).id;
    if (onObjectSelect && fabricObjectId) {
      onObjectSelect(fabricObjectId);
    }
  }, [onObjectSelect, setSelectedObject]);

  // Shared handler for history and auto-save
  const handleHistorySave = useCallback(() => {
    saveHistory();
    saveCurrentPageData();
  }, [saveHistory, saveCurrentPageData]);

  // Canvas 事件处理器 - 使用 useMemo 稳定引用
  const canvasEvents = useMemo(() => ({
    'selection:created': (e: any) => handleSelectionChange(e.selected?.[0]),
    'selection:updated': (e: any) => handleSelectionChange(e.selected?.[0]),
    'selection:cleared': () => {
      clearSelection();
      onObjectSelect?.(null);
    },
    'mouse:dblclick': (e: any) => {
      if (e.target) {
        setSelectedObject(e.target);
        // 双击文本对象时，立即开始保护滚动（在 Fabric.js 创建 textarea 之前）
        if ((e.target as any).type === 'textbox' || (e.target as any).type === 'text') {
          window.dispatchEvent(new CustomEvent('fabric-text-double-click'));
        }
      }
    },
    'object:moving': () => setIsDragging(true),
    'object:scaling': () => setIsDragging(true),
    'object:rotating': () => setIsDragging(true),
    'object:modified': () => {
      setIsDragging(false);
      handleHistorySave();
    },
    'mouse:up': () => setIsDragging(false),
    'object:added': handleHistorySave,
    'object:removed': handleHistorySave,
  }), [handleSelectionChange, clearSelection, onObjectSelect, setSelectedObject, setIsDragging, handleHistorySave]);

  // 监听 Canvas 事件
  useCanvasEvents(canvasRef.current, canvasEvents);

  // 键盘事件监听 - 删除选中对象
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const canvas = canvasRef.current;
      const activeObject = canvas?.getActiveObject();
      if (!activeObject) return;

      const fabricObjectId = (activeObject as any).id;
      if (!fabricObjectId) return;

      canvas?.remove(activeObject);
      canvas?.discardActiveObject();
      canvas?.requestRenderAll();

      clearSelection();
      saveHistory();
      saveCurrentPageData();
      onObjectDelete?.(fabricObjectId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasRef, clearSelection, saveHistory, saveCurrentPageData, onObjectDelete]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100 relative"
         style={{ touchAction: 'none', overscrollBehavior: 'none' }}>
      <div
        style={{
          width: width * scaleInfo.scale,
          height: height * scaleInfo.scale,
          touchAction: 'none',
          overscrollBehavior: 'none',
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
            touchAction: 'none',
            overscrollBehavior: 'none',
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

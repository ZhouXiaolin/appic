/**
 * 画布区域组件
 * 包含 FabricCanvas 和底部工具栏
 */
import { useCallback } from 'react';
import { useDesignStore } from '../../presentation/stores/useDesignStore';
import { useCanvas } from '../../contexts/CanvasContext';
import { FabricCanvas } from './FabricCanvas';
import { BottomToolbar } from '../toolbar/BottomToolbar';
import { createTextObject, createShapeObject, createImageObject } from '../../utils/fabric/objectFactory';
import type { CanvasObjectTypeValue } from '../../types/canvas.types';

type ItemType = 'text' | 'image' | 'rectangle' | 'circle' | 'triangle';

interface ShapeConfig {
  type: CanvasObjectTypeValue;
  width?: number;
  height?: number;
  radius?: number;
}

const SHAPE_CONFIGS: Record<'rectangle' | 'circle', ShapeConfig> = {
  rectangle: { type: 'rectangle' as const, width: 100, height: 100 },
  circle: { type: 'circle' as const, radius: 50 },
};

const LAYER_NAMES: Record<string, string> = {
  text: '文本',
  rectangle: '矩形',
  circle: '圆形',
};

export function CanvasArea() {
  const design = useDesignStore(state => state.design);
  const addLayer = useDesignStore(state => state.addLayer);
  const setCanvasRef = useDesignStore(state => state.setCanvasRef);
  const deleteLayer = useDesignStore(state => state.deleteLayer);
  const setActiveLayer = useDesignStore(state => state.setActiveLayer);
  const { canvasRef } = useCanvas();

  // Get active page from design
  const activePage = design?.pages.find(p => p.id === design.activePageId) || null;

  // 处理删除对象（从 Fabric Canvas 触发）
  const handleObjectDelete = useCallback((fabricObjectId: string) => {
    if (!activePage) return;

    // 找到对应的图层并删除
    const layerToDelete = activePage.layers.find(l => l.fabricObjectId === fabricObjectId);
    if (layerToDelete) {
      deleteLayer(activePage.id, layerToDelete.id);
    }
  }, [activePage, deleteLayer]);

  // 处理 Canvas 选中对象（从 Fabric Canvas 触发）
  const handleObjectSelect = useCallback((fabricObjectId: string | null) => {
    if (!activePage) return;

    if (fabricObjectId) {
      // 找到对应的图层并设置为活动图层
      const layerToSelect = activePage.layers.find(l => l.fabricObjectId === fabricObjectId);
      if (layerToSelect && activePage.activeLayerId !== layerToSelect.id) {
        // 只在选中状态改变时才更新，避免循环
        setActiveLayer(activePage.id, layerToSelect.id);
      }
    } else if (activePage.activeLayerId) {
      // 只在当前有选中图层时才清除，避免不必要的调用
      setActiveLayer(activePage.id, null);
    }
  }, [activePage, setActiveLayer]);

  const handleAddItem = async (type: ItemType) => {
    if (!canvasRef.current || !activePage) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 处理特殊类型
    if (type === 'image') {
      handleImageUpload();
      return;
    }
    if (type === 'triangle') {
      // TODO: 实现三角形创建逻辑
      return;
    }

    // 创建形状或文本对象
    const object = type === 'text'
      ? createTextObject({ x: centerX, y: centerY })
      : createShapeObject({
          ...SHAPE_CONFIGS[type as 'rectangle' | 'circle'],
          x: centerX,
          y: centerY,
        });

    // 新对象添加到画布最顶层，方便用户立即看到和操作
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();

    addLayer(activePage.id, {
      name: LAYER_NAMES[type],
      type,
      visible: true,
      locked: false,
      opacity: 1,
      fabricObjectId: object.id,
    });
  };

  const handleImageUpload = () => {
    if (!activePage) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvasRef.current) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgUrl = event.target?.result as string;
        if (!imgUrl || !canvasRef.current) return;

        try {
          const canvas = canvasRef.current;
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const maxWidth = canvas.width * 0.8;
          const maxHeight = canvas.height * 0.8;

          const imageObj = await createImageObject({
            src: imgUrl,
            x: centerX,
            y: centerY,
            maxWidth,
            maxHeight,
          });

          // 新对象添加到画布最顶层，方便用户立即看到和操作
          canvas.add(imageObj);
          canvas.setActiveObject(imageObj);
          canvas.requestRenderAll();

          addLayer(activePage.id, {
            name: file.name,
            type: 'image',
            visible: true,
            locked: false,
            opacity: 1,
            fabricObjectId: imageObj.id,
          });
        } catch (error) {
          console.error('Failed to load image:', error);
          alert(`图片加载失败: ${error}`);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">请先创建一个页面</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 画布区域 - 占据剩余空间 */}
      <div className="flex-1 overflow-hidden">
        <FabricCanvas
          key={activePage.id}
          width={activePage.config.width}
          height={activePage.config.height}
          onReady={(canvas) => {
            // 设置 canvas ref 到 DesignContext
            setCanvasRef(activePage.id, canvas);
          }}
          onObjectDelete={handleObjectDelete}
          onObjectSelect={handleObjectSelect}
        />
      </div>

      {/* 底部工具栏 - 固定在底部 */}
      <div className="shrink-0">
        <BottomToolbar onAddItem={handleAddItem} />
      </div>
    </div>
  );
}

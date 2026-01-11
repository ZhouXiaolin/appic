/**
 * 画布区域组件
 * 包含 FabricCanvas 和底部工具栏
 */
import { useDesign } from '../../contexts/DesignContext';
import { useCanvas } from '../../contexts/CanvasContext';
import { FabricCanvas } from './FabricCanvas';
import { BottomToolbar } from '../toolbar/BottomToolbar';
import { createTextObject, createShapeObject, createImageObject } from '../../utils/fabric/objectFactory';
import { CanvasObjectType } from '../../types/canvas.types';
import type { Object as FabricObject } from 'fabric';

interface CanvasAreaProps {
  onSelectionChange: (obj: FabricObject | null) => void;
}

export function CanvasArea({ onSelectionChange }: CanvasAreaProps) {
  const { getActivePage, addLayer, setCanvasRef } = useDesign();
  const { canvasRef } = useCanvas();

  const activePage = getActivePage();

  const handleAddItem = async (type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle') => {
    if (!canvasRef.current || !activePage) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let object;
    let layerName = '';

    switch (type) {
      case 'text': {
        object = createTextObject({ x: centerX, y: centerY });
        layerName = '文本';
        break;
      }
      case 'rectangle': {
        object = createShapeObject({
          type: CanvasObjectType.RECTANGLE,
          x: centerX,
          y: centerY,
          width: 100,
          height: 100,
        });
        layerName = '矩形';
        break;
      }
      case 'circle': {
        object = createShapeObject({
          type: CanvasObjectType.CIRCLE,
          x: centerX,
          y: centerY,
          radius: 50,
        });
        layerName = '圆形';
        break;
      }
      case 'image':
        handleImageUpload();
        return;
      case 'triangle':
        // TODO: 实现三角形创建逻辑
        return;
    }

    if (object) {
      canvas.add(object);
      canvas.setActiveObject(object);
      canvas.requestRenderAll();

      // 添加到图层列表
      addLayer(activePage.id, {
        name: layerName,
        type,
        visible: true,
        locked: false,
        opacity: 1,
        fabricObjectId: object.id,
      });

      onSelectionChange(object);
    }
  };

  const handleImageUpload = () => {
    const activePage = getActivePage();
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
        try {
          const centerX = canvasRef.current!.width / 2;
          const centerY = canvasRef.current!.height / 2;
          const maxWidth = canvasRef.current!.width * 0.8;
          const maxHeight = canvasRef.current!.height * 0.8;

          const imageObj = await createImageObject({
            src: imgUrl,
            x: centerX,
            y: centerY,
            maxWidth,
            maxHeight,
          });

          canvasRef.current!.add(imageObj);
          canvasRef.current!.setActiveObject(imageObj);
          canvasRef.current!.requestRenderAll();

          // 添加到图层列表
          addLayer(activePage.id, {
            name: file.name,
            type: 'image',
            visible: true,
            locked: false,
            opacity: 1,
            fabricObjectId: imageObj.id,
          });

          onSelectionChange(imageObj);
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
          width={activePage.config.width}
          height={activePage.config.height}
          onReady={(canvas) => {
            // 设置 canvas ref 到 DesignContext
            setCanvasRef(activePage.id, canvas);

            // 监听选择事件并通知父组件
            const handleSelection = (e: any) => {
              const selected = e.selected?.[0] || null;
              onSelectionChange(selected);
            };
            canvas.on('selection:created', handleSelection);
            canvas.on('selection:updated', handleSelection);
            canvas.on('selection:cleared', () => onSelectionChange(null));
          }}
        />
      </div>

      {/* 底部工具栏 - 固定在底部 */}
      <div className="flex-shrink-0">
        <BottomToolbar onAddItem={handleAddItem} />
      </div>
    </div>
  );
}

/**
 * 画布区域组件
 * 包含 FabricCanvas 和底部工具栏
 */
import { useDesign } from '../../contexts/DesignContext';
import { useCanvas } from '../../contexts/CanvasContext';
import { FabricCanvas } from './FabricCanvas';
import { BottomToolbar } from '../toolbar/BottomToolbar';
import { createTextObject, createShapeObject, createImageObject } from '../../utils/fabric/objectFactory';
import type { CanvasObjectTypeValue } from '../../types/canvas.types';
import type { Object as FabricObject } from 'fabric';

interface CanvasAreaProps {
  onSelectionChange: (obj: FabricObject | null) => void;
}

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

export function CanvasArea({ onSelectionChange }: CanvasAreaProps) {
  const { getActivePage, addLayer, setCanvasRef } = useDesign();
  const { canvasRef } = useCanvas();

  const activePage = getActivePage();

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

    onSelectionChange(object);
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

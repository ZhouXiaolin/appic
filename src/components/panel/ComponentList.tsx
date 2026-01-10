import React, { useState } from 'react';
import { Type, Image, Square, Circle, Maximize } from 'lucide-react';
import { useCanvas } from '../../contexts/CanvasContext';
import { createTextObject, createShapeObject, createImageObject } from '../../utils/fabric/objectFactory';
import { CanvasObjectType } from '../../types/canvas.types';
import { canvasPresets } from '../../constants/canvas';

const componentItems = [
  { id: 'text', type: CanvasObjectType.TEXT, label: '文本', icon: Type },
  { id: 'image', type: CanvasObjectType.IMAGE, label: '图片', icon: Image },
  { id: 'rectangle', type: CanvasObjectType.RECTANGLE, label: '矩形', icon: Square },
  { id: 'circle', type: CanvasObjectType.CIRCLE, label: '圆形', icon: Circle },
];

const canvasSizePresets = [
  { id: 'small', label: '小', ...canvasPresets.small },
  { id: 'medium', label: '中', ...canvasPresets.medium },
  { id: 'large', label: '大', ...canvasPresets.large },
  { id: 'hd', label: '高清', ...canvasPresets.hd },
];

export function ComponentList() {
  const { canvasRef, updateCanvasSize, state } = useCanvas();
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(state.config.width);
  const [customHeight, setCustomHeight] = useState(state.config.height);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleAddComponent = async (type: CanvasObjectType) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // 使用canvas的逻辑尺寸来计算中心点，确保组件在可见区域中心
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    switch (type) {
      case CanvasObjectType.TEXT: {
        const textObj = createTextObject({
          x: centerX,
          y: centerY,
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.requestRenderAll();
        break;
      }

      case CanvasObjectType.RECTANGLE: {
        const rect = createShapeObject({
          type: CanvasObjectType.RECTANGLE,
          x: centerX,
          y: centerY,
          width: 100,
          height: 100,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.requestRenderAll();
        break;
      }

      case CanvasObjectType.CIRCLE: {
        const circle = createShapeObject({
          type: CanvasObjectType.CIRCLE,
          x: centerX,
          y: centerY,
          radius: 50,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.requestRenderAll();
        break;
      }

      case CanvasObjectType.IMAGE:
        handleImageUpload();
        return;
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvasRef.current) return;

      console.log('File selected:', file.name, file.type, file.size);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgUrl = event.target?.result as string;
        console.log('Image data URL length:', imgUrl.length);

        try {
          // 使用canvas的逻辑尺寸来计算中心点和最大尺寸
          const centerX = canvasRef.current!.width / 2;
          const centerY = canvasRef.current!.height / 2;
          const maxWidth = canvasRef.current!.width * 0.8; // 画布宽度的80%
          const maxHeight = canvasRef.current!.height * 0.8; // 画布高度的80%

          console.log('Creating image object with:', { centerX, centerY, maxWidth, maxHeight });

          const imageObj = await createImageObject({
            src: imgUrl,
            x: centerX,
            y: centerY,
            maxWidth,
            maxHeight,
          });

          console.log('Image object created:', {
            left: imageObj.left,
            top: imageObj.top,
            width: imageObj.width,
            height: imageObj.height,
            scaleX: imageObj.scaleX,
            scaleY: imageObj.scaleY,
            originX: imageObj.originX,
            originY: imageObj.originY
          });

          canvasRef.current!.add(imageObj);
          canvasRef.current!.setActiveObject(imageObj);
          canvasRef.current!.requestRenderAll();

          console.log('Image added to canvas');
        } catch (error) {
          console.error('Failed to load image:', error);
          alert(`图片加载失败: ${error}`);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handlePresetSizeChange = (presetId: string) => {
    setIsCustomSize(false);
    setSelectedPreset(presetId);
    const preset = canvasSizePresets.find(p => p.id === presetId);
    if (preset) {
      updateCanvasSize(preset.width, preset.height);
    }
  };

  const handleCustomSizeApply = () => {
    if (customWidth > 0 && customHeight > 0) {
      updateCanvasSize(customWidth, customHeight);
      setSelectedPreset(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 画布尺寸设置 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Maximize className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">画布尺寸</h2>
        </div>

        {/* 预设尺寸 */}
        <div className="grid grid-cols-4 gap-2">
          {canvasSizePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSizeChange(preset.id)}
              className={`px-3 py-2 text-xs font-medium rounded border transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 自定义尺寸 */}
        <div className="space-y-2">
          <button
            onClick={() => setIsCustomSize(!isCustomSize)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isCustomSize ? '▼ 隐藏自定义尺寸' : '▶ 自定义尺寸'}
          </button>

          {isCustomSize && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">宽度</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">高度</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCustomSizeApply}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                >
                  应用
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-200"></div>

      {/* 添加组件 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">添加组件</h2>
        <div className="space-y-2">
          {componentItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleAddComponent(item.type)}
                className="w-full flex items-center gap-3 px-4 py-3
                           bg-white hover:bg-blue-50 rounded-lg
                           border border-gray-200 hover:border-blue-300
                           transition-all duration-200
                           shadow-sm hover:shadow"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useHistory } from '../../hooks/useHistory';

interface PropertyEditorProps {
  onBack: () => void;
}

export function PropertyEditor({ onBack }: PropertyEditorProps) {
  const { selectedObject, canvasRef, clearSelection } = useCanvas();
  const { saveHistory } = useHistory(canvasRef.current);

  if (!selectedObject) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        未选中任何对象
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: unknown) => {
    if (!selectedObject || !canvasRef.current) return;

    selectedObject.set(property, value);
    canvasRef.current.requestRenderAll();
    saveHistory();
  };

  const handleDelete = () => {
    if (!selectedObject || !canvasRef.current) return;
    canvasRef.current.remove(selectedObject);
    canvasRef.current.discardActiveObject();
    canvasRef.current.requestRenderAll();
    clearSelection();
    saveHistory();
    onBack();
  };

  const handleBringToFront = () => {
    if (!selectedObject || !canvasRef.current) return;
    (selectedObject as any).bringToFront();
    canvasRef.current.requestRenderAll();
    saveHistory();
  };

  const handleSendToBack = () => {
    if (!selectedObject || !canvasRef.current) return;
    (selectedObject as any).sendToBack();
    canvasRef.current.requestRenderAll();
    saveHistory();
  };

  // 文本对象特有属性
  const isText = selectedObject.type === 'textbox';

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="返回"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">属性编辑</h2>
      </div>

      {/* 基本属性 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">位置</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(selectedObject.left ?? 0)}
              onChange={(e) => handlePropertyChange('left', Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(selectedObject.top ?? 0)}
              onChange={(e) => handlePropertyChange('top', Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 尺寸属性 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">尺寸</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">宽度</label>
            <input
              type="number"
              value={Math.round((selectedObject.width ?? 0) * (selectedObject.scaleX ?? 1))}
              onChange={(e) => {
                const newScaleX = Number(e.target.value) / (selectedObject.width ?? 1);
                handlePropertyChange('scaleX', newScaleX);
              }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高度</label>
            <input
              type="number"
              value={Math.round((selectedObject.height ?? 0) * (selectedObject.scaleY ?? 1))}
              onChange={(e) => {
                const newScaleY = Number(e.target.value) / (selectedObject.height ?? 1);
                handlePropertyChange('scaleY', newScaleY);
              }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 旋转角度 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">旋转</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">角度 (°)</label>
          <input
            type="number"
            value={Math.round((selectedObject.angle ?? 0) % 360)}
            onChange={(e) => handlePropertyChange('angle', Number(e.target.value))}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 样式属性 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">样式</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">填充颜色</label>
          <input
            type="color"
            value={(selectedObject.fill as string) ?? '#000000'}
            onChange={(e) => handlePropertyChange('fill', e.target.value)}
            className="w-full h-10 rounded cursor-pointer border border-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">透明度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedObject.opacity ?? 1}
            onChange={(e) => handlePropertyChange('opacity', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 文本特有属性 */}
      {isText && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">文本</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">字号</label>
            <input
              type="number"
              value={(selectedObject as any).fontSize ?? 24}
              onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="pt-4 border-t space-y-2">
        <button
          onClick={handleBringToFront}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
                     bg-gray-100 hover:bg-gray-200 rounded text-sm
                     transition-colors"
        >
          <MoveUp className="w-4 h-4" />
          置于顶层
        </button>
        <button
          onClick={handleSendToBack}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
                     bg-gray-100 hover:bg-gray-200 rounded text-sm
                     transition-colors"
        >
          <MoveDown className="w-4 h-4" />
          置于底层
        </button>
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
                     bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm
                     transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          删除对象
        </button>
      </div>
    </div>
  );
}

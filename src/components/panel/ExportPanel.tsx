import React from 'react';
import { Download } from 'lucide-react';
import { useCanvas } from '../../contexts/CanvasContext';
import { exportCanvas } from '../../utils/fabric/exportUtils';
import type { ExportFormat } from '../../types/canvas.types';

const exportFormats: { format: ExportFormat; label: string; extension: string }[] = [
  { format: 'png', label: 'PNG 图片', extension: 'png' },
  { format: 'jpeg', label: 'JPEG 图片', extension: 'jpg' },
  { format: 'json', label: 'JSON 数据', extension: 'json' },
  { format: 'svg', label: 'SVG 矢量', extension: 'svg' },
];

export function ExportPanel() {
  const { state } = useCanvas();
  const { canvas } = state;

  const handleExport = (format: ExportFormat) => {
    if (!canvas) return;
    exportCanvas(canvas, format);
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">导出设计</h2>

      <div className="space-y-3">
        {exportFormats.map((item) => (
          <button
            key={item.format}
            onClick={() => handleExport(item.format)}
            disabled={!canvas}
            className="w-full flex items-center gap-3 px-4 py-3
                       bg-white hover:bg-blue-50 rounded-lg
                       border border-gray-200 hover:border-blue-300
                       transition-all duration-200
                       shadow-sm hover:shadow
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:hover:bg-white disabled:hover:border-gray-200"
          >
            <Download className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-500">.{item.extension}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 快捷键提示 */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">快捷键</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>撤销</span>
            <kbd className="px-2 py-0.5 bg-gray-100 rounded">Ctrl+Z</kbd>
          </div>
          <div className="flex justify-between">
            <span>重做</span>
            <kbd className="px-2 py-0.5 bg-gray-100 rounded">Ctrl+Y</kbd>
          </div>
          <div className="flex justify-between">
            <span>删除</span>
            <kbd className="px-2 py-0.5 bg-gray-100 rounded">Delete</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 图层列表组件
 * 显示当前页面的所有图层，支持选择、显示/隐藏、锁定
 */

import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Type, Image, Square, Circle } from 'lucide-react';
import type { Page } from '../../types/design.types';
import { useDesign } from '../../contexts/DesignContext';

const LAYER_ICONS: Record<string, React.ElementType> = {
  text: Type,
  image: Image,
  rectangle: Square,
  circle: Circle,
  triangle: Square,
};

interface LayersListProps {
  page: Page | null;
}

export function LayersList({ page }: LayersListProps) {
  const { setActiveLayer, toggleLayerVisibility, toggleLayerLock } = useDesign();

  if (!page) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        请先选择或创建一个页面
      </div>
    );
  }

  if (page.layers.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        暂无图层，请使用底部工具栏添加元素
      </div>
    );
  }

  const handleLayerClick = (layerId: string) => {
    setActiveLayer(page.id, layerId);
  };

  const handleToggleVisibility = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    toggleLayerVisibility(page.id, layerId);
  };

  const handleToggleLock = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    toggleLayerLock(page.id, layerId);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Layers</h2>

      <div className="space-y-1">
        {page.layers.map((layer) => {
          const Icon = LAYER_ICONS[layer.type] || Square;
          const isActive = page.activeLayerId === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => handleLayerClick(layer.id)}
              className={`group flex items-center gap-2 p-2 rounded-lg
                         border transition-all cursor-pointer ${
                           isActive
                             ? 'border-blue-500 bg-blue-50'
                             : 'border-transparent hover:bg-gray-50'
                         } ${!layer.visible ? 'opacity-50' : ''}`}
            >
              {/* 图层图标 */}
              <div className="flex-shrink-0">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>

              {/* 图层名称 */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm truncate ${
                    isActive ? 'font-medium text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {layer.name}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1">
                {/* 可见性切换 */}
                <button
                  onClick={(e) => handleToggleVisibility(e, layer.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={layer.visible ? '隐藏' : '显示'}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-gray-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* 锁定切换 */}
                <button
                  onClick={(e) => handleToggleLock(e, layer.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={layer.locked ? '解锁' : '锁定'}
                >
                  {layer.locked ? (
                    <Lock className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Unlock className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

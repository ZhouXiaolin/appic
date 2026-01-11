/**
 * 图层列表组件
 * 显示当前页面的所有图层，支持选择、显示/隐藏、锁定、拖拽排序
 */

import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Type, Image, Square, Circle, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// 可排序的图层项组件
interface SortableLayerItemProps {
  layer: any;
  isActive: boolean;
  onLayerClick: (layerId: string) => void;
  onToggleVisibility: (e: React.MouseEvent, layerId: string) => void;
  onToggleLock: (e: React.MouseEvent, layerId: string) => void;
}

function SortableLayerItem({
  layer,
  isActive,
  onLayerClick,
  onToggleVisibility,
  onToggleLock,
}: SortableLayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = LAYER_ICONS[layer.type] || Square;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg
                 border transition-all cursor-pointer ${
                   isActive
                     ? 'border-blue-500 bg-blue-50'
                     : 'border-transparent hover:bg-gray-50'
                 } ${!layer.visible ? 'opacity-50' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      {/* 拖拽手柄 */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 图层图标 */}
      <div className="flex-shrink-0">
        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
      </div>

      {/* 图层名称 */}
      <div
        className="flex-1 min-w-0"
        onClick={() => onLayerClick(layer.id)}
      >
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
          onClick={(e) => onToggleVisibility(e, layer.id)}
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
          onClick={(e) => onToggleLock(e, layer.id)}
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
}

export function LayersList({ page }: LayersListProps) {
  const { setActiveLayer, toggleLayerVisibility, toggleLayerLock, reorderLayers } = useDesign();

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!page || !over || active.id === over.id) {
      return;
    }

    const oldIndex = page.layers.findIndex((layer) => layer.id === active.id);
    const newIndex = page.layers.findIndex((layer) => layer.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderLayers(page.id, oldIndex, newIndex);
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={page.layers.map((layer) => layer.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {page.layers.map((layer) => {
              const isActive = page.activeLayerId === layer.id;

              return (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  isActive={isActive}
                  onLayerClick={handleLayerClick}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

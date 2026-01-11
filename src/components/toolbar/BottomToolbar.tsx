/**
 * 底部工具栏
 * 提供添加图片、文字、形状的快捷方式
 */

import React from 'react';
import { Type, Image, Square, Circle } from 'lucide-react';
import { TOOLBAR_ITEMS } from '../../constants/design';

interface BottomToolbarProps {
  onAddItem: (type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle') => void;
}

const TOOLBAR_ICONS: Record<string, React.ElementType> = {
  text: Type,
  image: Image,
  rectangle: Square,
  circle: Circle,
};

export function BottomToolbar({ onAddItem }: BottomToolbarProps) {
  const handleItemClick = (type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle') => {
    onAddItem(type);
  };

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-t border-gray-200">
      {TOOLBAR_ITEMS.map((item) => {
        const Icon = TOOLBAR_ICONS[item.type];
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.type)}
            className="flex flex-col items-center gap-1 px-4 py-2
                       hover:bg-gray-100 rounded-lg transition-colors group"
            title={item.description}
          >
            <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            <span className="text-xs text-gray-600 group-hover:text-blue-600">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

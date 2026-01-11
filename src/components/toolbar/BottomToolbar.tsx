/**
 * 底部工具栏
 * 提供添加图片、文字、形状的快捷方式
 */

import React, { useState, useRef, useEffect } from 'react';
import { Type, Image, Square, Circle, ChevronDown } from 'lucide-react';
import { TOOLBAR_ITEMS, SHAPE_OPTIONS } from '../../constants/design';

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
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setShowShapeMenu(false);
      }
    };

    if (showShapeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShapeMenu]);

  const handleItemClick = (item: { id: string; type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle' }) => {
    if (item.id === 'shape') {
      // 如果是形状按钮，显示/隐藏下拉菜单
      setShowShapeMenu(!showShapeMenu);
      return;
    }
    onAddItem(item.type);
  };

  const handleShapeSelect = (shapeType: 'rectangle' | 'circle' | 'triangle') => {
    onAddItem(shapeType);
    setShowShapeMenu(false);
  };

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-t border-gray-200 relative">
      {TOOLBAR_ITEMS.map((item) => {
        const Icon = TOOLBAR_ICONS[item.type];
        const isShapeButton = item.id === 'shape';

        return (
          <div key={item.id} className="relative" ref={isShapeButton ? shapeMenuRef : null}>
            <button
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center gap-1 px-4 py-2
                         hover:bg-gray-100 rounded-lg transition-colors group
                         ${showShapeMenu && isShapeButton ? 'bg-gray-100' : ''}`}
              title={item.description}
            >
              <div className="flex items-center gap-1">
                <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                {isShapeButton && (
                  <ChevronDown className={`w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-transform ${showShapeMenu ? 'rotate-180' : ''}`} />
                )}
              </div>
              <span className="text-xs text-gray-600 group-hover:text-blue-600">
                {item.label}
              </span>
            </button>

            {/* 形状下拉菜单 */}
            {isShapeButton && showShapeMenu && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                            bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                {SHAPE_OPTIONS.map((shape) => {
                  const ShapeIcon = TOOLBAR_ICONS[shape.type];
                  return (
                    <button
                      key={shape.type}
                      onClick={() => handleShapeSelect(shape.type)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 
                               text-left text-sm text-gray-700 transition-colors"
                    >
                      <ShapeIcon className="w-4 h-4" />
                      <span>{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

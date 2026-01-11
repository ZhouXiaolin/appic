/**
 * 添加页面弹出菜单
 * 显示预设尺寸选项和自定义尺寸输入
 */

import { useState, useEffect } from 'react';
import { useDesignStore } from '../../presentation/stores/useDesignStore';
import { ADD_SIZE_MENU_OPTIONS, DEFAULT_PAGE_NAME } from '../../constants/design';
import type { SizeMenuOption } from '../../types/design.types';

interface AddPageMenuProps {
  position: { top: number; left: number };
  onClose: () => void;
}

const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const MIN_CUSTOM_SIZE = 100;
const MAX_CUSTOM_SIZE = 8000;

export function AddPageMenu({ position, onClose }: AddPageMenuProps) {
  const addPage = useDesignStore(state => state.addPage);
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.add-page-menu')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function createPage(width: number, height: number) {
    addPage({
      name: DEFAULT_PAGE_NAME,
      width,
      height,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
    });
    onClose();
  }

  function handleSelectPreset(option: SizeMenuOption) {
    if (option.id === 'custom') {
      setIsCustom(true);
    } else {
      createPage(option.width, option.height);
    }
  }

  function handleAddCustom() {
    if (customWidth >= MIN_CUSTOM_SIZE && customHeight >= MIN_CUSTOM_SIZE) {
      createPage(customWidth, customHeight);
    }
  }

  return (
    <div
      className="add-page-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3">选择页面尺寸</h3>

      {!isCustom ? (
        <div className="space-y-1">
          {ADD_SIZE_MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectPreset(option)}
              className="w-full flex items-center justify-between px-3 py-2.5
                         hover:bg-blue-50 rounded-lg transition-colors text-left"
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500">{option.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">宽度</label>
              <input
                type="number"
                min={MIN_CUSTOM_SIZE}
                max={MAX_CUSTOM_SIZE}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">高度</label>
              <input
                type="number"
                min={MIN_CUSTOM_SIZE}
                max={MAX_CUSTOM_SIZE}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAddCustom}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600
                       text-white text-sm font-medium rounded-lg transition-colors"
          >
            添加页面
          </button>

          <button
            onClick={() => setIsCustom(false)}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800
                       text-sm transition-colors"
          >
            返回预设
          </button>
        </div>
      )}
    </div>
  );
}

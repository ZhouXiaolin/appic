/**
 * 页面列表组件
 * 显示所有页面，支持添加、删除、切换页面
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDesignStore } from '../../presentation/stores/useDesignStore';
import { AddPageMenu } from './AddPageMenu';
import { formatSize } from '../../constants/design';

export function PagesList() {
  const design = useDesignStore(state => state.design);
  const deletePage = useDesignStore(state => state.deletePage);
  const setActivePage = useDesignStore(state => state.setActivePage);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  if (!design) return null;

  const handleAddPage = (e: React.MouseEvent) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
    setShowAddMenu(true);
  };

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (design.pages.length > 1) {
      deletePage(pageId);
    } else {
      alert('至少需要保留一个页面');
    }
  };

  return (
    <div className="space-y-3">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pages</h2>
        <button
          onClick={handleAddPage}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="添加页面"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 页面列表 */}
      <div className="space-y-2">
        {design.pages.map((page) => (
          <div
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`group relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
              design.activePageId === page.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            {/* 页面预览图标 */}
            <div className="flex-shrink-0">
              <div
                className="border border-gray-300 bg-white rounded"
                style={{
                  width: 32,
                  height: 32 * (page.config.height / page.config.width),
                }}
              />
            </div>

            {/* 页面信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {page.config.name}
              </div>
              <div className="text-xs text-gray-500">
                {formatSize(page.config.width, page.config.height)}
              </div>
            </div>

            {/* 删除按钮 */}
            {design.pages.length > 1 && (
              <button
                onClick={(e) => handleDeletePage(e, page.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                title="删除页面"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 添加页面菜单 */}
      {showAddMenu && (
        <AddPageMenu
          position={menuPosition}
          onClose={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}

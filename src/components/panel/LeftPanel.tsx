/**
 * 左侧面板
 * 包含：设计标题、页面列表、图层列表
 */
import { useDesign } from '../../contexts/DesignContext';
import { DesignTitle } from './DesignTitle';
import { PagesList } from './PagesList';
import { LayersList } from './LayersList';

export function LeftPanel() {
  const { getActivePage } = useDesign();
  const activePage = getActivePage();

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 设计标题 */}
      <div className="p-4 border-b border-gray-200">
        <DesignTitle />
      </div>

      {/* 页面列表 */}
      <div className="p-4 border-b border-gray-200">
        <PagesList />
      </div>

      {/* 图层列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <LayersList page={activePage} />
      </div>
    </div>
  );
}

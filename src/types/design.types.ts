/**
 * 设计工具数据模型类型定义
 * 支持 Design -> Page -> Layer 三层结构
 */

// 页面尺寸预设
export interface PageSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  category?: 'social' | 'print' | 'screen' | 'custom';
}

// 页面配置
export interface PageConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  thumbnail?: string; // 页面缩略图
}

// 图层（Layer）是对 Fabric Object 的包装
export interface Layer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle';
  visible: boolean;
  locked: boolean;
  opacity: number;
  // Fabric 对象的引用（运行时）
  fabricObjectId?: string;
}

// 页面（Page）
export interface Page {
  id: string;
  config: PageConfig;
  layers: Layer[];
  activeLayerId?: string;
  createdAt: number;
  updatedAt: number;
}

// 设计项目（Design）
export interface Design {
  id: string;
  name: string;
  pages: Page[];
  activePageId: string;
  createdAt: number;
  updatedAt: number;
}

// 属性面板分类
export type PropertySection =
  | 'type'           // 类型
  | 'position'       // Position 信息
  | 'layout'         // Layout 信息
  | 'appearance'     // Appearance
  | 'fill'           // Fill
  | 'stroke'         // Stroke
  | 'effects'        // Effects
  | 'export';        // Export

// 属性值类型
export interface PropertyValue {
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'range';
  value: any;
  label?: string;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

// 属性分组
export interface PropertyGroup {
  id: PropertySection;
  label: string;
  properties: Record<string, PropertyValue>;
  expanded?: boolean;
}

// 工具栏项目
export interface ToolbarItem {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle';
  label: string;
  icon: string;
  description?: string;
}

// 尺寸菜单选项
export interface SizeMenuOption {
  id: string;
  label: string;
  width: number;
  height: number;
  description?: string;
}

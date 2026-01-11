/**
 * 设计工具常量配置
 */

import type { PageSizePreset, SizeMenuOption, ToolbarItem } from '../types/design.types';

// 页面尺寸预设
export const PAGE_SIZE_PRESETS: PageSizePreset[] = [
  // 社交媒体
  { id: 'instagram-square', label: 'Instagram 方形', width: 1080, height: 1080, category: 'social' },
  { id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { id: 'twitter-post', label: 'Twitter Post', width: 1200, height: 675, category: 'social' },
  { id: 'facebook-post', label: 'Facebook Post', width: 1200, height: 630, category: 'social' },
  { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627, category: 'social' },

  // 打印
  { id: 'a4', label: 'A4', width: 2480, height: 3508, category: 'print' },
  { id: 'a3', label: 'A3', width: 3508, height: 4960, category: 'print' },
  { id: 'letter', label: 'Letter', width: 2550, height: 3300, category: 'print' },

  // 屏幕尺寸
  { id: 'desktop-hd', label: 'Desktop HD', width: 1920, height: 1080, category: 'screen' },
  { id: 'desktop-fhd', label: 'Desktop FHD', width: 1920, height: 1080, category: 'screen' },
  { id: 'tablet', label: 'Tablet', width: 1024, height: 768, category: 'screen' },
  { id: 'mobile', label: 'Mobile', width: 375, height: 812, category: 'screen' },

  // 自定义
  { id: 'custom', label: '自定义尺寸', width: 800, height: 600, category: 'custom' },
];

// 添加页面时的尺寸菜单选项（精选常用尺寸）
export const ADD_SIZE_MENU_OPTIONS: SizeMenuOption[] = [
  { id: 'instagram', label: 'Instagram Post', width: 1080, height: 1080, description: '1080 × 1080' },
  { id: 'story', label: 'Instagram Story', width: 1080, height: 1920, description: '1080 × 1920' },
  { id: 'youtube', label: 'YouTube Thumbnail', width: 1280, height: 720, description: '1280 × 720' },
  { id: 'a4', label: 'A4 纸张', width: 2480, height: 3508, description: '2480 × 3508' },
  { id: 'presentation', label: '演示文稿', width: 1920, height: 1080, description: '1920 × 1080' },
  { id: 'custom', label: '自定义', width: 0, height: 0, description: '输入自定义尺寸' },
];

// 工具栏项目
export const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: 'image', type: 'image', label: '图片', icon: 'Image', description: '添加图片到画布' },
  { id: 'text', type: 'text', label: '文字', icon: 'Type', description: '添加文本到画布' },
  { id: 'shape', type: 'rectangle', label: '形状', icon: 'Square', description: '添加形状到画布' },
];

// 形状选项（用于下拉菜单）
export const SHAPE_OPTIONS: Array<{ type: 'rectangle' | 'circle' | 'triangle'; label: string; icon: string }> = [
  { type: 'rectangle', label: '矩形', icon: 'Square' },
  { type: 'circle', label: '圆形', icon: 'Circle' },
];

// 默认设计名称
export const DEFAULT_DESIGN_NAME = '未命名设计';

// 默认页面名称
export const DEFAULT_PAGE_NAME = '页面 1';

// 生成唯一 ID
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

// 格式化尺寸显示
export function formatSize(width: number, height: number): string {
  return `${width} × ${height}`;
}

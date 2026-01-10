import type { CanvasConfig } from '../types/canvas.types';

// 默认 Canvas 配置
export const defaultCanvasConfig: CanvasConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  preserveObjectStacking: true,
};

// Canvas 预设尺寸
export const canvasPresets = {
  small: { width: 400, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 800 },
  hd: { width: 1920, height: 1080 },
};

// 对象默认属性
export const objectDefaults = {
  text: {
    text: '双击编辑文本',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'normal' as const,
    fill: '#000000',
  },
  rectangle: {
    width: 100,
    height: 100,
    fill: '#3b82f6',
  },
  circle: {
    radius: 50,
    fill: '#ef4444',
  },
};

// 历史记录最大条数
export const MAX_HISTORY_SIZE = 50;

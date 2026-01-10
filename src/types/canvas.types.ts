// Fabric.js 类型扩展
import type { Canvas, Object as FabricObject, Rect, Circle, Text, Image } from 'fabric';

// 画布对象类型枚举
export enum CanvasObjectType {
  TEXT = 'text',
  IMAGE = 'image',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
}

// 画布配置
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  preserveObjectStacking?: boolean;
}

// 基础对象属性
export interface BaseObjectProps {
  id?: string;
  type: CanvasObjectType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// 文本对象属性
export interface TextObjectProps extends BaseObjectProps {
  type: CanvasObjectType.TEXT;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
}

// 图片对象属性
export interface ImageObjectProps extends BaseObjectProps {
  type: CanvasObjectType.IMAGE;
  src: string;
}

// 导出格式
export type ExportFormat = 'png' | 'jpeg' | 'json' | 'svg';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  multiplier?: number;
}

// 选中状态
export interface SelectionState {
  selectedObjects: FabricObject[];
  activeObject: FabricObject | null;
}

// 画布状态
export interface CanvasState {
  canvas: Canvas | null;
  objects: FabricObject[];
  selection: SelectionState;
  config: CanvasConfig;
}

// Fabric.js 对象扩展（添加 id 属性）
declare module 'fabric' {
  interface Object {
    id?: string;
  }
}

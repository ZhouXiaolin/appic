import { Rect, Circle, Text, Image } from 'fabric';
import { CanvasObjectType } from '../../types/canvas.types';
import type { TextObjectProps, ImageObjectProps, BaseObjectProps } from '../../types/canvas.types';
import { objectDefaults } from '../../constants/canvas';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建文本对象
 */
export function createTextObject(props: Partial<TextObjectProps> = {}): Text {
  const defaults = objectDefaults.text;
  const text = new Text(props.text || defaults.text, {
    left: props.x || 100,
    top: props.y || 100,
    fontSize: props.fontSize || defaults.fontSize,
    fontFamily: props.fontFamily || defaults.fontFamily,
    fontWeight: props.fontWeight || defaults.fontWeight,
    fontStyle: (props.fontStyle || 'normal') as 'normal' | 'italic' | 'oblique',
    textAlign: (props.textAlign || 'left') as 'left' | 'center' | 'right',
    fill: props.fill || defaults.fill,
    opacity: props.opacity !== undefined ? props.opacity : 1,
    originX: 'center',
    originY: 'center',
  });

  text.id = props.id || generateId();
  return text;
}

/**
 * 创建图片对象（异步）
 */
export function createImageObject(props: Partial<ImageObjectProps> = {}): Promise<Image> {
  return new Promise((resolve, reject) => {
    if (!props.src) {
      reject(new Error('Image source is required'));
      return;
    }

    Image.fromURL(
      props.src,
      {
        left: props.x || 100,
        top: props.y || 100,
        opacity: props.opacity !== undefined ? props.opacity : 1,
        crossOrigin: 'anonymous',
        originX: 'center',
        originY: 'center',
      },
      (image) => {
        if (image) {
          image.id = props.id || generateId();
          // 限制最大宽度
          image.scaleToWidth(200);
          resolve(image);
        } else {
          reject(new Error('Failed to create image'));
        }
      }
    );
  });
}

/**
 * 创建形状对象（矩形、圆形等）
 */
export function createShapeObject(props: Partial<BaseObjectProps> = {}): Rect | Circle {
  const commonProps = {
    left: props.x || 100,
    top: props.y || 100,
    fill: props.fill || '#3b82f6',
    stroke: props.stroke || '#000000',
    strokeWidth: props.strokeWidth || 0,
    opacity: props.opacity !== undefined ? props.opacity : 1,
    angle: props.rotation || 0,
    scaleX: props.scaleX || 1,
    scaleY: props.scaleY || 1,
    originX: 'center' as const,
    originY: 'center' as const,
  };

  let shape: Rect | Circle;

  switch (props.type) {
    case CanvasObjectType.RECTANGLE:
      const rectDefaults = objectDefaults.rectangle;
      shape = new Rect({
        ...commonProps,
        width: props.width || rectDefaults.width,
        height: props.height || rectDefaults.height,
        fill: props.fill || rectDefaults.fill,
      });
      break;

    case CanvasObjectType.CIRCLE:
      const circleDefaults = objectDefaults.circle;
      shape = new Circle({
        ...commonProps,
        radius: props.radius || circleDefaults.radius,
        fill: props.fill || circleDefaults.fill,
      });
      break;

    default:
      // 默认创建矩形
      shape = new Rect({
        ...commonProps,
        width: props.width || 100,
        height: props.height || 100,
      });
  }

  shape.id = props.id || generateId();
  return shape;
}

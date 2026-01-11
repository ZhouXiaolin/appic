import { useEffect } from 'react';
import type { Canvas } from 'fabric';

type CanvasEventHandler = (e: any) => void;

interface CanvasEvents {
  [eventName: string]: CanvasEventHandler;
}

/**
 * Canvas 事件监听 Hook
 * 统一管理 Canvas 事件绑定和解绑
 */
export function useCanvasEvents(canvas: Canvas | null, events: CanvasEvents) {
  useEffect(() => {
    if (!canvas) return;

    // 注册所有事件
    Object.entries(events).forEach(([eventName, handler]) => {
      (canvas as any).on(eventName, handler);
    });

    // 清理函数：解绑所有事件
    return () => {
      Object.entries(events).forEach(([eventName, handler]) => {
        (canvas as any).off(eventName, handler);
      });
    };
  }, [canvas, events]);
}

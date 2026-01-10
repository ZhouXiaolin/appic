import { useState, useCallback, useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import { MAX_HISTORY_SIZE } from '../constants/canvas';

/**
 * 撤销/重做 Hook
 * 管理历史记录堆栈，提供 undo/redo 方法
 */
export function useHistory(canvas: Canvas | null) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isInternalChange = useRef(false);

  // 保存当前状态到历史记录
  const saveHistory = useCallback(() => {
    if (!canvas || isInternalChange.current) return;

    const json = JSON.stringify(canvas.toJSON());

    setHistory((prev) => {
      const newHistory = [...prev.slice(0, currentIndex + 1), json];
      // 限制历史记录大小
      return newHistory.slice(-MAX_HISTORY_SIZE);
    });
    setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [canvas, currentIndex]);

  // 撤销
  const undo = useCallback(() => {
    if (currentIndex <= 0 || !canvas) return;

    const prevIndex = currentIndex - 1;
    const json = history[prevIndex];

    isInternalChange.current = true;
    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.requestRenderAll();
      isInternalChange.current = false;
    });
    setCurrentIndex(prevIndex);
  }, [canvas, history, currentIndex]);

  // 重做
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1 || !canvas) return;

    const nextIndex = currentIndex + 1;
    const json = history[nextIndex];

    isInternalChange.current = true;
    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.requestRenderAll();
      isInternalChange.current = false;
    });
    setCurrentIndex(nextIndex);
  }, [canvas, history, currentIndex]);

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y 重做
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // 初始化时保存初始状态
  useEffect(() => {
    if (canvas && history.length === 0) {
      saveHistory();
    }
  }, [canvas, history.length, saveHistory]);

  return {
    undo,
    redo,
    saveHistory,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}

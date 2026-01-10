import React from 'react';

interface EditorLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function EditorLayout({ left, center, right }: EditorLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* 左侧面板 */}
      <div className="flex-shrink-0">{left}</div>

      {/* 中间画布区域 */}
      <div className="flex-1 overflow-auto min-h-0">{center}</div>

      {/* 右侧面板 */}
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

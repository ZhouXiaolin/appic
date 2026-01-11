/**
 * 可编辑的设计标题组件
 */

import { useState, useRef, useEffect } from 'react';
import { useDesignStore } from '../../presentation/stores/useDesignStore';
import { DEFAULT_DESIGN_NAME } from '../../constants/design';

export function DesignTitle() {
  const design = useDesignStore(state => state.design);
  const setDesignName = useDesignStore(state => state.setDesignName);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(design?.name || DEFAULT_DESIGN_NAME);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(design?.name || DEFAULT_DESIGN_NAME);
  }, [design?.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    if (title.trim()) {
      setDesignName(title.trim());
    } else {
      setTitle(design?.name || DEFAULT_DESIGN_NAME);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(design?.name || DEFAULT_DESIGN_NAME);
      setIsEditing(false);
    }
  }

  return (
    <div className="space-y-1">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-lg font-semibold border border-blue-500 rounded focus:outline-none"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="px-2 py-1 text-lg font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 rounded transition-colors"
        >
          {design?.name || DEFAULT_DESIGN_NAME}
        </div>
      )}
      <div className="text-xs text-gray-500 px-2">设计名称</div>
    </div>
  );
}

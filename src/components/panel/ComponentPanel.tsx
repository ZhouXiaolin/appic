import { useState, useEffect } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { ComponentList } from './ComponentList';
import { PropertyEditor } from './PropertyEditor';

export function ComponentPanel() {
  const { selectedObject } = useCanvas();
  const [showProperties, setShowProperties] = useState(false);

  // 根据选中状态自动切换显示
  useEffect(() => {
    setShowProperties(!!selectedObject);
  }, [selectedObject]);

  const handleBack = () => {
    setShowProperties(false);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      {showProperties ? (
        <PropertyEditor onBack={handleBack} />
      ) : (
        <ComponentList />
      )}
    </div>
  );
}

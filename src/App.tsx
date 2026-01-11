import { useEffect } from 'react';
import { DesignProvider } from './contexts/DesignContext';
import { CanvasProvider, useCanvas } from './contexts/CanvasContext';
import { EditorLayout } from './components/layout/EditorLayout';
import { LeftPanel } from './components/panel/LeftPanel';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertyPanel } from './components/panel/PropertyPanel';
import { useDesign } from './contexts/DesignContext';

function AppContent() {
  const { createDesign } = useDesign();
  const { isDragging, selectedObject } = useCanvas();

  // 初始化：创建默认设计（但不创建默认页面）
  useEffect(() => {
    createDesign('我的设计');
  }, [createDesign]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <EditorLayout
        left={<LeftPanel />}
        center={<CanvasArea />}
        right={<PropertyPanel selectedObject={selectedObject} isDragging={isDragging} />}
      />
    </div>
  );
}

function App() {
  return (
    <DesignProvider>
      <CanvasProvider>
        <AppContent />
      </CanvasProvider>
    </DesignProvider>
  );
}

export default App;

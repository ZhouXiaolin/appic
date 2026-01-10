import { CanvasProvider } from './contexts/CanvasContext';
import { EditorLayout } from './components/layout/EditorLayout';
import { ComponentPanel } from './components/panel/ComponentPanel';
import { FabricCanvas } from './components/canvas/FabricCanvas';
import { ExportPanel } from './components/panel/ExportPanel';

function App() {
  return (
    <CanvasProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* 顶部标题栏 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Fabric.js 设计工具</h1>
        </header>

        {/* 主布局 */}
        <EditorLayout
          left={<ComponentPanel />}
          center={<FabricCanvas width={800} height={600} />}
          right={<ExportPanel />}
        />
      </div>
    </CanvasProvider>
  );
}

export default App;

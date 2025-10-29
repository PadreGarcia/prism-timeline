import { EditorHeader } from "@/components/editor/EditorHeader";
import { AssetLibrary } from "@/components/editor/AssetLibrary";
import { CanvasPreview } from "@/components/editor/CanvasPreview";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { Timeline } from "@/components/editor/Timeline";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <EditorHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <AssetLibrary />
        
        <div className="flex-1 flex flex-col">
          <CanvasPreview />
          <Timeline />
        </div>
        
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default Index;

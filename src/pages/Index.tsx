import { EditorHeader } from "@/components/editor/EditorHeader";
import { AssetLibrary } from "@/components/editor/AssetLibrary";
import { CanvasPreview } from "@/components/editor/CanvasPreview";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { Timeline } from "@/components/editor/Timeline";
import { useEditorStore } from "@/store/editorStore";
import { useEffect } from "react";
import { toast } from "sonner";

const Index = () => {
  const { selectedClipId, removeClip, tracks } = useEditorStore();

  // Handle Delete key to remove selected clip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        // Find the clip to show its name in toast
        const clip = tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId);
        
        removeClip(selectedClipId);
        toast.success(`Clip eliminado${clip ? '' : ''}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, removeClip, tracks]);

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

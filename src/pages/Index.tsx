import { EditorHeader } from "@/components/editor/EditorHeader";
import { AssetLibrary } from "@/components/editor/AssetLibrary";
import { EffectsLibrary } from "@/components/editor/EffectsLibrary";
import { CanvasPreview } from "@/components/editor/CanvasPreview";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { Timeline } from "@/components/editor/Timeline";
import { useEditorStore } from "@/store/editorStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles, FolderOpen } from "lucide-react";

const Index = () => {
  const { selectedClipId, removeClip, tracks } = useEditorStore();
  const [showEffects, setShowEffects] = useState(false);

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
        {/* Left Panel - Switchable between Assets and Effects */}
        <div className="relative">
          {showEffects ? <EffectsLibrary /> : <AssetLibrary />}
          
          <Button
            onClick={() => setShowEffects(!showEffects)}
            variant="outline"
            size="sm"
            className="absolute bottom-4 left-4 z-10"
          >
            {showEffects ? (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Assets
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Efectos
              </>
            )}
          </Button>
        </div>
        
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

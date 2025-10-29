import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useEditorStore } from "@/store/editorStore";
import { Settings } from "lucide-react";

export const PropertiesPanel = () => {
  const { selectedClipId, tracks, updateClip } = useEditorStore();

  const selectedClip = tracks
    .flatMap(track => track.clips)
    .find(clip => clip.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className="w-80 bg-panel-content border-l border-border flex flex-col">
        <div className="p-4 bg-panel-header border-b border-border">
          <h2 className="font-semibold text-foreground">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a clip to view properties</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedClip) return;
    
    updateClip(selectedClip.id, {
      properties: {
        ...selectedClip.properties,
        [property]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-panel-content border-l border-border flex flex-col">
      <div className="p-4 bg-panel-header border-b border-border">
        <h2 className="font-semibold text-foreground">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Card className="p-4 space-y-4">
          <h3 className="font-medium text-sm">Transform</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Position X</Label>
            <Input
              type="number"
              value={selectedClip.properties.position?.x || 0}
              onChange={(e) => handlePropertyChange('position', { 
                ...selectedClip.properties.position, 
                x: parseFloat(e.target.value) 
              })}
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Position Y</Label>
            <Input
              type="number"
              value={selectedClip.properties.position?.y || 0}
              onChange={(e) => handlePropertyChange('position', { 
                ...selectedClip.properties.position, 
                y: parseFloat(e.target.value) 
              })}
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Scale</Label>
            <Slider
              value={[selectedClip.properties.scale?.x || 1]}
              min={0.1}
              max={3}
              step={0.1}
              onValueChange={(value) => handlePropertyChange('scale', { 
                x: value[0], 
                y: value[0], 
                z: value[0] 
              })}
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-medium text-sm">Effects</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Opacity</Label>
            <Slider
              value={[selectedClip.properties.opacity || 1]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => handlePropertyChange('opacity', value[0])}
            />
          </div>

          {selectedClip.properties.volume !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs">Volume</Label>
              <Slider
                value={[selectedClip.properties.volume || 1]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => handlePropertyChange('volume', value[0])}
              />
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-medium text-sm">Timing</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Start Time</Label>
            <Input
              type="number"
              value={selectedClip.startTime.toFixed(2)}
              readOnly
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Duration</Label>
            <Input
              type="number"
              value={selectedClip.duration.toFixed(2)}
              readOnly
              className="h-8"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editorStore";
import { Settings, Play, Pause, Box, Zap, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export const PropertiesPanel = () => {
  const { selectedClipId, tracks, updateClip, assets, currentTime } = useEditorStore();

  const selectedClip = tracks
    .flatMap(track => track.clips)
    .find(clip => clip.id === selectedClipId);

  const asset = selectedClip ? assets.find(a => a.id === selectedClip.assetId) : null;
  const is3D = asset?.type === '3d';

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

  const toggleAnimation = (animationName: string) => {
    if (!selectedClip) return;
    const current = selectedClip.properties.animations?.active || [];
    const newActive = current.includes(animationName)
      ? current.filter(name => name !== animationName)
      : [...current, animationName];
    
    handlePropertyChange('animations', {
      ...selectedClip.properties.animations,
      active: newActive,
    });
  };

  return (
    <div className="w-80 bg-panel-content border-l border-border flex flex-col">
      <div className="p-4 bg-panel-header border-b border-border">
        <h2 className="font-semibold text-foreground">Properties</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Box className="h-4 w-4" />
              Transform
            </h3>
            
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

            {is3D && (
              <div className="space-y-2">
                <Label className="text-xs">Position Z</Label>
                <Input
                  type="number"
                  value={selectedClip.properties.position?.z || 0}
                  onChange={(e) => handlePropertyChange('position', { 
                    ...selectedClip.properties.position, 
                    z: parseFloat(e.target.value) 
                  })}
                  className="h-8"
                />
              </div>
            )}

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
              <span className="text-xs text-muted-foreground">{selectedClip.properties.scale?.x?.toFixed(2) || '1.00'}</span>
            </div>

            {is3D && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Rotation X</Label>
                  <Slider
                    value={[selectedClip.properties.rotation?.x || 0]}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.01}
                    onValueChange={(value) => handlePropertyChange('rotation', { 
                      ...selectedClip.properties.rotation,
                      x: value[0]
                    })}
                  />
                  <span className="text-xs text-muted-foreground">{(selectedClip.properties.rotation?.x || 0).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Rotation Y</Label>
                  <Slider
                    value={[selectedClip.properties.rotation?.y || 0]}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.01}
                    onValueChange={(value) => handlePropertyChange('rotation', { 
                      ...selectedClip.properties.rotation,
                      y: value[0]
                    })}
                  />
                  <span className="text-xs text-muted-foreground">{(selectedClip.properties.rotation?.y || 0).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Rotation Z</Label>
                  <Slider
                    value={[selectedClip.properties.rotation?.z || 0]}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.01}
                    onValueChange={(value) => handlePropertyChange('rotation', { 
                      ...selectedClip.properties.rotation,
                      z: value[0]
                    })}
                  />
                  <span className="text-xs text-muted-foreground">{(selectedClip.properties.rotation?.z || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </Card>

          {is3D && selectedClip.properties.animations?.available && selectedClip.properties.animations.available.length > 0 && (
            <Card className="p-4 space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Animations
              </h3>
              
              <div className="space-y-2">
                <Label className="text-xs">Available Animations</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedClip.properties.animations.available.map((anim) => {
                    const isActive = selectedClip.properties.animations?.active?.includes(anim);
                    return (
                      <Button
                        key={anim}
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => toggleAnimation(anim)}
                        className="h-8"
                      >
                        {isActive ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                        {anim}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Animation Speed</Label>
                <Slider
                  value={[selectedClip.properties.animations?.speed || 1]}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => handlePropertyChange('animations', {
                    ...selectedClip.properties.animations,
                    speed: value[0]
                  })}
                />
                <span className="text-xs text-muted-foreground">{selectedClip.properties.animations?.speed?.toFixed(1) || '1.0'}x</span>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Loop Animations</Label>
                <Switch
                  checked={selectedClip.properties.animations?.loop !== false}
                  onCheckedChange={(checked) => handlePropertyChange('animations', {
                    ...selectedClip.properties.animations,
                    loop: checked
                  })}
                />
              </div>
            </Card>
          )}

          {is3D && selectedClip.properties.animations?.available && selectedClip.properties.animations.available.length > 0 && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Animation Timeline
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const keyframes = selectedClip.properties.animationKeyframes || [];
                    const relativeTime = Math.max(0, Math.min(currentTime - selectedClip.startTime, selectedClip.duration));
                    const newKeyframe = {
                      time: relativeTime,
                      activeAnimations: selectedClip.properties.animations?.active || [],
                      speed: selectedClip.properties.animations?.speed || 1,
                      loop: selectedClip.properties.animations?.loop !== false,
                    };
                    updateClip(selectedClipId, {
                      properties: {
                        ...selectedClip.properties,
                        animationKeyframes: [...keyframes, newKeyframe].sort((a, b) => a.time - b.time),
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Keyframe
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Add keyframes to program animation changes over time
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(selectedClip.properties.animationKeyframes || []).length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No keyframes yet. Click "Add Keyframe" to start.
                  </div>
                )}
                
                {(selectedClip.properties.animationKeyframes || []).map((keyframe: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2 border border-border">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {keyframe.time.toFixed(2)}s
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const keyframes = selectedClip.properties.animationKeyframes || [];
                          updateClip(selectedClipId, {
                            properties: {
                              ...selectedClip.properties,
                              animationKeyframes: keyframes.filter((_: any, i: number) => i !== index),
                            },
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Active Animations</Label>
                      <div className="space-y-1">
                        {selectedClip.properties.animations!.available.map((animName: string) => (
                          <div key={animName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`keyframe-${index}-${animName}`}
                              checked={keyframe.activeAnimations.includes(animName)}
                              onCheckedChange={(checked) => {
                                const keyframes = [...(selectedClip.properties.animationKeyframes || [])];
                                if (checked) {
                                  keyframes[index].activeAnimations.push(animName);
                                } else {
                                  keyframes[index].activeAnimations = keyframes[index].activeAnimations.filter(
                                    (a: string) => a !== animName
                                  );
                                }
                                updateClip(selectedClipId, {
                                  properties: {
                                    ...selectedClip.properties,
                                    animationKeyframes: keyframes,
                                  },
                                });
                              }}
                            />
                            <label
                              htmlFor={`keyframe-${index}-${animName}`}
                              className="text-xs cursor-pointer"
                            >
                              {animName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Speed: {keyframe.speed.toFixed(1)}x</Label>
                      <Slider
                        value={[keyframe.speed]}
                        onValueChange={(value) => {
                          const keyframes = [...(selectedClip.properties.animationKeyframes || [])];
                          keyframes[index].speed = value[0];
                          updateClip(selectedClipId, {
                            properties: {
                              ...selectedClip.properties,
                              animationKeyframes: keyframes,
                            },
                          });
                        }}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`keyframe-loop-${index}`}
                        checked={keyframe.loop}
                        onCheckedChange={(checked) => {
                          const keyframes = [...(selectedClip.properties.animationKeyframes || [])];
                          keyframes[index].loop = checked;
                          updateClip(selectedClipId, {
                            properties: {
                              ...selectedClip.properties,
                              animationKeyframes: keyframes,
                            },
                          });
                        }}
                      />
                      <Label htmlFor={`keyframe-loop-${index}`} className="text-xs">
                        Loop
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {is3D && (
            <Card className="p-4 space-y-4">
              <h3 className="font-medium text-sm">3D Material</h3>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Wireframe Mode</Label>
                <Switch
                  checked={selectedClip.properties.wireframe || false}
                  onCheckedChange={(checked) => handlePropertyChange('wireframe', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Metalness</Label>
                <Slider
                  value={[selectedClip.properties.metalness ?? 0]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => handlePropertyChange('metalness', value[0])}
                />
                <span className="text-xs text-muted-foreground">{(selectedClip.properties.metalness ?? 0).toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Roughness</Label>
                <Slider
                  value={[selectedClip.properties.roughness ?? 1]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => handlePropertyChange('roughness', value[0])}
                />
                <span className="text-xs text-muted-foreground">{(selectedClip.properties.roughness ?? 1).toFixed(2)}</span>
              </div>
            </Card>
          )}

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
              <span className="text-xs text-muted-foreground">{(selectedClip.properties.opacity || 1).toFixed(2)}</span>
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
                <span className="text-xs text-muted-foreground">{(selectedClip.properties.volume || 1).toFixed(2)}</span>
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-medium text-sm">Timing</h3>
            
            <div className="space-y-2">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="text"
                value={`${selectedClip.startTime.toFixed(2)}s`}
                readOnly
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Duration</Label>
              <Input
                type="text"
                value={`${selectedClip.duration.toFixed(2)}s`}
                readOnly
                className="h-8"
              />
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

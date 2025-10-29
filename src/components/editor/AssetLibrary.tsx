import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Video, Image, Music, Box } from "lucide-react";
import { useEditorStore, Asset } from "@/store/editorStore";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const AssetLibrary = () => {
  const { assets, addAsset } = useEditorStore();

  const handleFileImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,audio/*,.obj,.fbx,.glb,.gltf';
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        const fileType = file.type;
        
        let assetType: 'video' | 'image' | 'audio' | '3d' = 'image';
        
        if (fileType.startsWith('video/')) {
          assetType = 'video';
        } else if (fileType.startsWith('image/')) {
          assetType = 'image';
        } else if (fileType.startsWith('audio/')) {
          assetType = 'audio';
        } else if (file.name.match(/\.(obj|fbx|glb|gltf)$/i)) {
          assetType = '3d';
        }
        
        const asset: Asset = {
          id: `${assetType}-${Date.now()}-${Math.random()}`,
          type: assetType,
          name: file.name,
          url: url,
          thumbnail: assetType === 'image' ? url : undefined,
        };
        
        addAsset(asset);
        toast.success(`${file.name} imported successfully`);
      });
    };
    
    input.click();
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case '3d': return <Box className="h-4 w-4" />;
      default: return null;
    }
  };

  const assetsByType = {
    video: assets.filter(a => a.type === 'video'),
    image: assets.filter(a => a.type === 'image'),
    audio: assets.filter(a => a.type === 'audio'),
    '3d': assets.filter(a => a.type === '3d'),
  };

  return (
    <div className="w-64 bg-panel-content border-r border-border flex flex-col">
      <div className="p-4 bg-panel-header border-b border-border">
        <h2 className="font-semibold text-foreground">Asset Library</h2>
      </div>

      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleFileImport}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Files
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {assets.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assets yet</p>
            <p className="text-xs">Import files to get started</p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['video', 'image', 'audio', '3d']} className="w-full">
            <AccordionItem value="video">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>Videos ({assetsByType.video.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {assetsByType.video.map((asset) => (
                    <Card 
                      key={asset.id} 
                      className="p-2 cursor-move hover:bg-secondary/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, asset)}
                    >
                      <div className="flex items-center gap-2">
                        <Video className="h-3 w-3 flex-shrink-0" />
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="image">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Images ({assetsByType.image.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {assetsByType.image.map((asset) => (
                    <Card 
                      key={asset.id} 
                      className="p-2 cursor-move hover:bg-secondary/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, asset)}
                    >
                      <div className="flex items-center gap-2">
                        {asset.thumbnail && (
                          <img src={asset.thumbnail} alt={asset.name} className="h-8 w-8 object-cover rounded flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="audio">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span>Audio ({assetsByType.audio.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {assetsByType.audio.map((asset) => (
                    <Card 
                      key={asset.id} 
                      className="p-2 cursor-move hover:bg-secondary/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, asset)}
                    >
                      <div className="flex items-center gap-2">
                        <Music className="h-3 w-3 flex-shrink-0" />
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="3d">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  <span>3D Models ({assetsByType['3d'].length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {assetsByType['3d'].map((asset) => (
                    <Card 
                      key={asset.id} 
                      className="p-2 cursor-move hover:bg-secondary/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, asset)}
                    >
                      <div className="flex items-center gap-2">
                        <Box className="h-3 w-3 flex-shrink-0" />
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
};

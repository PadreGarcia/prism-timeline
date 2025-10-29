import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Video, Image, Music, Box } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { toast } from "sonner";
import { useRef } from "react";

export const AssetLibrary = () => {
  const { assets, addAsset } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedFileTypes = (type: 'video' | 'image' | 'audio' | '3d') => {
    switch (type) {
      case 'video': return 'video/*';
      case 'image': return 'image/*';
      case 'audio': return 'audio/*';
      case '3d': return '.obj,.fbx,.glb,.gltf';
      default: return '*';
    }
  };

  const handleFileUpload = (type: 'video' | 'image' | 'audio' | '3d') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = getAcceptedFileTypes(type);
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        const asset = {
          id: `${type}-${Date.now()}-${Math.random()}`,
          type: type,
          name: file.name,
          url: url,
          thumbnail: type === 'image' ? url : undefined,
        };
        
        addAsset(asset);
        toast.success(`${file.name} imported successfully`);
      });
    };
    
    input.click();
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

  return (
    <div className="w-64 bg-panel-content border-r border-border flex flex-col">
      <div className="p-4 bg-panel-header border-b border-border">
        <h2 className="font-semibold text-foreground">Asset Library</h2>
      </div>

      <div className="p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleFileUpload('video')}
        >
          <Video className="h-4 w-4 mr-2" />
          Import Video
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleFileUpload('image')}
        >
          <Image className="h-4 w-4 mr-2" />
          Import Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleFileUpload('audio')}
        >
          <Music className="h-4 w-4 mr-2" />
          Import Audio
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleFileUpload('3d')}
        >
          <Box className="h-4 w-4 mr-2" />
          Import 3D Model
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {assets.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assets yet</p>
            <p className="text-xs">Import files to get started</p>
          </div>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2">
                {getIcon(asset.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.type}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

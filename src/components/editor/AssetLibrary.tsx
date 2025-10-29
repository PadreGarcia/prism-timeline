import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Video, Image, Music, Box, FolderOpen } from "lucide-react";
import { useEditorStore, Asset, AssetType } from "@/store/editorStore";
import { toast } from "sonner";
import { useState } from "react";

export const AssetLibrary = () => {
  const { assets, addAsset } = useEditorStore();
  const [activeTab, setActiveTab] = useState<AssetType | 'all'>('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,image/gif,audio/*,.obj,.fbx,.glb,.gltf';
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
        } else if (fileType.startsWith('image/') || fileType === 'image/gif') {
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
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 20);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
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

  const filteredAssets = activeTab === 'all' 
    ? assets 
    : assets.filter(a => a.type === activeTab);

  const tabs = [
    { id: 'all' as const, label: 'All', icon: FolderOpen, count: assets.length },
    { id: 'video' as const, label: 'Video', icon: Video, count: assets.filter(a => a.type === 'video').length },
    { id: 'image' as const, label: 'Images', icon: Image, count: assets.filter(a => a.type === 'image').length },
    { id: 'audio' as const, label: 'Audio', icon: Music, count: assets.filter(a => a.type === 'audio').length },
    { id: '3d' as const, label: '3D', icon: Box, count: assets.filter(a => a.type === '3d').length },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const fileType = file.type;
      
      let assetType: AssetType = 'image';
      
      if (fileType.startsWith('video/')) {
        assetType = 'video';
      } else if (fileType.startsWith('image/') || fileType === 'image/gif') {
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

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-lg">Media Library</h2>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
                <span className={`text-xs ${isActive ? 'opacity-90' : 'opacity-60'}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4 border-b border-border">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={handleFileImport}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Media
        </Button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleFileDrop}
      >
        {assets.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDraggingOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/20'
            }`}
          >
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">No media files yet</p>
            <p className="text-xs text-muted-foreground">
              Drag & drop files here or click 'Import Media'
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-60">
              Supported: Videos, Audio, Images, 3D Models (.glb, .gltf)
            </p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No {activeTab} files</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const Icon = getIcon(asset.type);
              return (
                <Card 
                  key={asset.id} 
                  className="p-3 cursor-move hover:bg-accent/50 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95 group border-2 border-transparent hover:border-primary/20"
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {asset.thumbnail ? (
                        <img 
                          src={asset.thumbnail} 
                          alt={asset.name} 
                          className="h-10 w-10 object-cover rounded border-2 border-primary/30 group-hover:border-primary/50" 
                        />
                      ) : (
                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center border-2 border-primary/30 group-hover:border-primary/50">
                          {Icon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {asset.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {asset.type}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        {assets.length > 0 && isDraggingOver && (
          <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm pointer-events-none flex items-center justify-center z-50">
            <div className="bg-background/95 px-8 py-4 rounded-lg border-2 border-primary shadow-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-primary font-semibold">Drop files to import</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

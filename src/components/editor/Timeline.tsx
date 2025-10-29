import { useRef, useEffect, useState } from "react";
import { useEditorStore, Asset, TimelineClip } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Timeline = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropPreview, setDropPreview] = useState<{
    trackIndex: number;
    time: number;
    assetName: string;
  } | null>(null);
  
  const { 
    tracks, 
    currentTime, 
    duration, 
    zoom, 
    setZoom, 
    setCurrentTime,
    selectClip,
    selectedClipId,
    addClipToTrack,
    assets
  } = useEditorStore();

  const pixelsPerSecond = 50 * zoom;
  const rulerHeight = 30;
  const trackHeight = 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw time ruler
    const rulerHeight = 30;
    ctx.fillStyle = '#141a21';
    ctx.fillRect(0, 0, canvas.width, rulerHeight);

    ctx.strokeStyle = '#2a3441';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';

    for (let i = 0; i <= duration; i++) {
      const x = i * pixelsPerSecond;
      if (x > canvas.width) break;

      const isSecond = i % 1 === 0;
      if (isSecond) {
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 10);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();

        ctx.fillText(`${i}s`, x, rulerHeight - 15);
      } else {
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 5);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();
      }
    }

    // Draw tracks
    const trackPadding = 8;
    let currentY = rulerHeight;

    tracks.forEach((track, trackIndex) => {
      // Track background
      ctx.fillStyle = trackIndex % 2 === 0 ? '#141a21' : '#1a2129';
      ctx.fillRect(0, currentY, canvas.width, trackHeight);

      // Track separator
      ctx.strokeStyle = '#2a3441';
      ctx.beginPath();
      ctx.moveTo(0, currentY + trackHeight);
      ctx.lineTo(canvas.width, currentY + trackHeight);
      ctx.stroke();

      // Draw clips
      track.clips.forEach((clip) => {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        const clipY = currentY + trackPadding;
        const clipHeight = trackHeight - (trackPadding * 2);

        const isSelected = clip.id === selectedClipId;

        // Clip background
        ctx.fillStyle = isSelected ? '#4aaed9' : '#2e6d8a';
        ctx.fillRect(clipX, clipY, clipWidth, clipHeight);

        // Clip border
        ctx.strokeStyle = isSelected ? '#6cc3e8' : '#4aaed9';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(clipX, clipY, clipWidth, clipHeight);

        // Clip name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          track.name,
          clipX + 8,
          clipY + clipHeight / 2 + 4
        );
      });

      currentY += trackHeight;
    });

    // Draw drop preview
    if (dropPreview) {
      const previewY = rulerHeight + (dropPreview.trackIndex * trackHeight) + trackPadding;
      const previewX = dropPreview.time * pixelsPerSecond;
      const previewWidth = 100; // Default preview width
      const previewHeight = trackHeight - (trackPadding * 2);

      ctx.save();
      ctx.fillStyle = 'rgba(74, 174, 217, 0.3)';
      ctx.fillRect(previewX, previewY, previewWidth, previewHeight);
      
      ctx.strokeStyle = '#4aaed9';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(previewX, previewY, previewWidth, previewHeight);
      
      ctx.fillStyle = '#4aaed9';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dropPreview.assetName, previewX + previewWidth / 2, previewY + previewHeight / 2);
      ctx.restore();
    }

    // Draw playhead
    const playheadX = currentTime * pixelsPerSecond;
    ctx.strokeStyle = '#4aaed9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Playhead handle
    ctx.fillStyle = '#4aaed9';
    ctx.beginPath();
    ctx.arc(playheadX, 15, 6, 0, Math.PI * 2);
    ctx.fill();

  }, [tracks, currentTime, duration, zoom, selectedClipId, pixelsPerSecond, dropPreview]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a clip
    const rulerHeight = 30;
    const trackHeight = 60;
    let currentY = rulerHeight;

    for (const track of tracks) {
      for (const clip of track.clips) {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        const clipY = currentY + 8;
        const clipHeight = trackHeight - 16;

        if (
          x >= clipX &&
          x <= clipX + clipWidth &&
          y >= clipY &&
          y <= clipY + clipHeight
        ) {
          selectClip(clip.id);
          return;
        }
      }
      currentY += trackHeight;
    }

    // If no clip was clicked, update playhead position
    const newTime = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    setCurrentTime(newTime);
    selectClip(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const data = e.dataTransfer.types.includes('application/json');
      if (!data) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dropTime = Math.max(0, x / pixelsPerSecond);
      const trackIndex = Math.floor((y - rulerHeight) / trackHeight);

      if (trackIndex >= 0 && trackIndex < tracks.length) {
        // Try to get asset name from drag data (this is a preview, actual data comes in drop)
        setDropPreview({
          trackIndex,
          time: dropTime,
          assetName: 'Drop here',
        });
      } else {
        setDropPreview(null);
      }
    } catch (error) {
      // Ignore errors during drag over
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
    setDropPreview(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDropPreview(null);

    try {
      const data = e.dataTransfer.getData('application/json');
      const asset: Asset = JSON.parse(data);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate drop position with snap to grid (optional)
      const rawDropTime = Math.max(0, x / pixelsPerSecond);
      const dropTime = Math.round(rawDropTime * 4) / 4; // Snap to 0.25s grid
      
      // Find which track was dropped on
      const trackIndex = Math.floor((y - rulerHeight) / trackHeight);

      if (trackIndex >= 0 && trackIndex < tracks.length) {
        const track = tracks[trackIndex];
        
        // Check if asset type matches track type
        if (track.type !== asset.type) {
          toast.error(`Cannot add ${asset.type} to ${track.type} track. Drop on a ${asset.type} track.`);
          return;
        }

        // Get default duration based on asset type
        let defaultDuration = 5;
        if (asset.type === 'video' || asset.type === 'audio') {
          defaultDuration = 10;
        } else if (asset.type === '3d') {
          defaultDuration = 8;
        }

        const newClip: TimelineClip = {
          id: `clip-${Date.now()}-${Math.random()}`,
          assetId: asset.id,
          trackId: track.id,
          startTime: dropTime,
          duration: defaultDuration,
          properties: {
            opacity: 1,
            volume: asset.type === 'audio' || asset.type === 'video' ? 1 : undefined,
            scale: { x: 1, y: 1 },
            position: { x: 960, y: 540 }, // Center of 1920x1080
          },
        };

        addClipToTrack(track.id, newClip);
        selectClip(newClip.id);
        toast.success(`Added ${asset.name} to ${track.name} at ${dropTime.toFixed(2)}s`);
      } else {
        toast.error('Drop on a valid track');
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to add clip to timeline');
    }
  };

  return (
    <div className="h-64 bg-timeline-bg border-t border-border flex flex-col">
      <div className="p-2 bg-panel-header border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm text-foreground">Timeline</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative"
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full cursor-pointer transition-all ${
            isDraggingOver ? 'ring-2 ring-primary ring-inset' : ''
          }`}
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        {isDraggingOver && (
          <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-center justify-center backdrop-blur-sm">
            <div className="bg-background/90 px-6 py-3 rounded-lg border-2 border-primary border-dashed">
              <p className="text-primary font-semibold text-sm">Drop on track to add clip</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

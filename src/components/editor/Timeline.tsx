import { useRef, useEffect, useState } from "react";
import { useEditorStore, Asset, TimelineClip } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
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
  const [draggingKeyframe, setDraggingKeyframe] = useState<{
    clipId: string;
    keyframeIndex: number;
  } | null>(null);
  const [resizingClip, setResizingClip] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    originalStartTime: number;
    originalDuration: number;
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
    updateClip,
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

    // Draw time ruler with markers every 5 seconds
    const rulerHeight = 30;
    ctx.fillStyle = '#141a21';
    ctx.fillRect(0, 0, canvas.width, rulerHeight);

    ctx.strokeStyle = '#2a3441';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';

    // Draw ruler marks every 5 seconds
    for (let i = 0; i <= duration; i += 5) {
      const x = i * pixelsPerSecond;
      if (x > canvas.width) break;

      // Major tick at 5-second intervals
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight - 12);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();

      // Time label
      const mins = Math.floor(i / 60);
      const secs = i % 60;
      const timeLabel = `${mins}:${secs.toString().padStart(2, '0')}`;
      ctx.fillText(timeLabel, x, rulerHeight - 16);

      // Draw minor ticks (1-second intervals)
      if (i < duration) {
        for (let j = 1; j < 5; j++) {
          const minorX = (i + j) * pixelsPerSecond;
          if (minorX > canvas.width) break;
          ctx.beginPath();
          ctx.moveTo(minorX, rulerHeight - 6);
          ctx.lineTo(minorX, rulerHeight);
          ctx.stroke();
        }
      }
    }

    // Draw tracks with improved grid pattern
    const trackPadding = 8;
    let currentY = rulerHeight;

    tracks.forEach((track, trackIndex) => {
      // Track background with alternating colors
      ctx.fillStyle = trackIndex % 2 === 0 ? '#0f1419' : '#141a21';
      ctx.fillRect(0, currentY, canvas.width, trackHeight);

      // Draw grid lines every 5 seconds
      ctx.strokeStyle = trackIndex % 2 === 0 ? '#1a2028' : '#1f252e';
      ctx.lineWidth = 1;
      for (let i = 0; i <= duration; i += 5) {
        const x = i * pixelsPerSecond;
        if (x > canvas.width) break;
        ctx.beginPath();
        ctx.moveTo(x, currentY);
        ctx.lineTo(x, currentY + trackHeight);
        ctx.stroke();
      }

      // Track separator
      ctx.strokeStyle = '#2a3441';
      ctx.beginPath();
      ctx.moveTo(0, currentY + trackHeight);
      ctx.lineTo(canvas.width, currentY + trackHeight);
      ctx.stroke();

      // Draw clips with improved styling
      track.clips.forEach((clip) => {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        const clipY = currentY + trackPadding;
        const clipHeight = trackHeight - (trackPadding * 2);

        const isSelected = clip.id === selectedClipId;

        // Clip shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(clipX + 2, clipY + 2, clipWidth, clipHeight);

        // Clip background with gradient
        const gradient = ctx.createLinearGradient(clipX, clipY, clipX, clipY + clipHeight);
        if (isSelected) {
          gradient.addColorStop(0, '#5ab8e0');
          gradient.addColorStop(1, '#3a92c0');
        } else {
          gradient.addColorStop(0, '#2e7a9a');
          gradient.addColorStop(1, '#1e5a7a');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(clipX, clipY, clipWidth, clipHeight);

        // Clip border
        ctx.strokeStyle = isSelected ? '#6cc3e8' : '#4aaed9';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(clipX, clipY, clipWidth, clipHeight);

        // Resize handles on edges (only for selected clip)
        if (isSelected) {
          const handleWidth = 8;
          
          // Left handle
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(clipX - handleWidth / 2, clipY, handleWidth, clipHeight);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.strokeRect(clipX - handleWidth / 2, clipY, handleWidth, clipHeight);
          
          // Right handle
          ctx.fillRect(clipX + clipWidth - handleWidth / 2, clipY, handleWidth, clipHeight);
          ctx.strokeRect(clipX + clipWidth - handleWidth / 2, clipY, handleWidth, clipHeight);
        }

        // Clip name with background
        const asset = assets.find(a => a.id === clip.assetId);
        const clipName = asset ? asset.name : 'Clip';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(clipX + 4, clipY + 4, Math.min(clipWidth - 8, 120), 16);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        const maxWidth = clipWidth - 12;
        let displayName = clipName;
        if (ctx.measureText(displayName).width > maxWidth) {
          displayName = clipName.substring(0, 15) + '...';
        }
        ctx.fillText(displayName, clipX + 6, clipY + 15);

        // Draw animation keyframes as yellow markers
        if (clip.properties.animationKeyframes && clip.properties.animationKeyframes.length > 0) {
          clip.properties.animationKeyframes.forEach((keyframe: any) => {
            const keyframeX = clipX + (keyframe.time * pixelsPerSecond);
            const keyframeY = clipY + clipHeight / 2;
            
            // Yellow diamond/rhombus shape
            ctx.save();
            ctx.translate(keyframeX, keyframeY);
            ctx.rotate(Math.PI / 4); // Rotate 45 degrees
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-6, -6, 12, 12);
            
            // Yellow keyframe
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-5, -5, 10, 10);
            
            // Border
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(-5, -5, 10, 10);
            
            ctx.restore();
            
            // Animation name label
            if (keyframe.activeAnimations && keyframe.activeAnimations.length > 0) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(keyframeX - 30, clipY + 20, 60, 14);
              
              ctx.fillStyle = '#fbbf24';
              ctx.font = '9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(keyframe.activeAnimations[0].substring(0, 8), keyframeX, clipY + 30);
            }
          });
        }
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

    // Draw playhead with improved styling
    const playheadX = currentTime * pixelsPerSecond;
    
    // Playhead line
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4aaed9');
    gradient.addColorStop(1, 'rgba(74, 174, 217, 0.5)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, rulerHeight);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Playhead handle/head at top
    ctx.fillStyle = '#4aaed9';
    ctx.strokeStyle = '#2a8bb3';
    ctx.lineWidth = 2;
    
    // Triangle head
    ctx.beginPath();
    ctx.moveTo(playheadX, rulerHeight);
    ctx.lineTo(playheadX - 6, rulerHeight - 8);
    ctx.lineTo(playheadX + 6, rulerHeight - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Circle on top
    ctx.beginPath();
    ctx.arc(playheadX, rulerHeight - 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6cc3e8';
    ctx.fill();

  }, [tracks, currentTime, duration, zoom, selectedClipId, pixelsPerSecond, dropPreview]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a keyframe first
    const rulerHeight = 30;
    const trackHeight = 60;
    let currentY = rulerHeight;

    for (const track of tracks) {
      for (const clip of track.clips) {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        const clipY = currentY + 8;
        const clipHeight = trackHeight - 16;

        // Check keyframes
        if (clip.properties.animationKeyframes) {
          for (let i = 0; i < clip.properties.animationKeyframes.length; i++) {
            const keyframe = clip.properties.animationKeyframes[i];
            const keyframeX = clipX + (keyframe.time * pixelsPerSecond);
            const keyframeY = clipY + clipHeight / 2;
            
            // Check if click is near keyframe (hit area)
            const distance = Math.sqrt(Math.pow(x - keyframeX, 2) + Math.pow(y - keyframeY, 2));
            if (distance < 10) {
              selectClip(clip.id);
              return;
            }
          }
        }

        // Check if clicked on clip
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rulerHeight = 30;
    const trackHeight = 60;
    let currentY = rulerHeight;

    // Check if mouse down on a resize handle first (for selected clip)
    if (selectedClipId) {
      for (const track of tracks) {
        for (const clip of track.clips) {
          if (clip.id !== selectedClipId) continue;
          
          const clipX = clip.startTime * pixelsPerSecond;
          const clipWidth = clip.duration * pixelsPerSecond;
          const clipY = currentY + 8;
          const clipHeight = trackHeight - 16;

          const handleWidth = 8;
          const tolerance = 5;

          // Check left handle
          if (
            y >= clipY && y <= clipY + clipHeight &&
            x >= clipX - handleWidth / 2 - tolerance && 
            x <= clipX + handleWidth / 2 + tolerance
          ) {
            setResizingClip({
              clipId: clip.id,
              edge: 'left',
              originalStartTime: clip.startTime,
              originalDuration: clip.duration,
            });
            return;
          }

          // Check right handle
          if (
            y >= clipY && y <= clipY + clipHeight &&
            x >= clipX + clipWidth - handleWidth / 2 - tolerance && 
            x <= clipX + clipWidth + handleWidth / 2 + tolerance
          ) {
            setResizingClip({
              clipId: clip.id,
              edge: 'right',
              originalStartTime: clip.startTime,
              originalDuration: clip.duration,
            });
            return;
          }
        }
        currentY += trackHeight;
      }
    }

    // Reset for keyframe check
    currentY = rulerHeight;

    // Check if mouse down on a keyframe
    for (const track of tracks) {
      for (const clip of track.clips) {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipY = currentY + 8;
        const clipHeight = trackHeight - 16;

        if (clip.properties.animationKeyframes) {
          for (let i = 0; i < clip.properties.animationKeyframes.length; i++) {
            const keyframe = clip.properties.animationKeyframes[i];
            const keyframeX = clipX + (keyframe.time * pixelsPerSecond);
            const keyframeY = clipY + clipHeight / 2;
            
            const distance = Math.sqrt(Math.pow(x - keyframeX, 2) + Math.pow(y - keyframeY, 2));
            if (distance < 10) {
              setDraggingKeyframe({ clipId: clip.id, keyframeIndex: i });
              selectClip(clip.id);
              return;
            }
          }
        }
      }
      currentY += trackHeight;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Handle clip resizing
    if (resizingClip) {
      const clip = tracks.flatMap(t => t.clips).find(c => c.id === resizingClip.clipId);
      if (!clip) return;

      const asset = assets.find(a => a.id === clip.assetId);
      const newTime = x / pixelsPerSecond;

      if (resizingClip.edge === 'left') {
        // Resizing from left edge (changing start time and duration)
        const maxStartTime = resizingClip.originalStartTime + resizingClip.originalDuration - 0.1;
        const newStartTime = Math.max(0, Math.min(newTime, maxStartTime));
        const newDuration = resizingClip.originalStartTime + resizingClip.originalDuration - newStartTime;

        updateClip(clip.id, {
          startTime: newStartTime,
          duration: Math.max(0.1, newDuration),
        });
      } else {
        // Resizing from right edge (changing duration only)
        let newDuration = newTime - clip.startTime;
        newDuration = Math.max(0.1, newDuration);

        // Limit duration for video and audio to their actual duration
        if (asset && (asset.type === 'video' || asset.type === 'audio')) {
          const maxDuration = asset.duration || 10;
          newDuration = Math.min(newDuration, maxDuration);
        }

        updateClip(clip.id, {
          duration: newDuration,
        });
      }
      return;
    }

    // Handle keyframe dragging
    if (draggingKeyframe) {
      const clip = tracks.flatMap(t => t.clips).find(c => c.id === draggingKeyframe.clipId);
      if (!clip) return;

      const clipX = clip.startTime * pixelsPerSecond;
      const relativeX = x - clipX;
      const newTime = Math.max(0, Math.min(relativeX / pixelsPerSecond, clip.duration));

      const keyframes = [...(clip.properties.animationKeyframes || [])];
      keyframes[draggingKeyframe.keyframeIndex].time = newTime;

      updateClip(clip.id, {
        properties: {
          ...clip.properties,
          animationKeyframes: keyframes.sort((a, b) => a.time - b.time),
        },
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingKeyframe(null);
    setResizingClip(null);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-80 bg-timeline-bg border-t border-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-panel-header border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-foreground">Timeline</h2>
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium text-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Track
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-40 bg-panel-content border-r border-border flex flex-col overflow-y-auto">
          <div className="h-8 border-b border-border bg-panel-header" />
          {tracks.map((track) => (
            <div 
              key={track.id}
              className="h-[60px] border-b border-border px-3 py-2 flex flex-col justify-between bg-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{track.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  title={track.muted ? "Unmute" : "Mute"}
                >
                  {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  title={track.locked ? "Unlock" : "Lock"}
                >
                  {track.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto relative"
        >
          <canvas
            ref={canvasRef}
            className={`w-full h-full transition-all ${
              isDraggingOver ? 'ring-2 ring-primary ring-inset' : ''
            } ${
              resizingClip 
                ? 'cursor-ew-resize' 
                : draggingKeyframe 
                  ? 'cursor-grabbing' 
                  : 'cursor-pointer'
            }`}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';

interface InteractiveCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
}

export const InteractiveCanvas = ({ canvasWidth, canvasHeight }: InteractiveCanvasProps) => {
  const { selectedClipId, tracks, assets, updateClip, currentTime } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialProps, setInitialProps] = useState<any>(null);

  const selectedClip = tracks
    .flatMap(track => track.clips)
    .find(clip => clip.id === selectedClipId);

  const asset = selectedClip ? assets.find(a => a.id === selectedClip.assetId) : null;
  const isActive = selectedClip && 
    currentTime >= selectedClip.startTime && 
    currentTime < selectedClip.startTime + selectedClip.duration;

  // Only show controls for active 2D clips (images/videos, not 3D)
  const showControls = isActive && asset && (asset.type === 'image' || asset.type === 'video');

  const getElementBounds = () => {
    if (!selectedClip || !asset || !containerRef.current) return null;

    const scale = selectedClip.properties.scale || { x: 1, y: 1 };
    const position = selectedClip.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 };

    let naturalWidth = 0;
    let naturalHeight = 0;

    if (asset.type === 'image') {
      const img = new Image();
      img.src = asset.url;
      naturalWidth = img.naturalWidth || 100;
      naturalHeight = img.naturalHeight || 100;
    } else if (asset.type === 'video') {
      naturalWidth = 1920;
      naturalHeight = 1080;
    }

    const width = naturalWidth * scale.x;
    const height = naturalHeight * scale.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scaleX = containerRect.width / canvasWidth;
    const scaleY = containerRect.height / canvasHeight;

    return {
      left: (position.x - width / 2) * scaleX,
      top: (position.y - height / 2) * scaleY,
      width: width * scaleX,
      height: height * scaleY,
      centerX: position.x,
      centerY: position.y,
      originalWidth: width,
      originalHeight: height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedClip || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setDragStart({ x, y });
    setInitialProps({
      position: selectedClip.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 },
      scale: selectedClip.properties.scale || { x: 1, y: 1 },
    });

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!selectedClip || !containerRef.current || !initialProps) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    const scaleX = canvasWidth / containerRect.width;
    const scaleY = canvasHeight / containerRect.height;

    if (isDragging) {
      const newPosition = {
        x: initialProps.position.x + deltaX * scaleX,
        y: initialProps.position.y + deltaY * scaleY,
      };

      updateClip(selectedClip.id, {
        properties: {
          ...selectedClip.properties,
          position: newPosition,
        },
      });
    } else if (isResizing) {
      const bounds = getElementBounds();
      if (!bounds) return;

      let newScaleX = initialProps.scale.x;
      let newScaleY = initialProps.scale.y;

      if (resizeHandle?.includes('e')) {
        newScaleX = initialProps.scale.x + (deltaX * scaleX) / (bounds.originalWidth / initialProps.scale.x);
      } else if (resizeHandle?.includes('w')) {
        newScaleX = initialProps.scale.x - (deltaX * scaleX) / (bounds.originalWidth / initialProps.scale.x);
      }

      if (resizeHandle?.includes('s')) {
        newScaleY = initialProps.scale.y + (deltaY * scaleY) / (bounds.originalHeight / initialProps.scale.y);
      } else if (resizeHandle?.includes('n')) {
        newScaleY = initialProps.scale.y - (deltaY * scaleY) / (bounds.originalHeight / initialProps.scale.y);
      }

      // Maintain aspect ratio on corner handles
      if (resizeHandle?.includes('n') || resizeHandle?.includes('s')) {
        if (resizeHandle?.includes('e') || resizeHandle?.includes('w')) {
          const avgScale = (newScaleX + newScaleY) / 2;
          newScaleX = avgScale;
          newScaleY = avgScale;
        }
      }

      newScaleX = Math.max(0.1, Math.min(5, newScaleX));
      newScaleY = Math.max(0.1, Math.min(5, newScaleY));

      updateClip(selectedClip.id, {
        properties: {
          ...selectedClip.properties,
          scale: { x: newScaleX, y: newScaleY, z: 1 },
        },
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setInitialProps(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, initialProps]);

  if (!showControls) return null;

  const bounds = getElementBounds();
  if (!bounds) return null;

  const handleSize = 8;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ pointerEvents: 'none', zIndex: 10 }}
    >
      {/* Selection box */}
      <div
        className="absolute border-2 border-primary cursor-move"
        style={{
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Resize handles */}
        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
          let style: React.CSSProperties = {
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            backgroundColor: 'hsl(var(--primary))',
            border: '1px solid white',
            pointerEvents: 'auto',
          };

          if (handle.includes('n')) style.top = -handleSize / 2;
          if (handle.includes('s')) style.bottom = -handleSize / 2;
          if (handle.includes('e')) style.right = -handleSize / 2;
          if (handle.includes('w')) style.left = -handleSize / 2;
          if (!handle.includes('n') && !handle.includes('s')) style.top = '50%';
          if (!handle.includes('e') && !handle.includes('w')) style.left = '50%';
          if (style.top === '50%') style.transform = 'translateY(-50%)';
          if (style.left === '50%') style.transform = 'translateX(-50%)';
          if (style.top === '50%' && style.left === '50%') style.transform = 'translate(-50%, -50%)';

          const cursors: { [key: string]: string } = {
            nw: 'nw-resize',
            n: 'n-resize',
            ne: 'ne-resize',
            e: 'e-resize',
            se: 'se-resize',
            s: 's-resize',
            sw: 'sw-resize',
            w: 'w-resize',
          };

          style.cursor = cursors[handle];

          return (
            <div
              key={handle}
              style={style}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          );
        })}
      </div>
    </div>
  );
};

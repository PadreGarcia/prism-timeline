import { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Eraser, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface EraserCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
}

export const EraserCanvas = ({ canvasWidth, canvasHeight, onClose }: EraserCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const { selectedClipId, tracks, assets, updateClip, addAsset } = useEditorStore();

  const selectedClip = tracks
    .flatMap(track => track.clips)
    .find(clip => clip.id === selectedClipId);

  const asset = selectedClip ? assets.find(a => a.id === selectedClip.assetId) : null;

  useEffect(() => {
    if (!canvasRef.current || !maskCanvasRef.current || !asset) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    // Draw the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = asset.url;
    img.onload = () => {
      const scale = selectedClip.properties.scale || { x: 1, y: 1 };
      const position = selectedClip.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 };
      
      const width = img.naturalWidth * scale.x;
      const height = img.naturalHeight * scale.y;
      
      ctx.drawImage(
        img,
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
      );
    };

    // Initialize mask canvas with transparent background
    maskCtx.fillStyle = 'transparent';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  }, [asset, selectedClip, canvasWidth, canvasHeight]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    if (coords && maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
        
        // Update display canvas
        updateDisplayCanvas();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;

    const coords = getCanvasCoordinates(e);
    if (coords) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
        
        // Update display canvas
        updateDisplayCanvas();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const updateDisplayCanvas = () => {
    if (!canvasRef.current || !maskCanvasRef.current || !asset) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    // Redraw image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = asset.url;
    img.onload = () => {
      const scale = selectedClip!.properties.scale || { x: 1, y: 1 };
      const position = selectedClip!.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 };
      
      const width = img.naturalWidth * scale.x;
      const height = img.naturalHeight * scale.y;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
      );

      // Apply semi-transparent red overlay on erased areas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    };
  };

  const handleApply = async () => {
    if (!canvasRef.current || !maskCanvasRef.current || !asset || !selectedClip) return;

    try {
      toast('Aplicando borrado...');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = asset.url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const scale = selectedClip.properties.scale || { x: 1, y: 1 };
      const position = selectedClip.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 };
      
      const width = img.naturalWidth * scale.x;
      const height = img.naturalHeight * scale.y;
      const left = position.x - width / 2;
      const top = position.y - height / 2;

      // Create final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = img.naturalWidth;
      finalCanvas.height = img.naturalHeight;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) throw new Error('Could not get context');

      // Draw original image
      finalCtx.drawImage(img, 0, 0);

      // Get mask data
      const maskCtx = maskCanvasRef.current.getContext('2d');
      if (!maskCtx) throw new Error('Could not get mask context');

      const maskData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const finalImageData = finalCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);

      // Apply mask - make erased areas transparent
      for (let y = 0; y < img.naturalHeight; y++) {
        for (let x = 0; x < img.naturalWidth; x++) {
          // Map from image coordinates to canvas coordinates
          const canvasX = Math.floor(left + (x / img.naturalWidth) * width);
          const canvasY = Math.floor(top + (y / img.naturalHeight) * height);

          if (canvasX >= 0 && canvasX < canvasWidth && canvasY >= 0 && canvasY < canvasHeight) {
            const maskIdx = (canvasY * canvasWidth + canvasX) * 4;
            const maskAlpha = maskData.data[maskIdx + 3];

            if (maskAlpha > 0) {
              // This area was marked for erasing
              const imgIdx = (y * img.naturalWidth + x) * 4;
              finalImageData.data[imgIdx + 3] = 0; // Make transparent
            }
          }
        }
      }

      finalCtx.putImageData(finalImageData, 0, 0);

      // Convert to blob and create new asset
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      const url = URL.createObjectURL(blob);
      const newAsset = {
        id: `asset-${Date.now()}`,
        type: 'image' as const,
        name: `${asset.name}-erased.png`,
        url,
        duration: 0,
      };

      addAsset(newAsset);
      updateClip(selectedClip.id, { assetId: newAsset.id });

      toast.success('Borrado aplicado correctamente');
      onClose();
    } catch (error) {
      console.error('Error applying eraser:', error);
      toast.error('Error al aplicar el borrado');
    }
  };

  if (!asset || !selectedClip) return null;

  return (
    <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
      <div className="bg-background rounded-lg p-4 max-w-6xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eraser className="w-5 h-5" />
              Borrador Inteligente
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm">Tamaño:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm w-8">{brushSize}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} size="sm">
              <Check className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
        
        <div className="relative border border-border rounded-lg overflow-hidden bg-checkerboard">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ aspectRatio: '16/9' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <canvas
            ref={maskCanvasRef}
            className="hidden"
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Pinta sobre las áreas que quieres eliminar. Las áreas marcadas en rojo serán transparentes.
        </p>
      </div>
    </div>
  );
};

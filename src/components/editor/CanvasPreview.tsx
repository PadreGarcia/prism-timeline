import { useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";

export const CanvasPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTime, tracks } = useEditorStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1920;
    canvas.height = 1080;

    // Draw background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw placeholder text
    ctx.fillStyle = '#4aaed9';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Video Preview', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#6b7280';
    ctx.font = '24px sans-serif';
    ctx.fillText('1920 x 1080', canvas.width / 2, canvas.height / 2 + 50);

  }, [currentTime, tracks]);

  return (
    <div className="flex-1 bg-canvas-bg flex items-center justify-center p-4">
      <div className="relative border border-border rounded-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ aspectRatio: '16/9' }}
        />
      </div>
    </div>
  );
};

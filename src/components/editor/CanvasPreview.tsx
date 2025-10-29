import { useRef, useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export const CanvasPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const [mediaLoaded, setMediaLoaded] = useState<Set<string>>(new Set());
  
  const { currentTime, tracks, assets } = useEditorStore();

  // Load media elements
  useEffect(() => {
    assets.forEach((asset) => {
      if (asset.type === 'video' && !videoRefs.current.has(asset.id)) {
        const video = document.createElement('video');
        video.src = asset.url;
        video.preload = 'auto';
        video.onloadeddata = () => {
          setMediaLoaded(prev => new Set(prev).add(asset.id));
        };
        videoRefs.current.set(asset.id, video);
      } else if (asset.type === 'image' && !imageRefs.current.has(asset.id)) {
        const img = new Image();
        img.src = asset.url;
        img.onload = () => {
          setMediaLoaded(prev => new Set(prev).add(asset.id));
        };
        imageRefs.current.set(asset.id, img);
      }
    });
  }, [assets]);

  // Update video times based on currentTime
  useEffect(() => {
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const asset = assets.find(a => a.id === clip.assetId);
        if (asset?.type === 'video') {
          const video = videoRefs.current.get(asset.id);
          if (video && currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
            const videoTime = currentTime - clip.startTime;
            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
            }
          }
        }
      });
    });
  }, [currentTime, tracks, assets]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1920;
    canvas.height = 1080;

    // Clear and draw background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get active clips at current time
    const activeClips = tracks.flatMap((track) => 
      track.clips
        .filter(clip => currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration)
        .map(clip => ({ ...clip, track }))
    );

    // Draw each active clip
    activeClips.forEach((clipData) => {
      const asset = assets.find(a => a.id === clipData.assetId);
      if (!asset) return;

      const opacity = clipData.properties.opacity ?? 1;
      const scale = clipData.properties.scale ?? { x: 1, y: 1 };
      const position = clipData.properties.position ?? { x: canvas.width / 2, y: canvas.height / 2 };

      ctx.save();
      ctx.globalAlpha = opacity;

      if (asset.type === 'video') {
        const video = videoRefs.current.get(asset.id);
        if (video && video.readyState >= 2) {
          const width = video.videoWidth * scale.x;
          const height = video.videoHeight * scale.y;
          
          ctx.drawImage(
            video,
            position.x - width / 2,
            position.y - height / 2,
            width,
            height
          );
        }
      } else if (asset.type === 'image') {
        const img = imageRefs.current.get(asset.id);
        if (img && img.complete) {
          const width = img.width * scale.x;
          const height = img.height * scale.y;
          
          ctx.drawImage(
            img,
            position.x - width / 2,
            position.y - height / 2,
            width,
            height
          );
        }
      }

      ctx.restore();
    });

    // Draw time indicator
    ctx.fillStyle = '#4aaed9';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${currentTime.toFixed(2)}s`, 20, 30);

    // If no clips, show placeholder
    if (activeClips.length === 0) {
      ctx.fillStyle = '#4aaed9';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.3;
      ctx.fillText('Drop clips to timeline', canvas.width / 2, canvas.height / 2);
    }

  }, [currentTime, tracks, assets, mediaLoaded]);

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

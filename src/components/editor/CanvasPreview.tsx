import { useRef, useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Component to render 3D model
const Model3D = ({ url, position, rotation, scale }: any) => {
  try {
    const gltf = useGLTF(url);
    const scene = 'scene' in gltf ? gltf.scene : null;
    
    if (!scene) return null;
    
    return (
      <primitive 
        object={scene.clone()} 
        position={position || [0, 0, 0]}
        rotation={rotation || [0, 0, 0]}
        scale={scale || [1, 1, 1]}
      />
    );
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return null;
  }
};

export const CanvasPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [mediaLoaded, setMediaLoaded] = useState<Set<string>>(new Set());
  const [active3DClips, setActive3DClips] = useState<any[]>([]);
  
  const { currentTime, tracks, assets, isPlaying } = useEditorStore();

  // Load media elements
  useEffect(() => {
    assets.forEach((asset) => {
      if (asset.type === 'video' && !videoRefs.current.has(asset.id)) {
        const video = document.createElement('video');
        video.src = asset.url;
        video.preload = 'auto';
        video.muted = false;
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
      } else if (asset.type === 'audio' && !audioRefs.current.has(asset.id)) {
        const audio = new Audio();
        audio.src = asset.url;
        audio.preload = 'auto';
        audio.onloadeddata = () => {
          setMediaLoaded(prev => new Set(prev).add(asset.id));
        };
        audioRefs.current.set(asset.id, audio);
      }
    });
  }, [assets]);

  // Handle audio playback
  useEffect(() => {
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const asset = assets.find(a => a.id === clip.assetId);
        if (asset?.type === 'audio') {
          const audio = audioRefs.current.get(asset.id);
          if (audio) {
            const isActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
            const audioTime = currentTime - clip.startTime;
            
            if (isActive && isPlaying) {
              if (audio.paused) {
                audio.currentTime = audioTime;
                audio.volume = clip.properties.volume ?? 1;
                audio.play().catch(err => console.error('Error playing audio:', err));
              } else if (Math.abs(audio.currentTime - audioTime) > 0.1) {
                audio.currentTime = audioTime;
              }
              audio.volume = clip.properties.volume ?? 1;
            } else {
              if (!audio.paused) {
                audio.pause();
              }
            }
          }
        }
      });
    });
  }, [currentTime, tracks, assets, isPlaying]);

  // Update active 3D clips
  useEffect(() => {
    const active3D = tracks.flatMap((track) => 
      track.clips
        .filter(clip => {
          const asset = assets.find(a => a.id === clip.assetId);
          return asset?.type === '3d' && 
                 currentTime >= clip.startTime && 
                 currentTime < clip.startTime + clip.duration;
        })
        .map(clip => {
          const asset = assets.find(a => a.id === clip.assetId);
          return { clip, asset };
        })
    );
    setActive3DClips(active3D);
  }, [currentTime, tracks, assets]);

  // Update video times based on currentTime and play/pause
  useEffect(() => {
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const asset = assets.find(a => a.id === clip.assetId);
        if (asset?.type === 'video') {
          const video = videoRefs.current.get(asset.id);
          if (video) {
            const isActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
            const videoTime = currentTime - clip.startTime;
            
            if (isActive && isPlaying) {
              if (video.paused) {
                video.currentTime = videoTime;
                video.play().catch(err => console.error('Error playing video:', err));
              } else if (Math.abs(video.currentTime - videoTime) > 0.1) {
                video.currentTime = videoTime;
              }
            } else {
              if (!video.paused) {
                video.pause();
              }
              if (isActive) {
                video.currentTime = videoTime;
              }
            }
          }
        }
      });
    });
  }, [currentTime, tracks, assets, isPlaying]);

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
    <div className="flex-1 bg-canvas-bg flex items-center justify-center p-4 relative">
      <div className="relative border border-border rounded-lg overflow-hidden shadow-2xl w-full max-w-6xl">
        {/* 2D Canvas for video and images */}
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ aspectRatio: '16/9' }}
        />
        
        {/* 3D Canvas overlay */}
        {active3DClips.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
              
              {active3DClips.map(({ clip, asset }) => {
                if (!asset) return null;
                const pos = clip.properties.position || { x: 0, y: 0, z: 0 };
                const rot = clip.properties.rotation || { x: 0, y: 0, z: 0 };
                const scl = clip.properties.scale || { x: 1, y: 1, z: 1 };
                
                return (
                  <Model3D
                    key={clip.id}
                    url={asset.url}
                    position={[pos.x / 200, pos.y / 200, pos.z || 0]}
                    rotation={[rot.x, rot.y, rot.z]}
                    scale={[scl.x, scl.y, scl.z || 1]}
                  />
                );
              })}
              
              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

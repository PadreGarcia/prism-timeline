import { useRef, useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { InteractiveCanvas } from "./InteractiveCanvas";

// Component to render 3D model with animations
const Model3D = ({ clip, url, position, rotation, scale, onAnimationsLoaded, currentClipTime }: any) => {
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  
  const gltf = useGLTF(url) as any;
  const originalScene = gltf?.scene;
  const animations = gltf?.animations || [];

  // Clone scene once and set up mixer
  useEffect(() => {
    if (!originalScene) return;
    
    const cloned = originalScene.clone();
    
    // Center the model by calculating its bounding box
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    
    // Offset the entire model to center it at origin
    cloned.position.set(-center.x, -center.y, -center.z);
    
    setClonedScene(cloned);
    
    // Create mixer on the cloned scene
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(cloned);
      animationMixerRef.current = mixer;
      
      // Notify parent about available animations
      const animNames = animations.map((anim: any) => anim.name);
      if (onAnimationsLoaded && animNames.length > 0) {
        onAnimationsLoaded(animNames);
      }
    }
    
    return () => {
      if (animationMixerRef.current) {
        animationMixerRef.current.stopAllAction();
      }
    };
  }, [originalScene, animations.length]);

  // Update active animations based on keyframes or default settings
  useEffect(() => {
    if (!animationMixerRef.current || !animations || animations.length === 0) return;

    // Stop all current actions
    activeActionsRef.current.forEach(action => action.stop());
    activeActionsRef.current = [];

    let activeAnims: string[] = [];
    let speed = 1;
    let loop = true;

    // Check if we have keyframes and find the appropriate one
    const keyframes = clip.properties?.animationKeyframes;
    if (keyframes && keyframes.length > 0) {
      // Find the most recent keyframe before or at current time
      const applicableKeyframe = keyframes
        .filter((kf: any) => kf.time <= currentClipTime)
        .sort((a: any, b: any) => b.time - a.time)[0];
      
      if (applicableKeyframe) {
        activeAnims = applicableKeyframe.activeAnimations;
        speed = applicableKeyframe.speed;
        loop = applicableKeyframe.loop;
      } else {
        // Before first keyframe, use default settings
        activeAnims = clip.properties?.animations?.active || [];
        speed = clip.properties?.animations?.speed || 1;
        loop = clip.properties?.animations?.loop !== false;
      }
    } else {
      // No keyframes, use default animation settings
      activeAnims = clip.properties?.animations?.active || [];
      speed = clip.properties?.animations?.speed || 1;
      loop = clip.properties?.animations?.loop !== false;
    }

    // Start the appropriate animations
    activeAnims.forEach((animName: string) => {
      const animClip = animations.find((a: any) => a.name === animName);
      if (animClip) {
        const action = animationMixerRef.current!.clipAction(animClip);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        action.timeScale = speed;
        action.play();
        activeActionsRef.current.push(action);
      }
    });
  }, [clip.properties?.animations, clip.properties?.animationKeyframes, animations, currentClipTime]);

  // Update mixer on every frame using useFrame
  useFrame((state, delta) => {
    if (animationMixerRef.current) {
      animationMixerRef.current.update(delta);
    }
  });

  // Apply material properties
  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Clone material to avoid affecting other instances
        if (!child.material.userData.isCloned) {
          child.material = child.material.clone();
          child.material.userData.isCloned = true;
        }
        
        if (clip.properties?.wireframe !== undefined) {
          child.material.wireframe = clip.properties.wireframe;
        }
        if (clip.properties?.metalness !== undefined) {
          child.material.metalness = clip.properties.metalness;
        }
        if (clip.properties?.roughness !== undefined) {
          child.material.roughness = clip.properties.roughness;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, clip.properties?.wireframe, clip.properties?.metalness, clip.properties?.roughness]);
  
  if (!clonedScene) return null;
  
  return (
    <group 
      ref={groupRef}
      position={position || [0, 0, 0]}
      rotation={rotation || [0, 0, 0]}
      scale={scale || [1, 1, 1]}
    >
      <primitive object={clonedScene} />
    </group>
  );
};

export const CanvasPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [mediaLoaded, setMediaLoaded] = useState<Set<string>>(new Set());
  const [active3DClips, setActive3DClips] = useState<any[]>([]);
  const [activeGifClips, setActiveGifClips] = useState<any[]>([]);
  
  const { currentTime, tracks, assets, isPlaying, updateClip } = useEditorStore();

  // Handle animations loaded from 3D models
  const handleAnimationsLoaded = (clipId: string, animationNames: string[]) => {
    const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
    if (clip && (!clip.properties.animations || !clip.properties.animations.available)) {
      updateClip(clipId, {
        properties: {
          ...clip.properties,
          animations: {
            available: animationNames,
            active: [],
            speed: 1,
            loop: true,
          }
        }
      });
    }
  };

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
        img.onerror = (err) => {
          console.error('Error loading image:', asset.url, err);
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

  // Update active GIF clips
  useEffect(() => {
    const activeGifs = tracks.flatMap((track) => 
      track.clips
        .filter(clip => {
          const asset = assets.find(a => a.id === clip.assetId);
          return asset?.type === 'image' && 
                 clip.properties.isAnimatedGif &&
                 currentTime >= clip.startTime && 
                 currentTime < clip.startTime + clip.duration;
        })
        .map(clip => {
          const asset = assets.find(a => a.id === clip.assetId);
          return { clip, asset };
        })
    );
    setActiveGifClips(activeGifs);
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

    // Draw each active clip (excluding animated GIFs which are rendered in overlay)
    activeClips.forEach((clipData) => {
      const asset = assets.find(a => a.id === clipData.assetId);
      if (!asset) return;

      // Skip animated GIFs as they're rendered in overlay
      if (asset.type === 'image' && clipData.properties.isAnimatedGif) return;

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
        if (img && img.complete && img.naturalWidth > 0) {
          const width = img.naturalWidth * scale.x;
          const height = img.naturalHeight * scale.y;
          
          ctx.drawImage(
            img,
            position.x - width / 2,
            position.y - height / 2,
            width,
            height
          );
        }
      } else if (asset.type === 'text' && asset.textProperties) {
        // Render text
        const { content, fontSize, color, fontFamily } = asset.textProperties;
        ctx.font = `${fontSize * scale.x}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(content, position.x, position.y);
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
        
        {/* Interactive controls overlay */}
        <InteractiveCanvas canvasWidth={1920} canvasHeight={1080} />
        
        {/* Animated GIF overlay */}
        {activeGifClips.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {activeGifClips.map(({ clip, asset }) => {
              if (!asset) return null;
              
              const canvasWidth = 1920;
              const canvasHeight = 1080;
              const scale = clip.properties.scale || { x: 1, y: 1 };
              const position = clip.properties.position || { x: canvasWidth / 2, y: canvasHeight / 2 };
              const opacity = clip.properties.opacity ?? 1;
              
              const img = imageRefs.current.get(asset.id);
              if (!img) return null;
              
              const width = (img.naturalWidth * scale.x);
              const height = (img.naturalHeight * scale.y);
              
              // Convert canvas coordinates to percentage
              const leftPercent = ((position.x - width / 2) / canvasWidth) * 100;
              const topPercent = ((position.y - height / 2) / canvasHeight) * 100;
              const widthPercent = (width / canvasWidth) * 100;
              const heightPercent = (height / canvasHeight) * 100;
              
              return (
                <img
                  key={clip.id}
                  src={asset.url}
                  alt={asset.name}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    opacity: opacity,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
          </div>
        )}
        
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
                const clipTime = currentTime - clip.startTime;
                
                return (
                  <Model3D
                    key={clip.id}
                    clip={clip}
                    url={asset.url}
                    position={[pos.x / 200, pos.y / 200, pos.z || 0]}
                    rotation={[rot.x, rot.y, rot.z]}
                    scale={[scl.x, scl.y, scl.z || 1]}
                    onAnimationsLoaded={(names: string[]) => handleAnimationsLoaded(clip.id, names)}
                    currentClipTime={clipTime}
                  />
                );
              })}
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

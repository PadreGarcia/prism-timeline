import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { width, height };
}

export const removeBackgroundFromImage = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image: ${width}x${height}`);
    
    // Get image data for color analysis
    const originalImageData = ctx.getImageData(0, 0, width, height);
    const pixels = originalImageData.data;
    
    // Detect background color (sample corners)
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 }
    ];
    
    const bgColors = corners.map(corner => {
      const idx = (corner.y * width + corner.x) * 4;
      return {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2]
      };
    });
    
    // Calculate average background color
    const avgBgColor = {
      r: bgColors.reduce((sum, c) => sum + c.r, 0) / bgColors.length,
      g: bgColors.reduce((sum, c) => sum + c.g, 0) / bgColors.length,
      b: bgColors.reduce((sum, c) => sum + c.b, 0) / bgColors.length
    };
    
    console.log('Detected background color:', avgBgColor);
    
    // Create output with transparency
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    const data = outputImageData.data;
    
    // Remove background based on color similarity
    const threshold = 40; // Tolerance for color matching
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color difference from background
      const diff = Math.sqrt(
        Math.pow(r - avgBgColor.r, 2) +
        Math.pow(g - avgBgColor.g, 2) +
        Math.pow(b - avgBgColor.b, 2)
      );
      
      // If pixel is similar to background, make it transparent
      if (diff < threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Background removed successfully');
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Check if image is an animated GIF
export const isAnimatedGif = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const arr = new Uint8Array(buffer);
    
    // Check GIF signature
    if (arr[0] !== 0x47 || arr[1] !== 0x49 || arr[2] !== 0x46) {
      return false;
    }
    
    // Look for multiple image blocks (animated GIF)
    let imageCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      // Image separator
      if (arr[i] === 0x21 && arr[i + 1] === 0xF9) {
        imageCount++;
        if (imageCount > 1) return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if GIF is animated:', error);
    return false;
  }
};

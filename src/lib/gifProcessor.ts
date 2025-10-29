import { parseGIF, decompressFrames } from 'gifuct-js';

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

// Detect background color from edges with better sampling
function detectBackgroundColor(imageData: ImageData): { r: number; g: number; b: number } {
  const { width, height, data } = imageData;
  const samples: { r: number; g: number; b: number }[] = [];
  
  // Sample all edges (top, bottom, left, right)
  const sampleInterval = 10;
  
  // Top and bottom edges
  for (let x = 0; x < width; x += sampleInterval) {
    // Top edge
    let idx = (0 * width + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    
    // Bottom edge
    idx = ((height - 1) * width + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  
  // Left and right edges
  for (let y = 0; y < height; y += sampleInterval) {
    // Left edge
    let idx = (y * width + 0) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    
    // Right edge
    idx = (y * width + (width - 1)) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  
  // Calculate median color (more robust than average)
  const sortedR = samples.map(s => s.r).sort((a, b) => a - b);
  const sortedG = samples.map(s => s.g).sort((a, b) => a - b);
  const sortedB = samples.map(s => s.b).sort((a, b) => a - b);
  
  const mid = Math.floor(samples.length / 2);
  
  return {
    r: sortedR[mid],
    g: sortedG[mid],
    b: sortedB[mid]
  };
}

// Remove background from image data
function removeBackgroundFromImageData(imageData: ImageData, bgColor: { r: number; g: number; b: number }, threshold: number = 50): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate color difference from background
    const diff = Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2)
    );
    
    // If pixel is similar to background, make it transparent
    // Use gradient alpha for smoother edges
    if (diff < threshold) {
      const alpha = Math.max(0, Math.min(255, (diff / threshold) * 255));
      data[i + 3] = alpha;
    }
  }
  
  return imageData;
}

export const removeBackgroundFromImage = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal...');
    const isGif = imageElement.src.toLowerCase().endsWith('.gif');
    
    if (isGif) {
      // Process GIF frame by frame
      console.log('Processing animated GIF...');
      const response = await fetch(imageElement.src);
      const buffer = await response.arrayBuffer();
      const gif = parseGIF(buffer);
      const frames = decompressFrames(gif, true);
      
      if (!frames || frames.length === 0) {
        throw new Error('No frames found in GIF');
      }
      
      console.log(`Processing ${frames.length} frames...`);
      
      // Get background color from first frame
      const firstFrame = frames[0];
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = firstFrame.dims.width;
      tempCanvas.height = firstFrame.dims.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) throw new Error('Could not get canvas context');
      
      const firstImageData = new ImageData(
        new Uint8ClampedArray(firstFrame.patch),
        firstFrame.dims.width,
        firstFrame.dims.height
      );
      const bgColor = detectBackgroundColor(firstImageData);
      console.log('Detected background color:', bgColor);
      
      // Process each frame
      const processedFrames: ImageData[] = [];
      for (const frame of frames) {
        const frameImageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height
        );
        const processed = removeBackgroundFromImageData(frameImageData, bgColor, 45);
        processedFrames.push(processed);
      }
      
      // For now, return first frame as PNG
      // TODO: Reconstruct GIF with all frames
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = firstFrame.dims.width;
      outputCanvas.height = firstFrame.dims.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      outputCtx.putImageData(processedFrames[0], 0, 0);
      
      return new Promise((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('GIF processed successfully (first frame)');
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      });
    } else {
      // Process static image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
      console.log(`Processing image: ${width}x${height}`);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const bgColor = detectBackgroundColor(imageData);
      console.log('Detected background color:', bgColor);
      
      const processedImageData = removeBackgroundFromImageData(imageData, bgColor, 45);
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      outputCtx.putImageData(processedImageData, 0, 0);
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
    }
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

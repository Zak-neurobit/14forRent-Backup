import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
  useWebWorker?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  error?: string;
}

/**
 * Compress an image file with smart settings based on file size
 */
export const compressImage = async (
  file: File,
  customOptions?: CompressionOptions
): Promise<CompressionResult> => {
  const originalSize = file.size;
  
  try {
    // Smart compression settings based on original file size
    const defaultOptions = getCompressionSettings(file);
    const options = { ...defaultOptions, ...customOptions };
    
    console.log(`Compressing ${file.name} (${formatFileSize(originalSize)}) with options:`, options);
    
    const compressedFile = await imageCompression(file, options);
    const compressedSize = compressedFile.size;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
    
    console.log(`Compression complete: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${compressionRatio}% reduction)`);
    
    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    
    // Return original file if compression fails
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      error: error instanceof Error ? error.message : 'Compression failed'
    };
  }
};

/**
 * Get optimal compression settings based on file size and type
 */
const getCompressionSettings = (file: File): CompressionOptions => {
  const fileSizeMB = file.size / (1024 * 1024);
  const fileType = file.type.toLowerCase();
  
  // Very large files (>3MB) - Aggressive compression
  if (fileSizeMB > 3) {
    return {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1920,
      quality: 0.7,
      fileType: 'image/webp',
      useWebWorker: true
    };
  }
  
  // Large files (1-3MB) - Strong compression
  if (fileSizeMB > 1) {
    return {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      quality: 0.75,
      fileType: 'image/webp',
      useWebWorker: true
    };
  }
  
  // Medium files (500KB-1MB) - Moderate compression
  if (fileSizeMB > 0.5) {
    return {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1600,
      quality: 0.8,
      fileType: fileType.includes('png') ? 'image/webp' : undefined,
      useWebWorker: true
    };
  }
  
  // Small files (<500KB) - Light compression
  return {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    quality: 0.85,
    fileType: fileType.includes('png') && fileSizeMB > 0.1 ? 'image/webp' : undefined,
    useWebWorker: true
  };
};

/**
 * Compress multiple images in parallel
 */
export const compressImages = async (
  files: File[],
  onProgress?: (completed: number, total: number) => void,
  customOptions?: CompressionOptions
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await compressImage(file, customOptions);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return results;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Check if file should be compressed based on size and type
 */
export const shouldCompressFile = (file: File): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  const fileType = file.type.toLowerCase();
  
  // Always compress files over 200KB
  if (fileSizeMB > 0.2) return true;
  
  // Compress PNG files over 100KB (they usually compress well to WebP)
  if (fileType.includes('png') && fileSizeMB > 0.1) return true;
  
  // Don't compress very small files
  return false;
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ];
  
  return validTypes.includes(file.type.toLowerCase());
};

/**
 * Get estimated compression savings without actually compressing
 */
export const estimateCompressionSavings = (file: File): number => {
  const fileSizeMB = file.size / (1024 * 1024);
  const fileType = file.type.toLowerCase();
  
  // Estimated compression ratios based on file type and size
  if (fileType.includes('png')) {
    if (fileSizeMB > 2) return 85; // PNG compresses very well to WebP
    if (fileSizeMB > 0.5) return 75;
    return 60;
  }
  
  if (fileType.includes('jpeg') || fileType.includes('jpg')) {
    if (fileSizeMB > 3) return 80;
    if (fileSizeMB > 1) return 70;
    return 50;
  }
  
  if (fileType.includes('heic') || fileType.includes('heif')) {
    return 70; // HEIC to WebP conversion
  }
  
  return 60; // Default estimate
};
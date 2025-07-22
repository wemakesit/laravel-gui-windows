/**
 * Camera Service for photo capture functionality
 * Handles camera access, photo capture, and image processing
 */

import { watermelonDBService } from './WatermelonDBService';

export interface PhotoRecord {
  id: string;
  estimateId: string;
  windowId?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  caption?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportedConstraints: MediaTrackSupportedConstraints;
}

export interface PhotoCaptureOptions {
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format: 'jpeg' | 'png' | 'webp';
}

class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  /**
   * Check camera capabilities
   */
  public async getCameraCapabilities(): Promise<CameraCapabilities> {
    const hasCamera =
      'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

    if (!hasCamera) {
      return {
        hasCamera: false,
        hasMultipleCameras: false,
        supportedConstraints: {},
      };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        device => device.kind === 'videoinput'
      );
      const supportedConstraints =
        navigator.mediaDevices.getSupportedConstraints();

      return {
        hasCamera: videoDevices.length > 0,
        hasMultipleCameras: videoDevices.length > 1,
        supportedConstraints,
      };
    } catch (error) {
      console.error('CameraService: Error checking capabilities:', error);
      return {
        hasCamera: false,
        hasMultipleCameras: false,
        supportedConstraints: {},
      };
    }
  }

  /**
   * Request camera permission and start stream
   */
  public async startCamera(
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<MediaStream> {
    try {
      // Stop existing stream if any
      await this.stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('CameraService: Camera started successfully');
      return this.stream;
    } catch (error) {
      console.error('CameraService: Error starting camera:', error);
      throw new Error('Failed to access camera. Please check permissions.');
    }
  }

  /**
   * Stop camera stream
   */
  public async stopCamera(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
      console.log('CameraService: Camera stopped');
    }
  }

  /**
   * Capture photo from video stream
   */
  public async capturePhoto(
    videoElement: HTMLVideoElement,
    options: PhotoCaptureOptions = {
      quality: 0.8,
      format: 'jpeg',
    }
  ): Promise<Blob> {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not available for photo capture');
    }

    // Set canvas size to video dimensions
    const { videoWidth, videoHeight } = videoElement;
    let { maxWidth = videoWidth, maxHeight = videoHeight } = options;

    // Calculate scaled dimensions while maintaining aspect ratio
    const aspectRatio = videoWidth / videoHeight;
    if (maxWidth / maxHeight > aspectRatio) {
      maxWidth = maxHeight * aspectRatio;
    } else {
      maxHeight = maxWidth / aspectRatio;
    }

    this.canvas.width = maxWidth;
    this.canvas.height = maxHeight;

    // Draw video frame to canvas
    this.context.drawImage(videoElement, 0, 0, maxWidth, maxHeight);

    // Convert to blob
    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture photo'));
          }
        },
        `image/${options.format}`,
        options.quality
      );
    });
  }

  /**
   * Save photo to WatermelonDB
   */
  public async savePhoto(
    estimateId: string,
    windowId: string,
    blob: Blob,
    filename?: string
  ): Promise<string> {
    const photoId = `photo-${estimateId}-${windowId}-${Date.now()}`;
    const photoFilename = filename || `window-${windowId}-${Date.now()}.jpg`;

    // Convert blob to base64 for storage
    const base64Data = await this.blobToBase64(blob);

    const photoRecord: PhotoRecord = {
      id: photoId,
      estimateId,
      windowId,
      filename: photoFilename,
      filePath: base64Data, // Store base64 data in filePath
      fileSize: blob.size,
      mimeType: blob.type,
      caption: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await watermelonDBService.addPhotoToEstimate(estimateId, photoRecord);
    console.log('CameraService: Photo saved:', photoId);
    return photoId;
  }

  /**
   * Get photos for estimate
   */
  public async getPhotosForEstimate(
    estimateId: string
  ): Promise<PhotoRecord[]> {
    return await watermelonDBService.getPhotosByEstimate(estimateId);
  }

  /**
   * Create object URL for photo blob
   */
  public createPhotoURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke object URL
   */
  public revokePhotoURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Compress image blob
   */
  public async compressImage(
    blob: Blob,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (!this.canvas || !this.context) {
          reject(new Error('Canvas not available'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas size and draw image
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.drawImage(img, 0, 0, width, height);

        // Convert to blob
        this.canvas.toBlob(
          compressedBlob => {
            if (compressedBlob) {
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Validate photo requirements for window
   */
  public async validatePhotoRequirements(
    estimateId: string,
    windowIndex: number
  ): Promise<{
    hasPhoto: boolean;
    photoCount: number;
    isRequired: boolean;
  }> {
    const photos = await this.getPhotosForEstimate(estimateId);
    const windowPhotos = photos.filter(
      photo => photo.windowIndex === windowIndex
    );

    return {
      hasPhoto: windowPhotos.length > 0,
      photoCount: windowPhotos.length,
      isRequired: true, // As per MVP requirements, photos are required
    };
  }

  /**
   * Get missing photo report
   */
  public async getMissingPhotoReport(
    estimateId: string,
    windowCount: number
  ): Promise<{
    missingPhotos: number[];
    totalMissing: number;
    completionRate: number;
  }> {
    const photos = await this.getPhotosForEstimate(estimateId);
    const windowsWithPhotos = new Set(photos.map(photo => photo.windowIndex));

    const missingPhotos: number[] = [];
    for (let i = 0; i < windowCount; i++) {
      if (!windowsWithPhotos.has(i)) {
        missingPhotos.push(i);
      }
    }

    return {
      missingPhotos,
      totalMissing: missingPhotos.length,
      completionRate:
        ((windowCount - missingPhotos.length) / windowCount) * 100,
    };
  }
}

// Export singleton instance
export const cameraService = new CameraService();

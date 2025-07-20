import { useState, useRef, useEffect } from 'react';
import { cameraService, CameraCapabilities } from '../Services/CameraService';

interface PhotoCaptureProps {
  estimateId: string;
  windowIndex: number;
  onPhotoCapture: (photoId: string, photoUrl: string) => void;
  onClose: () => void;
  className?: string;
}

export default function PhotoCapture({
  estimateId,
  windowIndex,
  onPhotoCapture,
  onClose,
  className = ''
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, []);

  // Update video stream when facingMode changes
  useEffect(() => {
    if (capabilities?.hasCamera) {
      startCamera();
    }
  }, [facingMode]);

  const initializeCamera = async () => {
    try {
      const caps = await cameraService.getCameraCapabilities();
      setCapabilities(caps);

      if (!caps.hasCamera) {
        setError('No camera available on this device');
        return;
      }

      await startCamera();
    } catch (err) {
      console.error('Error initializing camera:', err);
      setError('Failed to initialize camera');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const newStream = await cameraService.startCamera(facingMode);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please check permissions.');
    }
  };

  const cleanup = async () => {
    await cameraService.stopCamera();
    setStream(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) {
      setError('Camera not ready');
      return;
    }

    setIsCapturing(true);
    try {
      const blob = await cameraService.capturePhoto(videoRef.current, {
        quality: 0.8,
        format: 'jpeg',
        maxWidth: 1920,
        maxHeight: 1080
      });

      const photoId = await cameraService.savePhoto(
        estimateId,
        windowIndex,
        blob,
        `window-${windowIndex + 1}-${Date.now()}.jpg`
      );

      const photoUrl = cameraService.createPhotoURL(blob);
      onPhotoCapture(photoId, photoUrl);
      onClose();
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const switchCamera = () => {
    if (capabilities?.hasMultipleCameras) {
      setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    }
  };

  if (!capabilities) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing camera...</p>
        </div>
      </div>
    );
  }

  if (!capabilities.hasCamera) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Camera Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            This device doesn't have a camera or camera access is not available.
          </p>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Capture Photo - Window {windowIndex + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative bg-black">
        {error ? (
          <div className="flex items-center justify-center h-64 bg-gray-100">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-2 text-sm text-red-600">{error}</p>
              <button
                onClick={startCamera}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
        )}

        {/* Camera Controls Overlay */}
        {!error && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4">
            {/* Switch Camera Button */}
            {capabilities.hasMultipleCameras && (
              <button
                onClick={switchCamera}
                className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                title="Switch Camera"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            )}

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              disabled={isCapturing || !stream}
              className="p-4 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Capture Photo"
            >
              {isCapturing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          Position the window in the frame and tap the capture button to take a photo.
          {capabilities.hasMultipleCameras && ' Use the switch button to change cameras.'}
        </p>
      </div>
    </div>
  );
}

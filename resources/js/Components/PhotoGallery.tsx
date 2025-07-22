import { useState, useEffect } from 'react';
import { cameraService } from '../Services/CameraService';
import { PhotoRecord } from '../Services/IndexedDBService';

interface PhotoGalleryProps {
  estimateId: string;
  windowIndex?: number;
  onPhotoDelete?: (photoId: string) => void;
  className?: string;
  showWindowLabels?: boolean;
}

export default function PhotoGallery({
  estimateId,
  windowIndex,
  onPhotoDelete,
  className = '',
  showWindowLabels = false,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);

  useEffect(() => {
    loadPhotos();
    return () => {
      // Cleanup object URLs
      photoUrls.forEach(url => {
        cameraService.revokePhotoURL(url);
      });
    };
  }, [estimateId, windowIndex]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const allPhotos = await cameraService.getPhotosForEstimate(estimateId);

      // Filter by window index if specified
      const filteredPhotos =
        windowIndex !== undefined
          ? allPhotos.filter(photo => photo.windowIndex === windowIndex)
          : allPhotos;

      setPhotos(filteredPhotos);

      // Create object URLs for photos
      const urlMap = new Map<string, string>();
      filteredPhotos.forEach(photo => {
        const url = cameraService.createPhotoURL(photo.blob);
        urlMap.set(photo.id, url);
      });
      setPhotoUrls(urlMap);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        // Remove from IndexedDB (would need to implement delete method)
        // For now, just remove from local state
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));

        // Cleanup object URL
        const url = photoUrls.get(photoId);
        if (url) {
          cameraService.revokePhotoURL(url);
          setPhotoUrls(prev => {
            const newMap = new Map(prev);
            newMap.delete(photoId);
            return newMap;
          });
        }

        if (onPhotoDelete) {
          onPhotoDelete(photoId);
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading photos...</span>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`${className}`}>
        <div className='text-center py-8'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No photos</h3>
          <p className='mt-1 text-sm text-gray-500'>
            {windowIndex !== undefined
              ? `No photos captured for Window ${windowIndex + 1} yet.`
              : 'No photos captured for this estimate yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Photo Grid */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {photos.map(photo => {
          const photoUrl = photoUrls.get(photo.id);
          return (
            <div key={photo.id} className='relative group'>
              <div className='aspect-square bg-gray-200 rounded-lg overflow-hidden'>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Window ${photo.windowIndex + 1} photo`}
                    className='w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity'
                    onClick={() => setSelectedPhoto(photo)}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <svg
                      className='h-8 w-8 text-gray-400'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Photo Info Overlay */}
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-end'>
                <div className='p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full'>
                  {showWindowLabels && (
                    <p className='text-xs font-medium'>
                      Window {photo.windowIndex + 1}
                    </p>
                  )}
                  <p className='text-xs'>
                    {formatFileSize(photo.metadata.size)}
                  </p>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handlePhotoDelete(photo.id)}
                className='absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700'
                title='Delete photo'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>

              {/* Sync Status */}
              {!photo.synced && (
                <div
                  className='absolute top-2 left-2 p-1 bg-yellow-500 text-white rounded-full'
                  title='Not synced'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl max-h-full overflow-auto'>
            <div className='p-4 border-b border-gray-200 flex justify-between items-center'>
              <div>
                <h3 className='text-lg font-medium'>
                  Window {selectedPhoto.windowIndex + 1} Photo
                </h3>
                <p className='text-sm text-gray-500'>
                  {formatDate(selectedPhoto.timestamp)} •{' '}
                  {formatFileSize(selectedPhoto.metadata.size)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='p-4'>
              {photoUrls.get(selectedPhoto.id) && (
                <img
                  src={photoUrls.get(selectedPhoto.id)}
                  alt={`Window ${selectedPhoto.windowIndex + 1} photo`}
                  className='max-w-full max-h-96 mx-auto'
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

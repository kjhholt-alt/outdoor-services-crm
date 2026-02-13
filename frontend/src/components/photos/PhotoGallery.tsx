import { useState } from 'react';
import { Camera } from 'lucide-react';
import { usePhotos } from '../../hooks/usePhotos';
import { PhotoViewer } from './PhotoViewer';
import type { Photo } from '../../types/photos';

interface PhotoGalleryProps {
  jobId: number;
  customerId: number;
}

export function PhotoGallery({ jobId }: PhotoGalleryProps) {
  const { photos, deletePhoto, isLoading } = usePhotos(jobId);
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-4 text-gray-400">
        Loading photos...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No photos yet</p>
      </div>
    );
  }

  const beforePhotos = photos.filter(p => p.type === 'before');
  const afterPhotos = photos.filter(p => p.type === 'after');

  // Side-by-side comparison if both exist
  const hasComparison = beforePhotos.length > 0 && afterPhotos.length > 0;

  return (
    <>
      <div className="mt-4 space-y-4">
        {hasComparison && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
              Before / After
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <PhotoThumbnail
                photo={beforePhotos[0]}
                onClick={() => setViewerPhoto(beforePhotos[0])}
              />
              <PhotoThumbnail
                photo={afterPhotos[0]}
                onClick={() => setViewerPhoto(afterPhotos[0])}
              />
            </div>
          </div>
        )}

        {beforePhotos.length > (hasComparison ? 1 : 0) && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
              Before
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {beforePhotos.slice(hasComparison ? 1 : 0).map(photo => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onClick={() => setViewerPhoto(photo)}
                />
              ))}
            </div>
          </div>
        )}

        {afterPhotos.length > (hasComparison ? 1 : 0) && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
              After
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {afterPhotos.slice(hasComparison ? 1 : 0).map(photo => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onClick={() => setViewerPhoto(photo)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <PhotoViewer
        photo={viewerPhoto}
        isOpen={viewerPhoto !== null}
        onClose={() => setViewerPhoto(null)}
        onDelete={deletePhoto}
      />
    </>
  );
}

function PhotoThumbnail({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
    >
      <img
        src={photo.dataUrl}
        alt={`${photo.type} photo`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
              photo.type === 'before'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {photo.type}
          </span>
          <span className="text-[10px] text-white/80">
            {new Date(photo.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </button>
  );
}

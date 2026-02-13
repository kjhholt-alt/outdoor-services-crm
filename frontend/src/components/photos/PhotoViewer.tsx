import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Photo } from '../../types/photos';

interface PhotoViewerProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function PhotoViewer({ photo, isOpen, onClose, onDelete }: PhotoViewerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !photo) return null;

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.(photo.id);
      setConfirmDelete(false);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ touchAction: 'pinch-zoom' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 bg-black/80">
        <button
          onClick={handleClose}
          className="p-2 text-white hover:bg-white/20 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            photo.type === 'before'
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {photo.type === 'before' ? 'Before' : 'After'}
        </span>
        {onDelete && (
          <button
            onClick={handleDelete}
            className={`p-2 rounded-lg ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
        {!onDelete && <div className="w-10" />}
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={photo.dataUrl}
          alt={`${photo.type} photo`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Bottom bar */}
      <div className="p-3 bg-black/80 text-white text-sm space-y-1">
        <p>{new Date(photo.timestamp).toLocaleString()}</p>
        {photo.latitude != null && photo.longitude != null && (
          <p className="text-gray-400">
            GPS: {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
          </p>
        )}
        {photo.notes && <p className="text-gray-300">{photo.notes}</p>}
        {confirmDelete && (
          <p className="text-red-400 font-medium">Tap delete again to confirm</p>
        )}
      </div>
    </div>
  );
}

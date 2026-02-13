import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { usePhotos } from '../../hooks/usePhotos';
import type { Photo } from '../../types/photos';

interface PhotoCaptureProps {
  jobId: number;
  customerId: number;
  onCapture?: (photo: Photo) => void;
}

export function PhotoCapture({ jobId, customerId, onCapture }: PhotoCaptureProps) {
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addPhoto } = usePhotos(jobId);

  const handleCapture = async (type: 'before' | 'after', file: File) => {
    setIsProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);

      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // GPS is optional
      }

      const photoData: Omit<Photo, 'id'> = {
        jobId,
        customerId,
        type,
        dataUrl,
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
      };

      await addPhoto(photoData);

      if (onCapture) {
        onCapture({ ...photoData, id: '' });
      }
    } catch (err) {
      console.error('Failed to capture photo:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = (type: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCapture(type, file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex gap-3">
      <input
        ref={beforeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange('before')}
      />
      <input
        ref={afterInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange('after')}
      />

      <button
        onClick={() => beforeInputRef.current?.click()}
        disabled={isProcessing}
        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-lg border-2 border-green-600 text-green-600 dark:text-green-400 dark:border-green-400 font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        Before Photo
      </button>

      <button
        onClick={() => afterInputRef.current?.click()}
        disabled={isProcessing}
        className="flex-1 flex items-center justify-center gap-2 h-14 rounded-lg border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        After Photo
      </button>
    </div>
  );
}

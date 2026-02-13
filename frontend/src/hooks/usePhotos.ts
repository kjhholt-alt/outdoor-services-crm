import { useState, useEffect, useCallback } from 'react';
import type { Photo } from '../types/photos';
import { photoStore } from '../lib/indexeddb';

export function usePhotos(jobId: number) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await photoStore.getByJob(jobId);
      setPhotos(result);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const addPhoto = useCallback(async (photo: Omit<Photo, 'id'>) => {
    const id = crypto.randomUUID();
    const newPhoto: Photo = { ...photo, id };
    await photoStore.save(newPhoto);
    await loadPhotos();
  }, [loadPhotos]);

  const deletePhoto = useCallback(async (id: string) => {
    await photoStore.delete(id);
    await loadPhotos();
  }, [loadPhotos]);

  return { photos, addPhoto, deletePhoto, isLoading };
}

import { useState, useEffect, useCallback } from 'react';
import { FirestoreService, FirestoreDocument } from '../firebase/firestore';

export function useFirestore<T extends FirestoreDocument>(
  service: FirestoreService<T>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.getAll();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Créer un document
  const create = useCallback(async (document: Omit<T, 'id'>) => {
    try {
      setError(null);
      const id = await service.create(document);
      await loadData(); // Recharger les données
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    }
  }, [service, loadData]);

  // Mettre à jour un document
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      setError(null);
      await service.update(id, updates);
      await loadData(); // Recharger les données
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  }, [service, loadData]);

  // Supprimer un document
  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      await service.delete(id);
      await loadData(); // Recharger les données
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  }, [service, loadData]);

  // Écouter les changements en temps réel
  useEffect(() => {
    const unsubscribe = service.subscribeToChanges((documents) => {
      setData(documents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [service]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    refresh: loadData
  };
}

// Hook pour un document spécifique
export function useFirestoreDocument<T extends FirestoreDocument>(
  service: FirestoreService<T>,
  id: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le document
  const loadDocument = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await service.getById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [service, id]);

  // Mettre à jour le document
  const update = useCallback(async (updates: Partial<T>) => {
    if (!id) return;

    try {
      setError(null);
      await service.update(id, updates);
      await loadDocument(); // Recharger le document
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  }, [service, id, loadDocument]);

  // Supprimer le document
  const remove = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      await service.delete(id);
      setData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  }, [service, id]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = service.subscribeToDocument(id, (document) => {
      setData(document);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [service, id]);

  return {
    data,
    loading,
    error,
    update,
    remove,
    refresh: loadDocument
  };
} 
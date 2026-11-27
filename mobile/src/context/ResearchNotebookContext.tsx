import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SourceCategory = 'phonetics' | 'letter-semantics' | 'morphology' | 'other';

export type HeritageSource = {
  id: string;
  author: string;
  book: string;
  edition: string;
  location: string;
  category: SourceCategory;
  excerpt: string;
  interpretation: string;
  computationalHypothesis: string;
  createdAt: string;
};

export type ComparisonExperiment = {
  id: string;
  question: string;
  leftForm: string;
  leftRoot: string;
  leftPattern: string;
  rightForm: string;
  rightRoot: string;
  rightPattern: string;
  rootSimilarity: number;
  patternSimilarity: number;
  boundSimilarity: number;
  poincareDistance: number;
  notes: string;
  heritageSourceId?: string;
  heritageSourceLabel?: string;
  createdAt: string;
};

type StoredNotebook = {
  sources: HeritageSource[];
  experiments: ComparisonExperiment[];
};

type NewHeritageSource = Omit<HeritageSource, 'id' | 'createdAt'>;
type NewComparisonExperiment = Omit<ComparisonExperiment, 'id' | 'createdAt'>;

type NotebookContextValue = StoredNotebook & {
  ready: boolean;
  storageError: boolean;
  addSource: (source: NewHeritageSource) => void;
  addExperiment: (experiment: NewComparisonExperiment) => void;
  deleteSource: (id: string) => void;
  deleteExperiment: (id: string) => void;
};

const STORAGE_KEY = '@miyaar/research-notebook/v1';
const ResearchNotebookContext = createContext<NotebookContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function isStoredNotebook(value: unknown): value is StoredNotebook {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredNotebook>;
  return Array.isArray(candidate.sources) && Array.isArray(candidate.experiments);
}

export function ResearchNotebookProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<HeritageSource[]>([]);
  const [experiments, setExperiments] = useState<ComparisonExperiment[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted || !value) return;
        const parsed: unknown = JSON.parse(value);
        if (isStoredNotebook(parsed)) {
          setSources(parsed.sources);
          setExperiments(parsed.experiments);
        } else {
          setStorageError(true);
        }
      })
      .catch(() => {
        if (mounted) setStorageError(true);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sources, experiments }))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [experiments, ready, sources]);

  const addSource = useCallback((source: NewHeritageSource) => {
    setSources((current) => [{ ...source, id: createId(), createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const addExperiment = useCallback((experiment: NewComparisonExperiment) => {
    setExperiments((current) => [{ ...experiment, id: createId(), createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
  }, []);

  const deleteExperiment = useCallback((id: string) => {
    setExperiments((current) => current.filter((experiment) => experiment.id !== id));
  }, []);

  const value = useMemo(
    () => ({ ready, storageError, sources, experiments, addSource, addExperiment, deleteSource, deleteExperiment }),
    [ready, storageError, sources, experiments, addSource, addExperiment, deleteSource, deleteExperiment],
  );

  return <ResearchNotebookContext.Provider value={value}>{children}</ResearchNotebookContext.Provider>;
}

export function useResearchNotebook(): NotebookContextValue {
  const context = useContext(ResearchNotebookContext);
  if (!context) throw new Error('useResearchNotebook must be used inside ResearchNotebookProvider');
  return context;
}

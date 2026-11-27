import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SourceCategory = 'phonetics' | 'letter-semantics' | 'morphology' | 'other';
export type TrainingSplit = 'train' | 'test';

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

export type MorphologyTrainingExample = {
  id: string;
  form: string;
  root: string;
  pattern: string;
  split: TrainingSplit;
  heritageSourceId?: string;
  heritageSourceLabel?: string;
  createdAt: string;
};

type StoredNotebook = {
  sources: HeritageSource[];
  experiments: ComparisonExperiment[];
  trainingExamples: MorphologyTrainingExample[];
  modelTrainedAt: string | null;
};

type NewHeritageSource = Omit<HeritageSource, 'id' | 'createdAt'>;
type NewComparisonExperiment = Omit<ComparisonExperiment, 'id' | 'createdAt'>;
type NewTrainingExample = Omit<MorphologyTrainingExample, 'id' | 'createdAt'>;

type NotebookContextValue = StoredNotebook & {
  ready: boolean;
  storageError: boolean;
  addSource: (source: NewHeritageSource) => void;
  addExperiment: (experiment: NewComparisonExperiment) => void;
  addTrainingExamples: (examples: NewTrainingExample[]) => void;
  deleteSource: (id: string) => void;
  deleteExperiment: (id: string) => void;
  deleteTrainingExample: (id: string) => void;
  updateTrainingExampleSplit: (id: string, split: TrainingSplit) => void;
  markModelTrained: (trainedAt: string) => void;
};

const STORAGE_KEY = '@miyaar/research-notebook/v1';
const ResearchNotebookContext = createContext<NotebookContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeStoredNotebook(value: unknown): StoredNotebook | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredNotebook>;
  if (!Array.isArray(candidate.sources) || !Array.isArray(candidate.experiments)) return null;
  return {
    sources: candidate.sources,
    experiments: candidate.experiments,
    trainingExamples: Array.isArray(candidate.trainingExamples) ? candidate.trainingExamples : [],
    modelTrainedAt: typeof candidate.modelTrainedAt === 'string' ? candidate.modelTrainedAt : null,
  };
}

export function ResearchNotebookProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<HeritageSource[]>([]);
  const [experiments, setExperiments] = useState<ComparisonExperiment[]>([]);
  const [trainingExamples, setTrainingExamples] = useState<MorphologyTrainingExample[]>([]);
  const [modelTrainedAt, setModelTrainedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted || !value) return;
        const stored = normalizeStoredNotebook(JSON.parse(value) as unknown);
        if (stored) {
          setSources(stored.sources);
          setExperiments(stored.experiments);
          setTrainingExamples(stored.trainingExamples);
          setModelTrainedAt(stored.modelTrainedAt);
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sources, experiments, trainingExamples, modelTrainedAt }))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [experiments, modelTrainedAt, ready, sources, trainingExamples]);

  const addSource = useCallback((source: NewHeritageSource) => {
    setSources((current) => [{ ...source, id: createId(), createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const addExperiment = useCallback((experiment: NewComparisonExperiment) => {
    setExperiments((current) => [{ ...experiment, id: createId(), createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const addTrainingExamples = useCallback((examples: NewTrainingExample[]) => {
    if (examples.length === 0) return;
    const createdAt = new Date().toISOString();
    setTrainingExamples((current) => [
      ...examples.map((example) => ({ ...example, id: createId(), createdAt })),
      ...current,
    ]);
    setModelTrainedAt(null);
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
  }, []);

  const deleteExperiment = useCallback((id: string) => {
    setExperiments((current) => current.filter((experiment) => experiment.id !== id));
  }, []);

  const deleteTrainingExample = useCallback((id: string) => {
    setTrainingExamples((current) => current.filter((example) => example.id !== id));
    setModelTrainedAt(null);
  }, []);

  const updateTrainingExampleSplit = useCallback((id: string, split: TrainingSplit) => {
    setTrainingExamples((current) => current.map((example) => example.id === id ? { ...example, split } : example));
    setModelTrainedAt(null);
  }, []);

  const markModelTrained = useCallback((trainedAt: string) => {
    setModelTrainedAt(trainedAt);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      storageError,
      sources,
      experiments,
      trainingExamples,
      modelTrainedAt,
      addSource,
      addExperiment,
      addTrainingExamples,
      deleteSource,
      deleteExperiment,
      deleteTrainingExample,
      updateTrainingExampleSplit,
      markModelTrained,
    }),
    [
      ready,
      storageError,
      sources,
      experiments,
      trainingExamples,
      modelTrainedAt,
      addSource,
      addExperiment,
      addTrainingExamples,
      deleteSource,
      deleteExperiment,
      deleteTrainingExample,
      updateTrainingExampleSplit,
      markModelTrained,
    ],
  );

  return <ResearchNotebookContext.Provider value={value}>{children}</ResearchNotebookContext.Provider>;
}

export function useResearchNotebook(): NotebookContextValue {
  const context = useContext(ResearchNotebookContext);
  if (!context) throw new Error('useResearchNotebook must be used inside ResearchNotebookProvider');
  return context;
}

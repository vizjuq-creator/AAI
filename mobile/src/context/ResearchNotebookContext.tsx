import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  GeneratedMeaningCandidate,
  LetterMeaningHypothesis,
  LetterMeaningScope,
} from '../core/heritageGenerator';

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

export type HeritageModelTraining = {
  sourceId: string;
  scope: LetterMeaningScope;
  signature: string;
  hypothesisIds: string[];
  trainedAt: string;
};

export type SavedHeritageGeneration = {
  id: string;
  source: Pick<HeritageSource, 'id' | 'author' | 'book' | 'edition' | 'location' | 'excerpt'>;
  scope: LetterMeaningScope;
  input: string;
  letters: string[];
  modelSignature: string;
  hypothesisSnapshot: Array<Pick<LetterMeaningHypothesis, 'id' | 'letter' | 'position' | 'researcherInterpretation' | 'semanticMotifs'>>;
  candidates: GeneratedMeaningCandidate[];
  createdAt: string;
};

type StoredNotebook = {
  sources: HeritageSource[];
  experiments: ComparisonExperiment[];
  trainingExamples: MorphologyTrainingExample[];
  modelTrainedAt: string | null;
  letterHypotheses: LetterMeaningHypothesis[];
  heritageGenerations: SavedHeritageGeneration[];
  heritageModelTraining: HeritageModelTraining | null;
};

type NewHeritageSource = Omit<HeritageSource, 'id' | 'createdAt'>;
type NewComparisonExperiment = Omit<ComparisonExperiment, 'id' | 'createdAt'>;
type NewTrainingExample = Omit<MorphologyTrainingExample, 'id' | 'createdAt'>;
type NewLetterHypothesis = Omit<LetterMeaningHypothesis, 'id' | 'createdAt'>;
type NewHeritageGeneration = Omit<SavedHeritageGeneration, 'id' | 'createdAt'>;

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
  addLetterHypothesis: (hypothesis: NewLetterHypothesis) => void;
  deleteLetterHypothesis: (id: string) => void;
  setLetterHypothesisModelReady: (id: string, modelReady: boolean) => void;
  addHeritageGeneration: (generation: NewHeritageGeneration) => void;
  deleteHeritageGeneration: (id: string) => void;
  markModelTrained: (trainedAt: string) => void;
  markHeritageModelTrained: (training: HeritageModelTraining) => void;
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
    letterHypotheses: Array.isArray(candidate.letterHypotheses) ? candidate.letterHypotheses : [],
    heritageGenerations: Array.isArray(candidate.heritageGenerations) ? candidate.heritageGenerations : [],
    heritageModelTraining: candidate.heritageModelTraining && typeof candidate.heritageModelTraining === 'object'
      ? candidate.heritageModelTraining
      : null,
  };
}

export function ResearchNotebookProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<HeritageSource[]>([]);
  const [experiments, setExperiments] = useState<ComparisonExperiment[]>([]);
  const [trainingExamples, setTrainingExamples] = useState<MorphologyTrainingExample[]>([]);
  const [modelTrainedAt, setModelTrainedAt] = useState<string | null>(null);
  const [letterHypotheses, setLetterHypotheses] = useState<LetterMeaningHypothesis[]>([]);
  const [heritageGenerations, setHeritageGenerations] = useState<SavedHeritageGeneration[]>([]);
  const [heritageModelTraining, setHeritageModelTraining] = useState<HeritageModelTraining | null>(null);
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
          setLetterHypotheses(stored.letterHypotheses);
          setHeritageGenerations(stored.heritageGenerations);
          setHeritageModelTraining(stored.heritageModelTraining);
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      sources,
      experiments,
      trainingExamples,
      modelTrainedAt,
      letterHypotheses,
      heritageGenerations,
      heritageModelTraining,
    }))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [experiments, heritageGenerations, heritageModelTraining, letterHypotheses, modelTrainedAt, ready, sources, trainingExamples]);

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

  const addLetterHypothesis = useCallback((hypothesis: NewLetterHypothesis) => {
    setLetterHypotheses((current) => [{ ...hypothesis, id: createId(), createdAt: new Date().toISOString() }, ...current]);
    setHeritageModelTraining(null);
  }, []);

  const addHeritageGeneration = useCallback((generation: NewHeritageGeneration) => {
    setHeritageGenerations((current) => [{ ...generation, id: createId(), createdAt: new Date().toISOString() }, ...current]);
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
    setLetterHypotheses((current) => current.filter((hypothesis) => hypothesis.sourceId !== id));
    setHeritageModelTraining((current) => current?.sourceId === id ? null : current);
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

  const deleteLetterHypothesis = useCallback((id: string) => {
    setLetterHypotheses((current) => current.filter((hypothesis) => hypothesis.id !== id));
    setHeritageModelTraining(null);
  }, []);

  const setLetterHypothesisModelReady = useCallback((id: string, modelReady: boolean) => {
    setLetterHypotheses((current) => current.map((hypothesis) => hypothesis.id === id ? { ...hypothesis, modelReady } : hypothesis));
    setHeritageModelTraining(null);
  }, []);

  const deleteHeritageGeneration = useCallback((id: string) => {
    setHeritageGenerations((current) => current.filter((generation) => generation.id !== id));
  }, []);

  const markModelTrained = useCallback((trainedAt: string) => {
    setModelTrainedAt(trainedAt);
  }, []);

  const markHeritageModelTrained = useCallback((training: HeritageModelTraining) => {
    setHeritageModelTraining(training);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      storageError,
      sources,
      experiments,
      trainingExamples,
      modelTrainedAt,
      letterHypotheses,
      heritageGenerations,
      heritageModelTraining,
      addSource,
      addExperiment,
      addTrainingExamples,
      deleteSource,
      deleteExperiment,
      deleteTrainingExample,
      updateTrainingExampleSplit,
      addLetterHypothesis,
      deleteLetterHypothesis,
      setLetterHypothesisModelReady,
      addHeritageGeneration,
      deleteHeritageGeneration,
      markModelTrained,
      markHeritageModelTrained,
    }),
    [
      ready,
      storageError,
      sources,
      experiments,
      trainingExamples,
      modelTrainedAt,
      letterHypotheses,
      heritageGenerations,
      heritageModelTraining,
      addSource,
      addExperiment,
      addTrainingExamples,
      deleteSource,
      deleteExperiment,
      deleteTrainingExample,
      updateTrainingExampleSplit,
      addLetterHypothesis,
      deleteLetterHypothesis,
      setLetterHypothesisModelReady,
      addHeritageGeneration,
      deleteHeritageGeneration,
      markModelTrained,
      markHeritageModelTrained,
    ],
  );

  return <ResearchNotebookContext.Provider value={value}>{children}</ResearchNotebookContext.Provider>;
}

export function useResearchNotebook(): NotebookContextValue {
  const context = useContext(ResearchNotebookContext);
  if (!context) throw new Error('useResearchNotebook must be used inside ResearchNotebookProvider');
  return context;
}

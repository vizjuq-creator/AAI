import React, { createContext, useContext, useMemo, useState } from 'react';
import { analyzeText, type TextAnalysis } from '../core/arabicLab';

const SAMPLE_TEXT = 'كَتَبَ، كِتَاب، مَكْتَبَة، مَكْتُوب';

type LabContextValue = {
  text: string;
  setText: (value: string) => void;
  analysis: TextAnalysis;
  runAnalysis: () => void;
};

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [analysis, setAnalysis] = useState(() => analyzeText(SAMPLE_TEXT));

  const value = useMemo(
    () => ({
      text,
      setText,
      analysis,
      runAnalysis: () => setAnalysis(analyzeText(text)),
    }),
    [text, analysis],
  );

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab(): LabContextValue {
  const context = useContext(LabContext);
  if (!context) throw new Error('useLab must be used inside LabProvider');
  return context;
}

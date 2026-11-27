import { extractArabicLetterSequence } from './arabicLab.ts';

export type LetterMeaningScope = 'independent-letter' | 'root-context';
export type LetterPosition = 'any' | 'initial' | 'medial' | 'final';

/** A researcher-authored computational entry linked to a separately stored primary-source quotation. */
export type LetterMeaningHypothesis = {
  id: string;
  sourceId: string;
  letter: string;
  scope: LetterMeaningScope;
  position: LetterPosition;
  researcherInterpretation: string;
  semanticMotifs: string[];
  modelReady: boolean;
  createdAt: string;
};

export type HeritageMotifOption = {
  motif: string;
  support: number;
  probability: number;
  hypothesisIds: string[];
};

export type HeritageMeaningModel = {
  sourceId: string;
  scope: LetterMeaningScope;
  hypothesisCount: number;
  motifCount: number;
  hypothesisIds: string[];
  byLetter: Array<{
    letter: string;
    positions: Array<{
      position: LetterPosition;
      totalMotifs: number;
      options: HeritageMotifOption[];
    }>;
  }>;
};

export type GeneratedMeaningComponent = {
  position: number;
  positionType: LetterPosition;
  letter: string;
  motif: string;
  support: number;
  probability: number;
  hypothesisIds: string[];
};

export type GeneratedMeaningCandidate = {
  text: string;
  /** Product of source-specific empirical motif frequencies; not a probability that the interpretation is true. */
  modelScore: number;
  components: GeneratedMeaningComponent[];
};

export type HeritageGenerationResult = {
  input: string;
  letters: string[];
  missing: Array<{ letter: string; position: LetterPosition }>;
  candidates: GeneratedMeaningCandidate[];
};

const POSITION_ORDER: Record<LetterPosition, number> = {
  any: 0,
  initial: 1,
  medial: 2,
  final: 3,
};

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isLetterPosition(value: string): value is LetterPosition {
  return value === 'any' || value === 'initial' || value === 'medial' || value === 'final';
}

function eligibleHypothesis(
  hypothesis: LetterMeaningHypothesis,
  sourceId: string,
  scope: LetterMeaningScope,
): boolean {
  return hypothesis.modelReady
    && hypothesis.sourceId === sourceId
    && hypothesis.scope === scope
    && hypothesis.researcherInterpretation.trim().length > 0
    && isLetterPosition(hypothesis.position)
    && (scope !== 'independent-letter' || hypothesis.position === 'any');
}

function normalizedHypothesisData(hypothesis: LetterMeaningHypothesis) {
  const letters = extractArabicLetterSequence(hypothesis.letter);
  const motifs = Array.from(new Set((Array.isArray(hypothesis.semanticMotifs) ? hypothesis.semanticMotifs : [])
    .map((motif) => motif.trim())
    .filter(Boolean)));
  return letters.length === 1 && motifs.length > 0
    ? { letter: letters[0] as string, position: hypothesis.position, motifs }
    : null;
}

/** Stable signature for checking whether a stored training run still matches its source-grounded inputs. */
export function heritageModelSignature(
  hypotheses: LetterMeaningHypothesis[],
  sourceId: string,
  scope: LetterMeaningScope,
): string {
  const rows = hypotheses
    .filter((hypothesis) => eligibleHypothesis(hypothesis, sourceId, scope))
    .map((hypothesis) => {
      const normalized = normalizedHypothesisData(hypothesis);
      return normalized
        ? [hypothesis.id, normalized.letter, normalized.position, normalized.motifs, hypothesis.researcherInterpretation.trim()]
        : null;
    })
    .filter((row): row is [string, string, LetterPosition, string[], string] => row !== null)
    .sort((left, right) => compareText(left[0], right[0]));
  return JSON.stringify([sourceId, scope, rows]);
}

/**
 * Compile only explicitly approved, source-linked hypotheses into a source-specific categorical model.
 * Different sources, scopes, and stated letter positions are never pooled.
 */
export function trainHeritageMeaningModel(
  hypotheses: LetterMeaningHypothesis[],
  sourceId: string,
  scope: LetterMeaningScope,
): HeritageMeaningModel | null {
  const counts = new Map<string, Map<LetterPosition, Map<string, { support: number; hypothesisIds: Set<string> }>>>();
  const trainedHypothesisIds = new Set<string>();
  let motifCount = 0;

  for (const hypothesis of hypotheses) {
    if (!eligibleHypothesis(hypothesis, sourceId, scope)) continue;
    const normalized = normalizedHypothesisData(hypothesis);
    if (!normalized) continue;
    trainedHypothesisIds.add(hypothesis.id);

    let positions = counts.get(normalized.letter);
    if (!positions) {
      positions = new Map();
      counts.set(normalized.letter, positions);
    }
    let options = positions.get(normalized.position);
    if (!options) {
      options = new Map();
      positions.set(normalized.position, options);
    }
    for (const motif of normalized.motifs) {
      const option = options.get(motif) ?? { support: 0, hypothesisIds: new Set<string>() };
      option.support += 1;
      option.hypothesisIds.add(hypothesis.id);
      options.set(motif, option);
      motifCount += 1;
    }
  }

  if (trainedHypothesisIds.size === 0) return null;

  const byLetter = Array.from(counts.entries())
    .sort(([left], [right]) => compareText(left, right))
    .map(([letter, positions]) => ({
      letter,
      positions: Array.from(positions.entries())
        .sort(([left], [right]) => POSITION_ORDER[left] - POSITION_ORDER[right])
        .map(([position, options]) => {
          const totalMotifs = Array.from(options.values()).reduce((total, option) => total + option.support, 0);
          const motifOptions = Array.from(options.entries())
            .map(([motif, option]) => ({
              motif,
              support: option.support,
              probability: option.support / totalMotifs,
              hypothesisIds: Array.from(option.hypothesisIds).sort(),
            }))
            .sort((left, right) => right.support - left.support || compareText(left.motif, right.motif));
          return { position, totalMotifs, options: motifOptions };
        }),
    }));

  return {
    sourceId,
    scope,
    hypothesisCount: trainedHypothesisIds.size,
    motifCount,
    hypothesisIds: Array.from(trainedHypothesisIds).sort(),
    byLetter,
  };
}

function requestedPosition(index: number, length: number, scope: LetterMeaningScope): LetterPosition {
  if (scope === 'independent-letter' || length <= 1) return 'any';
  if (index === 0) return 'initial';
  if (index === length - 1) return 'final';
  return 'medial';
}

/** Generate source-conditioned, ordered motif compositions; uncovered letters are never guessed. */
export function generateHeritageInterpretations(
  model: HeritageMeaningModel,
  input: string,
  maxCandidates = 12,
): HeritageGenerationResult {
  const letters = extractArabicLetterSequence(input);
  const available = new Map(model.byLetter.map((entry) => [
    entry.letter,
    new Map(entry.positions.map((position) => [position.position, position.options])),
  ]));
  const resolved = letters.map((letter, index) => {
    const byPosition = available.get(letter);
    const requested = requestedPosition(index, letters.length, model.scope);
    const exactOptions = byPosition?.get(requested);
    const generalOptions = requested === 'any' ? undefined : byPosition?.get('any');
    const options = exactOptions?.length ? exactOptions : generalOptions;
    if (!options?.length) return { available: false as const, letter, requested, positionType: null, options: [] as HeritageMotifOption[] };
    return { available: true as const, letter, requested, positionType: exactOptions?.length ? requested : 'any', options };
  });
  const missing = Array.from(new Map(resolved
    .filter((entry) => !entry.available)
    .map((entry) => [`${entry.letter}:${entry.requested}`, { letter: entry.letter, position: entry.requested }])).values());

  if (letters.length === 0 || missing.length > 0) {
    return { input, letters, missing, candidates: [] };
  }

  const limit = Number.isFinite(maxCandidates)
    ? Math.max(1, Math.min(64, Math.floor(maxCandidates)))
    : 12;
  let partials: Array<{ components: GeneratedMeaningComponent[]; modelScore: number }> = [
    { components: [], modelScore: 1 },
  ];

  for (const [index, entry] of resolved.entries()) {
    if (!entry.available) continue;
    const expanded = partials.flatMap((partial) => entry.options.map((option) => ({
      modelScore: partial.modelScore * option.probability,
      components: [
        ...partial.components,
        {
          position: index + 1,
          positionType: entry.positionType,
          letter: entry.letter,
          motif: option.motif,
          support: option.support,
          probability: option.probability,
          hypothesisIds: option.hypothesisIds,
        },
      ],
    })));
    expanded.sort((left, right) => right.modelScore - left.modelScore
      || compareText(
        left.components.map((component) => component.motif).join('|'),
        right.components.map((component) => component.motif).join('|'),
      ));
    partials = expanded.slice(0, limit);
  }

  const candidates = partials.map(({ components, modelScore }) => ({
    modelScore,
    text: `تركيب افتراضي بترتيب الحروف: ${components.map((component) => `${component.letter}: «${component.motif}»`).join(' + ')}`,
    components,
  }));

  return { input, letters, missing, candidates };
}

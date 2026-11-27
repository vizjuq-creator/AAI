import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HDC_DIMENSION,
  analyzeText,
  compareHdcRecords,
  comparePoincareForms,
  encodeFeatureSequence,
  evaluateHdcClassifier,
  extractArabicLetterSequence,
  getFeatureBits,
  lookupMorphology,
  normalizeArabic,
  poincareDistance,
  predictHdcClassifier,
  similarityPercent,
  trainHdcClassifier,
} from './arabicLab.ts';
import {
  generateHeritageInterpretations,
  heritageModelSignature,
  trainHeritageMeaningModel,
} from './heritageGenerator.ts';

test('normalization removes tashkeel and folds selected alef variants', () => {
  assert.equal(normalizeArabic('مَكْتَبَةٌ'), 'مكتبة');
  assert.equal(normalizeArabic('إِسْتِخْرَاج'), 'استخراج');
  assert.equal(normalizeArabic('هٰذَا'), 'هذا');
});

test('marked examples resolve, while bare كتب keeps its ambiguity', () => {
  const marked = lookupMorphology('كَتَبَ');
  assert.equal(marked.evidence, 'marked-example');
  assert.equal(marked.candidates[0]?.pattern, 'فَعَلَ');

  const bare = lookupMorphology('كتب');
  assert.equal(bare.evidence, 'bare-example');
  assert.ok(bare.candidates.length > 1);
});

test('phonetic bit table has eight slots and captures clear broad classes', () => {
  const meem = getFeatureBits('م');
  assert.equal(meem.length, 8);
  assert.equal(meem[2], true); // lip
  assert.equal(meem[4], true); // voiced
  assert.equal(meem[7], true); // nasal
  assert.equal(getFeatureBits('س')[5], true); // fricative
  assert.equal(getFeatureBits('ط')[3], true); // emphatic
});

test('text analysis exposes normalized text, marks, letters, and demo candidates', () => {
  const result = analyzeText('كَتَبَ، مَكْتَبَة');
  assert.equal(result.normalizedText, 'كتب، مكتبة');
  assert.equal(result.words.length, 2);
  assert.equal(result.words[0]?.candidates[0]?.root, 'كتب');
  assert.ok(result.diacriticCount > 0);
  assert.ok(result.letters.some((letter) => letter.char === 'ك'));
});

test('HDC uses a 1024-bit deterministic representation and identical roots match exactly', () => {
  const comparison = compareHdcRecords(
    { root: 'كتب', patternCode: 'fi3aal' },
    { root: 'كتب', patternCode: 'maf3ala' },
  );
  assert.equal(HDC_DIMENSION, 1024);
  assert.equal(comparison.dimension, 1024);
  assert.equal(comparison.rootSimilarity, 100);
  assert.equal(comparison.boundBits.length, 64);
  assert.ok(comparison.patternSimilarity >= 0 && comparison.patternSimilarity <= 100);
});

test('HDC distinguishes written Arabic vowel marks while leaving unmarked forms unknown', () => {
  const kataba = encodeFeatureSequence('كَتَبَ');
  const kutub = encodeFeatureSequence('كُتُب');
  const unmarked = encodeFeatureSequence('كتب');

  assert.equal(normalizeArabic('كَتَبَ'), normalizeArabic('كُتُب'));
  assert.equal(similarityPercent(kataba, encodeFeatureSequence('كَتَبَ')), 100);
  assert.ok(similarityPercent(kataba, kutub) < 100);
  assert.ok(similarityPercent(kataba, unmarked) < 100);

  const patternClassifier = trainHdcClassifier([
    { text: 'كَتَبَ', label: 'فَعَلَ' },
    { text: 'كُتُب', label: 'فُعُل' },
  ]);
  assert.equal(predictHdcClassifier(patternClassifier, 'كَتَبَ')?.label, 'فَعَلَ');
  assert.equal(predictHdcClassifier(patternClassifier, 'كُتُب')?.label, 'فُعُل');
});

test('HDC prototype classifier trains from labels and predicts on the same device', () => {
  const training = [
    { text: 'كَتَبَ', label: 'كتب' },
    { text: 'كَتَبَ', label: 'كتب' },
    { text: 'نَهْر', label: 'نهر' },
  ];
  const classifier = trainHdcClassifier(training);
  const prediction = predictHdcClassifier(classifier, 'كَتَبَ');
  const evaluation = evaluateHdcClassifier(classifier, training);

  assert.equal(classifier.dimension, 1024);
  assert.equal(classifier.exampleCount, 3);
  assert.equal(classifier.prototypes.length, 2);
  assert.equal(prediction?.label, 'كتب');
  assert.equal(prediction?.similarity, 100);
  assert.equal(evaluation.total, 3);
  assert.equal(evaluation.accuracyPercent, 100);
});

test('heritage generator trains only approved hypotheses from one source and scope', () => {
  const hypotheses = [
    { id: 'a-k-1', sourceId: 'book-a', letter: 'ك', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['motif-a', 'motif-b'], modelReady: true, createdAt: '' },
    { id: 'a-k-2', sourceId: 'book-a', letter: 'ك', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['motif-a'], modelReady: true, createdAt: '' },
    { id: 'a-t-1', sourceId: 'book-a', letter: 'ت', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['motif-c'], modelReady: true, createdAt: '' },
    { id: 'a-b-1', sourceId: 'book-a', letter: 'ب', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['motif-d'], modelReady: true, createdAt: '' },
    { id: 'b-k-1', sourceId: 'book-b', letter: 'ك', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['foreign-source'], modelReady: true, createdAt: '' },
    { id: 'a-th-1', sourceId: 'book-a', letter: 'ث', scope: 'root-context' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['draft-only'], modelReady: false, createdAt: '' },
    { id: 'a-k-alone', sourceId: 'book-a', letter: 'ك', scope: 'independent-letter' as const, position: 'any' as const, researcherInterpretation: 'fixture', semanticMotifs: ['other-scope'], modelReady: true, createdAt: '' },
  ];

  const model = trainHeritageMeaningModel(hypotheses, 'book-a', 'root-context');
  assert.ok(model);
  assert.equal(model.hypothesisCount, 4);
  assert.equal(model.motifCount, 5);
  assert.deepEqual(model.hypothesisIds, ['a-b-1', 'a-k-1', 'a-k-2', 'a-t-1']);
  assert.equal(model.byLetter.some((entry) => entry.letter === 'ث'), false);
  assert.equal(model.byLetter.find((entry) => entry.letter === 'ك')?.positions.find((position) => position.position === 'any')?.options.find((option) => option.motif === 'motif-a')?.probability, 2 / 3);

  const generated = generateHeritageInterpretations(model, 'كتب');
  assert.deepEqual(generated.letters, ['ك', 'ت', 'ب']);
  assert.equal(generated.candidates.length, 2);
  assert.equal(generated.candidates[0]?.components[0]?.motif, 'motif-a');
  assert.ok((generated.candidates[0]?.modelScore ?? 0) > (generated.candidates[1]?.modelScore ?? 0));
  assert.equal(generated.candidates[0]?.components.length, 3);

  const incomplete = generateHeritageInterpretations(model, 'كتج');
  assert.deepEqual(incomplete.missing, [{ letter: 'ج', position: 'final' }]);
  assert.equal(incomplete.candidates.length, 0);
  assert.equal(trainHeritageMeaningModel(hypotheses, 'missing-book', 'root-context'), null);
  assert.deepEqual(extractArabicLetterSequence('أَبَ'), ['أ', 'ب']);
  assert.ok(heritageModelSignature(hypotheses, 'book-a', 'root-context').includes('a-k-1'));
});

test('heritage generator respects positional hypotheses and uses general rules only as fallback', () => {
  const model = trainHeritageMeaningModel([
    { id: 'k-any', sourceId: 'book', letter: 'ك', scope: 'root-context', position: 'any', researcherInterpretation: 'fixture', semanticMotifs: ['general'], modelReady: true, createdAt: '' },
    { id: 'k-initial', sourceId: 'book', letter: 'ك', scope: 'root-context', position: 'initial', researcherInterpretation: 'fixture', semanticMotifs: ['initial-specific'], modelReady: true, createdAt: '' },
    { id: 'b-any', sourceId: 'book', letter: 'ب', scope: 'root-context', position: 'any', researcherInterpretation: 'fixture', semanticMotifs: ['ba-general'], modelReady: true, createdAt: '' },
  ], 'book', 'root-context');
  assert.ok(model);

  const initial = generateHeritageInterpretations(model, 'كب');
  assert.equal(initial.candidates[0]?.components[0]?.motif, 'initial-specific');
  assert.equal(initial.candidates[0]?.components[0]?.positionType, 'initial');
  assert.equal(initial.candidates[0]?.components[1]?.motif, 'ba-general');
  assert.equal(initial.candidates[0]?.components[1]?.positionType, 'any');
});

test('Poincare distance is finite, symmetric, and zero for an identical point', () => {
  const origin = { x: 0.1, y: -0.2 };
  const other = { x: -0.3, y: 0.25 };
  assert.equal(poincareDistance(origin, origin), 0);
  assert.equal(poincareDistance(origin, other), poincareDistance(other, origin));
  assert.ok(Number.isFinite(comparePoincareForms(
    { root: 'كتب', patternCode: 'fi3aal' },
    { root: 'كتب', patternCode: 'maf3ala' },
  )));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HDC_DIMENSION,
  analyzeText,
  compareHdcRecords,
  comparePoincareForms,
  getFeatureBits,
  lookupMorphology,
  normalizeArabic,
  poincareDistance,
} from './arabicLab.ts';

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

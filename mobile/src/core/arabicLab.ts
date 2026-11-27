export const FEATURE_LABELS = [
  'حلقي',
  'لساني',
  'شفوي',
  'مفخّم',
  'مجهور',
  'احتكاكي',
  'انفجاري/مركّب',
  'أنفي',
] as const;

export const HDC_DIMENSION = 1024;

export type FeatureBits = boolean[];
export type PoincarePoint = { x: number; y: number };

export type MorphCandidate = {
  root: string;
  pattern: string;
  patternCode: string;
  label: string;
  source: string;
};

export type WordAnalysis = {
  raw: string;
  normalized: string;
  candidates: MorphCandidate[];
  evidence: 'marked-example' | 'bare-example' | 'unmatched';
};

export type TextAnalysis = {
  rawText: string;
  normalizedText: string;
  words: WordAnalysis[];
  letters: Array<{ char: string; count: number; bits: FeatureBits }>;
  diacriticCount: number;
  hdcDimension: number;
};

export type MorphSample = {
  id: string;
  form: string;
  bare: string;
  root: string;
  pattern: string;
  patternCode: string;
  note: string;
};

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const LOOKUP_FOLDS: Array<[RegExp, string]> = [
  [/[أإآٱ]/g, 'ا'],
  [/ؤ/g, 'و'],
  [/ئ/g, 'ي'],
  [/ى/g, 'ي'],
];

const FEATURE_GROUPS = [
  'ءهعحغخ',
  'تثجددذرزسشصضطظلنيكق',
  'بمفو',
  'صضطظ',
  'بجدرزضظعغلمنوي',
  'ثحخذهزسشصفهغع',
  'ءبتدطكقج',
  'من',
];

function canonicalPhoneticLetter(letter: string): string {
  if ('أإآٱؤئ'.includes(letter)) return 'ء';
  if (letter === 'ة') return 'ه';
  if (letter === 'ى') return 'ي';
  return letter;
}

export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICS, '').replace(TATWEEL, '');
}

export function normalizeArabic(text: string): string {
  let normalized = stripDiacritics(text);
  for (const [pattern, replacement] of LOOKUP_FOLDS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

function normalizeMarkedForm(text: string): string {
  let normalized = text.replace(TATWEEL, '');
  for (const [pattern, replacement] of LOOKUP_FOLDS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

export function getFeatureBits(letter: string): FeatureBits {
  const canonical = canonicalPhoneticLetter(letter);
  return FEATURE_GROUPS.map((group) => group.includes(canonical));
}

function letterCharacters(text: string): string[] {
  return Array.from(stripDiacritics(text)).filter((character) => /[\u0621-\u064A\u0671\u06CC]/u.test(character));
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s،,؛;؟?!:.()[\]{}"«»“”„'`·…]+/u)
    .map((token) => token.replace(/[^\u0621-\u064A\u0671\u06CC\u064B-\u065F\u0670]/gu, ''))
    .filter((token) => letterCharacters(token).length > 0);
}

export const MORPH_SAMPLES: MorphSample[] = [
  { id: 'kataba', form: 'كَتَبَ', bare: 'كتب', root: 'كتب', pattern: 'فَعَلَ', patternCode: 'fa3ala', note: 'فعل ماضٍ؛ التشكيل هنا يحدّد قراءة المثال.' },
  { id: 'kutub', form: 'كُتُب', bare: 'كتب', root: 'كتب', pattern: 'فُعُل', patternCode: 'fu3ul', note: 'جمع تكسير لكِتاب؛ الرسم غير المشكول يلتبس مع «كَتَبَ».' },
  { id: 'yaktubu', form: 'يَكْتُبُ', bare: 'يكتب', root: 'كتب', pattern: 'يَفْعُلُ', patternCode: 'yaf3ulu', note: 'فعل مضارع؛ تغيّر الحركة قد يغيّر القراءة أو التحليل.' },
  { id: 'kaatib', form: 'كَاتِب', bare: 'كاتب', root: 'كتب', pattern: 'فَاعِل', patternCode: 'faa3il', note: 'اسم فاعل في المثال المضمّن.' },
  { id: 'kitaab', form: 'كِتَاب', bare: 'كتاب', root: 'كتب', pattern: 'فِعَال', patternCode: 'fi3aal', note: 'اسم على وزن فِعال في المثال المضمّن.' },
  { id: 'maktab', form: 'مَكْتَب', bare: 'مكتب', root: 'كتب', pattern: 'مَفْعَل', patternCode: 'maf3al', note: 'اسم مكان/آلة بحسب السياق؛ هذا النموذج لا يحسم المعنى.' },
  { id: 'maktaba', form: 'مَكْتَبَة', bare: 'مكتبة', root: 'كتب', pattern: 'مَفْعَلَة', patternCode: 'maf3ala', note: 'مثال اشتقاقي مضمّن، لا تحليل معجمي عام.' },
  { id: 'maktuub', form: 'مَكْتُوب', bare: 'مكتوب', root: 'كتب', pattern: 'مَفْعُول', patternCode: 'maf3uul', note: 'اسم مفعول في المثال المضمّن.' },
  { id: 'istiktab', form: 'اِسْتِكْتَاب', bare: 'استكتاب', root: 'كتب', pattern: 'اِسْتِفْعَال', patternCode: 'istif3aal', note: 'مصدر على وزن استفعال في المثال المضمّن.' },
  { id: 'nahar', form: 'نَهْر', bare: 'نهر', root: 'نهر', pattern: 'فَعْل', patternCode: 'fa3l', note: 'جذر مختلف لاختبار المقارنة؛ لا يقيس قرب المعنى.' },
  { id: 'qalam', form: 'قَلَم', bare: 'قلم', root: 'قلم', pattern: 'فَعَل', patternCode: 'fa3al', note: 'جذر مختلف لاختبار المقارنة؛ لا يقيس قرب المعنى.' },
];

const SAMPLE_BY_MARKED = new Map<string, MorphSample[]>();
const SAMPLE_BY_BARE = new Map<string, MorphSample[]>();
for (const sample of MORPH_SAMPLES) {
  const marked = normalizeMarkedForm(sample.form);
  const markedList = SAMPLE_BY_MARKED.get(marked) ?? [];
  markedList.push(sample);
  SAMPLE_BY_MARKED.set(marked, markedList);

  const bare = normalizeArabic(sample.bare);
  const bareList = SAMPLE_BY_BARE.get(bare) ?? [];
  bareList.push(sample);
  SAMPLE_BY_BARE.set(bare, bareList);
}

export function lookupMorphology(word: string): WordAnalysis {
  const normalized = normalizeArabic(word);
  const markedKey = normalizeMarkedForm(word);
  const markedMatches = SAMPLE_BY_MARKED.get(markedKey) ?? [];
  const bareMatches = SAMPLE_BY_BARE.get(normalized) ?? [];
  const candidates = markedMatches.length > 0 ? markedMatches : bareMatches;

  return {
    raw: word,
    normalized,
    candidates: candidates.map((sample) => ({
      root: sample.root,
      pattern: sample.pattern,
      patternCode: sample.patternCode,
      label: sample.note,
      source: sample.form,
    })),
    evidence:
      candidates.length === 0
        ? 'unmatched'
        : markedMatches.length > 0
          ? 'marked-example'
          : 'bare-example',
  };
}

export function analyzeText(text: string): TextAnalysis {
  const counts = new Map<string, number>();
  for (const character of letterCharacters(text)) {
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }

  const words = tokenize(text).map(lookupMorphology);
  const diacriticCount = Array.from(text).filter((character) => /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/u.test(character)).length;

  return {
    rawText: text,
    normalizedText: normalizeArabic(text),
    words,
    letters: Array.from(counts.entries()).map(([char, count]) => ({ char, count, bits: getFeatureBits(char) })),
    diacriticCount,
    hdcDimension: HDC_DIMENSION,
  };
}

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    hash ^= codePoint;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const vectorCache = new Map<string, Uint8Array>();

function randomHypervector(seed: string): Uint8Array {
  const cached = vectorCache.get(seed);
  if (cached) return cached;

  let state = hash32(seed) || 0x6d2b79f5;
  const vector = new Uint8Array(HDC_DIMENSION);
  for (let index = 0; index < HDC_DIMENSION; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    vector[index] = state & 1;
  }
  vectorCache.set(seed, vector);
  return vector;
}

function xor(left: Uint8Array, right: Uint8Array): Uint8Array {
  const length = Math.min(left.length, right.length);
  const result = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) result[index] = left[index] ^ right[index];
  return result;
}

function rotate(vector: Uint8Array, shift: number): Uint8Array {
  const length = vector.length;
  const offset = ((shift % length) + length) % length;
  if (offset === 0) return vector;
  const result = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) result[(index + offset) % length] = vector[index];
  return result;
}

function majorityBundle(vectors: Uint8Array[], tieSeed: string): Uint8Array {
  if (vectors.length === 0) return randomHypervector(`empty:${tieSeed}`);
  if (vectors.length === 1) return vectors[0];
  const tieBreaker = randomHypervector(`tie:${tieSeed}`);
  const result = new Uint8Array(HDC_DIMENSION);
  for (let index = 0; index < HDC_DIMENSION; index += 1) {
    let ones = 0;
    for (const vector of vectors) ones += vector[index];
    result[index] = ones * 2 === vectors.length ? tieBreaker[index] : ones * 2 > vectors.length ? 1 : 0;
  }
  return result;
}

function featureHypervector(bits: FeatureBits): Uint8Array {
  const terms = FEATURE_LABELS.map((label, index) => {
    const role = randomHypervector(`feature-role:${label}`);
    const value = randomHypervector(`feature-value:${label}:${bits[index] ? 1 : 0}`);
    return xor(role, value);
  });
  return majorityBundle(terms, `feature-bundle:${bits.map((bit) => (bit ? 1 : 0)).join('')}`);
}

export function encodeFeatureSequence(text: string): Uint8Array {
  const letters = letterCharacters(text);
  if (letters.length === 0) return randomHypervector('empty-arabic-sequence');
  const terms = letters.map((letter, index) => {
    const featureVector = featureHypervector(getFeatureBits(letter));
    return rotate(featureVector, (index * 131) % HDC_DIMENSION);
  });
  return majorityBundle(terms, `sequence:${normalizeArabic(text)}`);
}

export type HdcRecord = {
  root: string;
  patternCode: string;
};

export type HdcComparison = {
  dimension: number;
  rootSimilarity: number;
  patternSimilarity: number;
  boundSimilarity: number;
  boundBits: string;
};

export function hammingDistance(left: Uint8Array, right: Uint8Array): number {
  const length = Math.min(left.length, right.length);
  let distance = Math.abs(left.length - right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
}

export function similarityPercent(left: Uint8Array, right: Uint8Array): number {
  const length = Math.max(left.length, right.length, 1);
  return Math.round(((length - hammingDistance(left, right)) / length) * 100);
}

export function compareHdcRecords(left: HdcRecord, right: HdcRecord): HdcComparison {
  const leftRoot = encodeFeatureSequence(left.root);
  const rightRoot = encodeFeatureSequence(right.root);
  const leftPattern = randomHypervector(`pattern:${left.patternCode}`);
  const rightPattern = randomHypervector(`pattern:${right.patternCode}`);
  const leftBound = xor(leftRoot, leftPattern);
  const rightBound = xor(rightRoot, rightPattern);

  return {
    dimension: HDC_DIMENSION,
    rootSimilarity: similarityPercent(leftRoot, rightRoot),
    patternSimilarity: similarityPercent(leftPattern, rightPattern),
    boundSimilarity: similarityPercent(leftBound, rightBound),
    boundBits: Array.from(leftBound.slice(0, 64)).map(String).join(''),
  };
}

function unitAngle(seed: string): number {
  return (hash32(seed) / 0xffffffff) * Math.PI * 2;
}

export function projectToPoincare(root: string, patternCode: string): { root: PoincarePoint; form: PoincarePoint } {
  const rootAngle = unitAngle(`root:${normalizeArabic(root)}`);
  const patternAngle = unitAngle(`pattern-angle:${patternCode}`);
  const rootPoint = { x: 0.14 * Math.cos(rootAngle), y: 0.14 * Math.sin(rootAngle) };
  const formAngle = rootAngle + (patternAngle - Math.PI) * 0.32;
  const formPoint = { x: 0.68 * Math.cos(formAngle), y: 0.68 * Math.sin(formAngle) };
  return { root: rootPoint, form: formPoint };
}

export function poincareDistance(left: PoincarePoint, right: PoincarePoint): number {
  const leftNorm = Math.min(left.x * left.x + left.y * left.y, 0.999999);
  const rightNorm = Math.min(right.x * right.x + right.y * right.y, 0.999999);
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  const denominator = Math.max((1 - leftNorm) * (1 - rightNorm), 1e-12);
  const argument = 1 + (2 * (deltaX * deltaX + deltaY * deltaY)) / denominator;
  return Math.acosh(Math.max(argument, 1));
}

export function comparePoincareForms(left: HdcRecord, right: HdcRecord): number {
  const leftPoint = projectToPoincare(left.root, left.patternCode).form;
  const rightPoint = projectToPoincare(right.root, right.patternCode).form;
  return poincareDistance(leftPoint, rightPoint);
}

export function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat('ar').format(value);
}

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import {
  AppShell,
  Badge,
  Card,
  HorizontalScroll,
  MetricCard,
  PrimaryButton,
  SectionHeading,
} from '../components/Shared';
import {
  generateHeritageInterpretations,
  heritageModelSignature,
  trainHeritageMeaningModel,
  type HeritageGenerationResult,
  type LetterMeaningScope,
  type LetterPosition,
} from '../core/heritageGenerator';
import { useResearchNotebook } from '../context/ResearchNotebookContext';
import { formatArabicNumber } from '../core/arabicLab';
import { colors } from '../theme';

const SCOPE_OPTIONS: Array<{ value: LetterMeaningScope; label: string }> = [
  { value: 'root-context', label: 'داخل جذر / كلمة' },
  { value: 'independent-letter', label: 'الحرف منفرداً' },
];

function scopeLabel(scope: LetterMeaningScope) {
  return scope === 'independent-letter' ? 'الحرف منفرداً' : 'داخل جذر / كلمة';
}

function positionLabel(position: LetterPosition) {
  return position === 'initial' ? 'أول الجذر'
    : position === 'medial' ? 'وسط الجذر'
      : position === 'final' ? 'آخر الجذر' : 'أي موضع';
}

function CandidateCard({ candidate, index }: { candidate: HeritageGenerationResult['candidates'][number]; index: number }) {
  return (
    <View style={styles.candidateCard}>
      <View style={styles.candidateHeader}>
        <Badge tone="violet">مرشح {formatArabicNumber(index + 1)}</Badge>
        <Text style={styles.candidateScore}>درجة النموذج: {formatArabicNumber(candidate.modelScore * 100)}٪</Text>
      </View>
      <Text style={styles.candidateText}>{candidate.text}</Text>
      <View style={styles.componentRow}>
        {candidate.components.map((component) => (
          <View key={`${component.position}-${component.letter}-${component.motif}`} style={styles.componentChip}>
            <Text style={styles.componentLetter}>{component.letter}</Text>
            <Text style={styles.componentPosition}>{positionLabel(component.positionType)}</Text>
            <Text style={styles.componentMotif}>{component.motif}</Text>
            <Text style={styles.componentSupport}>{formatArabicNumber(component.support)} وسم</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function GeneratorScreen() {
  const {
    ready,
    sources,
    letterHypotheses,
    heritageGenerations,
    heritageModelTraining,
    addHeritageGeneration,
    markHeritageModelTrained,
  } = useResearchNotebook();
  const theorySources = useMemo(() => sources.filter((source) => source.category === 'letter-semantics'), [sources]);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [scope, setScope] = useState<LetterMeaningScope>('root-context');
  const [input, setInput] = useState('كتب');
  const [result, setResult] = useState<HeritageGenerationResult | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (theorySources.length === 0) {
      if (sourceId !== null) setSourceId(null);
      return;
    }
    if (!sourceId || !theorySources.some((source) => source.id === sourceId)) {
      setSourceId(theorySources[0]?.id ?? null);
    }
  }, [sourceId, theorySources]);

  const selectedSource = theorySources.find((source) => source.id === sourceId);
  const eligibleHypotheses = useMemo(
    () => letterHypotheses.filter((hypothesis) => hypothesis.sourceId === sourceId && hypothesis.scope === scope && hypothesis.modelReady),
    [letterHypotheses, scope, sourceId],
  );
  const signature = sourceId ? heritageModelSignature(letterHypotheses, sourceId, scope) : '';
  const isTrained = Boolean(
    heritageModelTraining
    && heritageModelTraining.sourceId === sourceId
    && heritageModelTraining.scope === scope
    && heritageModelTraining.signature === signature,
  );
  const model = useMemo(
    () => isTrained && sourceId ? trainHeritageMeaningModel(letterHypotheses, sourceId, scope) : null,
    [isTrained, letterHypotheses, scope, sourceId],
  );

  useEffect(() => {
    setResult(null);
    setSaved(false);
    setError('');
  }, [scope, signature]);

  const trainModel = () => {
    if (!ready || !selectedSource) return;
    const compiled = trainHeritageMeaningModel(letterHypotheses, selectedSource.id, scope);
    if (!compiled) {
      setError('لا توجد فرضيات مفعّلة وصالحة لهذا المصدر وهذا المجال. أضفها من الدفتر بعد توثيق الاقتباس.');
      return;
    }
    const nextSignature = heritageModelSignature(letterHypotheses, selectedSource.id, scope);
    markHeritageModelTrained({
      sourceId: selectedSource.id,
      scope,
      signature: nextSignature,
      hypothesisIds: compiled.hypothesisIds,
      trainedAt: new Date().toISOString(),
    });
    setError('');
    setResult(null);
    setSaved(false);
  };

  const generate = () => {
    if (!model) {
      setError('درّب النموذج على فرضيات موثّقة ومفعّلة أولاً.');
      return;
    }
    const generated = generateHeritageInterpretations(model, input, 12);
    if (generated.letters.length === 0) {
      setResult(null);
      setError('أدخل تسلسلاً من الحروف العربية.');
      return;
    }
    setResult(generated);
    setSaved(false);
    setError('');
  };

  const saveGeneration = () => {
    if (!selectedSource || !model || !result || result.candidates.length === 0) return;
    const usedIds = new Set(result.candidates.flatMap((candidate) => candidate.components.flatMap((component) => component.hypothesisIds)));
    const hypothesisSnapshot = letterHypotheses
      .filter((hypothesis) => usedIds.has(hypothesis.id))
      .map(({ id, letter, position, researcherInterpretation, semanticMotifs }) => ({
        id,
        letter,
        position,
        researcherInterpretation,
        semanticMotifs,
      }));
    addHeritageGeneration({
      source: {
        id: selectedSource.id,
        author: selectedSource.author,
        book: selectedSource.book,
        edition: selectedSource.edition,
        location: selectedSource.location,
        excerpt: selectedSource.excerpt,
      },
      scope,
      input: result.input,
      letters: result.letters,
      modelSignature: signature,
      hypothesisSnapshot,
      candidates: result.candidates,
    });
    setSaved(true);
  };

  return (
    <AppShell active="generator">
      <View style={styles.heading}>
        <Badge tone="violet">توليد تركيبي · مرتبط بالمصدر</Badge>
        <Text style={styles.title}>ولّد فرضيات من معاني الحروف.</Text>
        <Text style={styles.intro}>هذا نموذج توليدي رمزي أولي: يتعلّم توزيعات عناصر دلالية أدخلها الباحث لكل حرف من مصدر واحد، ثم يركّبها بترتيب الحروف. لا يخلط المصادر ولا يحوّل الناتج إلى معنى معجمي مثبت.</Text>
      </View>

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>لا توجد أقوال تراثية مضمّنة أو مختلقة.</Text>
        <Text style={styles.guardrailText}>ابدأ بتوثيق نصّ وطبعة وموضع في «الدفتر»، ثم سجّل تفسيرك والعناصر التشغيلية التي قررت تمثيلها حاسوبياً. النموذج يقرأ العناصر التشغيلية فقط؛ لا يقرأ الاقتباس أو تفسير الباحث آلياً.</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="مصادر دلالة الحروف" value={formatArabicNumber(theorySources.length)} note="من الدفتر المحلي" accent={colors.violet} />
        <MetricCard label="فرضيات مجازة" value={formatArabicNumber(eligibleHypotheses.length)} note={scopeLabel(scope)} accent={colors.teal} />
        <MetricCard label="توليدات محفوظة" value={formatArabicNumber(heritageGenerations.length)} note="مع سجل المصدر" accent={colors.gold} />
      </View>

      {!ready ? (
        <Card><Text style={styles.bodyText}>جارٍ تحميل المصادر والفرضيات المحلية…</Text></Card>
      ) : !theorySources.length ? (
        <Card>
          <SectionHeading eyebrow="الخطوة الأولى" title="أضف مصدراً تراثياً موثقاً" />
          <Text style={styles.bodyText}>لا يوجد في دفتر هذا الجهاز مصدر مصنّف «دلالة الحروف». لا أملأ النموذج بمعانٍ منسوبة بلا نص موثّق.</Text>
          <Link href="/notebook" asChild>
            <Pressable style={styles.notebookLink}><Text style={styles.notebookLinkText}>افتح دفتر المصادر ←</Text></Pressable>
          </Link>
        </Card>
      ) : null}

      <Card>
        <SectionHeading eyebrow="١ · اختر فرضية مصدرية واحدة" title="مجموعة تدريب مستقلة المصدر" trailing={isTrained ? <Badge tone="green">مدرّب</Badge> : <Badge tone="gold">غير مدرّب</Badge>} />
        <Text style={styles.bodyText}>كل تشغيل يختار مصدراً واحداً ومجالاً واحداً. تفصل بيانات الجذر بين أول الحرف ووسطه وآخره، ولا تُستخدم الفرضية العامة إلا عند غياب فرضية موضعية. تبقى الدلالات المتعددة بدائل؛ ولا ندمج آراء الكتب المختلفة.</Text>
        {theorySources.length ? (
          <HorizontalScroll>
            {theorySources.map((source) => {
              const selected = source.id === sourceId;
              return (
                <Pressable key={source.id} onPress={() => { setSourceId(source.id); setResult(null); setSaved(false); }} style={[styles.sourceChip, selected && styles.sourceChipSelected]}>
                  <Text numberOfLines={1} style={[styles.sourceChipText, selected && styles.sourceChipTextSelected]}>{source.book} · {source.author}</Text>
                </Pressable>
              );
            })}
          </HorizontalScroll>
        ) : null}
        <View style={styles.scopeRow}>
          {SCOPE_OPTIONS.map((option) => {
            const selected = scope === option.value;
            return (
              <Pressable key={option.value} onPress={() => setScope(option.value)} style={[styles.scopeChip, selected && styles.scopeChipSelected]}>
                <Text style={[styles.scopeText, selected && styles.scopeTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedSource ? (
          <View style={styles.sourceQuote}>
            <Text style={styles.quoteLabel}>النص كما سجّله الباحث · {selectedSource.book} · {selectedSource.location || 'موضع غير محدد'}</Text>
            <Text selectable style={styles.quoteText}>{selectedSource.excerpt}</Text>
          </View>
        ) : <Text style={styles.bodyText}>حمّل مصدراً من تبويب الدفتر أولاً.</Text>}
        <Text style={styles.bodyText}>الفرضيات الصالحة للتدريب: {formatArabicNumber(eligibleHypotheses.length)}. تُستبعد المسودات غير المفعّلة تلقائياً.</Text>
        <PrimaryButton label={isTrained ? 'أعد تدريب النموذج على هذه الفرضيات' : 'درّب النموذج من هذا المصدر'} onPress={trainModel} disabled={!ready || !selectedSource || eligibleHypotheses.length === 0} trailing="⚙" />
        {isTrained && heritageModelTraining ? <Text style={styles.trainedAt}>آخر تدريب: {new Date(heritageModelTraining.trainedAt).toLocaleString('ar')} · {formatArabicNumber(heritageModelTraining.hypothesisIds.length)} فرضية</Text> : null}
        {eligibleHypotheses.length ? (
          <View style={styles.hypothesisList}>
            {eligibleHypotheses.map((hypothesis) => (
              <View key={hypothesis.id} style={styles.hypothesisLine}>
                <Text style={styles.hypothesisLetter}>{hypothesis.letter}</Text>
                <View style={styles.hypothesisCopy}>
                  <Text style={styles.hypothesisPosition}>{positionLabel(hypothesis.position)}</Text>
                  <Text style={styles.hypothesisInterpretation}>{hypothesis.researcherInterpretation}</Text>
                  <Text style={styles.hypothesisMotifs}>{hypothesis.semanticMotifs.join(' · ')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionHeading eyebrow="٢ · توليد مرشحين" title="أدخل تسلسل الحروف" trailing={model ? <Badge tone="green">جاهز للتوليد</Badge> : <Badge tone="neutral">درّب أولاً</Badge>} />
        <Text style={styles.bodyText}>يدعم النموذج الحرف منفرداً أو تسلسلاً قصيراً مثل الجذر؛ يعرض حتى ١٢ تركيباً مرتبة بحسب تكرار العناصر الدلالية في الفرضيات المختارة.</Text>
        <TextInput
          accessibilityLabel="تسلسل الحروف العربية"
          value={input}
          onChangeText={(value) => { setInput(value); setResult(null); setSaved(false); }}
          placeholder="مثال إدخال فقط: كتب"
          placeholderTextColor="#89938C"
          style={styles.input}
          textAlign="right"
          maxLength={40}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label="ولّد تركيبات دلالية افتراضية" onPress={generate} disabled={!model} trailing="✦" />
        {result?.missing.length ? (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>لا توجد فرضية مفعّلة لكل حرف في موضعه التالي:</Text>
            <Text style={styles.missingLetters}>{result.missing.map((entry) => `${entry.letter} · ${positionLabel(entry.position)}`).join(' / ')}</Text>
            <Text style={styles.bodyText}>لم نخمن معنى الحرف الناقص، لذلك أوقفنا تركيب الناتج.</Text>
          </View>
        ) : null}
        {result && result.candidates.length ? (
          <View style={styles.resultsBlock}>
            <View style={styles.resultWarning}>
              <Text style={styles.resultWarningTitle}>ناتج النموذج فرضية تركيبية مولّدة، لا اقتباساً ولا معنى معجمياً.</Text>
              <Text style={styles.resultWarningText}>الدرجة حاصل ضرب تكرارات العناصر لكل حرف مع افتراض استقلال المواضع؛ ليست احتمال صحة المعنى. الحروف تجمع ترتيبياً بعلامة + من دون إضافة علاقة سببية غير موثقة.</Text>
            </View>
            {result.candidates.map((candidate, index) => <CandidateCard key={`${index}-${candidate.text}`} candidate={candidate} index={index} />)}
            <PrimaryButton label={saved ? 'حُفظ الناتج في الدفتر' : 'احفظ الناتج وسجلّ الفرضيات'} onPress={saveGeneration} disabled={saved} trailing={saved ? '✓' : '＋'} />
            {saved ? <Text style={styles.savedNote}>حُفظت النتيجة ولقطة من مصدرها وفرضياتها في تبويب «التوليدات».</Text> : null}
          </View>
        ) : null}
      </Card>

      <View style={styles.limitCallout}>
        <Text style={styles.limitTitle}>حدود النسخة التوليدية</Text>
        <Text style={styles.limitText}>هذا نموذج احتمالي تركيبي صغير يتعلم تكرار العناصر التي يدوّنها الباحث، ويولّد قوائم مرتّبة منها فقط. لا يولّد شرحاً حراً أو كلمات عربية، ولا يثبت أن نظريات معاني الحروف صحيحة. يلزم corpus موثق لأقوال المصادر، وتحكيم مستقل للتأويلات، ثم مقارنة هذا النموذج بخط أساس لغوي مناسب.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 7, alignItems: 'flex-start', paddingHorizontal: 2 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 36, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  intro: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 680, textAlign: 'right', writingDirection: 'rtl' },
  guardrail: { backgroundColor: colors.forest, borderRadius: 18, padding: 15, gap: 5 },
  guardrailTitle: { color: colors.white, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  guardrailText: { color: '#C7D9CF', fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  metricsRow: { flexDirection: 'row-reverse', gap: 7 },
  bodyText: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  notebookLink: { alignSelf: 'flex-start', borderRadius: 12, backgroundColor: colors.mintSoft, paddingHorizontal: 12, paddingVertical: 9 },
  notebookLinkText: { color: colors.forest, fontSize: 10, fontWeight: '800' },
  sourceChip: { maxWidth: 240, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 10, paddingVertical: 8 },
  sourceChipSelected: { borderColor: colors.forest, backgroundColor: colors.forest },
  sourceChipText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  sourceChipTextSelected: { color: colors.mint },
  scopeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  scopeChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, paddingVertical: 8 },
  scopeChipSelected: { borderColor: colors.teal, backgroundColor: colors.teal },
  scopeText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  scopeTextSelected: { color: colors.white },
  sourceQuote: { borderRightWidth: 3, borderRightColor: colors.violet, backgroundColor: colors.violetSoft, borderRadius: 12, padding: 11, gap: 6 },
  quoteLabel: { color: colors.violet, fontSize: 9, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  quoteText: { color: colors.ink, fontSize: 12, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  trainedAt: { color: colors.teal, fontSize: 9, textAlign: 'right' },
  hypothesisList: { borderTopWidth: 1, borderTopColor: colors.line, gap: 0 },
  hypothesisLine: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#EDF0EA', paddingVertical: 8 },
  hypothesisLetter: { width: 28, height: 28, textAlign: 'center', textAlignVertical: 'center', borderRadius: 9, overflow: 'hidden', backgroundColor: colors.mintSoft, color: colors.forest, fontSize: 16, fontWeight: '900' },
  hypothesisCopy: { flex: 1, gap: 3 },
  hypothesisPosition: { color: colors.violet, fontSize: 8, fontWeight: '800', textAlign: 'right' },
  hypothesisInterpretation: { color: colors.ink, fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  hypothesisMotifs: { color: colors.teal, fontSize: 9, lineHeight: 14, textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFBF7', paddingHorizontal: 12, color: colors.ink, fontSize: 16, writingDirection: 'rtl' },
  errorText: { color: colors.coral, fontSize: 10, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  missingBox: { backgroundColor: colors.goldSoft, borderRadius: 13, borderWidth: 1, borderColor: '#E9D8B8', padding: 12, gap: 5 },
  missingTitle: { color: '#5F4827', fontSize: 10, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  missingLetters: { color: colors.coral, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  resultsBlock: { gap: 8 },
  resultWarning: { backgroundColor: colors.goldSoft, borderRadius: 13, padding: 11, gap: 4 },
  resultWarningTitle: { color: '#5F4827', fontSize: 10, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  resultWarningText: { color: '#6C5837', fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  candidateCard: { borderRadius: 14, backgroundColor: '#F7F8F3', borderWidth: 1, borderColor: colors.line, padding: 11, gap: 8 },
  candidateHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  candidateScore: { color: colors.violet, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  candidateText: { color: colors.ink, fontSize: 12, lineHeight: 20, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  componentRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  componentChip: { minWidth: 60, borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 7, gap: 2, alignItems: 'flex-end' },
  componentLetter: { color: colors.violet, fontSize: 15, fontWeight: '900' },
  componentPosition: { color: colors.muted, fontSize: 7 },
  componentMotif: { color: colors.ink, fontSize: 9, fontWeight: '700', textAlign: 'right' },
  componentSupport: { color: colors.muted, fontSize: 7 },
  savedNote: { color: colors.teal, fontSize: 9, textAlign: 'right' },
  limitCallout: { backgroundColor: colors.goldSoft, borderRadius: 17, borderWidth: 1, borderColor: '#E9D8B8', padding: 14, gap: 4 },
  limitTitle: { color: '#5F4827', fontSize: 11, fontWeight: '900', textAlign: 'right' },
  limitText: { color: '#6C5837', fontSize: 9, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
});

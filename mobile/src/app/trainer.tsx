import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArabicText,
  AppShell,
  Badge,
  Card,
  HorizontalScroll,
  MetricCard,
  PrimaryButton,
  SectionHeading,
  SmallAction,
} from '../components/Shared';
import {
  MORPH_SAMPLES,
  evaluateHdcClassifier,
  formatArabicNumber,
  predictHdcClassifier,
  trainHdcClassifier,
  type HdcClassifier,
} from '../core/arabicLab';
import { useResearchNotebook, type MorphologyTrainingExample, type TrainingSplit } from '../context/ResearchNotebookContext';
import { colors } from '../theme';

type TrainedMorphologyModel = { root: HdcClassifier; pattern: HdcClassifier };

function ModelPrediction({ title, prediction }: { title: string; prediction: ReturnType<typeof predictHdcClassifier> }) {
  if (!prediction) return null;
  return (
    <View style={styles.predictionBox}>
      <View style={styles.predictionMain}>
        <Text style={styles.predictionLabel}>{title}</Text>
        <ArabicText style={styles.predictionValue}>{prediction.label}</ArabicText>
      </View>
      <View style={styles.predictionScores}>
        <Text style={styles.predictionScore}>{formatArabicNumber(prediction.similarity)}٪ تشابه</Text>
        {prediction.runnerUp ? <Text style={styles.runnerUp}>التالي: {prediction.runnerUp.label} · {formatArabicNumber(prediction.runnerUp.similarity)}٪</Text> : <Text style={styles.runnerUp}>فئة واحدة في النموذج</Text>}
        {prediction.runnerUp ? <Text style={styles.marginText}>الهامش: {formatArabicNumber(prediction.margin)} نقطة — ليس احتمالاً معايراً</Text> : <Text style={styles.marginText}>لا يوجد هامش مقارنة؛ فئة واحدة فقط</Text>}
      </View>
    </View>
  );
}

function TrainingExampleRow({
  example,
  onDelete,
  onToggleSplit,
}: {
  example: MorphologyTrainingExample;
  onDelete: () => void;
  onToggleSplit: () => void;
}) {
  return (
    <View style={styles.exampleRow}>
      <View style={styles.exampleMain}>
        <View style={styles.exampleTop}>
          <ArabicText style={styles.exampleForm}>{example.form}</ArabicText>
          <Badge tone={example.split === 'train' ? 'green' : 'gold'}>{example.split === 'train' ? 'تدريب' : 'اختبار'}</Badge>
        </View>
        <Text style={styles.exampleLabels}>الجذر: {example.root} · الوزن: {example.pattern}</Text>
        {example.heritageSourceLabel ? <Text style={styles.exampleSource}>المرجع: {example.heritageSourceLabel}</Text> : null}
      </View>
      <View style={styles.exampleActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={example.split === 'train' ? 'نقل المثال إلى الاختبار' : 'نقل المثال إلى التدريب'}
          onPress={onToggleSplit}
          style={styles.toggleSplitAction}
        >
          <Text style={styles.toggleSplitText}>{example.split === 'train' ? 'إلى الاختبار' : 'إلى التدريب'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="حذف المثال" onPress={onDelete} style={styles.deleteExample}>
          <Text style={styles.deleteExampleText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EvaluationCard({ title, total, accuracy }: { title: string; total: number; accuracy: number | null }) {
  return (
    <View style={styles.evaluationCell}>
      <Text style={styles.evaluationLabel}>{title}</Text>
      <Text style={styles.evaluationValue}>{accuracy === null ? '—' : `${formatArabicNumber(accuracy)}٪`}</Text>
      <Text style={styles.evaluationCaption}>{total ? `${formatArabicNumber(total)} عينة اختبار` : 'لا توجد عينات اختبار'}</Text>
    </View>
  );
}

export default function TrainerScreen() {
  const {
    ready,
    storageError,
    sources,
    trainingExamples,
    modelTrainedAt,
    addTrainingExamples,
    deleteTrainingExample,
    updateTrainingExampleSplit,
    markModelTrained,
  } = useResearchNotebook();

  const [form, setForm] = useState('');
  const [root, setRoot] = useState('');
  const [pattern, setPattern] = useState('');
  const [split, setSplit] = useState<TrainingSplit>('train');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [inferenceInput, setInferenceInput] = useState('مَكْتَبَة');
  const [error, setError] = useState('');
  const [training, setTraining] = useState(false);

  const trainExamples = useMemo(() => trainingExamples.filter((example) => example.split === 'train'), [trainingExamples]);
  const testExamples = useMemo(() => trainingExamples.filter((example) => example.split === 'test'), [trainingExamples]);
  const model = useMemo<TrainedMorphologyModel | null>(() => {
    if (!modelTrainedAt || trainExamples.length === 0) return null;
    return {
      root: trainHdcClassifier(trainExamples.map((example) => ({ text: example.form, label: example.root }))),
      pattern: trainHdcClassifier(trainExamples.map((example) => ({ text: example.form, label: example.pattern }))),
    };
  }, [modelTrainedAt, trainExamples]);

  const rootPrediction = model ? predictHdcClassifier(model.root, inferenceInput) : null;
  const patternPrediction = model ? predictHdcClassifier(model.pattern, inferenceInput) : null;
  const rootEvaluation = model ? evaluateHdcClassifier(
    model.root,
    testExamples.map((example) => ({ text: example.form, label: example.root })),
  ) : null;
  const patternEvaluation = model ? evaluateHdcClassifier(
    model.pattern,
    testExamples.map((example) => ({ text: example.form, label: example.pattern })),
  ) : null;
  const rootClassCount = new Set(trainExamples.map((example) => example.root.trim()).filter(Boolean)).size;
  const patternClassCount = new Set(trainExamples.map((example) => example.pattern.trim()).filter(Boolean)).size;
  const selectedSource = sources.find((source) => source.id === sourceId);
  const selectedSourceLabel = selectedSource
    ? [selectedSource.book, selectedSource.author, selectedSource.location].filter(Boolean).join(' · ')
    : undefined;

  const addExample = () => {
    if (!ready) return;
    if (!form.trim() || !root.trim() || !pattern.trim()) {
      setError('أدخل الصيغة والجذر والوزن قبل إضافة المثال.');
      return;
    }
    if (!/[\u0621-\u064A\u0671\u06CC]/u.test(form.trim())) {
      setError('اكتب الصيغة بحروف عربية حتى تُحوّل إلى سمات صوتية.');
      return;
    }
    addTrainingExamples([{
      form: form.trim(),
      root: root.trim(),
      pattern: pattern.trim(),
      split,
      heritageSourceId: selectedSource?.id,
      heritageSourceLabel: selectedSourceLabel,
    }]);
    setForm('');
    setRoot('');
    setPattern('');
    setError('');
  };

  const loadDemoExamples = () => {
    if (!ready) return;
    const existing = new Set(trainingExamples.map((example) => `${example.form}|${example.root}|${example.pattern}`));
    const demo = MORPH_SAMPLES
      .filter((sample) => !existing.has(`${sample.form}|${sample.root}|${sample.pattern}`))
      .map((sample) => ({
        form: sample.form,
        root: sample.root,
        pattern: sample.pattern,
        split: 'train' as const,
        heritageSourceLabel: 'أمثلة تعليمية مضمّنة — غير موسومة من مصدر خارجي',
      }));
    if (demo.length) addTrainingExamples(demo);
  };

  const runTraining = () => {
    if (!ready || trainExamples.length < 2) {
      setError('أضف مثالين تدريبيين على الأقل قبل التدريب.');
      return;
    }
    setTraining(true);
    setError('');
    setTimeout(() => {
      markModelTrained(new Date().toISOString());
      setTraining(false);
    }, 40);
  };

  const removeExample = (example: MorphologyTrainingExample) => {
    const remove = () => deleteTrainingExample(example.id);
    if (Platform.OS === 'web') {
      if (window.confirm('حذف هذا المثال من مجموعة التدريب؟')) remove();
    } else {
      Alert.alert('حذف المثال', 'سيُعاد ضبط النموذج المدرّب عند حذف المثال.', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: remove },
      ]);
    }
  };

  const toggleExampleSplit = (example: MorphologyTrainingExample) => {
    updateTrainingExampleSplit(example.id, example.split === 'train' ? 'test' : 'train');
  };

  return (
    <AppShell active="trainer">
      <View style={styles.pageHeading}>
        <Badge tone="green">تدريب على الجهاز · HDC</Badge>
        <Text style={styles.pageTitle}>درّب نموذجاً صغيراً واختبره.</Text>
        <Text style={styles.pageCopy}>هذه أول حلقة تدريب فعلية: يتعلّم مصنّف بمتجهات ثنائية نماذج أولية للجذر والوزن من أمثلتك، ثم يعطي تنبؤاً محلياً على الهاتف.</Text>
      </View>

      <View style={styles.modelCallout}>
        <View style={styles.modelMark}><Text style={styles.modelMarkText}>01</Text></View>
        <View style={styles.modelCalloutCopy}>
          <Text style={styles.modelCalloutTitle}>ما الذي يُدرَّب هنا؟</Text>
          <Text style={styles.modelCalloutText}>مصنّف HDC بإشراف: يجمع السمات النطقية التقريبية للحروف وعلامات التشكيل المكتوبة عند وجودها؛ والكتابة غير المشكولة لا تُعامل كسكون. ثم يختار أقرب نموذج أولي بمسافة Hamming. ليس نموذجاً توليدياً ولا دليلاً على تعميم لغوي واسع.</Text>
        </View>
      </View>

      {storageError ? <Text style={styles.storageError}>تعذّر التخزين المحلي؛ صدّر بيانات الدفتر قبل إغلاق التطبيق.</Text> : null}

      <View style={styles.metricsRow}>
        <MetricCard label="أمثلة تدريب" value={formatArabicNumber(trainExamples.length)} note={`${formatArabicNumber(rootClassCount)} جذور · ${formatArabicNumber(patternClassCount)} أوزان`} accent={colors.teal} />
        <MetricCard label="أمثلة اختبار" value={formatArabicNumber(testExamples.length)} note="محجوزة خارج التدريب" accent={colors.gold} />
      </View>

      <Card>
        <SectionHeading eyebrow="بيانات موسومة" title="أضف مثالاً تدريبياً" trailing={<Badge tone={split === 'train' ? 'green' : 'gold'}>{split === 'train' ? 'تدريب' : 'اختبار'}</Badge>} />
        <View style={styles.formField}>
          <Text style={styles.formLabel}>الصيغة السطحية</Text>
          <TextInput value={form} onChangeText={setForm} placeholder="مثال: مَكْتَبَة" placeholderTextColor="#89938C" style={styles.input} textAlign="right" maxLength={80} />
        </View>
        <View style={styles.formRow}>
          <View style={styles.halfField}>
            <Text style={styles.formLabel}>الجذر</Text>
            <TextInput value={root} onChangeText={setRoot} placeholder="مثال: كتب" placeholderTextColor="#89938C" style={styles.input} textAlign="right" maxLength={32} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.formLabel}>الوزن</Text>
            <TextInput value={pattern} onChangeText={setPattern} placeholder="مثال: مَفْعَلَة" placeholderTextColor="#89938C" style={styles.input} textAlign="right" maxLength={48} />
          </View>
        </View>
        <View style={styles.splitRow}>
          <Text style={styles.formLabel}>تقسيم العينة</Text>
          <View style={styles.splitOptions}>
            {(['train', 'test'] as const).map((option) => {
              const selected = split === option;
              return (
                <Pressable key={option} onPress={() => setSplit(option)} style={[styles.splitChip, selected && styles.splitChipSelected]}>
                  <Text style={[styles.splitText, selected && styles.splitTextSelected]}>{option === 'train' ? 'تدريب' : 'اختبار محجوز'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {sources.length > 0 ? (
          <View style={styles.sourceSelector}>
            <Text style={styles.formLabel}>المصدر (اختياري)</Text>
            <HorizontalScroll>
              <Pressable onPress={() => setSourceId(null)} style={[styles.sourceChip, sourceId === null && styles.sourceChipSelected]}>
                <Text style={[styles.sourceChipText, sourceId === null && styles.sourceChipTextSelected]}>دون مصدر</Text>
              </Pressable>
              {sources.map((source) => {
                const selected = source.id === sourceId;
                return (
                  <Pressable key={source.id} onPress={() => setSourceId(source.id)} style={[styles.sourceChip, selected && styles.sourceChipSelected]}>
                    <Text numberOfLines={1} style={[styles.sourceChipText, selected && styles.sourceChipTextSelected]}>{source.book} · {source.author}</Text>
                  </Pressable>
                );
              })}
            </HorizontalScroll>
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label="أضف المثال إلى البيانات" onPress={addExample} disabled={!ready} trailing="＋" />
        <View style={styles.formFootnote}>
          <SmallAction label="حمّل أمثلة توضيحية" onPress={loadDemoExamples} />
          <Text style={styles.footnoteText}>الأمثلة المضمّنة للتشغيل فقط وليست بيانات موثقة أو اختباراً علمياً.</Text>
        </View>
      </Card>

      <Card>
        <SectionHeading eyebrow="مصنف محلي بمتجهات ثنائية" title="تدريب الجذر والوزن" trailing={modelTrainedAt ? <Badge tone="green">مدرّب</Badge> : <Badge tone="gold">غير مدرّب</Badge>} />
        <Text style={styles.bodyNote}>يُدرَّب مصنّفان منفصلان على الحقل الصوتي نفسه: واحد للجذر وآخر للوزن. إذا أضفت أو حذفت مثالاً، يصبح النموذج قديماً ويجب إعادة التدريب.</Text>
        <PrimaryButton
          label={training ? 'جارٍ بناء النماذج الأولية…' : modelTrainedAt ? 'أعد تدريب النموذج على البيانات الحالية' : 'درّب النموذج على هذا الجهاز'}
          onPress={runTraining}
          disabled={!ready || training || trainExamples.length < 2}
          trailing={training ? '…' : '⚙'}
        />
        {modelTrainedAt ? <Text style={styles.trainedAt}>آخر تدريب: {new Date(modelTrainedAt).toLocaleString('ar')}</Text> : null}
        {training ? <View style={styles.trainingProgress}><ActivityIndicator color={colors.teal} /><Text style={styles.bodyNote}>تجميع المتجهات الثنائية وتصويت الفئات…</Text></View> : null}
        {model ? (
          <View style={styles.evaluationPanel}>
            <Text style={styles.evaluationTitle}>الاختبار المحجوز — لا تُحسب أمثلة التدريب هنا</Text>
            <View style={styles.evaluationRow}>
              <EvaluationCard title="دقة الجذر" total={rootEvaluation?.total ?? 0} accuracy={rootEvaluation?.accuracyPercent ?? null} />
              <EvaluationCard title="دقة الوزن" total={patternEvaluation?.total ?? 0} accuracy={patternEvaluation?.accuracyPercent ?? null} />
            </View>
            {!testExamples.length ? <Text style={styles.evaluationHint}>عيّن بعض الأمثلة إلى «اختبار مستقل» لتقدير التعميم. لن نعرض دقة التدريب على أنها دقة اختبار.</Text> : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionHeading eyebrow="استدلال محلي" title="جرّب صيغة جديدة" trailing={model ? <Badge tone="green">يعمل</Badge> : <Badge tone="neutral">يتطلب التدريب</Badge>} />
        <TextInput value={inferenceInput} onChangeText={setInferenceInput} placeholder="أدخل كلمة عربية" placeholderTextColor="#89938C" style={styles.input} textAlign="right" maxLength={80} />
        {model ? (
          <View style={styles.predictions}>
            <ModelPrediction title="الجذر المتوقع" prediction={rootPrediction} />
            <ModelPrediction title="الوزن المتوقع" prediction={patternPrediction} />
          </View>
        ) : (
          <Text style={styles.bodyNote}>أضف أمثلة تدريب ثم اضغط «درّب النموذج» لتفعيل الاستدلال.</Text>
        )}
      </Card>

      <Card>
        <SectionHeading eyebrow="مجموعة البيانات المحلية" title={`الأمثلة (${formatArabicNumber(trainingExamples.length)})`} trailing={<Badge tone="dark">{`${formatArabicNumber(trainExamples.length)} تدريب / ${formatArabicNumber(testExamples.length)} اختبار`}</Badge>} />
        {trainingExamples.length ? trainingExamples.slice(0, 20).map((example) => (
          <TrainingExampleRow
            key={example.id}
            example={example}
            onDelete={() => removeExample(example)}
            onToggleSplit={() => toggleExampleSplit(example)}
          />
        )) : (
          <Text style={styles.bodyNote}>لا توجد أمثلة بعد. أضفها يدوياً من مصدر موثّق أو حمّل الأمثلة التعليمية المضمّنة.</Text>
        )}
        {trainingExamples.length > 20 ? <Text style={styles.bodyNote}>تُعرض أول ٢٠ عينة. بقية البيانات محفوظة في الدفتر.</Text> : null}
        <Text style={styles.bodyNote}>تُحفظ البيانات وحالة التدريب محلياً، وتُعاد بنية النماذج الأولية من الأمثلة عند فتح المدرّب. صدّر مجموعة التدريب مع دفتر البحث من تبويب «الدفتر».</Text>
      </Card>

      <View style={styles.limitCallout}>
        <Text style={styles.limitTitle}>نطاق النموذج الحالي</Text>
        <Text style={styles.limitText}>هذا مصنّف فئات مغلقة يتعلّم نماذج أولية من الأمثلة المتاحة؛ لا يولّد نصاً، ولا يثبت أن HDC يتفوق على المحوّلات، ولا يتنبأ بجذر لم يظهر في بيانات التدريب. الخطوة البحثية التالية: بيانات أوسع، تقسيم حسب الجذر، ومقارنة عادلة بخط أساس حرفي.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  pageHeading: { gap: 7, alignItems: 'flex-start', paddingHorizontal: 2 },
  pageTitle: { color: colors.ink, fontSize: 27, lineHeight: 36, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  pageCopy: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 650, textAlign: 'right', writingDirection: 'rtl' },
  modelCallout: { backgroundColor: colors.forest, borderRadius: 20, padding: 16, flexDirection: 'row-reverse', gap: 11, alignItems: 'flex-start' },
  modelMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  modelMarkText: { color: colors.forest, fontWeight: '900', fontSize: 11 },
  modelCalloutCopy: { flex: 1, gap: 4 },
  modelCalloutTitle: { color: colors.white, fontWeight: '900', fontSize: 12, textAlign: 'right' },
  modelCalloutText: { color: '#C7D9CF', fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  storageError: { color: colors.coral, fontSize: 10, textAlign: 'right', fontWeight: '700' },
  metricsRow: { flexDirection: 'row-reverse', gap: 8 },
  formField: { gap: 6 },
  formRow: { flexDirection: 'row-reverse', gap: 9 },
  halfField: { flex: 1, gap: 6, minWidth: 0 },
  formLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  input: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFBF7', paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 12, writingDirection: 'rtl' },
  splitRow: { gap: 7 },
  splitOptions: { flexDirection: 'row-reverse', gap: 7 },
  splitChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft },
  splitChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  splitText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  splitTextSelected: { color: colors.mint },
  sourceSelector: { gap: 6 },
  sourceChip: { maxWidth: 210, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 10, paddingVertical: 7 },
  sourceChipSelected: { borderColor: colors.forest, backgroundColor: colors.forest },
  sourceChipText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  sourceChipTextSelected: { color: colors.mint },
  errorText: { color: colors.coral, fontSize: 10, textAlign: 'right', fontWeight: '700' },
  formFootnote: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  footnoteText: { color: colors.muted, fontSize: 9, lineHeight: 15, flex: 1, textAlign: 'right', writingDirection: 'rtl' },
  bodyNote: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  trainedAt: { color: colors.teal, fontSize: 9, textAlign: 'right' },
  trainingProgress: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  evaluationPanel: { backgroundColor: '#F7F8F3', borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 9 },
  evaluationTitle: { color: colors.ink, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  evaluationRow: { flexDirection: 'row-reverse', gap: 8 },
  evaluationCell: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 10, gap: 3 },
  evaluationLabel: { color: colors.muted, fontSize: 9, textAlign: 'right' },
  evaluationValue: { color: colors.forest, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  evaluationCaption: { color: colors.muted, fontSize: 8, textAlign: 'right' },
  evaluationHint: { color: colors.gold, fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  predictions: { gap: 8 },
  predictionBox: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 14, backgroundColor: colors.mintSoft, padding: 12 },
  predictionMain: { gap: 3, alignItems: 'flex-start' },
  predictionLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  predictionValue: { color: colors.forest, fontSize: 17, fontWeight: '900' },
  predictionScores: { gap: 2, alignItems: 'flex-end' },
  predictionScore: { color: colors.teal, fontSize: 10, fontWeight: '900' },
  runnerUp: { color: colors.muted, fontSize: 8, textAlign: 'right' },
  marginText: { color: colors.muted, fontSize: 8, textAlign: 'right' },
  exampleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 9, borderTopWidth: 1, borderColor: '#EDF0EA' },
  exampleMain: { flex: 1, gap: 3 },
  exampleTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  exampleForm: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  exampleLabels: { color: colors.muted, fontSize: 9, textAlign: 'right', writingDirection: 'rtl' },
  exampleSource: { color: colors.teal, fontSize: 8, textAlign: 'right', writingDirection: 'rtl' },
  exampleActions: { alignItems: 'center', gap: 5 },
  toggleSplitAction: { minHeight: 28, justifyContent: 'center', borderRadius: 9, backgroundColor: colors.surfaceSoft, paddingHorizontal: 8 },
  toggleSplitText: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  deleteExample: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft },
  deleteExampleText: { color: colors.coral, fontSize: 18, lineHeight: 20, fontWeight: '700' },
  limitCallout: { backgroundColor: colors.goldSoft, borderRadius: 17, borderWidth: 1, borderColor: '#E9D8B8', padding: 14, gap: 4 },
  limitTitle: { color: '#5F4827', fontSize: 11, fontWeight: '900', textAlign: 'right' },
  limitText: { color: '#6C5837', fontSize: 9, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
});

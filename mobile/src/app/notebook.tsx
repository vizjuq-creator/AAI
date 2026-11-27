import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
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
  Eyebrow,
  HorizontalScroll,
  MetricCard,
  PrimaryButton,
  SectionHeading,
  SmallAction,
} from '../components/Shared';
import {
  type ComparisonExperiment,
  type HeritageSource,
  type SavedHeritageGeneration,
  type SourceCategory,
  useResearchNotebook,
} from '../context/ResearchNotebookContext';
import {
  extractArabicLetterSequence,
  formatArabicNumber,
} from '../core/arabicLab';
import type { LetterMeaningHypothesis, LetterMeaningScope, LetterPosition } from '../core/heritageGenerator';
import { colors, radii } from '../theme';

type NotebookTab = 'sources' | 'hypotheses' | 'experiments' | 'generations';

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  phonetics: 'مخارج / صفات',
  'letter-semantics': 'دلالة الحروف',
  morphology: 'جذر / اشتقاق',
  other: 'أخرى',
};

const CATEGORIES: SourceCategory[] = ['letter-semantics', 'phonetics', 'morphology', 'other'];

const SCOPE_LABELS: Record<LetterMeaningScope, string> = {
  'independent-letter': 'الحرف منفرداً',
  'root-context': 'داخل جذر / كلمة',
};

const POSITION_LABELS: Record<LetterPosition, string> = {
  any: 'أي موضع',
  initial: 'أول الجذر',
  medial: 'وسط الجذر',
  final: 'آخر الجذر',
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#89938C"
        multiline={multiline}
        textAlign="right"
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline]}
        autoCorrect={false}
        spellCheck={false}
        maxLength={multiline ? 2400 : 160}
      />
    </View>
  );
}

function SourceCard({ item, onDelete }: { item: HeritageSource; onDelete: () => void }) {
  return (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Badge tone="green">{CATEGORY_LABELS[item.category]}</Badge>
        <Text style={styles.recordDate}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
      </View>
      <Text style={styles.recordTitle}>{item.book}</Text>
      <Text style={styles.recordCitation}>
        {item.author}{item.location ? ` · ${item.location}` : ''}{item.edition ? ` · ${item.edition}` : ''}
      </Text>
      <View style={styles.quoteBox}>
        <Text style={styles.quoteLabel}>النص المنقول / المقتطف</Text>
        <Text selectable style={styles.quoteText}>{item.excerpt}</Text>
      </View>
      {item.interpretation ? (
        <View style={styles.recordDetail}>
          <Text style={styles.detailLabel}>فهم الباحث</Text>
          <Text style={styles.detailText}>{item.interpretation}</Text>
        </View>
      ) : null}
      {item.computationalHypothesis ? (
        <View style={styles.hypothesisBox}>
          <Text style={styles.detailLabel}>الترجمة الحاسوبية المقترحة</Text>
          <Text style={styles.detailText}>{item.computationalHypothesis}</Text>
        </View>
      ) : null}
      <View style={styles.recordActions}>
        <SmallAction label="حذف السجل" onPress={onDelete} />
      </View>
    </Card>
  );
}

function HypothesisCard({
  item,
  source,
  onDelete,
  onToggleModelReady,
}: {
  item: LetterMeaningHypothesis;
  source?: HeritageSource;
  onDelete: () => void;
  onToggleModelReady: () => void;
}) {
  return (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.hypothesisHeaderBadges}>
          <Badge tone={item.modelReady ? 'green' : 'gold'}>{item.modelReady ? 'مجازة للتدريب' : 'مسودة · مستبعدة'}</Badge>
          <Badge tone="neutral">{SCOPE_LABELS[item.scope]}</Badge>
          <Badge tone="neutral">{POSITION_LABELS[item.position]}</Badge>
        </View>
        <Text style={styles.hypothesisLetter}>{item.letter}</Text>
      </View>
      <Text style={styles.recordTitle}>{source ? `${source.book} · ${source.author}` : 'مصدر غير متاح'}</Text>
      {source?.location ? <Text style={styles.recordCitation}>{source.location} · {source.edition}</Text> : null}
      {source?.excerpt ? (
        <View style={styles.quoteBox}>
          <Text style={styles.quoteLabel}>اقتباس المصدر — ليس وسم النموذج</Text>
          <Text selectable style={styles.quoteText}>{source.excerpt}</Text>
        </View>
      ) : null}
      <View style={styles.recordDetail}>
        <Text style={styles.detailLabel}>تفسير الباحث</Text>
        <Text style={styles.detailText}>{item.researcherInterpretation}</Text>
      </View>
      <View style={styles.motifsBox}>
        <Text style={styles.detailLabel}>العناصر الدلالية التي أدخلها الباحث للنموذج</Text>
        <Text style={styles.detailText}>{item.semanticMotifs.join(' · ')}</Text>
      </View>
      <View style={styles.recordActions}>
        <SmallAction label={item.modelReady ? 'أوقف استخدامها في النموذج' : 'فعّلها بعد المراجعة'} onPress={onToggleModelReady} />
        <SmallAction label="حذف الفرضية" onPress={onDelete} />
      </View>
    </Card>
  );
}

function GenerationCard({ item, onDelete }: { item: SavedHeritageGeneration; onDelete: () => void }) {
  return (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Badge tone="violet">توليد رمزي محفوظ</Badge>
        <Text style={styles.recordDate}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
      </View>
      <Text style={styles.recordTitle}>{item.source.book} · {item.source.author}</Text>
      <Text style={styles.recordCitation}>{item.source.location || 'موضع غير محدد'} · {SCOPE_LABELS[item.scope]}</Text>
      <Text style={styles.pairMeta}>المدخل: {item.letters.join(' · ')}</Text>
      <View style={styles.quoteBox}>
        <Text style={styles.quoteLabel}>النص المنقول المحفوظ مع التجربة</Text>
        <Text selectable style={styles.quoteText}>{item.source.excerpt}</Text>
      </View>
      <Text style={styles.detailLabel}>المخرجات — تأويلات تركيبية وليست أقوالاً للمصدر</Text>
      {item.candidates.map((candidate, index) => (
        <View key={`${index}-${candidate.text}`} style={styles.generatedRow}>
          <Text style={styles.detailText}>{candidate.text}</Text>
          <Text style={styles.generatedScore}>درجة النموذج: {formatArabicNumber(candidate.modelScore * 100)}٪ · {formatArabicNumber(candidate.components.length)} موضعاً</Text>
        </View>
      ))}
      <Text style={styles.detailText}>حُفظت {formatArabicNumber(item.hypothesisSnapshot.length)} فرضيات مستخدمة ونسخة من المصدر لأجل التتبّع.</Text>
      <View style={styles.recordActions}><SmallAction label="حذف سجل التوليد" onPress={onDelete} /></View>
    </Card>
  );
}

function ExperimentCard({ item, onDelete }: { item: ComparisonExperiment; onDelete: () => void }) {
  return (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Badge tone="gold">مقارنة HDC</Badge>
        <Text style={styles.recordDate}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
      </View>
      <Text style={styles.recordTitle}>{item.question}</Text>
      {item.heritageSourceLabel ? <Text style={styles.linkedSource}>مرجع النظرية: {item.heritageSourceLabel}</Text> : null}
      <View style={styles.experimentPair}>
        <View style={styles.experimentSide}>
          <Text style={styles.pairLabel}>العينة A</Text>
          <ArabicText style={styles.pairForm}>{item.leftForm}</ArabicText>
          <Text style={styles.pairMeta}>الجذر: {item.leftRoot} · الوزن: {item.leftPattern}</Text>
        </View>
        <View style={styles.pairDivider} />
        <View style={styles.experimentSide}>
          <Text style={styles.pairLabel}>العينة B</Text>
          <ArabicText style={styles.pairForm}>{item.rightForm}</ArabicText>
          <Text style={styles.pairMeta}>الجذر: {item.rightRoot} · الوزن: {item.rightPattern}</Text>
        </View>
      </View>
      <View style={styles.savedMetrics}>
        <SavedMetric label="الجذر" value={item.rootSimilarity} />
        <SavedMetric label="الوزن" value={item.patternSimilarity} />
        <SavedMetric label="XOR" value={item.boundSimilarity} />
        <View style={styles.distanceMetric}>
          <Text style={styles.savedMetricLabel}>بوانكاريه</Text>
          <Text style={styles.savedMetricValue}>{item.poincareDistance.toFixed(3)}</Text>
        </View>
      </View>
      {item.notes ? <Text style={styles.detailText}>{item.notes}</Text> : null}
      <View style={styles.recordActions}>
        <SmallAction label="حذف السجل" onPress={onDelete} />
      </View>
    </Card>
  );
}

function SavedMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.savedMetric}>
      <Text style={styles.savedMetricLabel}>{label}</Text>
      <Text style={styles.savedMetricValue}>{formatArabicNumber(value)}٪</Text>
    </View>
  );
}

export default function NotebookScreen() {
  const {
    sources,
    experiments,
    trainingExamples,
    modelTrainedAt,
    letterHypotheses,
    heritageGenerations,
    heritageModelTraining,
    ready,
    storageError,
    addSource,
    deleteSource,
    deleteExperiment,
    addLetterHypothesis,
    deleteLetterHypothesis,
    setLetterHypothesisModelReady,
    deleteHeritageGeneration,
  } = useResearchNotebook();
  const [activeTab, setActiveTab] = useState<NotebookTab>('sources');
  const [author, setAuthor] = useState('');
  const [book, setBook] = useState('');
  const [edition, setEdition] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<SourceCategory>('letter-semantics');
  const [excerpt, setExcerpt] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [computationalHypothesis, setComputationalHypothesis] = useState('');
  const [formError, setFormError] = useState('');
  const [hypothesisSourceId, setHypothesisSourceId] = useState<string | null>(null);
  const [hypothesisLetter, setHypothesisLetter] = useState('');
  const [hypothesisScope, setHypothesisScope] = useState<LetterMeaningScope>('root-context');
  const [hypothesisPosition, setHypothesisPosition] = useState<LetterPosition>('any');
  const [hypothesisInterpretation, setHypothesisInterpretation] = useState('');
  const [hypothesisMotifs, setHypothesisMotifs] = useState('');
  const [hypothesisModelReady, setHypothesisModelReady] = useState(false);
  const [hypothesisError, setHypothesisError] = useState('');

  const theorySources = useMemo(() => sources.filter((source) => source.category === 'letter-semantics'), [sources]);
  const selectedHypothesisSource = theorySources.find((source) => source.id === hypothesisSourceId);
  const modelReadyHypothesisCount = letterHypotheses.filter((hypothesis) => hypothesis.modelReady).length;
  const activeRecordCount = activeTab === 'sources' ? sources.length
    : activeTab === 'hypotheses' ? letterHypotheses.length
      : activeTab === 'experiments' ? experiments.length
        : heritageGenerations.length;
  const exportPayload = useMemo(() => JSON.stringify({
    schema: 'miyaar-research-notebook/v2',
    exportedAt: new Date().toISOString(),
    sources,
    experiments,
    trainingExamples,
    modelTrainedAt,
    letterHypotheses,
    heritageGenerations,
    heritageModelTraining,
  }, null, 2), [sources, experiments, trainingExamples, modelTrainedAt, letterHypotheses, heritageGenerations, heritageModelTraining]);

  useEffect(() => {
    if (theorySources.length === 0) {
      if (hypothesisSourceId !== null) setHypothesisSourceId(null);
      return;
    }
    if (!hypothesisSourceId || !theorySources.some((source) => source.id === hypothesisSourceId)) {
      setHypothesisSourceId(theorySources[0]?.id ?? null);
    }
  }, [hypothesisSourceId, theorySources]);

  const saveSource = () => {
    if (!ready) return;
    if (!author.trim() || !book.trim() || !excerpt.trim()) {
      setFormError('أدخل اسم المؤلف والكتاب والمقتطف قبل الحفظ.');
      return;
    }
    addSource({
      author: author.trim(),
      book: book.trim(),
      edition: edition.trim(),
      location: location.trim(),
      category,
      excerpt: excerpt.trim(),
      interpretation: interpretation.trim(),
      computationalHypothesis: computationalHypothesis.trim(),
    });
    setAuthor('');
    setBook('');
    setEdition('');
    setLocation('');
    setExcerpt('');
    setInterpretation('');
    setComputationalHypothesis('');
    setFormError('');
    setActiveTab('sources');
  };

  const saveLetterHypothesis = () => {
    if (!ready) return;
    const letters = extractArabicLetterSequence(hypothesisLetter.trim());
    const motifs = Array.from(new Set(hypothesisMotifs.split(/[,،;؛\n]+/u).map((motif) => motif.trim()).filter(Boolean)));
    if (!selectedHypothesisSource) {
      setHypothesisError('أضف مصدراً من فئة «دلالة الحروف» واختره أولاً.');
      return;
    }
    if (letters.length !== 1) {
      setHypothesisError('أدخل حرفاً عربياً واحداً فقط في خانة الحرف.');
      return;
    }
    if (!hypothesisInterpretation.trim() || motifs.length === 0) {
      setHypothesisError('أدخل تفسير الباحث وعنصراً دلالياً واحداً على الأقل.');
      return;
    }
    addLetterHypothesis({
      sourceId: selectedHypothesisSource.id,
      letter: letters[0] as string,
      scope: hypothesisScope,
      position: hypothesisScope === 'independent-letter' ? 'any' : hypothesisPosition,
      researcherInterpretation: hypothesisInterpretation.trim(),
      semanticMotifs: motifs,
      modelReady: hypothesisModelReady,
    });
    setHypothesisLetter('');
    setHypothesisInterpretation('');
    setHypothesisMotifs('');
    setHypothesisModelReady(false);
    setHypothesisError('');
    setActiveTab('hypotheses');
  };

  const deleteRecord = (kind: NotebookTab, id: string) => {
    const remove = () => {
      if (kind === 'sources') deleteSource(id);
      else if (kind === 'experiments') deleteExperiment(id);
      else if (kind === 'hypotheses') deleteLetterHypothesis(id);
      else deleteHeritageGeneration(id);
    };
    const message = kind === 'sources'
      ? 'سيُحذف المصدر والفرضيات المرتبطة به؛ تبقى سجلات التوليد المحفوظة مع لقطات مصادرها.'
      : 'هل تريد حذف هذا السجل من الجهاز؟';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) remove();
    } else {
      Alert.alert('حذف السجل', message, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: remove },
      ]);
    }
  };

  const exportNotebook = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(exportPayload);
        window.alert('نُسخت بيانات الدفتر بصيغة JSON.');
      } else {
        await Share.share({ title: 'دفتر أبحاث معيار', message: exportPayload });
      }
    } catch {
      if (Platform.OS === 'web') window.alert(exportPayload);
      else Alert.alert('تعذّر التصدير', 'حاول مشاركة دفتر البحث مرة أخرى.');
    }
  };

  return (
    <AppShell active="notebook">
      <View style={styles.pageHeading}>
        <Badge tone="green">مختبر البحث · محلي</Badge>
        <Text style={styles.pageTitle}>دفتر التراث والتجربة</Text>
        <Text style={styles.pageCopy}>وثّق النص العربي كما ورد في مصدره، وافصل بين الاقتباس وتأويلك والتمثيل الحاسوبي. تُحفظ السجلات على هذا الجهاز فقط.</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="مصادر موثّقة" value={formatArabicNumber(sources.length)} note="نصوص من كتب" accent={colors.teal} />
        <MetricCard label="فرضيات مجازة" value={formatArabicNumber(modelReadyHypothesisCount)} note="مرشّحة للتدريب" accent={colors.violet} />
        <MetricCard label="توليدات محفوظة" value={formatArabicNumber(heritageGenerations.length)} note="مع provenance" accent={colors.gold} />
      </View>

      {storageError ? (
        <View style={styles.storageWarning}>
          <Text style={styles.storageWarningTitle}>تعذّر الوصول إلى التخزين المحلي.</Text>
          <Text style={styles.storageWarningText}>صدّر سجلاتك فوراً إن كانت ظاهرة، ثم أعد فتح التطبيق أو تحقّق من إعدادات الجهاز.</Text>
        </View>
      ) : null}

      {activeTab === 'sources' ? (
      <Card style={styles.formCard}>
        <SectionHeading eyebrow="سجلّ مصدر أولي" title="أضف نصاً من كتاب عربي" trailing={<Badge tone="dark">محفوظ محلياً</Badge>} />
        {!ready ? (
          <View style={styles.loadingRow}><ActivityIndicator color={colors.teal} /><Text style={styles.loadingText}>جارٍ تحميل دفتر البحث…</Text></View>
        ) : null}
        <View style={styles.fieldRow}>
          <View style={styles.flexField}><FormField label="المؤلف *" value={author} onChangeText={setAuthor} placeholder="مثال: ابن جني" /></View>
          <View style={styles.flexField}><FormField label="الكتاب *" value={book} onChangeText={setBook} placeholder="مثال: الخصائص" /></View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.flexField}><FormField label="الطبعة / المحقق" value={edition} onChangeText={setEdition} placeholder="دار النشر، المحقق، السنة" /></View>
          <View style={styles.flexField}><FormField label="الباب / الصفحة" value={location} onChangeText={setLocation} placeholder="الباب، الجزء، الصفحة" /></View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>نوع الدعوى التراثية</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((option) => {
              const selected = option === category;
              return (
                <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setCategory(option)} style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{CATEGORY_LABELS[option]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <FormField label="النص المنقول كما في المصدر *" value={excerpt} onChangeText={setExcerpt} placeholder="أدخل النص بنفس ألفاظه، ولا تستبدله بالتفسير…" multiline />
        <FormField label="تأويل الباحث / سياق القول" value={interpretation} onChangeText={setInterpretation} placeholder="ما الذي يقوله النص؟ هل يذكر المؤلف خلافاً أو قيداً؟" multiline />
        <FormField label="الترجمة الحاسوبية / التنبؤ" value={computationalHypothesis} onChangeText={setComputationalHypothesis} placeholder="ما السمة أو العلاقة التي تريد تمثيلها واختبارها؟" multiline />
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <PrimaryButton label="احفظ المصدر في الدفتر" onPress={saveSource} disabled={!ready} trailing="＋" />
        <Text style={styles.privacyNote}>لا يُرفَع النص إلى خادم. تحقّق من الطبعة والصفحة بنفسك؛ لا يضيف التطبيق اقتباسات تلقائية أو أرقام صفحات.</Text>
      </Card>
      ) : activeTab === 'hypotheses' ? (
        <Card style={styles.formCard}>
          <SectionHeading eyebrow="تمثيل باحث قابل للتدقيق" title="أضف فرضية لمعنى حرف" trailing={<Badge tone="gold">ليست اقتباساً</Badge>} />
          {!ready ? <View style={styles.loadingRow}><ActivityIndicator color={colors.teal} /><Text style={styles.loadingText}>جارٍ تحميل دفتر البحث…</Text></View> : null}
          {theorySources.length ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>المصدر الموثّق *</Text>
              <HorizontalScroll>
                {theorySources.map((source) => {
                  const selected = source.id === hypothesisSourceId;
                  return (
                    <Pressable key={source.id} onPress={() => setHypothesisSourceId(source.id)} style={[styles.sourceChip, selected && styles.sourceChipSelected]}>
                      <Text numberOfLines={1} style={[styles.sourceChipText, selected && styles.sourceChipTextSelected]}>{source.book} · {source.author}</Text>
                    </Pressable>
                  );
                })}
              </HorizontalScroll>
              {selectedHypothesisSource ? (
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteLabel}>النص المنقول من سجل المصدر</Text>
                  <Text selectable style={styles.quoteText}>{selectedHypothesisSource.excerpt}</Text>
                  <Text style={styles.recordCitation}>{selectedHypothesisSource.location || 'موضع غير محدد'} · {selectedHypothesisSource.edition}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.formError}>لا يوجد مصدر من فئة «دلالة الحروف». احفظ اقتباساً موثقاً بهذه الفئة أولاً.</Text>
          )}
          <View style={styles.fieldRow}>
            <View style={styles.flexField}><FormField label="الحرف العربي *" value={hypothesisLetter} onChangeText={setHypothesisLetter} placeholder="مثال إدخال: ب" /></View>
            <View style={styles.flexField}>
              <Text style={styles.fieldLabel}>مجال الدعوى</Text>
              <View style={styles.scopeOptions}>
                {(Object.keys(SCOPE_LABELS) as LetterMeaningScope[]).map((option) => {
                  const selected = option === hypothesisScope;
                  return (
                    <Pressable key={option} onPress={() => { setHypothesisScope(option); if (option === 'independent-letter') setHypothesisPosition('any'); }} style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                      <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{SCOPE_LABELS[option]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          {hypothesisScope === 'root-context' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>موضع الحرف كما تدل عليه الفرضية</Text>
              <View style={styles.categoryRow}>
                {(Object.keys(POSITION_LABELS) as LetterPosition[]).map((option) => {
                  const selected = option === hypothesisPosition;
                  return (
                    <Pressable key={option} onPress={() => setHypothesisPosition(option)} style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                      <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{POSITION_LABELS[option]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.privacyNote}>«أي موضع» قاعدة عامة؛ تُستخدم فقط إذا لم توجد فرضية أدق لأول الحرف أو وسطه أو آخره.</Text>
            </View>
          ) : null}
          <FormField label="تفسير الباحث / التمثيل التشغيلي *" value={hypothesisInterpretation} onChangeText={setHypothesisInterpretation} placeholder="اكتب فهمك أنت، ولا تضعه بين علامتي اقتباس كأنه قول المؤلف…" multiline />
          <FormField label="عناصر دلالية تشغيلية يدرّب عليها النموذج *" value={hypothesisMotifs} onChangeText={setHypothesisMotifs} placeholder="عنصر أو بدائل مفصولة بفاصلة عربية؛ ستبقى بدائل لا معنى مدمجاً" multiline />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: hypothesisModelReady }} onPress={() => setHypothesisModelReady((value) => !value)} style={styles.reviewToggle}>
            <View style={[styles.checkbox, hypothesisModelReady && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{hypothesisModelReady ? '✓' : ''}</Text></View>
            <Text style={styles.reviewToggleText}>راجعت الربط بين الاقتباس وتفسير الباحث، وأجيز إدخال هذه الفرضية في النموذج.</Text>
          </Pressable>
          {hypothesisError ? <Text style={styles.formError}>{hypothesisError}</Text> : null}
          <PrimaryButton label="احفظ الفرضية المرتبطة بالمصدر" onPress={saveLetterHypothesis} disabled={!ready || theorySources.length === 0} trailing="＋" />
          <Text style={styles.privacyNote}>يُحفظ النص المنقول في سجل المصدر، والتفسير والعناصر التشغيلية في خانات منفصلة. لا يقرأ النموذج الاقتباس آلياً؛ ولا يتدرّب على العناصر إلا بعد تفعيل الفرضية صراحةً.</Text>
        </Card>
      ) : null}

      <View style={styles.listHeader}>
        <View style={styles.segmentControl}>
          {([
            { key: 'sources', label: `مصادر ${formatArabicNumber(sources.length)}` },
            { key: 'hypotheses', label: `فرضيات ${formatArabicNumber(letterHypotheses.length)}` },
            { key: 'experiments', label: `تجارب ${formatArabicNumber(experiments.length)}` },
            { key: 'generations', label: `توليد ${formatArabicNumber(heritageGenerations.length)}` },
          ] as Array<{ key: NotebookTab; label: string }>).map((tab) => (
            <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} onPress={() => setActiveTab(tab.key)} style={[styles.segmentButton, activeTab === tab.key && styles.segmentButtonActive]}>
              <Text style={[styles.segmentText, activeTab === tab.key && styles.segmentTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
        <SmallAction label="تصدير JSON" onPress={exportNotebook} />
      </View>

      {!ready ? (
        <Card><Text style={styles.emptyText}>يُحمّل الدفتر المحفوظ…</Text></Card>
      ) : activeRecordCount === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMark}>{activeTab === 'sources' ? '١' : activeTab === 'hypotheses' ? '٢' : activeTab === 'experiments' ? '٣' : '٤'}</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'sources' ? 'ابدأ بتوثيق مصدر، لا بذاكرة غير موثقة.'
              : activeTab === 'hypotheses' ? 'سجّل فرضية مرتبطة بمقتطف مصدر.'
                : activeTab === 'experiments' ? 'احفظ مقارنة من تبويب المقارنة.'
                  : 'ستظهر هنا المخرجات التي تحفظها من تبويب التوليد.'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'sources' ? 'أدخل الطبعة والموضع والنص المنقول، ثم افصل تأويلك عنه.'
              : activeTab === 'hypotheses' ? 'لكل فرضية حرف ومجال وتأويل وعناصر دلالية؛ لا تدخل النموذج قبل تفعيلها صراحةً.'
                : activeTab === 'experiments' ? 'كل مقارنة محفوظة تتضمن السؤال والأشكال والجذور والأوزان والمقاييس.'
                  : 'يحفظ سجل التوليد لقطة من الاقتباس والفرضيات المستخدمة.'}
          </Text>
        </View>
      ) : activeTab === 'sources' ? (
        sources.map((item) => <SourceCard key={item.id} item={item} onDelete={() => deleteRecord('sources', item.id)} />)
      ) : activeTab === 'hypotheses' ? (
        letterHypotheses.map((item) => (
          <HypothesisCard
            key={item.id}
            item={item}
            source={sources.find((source) => source.id === item.sourceId)}
            onDelete={() => deleteRecord('hypotheses', item.id)}
            onToggleModelReady={() => setLetterHypothesisModelReady(item.id, !item.modelReady)}
          />
        ))
      ) : activeTab === 'experiments' ? (
        experiments.map((item) => <ExperimentCard key={item.id} item={item} onDelete={() => deleteRecord('experiments', item.id)} />)
      ) : (
        heritageGenerations.map((item) => <GenerationCard key={item.id} item={item} onDelete={() => deleteRecord('generations', item.id)} />)
      )}

      <View style={styles.provenanceCallout}>
        <Text style={styles.provenanceTitle}>قاعدة الدفتر</Text>
        <Text style={styles.provenanceText}>الاقتباس، وتأويل الباحث، والعناصر التي يتعلمها النموذج، والناتج المولّد أربع طبقات منفصلة. لا ينسب الدفتر الناتج إلى المؤلف، ولا يعني تسجيل الفرضية إثباتها.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  pageHeading: { gap: 7, alignItems: 'flex-start', paddingHorizontal: 2 },
  pageTitle: { color: colors.ink, fontSize: 27, lineHeight: 36, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  pageCopy: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 650, textAlign: 'right', writingDirection: 'rtl' },
  metricsRow: { flexDirection: 'row-reverse', gap: 8 },
  storageWarning: { borderRadius: 14, backgroundColor: colors.coralSoft, padding: 13, gap: 4 },
  storageWarningTitle: { color: '#7C3F30', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  storageWarningText: { color: '#7C4D41', fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  formCard: { gap: 13 },
  loadingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  loadingText: { color: colors.muted, fontSize: 10 },
  fieldRow: { flexDirection: 'row-reverse', gap: 9 },
  flexField: { flex: 1, minWidth: 0 },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#FAFBF7', paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 12, writingDirection: 'rtl' },
  inputMultiline: { minHeight: 82, lineHeight: 20, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  scopeOptions: { gap: 5, alignItems: 'flex-start' },
  sourceChip: { maxWidth: 230, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 10, paddingVertical: 7 },
  sourceChipSelected: { borderColor: colors.forest, backgroundColor: colors.forest },
  sourceChipText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  sourceChipTextSelected: { color: colors.mint },
  categoryChip: { borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 7 },
  reviewToggle: { flexDirection: 'row-reverse', gap: 9, alignItems: 'flex-start', backgroundColor: colors.goldSoft, borderRadius: 12, padding: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.gold, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  checkboxChecked: { backgroundColor: colors.forest, borderColor: colors.forest },
  checkboxMark: { color: colors.mint, fontSize: 13, fontWeight: '900' },
  reviewToggleText: { flex: 1, color: '#5F4827', fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  categoryChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  categoryTextSelected: { color: colors.mint },
  formError: { color: colors.coral, fontSize: 10, textAlign: 'right', fontWeight: '700' },
  privacyNote: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  listHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  segmentControl: { flexDirection: 'row-reverse', flexWrap: 'wrap', padding: 3, borderRadius: 14, backgroundColor: colors.surfaceSoft, gap: 3, flex: 1 },
  segmentButton: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 11 },
  segmentButtonActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  segmentTextActive: { color: colors.forest, fontWeight: '900' },
  emptyState: { backgroundColor: colors.surfaceSoft, borderRadius: 20, padding: 20, alignItems: 'flex-start', gap: 7 },
  emptyMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.mint, color: colors.forest, fontSize: 16, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  emptyText: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  recordCard: { gap: 10 },
  recordHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  hypothesisHeaderBadges: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5 },
  hypothesisLetter: { color: colors.forest, fontSize: 22, fontWeight: '900' },
  recordDate: { color: colors.muted, fontSize: 9 },
  recordTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  recordCitation: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  linkedSource: { color: colors.teal, fontSize: 9, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  quoteBox: { borderRightWidth: 3, borderRightColor: colors.teal, backgroundColor: '#F7F8F3', borderRadius: 12, padding: 12, gap: 6 },
  quoteLabel: { color: colors.teal, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  quoteText: { color: colors.ink, fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  recordDetail: { gap: 4 },
  motifsBox: { backgroundColor: colors.mintSoft, borderRadius: 12, padding: 10, gap: 4 },
  generatedRow: { backgroundColor: '#F7F8F3', borderRadius: 11, padding: 10, gap: 4 },
  generatedScore: { color: colors.violet, fontSize: 8, fontWeight: '700', textAlign: 'right' },
  detailLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  detailText: { color: colors.ink, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  hypothesisBox: { backgroundColor: colors.mintSoft, borderRadius: 12, padding: 10, gap: 4 },
  recordActions: { flexDirection: 'row-reverse', paddingTop: 3 },
  experimentPair: { flexDirection: 'row-reverse', gap: 10, alignItems: 'stretch' },
  experimentSide: { flex: 1, gap: 4 },
  pairLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', textAlign: 'right' },
  pairForm: { color: colors.forest, fontSize: 19, fontWeight: '800' },
  pairMeta: { color: colors.muted, fontSize: 8, textAlign: 'right', writingDirection: 'rtl' },
  pairDivider: { width: 1, backgroundColor: colors.line },
  savedMetrics: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  savedMetric: { minWidth: 62, borderRadius: 10, backgroundColor: colors.mintSoft, paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
  distanceMetric: { minWidth: 72, borderRadius: 10, backgroundColor: colors.violetSoft, paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
  savedMetricLabel: { color: colors.muted, fontSize: 8, textAlign: 'right' },
  savedMetricValue: { color: colors.forest, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  provenanceCallout: { backgroundColor: colors.goldSoft, borderRadius: 16, borderWidth: 1, borderColor: '#E9D8B8', padding: 14, gap: 4 },
  provenanceTitle: { color: '#5F4827', fontSize: 11, fontWeight: '900', textAlign: 'right' },
  provenanceText: { color: '#6C5837', fontSize: 9, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
});

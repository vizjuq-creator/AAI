import React, { useMemo, useState } from 'react';
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
  MetricCard,
  PrimaryButton,
  SectionHeading,
  SmallAction,
} from '../components/Shared';
import {
  type ComparisonExperiment,
  type HeritageSource,
  type SourceCategory,
  useResearchNotebook,
} from '../context/ResearchNotebookContext';
import { formatArabicNumber } from '../core/arabicLab';
import { colors, radii } from '../theme';

type NotebookTab = 'sources' | 'experiments';

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  phonetics: 'مخارج / صفات',
  'letter-semantics': 'دلالة الحروف',
  morphology: 'جذر / اشتقاق',
  other: 'أخرى',
};

const CATEGORIES: SourceCategory[] = ['letter-semantics', 'phonetics', 'morphology', 'other'];

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
  const { sources, experiments, trainingExamples, modelTrainedAt, ready, storageError, addSource, deleteSource, deleteExperiment } = useResearchNotebook();
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

  const records = activeTab === 'sources' ? sources : experiments;
  const exportPayload = useMemo(() => JSON.stringify({
    schema: 'miyaar-research-notebook/v1',
    exportedAt: new Date().toISOString(),
    sources,
    experiments,
    trainingExamples,
    modelTrainedAt,
  }, null, 2), [sources, experiments, trainingExamples, modelTrainedAt]);

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

  const deleteRecord = (kind: NotebookTab, id: string) => {
    const remove = () => kind === 'sources' ? deleteSource(id) : deleteExperiment(id);
    if (Platform.OS === 'web') {
      if (window.confirm('حذف هذا السجل من دفتر البحث؟')) remove();
    } else {
      Alert.alert('حذف السجل', 'هل تريد حذف هذا السجل من الجهاز؟', [
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
        <MetricCard label="تجارب مقارنة" value={formatArabicNumber(experiments.length)} note="من شاشة المقارنة" accent={colors.gold} />
        <MetricCard label="أمثلة تدريب" value={formatArabicNumber(trainingExamples.length)} note={modelTrainedAt ? 'نموذج مدرّب' : 'بيانات محلية'} accent={colors.violet} />
      </View>

      {storageError ? (
        <View style={styles.storageWarning}>
          <Text style={styles.storageWarningTitle}>تعذّر الوصول إلى التخزين المحلي.</Text>
          <Text style={styles.storageWarningText}>صدّر سجلاتك فوراً إن كانت ظاهرة، ثم أعد فتح التطبيق أو تحقّق من إعدادات الجهاز.</Text>
        </View>
      ) : null}

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

      <View style={styles.listHeader}>
        <View style={styles.segmentControl}>
          <Pressable onPress={() => setActiveTab('sources')} style={[styles.segmentButton, activeTab === 'sources' && styles.segmentButtonActive]}>
            <Text style={[styles.segmentText, activeTab === 'sources' && styles.segmentTextActive]}>مصادر ({formatArabicNumber(sources.length)})</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('experiments')} style={[styles.segmentButton, activeTab === 'experiments' && styles.segmentButtonActive]}>
            <Text style={[styles.segmentText, activeTab === 'experiments' && styles.segmentTextActive]}>تجارب ({formatArabicNumber(experiments.length)})</Text>
          </Pressable>
        </View>
        <SmallAction label="تصدير JSON" onPress={exportNotebook} />
      </View>

      {!ready ? (
        <Card><Text style={styles.emptyText}>يُحمّل الدفتر المحفوظ…</Text></Card>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMark}>{activeTab === 'sources' ? '١' : '٢'}</Text>
          <Text style={styles.emptyTitle}>{activeTab === 'sources' ? 'ابدأ بتوثيق مصدر، لا بذاكرة غير موثقة.' : 'احفظ مقارنة من تبويب المقارنة.'}</Text>
          <Text style={styles.emptyText}>{activeTab === 'sources' ? 'أضف نصاً من الطبعة التي تستخدمها، ثم سجّل تأويلك منفصلاً عن الاقتباس.' : 'كل مقارنة محفوظة تتضمن السؤال، والأشكال، والجذور، والأوزان، والمقاييس.'}</Text>
        </View>
      ) : activeTab === 'sources' ? (
        (records as HeritageSource[]).map((item) => <SourceCard key={item.id} item={item} onDelete={() => deleteRecord('sources', item.id)} />)
      ) : (
        (records as ComparisonExperiment[]).map((item) => <ExperimentCard key={item.id} item={item} onDelete={() => deleteRecord('experiments', item.id)} />)
      )}

      <View style={styles.provenanceCallout}>
        <Text style={styles.provenanceTitle}>قاعدة الدفتر</Text>
        <Text style={styles.provenanceText}>النص المنقول، وتأويل الباحث، والترجمة الحاسوبية ثلاث طبقات منفصلة. سجلّ المصدر لا يعني أن النموذج أثبت الدعوى؛ سجلّ التجربة يوثّق ما اختُبر فقط.</Text>
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
  categoryChip: { borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 7 },
  categoryChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  categoryTextSelected: { color: colors.mint },
  formError: { color: colors.coral, fontSize: 10, textAlign: 'right', fontWeight: '700' },
  privacyNote: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  listHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  segmentControl: { flexDirection: 'row-reverse', padding: 3, borderRadius: 14, backgroundColor: colors.surfaceSoft, gap: 3 },
  segmentButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11 },
  segmentButtonActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  segmentTextActive: { color: colors.forest, fontWeight: '900' },
  emptyState: { backgroundColor: colors.surfaceSoft, borderRadius: 20, padding: 20, alignItems: 'flex-start', gap: 7 },
  emptyMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.mint, color: colors.forest, fontSize: 16, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  emptyText: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  recordCard: { gap: 10 },
  recordHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  recordDate: { color: colors.muted, fontSize: 9 },
  recordTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  recordCitation: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  linkedSource: { color: colors.teal, fontSize: 9, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  quoteBox: { borderRightWidth: 3, borderRightColor: colors.teal, backgroundColor: '#F7F8F3', borderRadius: 12, padding: 12, gap: 6 },
  quoteLabel: { color: colors.teal, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  quoteText: { color: colors.ink, fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  recordDetail: { gap: 4 },
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

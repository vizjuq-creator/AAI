import React from 'react';
import {
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
  Eyebrow,
  Label,
  MetricCard,
  PrimaryButton,
  SectionHeading,
  TraitPill,
} from '../components/Shared';
import { useLab } from '../context/LabContext';
import { FEATURE_LABELS, formatArabicNumber } from '../core/arabicLab';
import { colors, radii } from '../theme';

const QUICK_EXAMPLES = ['كَتَبَ', 'كِتَاب', 'مَكْتَبَة', 'مَكْتُوب'];

export default function AnalyzeScreen() {
  const { text, setText, analysis, runAnalysis } = useLab();

  return (
    <AppShell active="analyze">
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <Badge tone="dark">ورشة ٠١ · البنية</Badge>
          <View style={styles.heroStatus}>
            <View style={styles.heroStatusDot} />
            <Text style={styles.heroStatusText}>يعمل دون اتصال</Text>
          </View>
        </View>
        <Eyebrow light>من الحرف إلى الفرضية</Eyebrow>
        <Text style={styles.heroTitle}>اختبر العربية،{ '\n' }ولا تفترض النتيجة.</Text>
        <Text style={styles.heroCopy}>
          افحص السمات الصوتية، وجرّب تفكيك الجذر والوزن، ثم قارن تمثيلات ثنائية قابلة لإعادة الإنتاج.
        </Text>
        <View style={styles.heroFacts}>
          <View style={styles.heroFact}>
            <Text style={styles.heroFactValue}>٠٨</Text>
            <Text style={styles.heroFactLabel}>سمات تقريبية</Text>
          </View>
          <View style={styles.heroFactDivider} />
          <View style={styles.heroFact}>
            <Text style={styles.heroFactValue}>١٠٢٤</Text>
            <Text style={styles.heroFactLabel}>بت للتجربة</Text>
          </View>
          <View style={styles.heroFactDivider} />
          <View style={styles.heroFact}>
            <Text style={styles.heroFactValue}>محلي</Text>
            <Text style={styles.heroFactLabel}>لا إرسال للنص</Text>
          </View>
        </View>
      </View>

      <Card style={styles.inputCard}>
        <View style={styles.inputHeading}>
          <View style={styles.inputHeadingCopy}>
            <Eyebrow>ابدأ بعينة قصيرة</Eyebrow>
            <Text style={styles.cardTitle}>مساحة التحليل</Text>
          </View>
          <View style={styles.stepCircle}>
            <Text style={styles.stepCircleText}>١</Text>
          </View>
        </View>
        <Label>أدخل كلمة أو جملة عربية</Label>
        <TextInput
          accessibilityLabel="النص العربي المراد تحليله"
          value={text}
          onChangeText={setText}
          multiline
          textAlign="right"
          textAlignVertical="top"
          placeholder="مثال: كَتَبَ، كِتَاب، مَكْتَبَة"
          placeholderTextColor="#89938C"
          style={styles.textInput}
          autoCorrect={false}
          spellCheck={false}
          maxLength={1200}
        />
        <View style={styles.quickExamples}>
          {QUICK_EXAMPLES.map((example) => (
            <Pressable
              key={example}
              accessibilityRole="button"
              onPress={() => setText(example)}
              style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
            >
              <ArabicText style={styles.quickChipText}>{example}</ArabicText>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="حلّل النص محلياً" onPress={runAnalysis} disabled={!text.trim()} />
        <Text style={styles.microcopy}>المحرك الحالي يستخدم جدول سمات وقائمة أمثلة صغيرة؛ ليس محلّلاً صرفياً شاملاً.</Text>
      </Card>

      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderCopy}>
          <Eyebrow>نتيجة قابلة للفحص</Eyebrow>
          <Text style={styles.sectionTitle}>لقطة من التجربة</Text>
        </View>
        <Badge tone="gold">نموذج أولي</Badge>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="كلمات" value={formatArabicNumber(analysis.words.length)} note="بعد فصل الوقف" accent={colors.teal} />
        <MetricCard label="حروف مميزة" value={formatArabicNumber(analysis.letters.length)} note="بعد إزالة التشكيل" accent={colors.coral} />
        <MetricCard label="علامات تشكيل" value={formatArabicNumber(analysis.diacriticCount)} note="رُصدت في الإدخال" accent={colors.gold} />
      </View>

      <Card>
        <SectionHeading eyebrow="شفافية المعالجة" title="قبل / بعد التطبيع" trailing={<Badge tone="green">قابل للتدقيق</Badge>} />
        <View style={styles.normalizationBox}>
          <Text style={styles.normalizationLabel}>بعد إزالة التشكيل وطيّ بعض أشكال الألف</Text>
          <ArabicText style={styles.normalizedText}>{analysis.normalizedText || '—'}</ArabicText>
        </View>
        <Text style={styles.noteText}>يظل النص الأصلي محفوظاً في حقل الإدخال. التطبيع هنا لأغراض المطابقة التجريبية فقط وقد يدمج فروقاً إملائية مهمّة.</Text>
      </Card>

      <Card>
        <SectionHeading eyebrow="قائمة مصغّرة · ليست حكماً لغوياً" title="مرشّحات الجذر والوزن" />
        <View style={styles.wordList}>
          {analysis.words.length === 0 ? (
            <Text style={styles.noteText}>أدخل نصاً عربياً ثم شغّل التحليل.</Text>
          ) : analysis.words.map((word, index) => (
            <View key={`${word.raw}-${index}`} style={[styles.wordRow, index > 0 && styles.wordRowBorder]}>
              <View style={styles.wordMain}>
                <ArabicText style={styles.wordRaw}>{word.raw}</ArabicText>
                <Text style={styles.wordNormalized}>الموحّد: {word.normalized}</Text>
              </View>
              <View style={styles.wordDetails}>
                {word.candidates.length > 0 ? word.candidates.map((candidate, candidateIndex) => (
                  <View key={`${candidate.patternCode}-${candidateIndex}`} style={styles.candidateLine}>
                    <View style={styles.candidateChip}>
                      <Text style={styles.candidateLabel}>الجذر</Text>
                      <ArabicText style={styles.candidateValue}>{candidate.root}</ArabicText>
                    </View>
                    <View style={styles.candidateChip}>
                      <Text style={styles.candidateLabel}>الوزن</Text>
                      <ArabicText style={styles.candidateValue}>{candidate.pattern}</ArabicText>
                    </View>
                  </View>
                )) : (
                  <Text style={styles.unmatchedText}>لا توجد قاعدة في العيّنة المضمّنة.</Text>
                )}
              </View>
              <View style={styles.wordEvidence}>
                <Badge tone={word.evidence === 'marked-example' ? 'green' : word.evidence === 'bare-example' ? 'gold' : 'neutral'}>
                  {word.evidence === 'marked-example' ? 'مثال مشكول' : word.evidence === 'bare-example' ? 'مطابقة غير مشكولة' : 'غير محسوم'}
                </Badge>
                {word.candidates.length > 1 ? <Text style={styles.ambiguityNote}>الرسم غير المشكول يحتمل أكثر من تحليل</Text> : null}
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.noteText}>لا توجد هنا قواعد اشتقاق عامة أو بيانات تدريب؛ المرشّحات أعلاه معجم أمثلة تحريرياً محدود.</Text>
      </Card>

      <Card>
        <SectionHeading eyebrow="الركيزة ٠١ · جدول يدوي" title="المصفوفة الصواتية المصغّرة" trailing={<Badge tone="dark">٨ بت</Badge>} />
        <Text style={styles.noteText}>ترميز تقريبي لسمات نطقية واسعة، لا لسمات معنوية. قد يعتمد وصف بعض الحروف على السياق واللهجة.</Text>
        <View style={styles.bitOrderBox}>
          <Text style={styles.bitOrderLabel}>ترتيب البتات من اليسار</Text>
          <View style={styles.traitWrap}>
            {FEATURE_LABELS.map((label, index) => <TraitPill key={label} tone={index === 3 ? 'gold' : index === 7 ? 'coral' : 'neutral'}>{`${index + 1} · ${label}`}</TraitPill>)}
          </View>
        </View>
        <View style={styles.letterTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableLetter]}>الحرف</Text>
            <Text style={[styles.tableHeaderText, styles.tableFeatures]}>السمات المفعّلة</Text>
            <Text style={[styles.tableHeaderText, styles.tableBits]}>البتات</Text>
          </View>
          {analysis.letters.slice(0, 12).map((letter) => {
            const activeTraits = FEATURE_LABELS.filter((_, index) => letter.bits[index]);
            return (
              <View key={letter.char} style={styles.tableRow}>
                <View style={styles.letterCell}>
                  <ArabicText style={styles.letterGlyph}>{letter.char}</ArabicText>
                  {letter.count > 1 ? <Text style={styles.letterCount}>×{formatArabicNumber(letter.count)}</Text> : null}
                </View>
                <View style={styles.activeFeatures}>
                  {activeTraits.length ? activeTraits.map((trait) => <TraitPill key={trait} tone="green">{trait}</TraitPill>) : <Text style={styles.unclassified}>غير ممثّل في هذه السمات</Text>}
                </View>
                <Text style={styles.bitString}>{letter.bits.map((bit) => (bit ? '1' : '0')).join('')}</Text>
              </View>
            );
          })}
          {analysis.letters.length > 12 ? <Text style={styles.tableRemainder}>تظهر أول ١٢ حرفاً مختلفاً فقط.</Text> : null}
        </View>
      </Card>

      <View style={styles.bottomCallout}>
        <Text style={styles.calloutMark}>↗</Text>
        <View style={styles.calloutCopy}>
          <Text style={styles.calloutTitle}>الخطوة التالية: قارن تمثيلين</Text>
          <Text style={styles.calloutText}>في تبويب المقارنة، افحص ما تحفظه عملية XOR وما لا تحفظه.</Text>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, borderRadius: 28, padding: 21, overflow: 'hidden', gap: 12 },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: colors.forestMid, top: -95, left: -55, opacity: 0.8 },
  heroTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  heroStatus: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  heroStatusText: { color: '#D1E1D7', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 42, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  heroCopy: { color: '#D0DFD6', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', maxWidth: 520 },
  heroFacts: { marginTop: 5, borderTopWidth: 1, borderTopColor: '#31564A', paddingTop: 13, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  heroFact: { flex: 1, alignItems: 'center', gap: 2 },
  heroFactValue: { color: colors.mint, fontSize: 17, fontWeight: '800' },
  heroFactLabel: { color: '#C1D4C8', fontSize: 9, textAlign: 'center' },
  heroFactDivider: { width: 1, height: 30, backgroundColor: '#31564A' },
  inputCard: { gap: 12 },
  inputHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  inputHeadingCopy: { gap: 3, alignItems: 'flex-start' },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'right' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' },
  stepCircleText: { color: colors.forest, fontWeight: '800', fontSize: 14 },
  textInput: { minHeight: 110, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: '#FAFBF7', paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 17, lineHeight: 28, writingDirection: 'rtl' },
  quickExamples: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  quickChip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.surface },
  quickChipPressed: { backgroundColor: colors.mintSoft, borderColor: '#B6CF78' },
  quickChipText: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  microcopy: { color: '#7F8A82', fontSize: 10, lineHeight: 16, textAlign: 'right' },
  resultHeader: { flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 3 },
  resultHeaderCopy: { gap: 3, alignItems: 'flex-start' },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', textAlign: 'right' },
  metricsRow: { flexDirection: 'row-reverse', gap: 8 },
  normalizationBox: { backgroundColor: colors.forestDeep, borderRadius: 15, padding: 14, gap: 8 },
  normalizationLabel: { color: '#B9CFC3', fontSize: 10, textAlign: 'right' },
  normalizedText: { color: colors.mint, fontSize: 20, lineHeight: 31, fontWeight: '700' },
  noteText: { color: colors.muted, fontSize: 11, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  wordList: { borderTopWidth: 1, borderColor: colors.line },
  wordRow: { paddingVertical: 13, gap: 10 },
  wordRowBorder: { borderTopWidth: 1, borderColor: '#EDF0EA' },
  wordMain: { flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  wordRaw: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  wordNormalized: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  wordDetails: { gap: 6 },
  candidateLine: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  candidateChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, borderRadius: 11, backgroundColor: colors.surfaceSoft, paddingVertical: 6, paddingHorizontal: 9 },
  candidateLabel: { color: colors.muted, fontSize: 9 },
  candidateValue: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  wordEvidence: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ambiguityNote: { color: colors.gold, fontSize: 10, textAlign: 'right' },
  unmatchedText: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  bitOrderBox: { backgroundColor: '#F7F8F3', borderRadius: 14, padding: 12, gap: 9 },
  bitOrderLabel: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  traitWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  letterTable: { borderTopWidth: 1, borderColor: colors.line },
  tableHeader: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderColor: colors.line, gap: 8 },
  tableHeaderText: { color: colors.muted, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  tableLetter: { width: 52 },
  tableFeatures: { flex: 1 },
  tableBits: { width: 66, textAlign: 'left' },
  tableRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderColor: '#EDF0EA', gap: 8 },
  letterCell: { width: 52, flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  letterGlyph: { width: 29, height: 29, backgroundColor: colors.mintSoft, borderRadius: 10, color: colors.forest, fontSize: 17, fontWeight: '800', textAlign: 'center', textAlignVertical: 'center' },
  letterCount: { color: colors.muted, fontSize: 8 },
  activeFeatures: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 },
  bitString: { width: 66, color: colors.teal, fontSize: 10, fontFamily: 'monospace', textAlign: 'left', letterSpacing: 0.3 },
  unclassified: { color: colors.muted, fontSize: 9, textAlign: 'right' },
  tableRemainder: { color: colors.muted, paddingTop: 8, fontSize: 9, textAlign: 'right' },
  bottomCallout: { backgroundColor: colors.mintSoft, borderRadius: 19, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#D7E7B8' },
  calloutMark: { color: colors.forest, fontSize: 22, fontWeight: '800' },
  calloutCopy: { flex: 1, gap: 3 },
  calloutTitle: { color: colors.forest, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  calloutText: { color: '#53695C', fontSize: 10, lineHeight: 16, textAlign: 'right' },
});

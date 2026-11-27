import React, { useMemo, useState } from 'react';
import {
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
  ProgressBar,
  SectionHeading,
  SmallAction,
} from '../components/Shared';
import {
  MORPH_SAMPLES,
  compareHdcRecords,
  comparePoincareForms,
  formatArabicNumber,
  normalizeArabic,
} from '../core/arabicLab';
import type { MorphSample } from '../core/arabicLab';
import { colors, radii } from '../theme';

function findSample(id: string): MorphSample {
  return MORPH_SAMPLES.find((sample) => sample.id === id) ?? MORPH_SAMPLES[0];
}

function SamplePicker({
  title,
  item,
  onSelect,
  accent,
  isCustom,
  onToggleCustom,
  onCustomChange,
}: {
  title: string;
  item: MorphSample;
  onSelect: (sample: MorphSample) => void;
  accent: string;
  isCustom: boolean;
  onToggleCustom: () => void;
  onCustomChange: (field: 'form' | 'root' | 'pattern', value: string) => void;
}) {
  return (
    <Card style={styles.pickerCard}>
      <View style={styles.pickerTop}>
        <Badge tone={accent === colors.coral ? 'coral' : 'green'}>{title}</Badge>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isCustom }}
          onPress={onToggleCustom}
          style={[styles.customToggle, isCustom && styles.customToggleSelected]}
        >
          <Text style={[styles.customToggleText, isCustom && styles.customToggleTextSelected]}>{isCustom ? '✓ مخصص' : '＋ إدخال يدوي'}</Text>
        </Pressable>
      </View>
      {isCustom ? (
        <View style={styles.manualFields}>
          <ManualField label="الصيغة" value={item.form} onChangeText={(value) => onCustomChange('form', value)} />
          <ManualField label="الجذر" value={item.root} onChangeText={(value) => onCustomChange('root', value)} />
          <ManualField label="الوزن" value={item.pattern} onChangeText={(value) => onCustomChange('pattern', value)} />
        </View>
      ) : null}
      <ArabicText style={[styles.pickerForm, { color: accent }]}>{item.form || '—'}</ArabicText>
      <View style={styles.pickerMeta}>
        <Text style={styles.pickerMetaText}>الجذر</Text>
        <ArabicText style={styles.pickerMetaValue}>{item.root || '—'}</ArabicText>
        <View style={styles.metaDivider} />
        <Text style={styles.pickerMetaText}>الوزن</Text>
        <ArabicText style={styles.pickerMetaValue}>{item.pattern || '—'}</ArabicText>
      </View>
      {!isCustom ? (
        <HorizontalScroll>
          {MORPH_SAMPLES.map((sample) => {
            const selected = sample.id === item.id;
            return (
              <Pressable
                key={sample.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(sample)}
                style={({ pressed }) => [styles.sampleChip, selected && styles.sampleChipSelected, pressed && styles.sampleChipPressed]}
              >
                <ArabicText style={[styles.sampleChipText, selected && styles.sampleChipTextSelected]}>{sample.form}</ArabicText>
              </Pressable>
            );
          })}
        </HorizontalScroll>
      ) : (
        <Text style={styles.manualHint}>أدخل رموز الجذر والوزن يدوياً. يُستخدم نص الوزن كمفتاح ثابت للمتجه التجريبي.</Text>
      )}
    </Card>
  );
}

function ManualField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.manualField}>
      <Text style={styles.manualLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        textAlign="right"
        placeholder={`أدخل ${label}`}
        placeholderTextColor="#89938C"
        style={styles.manualInput}
        autoCorrect={false}
        spellCheck={false}
        maxLength={48}
      />
    </View>
  );
}

function SimilarityRow({
  label,
  value,
  explanation,
  color,
}: {
  label: string;
  value: number;
  explanation: string;
  color: string;
}) {
  return (
    <View style={styles.similarityRow}>
      <View style={styles.similarityTop}>
        <Text style={styles.similarityValue}>{formatArabicNumber(value)}٪</Text>
        <Text style={styles.similarityLabel}>{label}</Text>
      </View>
      <ProgressBar value={value} color={color} dark />
      <Text style={styles.similarityExplanation}>{explanation}</Text>
    </View>
  );
}

export default function CompareScreen() {
  const [leftId, setLeftId] = useState('kitaab');
  const [rightId, setRightId] = useState('maktaba');
  const [leftCustomActive, setLeftCustomActive] = useState(false);
  const [rightCustomActive, setRightCustomActive] = useState(false);
  const [leftManual, setLeftManual] = useState<MorphSample>({
    id: 'manual-left', form: 'كِتَاب', bare: 'كتاب', root: 'كتب', pattern: 'فِعَال', patternCode: 'فعال', note: 'إدخال يدوي',
  });
  const [rightManual, setRightManual] = useState<MorphSample>({
    id: 'manual-right', form: 'مَكْتَبَة', bare: 'مكتبة', root: 'كتب', pattern: 'مَفْعَلَة', patternCode: 'مفعلة', note: 'إدخال يدوي',
  });
  const left = leftCustomActive ? leftManual : findSample(leftId);
  const right = rightCustomActive ? rightManual : findSample(rightId);

  const updateManual = (
    setter: React.Dispatch<React.SetStateAction<MorphSample>>,
    slot: 'left' | 'right',
    field: 'form' | 'root' | 'pattern',
    value: string,
  ) => {
    setter((previous) => ({
      ...previous,
      [field]: value,
      ...(field === 'form' ? { bare: normalizeArabic(value) } : {}),
      ...(field === 'pattern' ? { patternCode: normalizeArabic(value) || `empty-${slot}` } : {}),
    }));
  };

  const hdc = useMemo(
    () => compareHdcRecords(
      { root: left.root, patternCode: left.patternCode },
      { root: right.root, patternCode: right.patternCode },
    ),
    [left.root, left.patternCode, right.root, right.patternCode],
  );
  const poincare = useMemo(
    () => comparePoincareForms(
      { root: left.root, patternCode: left.patternCode },
      { root: right.root, patternCode: right.patternCode },
    ),
    [left.root, left.patternCode, right.root, right.patternCode],
  );

  const exportReport = async () => {
    const report = {
      app: 'Miyaar Arabic Lab',
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      method: 'seeded 1-bit HDC demonstration; not a trained semantic model',
      left: { form: left.form, root: left.root, pattern: left.pattern, patternCode: left.patternCode },
      right: { form: right.form, root: right.root, pattern: right.pattern, patternCode: right.patternCode },
      hdc,
      illustrativePoincareDistance: Number(poincare.toFixed(4)),
      caveat: 'Similarity and distance values are properties of this toy encoding, not evidence of semantic or linguistic quality.',
    };
    const message = JSON.stringify(report, null, 2);

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        window.alert('نُسخت بيانات التجربة بصيغة JSON.');
      } else {
        await Share.share({ title: 'تقرير تجربة معيار', message });
      }
    } catch {
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('تعذّر التصدير', 'حاول مشاركة التقرير مرة أخرى.');
    }
  };

  return (
    <AppShell active="compare">
      <View style={styles.pageHeading}>
        <Badge tone="green">ورشة ٠٢ · المقارنة</Badge>
        <Text style={styles.pageTitle}>هل تحفظ البتّاتُ البنية؟</Text>
        <Text style={styles.pageCopy}>قارن شكلين صرفيين عبر مكوّنات منفصلة: الجذر، والوزن، وناتج الربط بـ XOR.</Text>
      </View>

      <View style={styles.pickers}>
        <SamplePicker
          title="العينة A"
          item={left}
          onSelect={(sample) => { setLeftId(sample.id); setLeftCustomActive(false); }}
          accent={colors.teal}
          isCustom={leftCustomActive}
          onToggleCustom={() => setLeftCustomActive((active) => !active)}
          onCustomChange={(field, value) => updateManual(setLeftManual, 'left', field, value)}
        />
        <SamplePicker
          title="العينة B"
          item={right}
          onSelect={(sample) => { setRightId(sample.id); setRightCustomActive(false); }}
          accent={colors.coral}
          isCustom={rightCustomActive}
          onToggleCustom={() => setRightCustomActive((active) => !active)}
          onCustomChange={(field, value) => updateManual(setRightManual, 'right', field, value)}
        />
      </View>

      <View style={styles.matchBanner}>
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{left.root === right.root ? 'جذر مشترك' : 'جذران مختلفان'}</Text>
        </View>
        <Text style={styles.matchText}>
          {left.form} <Text style={styles.matchArrow}>↔</Text> {right.form}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <MetricCard label="أبعاد المتجه" value={formatArabicNumber(hdc.dimension)} note="بت ثنائية" accent={colors.teal} />
        <MetricCard label="مسافة بوانكاريه" value={poincare.toFixed(2)} note="إسقاط توضيحي" accent={colors.violet} />
      </View>

      <View style={styles.hdcCard}>
        <View style={styles.hdcHeading}>
          <View style={styles.hdcTitleStack}>
            <Eyebrow light>عملية منطقية · لا تدريب</Eyebrow>
            <Text style={styles.hdcTitle}>بصمة HDC أحادية</Text>
          </View>
          <View style={styles.bitBadge}>
            <Text style={styles.bitBadgeText}>1-bit</Text>
          </View>
        </View>
        <SimilarityRow
          label="تشابه تمثيل الجذر"
          value={hdc.rootSimilarity}
          color={colors.mint}
          explanation="الجذر يُرمّز بتسلسل سمات صواتية واسعة؛ التطابق يعطي ١٠٠٪، لكن جذوراً مختلفة قد تتصادم إذا تشابهت سماتها."
        />
        <SimilarityRow
          label="تشابه ترميز الوزن"
          value={hdc.patternSimilarity}
          color="#F5C578"
          explanation="لكل اسم وزن متجه عشوائي ثابت بالبذرة؛ لا يعني التشابه قرباً صرفياً مدرّباً."
        />
        <SimilarityRow
          label="تشابه ناتج الربط XOR"
          value={hdc.boundSimilarity}
          color="#A6D9C3"
          explanation="الربط يخلط مكوّنَي الجذر والوزن؛ لذا افحص المكوّنات منفصلة ولا تفسّر الناتج كمعنى."
        />
        <View style={styles.operatorStrip}>
          <Text style={styles.operatorText}>الجذر</Text>
          <Text style={styles.operatorSymbol}>⊕</Text>
          <Text style={styles.operatorText}>الوزن</Text>
          <Text style={styles.operatorSymbol}>=</Text>
          <Text style={styles.operatorResult}>بصمة مركّبة</Text>
        </View>
      </View>

      <Card>
        <SectionHeading eyebrow="نافذة صغيرة من المتجه" title="أول ٦٤ بتاً" trailing={<Badge tone="green">من أصل ١٠٢٤</Badge>} />
        <Text style={styles.noteText}>عرض تشخيصي فقط. المتجه حتمي داخل هذه النسخة، ومولّد من مولّد شبه عشوائي ببذرة ثابتة.</Text>
        <View style={styles.bitsBox}>
          <Text selectable style={styles.bitsText}>{hdc.boundBits.match(/.{1,8}/g)?.join('  ')}</Text>
        </View>
      </Card>

      <Card style={styles.geometryCard}>
        <View style={styles.geometryTop}>
          <View style={styles.geometryMark}><Text style={styles.geometryMarkText}>H²</Text></View>
          <View style={styles.geometryTitleStack}>
            <Eyebrow>الركيزة ٠٣ · نموذج كرة</Eyebrow>
            <Text style={styles.geometryTitle}>المسافة الزائدية</Text>
          </View>
          <Badge tone="gold">غير مدرّب</Badge>
        </View>
        <Text style={styles.noteText}>النقاط تُنشأ اصطناعياً من الجذر والوزن داخل كرة الوحدة، ثم تُحسب مسافة بوانكاريه. هذه خريطة توضيحية لا تضمين لغوياً متعلّماً.</Text>
        <View style={styles.distanceRow}>
          <View style={styles.distanceNumberBox}>
            <Text style={styles.distanceValue}>{poincare.toFixed(3)}</Text>
            <Text style={styles.distanceCaption}>مسافة هندسية تجريبية</Text>
          </View>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>d(u,v) = arcosh(1 + 2‖u−v‖² / ((1−‖u‖²)(1−‖v‖²)))</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.caveatCard}>
        <View style={styles.caveatIcon}><Text style={styles.caveatIconText}>!</Text></View>
        <View style={styles.caveatCopy}>
          <Text style={styles.caveatTitle}>ما الذي تثبته هذه المقارنة؟</Text>
          <Text style={styles.caveatText}>تتحقق فقط من أن تنفيذ XOR والمسافة يعملان على متجهات مُعرّفة. لا تثبت دقة صرفية، أو فهماً دلالياً، أو كفاءة طاقة؛ لذلك يلزم اختبار ببيانات موسومة وخط أساس.</Text>
        </View>
      </Card>

      <PrimaryButton label="تصدير تقرير التجربة JSON" onPress={exportReport} trailing="⇧" />
      <View style={styles.quickCompareActions}>
        <SmallAction label="جذر مشترك" onPress={() => { setLeftCustomActive(false); setRightCustomActive(false); setLeftId('kitaab'); setRightId('maktaba'); }} />
        <SmallAction label="جذران مختلفان" onPress={() => { setLeftCustomActive(false); setRightCustomActive(false); setLeftId('kitaab'); setRightId('nahar'); }} />
        <SmallAction label="مقارنة غير شائعة" onPress={() => { setLeftCustomActive(false); setRightCustomActive(false); setLeftId('istiktab'); setRightId('maktuub'); }} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  pageHeading: { gap: 7, alignItems: 'flex-start', paddingHorizontal: 2 },
  pageTitle: { color: colors.ink, fontSize: 27, lineHeight: 36, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  pageCopy: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 600, textAlign: 'right', writingDirection: 'rtl' },
  pickers: { gap: 12 },
  pickerCard: { gap: 11, padding: 15 },
  pickerTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  customToggle: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 6 },
  customToggleSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  customToggleText: { color: colors.teal, fontSize: 9, fontWeight: '800' },
  customToggleTextSelected: { color: colors.mint },
  manualFields: { gap: 7, borderTopWidth: 1, borderColor: '#EDF0EA', paddingTop: 10 },
  manualField: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  manualLabel: { width: 40, color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  manualInput: { flex: 1, minHeight: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 7, color: colors.ink, backgroundColor: '#FAFBF7', fontSize: 13, writingDirection: 'rtl' },
  manualHint: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },
  pickerForm: { fontSize: 27, lineHeight: 42, fontWeight: '800' },
  pickerMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, borderTopWidth: 1, borderColor: '#EDF0EA', paddingTop: 9 },
  pickerMetaText: { color: colors.muted, fontSize: 10 },
  pickerMetaValue: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  metaDivider: { height: 17, width: 1, backgroundColor: colors.line, marginHorizontal: 3 },
  sampleChip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.paper },
  sampleChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  sampleChipPressed: { opacity: 0.75 },
  sampleChipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  sampleChipTextSelected: { color: colors.mint },
  matchBanner: { backgroundColor: colors.surfaceSoft, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  matchBadge: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  matchBadgeText: { color: colors.teal, fontSize: 10, fontWeight: '800' },
  matchText: { color: colors.ink, fontSize: 15, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  matchArrow: { color: colors.teal, fontWeight: '800' },
  metricRow: { flexDirection: 'row-reverse', gap: 8 },
  hdcCard: { backgroundColor: colors.forestDeep, borderRadius: 24, padding: 18, gap: 17 },
  hdcHeading: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  hdcTitleStack: { gap: 4, alignItems: 'flex-start' },
  hdcTitle: { color: colors.white, fontSize: 21, fontWeight: '800', textAlign: 'right' },
  bitBadge: { borderRadius: 11, backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 7 },
  bitBadgeText: { color: colors.forestDeep, fontSize: 11, fontWeight: '900' },
  similarityRow: { gap: 7 },
  similarityTop: { flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  similarityValue: { color: colors.mint, fontSize: 18, fontWeight: '800' },
  similarityLabel: { color: colors.white, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  similarityExplanation: { color: '#B6CBC0', fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  operatorStrip: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9, borderTopWidth: 1, borderColor: '#31564A', paddingTop: 13 },
  operatorText: { color: '#D1E1D7', fontSize: 11, fontWeight: '700' },
  operatorSymbol: { color: colors.mint, fontSize: 18, fontWeight: '800' },
  operatorResult: { color: colors.mint, fontSize: 11, fontWeight: '800' },
  noteText: { color: colors.muted, fontSize: 11, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  bitsBox: { borderRadius: 14, backgroundColor: '#F5F7F0', borderWidth: 1, borderColor: colors.line, padding: 13 },
  bitsText: { color: colors.teal, fontFamily: 'monospace', fontSize: 11, lineHeight: 19, letterSpacing: 0.45, textAlign: 'left' },
  geometryCard: { gap: 13 },
  geometryTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  geometryMark: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' },
  geometryMarkText: { color: colors.violet, fontSize: 14, fontWeight: '900' },
  geometryTitleStack: { flex: 1, gap: 2, alignItems: 'flex-start' },
  geometryTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'right' },
  distanceRow: { flexDirection: 'row-reverse', alignItems: 'stretch', gap: 9 },
  distanceNumberBox: { minWidth: 122, backgroundColor: colors.violetSoft, borderRadius: 14, padding: 11, justifyContent: 'center' },
  distanceValue: { color: colors.violet, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  distanceCaption: { color: colors.muted, fontSize: 9, textAlign: 'right', marginTop: 2 },
  formulaBox: { flex: 1, justifyContent: 'center', backgroundColor: '#F7F8F3', borderRadius: 14, padding: 11 },
  formulaText: { color: colors.ink, fontSize: 10, lineHeight: 17, textAlign: 'center', fontFamily: 'monospace' },
  caveatCard: { backgroundColor: colors.goldSoft, borderColor: '#E9D8B8', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 11 },
  caveatIcon: { width: 28, height: 28, backgroundColor: '#E7D3AF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  caveatIconText: { color: '#775B2D', fontWeight: '900', fontSize: 15 },
  caveatCopy: { flex: 1, gap: 4 },
  caveatTitle: { color: '#5F4827', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  caveatText: { color: '#6C5837', fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  quickCompareActions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, justifyContent: 'flex-start' },
});

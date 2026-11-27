import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppShell,
  Badge,
  Card,
  Eyebrow,
  MetricCard,
  SectionHeading,
  TraitPill,
} from '../components/Shared';
import { colors } from '../theme';

const REVIEW_ITEMS = [
  {
    index: '١',
    title: 'الصرف الجذري حقيقة لغوية؛ لكنه ليس الوصف الوحيد.',
    detail: 'العربية تجمع الجذر والوزن مع السوابق واللواصق والتصريف. لذلك يلزم نموذج يغطي الجذور الثلاثية والرباعية، والاقتراض، واللهجات، واللواصق، لا قالب واحد فقط.',
    tone: 'green' as const,
    label: 'مدعوم جزئياً',
  },
  {
    index: '٢',
    title: 'التراث العربي منطلقٌ نظري، لا زينةٌ تاريخية.',
    detail: 'نبدأ باستقراء «العين» للخليل في المخارج والتنظيم الصوتي، و«الخصائص» لابن جني في مباحث الصلة بين اللفظ والمعنى. نوثّق نص كل دعوى وسياقها، ثم نحوّلها إلى سمات أو علاقات حاسوبية ونختبر أثرها دون اختزال أقوال العلماء أو خلط النقل بالتجربة.',
    tone: 'green' as const,
    label: 'مصدر تأسيسي',
  },
  {
    index: '٣',
    title: 'HDC طريقة تمثيل، لا نموذجاً توليدياً جاهزاً.',
    detail: 'يمكن تنفيذ الربط بـ XOR والتجميع بالتصويت على متجهات ثنائية، لكن ذلك لا يمنح المتجهات معنى تلقائياً. يلزم تعريف التمثيل، والتعلّم أو قواعده، ومهمة تقييم واضحة.',
    tone: 'coral' as const,
    label: 'يحتاج تجربة',
  },
  {
    index: '٤',
    title: 'الفضاء الزائدي فرضية ملاءمة للبنية الهرمية.',
    detail: 'قد يكون مفيداً حين تكون الشجرة/العلاقات الهرمية هي المهمة. لا توجد نتيجة مسبقة تضمن أن ٣٢ أو ٦٤ بُعداً تكفي أو أن الأداء سيتفوق على تمثيل إقليدي أو خط أساس آخر.',
    tone: 'green' as const,
    label: 'يُختبر بالمقارنة',
  },
];

const ROADMAP = [
  {
    number: '01',
    title: 'ابنِ بيانات موثّقة',
    body: 'اجمع كلمات مشكولة وغير مشكولة مع الجذر والوزن واللواصق والمعنى والسياق. اجعل أكثر من خبير يراجع العيّنات، وسجّل الخلاف بدلاً من إخفائه.',
    output: 'مجموعة بيانات + دليل وسم',
  },
  {
    number: '02',
    title: 'اختبر مكوّناً واحداً كل مرة',
    body: 'قارن سمات الحروف وحدها، ثم الجذر والوزن، ثم HDC، ثم الهندسة الزائدية. افصل بين تحليل الصرف وتصنيف المعنى كي تعرف أي إضافة أفادت.',
    output: 'خط أساس + دراسة إزالة مكوّنات',
  },
  {
    number: '03',
    title: 'قِس على الجهاز المستهدف',
    body: 'سجّل الدقة، والكمون، والذاكرة، والطاقة لكل عينة على هاتف محدد. قارن تنفيذاً محسّناً بخط أساس مضبوط؛ لا تستنتج الطاقة من كون العمليات بتّية فقط.',
    output: 'نتائج قابلة لإعادة الإنتاج',
  },
];

export default function MethodScreen() {
  return (
    <AppShell active="method">
      <View style={styles.heading}>
        <Badge tone="gold">ورشة ٠٣ · قراءة نقدية</Badge>
        <Text style={styles.title}>حوّل الادعاء إلى تجربة.</Text>
        <Text style={styles.intro}>الفكرة تستحق نموذجاً أولياً، لكن بعض الأرقام والاستنتاجات في الطرح تحتاج بيانات ومقارنة قبل وصفها كحقائق.</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryMark}><Text style={styles.summaryMarkText}>؟</Text></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryEyebrow}>الخلاصة العلمية</Text>
          <Text style={styles.summaryTitle}>الأساس البنيوي واعد؛ التفوق والكلفة ما زالا سؤالين مفتوحين.</Text>
          <Text style={styles.summaryBody}>نبدأ من كتب التراث ونمذِج صفات الصوت والجذر والوزن. نحفظ دعوى المعنى ولا نفرضها مسبقاً؛ نختبرها على البيانات ولا ندّعي استبدال UTF-8 أو المحوّلات أو العتاد.</Text>
        </View>
      </View>

      <Card>
        <SectionHeading eyebrow="فصل المعرفة عن التوقع" title="مراجعة الركائز الأربع" />
        <View style={styles.reviewList}>
          {REVIEW_ITEMS.map((item, index) => (
            <View key={item.index} style={[styles.reviewItem, index > 0 && styles.reviewBorder]}>
              <View style={styles.reviewIndex}><Text style={styles.reviewIndexText}>{item.index}</Text></View>
              <View style={styles.reviewCopy}>
                <View style={styles.reviewTop}>
                  <Badge tone={item.tone}>{item.label}</Badge>
                </View>
                <Text style={styles.reviewTitle}>{item.title}</Text>
                <Text style={styles.reviewDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.utfCard}>
        <View style={styles.utfTop}>
          <View style={styles.utfIcon}><Text style={styles.utfIconText}>UTF</Text></View>
          <View style={styles.utfTitleStack}>
            <Eyebrow>تصحيح مهم</Eyebrow>
            <Text style={styles.utfTitle}>لا تستبدل الترميز بتمثيل بحثي.</Text>
          </View>
        </View>
        <Text style={styles.utfBody}>ASCII معيار تاريخي محدود، أما النص العربي الحديث فيُمثَّل عادةً بنقاط Unicode ويُنقل بترميزات مثل UTF-8. المصفوفة الصواتية قد تكون ميزة إضافية داخل نموذج، لكنها لا تلغي الحاجة لقراءة النص وتطبيعه أو تمثيل الحروف غير المعروفة.</Text>
        <View style={styles.utfChips}>
          <TraitPill tone="neutral">Unicode: هوية الحرف</TraitPill>
          <TraitPill tone="green">السمات: وصف تجريبي</TraitPill>
          <TraitPill tone="gold">لا يوجد استبدال مباشر</TraitPill>
        </View>
      </Card>

      <Card>
        <SectionHeading eyebrow="من الفكرة إلى ورقة قابلة للتحكيم" title="خطة بحث من ثلاث مراحل" />
        <View style={styles.roadmap}>
          {ROADMAP.map((step, index) => (
            <View key={step.number} style={styles.roadmapStep}>
              <View style={styles.roadmapRail}>
                <View style={[styles.roadmapNumber, index === 0 && styles.roadmapNumberActive]}>
                  <Text style={[styles.roadmapNumberText, index === 0 && styles.roadmapNumberTextActive]}>{step.number}</Text>
                </View>
                {index < ROADMAP.length - 1 ? <View style={styles.roadmapLine} /> : null}
              </View>
              <View style={styles.roadmapCopy}>
                <Text style={styles.roadmapTitle}>{step.title}</Text>
                <Text style={styles.roadmapBody}>{step.body}</Text>
                <View style={styles.outputPill}><Text style={styles.outputText}>{step.output}</Text></View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.metricsGrid}>
        <MetricCard label="الصرف" value="F1" note="الجذر / الوزن" accent={colors.teal} />
        <MetricCard label="التعميم" value="OOV" note="جذور غير مرئية" accent={colors.coral} />
        <MetricCard label="الزمن" value="ms" note="لكل كلمة" accent={colors.gold} />
        <MetricCard label="الطاقة" value="J" note="لكل عيّنة" accent={colors.violet} />
      </View>
      <Text style={styles.metricsNote}>حدّد المقاييس وخطوط الأساس قبل التجربة؛ لا تُحوّل أرقاماً مثل «خفض معاملات ٨٠٪» أو «٠٫٠٠١ واط» إلى نتائج إلا بعد قياس منشور قابل للتكرار.</Text>

      <View style={styles.nextStepCard}>
        <Text style={styles.nextStepKicker}>النطاق الحالي</Text>
        <Text style={styles.nextStepTitle}>مساعد تجارب محلي، وليس «الفارابي-١».</Text>
        <Text style={styles.nextStepText}>هذا التطبيق يعرض جدولاً يدوياً، ومعجماً مثالياً صغيراً، وبصمة HDC حتمية، وإسقاطاً زائدياً اصطناعياً. وهو نقطة بدء لتسجيل الفرضيات — لا نموذجاً مدرّباً ولا دليلاً على تفوق معماري.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 8, alignItems: 'flex-start', paddingHorizontal: 2 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 38, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  intro: { color: colors.muted, fontSize: 12, lineHeight: 20, maxWidth: 650, textAlign: 'right', writingDirection: 'rtl' },
  summaryCard: { backgroundColor: colors.forest, borderRadius: 22, padding: 18, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  summaryMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  summaryMarkText: { color: colors.forest, fontSize: 18, fontWeight: '900' },
  summaryCopy: { flex: 1, gap: 6 },
  summaryEyebrow: { color: '#C7DEA9', fontSize: 9, fontWeight: '800', textAlign: 'right' },
  summaryTitle: { color: colors.white, fontSize: 17, lineHeight: 25, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  summaryBody: { color: '#C6D8CD', fontSize: 11, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  reviewList: { borderTopWidth: 1, borderColor: colors.line },
  reviewItem: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 11, paddingVertical: 13 },
  reviewBorder: { borderTopWidth: 1, borderColor: '#EDF0EA' },
  reviewIndex: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  reviewIndexText: { color: colors.teal, fontSize: 11, fontWeight: '900' },
  reviewCopy: { flex: 1, gap: 5 },
  reviewTop: { flexDirection: 'row-reverse', justifyContent: 'flex-start' },
  reviewTitle: { color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  reviewDetail: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  utfCard: { backgroundColor: '#F7F8F3' },
  utfTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  utfIcon: { backgroundColor: colors.forest, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 9 },
  utfIconText: { color: colors.mint, fontFamily: 'monospace', fontSize: 10, fontWeight: '800' },
  utfTitleStack: { flex: 1, gap: 3, alignItems: 'flex-start' },
  utfTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  utfBody: { color: colors.muted, fontSize: 11, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  utfChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  roadmap: { gap: 0, borderTopWidth: 1, borderColor: colors.line, paddingTop: 13 },
  roadmapStep: { flexDirection: 'row-reverse', gap: 12, minHeight: 116 },
  roadmapRail: { alignItems: 'center', width: 34 },
  roadmapNumber: { width: 29, height: 29, borderRadius: 10, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  roadmapNumberActive: { backgroundColor: colors.mint },
  roadmapNumberText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  roadmapNumberTextActive: { color: colors.forest },
  roadmapLine: { flex: 1, width: 1, backgroundColor: colors.line, marginVertical: 4 },
  roadmapCopy: { flex: 1, paddingBottom: 18, gap: 5, alignItems: 'flex-start' },
  roadmapTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  roadmapBody: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl' },
  outputPill: { backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginTop: 2 },
  outputText: { color: colors.teal, fontSize: 9, fontWeight: '800' },
  metricsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  metricsNote: { color: colors.muted, fontSize: 10, lineHeight: 17, textAlign: 'right', writingDirection: 'rtl', paddingHorizontal: 2 },
  nextStepCard: { backgroundColor: colors.violetSoft, borderRadius: 21, borderWidth: 1, borderColor: '#DAD7E9', padding: 17, gap: 6 },
  nextStepKicker: { color: colors.violet, fontSize: 9, fontWeight: '900', textAlign: 'right' },
  nextStepTitle: { color: '#3D385E', fontSize: 15, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  nextStepText: { color: '#5F5B78', fontSize: 10, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
});

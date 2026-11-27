import { Link } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';

export type ScreenName = 'analyze' | 'compare' | 'trainer' | 'generator' | 'notebook' | 'method';

const NAV_ITEMS: Array<{ key: ScreenName; href: string; label: string; glyph: string }> = [
  { key: 'analyze', href: '/', label: 'الرصد', glyph: '◉' },
  { key: 'compare', href: '/compare', label: 'المقارنة', glyph: '⇄' },
  { key: 'trainer', href: '/trainer', label: 'التدريب', glyph: '△' },
  { key: 'generator', href: '/generator', label: 'التوليد', glyph: '✦' },
  { key: 'notebook', href: '/notebook', label: 'الدفتر', glyph: '▤' },
  { key: 'method', href: '/method', label: 'المنهج', glyph: '⌘' },
];

export function AppShell({ active, children }: { active: ScreenName; children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>ع</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>مِعيار</Text>
                <Text style={styles.brandCaption}>مختبر العربية · نسخة بحثية ٠.١</Text>
              </View>
            </View>
            <View style={styles.localBadge}>
              <View style={styles.localDot} />
              <Text style={styles.localLabel}>معالجة محلية</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>{children}</View>
          <Text style={styles.footerNote}>أداة تجريبية للبحث · النتائج ليست تحليلاً صرفياً معتمداً</Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            {NAV_ITEMS.map((item) => {
              const selected = item.key === active;
              return (
                <Link key={item.key} href={item.href as never} asChild>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                    style={[styles.navItem, selected && styles.navItemSelected]}
                  >
                    <Text style={[styles.navGlyph, selected && styles.navGlyphSelected]}>{item.glyph}</Text>
                    <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{children}</Text>;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'gold' | 'coral' | 'violet' | 'dark';
}) {
  const toneStyle = {
    neutral: styles.badgeNeutral,
    green: styles.badgeGreen,
    gold: styles.badgeGold,
    coral: styles.badgeCoral,
    violet: styles.badgeViolet,
    dark: styles.badgeDark,
  }[tone];
  const textStyle = tone === 'dark' ? styles.badgeTextLight : styles.badgeText;
  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeading({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  trailing = '←',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  trailing?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Text style={styles.primaryButtonArrow}>{trailing}</Text>
    </Pressable>
  );
}

export function SmallAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.smallAction, pressed && styles.smallActionPressed]}>
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  note,
  accent = colors.forest,
  style,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.metricCard, style]}>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {note ? <Text style={styles.metricNote}>{note}</Text> : null}
    </View>
  );
}

export function TraitPill({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'gold' | 'coral' | 'neutral';
}) {
  const style = {
    green: styles.traitGreen,
    gold: styles.traitGold,
    coral: styles.traitCoral,
    neutral: styles.traitNeutral,
  }[tone];
  return (
    <View style={[styles.traitPill, style]}>
      <Text style={styles.traitText}>{children}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.mint, dark = false }: { value: number; color?: string; dark?: boolean }) {
  return (
    <View style={[styles.progressTrack, dark && styles.progressTrackDark]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ArabicText({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.arabic, style]}>
      {children}
    </Text>
  );
}

export function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.forestDeep },
  screen: { flex: 1, backgroundColor: colors.paper },
  topBar: { backgroundColor: colors.forestDeep, paddingHorizontal: 18, paddingVertical: 14 },
  topBarInner: { width: '100%', maxWidth: 1050, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  brandMarkText: { color: colors.forestDeep, fontSize: 25, fontWeight: '800', lineHeight: 32, textAlign: 'center' },
  brandTitle: { color: colors.white, fontSize: 18, fontWeight: '800', textAlign: 'right' },
  brandCaption: { color: '#ABC2B6', fontSize: 10, marginTop: 2, textAlign: 'right' },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: '#31564A' },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint },
  localLabel: { color: '#D9E8DD', fontSize: 11, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', gap: 16 },
  footerNote: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: '#87928B', fontSize: 10, textAlign: 'center', paddingTop: 18, paddingBottom: 3 },
  bottomBar: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 5 },
  bottomBarInner: { flexDirection: 'row', width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'space-around', gap: 1 },
  navItem: { minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 7, borderRadius: 12, gap: 1 },
  navItemSelected: { backgroundColor: colors.mintSoft },
  navGlyph: { color: '#78857E', fontSize: 16, lineHeight: 19, fontWeight: '700' },
  navGlyphSelected: { color: colors.forest },
  navLabel: { color: '#78857E', fontSize: 8, fontWeight: '600' },
  navLabelSelected: { color: colors.forest, fontWeight: '800' },
  eyebrow: { color: colors.teal, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, textAlign: 'right', textTransform: 'uppercase' },
  eyebrowLight: { color: '#C4DAA2' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill },
  badgeNeutral: { backgroundColor: colors.surfaceSoft },
  badgeGreen: { backgroundColor: colors.mintSoft },
  badgeGold: { backgroundColor: colors.goldSoft },
  badgeCoral: { backgroundColor: colors.coralSoft },
  badgeViolet: { backgroundColor: colors.violetSoft },
  badgeDark: { backgroundColor: '#31564A' },
  badgeText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  badgeTextLight: { color: '#E6F2E6', fontSize: 10, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionHeadingText: { gap: 3, alignItems: 'flex-start' },
  sectionEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, textAlign: 'right' },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', textAlign: 'right' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  primaryButton: { minHeight: 49, borderRadius: 15, paddingHorizontal: 17, backgroundColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  primaryButtonArrow: { color: colors.mint, fontSize: 20, fontWeight: '700' },
  buttonPressed: { opacity: 0.83, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.45 },
  smallAction: { borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.surface },
  smallActionPressed: { backgroundColor: colors.surfaceSoft },
  smallActionText: { color: colors.forest, fontSize: 11, fontWeight: '800' },
  metricCard: { flex: 1, minWidth: 85, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 13, overflow: 'hidden', gap: 4 },
  metricAccent: { height: 3, width: 25, borderRadius: 2, marginBottom: 3, alignSelf: 'flex-end' },
  metricLabel: { color: colors.muted, fontSize: 10, textAlign: 'right' },
  metricValue: { color: colors.ink, fontSize: 21, fontWeight: '800', textAlign: 'right' },
  metricNote: { color: colors.muted, fontSize: 9, textAlign: 'right' },
  traitPill: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  traitGreen: { backgroundColor: colors.mintSoft },
  traitGold: { backgroundColor: colors.goldSoft },
  traitCoral: { backgroundColor: colors.coralSoft },
  traitNeutral: { backgroundColor: colors.surfaceSoft },
  traitText: { color: colors.ink, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  progressTrack: { height: 6, backgroundColor: '#E3EAE2', borderRadius: radii.pill, overflow: 'hidden' },
  progressTrackDark: { backgroundColor: '#34584D' },
  progressFill: { height: '100%', borderRadius: radii.pill },
  arabic: { textAlign: 'right', writingDirection: 'rtl' },
  horizontalScroll: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
});

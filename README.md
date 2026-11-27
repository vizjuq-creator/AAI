# مِعيار — مختبر العربية

An Android-first, offline research workbench for testing parts of the proposed Arabic phonosemantic / root-pattern / HDC idea. This repository started as an empty shell; the app is an honest experimental prototype, not a trained Arabic language model and not evidence that the proposal outperforms existing systems.

## What is implemented

- Arabic-first RTL interface with four work areas: **رصد** (analyze), **مقارنة** (compare), **الدفتر** (source and experiment notebook), and **المنهج** (research notes).
- Local Arabic normalization with the original input kept visible, a small hand-authored articulatory feature table, and a tiny example lexicon for forms of **كتب** plus a couple of comparison roots.
- Ambiguity is surfaced: unvowelled `كتب` returns more than one example analysis instead of pretending the spelling uniquely identifies a pattern.
- Deterministic 1-bit HDC demonstration: compare bundled examples or enter a custom form/root/pattern; inspect 1,024-bit feature-sequence/root and pattern vectors, XOR binding, Hamming similarity, a 64-bit window, and a shareable JSON report.
- Poincaré distance calculation over **synthetic, untrained illustrative points**.
- A persistent, offline research notebook for source quotations, edition/page provenance, researcher interpretation, and computational hypotheses; comparisons can be saved and linked to a source. Records can be exported as JSON.
- An in-app research review that distinguishes heritage source claims, the researcher’s interpretation, and experimental results.

Everything in the analyzer runs on-device; no text is sent to a service. Notebook records persist locally, while the analyzer input itself is currently kept in memory.

## Run the Android app

The Expo project is in [`mobile/`](mobile/).

```bash
cd mobile
npm ci
npm run android
```

`npm run android` starts Expo and expects an Android emulator or Expo Go device. For a local native build, use `npx expo run:android` after installing a compatible JDK and Android SDK. This sandbox has no Java/Android SDK, so I could validate the TypeScript and Metro web/native bundling, but could not produce or install an APK here.

To run the same UI in a browser:

```bash
cd mobile
npm run web
```

Checks:

```bash
cd mobile
npm run typecheck
npm test
```

See [`RESEARCH_REVIEW.md`](RESEARCH_REVIEW.md) for the claim-by-claim scientific sanity check, and [`RESEARCH_PROGRAM_AR.md`](RESEARCH_PROGRAM_AR.md) for the Arabic-first research charter, hypotheses, and staged experimental plan.

## Important limitations

- The grapheme feature assignments are broad, hand-authored approximations; they do not encode semantic meaning and do not fully resolve context-sensitive Arabic pronunciation.
- Morphology results only come from the bundled examples. This is not a general root/pattern analyzer.
- HDC vectors use a seeded pseudo-random generator and a toy feature bundling scheme. Similarity scores describe this encoding, not human meaning, linguistic quality, or energy use.
- The Poincaré points are constructed for illustration; no embedding was trained.
- Claims such as “80% fewer parameters,” “0.001 W,” and “Arabic is uniquely optimal” are not built into the app because they require evidence and controlled comparisons.

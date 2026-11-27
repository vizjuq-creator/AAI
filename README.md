# مِعيار — مختبر العربية

An Android-first, offline research workbench for testing parts of the proposed Arabic phonosemantic / root-pattern / HDC idea. This repository started as an empty shell; the app is an honest experimental prototype, not a trained Arabic language model and not evidence that the proposal outperforms existing systems.

## What is implemented

- Arabic-first RTL interface with six work areas: **رصد** (analyze), **مقارنة** (compare), **التدريب** (morphology baseline), **التوليد** (heritage-conditioned symbolic generator), **الدفتر** (source and experiment notebook), and **المنهج** (research notes).
- Local Arabic normalization with the original input kept visible, a small hand-authored articulatory feature table, and a tiny example lexicon for forms of **كتب** plus a couple of comparison roots.
- Ambiguity is surfaced: unvowelled `كتب` returns more than one example analysis instead of pretending the spelling uniquely identifies a pattern.
- Deterministic 1-bit HDC demonstration: compare bundled examples or enter a custom form/root/pattern; inspect 1,024-bit feature-sequence/root and pattern vectors, XOR binding, Hamming similarity, a 64-bit window, and a shareable JSON report.
- A genuinely trainable on-device HDC prototype classifier: label Arabic forms with roots/patterns, assign train/test splits, train from consonant-feature sequences and written tashkeel when present, and run local closed-set predictions with held-out accuracy. Unmarked spelling is not treated as sukun. It is a small discriminative baseline, not a generative LLM.
- A source-conditioned **symbolic generative prototype** for letter-meaning hypotheses: researchers attach letter/scope/position labels and operational semantic motifs to a cited notebook excerpt, explicitly approve them for training, then compile one source and one scope at a time into empirical per-letter motif distributions. It generates ordered motif compositions and keeps source, hypothesis, and output provenance; it does not generate free-form prose or infer meanings from raw quotations.
- Poincaré distance calculation over **synthetic, untrained illustrative points**.
- A persistent, offline research notebook for source quotations, edition/page provenance, researcher interpretation, structured letter hypotheses, HDC training examples, and saved generation runs. Hypotheses are drafts until explicitly approved for the model; source text, researcher motifs, and generated outputs remain separate. Records can be exported as JSON.
- An in-app research review that distinguishes heritage source claims, the researcher’s interpretation, and experimental results.

The analyzer, HDC trainer, and symbolic generator run on-device; no text is sent to a service. Notebook records persist locally, while the analyzer input itself is currently kept in memory.

## Use the heritage-conditioned generator

1. In **الدفتر**, add a source with author, book, edition, location, and the exact excerpt; classify it as **دلالة الحروف**.
2. Open **فرضيات** in the notebook. Link a letter hypothesis to that source, record scope and position, keep the researcher interpretation separate from the quotation, and enter one or more operational motifs. Explicitly approve only reviewed annotations for training.
3. In **التوليد**, select that single source and scope, train the local categorical model, enter a letter sequence, and generate candidate motif compositions. The model abstains if a required letter/position has no approved hypothesis. Save outputs to retain a provenance snapshot.

No historical theories are pre-filled. The motif labels are researcher annotations; the app does not read or interpret the quotation automatically.

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
- The heritage-conditioned generator is a transparent count-based compositional baseline over researcher-entered motifs, not a neural language model. It does not read historical prose automatically, and this repository ships no sourced letter-meaning corpus; users must verify and enter each edition, location, quotation, and interpretation.
- Generated motif sequences are hypotheses, not lexical definitions. The per-letter frequency product assumes independent positions and is not a calibrated probability of semantic truth; disagreements remain source- and scope-specific.
- Claims such as “80% fewer parameters,” “0.001 W,” and “Arabic is uniquely optimal” are not built into the app because they require evidence and controlled comparisons.

---
topic: profai-qa-panel
audience: frank, logan
summary: Blind persona panel of 2026-10-29, with five phone reviewers and their scores, plus the issues they share, ranked for fixing.
last_updated: 2026-10-29
---

# Blind persona panel, 2026-10-29

Five fresh Sonnet reviewers, all blind to the code, each used the live site (profai-poc.vercel.app) on an emulated phone. Their screenshots are in `~/profai/qa-shots/2026-10-29/<name>/`, which is kept out of git.

| # | Persona | Topic | Phone | Score | Report |
|---|---|---|---|---|---|
| 1 | Aisyah, 17, SPM student | trigonometry (Novice, Malay-ish) | 360x800 | 6/10 | [1-aisyah-17-trig.md](1-aisyah-17-trig.md) |
| 2 | Kumar, 44, logistics supervisor | how ChatGPT works | 414x896 | 5/10 | [2-kumar-44-chatgpt.md](2-kumar-44-chatgpt.md) |
| 3 | Mrs Lim, 63, retired science teacher | why the sky is blue | 414x896 | 5/10 | [3-lim-63-sky.md](3-lim-63-sky.md) |
| 4 | Daniel, 22, CS student | attention (Expert) | 390x844 | 4/10 | [4-daniel-22-attention.md](4-daniel-22-attention.md) |
| 5 | Nurul, 35, staff nurse | vaccines (Malay) | 360x800 | 4/10 | [5-nurul-35-vaccines-ms.md](5-nurul-35-vaccines-ms.md) |

## Issues shared across reviewers, ranked (fix the class, not the instance)

1. **The follow-up answer is invisible on the lesson-done card** (Lim, Aisyah, Nurul; Daniel saw answers clipped). The answer is in the page but never on screen, and "Back to the lesson" can't be tapped.
2. **Text and picture disagree** (all 5):
   - instructions name things that aren't drawn;
   - feedback quotes a value the learner didn't set (45 vs 41, d_k 64 vs 17);
   - the wavelength readout runs backwards;
   - "Show me" leaves a state that contradicts the banner;
   - the banner goes stale after a control changes;
   - claims like "diagonal lights up" or "picture turns red" never happen.
   The fix is a validator check that runs the claim against the rendered state, and feedback written from the learner's actual value.
3. **Correct taps rejected, dead taps, tiny targets** (all 5): identical shields where only one counts, thin lines, a 15px dot, matrix cells that give no feedback. Every target needs at least 44-48px and any equivalent object should be accepted. Every miss needs feedback.
4. **Labels collide and cover their objects** (all 5), the answer is printed before it's asked (Aisyah), and arrows point the wrong way (Lim).
5. **Factual errors and overclaims** (Daniel, Nurul, Lim):
   - "zero dot product = no attention";
   - "permutation invariant";
   - "vaccine = weakened germ";
   - "pertahanan 100%" and "Anda tidak sakit";
   - "fourth power" (should be inverse);
   - "5-6x" shown against a 4x display.
   A per-subject accuracy pass is needed, and health topics need hedged language (C8).
6. **Sources are junk**: GitHub SKILL.md files, MCP directories in German and Russian, NN/g (Aisyah, Nurul). The search grounding is citing our own prompt-research hits. Topical sources only, and health topics need official ones.
7. **Language is half-done**: the lesson body follows the learner's language, but the UI chrome (buttons, feedback openers, loader, disclaimer) stays English (Nurul, Aisyah).
8. **Controls move by themselves and the layout jumps** (Lim, Daniel, Aisyah): sliders reset without notice, the panel shifts between steps, the slider track resizes with the readout width.
9. **Waits are long and empty**: 15-60s to build, then 20-40s of blank "Drawing lesson N" per lesson (all 5).
10. **Endings are flat**: no whole-course recap, no practice questions, no share (Aisyah, Nurul, Lim).
11. **Smaller items**:
    - "Show me" awards a green tick;
    - the level picker is pre-selected and in jargon;
    - the course title is the raw prompt and overflows the header;
    - blank readouts;
    - decimals and 0/1 on sliders;
    - percentages over 100%;
    - Expert still uses beginner analogies.

## What reviewers liked (keep)

- The calm serif look.
- Predict-then-reveal questions.
- Gentle wrong-answer tone.
- The staged "Building your course" loader.
- Lesson-done recap cards.
- Malay answers to Malay questions.
- The honest AI disclaimer.
- Aisyah's moment of understanding that sin is just a ratio.

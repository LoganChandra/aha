# Blind persona QA: Daniel, 22, CS student: attention in transformers (Expert)

Panel run 2026-10-29 on https://profai-poc.vercel.app. Reviewer: fresh Sonnet subagent, blind to code. Screenshots: ~/profai/qa-shots/2026-10-29/daniel/ (kept out of git).

# Daniel Wong's blind test of ProfAI (phone, Expert level, attention in transformers)

I stopped at lesson 4 of 5, step "Finish lesson" (`~/profai/qa-shots/2026-10-29/daniel/137.png`), because you asked me to wrap up. I never saw lesson 5, so nothing below judges it. All screenshots are in `~/profai/qa-shots/2026-10-29/daniel/`, and I give the file number only (for example `011` is `011.png`).

Two limits on what I can claim:
- My drag and tap tool is a mouse emulation, not a real touch screen. Some failures below (the lesson 4 cell tap, the lesson 4 causal-mask slider, the lesson 1 "tap a value vector" step) may be partly the tool. I flag each one where it applies.
- I did not test a real dark-mode phone. The site rendered light even though the phone is dark.

## 1. His story

I'm on the LRT at Subang, one hand on the pole, interview Thursday. I typed "how attention works in transformers - queries keys values, why softmax weighting works" and picked Expert. It took about 45 seconds to build a five-lesson course. The title was my whole sentence in giant serif, which looked sloppy (`007`).

Lesson 1 was a soft key-value lookup with draggable arrows. The first screen was a jumble of overlapping labels (`011`). I couldn't tap a "value vector" because the dashed line is about 2px wide, so I hit "Show me". When I dragged the query onto key 1, the output snapped to value 1 and I got it (`020`). The convex-hull question was the first thing that made me think "okay, someone knows this" (`033`). I then asked about √d_k and about distance versus dot product. The answer was correct but terse, and the card cut off mid-sentence (`039`).

Lesson 2 (Q, K, V from one x) was where trust broke. The diagram was a tiny cluster pushed to the right edge (`045`). I couldn't find "the query arrow" and was told "Not that one" three times (`046`). Then it told me a zero dot product means "this pair gets no attention" (`054`). That is wrong: softmax of 0 is not zero weight. I also saw "output = 2.17 v", a coefficient above 1 that contradicts lesson 1's "weights sum to 1". I put the contradiction to the chat and it said "Both" and hand-waved about shift-invariance, which is also wrong (`073`).

In lesson 3 the headline demo, the two softmax panels for scaled versus unscaled logits, was effectively empty (`083`, `087`, `096`). The top panel had no visible bars. The slider panel jumped position between steps. It congratulated me for "sliding d_k up to 64" when it was at 17 (`090`).

Lesson 4's attention matrix is fine to look at until you interact (`106`). Then it shrank and misaligned (`117`), and the numbers didn't change when it claimed they did (`121`).

I'd close it. It is not unusable, but I can't whiteboard from something that gets this many details wrong.

## 2. Moments of confusion, blockage or annoyance

| # | Screenshot | What I expected | What happened |
|---|---|---|---|
| 1 | `001`, `002` | Level choice to be clear | "Beginner" was pre-selected; Expert needed a tap, and the selection change is subtle. |
| 2 | `004`, `006` | A quiet input | After I selected the field, the default blue browser outline appeared around it inside the rounded box, which looks like a bug. |
| 3 | `007` | A clean course title | The whole typed sentence became the 4-line headline of "Building your course". |
| 4 | `009`, `011` | A readable header | The header title ("Attention in Transformers: Q/K/V and Why Softmax Weighting…") overflows the screen, is clipped on the left, and collides with the back chevron and the menu icon. It does this on every screen. |
| 5 | `011`, `012` | To be able to tap a value vector | "Tap a value vector" with 2px dashed lines and overlapping labels; my tap did nothing, with no "not that one". I gave up and used "Show me". |
| 6 | `014`, `016` | The query dot to still be draggable after "Show me" | It had frozen, with no explanation. |
| 7 | `018` | To see the weight (the task says "weight tops 70%") | No weight number or bar is shown anywhere. I had to trust it. |
| 8 | `045`, `046`, `048` | To find "the query arrow" | Tiny cluster, labels over arrows, "Not that one" ×3 with no hint of which arrow was which. |
| 9 | `053`, `060` | A clear diagram | Vectors crammed against the right edge with a large empty area, overlapping labels, and an unexplained stray blue arrow. |
| 10 | `083`, `087`, `096` | To compare the two panels | The "no ÷√d_k" panel shows no bars at all, so I couldn't compare anything. |
| 11 | `087`, `090` | A correct "slide d_k up to 64" check | The slider was already at 64, Continue stayed disabled, and a later drag landed on a different slider, leaving d_k=17, spread=1, τ=3. It still said "Nice" about d_k at 64. |
| 12 | `096`, `097` | Stable slider positions | The slider panel jumps vertically between steps, so a drag at the same coordinates hits a different slider. |
| 13 | `106`, `107`, `112` | The cat/sat cell to respond | Two taps on the correct cell (row cat, column sat) gave no feedback, unlike lesson 2's "Not that one". May be partly my tool. |
| 14 | `117` | The swap demo to swap the numbers | The matrix shrank to about half size, the row labels slid out of alignment with the rows (the, sat, down, cat), and the numbers did not change. |
| 15 | `121` | "Diagonal cells light up" | Nothing lit up. The diagonal was already 0.4 and the matrix looked identical before and after. |
| 16 | `125`, `127`, `129` | To turn on the causal mask | Three drags on the slider did nothing. May be partly my tool. Show me worked (`131`). |
| 17 | `131` | A binary mask | The mask is a continuous slider (0.75), which makes no sense for a mask. |
| 18 | `093` | A wrong answer to teach something | The wrong-answer response is "Not quite. Watch: One-hot weights give almost no gradient…". There is nothing to watch, and it just gives away the answer. |
| 19 | `039`, `073` | The full chat answer | The answer card clips the last line mid-sentence behind a hard edge. A mouse drag selected text instead of scrolling, so I could not scroll it with a mouse; a real finger scroll is untested. |

## 3. Ugly, cramped, slow, shallow, hand-wavy or boring

- **Course build time.** About 45 to 60 seconds of "Reading up on it / Choosing what to learn first / Designing hands-on lessons" (`007`, `008`), then another 30 to 60 seconds per lesson of "Drawing lesson N" (`009`, `010`, `044`, `076`, `105`). Each lesson is a blank card for 20 to 40 seconds. On the LRT, with signal dropping, that is long, and nothing to read in the meantime.
- **Lesson 1 diagram** (`011`, `022`, `026`, `028`). Labels "key 2", "value 2", "output", "its value", "key" and "drag me" all overlap. The query dot and its callout sit on top of key labels. The layout shifts between steps, so you lose your place.
- **Lesson 2 diagram** (`045`, `051`, `053`, `060`). Mostly empty with a small cluster in the lower right, and it has the same label overlap.
- **Lesson 3 chart** (`079`, `081`, `087`). Axis-less, with bars cut off at the bottom. There are no values, no percentages and no legend. The only labels are "max", "biggest share" and "one-hot limit". It does not read as a softmax bar chart.
- **Lesson 4 matrix.** The row label "down" overlaps the "0.3" in the first column (`106`). The numbers are a cyclic pattern (0.4, 0.3, 0.2, 0.1, rotated each row), so there is no real structure to learn from.
- **Quiz questions** mostly give away the answer. "Rotating the key changes the score because… the value vector shrinks / the dot product q·k changes / the softmax denominator changes" is trivially answered by elimination (`064`).
- **Lesson summaries** are just the feedback snippets pasted together and refer to the UI ("the orange output snapped to that key's value", `043`). They miss the best idea of the lesson, the convex hull.
- **Tone.** The Expert level still says "query asks, key answers, value carries the content" (`068`). That is exactly the baby analogy Daniel hates. It never writes the actual formula softmax(QKᵀ/√d_k)V in anything I saw.

## 4. Did he learn? Technical verdict

**Daniel in his own words now:** "Each token makes a query, a key and a value by multiplying its embedding by three learned matrices. The query is matched against all keys with dot products, the scores get scaled by √d_k and passed through softmax, and the output is the softmax-weighted average of the values. √d_k stops the logits from growing with dimension, which would saturate softmax and kill gradients. Attention alone doesn't know word order, so you add positional encodings, and for generation you mask future positions."

I could say that, but I got most of it from the √d_k chat answer and my prior knowledge. The only thing I'd say came from the lessons is the convex-hull point.

**Technically correct and good (keep):**
- Soft lookup framing with keys for matching and values for returning (`014`).
- Convex-hull question (`033`): "Attention output always lives inside the convex hull of the values." Correct for a single head before W_O and the residual.
- Raw dot-product scores growing like √d_k (`087`). Correct, assuming roughly unit-variance components. The unstated assumption is something an interviewer will probe.
- Saturated softmax gives vanishing gradients (`093`, `099`).
- The chat answer on √d_k (`039`): variance, saturation, vanishing gradients.
- Causal mask means "token i attends only to j ≤ i" (`131`).
- "Attention alone is a set operation… Position must be injected" (`137`).

**Technically wrong or misleading (quotes):**
1. `054`: "Perpendicular query and key: the dot product is zero, **so this pair gets no attention**." Wrong. A zero score gives exp(0)=1, which is a neutral baseline. Whether it is below or above average depends on the other scores. Anyone who writes this on a whiteboard gets challenged.
2. `066`: "**Only the angle between q and k matters** for the score." Wrong. q·k = ‖q‖‖k‖cosθ, so norms matter. It also contradicts the √d_k answer ("large-norm keys give huge dot products").
3. `059`: "Aligned: the score is **at its maximum**." Only for fixed norms.
4. `062`, `064`: "output = 1.2 v" and later "output = 2.17 v" while "weights sum to 1" (`031`). The output is not a coefficient times one value vector, and a weight above 1 violates lesson 1. The "Nice. The value space is free to have a different dimension d_v" feedback is also unrelated to what I did, which was scale the value up.
5. `073` (chat): "softmax is shift-invariant, **so only differences in cosθ across keys decide the weights**." Wrong. Shift invariance means adding a constant to all scores doesn't matter. It says nothing about norms being irrelevant, and the differences that matter are in the scores, not in cosθ. "Zero dot product gives equal weight to that key, not zero" is also loose: equal to what? It did not concede that the lesson was wrong.
6. `018` ("the query starts far from everything, so all weights are near 25%") and `028` ("equidistant from all four keys"). The demo is distance-based, so a far query gives uniform weights. In real dot-product attention a far or high-norm query gives sharper softmax, not flatter. The chat later says "the demo's distance is just a 2D stand-in" (`039`). That is a significant simplification that is never flagged in the lesson text, and it teaches the opposite of the norm intuition.
7. `117`: "Attention is **permutation invariant**" with "the other rows are untouched". Self-attention without positions is permutation equivariant: swap inputs and the outputs swap. Invariant would mean the output does not change. The lesson's own final line (`137`) says "the outputs shuffle identically", which contradicts the earlier "invariant". And the other rows are not untouched: their cat and down columns swap.
8. `121`: "The diagonal cells light up" when the numbers did not change. The claim is contradicted by the screen.
9. `131`: "The upper triangle is zeroed out" and "the causal mask is 0.75". The masked cells still display 0.3, 0.2 and 0.1, and the unmasked row "the" shows 0.4. After masking, the softmax rows must renormalise to sum to 1, so that row should be 1.0. This contradicts the "every row sums to 1" statement on `114`. Also −∞ is added before softmax, not applied to weights after.
10. `093`: "One-hot weights give almost no gradient: the model **stops learning**." Overstated. Gradients through that softmax vanish, but the rest of the network and the other heads still learn.
11. Temperature τ (`099`) is introduced as a lever alongside d_k. In standard attention √d_k is the temperature. Presenting both as separate controls is confusing, and the page never says √d_k equals τ.

**Better or worse than 3Blue1Brown or Brilliant?** Worse. 3B1B gives one worked example with real numbers, a consistent visual and no incorrect claims. Brilliant has crisp, uncluttered diagrams and accurate feedback. This product has the right instinct, drag a query and see the weights move, but the visuals are cluttered and glitchy, and the feedback text contradicts itself. For an Expert it is below Brilliant today because of the technical errors. It has no worked numeric example, no multi-head, no complexity, no scaled dot-product formula, and no explanation of why you project into separate Q, K and V spaces at all.

**Depth for Expert:** Mixed. The convex hull, gradient vanishing and variance reasoning are good. Everything else is closer to Intermediate. Multi-head, O(n²) cost, softmax in float16, KV cache and why separate W_Q and W_K matter (an asymmetric score versus Q=K) were not covered in what I saw.

## 5. Anything broken or untrustworthy

All the technical issues are in section 4. Broken behaviours:
- The "no ÷√d_k" panel shows no bars (`083`, `087`, `096`). The core demo of lesson 3 is invisible.
- The slider panel moves between steps, and tasks complete with a different slider value than they say (`090`, `097`).
- Silent dead taps in lesson 4 (`107`, `112`), possibly partly my tool.
- A causal-mask slider that ignored my drags three times (`125`, `127`, `129`), possibly partly my tool.
- The swap and positional-encoding visuals don't change the numbers (`117`, `121`).

## 6. Would he use it? 4 out of 10

The concept (drag, see, predict) is the right one and I like the √d_k panel idea. The chat answer to my first hard question was correct. But I found five contradictions or errors in about 15 minutes of Expert content. The next interview question after "write attention on a whiteboard" will be "why softmax of zero is not zero". The visuals look unfinished on a 390px phone and the wait times are long. I'd use it once to check the lesson structure, then go back to 3B1B and Karpathy's nanoGPT.

## 7. The five changes that matter most, in order

1. Fix the technical errors (section 4, items 1 to 11). Hand every Expert lesson to a human expert or a verifier before it ships.
2. Make the visuals real and non-overlapping. Lesson 3's unscaled panel must show bars, with numeric percentages. Lesson 4's matrix must actually permute, mask and renormalise. Lesson 1's labels must not collide.
3. Use real dot products, not distance, and show the weights. Draw q·k and the softmax output as numbers, so the demo is faithful to the thing being tested.
4. Fix the mobile shell. The header title must truncate; the slider panel must not move between steps; hit targets must be at least 44px (the tap targets in lessons 1 and 2); wrong taps need feedback; the chat card must scroll.
5. Make Expert actually Expert, with more depth. Drop the "asks/answers" analogies, show softmax(QKᵀ/√d_k)V, and add multi-head, O(n²), why W_Q ≠ W_K, and a pointer to the "Attention Is All You Need" derivation. Show the loading progress for the lessons, with partial content visible while building.

## Exact improvement list

1. **Remove "zero dot product means no attention."** (`054` text, lesson 2 step 2.) Replace with: "A score of 0 is neutral. After softmax that key gets weight e⁰ divided by the sum of e^score over all keys, not 0."
2. **Remove "only the angle between q and k matters."** (`066` feedback.) Replace with: "The score is ‖q‖‖k‖cosθ, so both direction and length matter. The √d_k scaling exists because of length growing with dimension."
3. **Fix "Aligned: the score is at its maximum."** (`059`.) Add "for fixed lengths".
4. **Fix "output = 1.2 v".** (`045` to `066`, the label.) Show output as Σᵢ wᵢvᵢ with wᵢ visible and summing to 1. Make the "scale the value up" step say "the output scales with v" and not show a coefficient above 1.
5. **Fix feedback after scaling v** (`062`). Say "scaling v scales the output; the weights are unchanged."
6. **Fix the √d_k chat answer.** (`039`.) Add "assuming q and k components have unit variance, q·k has variance d_k". Remove the "demo's distance is a 2D stand-in" line by actually fixing the demo (item 7).
7. **Replace the distance-based lesson 1 demo with a dot-product one.** (`011` to `028`.) Show the numeric scores qᵢ·kⱼ, the softmax weights as bars, and the output vector. Fix "far from everything gives 25% each" by removing it.
8. **Remove "Attention is permutation invariant."** (`117`.) Replace with "equivariant: permuting the inputs permutes the outputs in the same way". Make the lesson 4 final text (`137`) and `117` consistent. Say the weights for "the" and "sat" keep the same values but the cat and down columns swap.
9. **Actually permute the matrix numbers when tokens are swapped.** (`117`.) The row and column labels must stay aligned with the cells. Don't shrink the matrix.
10. **Make positional encoding change the numbers.** (`121`.) Show a different matrix when it is on, or remove "diagonal cells light up."
11. **Make the causal mask binary and renormalise rows.** (`131`.) A toggle, not a 0.75 slider. Masked cells must show 0 (or a dash), and each row must sum to 1. For example, row "the" is [1,0,0,0].
12. **Say −∞ is applied to scores before softmax** (it is, in `123`), and show that step before the weights.
13. **Fix lesson 3's chart.** (`079` to `096`.) Show both panels with visible bars, percentages, and a y-axis from 0 to 100%. Put the d_k, spread and τ sliders in a stable position under the chart.
14. **Fix the lesson 3 d_k check.** (`087`, `090`.) Don't pre-fill the slider at 64 when the task says "slide up to 64." Check the actual value before saying "Nice."
15. **Stop the controls panel jumping between steps.** (`083` vs `087` vs `096`.) Reserve a fixed area.
16. **Clarify temperature.** (`099`.) Say "the √d_k factor is just a fixed temperature τ = √d_k."
17. **Soften the vanishing-gradient claim.** (`093`.) "Gradients through that softmax become tiny, so the scores that produced it barely update."
18. **Make wrong-answer feedback useful and not just the answer.** (`093`.) Remove "Watch:" unless something visibly animates.
19. **Truncate the header title.** (every screen.) Show "Attention: Q/K/V" or the first ~25 characters, with ellipsis, and keep the back and menu icons clear.
20. **Make taps forgiving.** (`011`, `046`, `106`.) Minimum 44px targets, a visible highlight on touch, and "Not that one" feedback in every task (the lesson 4 cell tap gives none).
21. **Label the arrows in lesson 2** (`045`). Say "tap the blue arrow" or highlight the target on hint.
22. **Fix the matrix labels overlapping numbers.** (`106`: "down" over "0.3".) Add left padding.
23. **Fix the course title.** (`007`.) Shorten the user's sentence to a topic name ("Attention in transformers"), or let the user edit it.
24. **Default to a visible level choice.** (`001`.) Either no pre-selection or an obvious selected state.
25. **Remove the browser focus outline from the input.** (`006`.) Use a branded focus ring.
26. **Show something while a lesson is drawing.** (`009`, `010`, `044`.) Show the lesson text and quiz first, and the diagram when ready, or display real progress. Cut the 30 to 60 second blank cards.
27. **Fix the lesson summary text.** (`043`, `104`.) Write takeaways, not UI feedback ("the orange output snapped…"). Include the convex-hull point and the actual formula.
28. **Add the scaled dot-product formula** softmax(QKᵀ/√d_k)V somewhere visible, with the shapes.
29. **Remove the "query asks, key answers" analogy** (`068`) for Expert, and replace it with one sentence on what W_Q and W_K buy you (asymmetric scores).
30. **Make quiz distractors plausible.** (`064`, `021`.) For example, "the softmax denominator changes" should be a real trap, not a throwaway.
31. **Make the chat scroll or expand the answer card.** (`039`, `073`.) No clipped last line.
32. **Have the chat concede lesson errors when challenged.** (`073`.) If the user quotes the lesson and the lesson is wrong, say so and flag it.
33. **Add multi-head attention, O(n²) cost and cross-attention** to the Expert path.
34. **Verify on a real phone, in dark mode,** and on slow 4G. I tested neither. I did not test the first-load on a real device.

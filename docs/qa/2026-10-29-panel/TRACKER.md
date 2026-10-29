---
topic: profai-qa-tracker
audience: frank
summary: Every complaint, confusion point, factual error and improvement-list item from the five 2026-10-29 blind persona reports, one row each, grouped by fix class, with status.
last_updated: 2026-10-29
---

# ProfAI QA tracker: blind persona panel, 2026-10-29

Product owner: "Treat them like customer feedback. Word for word, leave nothing that they say out. Fix everything."

Source: the five reports in this folder (`1-aisyah-17-trig.md`, `2-kumar-44-chatgpt.md`, `3-lim-63-sky.md`, `4-daniel-22-attention.md`, `5-nurul-35-vaccines-ms.md`). Duplicates are merged only within a persona; the same problem raised by two personas has one row each.

## How to use

- One row per distinct complaint. IDs are `Cxx-nn` (class, then row number inside the class). Fix the class, not the instance: before closing a row, check the other rows in its class.
- Status values: `open`, `in progress`, `fixed (<commit>; <check>)`, `wontfix (<reason>)`, `needs-logan`. `in progress` is set only where a fix is already underway (the answer hidden behind the lesson-done card; identical copies rejected; empty taps giving no feedback). Every other row starts `open`.
- A row is only `fixed` with a commit and the runnable check that proves it (for example the adversarial test name and pass count). Anything not re-tested stays `open`.
- Ref column: `§` is the numbered section of that persona's report, `#n` is the row number in the table inside that section (Daniel), `imp n` is the item number in that report's "Exact improvement list", and bare numbers are screenshot numbers (`NNN.png` in `~/profai/qa-shots/2026-10-29/<name>/`, kept out of git).
- Complaint quotes the reviewer's own text. "Their fix" is the reviewer's fix; where the report gave none the cell says "Not stated" and any implied direction is labelled as implied.
- Reviewer caveats are kept in the row: Aisyah's lesson 1 redraw lag, Kumar's and Daniel's synthetic taps, and Daniel's unverified dark mode may be partly tool artefacts.


## Status by class (2026-10-29, Frank)

Each row below still has its own status. These class fixes cover most of them; per-row ticks come after the next walk-through.

| Class | State | Fix (commit) |
|---|---|---|
| C01 text vs render | fixed in code, verify per lesson | Inspector pass plus repair; checker rules for blank readouts and quoting a fixed goal value (450af6e) |
| C02 taps | fixed | Duplicate items count; empty-space taps get a message; target lights up after a miss; 44px hit strokes (450af6e) |
| C03 hidden answer | fixed, UI test added | Answer outranks the recap card; bigger card and back button (450af6e) |
| C04 facts | improved | Inspector rule 7; writer rules on direction and size of effects; Expert brief (450af6e, 94ee08b) |
| C05 sources | fixed | Search on the learner's words only; junk filter; disclaimer moved to the top and translated (2962e7f) |
| C06 health | improved | Hedging rules in writer, inspector and tutor (2962e7f, 94ee08b) |
| C07 labels | improved | Least-overlap placement with leader lines; readouts strip; no callout on a tap target (2962e7f) |
| C08 waits | improved | Course outline and wait time shown while lesson 1 draws; time estimate on the planner (2962e7f, 94ee08b) |
| C10 level picker | fixed | Check mark, plain note, translated labels (2962e7f) |
| C11 moves by itself / jumps | fixed | Knobs a step moved are named; top area stays steady; task cards hide while asking (5de12c5) |
| C12 Show me | fixed | Inside the task card; demonstrates without the green tick (2962e7f) |
| C13 ending | fixed | Whole-course recap, share link, start again (2962e7f) |
| C14 follow-up answers | improved | Tutor prompt (94ee08b) |
| C17 pacing | improved | Writer rules (94ee08b) |
| C18 language | fixed (zh/ta not yet checked by a native speaker) | i18n, language picker, plan follows the pick (2962e7f) |
| C19 sliders | fixed | Named states, +/- buttons, full-width track, round steps (5de12c5) |
| C20 Malay wording | improved | Language notes for the writer (94ee08b) |
| C21 Expert depth | improved | Level brief (94ee08b) |
| C24 progress / Continue | fixed | Step count; Continue explains (2962e7f) |
| C26 home | fixed | Example topics; tap the title to type (2962e7f) |
| C28 title overflow | fixed | Truncation, clamped planning title (2962e7f) |
| C09 lesson content | improved | Research fact sheet per lesson + fact-use gate; real-case rules; coverage rules for the planner; templates for AI topics (df83fae, a4ddfc6) |
| C15 miss feedback | fixed | Names what was tapped, names the right answer, nudges a stalled slide (b1086ef) |
| C16 jargon | improved | Writer rule: every new term gets a plain sentence; templates remove coordinate jargon (embedding) |
| C22 contrast/size | fixed | Muted text 5:1; unfocused items 60%; bigger ticks; branded focus ring (b1086ef, 6972e0c) |
| C23 charts | improved | Writer rules; tick numbers in margins; bar names above bars on phones (ab54bbb, aef08fc) |
| C25 coverage | improved | Reload test; Malay, empty-tap and hidden-answer UI tests; prod suites green each batch |
| C27 lesson list | fixed | Scrollable sheet; goals written to the learner; sources per lesson (df83fae) |

## Classes

| ID | Name | Severity | Personas | Items |
|---|---|---|---|---|
| C01 | Text vs render disagree | P0 | Aisyah, Kumar, Lim, Daniel, Nurul | 31 |
| C02 | Correct taps rejected, dead taps/drags, tiny targets | P0 | Aisyah, Kumar, Lim, Daniel, Nurul | 20 |
| C03 | Ask answer hidden on lesson-done card, or clipped/unscrollable | P0 | Aisyah, Lim, Daniel, Nurul | 6 |
| C04 | Factual accuracy per subject | P0 | Lim, Daniel, Nurul | 16 |
| C05 | Sources junk + disclaimer language/placement | P0 | Aisyah, Nurul | 5 |
| C06 | Health claims hedging | P0 | Nurul | 5 |
| C07 | Label collisions / labels covering objects / answer printed before asked | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 15 |
| C08 | Long empty waits | P1 | Aisyah, Kumar, Daniel, Nurul | 4 |
| C09 | Lesson-specific content gaps / demo fidelity | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 18 |
| C10 | Level picker | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 5 |
| C11 | Controls move by themselves / layout jumps / keyboard squashes figure | P1 | Aisyah, Lim, Daniel, Nurul | 7 |
| C12 | Show-me semantics + stuck-escape discoverability | P1 | Aisyah, Kumar, Daniel, Nurul | 5 |
| C13 | Course ending / recap / practice / share | P1 | Aisyah, Lim, Daniel, Nurul | 5 |
| C14 | Follow-up chat answer quality | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 7 |
| C15 | Miss / wrong-answer feedback | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 7 |
| C16 | Jargon / unexplained terms | P1 | Aisyah, Kumar, Lim, Daniel, Nurul | 8 |
| C17 | Pacing / micro-steps / one task per screen | P1 | Aisyah, Kumar, Nurul | 5 |
| C18 | UI chrome not localized / language matching | P1 | Aisyah, Nurul | 5 |
| C19 | Slider ergonomics | P1 | Aisyah, Daniel, Nurul | 6 |
| C20 | Malay wording, register, metaphors | P1 | Nurul | 7 |
| C21 | Expert depth | P1 | Daniel | 5 |
| C22 | Contrast / size / figure scale / dead space | P2 | Aisyah, Kumar, Lim, Daniel | 7 |
| C23 | Chart / axis readability | P2 | Aisyah, Lim, Daniel, Nurul | 8 |
| C24 | Progress bar meaning + unexplained grey Continue | P2 | Kumar, Lim, Nurul | 4 |
| C25 | Untested coverage | P2 | Aisyah, Kumar, Daniel, Nurul | 4 |
| C26 | Home input / first screen | P2 | Aisyah, Daniel | 2 |
| C27 | Course menu / lesson list | P2 | Aisyah | 2 |
| C28 | Course title / header overflow | P2 | Daniel | 2 |
| | **Total** | | | **221** |

## C01 Text vs render disagree

Severity P0. 31 items. Instruction names undrawn things, feedback quotes values the learner didn't set, readout backwards, stale banner, Show-me state contradicts banner, claims that never happen.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C01-01 | Aisyah | §2.5, §5; imp 9; 012, 013, 014, 020 | After the first drag the number said 70° (other angle 20°) but "the triangle looked identical, even a few seconds later"; it showed 20° properly only by screenshot 020. Not verified whether this is real lag or capture timing. | Redraw the triangle live on every move while dragging. | fixed (class fix; see status table) |
| C01-02 | Aisyah | §2.5 | "The blue hint arrow later pointed the opposite way from where I needed to go." | Not stated by the reviewer; implied: the arrow must point toward the target. | fixed (class fix; see status table) |
| C01-03 | Aisyah | §2.6, §5; 018 | "That's it. The opposite side grew and the adjacent side shrank" appeared though the picture hadn't visibly changed; she never sees what "grew" means. | Don't repeat the claim "grew / shrank" unless the figure visibly does that. | fixed (class fix; see status table) |
| C01-04 | Aisyah | §2.11, §5; imp 12; 047 | She slid to 41° (ratio 0.66) and the card said "Nice. At 45° the ratio jumps to 0.71". "The numbers contradict." | Either accept only 43–47° and keep nudging, or write the message from her actual value ("At 41° the ratio is 0.66. At 45° it would be 0.71"). | fixed (class fix; see status table) |
| C01-05 | Aisyah | §2.12; imp 13; 057 | The card says "Which two sides do we know? The hypotenuse and the opposite." But the opposite is the side we are looking for; the sentence contradicts the task. | Reword to "We know the hypotenuse and want the opposite. Which ratio uses those two?" | fixed (class fix; see status table) |
| C01-06 | Kumar | §2 #1; imp 1; 009 | The instruction is "Tap the word closest to 'cat'." but "There is no word 'cat' anywhere"; the cat dot is hidden under the "animals here" pill. | Show "cat" as a visible highlighted dot (a ring around it) and make the question "Which word is closest to cat?". | fixed (class fix; see status table) |
| C01-07 | Kumar | §2 #3, §5; imp 3; 014, 015 | "Drag mango to where a computer would put it: near the other fruit. The running jump slider moves it right." There are no fruits and no sliders; "running jump slider", "Your word, across" and "Slide 'Your word, across' to the right" (and the "Your word, across / up" sliders) refer to controls that do not exist. | Put 3 fruit dots (apple, banana, papaya) in the picture or remove the fruit wording; delete the slider wording; say "Drag the red mango dot to where you think it belongs." | fixed (class fix; see status table) |
| C01-08 | Kumar | §2 #4, §5; imp 3; 017, 031 | "Now mango's number list starts with a positive number, like the other fruit." while mango sits right on top of "prince" and "king"; the sentence is copied into the lesson 1 recap card (031). | Fix the data so the fruit cluster exists, or remove the sentence; show a check only when mango is inside the fruit cluster. | fixed (class fix; see status table) |
| C01-09 | Kumar | §2 #5; imp 3; 018 | "Drag the up-and-down slider until mango sits among the fruit and vegetables." There are no fruit or vegetables and no slider. | Same as the fruit item above: draw the fruit and vegetables or reword. | fixed (class fix; see status table) |
| C01-10 | Kumar | §2 #7; imp 3; 025 | "The two orange arrows from cat→dog and king→queen point the same way: animals left, royals right, and both pairs step up for young-to-old." No arrows are drawn; "step up for young-to-old" is hard to follow and the sentence is about 25 words of abstract geometry. | Draw and name the arrows, or drop the step. Use "Cat to dog is a step up and right. Prince to king is also a step up and right. Same direction means the same kind of change: young to grown-up." | fixed (class fix; see status table) |
| C01-11 | Kumar | §2 #10, §5; 043, 044 | "Now the sentence is 'The cat sat on the mat'" while the line on screen still reads "The cat sat on the ___" with the chance label "mat". | When he taps "mat", actually write "mat" into the sentence. | fixed (class fix; see status table) |
| C01-12 | Kumar | §2 #14; imp 12; 061, 065, 069 | The same "99 steps" gives 1% (065), then the next step says 90 steps and 10% (069); a red box of changing size; at step 4 of lesson 3 the label is "wrongness: 0%" (starts at "wrongness: 100%"). "He wonders whether the numbers are made up." | Tie "wrongness" to the training slider with a single formula so the number follows smoothly; explain "wrongness = how surprised the model is by a real sentence". | fixed (class fix; see status table) |
| C01-13 | Lim | §2.3, §5; imp 1; 008, 009, 014, 018 | "The wavelength readout runs backwards": with the marker at the red end (label "red 700 nm") the readout says 407 and then 400 nm; the right end (labelled "violet 400 nm") reads 694 nm; on the blue stripe it reads 670 nm; the confirmations say "about 420 nm" and "around 470 nm". "This is the worst problem in the whole product." | Make the readout follow the bar (left red = 700, right violet = 400); test every position against its label; check that "Show me" for red, violet and blue lands on 650, 420 and 470. | fixed (class fix; see status table) |
| C01-14 | Lim | §2.4, §5; imp 4; 011 | "Show me" put the marker on the blue end, the readout says 650 nm, and the green banner says "Red light has a long wavelength": nothing agrees. "Show me" leaves a state that contradicts the confirmation. | "Show me" must put the marker on the red end of the bar and then say the sentence; never leave a state that contradicts the banner (lessons 1 to 3). | fixed (class fix; see status table) |
| C01-15 | Lim | §2.5; imp 12; 007, 013 | The instruction says "drag to the red end" but the big blue hint arrow points right, toward violet (007); "drag to the violet end" while the arrow points left (013). | The arrow must point toward the target end. | fixed (class fix; see status table) |
| C01-16 | Lim | §2.6; imp 13; 017 | "Blue light sits in between" is not what the bar shows: blue is the last stripe on the right, beside violet. | Say "Blue is next to violet at the short-wave end." | fixed (class fix; see status table) |
| C01-17 | Lim | §2.11, §5; 039, 069, 071 | The banner says "At 450 nm…" while the readout says 490 nm (039); the instruction says "around 470 nm" while the readout says 670 (§5: "470 against 670"). | Make the number shown equal the number in the sentence, or drop the sentence's number. | fixed (class fix; see status table) |
| C01-18 | Lim | §2.16, §5; imp 5; 085, 091, 092 | The sunset picture is not a sunset: the box is pale teal at 70°, at 0° and at "dust 0.85" while the text says "watch the sunset deepen" and "a redder, more dramatic sunset". Nothing deepens and the picture never turns red. | Change the sky colour with the controls (blue at noon, orange and red at the horizon, deeper with dust). | fixed (class fix; see status table) |
| C01-19 | Lim | §2.17; imp 5; 078, 085 | The Sun placement contradicts the story: the beam goes from a Sun in the upper right to an eye in the lower left while the text says "The Sun is high. Its light comes almost straight down"; at 0° the Sun is stuck in the bottom corner with the eye beside it. | Draw the eye at the bottom centre with the Sun directly overhead at noon; draw a thick atmosphere layer so a long slanted path looks longer. | fixed (class fix; see status table) |
| C01-20 | Daniel | §2 #7; imp 7; 018 | The task says "weight tops 70%" but no weight number or bar is shown anywhere; "I had to trust it." | Show the numeric scores qᵢ·kⱼ, the softmax weights as bars, and the output vector. | fixed (class fix; see status table) |
| C01-21 | Daniel | §2 #11; imp 14; 087, 090 | The "slide d_k up to 64" check: the slider was already at 64 and Continue stayed disabled; a later drag landed on a different slider, leaving d_k=17, spread=1, τ=3; it still said "Nice" about d_k at 64 (congratulated for "sliding d_k up to 64" when it was at 17). | Don't pre-fill the slider at 64 when the task says "slide up to 64"; check the actual value before saying "Nice." | fixed (class fix; see status table) |
| C01-22 | Daniel | §2 #14; imp 9; 117 | The numbers did not change when he swapped tokens, though the lesson says "the other rows are untouched". | Actually permute the matrix numbers when tokens are swapped. | fixed (class fix; see status table) |
| C01-23 | Daniel | §2 #15, §4 wrong #8; imp 10; 121 | "The diagonal cells light up": nothing lit up; the diagonal was already 0.4 and the matrix looked identical before and after. | Show a different matrix when positional encoding is on, or remove "diagonal cells light up." | fixed (class fix; see status table) |
| C01-24 | Daniel | §4 wrong #9; imp 11; 131 | "The upper triangle is zeroed out" and "the causal mask is 0.75", but the masked cells still display 0.3, 0.2 and 0.1 and the unmasked row "the" shows 0.4. | Masked cells must show 0 (or a dash). | fixed (class fix; see status table) |
| C01-25 | Daniel | §4 wrong #4; imp 5; 062 | After he scaled the value up, the feedback was "Nice. The value space is free to have a different dimension d_v", which is unrelated to what he did. | Say "scaling v scales the output; the weights are unchanged." | fixed (class fix; see status table) |
| C01-26 | Nurul | §2.7; imp 18; 032 | The message "Belum padan. Seret lagi." is already showing before any attempt; it says "not a match yet, drag again" while the instruction says tap, not drag. | Hide "Belum padan" until a drag has happened. | fixed (class fix; see status table) |
| C01-27 | Nurul | §2.13; imp 25; 062, 064 | The green banner still says "That's it. Kuman sebenar boleh buat anda sakit kerana badan anda belum kenal dia." while the picture now shows the vaccine, a brain labelled "ingatan", and "pertahanan: 100%". | Update or clear the banner when the control changes. | fixed (class fix; see status table) |
| C01-28 | Nurul | §2.14; 066 | The quiz "Sebelum buat apa-apa: apa jadi kalau kuman sebenar masuk sekarang?" (terus kebal / keliru dan sakit / tak rasa apa-apa) sits over a diagram that still shows a vaccine, "ingatan" and "pertahanan: 100%". | Reset the diagram to "pertahanan: 0%" before this question. | fixed (class fix; see status table) |
| C01-29 | Nurul | §2.16; imp 22; 094, 096 | The instruction reads "Seret penanda masa ke hari ke-7" and the control hint reads "Seret garis putus-putus ke kanan.", but the dashed line is not draggable: she dragged it (x=105, y=330 to 190) and nothing happened; the working control is the slider "Hari selepas jangkitan" in a card below the chart. | Make the line draggable with a visible handle, or rewrite the instruction to say "Geser peluncur di bawah" (improvement list: "Gerakkan peluncur di bawah"). | fixed (class fix; see status table) |
| C01-30 | Nurul | §2.17; 084, 086, 090 | On the first chart screen the pill "tanpa vaksin" sits on the green line and "dengan vaksin" on the red area, the reverse of the task (green = vaccinated); later screens (090) have them correct. | Attach each pill to its own line with a leader; never position labels by where there happens to be empty space. | fixed (class fix; see status table) |
| C01-31 | Nurul | §2.19, §4.5; imp 5; 098 | At day 7 the banner says "Pada hari ke-7, hijau sudah menang. Merah baru mula naik." but the red line is already at about 5 of a maximum of about 5.5 (it started rising at day 3). | Write what the picture shows: "Pada hari ke-7, hijau sudah tinggi. Merah masih naik." | fixed (class fix; see status table) |

## C02 Correct taps rejected, dead taps/drags, tiny targets

Severity P0. 20 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C02-01 | Aisyah | §2.5; imp 8; 011, 012, 013, 014, 015 | The orange dot is about 15 px wide and sits under its own "θ = 35°" text and two callout bubbles; the first drag changed the number to 70° but two further drags "changed nothing at all"; she thinks "I'm too stupid to drag", or "it's broken". | Touch target at least 44 px, as a big ring; remove the bubbles near the dot. | fixed (class fix; see status table) |
| C02-02 | Aisyah | Intro; 084 | One tap hit "the same" instead of "shorter" (a mis-tap between adjacent answer options, which "a real thumb could make"). | Not stated by the reviewer; implied: larger, better-spaced option targets (at least 44 px). | fixed (class fix; see status table) |
| C02-03 | Kumar | §2 #2; imp 1; 010, 011, 012, 013 | Tapping "kitten" gave "Not that one. Tap the word closest to 'cat'." three times in a row; the answer was dog (013: "Cat and dog sit almost on top of each other."). "The test punishes common sense and makes him feel stupid." | Accept cat-cluster words (kitten, puppy, dog) as correct, with a note about which is nearest. | fixed (class fix; see status table) |
| C02-04 | Kumar | §2 #5; imp 5; 018, 019 | The drag did not change the value, still "(2,2)", so mango did not move. | Make dragging free in both directions; make the mango drag move reliably in both axes. | fixed (class fix; see status table) |
| C02-05 | Kumar | §2 #11; imp 5; 054, 056, 058, 059 | "Tap the sentence that makes no sense": "The cat sat on the blorf" with a "nonsense" pill pointing to it. Tapping the sentence text three ways did nothing; tapping the book icon gave "Not that one." (059). In his story: "I could not tell which sentence to tap." | Make the whole sentence line a big tap target with a visible border; respond to every tap, even a wrong one; show a visible pressed state on every tap. | fixed (class fix; see status table) |
| C02-06 | Kumar | §2 #12; imp 12; 061, 065 | Slider "Dials tuned" is stuck at 1 and does nothing visible. | Remove "Dials tuned" if it does nothing. | fixed (class fix; see status table) |
| C02-07 | Kumar | §2 #13; imp 5; 074 | "Tap any dial." then after tapping a dial: "Not that one. Tap any dial." The step is stuck until "Show me"; "plainly a bug, and it kills trust". | Any dial tap passes; if the target is small, make the whole row of dials the tap target. | fixed (class fix; see status table) |
| C02-08 | Kumar | §2 #16; 026 | Tapping the word "cat" hit the dot label in the chart first, and the quiz did nothing until he tapped the button itself. | Quiz buttons must have higher priority than chart labels and show a pressed state. | fixed (class fix; see status table) |
| C02-09 | Kumar | Intro | "In four places (kitten, the 'blorf' sentence, the 'Tap any dial' step, and the lesson 4 confidence bar) a tap did not register as I intended." The lesson 4 confidence bar is the only one not itemised elsewhere (no screenshot given). | Not stated; implied: make the confidence-bar tap target reliable. | fixed (class fix; see status table) |
| C02-10 | Lim | §2.8; imp 3; 030, 032, 034 | "Tap an air molecule" refused three correct taps: "Not that one. Tap one of the air molecules." even though she tapped the drawn molecules; she couldn't tell which target counted. | Make the whole molecule circle plus a margin of about 12 px a valid target, or let any tap on the diagram's molecules count; at minimum point out which one to tap. | fixed (class fix; see status table) |
| C02-11 | Lim | §2.9; imp 3; 080 | "Not that one" on the sunlight beam: the 3 px orange line is not tappable with a fingertip. | Widen the hit area to at least 44 px. | fixed (class fix; see status table) |
| C02-12 | Lim | §2.14; imp 3; 061, 063, 064, 066 | Dragging on the graph is sluggish: four drags and the dot only reached about 435 nm; "drag the red dot to the far left" was never completed (she used "Show me"). | Make the dot follow the finger directly and let a tap anywhere on the graph move it there; at least 44 px hit area. | fixed (class fix; see status table) |
| C02-13 | Daniel | §2 #5, §7.4; imp 20; 011, 012 | "Tap a value vector": the dashed line is about 2 px wide with overlapping labels, so the target is too thin (tap targets in lessons 1 and 2). | Minimum 44 px targets and a visible highlight on touch. | fixed (class fix; see status table) |
| C02-14 | Daniel | §2 #5; imp 20; 011, 012 | His tap on the value vector did nothing, "with no 'not that one'"; he gave up and used "Show me". | Give "Not that one" feedback in every task. | fixed (class fix; see status table) |
| C02-15 | Daniel | §2 #13; imp 20; 106, 107, 112 | Two taps on the correct cell (row cat, column sat) gave no feedback, unlike lesson 2's "Not that one" (may be partly his tool). | Give "Not that one" feedback in every task and use minimum 44 px targets. | fixed (class fix; see status table) |
| C02-16 | Daniel | §2 #16; 125, 127, 129 | Three drags on the causal-mask slider did nothing ("Show me worked", 131); may be partly his tool. | Not stated; implied: make the drag respond. | fixed (class fix; see status table) |
| C02-17 | Nurul | §2.3, §5.5; imp 17; 012, 014, 016, 017 | "Tekan pengawal hijau." / "Tekan perisai hijau di kanan." Four identical green shields are stacked on the right; she tapped the first and then the top one; both gave "Not that one. Tekan perisai hijau di kanan."; only the second shield, with the "pengawal" label attached, was accepted (017). "An unwinnable guess." | Accept any of the four shields (they are the same object); if only one must be chosen, show one shield only; hit areas of at least 48x48 dp. | fixed (class fix; see status table) |
| C02-18 | Nurul | §2.7; imp 18; 032, 033, 034 | "Ketik lekuk pada sel pertahanan." The notch is a tiny orange shape behind the text "sel pertahanan" and the "lekuk" pill; she could not find it. | Make the target at least 48 dp and put a pulsing ring on it. | fixed (class fix; see status table) |
| C02-19 | Nurul | §2.7; imp 18; 032, 033, 034 | She tapped near the notch and nothing visibly changed; silence after a miss makes her think the phone froze. | After a miss, show "Belum kena. Cuba ketik bahagian oren." | fixed (class fix; see status table) |
| C02-20 | Nurul | §2.11; imp 20; 048, 050, 051 | "Kuman C pula. Cuba seret ke lekuk." She dragged twice and the bug stayed where it was; "Belum padan. Seret lagi." stayed; the right result (it does not stick) was never told to her; after "Show me" the screen said "Kuman C juga tidak padan. Hanya kuman A yang padan." | Let the bug move to the notch, then bounce back with a short message: "Tak padan. Bentuknya berbeza, jadi tak melekat." | fixed (class fix; see status table) |

## C03 Ask answer hidden on lesson-done card, or clipped/unscrollable

Severity P0. 6 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C03-01 | Aisyah | §2.9; imp 7; 024, 025 | The Malay answer card ends mid-line at "Guna sin, kos / dan tan ialah untuk mencari…"; dragging up selected the text in blue instead of scrolling; the "Back to the lesson" link is out of sight. She asked "apa guna semua ni sebenarnya" and the part that answers it is the part she can't read. Her words: "Jangan sorok jawapan bila aku tanya." | Let the card grow to fit the answer (or scroll inside it); keep it to about 3 short sentences; add a visible "Kembali ke pelajaran" button directly under the answer. | fixed (class fix; see status table) |
| C03-02 | Aisyah | §2.16, §5; imp 1; 119, 121, 122 | She asked "tan dgn cos tu apa dia? dlm triangle". About 9 s later, and 10+ s after that, the screen still showed only the green "LESSON 4 DONE" card and the "All lessons" button. The reply was in the page data ("sin = bertentangan / hipotenus, cos = bersebelahan / hipotenus, tan = bertentangan / bersebelahan… Untuk exam, hafal SOH-CAH-TOA") but never visible. A real student would think the question was ignored. | After a question is sent, always replace the card area with the answer and scroll to it; show a visible "thinking" state with a spinner while waiting. | fixed (class fix; see status table) |
| C03-03 | Lim | §2.18, §5; imp 2; 102, 103, 105 | The follow-up answer never appeared: she typed a question and pressed Enter, the spinner showed, then the screen went back to the "LESSON 4 DONE" card with no new text. The page text contained "You asked: ..." and an answer but it was not visible. She calls it a P0 bug. | Show the answer in a clear panel above the keyboard; close the "lesson done" card when a question is sent. | fixed (class fix; see status table) |
| C03-04 | Lim | §2.18, §5; imp 2; 106 | "Back to the lesson" could not be tapped (the tap timed out); it looks like the page's overlay covers the answer. | Make "Back to the lesson" tappable. | fixed (class fix; see status table) |
| C03-05 | Daniel | §2 #19; imp 31; 039, 073 | The answer card clips the last line mid-sentence behind a hard edge (039: "the card cut off mid-sentence"); a mouse drag selected text instead of scrolling (a real finger scroll is untested). | Make the chat scroll or expand the answer card; no clipped last line. | fixed (class fix; see status table) |
| C03-06 | Nurul | §2.21, §5.1; imp 6; 120, 123, 125, 127, 137 | She typed her question in "Ask anything about this" ("Adakah vaksin selamat? Anak saya demam lepas disuntik, ibu bapa takut ia mengandungi bahan berbahaya.") and pressed Enter; the screen only showed the "LESSON 4 DONE" card, the "All lessons" button and the chat icon; the page text held "You asked: ..." and a Malay answer plus "Back to the lesson" but none of it appeared in any screenshot; tapping the card and swiping did nothing. | Show the question and the answer in a visible panel right where the user is looking, above the keyboard, and scroll to it; test this on the "lesson done" screen at 360x800. | fixed (class fix; see status table) |

## C04 Factual accuracy per subject

Severity P0. 16 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C04-01 | Lim | §2.11, §4 wrong #5; 069, 071 | "Eye sees: 37% … our eyes see it strongly": "show me" puts it at about 85% and 35%, which is then called "our eyes see it strongly". 35% is not strongly; self-contradictory. | Change "our eyes see it strongly" or the 37% figure. | improved (class fix; see status table) |
| C04-02 | Lim | §2.12, §4 wrong #3; imp 7; 045 | The quiz says blue scatters "5 to 6 times" more than red; the screen shows 100% for blue and 23% for red (4.3 times). The correct answer for 450 against 650 nm is about 4 times (1.44⁴ ≈ 4.3). | Change the answer to "about 4 times", or compare the 700 nm end only (about 6 times). | improved (class fix; see status table) |
| C04-03 | Lim | §2.19, §4 wrong #6 | "Sunlight has little violet" in the follow-up sits awkwardly with the lesson 3 quiz, where "violet is not in sunlight" was marked wrong without explanation; the lesson never says so. | Not stated; implied: explain the quiz option and make the two consistent. | improved (class fix; see status table) |
| C04-04 | Lim | §4 wrong #2; imp 7; 047 | "The rule is the fourth power of wavelength" is incomplete: it is the inverse fourth power (1/λ⁴); as written it says longer waves scatter more. | Say "inverse fourth power" or "scattering goes up as wavelength goes down: 1 over wavelength to the fourth". | improved (class fix; see status table) |
| C04-05 | Lim | §4 wrong #4; imp 7; 039 | "Scattered rays spray out strongly in every direction. That is blue light." mixes up a direction idea with colour; the pattern of directions is the same for every wavelength, it is the amount that differs. | Remove the sentence "spray out in every direction. That is blue light". | improved (class fix; see status table) |
| C04-06 | Daniel | §4 wrong #9; imp 11, 12; 114, 123, 131 | After masking, the softmax rows must renormalise to sum to 1 (row "the" should be 1.0), which contradicts the "every row sums to 1" statement on 114 as shown; also −∞ is added before softmax, not applied to weights after. | Each row must sum to 1 (for example row "the" is [1,0,0,0]); say −∞ is applied to scores before softmax and show that step before the weights. | improved (class fix; see status table) |
| C04-07 | Daniel | §4 wrong #1; imp 1; 054 | "Perpendicular query and key: the dot product is zero, so this pair gets no attention." Wrong: a zero score gives exp(0)=1, a neutral baseline. | Replace with "A score of 0 is neutral. After softmax that key gets weight e⁰ divided by the sum of e^score over all keys, not 0." | improved (class fix; see status table) |
| C04-08 | Daniel | §4 wrong #2; imp 2; 066 | "Only the angle between q and k matters" for the score. Wrong: q·k = ‖q‖‖k‖cosθ, so norms matter; it contradicts the √d_k answer ("large-norm keys give huge dot products"). | Replace with "The score is ‖q‖‖k‖cosθ, so both direction and length matter. The √d_k scaling exists because of length growing with dimension." | improved (class fix; see status table) |
| C04-09 | Daniel | §4 wrong #3; imp 3; 059 | "Aligned: the score is at its maximum." Only true for fixed norms. | Add "for fixed lengths". | improved (class fix; see status table) |
| C04-10 | Daniel | §4 wrong #4; imp 4; 031, 062, 064 | "output = 1.2 v" and later "output = 2.17 v" while "weights sum to 1" (031); the output is not a coefficient times one value vector, and a weight above 1 violates lesson 1. | Show output as Σᵢ wᵢvᵢ with wᵢ visible and summing to 1; make the "scale the value up" step say "the output scales with v" and not show a coefficient above 1. | improved (class fix; see status table) |
| C04-11 | Daniel | §4 wrong #5; 073 | Chat: "softmax is shift-invariant, so only differences in cosθ across keys decide the weights" is wrong (shift invariance means adding a constant to all scores doesn't matter; the differences that matter are in the scores, not cosθ); "Zero dot product gives equal weight to that key, not zero" is loose ("equal to what?"); when the contradiction was put to the chat it said "Both" and hand-waved. | Fix the chat reasoning (see the lesson errors above). | improved (class fix; see status table) |
| C04-12 | Daniel | §4 wrong #6; imp 7; 018, 028, 039 | "the query starts far from everything, so all weights are near 25%" (018) and "equidistant from all four keys" (028): the demo is distance-based, so a far query gives uniform weights, while in real dot-product attention a far or high-norm query gives a sharper softmax, not flatter; "teaches the opposite of the norm intuition". | Remove "far from everything gives 25% each". | improved (class fix; see status table) |
| C04-13 | Daniel | §4 wrong #7; imp 8; 117, 137 | "Attention is permutation invariant" with "the other rows are untouched": self-attention without positions is permutation equivariant, not invariant; the lesson's own final line (137) says "the outputs shuffle identically", which contradicts it; and the other rows are not untouched (their cat and down columns swap). | Use "equivariant: permuting the inputs permutes the outputs in the same way"; make 117 and 137 consistent; say the weights for "the" and "sat" keep the same values but the cat and down columns swap. | improved (class fix; see status table) |
| C04-14 | Daniel | §4 wrong #10; imp 17; 093 | "One-hot weights give almost no gradient: the model stops learning." Overstated: the rest of the network and the other heads still learn. | Say "Gradients through that softmax become tiny, so the scores that produced it barely update." | improved (class fix; see status table) |
| C04-15 | Nurul | §4.1, §5.4; imp 2; 070 | "Vaksin ialah kuman yang sudah dilemahkan — tidak berbahaya." and the syringe label "vaksin (kuman lemah)": only live attenuated vaccines (for example BCG, MMR) work this way; others are inactivated, toxoid, subunit, conjugate, recombinant or mRNA/viral vector, and some contain no germ at all. It also contradicts the lesson outline, which says "lemah atau mati atau hanya serpihannya". | "Vaksin mengandungi kuman yang telah dilemahkan atau dimatikan, atau sebahagian kecil daripadanya. Ia cukup untuk melatih badan, tetapi tidak cukup untuk menyebabkan penyakit yang sebenar." Change the label to "vaksin". | improved (class fix; see status table) |
| C04-16 | Nurul | §4.6; imp 5; 101 | "Merah turun kerana badan lambat belajar." The red line falls because the infection is over and the response fades back, not because the body is "slow to learn". | Change to "Merah turun kerana jangkitan sudah reda." | improved (class fix; see status table) |

## C05 Sources junk + disclaimer language/placement

Severity P0. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C05-01 | Aisyah | §2.19; imp 18; 114 | The Sources list includes "agent-skills/concept-explainer/SKILL.md … GitHub", "EEF-metacognition-and-self-regulated-learning-guidance" and a Chinese video title; for maths this makes it untrustworthy. | Cite SPM syllabus sources, textbooks or Khan Academy-type material in plain titles; list only sources a student recognises (SPM textbook, Khan Academy). | fixed (class fix; see status table) |
| C05-02 | Aisyah | §2.19; imp 18; 114 | "ProfAI writes each lesson with AI. It can get things wrong" is too far down, below the fold. | Show the AI disclaimer ("AI can make mistakes") once, early, in 1 line. | fixed (class fix; see status table) |
| C05-03 | Nurul | §3, §5.6; imp 8 | The footer "ProfAI writes each lesson with AI. It can get things wrong, so check anything important against the sources." is in English only, in a medical lesson in Malay, and sits at the bottom of the lesson list where a parent will not see it. | "Pelajaran ini ditulis oleh AI dan mungkin ada kesilapan. Semak perkara penting dengan sumber di bawah atau tanya jururawat/doktor anda." Show it on the first lesson screen, not only at the bottom of the lesson list. | fixed (class fix; see status table) |
| C05-04 | Nurul | §1, §5.2; imp 7; 131 | The Sources are junk: "agent-skills/concept-explainer/SKILL.md at main · JayRHa/agent-skills · GitHub"; "teach - Claude Skill \| MCP Hub \| Modellkontextprotokoll-Hub" (twice, one in German); "Technical Jargon - NN/G"; "teach - Claude Skill \| MCP Hub \| MCP Hub - Сервер протокола контекста модели" (Russian). The site says to "check anything important against the sources". | Do not show GitHub or tool-directory pages as a source for a medical claim. | fixed (class fix; see status table) |
| C05-05 | Nurul | §5.2; imp 7; 131 | There is no WHO, KKM or CDC source; she cannot cite the page to a parent who asks "dari mana maklumat ini?". | Use KKM, WHO, CDC, or a Malaysian paediatric society page, with the page title and a working link. | fixed (class fix; see status table) |

## C06 Health claims hedging

Severity P0. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C06-01 | Nurul | §4.1; imp 2; 070 | "tidak berbahaya" is too absolute: live vaccines are not given to some immunosuppressed patients and every vaccine has side effects; an easy target for "mereka tipu, vaksin tu ada kuman hidup". | Remove the absolute (see the new definition above). | improved (class fix; see status table) |
| C06-02 | Nurul | §4.2; imp 1; 064, 073 | "pertahanan: 100%": vaccines do not give 100% protection; a parent who later knows a vaccinated child who got the disease "will conclude the nurse lied. This is a direct honesty failure." | Replace with a word scale ("Tiada / Sedang / Kuat") or "Pertahanan: jauh lebih kuat". | improved (class fix; see status table) |
| C06-03 | Nurul | §4.3; imp 3; 077, 115 | "Pengawal kenal muka penjenayah itu dan terus melawan. Anda tidak sakit." and the lesson 4 closing line "jadi kali kedua ia menang sebelum anda sempat rasa sakit" are absolutes; vaccinated people can still get ill, usually more mildly. | "biasanya anda tidak sakit, atau sakit jauh lebih ringan" and "biasanya menang sebelum anda sempat sakit teruk". | improved (class fix; see status table) |
| C06-04 | Nurul | §4.4; imp 4; 073 | "Badan anda tidak sakit, tetapi pengawal mula kenal rupa kuman." The lessons never mention a sore arm or a mild fever; when a mother's child gets a fever after the jab, the lesson she was shown said "tidak sakit". | Add one screen about side effects: "Selepas disuntik, tempat suntikan mungkin sakit atau anak mungkin demam ringan sehari dua. Itu tanda pengawal sedang berlatih." | improved (class fix; see status table) |
| C06-05 | Nurul | §4.8; imp 9; 125 | The chat says "Vaksin selamat" flatly. | "Vaksin yang digunakan di klinik kerajaan telah diuji dan dipantau keselamatannya". | improved (class fix; see status table) |

## C07 Label collisions / labels covering objects / answer printed before asked

Severity P1. 15 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C07-01 | Aisyah | §2.4, §2.12; imp 5; 009, 053 | Answer printed before it is asked: the instruction is "Tap the longest side" but the triangle already says "hypotenuse", "opposite" and "adjacent" in colour; in lesson 3 "opposite = 14.1 m" is already on the figure before she has solved it. "The question tests nothing." Her words: "jangan bagi jawapan dalam gambar sebelum aku jawab". | Hide the side names until she has tapped them, then reveal each in its colour; show names and answers only after she taps or solves. | improved (class fix; see status table) |
| C07-02 | Aisyah | §2.4, §3; imp 4; 009, 012, 027, 053, 057, 067, 100 | "hypotenuse" and "opposite" run into each other as "hypotenuseopposite"; the θ = 35° label is covered by the orange dot; bubbles ("drag me", "other corner", "35° corner", "radius 1") sit on the shape they explain; overlapping labels "everywhere". | Put each label in its own free space with a 6 px gap; move the θ label away from the dot; one label per object, no bubbles on the figure; on small phones move "drag me" and "35° corner" outside the shape. Her words: "jangan letak tulisan atas gambar". | improved (class fix; see status table) |
| C07-03 | Aisyah | §2.10; 034, 037, 041 | The orange "opposite" line floats beside the triangle instead of on it; "35° corner" and "drag me" bubbles cover the shape. | Keep one label per object, attached to the edge it names. | improved (class fix; see status table) |
| C07-04 | Aisyah | §2.12; 053, 057 | Two labels both say "opposite": "opposite = 14.1 m" (the answer) and "opposite = ?"; the "20 m" label is hidden under the "opposite = ?" bubble; she can't tell which number is the answer and which is the question. | Show "20 m" on the hypotenuse and a "?" on the unknown. | improved (class fix; see status table) |
| C07-05 | Aisyah | §2.15; 090, 100 | "height = 0.83" and "sideways = -0.56" are printed over the circle itself and the dragged dot disappears under its own label. | Put the readouts in a fixed panel above the circle, not on it. | improved (class fix; see status table) |
| C07-06 | Kumar | §3.1, §3.2; imp 2; 009, 014, 017, 054, 084, 088 | Callout pills cover the picture: "animals here" and "royals here" cover dots and the "kitten" label (cut off as "kitte"); "nonsense" and "dials" pills sit on top of the diagram; "Answer A/B" pills overlap "Confidence" bars; "king" over "queen", "prince" over the mango dot, "Answer A" over "Confidence". | Place labels outside the shapes with a small leader line, never on top of text; add a collision check so labels never overlap text; space the dots out. | improved (class fix; see status table) |
| C07-07 | Lim | §2.13, §3; imp 11; 038, 039, 058, 060, 066 | "you are here" overlaps "scattered: 95%" and the dot hides behind the labels (058, 066); "white light" has a line through it (038); "sunlight" overlaps the dashed curve (060); a blue arrow crosses the "scattering strength: 71%" text (039). | Keep labels clear of each other and off the lines; use direct labels at line ends. | improved (class fix; see status table) |
| C07-08 | Lim | §3; imp 18; 085, 092 | "your eye" and "Sun" are drawn on top of the box border ("your eye" is cut by it). | Keep the labels clear of the box border. | improved (class fix; see status table) |
| C07-09 | Daniel | §2 #9, §3; imp 21; 045, 051, 053, 060 | Lesson 2: vectors crammed against the right edge with overlapping labels, labels over arrows, and an unexplained stray blue arrow. | Label the arrows; stop labels overlapping. | improved (class fix; see status table) |
| C07-10 | Daniel | §3; 011, 022, 026, 028 | Lesson 1 diagram: labels "key 2", "value 2", "output", "its value", "key" and "drag me" all overlap; the query dot and its callout sit on top of the key labels ("a jumble of overlapping labels", 011). | Labels must not collide (Daniel §7.2). | improved (class fix; see status table) |
| C07-11 | Daniel | §3, §2 #; imp 22; 106 | The lesson 4 matrix row label "down" overlaps the "0.3" in the first column. | Add left padding. | improved (class fix; see status table) |
| C07-12 | Nurul | §2.4, §3; imp 26; 008, 009, 012, 022, 024 | Lesson 1 labels sit on top of the thing they describe: "kuman" covers a bug and "badan anda" sits on the circle (008); the "pengawal" pill sits on the person icon and "badan anda" overlaps the ring (012); "kuman" and "pengawal: 3" collide at the top (022); "kuman: 3" has a garbled shadow of another label behind it (024). | Place labels outside the objects with a leader line, or use fewer, larger labels; never draw two text items in the same place. | improved (class fix; see status table) |
| C07-13 | Nurul | §3; imp 26; 040, 042, 046, 066, 077, 078 | Lessons 2-3 labels: "sel pertahanan" and "kuman A" are printed across the cell and the receptor is covered by the bug (040); in 066 "vaksin (kuman lemah)", "selamat" and "pengawal bersedia" overlap into one line ("vaksin (kuman lemahselamatjawal bersedia"), unreadable; "sakit" and "badan anda" are printed on top of each other under the person icon (077, 078). | Same fix; hide a label when its object is not shown. | improved (class fix; see status table) |
| C07-14 | Nurul | §2.9; imp 26; 042, 046 | Stacked, stale labels: "kuman A" and "kuman B" are stacked under one bug (042); "kuman A" and "kuman C" are stacked under one bug (046); the germ matched earlier is gone but its label stays ("Which germ is which?"). | Remove the label when the item is not on screen; show A, B and C together permanently. | improved (class fix; see status table) |
| C07-15 | Nurul | §3 Malay #11 | "Bilangan kuman" / "Bilangan pengawal" are fine, but the picture also prints "kuman: 3 / pengawal: 3" on the canvas: two copies of the same information. | Not stated; implied: show it once. | improved (class fix; see status table) |

## C08 Long empty waits

Severity P1. 4 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C08-01 | Aisyah | §2.3; imp 17; 007, 008 | "Building your course" with a thin progress bar and "Reading up on it" (~15 s), then a grey squiggle with "Drawing lesson 1" and no content. "20+ seconds of blank screen"; the second wait "looks like a crash". | Show the lesson title and its text immediately and fill the diagram in afterwards; say "Tunggu sekejap, ~15 saat" with a real countdown or step list; never show an empty card. | improved (class fix; see status table) |
| C08-02 | Kumar | §3.4; imp 10; 008, 052, 084 | "Drawing lesson 1" with a squiggle, about 10-20 seconds ("maybe 20 seconds"); each later lesson is the same; the screens "look dead". | Show a progress line ("Drawing 2 of 5...") and let him read the lesson goal while he waits. | improved (class fix; see status table) |
| C08-03 | Daniel | §3; imp 26; 007, 008, 009, 010, 044, 076, 105 | About 45 to 60 seconds of "Reading up on it / Choosing what to learn first / Designing hands-on lessons" to build the course, then another 30 to 60 seconds of "Drawing lesson N" per lesson; each lesson is a blank card for 20 to 40 seconds with nothing to read ("On the LRT, with signal dropping, that is long"). | Show the lesson text and quiz first and the diagram when ready, or display real progress; partial content visible while building; cut the 30 to 60 second blank cards. | improved (class fix; see status table) |
| C08-04 | Nurul | §2.2, §3; imp 28; 005, 006, 007 | Long wait with no time estimate: "Building your course" with three steps then "Drawing lesson 1"; about half a minute for the first lesson and up to 12 s for each later one, on slow clinic data. | Show an honest estimate ("Biasanya kira-kira 30 saat" / "Menyediakan kursus anda... biasanya kira-kira 30 saat") and a one-line summary ("Anda akan belajar 4 perkara") while the first lesson loads. | improved (class fix; see status table) |

## C09 Lesson-specific content gaps / demo fidelity

Severity P1. 18 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C09-01 | Aisyah | §2.15, §4; imp 14; 090, 100, 104 | The lesson 4 unit circle has "no connection to the triangle she just learned"; the jump from "triangle" to "circle" is unexplained; she finished knowing "sin is the height" and not why that matches opposite ÷ hypotenuse; it is dense, "looks like homework" and is the wrong lesson for her need. | Open the lesson with "Kita letak segi tiga tadi dalam bulatan" and animate the triangle sliding into the circle; mark this lesson as optional for SPM at her level. | improved (class fix; see status table) |
| C09-02 | Aisyah | §4, §7.2; imp 2; 122 | cos and tan as triangle ratios were never taught (lesson 3 only ever uses sin); "Pick the ratio that contains exactly those two" needs definitions she didn't have. Her words: "Bagitahu aku apa itu cos dan tan dalam segi tiga, bukan setakat sin." | After sin = opposite ÷ hypotenuse add cos = adjacent ÷ hypotenuse and tan = opposite ÷ adjacent, each with one drag-and-solve example, then a mixed "choose the ratio" quiz; lesson 3 and a new lesson between 3 and 4. | improved (class fix; see status table) |
| C09-03 | Aisyah | §4 | Incomplete for SPM: no "adjacent" example (cos), no tan example, no finding an angle from two sides (inverse sin), no word problem with a ladder or tower, no check that she can pick the right ratio on her own; "still not know what to do with a ladder against a wall". | Not stated beyond item 2 above; implied: add these question types. | improved (class fix; see status table) |
| C09-04 | Kumar | §2 #10; imp 7; 041, 042, 043, 044 | The key idea of the whole course ("the loop is the whole trick") is stated in a sentence and never animated; nothing visibly loops. | Show a fresh set of bars for the next word; repeat three times; then say "That loop is the trick." | improved (class fix; see status table) |
| C09-05 | Kumar | §2 #15; imp 6; 084, 088, 093 | "Two answers from ChatGPT. Both sound confident. One is true, one is made up." Only two blue boxes labelled "Answer A", "Answer B" with overlapping orange "Confidence" bars, "Check source" and an unlabelled red cross icon; the actual answer text is not shown anywhere; he guessed "both equally" at random. Story: "I could not see either answer, only two blue boxes." | Show two real short answers in text (for example about a Malaysian law or a shipping rule), one invented; let him judge, then reveal which, and show the "check source" tick on the real one; label the red cross and green tick with text. His words: "Show me the two answers in lesson 4. Words, not boxes." | improved (class fix; see status table) |
| C09-06 | Kumar | §4 | Missing: the word "token" (words are chopped into pieces), what "attention" or the "transformer" does, what happens after pre-training (human feedback, why it behaves like an assistant), why it knows nothing after its training date, why the same question gets different answers; what he learned about "dials" is thin; he did not really learn "embedding" or the 2-number picture because the dots exercise was broken. | Not stated; implied: cover these. | improved (class fix; see status table) |
| C09-07 | Lim | §2.15; imp 6; 078, 085, 092 | Lesson 4 readouts are blank: "path through air:", "blue scattered away:" and "red reaching you:" have no numbers beside them; she thought the page hadn't loaded properly. | Show a value or a small bar for each, for example "path through air: 1x" at noon and "path through air: 12x" at sunset. | improved (class fix; see status table) |
| C09-08 | Lim | §2.20, §4 missing; imp 8; 007, 028, 052 | "Where is the sky?" Lessons 1 to 3 never show the sky or a person looking up; lesson 4 shows a teal rectangle. "No picture of why we see blue from all directions": the idea of blue light bounced from all over the sky into your eyes is never drawn. Her words: "Show me a real sky." | Show a person looking at the sky with arrows of scattered blue coming from every direction into the eye (before lesson 2 or inside lesson 3). | improved (class fix; see status table) |
| C09-09 | Lim | §4 missing; imp 8 | Nothing on why the Sun itself looks white or yellow, or why space and the Moon sky are black. | Add a line on why the Sun itself looks white and the night sky is black. | improved (class fix; see status table) |
| C09-10 | Lim | §4 missing; 093 | The "paler horizon" claim ("light bounces many times through more air, mixing in white") is a bare statement with no picture; nothing connects it to the sky picture. | Not stated; implied: connect it to the sky picture. | improved (class fix; see status table) |
| C09-11 | Daniel | §2 #10, §5; imp 13; 083, 087, 096 | The "no ÷√d_k" panel shows no bars at all, so he couldn't compare the two softmax panels; "The core demo of lesson 3 is invisible." | Show both panels with visible bars and percentages. | improved (class fix; see status table) |
| C09-12 | Daniel | §3 | The lesson 4 matrix numbers are a cyclic pattern (0.4, 0.3, 0.2, 0.1, rotated each row), so there is no real structure to learn from. | Not stated; implied: use realistic attention values. | improved (class fix; see status table) |
| C09-13 | Daniel | §4, §7.3; imp 7; 011-028 | The lesson 1 demo uses distance, not dot products, and shows no worked numeric example with real numbers (3Blue1Brown gives "one worked example with real numbers"); he rates it worse than 3B1B or Brilliant. | Replace the distance-based demo with a dot-product one: show the numeric scores qᵢ·kⱼ, the softmax weights as bars and the output vector; "Draw q·k and the softmax output as numbers". | improved (class fix; see status table) |
| C09-14 | Nurul | §2.5; 022 | After "Kejar dan tangkap" the counter changes from "pengawal: 4" to "pengawal: 3" while "kuman: 3" stays; it looks like a guard was lost and no sentence explains it. | Remove the change or explain it, for example "Seorang pengawal sedang mengejar kuman." | improved (class fix; see status table) |
| C09-15 | Nurul | §2.6; imp 10; 030 | The word "vaksin" never appears in lesson 1 (two full lessons, about 16 screens, are about "kuman", "pengawal" and "reseptor") although the course title is "Bagaimana Vaksin Berfungsi". | Mention the vaccine on the first screen: "Vaksin melatih pengawal badan anda sebelum kuman sebenar datang. Mari lihat bagaimana." | improved (class fix; see status table) |
| C09-16 | Nurul | §2.10; imp 19; 042 | Three identical red bug icons, yet the quiz asks "Sekarang cuba kuman B. Adakah ia juga padan? Kuman B akan… melekat / tidak melekat."; the lesson says matching depends on shape but the shapes are not visibly different; she picked "tidak melekat", was told "Exactly", but "the reason was luck". | Draw A, B and C with clearly different outlines (triangle, circle, star) and a notch with a matching outline. | improved (class fix; see status table) |
| C09-17 | Nurul | §4.5; imp 5; 098, 107 | The lesson 4 graph "kekuatan pertahanan": by day 10 the red and green lines almost meet and by day 14 green is only slightly above red; "A cynical parent would say, 'See, in the end it's the same.'" The graph never shows that the unvaccinated person is sick during those days. | Add a second line or strip showing how ill each person is (for example "kuman dalam badan", or "Keadaan: sakit teruk / sihat"). | improved (class fix; see status table) |
| C09-18 | Nurul | §4.9 | The lesson 3 summary card repeats "kuman sebenar" and "vaksin" but never connects them to the vaccine types used in Malaysia. | Not stated; implied: connect to the types used in Malaysia. | improved (class fix; see status table) |

## C10 Level picker

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C10-01 | Aisyah | §2.2; imp 16; 001 | Levels read "Novice / Beginner / Intermediate / Expert / Professional"; "Beginner" is pre-selected so a skipper gets it by default; she knows SOH CAH TOA but not why and can't tell which pill is hers; "Professional – Work in it" is meaningless to a student and "makes her feel judged". | Three options in plain language: "Baru mula", "Pernah belajar tapi tak faham", "Nak ulang kaji". Preselect nothing, or the lowest. Hide Expert and Professional unless asked (behind "More"). | fixed (class fix; see status table) |
| C10-02 | Kumar | §2 #17; imp 13; 002, 003 | "Beginner" is already filled black though he has never used the thing; if he skips this he silently gets the wrong level. | Preselect nothing, or ask "Have you used ChatGPT before? Yes / A little / No" instead of five labels. | fixed (class fix; see status table) |
| C10-03 | Lim | §2.1; imp 14; 001 | "Beginner" is pre-selected, black and filled, with no word about it; she tapped it and nothing seemed to change and wondered if her tap counted. | State "Beginner is chosen for you. Tap another to change." or leave all five unselected until she picks one; add one line saying she can change level later. | fixed (class fix; see status table) |
| C10-04 | Daniel | §2 #1; imp 24; 001, 002 | "Beginner" was pre-selected; Expert needed a tap and the selection change is subtle. | Either no pre-selection or an obvious selected state. | fixed (class fix; see status table) |
| C10-05 | Nurul | §2.1; imp 16; 001 | The site does not explain what "level" changes; Beginner is already highlighted without saying so; a nurse is a "Professional" on medicine but the learner here is the parent, so she guessed. | Replace "Your level" with a plain question: "Anda belajar untuk siapa?" with "Untuk saya", "Untuk menerangkan kepada orang lain", plus an optional "Saya sudah tahu asasnya"; do not pre-select a level without saying so. | fixed (class fix; see status table) |

## C11 Controls move by themselves / layout jumps / keyboard squashes figure

Severity P1. 7 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C11-01 | Aisyah | §2.8; imp 6; 021, 022 | While she types her question the triangle is squashed to about 60 px and "hypotenuse", "adjacent" and "θ = 20°" are written on top of each other. | When the keyboard is open don't shrink the figure: keep it fixed, collapse it to a static thumbnail, or let the page scroll. | fixed (class fix; see status table) |
| C11-02 | Aisyah | §2.13; imp 8; 067, 071, 078 | The sliders move under her finger: the track gets shorter or longer as the number beside it gets wider, so the same finger movement gives different results ("The sliders annoyed me because they jumped around"). | Fix the width of the number readout so the track doesn't resize. | fixed (class fix; see status table) |
| C11-03 | Lim | §2.7; imp 9; 022, 043, 092 | The marker moves on its own: after the quiz answer it jumped to the middle (550 nm) with no touch (022); the wavelength changed to 450 by itself (043); the Sun height changed to 2° by itself when she only touched the dust slider (092); in lesson 2 it jumped her slider by itself twice. | Never move a control the person has touched without saying so ("I've moved it to show you" / "I've set it to 450 nm for you"). | fixed (class fix; see status table) |
| C11-04 | Lim | §2.10, §3; imp 10; 028, 030, 091, 092 | The layout jumps: the diagram moved about 16 px up between 028 and 030 as the hint box changed; the sky box and sliders shifted between 091 and 092; the bottom pill ("Drag the marker to the red end.") jumps between one and two lines. | Reserve fixed space for the banner and hint so the diagram never moves. | fixed (class fix; see status table) |
| C11-05 | Daniel | §2 #12, §3; imp 15; 083, 087, 096, 097, 011-028 | The slider panel jumps vertically between steps, so a drag at the same coordinates hits a different slider and tasks complete with a different slider value than they say (090, 097); the lesson 1 layout also shifts between steps so "you lose your place". | Reserve a fixed area; keep the d_k, spread and τ sliders in a stable position under the chart. | fixed (class fix; see status table) |
| C11-06 | Daniel | §2 #14; imp 9; 117 | The swap demo: the matrix shrank to about half size and the row labels slid out of alignment with the rows (the, sat, down, cat). | Don't shrink the matrix; the row and column labels must stay aligned with the cells. | fixed (class fix; see status table) |
| C11-07 | Nurul | §2.3; imp 17; 012, 014 | The shapes pulse and drift: the shield sits at y=693 in 012 and at y=668 a moment later in 014; a tap that lands on the old position misses. | Stop the pulse animation and the drift while a tap is expected. | fixed (class fix; see status table) |

## C12 Show-me semantics + stuck-escape discoverability

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C12-01 | Aisyah | §2.6; imp 10; 016, 018 | After she pressed "Show me" θ jumped to 50° and the card turned green with a tick and the text "The two sides that touch θ…". She gets "a tick for doing nothing"; "well done" "felt a bit fake". | Replay the action as a visible animation with a one-line caption ("Tengok: sudut naik, sisi tegak jadi panjang"); mark the step "shown", not "done". | fixed (class fix; see status table) |
| C12-02 | Kumar | §3.8; imp 11 | "Show me" is plain grey text next to a faded "Continue"; it is easy to miss and looks disabled, yet it is the only way out when stuck. | After one wrong tap show a clear "Show me" button with a border; after two, offer it automatically. | fixed (class fix; see status table) |
| C12-03 | Kumar | §3.9; imp 11 | The chat icon (round speech bubble) has no label; he only found it because he tapped it. | Label it "Ask a question". | fixed (class fix; see status table) |
| C12-04 | Daniel | §2 #6; 014, 016 | The query dot had frozen after "Show me", with no explanation; he expected it to still be draggable. | Not stated; implied: leave the control usable after "Show me" or say why not. | fixed (class fix; see status table) |
| C12-05 | Nurul | §2.8; imp 24; 035, 036 | "Show me" answered "Lekuk itu dipanggil reseptor. Ia seperti lubang kunci." and enabled Continue though she never tapped the notch; it skips the exercise instead of demonstrating it, and the lesson summary later says she learned it. | Animate where to tap, then let her try (and rename it "Tunjukkan"). | fixed (class fix; see status table) |

## C13 Course ending / recap / practice / share

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C13-01 | Aisyah | §2.18, §6, §7.5; imp 15; 114, 122 | "All lessons" opens the same course outline shown at the start; no score, no "you finished 4/4", no SPM-style practice, no "try cos next". With SPM in three weeks she wants practice and a feeling of "I can do the exam". Her words: "Bagi aku soalan macam SPM dan beritahu aku dah boleh ke belum." | A short ending screen: "Kau dah faham sin. Nak cuba 3 soalan gaya SPM?" with a button; "4 of 4 done", 3 SPM-style questions with a score, and a "Next: cos and tan practice" button. | fixed (class fix; see status table) |
| C13-02 | Aisyah | §3; imp 19; 032, 087, 111 | The "LESSON DONE" recap is a wall of 4 bullets plus another paragraph, and the bottom of it is cut off behind the button. | 2 bullets maximum plus one "Remember this" line, and make sure the last line isn't hidden behind the button. | fixed (class fix; see status table) |
| C13-03 | Lim | §1, imp 19 | No "Teach it to a child" ending: "If I had to teach it this weekend I could manage, but only because I already knew most of it." | After lesson 4, a short 3-sentence summary she can read aloud plus an optional demo she can show on the phone. | fixed (class fix; see status table) |
| C13-04 | Daniel | §3; imp 27; 043, 104 | Lesson summaries are just the feedback snippets pasted together and refer to the UI ("the orange output snapped to that key's value"); they miss the best idea of the lesson, the convex hull. | Write takeaways, not UI feedback; include the convex-hull point and the actual formula. | fixed (class fix; see status table) |
| C13-05 | Nurul | §2.23; imp 11; 137 | The last card has only "All lessons": no summary of all four lessons, no "Share with a parent", no "Save", no print or replay. Her goal was to show something to a mother. | A final summary card with the three or four main points (four bullet points covering the whole course), a "Kongsi" button (WhatsApp link), "Mula semula dari awal" / "Mula semula", and "Cetak". | fixed (class fix; see status table) |

## C14 Follow-up chat answer quality

Severity P1. 7 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C14-01 | Aisyah | §2.17; imp 21; 122, 086 | The answer ends "Untuk exam, hafal SOH-CAH-TOA": "the exact thing she came here not to do"; it contradicts lesson 3's own "You don't need to remember which ratio" (086). | Have the answer finish with the reasoning for each ratio ("cos: ratio bagi sisi sebelah sudut"); show a tiny mnemonic only as an optional extra. | improved (class fix; see status table) |
| C14-02 | Kumar | §2 #6; 024 | The AI's own answer says "The fruits and vegetables are the cluster near the bottom; mango is still up by king and queen. Drag the up-and-down slider down to about -2." Mango is at (2,-2) near the bottom and there is nothing else there. | The tutor answer must be checked against what is actually drawn; draw the cluster so the answer is true. | improved (class fix; see status table) |
| C14-03 | Lim | §2.19; imp 16 | The answer, if she could read it, is thin: "the Sun sends a little purple, lots of blue; our eyes love blue best". For an 8-year-old it skips the key idea (the air bounces blue around more); there is no simple analogy (small ball against pebbles, or small waves against a post). | Use the lesson's own picture ("tiny air bits bounce the short blue waves like small balls off pebbles") and explain "pale violet to our eyes"; tell her which lesson it relates to. | improved (class fix; see status table) |
| C14-04 | Daniel | §4 wrong #5; imp 32; 073 | The chat did not concede that the lesson was wrong when challenged. | If the user quotes the lesson and the lesson is wrong, say so and flag it. | improved (class fix; see status table) |
| C14-05 | Daniel | §1, §4; imp 6; 039 | The answer on √d_k was correct but terse and cut off mid-sentence; it states the variance point with an unstated assumption and says "the demo's distance is just a 2D stand-in". | Add "assuming q and k components have unit variance, q·k has variance d_k"; remove the "demo's distance is a 2D stand-in" line by actually fixing the demo. | improved (class fix; see status table) |
| C14-06 | Nurul | §4.8; imp 9; 125 | The chat answer ("Vaksin selamat dan demam ringan selepas suntikan adalah tanda biasa sistem imun sedang belajar, bukan bahan berbahaya. Ia biasanya hilang dalam 1-2 hari. Tanya doktor jika demam tinggi atau berlarutan.") says "bukan bahan berbahaya" without saying what is in a vaccine, so it does not answer the ingredients question; halal (a Kelantan mother's first question) is not addressed (a gap, not an error). | State what vaccines contain, naming the main kinds of ingredients in plain words. | improved (class fix; see status table) |
| C14-07 | Nurul | §4.8; imp 9; 125 | "Demam tinggi" is vague (no number or sign); "Tanya doktor" - in a clinic she is the one being asked. | Give a concrete sign or threshold from a clinician-approved text (for example a limp child, will not feed, or a seizure); say "Rujuk jururawat atau doktor klinik anda" / "Rujuk jururawat atau doktor di klinik kesihatan". | improved (class fix; see status table) |

## C15 Miss / wrong-answer feedback

Severity P1. 7 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C15-01 | Aisyah | §2.5; 014, 015 | Two further drags changed nothing and gave no message at all. | After 2 failed tries, say "Letak jari kat titik oren dan gerak ke atas". | fixed (class fix; see status table) |
| C15-02 | Aisyah | §5; 039, 084 | "Not quite. Watch:" followed by a one-line explanation doesn't give her a second chance to try; the wrong option just turns orange and the right one green (the gentle tone itself is good). | Not stated; implied: let her retry. | fixed (class fix; see status table) |
| C15-03 | Kumar | §2 #2; imp 11; 010-013 | Three wrong-answer messages in a row ("Not that one. Tap the word closest to 'cat'.") with no reason. | Explain it: "Close, but on this map dog sits nearest. Kitten is also very near."; after two wrong tries auto-offer "Show me" with a highlighted answer. | fixed (class fix; see status table) |
| C15-04 | Lim | §2.8; imp 3; 030, 032, 034 | The message never says what her tap hit; she thought "Is my finger too big?" and gave up on the third try. | Tell her what was missed: "You tapped the empty air. The atoms are the grey circles." | fixed (class fix; see status table) |
| C15-05 | Daniel | §2 #8; imp 21; 045, 046, 048 | He could not find "the query arrow": tiny cluster, labels over arrows, and "Not that one" ×3 with no hint of which arrow was which. | Label the arrows ("tap the blue arrow") or highlight the target on hint. | fixed (class fix; see status table) |
| C15-06 | Daniel | §2 #18; imp 18; 093 | The wrong-answer response is "Not quite. Watch: One-hot weights give almost no gradient…". There is nothing to watch, and it just gives away the answer. | Remove "Watch:" unless something visibly animates; make wrong-answer feedback useful and not just the answer. | fixed (class fix; see status table) |
| C15-07 | Nurul | §2.3; 012-016 | The error message "Not that one. Tekan perisai hijau di kanan." repeats the same instruction without helping. | A warm Malay hint: "Hampir! Cuba perisai hijau yang berlabel 'pengawal'." | fixed (class fix; see status table) |

## C16 Jargon / unexplained terms

Severity P1. 8 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C16-01 | Aisyah | §3 | Too English: "hypotenuse", "adjacent", "quadrants", "cancels out", "frozen at 0.57", "rim", "readout". Sentences like "The names stay tied to θ, not to the picture" are abstract. She would translate each of them in her head. | Not stated beyond keeping maths terms bilingual ("hypotenuse (hipotenus)"); implied: plain wording. | improved (class fix; see status table) |
| C16-02 | Kumar | §2 #8; imp 9; 009, 015 | Plain coordinates such as "mango is (-3,-3)" and "(0,0)" with no explanation of what two numbers mean, though it is "the one concept the lesson is about (a word as a list of numbers)". | Put "Each word is just two numbers: how far across, and how far up" next to it, with thin guide lines from the axes to the dot. | improved (class fix; see status table) |
| C16-03 | Kumar | §2 #9; imp 8; 035, 036 | A "Temperature" slider appears right after he taps the tallest bar, with no explanation; he worked it out only from the quiz that followed. | Label it "How adventurous (temperature)" with "Safe" on the left and "Wild" on the right. | improved (class fix; see status table) |
| C16-04 | Kumar | §2 #12; imp 8; 054, 061, 065 | "Dials" are never explained: five small gauge icons labelled "dials"; he does not know what a dial stands for in a computer. | "A dial is one tiny number inside ChatGPT that decides how much it likes a word. Nobody sets them by hand." | improved (class fix; see status table) |
| C16-05 | Kumar | §3.6; imp 8; 029 | Jargon: "embedding" (029 text), "training steps", "GPT-3 has 175 billion dials". | Introduce each with a one-line everyday comparison (a forklift/warehouse analogy: "like a picker who has seen millions of orders and guesses the next item"); compare the "175 billion" fact to something countable. His words: "Explain the big words in one line, with an example from my warehouse." | improved (class fix; see status table) |
| C16-06 | Lim | §2.2; imp 13; 007 | "wavelength: 550 nm", "nm", "sunlight" and "drag me" appear with no explanation; nobody said "nanometres". | One plain sentence before the bar (wavelength is the length of one wave of light, and a nanometre is a very tiny unit of length), or label it "length of the light wave". | improved (class fix; see status table) |
| C16-07 | Daniel | §4 wrong #11; imp 16; 099 | Temperature τ is introduced as a lever alongside d_k; in standard attention √d_k is the temperature, and the page never says √d_k equals τ. | Say "the √d_k factor is just a fixed temperature τ = √d_k." | improved (class fix; see status table) |
| C16-08 | Nurul | §3 Malay #12, §4.7 | "kuman" is used for everything and "antigen" is never mentioned; "antibodi" never appears though mothers hear it in the clinic; the actual pieces (B cells, antibodies, T cells) are skipped. | At least once: "kuman (bakteria atau virus)"; add one line: "Pengawal menghasilkan antibodi." | improved (class fix; see status table) |

## C17 Pacing / micro-steps / one task per screen

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C17-01 | Aisyah | §2.7; imp 11; 019, 101 | Two instructions at once: the top card says "Now drag θ down to 20°. What happens to the names?" and the bottom card asks "As θ shrinks, the side called opposite…" with three options; she doesn't know whether to drag first or answer first (101 does the same in lesson 4). | One task per screen: either "drag, then answer" over two screens, or only the question with the drag as optional "Cuba sendiri"; remove "Before you drag:" prompts that appear with an active drag target. | improved (class fix; see status table) |
| C17-02 | Aisyah | §2.14; imp 13; 105 | "Drag the dot all the way round and watch both readouts flip sign." is a very long drag on a small screen; she hit "Show me" and learned nothing. | Split into 4 quick steps ("Tap 90°", "Tap 180°"…) or add quadrant buttons; replace "all the way round" with four quick tap steps. | improved (class fix; see status table) |
| C17-03 | Aisyah | §3, §6; 037→039, 084→086 | Boring bits: after "Continue" there is often a card that just restates what the last card said; roughly a third of the screens are one-line reading with a tap; she would come back "only if lesson 1 were shorter and faster". | Not stated; implied: cut restating cards and shorten lesson 1. | improved (class fix; see status table) |
| C17-04 | Kumar | §3.5; imp 10 | Too many micro-steps: lesson 1 has about 8 steps (drag, drag, quiz, back, drag, continue) and lesson 3 the same; "5 lessons" is really about 30 steps. | Limit each lesson to 3-4 steps. His words: "Fewer little steps, and tell me while I wait." | improved (class fix; see status table) |
| C17-05 | Nurul | §2.6, §6; imp 10 | It takes about 8 minutes of tapping to reach the vaccine content; a worried mother in a waiting area will not wait. | Compress "kuman dan pengawal" and "reseptor" into one lesson with two tasks, or make lesson 3 reachable in about two minutes. | improved (class fix; see status table) |

## C18 UI chrome not localized / language matching

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C18-01 | Aisyah | §2.3b; imp 3; 009, 032 | She typed Malay but the lessons, buttons and instructions are all English; the only Malay she saw was the chat answer; long English sentences tire her. Her words: "Cakap Melayu dengan aku. Kalau aku taip Melayu, semua pun Melayu, atau bagi butang BM/English." | Detect the language of the first message and ask "Nak guna Bahasa Melayu?"; offer a "Bahasa Melayu / English" toggle on the first screen; translate card text; keep maths terms bilingual: "hypotenuse (hipotenus)", "opposite (bertentangan)", "adjacent (bersebelahan)". | fixed (class fix; see status table) |
| C18-02 | Nurul | §2.1, §3; imp 12, 16; 001 | The landing screen is English before she has told the site her language: "What do you want to understand?", "Your level", Novice (New to it), Beginner (Know a little), Intermediate (Studied it), Expert (Use it often), Professional (Work in it), "Type any topic". | Detect the phone language (Malaysian phones usually report ms-MY) or show a small "Bahasa Melayu \| English" switch at the top; "What do you want to understand?" → "Apa yang anda mahu fahami?"; "Type any topic" → "Taip mana-mana topik". | fixed (class fix; see status table) |
| C18-03 | Nurul | §2.2, §3; imp 12; 005, 006, 007 | Loading steps are English: "Building your course", "Reading up on it", "Choosing what to learn first", "Designing hands-on lessons", "Drawing lesson 1". | Show the loading steps in the course language. | fixed (class fix; see status table) |
| C18-04 | Nurul | §3; 009, 017, 040 | Feedback openers are English inside a Malay lesson: "Spot on.", "That's it.", "Exactly.", "Nice.", "Right.", "Yes.", "Not that one.". | "Betul!", "Tepat sekali.", "Bagus."; "Not that one." → "Bukan yang itu. Cuba lagi." | fixed (class fix; see status table) |
| C18-05 | Nurul | §3; imp 12 | Buttons and headings are English: "Show me", "Continue", "Finish lesson", "Next lesson", "All lessons", "LESSON 1 DONE", "Lesson 2 of 4", "Back to the lesson", "You asked:", "Ask anything about this". | "Tunjukkan", "Teruskan", "Tamat pelajaran", "Pelajaran seterusnya", "Semua pelajaran", "PELAJARAN 1 SELESAI", "Pelajaran 2 daripada 4", "Tanya apa-apa tentang ini". | fixed (class fix; see status table) |

## C19 Slider ergonomics

Severity P1. 6 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C19-01 | Aisyah | §2.5; 011-015 | The ask is "about 50°" with no clear range; nothing she did looked like cause and effect. | Show a visible target zone, for example a 45–55° band on the arc; snap the dragged value to the nearest 5°. | fixed (class fix; see status table) |
| C19-02 | Aisyah | §2.13, §2.14; imp 8, 13; 067, 071, 078, 094 | Asked for 20 m she landed on 24.5, then 26.5, then 20 on the third try; asked for 15 m she landed on 7.5 m before 15; "Drag the dot until its height is exactly 0.5" is impossible with a finger (it accepted 0.51 but she doesn't know). | Snap to whole metres; large −/+ buttons on each side; accept ±0.5 m (±0.05 for the circle); say "about 0.5 (between 0.45 and 0.55)". | fixed (class fix; see status table) |
| C19-03 | Daniel | §2 #17; imp 11; 131 | The mask is a continuous slider (0.75), "which makes no sense for a mask". | A toggle, not a 0.75 slider. | fixed (class fix; see status table) |
| C19-04 | Nurul | §2.12; imp 21; 060, 062 | The slider "Apa yang masuk?" shows only "0" or "1"; she must discover by accident that 0 means "kuman sebenar" and 1 means "vaksin". | Use a two-option switch with words: "Kuman sebenar \| Vaksin". | fixed (class fix; see status table) |
| C19-05 | Nurul | §2.15, §3 Malay #10; imp 21; 071 | "Latihan pertahanan 0.4" then "pertahanan: 40%"; "0.4 latihan" means nothing and "Latihan" does not read like a quantity ("Latihan ingatan" likewise). | Show three steps with words ("Tiada / Sedikit / Cukup") or remove the number; "Tahap latihan: Tiada / Sedikit / Cukup". | fixed (class fix; see status table) |
| C19-06 | Nurul | §2.20; imp 23; 108, 111, 112 | The "Latihan ingatan" slider track is about 70 px wide beside the label; dragging selected the label text (blue highlight, 108), reached only 0.1 and 0.25, and after "Show me" it read 0.9; the chart does not obviously change when she moves it. | Give the slider a full-width track, disable text selection, and make the chart visibly change with the slider. | fixed (class fix; see status table) |

## C20 Malay wording, register, metaphors

Severity P1. 7 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C20-01 | Nurul | §2.22; imp 15; 131 | The lesson list descriptions begin "Menerangkan bahawa badan anda mempunyai...", "Menerangkan bahawa setiap kuman mempunyai 'tanda pengenalan'..." - objectives written for a teacher; "Nobody talks like this to a learner." | Write them from the learner's side: "Anda akan tahu bahawa badan anda sudah ada sel pertahanan." | improved (class fix; see status table) |
| C20-02 | Nurul | §3 Malay #1; imp 13; 008, 012 | "Tekan" (lesson 1: "Tekan kuman merah") versus "Ketik" (lesson 2: "Ketik lekuk") for the same action; "Tekan" (press) sounds like a physical button. | Use "Ketik" everywhere and "Seret" for drags. | improved (class fix; see status table) |
| C20-03 | Nurul | §3 Malay #2; imp 14; 070 | "Tarik slaid untuk beri pengawal latihan": "slaid" is a transliteration of English "slide"; "beri pengawal latihan" is awkward. | "Gerakkan peluncur untuk melatih pengawal." | improved (class fix; see status table) |
| C20-04 | Nurul | §3 Malay #3; imp 14 | "Pengawal" (a security guard) for white blood cells next to "Pasukan Keselamatan" (reads as police or army in Malaysia); the text also uses "sel pertahanan" and "sel darah putih" for the same cell. | "askar badan (sel darah putih)" ("sel darah putih ialah askar badan"), then always the same name; "Pasukan Keselamatan" → "Askar Badan". | improved (class fix; see status table) |
| C20-05 | Nurul | §3 Malay #4; imp 14; 079 | "Kenali Muka Penjenayah" and "gambar muka penjenayah": "penjenayah" (criminal) for a germ is heavy with children around, and "muka" is blunt. | "Kenal Rupa Musuh"; "gambar rupa kuman". | improved (class fix; see status table) |
| C20-06 | Nurul | §3 Malay #5, #6, #7; imp 14; 115 | "Ingatan Yang Kekal" ("kekal" means permanent, but immunity from some vaccines wears off); "Badan sudah hafal" ("hafal" is memorising by heart, like a surah); "terus kebal" ("kebal" evokes invulnerable). | "Badan Yang Mengingati"; "badan sudah mengenali kuman itu" or "badan sudah ingat"; "terus berimuniti" (the standard word is "imun" or "berimuniti"). | improved (class fix; see status table) |
| C20-07 | Nurul | §3 Malay #8 | Mixed register: most text is formal ("Sekarang tukar kepada vaksin") but some options are slangy ("tak rasa apa-apa", "Sebelum buat apa-apa"). | Pick one friendly register: polite everyday Malay with "tidak". | improved (class fix; see status table) |

## C21 Expert depth

Severity P1. 5 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C21-01 | Daniel | §3; imp 30; 021, 064 | Quiz questions mostly give away the answer: "Rotating the key changes the score because… the value vector shrinks / the dot product q·k changes / the softmax denominator changes" is trivially answered by elimination. | Make distractors plausible; "the softmax denominator changes" should be a real trap, not a throwaway. | improved (class fix; see status table) |
| C21-02 | Daniel | §3; imp 29; 068 | The Expert level still says "query asks, key answers, value carries the content": "exactly the baby analogy Daniel hates". | Remove the analogy for Expert and replace it with one sentence on what W_Q and W_K buy you (asymmetric scores). | improved (class fix; see status table) |
| C21-03 | Daniel | §3; imp 28 | It never writes the actual formula softmax(QKᵀ/√d_k)V in anything he saw. | Add the scaled dot-product formula softmax(QKᵀ/√d_k)V somewhere visible, with the shapes. | improved (class fix; see status table) |
| C21-04 | Daniel | §4; imp 33 | Depth for Expert is mixed: everything beyond convex hull, gradient vanishing and variance reasoning is "closer to Intermediate"; multi-head, O(n²) cost, softmax in float16, KV cache and cross-attention were not covered; no pointer to the "Attention Is All You Need" derivation. | Add multi-head attention, O(n²) cost and cross-attention to the Expert path, and a pointer to the "Attention Is All You Need" derivation. | improved (class fix; see status table) |
| C21-05 | Daniel | §4; imp 29 | No explanation of why you project into separate Q, K and V spaces at all, or why W_Q and W_K differ (an asymmetric score versus Q=K). | One sentence on what W_Q and W_K buy you (asymmetric scores). | improved (class fix; see status table) |

## C22 Contrast / size / figure scale / dead space

Severity P2. 7 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C22-01 | Aisyah | §2.10, §3; imp 4; 022, 027, 030, 034, 037, 041, 104 | Figures are tiny: the lesson 2 triangle is about 150 px wide on a 360 px screen with much empty space above, only about 90 px wide at prediction time (037); "the figure is the thing she came to see, and it is often the smallest element"; the serif heading and instruction card use a lot of space for two lines while the figure is pushed to the bottom with large gaps above it (030). | Scale the figure to about 90% of the card width. Her words: "Besarkan gambar". | fixed (class fix; see status table) |
| C22-02 | Kumar | §3.3; imp 14; 009, 014, 024 | "queen" is clipped at the right edge (009, 014); the long tutor answer reaches the bottom of its card and almost touches the edge (024). | Keep chart labels off the right screen edge and long tutor answers within the card. | fixed (class fix; see status table) |
| C22-03 | Kumar | §3.7; imp 14; 002, 044 | Grey helper text such as "Know a little", "Your level" (002) and the greyed "mat" and "sofa" labels after a step (044) are low contrast for a man in a bright canteen. | Raise the contrast of grey helper text and faded labels. | fixed (class fix; see status table) |
| C22-04 | Lim | §3; imp 15; 007 | The rainbow bar is washed with a white fade, so orange and red look like pink-brown; she would struggle to tell "red" from "orange". | Full-strength colours. | fixed (class fix; see status table) |
| C22-05 | Lim | §3; imp 15; 001 | Grey and light text: "Your level" (001), "Lesson 1 of 4" and the sub-labels under each level ("New to it", "Know a little") are thin grey on cream. | Darker grey, about 4.5:1 contrast at least, and 16 px or larger for sub-labels. | fixed (class fix; see status table) |
| C22-06 | Lim | §3; 007, 013 | Big dead space: a tall blank area between the banner and the bar; the key thing is small in the middle of a lot of nothing. | Not stated; implied: scale the bar up / remove the gap. | fixed (class fix; see status table) |
| C22-07 | Daniel | §2 #9, §3; 045, 051, 053, 060 | The lesson 2 diagram is a tiny cluster pushed to the right edge (lower right) with a large empty area. | Not stated; implied: scale and centre the figure. | fixed (class fix; see status table) |

## C23 Chart / axis readability

Severity P2. 8 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C23-01 | Aisyah | §2.15; imp 14; 104 | In 104 the circle is about 200 px wide with the axis numbers (−1.5, −1, −0.5…) crowding it. | Hide the grid numbers. | improved (class fix; see status table) |
| C23-02 | Lim | §2.13; imp 11; 052, 056, 060 | Lesson 3 is overloaded: three curves, a dashed line, a red dot, a "scattered: 45%" label and an "eye sees: 100%" label. | Show one curve at a time (scattering first), then add eye sensitivity on a later step. | improved (class fix; see status table) |
| C23-03 | Lim | §2.13; imp 11; 067 | At the violet end it says "scattered: 132%" and "152%"; she can't see how a share of something is more than 100%. | Cap or explain percentages over 100. | improved (class fix; see status table) |
| C23-04 | Lim | §3; imp 15; 060 | Faded graph curves: "scattered by air" and "eye sensitivity" are pale and low-contrast. | Stronger colours and direct labels at the line ends, kept clear of overlaps. | improved (class fix; see status table) |
| C23-05 | Lim | §3; imp 15; 052 | Small axis labels: "0.1 … 1", "400 … 650", "wavelength (nm) →" are small for glasses at arm's length; the y-axis "amount" is unexplained. | Bigger axis numbers; explain "amount". | improved (class fix; see status table) |
| C23-06 | Daniel | §3; imp 13; 079, 081, 087 | The lesson 3 chart is axis-less with bars cut off at the bottom, no values, no percentages and no legend; the only labels are "max", "biggest share" and "one-hot limit"; it "does not read as a softmax bar chart". | A y-axis from 0 to 100%, numeric percentages and a legend. | improved (class fix; see status table) |
| C23-07 | Nurul | §2.18; 089, 090, 098 | A black label at the top of the chart reads "hari 3: merah", "hari 7: merah", "hari 13.9: merah" ("hari 3.11: merah" in 089); she has no idea what it means and it shows decimals. | Delete it, or write "Hari ke-7" only, and round to whole days. | improved (class fix; see status table) |
| C23-08 | Nurul | §3; imp 5 | The chart's y-axis has numbers (2, 4, 6, 8) with no unit; "kekuatan pertahanan" has no scale a parent can understand. | Label the y-axis with words ("rendah / tinggi") instead of 2, 4, 6, 8. | improved (class fix; see status table) |

## C24 Progress bar meaning + unexplained grey Continue

Severity P2. 4 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C24-01 | Kumar | §3.5 | The progress bar splits each lesson into 6 segments, so "5 lessons" is really about 30 steps. | Not stated; implied: make the segments mean something (see Lim's "Step 2 of 5"). | fixed (class fix; see status table) |
| C24-02 | Lim | §5; imp 17 | The progress bar has 6 segments while the title says "Lesson 1 of 4"; she can't tell what the 6 mean. | Label it "Step 2 of 5", or use one segment per step with a clear count. | fixed (class fix; see status table) |
| C24-03 | Nurul | §3; imp 29; 064, 088 | The progress bar has 5 segments in lessons 1 to 3 and 6 in lesson 4; "I do not know what a segment means." | Make the progress bar consistent (the same number of segments for every lesson, or none). | fixed (class fix; see status table) |
| C24-04 | Nurul | §3; imp 30 | The "Continue" button is grey with no explanation until a task is done; a grey button with no reason looks broken. | Show "Selesaikan langkah di atas" when it is grey. | fixed (class fix; see status table) |

## C25 Untested coverage

Severity P2. 4 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C25-01 | Aisyah | §5; imp 22 | Not tested (marked unverified): offline or slow network, very long input, emojis, gibberish topics, reload mid-lesson (progress saving), a level other than Novice, double tap on Continue, a real Xiaomi/Android at 360 px, "ignore your instructions"; whether the lesson 1 redraw lag is real. | Run these before shipping. | improved (class fix; see status table) |
| C25-02 | Kumar | Intro, §4 | He stopped partway through lesson 4 of 5 so lesson 5 is unreviewed; all taps were synthetic and some dead taps "may be my tap accuracy". | Re-test lesson 5 and the four dead taps on a real touch device. | improved (class fix; see status table) |
| C25-03 | Daniel | Intro, §6, imp 34 | Not tested: a real touch screen (mouse emulation, so the lesson 4 cell tap, the causal-mask slider and the lesson 1 value-vector tap may be partly the tool), real dark mode (the site rendered light on a dark phone), slow 4G, first load on a real device; lesson 5 never seen. | Verify on a real phone, in dark mode, and on slow 4G. | improved (class fix; see status table) |
| C25-04 | Nurul | Intro, §5.7 | Could not verify: whether the page works offline or on a poor connection, whether the URL is stable, how it behaves on a real Oppo (360x800 emulated); she never saw an address bar, share button or print option so cannot say whether a lesson has a shareable link; loading was not timed precisely (8 to 15 s waits). | Test on a real device and slow data; check for a shareable link. | improved (class fix; see status table) |

## C26 Home input / first screen

Severity P2. 2 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C26-01 | Aisyah | §2.1; imp 20; 001, 003 | Text box is hidden at the very bottom ("a very small 'Type any topic' bar"). She "tapped the middle of the page, expecting a field under the heading. She got no response and thought it was frozen." Nothing else is tappable. | Make the heading area itself tappable and focus the text box; move the box up under the heading; placeholder as a full sentence, "Contoh: trigonometri, hukum Newton"; show 3 example topic chips she can tap. | fixed (class fix; see status table) |
| C26-02 | Daniel | §2 #2; imp 25; 004, 006 | After he selected the field the default blue browser outline appeared around it inside the rounded box, "which looks like a bug". | Remove the browser focus outline from the input; use a branded focus ring. | fixed (class fix; see status table) |

## C27 Course menu / lesson list

Severity P2. 2 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C27-01 | Aisyah | §2.19; imp 18; 059, 061, 114 | The course menu sheet shows the 4 lessons with descriptions like "say why they go negative in some quadrants"; her drag did not scroll it, so the Sources list below the fold is unreachable. | Make the sheet scrollable. | fixed (class fix; see status table) |
| C27-02 | Aisyah | Intro; 059 | Typing "sin" opened the course menu (the reviewer's own slip, kept because "a real thumb could make them too"). | Not stated by the reviewer; implied: find out why typed letters open the menu. | fixed (class fix; see status table) |

## C28 Course title / header overflow

Severity P2. 2 items.

| ID | Who | Ref | Complaint | Their fix | Status |
|---|---|---|---|---|---|
| C28-01 | Daniel | §2 #3; imp 23; 007 | The whole typed sentence ("how attention works in transformers - queries keys values, why softmax weighting works") became the 4-line headline of "Building your course" in giant serif; "looked sloppy". | Shorten the user's sentence to a topic name ("Attention in transformers"), or let the user edit it. | fixed (class fix; see status table) |
| C28-02 | Daniel | §2 #4; imp 19; 009, 011 | The header title ("Attention in Transformers: Q/K/V and Why Softmax Weighting…") overflows the screen, is clipped on the left, and collides with the back chevron and the menu icon, on every screen. | Truncate the header title ("Attention: Q/K/V" or the first ~25 characters with an ellipsis) and keep the back and menu icons clear. | fixed (class fix; see status table) |

## Keep

Positives the reviewers named. Do not regress these while fixing the rows above.

- Calm look (all five): Aisyah "very white and clean, like not the e-learning portal" and "the colour, whitespace and tone are calm. That helps with the anxiety"; Lim "calm and serif-led" and professional black and white buttons, large clear serif banner text, big black "Continue"; Nurul "calm and legible" with large readable serif text; Kumar "Headline serif text is readable".
- Plain-word level labels: Kumar "Good that they say it in plain words."
- Predict-then-reveal questions and the "Show me" fallback as teaching moves (Lim); Aisyah's lesson 2 guess-then-stretch, ending in "sin is just the name for opposite ÷ hypotenuse" ("That was the click", 043, 048); Kumar's temperature bars (036, 040) and the training slider with wrongness falling (065), "the guessing game and temperature well".
- Gentle wrong-answer tone (Aisyah "nobody shouted at me", "It was gentle about it"; the green tick and "Spot on").
- The staged "Building your course" loader (Lim 006: "It told me what it was doing").
- Lesson-done recap cards (Lim 026: "she would use them to revise").
- Malay answers to Malay questions (Aisyah "it answered in proper Malay. Nobody has ever done that for me"; Nurul "the lesson text was in proper Malay... I liked it", "Malay in the lesson body is mostly natural and the tone is friendly", chat answer Malay natural).
- Tutor and chat answers that are plain and honest: Kumar's "it can still be confidently wrong" (048) and "the model didn't do that check, you did" ("the most useful sentence on the site"); Daniel's correct, first hard answer on √d_k (039); Kumar's "meaning becomes distance" line (030).
- The honest AI disclaimer and a real-looking Sources list when the sources are topical (Lim 109: Met Office, NASA Space Place, Hong Kong Observatory; "it never invented a source"). Keep the disclaimer content; fix its language and placement (C05).
- Correct science Lim confirmed: "Halve the wavelength and scattering jumps 16 times" (047); white light made of all colours; blue more visible than violet; sunset path argument; sensible lesson order (rainbow, bouncing, blue not violet, sunsets).
- Correct technical content Daniel confirmed: soft lookup framing with keys for matching and values for returning (014); convex-hull question (033); raw dot-product scores growing like √d_k (087); saturated softmax gives vanishing gradients (093, 099); causal mask means "token i attends only to j ≤ i" (131); "Attention alone is a set operation… Position must be injected" (137); the "drag a query and see the weights move" concept and the √d_k panel idea; the output snapping to value 1 when the query reaches key 1 (020).
- Correct Malay and medical lines Nurul confirmed: "Vaksin bukan ubat yang membunuh kuman", "Sel pertahanan tidak menyerang secara rawak", the outline's "lemah atau mati atau hanya serpihannya", the "latihan tanpa bahaya" analogy, the touch tasks as "a good idea"; lesson 3 plus the memory graph, once corrected, would make "a good 90-second demonstration".

## Counts


Per persona: Aisyah 42, Kumar 33, Lim 38, Daniel 49, Nurul 59; total 221.

Per class: C01 31, C02 20, C03 6, C04 16, C05 5, C06 5, C07 15, C08 4, C09 18, C10 5, C11 7, C12 5, C13 5, C14 7, C15 7, C16 8, C17 5, C18 5, C19 6, C20 7, C21 5, C22 7, C23 8, C24 4, C25 4, C26 2, C27 2, C28 2.

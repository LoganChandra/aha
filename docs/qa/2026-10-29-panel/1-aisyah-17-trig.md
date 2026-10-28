# Blind persona QA: Aisyah, 17, SPM student: trigonometry

Panel run 2026-10-29 on https://profai-poc.vercel.app. Reviewer: fresh Sonnet subagent, blind to code. Screenshots: ~/profai/qa-shots/2026-10-29/aisyah/ (kept out of git).

I've finished the walkthrough. Aisyah got through all four lessons in about 70 actions and stopped at the "All lessons" screen. The report follows.

Every screenshot is in `~/profai/qa-shots/2026-10-29/aisyah/`. Each path below is written out in full.

Two of my own mistakes are included because a real thumb could make them too:
- Typing "sin" opened the course menu (screenshot 059).
- One tap hit "the same" instead of "shorter" (screenshot 084).

Everything else is what the screen showed.

## 1. Her story (first person)

Okay, so someone in my class said "ProfAI" and I opened it on my Redmi at about 10pm. The first screen was very white and clean, like not the e-learning portal. Good. It asked "What do you want to understand?" and showed Novice, Beginner and so on. I know SOH CAH TOA but I don't understand it, so I picked Novice. Then I tapped the middle of the screen, because the text box was hiding at the very bottom, and nothing happened. I typed "trigonometry sin cos tan, spm nak paham la" and it didn't mind my Malay.

I waited about 15 seconds on "Building your course" with a tiny progress line. Then it said "Lesson 1 of 4" and showed a squiggle labelled "Drawing lesson 1". I thought it was broken, but it was just loading.

Lesson 1 was a triangle. I had to tap the longest side and I got it. A green tick and "Spot on" felt nice, nobody shouted at me. Then it told me to drag a tiny orange dot to 50°. I missed it twice and it did nothing. I pressed "Show me" and it did it for me and said well done, which felt a bit fake. I smiled when I asked it a question in Malay ("kenapa hypotenuse tu always yg paling panjang?") and it answered in proper Malay. Nobody has ever done that for me. But half the answer was cut off and I couldn't scroll it.

Lesson 2 is where I smiled for real. It asked me to guess what happens to opposite ÷ hypotenuse if you double the triangle. I guessed "doubles" and I was wrong. It was gentle about it. Then I stretched the triangle and the number stayed 0.57 no matter how big. Then: "sin is just the name for opposite ÷ hypotenuse." Nobody told me that in school. That was the click.

Lesson 3 gave me a real problem: 20 m hypotenuse, 45°, find the opposite side. I got 14.14 m. It was messy with two "opposite" labels and the answer already written on the picture. The sliders annoyed me because they jumped around. Lesson 4 was a circle with dots. I got lost. They told me cos is "sideways distance" but never told me what cos or tan is in my triangle. I had to ask, and the answer was written but I couldn't see it on screen. I'd come back tomorrow, but not happily.

## 2. Moments she was confused, stuck or unsure

**2.1 The text box is hidden at the bottom, and tapping the middle does nothing.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/001.png` and `~/profai/qa-shots/2026-10-29/aisyah/003.png`
- On screen: a large heading, five pills (Beginner pre-selected), and a very small "Type any topic" bar at the very bottom. Nothing else is tappable.
- Why it bothered her: she tapped the middle of the page, expecting a field under the heading. She got no response and thought it was frozen.
- Fix: make the heading area itself tappable and focus the text box. Move the box up under the heading. Use a placeholder in a full sentence, for example "Contoh: trigonometri, hukum Newton". Show 3 example topic chips she can tap.

**2.2 The "Your level" labels don't match a student's life.**
- Screenshot: `~/profai/qa-shots/2026-10-29/aisyah/001.png`
- On screen: Novice / Beginner / Intermediate / Expert / Professional. "Beginner" is pre-selected, so a skipper gets it by default.
- Why: she knows SOH CAH TOA but not why. She doesn't know which pill is her. "Professional – Work in it" is meaningless to a student, and it makes her feel judged.
- Fix: three options in plain language: "Baru mula", "Pernah belajar tapi tak faham", "Nak ulang kaji". Preselect nothing, or preselect the lowest. Hide Expert and Professional unless asked.

**2.3 The wait with no explanation.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/007.png` and `~/profai/qa-shots/2026-10-29/aisyah/008.png`
- On screen: "Building your course", a thin progress bar, "Reading up on it". About 10 seconds later, a grey squiggle with "Drawing lesson 1" and no content.
- Why: 20+ seconds of blank screen is long for a distracted student, and the second wait looks like a crash.
- Fix: show the lesson title and its text immediately, and fill the diagram in afterwards. Say "Tunggu sekejap, ~15 saat" with a real countdown or step list. Never show an empty card.

**2.3b Everything is in English even though she typed Malay.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/009.png` and `~/profai/qa-shots/2026-10-29/aisyah/032.png`
- On screen: the lessons, buttons and instructions are all English. "hypotenuse", "adjacent", "quadrants" and "metacognition"-style phrases appear in the outline.
- Why: long English sentences tire her. The only Malay she saw was the chat answer.
- Fix: detect the language of the first message. Offer a "Bahasa Melayu / English" toggle on the first screen. Keep the maths terms bilingual: "hypotenuse (hipotenus)", "opposite (bertentangan)", "adjacent (bersebelahan)".

**2.4 The labels already give the answer away, and they collide.**
- Screenshot: `~/profai/qa-shots/2026-10-29/aisyah/009.png`
- On screen: the instruction is "Tap the longest side", but the triangle already says "hypotenuse", "opposite" and "adjacent" in colour. "hypotenuse" and "opposite" run into each other as "hypotenuseopposite". The θ = 35° label is covered by the orange dot.
- Why: the question tests nothing, because the answer is printed on the picture. The overlapping text looks sloppy and she can't tell if it's a bug.
- Fix: hide the side names until she has tapped them, then reveal each one in its colour. Put each label in its own free space with a 6 px gap. Move the θ label away from the dot.

**2.5 The orange dot can't be dragged easily, and the picture doesn't visibly change.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/011.png`, `~/profai/qa-shots/2026-10-29/aisyah/012.png`, `~/profai/qa-shots/2026-10-29/aisyah/013.png`, `~/profai/qa-shots/2026-10-29/aisyah/014.png` and `~/profai/qa-shots/2026-10-29/aisyah/015.png`
- On screen:
  - The dot is about 15 px wide and sits under its own "θ = 35°" text and two callout bubbles.
  - My first drag changed the number to 70° but the triangle looked identical, even a few seconds later.
  - Two further drags changed nothing at all.
  - The blue hint arrow later pointed the opposite way from where I needed to go.
- Why: she thinks "I'm too stupid to drag", or "it's broken". The ask is "about 50°" with no clear range. Nothing she did looked like cause and effect.
- Fix:
  - Make the touch target at least 44 px, as a big ring.
  - Remove the bubbles near the dot.
  - Redraw the triangle live while dragging.
  - Show a visible target zone, for example a 45–55° band on the arc.
  - After 2 failed tries, say "Letak jari kat titik oren dan gerak ke atas".
  - Make the dragged value snap to the nearest 5°.
  - Not verified: whether the triangle on a real device redraws late or only in my screenshot capture. It did redraw by screenshot 020, so at minimum there is a lag.

**2.6 "Show me" completes the task and awards a green tick.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/016.png` and `~/profai/qa-shots/2026-10-29/aisyah/018.png`
- On screen: after I pressed "Show me", θ jumped to 50° and the card turned green with a tick and the text "The two sides that touch θ…". Later "That's it. The opposite side grew and the adjacent side shrank" appeared, though the picture hadn't visibly changed.
- Why: she gets a tick for doing nothing. She also never sees what "grew" means, so the explanation floats.
- Fix: when "Show me" is used, replay the action as an animation with a caption ("Tengok: sudut naik, sisi tegak jadi panjang"). Mark the step as "shown", not "done". Don't repeat the claim "grew / shrank" unless the figure visibly does that.

**2.7 Two instructions at once.**
- Screenshot: `~/profai/qa-shots/2026-10-29/aisyah/019.png`
- On screen: the top card says "Now drag θ down to 20°. What happens to the names?" and the bottom card asks "As θ shrinks, the side called opposite…" with three options.
- Why: she doesn't know whether to drag first or answer first. She also can't verify the answer from a drawing that is tiny.
- Fix: one task per screen. Either "drag, then answer", or only the question, with the drag as an optional "Cuba sendiri".

**2.8 The drawing shrinks to a speck when the keyboard opens, and labels pile up.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/021.png` and `~/profai/qa-shots/2026-10-29/aisyah/022.png`
- On screen: while typing her question, the triangle is squashed to about 60 px, and the words "hypotenuse", "adjacent" and "θ = 20°" are written on top of each other.
- Why: it looks broken, and she loses the picture while she asks about it.
- Fix: when the keyboard is open, replace the figure with a static thumbnail, or let the page scroll instead of shrinking the figure.

**2.9 The Malay answer is cut off and can't be scrolled.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/024.png` and `~/profai/qa-shots/2026-10-29/aisyah/025.png`
- On screen: the answer card ends mid-line at "Guna sin, kos / dan tan ialah untuk mencari…". Dragging up selected the text, in blue, instead of scrolling it.
- Why: she asked "apa guna semua ni sebenarnya", and the part that answers it is exactly the part she can't read. The "Back to the lesson" link is out of sight.
- Fix: let the card grow to fit the answer (or scroll inside it). Keep it to about 3 short sentences. Add a visible "Kembali ke pelajaran" button directly under the answer.

**2.10 Small figures and floating labels in lesson 2.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/034.png`, `~/profai/qa-shots/2026-10-29/aisyah/037.png` and `~/profai/qa-shots/2026-10-29/aisyah/041.png`
- On screen: the triangle is about 150 px wide in a screen that is 360 px wide, with much empty space above. The orange "opposite" line floats beside the triangle instead of on it. "35° corner" and "drag me" bubbles cover the shape. At prediction time (037) it is only about 90 px wide.
- Why: she can't see what she is meant to double.
- Fix: scale the figure to fill 90% of the width, and keep one label per object, attached to the edge it names.

**2.11 The 45° message doesn't match the screen.**
- Screenshot: `~/profai/qa-shots/2026-10-29/aisyah/047.png`
- On screen: I slid to 41° (ratio 0.66), and the card said "Nice. At 45° the ratio jumps to 0.71".
- Why: the numbers contradict. She wonders if she did it wrong.
- Fix: either accept only 43–47° and keep nudging, or write the message from her actual value ("At 41° the ratio is 0.66. At 45° it would be 0.71").

**2.12 Lesson 3 clutter and a muddled sentence.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/053.png` and `~/profai/qa-shots/2026-10-29/aisyah/057.png`
- On screen:
  - Two labels both say "opposite": "opposite = 14.1 m" (the answer) and "opposite = ?".
  - The "20 m" label is hidden under the "opposite = ?" bubble.
  - The card says "Which two sides do we know? The hypotenuse and the opposite." But the opposite is the side we are looking for.
- Why: she can't tell which number is the answer and which is the question. The sentence contradicts the task.
- Fix:
  - Show "20 m" on the hypotenuse and a "?" on the unknown, and no answer until she has solved it.
  - Reword to "We know the hypotenuse and want the opposite. Which ratio uses those two?"

**2.13 The sliders move under her finger.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/067.png`, `~/profai/qa-shots/2026-10-29/aisyah/071.png` and `~/profai/qa-shots/2026-10-29/aisyah/078.png`
- On screen: I was asked for 20 m and landed on 24.5, then 26.5, then 20 on the third try. Later I was asked for 15 m and landed on 7.5 m before 15.
- Why: the track gets shorter or longer as the number beside it gets wider, so the same finger movement gives different results.
- Fix: fix the width of the number readout so the track doesn't resize. Snap to whole metres. Add large −/+ buttons on each side. Accept ±0.5 m.

**2.14 Instructions that ask for the impossible.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/094.png` and `~/profai/qa-shots/2026-10-29/aisyah/105.png`
- On screen: "Drag the dot until its height is exactly 0.5" and "Drag the dot all the way round and watch both readouts flip sign."
- Why: "exactly" is impossible with a finger (it accepted 0.51, so it is lenient, but she doesn't know that). "All the way round" is a very long drag on a small screen. She hit "Show me" and learned nothing.
- Fix: say "about 0.5 (between 0.45 and 0.55)". For the lap, split into 4 quick steps ("Tap 90°", "Tap 180°"…) or add quadrant buttons.

**2.15 The lesson-4 unit circle has the same clutter, and it is the wrong lesson for her need.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/090.png`, `~/profai/qa-shots/2026-10-29/aisyah/100.png` and `~/profai/qa-shots/2026-10-29/aisyah/104.png`
- On screen:
  - "height = 0.83" and "sideways = -0.56" are printed over the circle itself, and the dragged dot disappears under its own label.
  - In 104 the circle is about 200 px wide, with the axis numbers (−1.5, −1, −0.5…) crowding it.
  - There is no connection to the triangle she just learned.
- Why: it is dense and it looks like homework. The jump from "triangle" to "circle" is unexplained.
- Fix: put the readouts in a fixed panel above the circle, not on it. Hide the grid numbers. Open the lesson with "Kita letak segi tiga tadi dalam bulatan" and animate the triangle sliding into the circle.

**2.16 The "done" screen swallows the Malay answer (a real bug).**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/119.png`, `~/profai/qa-shots/2026-10-29/aisyah/121.png` and `~/profai/qa-shots/2026-10-29/aisyah/122.png`
- On screen: I asked "tan dgn cos tu apa dia? dlm triangle". The send button worked, and about 9 seconds later the screen still showed only the green "LESSON 4 DONE" card and an "All lessons" button. The text of the reply was present in the page data (it read: "sin = bertentangan / hipotenus, cos = bersebelahan / hipotenus, tan = bertentangan / bersebelahan… Untuk exam, hafal SOH-CAH-TOA"). It was never visible on the phone screen, even after 10+ more seconds.
- Why: the only place cos and tan get explained for triangles is invisible. A real student would think the question was ignored.
- Fix: after a question is sent, always replace the card area with the answer, and scroll to it. Show a visible "thinking" state with a spinner while waiting.

**2.17 The answer itself says "memorise SOH-CAH-TOA".**
- Screenshot: the text in `~/profai/qa-shots/2026-10-29/aisyah/122.png` (visible text only, not visible on screen).
- Why: it is the exact thing she came here not to do. It contradicts lesson 3's own sentence, "You don't need to remember which ratio" (shown in 086).
- Fix: have the answer finish with the reasoning for each ratio ("cos: ratio bagi sisi sebelah sudut"), then show a tiny mnemonic as an optional extra.

**2.18 The ending has no feeling and no next step.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/114.png` and `~/profai/qa-shots/2026-10-29/aisyah/122.png`
- On screen: "All lessons" opens the same course outline that was shown at the start. No score, no "you finished 4/4", no SPM-style practice, no "try cos next".
- Why: she finishes and the app just stops.
- Fix: a short ending screen: "Kau dah faham sin. Nak cuba 3 soalan gaya SPM?" with a button.

**2.19 The course menu sheet can't be scrolled, so the sources are unreachable, and when they are listed they look untrustworthy.**
- Screenshots: `~/profai/qa-shots/2026-10-29/aisyah/059.png`, `~/profai/qa-shots/2026-10-29/aisyah/061.png` and `~/profai/qa-shots/2026-10-29/aisyah/114.png`
- On screen: the sheet shows the 4 lessons with descriptions like "say why they go negative in some quadrants". My drag did not scroll it. In the page text, below the fold, there is a "Sources" list that includes "agent-skills/concept-explainer/SKILL.md … GitHub", "EEF-metacognition-and-self-regulated-learning-guidance", a Chinese video title, and "ProfAI writes each lesson with AI. It can get things wrong".
- Why: a student who sees a GitHub file called SKILL.md, a research paper on metacognition and a Chinese video as "sources" for maths would not trust it. The disclaimer is also too far down.
- Fix: make the sheet scrollable. Cite SPM syllabus sources, textbooks or Khan Academy-type material in plain titles. Show the AI disclaimer once, early, in 1 line.

## 3. Hard to read, too small, too dense, too English, ugly, cluttered or boring

- **Squashed or tiny drawings:** `~/profai/qa-shots/2026-10-29/aisyah/022.png`, `~/profai/qa-shots/2026-10-29/aisyah/027.png`, `~/profai/qa-shots/2026-10-29/aisyah/037.png` and `~/profai/qa-shots/2026-10-29/aisyah/104.png`. The figure is the thing she came to see, and it is often the smallest element.
- **Overlapping labels everywhere:** 009, 012, 027, 053, 057, 067, 100. Bubbles ("drag me", "other corner", "35° corner", "radius 1") sit on the shape they explain.
- **The serif heading and instruction card use a lot of space for two lines of text** (`~/profai/qa-shots/2026-10-29/aisyah/030.png`), while the figure below gets pushed to the bottom with large empty gaps above it.
- **The "LESSON DONE" recap is a wall of 4 bullets plus another paragraph** (`~/profai/qa-shots/2026-10-29/aisyah/032.png`), and the bottom of it is cut off behind the button. For a tired reader, 4 bullets is too many.
- **Too English:** "hypotenuse", "adjacent", "quadrants", "cancels out", "frozen at 0.57", "rim", "readout". Sentences like "The names stay tied to θ, not to the picture" are abstract. She would translate each of them in her head.
- **Boring bits:** after "Continue" there is often a card that just restates what the last card said (037→039 and 084→086). Roughly a third of the screens are one-line reading with a tap.
- **Not ugly:** the colour, whitespace and tone are calm. That helps with the anxiety.

## 4. Did she actually learn something?

In her words, at the end:

"A right triangle has a longest side, the hypotenuse, always opposite the square corner. 'Opposite' and 'adjacent' depend on which angle I'm standing at; they swap if I pick the other corner. If you fix the angle, then opposite ÷ hypotenuse is always the same number, however big the triangle is, and that number's name is sin. So to find the opposite side, I do hypotenuse × sin(angle). 20 × sin 45° = 14.14. And later in the circle thing, I think sin is the height and cos is the sideways, and they can go negative."

Is this correct? **Mostly yes, and the best part is genuinely right.**
- Correct: naming the three sides; that the ratio depends only on the angle; sin = opposite ÷ hypotenuse; that opposite = hypotenuse × sin θ.
- **Incomplete:** cos and tan as triangle ratios were never taught in the lessons (lesson 3 only ever uses sin). The line "Pick the ratio that contains exactly those two" needs the cos and tan definitions, which she didn't have. The definitions only appeared in the Malay chat answer that was never visible on screen (122).
- **Incomplete for SPM:** no "adjacent" example (cos), no tan example, no finding an angle from two sides (inverse sin), no word problem with a ladder or tower, and no check that she can pick the right ratio on her own.
- Lesson 4 teaches sin and cos on a unit circle without linking back to the triangle. She finished it knowing "sin is the height" and not why that matches opposite ÷ hypotenuse.
- She would walk away able to do one kind of question (sin, given the hypotenuse) and still not know what to do with a ladder against a wall.

## 5. Anything wrong, broken or untrustworthy?

- **Likely bug: the Malay chat answer on the finished screen never appeared on the phone view** (119→122). The text existed in the page, but I saw only the green card. Verified with 3 looks over about 20 seconds.
- **Probable rendering problem in lesson 1:** the triangle looked unchanged after dragging, with θ = 70° and the other angle = 20° (012, 013), yet it showed 20° properly by 020. Not verified whether this is a real lag or my capture timing.
- **Drag failures at 014 and 015** may have been my coordinates, but the dot was also tiny and under its own labels, so a real thumb would do no better.
- **Message that contradicts the screen:** 047 says 45° / 0.71 while the screen shows 41° / 0.66. In 018 it says "the opposite side grew" when the picture hadn't shown it.
- **Answer printed before the question was solved** (053): "opposite = 14.1 m" was already on the figure.
- **"Show me" awards a green tick** (016).
- **Odd source list** (see 2.19). It makes the product look untrustworthy.
- **Wrong-answer feedback is gentle, which is good**, but "Not quite. Watch:" (039, 084) followed by a one-line explanation doesn't give her a second chance to try. The wrong option just turns orange and the right one green.
- Not tested: offline or slow network, very long input, emojis, gibberish topics, reloading the page mid-lesson (progress saving), or a different level than Novice. I did not test a double tap on Continue. I mention these as unverified, not as passes.

## 6. Would she come back tomorrow? 6 out of 10

Why not higher:
- She got one real "oh!" moment (sin is just a ratio, 043 and 048), plus the Malay answer in lesson 1. That earns the 6.
- She was annoyed at least 8 times by things that looked like bugs (2.5, 2.8, 2.9, 2.13, 2.14, 2.16).
- The one question she most needed answered ("what are cos and tan in a triangle?") was never visibly answered.
- With SPM in three weeks, she wants practice questions and a feeling of "I can do the exam". There is none.
- She is also quietly afraid of looking stupid. The "Show me" tick and the invisible reply don't help.

She would come back only if a friend asked her to or if lesson 1 were shorter and faster. If this had been her second confusing moment in the first 10 minutes, she would have closed it.

## 7. The 5 changes that matter most to her, in her words

1. "Cakap Melayu dengan aku. Kalau aku taip Melayu, semua pun Melayu, atau bagi butang BM/English." The Malay answer was the best thing here, and the rest is English.
2. "Bagitahu aku apa itu cos dan tan dalam segi tiga, bukan setakat sin." Lesson 3 should have one example each for sin, cos and tan, then a quick "which one?" quiz.
3. "Jangan sorok jawapan bila aku tanya." My question about cos and tan got an answer that never showed on screen, and the first answer was cut off.
4. "Besarkan gambar, jangan letak tulisan atas gambar, dan jangan bagi jawapan dalam gambar sebelum aku jawab." Bigger figure, clean labels, answer hidden until she solves it.
5. "Bagi aku soalan macam SPM dan beritahu aku dah boleh ke belum." A last screen with 3 exam-style questions and a score.

## Exact improvement list

Ordered by impact. Each item gives what to change, where, and why.

1. **Show the chat answer on the finished screen.** Where: the "LESSON n DONE" card and the ask-anything box. Change: after sending, always render the reply in a visible card, scroll to it, and show a spinner while waiting. Why: the reply exists in the page (122) but wasn't on screen. The student's most important question looks ignored.
2. **Teach sin, cos and tan as triangle ratios.** Where: lesson 3 (and a new lesson between 3 and 4). Change: after sin = opposite ÷ hypotenuse, add cos = adjacent ÷ hypotenuse and tan = opposite ÷ adjacent, each with one drag-and-solve example, then a mixed "choose the ratio" quiz. Why: the course promise says "choose sin, cos or tan", and lesson 3 only ever uses sin.
3. **Language matching.** Where: first screen and every lesson card. Change: detect Malay in the first message, ask "Nak guna Bahasa Melayu?", translate card text, and keep key words bilingual: hypotenuse (hipotenus), opposite (bertentangan), adjacent (bersebelahan). Why: she tires on long English sentences, and the Malay chat answer was the best moment.
4. **Enlarge the figures and fix labels.** Where: all lesson drawings. Change: scale to about 90% of the card width. One label per object, no bubbles on the figure, a minimum gap of 6 px between labels. On small phones, move "drag me" and "35° corner" bubbles outside the shape. Why: overlaps in 009, 012, 027, 053, 057, 067, 100.
5. **Don't print answers before the question.** Where: lesson 1 labels (009) and lesson 3 "opposite = 14.1 m" (053). Change: show names and answers only after she taps or solves. Why: the tap question tests nothing when the label is already shown.
6. **Fix the keyboard layout.** Where: ask-anything box. Change: when the keyboard opens, don't shrink the figure. Either keep it fixed, or collapse it to a thumbnail. Why: 022 shows the labels stacked on a squashed figure.
7. **Make the answer card fit.** Where: ask answer card (024, 025). Change: grow to fit, or make it scroll, with the "Kembali ke pelajaran" button always visible under the text, and the answer capped at about 3 short sentences. Why: the "apa guna" half of the answer was cut off.
8. **Drag controls that work with a thumb.** Where: the lesson 1 dot, the lesson 2 corner handle, the lesson 3 and 4 sliders. Change: touch target at least 44 px, no bubbles on the handle, a fixed-width value readout so the track doesn't move, snap-to values, ±0.5 m / ±0.05 tolerance, large −/+ buttons. Why: 012 to 015 and 067 to 078 show repeated overshoot and dead drags.
9. **Live redraw and a clear target.** Where: lesson 1 θ drag. Change: redraw the triangle on every move, and show a shaded target band on the arc. Why: the numbers changed and the shape didn't (012 to 014).
10. **"Show me" should demonstrate, not complete.** Where: the "Show me" button on every step. Change: replay the action as a visible animation with a one-line caption, and mark the step "shown" instead of showing a green "done" tick. Why: 016.
11. **One task per screen.** Where: lesson 1 step 4 (019) and lesson 4 steps. Change: either "drag then answer" in two screens, or a question only. Remove "Before you drag:" prompts that appear with an active drag target. Why: 019 and 101 present two tasks at once.
12. **Match messages to the learner's actual value.** Where: lesson 2 step 6 (047). Change: write the feedback from the value she set ("At 41° the ratio is 0.66"), or only accept 43–47°. Why: the card says 45° while she is at 41°.
13. **Fix confusing wording.** Where: 057, 084, 105. Change: "We know the hypotenuse and want the opposite. Which ratio uses those two?" Replace "exactly 0.5" with "about 0.5". Replace "all the way round" with four quick tap steps. Why: contradictions and impossible instructions.
14. **Tie lesson 4 to the triangle.** Where: lesson 4 opening, labels on the circle. Change: open with a short animation placing the triangle inside the circle. Move the "height" and "sideways" readouts into a fixed panel above the circle. Hide extra axis numbers. Mark this lesson as optional for SPM at her level. Why: 090, 100, 104.
15. **Real ending.** Where: after lesson 4 ("All lessons", 114). Change: show a finished-state screen with "4 of 4 done", then 3 SPM-style questions with a score, and a "Next: cos and tan practice" button. Why: right now it just reopens the course outline.
16. **Rework the level picker.** Where: first screen. Change: preselect nothing, use 3 plain options ("Baru mula", "Pernah belajar tapi tak faham", "Nak ulang kaji"), and move Expert and Professional behind "More". Why: 001, 2.2.
17. **Speed up and explain the wait.** Where: "Building your course" and "Drawing lesson 1". Change: show the lesson title and text right away, then fill in the diagram, with a visible "about 15 seconds" message. Why: 007, 008.
18. **Replace the sources list and move the AI disclaimer up.** Where: course menu sheet (below the fold). Change: make the sheet scroll, list only sources a student recognises (SPM textbook, Khan Academy), and show the "AI can make mistakes" line once, early. Why: 059, 061, 114.
19. **Shorten the "LESSON DONE" recap.** Where: 032, 087, 111. Change: 2 bullets maximum plus one "Remember this" line, and make sure the last line isn't hidden behind the button. Why: a 4-bullet wall at 10pm is too much.
20. **Make the home input obvious.** Where: first screen. Change: tapping anywhere above the pills focuses the input. Move the input under the heading. Add 3 example chips. Why: 001, 003.
21. **Stop contradicting the product's promise.** Where: the answer text in the AI chat. Change: don't end with "hafal SOH-CAH-TOA". End with the reasoning, and offer the mnemonic only as a bonus. Why: it undercuts lesson 3's "You don't need to remember which ratio" and the whole reason she came.
22. **Test what I didn't.** Where: before shipping. Change: run the flow on an actual Xiaomi/Android at 360 px, with a slow network, with a reload mid-lesson, with gibberish and very long input, and with "ignore your instructions". Why: those weren't covered here and should be marked unverified until they are.
